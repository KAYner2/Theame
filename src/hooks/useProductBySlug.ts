import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductVariant } from '@/types/database';

export const useProductBySlug = (categorySlug: string | undefined, productSlug: string) => {
  const cat = categorySlug ?? '';
  const slug = productSlug ?? '';

  return useQuery({
    queryKey: ['product-by-slug', cat, slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Product | null> => {
      // товар из вьюхи с категорией
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // проверка совпадения категории по slug (как и раньше)
      const catSlug = data.category?.slug || null;
      if (cat && catSlug && catSlug !== cat) {
        console.warn('[useProductBySlug] Category mismatch: expected', cat, 'got', catSlug);
        return null;
      }

      // варианты товара
      const { data: variants, error: e2 } = await (supabase as any)
        .from('product_variants')
        .select('*')
        .eq('product_id', data.id)
        .order('sort_order', { ascending: true });

      if (e2) throw e2;

      const result: Product & { product_variants: ProductVariant[] } = {
        ...data,
        product_variants: variants ?? [],
      };

      return result;
    },
  });
};
