-- Add new fields to products table for detailed product pages
ALTER TABLE public.products 
ADD COLUMN detailed_description TEXT,
ADD COLUMN care_instructions TEXT,
ADD COLUMN composition TEXT[], -- Array of flower types in the bouquet
ADD COLUMN gift_info TEXT,
ADD COLUMN guarantee_info TEXT,
ADD COLUMN delivery_info TEXT,
ADD COLUMN size_info TEXT,
ADD COLUMN availability_status TEXT DEFAULT 'in_stock';

-- Update existing products with some default data
UPDATE public.products 
SET 
  detailed_description = COALESCE(description, 'Красивый букет из свежих цветов'),
  care_instructions = 'Поставьте букет в прохладную воду. Обрежьте стебли под углом. Меняйте воду каждые 2-3 дня.',
  composition = ARRAY['Розы', 'Зелень'],
  gift_info = 'К каждому заказу прилагается бесплатная открытка',
  guarantee_info = 'Гарантируем свежесть цветов. Замена в течение 24 часов при несоответствии качества.',
  delivery_info = 'Бесплатная доставка по городу. Доставим в течение 2-3 часов.',
  size_info = 'Высота букета: 40-45 см',
  availability_status = 'in_stock'
WHERE detailed_description IS NULL;