import { useMemo } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { slugify } from '@/utils/slugify';
import { useAllProducts } from '@/hooks/useProducts';

interface ProductRecommendationsProps { productId: string; }
const asArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

// детерминированный хэш для «посева» сортировки
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
};

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { addToCart } = useCart();
  const { data, isLoading, error } = useAllProducts();
  const products = asArray<any>(data);

  // стабильные рекомендации: пересчитываются только при смене списка товаров или productId
  const recommendations = useMemo(() => {
    const pool = products.filter((p) => String(p.id) !== productId);
    const seeded = pool.slice().sort((a, b) => {
      const ha = hash(String(a.id) + productId);
      const hb = hash(String(b.id) + productId);
      return ha - hb;
    });
    return seeded.slice(0, 10);
  }, [products, productId]);

  if (error) {
    return <div className="py-8 text-center text-sm text-destructive/80">Не удалось загрузить рекомендации</div>;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">С ЭТИМ ТАКЖЕ ПОКУПАЮТ</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-6">С ЭТИМ ТАКЖЕ ПОКУПАЮТ</h2>
          <p className="text-center text-muted-foreground">Пока нет рекомендаций</p>
        </div>
      </section>
    );
  }

  const handleAddToCart = (p: any) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price || 0,
      image: p.image_url || '/placeholder.svg',
      description: p.description || '',
      category: p.category?.name || 'Разное',
      inStock: p.is_active,
      quantity: 1,
      colors: [],
      size: 'medium' as const,
      occasion: [],
    } as any);
    toast({ title: 'Добавлено в корзину', description: `${p.name} добавлен в корзину` });
  };

  const buildUrl = (p: any) => {
    const catSlug = p?.category?.slug || slugify(p?.category?.name || '') || 'catalog';
    const prodSlug = p?.slug || slugify(p?.name || '');
    return `/catalog/${catSlug}/${prodSlug}`;
  };

  return (
    <div className="py-8">
      <h2 className="text-xl font-bold text-foreground mb-6 text-center">С ЭТИМ ТАКЖЕ ПОКУПАЮТ</h2>
      <div className="relative">
        <Carousel opts={{ align: 'start', loop: false }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {recommendations.map((p: any) => {
              const url = buildUrl(p);
              return (
                <CarouselItem key={p.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/5">
                  <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <Link to={url} className="block">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={p.image_url || '/placeholder.svg'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                    <CardContent className="p-3 space-y-2">
                      <Link to={url}>
                        <h3 className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2">
                          {p.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-foreground">
                          {p.price ? `${Number(p.price).toLocaleString()} ₽` : 'Цена по запросу'}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
                          className="h-8 w-8 p-0"
                          disabled={p.availability_status !== 'in_stock'}
                          aria-label="Добавить в корзину"
                          title="Добавить в корзину"
                        >
                          <ShoppingBag className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>
    </div>
  );
}
