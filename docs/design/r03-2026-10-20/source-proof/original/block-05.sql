SELECT
  CAST(0.1 AS DOUBLE) + CAST(0.2 AS DOUBLE) = CAST(0.3 AS DOUBLE) AS double_equal,
  CAST(0.1 AS DECIMAL(2,1)) + CAST(0.2 AS DECIMAL(2,1))
    = CAST(0.3 AS DECIMAL(2,1)) AS decimal_equal;

START TRANSACTION;
UPDATE product SET price = price + 1 WHERE id = 1;
SELECT id, price FROM product WHERE id = 1;
ROLLBACK;
SELECT id, price FROM product WHERE id = 1;
