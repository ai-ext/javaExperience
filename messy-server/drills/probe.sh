#!/usr/bin/env bash
# 사용자 흉내: 1초마다 글을 쓰고(POST /api/posts) 인기글을 읽어(GET /api/posts/popular) 상태 코드와 걸린 시간을 찍는다.
# 1초를 넘기거나 기대 코드(201·200)가 아니면 줄 끝에 '!!'를 붙인다. 출력은 $DRILL_OUT/probe-*.log에도 남는다.
#
# 전제: 서버가 BASE(기본 http://localhost:8080)에 떠 있다. curl, jq.
# 실행: bash drills/probe.sh   (Ctrl+C로 끝낸다)
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
OUT=${DRILL_OUT:-/tmp/board-drill}
MAX=${MAX_SECONDS:-10}
mkdir -p "$OUT"
log="$OUT/probe-$(date +%Y%m%d-%H%M%S).log"

email="drill-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"drill$RANDOM\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)

call() {
  local expect=$1; shift
  local out code t flag=""
  # curl은 실패해도 -w를 한 번 찍는다(코드 000, 실제 걸린 시간). 바로 거절돼도 그 시간이 남는다. 아무것도 못 찍었을 때만 MAX로 둔다.
  out=$(curl -s -o /dev/null --max-time "$MAX" -w '%{http_code} %{time_total}' "$@") || true
  [ -n "$out" ] || out="000 $MAX"
  code=${out% *}; t=${out#* }
  if [ "$code" != "$expect" ] || awk -v t="$t" 'BEGIN { exit !(t >= 1.0) }'; then flag=" !!"; fi
  printf '%s %5.2fs%s' "$code" "$t" "$flag"
}

echo "기록: $log"
while true; do
  w=$(call 201 -X POST "$BASE/api/posts" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d '{"title":"훈련 글","content":"내용"}')
  p=$(call 200 "$BASE/api/posts/popular")
  echo "$(date '+%H:%M:%S') 글쓰기 $w | 인기글 $p" | tee -a "$log"
  sleep 1
done
