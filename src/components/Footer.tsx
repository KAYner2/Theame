import logoUrl from '@/assets/logo.png';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PhoneInput } from './PhoneInput';
import { validatePhoneNumber, getCleanPhoneNumber } from '@/lib/phone';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './ui/use-toast';

export const Footer = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim() || !validatePhoneNumber(phone)) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля корректно",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          phone: getCleanPhoneNumber(phone),
          name: name.trim()
        });

      if (error) throw error;

      toast({
        title: "Спасибо за подписку!",
        description: "Мы будем присылать вам новости о новых букетах.",
      });
      setPhone('');
      setName('');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при подписке. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

          {/* Подписка на рассылку */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Подписка на рассылку</h3>
            <p className="text-muted-foreground mb-4">
              Получайте новости о новых букетах и специальных предложениях
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="text"
                placeholder="Ваше имя"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <PhoneInput
                placeholder="+7 (999) 123-45-67"
                className="w-full"
                value={phone}
                onChange={setPhone}
                required
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:bg-gradient-secondary"
                disabled={isLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Подписываемся...' : 'Подписаться'}
              </Button>
            </form>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground text-sm">
                © 2025 The Áme. Все права защищены.
              </p>
            </div>
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
