/**
 * PageSpeed: async CSS, min assets, отложенная Метрика, catalog.js только в каталоге.
 * Запуск: node scripts/patch-performance.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const ASYNC_CSS = `<link rel="preload" href="/style.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="/style.min.css"></noscript>`;

const DEFER_METRIKA = `<script>
        function loadMetrika(){if(window.__alkoMetrikaLoaded)return;window.__alkoMetrikaLoaded=1;
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();
        for(var j=0;j<document.scripts.length;j++)if(document.scripts[j].src===r)return;
        k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
        })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=107712343','ym');
        ym(107712343,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});}
        if('requestIdleCallback' in window){requestIdleCallback(loadMetrika,{timeout:3500});}
        else{window.addEventListener('load',function(){setTimeout(loadMetrika,1500);});}
    </script>`;

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

let changed = 0;
for (const fp of walk(ROOT)) {
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  const isCatalog = /catalog\.html$/i.test(fp) || fp.endsWith('catalog.html');

  html = html.replace(
    /<link rel="preload" href="\/style\.css" as="style">\s*<link rel="stylesheet" href="\/style\.css">/g,
    ASYNC_CSS,
  );
  html = html.replace(
    /<link rel="preload" href="\/style\.min\.css" as="style">\s*<link rel="stylesheet" href="\/style\.min\.css">/g,
    ASYNC_CSS,
  );
  html = html.replace(/<link rel="stylesheet" href="\/style\.css">/g, ASYNC_CSS);

  html = html.replace(/<script src="\/script\.js" defer><\/script>/g, '<script src="/script.min.js" defer></script>');
  html = html.replace(/<script src="\/script\.min\.js" defer><\/script>\s*<script src="\/script\.catalog\.min\.js" defer><\/script>/g, '<script src="/script.min.js" defer></script>');

  if (isCatalog && !html.includes('script.catalog.min.js')) {
    html = html.replace(
      '<script src="/script.min.js" defer></script>',
      '<script src="/script.min.js" defer></script>\n<script src="/script.catalog.min.js" defer></script>',
    );
  }

  if (html.includes('mc.yandex.ru/metrika/tag.js') && !html.includes('__alkoMetrikaLoaded')) {
    html = html.replace(
      /<script>\s*\(function\s*\(m,\s*e,\s*t,\s*r,\s*i,\s*k,\s*a\)[\s\S]*?ym\(107712343[\s\S]*?<\/script>/,
      DEFER_METRIKA,
    );
  }

  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    changed++;
  }
}

console.log(`patch-performance: updated ${changed} html files`);
