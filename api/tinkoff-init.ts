// /api/tinkoff-init.ts
import crypto from 'node:crypto';

function makeToken(fields: Record<string, any>, password: string) {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
  }
  clean.Password = password;
  const str = Object.keys(clean).sort().map((k) => clean[k]).join('');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req: any, res: any) {
  try {
    // Всегда отдаём JSON
    res.setHeader?.('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // В Vercel body часто уже распарсен
    const bodyRaw = req.body ?? {};
    const body = typeof bodyRaw === 'string' ? JSON.parse(bodyRaw || '{}') : bodyRaw;

    const { amount, orderId, description, customerKey, successUrl, failUrl } = body;

    if (!Number.isInteger(amount) || amount <= 0) {
      res.status(400).json({ error: 'amount (kopecks) is required and must be > 0' });
      return;
    }
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({ error: 'orderId is required' });
      return;
    }

    const TerminalKey = process.env.TINKOFF_TERMINAL_KEY;
    const Password = process.env.TINKOFF_PASSWORD;

    if (!TerminalKey || !Password) {
      res.status(500).json({ error: 'Server not configured: missing env vars' });
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

    const Token = makeToken(payload, Password);

    const tinkoffRes = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, Token }),
    });

    const text = await tinkoffRes.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!data) {
      res.status(502).json({ error: 'Bad gateway to Tinkoff', raw: text });
      return;
    }
    if (!data.Success) {
      res.status(400).json({ error: data.Message || 'Init failed', details: data });
      return;
    }

    res.status(200).json({
      paymentUrl: data.PaymentURL,
      paymentId: data.PaymentId,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
