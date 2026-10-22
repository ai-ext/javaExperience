#!/usr/bin/env bash
# B13 재현: PG 결제 완료 콜백(POST /api/pg/callbacks)이 전부 401이다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380, WireMock PG 18081, Toxiproxy PG 18667)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local --logging.level.org.springframework.security=TRACE'`
#      (포트 8080. Security TRACE 로그로 어느 필터·규칙에서 막혔는지 본다)
#   3) curl, jq, openssl
#
# 실행: bash tickets/B13/repro.sh
#
# 하는 일: 새 회원으로 5000원을 충전해 실제 orderId를 만든 뒤, PG가 보내듯 원문 바이트에 HMAC-SHA256 서명을 붙여 콜백을 보낸다
#          (서명 키는 local 프로파일 기본값. BOARD_PG_SECRET을 바꿨다면 PG_SECRET으로 넘긴다). 서명이 틀린 콜백도 하나 보낸다.
# 기대 증상(결함 상태): 서명이 맞아도 401이고 type이 /errors/unauthorized(인증 필요)다. 서명이 틀린 콜백도 같은 응답이라
#                       서명 검증까지 가지도 못한 것이다. 서버 로그(TRACE)에 AuthorizationFilter가 거부한 기록이 남는다.
#                       수정 뒤: 서명이 맞으면 200, 틀리면 401 /errors/invalid-signature.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
PG_SECRET=${PG_SECRET:-local-dev-only-pg-secret-local-dev-only}

email="b13-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"b13u$RANDOM\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)

charge=$(curl -s -X POST "$BASE/api/me/points/charges" -H "Authorization: Bearer $token" \
  -H "Idempotency-Key: $(uuidgen)" -H 'Content-Type: application/json' -d '{"amount":5000}')
order_id=$(jq -r .orderId <<<"$charge")
echo "충전 응답: $charge"

body="{\"orderId\":\"$order_id\",\"paymentKey\":\"pk-$order_id\",\"status\":\"DONE\",\"amount\":5000}"
sign() { printf '%s' "$body" | openssl dgst -sha256 -hmac "$1" | awk '{print $NF}'; }

echo
echo "== 서명이 맞는 콜백 (토큰 없음)"
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/api/pg/callbacks" -H 'Content-Type: application/json' \
  -H "X-PG-Signature: $(sign "$PG_SECRET")" --data-binary "$body"

echo
echo "== 서명이 틀린 콜백"
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/api/pg/callbacks" -H 'Content-Type: application/json' \
  -H "X-PG-Signature: $(sign wrong-secret)" --data-binary "$body"
