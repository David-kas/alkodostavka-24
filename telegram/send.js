import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATHS = [
  path.join(__dirname, '..', 'config', 'telegram.json'),
  path.join(process.cwd(), 'config', 'telegram.json'),
];

function loadFileConfig() {
  for (const configPath of CONFIG_PATHS) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      // try next path
    }
  }
  return {};
}

export function getTelegramCredentials() {
  const fileConfig = loadFileConfig();

  const token =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    process.env.BOT_TOKEN?.trim() ||
    fileConfig.TELEGRAM_BOT_TOKEN ||
    '';

  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    process.env.CHAT_ID?.trim() ||
    fileConfig.TELEGRAM_CHAT_ID ||
    '';

  return { token: token || '', chatId: chatId || '' };
}

function sanitizeForTelegram(text) {
  if (text == null || text === '') return '—';
  return String(text).replace(/[\u0000-\u001F\\]/g, ' ').slice(0, 2000);
}

function formatRub(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('ru-RU') + ' ₽';
}

export function buildOrderMessage({ name, phone, comment, address, cart, source, orderType, pageUrl }) {
  const safeName = sanitizeForTelegram(name);
  const safePhone = sanitizeForTelegram(phone);
  const safeComment = sanitizeForTelegram(comment);
  const safeAddress = sanitizeForTelegram(address);
  const safeSource = sanitizeForTelegram(source);
  const safeType = sanitizeForTelegram(orderType || 'Заявка');
  const safePage = sanitizeForTelegram(pageUrl);
  const items = Array.isArray(cart) ? cart.filter((it) => it && it.name) : [];

  let message = `📩 ${safeType} — АЛКОдоставка\n\n`;
  message += `👤 Имя: ${safeName}\n`;
  message += `📞 Телефон: ${safePhone}\n`;

  if (safeAddress && safeAddress !== '—') {
    message += `📍 Адрес: ${safeAddress}\n`;
  }

  if (items.length) {
    message += `\n📦 Состав заказа:\n`;
    let total = 0;
    items.forEach(function (it, idx) {
      const qty = Number(it.qty) || 1;
      const price = Number(it.price) || 0;
      const lineTotal = price * qty;
      total += lineTotal;
      message += `${idx + 1}. ${sanitizeForTelegram(it.name)} × ${qty} — ${formatRub(lineTotal)}\n`;
    });
    message += `\n💰 Итого: ${formatRub(total)}\n`;
  }

  if (safeComment && safeComment !== '—') {
    message += `\n💬 Комментарий: ${safeComment}\n`;
  }

  message += `\n🕐 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n`;
  message += `📍 Источник: ${safeSource}`;

  if (pageUrl) {
    message += `\nСтраница: ${safePage}`;
  }

  return message;
}

export async function sendTelegramMessage(text) {
  const { token, chatId } = getTelegramCredentials();

  if (!token || !chatId) {
    return {
      ok: false,
      error: 'Telegram не настроен: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID',
      code: 'TELEGRAM_NOT_CONFIGURED',
    };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { ok: true };
    }
    return { ok: false, error: data.description || 'Telegram API error', code: 'TELEGRAM_API' };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Не удалось связаться с Telegram',
      code: 'TELEGRAM_NETWORK',
    };
  }
}
