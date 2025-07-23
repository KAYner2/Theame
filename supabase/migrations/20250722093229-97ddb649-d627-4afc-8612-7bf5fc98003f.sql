-- Создаем таблицы для системы управления контентом

-- Таблица категорий
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица продуктов/букетов
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  gallery_urls TEXT[], -- массив дополнительных изображений
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица отзывов
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Политики для публичного просмотра активных записей
CREATE POLICY "Public can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (is_approved = true AND is_active = true);

-- Политики для полного доступа (для админов - пока без аутентификации)
CREATE POLICY "Allow all operations on categories" 
ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on products" 
ON public.products 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on reviews" 
ON public.reviews 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Создаем storage buckets для изображений
INSERT INTO storage.buckets (id, name, public) VALUES 
('categories', 'categories', true),
('products', 'products', true),
('reviews', 'reviews', true);

-- Политики для storage - разрешаем всем просматривать публичные файлы
CREATE POLICY "Public can view category images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'categories');

CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Public can view review images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reviews');

-- Политики для загрузки файлов (пока для всех - позже можно ограничить)
CREATE POLICY "Allow upload to categories bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'categories');

CREATE POLICY "Allow upload to products bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow upload to reviews bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reviews');

-- Политики для удаления и обновления файлов
CREATE POLICY "Allow delete from categories bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'categories');

CREATE POLICY "Allow delete from products bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'products');

CREATE POLICY "Allow delete from reviews bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'reviews');

-- Добавляем тестовые данные
INSERT INTO public.categories (name, description, sort_order) VALUES
('Романтические букеты', 'Нежные композиции для особенных моментов', 1),
('Свадебные композиции', 'Изысканные букеты для свадебных торжеств', 2),
('Корпоративные подарки', 'Стильные композиции для деловых мероприятий', 3);

INSERT INTO public.reviews (client_name, rating, comment, is_approved) VALUES
('Анна Петрова', 5, 'Потрясающие букеты! Всегда свежие цветы и красивое оформление. Заказываю уже несколько раз.', true),
('Михаил Сергеев', 5, 'Отличная работа флористов. Букет для жены получился именно таким, как я представлял.', true),
('Елена Васильева', 4, 'Качественные цветы, но хотелось бы больше вариантов упаковки.', true);