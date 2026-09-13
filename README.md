# АЛКОдоставка — статический сайт + Vercel

Сайт: **https://alkodostavka24.vercel.app**

## Деплой на Vercel (из GitHub)

1. Загрузите репозиторий на GitHub (см. ниже).
2. На [vercel.com](https://vercel.com) → **Add New Project** → импортируйте репозиторий.
3. Framework Preset: **Other** (статический сайт).
4. В **Environment Variables** добавьте:
   - `TELEGRAM_BOT_TOKEN` — токен бота от [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_CHAT_ID` — ID чата, куда приходят заявки
5. Deploy. Домен `alkodostavka24.vercel.app` привяжите в Settings → Domains.

## Форма заявки

Формы с атрибутом `data-telegram-form` отправляют POST на `/api/telegram` (старые скрипты — на `/api/send-telegram`, тот же обработчик).

**На Vercel обязательно** задайте переменные окружения `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` — файл `config/telegram.json` в git не попадает.

Локально скопируйте `config/telegram.example.json` → `config/telegram.json` и вставьте токен и chat id.

Проверка API: `GET /api/telegram` → `{"ok":true,"configured":true}`.

## Локальная разработка

```bash
npm install
npm run dev
```

`npm run dev` поднимает статику и API `/api/telegram` на порту 3000. Live Server (5500) API не обслуживает — заявки не уйдут.

## Генерация SEO-страниц

```bash
npm run generate:seo
```

Константы домена и телефона — в `scripts/generate-seo-pages.mjs`.
