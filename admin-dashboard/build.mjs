import { mkdirSync, copyFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dist = join(process.cwd(), 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const file of ['index.html','app.js','management.js','styles.css','management.css']) {
  if(!existsSync(file)) throw new Error('Missing dashboard source: '+file);
  copyFileSync(file, join(dist, file));
}
cpSync('assets', join(dist, 'assets'), { recursive: true });
console.log('TotiChat Admin static assets prepared for Vercel (no Android/app build).');
