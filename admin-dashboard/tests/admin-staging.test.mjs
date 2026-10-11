import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd();
const get=file=>readFileSync(join(root,file),'utf8');
const app=get('app.js');
const mgmt=get('management.js');
const html=get('index.html');
const css=get('styles.css');
const config=JSON.parse(get('vercel.json'));

test('static dashboard can be served from build output, exact approved logo assets present',()=>{
 for(const f of ['index.html','app.js','management.js','styles.css','management.css','assets/toti-falcon-logo.jpg','assets/toti-icon.jpg']){
  const built=join(root,'dist',f);
  assert(existsSync(built),'Missing Vercel output '+f);
  assert(statSync(built).size>0);
 }
 assert.match(html,/dir="rtl"/);
 assert.match(html,/<script src="\.\/management\.js" defer><\/script>/);
 assert.match(html,/<script src="\.\/app\.js" defer><\/script>/);
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
});
test('only staging publishable key and real protected RPC names appear',()=>{
 assert.match(app,/rziaedugbdwefbefcxjt\.supabase\.co/);
 assert.match(app,/sb_publishable_/);
 assert.doesNotMatch(app+mgmt,/sb_secret_|service_role|MOCK_DATA|fakeBalance/);
 for(const rpc of ['phase3_admin_session','phase6_admin_banner_action','phase6_admin_directory',
 'phase5_finance_integrity_preflight','phase3_catalog_write','phase3_catalog_list']){
  assert((app+mgmt).includes(rpc),'Missing real RPC '+rpc);
 }
});
test('actual medal API returns items and empty rejection does not demand a rate',()=>{
 assert.match(mgmt,/Array\.isArray\(r\?\.items\)\?r\.items/);
 assert.match(mgmt,/rawRate/);
 assert.match(mgmt,/decision==='approve_registration'&&\(!rawRate/);
 assert.match(mgmt,/name="commission" type="number"/);
 assert.doesNotMatch(mgmt,/value="0".*commission_percent/);
});
test('real catalog has six limited source-backed tabs with no arbitrary price editor',()=>{
 const types=['gift_catalog','gift_categories','store_catalog','cp_types','recharge_packages','recharge_reward_tiers'];
 for(const t of types)assert(app.includes("'"+t+"'"),t);
 assert.match(app,/toggleableCatalogs=new Set\(\['gift_catalog','gift_categories','store_catalog','cp_types'\]\)/);
 assert.match(app,/catalogTable='gift_catalog'/);
 assert.match(app,/phase3_catalog_write/);
 assert.match(app,/p_action:'update'/);
 assert.match(app,/p_record:\{\[field\]:next\}/);
 assert.doesNotMatch(app,/catalog-delete|data-action="catalog-delete"/);
 assert.match(css,/\.catalog-tab\.selected/);
});
test('Vercel security headers and staging-only browser network policy exist',()=>{
 const headers=config.headers?.[0]?.headers??[];
 const getKey=name=>headers.find(x=>x.key===name)?.value;
 assert.match(getKey('Content-Security-Policy'),/frame-ancestors 'none'/);
 assert.match(getKey('Content-Security-Policy'),/connect-src 'self' https:\/\/rziaedugbdwefbefcxjt\.supabase\.co/);
 assert.equal(getKey('X-Frame-Options'),'DENY');
 assert.match(getKey('X-Robots-Tag'),/noindex/);
});

test('moderation is room-only, server-authorized and requires explicit documented approval',()=>{
 const migration=get('staging-migrations/20261011_admin_room_safety.sql');
 const actorFix=get('staging-migrations/20261011_admin_room_actor_fix.sql');
 assert.match(migration,/phase3\.admin_room_authorized\(\)/);
 assert.match(migration,/a\.main_partner_id=actor_id/);
 assert.match(migration,/p_action not in\('ban','unban'\)/);
 assert.match(migration,/char_length\(reason_text\) not between 10 and 300/);
 assert.match(migration,/p_target=room_owner or p_target=actor_id/);
 assert.match(migration,/a\.owner_id=p_target or a\.main_partner_id=p_target/);
 assert.match(migration,/scope','room_only'/);
 assert.match(migration,/revoke all on function public\.phase6_admin_room_state\(uuid\),\s*public\.phase6_admin_room_action/);
 assert.match(actorFix,/current_actor/);
 assert.doesNotMatch(actorFix,/r\.actor_id=actor_id/);
 assert.match(app,/phase6_admin_room_state/);
 assert.match(app,/phase6_admin_room_action/);
 assert.match(app,/result\.scope!=='room_only'/);
 assert.match(app,/confirm\('هل تؤكد '/);
 assert.doesNotMatch(app,/phase6_admin_global_ban|deleteUser/);
});
