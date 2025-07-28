-- Update existing products with some sample colors
UPDATE public.products 
SET colors = CASE 
  WHEN name LIKE '%роз%' OR name LIKE '%Роз%' THEN ARRAY['Красный', 'Розовый', 'Белый']
  WHEN name LIKE '%тюльпан%' OR name LIKE '%Тюльпан%' THEN ARRAY['Розовый', 'Желтый', 'Белый']
  WHEN name LIKE '%пион%' OR name LIKE '%Пион%' THEN ARRAY['Розовый', 'Белый']
  WHEN name LIKE '%подсолнух%' OR name LIKE '%Подсолнух%' THEN ARRAY['Желтый']
  WHEN name LIKE '%лаванд%' OR name LIKE '%Лаванд%' THEN ARRAY['Фиолетовый']
  ELSE ARRAY['Розовый', 'Белый']
END
WHERE colors IS NULL OR array_length(colors, 1) IS NULL;