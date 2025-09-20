// src/components/BrandingStrip.tsx
import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { slugify } from "@/utils/slugify";

/** Первая буква заглавная */
const normalize = (name: string) => {
  if (!name) return "";
  const s = name.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

type Props = {
  /** Опциональные изображения цветов по углам (PNG/SVG с прозрачностью) */
  flowerLeftSrc?: string;
  flowerRightSrc?: string;
};

export function BrandingStrip({
  flowerLeftSrc,
  flowerRightSrc,
}: Props) {
  const { data: categories = [], isLoading, error } = useCategories();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const active = params.get("category");

  // убираем дубли по имени
  const unique = Array.from(
    new Map(categories.map((c) => [normalize(c.name), c])).values()
  );

  return (
    <div className="relative bg-[#ffe9c3]">
      {/* Декор-цветы по углам (не мешают кликам) */}
      {flowerLeftSrc && (
        <img
          src={flowerLeftSrc}
          alt=""
          aria-hidden
          className="pointer-events-none select-none hidden md:block absolute left-2 top-0 h-24 lg:h-32"
        />
      )}
      {flowerRightSrc && (
        <img
          src={flowerRightSrc}
          alt=""
          aria-hidden
          className="pointer-events-none select-none hidden md:block absolute right-2 top-0 h-24 lg:h-32"
        />
      )}

      <div className="container mx-auto px-4">
        {/* ЛОГО-ТЕКСТ */}
        <div className="py-6 text-center">
          <Link to="/" className="block" style={{ fontFamily: "Forum, serif" }}>
            <span className="text-[#819570] tracking-wide text-5xl md:text-6xl">
              The Áme
            </span>
          </Link>
        </div>

        {/* КАТЕГОРИИ — чипсы */}
        <nav className="pb-5">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="h-9 w-28 rounded-full bg-[#fff4e0] animate-pulse"
                  aria-hidden
                />
              ))}

            {!isLoading && !error && unique.map((c) => {
              const name = normalize(c.name);
              const slug = slugify(name);

              const base =
                "rounded-full px-5 py-2 text-sm transition-colors border";
              const inactive =
                "text-[#819570] bg-[#fff4e0] hover:bg-white border-transparent";
              const activeCls =
                "text-[#819570] bg-white border-[#819570]";

              return (
                <Link
                  key={c.id}
                  to={`/catalog?category=${slug}`}
                  className={`${base} ${active === slug ? activeCls : inactive}`}
                  aria-label={`Категория ${name}`}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
