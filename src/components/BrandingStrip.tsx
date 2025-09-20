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

      {/* КОНТЕНТ — потолще плашка + отступы, чтобы цветы не наезжали */}
      <div className="relative z-10 container mx-auto px-4 md:px-10 lg:px-16 xl:px-24">
        {/* ПРАВЫЙ ИНФО-БЛОК — часть этой секции */}
        <div className="hidden md:block fixed top-[calc(84px+16px)] right-6 text-[#819570] text-xs leading-snug tracking-wide text-right">
          <div>Режим работы: с 09:00 до 21:00</div>
          <div>Доставка букетов ~45 минут</div>

          <div className="mt-2 flex items-center justify-end gap-3">
            <a
              href="https://www.instagram.com/theame.flowers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5Z" stroke="#819570" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3.5" stroke="#819570" strokeWidth="1.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="#819570" />
              </svg>
            </a>

            <a
              href="https://t.me/the_ame_flowers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="inline-flex"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M21.7 3.3L2.8 10.6c-.9.35-.88 1.66.04 1.97l4.73 1.62 1.83 4.87c.34.9 1.59.97 2 .11l2.52-5.01 4.8-7.68c.53-.85-.3-1.88-1.52-1.58Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </a>

            <Link to="/favorites" aria-label="Избранное" className="inline-flex">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-4.35-9.5-8.21C.83 10.03 2.2 6.5 5.6 6.5c2.05 0 3.4 1.22 4 2.22.6-1 1.95-2.22 4-2.22 3.4 0 4.77 3.53 3.1 6.29C19 16.65 12 21 12 21Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* толщина плашки */}
        <div className="pt-8 pb-6 md:pt-12 md:pb-8">
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
          <div className="md:hidden mt-2 text-[#819570] text-xs leading-snug tracking-wide text-center">
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
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5Z" stroke="#819570" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.5" stroke="#819570" strokeWidth="1.5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="#819570" />
                </svg>
              </a>
              <a
                href="https://t.me/the_ame_flowers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="inline-flex"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M21.7 3.3L2.8 10.6c-.9.35-.88 1.66.04 1.97l4.73 1.62 1.83 4.87c.34.9 1.59.97 2 .11l2.52-5.01 4.8-7.68c.53-.85-.3-1.88-1.52-1.58Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </a>
              <Link to="/favorites" aria-label="Избранное" className="inline-flex">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-4.35-9.5-8.21C.83 10.03 2.2 6.5 5.6 6.5c2.05 0 3.4 1.22 4 2.22.6-1 1.95-2.22 4-2.22 3.4 0 4.77 3.53 3.1 6.29C19 16.65 12 21 12 21Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
