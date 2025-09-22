import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* ЛОГО + СЛОГАН (Forum, центр) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="leading-tight" style={{ fontFamily: 'Forum, serif' }}>
              <Link to="/" className="block">
                <span className="text-3xl md:text-4xl font-normal text-black tracking-wide">
                  The Áme
                </span>
              </Link>
              <div className="text-sm md:text-base font-normal tracking-wide text-black">
                ЦВЕТЫ х ЧУВСТВА
              </div>
            </div>

            <p className="text-[#7e7e7e] max-w-md">
              Премиальные букеты из Сочи, вдохновлённые французской эстетикой.
              Дарим не просто цветы — передаём чувства, стиль и настроение.
            </p>

            {/* Копирайт */}
            <p className="text-[#7e7e7e] text-sm">2025 © The Áme</p>
          </div>

          {/* НАВИГАЦИЯ + ПОЛИТИКА/ОФЕРТА */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">
              Навигация
            </h3>
            <nav className="space-y-2">
              {[
                { to: '/', label: 'Главная' },
                { to: '/catalog', label: 'Каталог' },
                { to: '/about', label: 'О нас' },
                { to: '/contact', label: 'Контакты' },
                { to: '/cart', label: 'Корзина' },
                { to: '/privacy', label: 'Политика конфиденциальности' },
                { to: '/public-offer', label: 'Публичная оферта' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-[#7e7e7e] hover:text-black transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* КОНТАКТЫ */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">
              Контакты
            </h3>
            <div className="space-y-3 text-[#7e7e7e]">
              <div className="flex items-start justify-center lg:justify-start space-x-3">
                <MapPin className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <p>Г. Сочи, Донская, 10а</p>
                  <p>ост. Заводская</p>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Phone className="w-5 h-5 text-black" />
                <p>+7 (993) 932-60-95</p>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Mail className="w-5 h-5 text-black" />
                <p>theame123@mail.ru</p>
              </div>
              <div className="flex items-start justify-center lg:justify-start space-x-3">
                <Clock className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <p>Пн-Вс: 9:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* нижнего блока нет */}
      </div>
    </footer>
  );
};
