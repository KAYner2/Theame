-- Убеждаемся что расширение pgcrypto включено
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Тестируем функцию
SELECT public.generate_admin_token('admin', 'EgR-Bnp-8XN-UWQ') as test_token;