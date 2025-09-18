// src/utils/buildProductUrl.ts
import { slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

/**
 * Формируем человеко-читаемый URL:
 * - /catalog/:categorySlug/:productSlug — если категория валидная
 * - /catalog/:productSlug — если категории нет или она = "catalog"
 */
export function buildProductUrl(p: P) {
  const prod = p.productSlug || slugify(p.name);

  let cat = p.categorySlug || (p.categoryName ? slugify(p.categoryName) : '');

  // 🟢 защита от дублирования: если категория == "catalog", считаем что её нет
  if (cat === 'catalog') {
    cat = '';
  }

  return cat ? `/catalog/${cat}/${prod}` : `/catalog/${prod}`;
}
