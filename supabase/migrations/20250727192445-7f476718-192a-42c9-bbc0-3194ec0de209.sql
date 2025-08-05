-- Сделать поле user_id необязательным для анонимных заказов
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Удалить foreign key constraint если он есть
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;