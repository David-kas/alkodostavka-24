/**
 * SEO / домен / телефоны: звонки +79251219972, WhatsApp 79626289777 (без текста WA на странице).
 * Запуск: node scripts/fix-site-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://alkodastavka.vercel.app';
const CALL_TEL = '+79251219972';
const CALL_DISPLAY = '+7 (925) 121-99-72';
const WA_PHONE = '79626289777';

const OLD_DOMAINS = [
  /https?:\/\/alkodostavka24\.online/gi,
  /https?:\/\/www\.alkodostavka24\.online/gi,
  /https?:\/\/dostavka-alkogolya-24\.vercel\.app/gi,
  /alkodostavka24\.online/gi,
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.(html|xml|txt|json|js|mjs|webmanifest)$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

function fixDomains(c) {
  let out = c;
  for (const re of OLD_DOMAINS) {
    out = out.replace(re, BASE);
  }
  return out;
}

function fixPhones(c) {
  let out = c;

  out = out.replace(/tel:\+79626289777/g, `tel:${CALL_TEL}`);
  out = out.replace(/tel:\+79997863967/g, `tel:${CALL_TEL}`);
  out = out.replace(/\+7 \(999\) 786-39-67/g, CALL_DISPLAY);
  out = out.replace(/\+79997863967/g, CALL_TEL.replace('+', '+'));

  out = out.replace(/wa\.me\/79997863967/g, `wa.me/${WA_PHONE}`);
  out = out.replace(/wa\.me\/79648489888/g, `wa.me/${WA_PHONE}`);
  out = out.replace(/whatsapp:\/\/send\?phone=79997863967/g, `whatsapp://send?phone=${WA_PHONE}`);
  out = out.replace(/whatsapp:\/\/send\?phone=79626289777/g, `whatsapp://send?phone=${WA_PHONE}`);

  out = out.replace(/"telephone": "\+79626289777"/g, `"telephone": "${CALL_TEL}"`);
  out = out.replace(/"telephone": "\+79997863967"/g, `"telephone": "${CALL_TEL}"`);

  out = out.replace(
    /<div class="header-phone-promo">\s*<span class="badge-247">24\/7<\/span>\s*<span class="phone-sub">/g,
    `<div class="header-phone-promo">\n      <span class="badge-247">24/7</span>\n      <a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>\n      <span class="phone-sub">`,
  );
  out = out.replace(
    /<div class="header-phone-promo">\s*<span class="badge-247">24\/7<\/span>\s*<a href="tel:[^"]+">[^<]*<\/a>\s*<span class="phone-sub">/g,
    `<div class="header-phone-promo">\n      <span class="badge-247">24/7</span>\n      <a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>\n      <span class="phone-sub">`,
  );

  out = out.replace(
    /<div class="mobile-callbar-right">\s*<a href="tel:\+79997863967" class="mobile-callbar-cta">Позвонить<\/a>\s*<\/div>/g,
    `<div class="mobile-callbar-right">\n      <a href="tel:${CALL_TEL}" class="mobile-callbar-tel"><span class="mobile-callbar-icon" aria-hidden="true">☎</span><span class="mobile-callbar-num">${CALL_DISPLAY}</span></a>\n    </div>`,
  );

  out = out.replace(
    /<div class="sticky-cta-bar" role="navigation" aria-label="Быстрый заказ">\s*<a href="#feedback-form"/g,
    `<div class="sticky-cta-bar" role="navigation" aria-label="Быстрый заказ">\n        <a href="tel:${CALL_TEL}" class="sticky-cta-item sticky-cta-call">Позвонить</a>\n        <a href="#feedback-form"`,
  );

  if (out.includes('class="footer"') && !out.includes('footer-phone')) {
    out = out.replace(
      /(<footer class="footer">\s*<div class="container">\s*<p>©[^<]*<\/p>)/,
      `$1\n    <p class="footer-phone">Телефон: <a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a></p>`,
    );
  }

  out = out.replace(/<a href="tel:\+79997863967">\+79626289777<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79997863967">79626289777<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79997863967">\+79997863967<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79997863967">Позвонить<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);
  out = out.replace(/<a href="tel:\+79997863967">позвонить<\/a>/g, `<a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a>`);

  out = out.replace(/ ☎ \+79626289777/g, '');
  out = out.replace(/ \+79626289777\. 18/g, '. 18');
  out = out.replace(/\. \+79626289777\./g, '.');
  out = out.replace(/ \+79626289777/g, ` ${CALL_DISPLAY}`);
  out = out.replace(/\+79626289777/g, (match, offset, str) => {
    const before = str.slice(Math.max(0, offset - 20), offset);
    if (/wa\.me\/$/.test(before) || /phone=/.test(before)) return match;
    return CALL_DISPLAY;
  });

  out = out.replace(/ — \| /g, ' | ');
  out = out.replace(/\. \./g, '.');
  out = out.replace(/24\/7,\./g, '24/7.');

  return out;
}

function fixContent(raw) {
  let c = fixDomains(raw);
  c = fixPhones(c);
  c = c.replace(/(\r?\n\s*){3,}$/, '\n');
  return c;
}

function fixRobots() {
  fs.writeFileSync(
    path.join(ROOT, 'robots.txt'),
    `User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
Host: ${BASE}
`,
    'utf8',
  );
}

const files = walk(ROOT);
let changed = 0;
for (const fp of files) {
  if (fp.includes(`${path.sep}scripts${path.sep}fix-site-seo.mjs`)) continue;
  const raw = fs.readFileSync(fp, 'utf8');
  const next = fixContent(raw);
  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    changed++;
  }
}
fixRobots();
console.log(`fix-site-seo: updated ${changed} files`);
