import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, CreateProductDto } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/**
 * Общая функция сортировки (страховка, если сервер вернёт без порядка).
 */
const sortProducts = (rows: Product[] = []) =>
  [...rows].sort((a, b) => {
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    if (sa !== sb) return sa - sb;
    return String(a.created_at ?? a.id).localeCompare(String(b.created_at ?? b.id));
  });

/**
 * Товары для главной (только активные и show_on_homepage).
 */
export const useHomepageProducts = () => {
  return useQuery({
    queryKey: ['homepage-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_homepage', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }); // добавили стабилизатор
      if (error) throw error;
      return data as Product[];
    },
    select: sortProducts,
  });
};

/**
 * Избранные товары (например, для карусели).
 */
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    select: sortProducts,
  });
};

/**
 * Полный список товаров для админки.
 * ВАЖНО: queryKey = ['products']
 */
export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    select: sortProducts,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: CreateProductDto) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      if (created?.show_on_homepage && created?.is_active) {
        queryClient.invalidateQueries({ queryKey: ['homepage-products'] });
      }
      toast({ title: 'Успешно', description: 'Продукт создан' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onMutate: async ({ id, updates }) => {
      // Оптимистично обновляем список
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const prev = queryClient.getQueryData<Product[]>(['products']);
      if (prev) {
        queryClient.setQueryData<Product[]>(
          ['products'],
          sortProducts(
            prev.map((p) => (p.id === id ? { ...p, ...updates } as Product : p))
          )
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['products'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-products'] });
    },
    onSuccess: () => {
      toast({ title: 'Успешно', description: 'Продукт обновлён' });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-products'] });
      toast({ title: 'Успешно', description: 'Продукт удалён' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};
