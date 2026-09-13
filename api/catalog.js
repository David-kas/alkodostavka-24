import {
  readCatalogAsync,
  writeCatalogAsync,
  verifyAdminToken,
  getAdminPassword,
  IMAGES_DIR,
  makeProductId,
} from '../lib/catalog-store.mjs';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const data = await readCatalogAsync();
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      return res.status(500).json({ error: 'Не удалось прочитать каталог', code: 'READ_ERROR' });
    }
  }

  const auth = verifyAdminToken(req.headers.authorization || req.headers.Authorization);
  if (!auth.ok) {
    const status = auth.code === 'ADMIN_NOT_CONFIGURED' ? 503 : 401;
    return res.status(status).json({
      error: auth.code === 'ADMIN_NOT_CONFIGURED'
        ? 'Админка не настроена: задайте ADMIN_PASSWORD'
        : 'Неверный пароль',
      code: auth.code,
    });
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        return res.status(400).json({ error: 'Некорректный JSON', code: 'INVALID_JSON' });
      }
    }
    if (!body || !Array.isArray(body.products)) {
      return res.status(400).json({ error: 'Нужен массив products', code: 'VALIDATION' });
    }
    try {
      const normalized = body.products
        .map((p) => ({
          id: String(p.id || '').trim() || makeProductId(p.name),
          name: String(p.name || '').trim(),
          category: String(p.category || 'strong'),
          price: Math.max(0, parseInt(p.price, 10) || 0),
          image: String(p.image || '').trim(),
          alt: String(p.alt || p.name || '').trim(),
          desc: String(p.desc || '').trim(),
          inStock: p.inStock !== false,
        }))
        .filter((p) => p.name);
      const prev = await readCatalogAsync();
      const data = await writeCatalogAsync({ ...prev, products: normalized });
      return res.status(200).json({
        success: true,
        count: data.products.length,
        updatedAt: data.updatedAt,
        storage: process.env.VERCEL ? 'blob' : 'local',
      });
    } catch (err) {
      console.error(err);
      if (err.code === 'NO_BLOB') {
        return res.status(503).json({
          error:
            'На Vercel нет Blob Storage. Vercel → Storage → Blob → Connect to project → Redeploy. Либо локально: npm run dev → http://127.0.0.1:3000/admin/',
          code: 'NO_BLOB',
        });
      }
      if (err.code === 'EROFS' || err.code === 'EPERM') {
        return res.status(503).json({
          error:
            'Диск на сервере только для чтения. Локально: npm run dev → http://127.0.0.1:3000/admin/',
          code: 'READONLY_FS',
        });
      }
      return res.status(500).json({ error: 'Ошибка сохранения: ' + (err.message || ''), code: 'WRITE_ERROR' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export async function handleCatalogUpload(req, res, bodyBuffer, contentType) {
  const auth = verifyAdminToken(req.headers.authorization || req.headers.Authorization);
  if (!auth.ok) {
    return res.status(401).json({ success: false, error: 'Unauthorized', code: auth.code });
  }

  if (process.env.VERCEL) {
    return res.status(501).json({
      error: 'Загрузка фото на Vercel: укажите путь images/... вручную',
      code: 'UPLOAD_DEV_ONLY',
    });
  }

  const boundary = /boundary=(.+)$/i.exec(contentType || '');
  if (!boundary) {
    return res.status(400).json({ error: 'multipart/form-data required', code: 'VALIDATION' });
  }

  const b = boundary[1];
  const parts = bodyBuffer.toString('binary').split('--' + b);
  let filename = '';
  let fileData = null;

  for (const part of parts) {
    if (!part.includes('filename=')) continue;
    const nameMatch = /filename="([^"]+)"/i.exec(part);
    const idx = part.indexOf('\r\n\r\n');
    if (idx === -1 || !nameMatch) continue;
    filename = path.basename(nameMatch[1]).replace(/[^a-zA-Z0-9._-]/g, '-');
    fileData = Buffer.from(part.slice(idx + 4).replace(/\r\n$/, ''), 'binary');
    break;
  }

  if (!filename || !fileData || !fileData.length) {
    return res.status(400).json({ error: 'Файл не найден', code: 'VALIDATION' });
  }

  const ext = path.extname(filename).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return res.status(400).json({ error: 'Допустимы jpg, png, webp, gif', code: 'VALIDATION' });
  }

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (fs.existsSync(path.join(IMAGES_DIR, filename))) {
    filename = `${path.basename(filename, ext)}-${Date.now()}${ext}`;
  }
  const finalPath = path.join(IMAGES_DIR, filename);
  fs.writeFileSync(finalPath, fileData);
  return res.status(200).json({ success: true, path: `images/${filename}` });
}

export function handleAdminLogin(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'Некорректный JSON' });
    }
  }
  const password = getAdminPassword();
  if (!password) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD не задан', code: 'ADMIN_NOT_CONFIGURED' });
  }
  if (String(body.password || '').trim() !== password) {
    return res.status(401).json({ error: 'Неверный пароль', code: 'UNAUTHORIZED' });
  }
  return res.status(200).json({ success: true, token: password });
}
