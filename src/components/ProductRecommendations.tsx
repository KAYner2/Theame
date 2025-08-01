import { useProductRecommendations } from '@/hooks/useRecommendations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { toast } from "sonner";

interface ProductRecommendationsProps {
  productId: string;
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { data: recommendations, isLoading } = useProductRecommendations(productId);
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          С ЭТИМ ТАКЖЕ ПОКУПАЮТ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse"></div>
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image_url || '/placeholder.svg',
      description: product.description || '',
      category: product.category?.name || 'Разное',
      inStock: product.is_active,
      quantity: 1,
      colors: [],
      size: 'medium' as const,
      occasion: [],
      cartQuantity: 1
    };

    addToCart(cartItem);

    toast.success(`${product.name} добавлен в корзину`);
  };

  return (
    <div className="py-8">
      <h2 className="text-xl font-bold text-foreground mb-6 text-center">
        С ЭТИМ ТАКЖЕ ПОКУПАЮТ
      </h2>
      
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {recommendations.map((product) => (
              <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/5">
                <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  
                  <CardContent className="p-3 space-y-2">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-foreground">
                        {product.price ? `${product.price.toLocaleString()} ₽` : 'Цена по запросу'}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="h-8 w-8 p-0"
                        disabled={product.availability_status !== 'in_stock'}
                      >
                        <ShoppingBag className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {product.category && (
                      <div className="text-xs text-muted-foreground">
                        {product.category.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>
    </div>
  );
}