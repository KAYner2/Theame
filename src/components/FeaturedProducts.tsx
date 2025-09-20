import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { ShoppingCart } from 'lucide-react';
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

  const handleAddToCart = (product: Flower) => {
    addToCart(product);
  };

  // надёжный генератор «красивого» URL
  const buildUrl = (p: any) => {
    const catSlug =
      p.categorySlug ||
      p.category_slug ||
      p.category?.slug ||
      (p.category?.name ? slugify(p.category.name) : '');

    const prodSlug = p.slug || (p.name ? slugify(p.name) : '');

    // 1) красивый URL без id — ProductPage умеет грузить по slug
    if (catSlug && prodSlug) {
      return `/catalog/${catSlug}/${prodSlug}`;
    }
    // 2) если чего-то нет, fallback на стабильный id
    return `/product/${p.id}`;
  };

  return (
    <section className="relative isolate py-20 bg-[#fff8ea]">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Букеты недели</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {displayedProducts.map((product) => {
            const to = buildUrl(product);

            return (
              <Link key={product.id} to={to} aria-label={product.name}>
                <Card className="group overflow-hidden border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-0">
                    <div
                      className="aspect-square bg-cover bg-center bg-no-repeat transform group-hover:scale-105 transition-transform duration-500"
                      style={{ backgroundImage: `url(${product.image || '/placeholder.svg'})` }}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between items-center p-2 sm:p-3 lg:p-4 bg-[#fff8ea]">
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-sm mb-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="font-bold text-sm sm:text-lg lg:text-xl">
                        {product.price ? `${product.price} ₽` : 'По запросу'}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="default"
                      className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      aria-label="Добавить в корзину"
                      title="Добавить в корзину"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>

        {!showAll && homepageProducts.length > 12 && (
          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => setShowAll(true)}
              className="bg-gradient-primary hover:bg-gradient-secondary shadow-soft"
            >
              Показать еще
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
