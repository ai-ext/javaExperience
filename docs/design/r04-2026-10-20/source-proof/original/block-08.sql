-- INNER: 회원 1의 주문 6건
SELECT m.id member_id, o.id order_id, o.order_status
FROM member m JOIN orders o ON o.member_id = m.id
WHERE m.id = 1 ORDER BY o.id;

-- LEFT: 주문 없는 회원 181, 182 보존
SELECT m.id, m.name, o.id order_id, o.order_status
FROM member m LEFT JOIN orders o ON o.member_id = m.id
WHERE m.id IN (181, 182) ORDER BY m.id;

-- RIGHT: 오른쪽 member의 181번을 보존
SELECT m.id member_id, o.id order_id
FROM orders o RIGHT JOIN member m ON m.id = o.member_id
WHERE m.id = 181;

-- CROSS 2 × 2 = 4행
SELECT c.id category_id, m.id member_id
FROM category c CROSS JOIN member m
WHERE c.id IN (1, 2) AND m.id IN (181, 182);

-- SELF: category 3의 parent는 category 1
SELECT c.id, c.name, p.id parent_id, p.name parent_name
FROM category c LEFT JOIN category p ON p.id = c.parent_id
WHERE c.id IN (1, 3) ORDER BY c.id;
