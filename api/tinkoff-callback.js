// tinkoff-callback.js
// Обработчик вебхука Tinkoff для Vercel/Express.
//
// Что делает:
// 1) Обрабатываем только Status === 'CONFIRMED'
// 2) Отвечаем 200 OK всегда (чтобы Tinkoff не ретраил), но в TG шлём только при CONFIRMED
// 3) (Опционально) проверяем подпись Token по TINKOFF_TERMINAL_PASSWORD
// 4) Идемпотентность по PaymentId (в пределах живого процесса)
// 5) Добавляем в сообщение список товаров из Receipt.Items (если пришло)

const crypto = require('crypto');

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TINKOFF_PASSWORD = process.env.TINKOFF_TERMINAL_PASSWORD;

// Простая идемпотентность в памяти процесса
const processed = new Set();

// ---- utils ----
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
    console.warn('⚠️ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — не отправляем в TG');
    return { ok: false, reason: 'no-telegram-env' };
  }
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const msg = `TG sendMessage failed: ${res.status} ${res.statusText}`;
      console.error(msg);
      return { ok: false, reason: msg };
    }
    return { ok: true };
  } catch (e) {
    console.error('TG fetch error:', e);
    return { ok: false, reason: 'fetch-error' };
  }
}

/**
 * Достаём список позиций из тела уведомления.
 * Ищем в нескольких местах на случай разных версий:
 * - body.Receipt.Items (классика Tinkoff)
 * - body.Items (иногда кладут сюда)
 * - body.DATA?.Receipt?.Items (если обёрнуто)
 */
function extractItems(body) {
  const items =
    body?.Receipt?.Items ||
    body?.Items ||
    body?.DATA?.Receipt?.Items ||
    [];
  if (!Array.isArray(items)) return [];

  // Нормализуем: { Name, Price, Quantity, Amount }
  return items
    .map((it) => ({
      Name: String(it?.Name ?? '').trim(),
      Price: Number(it?.Price ?? 0),      // у Tinkoff чаще всего Цена в копейках
      Quantity: Number(it?.Quantity ?? 1),
      Amount: Number(it?.Amount ?? 0),    // сумма по позиции (обычно тоже в копейках)
    }))
    .filter((it) => it.Name.length > 0);
}

/**
 * Формируем блок текста с позициями:
 * - конвертируем копейки в рубли
 */
function buildItemsText(items) {
  if (!items.length) return '';

  const lines = items.map((it) => {
    const priceRub = (it.Price || 0) / 100;
    const amountRub = (it.Amount || 0) / 100;
    // Пример: • Букет «Аме 101» ×2 — 3 000.00 ₽ (1 500.00 ₽/шт)
    return `• ${escapeMd(it.Name)} ×${it.Quantity} — *${amountRub.toFixed(2)} ₽* (${priceRub.toFixed(2)} ₽/шт)`;
  });

  const total = items.reduce((acc, it) => acc + (Number(it.Amount) || 0), 0) / 100;

  return (
    `\n🧾 *Состав заказа:*\n` +
    lines.join('\n') +
    `\n\n*Итого по позициям:* ${total.toFixed(2)} ₽`
  );
}

// Немного безопасного экранирования markdown для TG
function escapeMd(s) {
  return String(s).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// ---- handler ----
module.exports = async function tinkoffCallback(req, res) {
  try {
    if (req.method && req.method.toUpperCase() !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // body может быть уже распарсен мидлварью
    const body =
      (req.body && Object.keys(req.body).length ? req.body : null) ||
      (await (async () => {
        try {
          return JSON.parse(req.rawBody?.toString?.() || '{}');
        } catch {
          return {};
        }
      })());

    console.log('⚡ Tinkoff webhook:', JSON.stringify(body));

    // --- (опционально) верификация подписи Token ---
    if (TINKOFF_PASSWORD && body && typeof body === 'object') {
      const expected = computeTinkoffToken(body, TINKOFF_PASSWORD);
      const got = (body.Token || '').toString().toUpperCase();
      if (!got || got !== expected) {
        console.warn('❌ Неверный Token от Tinkoff. Ожидали:', expected, 'Получили:', got);
        return res.status(200).json({ ok: true, ignored: true, reason: 'bad-token' });
      }
    }

    const status = body?.Status || '';
    const paymentId = body?.PaymentId || body?.OrderId || '';

    // идемпотентность (если один и тот же PaymentId уже слали)
    if (paymentId && processed.has(paymentId)) {
      console.log('↩️ Уже обработан ранее:', paymentId);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // интересен только CONFIRMED
    if (status !== 'CONFIRMED') {
      console.log(`⏭️ Игнорируем статус: ${status}`);
      return res.status(200).json({ ok: true, ignored: true, status });
    }

    // Базовые поля
    const amountRub = (Number(body?.Amount) || 0) / 100; // у Tinkoff сумма обычно в копейках
    const customer =
      body?.CustomerKey ||
      body?.Phone ||
      body?.Email ||
      'не указано';
    const orderId = body?.OrderId || '—';

    // Позиции чека (если в webhook пришли)
    const items = extractItems(body);
    const itemsText = buildItemsText(items);

    // Финальный текст
    const text =
      `💳 *Оплата подтверждена*\n` +
      `📦 Заказ: *${escapeMd(orderId)}*\n` +
      `👤 Покупатель: ${escapeMd(customer)}\n` +
      `💰 Сумма: *${amountRub.toFixed(2)} ₽*` +
      (paymentId ? `\n🆔 PaymentId: ${escapeMd(String(paymentId))}` : '') +
      `\n🕒 ${escapeMd(new Date().toLocaleString('ru-RU'))}` +
      (itemsText || '');

    await sendTelegram(text);

    if (paymentId) processed.add(paymentId);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('tinkoff-callback error:', e);
    // Даже при ошибке отвечаем 200, чтобы Tinkoff не ретраил
    return res.status(200).json({ ok: true, error: 'internal-handled' });
  }
};
