#!/usr/bin/env bash
# B02 재현: 글 목록이 어느 날부터 느리다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, root 비밀번호는 DB_ROOT_PASSWORD 또는 root)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl
#   주의: 고친 뒤 로컬 DB에서 다시 확인하는 방법은 티켓 페이지 "원인과 정답"에 있다.
#
# 실행: bash tickets/B02/repro.sh            (글 OLD+SPAM건을 넣고 측정)
#       REPRO_CLEAN=1 bash tickets/B02/repro.sh  (넣은 글만 지운다)
#
# 하는 일: 오래된 글 OLD건(ACTIVE·DELETED 반반) 위에 최근 스팸 SPAM건(HIDDEN)을 쌓는다(관리자가 스팸을 일괄 숨긴 상황).
#          slow query log(테이블 출력)를 켜고 GET /api/posts 첫 쪽·다음 쪽을 부른 뒤, slow log와 EXPLAIN ANALYZE를 보여 준다.
# 기대 증상(결함 상태): 첫 쪽 목록 쿼리가 slow log·performance_schema 요약에 수십 ms로 남는다(데이터가 늘수록 같이 는다).
#                       다음 쪽(커서)은 1ms 안쪽이다. rows_examined는 파생 테이블 안쪽을 세지 않아 40 남짓으로 작게 나온다(속지 말 것).
#                       EXPLAIN ANALYZE에 "Index scan on post using PRIMARY (reverse) ... rows=<SPAM+42 안팎>",
#                       Handler_read_prev도 같은 수만큼 오른다.
set -euo pipefail

cd "$(dirname "$0")/../.."
BASE=${BASE:-http://localhost:8080}
OLD=${OLD:-200000}
SPAM=${SPAM:-200000}
ROOT_PW=${DB_ROOT_PASSWORD:-root}

sql() {
  docker compose exec -T mysql mysql -uroot -p"$ROOT_PW" --table board -e "$1" 2>/dev/null
}

if [ "${REPRO_CLEAN:-0}" = 1 ]; then
  sql "DELETE FROM post WHERE title LIKE 'b02-%'"
  sql "SET GLOBAL slow_query_log = OFF"
  echo "넣은 글을 지우고 slow log를 껐다."
  exit 0
fi

author=$(docker compose exec -T mysql mysql -uroot -p"$ROOT_PW" -N board \
  -e "SELECT id FROM member WHERE email = 'admin@board.local'" 2>/dev/null | tr -d '\r')
[ -n "$author" ] || { echo "local 시드 회원(admin@board.local)이 없다. local 프로파일로 한 번 기동했는지 확인" >&2; exit 1; }

echo "== 글 넣기: 오래된 글 ${OLD}건(ACTIVE 절반) + 최근 스팸 숨김 ${SPAM}건 (수십 초 걸린다)"
# 0~999 세 개를 곱해 최대 10억까지 번호를 만든다(재귀 깊이 기본값 1000 안쪽)
nums="WITH RECURSIVE d(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM d WHERE i < 999)
      SELECT a.i * 1000 + b.i AS n FROM d a CROSS JOIN d b"
sql "INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)
     SELECT $author, CONCAT('b02-글', n), '내용', IF(n % 2 = 0, 'ACTIVE', 'DELETED'), 0, NOW(6), NOW(6)
     FROM ($nums) t WHERE n < $OLD ORDER BY n"
sql "INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)
     SELECT $author, CONCAT('b02-스팸', n), '광고', 'HIDDEN', 0, NOW(6), NOW(6)
     FROM ($nums) t WHERE n < $SPAM ORDER BY n"
sql "ANALYZE TABLE post" >/dev/null
sql "SELECT status, COUNT(*) AS cnt FROM post GROUP BY status"

echo "== slow query log 켜기(10ms 이상, 테이블로 남긴다)"
# long_query_time은 연결을 맺을 때 읽힌다. 이미 떠 있던 서버의 커넥션 풀에는 적용되지 않으므로
# slow log에 아무것도 없으면 서버를 다시 띄운 뒤 이 스크립트를 한 번 더 실행한다(아래 performance_schema 요약은 바로 보인다).
sql "SET GLOBAL log_output = 'TABLE'; SET GLOBAL long_query_time = 0.01; SET GLOBAL slow_query_log = ON; TRUNCATE mysql.slow_log"
sql "TRUNCATE performance_schema.events_statements_summary_by_digest"

echo "== GET /api/posts 첫 쪽 5번"
next=""
for i in 1 2 3 4 5; do
  out=$(curl -s -o /tmp/b02-list.json -w '%{http_code} %{time_total}s' "$BASE/api/posts?size=20")
  echo "  첫 쪽: $out"
done
next=$(sed -n 's/.*"nextCursor":"\([^"]*\)".*/\1/p' /tmp/b02-list.json)
if [ -n "$next" ]; then
  out=$(curl -s -o /dev/null -w '%{http_code} %{time_total}s' "$BASE/api/posts?size=20&cursor=$next")
  echo "  다음 쪽: $out"
fi

echo "== slow log (최근 5건)"
sql "SELECT start_time, query_time, rows_sent, rows_examined, LEFT(REPLACE(CONVERT(sql_text USING utf8mb4), '\n', ' '), 90) AS sql_text
     FROM mysql.slow_log WHERE sql_text LIKE '%FROM post%' ORDER BY start_time DESC LIMIT 5"

echo "== performance_schema 쿼리 요약(목록 쿼리: 첫 쪽과 다음 쪽이 따로 잡힌다)"
sql "SELECT COUNT_STAR AS calls, ROUND(AVG_TIMER_WAIT / 1000000000, 1) AS avg_ms,
            ROUND(SUM_ROWS_EXAMINED / COUNT_STAR) AS rows_examined, LEFT(DIGEST_TEXT, 70) AS query
     FROM performance_schema.events_statements_summary_by_digest
     WHERE SCHEMA_NAME = 'board' AND DIGEST_TEXT LIKE 'SELECT \`p\` . \`id\`%'
     ORDER BY AVG_TIMER_WAIT DESC LIMIT 5"

echo "== EXPLAIN ANALYZE (목록 쿼리의 안쪽 SELECT)"
docker compose exec -T mysql mysql -uroot -p"$ROOT_PW" board -e "EXPLAIN ANALYZE
  SELECT id, member_id, title, like_count, created_at FROM post
  WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 21\G" 2>/dev/null

echo "== 같은 쿼리를 실행하고 세션 Handler_read_prev(인덱스를 거꾸로 한 칸씩 읽은 횟수)를 본다"
sql "FLUSH STATUS;
     SELECT COUNT(*) AS rows_returned FROM (SELECT id FROM post WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 21) p;
     SHOW SESSION STATUS LIKE 'Handler_read_prev'"

sql "SET GLOBAL slow_query_log = OFF"
echo "정리: REPRO_CLEAN=1 bash tickets/B02/repro.sh"
