import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useHomepageProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import type { Flower } from '@/types/flower';
import { slugify } from '@/utils/slugify';

export function FeaturedProducts() {
  const [showAll, setShowAll] = useState(false);
  const { data: homepageProducts = [], isLoading, error } = useHomepageProducts();
  const { addToCart } = useCart();

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

  const displayedProducts: Flower[] = showAll ? homepageProducts : homepageProducts.slice(0, 12);

  // Красивые ссылки БЕЗ id.
  // Если нормальной категории нет или она равна "catalog", используем короткий путь /catalog/:slug
  const buildUrl = (p: any) => {
    const cat =
      p.categorySlug ||
      p.category_slug ||
      p.category?.slug ||
      (p.category?.name ? slugify(p.category.name) : "") ||
      "";

    const prod = p.slug || slugify(p.name || "product");

    if (cat && cat.toLowerCase() !== "catalog") {
      return `/catalog/${cat}/${prod}`;
    }
    return `/catalog/${prod}`;
  };

  const handleAddToCart = (product: Flower) => {
    addToCart(product);
  };

  return (
    <section className="relative isolate py-20 bg-[#fff8ea]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>

        {/* 2 на телефоне, 4 на десктопе */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {displayedProducts.map((product) => {
            const to = buildUrl(product);
            const priceText = product.price
              ? `${Number(product.price).toLocaleString('ru-RU')} ₽`
              : 'По запросу';

            return (
              <Card
                key={product.id}
                className="overflow-hidden border-0 rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300 bg-white"
              >
                {/* Кликабельно ведёт на страницу товара */}
                <Link to={to} aria-label={product.name} className="block">
                  <CardContent className="p-0">
                    {/* БОЛЬШОЕ ИЗОБРАЖЕНИЕ 4:5, на всю ширину */}
                    <div className="relative w-full overflow-hidden">
                      <div className="aspect-[4/5]">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* ТЕКСТ */}
                    <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                      <h3 className="text-sm sm:text-base font-medium leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="mt-1 sm:mt-1.5">
                        <span className="text-base sm:text-lg font-semibold">
                          {priceText}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Link>

                {/* КНОПКА-ПИЛЮЛЯ «В КОРЗИНУ» */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <Button
                    onClick={(e) => {
                      e.preventDefault(); // не переходить по ссылке
                      handleAddToCart(product);
                    }}
                    className="w-full rounded-full h-11 sm:h-12 text-base sm:text-lg font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    В КОРЗИНУ
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {!showAll && homepageProducts.length > 12 && (
          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => setShowAll(true)}
              className="rounded-full px-8 h-12 text-base font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-soft"
            >
              Показать ещё
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
