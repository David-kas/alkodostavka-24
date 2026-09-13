import {
  buildOrderMessage,
  getTelegramCredentials,
  sendTelegramMessage,
} from '../telegram/send.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const { token, chatId } = getTelegramCredentials();
    const configured = Boolean(token && chatId);
    return res.status(200).json({
      ok: configured,
      configured,
      hasToken: Boolean(token),
      hasChatId: Boolean(chatId),
      hint: configured
        ? undefined
        : 'Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в Vercel → Settings → Environment Variables и сделайте Redeploy, либо положите config/telegram.json в проект.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Некорректный JSON', code: 'INVALID_JSON' });
    }
  }

  const {
    message,
    name,
    phone,
    comment,
    address,
    cart,
    source = 'Сайт',
    orderType = 'Заявка',
    pageUrl,
  } = body || {};

  if (message && typeof message === 'string' && !name && !phone) {
    const result = await sendTelegramMessage(message);
    if (result.ok) {
      return res.status(200).json({ success: true });
    }
    const status = result.code === 'TELEGRAM_NOT_CONFIGURED' ? 503 : 502;
    return res.status(status).json({
      error: result.error,
      code: result.code || 'TELEGRAM_ERROR',
    });
  }

  if (!name || !phone) {
    return res.status(400).json({ error: 'Имя и телефон обязательны', code: 'VALIDATION' });
  }

  const cartItems = Array.isArray(cart)
    ? cart
        .filter((it) => it && it.name)
        .map((it) => ({
          name: String(it.name).slice(0, 200),
          price: Number(it.price) || 0,
          qty: Math.max(1, Number(it.qty) || 1),
          image: it.image ? String(it.image).slice(0, 500) : '',
        }))
    : [];

  const result = await sendTelegramMessage(
    buildOrderMessage({
      name,
      phone,
      comment,
      address,
      cart: cartItems,
      source,
      orderType,
      pageUrl: pageUrl || req.headers.referer || '',
    }),
  );

  if (result.ok) {
    return res.status(200).json({ success: true });
  }

  const status = result.code === 'TELEGRAM_NOT_CONFIGURED' ? 503 : 502;
  return res.status(status).json({
    error: result.error,
    code: result.code || 'TELEGRAM_ERROR',
  });
}
