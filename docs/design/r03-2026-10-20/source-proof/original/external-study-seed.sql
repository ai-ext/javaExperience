-- 클라이언트 문자셋을 고정한다. 없으면 mysql 클라이언트 기본값(latin1 등)으로 한글이 이중 인코딩돼 저장된다(회원 → íšŒì›).
SET NAMES utf8mb4;
USE ds_practice;
SET SESSION cte_max_recursion_depth = 10000;
SET @base_time = CAST('2026-09-01 00:00:00' AS DATETIME);

-- 의도: 181~200번 회원은 주문이 없어 anti-join 문제를 만든다.
INSERT INTO member (id, login_id, name, email, phone, member_status, deleted_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 200)
SELECT n, CONCAT('member', LPAD(n, 3, '0')), CONCAT('회원', LPAD(n, 3, '0')),
       CONCAT('member', LPAD(n, 3, '0'), '@example.invalid'),
       CASE WHEN MOD(n, 17) = 0 THEN NULL ELSE CONCAT('010-0000-', LPAD(n, 4, '0')) END,
       CASE WHEN MOD(n, 31) = 0 THEN 'SUSPENDED' WHEN MOD(n, 47) = 0 THEN 'WITHDRAWN' ELSE 'ACTIVE' END,
       CASE WHEN MOD(n, 47) = 0 THEN DATE_ADD(@base_time, INTERVAL -n DAY) END,
       DATE_ADD(@base_time, INTERVAL -n DAY), @base_time
FROM seq;

INSERT INTO category (id, parent_id, name, depth, sort_order, created_at, updated_at)
SELECT n, CASE WHEN n <= 2 THEN NULL ELSE 1 + MOD(n - 3, 2) END,
       CASE WHEN n = 1 THEN '상품' WHEN n = 2 THEN '콘텐츠' ELSE CONCAT('세부카테고리', LPAD(n - 2, 2, '0')) END,
       CASE WHEN n <= 2 THEN 1 ELSE 2 END, n, @base_time, @base_time
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) x;

-- 의도: 10, 20, ...번 상품은 재고 0, 1번과 41번은 동명 상품, 80번은 soft delete다.
INSERT INTO product (id, category_id, name, product_type, price, stock, sale_status, deleted_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 80)
SELECT n, 3 + MOD(n - 1, 8), CASE WHEN n = 41 THEN '상품A-01' ELSE CONCAT('상품', CHAR(65 + MOD(n - 1, 26)), '-', LPAD(n, 2, '0')) END,
       CASE WHEN MOD(n, 4) = 0 THEN 'MAGAZINE' WHEN MOD(n, 4) = 1 THEN 'GOODS' WHEN MOD(n, 4) = 2 THEN 'EBOOK' ELSE 'CARTOON' END,
       9000 + n * 700, CASE WHEN MOD(n, 10) = 0 THEN 0 ELSE 20 + MOD(n * 13, 81) END,
       CASE WHEN MOD(n, 10) = 0 THEN 'SOLD_OUT' WHEN n = 80 THEN 'HIDDEN' ELSE 'ON_SALE' END,
       CASE WHEN n = 80 THEN DATE_ADD(@base_time, INTERVAL -2 DAY) END, DATE_ADD(@base_time, INTERVAL -n DAY), @base_time
FROM seq;

INSERT INTO product_option (id, product_id, option_name, extra_price, stock, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 160)
SELECT n, 1 + MOD(n - 1, 80), CONCAT('옵션', CASE WHEN MOD(n, 2) = 0 THEN '표준' ELSE '대형' END),
       CASE WHEN MOD(n, 2) = 0 THEN 0 ELSE 1500 END, CASE WHEN MOD(n, 20) = 0 THEN 0 ELSE 10 + MOD(n, 30) END,
       @base_time, @base_time FROM seq;

INSERT INTO cart_item (id, member_id, product_id, product_option_id, quantity, cart_status, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 120)
SELECT n, 1 + MOD(n - 1, 100), 1 + MOD(n - 1, 80), CASE WHEN MOD(n, 3) = 0 THEN NULL ELSE 1 + MOD(n * 2 - 1, 160) END,
       1 + MOD(n, 4), CASE WHEN MOD(n, 9) = 0 THEN 'ORDERED' WHEN MOD(n, 11) = 0 THEN 'REMOVED' ELSE 'ACTIVE' END,
       DATE_ADD(@base_time, INTERVAL -n HOUR), @base_time FROM seq;

