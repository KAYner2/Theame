import { useState } from 'react';
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
  Heart
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { state } = useCart();

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive(to) 
          ? 'bg-primary text-primary-foreground shadow-soft' 
          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
      } ${className}`}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-header-bg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-bold text-primary">The Áme</span>
            <span className="text-sm text-muted-foreground font-light tracking-wide">цветы Х чувства</span>
          </Link>

          {/* Навигация для десктопа */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/">Главная</NavLink>
            <NavLink to="/catalog">Каталог</NavLink>
            <NavLink to="/about">О нас</NavLink>
            <NavLink to="/contact">Контакты</NavLink>
          </nav>

          {/* Действия */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Heart className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="w-4 h-4" />
                {state.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {state.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Мобильное меню */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex flex-col">
                    <span className="text-xl font-bold">The Áme</span>
                    <span className="text-sm text-muted-foreground font-light">цветы Х чувства</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-2 mt-6">
                  <NavLink to="/" className="w-full text-left">Главная</NavLink>
                  <NavLink to="/catalog" className="w-full text-left">Каталог</NavLink>
                  <NavLink to="/about" className="w-full text-left">О нас</NavLink>
                  <NavLink to="/contact" className="w-full text-left">Контакты</NavLink>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};