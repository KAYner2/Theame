// src/pages/ProductPage.tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';
import { useProduct } from '@/hooks/useProduct';
import { useProductBySlug } from '@/hooks/useProductBySlug';

const asArray = <T,>(v: T[] | T | null | undefined): T[] => (Array.isArray(v) ? v : v ? [v] : []);

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductPage() {
  const { id: idParam, categorySlug, productSlug } = useParams<{
    id?: string; categorySlug?: string; productSlug?: string;
  }>();
  const navigate = useNavigate();

  // Извлекаем id из "...-<uuid>"
  const idFromSlug = useMemo(() => {
    if (!productSlug) return '';
    const m = productSlug.match(UUID_RE);
    return m ? m[0] : '';
  }, [productSlug]);

  const shouldLoadById = Boolean(idFromSlug || idParam);
  const realId = idFromSlug || idParam || '';

  const { data: productById, isLoading: loadingById, error: errorById } =
    useProduct(shouldLoadById ? realId : '');

  const { data: productBySlug, isLoading: loadingBySlug, error: errorBySlug } =
    !shouldLoadById && productSlug
      ? useProductBySlug(categorySlug ?? '', productSlug)
      : { data: null, isLoading: false, error: null } as const;

  const isLoading = loadingById || loadingBySlug;
  const error = errorById || errorBySlug;
  const product = productBySlug ?? productById;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  // Поднимаем кверху при смене товара
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [idParam, categorySlug, productSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">Загрузка товара…</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-2xl font-bold mb-4">Товар не найден</div>
          <Button onClick={() => navigate('/catalog')}>Вернуться в каталог</Button>
        </div>
      </div>
    );
  }

  // Картинки — безопасно
  const baseImg = product?.image_url || '/placeholder.svg';
  const gallery = asArray<string>(product?.gallery_urls);
  const images = [baseImg, ...gallery].filter(Boolean) as string[];
  const imagesLen = images.length || 1;

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

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
      cartQuantity: quantity,
    } as any);
    toast({ title: 'Добавлено в корзину', description: `${product.name} (${quantity} шт.) добавлен в корзину` });
  };

  const isFav = isFavorite(product.id);

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      {/* Хлебные крошки (минимум) */}
      <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">ГЛАВНАЯ</Link> <span>›</span>{' '}
        <Link to="/catalog" className="hover:text-foreground">КАТАЛОГ ТОВАРОВ</Link> <span>›</span>{' '}
        <span className="text-foreground font-medium">{(product?.name || '').toUpperCase()}</span>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Галерея */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden aspect-square">
              <img src={images[selectedImageIndex] || baseImg} alt={product?.name || ''} className="w-full h-full object-cover" />
              {imagesLen > 1 && (
                <>
                  <Button variant="outline" size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}><ChevronRight className="w-4 h-4" /></Button>
                </>
              )}
            </Card>

            {imagesLen > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, idx) => (
                  <Card key={src + idx}
                        className={`cursor-pointer overflow-hidden aspect-square transition-all ${selectedImageIndex === idx ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'}`}
                        onClick={() => setSelectedImageIndex(idx)}>
                    <img src={src} alt={`${product?.name || ''} ${idx + 1}`} className="w-full h-full object-cover" />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={product?.availability_status === 'in_stock' ? 'default' : 'secondary'} className="text-sm">
                {product?.availability_status === 'in_stock' ? 'В НАЛИЧИИ' : 'НЕТ В НАЛИЧИИ'}
              </Badge>
              <Button variant="outline" size="icon"
                      onClick={() => {
                        if (isFav) {
                          removeFromFavorites(product.id);
                          toast({ title: 'Удалено из избранного', description: `${product.name} удален из избранного` });
                        } else {
                          addToFavorites({
                            id: product.id, name: product.name, price: product.price || 0,
                            image: product.image_url || '/placeholder.svg', description: product.description || '',
                            category: product.category?.name || 'Разное', inStock: product.is_active,
                            quantity: 1, colors: [], size: 'medium', occasion: [],
                          } as any);
                          toast({ title: 'Добавлено в избранное', description: `${product.name} добавлен в избранное` });
                        }
                      }}>
                {/* сердечко убрал для простоты — иконки не важны */}
                ♥
              </Button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{(product?.name || '').toUpperCase()}</h1>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-foreground font-medium">КОЛИЧЕСТВО</span>
                <div className="flex items-center border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10"> <Minus className="w-4 h-4" /> </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => q + 1)} className="h-10 w-10"> <Plus className="w-4 h-4" /> </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">{(((product?.price || 0) * quantity) || 0).toLocaleString()} ₽</div>
                <Button onClick={handleAddToCart} disabled={product?.availability_status !== 'in_stock'} className="flex-1 h-12">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  КУПИТЬ
                </Button>
              </div>
            </div>

            {/* ВАЖНО: ничего лишнего — ни Accordion, ни составов, ни рекомендаций */}
          </div>
        </div>
      </div>
    </div>
  );
}
