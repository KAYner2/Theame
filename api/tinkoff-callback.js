// tinkoff-callback.js
// Лёгкий и надёжный обработчик вебхука Tinkoff для Vercel/Express.
//
// Делает:
// 1) ВСЕГДА отдаёт 200 OK (чтобы Tinkoff не ретраил).
// 2) В TG шлёт ТОЛЬКО при Status === 'CONFIRMED'.
// 3) Опционально валидирует Token через TINKOFF_TERMINAL_PASSWORD.
// 4) Идемпотентность по PaymentId (в памяти процесса).
// 5) В сообщение добавляет позиции чека, если есть (Receipt.Items / Items / DATA.Receipt.Items).
// 6) Совместим с Telegram MarkdownV2 (и корректно экранирует).

const crypto = require('crypto');

// На Node 18+ fetch глобальный. Если у тебя <18 — раскомментируй:
// const fetch = require('node-fetch');

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TINKOFF_PASSWORD = process.env.TINKOFF_TERMINAL_PASSWORD;

const processed = new Set();
const TG_MAX = 4096; // лимит Telegram на сообщение; возьмём запас ниже
const TG_SAFE = 3800;

// ---------- utils ----------
function computeTinkoffToken(body, password) {
  // 1) удалить Token; 2) добавить Password; 3) отсортировать ключи; 4) склеить значения; 5) SHA256 → UPPER
  const data = { ...body };
  delete data.Token;
  data.Password = password;

  const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  const concatenated = keys
    .map((k) => {
      const v = data[k];
      return v == null
        ? ''
        : typeof v === 'object'
        ? JSON.stringify(v)
        : String(v);
    })
    .join('');

  const hash = crypto.createHash('sha256').update(concatenated).digest('hex');
  return hash.toUpperCase();
}

// Экранирование под MarkdownV2
function escapeMdV2(s) {
  return String(s).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — не отправляем в TG');
    return { ok: false, reason: 'no-telegram-env' };
  }

  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  // Бьём текст на безопасные части
  const parts = [];
  if (text.length <= TG_SAFE) {
    parts.push(text);
  } else {
    let rest = text;
    while (rest.length) {
      let slice = rest.slice(0, TG_SAFE);
      // старайся резать по границе строки
      const lastNL = slice.lastIndexOf('\n');
      if (lastNL > TG_SAFE * 0.6) slice = slice.slice(0, lastNL);
      parts.push(slice);
      rest = rest.slice(slice.length);
    }
  }

  for (const chunk of parts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: chunk,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const msg = `TG sendMessage failed: ${res.status} ${res.statusText} ${body}`;
        console.error(msg);
        return { ok: false, reason: msg };
      }
    } catch (e) {
      console.error('TG fetch error:', e);
      return { ok: false, reason: 'fetch-error' };
    }
  }
  return { ok: true };
}

/**
 * Достаём список позиций из тела уведомления.
 * Понимает:
 * - body.Receipt.Items
 * - body.Items
 * - body.DATA?.Receipt?.Items
 */
function extractItems(body) {
  const items =
    body?.Receipt?.Items ||
    body?.Items ||
    body?.DATA?.Receipt?.Items ||
    [];
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      Name: String(it?.Name ?? '').trim(),
      Price: Number(it?.Price ?? 0), // копейки
      Quantity: Number(it?.Quantity ?? 1),
      Amount: Number(it?.Amount ?? 0), // копейки
    }))
    .filter((it) => it.Name.length > 0);
}

function buildItemsText(items) {
  if (!items.length) return '';
  const lines = items.map((it) => {
    const priceRub = (it.Price || 0) / 100;
    const amountRub = (it.Amount || 0) / 100;
    return `• ${escapeMdV2(it.Name)} ×${it.Quantity} — *${amountRub.toFixed(2)} ₽* (${priceRub.toFixed(2)} ₽/шт)`;
  });
  const total = items.reduce((acc, it) => acc + (Number(it.Amount) || 0), 0) / 100;
  return `\n🧾 *Состав заказа:*\n${lines.join('\n')}\n\n*Итого по позициям:* ${total.toFixed(2)} ₽`;
}

function getNowRu() {
  try {
    return new Date().toLocaleString('ru-RU');
  } catch {
    return new Date().toISOString();
  }
}

// ---------- handler ----------
module.exports = async function tinkoffCallback(req, res) {
  try {
    // CORS preflight (если нужно)
    if (req.method && req.method.toUpperCase() === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method && req.method.toUpperCase() !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // Берём уже распарсенный body, либо пробуем распарсить сырое
    const body =
      (req.body && Object.keys(req.body).length ? req.body : null) ||
      (await (async () => {
        try {
          // Vercel (Node) может класть сырой буфер в req.rawBody (если bodyParser отключён)
          const raw = req.rawBody?.toString?.() ?? '';
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })());

    console.log('⚡ Tinkoff webhook:', JSON.stringify(body));

    // (опционально) верификация подписи Token
    if (TINKOFF_PASSWORD && body && typeof body === 'object') {
      const expected = computeTinkoffToken(body, TINKOFF_PASSWORD);
      const got = (body.Token || '').toString().toUpperCase();
      if (!got || got !== expected) {
        console.warn('❌ Неверный Token от Tinkoff. Ожидали:', expected, 'Получили:', got);
        // Отвечаем 200, но ничего не делаем
        return res.status(200).json({ ok: true, ignored: true, reason: 'bad-token' });
      }
    }

    const status = body?.Status || '';
    const paymentId = body?.PaymentId || body?.OrderId || '';

    // идемпотентность
    if (paymentId && processed.has(paymentId)) {
      console.log('↩️ Уже обработан ранее:', paymentId);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Интересен только CONFIRMED
    if (status !== 'CONFIRMED') {
      console.log(`⏭️ Игнорируем статус: ${status}`);
      return res.status(200).json({ ok: true, ignored: true, status });
    }

    // Базовые поля
    const amountRub = (Number(body?.Amount) || 0) / 100; // копейки → рубли
    const customer =
      body?.CustomerKey ||
      body?.Phone ||
      body?.Email ||
      'не указано';
    const orderId = body?.OrderId || '—';

    // Позиции
    const items = extractItems(body);
    const itemsText = buildItemsText(items);

    // Финальный текст (MarkdownV2)
    const text =
      `💳 *Оплата подтверждена*\n` +
      `📦 Заказ: *${escapeMdV2(orderId)}*\n` +
      `👤 Покупатель: ${escapeMdV2(customer)}\n` +
      `💰 Сумма: *${amountRub.toFixed(2)} ₽*` +
      (paymentId ? `\n🆔 PaymentId: ${escapeMdV2(String(paymentId))}` : '') +
      `\n🕒 ${escapeMdV2(getNowRu())}` +
      (itemsText || '');

    const tg = await sendTelegram(text);
    if (!tg.ok) {
      console.error('⚠️ Не удалось отправить уведомление в TG:', tg.reason);
    }

    if (paymentId) processed.add(paymentId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('tinkoff-callback error:', e);
    // Даже при ошибке отвечаем 200, чтобы Tinkoff не ретраил
    return res.status(200).json({ ok: true, error: 'internal-handled' });
  }
};

// Если используешь Vercel (Node.js runtime) и хочешь получать сырое тело,
// положи рядом (для API route) экспорт настроек:
// module.exports.config = { api: { bodyParser: false } };
