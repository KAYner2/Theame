// src/utils/buildProductUrl.ts
import { slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

export function buildProductUrl(p: P) {
  const prod = p.productSlug || slugify(p.name);

  let cat = p.categorySlug || (p.categoryName ? slugify(p.categoryName) : '');

  // 🟢 полностью убираем категорию, если она "catalog"
  if (cat.trim().toLowerCase() === 'catalog') {
    cat = '';
  }

  return cat ? `/catalog/${cat}/${prod}` : `/catalog/${prod}`;
}
