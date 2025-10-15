// FeaturedProducts.tsx — версия без вариантных товаров, «как раньше»
// Показываем все обычные товары с флажком show_on_homepage

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAllProducts } from '@/hooks/useProducts'; // ⬅️ ВАЖНО: берём все товары
import { useCart } from '@/context/CartContext';
import type { Flower } from '@/types/flower';
import { slugify } from '@/utils/slugify';

const BIG = 1e9;
const toTS = (d?: string | null) => (d ? new Date(d).getTime() : 0);

export function FeaturedProducts() {
  const [showAll, setShowAll] = useState(false);
  const { data: allProducts = [], isLoading, error } = useAllProducts(); // ⬅️ тут
  const { addToCart } = useCart();

  const homepageProducts: Flower[] = useMemo(() => {
    const list = (allProducts || [])
      // только активные и помеченные «Показывать на главной»
      .filter((p: any) => p?.is_active !== false && p?.show_on_homepage === true)
      // общий порядок: sort_order → created_at → name
      .sort((a: any, b: any) => {
        const ao = a?.sort_order ?? BIG;
        const bo = b?.sort_order ?? BIG;
        if (ao !== bo) return ao - bo;
        const ad = toTS(a?.created_at ?? null);
        const bd = toTS(b?.created_at ?? null);
        if (ad !== bd) return bd - ad; // новее выше
        return String(a?.name ?? '').localeCompare(String(b?.name ?? ''));
      })
      // приводим к типу Flower (как в каталоге)
      .map((product: any) => ({
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
      })) as Flower[];

    return list;
  }, [allProducts]);

  if (isLoading) {
    return (
      <section className="relative isolate py-20 bg-[#fff8ea]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка букетов...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative isolate py-20 bg-[#fff8ea]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>
          <div className="text-center">
            <p className="text-destructive">Ошибка загрузки букетов</p>
          </div>
        </div>
      </section>
    );
  }

  // как и раньше: до 12 карточек, далее «Показать ещё»
  const displayedProducts: Flower[] = showAll ? homepageProducts : homepageProducts.slice(0, 12);

  const buildUrl = (p: any) => {
    const cat =
      p.categorySlug ||
      p.category_slug ||
      p.category?.slug ||
      (p.category?.name ? slugify(p.category.name) : '') ||
      '';
    const prod = p.slug || slugify(p.name || 'product');
    return cat && cat.toLowerCase() !== 'catalog'
      ? `/catalog/${cat}/${prod}`
      : `/catalog/${prod}`;
  };

  const handleAddToCart = (product: Flower) => addToCart(product);

  return (
    <section className="relative isolate py-20 bg-[#fff8ea]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>

        {/* 2 на мобиле / 4 на десктопе */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {displayedProducts.map((product) => {
            const to = buildUrl(product);
            const priceText = product.price
              ? `${Number(product.price).toLocaleString('ru-RU')} ₽`
              : 'По запросу';

            return (
              <div key={product.id} className="group flex flex-col h-full">
                <Link to={to} aria-label={product.name} className="block flex-1 flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="aspect-square">
                      <img
                        src={product.image || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="mt-3 px-1">
                    <h3 className="text-[15px] md:text-base font-medium leading-snug line-clamp-2 min-h-[42px] md:min-h-0">
                      {product.name}
                    </h3>
                    <div className="mt-1">
                      <span className="text-base md:text-lg font-semibold">{priceText}</span>
                    </div>
                  </div>
                </Link>

                <div className="px-1 pt-3 mt-auto">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                    className="rounded-full px-6 h-10 text-sm md:text-base font-semibold bg-[#819570] hover:bg-[#6f7f5f] text-white"
                  >
                    В КОРЗИНУ
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {!showAll && homepageProducts.length > 12 && (
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
