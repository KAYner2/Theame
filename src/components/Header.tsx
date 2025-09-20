import logoUrl from '@/assets/logo.png';
import { Marquee } from "./Marquee";
import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from './ui/sheet';
import {
  ShoppingCart,
  Menu,
  Heart,
  Instagram,
  Send,
  MessageCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { state } = useCart();
  const { state: favoritesState } = useFavorites();

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({
    to,
    children,
    className = '',
    onClick,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive(to)
          ? 'bg-primary text-primary-foreground shadow-soft'
          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
      } ${className}`}
    >
      {children}
    </Link>
  );

  // ==== свайп-для-закрытия (вправо) только для мобильного шита ====
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

    const THRESHOLD = 60; // px
    if (dx > THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      setIsMenuOpen(false);
      touchStartRef.current = null;
    }
  };

  const onTouchEnd = () => {
    touchStartRef.current = null;
  };
  // =================================================================

  return (
    <header className="sticky top-0 z-50 bg-header-bg border-b border-border">
      <Marquee
  text="осень за окном"
  href="https://theame.ru/catalog?category=sezon-podsolnuhov"
/>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="The Áme"
              className="h-8 w-8 md:h-9 md:w-9 object-contain"
            />
            <div className="flex flex-col items-center leading-tight">
              <span className="text-2xl font-bold text-primary">The Áme</span>
              <span className="text-sm font-light tracking-wide text-primary">
                ЦВЕТЫ х ЧУВСТВА
              </span>
            </div>
          </Link>

          {/* Навигация для десктопа */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/">Главная</NavLink>
            <NavLink to="/catalog">Каталог</NavLink>
            <NavLink to="/about">О нас</NavLink>
            <NavLink to="/contact">Контакты</NavLink>
          </nav>

          {/* Действия (все иконки в одном флексе с одинаковыми отступами) */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Соцсети — те же прозрачные кнопки, без обводки и без hover-фона */}
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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
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

            {/* Мобильное меню */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:hidden h-11 w-11 p-0 hover:bg-transparent focus-visible:ring-0"
                  onClick={() => setIsMenuOpen(true)}
                  aria-label="Открыть меню"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                {/* Обёртка с обработчиками тач-свайпа (вправо = закрыть) */}
                <div
                  className="h-full touch-pan-y"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <SheetHeader>
                    <SheetTitle className="flex flex-col">
                      <span className="text-xl font-bold">The Áme</span>
                      <span className="text-sm text-muted-foreground font-light">
                        цветы Х чувства
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col space-y-3 mt-6">
                    <NavLink
                      to="/"
                      className="w-full text-left h-12 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Главная
                    </NavLink>

                    <NavLink
                      to="/catalog"
                      className="w-full text-left h-12 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Каталог
                    </NavLink>

                    <NavLink
                      to="/favorites"
                      className="w-full text-left h-12 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        Избранное
                        {favoritesState.itemCount > 0 && (
                          <Badge className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                            {favoritesState.itemCount}
                          </Badge>
                        )}
                      </span>
                    </NavLink>

                    <NavLink
                      to="/about"
                      className="w-full text-left h-12 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      О нас
                    </NavLink>

                    <NavLink
                      to="/contact"
                      className="w-full text-left h-12 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Контакты
                    </NavLink>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
