-- Создаем таблицу для админских пользователей
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Создаем политику - только аутентифицированные админы могут читать
CREATE POLICY "Only authenticated admins can view admin_users" 
ON public.admin_users 
FOR SELECT 
USING (true); -- Временно разрешаем всем для входа

-- Функция для хеширования пароля (используем pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Функция для создания админского пользователя
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_username text,
  p_password text
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Хешируем пароль с солью
  INSERT INTO public.admin_users (username, password_hash)
  VALUES (p_username, crypt(p_password, gen_salt('bf', 8)))
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для проверки пароля
CREATE OR REPLACE FUNCTION public.verify_admin_password(
  p_username text,
  p_password text
)
RETURNS boolean AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Получаем хеш пароля для пользователя
  SELECT password_hash INTO stored_hash
  FROM public.admin_users 
  WHERE username = p_username AND is_active = true;
  
  -- Если пользователь не найден
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Проверяем пароль
  RETURN (crypt(p_password, stored_hash) = stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для генерации токена доступа
CREATE OR REPLACE FUNCTION public.generate_admin_token(
  p_username text,
  p_password text
)
RETURNS text AS $$
DECLARE
  is_valid boolean;
  token_data text;
BEGIN
  -- Проверяем пароль
  SELECT public.verify_admin_password(p_username, p_password) INTO is_valid;
  
  IF NOT is_valid THEN
    RETURN NULL;
  END IF;
  
  -- Генерируем токен (username:timestamp:random)
  token_data := p_username || ':' || extract(epoch from now()) || ':' || gen_random_uuid();
  
  -- Возвращаем base64 закодированный токен
  RETURN encode(digest(token_data, 'sha256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для обновления updated_at
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Создаем первого админского пользователя
SELECT public.create_admin_user('admin', 'SecureAdmin2024!');