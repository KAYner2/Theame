import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HeroSlide, CreateHeroSlideDto } from '@/types/database';

export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as HeroSlide[];
    }
  });
}

export function useAllHeroSlides() {
  return useQuery({
    queryKey: ['all-hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as HeroSlide[];
    }
  });
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (heroSlide: CreateHeroSlideDto) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert([heroSlide])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['all-hero-slides'] });
      toast({
        title: "Слайд создан",
        description: "Hero слайд успешно создан",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать слайд",
        variant: "destructive",
      });
      console.error('Error creating hero slide:', error);
    }
  });
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HeroSlide> }) => {
      const { data, error } = await supabase
        .from('hero_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['all-hero-slides'] });
      toast({
        title: "Слайд обновлен",
        description: "Hero слайд успешно обновлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить слайд",
        variant: "destructive",
      });
      console.error('Error updating hero slide:', error);
    }
  });
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['all-hero-slides'] });
      toast({
        title: "Слайд удален",
        description: "Hero слайд успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить слайд",
        variant: "destructive",
      });
      console.error('Error deleting hero slide:', error);
    }
  });
}