/**
 * Копирует фото из архива, сопоставляет с карточками каталога, обновляет catalog.html.
 * Запуск: node scripts/import-product-images.mjs [путь-к-zip]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CATALOG = path.join(ROOT, 'catalog.html');
const IMAGES = path.join(ROOT, 'images');
const IMPORT_DIR = path.join(ROOT, '_import-images');

/** Исходный файл → имя в images/ */
const FILE_COPY = {
  'IMG_4661.JPG': 'martini-bianco.jpg',
  'IMG_4663.JPG': 'martini-fiero.jpg',
  'IMG_4664.WEBP': 'ballantines.webp',
  'IMG_4665.PNG': 'bells-whisky.png',
  'IMG_4666.JPG': 'glenfiddich-12.jpg',
  'IMG_4669.JPG': 'absolut-vodka.jpg',
  'IMG_4670.WEBP': 'beluga-noble.webp',
  'IMG_4673.JPG': 'remy-martin-vs.jpg',
  'IMG_4674.PNG': 'lezginka.png',
  'IMG_4675.PNG': 'kenigsberg-4.png',
  'IMG_4676.PNG': 'kenigsberg-5.png',
  'IMG_4678.PNG': 'barcelo-blanco-07.png',
  'IMG_4679.PNG': 'barcelo-blanco-1l.png',
  'IMG_4681.JPG': 'captain-morgan.jpg',
  'IMG_4682.PNG': 'becherovka.png',
  'IMG_4684.JPG': 'baileys.jpg',
  'IMG_4685.JPG': 'sambuca.jpg',
  'IMG_4686.JPG': 'cointreau.jpg',
  'IMG_4689.JPG': 'jagermeister.jpg',
  'IMG_4690.JPG': 'olmeca.jpg',
  'IMG_4691.JPG': 'sauza-gold.jpg',
  'IMG_4692.JPG': 'sauza-silver.jpg',
  'IMG_4693.PNG': 'villa-francesca-bianco.png',
  'IMG_4694.PNG': 'villa-francesca-rosso.png',
  'IMG_4695.PNG': 'mancura-moscato.png',
  'IMG_4696.PNG': 'mancura-chardonnay.png',
  'IMG_4698.PNG': 'mancura-red.png',
  'IMG_4701.PNG': 'pinot-grigio.png',
  'IMG_4702.PNG': 'torre-de-rejas.png',
  'IMG_4703.PNG': 'muzaradi-saperavi.png',
  'IMG_4704.PNG': 'kindzmarauli.png',
  'IMG_4705.PNG': 'chianti-docg.png',
  'IMG_4706.PNG': 'atto-primo-prosecco.png',
  'IMG_4707.JPG': 'gancia-prosecco.jpg',
  'IMG_4709.PNG': 'martini-prosecco.png',
  'IMG_4710.PNG': 'mondoro-asti.png',
  'IMG_4711.PNG': 'mondoro-prosecco.png',
  'IMG_4712.PNG': 'riondo-prosecco.png',
  'IMG_4713.PNG': 'abrau-durso-brut.png',
  'IMG_4714.PNG': 'faldeo-prosecco.png',
};

