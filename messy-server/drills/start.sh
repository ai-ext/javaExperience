#!/usr/bin/env bash
# 모의 장애 훈련 시작: 지금부터 10~90초 사이 무작위 시각에 Redis 장애를 한 번 넣는다(언제인지 알려 주지 않는다).
# 훈련자는 probe.sh 출력·서버 로그·지표로 이상을 알아차리고, 알아차린 시각과 원인을 지목한 시각을 회고 양식에 적는다.
#
# 실행
#   bash drills/start.sh              지연 3초(기본)
#   FAULT=down bash drills/start.sh   연결 끊김
#   LATENCY_MS=5000 bash drills/start.sh
# 끝내기: bash drills/recover.sh (실제 주입 시각을 그때 보여 준다)
set -euo pipefail
cd "$(dirname "$0")"

OUT=${DRILL_OUT:-/tmp/board-drill}
FAULT=${FAULT:-latency}
LATENCY_MS=${LATENCY_MS:-3000}
mkdir -p "$OUT"

bash ./inject.sh status >/dev/null || { echo "Toxiproxy redis 프록시가 없다. messy-server에서 docker compose up -d부터." >&2; exit 1; }

delay=$((10 + RANDOM % 81))
echo "$(date '+%Y-%m-%d %H:%M:%S %z') 훈련 시작(장애 종류는 $FAULT, 주입 시각은 비공개)" | tee -a "$OUT/injections.log"
(
  sleep "$delay"
  if [ "$FAULT" = down ]; then bash ./inject.sh down; else bash ./inject.sh latency "$LATENCY_MS"; fi
  rm -f "$OUT/scheduled.pid"
) >/dev/null 2>&1 &
echo $! >"$OUT/scheduled.pid"

echo "다른 터미널에서 bash drills/probe.sh 를 켜 두고 지켜본다. 재시작부터 하지 말고 증거(evidence.sh)부터 남긴다."
