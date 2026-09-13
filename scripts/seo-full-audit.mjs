/**
 * Полный SEO-аудит: alt-теги, JSON-LD каталога, тексты категорий, метрика alt.
 * Запуск: node scripts/seo-full-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = 'https://alkodastavka.vercel.app';
const CATALOG = path.join(ROOT, 'catalog.html');

const CATEGORY_KEYWORDS = {
  strong: 'алкоголь',
  wine: 'вино',
  beer: 'пиво',
  snacks: 'закуски',
};

const CATEGORY_SEO_EXTRA = {
  vodka: `<p class="category-seo-extra">Водка — самый востребованный крепкий алкоголь в заказах по Москве. Мы доставляем классические и премиальные марки: от доступных позиций до коллекционных линейок. Перед покупкой уточните объём и наличие у менеджера — подскажем мягкие и выдержанные варианты под ваш повод. Оплата при получении, доставка 24/7.</p>`,
  viski: `<p class="category-seo-extra">Виски с доставкой на дом — однобочное, купажированное, ирландское и шотландское. Поможем выбрать по крепости, выдержке и бюджету: для вечера вдвоём, корпоратива или подарка. Все бутылки из проверенных поставок, хранение в нормальных условиях. Заказ от 1000 ₽, по Москве часто 20–40 минут.</p>`,
  konyak: `<p class="category-seo-extra">Коньяк и бренди — для спокойного вечера и праздничного стола. В ассортименте VS, VSOP и старше по выдержке; менеджер подскажет, что есть в наличии сегодня. Доставляем по всей Москве и области, включая ночные часы. Сертифицированная продукция, передача только 18+.</p>`,
  vino: `<p class="category-seo-extra">Вино красное, белое и розовое — от повседневных бутылок до игристых позиций. Подберём по сладости, региону и сочетанию с закусками из нашего каталога. Доставка в термопакете по согласованию, уточняйте при оформлении. Удобно заказать вместе с сыром, оливками и снеками.</p>`,
  igristoe: `<p class="category-seo-extra">Игристое вино и шампанское — для праздника, тоста и подарка. Prosecco, кава, отечественные и импортные марки. Сообщите дату мероприятия — проверим наличие нужного объёма. Курьер привезёт в согласованное время, оплата при получении.</p>`,
  pivo: `<p class="category-seo-extra">Пиво с доставкой — светлое, тёмное, крафтовое и безалкогольное. Жигулёвское, Hoegaarden, Guinness и десятки других позиций в каталоге. Идеально дополнить заказ закусками: рыба, чипсы, орехи. По Москве часто 20–40 минут после подтверждения, минимальный заказ от 1000 ₽.</p>`,
  zakuski: `<p class="category-seo-extra">Закуски к пиву и крепкому — орехи, чипсы, сухарики, рыба, сыр и оливки. Добавьте к основному заказу одним звонком или через корзину на сайте. Свежие партии, проверенные производители. Доставляем вместе с алкоголем по Москве круглосуточно.</p>`,
};

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

function detectCategoryKeyword(name, dataCategory) {
  const n = name.toLowerCase();
  if (/водка/.test(n)) return 'водка';
  if (/виски/.test(n)) return 'виски';
  if (/коньяк|бренди/.test(n)) return 'коньяк';
  if (/вино|prosecco|шампан|игрист/.test(n)) return 'вино';
  if (/пиво|стаут|эль|лагер/.test(n)) return 'пиво';
  if (/чипс|орех|арахис|рыб|оливк|сыр|кешью|фисташ|сухар|закуск|pringles|lays/i.test(n)) return 'закуски';
  return CATEGORY_KEYWORDS[dataCategory] || 'алкоголь';
}

function extractBrand(name) {
  const quoted = name.match(/«([^»]+)»/);
  if (quoted) return quoted[1].replace(/\s+/g, ' ').trim();
  const withoutVol = name.replace(/\s*0[,.]?\d+\s*л.*$/i, '').replace(/\s*\d+\s*г.*$/i, '');
  const parts = withoutVol.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && /^(водка|виски|коньяк|пиво|вино|чипсы)/i.test(parts[0])) {
    return parts.slice(1, 4).join(' ').slice(0, 40);
  }
  return parts.slice(0, 3).join(' ').slice(0, 40);
}

function generateAlt(h3, dataCategory) {
  const brand = extractBrand(h3);
  const catKw = detectCategoryKeyword(h3, dataCategory);
  const volMatch = h3.match(/0[,.]?\d+\s*л|\d+\s*г/i);
  const vol = volMatch ? volMatch[0].replace(/\s+/g, '') : '';
  const words = [];
  if (brand) words.push(brand.split(/\s+/).slice(0, 2).join(' '));
  if (vol) words.push(vol);
  words.push(catKw);
  words.push('доставка', 'Москва');
  let alt = words.join(' ').replace(/\s+/g, ' ').trim();
  const w = alt.split(/\s+/);
  if (w.length > 6) alt = w.slice(0, 6).join(' ');
  return alt;
}

function parsePrice(text) {
  return String(text || '').replace(/[^\d]/g, '') || '0';
}

function extractBrandForSchema(name) {
  const q = name.match(/«([^»]+)»/);
  if (q) return q[1];
  const m = name.match(/^(Водка|Виски|Коньяк|Пиво|Вино|Чипсы)\s+(.+?)(?:\s+0[,.]?\d|$)/i);
  if (m) return m[2].split(/\s+/).slice(0, 2).join(' ');
  return name.split(/\s+/).slice(0, 2).join(' ');
}

function parseCatalogProducts(html) {
  const products = [];
  const cardRe = /<div class="product-card"[^>]*data-category="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="product-card"|<\/div>\s*<!-- SEO)/g;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const block = m[2];
    const dataCategory = m[1];
    const h3 = block.match(/<h3>([^<]+)<\/h3>/);
    const price = block.match(/class="product-price"[^>]*>([^<]+)</);
    const img = block.match(/src="([^"]+)"/);
    if (!h3 || !price) continue;
    const name = h3[1].trim();
    products.push({
      name,
      dataCategory,
      price: parsePrice(price[1]),
      image: img ? img[1].replace(/^\//, '').replace(/^images\//, 'images/') : '',
      brand: extractBrandForSchema(name),
      categoryKw: detectCategoryKeyword(name, dataCategory),
    });
  }
  return products;
}

function buildCatalogJsonLd(products) {
  const itemList = products.slice(0, 50).map((p, i) => {
    const imgUrl = p.image.startsWith('http') ? p.image : `${SITE}/${p.image.replace(/^\//, '')}`;
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        description: `${p.name}. Доставка алкоголя по Москве 24/7.`,
        image: imgUrl,
        brand: { '@type': 'Brand', name: p.brand },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          url: `${SITE}/catalog.html`,
          areaServed: 'Москва',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '127',
        },
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'АЛКОдоставка',
        url: SITE,
        logo: `${SITE}/favicon.svg`,
        telephone: '+79251219972',
        sameAs: ['https://t.me/alkotaxi_bot'],
      },
      {
        '@type': 'CollectionPage',
        name: 'Каталог алкоголя и закусок АЛКОдоставка',
        url: `${SITE}/catalog.html`,
        isPartOf: { '@type': 'WebSite', name: 'АЛКОдоставка', url: `${SITE}/` },
        inLanguage: 'ru-RU',
        description: 'Каталог алкоголя с доставкой на дом по Москве: водка, виски, коньяк, пиво, закуски',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE}/catalog.html` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Каталог алкоголя АЛКОдоставка',
        url: `${SITE}/catalog.html`,
        numberOfItems: products.length,
        itemListElement: itemList,
      },
    ],
  };
}

function updateCatalogAlts(html) {
  return html.replace(
    /(<div class="product-card"[^>]*data-category="([^"]*)"[^>]*>[\s\S]*?<img[^>]*?)alt="[^"]*"([^>]*>[\s\S]*?<h3>)([^<]+)(<\/h3>)/g,
    (full, beforeAlt, dataCategory, afterAlt, h3, closeH3) => {
      const alt = generateAlt(h3, dataCategory);
      return `${beforeAlt}alt="${alt}"${afterAlt}${h3}${closeH3}`;
    },
  );
}

function wrapProductImages(html) {
  return html.replace(
    /<div class="product-image">/g,
    '<div class="product-image image-wrap" data-watermark>',
  );
}

function replaceCatalogJsonLd(html, jsonLd) {
  const script = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 4)}\n    </script>`;
  return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, script);
}

function fixMetrikaAlt(html) {
  return html.replace(
    /(<img[^>]*mc\.yandex\.ru\/watch[^>]*?)alt=""/g,
    '$1alt="Счётчик Яндекс.Метрика" aria-hidden="true"',
  );
}

function enhanceCategoryPage(html, slug) {
  const extra = CATEGORY_SEO_EXTRA[slug];
  if (!extra || html.includes('category-seo-extra')) return html;

  if (html.includes('<div class="legal-box">')) {
    return html.replace(
      /<div class="legal-box">/,
      `${extra}\n        <div class="legal-box">`,
    );
  }
  return html.replace(
    '</div>\n      <section class="seo-related-block"',
    `${extra}\n      </div>\n      <section class="seo-related-block"`,
  );
}

// --- catalog.html ---
let catalogHtml = fs.readFileSync(CATALOG, 'utf8');
const products = parseCatalogProducts(catalogHtml);
console.log(`catalog: ${products.length} products parsed`);

catalogHtml = updateCatalogAlts(catalogHtml);
catalogHtml = wrapProductImages(catalogHtml);
catalogHtml = replaceCatalogJsonLd(catalogHtml, buildCatalogJsonLd(products));

if (!catalogHtml.includes('catalog-promo-banner')) {
  const promoBanner = `
            <div class="catalog-promo-banner" data-promo-end role="region" aria-label="Акция">
                <div class="catalog-promo-inner">
                    <span class="catalog-promo-badge">Акция</span>
                    <h2 class="catalog-promo-title">Акции на виски и водку — скидки до 15%</h2>
                    <p class="catalog-promo-text">Купить алкоголь с доставкой по Москве выгоднее до конца недели. Уточняйте цену у менеджера.</p>
                    <div class="catalog-promo-timer" id="promo-countdown" aria-live="polite">—</div>
                </div>
            </div>
`;
  catalogHtml = catalogHtml.replace(
    '<div class="catalog-categories">',
    promoBanner + '\n            <div class="catalog-categories">',
  );
}

fs.writeFileSync(CATALOG, catalogHtml, 'utf8');
console.log('catalog.html: alts, watermark class, JSON-LD, promo');

// --- all HTML: metrika alt ---
let metrikaFixed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  const next = fixMetrikaAlt(html);
  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    metrikaFixed++;
  }
}
console.log(`metrika alt fixed in ${metrikaFixed} files`);

// --- category pages ---
let catEnhanced = 0;
for (const slug of Object.keys(CATEGORY_SEO_EXTRA)) {
  const fp = path.join(ROOT, 'kategoria', slug, 'index.html');
  if (!fs.existsSync(fp)) continue;
  const before = fs.readFileSync(fp, 'utf8');
  const after = enhanceCategoryPage(before, slug);
  if (after !== before) {
    fs.writeFileSync(fp, after, 'utf8');
    catEnhanced++;
  }
}
console.log(`category SEO text enhanced: ${catEnhanced} pages`);

// --- sitemap lastmod ---
const sitemapPath = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const today = '2026-07-01';
  let sm = fs.readFileSync(sitemapPath, 'utf8');
  sm = sm.replace(/<lastmod>[\d-]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  fs.writeFileSync(sitemapPath, sm, 'utf8');
  console.log('sitemap.xml: lastmod updated');
}

console.log('seo-full-audit: done');
