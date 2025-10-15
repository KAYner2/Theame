import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Database } from '@/types/database';

type VPR = Database['public']['Tables']['variant_products']['Row'];

export type VariantCatalogItem = {
  id: number;
  name: string;
  slug: string | null;
  image_url: string | null;
  min_price_cache: number | null;
  is_active: boolean | null;
  categoryIds: string[];
  // ⬇️ добавили: единый порядок и дата создания
  sort_order: number | null;
  created_at: string | null;
};

export function useVariantProductsForCatalog(opts?: {
  /** если фильтруешь каталог по категории — прокинь сюда её uuid */
  categoryId?: string | null;
  /** максимум карточек (по умолчанию без лимита) */
  limit?: number;
}) {
  const categoryId = opts?.categoryId ?? null;
  const limit = opts?.limit;

  return useQuery<VariantCatalogItem[]>({
    queryKey: ['variant-catalog', { categoryId, limit }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      // Базовый select. Берём sort_order и created_at
      const baseSelect = `
        id,
        name,
        slug,
        image_url,
        min_price_cache,
        is_active,
        sort_order,
        created_at,
        variant_product_categories:variant_product_categories ( category_id )
      `;

      let q =
        supabase
          .from('variant_products')
          .select(baseSelect)
          .eq('is_active', true) as any;

      // Если нужна фильтрация по категории — inner join на связки и where
      if (categoryId) {
        q =
          supabase
            .from('variant_products')
            .select(
              `
                id,
                name,
                slug,
                image_url,
                min_price_cache,
                is_active,
                sort_order,
                created_at,
                variant_product_categories!inner ( category_id )
              `
            )
            .eq('is_active', true)
            .eq('variant_product_categories.category_id', categoryId);
      }

      // Порядок внутри ответа (не критично, т.к. дальше мы всё равно сортируем сквозным компаратором)
      q = q
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true, nullsFirst: true });

      if (typeof limit === 'number') q = q.limit(limit);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as (VPR & {
        variant_product_categories?: { category_id: string }[] | null;
      })[];

      return rows.map<VariantCatalogItem>((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        image_url: r.image_url,
        min_price_cache: (r as any).min_price_cache ?? null,
        is_active: r.is_active,
        categoryIds: (r.variant_product_categories ?? []).map((x) => x.category_id),
        sort_order: (r as any).sort_order ?? null,
        created_at: (r as any).created_at ?? null,
      }));
    },
  });
}
