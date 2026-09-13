document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu-btn');
    const nav = document.getElementById('site-nav') || document.querySelector('.main-nav');
    const backdrop = document.getElementById('nav-backdrop');
    const body = document.body;
    const siteHeader = document.querySelector('.site-header');

    function syncMobileHeaderHeight() {
        if (!siteHeader) return;
        if (headerHeightRaf) cancelAnimationFrame(headerHeightRaf);
        headerHeightRaf = requestAnimationFrame(function () {
            var mq = window.matchMedia('(max-width: 768px)');
            document.documentElement.style.setProperty(
                '--mobile-header-h',
                mq.matches ? siteHeader.offsetHeight + 'px' : '0px',
            );
        });
    }

    var headerHeightRaf = null;
    var resizeTimer = null;
    function onViewportChange() {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
            resizeTimer = null;
            syncMobileHeaderHeight();
            syncNavVisibilityForViewport();
        }, 120);
    }

    syncMobileHeaderHeight();
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange);

    var navTransitionEndHandler = null;
    var navVisibilityFallback = null;

    function syncNavVisibilityForViewport() {
        if (!nav) return;
        if (window.matchMedia('(max-width: 768px)').matches) {
            if (body.classList.contains('nav-open')) {
                nav.style.visibility = 'visible';
                nav.setAttribute('aria-hidden', 'false');
            } else {
                nav.style.visibility = 'hidden';
                nav.setAttribute('aria-hidden', 'true');
            }
        } else {
            body.classList.remove('nav-open');
            body.style.overflow = '';
            if (backdrop) {
                backdrop.hidden = true;
                backdrop.setAttribute('aria-hidden', 'true');
            }
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            nav.style.visibility = '';
            nav.setAttribute('aria-hidden', 'false');
        }
    }

    syncNavVisibilityForViewport();

    function setNavOpen(open) {
        if (!menuBtn || !nav) return;
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (navTransitionEndHandler) {
            nav.removeEventListener('transitionend', navTransitionEndHandler);
            navTransitionEndHandler = null;
        }
        if (open) {
            if (navVisibilityFallback) {
                window.clearTimeout(navVisibilityFallback);
                navVisibilityFallback = null;
            }
            nav.style.visibility = 'visible';
            nav.setAttribute('aria-hidden', 'false');
            syncMobileHeaderHeight();
            body.classList.add('nav-open');
        } else {
            if (navVisibilityFallback) {
                window.clearTimeout(navVisibilityFallback);
                navVisibilityFallback = null;
            }
            navVisibilityFallback = window.setTimeout(function () {
                navVisibilityFallback = null;
                if (!body.classList.contains('nav-open')) {
                    nav.style.visibility = 'hidden';
                    nav.setAttribute('aria-hidden', 'true');
                }
            }, 380);
            navTransitionEndHandler = function (e) {
                if (e.propertyName !== 'transform') return;
                if (navVisibilityFallback) {
                    window.clearTimeout(navVisibilityFallback);
                    navVisibilityFallback = null;
                }
                nav.removeEventListener('transitionend', navTransitionEndHandler);
                navTransitionEndHandler = null;
                if (!body.classList.contains('nav-open')) {
                    nav.style.visibility = 'hidden';
                    nav.setAttribute('aria-hidden', 'true');
                }
            };
            nav.addEventListener('transitionend', navTransitionEndHandler);
            body.classList.remove('nav-open');
        }
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (backdrop) {
            backdrop.hidden = !open;
            backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
        body.style.overflow = open ? 'hidden' : '';
    }

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function () {
            setNavOpen(!body.classList.contains('nav-open'));
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', function () {
            setNavOpen(false);
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setNavOpen(false);
    });

    nav &&
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.matchMedia('(max-width: 768px)').matches) {
                    setNavOpen(false);
                }
            });
        });

    const progressEl = document.getElementById('scroll-progress');
    if (progressEl) {
        function updateProgress() {
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const height = doc.scrollHeight - doc.clientHeight;
            const pct = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
            progressEl.style.width = pct + '%';
            progressEl.setAttribute('aria-valuenow', String(pct));
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    try {
        var path = location.pathname + location.search;
        var key = 'alko_recent_v1';
        var arr = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(arr)) arr = [];
        if (path && path.length > 0 && !/\.(ico|png|jpe?g|svg|webp|gif)$/i.test(path)) {
            arr = arr.filter(function (p) {
                return p !== path;
            });
            arr.unshift(path);
            arr = arr.slice(0, 6);
            localStorage.setItem(key, JSON.stringify(arr));
        }
    } catch (err) {
        /* ignore */
    }

    function labelForPath(p) {
        if (p === '/' || p === '') return 'Главная';
        if (p.indexOf('/catalog') !== -1) return 'Каталог';
        if (p.indexOf('/contacts') !== -1) return 'Контакты';
        if (p.indexOf('/faq') !== -1) return 'FAQ';
        if (p.indexOf('/rayony') !== -1) return 'Районы';
        if (p.indexOf('/metro/') !== -1) return 'Метро';
        if (p.indexOf('/kategoria/') !== -1) return 'Категории';
        if (p.indexOf('/povod/') !== -1) return 'Повод';
        if (p.indexOf('/vopros/') !== -1) return 'Вопросы';
        if (p.indexOf('/raion/') !== -1) return 'Район';
        var base = p.replace(/\/$/, '').split('/').pop() || p;
        if (base.indexOf('.html') !== -1) base = base.replace('.html', '');
        return base.length > 24 ? base.slice(0, 22) + '…' : base;
    }

    function renderRecentWidget() {
        var host = document.querySelector('[data-recent-widget]');
        if (!host) return;
        try {
            var list = JSON.parse(localStorage.getItem('alko_recent_v1') || '[]');
            if (!Array.isArray(list) || list.length < 2) return;
            var skip = location.pathname + location.search;
            var items = list.filter(function (p) {
                return p !== skip;
            }).slice(0, 4);
            if (!items.length) return;
            var ul = document.createElement('ul');
            items.forEach(function (p) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = p;
                a.textContent = labelForPath(p);
                li.appendChild(a);
                ul.appendChild(li);
            });
            var title = document.createElement('h3');
            title.textContent = host.getAttribute('data-label') || 'Вы недавно смотрели';
            host.innerHTML = '';
            host.appendChild(title);
            host.appendChild(ul);
            host.hidden = false;
        } catch (e) {
            /* ignore */
        }
    }

    renderRecentWidget();

    const forms = document.querySelectorAll('#order-form, #cart-order-form, form[data-telegram-form]');

    function readCartItems() {
        try {
            var raw = JSON.parse(localStorage.getItem('alko_cart_v1') || '[]');
            if (!Array.isArray(raw)) return [];
            return raw
                .map(function (it) {
                    if (!it || !it.name) return null;
                    return {
                        name: String(it.name).trim(),
                        price: Math.max(0, parseInt(it.price, 10) || 0),
                        qty: Math.max(1, parseInt(it.qty, 10) || 1),
                        image: it.image ? String(it.image) : '',
                    };
                })
                .filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    async function submitTelegramOrder(form, statusDiv) {
        if (!statusDiv) return;

        const nameEl = form.querySelector('[name="name"], #name, #cart-name, #oneclick-name');
        const phoneEl = form.querySelector('[name="phone"], #phone, #cart-phone, #oneclick-phone');
        const commentEl = form.querySelector('[name="comment"], #comment, #cart-comment');
        const addressEl = form.querySelector('[name="address"], #cart-address');

        const name = nameEl ? nameEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';
        const comment = commentEl ? commentEl.value.trim() : '';
        const address = addressEl ? addressEl.value.trim() : '';
        const cart = readCartItems();

        if (form.id === 'cart-order-form' && !cart.length) {
            statusDiv.innerHTML = '⚠️ Добавьте товары в корзину из <a href="/catalog.html">каталога</a>';
            statusDiv.style.color = '#e65100';
            return;
        }

        statusDiv.innerHTML = '⏳ Отправка заказа...';
        statusDiv.style.color = '#333';

        const data = {
            name: name,
            phone: phone,
            comment: comment || (form.getAttribute('data-product-quick')
                ? 'Быстрый заказ: ' + form.getAttribute('data-product-quick')
                : ''),
            address: address,
            cart: cart,
            source: form.getAttribute('data-source') || 'Сайт АЛКОдоставка',
            orderType: form.getAttribute('data-order-type') || 'Заявка с сайта',
            pageUrl: window.location.href,
        };

        try {
            const apiUrl =
                (document.documentElement.getAttribute('data-api-base') || '').replace(/\/$/, '') +
                '/api/telegram.php';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const contentType = response.headers.get('content-type') || '';
            let result = {};
            const rawText = await response.text();

            if (contentType.includes('application/json')) {
                try {
                    result = JSON.parse(rawText || '{}');
                } catch (parseErr) {
                    result = { error: 'Некорректный ответ сервера' };
                }
            } else if (rawText.trim().startsWith('{')) {
                try {
                    result = JSON.parse(rawText);
                } catch (parseErr) {
                    result = { error: 'Некорректный ответ сервера' };
                }
            } else {
                result = {
                    error: 'API недоступен на этом сервере',
                    code: 'API_UNAVAILABLE',
                    hint: 'local',
                };
            }

            if (response.ok && result.success) {
                statusDiv.innerHTML =
                    '✅ Заказ отправлен! Мы перезвоним в ближайшее время для подтверждения.';
                statusDiv.style.color = '#2e7d32';
                form.reset();
                if (form.id === 'cart-order-form') {
                    writeCart([]);
                    if (typeof closeCartPanel === 'function') closeCartPanel();
                }
                if (form.id === 'oneclick-order-form' && typeof closeOneClickModal === 'function') {
                    window.setTimeout(closeOneClickModal, 2500);
                }
            } else if (result.code === 'TELEGRAM_NOT_CONFIGURED') {
                statusDiv.innerHTML =
                    '⚠️ Оформление временно недоступно. Позвоните <a href="tel:+79251219972">+7 (925) 121-99-72</a> или напишите в WhatsApp / Telegram.';
                statusDiv.style.color = '#e65100';
            } else if (result.code === 'API_UNAVAILABLE') {
                statusDiv.innerHTML =
                    '⚠️ Заказ через сайт работает на <strong>alkodastavka.vercel.app</strong> или через <code>npm run dev</code> (порт 3000). Сейчас: Live Server без API. Позвоните <a href="tel:+79251219972">+7 (925) 121-99-72</a>.';
                statusDiv.style.color = '#e65100';
            } else if (result.code === 'TELEGRAM_NETWORK') {
                statusDiv.innerHTML =
                    '⚠️ Не удалось отправить в Telegram (сеть). Позвоните <a href="tel:+79251219972">+7 (925) 121-99-72</a> или напишите в WhatsApp / Telegram.';
                statusDiv.style.color = '#e65100';
            } else {
                statusDiv.innerHTML =
                    '❌ Ошибка: ' +
                    (result.error || 'Не удалось отправить заказ') +
                    '. Позвоните <a href="tel:+79251219972">+7 (925) 121-99-72</a>.';
                statusDiv.style.color = '#d32f2f';
            }
        } catch (err) {
            statusDiv.innerHTML =
                '❌ Ошибка соединения. Позвоните <a href="tel:+79251219972">+7 (925) 121-99-72</a> или напишите в WhatsApp / Telegram.';
            statusDiv.style.color = '#d32f2f';
        }
    }

    forms.forEach(function (form) {
        if (form.tagName !== 'FORM') return;
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const statusDiv =
                form.querySelector('[data-order-status]') ||
                document.getElementById('order-status') ||
                document.getElementById('cart-order-status') ||
                document.getElementById('oneclick-status');
            await submitTelegramOrder(form, statusDiv);
        });
    });

    document.querySelectorAll('.accordion-header').forEach(function (header) {
        header.addEventListener('click', function () {
            const parentItem = header.parentElement;
            if (parentItem) parentItem.classList.toggle('active');
        });
    });

    /* ===== Заказ в один клик ===== */
    var closeOneClickModal = function () {};
    var openOneClickModal = function () {};

    (function initOneClickOrder() {
        var backdrop = document.getElementById('oneclick-backdrop');
        var modal = document.getElementById('oneclick-modal');
        if (!modal || !backdrop) return;

        openOneClickModal = function (productName) {
            backdrop.hidden = false;
            modal.hidden = false;
            document.body.classList.add('oneclick-open');
            var status = document.getElementById('oneclick-status');
            if (status) status.textContent = '';
            var form = document.getElementById('oneclick-order-form');
            if (form) {
                if (productName) {
                    form.setAttribute('data-product-quick', productName);
                    form.setAttribute('data-order-type', '⚡ Быстрый заказ: ' + productName);
                } else {
                    form.removeAttribute('data-product-quick');
                    form.setAttribute('data-order-type', '⚡ Заказ в один клик');
                }
            }
            var nameInput = document.getElementById('oneclick-name');
            if (nameInput) window.setTimeout(function () { nameInput.focus(); }, 80);
        };

        closeOneClickModal = function () {
            backdrop.hidden = true;
            modal.hidden = true;
            document.body.classList.remove('oneclick-open');
        };

        document.querySelectorAll('.js-oneclick-open').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openOneClickModal();
            });
        });

        var closeBtn = document.getElementById('oneclick-close');
        if (closeBtn) closeBtn.addEventListener('click', closeOneClickModal);
        backdrop.addEventListener('click', closeOneClickModal);

        if (!document.documentElement.dataset.oneclickEscBound) {
            document.documentElement.dataset.oneclickEscBound = '1';
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && !modal.hidden) closeOneClickModal();
            });
        }

        window.alkoOpenOneClickModal = openOneClickModal;
    })();

    /* ===== Корзина ===== */
    var CART_KEY = 'alko_cart_v1';
    var closeCartPanel = function () {};

    function readCart() {
        return readCartItems();
    }

    function writeCart(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
        updateCartUi();
    }

    function parsePrice(text) {
        return parseInt(String(text || '').replace(/\D/g, ''), 10) || 0;
    }

    function formatRub(n) {
        return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽';
    }

    function cartSummaryText(items) {
        if (!items.length) return '';
        var lines = items.map(function (it) {
            return it.name + ' × ' + it.qty + ' — ' + formatRub(it.price * it.qty);
        });
        var total = items.reduce(function (s, it) {
            return s + it.price * it.qty;
        }, 0);
        lines.push('Итого: ' + formatRub(total));
        return lines.join('\n');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function addToCart(name, price, image) {
        if (!name || !price) return;
        var items = readCart();
        var found = items.find(function (it) {
            return it.name === name;
        });
        if (found) {
            found.qty += 1;
        } else {
            items.push({ name: name, price: price, qty: 1, image: image || '' });
        }
        writeCart(items);
        pulseCartBadge();
    }

    window.alkoAddToCart = addToCart;
    window.alkoParsePrice = parsePrice;

    function pulseCartBadge() {
        var btn = document.getElementById('site-cart-btn');
        if (!btn) return;
        btn.classList.add('cart-pulse');
        window.setTimeout(function () {
            btn.classList.remove('cart-pulse');
        }, 450);
    }

    function removeFromCart(name) {
        writeCart(
            readCart().filter(function (it) {
                return it.name !== name;
            }),
        );
    }

    function changeQty(name, delta) {
        var items = readCart();
        items = items
            .map(function (it) {
                if (it.name !== name) return it;
                return Object.assign({}, it, { qty: it.qty + delta });
            })
            .filter(function (it) {
                return it.qty > 0;
            });
        writeCart(items);
    }

    function initCart() {
        var btn = document.getElementById('site-cart-btn');
        var panel = document.getElementById('cart-panel');
        var backdrop = document.getElementById('cart-backdrop');

        if (!panel || !backdrop) return;

        function openCart() {
            panel.hidden = false;
            backdrop.hidden = false;
            body.classList.add('cart-open');
            body.style.overflow = 'hidden';
            updateCartUi();
        }

        closeCartPanel = function () {
            panel.hidden = true;
            backdrop.hidden = true;
            body.classList.remove('cart-open');
            if (!body.classList.contains('nav-open')) body.style.overflow = '';
        };

        if (btn && !btn.dataset.cartBound) {
            btn.dataset.cartBound = '1';
            btn.addEventListener('click', openCart);
        }

        var closeBtn = document.getElementById('cart-panel-close');
        if (closeBtn && !closeBtn.dataset.cartBound) {
            closeBtn.dataset.cartBound = '1';
            closeBtn.addEventListener('click', closeCartPanel);
        }

        if (!backdrop.dataset.cartBound) {
            backdrop.dataset.cartBound = '1';
            backdrop.addEventListener('click', closeCartPanel);
        }

        var clearBtn = document.getElementById('cart-clear');
        if (clearBtn && !clearBtn.dataset.cartBound) {
            clearBtn.dataset.cartBound = '1';
            clearBtn.addEventListener('click', function () {
                writeCart([]);
            });
        }

        if (!document.documentElement.dataset.cartEscBound) {
            document.documentElement.dataset.cartEscBound = '1';
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && panel && !panel.hidden) closeCartPanel();
            });
        }

        updateCartUi();
    }

    function renderCartPanel(items) {
        var list = document.getElementById('cart-items');
        var totalEl = document.getElementById('cart-total');
        var countEl = document.getElementById('cart-items-count');
        var emptyState = document.getElementById('cart-empty-state');
        var footer = document.getElementById('cart-panel-footer');
        if (!list || !totalEl) return;

        var total = 0;
        var count = 0;
        list.innerHTML = '';

        items.forEach(function (it) {
            var qty = Math.max(1, parseInt(it.qty, 10) || 1);
            var price = Math.max(0, parseInt(it.price, 10) || 0);
            total += price * qty;
            count += qty;
        });

        if (!items.length) {
            if (emptyState) emptyState.hidden = false;
            if (footer) footer.classList.add('cart-panel-footer--empty');
        } else {
            if (emptyState) emptyState.hidden = true;
            if (footer) footer.classList.remove('cart-panel-footer--empty');
            items.forEach(function (it) {
                var qty = Math.max(1, parseInt(it.qty, 10) || 1);
                var price = Math.max(0, parseInt(it.price, 10) || 0);
                var li = document.createElement('li');
                li.className = 'cart-item';
                var thumb = it.image
                    ? '<img src="' + escapeHtml(it.image) + '" alt="" loading="lazy" decoding="async" width="64" height="64">'
                    : '<span class="cart-item-thumb-fallback" aria-hidden="true">🍾</span>';
                li.innerHTML =
                    '<div class="cart-item-thumb">' +
                    thumb +
                    '</div>' +
                    '<div class="cart-item-body">' +
                    '<p class="cart-item-name">' +
                    escapeHtml(it.name) +
                    '</p>' +
                    '<p class="cart-item-unit">' +
                    formatRub(price) +
                    ' / шт.</p>' +
                    '<div class="cart-item-controls">' +
                    '<div class="cart-item-qty">' +
                    '<button type="button" class="cart-qty-btn" data-cart-minus="' +
                    encodeURIComponent(it.name) +
                    '" aria-label="Уменьшить">−</button>' +
                    '<span class="cart-qty-value">' +
                    qty +
                    '</span>' +
                    '<button type="button" class="cart-qty-btn" data-cart-plus="' +
                    encodeURIComponent(it.name) +
                    '" aria-label="Увеличить">+</button>' +
                    '</div>' +
                    '<span class="cart-item-price">' +
                    formatRub(price * qty) +
                    '</span>' +
                    '</div>' +
                    '</div>' +
                    '<button type="button" class="cart-remove" data-cart-remove="' +
                    encodeURIComponent(it.name) +
                    '" aria-label="Удалить">×</button>';
                list.appendChild(li);
            });
        }

        totalEl.textContent = formatRub(total);
        if (countEl) countEl.textContent = String(count);

        var badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = String(count || 0);
            badge.hidden = !count;
        }

        list.querySelectorAll('[data-cart-minus]').forEach(function (b) {
            b.addEventListener('click', function () {
                changeQty(decodeURIComponent(b.getAttribute('data-cart-minus')), -1);
            });
        });
        list.querySelectorAll('[data-cart-plus]').forEach(function (b) {
            b.addEventListener('click', function () {
                changeQty(decodeURIComponent(b.getAttribute('data-cart-plus')), 1);
            });
        });
        list.querySelectorAll('[data-cart-remove]').forEach(function (b) {
            b.addEventListener('click', function () {
                removeFromCart(decodeURIComponent(b.getAttribute('data-cart-remove')));
            });
        });
    }

    function updateCartUi() {
        renderCartPanel(readCart());
    }

    initCart();

    var commentField = document.querySelector('#order-form [name="comment"], #comment');
    if (commentField && !commentField.value.trim()) {
        var cartItems = readCart();
        if (cartItems.length) {
            commentField.value = cartSummaryText(cartItems) + '\n\nАдрес доставки: ';
        }
    }
});
