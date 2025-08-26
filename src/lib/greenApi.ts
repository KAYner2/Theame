// lib/greenApi.ts

// Ответ GreenAPI на успешную отправку
export type SendResult = { idMessage?: string };

// Если в кабинете указан конкретный хост (типа https://1105.api.green-api.com),
// можешь добавить переменную GREEN_API_URL в Vercel. Иначе используем общий.
const BASE = process.env.GREEN_API_URL ?? "https://api.green-api.com";

// Нормализуем телефон к международному формату РФ и превращаем в chatId
export function toChatId(rawPhone: string) {
  const digits = (rawPhone || "").replace(/\D/g, "");
  const normalized =
    digits.length === 11 && digits.startsWith("8")
      ? "7" + digits.slice(1)
      : digits.startsWith("7")
      ? digits
      : "7" + digits; // запасной вариант
  return `${normalized}@c.us`;
}

// Основная функция отправки текста в WhatsApp через GreenAPI
export async function sendWhatsAppMessage(phone: string, message: string) {
  const id = process.env.GREEN_API_ID_INSTANCE;
  const token = process.env.GREEN_API_TOKEN;

  if (!id || !token) {
    throw new Error(
      "GREEN_API_ID_INSTANCE или GREEN_API_TOKEN не заданы (проверь переменные окружения на Vercel)."
    );
  }

  const url = `${BASE}/waInstance${id}/sendMessage/${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: toChatId(phone), message }),
  });

  if (!res.ok) {
    // пробуем получить тело ошибки и показать его в stack
    let errText = "";
    try {
      errText = await res.text();
    } catch {}
    throw new Error(`GreenAPI error ${res.status}: ${errText}`);
  }

  return (await res.json()) as SendResult;
}