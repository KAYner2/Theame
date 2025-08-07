import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProduct } from '@/hooks/useProduct';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, Heart, Share2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { ProductRecommendations } from '@/components/ProductRecommendations';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(id!);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  // Smooth scroll to top when component mounts or product changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Товар не найден</h1>
          <Button onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  const images = [
    product.image_url || '/placeholder.svg',
    ...(product.gallery_urls || [])
  ].filter(Boolean);

  const availableImages = images.length > 1 ? images : [product.image_url || '/placeholder.svg'];

  const handleAddToCart = () => {
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
      cartQuantity: quantity
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }

    toast({
      title: "Добавлено в корзину",
      description: `${product.name} (${quantity} шт.) добавлен в корзину`,
    });
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % availableImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ГЛАВНАЯ
          </Link>
          <span>›</span>
          <Link to="/catalog" className="hover:text-foreground transition-colors">
            КАТАЛОГ ТОВАРОВ
          </Link>
          <span>›</span>
          <Link 
            to={`/catalog?category=${encodeURIComponent(product.category?.name || '')}`}
            className="hover:text-foreground transition-colors"
          >
            {(product.category?.name || 'ЦВЕТЫ').toUpperCase()}
          </Link>
          <span>›</span>
          <span className="text-foreground font-medium">
            {product.name.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="relative overflow-hidden aspect-square">
              <img
                src={availableImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {availableImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </Card>

            {/* Thumbnail Gallery */}
            {availableImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {availableImages.map((image, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer overflow-hidden aspect-square transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-primary'
                        : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded">
                        Основное
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={product.availability_status === 'in_stock' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {product.availability_status === 'in_stock' ? 'В НАЛИЧИИ' : 'НЕТ В НАЛИЧИИ'}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {product.name.toUpperCase()}
            </h1>


            {/* Quantity and Price */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-foreground font-medium">КОЛИЧЕСТВО</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {((product.price || 0) * quantity).toLocaleString()} ₽
                </div>
                <Button 
                  onClick={handleAddToCart}
                  disabled={product.availability_status !== 'in_stock'}
                  className="flex-1 h-12"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  КУПИТЬ
                </Button>
              </div>
            </div>

            {/* Composition */}
            {product.composition && product.composition.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">СОСТАВ</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.composition.map((flower, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">{flower}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Info Sections */}
            <Accordion type="single" collapsible className="w-full">
              {(product.description || product.detailed_description) && (
                <AccordionItem value="description">
                  <AccordionTrigger className="text-left font-medium">
                    ОПИСАНИЕ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    {product.description && (
                      <p className="whitespace-pre-line">{product.description}</p>
                    )}
                    {product.detailed_description && (
                      <p className="whitespace-pre-line">{product.detailed_description}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {product.gift_info && (
                <AccordionItem value="gift">
                  <AccordionTrigger className="text-left font-medium">
                    ПОДАРОК К КАЖДОМУ ЗАКАЗУ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {product.gift_info}
                  </AccordionContent>
                </AccordionItem>
              )}
              
              
              {product.size_info && (
                <AccordionItem value="size">
                  <AccordionTrigger className="text-left font-medium">
                    РАЗМЕРЫ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">{product.size_info}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {product.delivery_info && (
                <AccordionItem value="delivery">
                  <AccordionTrigger className="text-left font-medium">
                    ДОСТАВКА
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {product.delivery_info}
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {product.care_instructions && (
                <AccordionItem value="care">
                  <AccordionTrigger className="text-left font-medium">
                    КАК УХАЖИВАТЬ ЗА ЦВЕТАМИ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">{product.care_instructions}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>
        
        {/* Product Recommendations */}
        <div className="container mx-auto px-4">
          <ProductRecommendations productId={product.id} />
        </div>
      </div>
    </div>
  );
}