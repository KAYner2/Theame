// src/utils/parseComposition.ts

export type ParsedItem = { name: string; qty?: number };

/** Нормализуем базовое имя без количеств и скобок */
const cleanBase = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    // убираем количества "3 шт", "3штук", "(2 шт.)", "x5", "х 7"
    .replace(/\b\d+\s*(шт|штук)\.?/gi, "")
    .replace(/\b[хx]\s*\d+\b/gi, "")
    .replace(/\((\s*\d+(\s*(шт|штук)\.?)?)\)/gi, "")
    // чистим пунктуацию и лишние пробелы
    .replace(/[().]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Первая буква заглавная */
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Складывает дубли по ключу (без учёта регистра) */
const dedupeSum = (items: ParsedItem[]): ParsedItem[] => {
  const map = new Map<string, ParsedItem>();
  for (const it of items) {
    const key = it.name.toLowerCase();
    const prev = map.get(key);
    map.set(key, {
      name: it.name,
      qty: (prev?.qty || 0) + (it.qty || 0) || undefined,
    });
  }
  return Array.from(map.values());
};

/**
 * Парсинг сырой строки.
 * Примеры:
 *  "Розы 3шт, Гладиолус белый x2, Эвкалипт (2 шт.)"
 *  → [{name:"Розы", qty:3}, {name:"Гладиолус белый", qty:2}, {name:"Эвкалипт", qty:2}]
 */
export function parseCompositionRaw(raw: unknown): ParsedItem[] {
  if (typeof raw !== "string") return [];
  const parts = raw
    .split(/[,;\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: ParsedItem[] = [];

  for (const p of parts) {
    // ищем количество в различных форматах
    const qtyMatch =
      p.match(/\b(\d+)\s*(шт|штук)\b/i) ||      // "3 шт", "3 штук"
      p.match(/\b[хx]\s*(\d+)\b/i) ||           // "x5", "х 5"
      p.match(/\((\d+)\s*(шт|штук)\.?\)/i) ||   // "(2 шт.)"
      p.match(/\b(\d+)\b(?!\s*см)/i);           // просто число (но не "45 см")

    const qty = qtyMatch ? Number(qtyMatch[1]) : undefined;
    const base = cap(cleanBase(p));
    if (!base) continue;

    out.push({ name: base, qty });
  }

  return dedupeSum(out);
}

/**
 * Фоллбек для старых/смешанных данных: принимает массив строк ИЛИ объектов
 * с полями {name, qty}. Строки могут содержать несколько позиций (через запятую).
 * Любые неподходящие элементы игнорируются.
 */
export function parseFromArray(arr?: unknown): ParsedItem[] {
  const a: unknown[] = Array.isArray(arr) ? arr : [];
  const collected: ParsedItem[] = [];

  for (const el of a) {
    if (typeof el === "string") {
      // строка может содержать несколько предметов — парсим её как raw
      collected.push(...parseCompositionRaw(el));
    } else if (el && typeof el === "object") {
      // объект с возможными полями name/qty
      const name = cap(cleanBase(String((el as any).name ?? "")));
      const qtyRaw = (el as any).qty;
      const qty = typeof qtyRaw === "number" && isFinite(qtyRaw) ? qtyRaw : undefined;
      if (name) collected.push({ name, qty });
    }
    // всё остальное игнорируем (null, undefined, числа и т.д.)
  }

  return dedupeSum(collected);
}
