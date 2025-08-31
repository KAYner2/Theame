// api/tinkoff-callback.js — ESM, Vercel
import crypto from 'node:crypto';

// ===================== ENV =====================
const TG_TOKEN            = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID_RAW      = process.env.TELEGRAM_CHAT_ID || ''; // можно несколько через запятую
const TINKOFF_PASSWORD    = process.env.TINKOFF_PASSWORD || ''; // пароль терминала из ЛК
const IDEMPOTENCY_TTL_SEC = Number(process.env.IDEMPOTENCY_TTL_SEC || 60 * 60 * 24 * 14); // 14 дней

// Отладка (включай только временно!)
const DRY_RUN               = String(process.env.DRY_RUN || 'false') === 'true';                 // не слать в TG, только логи
const DEBUG_WEBHOOK         = String(process.env.DEBUG_WEBHOOK || 'false') === 'true';           // слать краткую сводку по КАЖДОМУ POST
const DEBUG_TRUST_BAD_TOKEN = String(process.env.DEBUG_TRUST_BAD_TOKEN || 'false') === 'true';   // принимать вебхук даже при неверной подписи (опасно!)

/**
 * Фильтр статусов (опционально):
 * - по умолчанию шлём на ЛЮБОЙ статус (все этапы)
 * - можно задать через запятую, например: "AUTHORIZED,CONFIRMED,REVERSED,REFUNDED"
 */
const SEND_STATUSES_RAW = (process.env.SEND_STATUSES || '*').trim();
const SEND_STATUSES = new Set(
  SEND_STATUSES_RAW === '*'
    ? [] // пустой сет = любые статусы
    : SEND_STATUSES_RAW.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
);

// несколько chat_id
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
function memSetNX(key, ttlSec) {
  const now = Date.now();
  const until = memStore.get(key);
  if (until && until > now) return false;
  memStore.set(key, now + ttlSec * 1000);
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

      if (!r.ok) {
        // один повтор
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

// === Подпись Tinkoff (SHA-256 по их правилам) ===
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

// — Красивые эмодзи для статусов
function statusEmoji(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'AUTHORIZED') return '⏳';        // предварительная авторизация
  if (s === 'CONFIRMED')  return '✅';        // подтверждён
  if (s === 'REVERSED')   return '↩️';        // отмена авторизации
  if (s === 'REFUNDED')   return '💸';        // полный возврат
  if (s === 'PARTIAL_REFUNDED' || s === 'PARTIALREVERSED') return '💵';
  if (s === 'CANCELED' || s === 'CANCELLED') return '🛑';
  if (s === 'REJECTED')   return '❌';
  return 'ℹ️';
}

function formatMessage(body) {
  const status    = String(body?.Status || '—');
  const success   = String(body?.Success) === 'true' || body?.Success === true;
  const orderId   = body?.OrderId || body?.PaymentId || '—';
  const paymentId = body?.PaymentId || '—';
  const amountRub = toRub(body?.Amount || 0);
  const customer  = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';

  const items = getItems(body);
  const itemsText = items.map(it => {
    const name  = String(it?.Name ?? '').trim();
    const qty   = Number(it?.Quantity ?? 1);
    const price = toRub(it?.Price ?? 0);
    const amt   = toRub(it?.Amount ?? 0);
    return `• ${name} ×${qty} — ${amt} ₽ (${price} ₽/шт)`;
  }).join('\n');

  const e = statusEmoji(status);

  return (
`${e} Платёж (T-Bank) — ${status}
PaymentId: ${paymentId}
Заказ: ${orderId}
Успех: ${success ? 'true' : 'false'}
Сумма: ${amountRub} ₽
Покупатель: ${customer}${itemsText ? `

Состав заказа:
${itemsText}` : ''}`
  );
}

// — Идемпотентность: «один раз на PaymentId+Status»
async function idempotentPerStatus(paymentId, status) {
  const key = `tinkoff:${paymentId}:${String(status).toUpperCase()}`;
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
CHAT_IDS=${TG_CHAT_IDS.join(',') || '—'}
SEND_STATUSES=${SEND_STATUSES_RAW}`;
      if (!DRY_RUN) await sendTG(text);
      return res.status(200).json({ ok: true, mode: 'GET' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = await readBody(req);

    // DEBUG: короткая сводка по любому входящему POST
    if (DEBUG_WEBHOOK && !DRY_RUN) {
      const dbg = `🐞 DEBUG Webhook
Status=${body?.Status || '—'}
Success=${body?.Success}
PaymentId=${body?.PaymentId || '—'}
OrderId=${body?.OrderId || '—'}
Amount=${toRub(body?.Amount || 0)} ₽`;
      sendTG(dbg).catch(()=>{});
    }

    // 1) Наличие пароля терминала
    if (!TINKOFF_PASSWORD) {
      console.warn('[tinkoff] missing TINKOFF_PASSWORD env');
      return res.status(200).send('MISSING_TINKOFF_PASSWORD'); // всегда 200, чтобы банк не ретраил
    }

    // 2) Проверка подписи
    const theirToken = String(body?.Token || '').toLowerCase();
    const ourToken   = computeTinkoffToken(body, TINKOFF_PASSWORD).toLowerCase();
    const tokenMatch = !!theirToken && theirToken === ourToken;

    if (!tokenMatch && !DEBUG_TRUST_BAD_TOKEN) {
      console.warn('[tinkoff] bad token — ignore');
      return res.status(200).send('IGNORED_BAD_TOKEN');
    }

    // 3) Идентификаторы
    const paymentId = body?.PaymentId || body?.OrderId || null;
    const status    = String(body?.Status || '').toUpperCase();

    if (!paymentId || !status) {
      console.warn('[tinkoff] no paymentId or status');
      return res.status(200).send('IGNORED_NO_ID_OR_STATUS');
    }

    // 4) Фильтрация статусов (если задана переменная SEND_STATUSES)
    if (SEND_STATUSES.size && !SEND_STATUSES.has(status)) {
      // фильтр включён, а статус не в списке — подтверждаем, но не шлём
      return res.status(200).send('OK_FILTERED');
    }

    // 5) Идемпотентность по (PaymentId, Status)
    const firstTime = await idempotentPerStatus(paymentId, status);
    if (!firstTime && !DEBUG_TRUST_BAD_TOKEN) {
      return res.status(200).send('OK_DUP');
    }

    // 6) Формируем и шлём
    const msg = formatMessage(body) + (!tokenMatch ? `

⚠️ ВНИМАНИЕ: подпись не совпала (DEBUG_TRUST_BAD_TOKEN).` : '');
    if (!DRY_RUN) {
      sendTG(msg).catch(err => console.error('[tinkoff] tg send error', err));
    } else {
      console.log('[tinkoff][dry-run] message:\n' + msg);
    }

    // 7) Всегда быстрый OK банку
    return res.status(200).send('OK');
  } catch (e) {
    console.error('[tinkoff] handler error', e);
    // Всегда 200, чтобы банк не ретраил
    return res.status(200).send('HANDLED');
  }
}

// ESM config
export const config = {
  api: { bodyParser: true },
};
