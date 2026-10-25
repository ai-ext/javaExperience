docker exec -i d10-postgres psql -U postgres -d shop <<'SQL'
CREATE TABLE customers (
  id BIGINT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO customers (id, email) VALUES (1, 'ada@example.test');
INSERT INTO orders (id, customer_id, status, total_amount)
VALUES (10, 1, 'PAID', 125.00);
CREATE INDEX orders_customer_created_idx ON orders (customer_id, created_at);
EXPLAIN SELECT id, status FROM orders
WHERE customer_id = 1 AND created_at >= CURRENT_DATE - INTERVAL '7 days';
SQL
