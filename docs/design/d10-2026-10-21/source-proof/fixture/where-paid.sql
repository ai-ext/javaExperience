-- 오른쪽 PAID를 WHERE로 옮긴 추가 SQLite 비교 쿼리.
SELECT c.id, c.email, COUNT(*) AS count_star, COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total_amount), 0) AS paid_total
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE c.created_at >= ? AND o.status = 'PAID'
GROUP BY c.id, c.email
ORDER BY c.id;
