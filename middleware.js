export const config = {
  runtime: 'edge',
};

const NEW_ORIGIN = 'https://alkodastavka.vercel.app';
const OLD_HOSTS = new Set([
  'alkodostavka24.vercel.app',
  'alkodostavka24.online',
]);

export default function middleware(request) {
  const url = new URL(request.url);
  const host = (url.hostname || '').toLowerCase();

  if (OLD_HOSTS.has(host)) {
    const target = new URL(url.pathname + url.search, NEW_ORIGIN);
    return Response.redirect(target.toString(), 301);
  }

  const userAgent = request.headers.get('user-agent') || '';

  // Пропускаем статику и API без проверки
  const staticPathPattern = /^\/(favicon|apple-touch-icon|site\.webmanifest|favicon-.*\.png)/i;
  if (staticPathPattern.test(url.pathname)) {
    return fetch(request);
  }
  if (url.pathname.startsWith('/api/')) {
    return fetch(request);
  }

  // Определяем мобильное устройство
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);

  // Расширенный список ботов (поисковые системы, анализаторы, краулеры)
  const botPattern = new RegExp(
    'Googlebot|Google-InspectionTool|Googlebot-Image|Googlebot-Video|' +
    'AdsBot-Google|Mediapartners-Google|GoogleOther|' +
    'YandexBot|YandexMobileBot|YandexVideo|YandexImages|' +
    'YandexAccessibilityBot|YandexDirect|YandexBlogs|YandexMirrorDetector|' +
    'YandexMedia|YandexWebmaster|YandexCalendar|YandexNews|YandexTurbo|' +
    'Bingbot|Baiduspider|DuckDuckBot|Slurp|' +
    'FacebookBot|Twitterbot|Applebot|' +
    'AhrefsBot|SemrushBot|MJ12bot|DotBot|Yeti|NaverBot|' +
    'Yahoo!\\ Slurp|ia_archiver|rogerbot|exabot|' +
    // Общие маркеры (для любых роботов, не попавших в явный список)
    'spider|crawler|scanner|checker|validator|bot',
    'i'
  );

  const isBot = botPattern.test(userAgent);

  // Блокируем только пользователей с ПК, которые не являются ботами
  if (!isMobile && !isBot) {
    return new Response(
      '<html><body><h1>Доступ с ПК ограничен</h1><p>Сайт открыт только для мобильных устройств.</p></body></html>',
      {
        status: 403,
        headers: { 'content-type': 'text/html' },
      }
    );
  }

  // Пропускаем запрос (мобильные пользователи и все боты)
  return fetch(request);
}
