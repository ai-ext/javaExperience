INSERT INTO orders (id, customer_id, status, total_amount, created_at)
VALUES (501, 1, 'PENDING', 25000, CURRENT_TIMESTAMP);

UPDATE orders
SET status = 'PAID'
WHERE id = 501 AND status = 'PENDING';

DELETE FROM orders
WHERE id = 501 AND status = 'CANCELLED';
