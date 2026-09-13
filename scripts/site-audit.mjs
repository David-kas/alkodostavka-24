/**
 * Аудит сайта: JSON-LD, каталог, файлы, API (если dev запущен).
 * node scripts/site-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (['node_modules', '.git', 'admin'].includes(name)) continue;
      walk(fp, acc);
    } else if (/\.html$/i.test(name)) {
      acc.push(fp);
    }
  }
  return acc;
}

const issues = [];
let jsonLdOk = 0;
let jsonLdBad = 0;

for (const fp of walk(ROOT)) {
  const html = fs.readFileSync(fp, 'utf8');
  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      JSON.parse(m[1]);
      jsonLdOk++;
    } catch (e) {
      jsonLdBad++;
      issues.push(`JSON-LD: ${path.relative(ROOT, fp)} — ${e.message.slice(0, 50)}`);
    }
  }
  if (html.includes('<link rel="stylesheet" href="/style.css">') && !html.includes('style.min.css')) {
    issues.push(`CSS: ${path.relative(ROOT, fp)} — не минифицированный style.css`);
  }
}

const catalog = fs.readFileSync(path.join(ROOT, 'catalog.html'), 'utf8');
const cards = (catalog.match(/class="product-card/g) || []).length;
const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
if (cards !== json.products.length) {
  issues.push(`Каталог: HTML ${cards} карточек vs JSON ${json.products.length}`);
}

const required = ['index.html', 'catalog.html', 'admin/index.html', 'data/catalog.json', 'llms.txt', 'robots.txt', 'script.min.js', 'script.catalog.min.js', 'style.min.css'];
for (const f of required) {
  if (!fs.existsSync(path.join(ROOT, f))) issues.push(`Нет файла: ${f}`);
}

if (!fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8').includes('Disallow: /admin/')) {
  issues.push('robots.txt: нет Disallow /admin/');
}

const adminHtml = fs.readFileSync(path.join(ROOT, 'admin', 'index.html'), 'utf8');
if (!adminHtml.includes('noindex')) issues.push('admin: нет noindex');

console.log('=== Аудит сайта ===');
console.log(`JSON-LD блоков OK: ${jsonLdOk}, ошибок: ${jsonLdBad}`);
console.log(`Каталог: ${cards} карточек, JSON: ${json.products.length}`);
console.log(`Проблем: ${issues.length}`);
issues.forEach((i) => console.log('  ⚠', i));
if (!issues.length) console.log('✓ Критических проблем не найдено');
process.exit(issues.length ? 1 : 0);
