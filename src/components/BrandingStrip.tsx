// src/components/BrandingStrip.tsx
import { Link, useLocation } from "react-router-dom";
import { Instagram, Send, Heart } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { slugify } from "@/utils/slugify";

/** Первая буква заглавная */
const normalize = (name: string) => {
  if (!name) return "";
  const s = name.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

type Props = {
  /** PNG/SVG без фона */
  flowerLeftSrc?: string;
  flowerRightSrc?: string;
};

export function BrandingStrip({ flowerLeftSrc, flowerRightSrc }: Props) {
  const { data: categories = [], isLoading, error } = useCategories();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const active = params.get("category");

  const unique = Array.from(
    new Map(categories.map((c) => [normalize(c.name), c])).values()
  );

  return (
    <div className="relative overflow-hidden bg-[#ffe9c3]">
      {/* ДЕКОР-ЦВЕТЫ — за контентом */}
      {flowerLeftSrc && (
        <img
          src={flowerLeftSrc}
          alt=""
          aria-hidden
          className="pointer-events-none select-none hidden md:block absolute left-0 md:left-3 top-2 md:top-1 h-24 md:h-32 lg:h-40 z-0"
        />
      )}
      {flowerRightSrc && (
        <img
          src={flowerRightSrc}
          alt=""
          aria-hidden
          className="pointer-events-none select-none hidden md:block absolute right-0 md:right-3 top-2 md:top-1 h-24 md:h-32 lg:h-40 z-0"
        />
      )}

      {/* ПРАВЫЙ ИНФО-БЛОК — ВНЕ container, чтобы прижать к правому краю секции */}
<div className="hidden md:block absolute top-5 right-6 z-20 text-[#819570] text-[13px] lg:text-sm leading-snug tracking-wide text-right">
  <div className="font-medium">Режим работы: с 09:00 до 21:00</div>
  <div>Доставка букетов ~45 минут</div>

  <div className="mt-2.5 flex items-center justify-end gap-3.5">
  <a
    href="https://www.instagram.com/theame.flowers"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    className="inline-flex text-[#819570]/95 hover:text-[#819570]"
  >
    <Instagram className="w-6 h-6 stroke-[1.6]" />
  </a>

  <a
    href="https://t.me/the_ame_flowers"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Telegram"
    className="inline-flex text-[#819570]/95 hover:text-[#819570]"
  >
    <Send className="w-6 h-6 stroke-[1.6]" />
  </a>

  <Link
    to="/favorites"
    aria-label="Избранное"
    className="inline-flex text-[#819570]/95 hover:text-[#819570]"
  >
    <Heart className="w-6 h-6 stroke-[1.6]" />
  </Link>
</div>
</div>

      {/* КОНТЕНТ */}
      <div className="relative z-10 container mx-auto px-4 md:px-10 lg:px-16 xl:px-24">
        <div className="pt-6 pb-4 md:pt-8 md:pb-5">
          {/* ЛОГО-ТЕКСТ */}
          <div className="text-center" style={{ fontFamily: "Forum, serif" }}>
            <Link to="/" className="block">
              <span className="text-[#819570] tracking-wide text-5xl md:text-7xl">
                The Áme
              </span>
            </Link>
          </div>

          {/* КАТЕГОРИИ — тонкие овальные чипсы */}
          <nav className="mt-5 md:mt-6 pb-6">
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5">
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-8 w-24 rounded-full bg-[#fff4e0] animate-pulse"
                    aria-hidden
                  />
                ))}

              {!isLoading && !error &&
                unique.map((c) => {
                  const name = normalize(c.name);
                  const slug = slugify(name);

                  const base =
                    "rounded-full border transition-colors px-4 sm:px-5 py-1.5 text-xs sm:text-sm";
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

          {/* Мобильная версия инфо-блока */}
          <div className="md:hidden mt-2 text-[#819570] text-sm leading-snug tracking-wide text-center">
            <div>Режим работы: с 09:00 до 21:00</div>
            <div>Доставка букетов ~45 минут</div>
            <div className="mt-2 flex items-center justify-center gap-4">
  <a
    href="https://www.instagram.com/theame.flowers"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    className="inline-flex"
  >
    <Instagram className="w-5 h-5 stroke-[1.6]" />
  </a>
  <a
    href="https://t.me/the_ame_flowers"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Telegram"
    className="inline-flex"
  >
    <Send className="w-5 h-5 stroke-[1.6]" />
  </a>
  <Link to="/favorites" aria-label="Избранное" className="inline-flex">
    <Heart className="w-5 h-5 stroke-[1.6]" />
  </Link>
</div>
          </div>
        </div>
      </div>

{/* Выемка/полукруг снизу — на всю ширину экрана */}
<div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-screen">
  <div className="h-[14px] md:h-[16px] bg-white rounded-t-[24px]" />
</div>
    </div>
  );
}
