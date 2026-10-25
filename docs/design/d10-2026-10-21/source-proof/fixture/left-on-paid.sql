-- 원문 HAVING을 제거한 추가 중간행/query 변형: fixed ISO문자열 bind, count(*) 추가, observer용 id정렬.
SELECT c.id, c.email, COUNT(*) AS count_star, COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total_amount), 0) AS paid_total
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id AND o.status = 'PAID'
WHERE c.created_at >= ?
GROUP BY c.id, c.email
ORDER BY c.id;
