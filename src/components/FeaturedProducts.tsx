import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { ShoppingCart } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';

export function FeaturedProducts() {
  const [showAll, setShowAll] = useState(false);
  const { data: allProducts = [], isLoading, error } = useProducts();
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Букеты недели
          </h2>
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка букетов...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Букеты недели
          </h2>
          <div className="text-center">
            <p className="text-destructive">Ошибка загрузки букетов</p>
          </div>
        </div>
      </section>
    );
  }

  // Фильтруем продукты, которые должны отображаться на главной странице
  const homepageProducts = allProducts.filter(product => product.show_on_homepage);
  const displayedProducts = showAll ? homepageProducts : homepageProducts.slice(0, 12);

  const handleAddToCart = (product: any) => {
    // Создаем объект, совместимый с типом Flower для корзины
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image_url || '/placeholder.svg',
      description: product.description || '',
      category: 'flowers' as const,
      inStock: true,
      quantity: 1,
      colors: [] as string[],
      size: 'medium' as const,
      occasion: [] as string[]
    };
    addToCart(cartItem);
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Букеты недели
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {displayedProducts.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <Card className="group overflow-hidden border-0 shadow-soft hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-0">
                  <div 
                    className="aspect-square bg-cover bg-center bg-no-repeat transform group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${product.image_url || '/placeholder.svg'})` }}
                  />
                </CardContent>
                <CardFooter className="flex justify-between items-center p-2 sm:p-3 lg:p-4 bg-background">
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm lg:text-sm mb-1 line-clamp-1">{product.name}</h3>
                    <p className="font-bold text-sm sm:text-lg lg:text-xl">{product.price ? `${product.price} ₽` : 'По запросу'}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="default"
                    className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
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