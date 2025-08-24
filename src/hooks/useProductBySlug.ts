import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/database";

export function useProductBySlug(categorySlug: string, productSlug: string) {
  return useQuery({
    queryKey: ["product-by-slug", categorySlug, productSlug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await (supabase as any)
        .from("products_with_categories")
        .select("*")
        .eq("slug", productSlug) // ищем по slug товара
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      return data as Product | null;
    },
    enabled: !!categorySlug && !!productSlug,
  });
}