-- 의도: 월별 매출 편차, 결제 대기/취소/환불 주문을 의도적으로 섞는다.
INSERT INTO orders (id, order_no, member_id, order_status, total_amount, ordered_at, canceled_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 1000)
SELECT n, CONCAT('ORD-2026-', LPAD(n, 5, '0')), 1 + MOD(n - 1, 180),
       CASE WHEN MOD(n, 37) = 0 THEN 'REFUNDED' WHEN MOD(n, 29) = 0 THEN 'CANCELED' WHEN MOD(n, 23) = 0 THEN 'PAYMENT_PENDING' WHEN MOD(n, 5) = 0 THEN 'DELIVERED' WHEN MOD(n, 3) = 0 THEN 'SHIPPED' ELSE 'PAID' END,
       10000 + MOD(n * 7919, 150000), DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY),
       CASE WHEN MOD(n, 29) = 0 OR MOD(n, 37) = 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY) END,
       DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY), @base_time FROM seq;

INSERT INTO order_item (id, order_id, product_id, product_option_id, quantity, unit_price, item_status, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 2500)
SELECT n, 1 + MOD(n - 1, 1000), 1 + MOD(n * 7 - 1, 80), CASE WHEN MOD(n, 4) = 0 THEN NULL ELSE 1 + MOD(n * 3 - 1, 160) END,
       1 + MOD(n, 3), 9000 + (1 + MOD(n * 7 - 1, 80)) * 700,
       CASE WHEN MOD(n, 37) = 0 THEN 'REFUNDED' WHEN MOD(n, 29) = 0 THEN 'CANCELED' ELSE 'ORDERED' END,
       DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY), @base_time FROM seq;

INSERT INTO payment (id, order_id, payment_method, payment_status, amount, approved_at, canceled_at, external_key, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 1000)
SELECT n, n, CASE WHEN MOD(n, 4) = 0 THEN 'BANK' WHEN MOD(n, 7) = 0 THEN 'POINT' ELSE 'CARD' END,
       CASE WHEN MOD(n, 23) = 0 THEN 'READY' WHEN MOD(n, 19) = 0 THEN 'FAILED' WHEN MOD(n, 29) = 0 THEN 'CANCELED' WHEN MOD(n, 37) = 0 THEN 'REFUNDED' ELSE 'APPROVED' END,
       10000 + MOD(n * 7919, 150000), CASE WHEN MOD(n, 19) <> 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY) END,
       CASE WHEN MOD(n, 29) = 0 OR MOD(n, 37) = 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY) END,
       CONCAT('PAY-2026-', LPAD(n, 5, '0')), DATE_ADD(@base_time, INTERVAL -MOD(n * 2, 365) DAY), @base_time FROM seq;

INSERT INTO delivery (id, order_id, recipient_name, postal_code, address_line, tracking_no, delivery_status, shipped_at, delivered_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 1000)
SELECT n, n, CONCAT('수령인', LPAD(n, 4, '0')), CASE WHEN MOD(n, 13) = 0 THEN NULL ELSE CONCAT('0', LPAD(100 + MOD(n, 900), 4, '0')) END,
       CASE WHEN MOD(n, 13) = 0 THEN NULL ELSE CONCAT('가짜로 ', n, '번지') END,
       CASE WHEN MOD(n, 17) = 0 THEN NULL ELSE CONCAT('TRK', LPAD(n, 10, '0')) END,
       CASE WHEN MOD(n, 17) = 0 THEN 'FAILED' WHEN MOD(n, 5) = 0 THEN 'DELIVERED' WHEN MOD(n, 3) = 0 THEN 'SHIPPED' ELSE 'READY' END,
       CASE WHEN MOD(n, 3) = 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY) END,
       CASE WHEN MOD(n, 5) = 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY) END,
       DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY), @base_time FROM seq;

-- 의도: 활성/만료/취소 구독과 연장 없는 만기 구독을 섞는다.
INSERT INTO subscription (id, member_id, product_id, order_item_id, media_type, start_date, end_date, subscription_status, auto_renew, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 150)
SELECT n, 1 + MOD(n - 1, 150), 1 + MOD(n - 1, 20), 1 + MOD(n - 1, 2500), CASE WHEN MOD(n, 2) = 0 THEN 'PAPER' ELSE 'DIGITAL' END,
       -- 의도: 시작일을 2025-09-10부터 360일에 흩뿌리고(MOD(7n,360)), 상태는 날짜에서 계산해 '기간 지났는데 ACTIVE' 모순을 없앤다.
       --       기준일(2026-09-01) 직후 30일 안에 만료되는 ACTIVE 구독이 몇 건 생긴다(만료 임박 문제 재료).
       DATE_ADD('2025-09-10', INTERVAL MOD(n * 7, 360) DAY),
       DATE_ADD('2025-09-10', INTERVAL MOD(n * 7, 360) + CASE WHEN MOD(n, 3) = 0 THEN 30 ELSE 365 END DAY),
       CASE WHEN MOD(n, 11) = 0 THEN 'CANCELED'
            WHEN DATE_ADD('2025-09-10', INTERVAL MOD(n * 7, 360) + CASE WHEN MOD(n, 3) = 0 THEN 30 ELSE 365 END DAY) < '2026-09-01' THEN 'EXPIRED'
            ELSE 'ACTIVE' END, CASE WHEN MOD(n, 4) = 0 THEN 1 ELSE 0 END,
       DATE_ADD(@base_time, INTERVAL -n DAY), @base_time FROM seq;

