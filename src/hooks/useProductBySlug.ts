import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/database';

export const useProductBySlug = (categorySlug: string | undefined, productSlug: string) => {
  const cat = categorySlug ?? '';          // защита от undefined
  const slug = productSlug ?? '';

  return useQuery({
    queryKey: ['product-by-slug', cat, slug],
    enabled: Boolean(slug),                 // не дергаем запрос без slug
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[useProductBySlug] slug=', slug, 'categorySlug=', cat, 'data=', data, 'error=', error);

      if (error) throw error;
      if (!data) return null;

      const catSlug = data.category?.slug || null;
      if (cat && catSlug && catSlug !== cat) {
        console.warn('[useProductBySlug] Category mismatch: expected', cat, 'got', catSlug);
        return null;
      }

      return data as Product;
    },
  });
};
