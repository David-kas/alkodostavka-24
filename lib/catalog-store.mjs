/**
 * Хранилище каталога: data/catalog.json (локально) + Vercel Blob (продакшен)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');
export const CATALOG_JSON = path.join(ROOT, 'data', 'catalog.json');
export const CATALOG_HTML = path.join(ROOT, 'catalog.html');
export const IMAGES_DIR = path.join(ROOT, 'images');
const BLOB_PATHNAME = 'alko-catalog.json';
const BLOB_ACCESS = 'private';
const IS_VERCEL = Boolean(process.env.VERCEL);

function blobStoreOptions() {
  const opts = { access: BLOB_ACCESS };
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  const storeId = (process.env.BLOB_STORE_ID || '').trim();
  if (token) opts.token = token;
  if (storeId) opts.storeId = storeId;
  return opts;
}

export function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || '').trim();
}

export function verifyAdminToken(authHeader) {
  const password = getAdminPassword();
  if (!password) return { ok: false, code: 'ADMIN_NOT_CONFIGURED' };
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token !== password) return { ok: false, code: 'UNAUTHORIZED' };
  return { ok: true };
}

export function makeProductId(name) {
  const base = String(name || 'product')
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const hash = crypto.createHash('md5').update(String(name)).digest('hex').slice(0, 6);
  return `${base}-${hash}`;
}

function readCatalogFile() {
  if (!fs.existsSync(CATALOG_JSON)) {
    return { version: 1, updatedAt: new Date().toISOString(), products: [] };
  }
  const data = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8'));
  if (!Array.isArray(data.products)) data.products = [];
  return data;
}

function blobClientOptions() {
  return blobStoreOptions();
}

async function readCatalogBlob() {
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATHNAME, blobStoreOptions());
    if (!result?.stream) return null;
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.products)) data.products = [];
    return data;
  } catch {
    return null;
  }
}

async function writeCatalogBlob(data) {
  const { put } = await import('@vercel/blob');
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    allowOverwrite: true,
    contentType: 'application/json',
    ...blobStoreOptions(),
  });
}

export async function probeBlobStorage() {
  if (!IS_VERCEL) return { available: true, mode: 'local' };

  const hasToken = Boolean((process.env.BLOB_READ_WRITE_TOKEN || '').trim());
  const hasStoreId = Boolean((process.env.BLOB_STORE_ID || '').trim());

  if (hasToken || hasStoreId) {
    return { available: true, mode: 'blob', empty: !hasToken };
  }

  try {
    const { list } = await import('@vercel/blob');
    await list({ limit: 1, ...blobStoreOptions() });
    return { available: true, mode: 'blob', empty: true };
  } catch (err) {
    const msg = String(err?.message || err || '');
    const missingStore =
      msg.includes('No token found') ||
      msg.includes('BLOB_READ_WRITE_TOKEN') ||
      msg.includes('BLOB_STORE_ID') ||
      msg.includes('Unauthorized') ||
      msg.includes('403');
    const emptyStore =
      msg.includes('not found') ||
      msg.includes('NotFound') ||
      msg.includes('404') ||
      msg.includes('does not exist');
    if (emptyStore && !missingStore) {
      return { available: true, mode: 'blob', empty: true };
    }
    return { available: false, mode: 'vercel-readonly', reason: missingStore ? 'no_blob_store' : 'blob_error' };
  }
}

export function getBlobEnvFlags() {
  return {
    hasToken: Boolean((process.env.BLOB_READ_WRITE_TOKEN || '').trim()),
    hasStoreId: Boolean((process.env.BLOB_STORE_ID || '').trim()),
  };
}

export function readCatalog() {
  return readCatalogFile();
}

export async function readCatalogAsync() {
  if (IS_VERCEL) {
    const blob = await readCatalogBlob();
    if (blob) return blob;
  }
  return readCatalogFile();
}

export function writeCatalog(data) {
  fs.mkdirSync(path.dirname(CATALOG_JSON), { recursive: true });
  data.updatedAt = new Date().toISOString();
  data.version = (data.version || 0) + 1;
  fs.writeFileSync(CATALOG_JSON, JSON.stringify(data, null, 2), 'utf8');
  try {
    renderCatalogHtml(data.products);
  } catch (err) {
    if (err.code !== 'EROFS' && err.code !== 'EPERM') throw err;
  }
  return data;
}

export async function writeCatalogAsync(data) {
  data.updatedAt = new Date().toISOString();
  data.version = (data.version || 0) + 1;

  if (IS_VERCEL) {
    try {
      await writeCatalogBlob(data);
      return data;
    } catch (err) {
      const wrapped = new Error(err?.message || 'Blob write failed');
      wrapped.code = 'NO_BLOB';
      throw wrapped;
    }
  }

  return writeCatalog(data);
}

export function formatPrice(n) {
  return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽';
}

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function productCardHtml(p) {
  const inStock = p.inStock !== false;
  const stockClass = inStock ? '' : ' product-card--out-of-stock';
  const stockAttr = inStock ? 'true' : 'false';
  const overlay = inStock
    ? ''
    : '\n                        <span class="product-stock-overlay" aria-hidden="true">Нет в наличии</span>';
  const imgSrc = escapeHtml(p.image || 'images/placeholder.jpg');
  const alt = escapeHtml(p.alt || p.name);
  const name = escapeHtml(p.name);
  const desc = escapeHtml(p.desc || 'Доставка по Москве 24/7.');
  const price = formatPrice(p.price);
  const cat = escapeHtml(p.category || 'strong');
  const id = escapeHtml(p.id || makeProductId(p.name));

  return `                <div class="product-card${stockClass}" data-category="${cat}" data-product-id="${id}" data-in-stock="${stockAttr}">
                    <div class="product-image image-wrap" data-watermark>
                        <img loading="lazy" decoding="async" src="${imgSrc}" alt="${alt}">${overlay}
                    </div>
                    <h3>${name}</h3>
                    <p class="product-desc">${desc}</p>
                    <span class="product-price">${price}</span>
                </div>`;
}

export function renderCatalogHtml(products) {
  if (!fs.existsSync(CATALOG_HTML)) return;
  let html = fs.readFileSync(CATALOG_HTML, 'utf8');
  const gridOpen = '<div class="catalog-grid">';
  const start = html.indexOf(gridOpen);
  if (start === -1) return;

  const gridStart = start + gridOpen.length;
  const gridEnd = html.indexOf('\n            </div>\n\n            <!-- SEO-текст каталога', gridStart);
  const cards = products.map(productCardHtml).join('\n');

  if (gridEnd === -1) {
    const alt = html.indexOf('<!-- SEO-текст каталога', gridStart);
    if (alt === -1) return;
    const closeDiv = html.lastIndexOf('</div>', alt);
    if (closeDiv <= gridStart) return;
    html = html.slice(0, gridStart) + '\n' + cards + '\n            ' + html.slice(closeDiv);
  } else {
    html = html.slice(0, gridStart) + '\n' + cards + html.slice(gridEnd);
  }
  fs.writeFileSync(CATALOG_HTML, html, 'utf8');
}

export function parseProductsFromHtml(html) {
  const products = [];
  const parts = html.split(/<div class="product-card"/);
  for (let i = 1; i < parts.length; i++) {
    const block = '<div class="product-card' + parts[i];
    const classExtra = (block.match(/^<div class="product-card([^"]*)"/) || [])[1] || '';
    const catMatch = block.match(/data-category="([^"]+)"/);
    const h3 = block.match(/<h3>([^<]+)<\/h3>/);
    const price = block.match(/class="product-price"[^>]*>([^<]+)</);
    const img = block.match(/src="([^"]+)"/);
    const alt = block.match(/alt="([^"]*)"/);
    const desc = block.match(/class="product-desc"[^>]*>([^<]*)</);
    if (!h3 || !price || !catMatch) continue;
    products.push({
      id: makeProductId(h3[1].trim()),
      name: h3[1].trim(),
      category: catMatch[1],
      price: parseInt(String(price[1]).replace(/\D/g, ''), 10) || 0,
      image: img ? img[1] : '',
      alt: alt ? alt[1] : h3[1].trim(),
      desc: desc ? desc[1].trim() : '',
      inStock: !classExtra.includes('out-of-stock') && !block.includes('product-stock-overlay'),
    });
  }
  return products;
}
