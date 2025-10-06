import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type VP = Database["public"]["Tables"]["variant_products"]["Row"];
type PV = Database["public"]["Tables"]["product_variants"]["Row"];

/**
 * Возвращает:
 * - product: сам variant-товар
 * - variants: активные варианты (отсортированы)
 * - categoryNames: названия категорий для этого товара
 */
export const useVariantProductBySlug = (slugRaw: string | undefined) => {
  const slug = slugRaw ?? '';

  return useQuery({
    queryKey: ['variant-product-by-slug', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<{
      product: VP;
      variants: PV[];
      categoryNames: string[];
    }> => {
      // Один запрос с nested select:
      // - сам товар
      // - дочерние product_variants (children по FK) — сразу активные и отсортированные
      // - через связку variant_product_categories → categories получим имена категорий
      const { data, error } = await (supabase as any)
        .from('variant_products')
        .select(`
          *,
          product_variants:product_variants (
            id, product_id, title, composition, description, price, image_url, gallery_urls,
            is_active, sort_order, created_at, updated_at
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
      if (!data) throw new Error('Товар не найден');

      // Нормализуем варианты: берём только активные и сортируем
      const allVariants = (data.product_variants ?? []) as PV[];
      const variants = allVariants
        .filter(v => v?.is_active)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .slice(0, 10);

      // Достаём имена категорий
      const categoryNames = ((data.variant_product_categories ?? []) as any[])
        .map((row) => row?.categories?.name)
        .filter(Boolean) as string[];

      // Выкинем вспомогательные поля из ответа и вернём чистую структуру
      const product: VP = {
        ...data,
        product_variants: undefined,
        variant_product_categories: undefined,
      } as VP;

      return { product, variants, categoryNames };
    },
  });
};
