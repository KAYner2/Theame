// src/hooks/useVariantProductBySlug.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Database } from '@/types/database';

type VP = Database['public']['Tables']['variant_products']['Row'];
type PV = Database['public']['Tables']['product_variants']['Row'];

export type VariantProductData = {
  product: VP | null;
  variants: PV[];
  categoryNames: string[];
};

export const useVariantProductBySlug = (slugRaw?: string) => {
  const slug = slugRaw?.trim() ?? '';

  return useQuery<VariantProductData>({
    queryKey: ['variant-product-by-slug', slug],
    enabled: slug.length > 0,        // хук вызывается всегда; запрос — только при валидном slug
    staleTime: 60_000,               // кэш 60с
    placeholderData: keepPreviousData, // ← v5: вместо keepPreviousData: true
    queryFn: async (): Promise<VariantProductData> => {
      // динамический импорт клиента — без побочек для хуков
      const { supabase } = await import('@/integrations/supabase/client');

      const { data, error } = await (supabase as any)
        .from('variant_products')
        .select(`
          id, name, slug, description, detailed_description, image_url, gallery_urls,
          is_active, min_price_cache, created_at, updated_at,
          product_variants:product_variants (
            id, product_id, title, composition, description, price,
            image_url, gallery_urls, is_active, sort_order, created_at, updated_at
          ),
          variant_product_categories:variant_product_categories (
            category_id,
            categories:categories ( name )
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const variants: PV[] = ((data?.product_variants ?? []) as PV[])
        .filter(v => v?.is_active)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .slice(0, 10);

      const categoryNames = ((data?.variant_product_categories ?? []) as any[])
        .map((row) => row?.categories?.name)
        .filter(Boolean) as string[];

      const { product_variants, variant_product_categories, ...rest } = (data ?? {}) as any;
      const product: VP | null = data ? (rest as VP) : null;

      return { product, variants, categoryNames };
    },
  });
};
