-- Обновляем пароль для админа
UPDATE public.admin_users 
SET password_hash = crypt('EgR-Bnp-8XN-UWQ', gen_salt('bf', 8)),
    updated_at = now()
WHERE username = 'admin';