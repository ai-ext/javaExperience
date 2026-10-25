-- 첫 페이지: OFFSET 방식
SELECT id, published_at, title
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC, id DESC
LIMIT 50 OFFSET 0;

-- 열 번째 페이지 예시: 반환량은 같지만 앞의 450행을 지나간다.
SELECT id, published_at, title
FROM article
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC, id DESC
LIMIT 50 OFFSET 450;

-- 커서 방식: 직전 응답 마지막 행의 published_at, id를 경계로 전달한다.
SELECT id, published_at, title
FROM article
WHERE status = 'PUBLISHED'
  AND (published_at < TIMESTAMP '2026-09-01 12:00:00'
       OR (published_at = TIMESTAMP '2026-09-01 12:00:00' AND id < 700000))
ORDER BY published_at DESC, id DESC
LIMIT 51;
