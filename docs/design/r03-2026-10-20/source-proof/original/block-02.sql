SHOW CREATE TABLE product\G

SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('member', 'product', 'orders', 'order_item', 'review')
ORDER BY table_name, ordinal_position;
