#!/usr/bin/env bash
# 장애 주입: compose의 Toxiproxy에 있는 redis 프록시(16380 → Redis)에 장애를 넣는다.
#
# 전제: messy-server에서 `docker compose up -d`, 서버는 기본 설정(REDIS_PORT=16380, Toxiproxy 경유)으로 떠 있다. curl.
#
# 실행
#   bash drills/inject.sh latency [ms]   Redis 응답을 ms(기본 3000)만큼 늦춘다. 연결은 살아 있다(점검·BGSAVE·장애 조치 흉내)
#   bash drills/inject.sh down           프록시를 닫는다. 붙어 있던 연결이 끊기고 새 연결은 거부된다(재시작 흉내)
#   bash drills/inject.sh status         지금 프록시 상태와 걸린 장애(toxic)를 보여 준다
# 되돌리기: bash drills/recover.sh
set -euo pipefail

TOXI=${TOXI:-http://localhost:8475}
PROXY=${PROXY:-redis}
OUT=${DRILL_OUT:-/tmp/board-drill}
mkdir -p "$OUT"

now() { date '+%Y-%m-%d %H:%M:%S %z'; }
record() { echo "$(now) $*" | tee -a "$OUT/injections.log" >/dev/null; }

case "${1:-}" in
  latency)
    ms=${2:-3000}
    curl -sf -X DELETE "$TOXI/proxies/$PROXY/toxics/drill-latency" >/dev/null 2>&1 || true
    curl -sf -X POST "$TOXI/proxies/$PROXY/toxics" \
      -d "{\"name\":\"drill-latency\",\"type\":\"latency\",\"stream\":\"downstream\",\"attributes\":{\"latency\":$ms}}" >/dev/null
    record "주입: $PROXY 응답 지연 ${ms}ms"
    ;;
  down)
    curl -sf -X POST "$TOXI/proxies/$PROXY" -d '{"enabled":false}' >/dev/null
    record "주입: $PROXY 연결 끊김(프록시 닫음)"
    ;;
  status)
    curl -sf "$TOXI/proxies/$PROXY" | (command -v jq >/dev/null && jq '{name, listen, upstream, enabled, toxics}' || cat)
    exit 0
    ;;
  *)
    echo "사용: bash drills/inject.sh latency [ms] | down | status" >&2
    exit 1
    ;;
esac
