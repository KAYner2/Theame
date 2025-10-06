import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type VariantProduct = {
  id: number; name: string; slug: string;
  description: string | null; detailed_description: string | null;
  image_url: string | null; gallery_urls: string[] | null;
  is_active: boolean | null; min_price_cache: number | null;
};
type Variant = {
  id: number; product_id: number; title: string;
  composition: string | null; price: number | null;
  image_url: string | null; is_active: boolean; sort_order: number | null;
};

const formatPrice = (n?: number | null) =>
  typeof n === 'number' ? `${n.toLocaleString('ru-RU')} ₽` : '';

export default function VariantProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [product, setProduct] = useState<VariantProduct | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

  // ⚠️ НИКАКИХ статических импортов supabase/UI — грузим динамически
  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(null);

    (async () => {
      try {
        if (!slug) throw new Error('Не указан slug');

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

        const all = (data.product_variants ?? []) as Variant[];
        const vs = all.filter(v => v.is_active)
          .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .slice(0, 10);

        if (!alive) return;
        const { product_variants, ...rest } = data;
        setProduct(rest as VariantProduct);
        setVariants(vs);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        console.error('[probe] load error:', e);
        setErr(e?.message || 'Ошибка загрузки');
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  const defaultVariantId = useMemo(
    () => (variants.length ? variants[0].id : null), [variants]
  );
  const [activeId, setActiveId] = useState<number | null>(defaultVariantId);
  useEffect(() => setActiveId(defaultVariantId), [defaultVariantId]);

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
  const price = current ? formatPrice(current.price) : formatPrice(product.min_price_cache);

  return (
    <div className="container py-10" style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>{product.name}</h1>
      <div style={{ fontSize: 20, margin: '8px 0 16px' }}>{price}</div>

      {/* кружки вариантов — чистые <button>, без UI-библиотек */}
      {variants.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {variants.map(v => {
            const active = v.id === activeId;
            return (
              <button
                key={v.id}
                onClick={() => setActiveId(v.id)}
                style={{
                  border: '1px solid',
                  borderColor: active ? '#6b8e23' : '#ccc',
                  borderRadius: 999, padding: '6px 12px',
                  background: active ? '#eef7e6' : '#fff'
                }}
                title={v.title}
              >
                {v.title}
              </button>
            );
          })}
        </div>
      )}

      {current?.composition && (
        <pre style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.6 }}>
          {current.composition}
        </pre>
      )}
    </div>
  );
}
