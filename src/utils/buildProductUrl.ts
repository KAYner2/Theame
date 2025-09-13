// src/utils/buildProductUrl.ts
import { slugifyOrFallback, slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  // опционально — если уже приходят из БД
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

/**
 * Топовый URL для карточки товара.
 * Никаких правок БД не нужно: если слуги не пришли — строим их на лету.
 * Формат: /catalog/:categorySlug/:productSlug-:id
 */
export function buildProductUrl(p: P) {
  const cat = p.categorySlug || slugifyOrFallback(p.categoryName || '', 'catalog') || 'catalog';
  const prod = p.productSlug || slugify(p.name) || slugifyOrFallback(p.id, p.id);
  return `/catalog/${cat}/${prod}-${p.id}`;
}
