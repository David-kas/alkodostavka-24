/**
 * Normalize the whole static site to the new primary domain and current contact data.
 * Run: node scripts/fix-site-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://alko-dostavka24.vercel.app';
const CALL_TEL = '+79251219972';
const CALL_DISPLAY = '+7 (925) 121-99-72';
const WA_PHONE = '79626289777';

const OLD_DOMAINS = [
  /https?:\/\/alkodastavka\.vercel\.app/gi,
  /https?:\/\/alkodostavka24\.vercel\.app/gi,
  /https?:\/\/alkodostavka24\.online/gi,
  /https?:\/\/www\.alkodostavka24\.online/gi,
  /https?:\/\/dostavka-alkogolya-24\.vercel\.app/gi,
  /alkodastavka\.vercel\.app/gi,
  /alkodostavka24\.vercel\.app/gi,
  /alkodostavka24\.online/gi,
  /www\.alkodostavka24\.online/gi,
  /dostavka-alkogolya-24\.vercel\.app/gi,
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === '.vercel') continue;
      walk(fp, acc);
    } else if (/\.(html|xml|txt|json|js|mjs|webmanifest|css)$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function fixDomains(c) {
  let out = c;
  for (const re of OLD_DOMAINS) out = out.replace(re, BASE);
  return out;
}

function fixPhones(c) {
  let out = c;
  out = out.replace(/tel:\+7 (925) 121-99-72/g, `tel:${CALL_TEL}`);
  out = out.replace(/tel:\+79251219972/g, `tel:${CALL_TEL}`);
  out = out.replace(/\+7 \(999\) 786-39-67/g, CALL_DISPLAY);
  out = out.replace(/\+79251219972/g, CALL_TEL);
  out = out.replace(/wa\.me\/79997863967/g, `wa.me/${WA_PHONE}`);
  out = out.replace(/wa\.me\/79648489888/g, `wa.me/${WA_PHONE}`);
  out = out.replace(/whatsapp:\/\/send\?phone=79997863967/g, `whatsapp://send?phone=${WA_PHONE}`);
  out = out.replace(/whatsapp:\/\/send\?phone=79648489888/g, `whatsapp://send?phone=${WA_PHONE}`);
  out = out.replace(/"telephone":\s*"\+7 (925) 121-99-72"/g, `"telephone": "${CALL_TEL}"`);
  out = out.replace(/"telephone":\s*"\+79251219972"/g, `"telephone": "${CALL_TEL}"`);

  out = out.replace(/<a href="tel:\+79251219972">\+7 (925) 121-99-72<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79251219972">79626289777<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79251219972">\+79251219972<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79251219972">Позвонить<\/a>/gi, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);

  out = out.replace(/ \+7 (925) 121-99-72\. 18/g, '. 18');
  out = out.replace(/\. \+7 (925) 121-99-72\./g, '.');
  out = out.replace(/ \+7 (925) 121-99-72/g, ` ${CALL_DISPLAY}`);
  out = out.replace(/\+7 (925) 121-99-72/g, (match, offset, str) => {
    const before = str.slice(Math.max(0, offset - 20), offset);
    if (/wa\.me\/$/.test(before) || /phone=/.test(before)) return match;
    return CALL_DISPLAY;
  });

  return out;
}

function fixContent(raw) {
  let c = fixDomains(raw);
  c = fixPhones(c);
  return c.replace(/(\r?\n\s*){3,}$/, '\n');
}

function fixRobots() {
  fs.writeFileSync(
    path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\nHost: ${BASE}\n`,
    'utf8',
  );
}

const files = walk(ROOT);
let changed = 0;
for (const fp of files) {
  const raw = fs.readFileSync(fp, 'utf8');
  const next = fixContent(raw);
  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    changed++;
  }
}
fixRobots();
console.log(`fix-site-seo: updated ${changed} files`);
