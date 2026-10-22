#!/usr/bin/env bash
# B01 재현: PG가 느린 날 글 목록까지 멈춘다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380, WireMock 18081, Toxiproxy API 8475 / PG 프록시 18667)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local --management.endpoints.web.exposure.include=health,metrics'`
#      (포트 8080. metrics 노출은 아래 Hikari 지표를 보려고 붙인 것이다)
#   3) curl, jq
#
# 실행: bash tickets/B01/repro.sh
#
# 하는 일: Toxiproxy로 PG 응답을 5초 늦춘 뒤 서로 다른 회원 12명이 동시에 포인트를 충전한다.
#          그동안 충전과 상관없는 GET /api/posts를 부르고 응답 코드·시간과 Hikari 지표를 찍는다.
# 기대 증상(결함 상태): GET /api/posts가 2초쯤 기다린 뒤 500으로 끝난다(또는 수 초 걸린다).
#                       hikaricp.connections.active=10, pending>0. 수정 뒤에는 1초 안에 200이다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
TOXI=${TOXI:-http://localhost:8475}
N=${N:-12}

cleanup() {
  curl -s -X DELETE "$TOXI/proxies/pg/toxics/pg-latency" >/dev/null || true
}
trap cleanup EXIT

token_for() {
  local email="b01-$1-$RANDOM$RANDOM@t.com" nick="b01u$1x$RANDOM"
  curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"$nick\"}" >/dev/null
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken
}

echo "회원 ${N}명 준비"
tokens=()
for i in $(seq 1 "$N"); do tokens+=("$(token_for "$i")"); done

echo "평소 GET /api/posts: $(curl -s -o /dev/null -w '%{http_code} %{time_total}s' "$BASE/api/posts")"

echo "PG 응답 5초 지연 주입"
cleanup
curl -s -X POST "$TOXI/proxies/pg/toxics" \
  -d '{"name":"pg-latency","type":"latency","stream":"downstream","attributes":{"latency":5000}}' >/dev/null

for t in "${tokens[@]}"; do
  curl -s -o /dev/null -w "충전 %{http_code} %{time_total}s\n" -X POST "$BASE/api/me/points/charges" \
    -H "Authorization: Bearer $t" -H "Idempotency-Key: $(uuidgen)" \
    -H 'Content-Type: application/json' -d '{"amount":5000}' &
done
sleep 1

metric() {
  curl -s "$BASE/actuator/metrics/$1" | jq -r '.measurements[0].value // "metrics 미노출"' 2>/dev/null || echo "metrics 미노출"
}
echo "hikaricp.connections.active=$(metric hikaricp.connections.active) pending=$(metric hikaricp.connections.pending)"
echo "PG 지연 중 GET /api/posts: $(curl -s -o /dev/null -w '%{http_code} %{time_total}s' "$BASE/api/posts")"
echo "(이 순간 스레드 덤프: jcmd \$(pgrep -f BoardApplication) Thread.print | grep -B2 -A25 'PgClient')"
wait
