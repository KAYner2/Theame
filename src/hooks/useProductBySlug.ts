import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Category } from '@/types/database';

export const useProductBySlug = (categorySlug: string, productSlug: string) => {
  return useQuery({
    queryKey: ['product-by-slug', categorySlug, productSlug],
    enabled: Boolean(categorySlug && productSlug),
    queryFn: async (): Promise<Product | null> => {
      // 1) сам товар по slug (без join)
      const { data: prod, error: e1 } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('slug', productSlug)
        .maybeSingle();

      if (e1) throw e1;
      if (!prod) return null;

      // 2) тянем категорию и проверяем slug
      let category: Category | null = null;
      if (prod.category_id) {
        const { data: cat, error: e2 } = await (supabase as any)
          .from('categories')
          .select('id, name, description, image_url, sort_order, is_active, created_at, updated_at, slug')
          .eq('id', prod.category_id)
          .maybeSingle();
        if (e2) throw e2;
        category = cat ?? null;
      }

      // если передали categorySlug и он не совпал — считаем, что это не тот товар
      if (categorySlug && category && category.slug && category.slug !== categorySlug) {
        return null;
      }

      const result: Product = {
        ...prod,
        category: category,
      };

      return result;
    },
  });
};
