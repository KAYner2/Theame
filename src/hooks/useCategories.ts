// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, CreateCategoryDto } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// --- helpers ---
const norm = (s: unknown) => (typeof s === 'string' ? s.trim() : s ?? null);

function mapDbToCategory(row: any): Category {
  return {
    id: row.id,
    name: (norm(row.name) as string) || 'Без названия',
    description: (norm(row.description) as string) ?? null,
    image_url: (norm(row.image_url) as string) ?? null,
    is_active: row.is_active ?? true,
    sort_order: row.sort_order ?? 0,
    parent_id: row.parent_id ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  } as Category;
}

const sortCategories = (rows: Category[] = []) =>
  [...rows].sort((a, b) => {
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    if (sa !== sb) return sa - sb;
    // при равных sort_order стабилизируем по created_at, а затем по name
    const d = String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
    if (d !== 0) return d;
    return (a.name || '').localeCompare(b.name || '');
  });

// ==========================
// READ
// ==========================
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories', 'active-only'],
    queryFn: async () => {
      const primary = await supabase
        .from('categories')
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }); // стабилизация

      if (!primary.error) {
        const rows = Array.isArray(primary.data) ? primary.data : [];
        return sortCategories(rows.map(mapDbToCategory));
      }

      console.warn('[useCategories] primary query failed:', primary.error?.message);
      const fallback = await supabase
        .from('categories')
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
        .order('name', { ascending: true });

      if (fallback.error) {
        console.error('[useCategories] fallback query failed:', fallback.error?.message);
        throw fallback.error;
      }
      return sortCategories((fallback.data ?? []).map(mapDbToCategory));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const primary = await supabase
        .from('categories')
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }); // стабилизация

      if (!primary.error) {
        const rows = Array.isArray(primary.data) ? primary.data : [];
        return sortCategories(rows.map(mapDbToCategory));
      }

      console.warn('[useAllCategories] primary query failed:', primary.error?.message);
      const fallback = await supabase
        .from('categories')
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
        .order('name', { ascending: true });

      if (fallback.error) {
        console.error('[useAllCategories] fallback query failed:', fallback.error?.message);
        throw fallback.error;
      }
      return sortCategories((fallback.data ?? []).map(mapDbToCategory));
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
  // ВАЖНО: не подставляем 0 в sort_order — это сделаем при insert (max+1)
  // if (copy.sort_order == null) copy.sort_order = 0;
  if (copy.is_active == null) copy.is_active = true;
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

      // если sort_order не задан — ставим "в конец"
      if (payload.sort_order == null) {
        const { data: maxRow } = await supabase
          .from('categories')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        payload.sort_order = (maxRow?.sort_order ?? -1) + 1;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
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
        .select('id, name, description, image_url, is_active, sort_order, created_at, updated_at')
        .single();

      if (error) throw error;
      return mapDbToCategory(data);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      await queryClient.cancelQueries({ queryKey: ['categories', 'all'] });

      const prevActive = queryClient.getQueryData<Category[]>(['categories', 'active-only']);
      const prevAll = queryClient.getQueryData<Category[]>(['categories', 'all']);

      if (prevActive) {
        queryClient.setQueryData<Category[]>(
          ['categories', 'active-only'],
          sortCategories(
            prevActive.map((c) => (String(c.id) === String(id) ? { ...c, ...updates } as Category : c))
          )
        );
      }
      if (prevAll) {
        queryClient.setQueryData<Category[]>(
          ['categories', 'all'],
          sortCategories(
            prevAll.map((c) => (String(c.id) === String(id) ? { ...c, ...updates } as Category : c))
          )
        );
      }

      return { prevActive, prevAll };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['categories', 'active-only'], ctx.prevActive);
      if (ctx?.prevAll) queryClient.setQueryData(['categories', 'all'], ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
    },
    onSuccess: () => {
      toast({ title: 'Успешно', description: 'Категория обновлена' });
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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      await queryClient.cancelQueries({ queryKey: ['categories', 'all'] });

      const prevActive = queryClient.getQueryData<Category[]>(['categories', 'active-only']);
      const prevAll = queryClient.getQueryData<Category[]>(['categories', 'all']);

      if (prevActive) {
        queryClient.setQueryData<Category[]>(
          ['categories', 'active-only'],
          prevActive.filter((c) => String(c.id) !== String(id))
        );
      }
      if (prevAll) {
        queryClient.setQueryData<Category[]>(
          ['categories', 'all'],
          prevAll.filter((c) => String(c.id) !== String(id))
        );
      }

      return { prevActive, prevAll };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevActive) queryClient.setQueryData(['categories', 'active-only'], ctx.prevActive);
      if (ctx?.prevAll) queryClient.setQueryData(['categories', 'all'], ctx.prevAll);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] });
    },
    onSuccess: () => {
      toast({ title: 'Успешно', description: 'Категория удалена' });
    },
  });
};