INSERT INTO coupon (id, code, name, discount_amount, min_order_amount, valid_from, valid_to, created_at, updated_at)
SELECT n, CONCAT('COUPON-', LPAD(n, 2, '0')), CONCAT('쿠폰', LPAD(n, 2, '0')), n * 1000, n * 5000,
       '2026-01-01 00:00:00', DATE_ADD('2026-01-01 00:00:00', INTERVAL CASE WHEN MOD(n, 3) = 0 THEN 180 ELSE 500 END DAY), @base_time, @base_time
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) x;

INSERT INTO member_coupon (id, member_id, coupon_id, issued_at, used_at, expires_at, member_coupon_status, order_id, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 300)
SELECT n, 1 + MOD(n - 1, 200), 1 + MOD(n - 1, 10), DATE_ADD(@base_time, INTERVAL -MOD(n, 240) DAY),
       CASE WHEN MOD(n, 3) = 0 THEN DATE_ADD(@base_time, INTERVAL -MOD(n, 90) DAY) END,
       DATE_ADD(@base_time, INTERVAL CASE WHEN MOD(n, 5) = 0 THEN -10 ELSE 120 END DAY),
       CASE WHEN MOD(n, 5) = 0 THEN 'EXPIRED' WHEN MOD(n, 3) = 0 THEN 'USED' ELSE 'AVAILABLE' END,
       CASE WHEN MOD(n, 3) = 0 THEN 1 + MOD(n * 7, 1000) END, DATE_ADD(@base_time, INTERVAL -MOD(n, 240) DAY), @base_time FROM seq;

INSERT INTO point_history (id, member_id, order_id, point_type, amount, balance_after, memo, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 1500)
SELECT n, 1 + MOD(n - 1, 200), CASE WHEN MOD(n, 4) = 0 THEN 1 + MOD(n, 1000) END,
       CASE WHEN MOD(n, 11) = 0 THEN 'EXPIRE' WHEN MOD(n, 5) = 0 THEN 'USE' WHEN MOD(n, 17) = 0 THEN 'CANCEL' ELSE 'EARN' END,
       CASE WHEN MOD(n, 11) = 0 OR MOD(n, 5) = 0 THEN -100 * (1 + MOD(n, 10)) ELSE 100 * (1 + MOD(n, 30)) END,
       1000 + MOD(n * 137, 50000), CONCAT('포인트 샘플 ', n), DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY), @base_time FROM seq;

INSERT INTO article (id, category_id, author_id, title, body, article_type, published_at, view_count, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 120)
SELECT n, 3 + MOD(n - 1, 8), 1 + MOD(n - 1, 200), CONCAT('기사 제목 ', LPAD(n, 3, '0')), CONCAT('가짜 콘텐츠 본문 ', n),
       CASE WHEN MOD(n, 4) = 0 THEN 'NOTICE' WHEN MOD(n, 3) = 0 THEN 'EBOOK' WHEN MOD(n, 2) = 0 THEN 'MAGAZINE' ELSE 'NEWS' END,
       CASE WHEN MOD(n, 9) = 0 THEN NULL ELSE DATE_ADD(@base_time, INTERVAL -n DAY) END, MOD(n * 97, 10000), DATE_ADD(@base_time, INTERVAL -n DAY), @base_time FROM seq;

INSERT INTO comment (id, article_id, member_id, parent_id, body, deleted_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 600)
SELECT n, 1 + MOD(n - 1, 120), 1 + MOD(n * 3 - 1, 200), CASE WHEN MOD(n, 5) = 0 THEN n - 1 ELSE NULL END,
       CONCAT('댓글 내용 ', n), CASE WHEN MOD(n, 41) = 0 THEN DATE_ADD(@base_time, INTERVAL -1 DAY) END,
       DATE_ADD(@base_time, INTERVAL -MOD(n, 180) DAY), @base_time FROM seq;

-- 의도: 41~80번 상품은 리뷰가 없어 LEFT JOIN 집계 연습이 가능하다.
INSERT INTO review (id, product_id, member_id, order_item_id, rating, body, deleted_at, created_at, updated_at)
WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n + 1 FROM seq WHERE n < 400)
SELECT n, 1 + MOD(n - 1, 40), 1 + MOD(n * 5 - 1, 200), 1 + MOD(n * 7 - 1, 2500), 1 + MOD(n, 5),
       CASE WHEN MOD(n, 13) = 0 THEN NULL ELSE CONCAT('리뷰 내용 ', n) END,
       CASE WHEN MOD(n, 53) = 0 THEN DATE_ADD(@base_time, INTERVAL -1 DAY) END,
       DATE_ADD(@base_time, INTERVAL -MOD(n, 365) DAY), @base_time FROM seq;
