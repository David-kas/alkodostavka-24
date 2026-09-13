/**
 * Экспорт товаров из catalog.html → data/catalog.json
 * Запуск: node scripts/export-catalog-json.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CATALOG_HTML,
  CATALOG_JSON,
  parseProductsFromHtml,
  makeProductId,
} from '../lib/catalog-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseAllProducts(html) {
  const products = [];
  const re = /<div class="product-card([^"]*)"[^>]*data-category="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*\n\s*<div class="product-card"/g;
  const parts = html.split(/<div class="product-card"/);
  for (let i = 1; i < parts.length; i++) {
    const chunk = '<div class="product-card' + parts[i];
    const endIdx = chunk.indexOf('</div>\n');
    const block = chunk.slice(0, chunk.indexOf('</div>', chunk.indexOf('product-price')) + 6);
    const classExtra = (block.match(/^<div class="product-card([^"]*)"/) || [])[1] || '';
    const catMatch = block.match(/data-category="([^"]+)"/);
    const h3 = block.match(/<h3>([^<]+)<\/h3>/);
    const price = block.match(/class="product-price"[^>]*>([^<]+)</);
    const img = block.match(/src="([^"]+)"/);
    const alt = block.match(/alt="([^"]*)"/);
    const desc = block.match(/class="product-desc"[^>]*>([^<]*)</);
    if (!h3 || !price || !catMatch) continue;
    const name = h3[1].trim();
    products.push({
      id: makeProductId(name),
      name,
      category: catMatch[1],
      price: parseInt(String(price[1]).replace(/\D/g, ''), 10) || 0,
      image: img ? img[1] : '',
      alt: alt ? alt[1] : name,
      desc: desc ? desc[1].trim() : '',
      inStock: !classExtra.includes('out-of-stock') && !block.includes('product-stock-overlay'),
    });
  }
  return products;
}

const html = fs.readFileSync(CATALOG_HTML, 'utf8');
const products = parseAllProducts(html);
const data = { version: 1, updatedAt: new Date().toISOString(), products };
fs.mkdirSync(path.dirname(CATALOG_JSON), { recursive: true });
fs.writeFileSync(CATALOG_JSON, JSON.stringify(data, null, 2), 'utf8');
console.log(`export-catalog-json: ${products.length} products → data/catalog.json`);
