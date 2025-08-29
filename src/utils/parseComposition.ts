// src/utils/parseComposition.ts

export type ParsedItem = { name: string; qty?: number };

/** Нормализуем базовое имя без количеств и скобок */
const cleanBase = (s: string) =>
  s
    .toLowerCase()
    // убираем количества в формате "3 шт", "3штук", "(2 шт.)", "x5", "х 7"
    .replace(/\b\d+\s*(шт|штук)\.?/gi, '')
    .replace(/\b[хx]\s*\d+\b/gi, '')
    .replace(/\((\s*\d+(\s*(шт|штук)\.?)?)\)/gi, '')
    // чистим пунктуацию и лишние пробелы
    .replace(/[().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Первая буква заглавная */
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Пример:
 * "Розы 3шт, Гладиолус белый x2, Эвкалипт (2 шт.)"
 * → [{name:"Розы", qty:3}, {name:"Гладиолус белый", qty:2}, {name:"Эвкалипт", qty:2}]
 */
export function parseCompositionRaw(raw: string): ParsedItem[] {
  const parts = (raw || '')
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
      p.match(/\b(\d+)\b(?!\s*см)/i);           // просто число (но не размер типа "45 см")

    const qty = qtyMatch ? Number(qtyMatch[1]) : undefined;
    const base = cap(cleanBase(p));
    if (!base) continue;

    out.push({ name: base, qty });
  }

  // Склеиваем одинаковые позиции: «Розы 3шт» + «Розы x2» → «Розы 5шт»
  const map = new Map<string, ParsedItem>();
  for (const item of out) {
    const key = item.name.toLowerCase();
    const prev = map.get(key);
    map.set(key, {
      name: item.name,
      qty: (prev?.qty || 0) + (item.qty || 0) || undefined,
    });
  }

  return Array.from(map.values());
}

/** Фоллбек для старых данных: массив → строка → парсер */
export function parseFromArray(arr?: string[] | null): ParsedItem[] {
  const raw = (arr || []).join(', ');
  return parseCompositionRaw(raw);
}
