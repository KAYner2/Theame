// api/tinkoff-callback.js — ESM, Vercel
import crypto from 'node:crypto';

// ===================== ENV =====================
const TG_TOKEN            = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID_RAW      = process.env.TELEGRAM_CHAT_ID || ''; // можно несколько через запятую
const TINKOFF_PASSWORD    = process.env.TINKOFF_PASSWORD || ''; // пароль терминала из ЛК
const IDEMPOTENCY_TTL_SEC = Number(process.env.IDEMPOTENCY_TTL_SEC || 60 * 60 * 24 * 14); // 14 дней
const PUSH_AUTH           = String(process.env.PUSH_AUTH || 'false') === 'true';
const DRY_RUN             = String(process.env.DRY_RUN || 'false') === 'true';

// === DEBUG (включай только на время отладки!) ===
const DEBUG_WEBHOOK       = String(process.env.DEBUG_WEBHOOK || 'false') === 'true';       // слать краткий отчёт по КАЖДОМУ POST (до проверок)
const DEBUG_TRUST_BAD_TOKEN = String(process.env.DEBUG_TRUST_BAD_TOKEN || 'false') === 'true'; // слать даже если подпись неверная (ОПАСНО!)

// распарсим список чатов
const TG_CHAT_IDS = TG_CHAT_ID_RAW.split(',').map(s => s.trim()).filter(Boolean);

// ================== Vercel KV (Upstash) ==================
async function getKV() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv'); // добавь зависимость в package.json
      return kv;
    }
  } catch {}
  return null;
}

// === очень простой in-memory fallback на жизнь инстанса ===
const memStore = new Map();
function memHas(key) {
  const item = memStore.get(key);
  if (!item) return false;
  if (Date.now() > item.expiresAt) { memStore.delete(key); return false; }
  return true;
}
function memSetNX(key, ttlSec) {
  if (memHas(key)) return false;
  memStore.set(key, { expiresAt: Date.now() + ttlSec * 1000 });
  return true;
}

// ===================== UTILS =====================
const toRub = (kop = 0) => (Number(kop) / 100).toFixed(2);

function getItems(body) {
  const items = body?.Receipt?.Items || body?.Items || body?.DATA?.Receipt?.Items || [];
  return Array.isArray(items) ? items : [];
}

// читаем JSON или x-www-form-urlencoded
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');

  const ct = String(req.headers['content-type'] || '').toLowerCase();

  if (ct.includes('application/x-www-form-urlencoded')) {
    try {
      const params = new URLSearchParams(raw);
      const obj = Object.fromEntries(params.entries());
      if (obj.Amount != null && !Number.isNaN(Number(obj.Amount))) obj.Amount = Number(obj.Amount);
      return obj;
    } catch { return {}; }
  }

  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

// — TG c таймаутом, 1 ретраем и рассылкой в несколько chat_id
async function sendTG(text) {
  if (!TG_TOKEN || TG_CHAT_IDS.length === 0) return { ok: false, reason: 'no-env-or-chat' };
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  async function doSend(chat_id, signal) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
      signal,
    });
    const bodyTxt = await r.text().catch(() => '');
    return { chat_id, ok: r.ok, status: r.status, body: bodyTxt };
  }

  const results = [];
  for (const chatId of TG_CHAT_IDS) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort('timeout'), 8000);
      let res = await doSend(chatId, ac.signal);
      clearTimeout(t);
      if (!res.ok) {
        const ac2 = new AbortController();
        const t2 = setTimeout(() => ac2.abort('timeout'), 8000);
        res = await doSend(chatId, ac2.signal);
        clearTimeout(t2);
      }
      results.push(res);
    } catch (e) {
      results.push({ chat_id: chatId, ok: false, error: String(e) });
    }
  }
  return results;
}

// === Проверка подписи Tinkoff (SHA-256) ===
function computeTinkoffToken(data, terminalPassword) {
  const payload = { ...data };
  delete payload.Token;
  payload.Password = terminalPassword;

  // Success -> 'true' / 'false'
  if (typeof payload.Success === 'boolean') {
    payload.Success = payload.Success ? 'true' : 'false';
  } else if (payload.Success !== undefined) {
    payload.Success = String(payload.Success) === 'true' ? 'true' : 'false';
  }

  // Собираем только примитивные значения верхнего уровня
  const keys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
  const concat = keys.map(k => {
    const v = payload[k];
    return (v === null || typeof v !== 'object') ? String(v ?? '') : '';
  }).join('');

  return crypto.createHash('sha256').update(concat).digest('hex');
}

function isFinalStatus(status = '') {
  return String(status).toUpperCase() === 'CONFIRMED';
}
function isAuthStatus(status = '') {
  return String(status).toUpperCase() === 'AUTHORIZED';
}

