// api/tinkoff-callback.js
// Tinkoff -> Telegram, просто и надёжно.
// ⚙️ Требуются env-переменные в Vercel:
//   TG_BOT_TOKEN       (есть у тебя уже)
//   TELEGRAM_CHAT_ID   (поставь 624995887)
//
// Что делает:
// - GET  /api/tinkoff-callback     → отправляет тест в TG (проверка)
// - POST /api/tinkoff-callback     → принимает вебхук и шлёт все ключевые поля в TG
//
// Без подписи, без Markdown, просто текст. Всегда 200 OK (чтобы Tinkoff не ретраил).

const TG_TOKEN   = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// На Vercel (Node 18+) fetch глобальный.
const rub = (kop = 0) => (Number(kop) / 100).toFixed(2);

// Попытка достать JSON даже если bodyParser выключен
function pickBody(req) {
  if (req.body && Object.keys(req.body).length) return req.body;
  try {
    const raw = req.rawBody?.toString?.() || '';
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Вытащить позиции (наименование букета и пр.) из разных возможных мест
function getItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  return Array.isArray(items) ? items : [];
}

// Отправка в Telegram (без parse_mode, чтобы ничего не экранировать)
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.error('❌ TG_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы в окружении');
    return { ok: false, reason: 'no-env' };
  }
  try {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    });
    const body = await r.text().catch(() => '');
    if (!r.ok) {
      console.error('TG sendMessage failed:', r.status, r.statusText, body);
      return { ok: false, reason: body || `${r.status} ${r.statusText}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('TG fetch error:', e);
    return { ok: false, reason: String(e) };
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const now = new Date().toLocaleString('ru-RU');
      await sendTG(`✅ Тест из Vercel\nВремя: ${now}`);
      return res.status(200).send('OK: тест отправлен');
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = pickBody(req);

    // Ключевые поля
    const status    = body?.Status || '—';
    const orderId   = body?.OrderId || body?.PaymentId || '—';
    const amountRub = rub(body?.Amount || 0);
    const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';

    // Позиции и "название букета"
    const items = getItems(body);
    const firstName = items[0]?.Name ? String(items[0].Name) : '';
    const itemsLines = items.map(it => {
      const name  = String(it?.Name ?? '').trim();
      const qty   = Number(it?.Quantity ?? 1);
      const price = rub(it?.Price ?? 0);
      const amt   = rub(it?.Amount ?? 0);
      return `• ${name} ×${qty} — ${amt} ₽ (${price} ₽/шт)`;
    }).join('\n');

    // Чуть-чуть техданных для дебага (усечённо)
    const debugShort = JSON.stringify(body).slice(0, 1500);

    const text =
`💳 Оповещение Tinkoff

Статус: ${status}
Заказ: ${orderId}
Покупатель: ${customer}
Сумма: ${amountRub} ₽${firstName ? `

Название букета: ${firstName}` : ''}${itemsLines ? `

Позиции:
${itemsLines}` : ''}

— —
Тех.данные (усечено):
${debugShort}`;

    await sendTG(text);

    // Всегда 200 OK — чтобы не было повторов от Tinkoff
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error:', e);
    // Всё равно 200, чтобы банк не ретраил
    return res.status(200).json({ ok: true, error: 'handled' });
  }
};

// Для доступа к "сырому" телу на Vercel
module.exports.config = { api: { bodyParser: false } };