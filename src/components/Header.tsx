import logoUrl from '@/assets/logo.png';
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
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      className="w-5 h-5 text-[#25D366]"  // зелёный фирменный цвет WhatsApp
      fill="currentColor"
    >
      <path d="M380.9 97.1C339-1 261.7-13.8 200.2 25.4c-53.3 34.7-81.6 95.4-72.4 156.5l-17.7 69.7 71.4-19.1c58.4 38.7 135.5 42.3 196.1 8.2 69.3-39.3 95.2-126.3 52.3-193.6zM224.1 338c-26.9 0-53.8-7.8-77.2-22.5l-5.5-3.5-45.7 12.3 12.2-47-3.5-5.6c-14.8-23.6-22.6-50.5-22.6-77.4 0-80.2 65.3-145.4 145.6-145.4 38.9 0 75.5 15.1 103.1 42.7 27.5 27.6 42.6 64.2 42.6 103.2 0 80.3-65.3 145.6-145.6 145.6z"/>
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
