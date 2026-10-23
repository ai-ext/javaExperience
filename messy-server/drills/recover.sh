#!/usr/bin/env bash
# 장애 복구: redis 프록시의 장애(toxic)를 모두 걷고 프록시를 다시 연다. 훈련을 끝낼 때 반드시 실행한다.
# 아직 주입 전인 예약(start.sh)은 취소한다. 끝나면 실제 주입·복구 기록을 보여 준다(회고의 타임라인과 맞춰 본다).
# 다시 조회해 장애가 남아 있지 않고 프록시가 열린 것을 확인한 뒤에만 "복구"를 기록한다. 실패하면 종료 코드 1.
#
# 실행: bash drills/recover.sh
set -euo pipefail

TOXI=${TOXI:-http://localhost:8475}
PROXY=${PROXY:-redis}
OUT=${DRILL_OUT:-/tmp/board-drill}
mkdir -p "$OUT"

now() { date '+%Y-%m-%d %H:%M:%S %z'; }
api() { curl -sf --max-time 5 "$@"; }
fail() {
  echo "$(now) 복구 실패: $*" | tee -a "$OUT/injections.log" >&2
  exit 1
}

# 1) 아직 주입 전인 예약을 취소하고 그 프로세스가 끝났는지 확인한다
if [ -f "$OUT/scheduled.pid" ]; then
  pid=$(cat "$OUT/scheduled.pid")
  touch "$OUT/scheduled.cancel"
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 30); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
  kill -0 "$pid" 2>/dev/null && fail "예약 프로세스($pid)가 끝나지 않았다"
  rm -f "$OUT/scheduled.pid"
  echo "$(now) 예약 취소" >>"$OUT/injections.log"
fi

# 2) 걸린 장애를 모두 지우고 프록시를 연다
toxics=$(api "$TOXI/proxies/$PROXY/toxics") || fail "Toxiproxy($TOXI) 장애 목록을 읽지 못했다"
for name in $(grep -o '"name":"[^"]*"' <<<"$toxics" | cut -d'"' -f4); do
  api -X DELETE "$TOXI/proxies/$PROXY/toxics/$name" >/dev/null || fail "장애 $name 을(를) 지우지 못했다"
done
api -X POST "$TOXI/proxies/$PROXY" -d '{"enabled":true}' >/dev/null || fail "프록시 $PROXY 를 열지 못했다"

# 3) 다시 조회해 확인한다
state=$(api "$TOXI/proxies/$PROXY") || fail "프록시 상태를 다시 읽지 못했다"
grep -q '"enabled":true' <<<"$state" || fail "프록시가 아직 닫혀 있다: $state"
grep -q '"toxics":\[\]' <<<"$state" || fail "장애가 남아 있다: $state"

echo "$(now) 복구: $PROXY 장애 제거, 프록시 열림(재조회 확인)" | tee -a "$OUT/injections.log"
echo
echo "== 이번 훈련의 주입·복구 기록($OUT/injections.log)"
tail -n 6 "$OUT/injections.log"
