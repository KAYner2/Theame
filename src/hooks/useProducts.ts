import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, CreateProductDto } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/**
 * Товары для главной (только активные, помеченные show_on_homepage),
 * сразу отсортированные по sort_order.
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
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
};

/**
 * Избранные товары (например, для карусели/блоков).
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
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
  });
};

/**
 * Полный список товаров для админки.
 * ВАЖНО: queryKey = ['products'], чтобы инвалидация из админки попадала сюда.
 */
export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
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
      // Сбрасываем кэши списков
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      // Если товар должен быть на главной — сразу обновим и её
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
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      // Любое изменение порядка/флага показа — обновим главную
      queryClient.invalidateQueries({ queryKey: ['homepage-products'] });
      toast({ title: 'Успешно', description: 'Продукт обновлён' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
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
