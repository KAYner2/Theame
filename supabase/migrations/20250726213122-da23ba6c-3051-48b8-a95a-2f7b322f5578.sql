-- Исправляем функции - добавляем security definer и search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  
  -- Генерируем токен (username:timestamp:random)
  token_data := p_username || ':' || extract(epoch from now()) || ':' || gen_random_uuid();
  
  -- Возвращаем base64 закодированный токен
  RETURN encode(digest(token_data, 'sha256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Исправляем функцию обновления времени
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;