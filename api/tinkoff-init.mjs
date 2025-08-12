// api/tinkoff-init.mjs
import crypto from 'node:crypto';

function makeToken(fields, password) {
  const clean = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = String(v);
    }
  }
  clean.Password = password;
  const str = Object.keys(clean).sort().map((k) => clean[k]).join('');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  try {
    res.setHeader?.('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const bodyRaw = req.body ?? {};
    const body = typeof bodyRaw === 'string' ? JSON.parse(bodyRaw || '{}') : bodyRaw;

    const {
      amount,
      orderId,
      description,
      customerKey,
      successUrl,
      failUrl,
      receipt, // <-- сюда фронт передаёт чек
    } = body;

    if (!Number.isInteger(amount) || amount <= 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'amount (kopecks) is required and must be > 0' }));
      return;
    }
    if (!orderId || typeof orderId !== 'string') {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'orderId is required' }));
      return;
    }

    const TerminalKey = process.env.TINKOFF_TERMINAL_KEY;
    const Password = process.env.TINKOFF_PASSWORD;
    if (!TerminalKey || !Password) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Server not configured: missing env vars' }));
      return;
    }

    const payload = {
      TerminalKey,
      Amount: amount, // копейки
      OrderId: orderId,
      Description: description || 'Оплата заказа',
      CustomerKey: customerKey,
      SuccessURL: successUrl || 'https://your-site.ru/success',
      FailURL: failUrl || 'https://your-site.ru/fail',
    };

    // 1) Считаем токен БЕЗ Receipt
const tokenFields = { ...payload }; // тут только базовые поля
const Token = makeToken(tokenFields, Password);

// 2) Формируем тело запроса: Receipt кладём рядом, но в токене его нет
const bodyToSend = receipt && typeof receipt === 'object'
  ? { ...payload, Receipt: receipt, Token }
  : { ...payload, Token };

// 3) Шлём Init
const r = await fetch('https://securepay.tinkoff.ru/v2/Init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bodyToSend),
});

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!data) {
      console.error('Tinkoff Init: non-JSON:', text); // ← лог в консоль сервера
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Bad gateway to Tinkoff', raw: text }));
      return;
    }
    if (!data.Success) {
      console.error('Tinkoff Init failed:', JSON.stringify(data, null, 2)); // ← лог в консоль сервера
      res.statusCode = 400;
      res.end(JSON.stringify({ error: data.Message || 'Init failed', details: data }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ paymentUrl: data.PaymentURL, paymentId: data.PaymentId }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e?.message || 'Server error' }));
  }
}
