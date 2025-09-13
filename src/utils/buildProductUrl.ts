// src/utils/buildProductUrl.ts
import { slugifyOrFallback, slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

/** Красивый URL без id: /catalog/:categorySlug/:productSlug */
export function buildProductUrl(p: P) {
  const cat = p.categorySlug || slugifyOrFallback(p.categoryName || '', 'catalog') || 'catalog';
  const prod = p.productSlug || slugify(p.name);
  return `/catalog/${cat}/${prod}`;
}
