// api/order-notify.js — ESM, Vercel
// Принимает POST от Supabase-триггера и шлёт уведомление в Telegram

const TG_TOKEN       = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_IDS    = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(s=>s.trim()).filter(Boolean);
const WEBHOOK_TOKEN  = process.env.SUPABASE_WEBHOOK_TOKEN || '';   // тот же, что захардкожен в SQL-функции
const IDEMP_TTL_SEC  = Number(process.env.IDEMPOTENCY_TTL_SEC || 60*60*24*14); // 14 дней

// --- KV (опционально) + in-memory fallback ---
async function getKV() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv');
      return kv;
    }
  } catch {}
  return null;
}
const mem = new Map();
function memSetNX(key, ttlSec) {
  const now = Date.now();
  const until = mem.get(key);
  if (until && until > now) return false;
  mem.set(key, now + ttlSec*1000);
  return true;
}
async function idemOnce(key) {
  const kv = await getKV();
  if (kv) {
    const ok = await kv.set(key, '1', { ex: IDEMP_TTL_SEC, nx: true });
    return ok === 'OK';
  }
  return memSetNX(key, IDEMP_TTL_SEC);
}

// --- utils ---
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
async function sendTG(text) {
  if (!TG_TOKEN || TG_CHAT_IDS.length === 0) return;
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  for (const chat_id of TG_CHAT_IDS) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort('timeout'), 8000);
      let r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!r.ok) { // один повтор
        const ac2 = new AbortController();
        const t2 = setTimeout(() => ac2.abort('timeout'), 8000);
        await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
          signal: ac2.signal,
        }).catch(()=>{});
        clearTimeout(t2);
      }
    } catch {}
  }
}
function fmtRub(n) {
  if (n == null) return '0';
  const val = Number(n);
  if (Number.isFinite(val)) return val.toLocaleString('ru-RU', { minimumFractionDigits: 0 });
  return String(n);
}

function formatOrderMessage(order, event) {
  const id            = order.id ?? '—';
  const total         = fmtRub(order.total_amount ?? order.amount_total ?? order.amount);
  const payMethodMap  = { card: 'Карта', sbp: 'СБП', cash: 'Наличные' };
  const payMethod     = payMethodMap[order.payment_method] || order.payment_method || '—';
  const deliveryMap   = { delivery: 'Доставка', pickup: 'Самовывоз', clarify: 'Уточнить' };
  const delivery      = deliveryMap[order.delivery_type] || order.delivery_type || '—';

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.map(it => {
    const name = String(it?.name ?? it?.Name ?? '').trim();
    const qty  = Number(it?.cartQuantity ?? it?.quantity ?? 1);
    const price = fmtRub(it?.price ?? it?.Price ?? 0);
    const sum   = fmtRub((it?.price ?? it?.Price ?? 0) * qty);
    return `• ${name} ×${qty} — ${sum} ₽ (${price} ₽/шт)`;
  }).join('\n');

  let addr = '';
  if (order.delivery_type === 'delivery') {
    const parts = [order.recipient_address, order.district].filter(Boolean);
    addr = parts.length ? `\nАдрес: ${parts.join(', ')}` : '';
  }

  const recipient = (order.recipient_name || order.recipient_phone)
    ? `\nПолучатель: ${order.recipient_name || '—'}${order.recipient_phone ? ` (${order.recipient_phone})` : ''}`
    : '';

  const customer = (order.customer_name || order.customer_phone)
    ? `\nЗаказчик: ${order.customer_name || '—'}${order.customer_phone ? ` (${order.customer_phone})` : ''}`
    : '';

  const promo = order.promo_code
    ? `\nПромокод: ${order.promo_code}${order.discount_amount ? ` (−${fmtRub(order.discount_amount)} ₽)` : ''}`
    : '';

  const when = [order.delivery_date, order.delivery_time].filter(Boolean).join(' ');
  const whenLine = when ? `\nКогда: ${when}` : '';

  const statusLine = order.payment_status || order.status ? `\nСтатус: ${order.payment_status || order.status}` : '';

  return (
`🧾 Заказ #${id} — ${event}
Сумма: ${total ?? '—'} ₽
Оплата: ${payMethod}
Доставка: ${delivery}${statusLine}${addr}${whenLine}${recipient}${customer}${promo}
${itemsText ? `\nСостав:\n${itemsText}` : ''}`
  );
}

// --- handler ---
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await sendTG(`✅ Тест order-notify с ${req.headers.host}`);
      return res.status(200).json({ ok: true, mode: 'GET' });
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // Авторизация от Supabase-триггера (Bearer <token>)
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
      return res.status(200).send('IGNORED_BAD_TOKEN'); // подтверждаем, но игнорим
    }

    const body = await readBody(req);
    const event = String(body?.event || 'order.unknown');
    const order = body?.order || null;
    if (!order || !order.id) {
      return res.status(200).send('IGNORED_NO_ORDER');
    }

    // идемпотентность:
    // - INSERT: 1 раз на order.id
    // - UPDATE: 1 раз на (order.id + новый статус)
    let idemKey = '';
    if (event === 'order.insert') {
      idemKey = `order:${order.id}`;
    } else if (event === 'order.update') {
      const st = String(order.payment_status || order.status || 'nostatus').toLowerCase();
      idemKey = `order:${order.id}:${st}`;
    } else {
      idemKey = `order:${order.id}:evt:${event}`;
    }

    const first = await idemOnce(idemKey);
    if (!first) return res.status(200).send('OK_DUP');

    const text = formatOrderMessage(order, event);
    await sendTG(text);

    return res.status(200).send('OK');
  } catch (e) {
    console.error('[order-notify] error', e);
    return res.status(200).send('HANDLED');
  }
}

export const config = { api: { bodyParser: true } };
