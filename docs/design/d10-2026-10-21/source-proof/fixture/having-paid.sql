-- 원문 block04의 DATE literal을 명시 ISO TEXT bind로 번역한 별도 예시.
SELECT c.id, c.email, COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total_amount), 0) AS paid_total
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id AND o.status = 'PAID'
WHERE c.created_at >= ?
GROUP BY c.id, c.email
HAVING COUNT(o.id) >= 1
ORDER BY paid_total DESC;
