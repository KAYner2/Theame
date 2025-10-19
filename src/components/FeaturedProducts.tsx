// src/components/FeaturedProducts.tsx
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

import { useAllProducts } from '@/hooks/useProducts';
import { useAllVariantProducts } from '@/hooks/useVariantProducts';
import { slugify } from '@/utils/slugify';

const BIG = 1_000_000_000;

type UnifiedItem = {
  _kind: 'product' | 'variant';
  id: string;
  rawId: number | string;
  name: string;
  price: number | null;
  image: string | null;
  slug: string | null;
  categorySlug: string | null;
  sort_order: number | null;
};

export function FeaturedProducts() {
  const [showAll, setShowAll] = useState(false);

  // Обычные товары
  const {
    data: allProducts = [],
    isLoading: pLoading,
    error: pError,
  } = useAllProducts(); // ✅ правильный хук и путь :contentReference[oaicite:0]{index=0}

  // Вариативные товары
  const {
    data: allVariantProducts = [],
    isLoading: vpLoading,
    error: vpError,
  } = useAllVariantProducts(); // ✅ как в админке :contentReference[oaicite:1]{index=1}

  const isLoading = pLoading || vpLoading;
  const error = pError || vpError;

  const homepageItems: UnifiedItem[] = useMemo(() => {
    // 1) Обычные
    const base: UnifiedItem[] = (allProducts || [])
      .filter((p: any) => p?.is_active !== false && p?.show_on_homepage === true)
      .map((p: any) => ({
        _kind: 'product' as const,
        id: `p-${p.id}`,
        rawId: p.id,
        name: p.name,
        price: p.price ?? 0,
        image: p.image_url || '/placeholder.svg',
        slug: p.slug ?? null,
        categorySlug: p.category?.slug ?? null,
        sort_order: typeof p.sort_order === 'number' ? p.sort_order : BIG,
      }));

    // 2) Вариативные
    const variants: UnifiedItem[] = (allVariantProducts || [])
      .filter((v: any) => v?.is_active !== false && v?.show_on_homepage === true)
      .map((v: any) => ({
        _kind: 'variant' as const,
        id: `vp-${v.id}`,
        rawId: v.id,
        name: v.name,
        price: v.min_price_cache ?? 0,
        image: v.image_url || '/placeholder.svg',
        slug: v.slug ?? null,
        // если у вариативных есть category.slug — возьмётся он; иначе можно хранить category_slug на сервере
        categorySlug: v.category?.slug ?? v.category_slug ?? null,
        sort_order: typeof v.sort_order === 'number' ? v.sort_order : BIG,
      }));

    // 3) Итоговый порядок — как в админке: sort_order ASC
    return [...base, ...variants].sort(
      (a, b) => (a.sort_order ?? BIG) - (b.sort_order ?? BIG),
    );
  }, [allProducts, allVariantProducts]);

  const displayed = showAll ? homepageItems : homepageItems.slice(0, 12);

const buildUrl = (item: UnifiedItem) => {
  const nameFallback = slugify(item.name || 'product');
  const prod = item.slug || nameFallback;

  if (item._kind === 'product') {
    const cat = item.categorySlug || '';
    return cat && cat.toLowerCase() !== 'catalog'
      ? `/catalog/${cat}/${prod}`
      : `/catalog/${prod}`;
  }

  // ВАРИАТИВНЫЕ
  if (item.categorySlug) {
    // если хочешь всегда вести через /catalog/:categorySlug/:slug — оставляем так
    return `/catalog/${item.categorySlug}/${prod}`;
  }
  // иначе — ваш маршрут вариативных
  return `/v/${prod}`;
};

  if (isLoading) {
    return (
      <section className="relative isolate py-20 bg-[#fff8ea]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>
          <div className="text-center text-muted-foreground">Загрузка…</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative isolate py-20 bg-[#fff8ea]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>
          <div className="text-center text-red-600">
            Не удалось загрузить товары для главной
          </div>
        </div>
      </section>
    );
  }

  if (!homepageItems.length) return null;

  return (
    <section className="relative isolate py-20 bg-[#fff8ea]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {displayed.map((item) => {
            const to = buildUrl(item);
            const priceText =
              typeof item.price === 'number' && item.price > 0
                ? `${Number(item.price).toLocaleString('ru-RU')} ₽`
                : 'По запросу';

            return (
              <div key={item.id} className="group flex flex-col h-full">
                <Link to={to} aria-label={item.name} className="block flex-1 flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="aspect-square">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="mt-3 px-1">
                    <h3 className="text-[15px] md:text-base font-medium leading-snug line-clamp-2 min-h-[42px] md:min-h-0">
                      {item.name}
                    </h3>
                    <div className="mt-1">
                      <span className="text-base md:text-lg font-semibold">
                        {priceText}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Для вариативных лучше вести на карточку (нужно выбирать вариант) */}
                <div className="px-1 pt-3 mt-auto">
                  <Link to={to}>
                    <Button className="rounded-full px-6 h-10 text-sm md:text-base font-semibold bg-[#819570] hover:bg-[#6f7f5f] text-white">
                      Подробнее
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {!showAll && homepageItems.length > 12 && (
          <div className="text-center mt-12">
            <Button
              onClick={() => setShowAll(true)}
              className="rounded-full px-8 h-11 text-base font-semibold bg-[#819570] hover:bg-[#6f7f5f] text-white shadow"
            >
              Показать ещё
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;
