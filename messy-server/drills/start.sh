#!/usr/bin/env bash
# 모의 장애 훈련 시작: 지금부터 10~90초 사이 무작위 시각에 Redis 장애를 한 번 넣는다(언제인지 알려 주지 않는다).
# 훈련자는 probe.sh 출력·서버 로그·지표로 이상을 알아차리고, 알아차린 시각과 원인을 지목한 시각을 회고 양식에 적는다.
# 예약은 한 번에 하나만 둔다. 이미 예약이 있으면 시작하지 않는다(recover.sh로 먼저 정리).
#
# 실행
#   bash drills/start.sh              지연 3초(기본)
#   FAULT=down bash drills/start.sh   연결 끊김
#   LATENCY_MS=5000 bash drills/start.sh
# 끝내기: bash drills/recover.sh (예약 취소·장애 제거, 실제 주입 시각을 그때 보여 준다)
set -euo pipefail
cd "$(dirname "$0")"

OUT=${DRILL_OUT:-/tmp/board-drill}
FAULT=${FAULT:-latency}
LATENCY_MS=${LATENCY_MS:-3000}
mkdir -p "$OUT"
# shellcheck source=lib.sh
. ./lib.sh

if [ -f "$OUT/scheduled.pid" ]; then
  pid=$(cat "$OUT/scheduled.pid")
  if is_scheduler "$pid"; then
    echo "이미 예약된 훈련이 있다(pid $pid). bash drills/recover.sh로 정리한 뒤 다시 시작한다." >&2
    exit 1
  fi
fi
rm -f "$OUT/scheduled.pid" "$OUT/scheduled.id"

bash ./inject.sh status >/dev/null || { echo "Toxiproxy redis 프록시가 없다. messy-server에서 docker compose up -d부터." >&2; exit 1; }

# 예약 표시. recover.sh가 이 파일을 지우면 예약은 주입하지 않고 끝난다(inject.sh도 잠금을 잡은 뒤 다시 본다).
token="$(date +%s)-$$-$RANDOM"
echo "$token" >"$OUT/scheduled.id"

delay=$((10 + RANDOM % 81))
echo "$(now) 훈련 시작(장애 종류는 $FAULT, 주입 시각은 비공개)" | tee -a "$OUT/injections.log"
(
  alive() { [ "$(cat "$OUT/scheduled.id" 2>/dev/null)" = "$token" ]; }
  for _ in $(seq 1 "$delay"); do
    alive || exit 0
    sleep 1
  done
  alive || exit 0
  if [ "$FAULT" = down ]; then
    DRILL_TOKEN=$token bash ./inject.sh down
  else
    DRILL_TOKEN=$token bash ./inject.sh latency "$LATENCY_MS"
  fi
  # 자기 예약 파일일 때만 지운다. macOS 기본 bash 3.2에는 BASHPID가 없어 exec한 sh의 부모 PID로 자기 PID를 얻는다.
  self=$(exec sh -c 'echo $PPID')
  [ "$(cat "$OUT/scheduled.pid" 2>/dev/null)" = "$self" ] && rm -f "$OUT/scheduled.pid"
  alive && rm -f "$OUT/scheduled.id"
) >/dev/null 2>&1 &
echo $! >"$OUT/scheduled.pid"

echo "다른 터미널에서 bash drills/probe.sh 를 켜 두고 지켜본다. 재시작부터 하지 말고 증거(evidence.sh)부터 남긴다."
