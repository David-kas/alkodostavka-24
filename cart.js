async function sendTelegramMessage(text, retries) {
    retries = retries === undefined ? 3 : retries;
    const url = '/api/telegram.php';
    for (var attempt = 1; attempt <= retries; attempt++) {
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 10000);
        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            var result = await response.json();
            if (response.ok && result.success) return { success: true };
            if (attempt === retries) return { success: false, error: result.error };
        } catch (error) {
            clearTimeout(timeoutId);
            if (attempt === retries) return { success: false, error: error.message };
            await new Promise(function(r) { setTimeout(r, 1000 * attempt); });
        }
    }
    return { success: false, error: 'Max retries exceeded' };
}

const CART_STORAGE_KEY = 'alko_cart_v1';

function formatOrderMessage(data) {
    const lines = [
        'Новый заказ',
        '',
        'Имя: ' + data.name,
        'Телефон: ' + data.phone,
        'Адрес: ' + data.address,
        'Комментарий: ' + (data.comment || '—'),
        '',
        'Товары:',
    ];
    data.items.forEach(function (item) {
        lines.push(item.name + ' × ' + item.quantity);
    });
    lines.push('', 'Итоговая сумма заказа: ' + data.total + ' ₽', '', 'Дата и время заказа: ' + data.datetime);
    return lines.join('\n');
}

function injectCartPanelStyles() {
    if (document.getElementById('cart-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'cart-panel-styles';
    style.textContent =
        '.cart-panel{position:fixed;top:0;right:0;width:min(380px,100%);height:100dvh;background:#fff;color:#1f1f1f;z-index:1000;transform:translateX(100%);transition:transform .3s;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,.15)}' +
        '.cart-panel.open{transform:translateX(0)}' +
        '.cart-panel h3,.cart-panel h4,.cart-panel .cart-total,.cart-item-info{color:#1f1f1f}' +
        '.overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:none}' +
        '.overlay.show{display:block}' +
        '.cart-header{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #eee;color:#1f1f1f}' +
        '.cart-items{flex:1;overflow-y:auto;padding:12px 16px;color:#1f1f1f}' +
        '.cart-item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1f1f1f}' +
        '.cart-item-info h4{margin:0 0 4px;font-size:.95rem;color:#1f1f1f}' +
        '.cart-item-qty{display:flex;align-items:center;gap:6px;margin-top:6px}' +
        '.cart-item-qty button{width:30px;height:30px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#1f1f1f;cursor:pointer}' +
        '.cart-item-qty span{color:#1f1f1f}' +
        '.cart-item-remove{background:none;border:0;font-size:1.3rem;cursor:pointer;color:#666}' +
        '.cart-total{padding:12px 16px;font-weight:700;border-top:1px solid #eee;color:#1f1f1f}' +
        '.cart-form{padding:12px 16px 20px;display:flex;flex-direction:column;gap:10px;border-top:1px solid #eee}' +
        '.cart-form input,.cart-form textarea{padding:10px;border:1px solid #ccc;border-radius:8px;font-size:1rem;width:100%;background:#fff;color:#1f1f1f}' +
        '.cart-form input::placeholder,.cart-form textarea::placeholder{color:#888}' +
        '.cart-form button[type=submit]{padding:12px;background:#9e2138;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer}';
    document.head.appendChild(style);
}

let cart = [];
try {
    const stored = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('cart');
    cart = JSON.parse(stored || '[]');
    if (!Array.isArray(cart)) cart = [];
    cart = cart.map(function (item) {
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || item.qty || 1,
        };
    });
} catch (e) {
    cart = [];
}

let cartPanel, overlay, cartItemsDiv, cartTotalSpan, orderForm;

document.addEventListener('DOMContentLoaded', function() {
    injectCartPanelStyles();
    cartPanel = document.getElementById('cart-panel');
    overlay = document.getElementById('overlay');
    cartItemsDiv = document.getElementById('cart-items');
    cartTotalSpan = document.getElementById('cart-total');
    orderForm = document.getElementById('order-form');

    updateCartUI();
    attachCartListeners();
    attachOrderFormListener();
    attachDelegatedClickHandlers();
    attachQuickOrderHandlers();
    initMobileNav();
    runProductGridsInit();

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            window.location.href = 'tel:+79251219972';
        });
    }

    scheduleMetrikaDeferred();
});

function setCartBadges(count) {
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = count;
    });
}

