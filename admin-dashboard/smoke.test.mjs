import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';

const root=dirname(fileURLToPath(import.meta.url));
const read=file=>readFileSync(join(root,file),'utf8');
const html=read('index.html');
const js=read('app.js');
const mgmt=read('management.js');
const config=JSON.parse(read('vercel.json'));

test('isolated original falcon and dashboard files are available in build output',()=>{
 for(const file of ['index.html','app.js','management.js','styles.css','management.css',
   'assets/toti-falcon-logo.jpg','assets/toti-icon.jpg']){
  assert(existsSync(join(root,'dist',file)),'missing built '+file);
  assert(statSync(join(root,'dist',file)).size>0,'empty '+file);
 }
 assert.match(html,/TotiChat/);
 assert.match(html,/\.\/assets\/toti-falcon-logo\.jpg/);
 assert.match(html,/<script src="\.\/management\.js" defer><\/script>/);
});

test('only staging project and browser-safe publishable key are exposed',()=>{
 assert.match(js,/rziaedugbdwefbefcxjt/);
 assert.match(js,/sb_publishable_/);
 assert.doesNotMatch(js+mgmt,/sb_secret_|service_role|SUPABASE_SERVICE_ROLE/);
 assert.match(js,/phase3_admin_session/);
 assert.match(js,/phase6_admin_banner_action/);
 assert.match(mgmt,/phase5_support_action/);
});

test('dashboard Javascript and self-contained static builder parse in Node',()=>{
 for(const file of ['app.js','management.js','build.mjs']){
  execFileSync(process.execPath,['--check',join(root,file)],{stdio:'pipe'});
 }
});

test('Vercel deploy protects private administration and no production source is modified',()=>{
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 const map=Object.fromEntries(config.headers[0].headers.map(x=>[x.key,x.value]));
 assert.match(map['Content-Security-Policy'],/script-src 'self'/);
 assert.equal(map['X-Frame-Options'],'DENY');
 assert.match(map['X-Robots-Tag'],/noindex/);
 assert(!html.includes('src="../src/'));
});
