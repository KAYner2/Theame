// src/utils/parseComposition.ts
export type ParsedItem = { name: string; qty?: number };

const cleanBase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\d+\s*(шт|штук)\.?/gi, '')
    .replace(/\b[хx]\s*\d+\b/gi, '')
    .replace(/[().]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "Розы 3шт, Гладиолус белый x2, Эвкалипт (2 шт.)" → [{name:"Розы",qty:3},{name:"Гладиолус белый",qty:2},{name:"Эвкалипт",qty:2}] */
export function parseCompositionRaw(raw: string): ParsedItem[] {
  const parts = (raw || '').split(/[,;\n]+/g).map((s) => s.trim()).filter(Boolean);
  const out: ParsedItem[] = [];

  for (const p of parts) {
    const qtyMatch =
      p.match(/\b(\d+)\s*(шт|штук)\b/i) ||
      p.match(/\b[хx]\s*(\d+)\b/i) ||
      p.match(/\((\d+)\s*(шт|штук)\.??\)/i);

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
    map.set(key, { name: item.name, qty: (prev?.qty || 0) + (item.qty || 0) || undefined });
  }
  return Array.from(map.values());
}

/** Фоллбек для старых данных: массив → строка → парсер */
export function parseFromArray(arr?: string[] | null): ParsedItem[] {
  const raw = (arr || []).join(', ');
  return parseCompositionRaw(raw);
}
