-- Удаляем функции и создаем простые версии
DROP FUNCTION IF EXISTS public.generate_admin_token(text, text);
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text);
DROP FUNCTION IF EXISTS public.create_admin_user(text, text);

-- Простая функция для проверки пароля без хеширования (временно)
CREATE OR REPLACE FUNCTION public.verify_admin_password(
  p_username text,
  p_password text
)
RETURNS boolean AS $$
BEGIN
  -- Простая проверка для демонстрации
  RETURN (p_username = 'admin' AND p_password = 'EgR-Bnp-8XN-UWQ');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Функция для генерации токена
CREATE OR REPLACE FUNCTION public.generate_admin_token(
  p_username text,
  p_password text
)
RETURNS text AS $$
DECLARE
  is_valid boolean;
BEGIN
  -- Проверяем пароль
  SELECT public.verify_admin_password(p_username, p_password) INTO is_valid;
  
  IF NOT is_valid THEN
    RETURN NULL;
  END IF;
  
  -- Возвращаем простой токен
  RETURN 'admin_token_' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;