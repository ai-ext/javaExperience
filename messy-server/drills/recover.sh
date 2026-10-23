#!/usr/bin/env bash
# 장애 복구: redis 프록시의 장애(toxic)를 모두 걷고 프록시를 다시 연다. 훈련을 끝낼 때 반드시 실행한다.
# 아직 주입 전인 예약(start.sh)은 예약 표시를 지워 취소하고, 진행 중인 주입은 끝나길 기다린 뒤 걷는다. 끝나면 실제 주입·복구 기록을 보여 준다(회고의 타임라인과 맞춰 본다).
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

# 진행 중인 시작·주입이 있으면 끝날 때까지 기다린다. 복구한 뒤에 그 주입이 장애를 다시 거는 일을 막는다.
lock || fail "다른 시작·주입·복구가 끝나지 않았다($LOCK)"
trap unlock EXIT

# 1) 예약 취소: 예약 표시를 지운다. 신호는 보내지 않는다. 예약 프로세스는 1초 안에 이것을 보고 스스로 끝나고,
#    주입 직전이었다면 inject.sh가 잠금을 잡은 뒤 이것을 보고 주입하지 않는다.
if [ -f "$OUT/scheduled.id" ]; then
  rm -f "$OUT/scheduled.id"
  echo "$(now) 예약 취소" >>"$OUT/injections.log"
fi
# 예약 프로세스가 끝나길 잠깐(2초) 기다린다. 남은 표시는 죽은 예약의 흔적이라 지운다.
for _ in $(seq 1 20); do
  ls "$OUT"/scheduler.* >/dev/null 2>&1 || break
  sleep 0.1
done
rm -f "$OUT"/scheduler.*

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
