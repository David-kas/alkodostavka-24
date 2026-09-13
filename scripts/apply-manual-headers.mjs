/**
 * Подставляет единый header + FAB + мессенджеры в ручные HTML.
 * Запуск: node scripts/apply-manual-headers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function extractBaseHeader() {
  const s = fs.readFileSync(path.join(ROOT, 'metro', 'index.html'), 'utf8');
  const i = s.indexOf('<div class="scroll-progress"');
  const j = s.indexOf('<main');
  let h = s.slice(i, j).trimEnd();
  h = h.replace(/^  /gm, '    ');
  h = h.replace(
    '<li><a href="/metro/" class="nav-link active">Метро</a></li>',
    '<li><a href="/metro/" class="nav-link">Метро</a></li>',
  );
  return h + '\n';
}

function withActive(base, key) {
  let h = base;
  if (!key) return h;
  const pairs = {
    home: [
      '<li><a href="/" class="nav-link">Главная</a></li>',
      '<li><a href="/" class="nav-link active">Главная</a></li>',
    ],
    cat: [
      '<li><a href="/catalog.html" class="nav-link">Ассортимент</a></li>',
      '<li><a href="/catalog.html" class="nav-link active">Ассортимент</a></li>',
    ],
    rayony: [
      '<li><a href="/rayony.html" class="nav-link">Районы</a></li>',
      '<li><a href="/rayony.html" class="nav-link active">Районы</a></li>',
    ],
    metro: [
      '<li><a href="/metro/" class="nav-link">Метро</a></li>',
      '<li><a href="/metro/" class="nav-link active">Метро</a></li>',
    ],
    kat: [
      '<a href="/kategoria/" class="nav-link nav-link-dropdown">Категории</a>',
      '<a href="/kategoria/" class="nav-link nav-link-dropdown active">Категории</a>',
    ],
    povod: [
      '<li><a href="/povod/" class="nav-link">Повод</a></li>',
      '<li><a href="/povod/" class="nav-link active">Повод</a></li>',
    ],
    night: [
      '<li><a href="/dostavka-nochyu-moskva.html" class="nav-link">Ночью 24/7</a></li>',
      '<li><a href="/dostavka-nochyu-moskva.html" class="nav-link active">Ночью 24/7</a></li>',
    ],
    faq: [
      '<li><a href="/faq.html" class="nav-link">FAQ</a></li>',
      '<li><a href="/faq.html" class="nav-link active">FAQ</a></li>',
    ],
    contacts: [
      '<li><a href="/contacts.html" class="nav-link">Контакты</a></li>',
      '<li><a href="/contacts.html" class="nav-link active">Контакты</a></li>',
    ],
  };
  const p = pairs[key];
  if (!p) return h;
  if (!h.includes(p[0])) throw new Error('Missing nav snippet for ' + key);
  return h.replace(p[0], p[1]);
}

function replaceBodyLead(html, newLead) {
  const bodyIdx = html.indexOf('<body');
  if (bodyIdx === -1) throw new Error('no body');
  const gt = html.indexOf('>', bodyIdx);
  const start = gt + 1;
  const mainIdx = html.indexOf('<main', start);
  if (mainIdx === -1) throw new Error('no main');
  return html.slice(0, start) + '\n' + newLead + '\n    ' + html.slice(mainIdx);
}

const JOBS = [
  ['catalog.html', 'cat'],
  ['contacts.html', 'contacts'],
  ['faq.html', 'faq'],
  ['rayony.html', 'rayony'],
  ['dostavka-nochyu-moskva.html', 'night'],
  ['dostavka-chertanovo.html', 'rayony'],
  ['dostavka-butovo.html', 'rayony'],
  ['podarochnye-nabory.html', 'povod'],
  ['privacy.html', null],
];

const base = extractBaseHeader();

for (const [file, act] of JOBS) {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  const header = withActive(base, act);
  html = replaceBodyLead(html, header.trimEnd());
  fs.writeFileSync(fp, html, 'utf8');
  console.log('patched', file, act);
}

/* index.html: сохраняем age-strip, шапку берём как у metro (scroll-progress … floating-messengers) */
const indexPath = path.join(ROOT, 'index.html');
let idx = fs.readFileSync(indexPath, 'utf8');
const scrollIdx = idx.indexOf('<div class="scroll-progress"');
const mainPos = scrollIdx === -1 ? -1 : idx.indexOf('<main', scrollIdx);
if (scrollIdx === -1 || mainPos === -1) {
  console.warn('index.html: scroll-progress/main not found, skip');
} else {
  const header = withActive(base, 'home');
  idx = idx.slice(0, scrollIdx) + header.trimEnd() + '\n\n    ' + idx.slice(mainPos);
  fs.writeFileSync(indexPath, idx, 'utf8');
  console.log('patched index.html home');
}
