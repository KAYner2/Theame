
const TG_TOKEN   = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function readBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  try {
    const raw = req.rawBody?.toString?.() || '';
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function toRub(kop = 0) {
  return (Number(kop) / 100).toFixed(2);
}

function getItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  return Array.isArray(items) ? items : [];
}

async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    return { ok: false, reason: 'no-env', haveToken: !!TG_TOKEN, haveChat: !!TG_CHAT_ID };
  }
  try {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true }),
    });
    const body = await r.text().catch(() => '');
    if (!r.ok) return { ok: false, reason: `tg-fail ${r.status}`, body };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'fetch-error', error: String(e) };
  }
}

module.exports = async function handler(req, res) {
  const diag = {
    method: req.method,
    url: req.url,
    host: req.headers?.host,
    env: { haveToken: !!TG_TOKEN, haveChat: !!TG_CHAT_ID },
  };

  try {
    if (req.method === 'GET') {
      const now = new Date().toISOString();
      const tg = await sendTG(`✅ Тест из Vercel (${now})\nДомен: ${req.headers.host}`);
      diag.tg = tg;
      // GET всегда 200 и никогда не падает
      return res.status(200).json({ ok: true, mode: 'GET', diag });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed', diag });
    }

    const body = readBody(req);
    diag.bodyPreview = JSON.stringify(body).slice(0, 800);

    const status    = body?.Status || '—';
    const orderId   = body?.OrderId || body?.PaymentId || '—';
    const amountRub = toRub(body?.Amount || 0);
    const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';
    const items     = getItems(body);

    const firstName = items[0]?.Name ? String(items[0].Name) : '';
    const itemsText = items.map(it => {
      const name  = String(it?.Name ?? '').trim();
      const qty   = Number(it?.Quantity ?? 1);
      const price = toRub(it?.Price ?? 0);
      const amt   = toRub(it?.Amount ?? 0);
      return `• ${name} ×${qty} — ${amt} ₽ (${price} ₽/шт)`;
    }).join('\n');

    const text =
`💳 Оповещение Tinkoff

Статус: ${status}
Заказ: ${orderId}
Покупатель: ${customer}
Сумма: ${amountRub} ₽${firstName ? `

Название букета: ${firstName}` : ''}${itemsText ? `

Позиции:
${itemsText}` : ''}`;

    const tg = await sendTG(text);
    diag.tg = tg;

    return res.status(200).json({ ok: true, mode: 'POST', diag });
  } catch (e) {
    diag.error = String(e);
    // Даже при ошибке — 200, чтобы банк не ретраил
    return res.status(200).json({ ok: true, error: 'handled', diag });
  }
};

// Важно: так Vercel отдаёт req.rawBody, и наш универсальный парсер не падает.
module.exports.config = { api: { bodyParser: false } };