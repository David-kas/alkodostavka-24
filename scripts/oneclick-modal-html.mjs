/** Модальное окно «Заказ в один клик» — вставляется перед </body> на всех страницах */
export const ONECLICK_MODAL_HTML = `<div id="oneclick-backdrop" class="oneclick-backdrop" hidden></div>
<div id="oneclick-modal" class="oneclick-modal" hidden role="dialog" aria-labelledby="oneclick-title" aria-modal="true">
  <div class="oneclick-modal-inner">
    <button type="button" class="oneclick-close" id="oneclick-close" aria-label="Закрыть">×</button>
    <h2 id="oneclick-title">Заказ в один клик</h2>
    <p class="oneclick-lead">Укажите имя и телефон — менеджер перезвонит в течение нескольких минут.</p>
    <form id="oneclick-order-form" class="oneclick-form" data-telegram-form data-source="Заказ 1 клик на сайте" data-order-type="⚡ Заказ в один клик">
      <label class="oneclick-field">
        <span class="oneclick-label">Ваше имя</span>
        <input type="text" name="name" id="oneclick-name" placeholder="Как к вам обращаться" autocomplete="name" required>
      </label>
      <label class="oneclick-field">
        <span class="oneclick-label">Телефон</span>
        <input type="tel" name="phone" id="oneclick-phone" placeholder="+7 (999) 000-00-00" autocomplete="tel" required>
      </label>
      <button type="submit" class="btn btn-large oneclick-submit">Сделать заказ</button>
    </form>
    <div id="oneclick-status" class="oneclick-status" data-order-status role="status" aria-live="polite"></div>
    <p class="oneclick-note">18+ · доставка по Москве 24/7</p>
  </div>
</div>`;
