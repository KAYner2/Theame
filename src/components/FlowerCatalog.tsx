import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

import { FlowerCard } from './FlowerCard';
import { Flower } from '../types/flower';

import { Button } from './ui/button';
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
  DropdownMenuLabel,
} from './ui/dropdown-menu';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from './ui/sheet';

import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

import { useAllProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import type { Product } from '@/types/database';

// Вариантные
import { useVariantProductsForCatalog } from '@/hooks/useVariantProductsForCatalog';
import { VariantFlowerCard } from '@/components/VariantFlowerCard';
import type { VariantCatalogItem } from '@/hooks/useVariantProductsForCatalog';

/* ---------------- helpers ---------------- */

const splitItems = (arr?: string[]) =>
  (arr || []).map((s) => (s || '').trim()).filter(Boolean);

const capitalizeFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Нормализуем «Розы 3шт», «x5», «( )», точки и т.п. */
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
    slug: product.slug ?? null,
    categorySlug: product.category?.slug ?? null,
  };
}

function getPriceBounds(flowers: Flower[], variantItems: VariantCatalogItem[]): [number, number] {
  const pricesNormal = flowers.map((f) => f.price ?? 0);
  const pricesVariant = variantItems.map((v) => v.min_price_cache ?? 0);
  const all = [...pricesNormal, ...pricesVariant];
  if (!all.length) return [0, 10000];
  const min = Math.min(...all);
  const max = Math.max(...all);
  return [min, Math.max(max, min)];
}

/* ---------------- основной компонент ---------------- */

