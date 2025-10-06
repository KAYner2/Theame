import { useParams, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useVariantProductBySlug } from '@/hooks/useVariantProductBySlug';

const asArray = <T,>(v: T[] | T | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

const formatPrice = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  // ❗ все хуки — только на верхнем уровне компонента
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useVariantProductBySlug(slug);
  const product = data?.product;
  const variants = data?.variants ?? [];
  const categoryNames = data?.categoryNames ?? [];

  // первый активный вариант дефолтно
  const defaultVariantId = useMemo(
    () => (variants.length ? variants[0].id : null),
    [variants]
  );
  const [activeVariantId, setActiveVariantId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveVariantId(defaultVariantId), [defaultVariantId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
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

  // Фото: своё у варианта → иначе общее у товара
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray<string>(product.gallery_urls);
  const images = [baseImg, ...gallery.filter(src => src !== baseImg)];
  const imagesLen = images.length || 1;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  useEffect(() => setSelectedImageIndex(0), [baseImg]);

  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % imagesLen);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + imagesLen) % imagesLen);

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

            {/* Состав/описание */}
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

            {(product.description || product.detailed_description) && (
              <div className="pt-1 md:-ml-1 lg:-ml-2">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {[product.description, product.detailed_description].filter(Boolean).join('\n\n')}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Рекомендации добавим на шаге 3 */}
      </div>
    </div>
  );
}
