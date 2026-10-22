#!/usr/bin/env bash
# B10 재현: 포인트 충전이 가끔 두 번 된다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, WireMock 18081, Toxiproxy PG 프록시 18667)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080, PG 응답 타임아웃 3초)
#   3) curl, jq, uuidgen, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B10/repro.sh
#
# 하는 일: WireMock을 "첫 승인 요청은 승인하되 5초 뒤에 답하고(우리 서버는 3초에 포기), 그다음부터는 바로 답하는" PG로 바꾼 뒤
#          Idempotency-Key 하나로 7000포인트를 한 번 충전한다. PG가 받은 승인 요청과 우리 연계 로그(pg_payment)를 출력한다.
# 기대 증상(결함 상태): 충전 한 번인데 PG가 받은 승인 요청이 서로 다른 Idempotency-Key로 2건(= PG 승인 2건, 카드 결제 2번),
#   pg_payment에 같은 회원·같은 금액 행이 2개(UNKNOWN 1, DONE 1). UNKNOWN 건은 PG 콜백이나 재처리 워커(ChargeService.reconcile)가
#   PG 조회로 DONE이 되면서 한 번 더 적립된다 → 포인트 두 번.
#   (이 서버는 콜백 경로에 다른 문제가 있을 수 있어 스크립트는 콜백을 보내지 않는다. 확인 테스트는 reconcile로 확정한다.)
# 수정 뒤: PG 승인 요청의 키는 1개, pg_payment 행도 1개(UNKNOWN, 504로 응답)이고 확정 뒤 적립은 한 번이다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
WIREMOCK=${WIREMOCK:-http://localhost:18081}
sql() { docker compose exec -T mysql mysql -uboard -pboard board -e "$1" 2>/dev/null; }

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

echo "충전 요청(Idempotency-Key=$key)"
curl -s -w '\n-> %{http_code} %{time_total}s\n' -X POST "$BASE/api/me/points/charges" -H "Authorization: Bearer $token" \
  -H "Idempotency-Key: $key" -H 'Content-Type: application/json' -d '{"amount":7000}'

echo "--- PG(WireMock)가 받은 승인 요청의 Idempotency-Key"
curl -s -X POST "$WIREMOCK/__admin/requests/find" -d '{"method":"POST","urlPath":"/pg/v1/payments"}' \
  | jq -r '.requests[].headers["Idempotency-Key"]'
echo "--- 우리 연계 로그(pg_payment)"
sql "SELECT id, order_id, idempotency_key, status, amount FROM pg_payment WHERE member_id = $mid ORDER BY id"
echo "--- 잔액·충전 원장"
sql "SELECT point_balance FROM member WHERE id = $mid; SELECT COUNT(*) AS charge_ledgers FROM point_ledger WHERE member_id = $mid AND type = 'CHARGE'"
