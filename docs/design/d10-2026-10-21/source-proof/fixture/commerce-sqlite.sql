-- 별도 고객/주문 SQLite toy. TEXT ISO시각·NUMERIC affinity는 PG 타입 인증이 아니다.
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  created_at TEXT NOT NULL
);
