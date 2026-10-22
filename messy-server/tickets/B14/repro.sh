#!/usr/bin/env bash
# B14 재현: 운영(prod 프로파일)에서 /actuator/env가 인증 없이 열린다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380, Toxiproxy PG 18667)
#   2) curl, jq. 8089 포트가 비어 있어야 한다(이 스크립트가 서버를 prod 프로파일로 직접 띄우고 끝나면 내린다)
#
# 실행: bash tickets/B14/repro.sh   (messy-server 디렉터리에서)
#
# 하는 일: 운영과 같은 application-prod.yml 설정으로(접속 정보·비밀값만 로컬 값을 환경 변수로 주고, 시드 계정을 쓰려고 local도 함께)
#          서버를 띄운 뒤 토큰 없이 /actuator/env, /actuator/metrics, /actuator/health를 부른다.
# 기대 증상(결함 상태): 토큰 없이 /actuator/env → 200이고, 응답에 DB_PASSWORD·BOARD_JWT_SECRET 같은 환경 변수 값이 그대로 보인다.
#                       /actuator/metrics도 200. 수정 뒤: health만 200, env·metrics는 토큰 없이 401, 관리자 토큰이면 200.
set -euo pipefail
cd "$(dirname "$0")/../.."

PORT=${PORT:-8089}
BASE="http://localhost:$PORT"
LOG=${LOG:-/tmp/b14-boot.log}

export DB_URL=jdbc:mysql://localhost:13311/board DB_USERNAME=board DB_PASSWORD=board
export REDIS_HOST=localhost REDIS_PORT=16380 BOARD_PG_BASE_URL=http://localhost:18667
export BOARD_JWT_SECRET=b14-repro-only-secret-b14-repro-only-secret
export BOARD_PG_SECRET=b14-repro-only-pg-secret-b14-repro-only-pg
export SPRING_PROFILES_ACTIVE=local,prod

./gradlew -q bootRun --args="--server.port=$PORT" >"$LOG" 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true; pkill -f "server.port=$PORT" 2>/dev/null || true' EXIT

echo "서버 기동 대기(로그: $LOG)"
for _ in $(seq 1 90); do
  curl -s "$BASE/actuator/health" | grep -q UP && break
  sleep 1
done

for path in /actuator/health /actuator/metrics /actuator/env; do
  echo "토큰 없이 GET $path → $(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")"
done

echo
echo "토큰 없이 읽은 /actuator/env 중 비밀값(환경 변수):"
curl -s "$BASE/actuator/env" \
  | jq -r '.propertySources[]? | select(.name == "systemEnvironment") | .properties
           | to_entries[] | select(.key | test("PASSWORD|SECRET")) | "\(.key) = \(.value.value)"' 2>/dev/null \
  || echo "(env 응답 없음)"
