// src/pages/VariantProductPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';
import { ProductRecommendations } from '@/components/ProductRecommendations';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';
import { VariantFlowerCard } from '@/components/VariantFlowerCard';

/* ---------------- типы для этой страницы ---------------- */

type VP = {
  id: number; name: string; slug: string;
  description: string | null; detailed_description: string | null;
  image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean | null; min_price_cache: number | null;

  extra_image_1_url?: string | null;
  extra_image_2_url?: string | null;
};

type PV = {
  id: number; product_id: number; title: string;
  composition: string | null; description?: string | null;
  price: number | null;
  image_url: string | null;
  gallery_urls?: string[] | null;
  is_active: boolean; sort_order: number | null;
};

type VPLite = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  min_price_cache: number | null;
  is_active: boolean | null;
};

/* ---------------- utils ---------------- */

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const formatPrice = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

/** Парсинг строк состава варианта в вид [{ name, qty? }] */
type CompItem = { name: string; qty?: number };
const parseVariantComposition = (raw?: string | null): CompItem[] => {
  if (!raw) return [];
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  return lines.map(line => {
    // допускаем "—" или "-" как разделитель
    const parts = line.split(/[—-]/).map(s => s.trim());
    // вариант: "Роза — 7 шт", "Роза - 7 шт.", "Роза 7 шт"
    let name = line;
    let qty: number | undefined;

    // 1) если есть явный разделитель
    if (parts.length >= 2) {
      name = parts[0];
      const tail = parts.slice(1).join(' ');
      const m = tail.match(/(\d+)\s*шт\.?/i);
      if (m) qty = Number(m[1]);
      return { name, qty };
    }

    // 2) без разделителя — пытаемся вытащить "7 шт"
    const m = line.match(/^(.+?)\s+(\d+)\s*шт\.?$/i);
    if (m) {
      name = m[1].trim();
      qty = Number(m[2]);
    }
    return { name, qty };
  });
};

/* ---------------- основная страница ---------------- */