function formatMessage(body) {
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

  return (
`💳 Платёж (T-Bank)

Статус: ${status}
Заказ: ${orderId}
Покупатель: ${customer}
Сумма: ${amountRub} ₽${firstName ? `

Название букета: ${firstName}` : ''}${itemsText ? `

Состав заказа:
${itemsText}` : ''}`
  );
}

async function setIdempotentOncePerPayment(paymentId) {
  const key = `tinkoff:${paymentId}`; // один ключ на весь платёж
  const kv = await getKV();
  if (kv) {
    const ok = await kv.set(key, '1', { ex: IDEMPOTENCY_TTL_SEC, nx: true });
    return ok === 'OK';
  }
  return memSetNX(key, IDEMPOTENCY_TTL_SEC);
}

// ===================== HANDLER =====================
export default async function handler(req, res) {
  try {
    // Быстрый тест руками:
    if (req.method === 'GET') {
      const now = new Date().toLocaleString('ru-RU');
      const text = `✅ Тест из Vercel (${now})
Домен: ${req.headers.host}
DRY_RUN=${DRY_RUN}
CHAT_IDS=${TG_CHAT_IDS.join(',') || '—'}`;
      const tg = DRY_RUN ? [{ ok: true, dry_run: true }] : await sendTG(text);
      res.status(200).json({ ok: true, mode: 'GET', tg });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      return;
    }

    const body = await readBody(req);

    // === DEBUG: шлём краткий отчёт о любом входящем POST ===
    if (DEBUG_WEBHOOK) {
      const dbg = `🐞 DEBUG Tinkoff Webhook
IP: ${req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '—'}
CT: ${req.headers['content-type'] || '—'}
Status: ${body?.Status || '—'}, Success: ${body?.Success}
PaymentId: ${body?.PaymentId || '—'}
OrderId: ${body?.OrderId || '—'}
Amount: ${toRub(body?.Amount || 0)} ₽`;
      if (!DRY_RUN) sendTG(dbg).catch(()=>{});
      console.log('[DEBUG_WEBHOOK] ', dbg);
    }

    // 1) Проверка наличия пароля (всегда 200, чтобы банк не ретраил)
    if (!TINKOFF_PASSWORD) {
      console.warn('[tinkoff] missing TINKOFF_PASSWORD env');
      res.status(200).send('MISSING_TINKOFF_PASSWORD');
      return;
    }

    // 2) Проверка подписи
    const theirToken = String(body?.Token || '').toLowerCase();
    const ourToken   = computeTinkoffToken(body, TINKOFF_PASSWORD).toLowerCase();
    const tokenMatch = !!theirToken && theirToken === ourToken;

    if (!tokenMatch && !DEBUG_TRUST_BAD_TOKEN) {
      console.warn('[tinkoff] bad token, ignore', { theirTokenLen: theirToken?.length || 0 });
      res.status(200).send('IGNORED_BAD_TOKEN');
      return;
    }

    // 3) Идентификатор платежа и статус
    const paymentId = body?.PaymentId || body?.OrderId || null;
    const status    = String(body?.Status || '');
    const success   = String(body?.Success) === 'true' || body?.Success === true;

    if (!paymentId) {
      console.warn('[tinkoff] no payment id — skip TG');
      res.status(200).send('IGNORED_NO_PAYMENT_ID');
      return;
    }

    // 4) Когда пушим
    const shouldPush =
      (success && isFinalStatus(status)) ||
      (PUSH_AUTH && isAuthStatus(status)) ||
      (DEBUG_TRUST_BAD_TOKEN && !tokenMatch); // если включён режим «доверять» — пушим для наблюдения

    if (shouldPush) {
      const first = await setIdempotentOncePerPayment(paymentId);
      if (first || DEBUG_TRUST_BAD_TOKEN) {
        const msg = formatMessage(body) + (!tokenMatch ? `

⚠️ ВНИМАНИЕ: Подпись не совпала (DEBUG_TRUST_BAD_TOKEN).` : '');
        if (DRY_RUN) {
          console.log('[tinkoff][dry-run] TG message:\n' + msg);
        } else {
          sendTG(msg).catch(err => console.error('[tinkoff] tg send error', err));
        }
      }
    }

    // 5) Всегда быстрый OK банку
    res.status(200).send('OK');
  } catch (e) {
    console.error('[tinkoff] handler error', e);
    // Всегда 200, чтобы банк не ретраил
    res.status(200).send('HANDLED');
  }
}

// В ESM-режиме конфиг такой:
export const config = {
  api: { bodyParser: true },
};
