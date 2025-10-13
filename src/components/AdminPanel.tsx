import React, { useState } from 'react';
import type { AvailabilityStatus, Database } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSetProductCategories } from '@/hooks/useProducts';
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
import {
  useAllVariantProducts,
  useCreateVariantProduct,
  useUpdateVariantProduct,
  useDeleteVariantProduct,
} from '@/hooks/useVariantProducts';
import { useSetVariantProductCategories } from '@/hooks/useVariantProductCategories';
import SortableProductCard from "./SortableProductCard"; // поправь путь при необходимости
import { Category, Product, Review, HeroSlide } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, useSensors, useSensor, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { slugify } from "@/utils/slugify";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- helpers: нормализация списка цветов ---
const splitItems = (input: string) =>
  input
    .split(/[,;\n]+/g)                // запятая / ; / перенос строки
    .map(s => s.trim())
    .filter(Boolean);

const capitalizeFirst = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const normalizeFlower = (raw: string) => {
  return capitalizeFirst(
    raw
      .toLowerCase()
      .replace(/\b\d+\s*(шт|штук)\.?/gi, '')
      .replace(/\b[хx]\s*\d+\b/gi, '')
      .replace(/\b\d+\b/g, '')
      .replace(/[()]/g, ' ')
      .replace(/[.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

const normalizeComposition = (input: string): string[] =>
  Array.from(new Set(splitItems(input).map(normalizeFlower).filter(Boolean)));

export const AdminPanel = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
  'categories' | 'products' | 'reviews' | 'hero-slides' | 'recommendations' | 'variant-products'
>('categories');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // --- для фикса скролла ---
const scrollRef = React.useRef<HTMLDivElement | null>(null);
const scrollPosRef = React.useRef<number>(0);

const captureScroll = () => {
  const el = scrollRef.current;
  scrollPosRef.current = el ? el.scrollTop : window.scrollY || 0;
};

const restoreScroll = () => {
  const el = scrollRef.current;
  const y = scrollPosRef.current || 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (el) el.scrollTo(0, y);
      else window.scrollTo(0, y);
    });
  });
};

React.useEffect(() => {
  const id = setTimeout(restoreScroll, 0);
  return () => clearTimeout(id);
});

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  React.useEffect(() => {
    setOrderedProducts(products ?? []);
  }, [products]);

  // ▼▼▼ VARIANT PRODUCTS: данные + локальный порядок + DnD ▼▼▼
const { data: variantProducts = [], isLoading: variantProductsLoading } = useAllVariantProducts();

const [orderedVariantProducts, setOrderedVariantProducts] = useState<any[]>([]);
React.useEffect(() => {
  setOrderedVariantProducts(variantProducts ?? []);
}, [variantProducts]);

// ▼▼▼ объединённый список для общего DnD (НЕ ломаем твои стейты) ▼▼▼
const combinedItems = React.useMemo(() => {
  // добавляем техническое поле _kind для определения типа карточки
  const normProducts = (orderedProducts ?? []).map(p => ({ ...p, _kind: "product" as const }));
  const normVariantProducts = (orderedVariantProducts ?? []).map(v => ({ ...v, _kind: "variant" as const }));

  // общий список, сортируем по sort_order
  return [...normProducts, ...normVariantProducts].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
}, [orderedProducts, orderedVariantProducts]);

// CRUD-хуки
const createVariantProduct = useCreateVariantProduct();
const updateVariantProduct = useUpdateVariantProduct();
const deleteVariantProduct = useDeleteVariantProduct();

// RPC для категорий (как у обычных товаров)
const setVariantProductCategories = useSetVariantProductCategories();

// Перестановка карточек «товаров с вариантами»
const handleVariantDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = orderedVariantProducts.findIndex((p) => String(p.id) === String(active.id));
  const newIndex = orderedVariantProducts.findIndex((p) => String(p.id) === String(over.id));
  if (oldIndex === -1 || newIndex === -1) return;

  const newOrderArr = arrayMove(orderedVariantProducts, oldIndex, newIndex);
  setOrderedVariantProducts(newOrderArr);

  updateVariantOrder.mutate(newOrderArr.map((p, i) => ({ id: Number(p.id), sort_order: i })));
};

