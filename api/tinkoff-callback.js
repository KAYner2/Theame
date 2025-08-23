// api/tinkoff-callback.js
// Tinkoff -> Telegram (красиво, без базы).
// Требуются env-переменные в Vercel:
//   TG_BOT_TOKEN       — токен бота
//   TELEGRAM_CHAT_ID   — id чата (например 624995887)
//
// GET  /api/tinkoff-callback  — шлёт тестовое сообщение в TG
// POST /api/tinkoff-callback  — принимает вебхук Tinkoff и отправляет красивое сообщение

const TG_TOKEN   = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// ---------- utils ----------
const toRub = (kop = 0) => (Number(kop) / 100).toFixed(2);
const nowRu = () => {
  try { return new Date().toLocaleString('ru-RU'); }
  catch { return new Date().toISOString(); }
};

// Экранирование под Telegram MarkdownV2
function md(s) {
  return String(s).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Позиции из разных мест тела
function pickItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  if (!Array.isArray(items)) return [];
  return items.map(it => ({
    name: String(it?.Name ?? '').trim(),
    qty: Number(it?.Quantity ?? 1),
    price_kop: Number(it?.Price ?? 0),
    amount_kop: Number(it?.Amount ?? 0),
  })).filter(x => x.name);
}

function buildItemsText(items) {
  if (!items.length) return '';
  const lines = items.map(it => {
    const price = toRub(it.price_kop);
    const amt   = toRub(it.amount_kop);
    return `• ${md(it.name)} ×${it.qty} — *${md(amt)} ₽* (${md(price)} ₽/шт)`;
  }).join('\n');
  const total = toRub(items.reduce((a, it) => a + (it.amount_kop || 0), 0));
  return `\n🧾 *Состав заказа:*\n${lines}\n\n*Итого по позициям:* ${md(total)} ₽`;
}

// Универсальное чтение JSON тела
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

// Отправка в Telegram с безопасной разбивкой по лимиту 4096
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.error('❌ TG env missing', { haveToken: !!TG_TOKEN, haveChat: !!TG_CHAT_ID });
    return { ok: false, reason: 'no-env' };
  }
  const SAFE = 3800;
  const parts = [];
  if (text.length <= SAFE) parts.push(text);
  else {
    let rest = text;
    while (rest.length) {
      let slice = rest.slice(0, SAFE);
      const lastNL = slice.lastIndexOf('\n');
      if (lastNL > SAFE * 0.6) slice = slice.slice(0, lastNL);
      parts.push(slice);
      rest = rest.slice(slice.length);
    }
  }

  for (const chunk of parts) {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: chunk,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error('TG sendMessage failed:', r.status, r.statusText, t);
      return { ok: false };
    }
  }
  return { ok: true };
}

// ---------- handler ----------
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await sendTG(`✅ Тест из Vercel\n🕒 ${md(nowRu())}`);
      return res.status(200).json({ ok: true, mode: 'GET-test' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = await readBody(req);

    // Ключевые поля
    const status     = body?.Status || '';
    const orderId    = body?.OrderId || body?.PaymentId || '—';
    const paymentId  = body?.PaymentId || '';
    const amount_kop = Number(body?.Amount || 0);
    const amount_rub = toRub(amount_kop);
    const customer   = body?.CustomerKey || body?.Name || body?.Phone || body?.Email || 'не указано';
    const phone      = body?.Phone || null;
    const email      = body?.Email || null;

    // Позиции / название букета
    const items = pickItems(body);
    const bouquetName = items[0]?.name || '';

    // Красивое сообщение
    const text =
`💳 *Оплата подтверждена*
📦 Заказ: *${md(orderId)}*
👤 Покупатель: ${md(customer)}
${phone ? `📞 Телефон: ${md(phone)}\n` : ''}${email ? `✉️ Email: ${md(email)}\n` : ''}💰 Сумма: *${md(amount_rub)} ₽*
${paymentId ? `🆔 PaymentId: ${md(paymentId)}\n` : ''}🕒 ${md(nowRu())}
${bouquetName ? `\n🌹 *Название букета:* ${md(bouquetName)}` : ''}${buildItemsText(items)}`;

    await sendTG(text);

    // Всегда 200 OK, чтобы банк не ретраил
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('handler error:', e);
    // Даже при ошибке — 200
    return res.status(200).json({ ok: true, error: 'handled' });
  }
}

// Vercel пускай сам парсит JSON — но у нас естьfallback.
export const config = {
  api: { bodyParser: true },
};
