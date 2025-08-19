import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Trash2, Edit, Plus, Star, Eye, EyeOff, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAllCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useAllReviews, useCreateReview, useUpdateReview, useDeleteReview } from '@/hooks/useReviews';
import { useAllHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from '@/hooks/useHeroSlides';
import { useAllRecommendations, useCreateRecommendation, useUpdateRecommendation, useDeleteRecommendation } from '@/hooks/useRecommendations';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableProductCard from "./SortableProductCard"; // поправь путь при необходимости
import { Category, Product, Review, HeroSlide } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, useSensors, useSensor, MouseSensor, TouchSensor } from "@dnd-kit/core";

export const AdminPanel = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'reviews' | 'hero-slides' | 'recommendations'>('categories');
  const { toast } = useToast();

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  React.useEffect(() => {
  setOrderedProducts(products ?? []);
}, [products]);

const sensors = useSensors(
  // Мышь: начать dnd только если протащили ≥12px (чуть больше, чтобы клики не срабатывали)
  useSensor(MouseSensor, {
    activationConstraint: { distance: 12 },
  }),
  // Тач: начать dnd только если подержали палец ≥200мс и сдвиг ≤8px
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  })
);

  const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = orderedProducts.findIndex((p) => String(p.id) === String(active.id));
  const newIndex = orderedProducts.findIndex((p) => String(p.id) === String(over.id));
  if (oldIndex === -1 || newIndex === -1) return;

  // локально переставляем
  const newOrderArr = arrayMove(orderedProducts, oldIndex, newIndex);
  setOrderedProducts(newOrderArr);

  // сохраняем порядок в базе
  updateProductOrder.mutate(
    newOrderArr.map((p, i) => ({ id: String(p.id), sort_order: i }))
  );
};

  const { data: reviews = [], isLoading: reviewsLoading } = useAllReviews();
  const { data: heroSlides = [], isLoading: heroSlidesLoading } = useAllHeroSlides();
  const { data: recommendations = [], isLoading: recommendationsLoading } = useAllRecommendations();

  // Mutations
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

