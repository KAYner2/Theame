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

// вариантные товары (для каталога) + карточка
import { useVariantProductsForCatalog } from '@/hooks/useVariantProductsForCatalog';
import { VariantFlowerCard } from '@/components/VariantFlowerCard';
import type { VariantCatalogItem } from '@/hooks/useVariantProductsForCatalog';

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

/* ---------------- основной компонент каталога ---------------- */

export const FlowerCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedComposition, setSelectedComposition] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // сортировка: 'default' (по sort_order/created_at) и две по цене
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // desktop-dropdown / mobile-sheet
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

  // вариантные товары (фильтруем по категории, если выбрана)
  const selectedCategoryUuid = selectedCategoryId === 'all' ? null : String(selectedCategoryId);
  const {
    data: variantItems = [],
    isLoading: variantLoading,
    error: variantError,
  } = useVariantProductsForCatalog({ categoryId: selectedCategoryUuid });

  // синк параметра категории из URL с локальным состоянием
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

  // границы цен по ОБЪЕДИНЁННОМУ набору
  const absolutePriceBounds = useMemo(
    () => getPriceBounds(flowers, variantItems),
    [flowers, variantItems]
  );

  useEffect(() => {
    setPriceRange(absolutePriceBounds);
  }, [absolutePriceBounds[0], absolutePriceBounds[1]]);

  // индекс Product по id
  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [products]);

  // ФИЛЬТРАЦИЯ обычных (сортировать будем позже — в общем массиве)
  const filteredFlowers = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

    return flowers.filter((flower) => {
      const prod = productById.get(String(flower.id));

      // категории (many-to-many через category_ids)
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
  }, [flowers, productById, selectedCategoryId, selectedColor, selectedComposition, priceRange]);

  // ФИЛЬТРАЦИЯ вариантных (сортировать будем позже)
  const filteredVariantItems = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

    // если включены «цвет/состав», пока скрываем вариантные до появления атрибутов
    const extraFiltersOn = selectedColor !== 'all' || selectedComposition !== 'all';
    if (extraFiltersOn) return [] as VariantCatalogItem[];

    return variantItems.filter((v) => {
      const price = v.min_price_cache ?? 0;
      return price >= minPrice && price <= maxPrice;
    });
  }, [variantItems, priceRange, selectedColor, selectedComposition]);

  /* ---------- ЕДИНЫЙ СПИСОК + ОБЩАЯ СОРТИРОВКА ---------- */

  type CatalogUnion =
    | {
        kind: 'simple';
        id: string;
        name: string;
        price: number | null;
        sortOrder: number;
        createdAt: number;
        data: Flower;
      }
    | {
        kind: 'variant';
        id: number;
        name: string;
        price: number | null; // min_price_cache
        sortOrder: number;
        createdAt: number;
        data: VariantCatalogItem;
      };

  const toTS = (d?: string | null) => (d ? new Date(d).getTime() : 0);
  const BIG = 1e9;

  const combined = useMemo<CatalogUnion[]>(() => {
    const normals: CatalogUnion[] = filteredFlowers.map((f) => {
      const p = productById.get(String(f.id));
      return {
        kind: 'simple',
        id: String(f.id),
        name: f.name,
        price: typeof f.price === 'number' ? f.price : null,
        sortOrder: p?.sort_order ?? BIG,
        createdAt: toTS(p?.created_at ?? null),
        data: f,
      };
    });

const variants: CatalogUnion[] = filteredVariantItems.map((vp, idx) => ({
  kind: 'variant',
  id: vp.id,
  name: vp.name,
  price: vp.min_price_cache ?? null,
  // 🔧 нет sort_order в типе VariantCatalogItem → используем индекс как стабильный порядок
  sortOrder: idx,
  createdAt: 0, // в типе VariantCatalogItem тоже нет created_at
  data: vp,
}));

    return [...normals, ...variants];
  }, [filteredFlowers, filteredVariantItems, productById]);

  const byDefault = (a: CatalogUnion, b: CatalogUnion) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt; // новее выше
    return a.name.localeCompare(b.name);
  };

  const byPriceAsc = (a: CatalogUnion, b: CatalogUnion) => {
    const pa = a.price ?? Number.POSITIVE_INFINITY;
    const pb = b.price ?? Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return byDefault(a, b);
  };

  const byPriceDesc = (a: CatalogUnion, b: CatalogUnion) => {
    const pa = a.price ?? Number.NEGATIVE_INFINITY;
    const pb = b.price ?? Number.NEGATIVE_INFINITY;
    if (pa !== pb) return pb - pa;
    return byDefault(a, b);
  };

  const sortedCombined = useMemo(() => {
    const arr = [...combined];
    if (sortBy === 'price-asc') return arr.sort(byPriceAsc);
    if (sortBy === 'price-desc') return arr.sort(byPriceDesc);
    return arr.sort(byDefault);
  }, [combined, sortBy]);

  /* ---------------- общая разметка ---------------- */

  if (productsLoading || categoriesLoading || variantLoading) {
    return (
      <div className="container px-6 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
        </div>
        <p className="text-lg text-muted-foreground text-center">Загрузка каталога...</p>
      </div>
    );
  }

  if (productsError || categoriesError || variantError) {
    return (
      <div className="container px-6 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">Каталог цветов и букетов</h1>
        </div>
        <p className="text-destructive text-center">Ошибка загрузки каталога</p>
      </div>
    );
  }

  /* ------- общий фрагмент с фильтрами ------- */
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

      {/* Цвет */}
      {availableColors.length > 0 && (
        <div className="space-y-2">
          <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
            Цвет
          </DropdownMenuLabel>
          <Select value={selectedColor} onValueChange={setSelectedColor}>
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

        {/* Сортировка — по цене (default остаётся по умолчанию) */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="min-w-[220px] w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-asc">По возрастанию цены</SelectItem>
            <SelectItem value="price-desc">По убыванию цены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Каталог */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {sortedCombined.map((node) =>
          node.kind === 'simple' ? (
            <FlowerCard
              key={`p:${node.id}`}
              flower={node.data}
              onToggleFavorite={(f) => console.log('Добавлено в избранное:', f.name)}
            />
          ) : (
            <VariantFlowerCard
              key={`v:${node.id}`}
              product={{
                id: node.data.id,
                name: node.data.name, // ← имя вариативного товара
                slug: node.data.slug,
                image_url: node.data.image_url,
                min_price_cache: node.data.min_price_cache,
                is_active: node.data.is_active,
              }}
              // useCatalogUrl // включи, если хочешь /catalog/:slug вместо /v/:slug
            />
          )
        )}
      </div>

      {/* Пустой результат */}
      {sortedCombined.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Цветы не найдены</p>
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
