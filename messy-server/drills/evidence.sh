#!/usr/bin/env bash
# 증거 남기기: 재시작·복구 전에 먼저 실행한다. 스레드 덤프 3장(2초 간격), 헬스, Toxiproxy 상태를 한 폴더에 모은다.
# 같은 스레드가 덤프 3장 내내 같은 곳에서 기다리면 그곳이 막힌 지점이다.
#
# 전제: 서버가 이 컴퓨터에서 bootRun으로 떠 있다(jcmd로 찾는다). JDK의 jcmd, curl.
# 실행: bash drills/evidence.sh
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
TOXI=${TOXI:-http://localhost:8475}
OUT=${DRILL_OUT:-/tmp/board-drill}
dir="$OUT/evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$dir"

pid=$(jcmd -l | awk '/BoardApplication/ {print $1; exit}')
if [ -z "$pid" ]; then
  echo "BoardApplication 프로세스를 찾지 못했다(jcmd -l). 서버를 bootRun으로 띄웠는지 본다." >&2
  exit 1
fi

for i in 1 2 3; do
  jcmd "$pid" Thread.print >"$dir/threads-$i.txt"
  [ "$i" -lt 3 ] && sleep 2
done
curl -s --max-time 5 "$BASE/actuator/health" >"$dir/health.json" || echo "health 응답 없음" >"$dir/health.json"
curl -s "$TOXI/proxies" >"$dir/toxiproxy.json" || true

echo "저장: $dir"
echo
echo "== 요청 스레드(http-nio) 중 Redis(Lettuce) 응답을 기다리는 것: threads-3.txt"
awk '/^"http-nio/ {name=$0; buf=""; keep=0} /^"http-nio/,/^$/ {buf=buf"\n"$0; if ($0 ~ /lettuce|RedisTemplate/) keep=1} /^$/ {if (keep) print name; keep=0}' "$dir/threads-3.txt" | head -20
