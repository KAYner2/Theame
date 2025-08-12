// pages/api/tinkoff-callback.js
import crypto from 'crypto';

function makeToken(fields, password) {
  const clean = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '' && k !== 'Token') {
      clean[k] = String(v);
    }
  }
  clean.Password = password;
  const str = Object.keys(clean).sort().map((k) => clean[k]).join('');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  console.log('📩 Получено уведомление от Tinkoff:', JSON.stringify(body, null, 2));

  // Проверка токена безопасности
  const password = process.env.TINKOFF_PASSWORD;
  if (!password) {
    console.error('❌ Переменная окружения TINKOFF_PASSWORD не задана!');
    res.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  const validToken = makeToken(body, password);
  if (body.Token !== validToken) {
    console.warn('❌ Неверный токен уведомления от Tinkoff!');
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  // Настройки Telegram
  const chatId = 624995887; // твой chat_id
  const botToken = process.env.TG_BOT_TOKEN;
  if (!botToken) {
    console.error('❌ Переменная окружения TG_BOT_TOKEN не задана!');
    res.status(500).json({ error: 'Bot token not set' });
    return;
  }

  // Формируем сообщение
  const amount = body.Amount ? (body.Amount / 100).toFixed(2) : 'не указано';
  const customer = body.CustomerKey || 'неизвестно';
  const orderId = body.OrderId || 'без ID';
  const status = body.Status || 'без статуса';

  const message = `💳 *Новая оплата*
👤 Покупатель: ${customer}
📦 Order ID: ${orderId}
💰 Сумма: ${amount} ₽
📜 Статус: ${status}
🕒 ${new Date().toLocaleString('ru-RU')}`;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const tgResp = await resp.json();
    console.log('📤 Результат отправки в Telegram:', tgResp);
  } catch (err) {
    console.error('Ошибка отправки в Telegram:', err);
  }

  res.status(200).json({ ok: true });
}
