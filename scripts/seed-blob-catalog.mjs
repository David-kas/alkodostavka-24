/**
 * Загрузить data/catalog.json в Vercel Blob (один раз перед первым сохранением на проде).
 * Нужен BLOB_READ_WRITE_TOKEN в .env или в окружении.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readCatalog, writeCatalogAsync } from '../lib/catalog-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Задайте BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob → .env.local / Environment Variables)');
  process.exit(1);
}

process.env.VERCEL = '1';

const data = readCatalog();
const saved = await writeCatalogAsync({ ...data });
console.log('Загружено в Blob:', saved.products.length, 'товаров, version', saved.version);