export const FlowerCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedComposition, setSelectedComposition] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // сортировка
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // UI state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

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

  // вариантные (фильтрация по категории)
  const selectedCategoryUuid = selectedCategoryId === 'all' ? null : String(selectedCategoryId);
  const {
    data: variantItems = [],
    isLoading: variantLoading,
    error: variantError,
  } = useVariantProductsForCatalog({ categoryId: selectedCategoryUuid });

  // синк категории из query
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

  const flowers = useMemo<Flower[]>(() => products.map(toFlower), [products]);

  const availableColors = useMemo(() => {
    const all = flowers.flatMap((f) => f.colors ?? []);
    return uniqueNormalized(all).sort((a, b) => a.localeCompare(b));
  }, [flowers]);

  const availableCompositions = useMemo(() => {
    const all = products.flatMap((p) => (p.composition ?? []) as string[]);
    return uniqueNormalized(all).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // границы цен по объединённому набору
  const absolutePriceBounds = useMemo(
    () => getPriceBounds(flowers, variantItems),
    [flowers, variantItems]
  );

  useEffect(() => {
    setPriceRange(absolutePriceBounds);
  }, [absolutePriceBounds[0], absolutePriceBounds[1]]);

  // фильтрация обычных товаров
  const filteredFlowers = useMemo(() => {
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(String(p.id), p));

    const [minPrice, maxPrice] = priceRange;

    const filtered = flowers.filter((flower) => {
      const prod = productMap.get(String(flower.id));

      const catIds = Array.isArray(prod?.category_ids) ? prod!.category_ids.map(String) : [];
      if (!(selectedCategoryId === 'all' || catIds.includes(String(selectedCategoryId)))) {
        return false;
      }

      if (selectedColor !== 'all') {
        const fColors = flower.colors ?? [];
        const ok = fColors.some((c) => c.toLowerCase() === selectedColor.toLowerCase());
        if (!ok) return false;
      }

      if (selectedComposition !== 'all') {
        const pComp = uniqueNormalized(splitItems(prod?.composition as any));
        const ok = pComp.some((c) => c.toLowerCase() === selectedComposition.toLowerCase());
        if (!ok) return false;
      }

      const price = flower.price ?? 0;
      if (!(price >= minPrice && price <= maxPrice)) return false;

      return true;
    });

    // локальная сортировка обычных (для консистентности; итоговая ниже всё равно объединит)
    switch (sortBy) {
      case 'price-desc':
        filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'default':
      default:
        filtered.sort((a, b) => {
          const pa = products.find((p) => p.id === a.id);
          const pb = products.find((p) => p.id === b.id);
          return (pa?.sort_order ?? 0) - (pb?.sort_order ?? 0);
        });
        break;
    }

    return filtered;
  }, [flowers, products, selectedCategoryId, selectedColor, selectedComposition, priceRange, sortBy]);

  // фильтрация вариантных (если включены цвет/состав — временно скрываем)
  const filteredVariantItems = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;
    const extraFiltersOn = selectedColor !== 'all' || selectedComposition !== 'all';
    if (extraFiltersOn) return [] as VariantCatalogItem[];

    const items = variantItems.filter((v) => {
      const price = v.min_price_cache ?? 0;
      return price >= minPrice && price <= maxPrice;
    });

    // локально по цене, default порядок — как пришёл с бэка
    if (sortBy === 'price-asc') {
      items.sort((a, b) => (a.min_price_cache ?? 0) - (b.min_price_cache ?? 0));
    }
    if (sortBy === 'price-desc') {
      items.sort((a, b) => (b.min_price_cache ?? 0) - (a.min_price_cache ?? 0));
    }

    return items;
  }, [variantItems, priceRange, selectedColor, selectedComposition, sortBy]);

  const handleToggleFavorite = (flower: Flower) => {
    console.log('Добавлено в избранное:', flower.name);
  };

  /* ---------------- загрузка/ошибка ---------------- */

  if (productsLoading || categoriesLoading || variantLoading) {
    return (
      <div className="container px-6 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
          <p className="text-lg text-muted-foreground">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (productsError || categoriesError || variantError) {
    return (
      <div className="container px-6 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
          <p className="text-destructive">Ошибка загрузки каталога</p>
        </div>
      </div>
    );
  }

  /* ------- фильтры ------- */
  const FiltersInner = (
    <div className="space-y-4">
      {/* Категория */}
      <div className="space-y-2">
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
          Категория
        </DropdownMenuLabel>
        <Select
          value={selectedCategoryId}
          onValueChange={(id) => {
            setSelectedCategoryId(id as any);
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

      {/* Цветы в составе */}
      {availableCompositions.length > 0 && (
        <div className="space-y-2">
          <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
            Цветы в составе
          </DropdownMenuLabel>
          <Select value={selectedComposition} onValueChange={setSelectedComposition}>
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

      {/* Цена */}
      <div className="space-y-2">
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
    </div>
  );

  /* ---------------- ОБЪЕДИНЁННАЯ СОРТИРОВКА ----------------
     В default используем для обычных sort_order из products,
     для вариантных — их текущий индекс (они уже приходят отсортированными). */

  const productsById = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [products]);

  const gridItems = useMemo(() => {
    const simple = filteredFlowers.map((f) => ({
      type: 'simple' as const,
      item: f,
      sort: productsById.get(String(f.id))?.sort_order ?? 0,
      price: f.price ?? 0,
    }));

    const variant = filteredVariantItems.map((v, idx) => ({
      type: 'variant' as const,
      item: v,
      sort: idx,                         // <-- вместо v.sort_order
      price: v.min_price_cache ?? 0,
    }));

    const all = [...simple, ...variant];

    if (sortBy === 'price-asc') {
      all.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      all.sort((a, b) => b.price - a.price);
    } else {
      all.sort((a, b) => a.sort - b.sort);
    }

    return all.map(({ type, item }) => ({ type, item }));
  }, [filteredFlowers, filteredVariantItems, productsById, sortBy]);

  /* ---------------- разметка ---------------- */

  return (
    <div className="container px-6 py-8">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          Каталог цветов и букетов
        </h1>
      </div>

      {/* Фильтры и сортировка */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* ---- MOBILE: Sheet ---- */}
        <div className="md:hidden">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                ФИЛЬТРЫ
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="!p-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-xl"
            >
              <SheetHeader className="px-4 pt-4 pb-2 border-b">
                <SheetTitle className="text-base">Фильтры</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-4">{FiltersInner}</div>

              <SheetFooter
                className="border-t bg-background px-4 py-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
              >
                <div className="flex w-full gap-2">
                  <Button className="flex-1 h-11" onClick={() => setMobileSheetOpen(false)}>
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
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
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* ---- DESKTOP: DropdownMenu ---- */}
        <div className="hidden md:block">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                ФИЛЬТРЫ
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-[22rem] p-0 max-h-[85dvh] flex flex-col" align="start">
              <div className="flex-1 overflow-auto p-4">{FiltersInner}</div>

              <div
                className="border-t bg-popover px-4 py-4"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
              >
                <div className="flex gap-3">
                  <Button variant="default" className="flex-1 h-10" onClick={() => setDropdownOpen(false)}>
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10"
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
        </div>

        {/* Сортировка */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="min-w-[220px] w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">По умолчанию</SelectItem>
            <SelectItem value="price-asc">По возрастанию цены</SelectItem>
            <SelectItem value="price-desc">По убыванию цены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Сетка каталога */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {gridItems.map(({ type, item }) =>
          type === 'simple' ? (
            <FlowerCard key={`p:${(item as Flower).id}`} flower={item as Flower} onToggleFavorite={handleToggleFavorite} />
          ) : (
            <VariantFlowerCard
              key={`v:${(item as VariantCatalogItem).id}`}
              product={{
                id: (item as VariantCatalogItem).id,
                name: (item as VariantCatalogItem).name,
                slug: (item as VariantCatalogItem).slug,
                image_url: (item as VariantCatalogItem).image_url,
                min_price_cache: (item as VariantCatalogItem).min_price_cache,
                is_active: (item as VariantCatalogItem).is_active,
              }}
              // useCatalogUrl // включи, если нужен URL вида /catalog/:slug
            />
          )
        )}
      </div>

      {/* Пусто */}
      {gridItems.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Товары не найдены</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategoryId('all');
              setSelectedColor('all');
              setSelectedComposition('all');
              setPriceRange(absolutePriceBounds);
              setSortBy('default');
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
