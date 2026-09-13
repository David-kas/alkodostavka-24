/** Единая разметка корзины для всех страниц */
export const CART_PANEL_HTML = `<div id="cart-backdrop" class="cart-backdrop" hidden></div>
<div id="cart-panel" class="cart-panel" hidden role="dialog" aria-label="Корзина заказа" aria-modal="true">
  <div class="cart-panel-inner">
    <header class="cart-panel-head">
      <div class="cart-panel-title-wrap">
        <span class="cart-panel-icon" aria-hidden="true">🛒</span>
        <h2>Ваш заказ</h2>
      </div>
      <button type="button" class="cart-panel-close" id="cart-panel-close" aria-label="Закрыть">×</button>
    </header>
    <div class="cart-panel-body">
      <div class="cart-empty-state" id="cart-empty-state" hidden>
        <span class="cart-empty-icon" aria-hidden="true">🍾</span>
        <p class="cart-empty-title">Корзина пуста</p>
        <p class="cart-empty-text">Добавьте напитки и закуски из <a href="/catalog.html">каталога</a></p>
      </div>
      <ul class="cart-items" id="cart-items"></ul>
    </div>
    <footer class="cart-panel-footer" id="cart-panel-footer">
      <div class="cart-summary">
        <span class="cart-summary-label">Товаров: <strong id="cart-items-count">0</strong></span>
        <p class="cart-total" id="cart-total">0 ₽</p>
      </div>
      <form id="cart-order-form" class="cart-order-form" data-telegram-form data-source="Корзина на сайте" data-order-type="🛒 Заказ из корзины">
        <input type="text" name="name" id="cart-name" placeholder="Ваше имя" autocomplete="name" required>
        <input type="tel" name="phone" id="cart-phone" placeholder="Телефон для связи" autocomplete="tel" required>
        <textarea name="address" id="cart-address" placeholder="Адрес доставки (улица, дом, подъезд, этаж)" rows="2" required></textarea>
        <textarea name="comment" id="cart-comment" placeholder="Комментарий (необязательно)" rows="2"></textarea>
        <button type="submit" class="btn btn-large cart-submit-btn">Оформить заказ</button>
      </form>
      <div id="cart-order-status" class="cart-order-status" data-order-status role="status"></div>
      <button type="button" class="cart-clear-btn" id="cart-clear">Очистить корзину</button>
      <p class="cart-legal-note">18+ · оплата при получении · часто 20–40 мин по Москве</p>
    </footer>
  </div>
</div>`;
