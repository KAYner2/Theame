import { Marquee } from "./Marquee";
import { useState, useRef } from "react";
import { BrandingStrip } from "./BrandingStrip";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { slugify } from "@/utils/slugify";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ShoppingCart, Menu, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useCart();
  const { state: favoritesState } = useFavorites();

  // нормализация имён категорий
  const normalize = (name: string) => {
    if (!name) return "";
    const s = name.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const { data: categories = [] } = useCategories();
  const uniqueCats = Array.from(
    new Map(categories.map((c) => [normalize(c.name), c])).values()
  );

  // свайп для закрытия сайдбара
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
      {/* 1) Дорога — фикс сверху */}
      <div className="fixed inset-x-0 top-0 z-[60]">
        <Marquee
          text="осень за окном"
          href="https://theame.ru/catalog?category=sezon-podsolnuhov"
        />
      </div>

      {/* 2) Плашка навигации — фикс под дорогой, на всю ширину */}
      {/* top-9 = 36px (высота дороги). Убедись, что в Marquee стоит h-9 */}
      <div className="fixed inset-x-0 top-9 z-[55] bg-[#ffe9c3]">
        <div className="w-full h-12 flex items-center">
          {/* Слева: кнопка МЕНЮ */}
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

              {/* Левый сайдбар */}
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
                    {/* Страницы */}
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                        Страницы
                      </div>
                      <ul className="space-y-2">
                        <li>
                          <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                            Главная
                          </Link>
                        </li>
                        <li>
                          <Link to="/catalog" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                            Каталог
                          </Link>
                        </li>
                        <li>
                          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                            О нас
                          </Link>
                        </li>
                        <li>
                          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                            Контакты
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Категории */}
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                        Категории
                      </div>
                      <ul className="space-y-2">
                        <li>
                          <Link to="/catalog" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                            Каталог (все)
                          </Link>
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

                  {/* Низ сайдбара */}
                  <div className="mt-6 text-sm opacity-85 leading-relaxed">
                    <div>Сочи, Донская 10а</div>
                    <div>Пн–Вс с 09:00 до 21:00</div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Справа: CTA + корзина (верх), ниже инфо и иконки */}
          <div className="ml-auto pr-4">
            <div className="flex flex-col items-end gap-1.5 text-[#819570]">
              {/* ВЕРХ: «Заказать букет» + корзина */}
              <div className="flex items-center gap-4">
                <a
                  href="https://wa.me/message/XQDDWGSEL35LP1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uppercase text-sm font-medium tracking-wide"
                >
                  Заказать букет
                </a>

                <Button
                  variant="ghost"
                  className="relative h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
                  asChild
                >
                  <Link to="/cart" aria-label="Корзина">
                    <ShoppingCart className="w-5 h-5 text-[#819570]" />
                    {state.itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                        {state.itemCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </div>

              {/* ИНФО-БЛОК: 2 строки */}
              <div className="text-xs leading-snug tracking-wide text-right">
                <div>Режим работы: с 09:00 до 21:00</div>
                <div>Доставка букетов ~45 минут</div>
              </div>

              {/* ИКОНКИ: Instagram, Telegram, Избранное */}
              <div className="flex items-center gap-3 pt-0.5">
                <a
                  href="https://www.instagram.com/theame.flowers"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex"
                >
                  {/* минималистичный IG */}
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
                  <Heart className="w-5 h-5" color="#819570" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3) Спейсер под фикс-полосы (36 + 48 = 84px) */}
      <div className="h-[84px]" />

      {/* 4) Большая плашка ниже */}
      <BrandingStrip />
    </header>
  );
};
