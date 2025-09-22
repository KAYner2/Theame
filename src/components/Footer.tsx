import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/utils/slugify';

export const Footer = () => {
  // берём категории так же, как в Header
  const { data: categories = [] } = useCategories();

  const normalize = (name: string) => {
    if (!name) return '';
    const s = name.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // уникальные категории по названию
  const uniqueCats = Array.from(
    new Map(categories.map((c: any) => [normalize(c.name), c])).values()
  );

  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-12">
        {/* стало 4 колонки на десктопе */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* ЛОГО + СЛОГАН (Forum, слева — как раньше) */}
          <div className="flex flex-col items-start text-left space-y-3">
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

            {/* Копирайт под описанием */}
            <p className="text-[#7e7e7e] text-sm">2025 © The Áme</p>
          </div>

          {/* НАВИГАЦИЯ */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Навигация</h3>
            <nav className="space-y-2">
              <Link to="/" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Главная
              </Link>
              <Link to="/catalog" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Каталог
              </Link>
              <Link to="/about" className="block text-[#7e7e7e] hover:text-black transition-colors">
                О нас
              </Link>
              <Link to="/contact" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Контакты
              </Link>
              <Link to="/cart" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Корзина
              </Link>
              <Link to="/delivery" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Доставка
              </Link>
              <Link to="/privacy" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/public-offer" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Публичная оферта
              </Link>
            </nav>
          </div>

          {/* МАГАЗИН (категории из хедера) */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Магазин</h3>
            <nav className="space-y-2">
              <Link to="/catalog" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Каталог
              </Link>
              {uniqueCats.map((c: any) => {
                const name = normalize(c.name);
                const slug = slugify(name);
                return (
                  <Link
                    key={c.id ?? slug}
                    to={`/catalog?category=${slug}`}
                    className="block text-[#7e7e7e] hover:text-black transition-colors"
                  >
                    {name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* КОНТАКТЫ */}
          <div>
            <h3 className="text-lg font-semibold text-[#7e7e7e] mb-4">Контакты</h3>
            <div className="space-y-3 text-[#7e7e7e]">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-black mt-0.5" />
                <div>
                  <p>Г. Сочи, Донская, 10а</p>
                  <p>ост. Заводская</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-black" />
                <a href="tel:+79939326095" className="hover:text-black transition-colors">
                  +7 (993) 932-60-95
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-black" />
                <a href="mailto:theame123@mail.ru" className="hover:text-black transition-colors">
                  theame123@mail.ru
                </a>
              </div>
              <div className="flex items-start space-x-3">
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
