import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';

import { useProduct } from '@/hooks/useProduct';
import { useProductBySlug } from '@/hooks/useProductBySlug';
import { parseCompositionRaw, parseFromArray } from '@/utils/parseComposition';
import { ProductRecommendations } from '@/components/ProductRecommendations';

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductPage() {
  const { id: idParam, categorySlug, productSlug } = useParams<{
    id?: string;
    categorySlug?: string;
    productSlug?: string;
  }>();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const idFromSlug = useMemo(() => {
    if (!productSlug) return '';
    const m = productSlug.match(UUID_RE);
    return m ? m[0] : '';
  }, [productSlug]);

  const effectiveId = idParam || idFromSlug || '';

  const {
    data: productById,
    isLoading: loadingById,
    error: errorById,
  } = useProduct(effectiveId);

  const {
    data: productBySlug,
    isLoading: loadingBySlug,
    error: errorBySlug,
  } =
    !effectiveId && productSlug
      ? useProductBySlug(categorySlug ?? '', productSlug)
      : { data: null, isLoading: false, error: null } as const;

  const product = productById ?? productBySlug;
  const isLoading = loadingById || loadingBySlug;
  const error = errorById || errorBySlug;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [effectiveId, categorySlug, productSlug]);

  const debugOn =
    sp.get('debug') === '1' ||
    (typeof window !== 'undefined' &&
      localStorage.getItem('debugProductPage') === '1');
  if (debugOn)
    console.log('[ProductPage dbg]', {
      idParam,
      categorySlug,
      productSlug,
      effectiveId,
      productById,
      productBySlug,
      isLoading,
      error,
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">
          Загрузка товара…
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl font-bold mb-4">Товар не найден</div>
          <Button onClick={() => navigate('/catalog')}>В каталог</Button>
        </div>
      </div>
    );
  }

  const baseImg = product?.image_url || '/placeholder.svg';
  const gallery = asArray<string>(product?.gallery_urls);
  const images = [baseImg, ...gallery].filter(Boolean) as string[];
  const imagesLen = images.length || 1;

  const nextImage = () =>
    setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () =>
    setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

  const isFav = isFavorite(product.id);

  const compositionItems = product?.composition_raw
    ? parseCompositionRaw(product.composition_raw)
    : parseFromArray(asArray(product?.composition));

  const handleAddToCart = () => {
    addToCart({
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
    } as any);
    toast({
      title: 'Добавлено в корзину',
      description: `${product.name} добавлен в корзину`,
    });
  };

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden aspect-square">
              <img
                src={images[selectedImageIndex] || baseImg}
                alt={product?.name || ''}
                className="w-full h-full object-cover"
              />
              {imagesLen > 1 && (
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

            {imagesLen > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, idx) => (
                  <Card
                    key={src + idx}
                    className={`cursor-pointer overflow-hidden aspect-square transition-all ${
                      selectedImageIndex === idx
                        ? 'ring-2 ring-primary'
                        : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img
                      src={src}
                      alt={`${product?.name || ''} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              {/* Только избранное */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isFav) {
                    removeFromFavorites(product.id);
                    toast({
                      title: 'Удалено из избранного',
                      description: `${product.name} удален из избранного`,
                    });
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
                    } as any);
                    toast({
                      title: 'Добавлено в избранное',
                      description: `${product.name} добавлен в избранное`,
                    });
                  }
                }}
                aria-label={
                  isFav ? 'Убрать из избранного' : 'Добавить в избранное'
                }
                className={isFav ? 'bg-destructive text-destructive-foreground' : ''}
              >
                <Heart
                  className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
                />
              </Button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {(product?.name || '').toUpperCase()}
            </h1>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {(product?.price || 0).toLocaleString()} ₽
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={product?.availability_status !== 'in_stock'}
                  className="flex-1 h-12"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  КУПИТЬ
                </Button>
              </div>
            </div>

            {/* Состав */}
            {(compositionItems?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">СОСТАВ</h3>
                <div className="grid grid-cols-2 gap-2">
                  {compositionItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-muted-foreground">
                        {item.name}
                        {typeof item.qty === 'number'
                          ? ` — ${item.qty} шт.`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {product?.show_substitution_note && (
                  <p className="mt-2 text-sm text-green-700">
                    {(product?.substitution_note_text &&
                      product.substitution_note_text.trim()) ||
                      'До 20% компонентов букета могут быть заменены с сохранением общей стилистики и цветового решения!'}
                  </p>
                )}
              </div>
            )}

            {/* Аккордеоны */}
            <Accordion type="single" collapsible className="w-full">
              {(product?.description || product?.detailed_description) && (
                <AccordionItem value="description">
                  <AccordionTrigger className="text-left font-medium">
                    ОПИСАНИЕ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    {product?.description && (
                      <p className="whitespace-pre-line">
                        {product.description}
                      </p>
                    )}
                    {product?.detailed_description && (
                      <p className="whitespace-pre-line">
                        {product.detailed_description}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {product?.gift_info && (
                <AccordionItem value="gift">
                  <AccordionTrigger className="text-left font-medium">
                    ПОДАРОК К КАЖДОМУ ЗАКАЗУ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {product.gift_info}
                  </AccordionContent>
                </AccordionItem>
              )}

              {product?.size_info && (
                <AccordionItem value="size">
                  <AccordionTrigger className="text-left font-medium">
                    РАЗМЕРЫ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">
                      {product.size_info}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {product?.delivery_info && (
                <AccordionItem value="delivery">
                  <AccordionTrigger className="text-left font-medium">
                    ДОСТАВКА
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {product.delivery_info}
                  </AccordionContent>
                </AccordionItem>
              )}

              {product?.care_instructions && (
                <AccordionItem value="care">
                  <AccordionTrigger className="text-left font-medium">
                    КАК УХАЖИВАТЬ ЗА ЦВЕТАМИ
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="whitespace-pre-line">
                      {product.care_instructions}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </div>

        {/* Рекомендации */}
        <div className="container mx-auto px-4">
          {product?.id ? (
            <ProductRecommendations productId={String(product.id)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
