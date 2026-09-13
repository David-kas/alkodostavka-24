/**
 * Programmatic SEO: статические HTML без фреймворков.
 * Запуск: npm run generate:seo
 * Генерирует raion/*, metro/*, kategoria/*, povod/*, vopros/*, хабы, sitemap.xml
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CART_PANEL_HTML } from './cart-panel-html.mjs';
import { ONECLICK_MODAL_HTML } from './oneclick-modal-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://alkodastavka.vercel.app';

const CALL_TEL = '+79251219972';
const CALL_DISPLAY = '+7 (925) 121-99-72';
const WA_PHONE = '79626289777';
const SEO_CONTACT = 'телефон, WhatsApp, Telegram или форма заявки';
const LASTMOD = new Date().toISOString().slice(0, 10);
const WA_PREFILL = encodeURIComponent('Здравствуйте! Заказ АЛКОдоставка, адрес: ');

/** Транслитерация для URL (латиница, дефисы) */
function slugify(str) {
  const map = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };
  return str
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => {
      if (map[ch]) return map[ch];
      if (/[a-z0-9]/.test(ch)) return ch;
      if (ch === ' ' || ch === '—' || ch === '–') return '-';
      if (ch === '-' || ch === '_') return '-';
      return '';
    })
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readLines(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Ручные страницы — не дублировать slug */
const SKIP_RAION = new Set(['chertanovo', 'butovo']);

const KATEGORII = [
  { slug: 'vodka', name: 'Водка', hint: 'крепкий алкоголь, классические и премиальные марки' },
  { slug: 'viski', name: 'Виски', hint: 'шотландский, ирландский, бурбон' },
  { slug: 'konyak', name: 'Коньяк и бренди', hint: 'коньяк, кальвадос, арманьяк по ассортименту' },
  { slug: 'vino', name: 'Вино', hint: 'красное, белое, розовое' },
  { slug: 'igristoe', name: 'Игристое и шампанское', hint: 'праздничные позиции' },
  { slug: 'pivo', name: 'Пиво и сидр', hint: 'лагер, эль, крафт, сидр' },
  { slug: 'zakuski', name: 'Закуски', hint: 'рыба, сухарики, орехи, чипсы' },
];

const POVODY = [
  { slug: 'novyj-god', name: 'Новый год', kw: 'игристое, подарки, ночь 31 декабря' },
  { slug: 'den-rozhdeniya', name: 'День рождения', kw: 'торт к алкоголю, подарочный набор' },
  { slug: '8-marta', name: '8 марта', kw: 'вино, игристое, подарок' },
  { slug: '23-fevralya', name: '23 февраля', kw: 'крепкий алкоголь, пиво' },
  { slug: 'den-svyatogo-valentina', name: '14 февраля', kw: 'вино, игристое' },
  { slug: 'korporativ', name: 'Корпоратив', kw: 'большой заказ, офис' },
  { slug: 'srochno', name: 'Срочный заказ', kw: 'быстро по Москве' },
  { slug: 'nocheyu', name: 'Ночью', kw: 'после закрытия магазинов' },
  { slug: 'deshevo', name: 'Недорого', kw: 'бюджетный сегмент' },
  { slug: 'premium', name: 'Премиум', hint: 'элитный алкоголь' },
  { slug: 'afterparty', name: 'Продолжение вечера', kw: 'поздний заказ' },
];

/** Осмысленные ответы для FAQ schema и текста (не «позвоните оператору» как единственный смысл) */
const VOPROSY = [
  {
    slug: 'minimalnaya-summa-zakaza',
    q: 'Какая минимальная сумма заказа?',
    a: 'Ориентир по минимальной сумме — от 1000 ₽. Точная цифра зависит от адреса, времени и акций; оператор назовёт её до подтверждения заказа.',
  },
  {
    slug: 'stoimost-dostavki-mkad',
    q: 'Сколько стоит доставка в пределах МКАД?',
    a: 'Стоимость доставки в пределах МКАД — от 650 ₽. Итог зависит от суммы заказа и условий на момент оформления (иногда доступны скидки или бесплатная доставка от определённой суммы — уточняйте).',
  },
  {
    slug: 'vremya-dostavki-moskva',
    q: 'За сколько привезут по Москве?',
    a: 'По Москве во многих случаях укладываемся в 20–40 минут от подтверждения; в часы пик, ночью или при плохой погоде срок может приближаться к часу. Окно озвучим при заказе.',
  },
  {
    slug: 'oplata-nalichnye-sbp',
    q: 'Как можно оплатить заказ?',
    a: 'Оплата наличными курьеру или переводом на карту через СБП. Другие способы, если появятся, сообщим при оформлении.',
  },
  {
    slug: 'dostavka-nochyu-rabotaet-li',
    q: 'Можно ли заказать алкоголь ночью?',
    a: 'Да, заявки принимаем круглосуточно. Ночью время доставки зависит от района и загрузки — оператор скажет реалистичное окно.',
  },
  {
    slug: 'proverka-vozrasta-18',
    q: 'Нужен ли паспорт при получении?',
    a: 'Алкоголь передаём только совершеннолетним. Курьер может попросить документ, удостоверяющий возраст — это требование закона и нашей политики.',
  },
  {
    slug: 'dostavka-za-mkad',
    q: 'Доставляете ли в Московскую область?',
    a: 'Да, доставка в города и посёлки МО возможна по согласованию. Стоимость и время считаются индивидуально от адреса.',
  },
  {
    slug: 'zakaz-cherez-whatsapp',
    q: 'Как заказать через WhatsApp?',
    a: 'Напишите на номер WhatsApp, укажите адрес, желаемые позиции и удобное время. Ответим с предложением по составу и стоимости.',
  },
  {
    slug: 'originalnost-alkogolya',
    q: 'Гарантируете ли оригинальность алкоголя?',
    a: 'Работаем с легальным ассортиментом и поставщиками; при необходимости уточняйте у оператора происхождение конкретной позиции. Подделки не предлагаем.',
  },
  {
    slug: 'menedzher-ne-otvechaet',
    q: 'Что делать, если не дозвониться?',
    a: 'Повторите звонок через пару минут или напишите в WhatsApp / Telegram — каналы круглосуточные. На сайте также есть форма заявки на странице «Контакты».',
  },
];

/** Вариативность текста без переспама ключами (снижение риска doorway/шаблона) */
function variantIndex(slug, mod) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % mod;
}

