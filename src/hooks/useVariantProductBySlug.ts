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

      // 3) категории (для текста/рекомендаций)
      const { data: catLinks, error: e3 } = await supabase
        .from("variant_product_categories")
        .select("category_id")
        .eq("product_id", product.id);
      if (e3) throw e3;

      let categoryNames: string[] = [];
      if (catLinks?.length) {
        const ids = catLinks.map((r) => r.category_id);
        const { data: cats, error: e4 } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", ids);
        if (e4) throw e4;
        categoryNames = (cats ?? []).map((c) => c.name);
      }

      return {
        product: product as VP,
        variants: (variants ?? []).slice(0, 10) as PV[],
        categoryNames,
      };
    },
  });
