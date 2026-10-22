#!/usr/bin/env bash
# 장애 복구: redis 프록시의 장애(toxic)를 모두 걷고 프록시를 다시 연다. 훈련을 끝낼 때 반드시 실행한다.
# start.sh로 시작한 훈련이면 실제 주입 시각을 함께 보여 준다(회고의 타임라인과 맞춰 본다).
#
# 실행: bash drills/recover.sh
set -euo pipefail

TOXI=${TOXI:-http://localhost:8475}
PROXY=${PROXY:-redis}
OUT=${DRILL_OUT:-/tmp/board-drill}
mkdir -p "$OUT"

# 아직 주입 전이면 예약된 주입을 취소한다
if [ -f "$OUT/scheduled.pid" ]; then
  kill "$(cat "$OUT/scheduled.pid")" 2>/dev/null || true
  rm -f "$OUT/scheduled.pid"
fi

toxics=$(curl -sf "$TOXI/proxies/$PROXY/toxics" || echo '[]')
for name in $(grep -o '"name":"[^"]*"' <<<"$toxics" | cut -d'"' -f4); do
  curl -sf -X DELETE "$TOXI/proxies/$PROXY/toxics/$name" >/dev/null || true
done
curl -sf -X POST "$TOXI/proxies/$PROXY" -d '{"enabled":true}' >/dev/null
echo "$(date '+%Y-%m-%d %H:%M:%S %z') 복구: $PROXY 장애 제거, 프록시 열림" | tee -a "$OUT/injections.log"

echo
echo "== 이번 훈련의 주입·복구 기록($OUT/injections.log)"
tail -n 5 "$OUT/injections.log"