export default function VariantProductPage() {
  const params = useParams();
  const slug = (params as any).slug ?? (params as any).productSlug ?? '';
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [product, setProduct] = useState<VP | null>(null);
  const [variants, setVariants] = useState<PV[]>([]);

  // Загрузка данных
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorText(null);

    (async () => {
      try {
        if (!slug) throw new Error('Не указан slug');
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await (supabase as any)
          .from('variant_products')
          .select(`
            *,
            product_variants:product_variants (
              id, product_id, title, composition, description, price,
              image_url, gallery_urls, is_active, sort_order, created_at, updated_at
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Товар не найден');

        const all = (data.product_variants ?? []) as PV[];
        const vs = all
  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  .slice(0, 10);

        if (!alive) return;
        const { product_variants, ...rest } = data;
        setProduct(rest as VP);
        setVariants(vs);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        console.error('[VariantProductPage] load error:', e);
        setErrorText(e?.message || 'Ошибка загрузки');
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  // выбранный вариант
  const defaultVariantId = useMemo(
    () => (variants.length ? variants[0].id : null),
    [variants]
  );
  const [activeVariantId, setActiveVariantId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveVariantId(defaultVariantId), [defaultVariantId]);

  // скролл вверх при смене товара
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // мемо
  const current = useMemo(
    () => variants.find(v => v.id === activeVariantId) ?? null,
    [variants, activeVariantId]
  );

// 1) Главное фото — всегда общее фото товара
const baseImg = useMemo(
  () => (product?.image_url || '/placeholder.svg') as string,
  [product]
);

// 2) Фото всех вариантов (по одному основному) — без дублей и без baseImg
const variantThumbs = useMemo(() => {
  const list = variants.map(v => v.image_url).filter(Boolean) as string[];
  const seen = new Set<string>();
  return list.filter((src) => {
    if (!src) return false;
    if (src === baseImg) return false;
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });
}, [variants, baseImg]);

// 3) Два «хвостовых» доп. фото из товара (если заданы)
const tail = useMemo(() => {
  const t = [
    (product as any)?.extra_image_1_url || '',
    (product as any)?.extra_image_2_url || '',
  ].filter(Boolean) as string[];
  // на всякий случай — не дублируем baseImg и фото вариантов
  const ban = new Set([baseImg, ...variantThumbs]);
  return t.filter((src) => src && !ban.has(src));
}, [product, baseImg, variantThumbs]);

// Итоговый порядок галереи
const images = useMemo(
  () => [baseImg, ...variantThumbs, ...tail],
  [baseImg, variantThumbs, tail]
);

const imagesLen = images.length || 1;
const [selectedImageIndex, setSelectedImageIndex] = useState(0);
useEffect(() => setSelectedImageIndex(0), [baseImg]);


  // ранние return
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">
          Загрузка товара…
        </div>
      </div>
    );
  }

  if (errorText || !product) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl font-bold mb-4">{errorText || 'Товар не найден'}</div>
          <Button onClick={() => navigate('/catalog')}>В каталог</Button>
        </div>
      </div>
    );
  }

  // обработчики
  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

  const favKey = `v:${product.id}`;
  const isFav = isFavorite(favKey);

  const descriptionText = [
    product.description?.trim(),
    product.detailed_description?.trim(),
    current?.description?.trim(),
  ].filter(Boolean).join('\n\n');

  const handleAddToCart = () => {
    if (!current) {
      toast({ title: 'Выберите вариант', description: 'Чтобы добавить в корзину, укажите вариант.' });
      return;
    }
    addToCart({
      id: `vp:${product.id}:${current.id}`,
      name: `${product.name} — ${current.title}`,
      price: current.price || 0,
      image: current.image_url || product.image_url || '/placeholder.svg',
      description: current.composition || product.description || '',
      category: 'Разное',
      inStock: !!product.is_active,
      quantity: 1,
      colors: [],
      size: current.title,
      occasion: [],
    } as any);
    toast({
      title: 'Добавлено в корзину',
      description: `${product.name} (${current.title}) добавлен в корзину`,
    });
  };

  // парсим состав выбранного варианта
  const compItems: CompItem[] = parseVariantComposition(current?.composition);

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center">
          {/* Галерея */}
          <div className="space-y-4">
            {/* Без Card/белых полей, object-cover */}
            <div
              className="
                relative overflow-hidden
                aspect-[5/4]
                max-h-[75vh]
                lg:max-h-[72vh]
                mx-auto rounded-lg
              "
            >
              <img
                src={images[selectedImageIndex] || baseImg}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {imagesLen > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {imagesLen > 1 && (
              <div className="flex justify-center gap-2 flex-wrap">
                {images.map((src, idx) => (
                  <div
                    key={src + idx}
                    className={`cursor-pointer overflow-hidden aspect-square h-16 md:h-20 rounded-md transition-all ${
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
                  </div>
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

            {/* Цена: по выбранному варианту, иначе — «от …» */}
            <div className="text-2xl font-bold text-[#819570]">
              {current ? formatPrice(current.price) : formatPrice(product.min_price_cache)}
            </div>

            {/* Варианты (если >1) */}
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

{/* Кнопки — завязка на активность выбранного варианта */}
<div className="flex items-center gap-3">
  {current ? (
    current.is_active ? (
      <Button
        onClick={handleAddToCart}
        className="h-12 rounded-full px-8 text-base font-medium"
      >
        <ShoppingBag className="w-6 h-6 mr-2" />
        Добавить в корзину
      </Button>
    ) : (
      <Button
        onClick={() => window.open('https://wa.me/message/XQDDWGSEL35LP1', '_blank')}
        className="h-12 rounded-full px-8 text-base font-medium"
      >
        Сделать предзаказ
      </Button>
    )
  ) : (
    <Button disabled className="h-12 rounded-full px-8 text-base font-medium">
      Выберите вариант
    </Button>
  )}

  {/* Избранное без изменений */}
  <Button
    variant="outline"
    size="icon"
    aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
    onClick={() => {
      if (!current) return;
      if (isFav) {
        removeFromFavorites(favKey);
        toast({ title: 'Удалено из избранного', description: `${product.name} удалён из избранного` });
      } else {
        addToFavorites({
          id: favKey,
          name: product.name,
          price: current?.price ?? product.min_price_cache ?? 0,
          image: current?.image_url || product.image_url || '/placeholder.svg',
          description: current?.description || product.description || '',
          category: 'Разное',
          inStock: !!product.is_active,
          quantity: 1,
          colors: [],
          size: current?.title || 'variant',
          occasion: [],
        } as any);
        toast({ title: 'Добавлено в избранное', description: `${product.name} добавлен в избранное` });
      }
    }}
    className={`h-12 w-12 rounded-full ${isFav ? 'bg-destructive text-destructive-foreground' : ''}`}
  >
    <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
  </Button>
</div>


            {/* Состав выбранного варианта — один столбик, без переноса "шт." */}
            {compItems.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {compItems.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex items-start gap-2">
                      <div className="mt-2 w-2 h-2 bg-primary rounded-full shrink-0" />
                      <span className="text-muted-foreground">
                        {item.name}
                        {typeof item.qty === 'number' ? (
                          <>
                            {' — '}
                            <span className="whitespace-nowrap">
                              {item.qty}
                              {'\u00A0'}
                              шт.
                            </span>
                          </>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Описание — без отрицательных отступов, выровнено */}
            {descriptionText ? (
              <div>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {descriptionText}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Рекомендации — как на обычной странице товара */}
        <div className="container mx-auto px-4 mt-12">
          {product?.id ? <ProductRecommendations productId={String(product.id)} /> : null}
        </div>
      </div>
    </div>
  );
}
