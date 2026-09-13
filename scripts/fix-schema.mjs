/**
 * Исправление и расширение JSON-LD schema.org на всех страницах.
 * Запуск: node scripts/fix-schema.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = 'https://alkodastavka.vercel.app';

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'АЛКОдоставка',
  url: `${SITE}/`,
  logo: `${SITE}/favicon.svg`,
  telephone: '+79251219972',
  sameAs: ['https://t.me/alkotaxi_bot'],
};

const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: 'АЛКОдоставка',
  inLanguage: 'ru-RU',
  publisher: { '@id': `${SITE}/#organization` },
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

function extractJsonLd(html) {
  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ raw: m[1], full: m[0] });
  }
  return blocks;
}

function breadcrumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function enhanceMinimalSchema(html, fp) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  const url = rel === 'index.html' ? `${SITE}/` : `${SITE}/${rel.replace(/index\.html$/, '')}`;
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  const pageUrl = canonicalMatch ? canonicalMatch[1] : url;
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : 'АЛКОдоставка';
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const description = descMatch ? descMatch[1] : 'Доставка алкоголя по Москве 24/7';

  const blocks = extractJsonLd(html);
  if (!blocks.length) return html;

  let data;
  try {
    data = JSON.parse(blocks[0].raw);
  } catch {
    return html;
  }

  // Уже полный @graph — только нормализуем publisher
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    let touched = false;
    data['@graph'].forEach((node) => {
      if (node['@type'] === 'WebSite' && node.publisher) {
        node.publisher = { '@id': `${SITE}/#organization` };
        touched = true;
      }
      if (node.offers && node.offers.areaServed && typeof node.offers.areaServed === 'string') {
        node.offers.areaServed = { '@type': 'City', name: node.offers.areaServed };
      }
    });
    if (!touched && rel !== 'index.html' && rel !== 'catalog.html') return html;
    if (touched || rel === 'catalog.html') {
      const script = `<script type="application/ld+json">\n${JSON.stringify(data, null, 4)}\n    </script>`;
      return html.replace(blocks[0].full, script);
    }
    return html;
  }

  const type = data['@type'];
  const graph = [ORG, WEBSITE];

  if (type === 'CollectionPage' || rel.startsWith('kategoria/')) {
    graph.push({
      '@type': 'CollectionPage',
      name: title.replace(/\s*\|\s*18\+$/, '').trim(),
      url: pageUrl,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${SITE}/#website` },
    });
    graph.push(
      breadcrumbs([
        { name: 'Главная', url: `${SITE}/` },
        { name: 'Категории', url: `${SITE}/kategoria/` },
        { name: title.split('—')[0].trim().slice(0, 40), url: pageUrl },
      ]),
    );
  } else if (rel.startsWith('metro/') || rel.startsWith('raion/')) {
    graph.push({
      '@type': 'WebPage',
      name: title.replace(/\s*\|\s*18\+$/, '').trim(),
      url: pageUrl,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${SITE}/#website` },
    });
    graph.push(
      breadcrumbs([
        { name: 'Главная', url: `${SITE}/` },
        { name: rel.startsWith('metro/') ? 'Метро' : 'Районы', url: rel.startsWith('metro/') ? `${SITE}/metro/` : `${SITE}/rayony.html` },
        { name: title.split('—')[0].trim().slice(0, 50), url: pageUrl },
      ]),
    );
    graph.push({
      '@type': 'Service',
      name: 'Доставка алкоголя',
      provider: { '@id': `${SITE}/#organization` },
      areaServed: { '@type': 'City', name: 'Москва' },
      url: pageUrl,
    });
  } else if (type === 'FAQPage' || rel.includes('vopros') || rel === 'faq.html') {
    graph.push(data);
  } else if (type === 'ContactPage') {
    graph.push({
      ...data,
      isPartOf: { '@id': `${SITE}/#website` },
      mainEntity: { '@id': `${SITE}/#organization` },
    });
  } else {
    graph.push({
      '@type': type || 'WebPage',
      name: data.name || title,
      url: data.url || pageUrl,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${SITE}/#website` },
    });
  }

  const next = { '@context': 'https://schema.org', '@graph': graph };
  const script = `<script type="application/ld+json">\n${JSON.stringify(next, null, rel === 'index.html' ? 4 : 2)}\n</script>`;
  return html.replace(blocks[0].full, script);
}

function fixCatalogOffers(html) {
  return html.replace(
    /"areaServed": "Москва"/g,
    '"areaServed": { "@type": "City", "name": "Москва" }',
  ).replace(
    /"availability": "https:\/\/schema.org\/InStock"/g,
    '"availability": "https://schema.org/InStock",\n                            "priceValidUntil": "2027-12-31",\n                            "seller": { "@id": "https://alkodastavka.vercel.app/#organization" }',
  );
}

function fixIndexPublisher(html) {
  return html.replace(
    '"publisher": { "@id": "https://alkodastavka.vercel.app/#business" }',
    '"publisher": { "@id": "https://alkodastavka.vercel.app/#organization" }',
  ).replace(
    /"@type": \["LocalBusiness", "DeliveryService"\]/,
    '"@type": ["LocalBusiness", "DeliveryService", "Organization"]',
  );
}

let updated = 0;
let invalid = 0;

for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');

  const blocks = extractJsonLd(html);
  for (const b of blocks) {
    try {
      JSON.parse(b.raw);
    } catch (e) {
      invalid++;
      console.warn('INVALID JSON-LD:', rel, e.message.slice(0, 60));
    }
  }

  const before = html;
  if (rel === 'index.html') html = fixIndexPublisher(html);
  if (rel === 'catalog.html') html = fixCatalogOffers(html);
  html = enhanceMinimalSchema(html, fp);

  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    updated++;
  }
}

console.log(`fix-schema: updated ${updated} files, invalid blocks found: ${invalid}`);
