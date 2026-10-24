#!/usr/bin/env bash
# B11 재현: prod에서 설정값이 안 바뀐다(application-prod.yml에 토큰 만료 1800초를 넣었는데 운영 로그인 응답은 여전히 7200초).
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380, Toxiproxy PG 18667)
#   2) curl, jq, JDK 21(JAVA_HOME). 8088 포트가 비어 있어야 한다(PORT로 바꿀 수 있다). 이 스크립트가 bootJar로 만든 jar를 직접 띄우고, 끝나면 그 프로세스만 내린다
#
# 실행: bash tickets/B11/repro.sh   (messy-server 디렉터리에서)
#
# 하는 일: 운영 서버가 읽는 환경 변수 파일 deploy/board.env를 그대로 읽어 들이고, 접속 정보·비밀값만 로컬 compose 값으로 바꿔
#          prod 프로파일(시드 관리자 계정을 쓰려고 local도 함께)로 서버를 띄운다. 로그인 응답의 expiresIn과
#          /actuator/env/board.jwt.expires-in-seconds(이 실행에서만 env를 노출하고 값을 보이게 한다)를 찍는다.
# 기대 증상(결함 상태): expiresIn이 1800이 아니라 7200이다. /actuator/env의 propertySources에서 이 키를 가진 출처가
#                       여럿이고, 맨 위(이긴 쪽)가 application-prod.yml이 아니다. 수정 뒤에는 expiresIn=1800.
set -euo pipefail
cd "$(dirname "$0")/../.."

PORT=${PORT:-8088}
BASE="http://localhost:$PORT"
LOG=${LOG:-/tmp/b11-boot.log}

set -a
# shellcheck disable=SC1091
. deploy/board.env
set +a
# 운영 접속 정보·비밀값만 로컬 값으로 바꾼다. 나머지 운영 환경 변수는 파일 그대로다.
export DB_URL=jdbc:mysql://localhost:13311/board DB_USERNAME=board DB_PASSWORD=board
export REDIS_HOST=localhost REDIS_PORT=16380 BOARD_PG_BASE_URL=http://localhost:18667
export BOARD_JWT_SECRET=b11-repro-only-secret-b11-repro-only-secret
export BOARD_PG_SECRET=b11-repro-only-pg-secret-b11-repro-only-pg
export SPRING_PROFILES_ACTIVE=local,prod

# 이 스크립트가 띄운 서버 프로세스만 다룬다. 포트가 이미 쓰이고 있으면 남의 서버일 수 있으니 시작하지 않는다.
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  echo "$PORT 포트를 이미 누가 쓰고 있다. PORT=<빈 포트> bash $0 으로 다시 실행한다." >&2
  exit 1
fi
./gradlew -q bootJar
jar=$(ls build/libs/*.jar | grep -v -- '-plain' | head -1)
"${JAVA_HOME:+$JAVA_HOME/bin/}java" -jar "$jar" --server.port=$PORT --management.endpoints.web.exposure.include=health,env --management.endpoint.env.show-values=always >"$LOG" 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; wait "$server" 2>/dev/null || true' EXIT

echo "서버 기동 대기(pid $server, 로그: $LOG)"
up=false
for _ in $(seq 1 90); do
  kill -0 "$server" 2>/dev/null || { echo "서버가 기동 중에 끝났다. 로그 끝:" >&2; tail -n 20 "$LOG" >&2; exit 1; }
  if curl -s "$BASE/actuator/health" | grep -q UP; then up=true; break; fi
  sleep 1
done
$up || { echo "90초 안에 뜨지 않았다. 로그: $LOG" >&2; exit 1; }

login=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@board.local","password":"Admin1234!"}')
echo "로그인 응답 expiresIn: $(jq -r .expiresIn <<<"$login")   (application-prod.yml에는 1800)"
token=$(jq -r .accessToken <<<"$login")

echo
echo "GET /actuator/env/board.jwt.expires-in-seconds — 이긴 값과 출처별 후보:"
curl -s "$BASE/actuator/env/board.jwt.expires-in-seconds" -H "Authorization: Bearer $token" \
  | jq '{"이긴_값": .property, "출처별": [.propertySources[] | select(.property) | {name, value: .property.value, origin: .property.origin}]}'
