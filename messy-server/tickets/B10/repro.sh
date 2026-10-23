#!/usr/bin/env bash
# B10 재현: 포인트 충전이 가끔 두 번 된다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, WireMock 18081, Toxiproxy PG 프록시 18667)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl, jq, uuidgen, openssl, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B10/repro.sh   (서명 키는 local 프로파일 기본값. BOARD_PG_SECRET을 바꿨다면 PG_SECRET으로 넘긴다)
#
# 두 단계로 나눠 보여 준다.
#   1단계 "승인 요청이 두 번 간다": WireMock을 "첫 승인 요청은 승인하되 5초 뒤에 답하고, 그다음부터는 바로 답하는"
#     PG로 바꾼 뒤 Idempotency-Key 하나로 7000포인트를 한 번 충전한다. PG가 받은 승인 요청과 우리 연계 로그(pg_payment)를 출력한다.
#     기대 증상(결함 상태): 충전 한 번인데 PG가 받은 승인 요청이 2건(= PG 승인 2건, 카드 결제 2번. 요청마다 헤더를 함께 찍는다),
#     pg_payment에 같은 회원·같은 금액 행이 2개(UNKNOWN 1, DONE 1). 이 시점 잔액은 아직 7000이다(DONE 행만 적립).
#   2단계 "정산하면 포인트가 두 번 쌓인다": PG는 첫 요청도 승인했으므로, PG가 하듯 결과 불명(UNKNOWN) 행의 orderId로
#     서명(HMAC-SHA256)을 붙인 결제 완료 콜백(DONE)을 보낸다. 기대 증상(결함 상태): 잔액 14000, 충전 원장 2건.
#     이 서버에는 지금 토큰 없는 콜백이 401로 막히는 다른 증상(티켓 B13 "PG 결제 완료 콜백이 전부 401")이 있어,
#     재현에서는 회원 토큰을 붙여 그 문제를 비켜 간다(서명 검증과 반영 로직은 그대로 거친다).
#     결과 불명 건을 PG 조회로 확정하는 ChargeService.reconcile은 이 서버에서 부르는 곳(워커·API)이 없다. 확인 테스트는 reconcile을 직접 부른다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
WIREMOCK=${WIREMOCK:-http://localhost:18081}
sql() { docker compose exec -T mysql mysql -uboard -pboard board -e "$1" 2>/dev/null; }
sqln() { docker compose exec -T mysql mysql -uboard -pboard board -N -e "$1" 2>/dev/null; }
PG_SECRET=${PG_SECRET:-local-dev-only-pg-secret-local-dev-only}

cleanup() {
  for id in b1000000-0000-0000-0000-000000000001 b1000000-0000-0000-0000-000000000002; do
    curl -s -X DELETE "$WIREMOCK/__admin/mappings/$id" >/dev/null || true
  done
  curl -s -X POST "$WIREMOCK/__admin/scenarios/reset" >/dev/null || true
}
trap cleanup EXIT

body='"{\"paymentKey\":\"pk-{{jsonPath request.body '"'"'$.orderId'"'"'}}\",\"status\":\"DONE\",\"amount\":{{jsonPath request.body '"'"'$.amount'"'"'}},\"approvedAt\":\"{{now}}\"}"'
curl -s -X POST "$WIREMOCK/__admin/scenarios/reset" >/dev/null
curl -s -X POST "$WIREMOCK/__admin/mappings" -d '{"id":"b1000000-0000-0000-0000-000000000001","priority":1,
  "scenarioName":"b10","requiredScenarioState":"Started","newScenarioState":"approved",
  "request":{"method":"POST","urlPath":"/pg/v1/payments"},
  "response":{"status":200,"fixedDelayMilliseconds":5000,"headers":{"Content-Type":"application/json"},
   "body":'"$body"',"transformers":["response-template"]}}' >/dev/null
curl -s -X POST "$WIREMOCK/__admin/mappings" -d '{"id":"b1000000-0000-0000-0000-000000000002","priority":1,
  "scenarioName":"b10","requiredScenarioState":"approved",
  "request":{"method":"POST","urlPath":"/pg/v1/payments"},
  "response":{"status":200,"headers":{"Content-Type":"application/json"},
   "body":'"$body"',"transformers":["response-template"]}}' >/dev/null
curl -s -X DELETE "$WIREMOCK/__admin/requests" >/dev/null

email="b10-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"b10u$RANDOM\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)
mid=$(curl -s "$BASE/api/members/me" -H "Authorization: Bearer $token" | jq -r .id)
key=$(uuidgen)

echo "=== 1단계: 충전 한 번 → PG 승인 요청이 몇 번 갔나"
echo "충전 요청(Idempotency-Key=$key)"
curl -s -w '\n-> %{http_code} %{time_total}s\n' -X POST "$BASE/api/me/points/charges" -H "Authorization: Bearer $token" \
  -H "Idempotency-Key: $key" -H 'Content-Type: application/json' -d '{"amount":7000}'

echo "--- PG(WireMock)가 받은 승인 요청의 Idempotency-Key"
curl -s -X POST "$WIREMOCK/__admin/requests/find" -d '{"method":"POST","urlPath":"/pg/v1/payments"}' \
  | jq -r '.requests[].headers["Idempotency-Key"]'
echo "--- 우리 연계 로그(pg_payment)"
sql "SELECT id, order_id, idempotency_key, status, amount FROM pg_payment WHERE member_id = $mid ORDER BY id"
balance() {
  echo "잔액 $(sqln "SELECT point_balance FROM member WHERE id = $mid"), 충전 원장 $(sqln "SELECT COUNT(*) FROM point_ledger WHERE member_id = $mid AND type = 'CHARGE'")건"
}
echo "--- 1단계 뒤 $(balance)"

echo
echo "=== 2단계: 결과 불명(UNKNOWN) 건을 PG의 결제 완료 콜백으로 확정한다"
orders=$(sqln "SELECT order_id FROM pg_payment WHERE member_id = $mid AND status = 'UNKNOWN' ORDER BY id")
if [ -z "$orders" ]; then
  echo "결과 불명 행이 없다(1단계 출력을 확인하라)."
fi
for oid in $orders; do
  body="{\"orderId\":\"$oid\",\"paymentKey\":\"pk-$oid\",\"status\":\"DONE\",\"amount\":7000}"
  sig=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$PG_SECRET" | awk '{print $NF}')
  curl -s -o /dev/null -w "콜백 orderId=$oid -> %{http_code}\n" -X POST "$BASE/api/pg/callbacks" \
    -H 'Content-Type: application/json' -H "X-PG-Signature: $sig" -H "Authorization: Bearer $token" --data-binary "$body"
done
echo "--- 우리 연계 로그(pg_payment)"
sql "SELECT id, order_id, idempotency_key, status, amount FROM pg_payment WHERE member_id = $mid ORDER BY id"
echo "--- 2단계 뒤 $(balance)   (7000을 한 번 충전했으니 기대값은 잔액 7000, 원장 1건)"