/** Правила: все keywords должны встретиться в названии товара */
const MATCH_RULES = [
  { keywords: ['absolut'], image: 'absolut-vodka.jpg' },
  { keywords: ['ballantine'], image: 'ballantines.webp' },
  { keywords: ['bell'], image: 'bells-whisky.png' },
  { keywords: ['glenfiddich'], image: 'glenfiddich-12.jpg' },
  { keywords: ['remy', 'martin'], image: 'remy-martin-vs.jpg' },
  { keywords: ['лезгинка'], image: 'lezginka.png' },
  { keywords: ['кенигсберг', '4'], image: 'kenigsberg-4.png' },
  { keywords: ['кенигсберг', '5'], image: 'kenigsberg-5.png' },
  { keywords: ['кенигсберг'], image: 'kenigsberg-5.png' },
  { keywords: ['barcelo', '1'], image: 'barcelo-blanco-1l.png' },
  { keywords: ['barcelo'], image: 'barcelo-blanco-07.png' },
  { keywords: ['капитан', 'морган'], image: 'captain-morgan.jpg' },
  { keywords: ['becherovka'], image: 'becherovka.png' },
  { keywords: ['baileys'], image: 'baileys.jpg' },
  { keywords: ['sambuca'], image: 'sambuca.jpg' },
  { keywords: ['cointreau'], image: 'cointreau.jpg' },
  { keywords: ['jägermeister'], image: 'jagermeister.jpg' },
  { keywords: ['jagermeister'], image: 'jagermeister.jpg' },
  { keywords: ['olmeca'], image: 'olmeca.jpg' },
  { keywords: ['sauza', 'gold'], image: 'sauza-gold.jpg' },
  { keywords: ['sauza', 'silver'], image: 'sauza-silver.jpg' },
  { keywords: ['вилла', 'бел'], image: 'villa-francesca-bianco.png' },
  { keywords: ['villa', 'bianco'], image: 'villa-francesca-bianco.png' },
  { keywords: ['вилла', 'крас'], image: 'villa-francesca-rosso.png' },
  { keywords: ['villa', 'rosso'], image: 'villa-francesca-rosso.png' },
  { keywords: ['вилла', 'полуслад'], image: 'villa-francesca-rosso.png' },
  { keywords: ['mancura', 'moscato'], image: 'mancura-moscato.png' },
  { keywords: ['mancura', 'chardonnay'], image: 'mancura-chardonnay.png' },
  { keywords: ['pinot', 'grigio'], image: 'pinot-grigio.png' },
  { keywords: ['torre', 'rejas'], image: 'torre-de-rejas.png' },
  { keywords: ['музаради'], image: 'muzaradi-saperavi.png' },
  { keywords: ['киндзмараули'], image: 'kindzmarauli.png' },
  { keywords: ['chianti'], image: 'chianti-docg.png' },
  { keywords: ['atto', 'primo'], image: 'atto-primo-prosecco.png' },
  { keywords: ['gancia'], image: 'gancia-prosecco.jpg' },
  { keywords: ['martini', 'prosecco'], image: 'martini-prosecco.png' },
  { keywords: ['mondoro', 'asti'], image: 'mondoro-asti.png' },
  { keywords: ['mondoro', 'prosecco'], image: 'mondoro-prosecco.png' },
  { keywords: ['riondo'], image: 'riondo-prosecco.png' },
  { keywords: ['абрау'], image: 'abrau-durso-brut.png' },
  { keywords: ['faldeo'], image: 'faldeo-prosecco.png' },
  { keywords: ['martini', 'bianco'], image: 'martini-bianco.jpg' },
  { keywords: ['martini', 'fiero'], image: 'martini-fiero.jpg' },
  { keywords: ['beluga', 'noble'], image: 'beluga-noble.webp' },
  { keywords: ['beluga', 'transatlantic'], image: 'beluga-noble.webp' },

  // —— семейства брендов (фото из архива на все объёмы/линейки) ——
  { keywords: ['беленькая'], image: 'absolut-vodka.jpg' },
  { keywords: ['mancura', 'cabernet'], image: 'mancura-red.png' },
  { keywords: ['mancura', 'merlot'], image: 'mancura-red.png' },
  { keywords: ['mancura', 'carmenere'], image: 'mancura-red.png' },
  { keywords: ['mancura'], image: 'mancura-moscato.png' },
  { keywords: ['cinzano'], image: 'martini-bianco.jpg' },
  { keywords: ['martini', 'extra dry'], image: 'martini-bianco.jpg' },
  { keywords: ['martini', 'asti'], image: 'mondoro-asti.png' },
  { keywords: ['petit', 'chablis'], image: 'pinot-grigio.png' },
  { keywords: ['chablis'], image: 'pinot-grigio.png' },
  { keywords: ['macallan'], image: 'glenfiddich-12.jpg' },
  { keywords: ['william', 'lawson'], image: 'ballantines.webp' },
  { keywords: ['lawson'], image: 'ballantines.webp' },
  { keywords: ['varцихе'], image: 'lezginka.png' },
  { keywords: ['iverieli'], image: 'lezginka.png' },
  { keywords: ['havana'], image: 'barcelo-blanco-07.png' },
  { keywords: ['beefeater'], image: 'becherovka.png' },
  { keywords: ['bombay'], image: 'cointreau.jpg' },
  { keywords: ['gordon'], image: 'becherovka.png' },
  { keywords: ['limoncello'], image: 'jagermeister.jpg' },
  { keywords: ['sheridan'], image: 'baileys.jpg' },

  // пиво — в архиве нет, берём из имеющихся фото каталога
  { keywords: ['1664'], image: 'corona.jpg' },
  { keywords: ['miller'], image: 'Budweiser.jpg' },
  { keywords: ['paulaner'], image: 'guiness.jpg' },
  { keywords: ['охота'], image: 'baltica3.jpg' },
  { keywords: ['шпатен'], image: 'images.jpg' },
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function matchImage(title) {
  const n = norm(title);
  for (const rule of MATCH_RULES) {
    if (rule.keywords.every((k) => n.includes(norm(k)))) {
      const file = path.join(IMAGES, rule.image);
      if (fs.existsSync(file)) return rule.image;
    }
  }
  return null;
}

function patchPlaceholders(html) {
  let count = 0;
  const next = html.replace(
    /(<div class="product-card"[\s\S]*?<img[^>]*?)src="images\/placeholder-[^"]+"([^>]*alt="([^"]*)"[^>]*>[\s\S]*?<h3>)([^<]+)(<\/h3>)/g,
    (full, before, after, alt, title, closeH3) => {
      const img = matchImage(title) || matchImage(alt);
      if (!img) return full;
      count++;
      return before + 'src="images/' + img + '"' + after + title + closeH3;
    },
  );
  return { html: next, count };
}

function extractZip(zipPath) {
  if (!fs.existsSync(IMPORT_DIR)) fs.mkdirSync(IMPORT_DIR, { recursive: true });
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${IMPORT_DIR.replace(/'/g, "''")}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${IMPORT_DIR}"`, { stdio: 'inherit' });
  }
}

const zipArg = process.argv[2] || 'C:\\Users\\user\\Downloads\\IMG_4704.zip';
if (process.argv[2] !== '--skip-zip' && fs.existsSync(zipArg)) {
  extractZip(zipArg);
}

let copied = 0;
for (const [srcName, destName] of Object.entries(FILE_COPY)) {
  const src = path.join(IMPORT_DIR, srcName);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(IMAGES, destName));
  copied++;
}

let html = fs.readFileSync(CATALOG, 'utf8');
let updated = 0;
let pass;
do {
  pass = patchPlaceholders(html);
  html = pass.html;
  updated += pass.count;
} while (pass.count > 0);

fs.writeFileSync(CATALOG, html, 'utf8');
const left = (html.match(/placeholder-/g) || []).length;
console.log(`import-product-images: copied ${copied} files, updated ${updated} catalog cards, placeholders left: ${left}`);
