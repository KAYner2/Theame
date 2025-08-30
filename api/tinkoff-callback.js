// api/tinkoff-callback.js  — ESM, Vercel
import crypto from 'node:crypto';

// === ENV ===
const TG_TOKEN            = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID          = process.env.TELEGRAM_CHAT_ID || '';
const TINKOFF_PASSWORD    = process.env.TINKOFF_TERMINAL_PASSWORD || ''; // пароль терминала из ЛК
const IDEMPOTENCY_TTL_SEC = Number(process.env.IDEMPOTENCY_TTL_SEC || 60 * 60 * 24 * 14); // 14 дней

// --- optional Vercel KV (Upstash) ---
async function getKV() {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv'); // не забудь добавить зависимость
      return kv;
    }
  } catch {}
  return null;
}

// --- очень простой in-memory fallback на время жизни инстанса ---
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

// === UTILS ===
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

async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) return { ok: false, reason: 'no-env' };
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

// === Проверка подписи Token (SHA-256 по правилам Т-Банка) ===
// Алгоритм (сжатое резюме по оф. докам):
// 1) Берём все поля входящего JSON, убираем поле Token, добавляем поле Password = TINKOFF_TERMINAL_PASSWORD
// 2) Приводим Success к строке 'true'/'false' (важно)
// 3) Сортируем КЛЮЧИ по алфавиту, конкатенируем ЗНАЧЕНИЯ в одну строку
// 4) Делаем SHA-256 и сравниваем с присланным Token (без учёта регистра)
function computeTinkoffToken(data, terminalPassword) {
  const payload = { ...data };
  delete payload.Token;
  payload.Password = terminalPassword;

  // Приводим Success к строке, если есть
  if (typeof payload.Success === 'boolean') {
    payload.Success = payload.Success ? 'true' : 'false';
  } else if (payload.Success !== undefined) {
    // любые "нестандартные" представления приводим к 'true'/'false'
    payload.Success = String(payload.Success) === 'true' ? 'true' : 'false';
  }

  // Вытаскиваем только примитивы (в webhook обычно плоские поля)
  const keys = Object.keys(payload).sort((a, b) => a.localeCompare(b));
  const concat = keys.map(k => {
    const v = payload[k];
    return typeof v === 'object' ? '' : String(v ?? '');
  }).join('');

  return crypto.createHash('sha256').update(concat).digest('hex');
}

function isFinalStatus(status = '') {
  // Для пуша в TG оставим строго CONFIRMED (одно-стадийная оплата финал).
  // Если у тебя двухстадийная — тоже пушим только CONFIRMED, AUTHORIZED можно игнорить/логировать.
  return String(status).toUpperCase() === 'CONFIRMED';
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

async function setIdempotent(key) {
  // сначала пробуем KV с NX, потом in-memory fallback
  const kv = await getKV();
  if (kv) {
    // set NX + EX
    const ok = await kv.set(key, '1', { ex: IDEMPOTENCY_TTL_SEC, nx: true });
    // @vercel/kv вернёт null если ключ уже был
    return ok === 'OK';
  }
  return memSetNX(key, IDEMPOTENCY_TTL_SEC);
}

// === Handler ===
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const now = new Date().toLocaleString('ru-RU');
      const tg = await sendTG(`✅ Тест из Vercel (${now})\nДомен: ${req.headers.host}`);
      // Ответ для ручной проверки
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
      // Без пароля нельзя валидировать — лучше явно отказать, чтобы банк ретраил, а ты увидел misconfig
      res.status(500).send('MISSING_TINKOFF_TERMINAL_PASSWORD');
      return;
    }
    const theirToken = String(body?.Token || '').toLowerCase();
    const ourToken   = computeTinkoffToken(body, TINKOFF_PASSWORD).toLowerCase();

    if (!theirToken || theirToken !== ourToken) {
      // Некорректная подпись — отвечаем 200, но НИЧЕГО не делаем (чтобы не ддосили TG). Можно логировать в свою систему.
      res.status(200).send('IGNORED_BAD_TOKEN');
      return;
    }

    // 2) Быстрый ответ банку — чтобы не ретраил (уже можно 200 OK)
    // Но перед ответом — ставим идемпотентный флажок и параллельно (без await) пошлём ТГ, если нужно
    const status   = String(body?.Status || '');
    const success  = String(body?.Success) === 'true' || body?.Success === true;

    // формируем ключ идемпотентности
    const paymentId = body?.PaymentId || body?.OrderId || 'no-id';
    const eventKey  = `${paymentId}:${status}`; // при желании можно ужесточить (добавить Amount и т.п.)

    // Решение, пушим только CONFIRMED одного раза
    if (success && isFinalStatus(status)) {
      const isFirstTime = await setIdempotent(eventKey);
      if (isFirstTime) {
        // не блокируем ответ банку — шлём ТГ «в фоне», но без фоновых тасков: просто не await
        sendTG(formatMessage(body)).catch(() => {});
      }
    }

    // Всегда отвечаем «OK» — банк прекратит ретраи
    res.status(200).send('OK');
  } catch (e) {
    // На вебхуках лучше всегда 200, чтобы банк не бомбил ретраями; при этом зафиксируй ошибку у себя (лог/обсервабилити)
    res.status(200).send('HANDLED');
  }
}

// В ESM-режиме конфиг так:
export const config = {
  api: { bodyParser: true },
};
