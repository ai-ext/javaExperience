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

# 예약 확인·등록은 inject·recover와 같은 잠금 안에서 한다(시작과 복구가 엇갈리지 않게)
lock || { echo "다른 시작·주입·복구가 진행 중이다($LOCK). 끝난 뒤 다시 실행한다." >&2; exit 1; }
trap unlock EXIT

# 예약 표시(scheduled.id)가 있으면 예약이 살아 있다. 주입이 끝나면 inject.sh가, 취소하면 recover.sh가 지운다.
if [ -f "$OUT/scheduled.id" ]; then
  echo "이미 예약된 훈련이 있다. bash drills/recover.sh로 정리한 뒤 다시 시작한다." >&2
  exit 1
fi

bash ./inject.sh status >/dev/null || { echo "Toxiproxy redis 프록시가 없다. messy-server에서 docker compose up -d부터." >&2; exit 1; }

token="$(date +%s)-$$-$RANDOM"
echo "$token" >"$OUT/scheduled.id"

delay=$((10 + RANDOM % 81))
echo "$(now) 훈련 시작(장애 종류는 $FAULT, 주입 시각은 비공개)" | tee -a "$OUT/injections.log"
# 예약 프로세스. 신호로 멈추지 않는다. 1초마다 예약 표시를 보고, 지워지거나 바뀌었으면 스스로 끝난다.
# 주입 직전에는 inject.sh가 잠금 안에서 한 번 더 본다. 살아 있는 동안 scheduler.<토큰> 파일을 둔다(recover.sh가 끝나길 기다릴 때 본다).
(
  trap 'rm -f "$OUT/scheduler.$token"' EXIT
  : >"$OUT/scheduler.$token"
  alive() { [ "$(cat "$OUT/scheduled.id" 2>/dev/null)" = "$token" ]; }
  for _ in $(seq 1 "$delay"); do
    alive || exit 0
    sleep 1
  done
  if [ "$FAULT" = down ]; then
    DRILL_TOKEN=$token bash ./inject.sh down
  else
    DRILL_TOKEN=$token bash ./inject.sh latency "$LATENCY_MS"
  fi
) >/dev/null 2>&1 &

echo "다른 터미널에서 bash drills/probe.sh 를 켜 두고 지켜본다. 재시작부터 하지 말고 증거(evidence.sh)부터 남긴다."
