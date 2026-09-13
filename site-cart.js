(function () {
    'use strict';

    var CART_KEY = 'alko_cart_v1';
    var WA_PHONE = '79626289777';

    function injectStyles() {
        if (document.getElementById('alko-cart-styles')) return;
        var style = document.createElement('style');
        style.id = 'alko-cart-styles';
        style.textContent =
            '#alko-cart-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:140;display:none}' +
            '#alko-cart-backdrop.show{display:block}' +
            '#alko-cart-panel{position:fixed;top:0;right:0;width:min(400px,100%);height:100dvh;background:#fff;color:#1f1f1f;z-index:150;transform:translateX(100%);transition:transform .3s ease;display:flex;flex-direction:column;box-shadow:-8px 0 24px rgba(0,0,0,.12)}' +
            '#alko-cart-panel.open{transform:translateX(0)}' +
            '#alko-cart-panel *{color:inherit}' +
            '.alko-cart-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #e8e8e8;background:#fff;color:#1f1f1f}' +
            '.alko-cart-head h3{margin:0;font-size:1.15rem;color:#1f1f1f}' +
            '.alko-cart-close{background:none;border:0;font-size:1.6rem;cursor:pointer;line-height:1;padding:4px 8px;color:#333}' +
            '.alko-cart-body{flex:1;overflow-y:auto;padding:12px 18px;color:#1f1f1f}' +
            '.alko-cart-item{display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #eee;color:#1f1f1f}' +
            '.alko-cart-item-info{flex:1;min-width:0}' +
            '.alko-cart-item-info h4{margin:0 0 4px;font-size:.95rem;font-weight:600;color:#1f1f1f}' +
            '.alko-cart-item-price{color:#9e2138;font-weight:700}' +
            '.alko-cart-qty{display:flex;align-items:center;gap:6px;margin-top:8px}' +
            '.alko-cart-qty button{width:32px;height:32px;border:1px solid #ccc;border-radius:8px;background:#fff;color:#1f1f1f;cursor:pointer;font-size:1.1rem;line-height:1}' +
            '.alko-cart-qty span{min-width:24px;text-align:center;font-weight:600;color:#1f1f1f}' +
            '.alko-cart-rm{background:none;border:0;color:#666;font-size:1.4rem;cursor:pointer;padding:0 4px;line-height:1}' +
            '#alko-cart-total{padding:14px 18px;font-size:1.15rem;font-weight:700;border-top:1px solid #e8e8e8;background:#fff;color:#1f1f1f}' +
            '.alko-cart-foot{padding:14px 18px max(18px,env(safe-area-inset-bottom));border-top:1px solid #e8e8e8;background:#fff}' +
            '.alko-cart-foot .btn{width:100%;color:#fff}' +
            '.alko-cart-form{display:none;flex-direction:column;gap:12px;padding:0 18px 18px;background:#fff}' +
            '.alko-cart-form.active{display:flex}' +
            '#alko-cart-panel .alko-cart-form input,#alko-cart-panel .alko-cart-form textarea{padding:12px;border:1px solid #ccc;border-radius:10px;font-size:1rem;width:100%;font-family:inherit;background:#fff;color:#1f1f1f}' +
            '#alko-cart-panel .alko-cart-form input::placeholder,#alko-cart-panel .alko-cart-form textarea::placeholder{color:#888}' +
            '.alko-cart-summary{font-size:.9rem;color:#444;margin-bottom:8px;max-height:120px;overflow-y:auto}' +
            '.alko-cart-summary strong{color:#1f1f1f}' +
            '#alko-cart-panel .alko-cart-form .btn-outline{border:2px solid #9e2138;color:#9e2138;background:transparent}' +
            '#alko-cart-panel .alko-cart-form .btn-outline:hover{background:#9e2138;color:#fff}' +
            '.alko-cart-msg{text-align:center;font-size:.9rem;margin-top:8px;min-height:1.2em;color:#333}' +
            '.alko-cart-toggle-btn{position:relative;color:#fff}' +
            '.alko-cart-toggle-btn .alko-cart-badge{position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#9e2138;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center}' +
            '.alko-add-btn{margin-top:8px}' +
            '@media(max-width:768px){.header-cta-cluster .alko-cart-toggle-btn{display:none}}';
        document.head.appendChild(style);
    }

    function slugId(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return 'n' + Math.abs(h);
    }

    function parsePrice(text) {
        if (!text) return 0;
        var n = parseInt(String(text).replace(/[^\d]/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }

    function loadCart() {
        try {
            var raw = localStorage.getItem(CART_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateBadges(cart);
    }

    function cartQty(cart) {
        return cart.reduce(function (a, i) {
            return a + (i.quantity || 0);
        }, 0);
    }

    function cartSum(cart) {
        return cart.reduce(function (a, i) {
            return a + i.price * i.quantity;
        }, 0);
    }

    function updateBadges(cart) {
        var n = cartQty(cart);
        document.querySelectorAll('.alko-cart-badge').forEach(function (el) {
            el.textContent = n;
            el.style.display = n > 0 ? '' : 'none';
        });
    }

    function formatOrderMessage(data) {
        var lines = ['Новый заказ', '', 'Имя: ' + data.name, 'Телефон: ' + data.phone, 'Адрес: ' + data.address, 'Комментарий: ' + (data.comment || '—'), '', 'Товары:'];
        data.items.forEach(function (item) {
            lines.push(item.name + ' × ' + item.quantity);
        });
        lines.push('', 'Итоговая сумма заказа: ' + data.total + ' ₽', '', 'Дата и время заказа: ' + data.datetime);
        return lines.join('\n');
    }

    function sendTelegram(text) {
        return fetch('/api/telegram.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
        }).then(function (r) {
            return r.json().then(function (d) {
                return { ok: r.ok && d.success, error: d.error };
            });
        });
    }

    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildUI() {
        if (document.getElementById('alko-cart-panel')) return;

        var backdrop = document.createElement('div');
        backdrop.id = 'alko-cart-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        var panel = document.createElement('aside');
        panel.id = 'alko-cart-panel';
        panel.setAttribute('aria-label', 'Корзина');
        panel.innerHTML =
            '<div class="alko-cart-head"><h3>Корзина</h3><button type="button" class="alko-cart-close" aria-label="Закрыть">×</button></div>' +
            '<div class="alko-cart-body" id="alko-cart-items"></div>' +
            '<div class="alko-cart-total" id="alko-cart-total">Итого: 0 ₽</div>' +
            '<div class="alko-cart-form contacts-form" id="alko-cart-order-form">' +
            '<div class="alko-cart-summary" id="alko-cart-order-summary"></div>' +
            '<input type="text" id="alko-order-name" placeholder="Имя" required>' +
            '<input type="tel" id="alko-order-phone" placeholder="Телефон" required>' +
            '<input type="text" id="alko-order-address" placeholder="Адрес доставки" required>' +
            '<textarea id="alko-order-comment" placeholder="Комментарий" rows="3"></textarea>' +
            '<button type="submit" class="btn btn-large" id="alko-order-submit">Отправить заказ</button>' +
            '<button type="button" class="btn btn-outline" id="alko-order-back">Назад к корзине</button>' +
            '<div class="alko-cart-msg" id="alko-cart-msg"></div></div>' +
            '<div class="alko-cart-foot" id="alko-cart-foot">' +
            '<button type="button" class="btn btn-large" id="alko-checkout-btn">Оформить заказ</button></div>';

        document.body.appendChild(backdrop);
        document.body.appendChild(panel);

        var cluster = document.querySelector('.header-cta-cluster');
        if (cluster && !document.getElementById('alko-cart-toggle')) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'alko-cart-toggle';
            btn.className = 'btn-header-pill alko-cart-toggle-btn';
            btn.innerHTML = '🛒 Корзина <span class="alko-cart-badge" style="display:none">0</span>';
            cluster.insertBefore(btn, cluster.firstChild);
        }

        var navCta = document.querySelector('.nav-mp-section--cta');
        if (navCta && !document.getElementById('alko-cart-toggle-mobile')) {
            var mbtn = document.createElement('button');
            mbtn.type = 'button';
            mbtn.id = 'alko-cart-toggle-mobile';
            mbtn.className = 'nav-mp-btn nav-mp-btn--form alko-cart-toggle-btn';
            mbtn.innerHTML = 'Корзина <span class="alko-cart-badge" style="display:none">0</span>';
            navCta.insertBefore(mbtn, navCta.firstChild);
        }
    }

    function openCart(show) {
        var panel = document.getElementById('alko-cart-panel');
        var backdrop = document.getElementById('alko-cart-backdrop');
        if (!panel || !backdrop) return;
        panel.classList.toggle('open', show);
        backdrop.classList.toggle('show', show);
        backdrop.setAttribute('aria-hidden', show ? 'false' : 'true');
        document.body.style.overflow = show ? 'hidden' : '';
        if (!show) showCartView();
    }

    function showCartView() {
        var form = document.getElementById('alko-cart-order-form');
        var foot = document.getElementById('alko-cart-foot');
        if (form) form.classList.remove('active');
        if (foot) foot.style.display = '';
    }

    function showOrderForm(cart) {
        var form = document.getElementById('alko-cart-order-form');
        var foot = document.getElementById('alko-cart-foot');
        var summary = document.getElementById('alko-cart-order-summary');
        if (!form || !summary) return;
        var html = '';
        cart.forEach(function (item) {
            html += '<div>' + escapeHtml(item.name) + ' × ' + item.quantity + ' — ' + item.price * item.quantity + ' ₽</div>';
        });
        html += '<strong>Итого: ' + cartSum(cart) + ' ₽</strong>';
        summary.innerHTML = html;
        form.classList.add('active');
        if (foot) foot.style.display = 'none';
    }

    function renderCart(cart) {
        var holder = document.getElementById('alko-cart-items');
        var totalEl = document.getElementById('alko-cart-total');
        if (!holder) return;
        if (!cart.length) {
            holder.innerHTML = '<p style="color:#777;padding:12px 0">Корзина пуста</p>';
            if (totalEl) totalEl.textContent = 'Итого: 0 ₽';
            return;
        }
        holder.innerHTML = cart
            .map(function (item) {
                return (
                    '<div class="alko-cart-item" data-id="' +
                    escapeHtml(item.id) +
                    '">' +
                    '<div class="alko-cart-item-info"><h4>' +
                    escapeHtml(item.name) +
                    '</h4><div class="alko-cart-item-price">' +
                    item.price +
                    ' ₽</div>' +
                    '<div class="alko-cart-qty">' +
                    '<button type="button" data-action="dec" data-id="' +
                    escapeHtml(item.id) +
                    '" aria-label="Уменьшить">−</button>' +
                    '<span>' +
                    item.quantity +
                    '</span>' +
                    '<button type="button" data-action="inc" data-id="' +
                    escapeHtml(item.id) +
                    '" aria-label="Увеличить">+</button>' +
                    '</div></div>' +
                    '<button type="button" class="alko-cart-rm" data-action="rm" data-id="' +
                    escapeHtml(item.id) +
                    '" aria-label="Удалить">×</button></div>'
                );
            })
            .join('');
        if (totalEl) totalEl.textContent = 'Итого: ' + cartSum(cart) + ' ₽';
    }

    function addProduct(product) {
        if (!product || !product.name || !product.price) return;
        var cart = loadCart();
        var existing = cart.find(function (i) {
            return i.id === product.id;
        });
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
            });
        }
        saveCart(cart);
        renderCart(cart);
        openCart(true);
    }

    function changeQty(id, delta) {
        var cart = loadCart();
        var item = cart.find(function (i) {
            return String(i.id) === String(id);
        });
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(function (i) {
                return String(i.id) !== String(id);
            });
        }
        saveCart(cart);
        renderCart(cart);
    }

    function removeItem(id) {
        var cart = loadCart().filter(function (i) {
            return String(i.id) !== String(id);
        });
        saveCart(cart);
        renderCart(cart);
    }

    function enhanceProductCards() {
        document.querySelectorAll('.product-card').forEach(function (card) {
            if (card.querySelector('.alko-add-btn')) return;
            var h3 = card.querySelector('h3');
            var priceEl = card.querySelector('.product-price');
            if (!h3 || !priceEl) return;
            var name = h3.textContent.trim();
            var price = parsePrice(priceEl.textContent);
            if (!name || !price) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-small alko-add-btn';
            btn.textContent = 'Добавить в корзину';
            btn.dataset.name = name;
            btn.dataset.price = String(price);
            btn.dataset.id = slugId(name);
            card.appendChild(btn);
        });

        document.querySelectorAll('.home-product-card').forEach(function (card) {
            if (card.querySelector('.alko-add-btn')) return;
            var h3 = card.querySelector('h3');
            var priceEl = card.querySelector('.home-product-price');
            if (!h3 || !priceEl) return;
            var name = h3.textContent.trim();
            var price = parsePrice(priceEl.textContent);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-small alko-add-btn home-product-btn';
            btn.textContent = 'Добавить в корзину';
            btn.dataset.name = name;
            btn.dataset.price = String(price);
            btn.dataset.id = slugId(name);
            var oldOrder = card.querySelector('.home-product-btn');
            if (oldOrder && oldOrder.tagName === 'A') {
                oldOrder.parentNode.insertBefore(btn, oldOrder.nextSibling);
            } else {
                card.appendChild(btn);
            }
        });

        if (typeof window.__PRODUCTS__ !== 'undefined' && Array.isArray(window.__PRODUCTS__)) {
            document.querySelectorAll('.btn.add[data-id], button.add[data-id]').forEach(function (btn) {
                if (btn.dataset.alkoBound) return;
                btn.dataset.alkoBound = '1';
                btn.textContent = btn.textContent || 'Добавить в корзину';
            });
        }
    }

    function productFromAddBtn(btn) {
        var id = btn.dataset.id;
        if (typeof window.__PRODUCTS__ !== 'undefined') {
            var pid = parseInt(id, 10);
            var found = window.__PRODUCTS__.find(function (p) {
                return p.id === pid;
            });
            if (found) {
                return { id: String(found.id), name: found.name, price: found.price };
            }
        }
        return {
            id: id || slugId(btn.dataset.name || ''),
            name: btn.dataset.name || (function () {
                var el = btn.closest('.product-card') || btn.closest('.home-product-card');
                var h = el && el.querySelector('h3');
                return h ? h.textContent.trim() : 'Товар';
            })(),
            price: parseInt(btn.dataset.price, 10) || 0,
        };
    }

    function init() {
        if (!document.querySelector('.site-header')) {
            return;
        }
        if (document.getElementById('cart-panel') || document.querySelector('.cart.open, aside.cart')) {
            return;
        }

        injectStyles();
        buildUI();
        enhanceProductCards();

        var cart = loadCart();
        renderCart(cart);
        updateBadges(cart);

        document.addEventListener('click', function (e) {
            var toggle = e.target.closest('#alko-cart-toggle, #alko-cart-toggle-mobile, .alko-cart-toggle-btn');
            if (toggle && toggle.id !== 'alko-checkout-btn') {
                e.preventDefault();
                openCart(true);
                return;
            }
            if (e.target.closest('.alko-cart-close') || e.target.id === 'alko-cart-backdrop') {
                openCart(false);
                return;
            }
            var addBtn = e.target.closest('.alko-add-btn, .btn.add[data-id], button.add[data-id]');
            if (addBtn) {
                e.preventDefault();
                addProduct(productFromAddBtn(addBtn));
                return;
            }
            var actionBtn = e.target.closest('[data-action]');
            if (actionBtn && actionBtn.closest('#alko-cart-panel')) {
                e.preventDefault();
                var id = actionBtn.dataset.id;
                if (actionBtn.dataset.action === 'inc') changeQty(id, 1);
                if (actionBtn.dataset.action === 'dec') changeQty(id, -1);
                if (actionBtn.dataset.action === 'rm') removeItem(id);
                return;
            }
            if (e.target.closest('#alko-checkout-btn')) {
                e.preventDefault();
                var c = loadCart();
                if (!c.length) {
                    alert('Корзина пуста');
                    return;
                }
                showOrderForm(c);
                return;
            }
            if (e.target.closest('#alko-order-back')) {
                e.preventDefault();
                showCartView();
            }
        });

        var orderForm = document.getElementById('alko-cart-order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var c = loadCart();
                if (!c.length) return;
                var name = document.getElementById('alko-order-name').value.trim();
                var phone = document.getElementById('alko-order-phone').value.trim();
                var address = document.getElementById('alko-order-address').value.trim();
                var comment = document.getElementById('alko-order-comment').value.trim();
                var msgEl = document.getElementById('alko-cart-msg');
                var submitBtn = document.getElementById('alko-order-submit');
                if (!name || !phone || !address) {
                    alert('Заполните имя, телефон и адрес');
                    return;
                }
                var text = formatOrderMessage({
                    name: name,
                    phone: phone,
                    address: address,
                    comment: comment,
                    items: c,
                    total: cartSum(c),
                    datetime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
                });
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Отправка...';
                }
                sendTelegram(text)
                    .then(function (res) {
                        if (res.ok) {
                            if (msgEl) {
                                msgEl.textContent = 'Заказ отправлен! Ожидайте звонка.';
                                msgEl.style.color = '#2e7d32';
                            }
                            saveCart([]);
                            renderCart([]);
                            orderForm.reset();
                            setTimeout(function () {
                                openCart(false);
                                showCartView();
                                if (msgEl) msgEl.textContent = '';
                            }, 2000);
                        } else {
                            if (msgEl) {
                                msgEl.textContent = 'Ошибка отправки. Позвоните или напишите в WhatsApp.';
                                msgEl.style.color = '#d32f2f';
                            }
                        }
                    })
                    .catch(function () {
                        if (msgEl) {
                            msgEl.textContent = 'Ошибка сети. Попробуйте позже.';
                            msgEl.style.color = '#d32f2f';
                        }
                    })
                    .finally(function () {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Отправить заказ';
                        }
                    });
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') openCart(false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
