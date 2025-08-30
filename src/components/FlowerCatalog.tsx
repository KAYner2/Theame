import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

import { FlowerCard } from './FlowerCard';
import { Flower } from '../types/flower';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';

import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

import { useAllProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import type { Product } from '@/types/database';

/* ---------------- helpers: нормализация/дедуп ---------------- */

const splitItems = (arr?: string[]) =>
  (arr || []).map((s) => (s || '').trim()).filter(Boolean);

const capitalizeFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Нормализуем возможные «Розы 3шт», «x5», «( )», точки и т.п. */
const normalizeFlower = (raw: string) =>
  capitalizeFirst(
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

/** Приводим массив к Set по кейсу (регистронезависимо) и возвращаем в красивом виде */
const uniqueNormalized = (values: string[]) => {
  const map = new Map<string, string>();
  for (const v of values) {
    const norm = normalizeFlower(v);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (!map.has(key)) map.set(key, norm);
  }
  return Array.from(map.values());
};

function toFlower(product: Product): Flower {
  return {
    id: product.id,
    name: product.name,
    price: product.price || 0,
    image: product.image_url || '/placeholder.svg',
    description: product.description || '',
    category: product.category?.name || 'Разное',
    inStock: Boolean(product.is_active),
    quantity: 1,
    colors: product.colors || [],
    size: 'medium',
    occasion: [],

    // 🔥 добавляем эти поля для ЧПУ
    slug: product.slug ?? null,
    categorySlug: product.category?.slug ?? null,
  };
}

/** Получить [min,max] цен по набору букетов */
function getPriceBounds(flowers: Flower[]): [number, number] {
  if (!flowers.length) return [0, 10000];
  const prices = flowers.map((f) => f.price ?? 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return [min, Math.max(max, min)];
}

/* ---------------- основной компонент каталога ---------------- */

export const FlowerCatalog = () => {
  // URL-параметры: ?category=<slug> ИЛИ ?category=<id>
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';

  // Состояния фильтров/сортировки
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedComposition, setSelectedComposition] = useState('all');

  // Диапазон цен (инициализируем после загрузки данных)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // popularity | price-asc | price-desc | name | newest
  const [sortBy, setSortBy] =
    useState<'popularity' | 'price-asc' | 'price-desc' | 'name' | 'newest'>('popularity');

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Данные
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useAllProducts();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Подхват категории из URL (slug ИЛИ id) → выставляем selectedCategoryId (id)
  useEffect(() => {
    if (!categories.length) return;

    if (!categoryParam) {
      setSelectedCategoryId('all');
      return;
    }

    const isNumeric = /^\d+$/.test(categoryParam);
    const found = isNumeric
      ? categories.find((c) => String(c.id) === categoryParam)
      : categories.find((c) => slugify(c.name) === categoryParam);

    if (found) {
      setSelectedCategoryId(String(found.id));
    } else {
      setSelectedCategoryId('all');
      setSearchParams((prev) => {
        prev.delete('category');
        return prev;
      });
    }
  }, [categoryParam, categories, setSearchParams]);

  // Преобразуем продукты → цветы (для карточек)
  const flowers = useMemo<Flower[]>(() => products.map(toFlower), [products]);

  // Формируем справочники: цвета / составы (оба — уникальные и нормализованные)
  const availableColors = useMemo(() => {
    const all = flowers.flatMap((f) => f.colors ?? []);
    return uniqueNormalized(all).sort((a, b) => a.localeCompare(b));
  }, [flowers]);

  const availableCompositions = useMemo(() => {
    const all = products.flatMap((p) => (p.composition ?? []) as string[]);
    return uniqueNormalized(all).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Инициализация диапазона цен по данным
  const absolutePriceBounds = useMemo(() => getPriceBounds(flowers), [flowers]);

  useEffect(() => {
    setPriceRange(absolutePriceBounds);
  }, [absolutePriceBounds[0], absolutePriceBounds[1]]);

  // Фильтрация и сортировка
  const filteredFlowers = useMemo(() => {
    // Для доступа к сырому продукту по id
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(String(p.id), p));

    const [minPrice, maxPrice] = priceRange;

    const filtered = flowers.filter((flower) => {
      const prod = productMap.get(String(flower.id));

      // 1) Категория
      const catIds = Array.isArray(prod?.category_ids) ? prod!.category_ids.map(String) : [];
      if (!(selectedCategoryId === 'all' || catIds.includes(String(selectedCategoryId)))) {
        return false;
      }

      // 2) Цвет (точное сравнение, регистронезависимо)
      if (selectedColor !== 'all') {
        const fColors = flower.colors ?? [];
        const ok = fColors.some((c) => c.toLowerCase() === selectedColor.toLowerCase());
        if (!ok) return false;
      }

      // 3) Состав (точное сравнение, регистронезависимо)
      if (selectedComposition !== 'all') {
        const pComp = uniqueNormalized(splitItems(prod?.composition as any));
        const ok = pComp.some((c) => c.toLowerCase() === selectedComposition.toLowerCase());
        if (!ok) return false;
      }

      // 4) Цена
      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;

      return true;
    });

    // Сортировка
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest': {
        filtered.sort((a, b) => {
          const A = products.find((p) => String(p.id) === String(a.id))?.sort_order ?? 0;
          const B = products.find((p) => String(p.id) === String(b.id))?.sort_order ?? 0;
          return B - A;
        });
        break;
      }
      case 'popularity':
      default: {
        filtered.sort((a, b) => {
          const A = products.find((p) => String(p.id) === String(a.id))?.sort_order ?? 0;
          const B = products.find((p) => String(p.id) === String(b.id))?.sort_order ?? 0;
          return A - B;
        });
        break;
      }
    }

    return filtered;
  }, [flowers, products, selectedCategoryId, selectedColor, selectedComposition, priceRange, sortBy]);

  // Избранное (заглушка)
  const handleToggleFavorite = (flower: Flower) => {
    console.log('Добавлено в избранное:', flower.name);
  };

  // Состояния загрузки/ошибок
  if (productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
          <p className="text-lg text-muted-foreground">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
          <p className="text-destructive">Ошибка загрузки каталога</p>
        </div>
      </div>
    );
  }

  // Рендер
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          Каталог цветов и букетов
        </h1>
      </div>

      {/* Фильтры и сортировка */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Кнопка "Фильтры" */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              КАТЕГОРИИ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
  className="w-[18rem] p-3 sm:w-80 sm:p-4"
  align="start"
>
            {/* Категории */}
            <div className="space-y-3">
              <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                Категория
              </DropdownMenuLabel>
              <Select
                value={selectedCategoryId}
                onValueChange={(id) => {
                  setSelectedCategoryId(id as any);

                  // Обновляем URL: ?category=<slug> или убираем параметр, если "all"
                  if (id === 'all') {
                    setSearchParams((prev) => {
                      prev.delete('category');
                      return prev;
                    });
                  } else {
                    const cat = categories.find((c) => String(c.id) === id);
                    if (cat) {
                      setSearchParams((prev) => {
                        prev.set('category', slugify(cat.name));
                        return prev;
                      });
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenuSeparator className="my-4" />

            {/* Цветы в составе */}
            {availableCompositions.length > 0 && (
              <div className="space-y-3">
                <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                  Цветы в составе
                </DropdownMenuLabel>
                <Select
                  value={selectedComposition}
                  onValueChange={setSelectedComposition}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цветы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все цветы</SelectItem>
                    {availableCompositions.map((comp) => (
                      <SelectItem key={comp} value={comp}>
                        {comp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DropdownMenuSeparator className="my-4" />

            {/* Цвета */}
            {availableColors.length > 0 && (
              <div className="space-y-3">
                <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                  Цвета
                </DropdownMenuLabel>
                <Select
                  value={selectedColor}
                  onValueChange={setSelectedColor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все цвета</SelectItem>
                    {availableColors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DropdownMenuSeparator className="my-4" />

            {/* Цена */}
            <div className="space-y-3">
              <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                Цена: {priceRange[0]} — {priceRange[1]} ₽
              </DropdownMenuLabel>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                  min={absolutePriceBounds[0]}
                  max={absolutePriceBounds[1]}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>

            {/* Кнопки управления */}
<div className="border-t pt-3 sm:pt-4">
  <div className="flex gap-2 sm:gap-3">
    <Button
      variant="default"
      size="sm"
      className="flex-1 h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm transition-all duration-200"
      onClick={() => setDropdownOpen(false)}
    >
      Применить
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="flex-1 h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
      onClick={() => {
        setSelectedCategoryId('all');
        setSelectedColor('all');
        setSelectedComposition('all');
        setPriceRange(absolutePriceBounds);
        setSearchParams((prev) => {
          prev.delete('category');
          return prev;
        });
      }}
    >
      Сбросить
    </Button>
  </div>
</div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Сортировка */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="min-w-[180px] w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">По популярности</SelectItem>
            <SelectItem value="price-asc">По возрастанию цены</SelectItem>
            <SelectItem value="price-desc">По убыванию цены</SelectItem>
            <SelectItem value="name">По названию</SelectItem>
            <SelectItem value="newest">По новизне</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Статистика */}
      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>Найдено: {filteredFlowers.length} из {flowers.length}</div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            В наличии: {flowers.filter((f) => f.inStock).length}
          </Badge>
          <Badge variant="outline">
            Нет в наличии: {flowers.filter((f) => !f.inStock).length}
          </Badge>
        </div>
      </div>

      {/* Каталог */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 lg:gap-6">
        {filteredFlowers.map((flower) => (
          <FlowerCard
            key={flower.id}
            flower={flower}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Пустой результат */}
      {filteredFlowers.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Цветы не найдены</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategoryId('all');
              setSelectedColor('all');
              setSelectedComposition('all');
              setPriceRange(absolutePriceBounds);
              setSortBy('popularity');
              setSearchParams((prev) => {
                prev.delete('category');
                return prev;
              });
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
};
