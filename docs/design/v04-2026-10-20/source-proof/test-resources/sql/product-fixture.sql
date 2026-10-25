INSERT INTO category (id, name, depth, sort_order, created_at, updated_at)
VALUES (9001, '테스트 분류', 1, 1, '2026-09-01 00:00:00', '2026-09-01 00:00:00');
INSERT INTO product (id, category_id, name, product_type, price, stock, sale_status, created_at, updated_at)
VALUES (9001, 9001, '테스트 상품', 'GOODS', 12000, 3, 'ON_SALE', '2026-09-01 00:00:00', '2026-09-01 00:00:00');
