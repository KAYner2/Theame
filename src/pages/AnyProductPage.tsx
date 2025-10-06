import { lazy, Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// лениво подгружаем страницы, чтобы избежать побочек от импортов
const SimplePage = lazy(() => import("./ProductPage"));
const VariantPage = lazy(() => import("./VariantProductPage"));

export default function AnyProductPage() {
  // поддержим оба варианта параметров: /catalog/:productSlug и /v/:slug
  const params = useParams();
  const slug =
    (params as any).slug ??
    (params as any).productSlug ??
    (params as any).productId ?? // про запас
    "";

  const [mode, setMode] = useState<"loading" | "variant" | "simple" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!slug) {
          if (alive) setMode("notfound");
          return;
        }
        // динамический импорт клиента supabase (безопасно)
        const { supabase } = await import("@/integrations/supabase/client");

        // просто проверяем «существует ли variant_product с таким slug»
        const { data, error } = await supabase
          .from("variant_products")
          .select("id")
          .eq("slug", slug)
          .limit(1);

        if (error) throw error;

        const isVariant = Array.isArray(data) && data.length > 0;
        if (alive) setMode(isVariant ? "variant" : "simple");
      } catch {
        // в случае ошибки не блокируем пользователя — рендерим простую страницу
        if (alive) setMode("simple");
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const Fallback = (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 py-8 text-center">Загрузка…</div>
    </div>
  );

  if (mode === "loading") return Fallback;
  if (mode === "notfound") return Fallback;

  return (
    <Suspense fallback={Fallback}>
      {mode === "variant" ? <VariantPage /> : <SimplePage />}
    </Suspense>
  );
}
