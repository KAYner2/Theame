import { Marquee } from "./Marquee";
import { useState, useRef, useEffect } from "react";
import { BrandingStrip } from "./BrandingStrip";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { slugify } from "@/utils/slugify";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ShoppingCart, Menu } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useCart();
  const { state: favoritesState } = useFavorites(); // оставил как было, даже если пока не используешь
  const location = useLocation();

  // ГЛАВНЫЙ ФИКС: закрываем боковое меню/оверлей при любой навигации
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const normalize = (name: string) => {
    if (!name) return "";
    const s = name.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const { data: categories = [] } = useCategories();
  const uniqueCats = Array.from(
    new Map(categories.map((c) => [normalize(c.name), c])).values()
  );

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const THRESHOLD = 60;
    if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      setIsMenuOpen(false);
      touchStartRef.current = null;
    }
  };
  const onTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <header className="relative z-50">
      {/* 1) Дорога */}
      <div className="fixed inset-x-0 top-0 z-[60]">
        <Marquee
          text="осенняя коллекция"
          href="https://theame.ru/catalog?category=osennyaya-kollektsiya"
          speed={50}
        />
      </div>

      {/* 2) Верхняя плашка */}
      <div className="fixed inset-x-0 top-9 z-[55] bg-[#ffe9c3]">
        <div className="w-full h-12 flex items-center">
          {/* Меню слева */}
          <div className="pl-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(true)}
                  className="inline-flex items-center gap-2 select-none"
                >
                  <Menu className="w-6 h-6 text-[#819570]" strokeWidth={2} />
                  <span className="text-sm font-medium tracking-wide text-[#819570] uppercase">
                    Меню
                  </span>
                </button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="bg-[#ffe9c3] text-[#819570] w-[80vw] sm:w-[65vw] md:w-[22rem] lg:w-[26rem] max-w-[420px] p-6"
              >
                <div
                  className="h-full flex flex-col touch-pan-y"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div className="mb-6" style={{ fontFamily: "Forum, serif" }}>
                    <div className="text-4xl leading-none">The Áme</div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                        Страницы
                      </div>
                      <ul className="space-y-2">
                        <li>
                          <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">Главная</Link>
                        </li>
                        <li>
                          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">О нас</Link>
                        </li>
                        <li>
                          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">Контакты</Link>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                        Категории
                      </div>
                      <ul className="space-y-2">
                        <li>
                          <Link to="/catalog" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">Каталог</Link>
                        </li>
                        {uniqueCats.map((c) => {
                          const name = normalize(c.name);
                          const slug = slugify(name);
                          return (
                            <li key={c.id}>
                              <Link
                                to={`/catalog?category=${slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="hover:opacity-80"
                              >
                                {name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 text-sm opacity-85 leading-relaxed">
                    <div>Сочи, Донская 10а</div>
                    <div>Пн–Вс с 09:00 до 21:00</div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Справа: Заказать букет + корзина */}
          <div className="ml-auto flex items-center gap-1.5 md:gap-2 pr-4">
            <a
              href="https://wa.me/message/XQDDWGSEL35LP1"
              target="_blank"
              rel="noopener noreferrer"
              className="uppercase text-sm font-medium text-[#819570] tracking-wide mr-4 no-underline hover:opacity-90"
            >
              Заказать букет
            </a>

            <Button
              variant="ghost"
              className="relative h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
            >
              <Link to="/cart" aria-label="Корзина">
                <ShoppingCart className="w-5 h-5" />
                {state.itemCount > 0 && (
  <Badge
    className="
      absolute top-0 right-0
      h-5 w-5 text-[11px] p-0
      flex items-center justify-center
      bg-[#819570] text-white
      border border-[#ffe9c3] shadow-sm
      rounded-full
    "
  >
    {state.itemCount}
  </Badge>
)}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 3) Спейсер (36 + 48) */}
      <div className="h-[84px]" />

      {/* 4) Бренд-плашка */}
      <BrandingStrip
        flowerLeftSrc="/branding/flower-left.png"
        flowerRightSrc="/branding/flower-right.png"
      />
    </header>
  );
};
