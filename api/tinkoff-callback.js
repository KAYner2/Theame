// tinkoff-callback.js
// Серверный обработчик вебхука Tinkoff для Vercel/Express.
// Фиксы:
// 1) Обрабатываем только Status === 'CONFIRMED'
// 2) Быстро отвечаем 200 OK (чтобы Tinkoff не ретраил)
// 3) (Опционально) проверяем подпись Token, если задан TINKOFF_TERMINAL_PASSWORD
// 4) Идемпотентность по PaymentId (в пределах живого инстанса)

/* eslint-disable no-console */
const crypto = require('crypto');

// ==== конфиг через env ====
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;         // обязателен
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;         // обязателен
const TINKOFF_PASSWORD = process.env.TINKOFF_TERMINAL_PASSWORD; // опционально, для проверки Token

// простая идемпотентность (в рамках процесса)
const processed = new Set();

/**
 * Вычисление Token Tinkoff:
 * - Берём все поля body, кроме 'Token'
 * - Добавляем поле Password = TINKOFF_TERMINAL_PASSWORD
 * - Сортируем ключи по алфавиту
 * - Конкатенируем значения в одну строку
 * - SHA256 по строке, hex в верхнем регистре
 */
function computeTinkoffToken(body, password) {
  const data = { ...body };
  delete data.Token;
  data.Password = password;

  const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  const concatenated = keys.map((k) => (data[k] ?? '')).join('');
  const hash = crypto.createHash('sha256').update(concatenated).digest('hex');
  return hash.toUpperCase();
}

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — пропускаем отправку в TG');
    return { ok: false, reason: 'no-telegram-env' };
  }
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  }).catch((e) => ({ ok: false, error: e?.message || 'fetch-error' }));

  if (!res || !res.ok) {
    const msg = `TG sendMessage failed: ${res?.status} ${res?.statusText}`;
    console.error(msg);
    return { ok: false, reason: msg };
  }
  return { ok: true };
}

// Универсальный обработчик (Express / Vercel)
module.exports = async function tinkoffCallback(req, res) {
  try {
    if (req.method && req.method.toUpperCase() !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // В Vercel/Express body уже распарсен (если стоит парсер json).
    // На всякий случай попробуем fallback.
    const body = req.body && Object.keys(req.body).length ? req.body : await (async () => {
      try {
        return JSON.parse(req.rawBody?.toString?.() || '{}');
      } catch {
        return {};
      }
    })();

    // ЛОГ для диагностики (убери в проде)
    console.log('⚡ Tinkoff webhook:', JSON.stringify(body));

    // Всегда отвечаем 200 как можно быстрее — иначе Tinkoff будет ретраить
    // Но шлём реальный ответ после валидаций ниже
    // (оставляем единственный res.json в конце каждого return)

    // --- (опционально) проверка подписи Token ---
    if (TINKOFF_PASSWORD && body && typeof body === 'object') {
      const expected = computeTinkoffToken(body, TINKOFF_PASSWORD);
      const got = (body.Token || '').toString().toUpperCase();
      if (!got || got !== expected) {
        console.warn('❌ Неверный Token от Tinkoff. Ожидали:', expected, 'Получили:', got);
        // Отвечаем 200, но игнорируем (чтобы Tinkoff не ретраил и мы не спамили TG)
        return res.status(200).json({ ok: true, ignored: true, reason: 'bad-token' });
      }
    }

    const status = body?.Status || '';
    const paymentId = body?.PaymentId || body?.OrderId || '';

    // --- идемпотентность по PaymentId (или OrderId) ---
    if (paymentId && processed.has(paymentId)) {
      console.log('↩️ Уже обработан ранее:', paymentId);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // --- фильтруем статусы: интересует только CONFIRMED ---
    if (status !== 'CONFIRMED') {
      console.log(`⏭️ Игнорируем статус: ${status}`);
      return res.status(200).json({ ok: true, ignored: true, status });
    }

    // Собираем данные для TG
    const amountRub = (Number(body?.Amount) || 0) / 100; // у Tinkoff сумма обычно в копейках
    const customer = body?.CustomerKey || body?.Phone || body?.Email || 'не указано';
    const orderId = body?.OrderId || '—';

    const text =
      `💳 *Оплата подтверждена*\n` +
      `📦 Заказ: *${orderId}*\n` +
      `👤 Покупатель: ${customer}\n` +
      `💰 Сумма: *${amountRub.toFixed(2)} ₽*\n` +
      `🆔 PaymentId: ${body?.PaymentId || '—'}\n` +
      `🕒 ${new Date().toLocaleString('ru-RU')}`;

    // Отправляем в Telegram (не падаем, если TG недоступен)
    await sendTelegram(text);

    if (paymentId) processed.add(paymentId);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('tinkoff-callback error:', e);
    // Даже при ошибке отвечаем 200, чтобы Tinkoff не долбил ретраями
    return res.status(200).json({ ok: true, error: 'internal-handled' });
  }
};
