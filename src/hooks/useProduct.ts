import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Category } from '@/types/database';

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Product | null> => {
      // 1) сам товар (без join)
      const { data: prod, error: e1 } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (e1) throw e1;
      if (!prod) return null;

      // 2) тянем категорию по category_id (если есть)
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

      // 3) склеиваем в форму Product (типизируем вручную, чтобы не будить монстров-дженериков)
      const result: Product = {
        ...prod,
        category: category,
      };

      return result;
    },
  });
};
