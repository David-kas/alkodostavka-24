import { probeBlobStorage, getAdminPassword, getBlobEnvFlags } from '../lib/catalog-store.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isVercel = Boolean(process.env.VERCEL);
  const hasPassword = Boolean(getAdminPassword());
  const blob = await probeBlobStorage();
  const blobEnv = getBlobEnvFlags();
  const connected = blobEnv.hasToken || blobEnv.hasStoreId;

  return res.status(200).json({
    ok: true,
    host: isVercel ? 'vercel' : 'local',
    canSave: !isVercel || blob.available,
    storage: blob.mode,
    adminConfigured: hasPassword,
    blob: {
      available: blob.available,
      connected,
      hasStoreId: blobEnv.hasStoreId,
      hasToken: blobEnv.hasToken,
      reason: blob.reason || null,
    },
    hints: isVercel
      ? connected
        ? ['Blob подключён. Нажмите «Сохранить на сайт» в админке — каталог запишется в хранилище.']
        : blob.available
          ? ['Хранилище отвечает, но проект сайта ещё не связан с Blob.']
          : [
              'Хранилище alkodostavka-blob создано, но не привязано к проекту сайта.',
              'На странице Blob → вкладка Projects → Connect to Project → выберите alkodostavka24.',
              'Затем Redeploy проекта сайта (Deployments → Redeploy).',
            ]
      : ['Локальный режим: изменения пишутся в data/catalog.json и catalog.html.'],
  });
}