const SLA_SHORT = 'Часто по Москве 20–40 мин от подтверждения; в пик до ~60 мин — предупредим заранее.';
const SLA_LONG =
  'По Москве во многих заказах получается уложиться в 20–40 минут после подтверждения. В часы пик, ночью или при сложной погоде время может увеличиться — оператор назовёт честное окно, без обещаний «ровно за 15 минут всем».';

const YANDEX_GEO_META = `<meta name="geo.region" content="RU-MOW">
  <meta name="geo.placename" content="Москва">
  <meta name="geo.position" content="55.755826;37.617300">
  <meta name="ICBM" content="55.755826, 37.617300">`;

function raionIntro(name, slug) {
  const v = variantIndex(slug, 4);
  const n = escapeHtml(name);
  const parts = [
    `Если вы живёте или гостите в районе ${n}, заказать алкоголь и закуски можно без поездки в магазин: соберём корзину по телефону или в чате и привезём к подъезду.`,
    `Район ${n} входит в зону доставки АЛКОдоставка по Москве. Позвоните или напишите в мессенджер — подберём напитки под бюджет и подскажем, сколько ждать курьера с учётом пробок.`,
    `Для ${n} действуют общие правила сервиса: приём заявок 24/7, оплата при получении (наличные или СБП), передача заказа только лицам 18+.`,
    `На странице собрана информация для жителей и гостей района ${n}: как связаться, какие ориентиры по времени и стоимости, куда перейти за каталогом и ночной доставкой.`,
  ];
  return parts[v];
}

function metroIntro(name, lineName, slug) {
  const v = variantIndex(slug, 3);
  const n = escapeHtml(name);
  const line = lineName ? ` Рядом ветка «${escapeHtml(lineName)}».` : '';
  const parts = [
    `Станция «${n}» — удобная точка для заказа: назовите выход и подъезд, курьер приедет в согласованное время.${line}`,
    `Заказ у метро «${n}» оформляется так же, как и по любому адресу в Москве: звонок или чат, согласование состава и времени.${line}`,
    `Если вы выходите на «${n}», не обязательно идти в магазин — привезём алкоголь и закуски к дому или к офису рядом со станцией.${line}`,
  ];
  return parts[v];
}

