import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type VP = Database['public']['Tables']['variant_products']['Row'];
type PV = Database['public']['Tables']['product_variants']['Row'];

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const formatPrice = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  // ❗ хуки только на верхнем уровне компонента
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [product, setProduct] = useState<VP | null>(null);
  const [variants, setVariants] = useState<PV[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  // загрузка: один nested-select без react-query
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        if (!slug) throw new Error('Не указан slug');

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

        const allVariants = (data.product_variants ?? []) as PV[];
        const activeSorted = allVariants
          .filter(v => v?.is_active)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .slice(0, 10);

        const cats = ((data.variant_product_categories ?? []) as any[])
          .map((row) => row?.categories?.name)
          .filter(Boolean) as string[];

        if (!alive) return;
        const { product_variants, variant_product_categories, ...rest } = data;
        setProduct(rest as VP);
        setVariants(activeSorted);
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

  // дефолт — первый активный вариант
  const defaultVariantId = useMemo(
    () => (variants.length ? variants[0].id : null),
    [variants]
  );
  const [activeVariantId, setActiveVariantId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveVariantId(defaultVariantId), [defaultVariantId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8ea]">
        <div className="container mx-auto px-4 py-8 text-center">Загрузка товара…</div>
      </div>
    );
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

  // фото: своё у варианта → иначе фото товара
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray<string>(product.gallery_urls);
  const images = [baseImg, ...gallery.filter(src => src !== baseImg)];
  const imagesLen = images.length || 1;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useEffect(() => setSelectedImageIndex(0), [baseImg]);

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

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
                    <img src={src} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Инфо */}
          <div className="space-y-6 lg:self-center lg:max-w-[560px] lg:mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-[#819570]">
              {(product.name || '').toUpperCase()}
            </h1>

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

            {/* Состав (вариант) */}
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

        {/* рекомендации вернём шагом Б */}
      </div>
    </div>
  );
}
