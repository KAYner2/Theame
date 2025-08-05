-- Удаляем старые функции и пересоздаем без pgcrypto
DROP FUNCTION IF EXISTS public.generate_admin_token(text, text);
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text);
DROP FUNCTION IF EXISTS public.create_admin_user(text, text);

-- Пересоздаем функцию для создания пользователя с простым хешированием
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_username text,
  p_password text
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Используем digest из pgcrypto для хеширования
  INSERT INTO public.admin_users (username, password_hash)
  VALUES (p_username, encode(digest(p_password || 'salt_key_2024', 'sha256'), 'hex'))
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция для проверки пароля
CREATE OR REPLACE FUNCTION public.verify_admin_password(
  p_username text,
  p_password text
)
RETURNS boolean AS $$
DECLARE
  stored_hash text;
  input_hash text;
BEGIN
  -- Получаем хеш пароля для пользователя
  SELECT password_hash INTO stored_hash
  FROM public.admin_users 
  WHERE username = p_username AND is_active = true;
  
  -- Если пользователь не найден
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Создаем хеш введенного пароля
  input_hash := encode(digest(p_password || 'salt_key_2024', 'sha256'), 'hex');
  
  -- Сравниваем хеши
  RETURN (input_hash = stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  
  -- Генерируем токен
  token_data := p_username || ':' || extract(epoch from now()) || ':' || gen_random_uuid();
  
  -- Возвращаем base64 закодированный токен
  RETURN encode(digest(token_data, 'sha256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Обновляем пароль существующего пользователя
UPDATE public.admin_users 
SET password_hash = encode(digest('EgR-Bnp-8XN-UWQ' || 'salt_key_2024', 'sha256'), 'hex'),
    updated_at = now()
WHERE username = 'admin';