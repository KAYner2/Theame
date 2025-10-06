import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type VP = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  min_price_cache: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
};

const fmt = (n?: number | null) =>
  typeof n === "number" ? `${n.toLocaleString("ru-RU")} ₽` : "";

export function VariantRecommendations({ productId, limit = 8 }: { productId: number; limit?: number }) {
  const [items, setItems] = useState<VP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");

        // 1) категории текущего variant-продукта
        const { data: links, error: e1 } = await supabase
          .from("variant_product_categories")
          .select("category_id")
          .eq("product_id", productId);
        if (e1) throw e1;

        const catIds = (links ?? []).map((r) => r.category_id);

        let recs: VP[] = [];

        if (catIds.length) {
          // 2) найдём другие product_id из тех же категорий
          const { data: otherLinks, error: e2 } = await supabase
            .from("variant_product_categories")
            .select("product_id, category_id")
            .in("category_id", catIds);
          if (e2) throw e2;

          const ids = Array.from(
            new Set(
              (otherLinks ?? [])
                .map((r) => r.product_id as number)
                .filter((id) => id !== productId)
            )
          );

          if (ids.length) {
            const { data, error: e3 } = await supabase
              .from("variant_products")
              .select("id, name, slug, image_url, min_price_cache, is_active, sort_order, created_at")
              .in("id", ids)
              .eq("is_active", true)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true })
              .limit(limit);
            if (e3) throw e3;
            recs = (data ?? []) as VP[];
          }
        }

        // 3) если по категориям пусто — просто подкидываем свежие активные
        if (!recs.length) {
          const { data, error: e4 } = await supabase
            .from("variant_products")
            .select("id, name, slug, image_url, min_price_cache, is_active, sort_order, created_at")
            .eq("is_active", true)
            .neq("id", productId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true })
            .limit(limit);
          if (e4) throw e4;
          recs = (data ?? []) as VP[];
        }

        if (!alive) return;
        setItems(recs);
        setLoading(false);
      } catch (err) {
        console.error("[VariantRecommendations] error:", err);
        if (!alive) return;
        setItems([]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [productId, limit]);

  if (loading || !items.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Вам может понравиться</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <Link key={p.id} to={`/v/${p.slug}`} className="block group">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
              <img
                src={p.image_url || "/placeholder.svg"}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition"
              />
            </div>
            <div className="mt-2 text-sm">{p.name}</div>
            <div className="text-sm font-medium text-[#819570]">
              {p.min_price_cache != null ? `от ${fmt(p.min_price_cache)}` : "Цена по запросу"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
