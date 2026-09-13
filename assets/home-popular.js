(() => {
  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }
  function slugify(value) {
    return value.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  }
  function brandOf(name) {
    const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
    return cleaned.split(/\s+/).slice(0, 2).join(" ");
  }
  function photoSrc(p) {
    const raw = p && p.image ? String(p.image) : "";
    const rel = raw ? raw.replace(/^\//, "") : "photo/" + p.id + ".jpg";
    return "/" + rel;
  }
  function pickPopular(pool, count) {
    const byCat = {};
    for (const p of pool) {
      if (!byCat[p.category]) byCat[p.category] = [];
      byCat[p.category].push(p);
    }
    for (const c of Object.keys(byCat)) byCat[c] = shuffle(byCat[c]);
    const cats = shuffle(Object.keys(byCat));
    const out = [];
    let round = 0;
    while (out.length < count) {
      let added = false;
      for (const cat of cats) {
        if (out.length >= count) break;
        const list = byCat[cat];
        if (list[round]) {
          out.push(list[round]);
          added = true;
        }
      }
      if (!added) break;
      round++;
    }
    if (out.length < count) {
      const ids = new Set(out.map(function (p) { return p.id; }));
      const rest = shuffle(pool.filter(function (p) { return !ids.has(p.id); }));
      for (let i = 0; i < rest.length && out.length < count; i++) out.push(rest[i]);
    }
    return shuffle(out);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function card(p) {
    var slug = p.id + "-" + slugify(p.name);
    var img = esc(photoSrc(p));
    var b = esc(brandOf(p.name));
    var name = esc(p.name);
    return '<article class="card" data-brand="' + b + '" data-price="' + p.price + '"><a href="/product/' + slug + '.html" class="thumb"><img loading="lazy" decoding="async" src="' + img + '" alt="' + name + '"></a><h3><a href="/product/' + slug + '.html">' + name + '</a></h3><p class="price">' + p.price + ' ₽</p><button type="button" class="btn add" data-id="' + p.id + '">Добавить в корзину</button></article>';
  }
  function run() {
    var el = document.getElementById("popular-grid");
    var all = window.__PRODUCTS__ || [];
    if (!el || !all.length) return;
    var pool = all.filter(function (p) { return p.inStock; });
    if (!pool.length) return;
    el.innerHTML = pickPopular(pool, 16).map(card).join("");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();