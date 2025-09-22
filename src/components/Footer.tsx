import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Логотип и описание */}
          <div className="flex flex-col items-start text-left space-y-4">
            <div className="flex flex-col items-center leading-tight">
              <span className="text-2xl font-bold text-primary">The Áme</span>
              <span className="text-sm font-light tracking-wide text-primary">
                ЦВЕТЫ х ЧУВСТВА
              </span>
            </div>
            <p className="text-muted-foreground">
              Премиальные букеты из Сочи, вдохновлённые французской эстетикой. 
              Дарим не просто цветы — передаём чувства, стиль и настроение.
            </p>

            {/* Копирайт, поджатый к описанию */}
            <p className="text-muted-foreground text-sm mt-2">
              2025 © The Áme
            </p>
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
                  <p className="text-muted-foreground">Г. Сочи, Донская, 10а</p>
                  <p className="text-muted-foreground">ост. Заводская</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">+7 (993) 932-60-95</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">theame123@mail.ru</p>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Пн-Вс: 9:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя часть — только ссылки */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/public-offer" className="text-muted-foreground hover:text-primary transition-colors">
                Публичная оферта
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
