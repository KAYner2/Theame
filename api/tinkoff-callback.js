// api/tinkoff-callback.js  (ESM-версия для Vercel)
const TG_TOKEN   = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

const toRub = (kop = 0) => (Number(kop) / 100).toFixed(2);

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
    const bodyTxt = await r.text().catch(() => '');
    if (!r.ok) return { ok: false, reason: `tg-fail ${r.status}`, body: bodyTxt };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'fetch-error', error: String(e) };
  }
}

// Если bodyParser включён, Vercel сам положит объект в req.body.
// На всякий случай подстрахуемся чтением raw.
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const now = new Date().toLocaleString('ru-RU');
      const tg = await sendTG(`✅ Тест из Vercel (${now})\nДомен: ${req.headers.host}`);
      return res.status(200).json({ ok: true, mode: 'GET', tg });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = await readBody(req);

    const status    = body?.Status || '—';
    const orderId   = body?.OrderId || body?.PaymentId || '—';
    const amountRub = toRub(body?.Amount || 0);
    const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';

    const items = getItems(body);
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
    return res.status(200).json({ ok: true, mode: 'POST', tg });
  } catch (e) {
    return res.status(200).json({ ok: true, error: 'handled', reason: String(e) });
  }
}

// В ESM-режиме конфиг экспортируем так:
export const config = {
  api: {
    bodyParser: true, // пусть Vercel парсит JSON сам — так проще
  },
};
