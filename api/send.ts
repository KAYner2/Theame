// api/green/send.ts
// Vercel serverless function (без внешних типов, чтобы не ругался на @vercel/node)

type SendResult = { idMessage?: string };
const BASE = process.env.GREEN_API_URL ?? "https://api.green-api.com";

function toChatId(rawPhone: string) {
  const digits = (rawPhone || "").replace(/\D/g, "");
  const normalized =
    digits.length === 11 && digits.startsWith("8")
      ? "7" + digits.slice(1)
      : digits.startsWith("7")
      ? digits
      : "7" + digits; // запасной вариант (если ввели 9XXXXXXXXX)
  return `${normalized}@c.us`;
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const id = process.env.GREEN_API_ID_INSTANCE;
  const token = process.env.GREEN_API_TOKEN;
  if (!id || !token) {
    throw new Error(
      "GREEN_API_ID_INSTANCE или GREEN_API_TOKEN не заданы (проверь переменные окружения в Vercel, и перезапусти деплой)."
    );
  }
  const url = `${BASE}/waInstance${id}/sendMessage/${token}`;
  const body = { chatId: toChatId(phone), message };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text(); // читаем как текст — бывает, что приходят подробности ошибки
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const err = new Error(`GreenAPI ${res.status}: ${text || "(empty body)"}`);
    (err as any).meta = { url, body, status: res.status, response: json ?? text };
    throw err;
  }

  return (json ?? {}) as SendResult;
}

function json(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  // простенький CORS на всякий
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.statusCode = 200;
    return res.end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");

  // healthcheck/diagnostics
  if (req.method === "GET") {
    const id = process.env.GREEN_API_ID_INSTANCE;
    const token = process.env.GREEN_API_TOKEN;
    const check = {
      ok: Boolean(id && token),
      hasId: Boolean(id),
      hasToken: Boolean(token),
      base: BASE,
      sampleUrl: id && token ? `${BASE}/waInstance${String(id).slice(0,2)}***.../sendMessage/${String(token).slice(0,4)}***` : null,
      note: "Для полноценной проверки сделай POST с phone и (опц.) name/message.",
    };
    return json(res, 200, check);
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  // читаем тело (иногда req.body уже объект, иногда — строка)
  let bodyRaw = req.body;
  if (!bodyRaw) {
    // fallback на чтение из стрима
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const str = Buffer.concat(chunks).toString("utf8");
    try { bodyRaw = JSON.parse(str); } catch { bodyRaw = {}; }
  } else if (typeof bodyRaw === "string") {
    try { bodyRaw = JSON.parse(bodyRaw); } catch { bodyRaw = {}; }
  }

  const { phone, name, message } = bodyRaw || {};
  if (!phone) return json(res, 400, { error: "phone is required" });

  const chatId = toChatId(String(phone));
  const text =
    message ??
    `Здравствуйте${name ? ", " + name : ""}! Спасибо, что подписались на рассылку. Напишем сюда ваш промокод чуть позже.`;

  try {
    const result = await sendWhatsAppMessage(String(phone), text);
    return json(res, 200, {
      ok: true,
      chatId,
      usedBase: BASE,
      result,
    });
  } catch (e: any) {
    // возвращаем максимум деталей — удобно дебажить
    return json(res, 500, {
      ok: false,
      chatId,
      usedBase: BASE,
      error: e?.message || String(e),
      meta: e?.meta ?? null,
    });
  }
}