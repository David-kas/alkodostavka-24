/**
 * Каталог: фильтр, карточки, таймер акции, cross-sell.
 * Подключается только на catalog.html (не грузится на главной).
 */
(function () {
    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatPrice(n) {
        return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽';
    }

    function buildCardHtml(p) {
        var inStock = p.inStock !== false;
        var stockClass = inStock ? '' : ' product-card--out-of-stock';
        var stockAttr = inStock ? 'true' : 'false';
        var overlay = inStock
            ? ''
            : '\n                        <span class="product-stock-overlay" aria-hidden="true">Нет в наличии</span>';
        var imgSrc = escapeHtml(p.image || 'images/placeholder.jpg');
        var alt = escapeHtml(p.alt || p.name);
        var name = escapeHtml(p.name);
        var desc = escapeHtml(p.desc || 'Доставка по Москве 24/7.');
        var price = formatPrice(p.price);
        var cat = escapeHtml(p.category || 'strong');
        var id = escapeHtml(p.id || '');

        return (
            '                <div class="product-card' +
            stockClass +
            '" data-category="' +
            cat +
            '" data-product-id="' +
            id +
            '" data-in-stock="' +
            stockAttr +
            '">\n' +
            '                    <div class="product-image image-wrap" data-watermark>\n' +
            '                        <img loading="lazy" decoding="async" src="' +
            imgSrc +
            '" alt="' +
            alt +
            '">' +
            overlay +
            '\n' +
            '                    </div>\n' +
            '                    <h3>' +
            name +
            '</h3>\n' +
            '                    <p class="product-desc">' +
            desc +
            '</p>\n' +
            '                    <span class="product-price">' +
            price +
            '</span>\n' +
            '                </div>'
        );
    }

    function hydrateGrid() {
        var grid = document.querySelector('.catalog-grid');
        if (!grid) return Promise.resolve(false);
        return fetch('/api/catalog', { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) return false;
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.products || !data.products.length) return false;
                grid.innerHTML = data.products.map(buildCardHtml).join('\n');
                return true;
            })
            .catch(function () {
                return false;
            });
    }

    function whenCoreReady(fn) {
        function run() {
            if (window.alkoAddToCart && window.alkoParsePrice) {
                Promise.resolve(fn()).catch(function () {});
                return;
            }
            window.setTimeout(run, 30);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    function initCatalogUi() {
        var addToCart = window.alkoAddToCart;
        var parsePrice = window.alkoParsePrice;
        var openOneClickModal = window.alkoOpenOneClickModal;
        if (!addToCart || !parsePrice) return;

        var categoryBtns = document.querySelectorAll('.category-btn');
        var products = document.querySelectorAll('.catalog-grid .product-card');
        if (categoryBtns.length && products.length) {
            categoryBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    categoryBtns.forEach(function (b) {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    var category = btn.dataset.category;
                    products.forEach(function (product) {
                        product.style.display =
                            category === 'all' || product.dataset.category === category ? 'block' : 'none';
                    });
                });
            });
        }

        products.forEach(function (card) {
            if (card.querySelector('.btn-add-cart')) return;
            if (card.getAttribute('data-in-stock') === 'false' || card.classList.contains('product-card--out-of-stock')) {
                return;
            }
            var nameEl = card.querySelector('h3');
            var priceEl = card.querySelector('.product-price');
            var imgEl = card.querySelector('.product-image img');
            if (!nameEl || !priceEl) return;
            var name = nameEl.textContent.trim();
            var price = parsePrice(priceEl.textContent);
            var image = imgEl ? imgEl.getAttribute('src') || '' : '';

            var actions = document.createElement('div');
            actions.className = 'product-card-actions';

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-add-cart';
            btn.innerHTML = '<span class="btn-add-cart-icon" aria-hidden="true">+</span> В корзину';
            btn.addEventListener('click', function () {
                addToCart(name, price, image);
                btn.classList.add('btn-add-cart--added');
                btn.innerHTML = '<span aria-hidden="true">✓</span> Добавлено';
                window.setTimeout(function () {
                    btn.classList.remove('btn-add-cart--added');
                    btn.innerHTML = '<span class="btn-add-cart-icon" aria-hidden="true">+</span> В корзину';
                }, 1400);
            });

            var quickBtn = document.createElement('button');
            quickBtn.type = 'button';
            quickBtn.className = 'btn-quick-order';
            quickBtn.textContent = '1 клик';
            quickBtn.setAttribute('aria-label', 'Быстрый заказ: ' + name);
            quickBtn.addEventListener('click', function () {
                if (openOneClickModal) openOneClickModal(name);
            });

            actions.appendChild(btn);
            actions.appendChild(quickBtn);
            card.appendChild(actions);
        });

        var timerEl = document.getElementById('promo-countdown');
        if (timerEl) {
            function nextSundayEnd() {
                var now = new Date();
                var end = new Date(now);
                var day = now.getDay();
                var daysUntil = day === 0 ? 0 : 7 - day;
                end.setDate(now.getDate() + daysUntil);
                end.setHours(23, 59, 59, 999);
                if (end <= now) end.setDate(end.getDate() + 7);
                return end;
            }
            var promoEnd = nextSundayEnd();
            function tick() {
                var diff = promoEnd - Date.now();
                if (diff <= 0) {
                    promoEnd = nextSundayEnd();
                    diff = promoEnd - Date.now();
                }
                var d = Math.floor(diff / 86400000);
                var h = Math.floor((diff % 86400000) / 3600000);
                var m = Math.floor((diff % 3600000) / 60000);
                var s = Math.floor((diff % 60000) / 1000);
                timerEl.textContent =
                    (d ? d + 'д ' : '') +
                    String(h).padStart(2, '0') +
                    ':' +
                    String(m).padStart(2, '0') +
                    ':' +
                    String(s).padStart(2, '0');
            }
            tick();
            window.setInterval(tick, 1000);
        }
    }

    whenCoreReady(function () {
        return hydrateGrid().then(function () {
            initCatalogUi();
        });
    });
})();
