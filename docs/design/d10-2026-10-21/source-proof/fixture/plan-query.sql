-- 추가 disposable SQLite 표의 같은 SELECT. PG DATE/INTERVAL 실행이 아니다.
SELECT id, status FROM orders
WHERE customer_id = ? AND created_at >= ?
ORDER BY created_at, id;
