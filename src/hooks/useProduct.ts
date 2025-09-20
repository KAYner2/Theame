import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Category } from '@/types/database';

export const useProduct = (id: string) => {
  const safeId = id ?? '';
  return useQuery({
    queryKey: ['product', safeId],
    enabled: Boolean(safeId),
    queryFn: async (): Promise<Product | null> => {
      const { data: prod, error: e1 } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', safeId)
        .maybeSingle();

      if (e1) throw e1;
      if (!prod) return null;

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

      const result: Product = { ...prod, category };
      return result;
    },
  });
};
