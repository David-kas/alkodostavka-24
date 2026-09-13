import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE = new Set(['.git', 'node_modules']);
const EXT = /\.(html|xml|txt|json|js|mjs|webmanifest)$/i;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXT.test(name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.endsWith(`${path.sep}scripts${path.sep}fix-contact-links.mjs`)) continue;
  if (file.endsWith(`${path.sep}middleware.js`)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(/https?:\/\/t\.me\/alkodostavka\b/gi, 'https://t.me/alkotaxi_bot')
    .replace(/info@alkodastavka\.vercel\.app/gi, 'info@alkodostavka24.vercel.app');
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
  }
}
console.log(`fix-contact-links: updated ${changed} files`);
