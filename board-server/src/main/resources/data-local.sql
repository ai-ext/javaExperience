-- 로컬 프로파일 전용 시드. 기동할 때마다 실행되므로 INSERT IGNORE로 멱등하게 둔다.
-- 관리자 로컬 비밀번호는 Admin1234! (로컬 개발 전용). id를 고정하지 않는다(이미 쓰는 id와 충돌하면 조용히 무시된다).
INSERT IGNORE INTO member (email, password_hash, nickname, role, point_balance, created_at, updated_at)
VALUES ('admin@board.local', '$2y$10$fyrIkQSV8/l1nxTiHj6mb.jtBWcc1kBgOAyYT//wxsFYKGfbYmmWa', 'admin', 'ADMIN', 0, NOW(6), NOW(6));

INSERT IGNORE INTO coupon (id, name, total_quantity, issued_quantity, expires_at, created_at, updated_at)
VALUES (1, '웰컴 쿠폰', 10, 0, DATE_ADD(NOW(6), INTERVAL 30 DAY), NOW(6), NOW(6));

INSERT IGNORE INTO shop_item (id, name, price, stock, created_at, updated_at) VALUES
    (1, '아메리카노 기프티콘', 500, 100, NOW(6), NOW(6)),
    (2, '프로필 배지', 1000, 50, NOW(6), NOW(6)),
    (3, '닉네임 변경권', 2000, 30, NOW(6), NOW(6));
