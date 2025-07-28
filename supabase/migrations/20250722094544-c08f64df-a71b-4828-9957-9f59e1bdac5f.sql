-- Добавляем существующие категории с изображениями
INSERT INTO public.categories (name, description, image_url, sort_order) VALUES
('Розы', 'Классические розы для любого повода', '/roses.jpg', 1),
('Гортензии', 'Пышные соцветия гортензий', '/hydrangeas.jpg', 2),
('Подсолнухи', 'Яркие солнечные подсолнухи', '/sunflowers.jpg', 3),
('Авторские букеты', 'Уникальные композиции от наших флористов', '/designer.jpg', 4),
('Цветы в корзине', 'Красивые композиции в плетеных корзинах', '/basket.jpg', 5),
('Пионы', 'Нежные и ароматные пионы', '/peonies.jpg', 6),
('Монобукеты', 'Элегантные композиции из одного вида цветов', '/mono.jpg', 7),
('Кашпо и вазы', 'Цветы в стильных кашпо и вазах', '/vases.jpg', 8),
('Интересные букеты', 'Оригинальные и необычные композиции', '/special.jpg', 9);

-- Получаем ID категорий для привязки товаров
DO $$
DECLARE
    roses_id UUID;
    hydrangeas_id UUID;
    sunflowers_id UUID;
    designer_id UUID;
    basket_id UUID;
    peonies_id UUID;
    mono_id UUID;
    summer_id UUID;
    sea_id UUID;
    lavender_id UUID;
    sunrise_id UUID;
    evening_id UUID;
    elegant_id UUID;
    romantic_id UUID;
    inspiration_id UUID;
BEGIN
    SELECT id INTO roses_id FROM public.categories WHERE name = 'Розы';
    SELECT id INTO hydrangeas_id FROM public.categories WHERE name = 'Гортензии';
    SELECT id INTO sunflowers_id FROM public.categories WHERE name = 'Подсолнухи';
    SELECT id INTO designer_id FROM public.categories WHERE name = 'Авторские букеты';
    SELECT id INTO basket_id FROM public.categories WHERE name = 'Цветы в корзине';
    SELECT id INTO peonies_id FROM public.categories WHERE name = 'Пионы';
    SELECT id INTO mono_id FROM public.categories WHERE name = 'Монобукеты';

    -- Добавляем существующие товары
    INSERT INTO public.products (name, price, image_url, category_id, is_featured, sort_order) VALUES
    ('Букет роз "Нежность"', 5900, '/rose1.jpg', roses_id, true, 1),
    ('Гортензии "Небесный"', 7900, '/hydrangea1.jpg', hydrangeas_id, true, 2),
    ('Подсолнухи "Солнечный день"', 4900, '/sunflower1.jpg', sunflowers_id, true, 3),
    ('Авторский букет "Весна"', 8900, '/designer1.jpg', designer_id, true, 4),
    ('Корзина "Утренняя роса"', 6900, '/basket1.jpg', basket_id, true, 5),
    ('Пионы "Розовый закат"', 7900, '/peony1.jpg', peonies_id, true, 6),
    ('Монобукет роз', 5900, '/mono1.jpg', mono_id, true, 7),
    ('Букет "Летний бриз"', 6900, '/summer1.jpg', designer_id, true, 8),
    ('Букет "Морской бриз"', 7900, '/sea1.jpg', designer_id, true, 9),
    ('Букет "Лавандовый"', 6900, '/lavender1.jpg', designer_id, true, 10),
    ('Букет "Рассвет"', 8900, '/sunrise1.jpg', designer_id, true, 11),
    ('Букет "Вечерний"', 7900, '/evening1.jpg', designer_id, true, 12),
    ('Букет "Элегантный"', 9900, '/elegant1.jpg', designer_id, false, 13),
    ('Букет "Романтика"', 8900, '/romantic1.jpg', roses_id, false, 14),
    ('Букет "Вдохновение"', 7900, '/inspiration1.jpg', designer_id, false, 15);
END $$;