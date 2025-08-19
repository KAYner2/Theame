import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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

// -------------------------------------------------------------
// Вспомогательные функции
// -------------------------------------------------------------

/** Безопасное преобразование Product → Flower */
function toFlower(product: Product): Flower {
  return {
    id: product.id,
    name: product.name,
    price: product.price || 0,
    image: product.image_url || '/placeholder.svg',
    description: product.description || '',
    category: (product as any).category?.name || 'Разное',
    inStock: Boolean(product.is_active ?? true),
    quantity: 1,
    colors: product.colors || [],
    size: 'medium',
    occasion: [],
    // Прочее можно добавить по мере необходимости
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

// -------------------------------------------------------------
// Основной компонент каталога
// -------------------------------------------------------------

export const FlowerCatalog = () => {
  // URL-параметры (теперь ?category=<categoryId>)
const [searchParams] = useSearchParams();
const categoryIdFromUrl = searchParams.get('category');

  // Состояния фильтров/сортировки
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedComposition, setSelectedComposition] = useState('all');

  // Диапазон цен (инициализируем после загрузки данных)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // popularity | price-asc | price-desc | name | newest
  const [sortBy, setSortBy] = useState<'popularity' | 'price-asc' | 'price-desc' | 'name' | 'newest'>('popularity');

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Данные (ИСПОЛЬЗУЕМ useAllProducts)
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

  // -----------------------------------------------------------
  // Подхват категории из URL, плавный скролл при загрузке
  // -----------------------------------------------------------
  useEffect(() => {
  if (categoryIdFromUrl && categories.length > 0) {
    const exists = categories.some((c) => String(c.id) === String(categoryIdFromUrl));
    if (exists) setSelectedCategoryId(categoryIdFromUrl);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [categoryIdFromUrl, categories]);

  // Сброс category параметра из URL если пользователь вручную сменил категорию
  useEffect(() => {
  if (
    categoryIdFromUrl &&
    selectedCategoryId !== categoryIdFromUrl &&
    selectedCategoryId !== 'all'
  ) {
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.replaceState({}, '', url.pathname);
  }
}, [selectedCategoryId, categoryIdFromUrl]);

  // -----------------------------------------------------------
  // Преобразуем продукты → цветы (для карточек)
  // -----------------------------------------------------------
  const flowers = useMemo<Flower[]>(() => products.map(toFlower), [products]);

  // -----------------------------------------------------------
  // Формируем справочники: цвета / составы
  // -----------------------------------------------------------
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    flowers.forEach((f) => (f.colors ?? []).forEach((c) => colors.add(c)));
    return Array.from(colors).sort((a, b) => a.localeCompare(b));
  }, [flowers]);

  const availableCompositions = useMemo(() => {
    const comps = new Set<string>();
    products.forEach((p) => (p.composition ?? []).forEach((c) => comps.add(c)));
    return Array.from(comps).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // -----------------------------------------------------------
  // Инициализация диапазона цен по данным
  // -----------------------------------------------------------
  const absolutePriceBounds = useMemo(() => getPriceBounds(flowers), [flowers]);

  useEffect(() => {
    setPriceRange(absolutePriceBounds);
  }, [absolutePriceBounds[0], absolutePriceBounds[1]]);

  // -----------------------------------------------------------
  // Фильтрация и сортировка
  // -----------------------------------------------------------
  const filteredFlowers = useMemo(() => {
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    const [minPrice, maxPrice] = priceRange;

    const filtered = flowers.filter((flower) => {
      // 1) Категория ('all' пропускает всё)
      const matchesCategory =
  selectedCategoryId === 'all' ||
  String(productMap.get(flower.id)?.category_id ?? '') === String(selectedCategoryId);
      if (!matchesCategory) return false;

      // 2) Цвет ('all' пропускает всё; пустой список цветов не режем)
      const fColors = flower.colors ?? [];
      const matchesColor =
        selectedColor === 'all' ||
        fColors.length === 0 ||
        fColors.some((c) => c.toLowerCase().includes(selectedColor.toLowerCase()));
      if (!matchesColor) return false;

      // 3) Состав ('all' пропускает всё; пустой состав не режем)
      const p = productMap.get(flower.id);
      const pComp = p?.composition ?? [];
      const matchesComposition =
        selectedComposition === 'all' ||
        pComp.length === 0 ||
        pComp.some((comp) => comp.toLowerCase().includes(selectedComposition.toLowerCase()));
      if (!matchesComposition) return false;

      // 4) Цена (включительно)
      const price = flower.price ?? 0;
      const matchesPrice = price >= minPrice && price <= maxPrice;
      if (!matchesPrice) return false;

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
        // Интерпретируем "новизну" как больший sort_order (сверху)
        filtered.sort((a, b) => {
          const A = productMap.get(a.id)?.sort_order ?? 0;
          const B = productMap.get(b.id)?.sort_order ?? 0;
          return B - A; // по убыванию sort_order
        });
        break;
      }
      case 'popularity':
      default: {
        // По умолчанию показываем как на витрине — по sort_order (меньший индекс выше)
        filtered.sort((a, b) => {
          const A = productMap.get(a.id)?.sort_order ?? 0;
          const B = productMap.get(b.id)?.sort_order ?? 0;
          return A - B; // по возрастанию sort_order
        });
        break;
      }
    }

    return filtered;
  }, [
    flowers,
    products,
    selectedCategoryId,
    selectedColor,
    selectedComposition,
    priceRange,
    sortBy,
  ]);

  // -----------------------------------------------------------
  // Избранное (заглушка)
  // -----------------------------------------------------------
  const handleToggleFavorite = (flower: Flower) => {
    console.log('Добавлено в избранное:', flower.name);
  };

  // -----------------------------------------------------------
  // Состояния загрузки/ошибок
  // -----------------------------------------------------------
  if (productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Каталог цветов и букетов
          </h1>
          <p className="text-lg text-muted-foreground">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Каталог цветов и букетов
          </h1>
          <p className="text-destructive">Ошибка загрузки каталога</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // Рендер
  // -----------------------------------------------------------
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
          <DropdownMenuContent className="w-80 p-4" align="start">
            {/* Категории */}
            <div className="space-y-3">
              <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
                Категория
              </DropdownMenuLabel>
              <Select
  value={selectedCategoryId}
  onValueChange={(v) => setSelectedCategoryId(v as any)}
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
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 transition-all duration-200"
                  onClick={() => setDropdownOpen(false)}
                >
                  Применить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSelectedColor('all');
                    setSelectedComposition('all');
                    setPriceRange(absolutePriceBounds);
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
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  );
};
