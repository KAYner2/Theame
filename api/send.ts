// api/green/send.ts  (можно .js — содержимое то же)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const idInstance = process.env.GREEN_API_ID_INSTANCE;
    const token = process.env.GREEN_API_TOKEN;
    // опционально: если нужно принудительно использовать региональный поддомен типа https://1105.api.green-api.com
    const base = process.env.GREEN_API_BASE_URL || 'https://api.green-api.com';

    if (!idInstance || !token) {
      return res.status(500).json({
        ok: false,
        error: 'Missing GREEN_API_ID_INSTANCE or GREEN_API_TOKEN',
      });
    }

    const { phone, name, text } = req.body || {};
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'phone is required' });
    }

    const clean = String(phone).replace(/[^\d]/g, '');
    const chatId = `${clean}@c.us`;

    const message =
      text ||
      `Здравствуйте${name ? ', ' + name : ''}! Спасибо, что подписались на рассылку 🌸`;

    const url = `${base}/waInstance${idInstance}/sendMessage/${token}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok || !data?.idMessage) {
      return res
        .status(502)
        .json({ ok: false, error: 'Green API error', data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || 'Unknown error' });
  }
}
