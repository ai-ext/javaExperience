-- 유료 주문이 있는 고객별 주문 수와 결제 총액
SELECT c.id, c.email, COUNT(o.id) AS order_count,
       COALESCE(SUM(o.total_amount), 0) AS paid_total
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id AND o.status = 'PAID'
WHERE c.created_at >= DATE '2026-01-01'
GROUP BY c.id, c.email
HAVING COUNT(o.id) >= 1
ORDER BY paid_total DESC;

-- 최근 주문이 한 건이라도 있는 고객: 서브쿼리의 결과를 조건으로 사용
SELECT c.id, c.email
FROM customers AS c
WHERE EXISTS (
  SELECT 1 FROM orders AS o
  WHERE o.customer_id = c.id
    AND o.created_at >= TIMESTAMP '2026-09-01 00:00:00'
);
