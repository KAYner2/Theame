// api/tinkoff-callback.js — ESM, Vercel
import crypto from 'node:crypto';

// ===================== ENV =====================
const TG_TOKEN             = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID           = process.env.TELEGRAM_CHAT_ID || '';
const TINKOFF_PASSWORD     = process.env.TINKOFF_PASSWORD || ''; // пароль терминала из ЛК
const IDEMPOTENCY_TTL_SEC  = Number(process.env.IDEMPOTENCY_TTL_SEC || 60 * 60 * 24 * 14); // 14 дней
const PUSH_AUTH            = String(process.env.PUSH_AUTH || 'false') === 'true'; // пушить AUTHORIZED (по умолчанию — нет)
const DRY_RUN              = String(process.env.DRY_RUN || 'false') === 'true';   // не слать в TG, только лог (для отладки)

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

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

// — TG с таймаутом и 1 ретраем
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, reason: 'no-env' };
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  async function doSend(signal) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true }),
      signal,
    });
    const bodyTxt = await r.text().catch(() => '');
    if (!r.ok) return { ok: false, reason: `tg-fail ${r.status}`, body: bodyTxt };
    return { ok: true };
  }

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort('timeout'), 8000);
    const res = await doSend(ac.signal);
    clearTimeout(t);
    if (res.ok) return res;

    // один повтор, если HTTP ошибка
    const ac2 = new AbortController();
    const t2 = setTimeout(() => ac2.abort('timeout'), 8000);
    const res2 = await doSend(ac2.signal);
    clearTimeout(t2);
    return res2;
  } catch (e) {
    return { ok: false, reason: 'fetch-error', error: String(e) };
  }
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
    // Быстрый тест руками из браузера/поста:
    if (req.method === 'GET') {
      const now = new Date().toLocaleString('ru-RU');
      const text = `✅ Тест из Vercel (${now})\nДомен: ${req.headers.host}\nDRY_RUN=${DRY_RUN}`;
      const tg = DRY_RUN ? { ok: true, dry_run: true } : await sendTG(text);
      res.status(200).json({ ok: true, mode: 'GET', tg });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      return;
    }

    const body = await readBody(req);

    // 1) Проверка подписи
    if (!TINKOFF_PASSWORD) {
      console.warn('[tinkoff] missing terminal password env');
      res.status(500).send('MISSING_TINKOFF_PASSWORD');
      return;
    }

    const theirToken = String(body?.Token || '').toLowerCase();
    const ourToken   = computeTinkoffToken(body, TINKOFF_PASSWORD).toLowerCase();

    if (!theirToken || theirToken !== ourToken) {
      console.warn('[tinkoff] bad token, ignore', { theirTokenLen: theirToken?.length || 0 });
      // Отвечаем 200, чтобы не получить лавину ретраев, но ничего не делаем
      res.status(200).send('IGNORED_BAD_TOKEN');
      return;
    }

    // 2) Идентификатор платежа
    const paymentId = body?.PaymentId || body?.OrderId || null;
    const status    = String(body?.Status || '');
    const success   = String(body?.Success) === 'true' || body?.Success === true;

    if (!paymentId) {
      console.warn('[tinkoff] no payment id — skip TG');
      res.status(200).send('IGNORED_NO_PAYMENT_ID');
      return;
    }

    // 3) Решение о пуше (минимум — CONFIRMED; опционально — AUTHORIZED)
    const shouldPush =
      (success && isFinalStatus(status)) ||
      (PUSH_AUTH && isAuthStatus(status));

    if (shouldPush) {
      // один раз на весь платёж, даже если CONFIRMED пришёл повторно/через время
      const first = await setIdempotentOncePerPayment(paymentId);
      if (first) {
        const msg = formatMessage(body);
        if (DRY_RUN) {
          console.log('[tinkoff][dry-run] TG message:\n' + msg);
        } else {
          sendTG(msg).catch(err => console.error('[tinkoff] tg send error', err));
        }
      } else {
        // уже отправляли — молча подтверждаем
      }
    }

    // 4) всегда быстрый OK банку (чтобы не было ретраев)
    res.status(200).send('OK');
  } catch (e) {
    // на вебхуках лучше не провоцировать ретраи
    console.error('[tinkoff] handler error', e);
    res.status(200).send('HANDLED');
  }
}

// В ESM-режиме конфиг такой:
export const config = {
  api: { bodyParser: true },
};
