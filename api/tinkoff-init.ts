import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'http';

function sendJSON(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  // @ts-ignore
  if (res.setHeader) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function makeToken(fields: Record<string, any>, password: string) {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
  }
  clean.Password = password;
  const str = Object.keys(clean).sort().map(k => clean[k]).join('');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });

  req.on('end', async () => {
    try {
      const { amount, orderId, description, customerKey, successUrl, failUrl } =
        JSON.parse(body || '{}');

      if (!Number.isInteger(amount) || amount <= 0) {
        return sendJSON(res, 400, { error: 'amount (kopecks) is required and must be > 0' });
      }
      if (!orderId || typeof orderId !== 'string') {
        return sendJSON(res, 400, { error: 'orderId is required' });
      }

      const TerminalKey = process.env.TINKOFF_TERMINAL_KEY;
      const Password    = process.env.TINKOFF_PASSWORD;
      if (!TerminalKey || !Password) {
        return sendJSON(res, 500, { error: 'Server not configured: missing env vars' });
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

      const raw = await tinkoffRes.text();
      let data: any;
      try { data = JSON.parse(raw); } catch { data = null; }

      if (!data) {
        return sendJSON(res, 502, { error: 'Bad gateway to Tinkoff', raw });
      }
      if (!data.Success) {
        return sendJSON(res, 400, { error: data.Message || 'Init failed', details: data });
      }

      return sendJSON(res, 200, {
        paymentUrl: data.PaymentURL,
        paymentId: data.PaymentId,
      });
    } catch (e: any) {
      return sendJSON(res, 500, { error: e?.message || 'Server error' });
    }
  });
}
