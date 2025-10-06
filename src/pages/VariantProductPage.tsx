import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useCart } from '@/context/CartContext'

import { useFavorites } from '@/context/FavoritesContext'

import { toast } from '@/hooks/use-toast'

import { ProductRecommendations } from '@/components/ProductRecommendations'

type VP = {
  id: number; name: string; slug: string;
  description: string | null; detailed_description: string | null;
  image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean | null; min_price_cache: number | null;
};
type PV = {
  id: number; product_id: number; title: string;
  composition: string | null; price: number | null;
  image_url: string | null; is_active: boolean; sort_order: number | null;
};

const asArray = <T,>(v: T[] | T | null | undefined): T[] => Array.isArray(v) ? v : v ? [v] : [];
const fmt = (n?: number | null) => typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [product, setProduct] = useState<VP | null>(null);
  const [variants, setVariants] = useState<PV[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(null);

    (async () => {
      try {
        if (!slug) throw new Error('Не указан slug');

        // ❗ динамический импорт supabase
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await (supabase as any)
          .from('variant_products')
          .select(`
            *,
            product_variants:product_variants (
              id, product_id, title, composition, price, image_url, is_active, sort_order
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single();
        if (error) throw error;
        if (!data) throw new Error('Товар не найден');

        const all = (data.product_variants ?? []) as PV[];
        const vs = all.filter(v => v.is_active)
          .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .slice(0, 10);

        if (!alive) return;
        const { product_variants, ...rest } = data;
        setProduct(rest as VP);
        setVariants(vs);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        console.error('[VariantPage] load error:', e);
        setErr(e?.message || 'Ошибка загрузки');
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  const defaultVariantId = useMemo(() => (variants.length ? variants[0].id : null), [variants]);
  const [activeId, setActiveId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveId(defaultVariantId), [defaultVariantId]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (loading) return <div className="container py-10">Загрузка…</div>;
  if (err || !product) {
    return (
      <div className="container py-10">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{err || 'Товар не найден'}</div>
        <button onClick={() => navigate('/catalog')}>В каталог</button>
      </div>
    );
  }

  const current = variants.find(v => v.id === activeId) ?? null;
  const baseImg = (current?.image_url || product.image_url || '/placeholder.svg') as string;
  const gallery = asArray(product.gallery_urls);
  const images = [baseImg, ...gallery.filter(src => src !== baseImg)];

  return (
    <div className="container py-10" style={{ maxWidth: 980 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{product.name}</h1>
      <div style={{ fontSize: 20, marginBottom: 16 }}>
        {current ? fmt(current.price) : fmt(product.min_price_cache)}
      </div>

      {/* Фото + превью */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', aspectRatio: '5/4' }}>
            <img src={baseImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {images.map((src, idx) => (
                <div key={src + idx} style={{ border: '1px solid #eee', borderRadius: 8, width: 72, height: 72, overflow: 'hidden', cursor: 'pointer' }}>
                  <img src={src} alt={`${product.name} ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Кружки вариантов */}
          {variants.length > 1 && (
            <>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Варианты</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {variants.map(v => {
                  const active = v.id === activeId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveId(v.id)}
                      style={{
                        border: '1px solid',
                        borderColor: active ? '#6b8e23' : '#d1d5db',
                        background: active ? '#eef7e6' : '#fff',
                        borderRadius: 999, padding: '6px 12px', fontSize: 14
                      }}
                      title={v.title}
                    >
                      {v.title}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Состав выбранного варианта */}
          {current?.composition && (
            <div style={{ marginTop: 12 }}>
              {current.composition.split('\n').map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, background: '#6b8e23', borderRadius: '50%' }} />
                  <span>{line.trim()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Общее описание */}
          {(product.description || product.detailed_description) && (
            <div style={{ marginTop: 20, whiteSpace: 'pre-wrap', color: '#6b7280' }}>
              {[product.description, product.detailed_description].filter(Boolean).join('\n\n')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
