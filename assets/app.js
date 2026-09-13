(function () {
    var $ = function (s, p) {
        return (p || document).querySelector(s);
    };
    var $$ = function (s, p) {
        return Array.from((p || document).querySelectorAll(s));
    };

    var CART_KEY = 'alko_cart_v1';
    var map = Object.fromEntries((window.__PRODUCTS__ || []).map(function (p) {
        return [p.id, p];
    }));

    function loadCart() {
        try {
            var raw = localStorage.getItem(CART_KEY) || localStorage.getItem('cart_v2');
            var arr = JSON.parse(raw || '[]');
            if (!Array.isArray(arr)) return [];
            return arr.map(function (i) {
                return {
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity || i.qty || 1,
                };
            });
        } catch (e) {
            return [];
        }
    }

    var cart = loadCart();
    var cartEl = $('.cart');
    var overlay = $('.overlay');

    function sum() {
        return cart.reduce(function (a, i) {
            return a + i.price * i.quantity;
        }, 0);
    }

    function save() {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify(
                cart.map(function (i) {
                    return { id: i.id, name: i.name, price: i.price, quantity: i.quantity };
                })
            )
        );
        $$('.cart-count').forEach(function (el) {
            el.textContent = cart.reduce(function (a, i) {
                return a + i.quantity;
            }, 0);
        });
        renderCart();
    }

    function add(id) {
        var p = map[id];
        if (!p) return;
        var ex = cart.find(function (i) {
            return i.id === id;
        });
        if (ex) ex.quantity += 1;
        else cart.push({ id: p.id, name: p.name, price: p.price, quantity: 1 });
        save();
    }

    function change(id, d) {
        var it = cart.find(function (i) {
            return i.id === id;
        });
        if (!it) return;
        it.quantity += d;
        if (it.quantity <= 0) {
            cart = cart.filter(function (i) {
                return i.id !== id;
            });
        }
        save();
    }

    function remove(id) {
        cart = cart.filter(function (i) {
            return i.id !== id;
        });
        save();
    }

    function formatOrderMessage(data) {
        var lines = [
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

    function renderCart() {
        var holder = $('.cart-items');
        if (!holder) return;
        holder.innerHTML = cart.length
            ? cart
                  .map(function (i) {
                      return (
                          '<div class="cart-item"><div>' +
                          i.name +
                          '</div><div>' +
                          i.price +
                          ' ₽</div><div class="qty"><button type="button" data-q="-1" data-id="' +
                          i.id +
                          '">-</button><span>' +
                          i.quantity +
                          '</span><button type="button" data-q="1" data-id="' +
                          i.id +
                          '">+</button><button type="button" data-r="' +
                          i.id +
                          '">×</button></div></div>'
                      );
                  })
                  .join('')
            : '<p>Корзина пуста</p>';
        var total = $('.cart-total');
        if (total) total.textContent = 'Итого: ' + sum() + ' ₽';
    }

    function openCart(v) {
        if (!cartEl || !overlay) return;
        cartEl.classList.toggle('open', v);
        overlay.classList.toggle('show', v);
        document.body.style.overflow = v ? 'hidden' : '';
    }

    function ensureOrderFields(form) {
        if (!form || form.dataset.enhanced) return;
        form.dataset.enhanced = '1';
        if (!form.querySelector('[name="address"]')) {
            var addr = document.createElement('input');
            addr.name = 'address';
            addr.placeholder = 'Адрес доставки';
            addr.required = true;
            form.insertBefore(addr, form.querySelector('button'));
        }
        if (!form.querySelector('[name="comment"]')) {
            var comment = document.createElement('textarea');
            comment.name = 'comment';
            comment.placeholder = 'Комментарий';
            comment.rows = 2;
            form.insertBefore(comment, form.querySelector('button'));
        }
        var submit = form.querySelector('button[type="submit"]');
        if (submit) submit.textContent = 'Оформить заказ';
        if (!form.querySelector('.order-summary')) {
            var summary = document.createElement('div');
            summary.className = 'order-summary';
            summary.style.cssText = 'font-size:13px;color:#aeb9d9;margin:8px 0;max-height:100px;overflow:auto';
            form.insertBefore(summary, form.firstChild);
        }
    }

    function updateOrderSummary(form) {
        var summary = form && form.querySelector('.order-summary');
        if (!summary) return;
        if (!cart.length) {
            summary.innerHTML = '';
            return;
        }
        summary.innerHTML =
            cart
                .map(function (i) {
                    return i.name + ' × ' + i.quantity + ' — ' + i.price * i.quantity + ' ₽';
                })
                .join('<br>') + '<br><strong>Итого: ' + sum() + ' ₽</strong>';
    }

    document.addEventListener('click', function (e) {
        var addBtn = e.target.closest('.add');
        if (addBtn) {
            add(Number(addBtn.dataset.id));
            openCart(true);
            return;
        }
        var q = e.target.closest('[data-q]');
        if (q) change(Number(q.dataset.id), Number(q.dataset.q));
        var r = e.target.closest('[data-r]');
        if (r) remove(Number(r.dataset.r));
        if (e.target.closest('.cart-open')) openCart(true);
        if (e.target.closest('.cart-close') || e.target === overlay) openCart(false);
        if (e.target.closest('.burger')) {
            var nav = $('.nav');
            if (nav) nav.classList.toggle('open');
        }
    });

    var form = $('.order');
    if (form) {
        ensureOrderFields(form);
        updateOrderSummary(form);
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!cart.length) {
                alert('Корзина пуста');
                return;
            }
            var name = (form.name && form.name.value.trim()) || '';
            var phone = (form.phone && form.phone.value.trim()) || '';
            var address = (form.address && form.address.value.trim()) || '';
            var comment = (form.comment && form.comment.value.trim()) || '';
            if (!name || !phone || !address) {
                alert('Заполните имя, телефон и адрес');
                return;
            }
            var text = formatOrderMessage({
                name: name,
                phone: phone,
                address: address,
                comment: comment,
                items: cart,
                total: sum(),
                datetime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
            });
            var msg = $('.order-msg');
            var btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Отправка...';
            }
            try {
                var res = await fetch('/api/telegram.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text }),
                });
                var data = await res.json();
                if (res.ok && data.success) {
                    if (msg) msg.textContent = 'Заказ отправлен! Ожидайте звонка.';
                    cart = [];
                    form.reset();
                    save();
                    openCart(false);
                } else if (msg) msg.textContent = 'Ошибка отправки';
            } catch (err) {
                if (msg) msg.textContent = 'Ошибка сети';
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Оформить заказ';
                }
            }
        });
    }

    var min = $('#min-price');
    var max = $('#max-price');
    var brand = $('#brand-filter');
    var grid = $('#product-grid');

    function apply() {
        if (!grid) return;
        var minV = Number((min && min.value) || 0);
        var maxV = Number((max && max.value) || 999999);
        var b = (brand && brand.value) || 'all';
        $$('.card', grid).forEach(function (c) {
            var p = Number(c.dataset.price);
            var br = c.dataset.brand;
            var ok = p >= minV && p <= maxV && (b === 'all' || b === br);
            c.classList.toggle('hidden', !ok);
        });
    }

    [min, max, brand].forEach(function (el) {
        if (el) el.addEventListener('input', apply);
    });

    save();
})();
