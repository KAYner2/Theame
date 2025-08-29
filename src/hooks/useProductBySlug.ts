// src/hooks/useProductBySlug.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/database';

export const useProductBySlug = (categorySlug: string, productSlug: string) => {
  return useQuery({
    queryKey: ['product-by-slug', categorySlug, productSlug],
    enabled: Boolean(categorySlug && productSlug),
    queryFn: async (): Promise<Product | null> => {
      // Берём из ВЬЮХИ — тут уже есть category (jsonb), category_ids и composition_raw
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Если пришёл categorySlug — сверяем с полем category.slug (если оно есть)
      const catSlug = data.category?.slug || null;
      if (categorySlug && catSlug && catSlug !== categorySlug) {
        return null;
      }

      return data as Product;
    },
  });
};
