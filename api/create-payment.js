// /api/create-payment.js

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    amount,
    orderId,
    description,
    email,
    phone
  } = req.body;

  const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
  const password = process.env.TINKOFF_SECRET;

  console.log("🔥 DEBUG: TINKOFF_TERMINAL_KEY =", terminalKey);
  console.log("🔥 DEBUG: TINKOFF_SECRET =", password);

  if (!terminalKey || !password) {
    return res.status(500).json({ message: "Missing Tinkoff credentials" });
  }

  // Данные, которые отправим в Tinkoff
  const data = {
    TerminalKey: terminalKey,
    Amount: amount,
    OrderId: orderId,
    Description: description || "Оплата заказа",
    DATA: {
      Email: email || "",
      Phone: phone || "",
    }
  };

  // Правильный токен
  const token = generateToken({
    TerminalKey: terminalKey,
    Amount: amount,
    OrderId: orderId,
    Description: description || "Оплата заказа",
    Password: password
  });

  data.Token = token;

  try {
    const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log("🔥 DEBUG: RESPONSE FROM TINKOFF =", result);
    res.status(200).json(result);
  } catch (err) {
    console.error("Tinkoff error", err);
    res.status(500).json({ message: "Ошибка при инициализации оплаты" });
  }
}

// Генерация токена по документации Тинькофф
function generateToken(params) {
  const sortedKeys = Object.keys(params).sort();
  const tokenString = sortedKeys.map(key => `${key}=${params[key]}`).join("");
  return crypto.createHash("sha256").update(tokenString).digest("hex");
}
