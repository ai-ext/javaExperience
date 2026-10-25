CREATE TABLE orders (
  id BIGINT PRIMARY KEY, customer_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL, total_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX orders_customer_created_idx ON orders (customer_id, created_at);
EXPLAIN SELECT id, status FROM orders
WHERE customer_id = 1 AND created_at >= CURRENT_DATE - INTERVAL 7 DAY;
