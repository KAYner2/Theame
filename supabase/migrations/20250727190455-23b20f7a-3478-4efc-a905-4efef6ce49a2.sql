-- Обновляем RLS политику для orders, чтобы разрешить анонимные заказы
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Создаем новую политику, которая разрешает создание заказов всем
CREATE POLICY "Allow anyone to create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Обновляем политику просмотра заказов
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view orders" 
ON public.orders 
FOR SELECT 
USING (true);