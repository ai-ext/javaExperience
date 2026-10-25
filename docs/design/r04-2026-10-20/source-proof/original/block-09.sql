SELECT m.id, o.id paid_order_id
FROM member m LEFT JOIN orders o
  ON o.member_id = m.id AND o.order_status = 'PAID'
WHERE m.id BETWEEN 181 AND 182;

-- 주문이 있는 회원만 중복 없이 조회
SELECT m.id, m.name
FROM member m
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.member_id = m.id AND o.order_status = 'PAID');
