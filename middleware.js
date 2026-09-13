export const config = {
  runtime: 'edge',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  const staticPathPattern = /^\/(favicon|apple-touch-icon|site\.webmanifest|favicon-.*\.png)/i;
  if (staticPathPattern.test(url.pathname)) return fetch(request);
  if (url.pathname.startsWith('/api/')) return fetch(request);

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent);

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
    'spider|crawler|scanner|checker|validator|bot',
    'i'
  );

  const isBot = botPattern.test(userAgent);

  if (!isMobile && !isBot) {
    return new Response(
      '<html><body><h1>Доступ с ПК ограничен</h1><p>Сайт открыт только для мобильных устройств.</p></body></html>',
      {
        status: 403,
        headers: { 'content-type': 'text/html' },
      }
    );
  }

  return fetch(request);
}
