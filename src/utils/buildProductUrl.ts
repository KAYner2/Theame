// src/utils/buildProductUrl.ts
import { slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

/** Красивый URL без id:
 *  /catalog/:categorySlug/:productSlug  — если категория есть
 *  /catalog/:productSlug                — если категории нет
 */
export function buildProductUrl(p: P) {
  const prod = p.productSlug || slugify(p.name);
  const cat =
    p.categorySlug ||
    (p.categoryName ? slugify(p.categoryName) : '');

  return cat ? `/catalog/${cat}/${prod}` : `/catalog/${prod}`;
}