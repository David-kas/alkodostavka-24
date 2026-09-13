/**
 * Добавляет geo/og:locale meta во все HTML (для Яндекса).
 * Запуск: node scripts/enhance-yandex-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const GEO_BLOCK = `<meta name="geo.region" content="RU-MOW">
    <meta name="geo.placename" content="Москва">
    <meta name="geo.position" content="55.755826;37.617300">
    <meta name="ICBM" content="55.755826, 37.617300">`;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

let changed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('geo.region')) continue;
  const descIdx = html.indexOf('<meta name="description"');
  if (descIdx === -1) continue;
  const descEnd = html.indexOf('>', descIdx);
  if (descEnd === -1) continue;
  html = html.slice(0, descEnd + 1) + '\n    ' + GEO_BLOCK + html.slice(descEnd + 1);
  if (!html.includes('og:locale')) {
    html = html.replace(
      '<meta property="og:type" content="website">',
      '<meta property="og:type" content="website">\n    <meta property="og:locale" content="ru_RU">',
    );
  }
  fs.writeFileSync(fp, html, 'utf8');
  changed++;
}

console.log(`enhance-yandex-seo: updated ${changed} html files`);
