// api/tinkoff-callback.js
// МЕГА-ПРОСТОЙ обработчик вебхука Tinkoff -> Telegram.
// Никакой валидации Token, никакого Markdown. Просто отправляет всё как есть.

const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// если у тебя Node <18 — раскомментируй:
// const fetch = require('node-fetch');

function pickItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    name: String(it?.Name ?? '').trim(),
    qty:  Number(it?.Quantity ?? 1),
    price: Number(it?.Price ?? 0),   // копейки
    amount: Number(it?.Amount ?? 0), // копейки
  })).filter(x => x.name);
}

function rubles(kop = 0) {
  return (Number(kop) / 100).toFixed(2);
}

async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.warn('TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы');
    return;
  }
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,               // БЕЗ parse_mode — никаких проблем с экранированием
      disable_web_page_preview: true,
    }),
  }).catch(e => console.error('TG error:', e));
}

function safeParseRaw(req) {
  try {
    const raw = req.rawBody?.toString?.() ?? '';
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method && req.method.toUpperCase() !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // берём уже распарсенный body или пробуем сырое
    const body =
      (req.body && Object.keys(req.body).length ? req.body : null) ||
      safeParseRaw(req);

    // основные поля
    const status    = body?.Status || '—';
    const orderId   = body?.OrderId || body?.PaymentId || '—';
    const amountRub = rubles(body?.Amount || 0);
    const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';

    // позиции (название букета и т.д.)
    const items = pickItems(body);
    const firstItem = items[0]?.name ? items[0].name : ''; // "название букета"
    const itemsLines = items.map(it =>
      `• ${it.name} ×${it.qty} — ${rubles(it.amount)} ₽ (${rubles(it.price)} ₽/шт)`
    ).join('\n');

    // короткий и понятный текст
    let text =
`🟢 Tinkoff уведомление

Статус: ${status}
Заказ: ${orderId}
Покупатель: ${customer}
Сумма: ${amountRub} ₽${firstItem ? `

Название букета: ${firstItem}` : ''}`;

    if (items.length) {
      text += `

Позиции:
${itemsLines}`;
    }

    // чуточку дебага в хвост (обрезаем до 1500 символов, чтобы не упереться в лимит)
    const debug = JSON.stringify(body).slice(0, 1500);
    text += `

— —
Технические данные (усечено):
${debug}`;

    await sendTG(text);

    // Всегда 200 OK, чтобы Tinkoff не ретраил
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook error:', e);
    return res.status(200).json({ ok: true, error: 'handled' });
  }
};

// Для Vercel нужен сырой body -> отключим bodyParser.
module.exports.config = { api: { bodyParser: false } };