function pickRotated(entries, seed, count, excludeSlug) {
  const pool = excludeSlug ? entries.filter((x) => x.slug !== excludeSlug) : entries.slice();
  if (!pool.length) return [];
  const start = variantIndex(seed, pool.length);
  const out = [];
  for (let i = 0; i < count && i < pool.length; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

function dropdownCategoriesLinks() {
  const links = KATEGORII.map(
    (k) => `<a href="/kategoria/${k.slug}/">${escapeHtml(k.name)}</a>`,
  ).join('\n');
  return `${links}\n<a href="/catalog.html">Полный каталог</a>`;
}

function internalLinksSection({ metros = [], raions = [], extraLine = '' }) {
  const metroLine = metros.length
    ? metros.map((m) => `<a href="/metro/${m.slug}/">${escapeHtml(m.name)}</a>`).join(' · ')
    : '<a href="/metro/">Станции метро</a>';
  const raionLine = raions.length
    ? raions.map((r) => `<a href="/raion/${r.slug}/">${escapeHtml(r.name)}</a>`).join(' · ')
    : '<a href="/rayony.html">Районы</a>';
  const cats =
    '<a href="/kategoria/vodka/">Водка</a> · <a href="/kategoria/vino/">Вино</a> · <a href="/kategoria/pivo/">Пиво</a>';
  const withThat = '<a href="/kategoria/zakuski/">Закуски</a> · <a href="/kategoria/igristoe/">Игристое</a>';
  const scen =
    '<a href="/povod/srochno/">Срочно</a> · <a href="/povod/nocheyu/">Ночью</a> · <a href="/povod/premium/">Премиум</a> · <a href="/povod/deshevo/">Недорого</a> · <a href="/povod/afterparty/">Afterparty</a> · <a href="/povod/novyj-god/">Новый год</a>';
  const fq =
    '<a href="/vopros/vremya-dostavki-moskva/">Срок доставки</a> · <a href="/vopros/minimalnaya-summa-zakaza/">Минимальная сумма</a> · <a href="/vopros/oplata-nalichnye-sbp/">Оплата</a> · <a href="/faq.html">FAQ</a>';
  const faqJump =
    '<a href="/faq.html#faq-zakaz">как заказать</a> · <a href="/faq.html#faq-noch">ночью</a> · <a href="/faq.html#faq-geo">районы</a> · <a href="/faq.html#faq-summa">сумма</a> · <a href="/faq.html#faq-oplata">оплата</a> · <a href="/faq.html#faq-18">18+</a>';
  const brandsLine =
    '<a href="/catalog.html">Каталог с примерами позиций</a> · <a href="/kategoria/viski/">виски</a> · <a href="/kategoria/vodka/">водка</a> · <a href="/kategoria/vino/">вино</a>';
  const extra = extraLine
    ? `<p style="margin-top:16px;font-size:0.92rem;color:#555;line-height:1.5">${extraLine}</p>`
    : '';
  return `<section class="seo-related-block" aria-labelledby="seo-related-h">
    <h2 id="seo-related-h">Дальше по сайту</h2>
    <div class="seo-related-grid">
      <div class="seo-related-card">
        <h3>Часто заказывают у метро</h3>
        <p class="related-links-row">${metroLine}</p>
        <p><a href="/dostavka-nochyu-moskva.html">Ночью 24/7</a> · <a href="/povod/srochno/">Срочно</a> · <a href="/povod/premium/">Премиум</a> · <a href="/povod/deshevo/">Недорого</a> · <a href="/catalog.html">Каталог</a></p>
      </div>
      <div class="seo-related-card">
        <h3>Популярное в заказах</h3>
        <p class="related-links-row">${cats}</p>
        <h4 class="related-sub">С этим часто берут</h4>
        <p class="related-links-row">${withThat}</p>
        <h4 class="related-sub">Бренды и расширенный выбор</h4>
        <p class="related-links-row">${brandsLine}</p>
        <p><a href="/kategoria/">Все категории</a></p>
      </div>
      <div class="seo-related-card">
        <h3>Повод, праздники и наборы</h3>
        <p class="related-links-row">${scen}</p>
        <p><a href="/povod/">Все поводы</a> · <a href="/podarochnye-nabory.html">Подарочные наборы</a> · <a href="/povod/korporativ/">Корпоратив</a></p>
      </div>
      <div class="seo-related-card">
        <h3>FAQ и заказ</h3>
        <p class="related-links-row">${fq}</p>
        <h4 class="related-sub">Перейти к ответу</h4>
        <p class="related-links-row">${faqJump}</p>
        <p><a href="/vopros/">Раздел «Вопросы»</a> · <a href="/contacts.html">Контакты и заявка</a></p>
      </div>
      <div class="seo-related-card">
        <h3>Районы рядом</h3>
        <p class="related-links-row">${raionLine}</p>
        <p><a href="/rayony.html">Все районы</a> · <a href="/dostavka-chertanovo.html">Чертаново</a> · <a href="/dostavka-butovo.html">Бутово</a></p>
      </div>
    </div>
    ${extra}
    <div class="recent-pages-widget" data-recent-widget data-label="Вы недавно смотрели" hidden></div>
  </section>`;
}

function navQuickCats() {
  return KATEGORII.map(
    (k) => `<a href="/kategoria/${k.slug}/">${escapeHtml(k.name)}</a>`,
  ).join('\n');
}

/** Премиум mobile-only меню: секции + перелинковка (desktop скрыт в CSS) */
function mobileNavPremiumBlock() {
  const cats = navQuickCats();
  return `<div class="nav-mobile-premium">
      <p class="nav-mp-kicker">Меню</p>
      <section class="nav-mp-section" aria-label="Каталог">
        <h3 class="nav-mp-heading">Каталог</h3>
        <a href="/catalog.html" class="nav-mp-row nav-mp-row--lead">Ассортимент</a>
        <a href="/kategoria/" class="nav-mp-row">Все категории</a>
        <div class="nav-mp-grid">${cats}</div>
      </section>
      <section class="nav-mp-section" aria-label="Доставка">
        <h3 class="nav-mp-heading">Доставка</h3>
        <a href="/rayony.html" class="nav-mp-row">По районам Москвы</a>
        <a href="/metro/" class="nav-mp-row">У станций метро</a>
        <a href="/dostavka-chertanovo.html" class="nav-mp-row">Чертаново</a>
        <a href="/dostavka-butovo.html" class="nav-mp-row">Бутово</a>
        <p class="nav-mp-micro">Часто ищут метро</p>
        <div class="nav-mp-chips">
          <a href="/metro/kievskaya/">Киевская</a>
          <a href="/metro/taganskaya/">Таганская</a>
          <a href="/metro/marino/">Марьино</a>
          <a href="/metro/vyhino/">Выхино</a>
          <a href="/metro/belorusskaya/">Белорусская</a>
          <a href="/metro/chertanovskaya/">Чертановская</a>
        </div>
      </section>
      <section class="nav-mp-section" aria-label="Популярное">
        <h3 class="nav-mp-heading">Акции и поводы</h3>
        <a href="/povod/srochno/" class="nav-mp-row">Срочная доставка</a>
        <a href="/povod/premium/" class="nav-mp-row">Премиум</a>
        <a href="/povod/deshevo/" class="nav-mp-row">Недорого</a>
        <a href="/podarochnye-nabory.html" class="nav-mp-row">Подарочные наборы</a>
        <a href="/dostavka-nochyu-moskva.html" class="nav-mp-row">Ночью 24/7</a>
      </section>
      <section class="nav-mp-section" aria-label="Помощь">
        <h3 class="nav-mp-heading">Помощь</h3>
        <a href="/faq.html" class="nav-mp-row">FAQ</a>
        <a href="/vopros/" class="nav-mp-row">Вопросы и ответы</a>
        <a href="/contacts.html" class="nav-mp-row">Контакты</a>
        <a href="/" class="nav-mp-row">Главная</a>
      </section>
      <section class="nav-mp-section nav-mp-section--cta" aria-label="Заказ">
        <a href="tel:${CALL_TEL}" class="nav-mp-btn nav-mp-btn--call">Позвонить</a>
        <a href="https://wa.me/${WA_PHONE}?text=${WA_PREFILL}" class="nav-mp-btn nav-mp-btn--wa" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://t.me/alkotaxi_bot" class="nav-mp-btn nav-mp-btn--tg" target="_blank" rel="noopener">Telegram</a>
        <button type="button" class="nav-mp-btn nav-mp-btn--form js-oneclick-open">Заказать за 1 клик</button>
      </section>
    </div>`;
}

function cartHeaderHtml() {
  return `<button type="button" class="header-cart-btn" id="site-cart-btn" aria-label="Корзина">
      <span class="header-cart-icon" aria-hidden="true">🛒</span>
      <span class="header-cart-label cart-btn-label">Корзина</span>
      <span class="cart-count" id="cart-count">0</span>
    </button>`;
}

function cartPanelHtml() {
  return CART_PANEL_HTML;
}

function headerBlock(activeNav) {
  const a = (key) => (activeNav === key ? ' active' : '');
  return `<div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>
<header class="header site-header">
  <div class="header-mobile-callbar" aria-label="Звонок, приём 24/7, только 18+">
    <div class="mobile-callbar-left">
      <span class="mobile-callbar-pill">Приём 24/7</span>
      <span class="mobile-callbar-age">18+</span>
    </div>
    <div class="mobile-callbar-right">
      <a href="tel:${CALL_TEL}" class="mobile-callbar-tel"><span class="mobile-callbar-icon" aria-hidden="true">☎</span><span class="mobile-callbar-num">${CALL_DISPLAY}</span></a>
    </div>
  </div>
  <div class="header-commercial-strip">
    <div class="container header-commercial-inner">
      <span class="strip-item"><strong>Москва</strong> и МО</span>
      <span class="strip-item">Приём <strong>24/7</strong></span>
      <span class="strip-item">Часто <strong>20–40 мин</strong></span>
      <span class="strip-item">Заказ от <strong>1000 ₽</strong></span>
      <span class="strip-item">МКАД от <strong>650 ₽</strong></span>
      <span class="strip-item strip-18"><strong>18+</strong></span>
      <span class="strip-item strip-trust">Повторные заказы и отзывы — в мессенджере после доставки; без навязанных «звёзд» на сайте</span>
    </div>
  </div>
  <div class="container header-main-row">
    <a href="/" class="logo">АЛКОдоставка</a>
    <div class="nav-backdrop" id="nav-backdrop" hidden aria-hidden="true"></div>
    <nav class="main-nav" id="site-nav" aria-label="Основное меню">
      <div class="nav-inner-scroll">
        <ul class="nav-list-main nav-desktop-only">
          <li><a href="/" class="nav-link${a('home')}">Главная</a></li>
          <li><a href="/catalog.html" class="nav-link${a('cat')}">Ассортимент</a></li>
          <li><a href="/rayony.html" class="nav-link${a('rayony')}">Районы</a></li>
          <li><a href="/metro/" class="nav-link${a('metro')}">Метро</a></li>
          <li class="has-dropdown">
            <a href="/kategoria/" class="nav-link nav-link-dropdown${a('kat')}">Категории</a>
            <div class="dropdown-mega">${dropdownCategoriesLinks()}</div>
          </li>
          <li><a href="/povod/" class="nav-link${a('povod')}">Повод</a></li>
          <li><a href="/dostavka-nochyu-moskva.html" class="nav-link${a('night')}">Ночью 24/7</a></li>
          <li><a href="/faq.html" class="nav-link${a('faq')}">FAQ</a></li>
          <li><a href="/contacts.html" class="nav-link${a('contacts')}">Контакты</a></li>
        </ul>
        ${mobileNavPremiumBlock()}
      </div>
    </nav>
    <div class="header-phone-promo">
      <span class="badge-247">24/7</span>
      <a href="tel:+79251219972">+7 (925) 121-99-72</a>
      <span class="phone-sub">Часто 20–40 мин · заказ от 1000 ₽ · МКАД от 650 ₽</span>
    </div>
    <div class="header-cta-cluster">
      <a href="tel:${CALL_TEL}" class="btn-header-pill btn-header-call" title="Позвонить">☎ Позвонить</a>
      <a href="https://wa.me/${WA_PHONE}?text=${WA_PREFILL}" class="btn-header-pill btn-header-wa" target="_blank" rel="noopener">WhatsApp</a>
      <a href="https://t.me/alkotaxi_bot" class="btn-header-pill btn-header-tg" target="_blank" rel="noopener">Telegram</a>
      <button type="button" class="btn-header-pill btn-header-1click js-oneclick-open">Заказ 1 клик</button>
    </div>
    ${cartHeaderHtml()}
    <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Открыть меню" aria-expanded="false" aria-controls="site-nav"><span class="burger-line" aria-hidden="true"></span><span class="burger-line" aria-hidden="true"></span><span class="burger-line" aria-hidden="true"></span></button>
  </div>
</header>
${cartPanelHtml()}
<a href="tel:${CALL_TEL}" class="mobile-tel-fab mobile-tel-fab--secondary" title="Позвонить" aria-label="Позвонить в АЛКОдоставка"><span class="visually-hidden">Телефон</span>☎</a>`;
}

function footerHtml() {
  return `<footer class="footer"><div class="container">
    <p>© 2026 АЛКОдоставка. Доставка алкоголя в Москве. <strong>18+</strong></p>
    <p class="footer-phone">Телефон: <a href="tel:${CALL_TEL}">${CALL_DISPLAY}</a></p>
    <p class="footer-links">
      <a href="/">Главная</a> | <a href="/catalog.html">Каталог</a> | <a href="/rayony.html">Районы</a> |
      <a href="/metro/">Метро</a> | <a href="/kategoria/">Категории</a> | <a href="/povod/">Повод</a> |
      <a href="/vopros/">Вопросы</a> | <a href="/faq.html">FAQ</a> | <a href="/contacts.html">Контакты</a> |
      <a href="/privacy.html">Политика</a>
    </p>
  </div></footer>`;
}

function stickyHtml() {
  return `<div class="sticky-cta-bar" role="navigation" aria-label="Быстрый заказ">
    <a href="tel:${CALL_TEL}" class="sticky-cta-item sticky-cta-call">Позвонить</a>
    <a href="https://wa.me/${WA_PHONE}?text=${WA_PREFILL}" class="sticky-cta-item sticky-cta-wa" target="_blank" rel="noopener">WhatsApp</a>
    <a href="https://t.me/alkotaxi_bot" class="sticky-cta-item sticky-cta-tg" target="_blank" rel="noopener">Telegram</a>
    <button type="button" class="sticky-cta-item sticky-cta-form js-oneclick-open">Заявка</button>
  </div>`;
}

function metrikaHtml() {
  return `<script>
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++)if(document.scripts[j].src===r)return;
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=107712343','ym');
ym(107712343,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/107712343" style="position:absolute;left:-9999px" width="1" height="1" alt=""/></div></noscript>`;
}

function wrapPage({ title, description, canonicalPath, jsonLd, bodyMain, activeNav = '' }) {
  const canonical = `${BASE}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${YANDEX_GEO_META}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${BASE}/favicon.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" href="/style.css" as="style">
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://mc.yandex.ru" crossorigin>
  ${jsonLd ? `<script type="application/ld+json">\n${jsonLd}\n</script>` : ''}
</head>
<body>
  ${headerBlock(activeNav)}
  ${bodyMain}
  ${footerHtml()}
  ${stickyHtml()}
  ${metrikaHtml()}
  ${ONECLICK_MODAL_HTML}
  <script src="/script.js" defer></script>
</body>
</html>`;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function parseMetroLine(line) {
  const [name, ln] = line.split('|').map((x) => x.trim());
  return { name, line: ln || '' };
}

function main() {
  const dirs = ['raion', 'metro', 'kategoria', 'povod', 'vopros'];
  for (const d of dirs) {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true });
  }

  const sitemapUrls = new Set();
  const addUrl = (loc, priority, changefreq) => {
    sitemapUrls.add(JSON.stringify({ loc, priority, changefreq }));
  };

  const staticPages = [
    ['/', '1.0', 'weekly'],
    ['/catalog.html', '0.9', 'weekly'],
    ['/contacts.html', '0.9', 'monthly'],
    ['/dostavka-nochyu-moskva.html', '0.95', 'weekly'],
    ['/rayony.html', '0.9', 'weekly'],
    ['/dostavka-chertanovo.html', '0.85', 'monthly'],
    ['/dostavka-butovo.html', '0.85', 'monthly'],
    ['/povod/korporativ/', '0.8', 'monthly'],
    ['/podarochnye-nabory.html', '0.8', 'monthly'],
    ['/faq.html', '0.85', 'monthly'],
    ['/privacy.html', '0.4', 'yearly'],
  ];
  staticPages.forEach(([loc, pr, ch]) => addUrl(BASE + loc, pr, ch));

  /** Районы */
  const raionNames = [...new Set(readLines('data/raions.txt'))];
  const raionEntries = [];
  for (const name of raionNames) {
    const slug = slugify(name);
    if (!slug || SKIP_RAION.has(slug)) continue;
    if (raionEntries.some((e) => e.slug === slug)) continue;
    raionEntries.push({ name, slug });
  }

  const metroLines = readLines('data/metro-stations.txt');
  const metroSeen = new Set();
  const metroEntries = [];
  for (const line of metroLines) {
    const { name, line: lineName } = parseMetroLine(line);
    if (!name) continue;
    const mslug = slugify(name);
    if (!mslug || metroSeen.has(mslug)) continue;
    metroSeen.add(mslug);
    metroEntries.push({ name, slug: mslug, lineName });
  }

  for (const { name, slug } of raionEntries) {
    const p = `/raion/${slug}/`;
    const title = `Доставка алкоголя ${name}, Москва — 24/7, часто 20–40 мин | 18+`;
    const description = `${name}, Москва: алкоголь и закуски на дом. ${SLA_SHORT} Заказ от 1000 ₽, доставка МКАД от 650 ₽, ночью 24/7. ${SEO_CONTACT}. 18+.`;
    const others = raionEntries.filter((e) => e.slug !== slug);
    const related = pickRotated(others, slug, 3).map((e) => `<a href="/raion/${e.slug}/">${escapeHtml(e.name)}</a>`).join(' · ');
    const metroPick = pickRotated(metroEntries, slug + 'mx', 4);
    const raionPick = pickRotated(others, slug + 'rx', 4);
    const intro = raionIntro(name, slug);
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Доставка алкоголя в районе ${name}, Москва`,
      url: BASE + p,
      inLanguage: 'ru-RU',
      description: description.slice(0, 200),
      about: {
        '@type': 'Service',
        name: 'Доставка алкоголя на дом',
        areaServed: { '@type': 'Place', name: `${name}, Москва` },
      },
    });
    const body = `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <a href="/rayony.html">Районы</a> · <span>${escapeHtml(name)}</span></nav>
      <h1>Доставка алкоголя в район ${escapeHtml(name)}</h1>
      <p class="section-subtitle">${intro} ${SLA_LONG}</p>
      <div class="hero-buttons" style="margin:20px 0">
        <a href="tel:${CALL_TEL}" class="btn btn-large">Позвонить</a>
        <a href="/contacts.html" class="btn btn-large btn-outline">Заявка на сайте</a>
        <a href="/catalog.html" class="btn btn-large btn-outline">Каталог</a>
      </div>
      <div class="seo-block">
        <h2>Как заказать</h2>
        <p>Сообщите адрес в ${escapeHtml(name)}, состав заказа и удобную оплату (наличные или СБП). Доставка в пределах МКАД от 650 ₽, минимальная сумма от 1000 ₽ — финальные цифры фиксируем при подтверждении.</p>
        <h2>Соседние районы</h2>
        <p>${related || '<a href="/rayony.html">Все районы</a>'}</p>
        <p><a href="/metro/">Станции метро</a> · <a href="/dostavka-nochyu-moskva.html">Ночью</a> · <a href="/kategoria/">Категории</a> · <a href="/vopros/">Вопросы</a></p>
        <h2>Коротко</h2>
        <div class="faq-item"><h3>Это отдельный магазин в районе?</h3><p>Нет, это страница сервиса доставки: заказ принимается централизованно, маршрут строит логистика.</p></div>
        <div class="faq-item"><h3>Нужен ли паспорт?</h3><p>Да, при необходимости — передача только 18+.</p></div>
        <div class="legal-box"><strong>18+</strong> Умеренное потребление. Алкоголь не передаётся несовершеннолетним.</div>
      </div>
      ${internalLinksSection({ metros: metroPick, raions: raionPick })}
    </main>`;
    writeFile(path.join(ROOT, 'raion', slug, 'index.html'), wrapPage({ title, description, canonicalPath: p, jsonLd, bodyMain: body, activeNav: 'rayony' }));
    addUrl(BASE + p, '0.82', 'monthly');
  }

  /** Метро */
  for (const { name, slug, lineName } of metroEntries) {
    const p = `/metro/${slug}/`;
    const lineBit = lineName ? ` Линия: ${lineName}.` : '';
    const title = `Доставка алкоголя у метро «${name}», Москва — 24/7, часто 20–40 мин | 18+`;
    const description = `У метро «${name}» в Москве: алкоголь и закуски.${lineBit} ${SLA_SHORT} Заказ от 1000 ₽, МКАД от 650 ₽, ночью 24/7. ${SEO_CONTACT}. 18+.`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Доставка алкоголя у метро ${name}`,
      url: BASE + p,
      about: { '@type': 'Place', name: `Метро ${name}, Москва` },
    });
    const near = pickRotated(
      metroEntries.filter((e) => e.slug !== slug),
      slug + 'near',
      4,
    );
    const nearL = near.map((e) => `<a href="/metro/${e.slug}/">${escapeHtml(e.name)}</a>`).join(' · ');
    const raionPick = pickRotated(raionEntries, slug + 'rb', 4);
    const mIntro = metroIntro(name, lineName, slug);
    const body = `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <a href="/metro/">Метро</a> · <span>${escapeHtml(name)}</span></nav>
      <h1>Доставка алкоголя у метро ${escapeHtml(name)}</h1>
      <p class="section-subtitle">${mIntro} ${SLA_LONG}</p>
      <div class="hero-buttons" style="margin:20px 0">
        <a href="tel:${CALL_TEL}" class="btn btn-large">Заказать</a>
        <a href="/catalog.html" class="btn btn-large btn-outline">Каталог</a>
      </div>
      <div class="seo-block">
        <p>Назовите выход и ориентир у подъезда — курьер передаст заказ лично. <strong>Только 18+.</strong> Оплата: наличные или СБП.</p>
        <h2>Рядом по городу</h2>
        <p>${nearL}</p>
        <p><a href="/rayony.html">Районы</a> · <a href="/metro/">Все станции</a> · <a href="/dostavka-nochyu-moskva.html">Ночью</a> · <a href="/povod/srochno/">Срочно</a> · <a href="/povod/premium/">Премиум</a> · <a href="/povod/deshevo/">Недорого</a></p>
        <div class="legal-box"><strong>18+</strong></div>
      </div>
      ${internalLinksSection({
        metros: near,
        raions: raionPick,
        extraLine:
          'Связь без ожидания: <a href="tel:' +
          CALL_TEL +
          '">позвонить</a> или <a href="/contacts.html">форма заявки</a>.',
      })}
    </main>`;
    writeFile(path.join(ROOT, 'metro', slug, 'index.html'), wrapPage({ title, description, canonicalPath: p, jsonLd, bodyMain: body, activeNav: 'metro' }));
    addUrl(BASE + p, '0.8', 'monthly');
  }

  /** Категории */
  for (const k of KATEGORII) {
    const p = `/kategoria/${k.slug}/`;
    const title = `${k.name} с доставкой, Москва 24/7 — часто 20–40 мин | 18+`;
    const description = `${k.name} на дом по Москве: ${k.hint}. ${SLA_SHORT} Заказ от 1000 ₽, доставка МКАД от 650 ₽, ночью. ${SEO_CONTACT}. 18+.`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      url: BASE + p,
    });
    const metroPick = pickRotated(metroEntries, k.slug + 'kx', 4);
    const raionPick = pickRotated(raionEntries, k.slug + 'kr', 4);
    const body = `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <a href="/kategoria/">Категории</a> · <span>${escapeHtml(k.name)}</span></nav>
      <h1>${escapeHtml(k.name)} с доставкой по Москве</h1>
      <p class="section-subtitle">${escapeHtml(k.hint)}. Подберём позиции под бюджет: звонок или WhatsApp — менеджер предложит варианты по наличию.</p>
      <div class="hero-buttons" style="margin:20px 0">
        <a href="tel:${CALL_TEL}" class="btn btn-large">Позвонить</a>
        <a href="/catalog.html" class="btn btn-large">Смотреть каталог</a>
      </div>
      <div class="seo-block">
        <p>${SLA_LONG}</p>
        <p>Марки и расширенный перечень — в <a href="/catalog.html">каталоге</a> и по звонку; подскажем по наличию. Для праздников: <a href="/podarochnye-nabory.html">подарочные наборы</a>, <a href="/povod/novyj-god/">Новый год</a>.</p>
        <p><a href="/rayony.html">Районы</a> · <a href="/metro/">Метро</a> · <a href="/dostavka-nochyu-moskva.html">Ночью</a> · <a href="/povod/">Повод</a> · <a href="/faq.html">FAQ</a></p>
        <div class="legal-box"><strong>18+</strong> Передача только совершеннолетним.</div>
      </div>
      ${internalLinksSection({
        metros: metroPick,
        raions: raionPick,
        extraLine:
          'Праздники и офис: <a href="/povod/novyj-god/">Новый год</a>, <a href="/povod/korporativ/">корпоратив</a>, <a href="/podarochnye-nabory.html">подарки</a>.',
      })}
    </main>`;
    writeFile(path.join(ROOT, 'kategoria', k.slug, 'index.html'), wrapPage({ title, description, canonicalPath: p, jsonLd, bodyMain: body, activeNav: 'kat' }));
    addUrl(BASE + p, '0.88', 'weekly');
  }

  /** Поводы */
  for (const pv of POVODY) {
    const p = `/povod/${pv.slug}/`;
    const title = `Алкоголь на ${pv.name}, Москва 24/7 — 20–40 мин | 18+`;
    const description = `${pv.name}, Москва: ${pv.kw || pv.hint || 'доставка алкоголя'}. ${SLA_SHORT} Заказ от 1000 ₽, МКАД от 650 ₽, ночью. ${SEO_CONTACT}. 18+.`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url: BASE + p,
    });
    const metroPick = pickRotated(metroEntries, pv.slug + 'px', 4);
    const raionPick = pickRotated(raionEntries, pv.slug + 'pr', 4);
    const extraPremium =
      pv.slug === 'premium'
        ? 'Премиум-линейку логично дополнить <a href="/podarochnye-nabory.html">подарочными наборами</a> и <a href="/kategoria/igristoe/">игристым</a>.'
        : pv.slug === 'novyj-god' || pv.slug === '8-marta'
          ? 'К празднику: <a href="/podarochnye-nabory.html">наборы</a>, <a href="/kategoria/igristoe/">игристое</a>, <a href="/kategoria/vino/">вино</a>.'
          : '';
    const body = `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <a href="/povod/">Повод</a> · <span>${escapeHtml(pv.name)}</span></nav>
      <h1>Алкоголь на ${escapeHtml(pv.name)} с доставкой</h1>
      <p class="section-subtitle">Соберём корзину под ваш сценарий: от бюджетных позиций до премиум-сегмента. ${SLA_LONG} Ночью и в праздники — как обычно, без отдельной «ночной наценки» в ущерб честности (финальную цену скажет оператор).</p>
      <div class="hero-buttons" style="margin:20px 0">
        <a href="tel:${CALL_TEL}" class="btn btn-large">Обсудить заказ</a>
        <a href="/podarochnye-nabory.html" class="btn btn-large btn-outline">Подарочные наборы</a>
      </div>
      <div class="seo-block">
        <p><a href="/kategoria/">Категории</a> · <a href="/povod/korporativ/">Корпоратив</a> · <a href="/faq.html">FAQ</a> · <a href="/contacts.html">Контакты</a> · <a href="/catalog.html">Каталог</a></p>
        <div class="legal-box"><strong>18+</strong> Умеренное потребление. Не продаём несовершеннолетним.</div>
      </div>
      ${internalLinksSection({ metros: metroPick, raions: raionPick, extraLine: extraPremium })}
    </main>`;
    writeFile(path.join(ROOT, 'povod', pv.slug, 'index.html'), wrapPage({ title, description, canonicalPath: p, jsonLd, bodyMain: body, activeNav: 'povod' }));
    addUrl(BASE + p, '0.83', 'monthly');
  }

  /** FAQ intent pages */
  for (const v of VOPROSY) {
    const p = `/vopros/${v.slug}/`;
    const title = `${v.q} — Москва 24/7, 20–40 мин | АЛКОдоставка`;
    const description = `${v.a.slice(0, 100)}… ${SLA_SHORT} ${SEO_CONTACT}. 18+.`;
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: v.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: v.a,
          },
        },
      ],
    });
    const metroPick = pickRotated(metroEntries, v.slug + 'vx', 3);
    const raionPick = pickRotated(raionEntries, v.slug + 'vr', 3);
    const body = `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <a href="/vopros/">Вопросы</a> · <span>Вопрос</span></nav>
      <h1>${escapeHtml(v.q)}</h1>
      <div class="seo-block">
        <p class="lead-answer">${escapeHtml(v.a)}</p>
        <p>Если ситуация нестандартная (корпоратив, МО, очень крупный заказ), <a href="tel:${CALL_TEL}">позвоните</a> — подстроим условия.</p>
        <p><a href="/faq.html">Общий FAQ</a> · <a href="/contacts.html">Контакты</a> · <a href="/dostavka-nochyu-moskva.html">Ночью</a> · <a href="/catalog.html">Каталог</a> · <a href="/rayony.html">Районы</a></p>
        <div class="legal-box"><strong>18+</strong></div>
      </div>
      ${internalLinksSection({
        metros: metroPick,
        raions: raionPick,
        extraLine: 'Оформить заказ: <a href="/contacts.html">заявка на сайте</a> или <a href="https://wa.me/' + WA_PHONE + '">WhatsApp</a>.',
      })}
    </main>`;
    writeFile(path.join(ROOT, 'vopros', v.slug, 'index.html'), wrapPage({ title, description, canonicalPath: p, jsonLd, bodyMain: body, activeNav: 'faq' }));
    addUrl(BASE + p, '0.75', 'monthly');
  }

  /** Хаб метро */
  const metroHubLinks = metroEntries
    .map((e) => `<a href="/metro/${e.slug}/">${escapeHtml(e.name)}</a>`)
    .join('\n');
  const hubMetroPick = pickRotated(metroEntries, 'hubm1', 5);
  const hubRaionPick = pickRotated(raionEntries, 'hubr1', 5);
  const metroHubBody = `<main class="container" style="padding:40px 20px 60px">
    <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <span>Метро</span></nav>
    <h1>Доставка алкоголя у метро Москвы</h1>
    <p class="section-subtitle">Выберите станцию — контекст, сроки и заказ в пару кликов. <a href="/dostavka-nochyu-moskva.html">Ночью 24/7</a>, <a href="/povod/srochno/">срочно</a>, <a href="/catalog.html">каталог</a>. <strong>18+</strong></p>
    <div class="landing-links">${metroHubLinks}</div>
    <p><a href="/rayony.html">По районам</a> · <a href="/kategoria/">Категории</a> · <a href="/faq.html">FAQ</a> · <a href="/">На главную</a></p>
    ${internalLinksSection({ metros: hubMetroPick, raions: hubRaionPick })}
  </main>`;
  writeFile(
    path.join(ROOT, 'metro', 'index.html'),
    wrapPage({
      title: 'Доставка алкоголя у метро Москвы 24/7 — 20–40 мин | 18+',
      description: `Все станции: алкоголь и закуски. ${SLA_SHORT} Заказ от 1000 ₽, МКАД от 650 ₽, ночью. ${SEO_CONTACT}. 18+.`,
      canonicalPath: '/metro/',
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Метро Москвы',
        url: BASE + '/metro/',
      }),
      bodyMain: metroHubBody,
      activeNav: 'metro',
    }),
  );
  addUrl(BASE + '/metro/', '0.9', 'weekly');

  /** Хаб категорий */
  const katHub = KATEGORII.map((k) => `<a href="/kategoria/${k.slug}/">${escapeHtml(k.name)}</a>`).join('\n');
  const hubM2 = pickRotated(metroEntries, 'hubm2', 4);
  const hubR2 = pickRotated(raionEntries, 'hubr2', 4);
  writeFile(
    path.join(ROOT, 'kategoria', 'index.html'),
    wrapPage({
      title: 'Категории алкоголя с доставкой Москва 24/7 — 20–40 мин | 18+',
      description:
        'Водка, виски, вино, пиво, игристое и закуски с доставкой по Москве. ' +
        SLA_SHORT +
        ' ' +
        SEO_CONTACT +
        '. 18+.',
      canonicalPath: '/kategoria/',
      bodyMain: `<main class="container" style="padding:40px 20px 60px">
        <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <span>Категории</span></nav>
        <h1>Категории алкоголя с доставкой</h1>
        <p class="section-subtitle"><a href="/catalog.html">Полный каталог</a> · <a href="/metro/">метро</a> · <a href="/rayony.html">районы</a> · <a href="/faq.html">FAQ</a></p>
        <div class="landing-links">${katHub}</div>
        <p><a href="/catalog.html">Открыть каталог</a> · <a href="/dostavka-nochyu-moskva.html">ночью</a></p>
        ${internalLinksSection({ metros: hubM2, raions: hubR2 })}
      </main>`,
      activeNav: 'kat',
    }),
  );
  addUrl(BASE + '/kategoria/', '0.88', 'weekly');

  /** Хаб поводов */
  const povHub = POVODY.map((p) => `<a href="/povod/${p.slug}/">${escapeHtml(p.name)}</a>`).join('\n');
  const hubM3 = pickRotated(metroEntries, 'hubm3', 4);
  const hubR3 = pickRotated(raionEntries, 'hubr3', 4);
  writeFile(
    path.join(ROOT, 'povod', 'index.html'),
    wrapPage({
      title: 'Алкоголь на праздник и событие, Москва 24/7 — 20–40 мин | 18+',
      description:
        'Новый год, день рождения, корпоратив, срочно, ночью, премиум и недорого. ' +
        SLA_SHORT +
        ' ' +
        SEO_CONTACT +
        '. 18+.',
      canonicalPath: '/povod/',
      bodyMain: `<main class="container" style="padding:40px 20px 60px">
        <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <span>Повод</span></nav>
        <h1>Алкоголь с доставкой на повод</h1>
        <p class="section-subtitle"><a href="/podarochnye-nabory.html">Подарочные наборы</a> · <a href="/povod/korporativ/">корпоратив</a> · <a href="/faq.html">FAQ</a></p>
        <div class="landing-links">${povHub}</div>
        ${internalLinksSection({ metros: hubM3, raions: hubR3 })}
      </main>`,
      activeNav: 'povod',
    }),
  );
  addUrl(BASE + '/povod/', '0.85', 'monthly');

  /** Хаб вопросов */
  const vopHub = VOPROSY.map((v) => `<a href="/vopros/${v.slug}/">${escapeHtml(v.q)}</a>`).join('\n');
  const hubM4 = pickRotated(metroEntries, 'hubm4', 4);
  const hubR4 = pickRotated(raionEntries, 'hubr4', 4);
  writeFile(
    path.join(ROOT, 'vopros', 'index.html'),
    wrapPage({
      title: 'Вопросы о доставке алкоголя Москва 24/7 | АЛКОдоставка',
      description: 'Ответы по срокам, сумме, оплате и ночной доставке. ' + SLA_SHORT + ' ' + SEO_CONTACT + '. 18+.',
      canonicalPath: '/vopros/',
      bodyMain: `<main class="container" style="padding:40px 20px 60px">
        <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <span>Вопросы</span></nav>
        <h1>Вопросы о доставке</h1>
        <p class="section-subtitle"><a href="/faq.html">Общий FAQ</a> · <a href="/contacts.html">контакты</a> · <a href="/catalog.html">каталог</a></p>
        <div class="landing-links">${vopHub}</div>
        ${internalLinksSection({
          metros: hubM4,
          raions: hubR4,
          extraLine: 'Заказ: <a href="/contacts.html">форма заявки</a> · <a href="/dostavka-nochyu-moskva.html">ночью</a> · <a href="/rayony.html">районы</a>.',
        })}
      </main>`,
      activeNav: 'faq',
    }),
  );
  addUrl(BASE + '/vopros/', '0.85', 'monthly');

  /** Обновить rayony.html — сетка на программные raion */
  const raionSample = raionEntries.slice(0, 120);
  const raionGrid = raionSample.map((e) => `<a href="/raion/${e.slug}/">${escapeHtml(e.name)}</a>`).join('\n');
  const hubM5 = pickRotated(metroEntries, 'hubm5', 5);
  const hubR5 = pickRotated(raionEntries, 'hubr5', 5);
  const rayonyPage = wrapPage({
    title: 'Доставка алкоголя по районам Москвы 24/7 — 20–40 мин | 18+',
    description: `Районы Москвы: алкоголь и закуски на дом. ${SLA_SHORT} Заказ от 1000 ₽, МКАД от 650 ₽. ${SEO_CONTACT}. 18+.`,
    canonicalPath: '/rayony.html',
    jsonLd: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Районы Москвы',
      url: BASE + '/rayony.html',
    }),
    bodyMain: `<main class="container" style="padding:40px 20px 60px">
      <nav class="breadcrumb-mini" aria-label="Навигация"><a href="/">Главная</a> · <span>Районы</span></nav>
      <h1>Доставка алкоголя по районам Москвы</h1>
      <p class="section-subtitle">Откройте свой район или позвоните — подскажем время и сумму. <a href="/dostavka-chertanovo.html">Чертаново</a>, <a href="/dostavka-butovo.html">Бутово</a>, <a href="/metro/">метро</a>, <a href="/dostavka-nochyu-moskva.html">ночью 24/7</a>, <a href="/faq.html">FAQ</a>.</p>
      <h2>Районы Москвы</h2>
      <div class="landing-links">${raionGrid}</div>
      ${raionEntries.length > raionSample.length ? `<p>… и другие локации — звоните, доставим по согласованию.</p>` : ''}
      <div class="seo-block"><div class="legal-box"><strong>18+</strong></div></div>
      ${internalLinksSection({ metros: hubM5, raions: hubR5 })}
    </main>`,
    activeNav: 'rayony',
  });
  writeFile(path.join(ROOT, 'rayony.html'), rayonyPage);

  /** sitemap.xml */
  const urls = [...sitemapUrls].map((s) => JSON.parse(s));
  const uniq = new Map();
  for (const u of urls) {
    if (!uniq.has(u.loc)) uniq.set(u.loc, u);
  }
  const sorted = [...uniq.values()].sort((a, b) => a.loc.localeCompare(b.loc));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const u of sorted) {
    xml += `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>\n`;
  }
  xml += '</urlset>';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');

  /** Удалить дубль metro-chertanovskaya.html — теперь /metro/chertanovskaya/ */
  const oldMetro = path.join(ROOT, 'metro-chertanovskaya.html');
  if (fs.existsSync(oldMetro)) fs.unlinkSync(oldMetro);

  const genCount =
    raionEntries.length + metroEntries.length + KATEGORII.length + POVODY.length + VOPROSY.length + 4;
  console.log('SEO generate OK');
  console.log('  raion:', raionEntries.length);
  console.log('  metro:', metroEntries.length);
  console.log('  kategoria:', KATEGORII.length);
  console.log('  povod:', POVODY.length);
  console.log('  vopros:', VOPROSY.length);
  console.log('  hubs: metro, kategoria, povod, vopros');
  console.log('  total new content pages ~', genCount);
}

main();
