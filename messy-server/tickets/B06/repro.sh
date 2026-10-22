#!/usr/bin/env bash
# B06 재현: 컬럼 하나 추가했더니 상점 전체가 멈췄다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, WireMock 18081, Toxiproxy PG 프록시 18667)
#   2) 구매 알림 웹훅을 켜고 기동(알림 서버는 compose의 WireMock으로 대신한다):
#      `./gradlew bootRun --args='--spring.profiles.active=local --board.shop.order-webhook-url=http://localhost:18667/hooks/orders'`
#   3) curl, jq, uuidgen, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B06/repro.sh
#
# 하는 일: 알림 서버(WireMock /hooks/orders)가 8초 늦게 답하게 한 뒤
#   ① 회원 A가 주문(알림 응답을 기다리는 중) → ② 다른 세션에서 ALTER TABLE shop_item ADD COLUMN → ③ 회원 B가 주문.
# 기대 증상(결함 상태): ③이 ①의 알림이 끝날 때까지(수 초) 멈춘다. GET /api/shop/items도 같이 멈춘다.
#   그 순간 SHOW PROCESSLIST에 ALTER가 `Waiting for table metadata lock`, 뒤의 쿼리들도 같은 상태로 줄 서 있고,
#   맨 앞에는 아무 쿼리도 실행하지 않는(Sleep) 트랜잭션이 있다(information_schema.innodb_trx로 확인).
# 수정 뒤: ALTER가 바로 끝나고 ③은 평소처럼 응답한다(③도 커밋 뒤 알림 때문에 응답은 늦을 수 있으니 주문 반영 시각을 본다).
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
WIREMOCK=${WIREMOCK:-http://localhost:18081}
sql() { docker compose exec -T mysql mysql -uboard -pboard board -e "$1" 2>/dev/null; }

cleanup() {
  curl -s -X DELETE "$WIREMOCK/__admin/mappings/b0600000-0000-0000-0000-000000000006" >/dev/null || true
  sql "SET SESSION lock_wait_timeout = 30; ALTER TABLE shop_item DROP COLUMN discount_note" >/dev/null 2>&1 || true
}
trap cleanup EXIT

token_for() {
  local email="b06-$1-$RANDOM$RANDOM@t.com" nick="b06u$1x$RANDOM"
  curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"$nick\"}" >/dev/null
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken
}
order() {
  curl -s -o /dev/null -w "$2 주문 %{http_code} %{time_total}s\n" -X POST "$BASE/api/shop/orders" \
    -H "Authorization: Bearer $1" -H "Idempotency-Key: $(uuidgen)" -H 'Content-Type: application/json' \
    -d '{"itemId":1,"quantity":1}'
}

ta=$(token_for a); tb=$(token_for b)
sql "UPDATE member SET point_balance = 10000 WHERE nickname LIKE 'b06u%'"

curl -s -X POST "$WIREMOCK/__admin/mappings" -d '{"id":"b0600000-0000-0000-0000-000000000006","priority":1,
  "request":{"method":"POST","urlPath":"/hooks/orders"},"response":{"status":200,"fixedDelayMilliseconds":8000}}' >/dev/null

order "$ta" A &
sleep 1
echo "ALTER 시작(lock_wait_timeout 30초)"
( sql "SET SESSION lock_wait_timeout = 30; ALTER TABLE shop_item ADD COLUMN discount_note VARCHAR(20) NULL"
  echo "ALTER 끝" ) &
sleep 1
order "$tb" B &
sleep 1
echo "--- 상품 목록(1초 안에 와야 정상)"
curl -s -o /dev/null -m 15 -w "GET /api/shop/items %{http_code} %{time_total}s\n" "$BASE/api/shop/items" &
sleep 1
echo "--- SHOW PROCESSLIST"
sql "SELECT id, command, time, state, LEFT(info, 60) AS info FROM information_schema.processlist WHERE db = 'board' ORDER BY time DESC"
echo "--- 열린 트랜잭션"
sql "SELECT trx_mysql_thread_id, trx_started, trx_state, LEFT(trx_query, 60) FROM information_schema.innodb_trx"
wait
