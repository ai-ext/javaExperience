-- TIMESTAMP literal 대신 fixed ISO TEXT bind. status조건없음/id정렬은명시추가.
SELECT c.id, c.email
FROM customers AS c
WHERE EXISTS (
  SELECT 1 FROM orders AS o
  WHERE o.customer_id = c.id AND o.created_at >= ?
)
ORDER BY c.id;
