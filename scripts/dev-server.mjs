/**
 * Локальный сервер: статика + POST /api/telegram (как на Vercel).
 * Запуск: npm run dev  →  http://127.0.0.1:3000
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import telegramHandler from '../api/telegram.js';
import catalogHandler, { handleCatalogUpload, handleAdminLogin } from '../api/catalog.js';
import adminStatusHandler from '../api/admin-status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key] || key === 'ADMIN_PASSWORD') process.env[key] = val;
  }
}

loadEnvFile();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function createRes(res) {
  return {
    statusCode: 200,
    setHeader(k, v) {
      res.setHeader(k, v);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      sendJson(res, this.statusCode || 200, data);
    },
  };
}

function createReq(method, urlPath, headers, body) {
  return {
    method,
    url: urlPath,
    headers,
    body,
  };
}

async function handleTelegram(req, res, bodyStr) {
  let body = bodyStr;
  try {
    body = JSON.parse(bodyStr || '{}');
  } catch {
    return sendJson(res, 400, { error: 'Некорректный JSON', code: 'INVALID_JSON' });
  }

  const fakeReq = createReq(req.method, req.url, req.headers, body);
  const fakeRes = createRes(res);
  await telegramHandler(fakeReq, fakeRes);
}

function resolveStatic(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';

  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return null;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const withHtml = filePath.replace(/\/$/, '') + '.html';
    if (fs.existsSync(withHtml)) return withHtml;
    const indexInDir = path.join(filePath, 'index.html');
    if (fs.existsSync(indexInDir)) return indexInDir;
    return null;
  }
  return filePath;
}

async function handleApiRoute(req, res, bodyStr, bodyBuffer) {
  const urlPath = (req.url || '').split('?')[0];

  if (urlPath.startsWith('/api/telegram') || urlPath.startsWith('/api/send-telegram')) {
    let body = bodyStr;
    try {
      body = JSON.parse(bodyStr || '{}');
    } catch {
      return sendJson(res, 400, { error: 'Некорректный JSON', code: 'INVALID_JSON' });
    }
    const fakeReq = createReq(req.method, req.url, req.headers, body);
    const fakeRes = createRes(res);
    return telegramHandler(fakeReq, fakeRes);
  }

  if (urlPath.startsWith('/api/admin-status')) {
    const fakeReq = createReq(req.method, req.url, req.headers, null);
    const fakeRes = createRes(res);
    return adminStatusHandler(fakeReq, fakeRes);
  }

  if (urlPath.startsWith('/api/catalog')) {
    let body = bodyStr;
    if (req.method === 'PUT') {
      try {
        body = JSON.parse(bodyStr || '{}');
      } catch {
        return sendJson(res, 400, { error: 'Некорректный JSON', code: 'INVALID_JSON' });
      }
    }
    const fakeReq = createReq(req.method, req.url, req.headers, body);
    const fakeRes = createRes(res);
    return await catalogHandler(fakeReq, fakeRes);
  }

  if (urlPath.startsWith('/api/admin-login')) {
    let body = bodyStr;
    try {
      body = JSON.parse(bodyStr || '{}');
    } catch {
      body = {};
    }
    const fakeReq = createReq(req.method, req.url, req.headers, body);
    const fakeRes = createRes(res);
    return handleAdminLogin(fakeReq, fakeRes);
  }

  if (urlPath.startsWith('/api/admin-upload') && req.method === 'POST') {
    const fakeReq = createReq(req.method, req.url, req.headers, bodyBuffer);
    const fakeRes = createRes(res);
  return handleCatalogUpload(fakeReq, fakeRes, bodyBuffer, req.headers['content-type'] || '');
  }

  return sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url || '/';

  if (urlPath.startsWith('/api/')) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyBuffer = Buffer.concat(chunks);
      const bodyStr = bodyBuffer.toString('utf8');
      if (req.method === 'GET' && (urlPath.startsWith('/api/telegram') || urlPath.startsWith('/api/send-telegram'))) {
        return await handleApiRoute(req, res, '{}', bodyBuffer);
      }
      return await handleApiRoute(req, res, bodyStr, bodyBuffer);
    } catch (err) {
      console.error('API error:', err);
      return sendJson(res, 500, { error: 'Внутренняя ошибка сервера', code: 'SERVER_ERROR' });
    }
  }

  const filePath = resolveStatic(urlPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`АЛКОдоставка dev: http://127.0.0.1:${PORT}`);
  console.log(`API заказов:       http://127.0.0.1:${PORT}/api/telegram`);
  console.log(`Админ-панель:      http://127.0.0.1:${PORT}/admin/`);
  console.log('Для корзины и админки используйте этот сервер вместо Live Server (порт 5500).');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
