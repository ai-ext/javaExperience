#!/usr/bin/env bash
# 장애 복구: redis 프록시의 장애(toxic)를 모두 걷고 프록시를 다시 연다. 훈련을 끝낼 때 반드시 실행한다.
# 아직 주입 전인 예약(start.sh)은 취소하고, 진행 중인 주입은 끝나길 기다린 뒤 걷는다. 끝나면 실제 주입·복구 기록을 보여 준다(회고의 타임라인과 맞춰 본다).
# 다시 조회해 장애가 남아 있지 않고 프록시가 열린 것을 확인한 뒤에만 "복구"를 기록한다. 실패하면 종료 코드 1.
#
# 실행: bash drills/recover.sh
set -euo pipefail

TOXI=${TOXI:-http://localhost:8475}
PROXY=${PROXY:-redis}
OUT=${DRILL_OUT:-/tmp/board-drill}
mkdir -p "$OUT"
# shellcheck source=lib.sh
. "$(dirname "$0")/lib.sh"

api() { curl -sf --max-time 5 "$@"; }
fail() {
  echo "$(now) 복구 실패: $*" | tee -a "$OUT/injections.log" >&2
  exit 1
}

# 0) 예약 표시를 먼저 지운다. 이 뒤로 예약은 주입하지 않는다(진행 중인 inject.sh는 잠금을 잡은 뒤 이것을 보고 멈춘다).
rm -f "$OUT/scheduled.id"
# 진행 중인 주입이 있으면 끝날 때까지 기다린다. 복구한 뒤에 그 주입이 장애를 다시 거는 일을 막는다.
lock || fail "다른 주입·복구가 끝나지 않았다($LOCK)"
trap unlock EXIT

# 1) 아직 주입 전인 예약 프로세스를 끝낸다. pid 파일이 남았어도 그 번호가 예약 프로세스가 아니면 죽이지 않는다.
if [ -f "$OUT/scheduled.pid" ]; then
  pid=$(cat "$OUT/scheduled.pid")
  if is_scheduler "$pid"; then
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 30); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
    kill -0 "$pid" 2>/dev/null && fail "예약 프로세스($pid)가 끝나지 않았다"
    echo "$(now) 예약 취소" >>"$OUT/injections.log"
  else
    echo "$(now) 남은 예약 pid 파일($pid)은 예약 프로세스가 아니라 지우기만 함" >>"$OUT/injections.log"
  fi
  rm -f "$OUT/scheduled.pid"
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