function initMobileNav() {
    const root = document.getElementById('mobile-nav-root');
    const burger = document.querySelector('.js-nav-burger');
    if (!root || !burger) return;

    function setOpen(open) {
        root.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        root.setAttribute('aria-hidden', open ? 'false' : 'true');
        const panel = document.getElementById('mobile-nav-drawer');
        if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.classList.toggle('nav-drawer-open', open);
    }

    burger.addEventListener('click', function(e) {
        e.stopPropagation();
        setOpen(!root.classList.contains('is-open'));
    });

    root.addEventListener('click', function(e) {
        if (e.target.closest('.js-nav-close')) {
            setOpen(false);
            return;
        }
        if (e.target.closest('.mobile-nav__panel a')) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') setOpen(false);
    });
}

function attachDelegatedClickHandlers() {
    document.body.addEventListener('click', function(e) {
        const addBtn = e.target.closest('.add-to-cart');
        if (addBtn) {
            e.preventDefault();
            const productId = parseInt(addBtn.dataset.id, 10);
            const product = typeof products !== 'undefined' ? products.find(p => p.id === productId) : null;
            if (product && product.inStock !== false) {
                addToCart(product);
            }
            return;
        }
        const rm = e.target.closest('.cart-item-remove');
        if (rm) {
            e.preventDefault();
            removeFromCart(parseInt(rm.dataset.id, 10));
            return;
        }
        const qtyBtn = e.target.closest('.cart-qty-btn');
        if (qtyBtn) {
            e.preventDefault();
            changeQuantity(parseInt(qtyBtn.dataset.id, 10), parseInt(qtyBtn.dataset.delta, 10));
        }
    });
}

function attachCartListeners() {
    document.querySelectorAll('.js-cart-toggle').forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            if (!cartPanel || !overlay) return;
            cartPanel.classList.add('open');
            overlay.classList.add('show');
            var nav = document.getElementById('mobile-nav-root');
            if (nav && nav.classList.contains('is-open')) {
                nav.classList.remove('is-open');
                document.body.classList.remove('nav-drawer-open');
                var b = document.querySelector('.js-nav-burger');
                if (b) b.setAttribute('aria-expanded', 'false');
                nav.setAttribute('aria-hidden', 'true');
                var p = document.getElementById('mobile-nav-drawer');
                if (p) p.setAttribute('aria-hidden', 'true');
            }
        });
    });
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', function() {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', function() {
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

function attachOrderFormListener() {
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitCartOrder();
        });
    }
}

async function submitCartOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();
    const comment = document.getElementById('order-comment').value.trim();

    if (!name || !phone || !address) {
        alert('Заполните имя, телефон и адрес');
        return;
    }
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }

    let total = 0;
    cart.forEach(function(item) {
        total += item.price * item.quantity;
    });

    const message = formatOrderMessage({
        name: name,
        phone: phone,
        address: address,
        comment: comment,
        items: cart,
        total: total,
        datetime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    });

    const submitBtn = document.getElementById('submit-order');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
    }

    try {
        if (typeof sendTelegramMessage !== 'function') {
            throw new Error('sendTelegramMessage не определена');
        }
        const result = await sendTelegramMessage(message);
        if (result.success) {
            alert('Заказ отправлен! Ожидайте звонка.');
            cart = [];
            saveCart();
            updateCartUI();
            orderForm.reset();
            cartPanel.classList.remove('open');
            overlay.classList.remove('show');
        } else {
            alert('Ошибка отправки заказа. Попробуйте позже или позвоните по телефону.');
        }
    } catch (error) {
        alert('Ошибка соединения. Попробуйте позже или позвоните.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Оформить заказ';
        }
    }
}

function addToCart(product) {
    const existing = cart.find(function(item) { return item.id === product.id; });
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(function(item) { return item.id !== productId; });
    saveCart();
    updateCartUI();
}

function changeQuantity(productId, delta) {
    const item = cart.find(function(i) { return i.id === productId; });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    try { localStorage.removeItem('cart'); } catch (e) { /* ignore */ }
    setCartBadges(cart.reduce(function(acc, item) { return acc + item.quantity; }, 0));
}

