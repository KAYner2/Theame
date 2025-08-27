import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { PhoneInput } from './PhoneInput';
import { validatePhoneNumber, getCleanPhoneNumber } from '@/lib/phone';
import { useIsMobile } from '@/hooks/use-mobile';
import { Gift, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function WelcomeBonusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenModal) {
      const t = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcomeModal', 'true');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !phone.trim() || !validatePhoneNumber(phone) || !agreeToTerms) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = getCleanPhoneNumber(phone);

    try {
      const { error } = await supabase.from('new_clients').insert({
        name: name.trim(),
        phone: cleanPhone,
        bonus_amount: 300,
      });
      if (error) throw error;

      try {
        await fetch('/api/whatsapp-send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, name: name.trim() }),
        });
      } catch (waErr) {
        console.error('WhatsApp send error:', waErr);
      }

      toast({
        title: 'Поздравляем!',
        description:
          'Ваши 300 приветственных бонусов зачислены! Мы свяжемся с вами в ближайшее время.',
      });
      handleClose();
    } catch (err) {
      console.error('Error saving client:', err);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при регистрации. Попробуйте ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, phone, agreeToTerms, toast, handleClose]);

  const FormContent = useMemo(
    () => (
      <div
        id="welcome-bonus-form"
        data-ym-selector="welcome-bonus-form"
        className={isMobile ? 'p-6 pt-12' : 'p-8 pt-12'}
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Приветственный бонус</h2>
          <p className="text-muted-foreground">
            Зарегистрируйтесь и получите промокод на первую покупку
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Ваше имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="Введите имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-11"
              autoComplete="name"
              inputMode="text"
            />
          </div>

          <div>
            <Label htmlFor="phone">Номер телефона</Label>
            {/* Только поддерживаемые пропсы */}
            <PhoneInput
              id="phone"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={setPhone}
              className="mt-1 h-11"
            />
          </div>

          <div className="flex items-start space-x-3 py-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(c) => setAgreeToTerms(c === true)}
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              Я согласен(а) с обработкой персональных данных
            </label>
          </div>

          <Button
            id="welcome-bonus-submit"
            data-ym-selector="welcome-bonus-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? 'Отправка...' : 'Получить промокод'}
          </Button>
        </div>
      </div>
    ),
    [isMobile, name, phone, agreeToTerms, isSubmitting, handleSubmit],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        id="welcome-bonus-modal"
        data-ym-selector="welcome-bonus-modal"
        className={`${
          isMobile
            ? // Мобилка — полноэкранно
              'w-screen h-[100dvh] max-w-none rounded-none p-0 overflow-y-auto'
            : // Десктоп — ЖЁСТКО по центру экрана
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-[90vw] max-h-[80vh] bg-white border shadow-lg overflow-y-auto'
        }
        /* скрыть встроенный маленький крестик (absolute right-4 top-4) только на мобилке */
        [&>button.absolute.right-4.top-4]:hidden sm:[&>button.absolute.right-4.top-4]:inline-flex
        `}
        /* на мобиле — закрытие только большим крестиком */
        onInteractOutside={(e) => {
          if (isMobile) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isMobile) e.preventDefault();
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Приветственный бонус</DialogTitle>
        </DialogHeader>

        {/* Большой крестик — только на мобильных */}
        {isMobile && (
          <div className="pointer-events-auto">
            <Button
              type="button"
              aria-label="Закрыть"
              onClick={handleClose}
              variant="ghost"
              className="absolute right-2 top-2 h-12 w-12 rounded-full hover:bg-muted"
            >
              <X className="w-7 h-7" />
            </Button>
          </div>
        )}

        {FormContent}
      </DialogContent>
    </Dialog>
  );
}