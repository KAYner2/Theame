import * as React from "react";
import { useParams } from "react-router-dom";
import { useVariantProductBySlug } from "@/hooks/useVariantProductBySlug";

const formatPrice = (n?: number | null) =>
  typeof n === "number" ? n.toLocaleString("ru-RU") + " ₽" : "";

export default function VariantProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useVariantProductBySlug(slug);

  const [activeId, setActiveId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (data?.variants?.length) {
      // По умолчанию выбираем первый активный вариант
      setActiveId(data.variants[0].id);
    } else {
      setActiveId(null);
    }
  }, [data?.variants]);

  if (isLoading) return <div className="container py-8">Загрузка…</div>;
  if (isError) {
    console.error(error);
    return <div className="container py-8">Ошибка загрузки товара</div>;
  }
  if (!data) return null;

  const { product, variants } = data;
  const current = variants.find(v => v.id === activeId) ?? null;

  // Фото: если у варианта есть своё — показываем его, иначе — общее фото товара
  const mainImage = current?.image_url || product.image_url;

  return (
    <div className="container py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Фото */}
      <div>
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full aspect-square object-cover rounded-lg"
          />
        ) : (
          <div className="w-full aspect-square rounded-lg bg-muted" />
        )}
      </div>

      {/* Текст и варианты */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{product.name}</h1>

        {/* Цена */}
        <div className="text-xl">
          {current ? formatPrice(current.price) : formatPrice(product.min_price_cache)}
        </div>

        {/* Кружки вариантов (до 10). Если 1 вариант — не показываем. */}
        {variants.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Варианты</div>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => {
                const active = v.id === activeId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveId(v.id)}
                    className={`rounded-full px-4 py-2 border text-sm transition
                      ${active ? "border-primary ring-2 ring-primary" : "hover:bg-muted"}`}
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

        {/* Состав/описание — зависит от выбранного варианта */}
        {current?.composition && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Состав</div>
            <div>{current.composition}</div>
          </div>
        )}

        {/* Общие описания товара (если используешь) */}
        {product.detailed_description && (
          <div className="prose max-w-none">
            <div className="text-sm text-muted-foreground mb-1">Описание</div>
            <div>{product.detailed_description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
