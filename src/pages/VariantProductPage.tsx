import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';

import { useVariantProductBySlug } from '@/hooks/useVariantProductBySlug';
import { ProductRecommendations } from '@/components/ProductRecommendations';

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const formatPrice = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useVariantProductBySlug(slug);
  const product = data?.product;
  const variants = data?.variants ?? [];
  const categoryNames = data?.categoryNames ?? [];

  // первый активный вариант как дефолт
  const defaultVariantId = useMemo(
    () => (variants.length ? variants[0].id : null),
    [variants]
  );

  const [activeVariantId, setActiveVariantId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveVariantId(defaultVariantId), [defaultVariantId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">Загрузка товара…</div>
      </div>
    );
  }

  if (isError || !product) {
    console.error(error);
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl font-bold mb-4">Товар не найден</div>
          <Button onClick={() => navigate('/catalog')}>В каталог</Button>
        </div>
      </div>
    );
  }

  const current = variants.find(v => v.id === activeVariantId) ?? null;

  // Фото: если у варианта есть своё — используем его как главное, иначе — фото товара.
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray<string>(product.gallery_urls);
  // Убираем дубликаты, если фото варианта совпадает с общим
  const images = [baseImg, ...gallery.filter(src => src !== baseImg)];
  const imagesLen = images.length || 1;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useEffect(() => setSelectedImageIndex(0), [baseImg]); // при смене варианта возвращаемся к 1-му фото

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

  // Избранное: делаем отдельный space для variant_products, чтобы не конфликтовать с обычными товарами
  const favKey = `v:${product.id}`; // уникальный ключ для избранного
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const isFav = isFavorite(favKey);

  // Корзина: складываем конкретный вариант (уникализируем id позиции корзины)
  const { addToCart } = useCart();
  const handleAddToCart = () => {
    if (!current) {
      toast({ title: 'Выберите вариант', description: 'Чтобы добавить в корзину, укажите вариант.' });
      return;
    }
    addToCart({
      id: `vp:${product.id}:${current.id}`, // уникальный ключ позиции
      name: `${product.name} — ${current.title}`,
      price: current.price || 0,
      image: current.image_url || product.image_url || '/placeholder.svg',
      description: current.composition || product.description || '',
      category: categoryNames[0] || 'Разное',
      inStock: product.is_active,
      quantity: 1,
      colors: [],
      size: current.title, // кладём выбранный вариант в size для совместимости
      occasion: [],
    } as any);
    toast({
      title: 'Добавлено в корзину',
      description: `${product.name} (${current.title}) добавлен в корзину`,
    });
  };

  // Витринный текст описания (похож на обычный ProductPage, но без доп. парсинга)
  const descriptionText = [
    product.description?.trim(),
    product.detailed_description?.trim(),
    current?.composition?.trim(), // добавим «состав» выбранного варианта в общий блок
  ].filter(Boolean).join('\n\n');

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center">
          {/* Галерея */}
          <div className="space-y-4">
            <Card
              className="
                relative overflow-hidden
                aspect-[5/4]
                max-h-[75vh]
                lg:max-h-[72vh]
                mx-auto
              "
            >
              <img
                src={images[selectedImageIndex] || baseImg}
                alt={product.name}
                className="w-full h-full object-contain"
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
              <div className="flex justify-center gap-2 flex-wrap">
                {images.map((src, idx) => (
                  <Card
                    key={src + idx}
                    className={`cursor-pointer overflow-hidden aspect-square h-16 md:h-20 transition-all ${
                      selectedImageIndex === idx
                        ? 'ring-2 ring-primary'
                        : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img
                      src={src}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-6 lg:self-center lg:max-w-[560px] lg:mx-auto">
            {/* Название */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#819570]">
              {(product.name || '').toUpperCase()}
            </h1>

            {/* Цена текущего варианта (или «от …») */}
            <div className="text-2xl font-bold text-[#819570]">
              {current ? formatPrice(current.price) : formatPrice(product.min_price_cache)}
            </div>

            {/* Кружки вариантов (до 10). Если 1 вариант — не показываем. */}
            {variants.length > 1 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Варианты</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => {
                    const active = v.id === activeVariantId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setActiveVariantId(v.id)}
                        className={`rounded-full px-4 py-2 border text-sm transition
                          ${active ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted'}`}
                        aria-pressed={active}
                        title={v.title}
                      >
                        {v.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Кнопка + избранное */}
            <div className="flex items-center gap-3">
              {product.is_active ? (
                <Button
                  onClick={handleAddToCart}
                  className="h-10 rounded-full px-6 text-sm font-medium"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Добавить в корзину
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    window.open('https://wa.me/message/XQDDWGSEL35LP1', '_blank')
                  }
                  className="h-10 rounded-full px-6 text-sm font-medium"
                >
                  Сделать предзаказ
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                onClick={() => {
                  if (isFav) {
                    removeFromFavorites(favKey);
                    toast({
                      title: 'Удалено из избранного',
                      description: `${product.name} удалён из избранного`,
                    });
                  } else {
                    addToFavorites({
                      id: favKey,
                      name: product.name,
                      price: current?.price ?? product.min_price_cache ?? 0,
                      image: current?.image_url || product.image_url || '/placeholder.svg',
                      description: current?.composition || product.description || '',
                      category: categoryNames[0] || 'Разное',
                      inStock: product.is_active,
                      quantity: 1,
                      colors: [],
                      size: current?.title || 'variant',
                      occasion: [],
                    } as any);
                    toast({
                      title: 'Добавлено в избранное',
                      description: `${product.name} добавлен в избранное`,
                    });
                  }
                }}
                className={`h-10 w-10 rounded-full ${isFav ? 'bg-destructive text-destructive-foreground' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Состав (вариант) — без заголовка, как в обычной странице (сетка точек) */}
            {current?.composition && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {current.composition.split('\n').map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{line.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Описание (общий + вариантный состав, см. descriptionText) */}
            {descriptionText ? (
              <div className="pt-1 md:-ml-1 lg:-ml-2">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {descriptionText}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Рекомендации — тот же компонент, передаём id как строку (у нас число) */}
        <div className="container mx-auto px-4">
          {product?.id ? (
            <ProductRecommendations productId={String(product.id)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
