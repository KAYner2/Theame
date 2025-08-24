// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, CreateProductDto } from '@/types/database';
import { Flower } from '@/types/flower';
import { useToast } from '@/hooks/use-toast';

/** mapper: row из view -> Flower для карточек/лент */
function mapDbRowToFlower(p: any): Flower {
  return {
    id: p.id,
    name: p.name,
    price: p.price ?? 0,
    image: p.image_url || '/placeholder.svg',
    description: p.description ?? '',
    category: p.category?.name ?? 'Разное',
    categoryId: p.category?.id ?? null,
    categorySlug: p.category?.slug ?? null,
    slug: p.slug ?? null,
    inStock: Boolean(p.is_active),
    quantity: 1,
    colors: Array.isArray(p.colors) ? p.colors : [],
    size: 'medium',
    occasion: [],
  };
}

/** Товары для главной (лента). Возвращаем Flower[] */
export const useHomepageProducts = () => {
  return useQuery({
    queryKey: ['homepage-products'], // ← удалили "key"
    queryFn: async (): Promise<Flower[]> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_homepage', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapDbRowToFlower);
    },
  });
};

/** Избранные (витрина). Возвращаем Flower[] */
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async (): Promise<Flower[]> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapDbRowToFlower);
    },
  });
};

/** Полный список для админки — оставляем Product[] без маппинга */
export const useAllProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await (supabase as any)
        .from('products_with_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-products'] });
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
      queryClient.setQueryData<Product[] | undefined>(['products'], (prev) => {
        if (!prev) return prev;
        return prev.map((p) => (String(p.id) === String(updated.id) ? ({ ...p, ...updated } as Product) : p));
      });
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

/** RPC: установка категорий */
export const useSetProductCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId, categoryIds }: { productId: string; categoryIds: string[] }) => {
      const { error } = await (supabase as any).rpc('set_product_categories', {
        _product_id: productId,
        _category_ids: categoryIds,
      });
      if (error) throw error;
      return { productId, categoryIds };
    },
    onSuccess: ({ productId, categoryIds }) => {
      queryClient.setQueryData<Product[] | undefined>(['products'], (prev) => {
        if (!prev) return prev;
        return prev.map((p) => {
          if (String(p.id) !== String(productId)) return p;
          const upd: any = { ...p };
          if ('category_ids' in upd) upd.category_ids = Array.isArray(categoryIds) ? [...categoryIds] : [];
          return upd as Product;
        });
      });
      toast({ title: 'Успешно', description: 'Категории обновлены' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};
 