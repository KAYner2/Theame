// api/tinkoff-callback.js
// Диагностическая версия: показывает, вызывается ли функция, видит ли env, что пришло в теле,
// и пытается отправить в Telegram. ВСЕГДА 200 ОК.

const TG_TOKEN   = process.env.TG_BOT_TOKEN;          // у тебя уже задан на Vercel
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;      // добавь 624995887 в Vercel

const haveToken = !!TG_TOKEN;
const haveChat  = !!TG_CHAT_ID;
const rub = (kop = 0) => (Number(kop) / 100).toFixed(2);

// Пробуем вытащить body как угодно
function pickBody(req) {
  if (req.body && Object.keys(req.body).length) return req.body;
  try {
    const raw = req.rawBody?.toString?.() || '';
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Позиции из разных полей
function getItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  return Array.isArray(items) ? items : [];
}

// Отправка в TG (без Markdown)
async function sendTG(text) {
  if (!haveToken || !haveChat) {
    return { ok: false, error: 'no-env', detail: { haveToken, haveChat } };
  }
  try {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true }),
    });
    const respText = await r.text().catch(() => '');
    if (!r.ok) {
      console.error('TG sendMessage failed:', r.status, r.statusText, respText);
      return { ok: false, error: 'tg-fail', status: r.status, body: respText };
    }
    return { ok: true };
  } catch (e) {
    console.error('TG fetch error:', e);
    return { ok: false, error: 'fetch-error', detail: String(e) };
  }
}

module.exports = async function handler(req, res) {
  // Сразу собираем диагностическую инфу
  const diag = {
    method: req.method,
    url: req.url,
    env: { haveToken, haveChat },        // не светим сами значения
    headers: req.headers,
  };

  try {
    if (req.method === 'GET') {
      const now = new Date().toISOString();
      const tg = await sendTG(`✅ Тест из Vercel (${now})\nДомен: ${req.headers.host}`);
      diag.tg = tg;
      return res.status(200).json({ ok: true, mode: 'GET-test', diag });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed', diag });
    }

    const body = pickBody(req);
    diag.rawSeen = typeof req.rawBody === 'string' ? req.rawBody.slice(0, 2000) : undefined;
    diag.body = body;

    // Ключевые поля для сообщения
    const status    = body?.Status || '—';
    const orderId   = body?.OrderId || body?.PaymentId || '—';
    const amountRub = rub(body?.Amount || 0);
    const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';

    // Позиции
    const items = getItems(body);
    const firstName = items[0]?.Name ? String(items[0].Name) : '';
    const itemsLines = items.map(it => {
      const name  = String(it?.Name ?? '').trim();
      const qty   = Number(it?.Quantity ?? 1);
      const price = rub(it?.Price ?? 0);
      const amt   = rub(it?.Amount ?? 0);
      return `• ${name} ×${qty} — ${amt} ₽ (${price} ₽/шт)`;
    }).join('\n');

    const message =
`💳 Оповещение Tinkoff

Статус: ${status}
Заказ: ${orderId}
Покупатель: ${customer}
Сумма: ${amountRub} ₽${firstName ? `

Название букета: ${firstName}` : ''}${itemsLines ? `

Позиции:
${itemsLines}` : ''}`;

    const tg = await sendTG(message);
    diag.tg = tg;

    // ВСЕГДА 200
    return res.status(200).json({ ok: true, mode: 'POST', diag });
  } catch (e) {
    console.error('webhook error:', e);
    diag.error = String(e);
    return res.status(200).json({ ok: true, error: 'handled', diag });
  }
};

// Нужен сырой body на Vercel для универсального парсинга
module.exports.config = { api: { bodyParser: false } };
