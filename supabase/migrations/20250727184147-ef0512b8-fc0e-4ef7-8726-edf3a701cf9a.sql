-- Обновляем таблицу orders для хранения полных данных заказа
ALTER TABLE public.orders 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN delivery_type TEXT DEFAULT 'delivery',
ADD COLUMN delivery_date DATE,
ADD COLUMN delivery_time TEXT,
ADD COLUMN district TEXT,
ADD COLUMN recipient_name TEXT,
ADD COLUMN recipient_phone TEXT,
ADD COLUMN recipient_address TEXT,
ADD COLUMN card_wishes TEXT,
ADD COLUMN payment_method TEXT DEFAULT 'card',
ADD COLUMN order_comment TEXT,
ADD COLUMN promo_code TEXT,
ADD COLUMN discount_amount INTEGER DEFAULT 0,
ADD COLUMN order_status TEXT DEFAULT 'new';

-- Обновляем существующий столбец total_amount для корректной работы
ALTER TABLE public.orders 
ALTER COLUMN total_amount TYPE INTEGER USING total_amount::INTEGER;