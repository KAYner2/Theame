-- Создание таблицы промокодов
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_amount INTEGER NOT NULL, -- Сумма скидки в рублях
  discount_type TEXT NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percent')),
  usage_limit INTEGER DEFAULT NULL, -- Лимит использований (NULL = безлимитный)
  used_count INTEGER NOT NULL DEFAULT 0, -- Количество использований
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Дата истечения
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Политика для просмотра активных промокодов
CREATE POLICY "Anyone can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true);

-- Политика для всех операций (для админов)
CREATE POLICY "Allow all operations on promo codes" 
ON public.promo_codes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Триггер для обновления updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Добавляем несколько тестовых промокодов
INSERT INTO public.promo_codes (code, discount_amount, discount_type, usage_limit) VALUES
('СКИДКА200', 200, 'fixed', 100),
('СКИДКА500', 500, 'fixed', 50),
('SALE10', 10, 'percent', NULL),
('НОВИЧОК300', 300, 'fixed', 200);

-- Создание таблицы для отслеживания использованных промокодов
CREATE TABLE public.promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  order_id UUID NULL, -- Ссылка на заказ (пока NULL, потом можно связать)
  customer_phone TEXT NULL, -- Телефон клиента для ограничения повторного использования
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для таблицы использований
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Политика для просмотра использований (для всех)
CREATE POLICY "Allow all operations on promo code usage" 
ON public.promo_code_usage 
FOR ALL 
USING (true) 
WITH CHECK (true);