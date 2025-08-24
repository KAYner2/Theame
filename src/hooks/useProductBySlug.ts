// src/hooks/useProductBySlug.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/database";

/**
 * Грузит товар по слагам категории и товара.
 * Основано на view `products_with_categories`, где есть:
 *  - поле `slug` у товара
 *  - json поле `category` с ключом `slug`
 */
export function useProductBySlug(categorySlug?: string, productSlug?: string) {
  return useQuery({
    queryKey: ["product-by-slug", categorySlug, productSlug],
    enabled: Boolean(categorySlug && productSlug),
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await (supabase as any)
        .from("products_with_categories")
        .select("*")
        .eq("slug", productSlug)                         // slug товара
        .filter("category->>slug", "eq", categorySlug)   // slug категории из JSON
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
  });
}