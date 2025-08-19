// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, CreateCategoryDto } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Нормализация строк
const norm = (s: unknown) => (typeof s === 'string' ? s.trim() : s ?? null);

// Безопасный маппинг строки БД → Category
function mapDbToCategory(row: any): Category {
  const obj = {
    id: row.id,
    name: (norm(row.name) as string) || 'Без названия',
    description: (norm(row.description) as string) ?? null,
    image_url: (norm(row.image_url) as string) ?? null,
    is_active: row.is_active ?? true,
    sort_order: row.sort_order ?? 0,
    parent_id: row.parent_id ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
  // TS ругается на несовпадение — приводим через unknown → Category
  return obj as unknown as Category;
}

// ==========================
// READ
// ==========================
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories', 'active-only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        // ВКЛЮЧИЛ created_at/updated_at, чтобы соответствовать твоему типу
        .select('id, name, description, image_url, is_active, sort_order, parent_id, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const mapped = rows.map(mapDbToCategory);

      // Доп. сортировка по name при равном sort_order
      mapped.sort((a, b) => {
        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (so !== 0) return so;
        return (a.name || '').localeCompare(b.name || '');
      });

      return mapped;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, image_url, is_active, sort_order, parent_id, created_at, updated_at')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const mapped = rows.map(mapDbToCategory);

      mapped.sort((a, b) => {
        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (so !== 0) return so;
        return (a.name || '').localeCompare(b.name || '');
      });

      return mapped;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

// ==========================
// WRITE
// ==========================
function normalizeCategoryInput<T extends Partial<CreateCategoryDto | Category>>(input: T): T {
  const copy: any = { ...input };
  if (typeof copy.name === 'string') {
    const trimmed = copy.name.trim();
    copy.name = trimmed.length ? trimmed : 'Без названия';
  }
  // Пустые строки → null
  ['description', 'image_url'].forEach((k) => {
    if (typeof copy[k] === 'string') {
      const v = (copy[k] as string).trim();
      copy[k] = v.length ? v : null;
    }
  });
  if (copy.sort_order == null) copy.sort_order = 0;
  if (copy.is_active == null) copy.is_active = true;
  // created_at/updated_at заполняет БД
  delete copy.created_at;
  delete copy.updated_at;
  return copy;
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: CreateCategoryDto) => {
      const payload = normalizeCategoryInput(category);
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select('id, name, description, image_url, is_active, sort_order, parent_id, created_at, updated_at')
        .single();

      if (error) throw error;
      return mapDbToCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
      toast({ title: 'Успешно', description: 'Категория создана' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const payload = normalizeCategoryInput(updates);
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select('id, name, description, image_url, is_active, sort_order, parent_id, created_at, updated_at')
        .single();

      if (error) throw error;
      return mapDbToCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
      toast({ title: 'Успешно', description: 'Категория обновлена' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
      toast({ title: 'Успешно', description: 'Категория удалена' });
    },
    onError: (error: any) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });
};
