// /api/tinkoff-init.ts
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'http';

function makeToken(fields: Record<string, any>, password: string) {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
  }
  clean.Password = password;
  const str = Object.keys(clean).sort().map(k => clean[k]).join('');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req: IncomingMessage & { body?: any; method?: string }, res: ServerResponse & { json?: (data: any) => void }) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const { amount, orderId, description, customerKey, successUrl, failUrl } = parsed;

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

      const TerminalKey = process.env.TINKOFF_TERMINAL_KEY!;
      const Password = process.env.TINKOFF_PASSWORD!;
      if (!TerminalKey || !Password) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Server not configured: missing env vars' }));
        return;
      }

      const payload = {
        TerminalKey,
        Amount: amount,
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

      const data = await tinkoffRes.json();
      if (!data?.Success) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: data?.Message || 'Init failed', details: data }));
        return;
      }

      res.statusCode = 200;
      res.end(JSON.stringify({
        paymentUrl: data.PaymentURL,
        paymentId: data.PaymentId,
      }));
    } catch (err) {
      console.error('tinkoff-init error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Server error' }));
    }
  });
}
