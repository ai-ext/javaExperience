START TRANSACTION;

INSERT INTO product (category_id, name, product_type, price, stock, sale_status, created_at, updated_at)
VALUES
 (3, 'R04 상품 A', 'GOODS', 1000, 3, 'ON_SALE', '2026-09-28', '2026-09-28'),
 (3, 'R04 상품 B', 'EBOOK', 2000, 5, 'ON_SALE', '2026-09-28', '2026-09-28');

INSERT INTO coupon (code, name, discount_amount, min_order_amount, valid_from, valid_to, created_at, updated_at)
VALUES ('R04-DEMO', 'R04 쿠폰', 1000, 0, '2026-01-01', '2027-01-01', '2026-09-28', '2026-09-28') AS incoming
ON DUPLICATE KEY UPDATE discount_amount = incoming.discount_amount,
                        updated_at = incoming.updated_at;

INSERT INTO point_history (member_id, order_id, point_type, amount, balance_after, memo, created_at, updated_at)
SELECT o.member_id, o.id, 'EARN', 100, 100, 'R04 실습', '2026-09-28', '2026-09-28'
FROM orders o WHERE o.id = 1;

-- product 1의 초기 재고 33 확인 후 차감
SELECT id, name, stock FROM product WHERE id = 1;
UPDATE product SET stock = stock - 1, updated_at = '2026-09-28'
WHERE id = 1 AND stock > 0;
SELECT ROW_COUNT() changed_rows;

-- 삭제 대상 미리 확인 후 같은 PK로 삭제
SELECT id, member_id, member_coupon_status FROM member_coupon WHERE id = 300;
DELETE FROM member_coupon WHERE id = 300;
SELECT ROW_COUNT() deleted_rows;

ROLLBACK;

SELECT id, stock FROM product WHERE id = 1;
SELECT COUNT(*) coupon_rows FROM coupon WHERE code = 'R04-DEMO';
SELECT COUNT(*) point_rows FROM point_history WHERE memo = 'R04 실습';
SELECT COUNT(*) member_coupon_rows FROM member_coupon WHERE id = 300;
