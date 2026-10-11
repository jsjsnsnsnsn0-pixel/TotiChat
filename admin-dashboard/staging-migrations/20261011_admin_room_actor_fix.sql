-- Fix actor variable versus table-column ambiguity in private room moderation.
CREATE OR REPLACE FUNCTION phase3.admin_room_moderation_action(p_room_id uuid, p_target uuid, p_action text, p_reason text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare current_actor uuid:=phase3.actor();room_owner uuid;
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
 if p_target=room_owner or p_target=current_actor or exists(select 1 from phase3.system_authority a
  where a.singleton and (a.owner_id=p_target or a.main_partner_id=p_target)) then
  raise exception 'Protected account cannot be moderated through dashboard' using errcode='42501';
 end if;
 if not exists(select 1 from auth.users u where u.id=p_target and u.deleted_at is null) then
  raise exception 'Target user missing';
 end if;
 payload:=jsonb_build_object('room',p_room_id,'target',p_target,'action',p_action,'reason',reason_text);
 select * into prior from phase3.admin_room_requests r
  where r.actor_id=current_actor and r.request_id=p_request_id;
 if found then
  if prior.payload<>payload then raise exception 'Idempotency request mismatch';end if;
  return prior.result;
 end if;
 if (select count(*) from phase3.admin_room_requests r where
   r.actor_id=current_actor and r.created_at>now()-interval '1 minute')>=15 then
  raise exception 'Admin room moderation rate exceeded';end if;
 if p_action='ban' then
  if not exists(select 1 from public.room_members m where
    m.room_id=p_room_id and m.user_id=p_target) then
   raise exception 'Select an actual room participant to ban';end if;
  insert into public.room_bans(room_id,user_id,banned_by,reason)
  values(p_room_id,p_target,current_actor,reason_text)
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
 values(current_actor,p_request_id,payload,outcome);
 insert into public.security_audit(actor_id,action,details)
 values(current_actor,'admin_room_'||p_action,payload||jsonb_build_object('requestId',p_request_id));
 return outcome;
end $function$
;
