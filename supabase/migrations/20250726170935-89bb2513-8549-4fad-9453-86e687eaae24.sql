-- Создаем таблицу для новых клиентов и их бонусов
CREATE TABLE public.new_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  bonus_amount INTEGER NOT NULL DEFAULT 200,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.new_clients ENABLE ROW LEVEL SECURITY;

-- Политики доступа - разрешаем всем читать и добавлять записи
CREATE POLICY "Anyone can insert new clients" 
ON public.new_clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view new clients" 
ON public.new_clients 
FOR SELECT 
USING (true);

-- Триггер для обновления updated_at
CREATE TRIGGER update_new_clients_updated_at
BEFORE UPDATE ON public.new_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();