import { handleCatalogUpload } from './catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(501).json({
    error: 'Загрузка фото на Vercel: укажите путь images/... или используйте npm run dev локально',
    code: 'UPLOAD_DEV_ONLY',
  });
}

export { handleCatalogUpload };
