// src/hooks/useProductBySlug.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/database';

export const useProductBySlug = (categorySlug: string | undefined, productSlug: string) => {
  return useQuery({
    queryKey: ['product-by-slug', categorySlug ?? null, productSlug],
    enabled: Boolean(productSlug), // 🔑 теперь не требуем categorySlug для запуска
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // сверяем slug категории только если она указана
      const catSlug = data.category?.slug || null;
      if (categorySlug && catSlug && catSlug !== categorySlug) {
        return null;
      }

      return data as Product;
    },
  });
};
