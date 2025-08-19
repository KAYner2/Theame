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

export const useProductRecommendations = (productId: string) => {
  return useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: async () => {
      // Сначала получаем текущий продукт чтобы знать его категорию
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('category_id, category:categories(*)')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !currentProduct) return [];

      // Получаем настройки рекомендаций для данной категории
      const { data: recommendations } = await supabase
        .from('product_recommendations')
        .select('*')
        .eq('source_category_id', currentProduct.category_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      let targetCategoryIds: string[] = [];
      
      if (recommendations && recommendations.length > 0) {
        // Если есть настроенные рекомендации, используем их
        targetCategoryIds = recommendations.map(r => r.target_category_id);
      } else {
        // Используем логику по умолчанию
        const categoryName = currentProduct.category?.name?.toLowerCase() || '';
        
        // Получаем все категории для определения логики по умолчанию
        const { data: allCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true);

        if (!allCategories) return [];

        // Определяем "цветочные" категории (все виды цветов и букетов)
        const isFlowerCategory = (name: string) => {
          const lowerName = name.toLowerCase();
          return lowerName.includes('цвет') || lowerName.includes('букет') || 
                 lowerName.includes('пион') || lowerName.includes('авторск') ||
                 lowerName.includes('моно') || lowerName.includes('корзин') ||
                 lowerName.includes('подсолнух') || lowerName.includes('корпоратив') ||
                 lowerName.includes('гортенз') || lowerName.includes('роз') ||
                 lowerName.includes('тюльпан') || lowerName.includes('лилии') ||
                 lowerName.includes('хризантем') || lowerName.includes('орхиде') ||
                 lowerName.includes('лаванд') || lowerName.includes('эустом') ||
                 lowerName.includes('альстремер') || lowerName.includes('ромашк') ||
                 lowerName.includes('ирис') || lowerName.includes('нарцисс');
        };

        if (isFlowerCategory(categoryName)) {
          // Для всех цветочных категорий показываем НЕ-цветочные товары (вазы, сладости, игрушки, подарки)
          targetCategoryIds = allCategories
            .filter(cat => {
              const name = cat.name.toLowerCase();
              return !isFlowerCategory(name) && cat.id !== currentProduct.category_id;
            })
            .map(cat => cat.id);
        } else if (categoryName.includes('ваз')) {
          // Для ваз показываем все цветочные категории
          targetCategoryIds = allCategories
            .filter(cat => isFlowerCategory(cat.name))
            .map(cat => cat.id);
        } else if (categoryName.includes('игрушк')) {
          // Для игрушек показываем все кроме игрушек
          targetCategoryIds = allCategories
            .filter(cat => !cat.name.toLowerCase().includes('игрушк'))
            .map(cat => cat.id);
        } else if (categoryName.includes('сладост')) {
          // Для сладостей показываем все цветочные категории
          targetCategoryIds = allCategories
            .filter(cat => isFlowerCategory(cat.name))
            .map(cat => cat.id);
        } else {
          // По умолчанию показываем случайные категории (исключая текущую)
          targetCategoryIds = allCategories
            .filter(cat => cat.id !== currentProduct.category_id)
            .map(cat => cat.id);
        }
      }

      if (targetCategoryIds.length === 0) return [];

      // Получаем товары из целевых категорий
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('category_id', targetCategoryIds)
        .eq('is_active', true)
        .neq('id', productId) // Исключаем текущий товар
        .limit(10);

      if (error) throw error;

      // Перемешиваем и возвращаем максимум 5 товаров
      const shuffled = (products || []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5) as Product[];
    },
    enabled: !!productId,
  });
};

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
  });
};

export const useCreateRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (recommendation: Omit<ProductRecommendation, 'id' | 'created_at' | 'updated_at'>) => {
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
        title: "Успешно",
        description: "Рекомендация создана",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
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
        title: "Успешно",
        description: "Рекомендация обновлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
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
        title: "Успешно",
        description: "Рекомендация удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};