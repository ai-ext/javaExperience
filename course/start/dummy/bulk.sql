-- MySQL 8.4, D04 커서·인덱스 재실험 / D06 EXISTS·JOIN 비교용.
-- seed.sql의 D02~D05 블록을 넣은 별도 실험 DB에서 전체를 한 번 실행한다.
-- 테이블 이름·컬럼이 다르면 이 줄만 바꿔라: 아래 INSERT INTO·SELECT의 이름.
-- 글 +20,000(공개 +16,000), 댓글 +40,000(미삭제 +36,000), 좋아요 +40,000.
SET @bulk_old_depth = @@SESSION.cte_max_recursion_depth;
SET SESSION cte_max_recursion_depth = 20100;
SET @bulk_at = '2026-01-05 09:00:00.000000';
CREATE TEMPORARY TABLE course_bulk_seq (n INT PRIMARY KEY);
INSERT INTO course_bulk_seq (n)
WITH RECURSIVE seq(n) AS (SELECT 101 UNION ALL SELECT n + 1 FROM seq WHERE n < 20100)
SELECT n FROM seq;
START TRANSACTION;
INSERT INTO post (id, member_id, title, content, status, like_count, created_at, updated_at)
SELECT n, 1 + MOD(n - 1, 19), CONCAT('대량 글 ', n), CONCAT('서버 실험 ', n),
       CASE MOD(n, 10) WHEN 0 THEN 'DELETED' WHEN 1 THEN 'HIDDEN' ELSE 'ACTIVE' END,
       2, @bulk_at, @bulk_at FROM course_bulk_seq ORDER BY n;
INSERT INTO post_tag (id, post_id, tag_id, created_at, updated_at)
SELECT 151 + 2 * (n - 101), n, 1, @bulk_at, @bulk_at FROM course_bulk_seq ORDER BY n;
INSERT INTO post_tag (id, post_id, tag_id, created_at, updated_at)
SELECT 152 + 2 * (n - 101), n, 2, @bulk_at, @bulk_at FROM course_bulk_seq WHERE MOD(n, 2) = 0 ORDER BY n;
INSERT INTO comment (id, post_id, member_id, content, deleted, created_at, updated_at)
SELECT 81 + 2 * (n - 101) + k - 1, n, 1 + MOD(n, 20), CONCAT('대량 댓글 ', n, '-', k),
       k = 2 AND MOD(n, 5) = 0, @bulk_at, @bulk_at
FROM course_bulk_seq CROSS JOIN (SELECT 1 AS k UNION ALL SELECT 2) copies ORDER BY n, k;
INSERT INTO post_like (id, post_id, member_id, created_at, updated_at)
SELECT 151 + 2 * (n - 101) + k - 1, n, 1 + MOD(1 + MOD(n - 1, 19) + k - 1, 20), @bulk_at, @bulk_at
FROM course_bulk_seq CROSS JOIN (SELECT 1 AS k UNION ALL SELECT 2) copies ORDER BY n, k;
COMMIT;
DROP TEMPORARY TABLE course_bulk_seq;
SET SESSION cte_max_recursion_depth = @bulk_old_depth;
-- 도중 에러가 나면 COMMIT하지 말고 ROLLBACK한다. 같은 연결에서 임시 테이블을 제거하고
-- 위 마지막 SET으로 세션 설정을 복구한 뒤 원인을 확인한다. IGNORE/중복 덮어쓰기는 쓰지 않는다.
