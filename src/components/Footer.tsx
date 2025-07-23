import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Send
} from 'lucide-react';

export const Footer = () => {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Подписка на рассылку');
    // Здесь будет логика подписки
  };

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип и описание */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">The Áme</span>
              <span className="text-sm text-muted-foreground font-light tracking-wide">цветы Х чувства</span>
            </div>
            <p className="text-muted-foreground">
              Свежие цветы для особенных моментов. Создаем красивые букеты 
              и композиции с любовью и вниманием к деталям.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Навигация</h3>
            <nav className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Главная
              </Link>
              <Link to="/catalog" className="block text-muted-foreground hover:text-primary transition-colors">
                Каталог
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                О нас
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Контакты
              </Link>
              <Link to="/cart" className="block text-muted-foreground hover:text-primary transition-colors">
                Корзина
              </Link>
            </nav>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Контакты</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Г. Сочи, Донская, 10а, 1 этаж</p>
                  <p className="text-muted-foreground">Район Центральный внутригородской</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">+7 (993) 932-60-95</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">TheAme123@mail.ru</p>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Пн-Вс: 9:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Подписка на рассылку */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Подписка на рассылку</h3>
            <p className="text-muted-foreground mb-4">
              Получайте новости о новых букетах и специальных предложениях
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                placeholder="Ваш email"
                className="w-full"
                required
              />
              <Button type="submit" className="w-full bg-gradient-primary hover:bg-gradient-secondary">
                <Send className="w-4 h-4 mr-2" />
                Подписаться
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">
                Скидка 10% на первый заказ
              </Badge>
              <Badge variant="outline" className="text-xs">
                Бесплатная доставка
              </Badge>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground text-sm">
                © 2024 The Áme. Все права защищены.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Условия использования
              </Link>
              <Link to="/delivery" className="text-muted-foreground hover:text-primary transition-colors">
                Доставка и оплата
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};