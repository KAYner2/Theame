import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSetVariantProductCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { productId: number; categoryIds: string[] }) => {
      const { productId, categoryIds } = args;
      const { error } = await supabase.rpc("set_variant_product_categories", {
        p_product_id: productId,
        p_category_ids: categoryIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
