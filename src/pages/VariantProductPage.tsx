import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ── Флаги для изоляции проблемных импортов
const USE_UI = true;           // переключай на false, если подозрение на Button/Card
const USE_CART_FAV = false;     // переключай на false, если подозрение на контексты
const USE_RECS = true;         // переключай на false, если подозрение на рекомендации

// Ленивая подгрузка рекомендаций (если модуль внутри делает что-то «не так», просто выключим флагом)
const LazyRecommendations = React.lazy(() => import('@/components/ProductRecommendations').then(m => ({ default: m.ProductRecommendations })));

type VP = {
  id: number; name: string; slug: string;
  description: string | null; detailed_description: string | null;
  image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean | null; min_price_cache: number | null;
};
type PV = {
  id: number; product_id: number; title: string;
  composition: string | null; description: string | null;
  price: number | null; image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean; sort_order: number | null;
};

const asArray = <T,>(v: T[] | T | null | undefined): T[] => Array.isArray(v) ? v : v ? [v] : [];
const formatPrice = (n?: number | null) => typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // UI-компоненты подключаем только когда разрешено
  const UI = (USE_UI
    ? {
        Button: require('@/components/ui/button').Button,
        Card: require('@/components/ui/card').Card,
        ChevronLeft: require('lucide-react').ChevronLeft,
        ChevronRight: require('lucide-react').ChevronRight,
        Heart: require('lucide-react').Heart,
        ShoppingBag: require('lucide-react').ShoppingBag,
      }
    : null) as any;

  // Контексты корзины и избранного — тоже опционально (если выключены, используем заглушки)
  const cartCtx = (USE_CART_FAV ? require('@/context/CartContext') : null) as any;
  const favCtx = (USE_CART_FAV ? require('@/context/FavoritesContext') : null) as any;
  const useCart = USE_CART_FAV ? cartCtx.useCart : () => ({ addToCart: (_: any) => {} });
  const useFavorites = USE_CART_FAV ? favCtx.useFavorites : () => ({
    addToFavorites: (_: any) => {},
    removeFromFavorites: (_: string) => {},
    isFavorite: (_: string) => false,
  });
  const toast = (require('@/hooks/use-toast').toast) as (args: { title: string; description?: string }) => void;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [product, setProduct] = useState<VP | null>(null);
  const [variants, setVariants] = useState<PV[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  // ── ДИНАМИЧЕСКИЙ импорт supabase (исключаем побочки при static import)
  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(null);

    (async () => {
      try {
        if (!slug) throw new Error('Не указан slug');

        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await (supabase as any)
          .from('variant_products')
          .select(`
            *,
            product_variants:product_variants (
              id, product_id, title, composition, description, price, image_url, gallery_urls,
              is_active, sort_order, created_at, updated_at
            ),
            variant_product_categories:variant_product_categories (
              category_id,
              categories:categories ( name )
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Товар не найден');

        const all = (data.product_variants ?? []) as PV[];
        const vs = all
          .filter(v => v?.is_active)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .slice(0, 10);

        const cats = ((data.variant_product_categories ?? []) as any[])
          .map((row) => row?.categories?.name)
          .filter(Boolean) as string[];

        if (!alive) return;
        const { product_variants, variant_product_categories, ...rest } = data;
        setProduct(rest as VP);
        setVariants(vs);
        setCategoryNames(cats);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        console.error('[VariantProductPage] load error:', e);
        setLoadError(e?.message || 'Ошибка загрузки');
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  // ── дефолтный вариант
  const defaultVariantId = useMemo(() => (variants.length ? variants[0].id : null), [variants]);
  const [activeVariantId, setActiveVariantId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveVariantId(defaultVariantId), [defaultVariantId]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  // ── Заглушки UI если USE_UI=false
  const HtmlButton = (props: any) => <button {...props} />;
  const HtmlCard: React.FC<React.ComponentProps<'div'>> = ({ children, className, ...rest }) =>
    <div className={`border rounded ${className || ''}`} {...rest}>{children}</div>;

  const Button = USE_UI ? UI.Button : HtmlButton;
  const Card   = USE_UI ? UI.Card   : HtmlCard;
  const ChevronLeft  = USE_UI ? UI.ChevronLeft  : (() => null);
  const ChevronRight = USE_UI ? UI.ChevronRight : (() => null);
  const Heart        = USE_UI ? UI.Heart        : (() => null);
  const ShoppingBag  = USE_UI ? UI.ShoppingBag  : (() => null);

  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  if (loading) {
    return <div className="min-h-screen bg-[#fff8ea]"><div className="container mx-auto px-4 py-8 text-center">Загрузка товара…</div></div>;
  }
  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-2xl font-bold mb-4">{loadError || 'Товар не найден'}</div>
          <Button onClick={() => navigate('/catalog')}>В каталог</Button>
        </div>
      </div>
    );
  }

  const current = variants.find(v => v.id === activeVariantId) ?? null;
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray<string>(product.gallery_urls);
  const images  = [baseImg, ...gallery.filter(src => src !== baseImg)];
  const imagesLen = images.length || 1;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useEffect(() => setSelectedImageIndex(0), [baseImg]);

  const nextImage = () => setSelectedImageIndex(i => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex(i => (i - 1 + imagesLen) % imagesLen);

  const favKey = `v:${product.id}`;
  const isFav  = isFavorite(favKey);

  const descriptionText = [
    product.description?.trim(),
    product.detailed_description?.trim(),
    current?.composition?.trim(),
  ].filter(Boolean).join('\n\n');

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center">
          {/* Галерея */}
          <div className="space-y-4">
            <Card className="relative overflow-hidden aspect-[5/4] max-h-[75vh] lg:max-h-[72vh] mx-auto">
              <img src={images[selectedImageIndex] || baseImg} alt={product.name} className="w-full h-full object-contain" />
              {imagesLen > 1 && USE_UI && (
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

          {/* Инфо */}
          <div className="space-y-6 lg:self-center lg:max-w-[560px] lg:mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-[#819570]">{(product.name || '').toUpperCase()}</h1>

            <div className="text-2xl font-bold text-[#819570]">
              {current ? formatPrice(current.price) : formatPrice(product.min_price_cache)}
            </div>

            {/* Кружки вариантов */}
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
                  onClick={() => {
                    const cur = variants.find(v => v.id === activeVariantId);
                    if (!cur) {
                      toast({ title: 'Выберите вариант', description: 'Чтобы добавить в корзину, укажите вариант.' });
                      return;
                    }
                    addToCart({
                      id: `vp:${product.id}:${cur.id}`,
                      name: `${product.name} — ${cur.title}`,
                      price: cur.price || 0,
                      image: cur.image_url || product.image_url || '/placeholder.svg',
                      description: cur.composition || product.description || '',
                      category: categoryNames[0] || 'Разное',
                      inStock: product.is_active,
                      quantity: 1, colors: [], size: cur.title, occasion: [],
                    } as any);
                    toast({ title: 'Добавлено в корзину', description: `${product.name} (${cur.title}) добавлен в корзину` });
                  }}
                  className="h-10 rounded-full px-6 text-sm font-medium"
                >
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
                    const cur = variants.find(v => v.id === activeVariantId);
                    addToFavorites({
                      id: favKey,
                      name: product.name,
                      price: cur?.price ?? product.min_price_cache ?? 0,
                      image: cur?.image_url || product.image_url || '/placeholder.svg',
                      description: cur?.composition || product.description || '',
                      category: categoryNames[0] || 'Разное',
                      inStock: product.is_active,
                      quantity: 1, colors: [], size: cur?.title || 'variant', occasion: [],
                    } as any);
                    toast({ title: 'Добавлено в избранное', description: `${product.name} добавлен в избранное` });
                  }
                }}
                className={`h-10 w-10 rounded-full ${isFav ? 'bg-destructive text-destructive-foreground' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Состав */}
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

            {/* Описание */}
            {(product.description || product.detailed_description) && (
              <div className="pt-1 md:-ml-1 lg:-ml-2">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {[product.description, product.detailed_description].filter(Boolean).join('\n\n')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Рекомендации (лениво, безопасно выключаются флагом) */}
        {USE_RECS && (
          <div className="container mx-auto px-4">
            <Suspense fallback={null}>
              {product?.id ? <LazyRecommendations productId={String(product.id)} /> : null}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
