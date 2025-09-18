// src/hooks/useProductBySlug.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/database';

export const useProductBySlug = (categorySlug: string | undefined, productSlug: string) => {
  return useQuery({
    queryKey: ['product-by-slug', categorySlug ?? null, productSlug],
    enabled: Boolean(productSlug),
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[useProductBySlug] slug=', productSlug, 'categorySlug=', categorySlug, 'data=', data, 'error=', error);

      if (error) {
        console.error('[useProductBySlug] Supabase error:', error);
        throw error;
      }
      if (!data) {
        console.warn('[useProductBySlug] No product found for slug', productSlug);
        return null;
      }

      const catSlug = data.category?.slug || null;
      if (categorySlug && catSlug && catSlug !== categorySlug) {
        console.warn('[useProductBySlug] Category mismatch: expected', categorySlug, 'got', catSlug);
        return null;
      }

      return data as Product;
    },
  });
};
