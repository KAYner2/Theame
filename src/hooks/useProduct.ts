// src/hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories') // читаем из view
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Product | null;
    },
    enabled: !!id,
  });
};