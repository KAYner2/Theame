import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/types/database';

type VP = Database["public"]["Tables"]["variant_products"]["Row"];
type VPInsert = Database["public"]["Tables"]["variant_products"]["Insert"];
type VPUpdate = Database["public"]["Tables"]["variant_products"]["Update"];

export const useAllVariantProducts = () =>
  useQuery({
    queryKey: ["variant-products"],
    queryFn: async (): Promise<VP[]> => {
      const { data, error } = await supabase
        .from("variant_products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useCreateVariantProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: VPInsert) => {
      const { data, error } = await supabase
        .from("variant_products")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as VP;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-products"] });
    },
  });
};

export const useUpdateVariantProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: VP["id"]; updates: VPUpdate }) => {
      const { data, error } = await supabase
        .from("variant_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as VP;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-products"] });
    },
  });
};

export const useDeleteVariantProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: VP["id"]) => {
      const { error } = await supabase
        .from("variant_products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-products"] });
    },
  });
};
