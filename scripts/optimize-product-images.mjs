/**
 * Оптимизация фото товаров: WebP 320w / 560w для мобильных + og-default.
 * Запуск: npm run optimize:images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'images');
const OUT_DIR = path.join(ROOT, 'images', 'optimized');
const SIZES = [320, 560];
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function fileSlug(name) {
  const base = path.basename(name, path.extname(name));
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `img-${Buffer.from(base).toString('hex').slice(0, 8)}`;
}

async function optimizeOne(filePath) {
  const rel = path.relative(SRC_DIR, filePath);
  if (rel.startsWith('optimized')) return null;

  const slug = fileSlug(rel);
  const meta = { original: `images/${rel.replace(/\\/g, '/')}`, slug, variants: {} };

  const input = sharp(filePath, { failOn: 'none' });
  const info = await input.metadata();
  if (!info.width) return null;

  for (const w of SIZES) {
    const targetW = Math.min(w, info.width);
    const outName = `${slug}-${w}.webp`;
    const outPath = path.join(OUT_DIR, outName);
    await sharp(filePath)
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(outPath);
    meta.variants[w] = `images/optimized/${outName}`;
  }

  return meta;
}

async function createOgImage() {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#2d1515"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="#d32f2f" stroke-width="4"/>
  <text x="100" y="200" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#ffffff">АЛКОдоставка</text>
  <text x="100" y="290" font-family="Arial,sans-serif" font-size="40" fill="#f5f5f5">Доставка алкоголя по Москве 24/7</text>
  <text x="100" y="380" font-family="Arial,sans-serif" font-size="32" fill="#d32f2f">Часто 20–40 мин · от 1000 ₽ · 18+</text>
  <text x="100" y="480" font-family="Arial,sans-serif" font-size="28" fill="#cccccc">+7 (925) 121-99-72 · WhatsApp · Telegram</text>
</svg>`;

  const ogPath = path.join(ROOT, 'og-default.jpg');
  await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(ogPath);
  console.log('Created og-default.jpg');
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('images/ not found');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => IMAGE_EXT.test(f))
    .map((f) => path.join(SRC_DIR, f));

  const manifest = {};
  let done = 0;

  for (const fp of files) {
    try {
      const meta = await optimizeOne(fp);
      if (meta) {
        manifest[meta.original] = meta;
        done += 1;
      }
    } catch (e) {
      console.warn('Skip', path.basename(fp), e.message);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  await createOgImage();
  console.log(`Optimized ${done} images → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
