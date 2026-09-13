/**
 * Минификация CSS/JS для PageSpeed.
 * Запуск: node scripts/build-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const pairs = [
  ['style.css', 'style.min.css'],
  ['script.js', 'script.min.js'],
  ['script.catalog.js', 'script.catalog.min.js'],
];

for (const [src, dest] of pairs) {
  const srcPath = path.join(ROOT, src);
  if (!fs.existsSync(srcPath)) continue;
  const raw = fs.readFileSync(srcPath, 'utf8');
  if (dest.endsWith('.css')) {
    const out = new CleanCSS({ level: 2 }).minify(raw);
    if (out.errors.length) {
      console.error(dest, out.errors);
      process.exit(1);
    }
    fs.writeFileSync(path.join(ROOT, dest), out.styles, 'utf8');
    console.log(`${src} → ${dest}: ${raw.length} → ${out.styles.length} bytes`);
  } else {
    const out = await minifyJs(raw, { compress: true, mangle: false, format: { comments: false } });
    fs.writeFileSync(path.join(ROOT, dest), out.code, 'utf8');
    console.log(`${src} → ${dest}: ${raw.length} → ${out.code.length} bytes`);
  }
}
