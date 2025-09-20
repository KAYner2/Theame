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
import { ShoppingCart, Menu, Heart, Instagram, Send } from "lucide-react";
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

  // свайп для закрытия сайдбара (в любую горизонтальную сторону)
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

      {/* 2) Плашка навигации (без лого) — фикс под дорогой, на всю ширину */}
      {/* top-9 = 36px (высота дороги). Убедись, что в Marquee стоит h-9 */}
      <div className="fixed inset-x-0 top-9 z-[55] bg-[#ffe9c3]">
        <div className="w-full h-12 flex items-center">
          {/* Слева: кнопка МЕНЮ — прижата к левому краю */}
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
                  {/* Лого-текст */}
                  <div className="mb-6" style={{ fontFamily: "Forum, serif" }}>
                    <div className="text-4xl leading-none">The Áme</div>
                  </div>

                  {/* Ссылки (прокручиваемая зона) */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                    {/* Страницы */}
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                        Страницы
                      </div>
                      <ul className="space-y-2">
                        <li>
                          <Link
                            to="/"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:opacity-80"
                          >
                            Главная
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/catalog"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:opacity-80"
                          >
                            Каталог
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/about"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:opacity-80"
                          >
                            О нас
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/contact"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:opacity-80"
                          >
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
                          <Link
                            to="/catalog"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:opacity-80"
                          >
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

                  {/* Нижний блок */}
                  <div className="mt-6 text-sm opacity-85 leading-relaxed">
                    <div>Сочи, Донская 10а</div>
                    <div>Пн–Вс с 09:00 до 21:00</div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Справа: соцсети / избранное / корзина — прижаты к правому краю */}
          <div className="ml-auto flex items-center gap-1.5 md:gap-2 pr-2">
            {/* Instagram */}
            <Button
              variant="ghost"
              className="hidden md:inline-flex h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
              aria-label="Instagram"
            >
              <a
                href="https://www.instagram.com/theame.flowers"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </Button>

            {/* Telegram */}
            <Button
              variant="ghost"
              className="hidden md:inline-flex h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
              aria-label="Telegram"
            >
              <a
                href="https://t.me/the_ame_flowers"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="w-5 h-5" />
              </a>
            </Button>

            {/* WhatsApp */}
            <Button
              variant="ghost"
              className="hidden md:inline-flex h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
              aria-label="WhatsApp"
            >
              <a
                href="https://wa.me/message/XQDDWGSEL35LP1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945Л.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z" />
                </svg>
              </a>
            </Button>

            {/* Избранное */}
            <Button
              variant="ghost"
              className="relative h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
            >
              <Link to="/favorites" aria-label="Избранное">
                <Heart className="w-5 h-5" />
                {favoritesState.itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {favoritesState.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Корзина */}
            <Button
              variant="ghost"
              className="relative h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
              asChild
            >
              <Link to="/cart" aria-label="Корзина">
                <ShoppingCart className="w-5 h-5" />
                {state.itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {state.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 3) Спейсер под фикс-полосы (36 + 48 = 84px) */}
      <div className="h-[84px]" />

      {/* 4) Большая плашка (логотип + чипсы категорий) — обычная секция ниже */}
      <BrandingStrip />
    </header>
  );
};
