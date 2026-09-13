import { readCatalog, renderCatalogHtml } from '../lib/catalog-store.mjs';

const data = readCatalog();
renderCatalogHtml(data.products);
console.log(`render-catalog-html: ${data.products.length} cards`);
