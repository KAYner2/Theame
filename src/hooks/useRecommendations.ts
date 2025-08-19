// /src/hooks/useRecommendations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export interface ProductRecommendation {
  id: string;
  source_category_id: string;
  target_category_id: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =========================
// ГЛАВНЫЙ ХУК РЕКОМЕНДАЦИЙ
// =========================
export const useProductRecommendations = (productId: string) => {
  return useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: async (): Promise<Product[]> => {
      if (!productId) return [];

      // 1) Текущий товар (категория может быть битой — обрабатываем мягко)
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('id, category_id, name, is_active, created_at, category:categories(*)')
        .eq('id', productId)
        .eq('is_active', true)
        .maybeSingle();

      // Если товара нет — делаем «жёсткий фолбэк»: показать просто активные товары
      if (productError || !currentProduct) {
        const { data: fallbackProducts } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', productId)
          .limit(10);
        return (fallbackProducts ?? []).slice(0, 5);
      }

      const currentCategoryId: string | null =
        (currentProduct as any)?.category_id ?? null;
      const currentCategoryName: string =
        ((currentProduct as any)?.category?.name ?? '').toString().toLowerCase();

      // 2) Настроенные «связки» категорий
      let targetCategoryIds: string[] = [];

      if (currentCategoryId) {
        const { data: recommendations, error: recErr } = await supabase
          .from('product_recommendations')
          .select('*')
          .eq('source_category_id', currentCategoryId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!recErr && recommendations && recommendations.length > 0) {
          targetCategoryIds = recommendations
            .map((r) => r.target_category_id)
            .filter(Boolean);
        }
      }

      // 3) Если явных связок нет — мягкая логика по названиям категорий.
      if (targetCategoryIds.length === 0) {
        // Пытаемся подтянуть активные категории.
        const { data: allCategories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true);

        // Если категорий тоже нет — делаем общий фолбэк ниже.
        if (allCategories && allCategories.length > 0) {
          const isFlowerCategory = (name: string) => {
            const s = (name || '').toLowerCase();
            return (
              s.includes('цвет') ||
              s.includes('букет') ||
              s.includes('пион') ||
              s.includes('авторск') ||
              s.includes('моно') ||
              s.includes('корзин') ||
              s.includes('подсолнух') ||
              s.includes('корпоратив') ||
              s.includes('гортенз') ||
              s.includes('роз') ||
              s.includes('тюльпан') ||
              s.includes('лили') ||    // «лилии»
              s.includes('хризантем') ||
              s.includes('орхиде') ||
              s.includes('лаванд') ||
              s.includes('эустом') ||
              s.includes('альстремер') ||
              s.includes('ромашк') ||
              s.includes('ирис') ||
              s.includes('нарцисс')
            );
          };

          const isVase = currentCategoryName.includes('ваз');
          const isToy = currentCategoryName.includes('игрушк');
          const isSweets = currentCategoryName.includes('сладост');
          const currentIdStr = currentCategoryId ? String(currentCategoryId) : null;

          if (isFlowerCategory(currentCategoryName)) {
            // Цветочным → НЕ-цветочные (вазы/сладости/игрушки/подарки)
            targetCategoryIds = allCategories
              .filter((cat) => {
                const name = (cat.name || '').toLowerCase();
                const notFlower = !isFlowerCategory(name);
                const notCurrent = !currentIdStr || String(cat.id) !== currentIdStr;
                return notFlower && notCurrent;
              })
              .map((cat) => String(cat.id));
          } else if (isVase) {
            // Вазам → цветочные
            targetCategoryIds = allCategories
              .filter((cat) => isFlowerCategory(cat.name || ''))
              .map((cat) => String(cat.id));
          } else if (isToy) {
            // Игрушкам → всё, кроме игрушек
            targetCategoryIds = allCategories
              .filter((cat) => !(cat.name || '').toLowerCase().includes('игрушк'))
              .map((cat) => String(cat.id));
          } else if (isSweets) {
            // Сладостям → цветочные
            targetCategoryIds = allCategories
              .filter((cat) => isFlowerCategory(cat.name || ''))
              .map((cat) => String(cat.id));
          } else {
            // По умолчанию: любые активные, кроме текущей
            targetCategoryIds = allCategories
              .filter((cat) => !currentIdStr || String(cat.id) !== currentIdStr)
              .map((cat) => String(cat.id));
          }
        }
      }

      // 4) Получаем товары:
      //    - если есть targetCategoryIds → берём из них
      //    - если НЕТ (категории вообще «лежат») → общий фолбэк: просто активные товары
      let products: Product[] = [];

      if (targetCategoryIds.length > 0) {
        // ВАЖНО: .in() с пустым массивом даёт пустой ответ, мы уже это исключили
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('category_id', targetCategoryIds)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(20); // возьмём побольше, потом шальфл + slice

        if (!error && Array.isArray(data)) {
          products = data as Product[];
        }
      } else {
        // Фолбэк, если категорий нет вообще
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', productId)
          .order('created_at', { ascending: false })
          .limit(20);

        products = (data ?? []) as Product[];
      }

      // 5) Лёгкая чистка и перемешивание
      const cleaned = products.filter((p) => p && (p.id ?? p.name));
      const shuffled = cleaned.sort(() => Math.random() - 0.5);

      // Возвращаем максимум 5
      return shuffled.slice(0, 5);
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
};

// ============================
// CRUD для таблицы рекомендаций
// ============================

export const useAllRecommendations = () => {
  return useQuery({
    queryKey: ['all-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          source_category:categories!source_category_id(*),
          target_category:categories!target_category_id(*)
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
};

export const useCreateRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      recommendation: Omit<ProductRecommendation, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const { data, error } = await supabase
        .from('product_recommendations')
        .insert(recommendation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
      toast({
        title: 'Успешно',
        description: 'Рекомендация создана',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductRecommendation> }) => {
      const { data, error } = await supabase
        .from('product_recommendations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
      toast({
        title: 'Успешно',
        description: 'Рекомендация обновлена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_recommendations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
      toast({
        title: 'Успешно',
        description: 'Рекомендация удалена',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