const updateProductOrder = useMutation({
  mutationFn: async (newOrder: Array<{ id: string; sort_order: number }>) => {
    const results = await Promise.all(
      newOrder.map((row) =>
        supabase.from("products").update({ sort_order: row.sort_order }).eq("id", row.id)
      )
    );
    const firstError = results.find((r: any) => r.error)?.error;
    if (firstError) throw firstError;
  },
  onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["featured-products"] });
  queryClient.invalidateQueries({ queryKey: ["all-products"] });
  queryClient.invalidateQueries({ queryKey: ["homepage-products"] });
  toast({ title: "Порядок сохранён" });
},
  onError: (err: any) => {
    console.error(err);
    toast({ variant: "destructive", title: "Не удалось сохранить порядок" });
  },
});
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const createHeroSlide = useCreateHeroSlide();
  const updateHeroSlide = useUpdateHeroSlide();
  const deleteHeroSlide = useDeleteHeroSlide();
  const createRecommendation = useCreateRecommendation();
  const updateRecommendation = useUpdateRecommendation();
  const deleteRecommendation = useDeleteRecommendation();

  const uploadImage = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const CategoryForm = ({ category }: { category?: Category }) => {
    const [formData, setFormData] = useState({
      name: category?.name || '',
      description: category?.description || '',
      image_url: category?.image_url || '',
      sort_order: category?.sort_order || 0,
      is_active: category?.is_active ?? true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        let imageUrl = formData.image_url;
        
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, 'categories');
        }

        const data = { ...formData, image_url: imageUrl };
        
        if (category) {
          await updateCategory.mutateAsync({ id: category.id, updates: data });
        } else {
          await createCategory.mutateAsync(data);
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
      } catch (error) {
        console.error('Error saving category:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Название</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="image">Изображение</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          {formData.image_url && (
            <img src={formData.image_url} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
          )}
        </div>
        <div>
          <Label htmlFor="sort_order">Порядок сортировки</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Активна</Label>
        </div>
        <Button type="submit" className="w-full">
          {category ? 'Обновить' : 'Создать'} категорию
        </Button>
      </form>
    );
  };

  const ProductForm = ({ product }: { product?: Product }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      description: product?.description || '',
      detailed_description: product?.detailed_description || '',
      care_instructions: product?.care_instructions || '',
      composition: product?.composition?.join(', ') || '',
      colors: product?.colors?.join(', ') || '',
      gift_info: product?.gift_info || '',
      guarantee_info: product?.guarantee_info || '',
      delivery_info: product?.delivery_info || '',
      size_info: product?.size_info || '',
      availability_status: product?.availability_status || 'in_stock',
      price: product?.price || 0,
      category_id: product?.category_id || '',
      image_url: product?.image_url || '',
      gallery_urls: product?.gallery_urls || [],
      is_featured: product?.is_featured ?? false,
      is_active: product?.is_active ?? true,
      show_on_homepage: product?.show_on_homepage ?? true,
      sort_order: product?.sort_order || 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        let imageUrl = formData.image_url;
        let galleryUrls = formData.gallery_urls || [];
        
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, 'products');
        }

        if (galleryFiles.length > 0) {
          const uploadedGalleryUrls = await Promise.all(
            galleryFiles.map(file => uploadImage(file, 'products'))
          );
          galleryUrls = [...galleryUrls, ...uploadedGalleryUrls].slice(0, 4); // Limit to 4 gallery images
        }

        const data = { 
          ...formData, 
          composition: formData.composition.split(',').map(item => item.trim()).filter(item => item),
          colors: formData.colors.split(',').map(item => item.trim()).filter(item => item),
          image_url: imageUrl, 
          gallery_urls: galleryUrls 
        };
        
        if (product) {
          await updateProduct.mutateAsync({ id: product.id, updates: data });
        } else {
          await createProduct.mutateAsync(data);
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
        setImageFile(null);
        setGalleryFiles([]);
      } catch (error) {
        console.error('Error saving product:', error);
      }
    };

    const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 4) {
        alert('Можно выбрать максимум 4 дополнительных изображения');
        return;
      }
      setGalleryFiles(files);
    };

    const removeGalleryImage = (index: number) => {
      const newGalleryUrls = [...(formData.gallery_urls || [])];
      newGalleryUrls.splice(index, 1);
      setFormData({ ...formData, gallery_urls: newGalleryUrls });
    };

    return (
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4 pr-2">
          <div>
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Краткое описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="detailed_description">Подробное описание</Label>
            <Textarea
              id="detailed_description"
              value={formData.detailed_description}
              onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="care_instructions">Уход</Label>
            <Textarea
              id="care_instructions"
              value={formData.care_instructions}
              onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="composition">Состав (через запятую)</Label>
            <Textarea
              id="composition"
              value={formData.composition}
              onChange={(e) => setFormData({ 
                ...formData, 
                composition: e.target.value
              })}
              placeholder="Розы, Зелень, Эвкалипт"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="colors">Цвета (через запятую)</Label>
            <Textarea
              id="colors"
              value={formData.colors}
              onChange={(e) => setFormData({ 
                ...formData, 
                colors: e.target.value
              })}
              placeholder="Красный, Белый, Розовый"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="gift_info">Информация о подарке</Label>
            <Textarea
              id="gift_info"
              value={formData.gift_info}
              onChange={(e) => setFormData({ ...formData, gift_info: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="delivery_info">Доставка</Label>
            <Textarea
              id="delivery_info"
              value={formData.delivery_info}
              onChange={(e) => setFormData({ ...formData, delivery_info: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="size_info">Размеры</Label>
            <Input
              id="size_info"
              value={formData.size_info}
              onChange={(e) => setFormData({ ...formData, size_info: e.target.value })}
              placeholder="Высота букета: 40-45 см"
            />
          </div>
          <div>
            <Label htmlFor="availability_status">Статус наличия</Label>
            <Select value={formData.availability_status} onValueChange={(value) => setFormData({ ...formData, availability_status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">В наличии</SelectItem>
                <SelectItem value="out_of_stock">Нет в наличии</SelectItem>
                <SelectItem value="limited">Ограничено</SelectItem>
                <SelectItem value="pre_order">Предзаказ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Цена</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="category">Категория</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Основное изображение (отображается везде)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {formData.image_url && (
              <div className="mt-2">
                <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
                <p className="text-sm text-muted-foreground mt-1">Текущее основное изображение</p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="gallery">Дополнительные изображения (максимум 4, только на странице товара)</Label>
            <Input
              id="gallery"
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFilesChange}
            />
            {formData.gallery_urls && formData.gallery_urls.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Текущие дополнительные изображения:</p>
                <div className="grid grid-cols-4 gap-2">
                  {formData.gallery_urls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => removeGalleryImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="is_featured">Рекомендуемый</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Активен</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show_on_homepage"
              checked={formData.show_on_homepage}
              onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
            />
            <Label htmlFor="show_on_homepage">Показывать на главной</Label>
          </div>
          <div>
            <Label htmlFor="sort_order">Порядок сортировки</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
            />
          </div>
          <Button type="submit" className="w-full">
            {product ? 'Обновить' : 'Создать'} продукт
          </Button>
        </form>
      </div>
    );
  };

  const ReviewForm = ({ review }: { review?: Review }) => {
    const [formData, setFormData] = useState({
      client_name: review?.client_name || '',
      rating: review?.rating || 5,
      comment: review?.comment || '',
      client_avatar_url: review?.client_avatar_url || '',
      is_approved: review?.is_approved ?? true,
      is_active: review?.is_active ?? true,
      publication_date: review?.publication_date ? new Date(review.publication_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        let avatarUrl = formData.client_avatar_url;
        
        if (avatarFile) {
          avatarUrl = await uploadImage(avatarFile, 'reviews');
        }

        const data = { ...formData, client_avatar_url: avatarUrl };
        
        if (review) {
          await updateReview.mutateAsync({ id: review.id, updates: data });
        } else {
          await createReview.mutateAsync(data);
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
      } catch (error) {
        console.error('Error saving review:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client_name">Имя клиента</Label>
          <Input
            id="client_name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="rating">Рейтинг</Label>
          <Select value={String(formData.rating)} onValueChange={(value) => setFormData({ ...formData, rating: Number(value) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={String(num)}>
                  {Array.from({ length: num }, (_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current inline" />
                  ))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="avatar">Аватар клиента</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
          {formData.client_avatar_url && (
            <img src={formData.client_avatar_url} alt="Avatar" className="mt-2 w-12 h-12 object-cover rounded-full" />
          )}
        </div>
        <div>
          <Label htmlFor="publication_date">Дата публикации</Label>
          <Input
            id="publication_date"
            type="date"
            value={formData.publication_date}
            onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_approved"
            checked={formData.is_approved}
            onCheckedChange={(checked) => setFormData({ ...formData, is_approved: checked })}
          />
          <Label htmlFor="is_approved">Одобрен</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Активен</Label>
        </div>
        <Button type="submit" className="w-full">
          {review ? 'Обновить' : 'Создать'} отзыв
        </Button>
      </form>
    );
  };

  const HeroSlideForm = ({ heroSlide }: { heroSlide?: HeroSlide }) => {
    const [formData, setFormData] = useState({
      title: heroSlide?.title || '',
      subtitle: heroSlide?.subtitle || '',
      image_url: heroSlide?.image_url || '',
      sort_order: heroSlide?.sort_order || 0,
      is_active: heroSlide?.is_active ?? true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        let imageUrl = formData.image_url;
        
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, 'hero-slides');
        }

        const data = { ...formData, image_url: imageUrl };
        
        if (heroSlide) {
          await updateHeroSlide.mutateAsync({ id: heroSlide.id, updates: data });
        } else {
          await createHeroSlide.mutateAsync(data);
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
      } catch (error) {
        console.error('Error saving hero slide:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Заголовок</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="subtitle">Подзаголовок</Label>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="image">Изображение</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          {formData.image_url && (
            <img src={formData.image_url} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded" />
          )}
        </div>
        <div>
          <Label htmlFor="sort_order">Порядок сортировки</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Активен</Label>
        </div>
        <Button type="submit" className="w-full">
          {heroSlide ? 'Обновить' : 'Создать'} слайд
        </Button>
      </form>
    );
  };

  const RecommendationForm = ({ recommendation }: { recommendation?: any }) => {
    const [formData, setFormData] = useState({
      source_category_id: recommendation?.source_category_id || '',
      target_category_id: recommendation?.target_category_id || '',
      is_active: recommendation?.is_active ?? true,
      sort_order: recommendation?.sort_order || 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        if (recommendation) {
          await updateRecommendation.mutateAsync({ id: recommendation.id, updates: formData });
        } else {
          await createRecommendation.mutateAsync(formData);
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
      } catch (error) {
        console.error('Error saving recommendation:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="source_category">Исходная категория (из какой категории показываем рекомендации)</Label>
          <Select value={formData.source_category_id} onValueChange={(value) => setFormData({ ...formData, source_category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите исходную категорию" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="target_category">Целевая категория (что показываем)</Label>
          <Select value={formData.target_category_id} onValueChange={(value) => setFormData({ ...formData, target_category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите целевую категорию" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Порядок сортировки</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Активна</Label>
        </div>
        <Button type="submit" className="w-full">
          {recommendation ? 'Обновить' : 'Создать'} рекомендацию
        </Button>
      </form>
    );
  };

  const openDialog = (item?: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Панель администратора
          </h1>
          <p className="text-lg text-muted-foreground">
            Управление категориями, продуктами, отзывами и слайдами
          </p>
        </div>

      <Tabs defaultValue="categories" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          <TabsTrigger value="hero-slides">Hero слайды</TabsTrigger>
          <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Категории</h2>
            <Dialog open={isDialogOpen && activeTab === 'categories'} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить категорию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Редактировать' : 'Создать'} категорию
                  </DialogTitle>
                </DialogHeader>
                <CategoryForm category={editingItem} />
              </DialogContent>
            </Dialog>
          </div>

          {categoriesLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      {category.image_url && (
                        <img src={category.image_url} alt={category.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {category.is_active ? 'Активна' : 'Неактивна'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingItem(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать категорию</DialogTitle>
                          </DialogHeader>
                          <CategoryForm category={category} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteCategory.mutate(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Товары</h2>
            <Dialog open={isDialogOpen && activeTab === 'products'} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить товар
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Редактировать' : 'Создать'} товар
                  </DialogTitle>
                </DialogHeader>
                <ProductForm product={editingItem} />
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
  <p>Загрузка...</p>
) : (
  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
    <SortableContext
      items={orderedProducts.map((p) => String(p.id))}
      strategy={verticalListSortingStrategy}
    >
      <div className="grid gap-4">
        {orderedProducts.map((product) => (
          <SortableProductCard key={product.id} id={String(product.id)}>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  {product.image_url && (
  <img
    src={product.image_url}
    alt={product.name}
    className="w-12 h-12 object-cover rounded"
    draggable={false}
  />
)}
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <p className="text-sm font-medium">₽{product.price}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {product.is_featured && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          Рекомендуемый
                        </Badge>
                      )}
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {product.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
  variant="outline"
  size="sm"
  onPointerDown={(e) => e.stopPropagation()}
  onClick={() => setEditingItem(product)}
>
  <Edit className="h-4 w-4" />
</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>Редактировать товар</DialogTitle>
                      </DialogHeader>
                      <ProductForm product={product} />
                    </DialogContent>
                  </Dialog>
                  <Button
  variant="outline"
  size="sm"
  onPointerDown={(e) => e.stopPropagation()}
  onClick={() => deleteProduct.mutate(product.id)}
>
  <Trash2 className="h-4 w-4" />
</Button>
                </div>
              </CardContent>
            </Card>
          </SortableProductCard>
        ))}
      </div>
    </SortableContext>
  </DndContext>
)}

        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Отзывы</h2>
            <Dialog open={isDialogOpen && activeTab === 'reviews'} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить отзыв
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Редактировать' : 'Создать'} отзыв
                  </DialogTitle>
                </DialogHeader>
                <ReviewForm review={editingItem} />
              </DialogContent>
            </Dialog>
          </div>

          {reviewsLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      {review.client_avatar_url && (
                        <img src={review.client_avatar_url} alt={review.client_name} className="w-12 h-12 object-cover rounded-full" />
                      )}
                      <div>
                        <h3 className="font-semibold">{review.client_name}</h3>
                        <div className="flex items-center">
                          {Array.from({ length: review.rating }, (_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={review.is_approved ? "default" : "destructive"}>
                            {review.is_approved ? 'Одобрен' : 'Ожидает модерации'}
                          </Badge>
                          <Badge variant={review.is_active ? "default" : "secondary"}>
                            {review.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingItem(review)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать отзыв</DialogTitle>
                          </DialogHeader>
                          <ReviewForm review={review} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteReview.mutate(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hero-slides" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Hero слайды</h2>
            <Dialog open={isDialogOpen && activeTab === 'hero-slides'} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить слайд
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Редактировать' : 'Создать'} слайд
                  </DialogTitle>
                </DialogHeader>
                <HeroSlideForm heroSlide={editingItem} />
              </DialogContent>
            </Dialog>
          </div>

          {heroSlidesLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="grid gap-4">
              {heroSlides.map((slide) => (
                <Card key={slide.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      {slide.image_url && (
                        <img src={slide.image_url} alt={slide.title || 'Hero slide'} className="w-20 h-12 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="font-semibold">{slide.title || 'Без заголовка'}</h3>
                        <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Порядок: {slide.sort_order}</Badge>
                          <Badge variant={slide.is_active ? "default" : "secondary"}>
                            {slide.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {slide.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingItem(slide)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать слайд</DialogTitle>
                          </DialogHeader>
                          <HeroSlideForm heroSlide={slide} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteHeroSlide.mutate(slide.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Рекомендации товаров</h2>
            <Dialog open={isDialogOpen && activeTab === 'recommendations'} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить рекомендацию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Редактировать' : 'Создать'} рекомендацию
                  </DialogTitle>
                </DialogHeader>
                <RecommendationForm recommendation={editingItem} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Логика рекомендаций по умолчанию:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Все цветочные категории:</strong> показывают только НЕ-цветочные товары (вазы, сладости, игрушки, подарки)</li>
              <li>• <strong>Вазы:</strong> показывают все цветочные категории</li>
              <li>• <strong>Игрушки:</strong> показывают все категории кроме игрушек</li>
              <li>• <strong>Сладости:</strong> показывают все цветочные категории</li>
              <li>• <strong>Остальные:</strong> показывают случайные категории</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Цветочные категории: букеты, цветы, пионы, авторские букеты, моно букеты, корзины, подсолнухи, корпоративные подарки, гортензии, розы, тюльпаны, лилии и др.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Настройки ниже переопределяют логику по умолчанию
            </p>
          </div>

          {recommendationsLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((recommendation: any) => (
                <Card key={recommendation.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">
                          {recommendation.source_category?.name} → {recommendation.target_category?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          При просмотре товаров из категории "{recommendation.source_category?.name}" 
                          показывать товары из категории "{recommendation.target_category?.name}"
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Порядок: {recommendation.sort_order}</Badge>
                          <Badge variant={recommendation.is_active ? "default" : "secondary"}>
                            {recommendation.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {recommendation.is_active ? 'Активна' : 'Неактивна'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingItem(recommendation)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Редактировать рекомендацию</DialogTitle>
                          </DialogHeader>
                          <RecommendationForm recommendation={recommendation} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteRecommendation.mutate(recommendation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {recommendations.length === 0 && (
                <Card>
                  <CardContent className="text-center p-8">
                    <p className="text-muted-foreground">
                      Пока нет настроенных рекомендаций. Используется логика по умолчанию.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};