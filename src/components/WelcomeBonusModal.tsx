import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { PhoneInput } from './PhoneInput';
import { validatePhoneNumber, getCleanPhoneNumber } from '@/lib/phone';
import { useIsMobile } from '@/hooks/use-mobile';
import { Gift } from 'lucide-react';
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
      // 1) Сохраняем клиента в БД
      const { error } = await supabase.from('new_clients').insert({
        name: name.trim(),
        phone: cleanPhone,
        bonus_amount: 200,
      });
      if (error) throw error;

      // 2) Отправляем привет в WhatsApp через наш API-роут
      try {
        await fetch('/api/whatsapp-send-welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: cleanPhone,
    name: name.trim(),
    // promoCode: 'WELCOME200' // при желании
  }),
});
      } catch (waErr) {
        // Не блокируем UX, просто логируем
        console.error('WhatsApp send error:', waErr);
      }

      toast({
        title: 'Поздравляем!',
        description:
          'Ваши 200 приветственных бонусов зачислены! Мы свяжемся с вами в ближайшее время.',
      });

      handleClose();
    } catch (err) {
      console.error('Error saving client:', err);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при регистрации. Попробуйте еще раз.',
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
        className={isMobile ? 'p-6' : 'p-8 pt-12'}
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
            />
          </div>

          <div>
            <Label htmlFor="phone">Номер телефона</Label>
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

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent
          id="welcome-bonus-modal"
          data-ym-selector="welcome-bonus-modal"
          className="max-h-[90vh]"
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Приветственный бонус</DrawerTitle>
          </DrawerHeader>
          {FormContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        id="welcome-bonus-modal"
        data-ym-selector="welcome-bonus-modal"
        className="max-w-2xl w-[90vw] max-h-[80vh] mx-auto bg-white border shadow-lg overflow-y-auto"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Приветственный бонус</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
