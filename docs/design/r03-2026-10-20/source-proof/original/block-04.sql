START TRANSACTION;
UPDATE product SET price = -1 WHERE id = 1;
-- (예상) ERROR 3819: Check constraint 'ck_product_price_stock' is violated.
ROLLBACK;
