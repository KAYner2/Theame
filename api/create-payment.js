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

  if (!terminalKey || !password) {
    return res.status(500).json({ message: "Server misconfigured: missing Tinkoff credentials" });
  }

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

  // Генерация токена
  const token = generateToken({ ...data, Password: password });
  data.Token = token;

  try {
    const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    console.error("Tinkoff error", err);
    res.status(500).json({ message: "Ошибка при инициализации оплаты" });
  }
}

function generateToken(data) {
  const flat = {};

  for (const key in data) {
    if (typeof data[key] === "object" && key === "DATA") {
      for (const subKey in data[key]) {
        flat[`DATA[${subKey}]`] = data[key][subKey];
      }
    } else if (key !== "Password") {
      flat[key] = data[key];
    }
  }

  const sorted = Object.keys(flat).sort();
  let str = "";
  for (const key of sorted) {
    str += `${key}=${flat[key]}`;
  }

  str += data.Password;

  return crypto.createHash("sha256").update(str).digest("hex");
}