function updateCartUI() {
    if (!cartItemsDiv || !cartTotalSpan) return;
    const totalQty = cart.reduce(function(acc, item) { return acc + item.quantity; }, 0);
    setCartBadges(totalQty);
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Корзина пуста</p>';
        cartTotalSpan.textContent = 'Итого: 0 ₽';
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach(function(item) {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <div>${item.price} ₽</div>
                    <div class="cart-item-qty">
                        <button type="button" class="cart-qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Уменьшить">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="cart-qty-btn" data-id="${item.id}" data-delta="1" aria-label="Увеличить">+</button>
                    </div>
                </div>
                <button type="button" class="cart-item-remove" data-id="${item.id}" aria-label="Удалить">×</button>
            </div>
        `;
    });
    cartItemsDiv.innerHTML = html;
    cartTotalSpan.textContent = `Итого: ${total} ₽`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function renderProductGrid(productsArray, options) {
    options = options || {};
    const lcpFirst = !!options.lcpFirst;
    if (!productsArray || !productsArray.length) return '<p>Товары временно отсутствуют</p>';
    return productsArray.map(function(p, index) {
        const inStock = p.inStock !== false;
        const isLcp = lcpFirst && index === 0;
        const imgAttrs = isLcp
            ? 'fetchpriority="high" decoding="async" width="240" height="180" sizes="(max-width:480px) 42vw, 220px"'
            : 'loading="lazy" decoding="async" width="240" height="180" sizes="(max-width:480px) 42vw, 220px"';
        const jpg = escapeHtml(p.image || '');
        const webp = escapeHtml((p.image || '').replace(/\.(jpe?g)$/i, '.webp'));
        return `
            <article class="product-card" data-id="${p.id}" title="${escapeAttr(p.name)}">
                <div class="product-card__media">
                    <picture>
                        <source type="image/webp" srcset="${webp}">
                        <img class="product-img" src="${jpg}" alt="${escapeHtml(p.name)}" ${imgAttrs}>
                    </picture>
                </div>
                <h3 class="product-title">${escapeHtml(p.name)}</h3>
                <div class="product-price">${p.price} ₽</div>
                ${inStock ?
                    `<button type="button" class="add-to-cart" data-id="${p.id}">В корзину</button>` :
                    `<div class="product-out-stock">Нет в наличии</div>`}
            </article>
        `;
    }).join('');
}

function runProductGridsInit() {
    if (typeof products === 'undefined' || typeof renderProductGrid !== 'function') return;
    var page = document.body.getAttribute('data-page');
    if (page === 'main') {
        var hits = products.filter(function(p) { return p.inStock; }).slice(0, 6);
        var el = document.getElementById('main-products');
        if (el) el.innerHTML = renderProductGrid(hits, { lcpFirst: true });
        return;
    }
    if (page === 'category') {
        var cat = document.body.getAttribute('data-category');
        var grid = document.getElementById('category-products');
        if (grid && cat) {
            var list = products.filter(function(p) { return p.category === cat; });
            grid.innerHTML = renderProductGrid(list, { lcpFirst: true });
        }
    }
}

function scheduleMetrikaDeferred() {
    function init() {
        if (window.ym) return;
        (function(m, e, t, r, i, k, a) {
            m[i] = m[i] || function() { (m[i].a = m[i].a || []).push(arguments); };
            m[i].l = 1 * new Date();
            for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) return;
            }
            k = e.createElement(t);
            a = e.getElementsByTagName(t)[0];
            k.async = 1;
            k.src = r;
            a.parentNode.insertBefore(k, a);
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=107712312', 'ym');
        ym(107712312, 'init', {
            ssr: true,
            webvisor: false,
            clickmap: false,
            ecommerce: 'dataLayer',
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
        });
    }
    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 5000 });
    } else {
        window.addEventListener('load', function() { setTimeout(init, 2500); });
    }
}

function attachQuickOrderHandlers() {
    document.querySelectorAll('.quick-order-form').forEach(function(form) {
        form.addEventListener('submit', handleQuickOrder);
    });
}

function handleQuickOrder(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.querySelector('.quick-name').value.trim();
    const phone = form.querySelector('.quick-phone').value.trim();
    const page = form.dataset.page;

    if (!name || !phone) {
        alert('Введите имя и телефон');
        return;
    }

    const message = `⚡ БЫСТРЫЙ ЗАКАЗ (${page})\nИмя: ${name}\nТелефон: ${phone}`;
    if (typeof sendTelegramMessage === 'function') {
        sendTelegramMessage(message);
    }

    const msgDiv = form.parentElement.querySelector('.order-message');
    if (msgDiv) {
        msgDiv.textContent = 'Заявка отправлена! Скоро перезвоним.';
        setTimeout(function() { msgDiv.textContent = ''; }, 5000);
    }
    form.reset();
}
