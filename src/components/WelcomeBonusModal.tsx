import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { PhoneInput } from './PhoneInput';
import { validatePhoneNumber, getCleanPhoneNumber } from '@/lib/phone';
import { X, Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function WelcomeBonusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Проверяем, показывали ли уже модальное окно в этой сессии
    const hasSeenModal = sessionStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenModal) {
      setTimeout(() => {
        setIsOpen(true);
      }, 1000); // Показываем через 1 секунду после загрузки
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcomeModal', 'true');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !validatePhoneNumber(phone) || !agreeToTerms) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive"
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Ошибка",
        description: "Необходимо согласиться с обработкой персональных данных",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('new_clients')
        .insert({
          name: name.trim(),
          phone: getCleanPhoneNumber(phone),
          bonus_amount: 200
        });

      if (error) throw error;

      toast({
        title: "Поздравляем!",
        description: "Ваши 200 приветственных бонусов зачислены! Мы свяжемся с вами в ближайшее время.",
      });

      handleClose();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при регистрации. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[80vh] mx-auto bg-white border shadow-lg overflow-y-auto">
        <div className="p-8 pt-12">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2 text-center">
                Приветственный бонус
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Зарегистрируйтесь и получите промокод на первую покупку
            </p>
          </div>

          {/* Форма */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Ваше имя</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Введите имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-11"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Номер телефона</Label>
                <PhoneInput
                  id="phone"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={setPhone}
                  className="mt-1 h-11"
                />
              </div>
            </div>

            <div className="flex items-start space-x-3 py-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                Я согласен(а) с обработкой персональных данных и получением информационных сообщений
              </label>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Отправка...
                </div>
              ) : (
                'Получить промокод'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Бонус действует 30 дней с момента получения
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}