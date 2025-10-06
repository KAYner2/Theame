import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/database";

type VP = Database["public"]["Tables"]["variant_products"]["Row"];
type PV = Database["public"]["Tables"]["product_variants"]["Row"];

export const useVariantProductBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["variant-product", slug],
    enabled: !!slug,
    queryFn: async () => {
      // 1) сам товар
      const { data: product, error: e1 } = await supabase
        .from("variant_products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (e1) throw e1;
      if (!product) throw new Error("Товар не найден");

      // 2) активные варианты
      const { data: variants, error: e2 } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (e2) throw e2;

      // Гарантируем максимум 10
      const limited = (variants ?? []).slice(0, 10);

      return { product: product as VP, variants: limited as PV[] };
    },
  });
