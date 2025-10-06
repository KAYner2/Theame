// src/pages/VariantProductPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';

import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { toast } from '@/hooks/use-toast';

// рекомендации рендерим отдельным подкомпонентом (без сторонних хуков)
import { VariantFlowerCard } from '@/components/VariantFlowerCard';

type VP = {
  id: number; name: string; slug: string;
  description: string | null; detailed_description: string | null;
  image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean | null; min_price_cache: number | null;
};

type PV = {
  id: number; product_id: number; title: string;
  composition: string | null; description?: string | null;
  price: number | null;
  image_url: string | null;
  gallery_urls?: string[] | null;
  is_active: boolean; sort_order: number | null;
};

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const fmt = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

/* ─────────────────────────  ОБЁРТКА  ─────────────────────────
   ВАЖНО: здесь только безопасные хуки React Router.
   Внутренний компонент монтируется, ТОЛЬКО когда есть slug.
---------------------------------------------------------------- */
export default function VariantProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  if (!slug) {
    // безусловный, простой рендер — НИ ОДНОГО «условного» хука
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl font-bold mb-4">Товар не найден</div>
          <Button asChild><a href="/catalog">В каталог</a></Button>
        </div>
      </div>
    );
  }
  return <VariantProductInner slug={slug} />;
}

/* ───────────────────────  ОСНОВНОЙ КОМПОНЕНТ  ─────────────────────── */
function VariantProductInner({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [product, setProduct] = useState<VP | null>(null);
  const [variants, setVariants] = useState<PV[]>([]);

  // Загрузка только через useEffect + динамический импорт Supabase
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErrorText(null);

    (async () => {
      try {
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

        const vs = ((data.product_variants ?? []) as PV[])
          .filter(v => v?.is_active)
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

  // скролл вверх при смене slug
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">Загрузка товара…</div>
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

  const current = variants.find(v => v.id === activeVariantId) ?? null;

  // Фото: фото варианта > фото товара
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray<string>(product.gallery_urls);
  const images = [baseImg, ...gallery.filter(src => src !== baseImg)];
  const imagesLen = images.length || 1;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useEffect(() => setSelectedImageIndex(0), [baseImg]);

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

  const favKey = `v:${product.id}`;
  const isFav = isFavorite(favKey);

  const descriptionText = [
    product.description?.trim(),
    product.detailed_description?.trim(),
    current?.description?.trim(),
    current?.composition?.trim(),
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
    toast({ title: 'Добавлено в корзину', description: `${product.name} (${current.title}) добавлен в корзину` });
  };

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center">
          {/* Галерея */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden aspect-[5/4] max-h-[75vh] lg:max-h-[72vh] mx-auto">
              <img src={images[selectedImageIndex] || baseImg} alt={product.name} className="w-full h-full object-contain" />
              {imagesLen > 1 && (
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

            {imagesLen > 1 && (
              <div className="flex justify-center gap-2 flex-wrap">
                {images.map((src, idx) => (
                  <Card
                    key={src + idx}
                    className={`cursor-pointer overflow-hidden aspect-square h-16 md:h-20 transition-all ${
                      selectedImageIndex === idx ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img src={src} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Информация + действия */}
          <div className="space-y-6 lg:self-center lg:max-w-[560px] lg:mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-[#819570]">{(product.name || '').toUpperCase()}</h1>

            <div className="text-2xl font-bold text-[#819570]">
              {current ? fmt(current.price) : fmt(product.min_price_cache)}
            </div>

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
                        className={`rounded-full px-4 py-2 border text-sm transition ${active ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted'}`}
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

            <div className="flex items-center gap-3">
              {product.is_active ? (
                <Button onClick={handleAddToCart} className="h-10 rounded-full px-6 text-sm font-medium">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Добавить в корзину
                </Button>
              ) : (
                <Button onClick={() => window.open('https://wa.me/message/XQDDWGSEL35LP1', '_blank')} className="h-10 rounded-full px-6 text-sm font-medium">
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
                    toast({ title: 'Удалено из избранного', description: `${product.name} удалён из избранного` });
                  } else {
                    addToFavorites({
                      id: favKey,
                      name: product.name,
                      price: current?.price ?? product.min_price_cache ?? 0,
                      image: current?.image_url || product.image_url || '/placeholder.svg',
                      description: current?.composition || product.description || '',
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
                className={`h-10 w-10 rounded-full ${isFav ? 'bg-destructive text-destructive-foreground' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </Button>
            </div>

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

            {descriptionText ? (
              <div className="pt-1 md:-ml-1 lg:-ml-2">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{descriptionText}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* РЕКОМЕНДАЦИИ — отдельный «тупой» компонент без сторонних хуков */}
        <div className="container mx-auto px-4">
          <VariantRecsGrid productId={product.id} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────  РЕКОМЕНДАЦИИ (без хуков контекста)  ───────────────────── */
type VPLite = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  min_price_cache: number | null;
  is_active: boolean | null;
};

function VariantRecsGrid({ productId, limit = 8 }: { productId: number; limit?: number }) {
  const [items, setItems] = useState<VPLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');

        const { data: links, error: e1 } = await supabase
          .from('variant_product_categories')
          .select('category_id')
          .eq('product_id', productId);
        if (e1) throw e1;

        const catIds = (links ?? []).map((r: any) => r.category_id as string);
        let recs: VPLite[] = [];

        if (catIds.length) {
          const { data: others, error: e2 } = await supabase
            .from('variant_product_categories')
            .select('product_id, category_id')
            .in('category_id', catIds);
          if (e2) throw e2;

          const ids = Array.from(
            new Set((others ?? []).map((r: any) => r.product_id as number).filter((id) => id !== productId))
          );

          if (ids.length) {
            const { data, error: e3 } = await supabase
              .from('variant_products')
              .select('id, name, slug, image_url, min_price_cache, is_active, sort_order, created_at')
              .in('id', ids)
              .eq('is_active', true)
              .order('sort_order', { ascending: true })
              .order('created_at', { ascending: true })
              .limit(limit);
            if (e3) throw e3;
            recs = (data ?? []) as VPLite[];
          }
        }

        if (!recs.length) {
          const { data, error: e4 } = await supabase
            .from('variant_products')
            .select('id, name, slug, image_url, min_price_cache, is_active, sort_order, created_at')
            .eq('is_active', true)
            .neq('id', productId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(limit);
          if (e4) throw e4;
          recs = (data ?? []) as VPLite[];
        }

        if (!alive) return;
        setItems(recs);
        setLoading(false);
      } catch (err) {
        console.error('[VariantRecsGrid] error:', err);
        if (!alive) return;
        setItems([]);
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [productId, limit]);

  if (loading || !items.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Вам может понравиться</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <VariantFlowerCard
            key={`vrec:${p.id}`}
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              image_url: p.image_url,
              min_price_cache: p.min_price_cache,
              is_active: p.is_active,
            }}
          />
        ))}
      </div>
    </div>
  );
}
