-- STAGING ONLY: room-level moderation from the separate Owner Admin Dashboard.
-- Not a global user ban. No production or main migration.
create table phase3.admin_room_requests(
  actor_id uuid not null references auth.users(id),
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
alter table phase3.admin_room_requests enable row level security;
revoke all on phase3.admin_room_requests from public,anon,authenticated;

create function phase3.admin_room_authorized()
returns boolean language plpgsql security definer set search_path='' as $f$
declare actor_id uuid:=phase3.actor();
begin
 return phase3.is_owner() or exists(select 1 from phase3.system_authority a
   where a.singleton and a.main_partner_id=actor_id);
end $f$;
revoke all on function phase3.admin_room_authorized() from public,anon;
grant execute on function phase3.admin_room_authorized() to authenticated;

create function phase3.admin_room_moderation_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare room_owner uuid; bans jsonb; members jsonb;
begin
 if not phase3.admin_room_authorized() then raise exception 'Owner or designated partner required' using errcode='42501';end if;
 if p_room_id is null then raise exception 'Room required';end if;
 select r.owner_id into room_owner from public.rooms r where r.id=p_room_id;
 if not found then raise exception 'Room unavailable';end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into bans from(
  select b.user_id,b.banned_by,b.reason,b.created_at from public.room_bans b
  where b.room_id=p_room_id order by b.created_at desc,b.user_id limit 200) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into members from(
  select m.user_id,m.seat_no,m.is_muted from public.room_members m
  where m.room_id=p_room_id order by m.joined_at,m.user_id limit 200) t;
 return jsonb_build_object('roomId',p_room_id,'roomOwnerId',room_owner,
  'banned',bans,'members',members,'readOnly',true);
end $f$;
revoke all on function phase3.admin_room_moderation_state(uuid) from public,anon;
grant execute on function phase3.admin_room_moderation_state(uuid) to authenticated;

create function phase3.admin_room_moderation_action(
 p_room_id uuid,p_target uuid,p_action text,p_reason text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare actor_id uuid:=phase3.actor();room_owner uuid;
 reason_text text:=btrim(coalesce(p_reason,''));payload jsonb;
 prior phase3.admin_room_requests%rowtype;outcome jsonb;
begin
 if not phase3.admin_room_authorized() then
   raise exception 'Only Owner or designated main partner can moderate from Admin' using errcode='42501';
 end if;
 if p_room_id is null or p_target is null or p_request_id is null
    or p_action is null or p_action not in('ban','unban')
    or char_length(reason_text) not between 10 and 300 then
   raise exception 'Valid room, account, action and documented reason required';
 end if;
 -- Serialize with joins and existing room-owner moderation.
 select r.owner_id into room_owner from public.rooms r where r.id=p_room_id for update;
 if not found then raise exception 'Room unavailable';end if;
 if p_target=room_owner or p_target=actor_id or exists(select 1 from phase3.system_authority a
  where a.singleton and (a.owner_id=p_target or a.main_partner_id=p_target)) then
  raise exception 'Protected account cannot be moderated through dashboard' using errcode='42501';
 end if;
 if not exists(select 1 from auth.users u where u.id=p_target and u.deleted_at is null) then
  raise exception 'Target user missing';
 end if;
 payload:=jsonb_build_object('room',p_room_id,'target',p_target,'action',p_action,'reason',reason_text);
 select * into prior from phase3.admin_room_requests r
  where r.actor_id=actor_id and r.request_id=p_request_id;
 if found then
  if prior.payload<>payload then raise exception 'Idempotency request mismatch';end if;
  return prior.result;
 end if;
 if (select count(*) from phase3.admin_room_requests r where
   r.actor_id=actor_id and r.created_at>now()-interval '1 minute')>=15 then
  raise exception 'Admin room moderation rate exceeded';end if;
 if p_action='ban' then
  if not exists(select 1 from public.room_members m where
    m.room_id=p_room_id and m.user_id=p_target) then
   raise exception 'Select an actual room participant to ban';end if;
  insert into public.room_bans(room_id,user_id,banned_by,reason)
  values(p_room_id,p_target,actor_id,reason_text)
  on conflict(room_id,user_id) do update set
   banned_by=excluded.banned_by,reason=excluded.reason,created_at=now();
  delete from public.room_members m where m.room_id=p_room_id and m.user_id=p_target;
 else
  delete from public.room_bans b where b.room_id=p_room_id and b.user_id=p_target;
  if not found then raise exception 'Ban record does not exist';end if;
 end if;
 outcome:=jsonb_build_object('roomId',p_room_id,'targetId',p_target,'action',p_action,
  'success',true,'scope','room_only','requestId',p_request_id);
 insert into phase3.admin_room_requests(actor_id,request_id,payload,result)
 values(actor_id,p_request_id,payload,outcome);
 insert into public.security_audit(actor_id,action,details)
 values(actor_id,'admin_room_'||p_action,payload||jsonb_build_object('requestId',p_request_id));
 return outcome;
end $f$;
revoke all on function phase3.admin_room_moderation_action(uuid,uuid,text,text,uuid)
 from public,anon;
grant execute on function phase3.admin_room_moderation_action(uuid,uuid,text,text,uuid) to authenticated;

create function public.phase6_admin_room_state(p_room_id uuid)
returns jsonb language sql security invoker set search_path='' as $f$
 select phase3.admin_room_moderation_state(p_room_id) $f$;
create function public.phase6_admin_room_action(
 p_room_id uuid,p_target uuid,p_action text,p_reason text,p_request_id uuid)
returns jsonb language sql security invoker set search_path='' as $f$
 select phase3.admin_room_moderation_action(p_room_id,p_target,p_action,p_reason,p_request_id) $f$;
revoke all on function public.phase6_admin_room_state(uuid),
 public.phase6_admin_room_action(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.phase6_admin_room_state(uuid),
 public.phase6_admin_room_action(uuid,uuid,text,text,uuid) to authenticated;
