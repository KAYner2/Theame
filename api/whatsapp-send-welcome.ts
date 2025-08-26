// /api/whatsapp-send-welcome.ts
export const config = { runtime: "edge" };

const ID = process.env.GREEN_API_ID_INSTANCE!;
const TOKEN = process.env.GREEN_API_TOKEN!;
// можно не задавать, но если у тебя в кабинете свой поддомен (типа https://1105.api.green-api.com),
// лучше прописать переменную GREEN_API_BASE_URL именно на этот хост
const BASE_URL = process.env.GREEN_API_BASE_URL || "https://api.green-api.com";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
};

function phoneToChatId(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.length === 10) digits = "7" + digits; // РФ без кода страны -> добавим 7
  if (digits.length < 10 || digits.length > 15) return null;
  return `${digits}@c.us`;
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Пинг для быстрой проверки
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.has("check")) {
      return new Response(JSON.stringify({ ok: true, message: "ping" }), {
        status: 200,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ error: "Use POST to send message" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!ID || !TOKEN) {
    return new Response(JSON.stringify({ error: "Missing GREEN_API envs" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const name: string | undefined = body?.name?.toString().trim();
  const phone: string = body?.phone?.toString() || "";
  const promoCode: string | undefined = body?.promoCode?.toString().trim();

  const chatId = phoneToChatId(phone);
  if (!chatId) {
    return new Response(JSON.stringify({ error: "Bad phone format" }), {
      status: 400,
      headers: corsHeaders,
    });
    }

  const hello =
    `Здравствуйте${name ? `, ${name}` : ""}! Спасибо, что подписались на рассылку 🌸` +
    (promoCode ? `\nВаш приветственный промокод: ${promoCode}` : `\nСкоро пришлём вам промокод в этот чат.`) +
    `\nTHE AME FLOWERS`;

  const sendUrl = `${BASE_URL}/waInstance${ID}/sendMessage/${TOKEN}`;

  const r = await fetch(sendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message: hello }),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    return new Response(
      JSON.stringify({ error: "green-api sendMessage failed", status: r.status, details: j }),
      { status: 502, headers: corsHeaders }
    );
  }

  return new Response(JSON.stringify({ ok: true, chatId, greenApi: j }), {
    status: 200,
    headers: corsHeaders,
  });
}
