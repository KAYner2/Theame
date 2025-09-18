import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { useProduct } from '@/hooks/useProduct';
import { useProductBySlug } from '@/hooks/useProductBySlug';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { slugify } from '@/utils/slugify';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';
import { ProductRecommendations } from '@/components/ProductRecommendations';
import { parseCompositionRaw, parseFromArray } from '@/utils/parseComposition';

// UUID (для распознавания "...-<uuid>" в productSlug)
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductPage() {
  const { id: idParam, categorySlug, productSlug } = useParams<{
    id?: string;
    categorySlug?: string;
    productSlug?: string;
  }>();
  const navigate = useNavigate();

  // если productSlug оканчивается на -<uuid>, извлекаем этот id
  const idFromSlug = useMemo(() => {
    if (!productSlug) return '';
    const m = productSlug.match(UUID_RE);
    return m ? m[0] : '';
  }, [productSlug]);

  // --- Режимы загрузки ---
  const shouldLoadById = Boolean(idFromSlug || idParam);
  const realId = idFromSlug || idParam || '';

  const { data: productById, isLoading: loadingById, error: errorById } =
    useProduct(shouldLoadById ? realId : '');

  // если категории нет или она == "catalog" — игнорируем её
  const effectiveCategorySlug =
    categorySlug && categorySlug.toLowerCase() !== 'catalog' ? categorySlug : undefined;

  // вызываем useProductBySlug только если грузим по slug
  const { data: productBySlug, isLoading: loadingBySlug, error: errorBySlug } =
    !shouldLoadById && productSlug
      ? useProductBySlug(effectiveCategorySlug, productSlug)
      : { data: null, isLoading: false, error: null };

  const product = shouldLoadById ? productById : productBySlug;
  const isLoading = shouldLoadById ? loadingById : loadingBySlug;
  const error = shouldLoadById ? errorById : errorBySlug;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // скролл наверх при смене параметров
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idParam, categorySlug, productSlug]);

  // ✅ Новый вариант — игнорирует пустую категорию и "catalog"
  useEffect(() => {
    if (!isLoading && product) {
      let catSlugFinal = product?.category?.slug || slugify(product?.category?.name || '');
      if (!catSlugFinal || catSlugFinal.toLowerCase() === 'catalog') {
        catSlugFinal = '';
      }

      const prodSlugFinal = product?.slug || slugify(product.name);

      const canonical = catSlugFinal
        ? `/catalog/${catSlugFinal}/${prodSlugFinal}`
        : `/catalog/${prodSlugFinal}`;

      if (window.location.pathname !== canonical) {
        navigate(canonical, { replace: true });
      }
    }
  }, [isLoading, product, navigate]);

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
          <Button onClick={() => navigate('/catalog')}>Вернуться в каталог</Button>
        </div>
      </div>
    );
  }

  // изображения
  const images = [product.image_url || '/placeholder.svg', ...(product.gallery_urls || [])].filter(Boolean);
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
      cartQuantity: quantity,
    };
    for (let i = 0; i < quantity; i++) addToCart(cartItem);
    toast({ title: 'Добавлено в корзину', description: `${product.name} (${quantity} шт.) добавлен в корзину` });
  };

  const isInFavorites = isFavorite(product.id);
  const handleToggleFavorite = () => {
    if (isInFavorites) {
      removeFromFavorites(product.id);
      toast({ title: 'Удалено из избранного', description: `${product.name} удален из избранного` });
    } else {
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.image_url || '/placeholder.svg',
        description: product.description || '',
        category: product.category?.name || 'Разное',
        inStock: product.is_active,
        quantity: 1,
        colors: [],
        size: 'medium',
        occasion: [],
      });
      toast({ title: 'Добавлено в избранное', description: `${product.name} добавлен в избранное` });
    }
  };

  const nextImage = () => setSelectedImageIndex((prev) => (prev + 1) % availableImages.length);
  const prevImage = () => setSelectedImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);

  const compositionItems =
    product.composition_raw
      ? parseCompositionRaw(product.composition_raw)
      : parseFromArray(product.composition);

  return (
    <div className="min-h-screen bg-background">
      {/* Хлебные крошки */}
      <div className="container mx-auto px-4 py-4">
        {(() => {
          const catName = product.category?.name || 'Цветы';
          const catSlugFinal = product.category?.slug || (catName ? slugify(catName) : '');
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">ГЛАВНАЯ</Link>
              <span>›</span>
              <Link to="/catalog" className="hover:text-foreground transition-colors">КАТАЛОГ ТОВАРОВ</Link>
              <span>›</span>
              <Link
                to={catSlugFinal ? `/catalog?category=${encodeURIComponent(catSlugFinal)}` : '/catalog'}
                className="hover:text-foreground transition-colors"
              >
                {catName.toUpperCase()}
              </Link>
              <span>›</span>
              <span className="text-foreground font-medium">{product.name.toUpperCase()}</span>
            </div>
          );
        })()}
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden aspect-square">
              <img src={availableImages[selectedImageIndex]} alt={product.name} className="w-full h-full object-cover" />
              {availableImages.length > 1 && (
                <>
                  <Button variant="outline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={prevImage}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={nextImage}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </Card>

            {availableImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {availableImages.map((image, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer overflow-hidden aspect-square transition-all ${selectedImageIndex === index ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
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

          {/* Инфо о товаре */}
          <div className="space-y-6">
            {/* Статус + избранное */}
            <div className="flex items-center justify-between">
              <Badge variant={product.availability_status === 'in_stock' ? 'default' : 'secondary'} className="text-sm">
                {product.availability_status === 'in_stock' ? 'В НАЛИЧИИ' : 'НЕТ В НАЛИЧИИ'}
              </Badge>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  aria-label={isInFavorites ? 'Убрать из избранного' : 'Добавить в избранное'}
                  className={isInFavorites ? 'bg-destructive text-destructive-foreground' : ''}
                >
                  <Heart className={`w-4 h-4 ${isInFavorites ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Заголовок */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name.toUpperCase()}</h1>

            {/* Кол-во + цена + купить */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-foreground font-medium">КОЛИЧЕСТВО</span>
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{((product.price || 0) * quantity).toLocaleString()} ₽</div>
                <Button onClick={handleAddToCart} disabled={product.availability_status !== 'in_stock'} className="flex-1 h-12">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  КУПИТЬ
                </Button>
              </div>
            </div>

            {/* Состав + примечание */}
            {compositionItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">СОСТАВ</h3>
                <div className="grid grid-cols-2 gap-2">
                  {compositionItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-muted-foreground">
                        {item.name}{typeof item.qty === 'number' ? ` — ${item.qty} шт.` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {product.show_substitution_note && (
                  <p className="mt-2 text-sm text-green-700">
                    {(product.substitution_note_text && product.substitution_note_text.trim()) ||
                      'До 20% компонентов букета могут быть заменены с сохранением общей стилистики и цветового решения!'}
                  </p>
                )}
              </div>
            )}

            {/* Аккордеоны */}
            <Accordion type="single" collapsible className="w-full">
              {(product.description || product.detailed_description) && (
                <AccordionItem value="description">
                  <AccordionTrigger className="text-left font-medium">ОПИСАНИЕ</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    {product.description && <p className="whitespace-pre-line">{product.description}</p>}
                    {product.detailed_description && <p className="whitespace-pre-line">{product.detailed_description}</p>}
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.gift_info && (
                <AccordionItem value="gift">
                  <AccordionTrigger className="text-left font-medium">ПОДАРОК К КАЖДОМУ ЗАКАЗУ</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{product.gift_info}</AccordionContent>
                </AccordionItem>
              )}

              {product.size_info && (
                <AccordionItem value="size">
                  <AccordionTrigger className="text-left font-medium">РАЗМЕРЫ</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">{product.size_info}</p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.delivery_info && (
                <AccordionItem value="delivery">
                  <AccordionTrigger className="text-left font-medium">ДОСТАВКА</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{product.delivery_info}</AccordionContent>
                </AccordionItem>
              )}

              {product.care_instructions && (
                <AccordionItem value="care">
                  <AccordionTrigger className="text-left font-medium">КАК УХАЖИВАТЬ ЗА ЦВЕТАМИ</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">{product.care_instructions}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>

        {/* Рекомендации */}
        <div className="container mx-auto px-4">
          <ProductRecommendations productId={product.id} />
        </div>
      </div>
    </div>
  );
}