// сохранение sort_order в БД
const updateVariantOrder = useMutation({
  mutationFn: async (newOrder: Array<{ id: number; sort_order: number }>) => {
    const results = await Promise.all(
      newOrder.map((row) =>
        supabase.from('variant_products').update({ sort_order: row.sort_order }).eq('id', row.id)
      )
    );
    const firstError = results.find((r: any) => r.error)?.error;
    if (firstError) throw firstError;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['variant-products'] });
    toast({ title: 'Порядок сохранён' });
  },
  onError: () => {
    toast({ variant: 'destructive', title: 'Не удалось сохранить порядок' });
  },
});
// ▲▲▲ VARIANT PRODUCTS: конец блока ▲▲▲

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

  const dndDisabled = isDialogOpen && (activeTab === "products" || activeTab === "variant-products");

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

const handleUnifiedDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const keyOf = (x: any) => `${x._kind}:${x.id}`;

  const oldIndex = combinedItems.findIndex((x) => keyOf(x) === String(active.id));
  const newIndex = combinedItems.findIndex((x) => keyOf(x) === String(over.id));
  if (oldIndex === -1 || newIndex === -1) return;

  const newCombined = arrayMove(combinedItems, oldIndex, newIndex).map((item, idx) => ({
    ...item,
    sort_order: idx,
  }));

  const newProducts = newCombined.filter(i => i._kind === "product");
  const newVariants = newCombined.filter(i => i._kind === "variant");

  setOrderedProducts(newProducts as any);
  setOrderedVariantProducts(newVariants as any);

  updateProductOrder.mutate(
    newProducts.map((p, i) => ({ id: String(p.id), sort_order: i }))
  );
  updateVariantOrder.mutate(
    newVariants.map((p, i) => ({ id: Number(p.id), sort_order: i }))
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
  const setProductCategories = useSetProductCategories();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  

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
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const unique = `${crypto.randomUUID()}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(unique, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type || undefined,
    });

  if (error) throw error;

  const { data: pub } = supabase.storage
    .from(bucket)
    .getPublicUrl(unique);

  return pub.publicUrl;
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

        const data = { 
  ...formData, 
  image_url: imageUrl,
  // 👇 добавляем slug: если есть старый slug — берём его, если нет — генерим из имени
  slug: (category as any)?.slug || slugify(formData.name),
};
        
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
      detailed_description: product?.detailed_description || '',
      composition: (product?.composition_raw ?? (product?.composition?.join(', ') ?? '')),
      guarantee_info: product?.guarantee_info || '',
      size_info: product?.size_info || '',
      availability_status: (product?.availability_status ?? 'in_stock') as AvailabilityStatus,
      price: product?.price || 0,
      category_ids: product?.category_ids ?? (product?.category_id ? [product.category_id] : []),
      image_url: product?.image_url || '',
      gallery_urls: product?.gallery_urls || [],
      is_featured: product?.is_featured ?? false,
      is_active: product?.is_active ?? true,
      show_on_homepage: product?.show_on_homepage ?? true,
      sort_order: product?.sort_order || 0,
      show_substitution_note: product?.show_substitution_note ?? false,
      substitution_note_text: product?.substitution_note_text || '',
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

// СБОР ПОЛЕЙ ТОВАРА (без категорий!)
const data = {
  ...formData,

  // 🔥 сырой ввод для страницы товара (с "шт")
  composition_raw: formData.composition,

  // ✅ нормализованный массив для фильтров/поиска (без "шт", "x5", и дублей)
  composition: normalizeComposition(formData.composition),

  image_url: imageUrl,
  gallery_urls: galleryUrls,

  slug: slugify(formData.name),

  show_substitution_note: formData.show_substitution_note,
  substitution_note_text: formData.substitution_note_text,
};

        // категории нельзя отправлять в таблицу products — убираем поле из payload
        delete (data as any).category_ids;

        let savedProductId = product?.id as string | undefined;

        // 1) Сохраняем САМ ТОВАР
        if (product) {
          await updateProduct.mutateAsync({ id: product.id, updates: data });
          savedProductId = product.id;
        } else {
          const created = await createProduct.mutateAsync(data as any);
          savedProductId = created.id as string;
        }

        // 2) Сохраняем КАТЕГОРИИ через RPC
        await setProductCategories.mutateAsync({
          productId: String(savedProductId!),
          categoryIds: formData.category_ids,
        });

        // 3) Сбрасываем форму/диалог
        setIsDialogOpen(false);
        setEditingItem(null);
        setImageFile(null);
        setGalleryFiles([]);

        // 3.1) Снимаем фокус (фикс: тост/диалог не возвращают фокус к триггеру => нет скролла вверх)
        requestAnimationFrame(() => {
          (document.activeElement as HTMLElement | null)?.blur?.();
        });

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
            <Label htmlFor="detailed_description">Подробное описание</Label>
            <Textarea
              id="detailed_description"
              value={formData.detailed_description}
              onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
              rows={4}
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
          <div className="flex items-center space-x-2">
  <Switch
    id="show_substitution_note"
    checked={formData.show_substitution_note}
    onCheckedChange={(checked) =>
      setFormData({ ...formData, show_substitution_note: checked })
    }
  />
  <Label htmlFor="show_substitution_note">
    Показывать строку о возможной замене компонентов
  </Label>
</div>

{formData.show_substitution_note && (
  <div>
    <Label htmlFor="substitution_note_text">Текст строки (необязательно)</Label>
    <Textarea
      id="substitution_note_text"
      value={formData.substitution_note_text}
      onChange={(e) =>
        setFormData({ ...formData, substitution_note_text: e.target.value })
      }
      placeholder="До 20% компонентов букета могут быть заменены с сохранением общей стилистики и цветового решения!"
      rows={2}
    />
  </div>
)}
{/*
<div>
  <Label htmlFor="availability_status">Статус наличия</Label>
  <Select ... >
    ...
  </Select>
</div>
*/}
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
            <Label>Категории</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
              {categories.map((c) => {
                const checked = formData.category_ids.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setFormData((prev) => {
                          const set = new Set(prev.category_ids);
                          e.target.checked ? set.add(c.id) : set.delete(c.id);
                          return { ...prev, category_ids: Array.from(set) };
                        });
                      }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
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

  const SortableChip = ({
  id,
  active,
  title,
  price,
  onTitleChange,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  id: number | string;
  active: boolean;
  title: string;
  price: number | null;
  onTitleChange: (v: string) => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 border rounded-full pl-2 pr-1 py-1 ${active ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      {/* drag-handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab px-1 text-xs opacity-70"
        title="Перетащи"
        onClick={(e) => e.stopPropagation()}
      >
        ≡
      </button>

      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="S / XL / 3 / 21"
        className="h-7 w-24 border-none focus-visible:ring-0 p-0 text-sm bg-transparent"
        onClick={(e) => e.stopPropagation()}
      />

      {price != null && (
        <span className="text-xs opacity-70">• {price} ₽</span>
      )}

      <button
        type="button"
        className="px-1 text-xs opacity-70 hover:opacity-100"
        title="Дублировать"
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
      >
        ⎘
      </button>

      <button
        type="button"
        className="px-1 text-xs opacity-70 hover:opacity-100"
        title="Удалить"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        ✕
      </button>
    </div>
  );
};

// сенсоры DnD для чипов (хуки — только на верхнем уровне компонента!)
const chipSensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
);
// ─────────────────────────────────────────────────────────────
// VariantProductForm: форма для товаров с вариантами + редактор вариантов
// Категории сохраняем через RPC set_variant_product_categories
// ─────────────────────────────────────────────────────────────
const VariantProductForm = ({ product }: { product?: any }) => {
  type PV = Database["public"]["Tables"]["product_variants"]["Row"];
  type PVInsert = Database["public"]["Tables"]["product_variants"]["Insert"];
  type PVUpdate = Database["public"]["Tables"]["product_variants"]["Update"];

  // ── Основные поля товара с вариантами
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    is_active: product?.is_active ?? true,
    sort_order: product?.sort_order || 0,
    slug: product?.slug || (product?.name ? slugify(product.name) : ''),
    extra_image_1_url: (product as any)?.extra_image_1_url || '',
    extra_image_2_url: (product as any)?.extra_image_2_url || '',
    // локальное хранение выбранных категорий (в БД не пишем напрямую)
    category_ids: product?.category_ids || [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extra1File, setExtra1File] = useState<File | null>(null);
  const [extra2File, setExtra2File] = useState<File | null>(null);

  // ── Варианты (локальный стейт редактирования)
  type VariantLocal = {
    id: number | string;           // временно string для новых (e.g. 'tmp-...')
    product_id?: number;
    title: string;
    price: number | null;
    composition: string | null;
    description?: string | null;
    image_url: string | null;
    gallery_urls?: string[] | null;
    is_active: boolean;
    sort_order: number;
    _dirty?: boolean;              // пометки на несохранённые изменения
    _new?: boolean;                // новый (ещё нет id в БД)
    _deleted?: boolean;            // пометили на удаление
  };

  const [variants, setVariants] = useState<VariantLocal[]>([]);
  const [activeVariantId, setActiveVariantId] = useState<number | string | null>(null);

  // ── Подтягиваем варианты для редактируемого товара
  React.useEffect(() => {
  const loadCats = async () => {
    if (!product?.id) return;
    const { data, error } = await supabase
      .from('variant_product_categories')
      .select('category_id')
      .eq('product_id', product.id);
    if (!error) {
      setFormData(prev => ({ ...prev, category_ids: (data ?? []).map(r => r.category_id) }));
    }
  };
  loadCats();
}, [product?.id]);
  React.useEffect(() => {
    const fetchVariants = async () => {
      if (!product?.id) return;
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      const list: VariantLocal[] = (data ?? []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        title: v.title,
        price: v.price,
        composition: v.composition,
        description: v.description ?? null,
        image_url: v.image_url ?? null,
        gallery_urls: v.gallery_urls ?? null,
        is_active: v.is_active,
        sort_order: v.sort_order ?? 0,
      }));
      setVariants(list);
      setActiveVariantId(list[0]?.id ?? null);
    };
    fetchVariants();
  }, [product?.id]);

  // ── Создать новый локальный вариант
  const handleAddVariant = () => {
    if (variants.filter(v => !v._deleted).length >= 10) return;
    const tmpId = `tmp-${crypto.randomUUID()}`;
    const v: VariantLocal = {
      id: tmpId,
      title: '',
      price: null,
      composition: '',
      description: null,
      image_url: null,
      gallery_urls: null,
      is_active: false,
      sort_order: Math.max(0, ...variants.map(v => v.sort_order)) + 1,
      _new: true,
      _dirty: true,
    };
    setVariants(prev => [...prev, v]);
    setActiveVariantId(tmpId);
  };

  // ── Удалить/восстановить вариант (локально)
  const handleDeleteVariant = (id: number | string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, _deleted: true, _dirty: true } : v));
    // если удалили активный — переключаемся на первый доступный
    if (activeVariantId === id) {
      const first = variants.find(v => v.id !== id && !v._deleted);
      setActiveVariantId(first?.id ?? null);
    }
  };

  // ── Дублировать вариант
  const handleDuplicateVariant = (id: number | string) => {
    const src = variants.find(v => v.id === id);
    if (!src) return;
    const tmpId = `tmp-${crypto.randomUUID()}`;
    const copy: VariantLocal = {
      ...src,
      id: tmpId,
      title: src.title ? `${src.title}-copy` : '',
      _new: true,
      _dirty: true,
    };
    setVariants(prev => [...prev, copy]);
    setActiveVariantId(tmpId);
  };

  // ── Переупорядочить (вверх/вниз)
  const moveVariant = (id: number | string, dir: 'up' | 'down') => {
    const vis = variants.filter(v => !v._deleted);
    const idx = vis.findIndex(v => v.id === id);
    if (idx === -1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= vis.length) return;
    const a = vis[idx], b = vis[swapIdx];
    // поменяем sort_order местами
    setVariants(prev => prev.map(v => {
      if (v.id === a.id) return { ...v, sort_order: b.sort_order, _dirty: true };
      if (v.id === b.id) return { ...v, sort_order: a.sort_order, _dirty: true };
      return v;
    }));
    setActiveVariantId(id);
  };

  // ── Редактирование полей варианта
  const patchVariant = (id: number | string, patch: Partial<VariantLocal>) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch, _dirty: true } : v));
  };

  // ── Загрузка фото для варианта: сразу загружаем и сохраняем URL
  const handleUploadVariantImage = async (file: File, id: number | string) => {
    try {
      const url = await uploadImage(file, 'products');
      patchVariant(id, { image_url: url });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Не удалось загрузить фото варианта' });
    }
  };

  // ── submit формы товара + вариантов
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 0) валидация: не больше 10, активные имеют title+price
      const visible = variants.filter(v => !v._deleted);
      if (visible.length > 10) {
        toast({ variant: 'destructive', title: 'Не больше 10 вариантов' });
        return;
      }
      const invalidActive = visible.some(v => v.is_active && (!v.title || v.price == null));
      if (invalidActive) {
        toast({ variant: 'destructive', title: 'У активных вариантов должно быть имя и цена' });
        return;
      }
if (formData.is_active) {
  const hasAtLeastOneActive = visible.some(v => v.is_active && v.title && v.price != null);
  if (!hasAtLeastOneActive) {
    toast({ variant: 'destructive', title: 'Чтобы опубликовать товар, нужен хотя бы один активный вариант с именем и ценой' });
    return;
  }
}
      // 1) Загрузка общего изображения (если выбрали новый файл)
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'products');
      }

      // 1.1) Загрузка двух доп. фото (если выбраны)
let extra1Url = formData.extra_image_1_url || '';
let extra2Url = formData.extra_image_2_url || '';

if (extra1File) {
  extra1Url = await uploadImage(extra1File, 'products');
}
if (extra2File) {
  extra2Url = await uploadImage(extra2File, 'products');
}

      // 2) Создаём или обновляем сам товар
      let savedId: number;
      if (product?.id) {
        await supabase.from('variant_products')
          .update({
            name: formData.name,
            description: formData.description,
            image_url: imageUrl,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            slug: formData.slug,
            extra_image_1_url: extra1Url || null,
            extra_image_2_url: extra2Url || null,
          })
          .eq('id', product.id);
        savedId = product.id;
      } else {
        const { data: created, error } = await supabase
          .from('variant_products')
          .insert({
            name: formData.name,
            description: formData.description,
            image_url: imageUrl,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            slug: formData.slug,
            extra_image_1_url: extra1Url || null,
            extra_image_2_url: extra2Url || null,
          })
          .select()
          .single();
        if (error) throw error;
        savedId = created.id;
      }

      // 3) Сохраняем категории через RPC
      await setVariantProductCategories.mutateAsync({
        productId: savedId,
        categoryIds: formData.category_ids,
      });

      // 4) Сохраняем варианты (create/update/delete)
      //    Пишем sort_order как порядковый номер по текущему списку
      const currentVisible = variants
        .filter(v => !v._deleted)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v, i) => ({ ...v, sort_order: i }));

      // 4.1 Удаляем помеченные
      const toDelete = variants.filter(v => v._deleted && typeof v.id === 'number') as VariantLocal[];
      if (toDelete.length) {
        const ids = toDelete.map(v => v.id as number);
        await supabase.from('product_variants').delete().in('id', ids);
      }

      // 4.2 Upsert существующих / создание новых
      for (const v of currentVisible) {
        if (typeof v.id === 'number') {
          // update
          const updates: PVUpdate = {
            title: v.title,
            price: v.price ?? undefined,
            composition: v.composition,
            description: v.description ?? undefined,
            image_url: v.image_url ?? undefined,
            gallery_urls: v.gallery_urls ?? undefined,
            is_active: v.is_active,
            sort_order: v.sort_order,
          };
          const { error } = await supabase.from('product_variants').update(updates).eq('id', v.id);
          if (error) throw error;
        } else {
          // insert
          const payload: PVInsert = {
            product_id: savedId,
            title: v.title,
            price: v.price ?? 0,
            composition: v.composition,
            description: v.description ?? null,
            image_url: v.image_url ?? null,
            gallery_urls: v.gallery_urls ?? null,
            is_active: v.is_active,
            sort_order: v.sort_order,
          };
          const { data: created, error } = await supabase
            .from('product_variants')
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          // заменить temp id на реальный
          setVariants(prev => prev.map(x => x.id === v.id ? { ...x, id: created.id, _new: false, _dirty: false } : x));
        }
      }

      // 5) Готово: закрываем форму
      setIsDialogOpen(false);
      setEditingItem(null);
      setImageFile(null);
      toast({ title: product?.id ? 'Обновлено' : 'Создано' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Ошибка сохранения' });
    }
  };

  // ── Получение категорий для чекбоксов (как в остальной панели)
  const { data: categories = [] } = useAllCategories();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Название + slug */}
      <div>
        <Label htmlFor="vp_name">Название</Label>
        <Input
          id="vp_name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: slugify(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label htmlFor="vp_slug">Slug</Label>
        <Input
          id="vp_slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          required
        />
      </div>

      {/* Категории */}
      <div>
        <Label>Категории</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
          {categories.map((c: any) => {
            const checked = formData.category_ids.includes(c.id);
            return (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setFormData((prev) => {
                      const set = new Set(prev.category_ids);
                      e.target.checked ? set.add(c.id) : set.delete(c.id);
                      return { ...prev, category_ids: Array.from(set) };
                    });
                  }}
                />
                <span>{c.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Блок Варианты */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Варианты ({variants.filter(v => !v._deleted).length}/10)</Label>
          <Button type="button" variant="secondary" onClick={handleAddVariant} disabled={variants.filter(v => !v._deleted).length >= 10}>
            <Plus className="w-4 h-4 mr-1" /> Добавить вариант
          </Button>
        </div>
{/* ЧИПЫ (DnD) */}
{(() => {
  const visible = variants
    .filter(v => !v._deleted)
    .sort((a, b) => a.sort_order - b.sort_order);
  const ids = visible.map(v => v.id);

  // локальные сенсоры для перетаскивания
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visible.findIndex(v => v.id === active.id);
    const newIndex = visible.findIndex(v => v.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);

    // перенумеруем sort_order по новому порядку
    const orderMap = new Map(reordered.map((v, i) => [v.id, i]));
    setVariants(prev =>
      prev.map(v =>
        v._deleted ? v : { ...v, sort_order: orderMap.get(v.id) ?? v.sort_order, _dirty: true }
      )
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={ids}>
        <div className="flex flex-wrap gap-2">
          {visible.map(v => (
            <SortableChip
              key={v.id}
              id={v.id}
              active={v.id === activeVariantId}
              title={v.title}
              price={v.price}
              onTitleChange={(val) => patchVariant(v.id, { title: val })}
              onSelect={() => setActiveVariantId(v.id)}
              onDuplicate={() => handleDuplicateVariant(v.id)}
              onDelete={() => handleDeleteVariant(v.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
})()}


{/* Панель выбранного варианта */}
{activeVariantId && (() => {
  const v = variants.find(x => x.id === activeVariantId && !x._deleted);
  if (!v) return null;

  // локальный хелпер: загрузка нескольких фото в галерею варианта
  const handleUploadVariantGallery = async (files: File[], id: number | string) => {
    try {
      const limited = files.slice(0, 4); // максимум 4
      const urls = await Promise.all(limited.map(f => uploadImage(f, 'products')));
      const prev = Array.isArray(v.gallery_urls) ? v.gallery_urls : [];
      patchVariant(id, { gallery_urls: [...prev, ...urls].slice(0, 4) });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Не удалось загрузить галерею варианта' });
    }
  };

  const removeFromVariantGallery = (idx: number) => {
    const arr = Array.isArray(v.gallery_urls) ? [...v.gallery_urls] : [];
    arr.splice(idx, 1);
    patchVariant(v.id, { gallery_urls: arr });
  };

  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border rounded p-3">
      <div>
        <Label>Название варианта</Label>
        <Input
          value={v.title}
          onChange={(e) => patchVariant(v.id, { title: e.target.value })}
          placeholder="S / XL / 3 / 21"
        />
      </div>

      <div>
        <Label>Цена</Label>
        <Input
          type="number"
          step="0.01"
          value={v.price ?? ''}
          onChange={(e) =>
            patchVariant(v.id, { price: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </div>

      {/* Описание и Состав — раздельно */}
      <div className="md:col-span-2">
        <Label>Описание варианта</Label>
        <Textarea
          rows={3}
          value={v.description ?? ''}
          onChange={(e) => patchVariant(v.id, { description: e.target.value })}
          placeholder="Короткий текст про вариант (не состав)."
        />
      </div>

      <div className="md:col-span-2">
        <Label>Состав (как на сайте, с «шт.» и переносами)</Label>
        <Textarea
          rows={3}
          value={v.composition ?? ''}
          onChange={(e) => patchVariant(v.id, { composition: e.target.value })}
          placeholder={`Роза — 7 шт\nЭвкалипт — 3 шт`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Каждый ингредиент с новой строки. «шт.» можно писать — на витрине мы фиксируем переносы.
        </p>
      </div>

      {/* Фото варианта */}
      <div>
        <Label>Фото варианта (основное)</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUploadVariantImage(e.target.files[0], v.id)}
        />
        {v.image_url && (
          <img src={v.image_url} className="mt-2 w-24 h-24 object-cover rounded" alt="variant" />
        )}
      </div>

      {/* Галерея варианта */}
      <div>
        <Label>Галерея варианта (до 4 изображений)</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleUploadVariantGallery(files, v.id);
          }}
        />
        {Array.isArray(v.gallery_urls) && v.gallery_urls.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {v.gallery_urls.map((url, idx) => (
              <div key={url + idx} className="relative">
                <img src={url} className="w-16 h-16 object-cover rounded" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={() => removeFromVariantGallery(idx)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={v.is_active}
          onCheckedChange={(val) => patchVariant(v.id, { is_active: !!val })}
          id={`variant_active_${v.id}`}
        />
        <Label htmlFor={`variant_active_${v.id}`}>Активен</Label>
      </div>
    </div>
  );
})()}

      </div>

      {/* Общее изображение товара (fallback если у варианта нет своего) */}
      <div>
        <Label htmlFor="vp_image">Общее изображение</Label>
        <Input id="vp_image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        {formData.image_url && (
          <div className="mt-2">
            <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
            <p className="text-sm text-muted-foreground mt-1">Текущее общее изображение товара</p>
          </div>
        )}
      </div>

      {/* Дополнительные фото — пойдут в самый конец галереи на витрине */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="vp_extra1">Доп. фото #1 (конец галереи)</Label>
    <Input
      id="vp_extra1"
      type="file"
      accept="image/*"
      onChange={(e) => setExtra1File(e.target.files?.[0] || null)}
    />
    {(formData.extra_image_1_url) && (
      <div className="mt-2">
        <img src={formData.extra_image_1_url} alt="extra1" className="w-20 h-20 object-cover rounded" />
        <Button
          type="button"
          variant="ghost"
          className="mt-1 px-2 py-1 h-7"
          onClick={() => setFormData((s) => ({ ...s, extra_image_1_url: '' }))}
        >
          Очистить текущее
        </Button>
      </div>
    )}
  </div>

  <div>
    <Label htmlFor="vp_extra2">Доп. фото #2 (конец галереи)</Label>
    <Input
      id="vp_extra2"
      type="file"
      accept="image/*"
      onChange={(e) => setExtra2File(e.target.files?.[0] || null)}
    />
    {(formData.extra_image_2_url) && (
      <div className="mt-2">
        <img src={formData.extra_image_2_url} alt="extra2" className="w-20 h-20 object-cover rounded" />
        <Button
          type="button"
          variant="ghost"
          className="mt-1 px-2 py-1 h-7"
          onClick={() => setFormData((s) => ({ ...s, extra_image_2_url: '' }))}
        >
          Очистить текущее
        </Button>
      </div>
    )}
  </div>
</div>

      {/* Статусы и сортировка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: !!v })}
            id="vp_active"
          />
          <Label htmlFor="vp_active">Активен</Label>
        </div>
        <div>
          <Label htmlFor="vp_sort_order">Порядок сортировки</Label>
          <Input id="vp_sort_order" type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {product ? 'Обновить' : 'Создать'} товар с вариантами
      </Button>
    </form>
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
    <div ref={scrollRef} className="min-h-screen bg-background overflow-auto">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="products">Товары</TabsTrigger>
            <TabsTrigger value="variant-products">Товары с вариантами</TabsTrigger>
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
    <Dialog
      open={isDialogOpen && activeTab === 'products'}
      onOpenChange={(open) => {
        if (open) captureScroll();         // ⬅️ запомнили позицию скролла
        setIsDialogOpen(open);
        if (!open) {
          requestAnimationFrame(() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
          });
          restoreScroll();                 // ⬅️ вернули позицию при закрытии
        } else {
          restoreScroll();                 // ⬅️ и на открытии тоже принудительно
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
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
    <>
      {/* ▼▼▼ ЕДИНЫЙ СПИСОК: обычные + вариантные ▼▼▼ */}
      <DndContext
        sensors={dndDisabled ? [] : sensors}
        onDragEnd={handleUnifiedDragEnd}
      >
        <SortableContext
  items={combinedItems.map((p: any) => `${p._kind}:${p.id}`)}
  strategy={verticalListSortingStrategy}
>
          <div className="grid gap-4">
            {combinedItems.map((product: any) => (
              <SortableProductCard
  key={`${product._kind}:${product.id}`}
  id={`${product._kind}:${product.id}`}
  disabled={dndDisabled}
>
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
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>

                        {/* бейджи */}
                        <div className="flex items-center space-x-2 mt-1">
                          {/* для обычных товаров остаётся "Рекомендуемый" */}
                          {product._kind === "product" && product.is_featured && (
                            <Badge variant="default">
                              <Star className="w-3 h-3 mr-1" />
                              Рекомендуемый
                            </Badge>
                          )}

                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {product.is_active ? "Активен" : "Неактивен"}
                          </Badge>

                          <Badge variant={product._kind === "variant" ? "default" : "outline"}>
                            {product._kind === "variant" ? "С вариантами" : "Обычный"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog
                        onOpenChange={(open) => {
                          if (!open) {
                            requestAnimationFrame(() => {
                              (document.activeElement as HTMLElement | null)?.blur?.();
                            });
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setEditingItem(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent
                          className="max-w-3xl max-h-[90vh] overflow-hidden"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DialogHeader>
                            <DialogTitle>
                              {product._kind === "variant"
                                ? "Редактировать товар с вариантами"
                                : "Редактировать товар"}
                            </DialogTitle>
                          </DialogHeader>

                          {product._kind === "variant" ? (
                            <VariantProductForm product={product} />
                          ) : (
                            <ProductForm product={product} />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          product._kind === "variant"
                            ? deleteVariantProduct.mutate(product.id)
                            : deleteProduct.mutate(product.id)
                        }
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
      {/* ▲▲▲ КОНЕЦ единого списка ▲▲▲ */}
    </>
  )}
          </TabsContent>

          {/* ▼▼▼ ВКЛАДКА: Товары с вариантами ▼▼▼ */}
<TabsContent value="variant-products" className="space-y-4">
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-semibold">Товары с вариантами</h2>

    <Dialog
      open={isDialogOpen && activeTab === 'variant-products'}
      onOpenChange={(open) => {
        if (open) captureScroll();
        setIsDialogOpen(open);
        if (!open) {
          requestAnimationFrame(() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
          });
          restoreScroll();
        } else {
          restoreScroll();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </DialogTrigger>
      <DialogContent
  className="max-w-3xl max-h-[90vh] overflow-y-auto"
  onOpenAutoFocus={(e) => e.preventDefault()}
  onCloseAutoFocus={(e) => e.preventDefault()}
>
  <DialogHeader>
    <DialogTitle>
      {editingItem ? 'Редактировать' : 'Создать'} товар с вариантами
    </DialogTitle>
  </DialogHeader>

  <VariantProductForm product={editingItem} />
</DialogContent>
    </Dialog>
  </div>

  {variantProductsLoading ? (
    <p>Загрузка...</p>
  ) : (
    <DndContext
      sensors={dndDisabled ? [] : sensors}
      onDragEnd={handleVariantDragEnd}
    >
      <SortableContext
        items={orderedVariantProducts.map((p) => String(p.id))}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-4">
          {orderedVariantProducts.map((product) => (
            <SortableProductCard
              key={product.id}
              id={String(product.id)}
              disabled={dndDisabled}
            >
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
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                          {product.is_active ? "Активен" : "Неактивен"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Dialog
                      onOpenChange={(open) => {
                        if (!open) {
                          requestAnimationFrame(() => {
                            (document.activeElement as HTMLElement | null)?.blur?.();
                          });
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setEditingItem(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent
  className="max-w-3xl max-h-[90vh] overflow-y-auto"
  onOpenAutoFocus={(e) => e.preventDefault()}
  onCloseAutoFocus={(e) => e.preventDefault()}
>
  <DialogHeader>
    <DialogTitle>Редактировать товар</DialogTitle>
  </DialogHeader>
  <VariantProductForm product={product} />
</DialogContent>
                    </Dialog>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => deleteVariantProduct.mutate(product.id)}
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
{/* ▲▲▲ КОНЕЦ: вкладка "Товары с вариантами" ▲▲▲ */}


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
