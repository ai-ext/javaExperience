#!/usr/bin/env bash
# B16 재현: Redis 점검 시간에 글쓰기까지 멈췄다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl, jq, jcmd(JDK). 이 스크립트는 messy-server 디렉터리에서 `docker compose`로 Redis 컨테이너를 멈췄다 되살린다
#
# 실행
#   bash tickets/B16/repro.sh          Redis를 일시 정지(pause)한다: 연결은 살아 있는데 응답이 오지 않는다(점검·BGSAVE·장애 조치 흉내)
#   bash tickets/B16/repro.sh stop     Redis를 내린다(stop): 연결이 끊기고 재연결도 거부된다(재시작 흉내)
#   끝나면(또는 Ctrl+C) Redis를 되살린다.
#
# 기대 증상(결함 상태)
#   pause: POST /api/posts와 GET /api/posts/popular가 15초 안에 끝나지 않는다(curl --max-time 15 초과).
#          그동안 `jcmd $(pgrep -f BoardApplication) Thread.print`에서 http-nio 스레드가 Lettuce 응답을 기다리는 스택이 보인다.
#   stop:  글쓰기는 201이지만 GET /api/posts/popular가 500이다. 로그에 RedisSystemException(Currently not connected)이 남는다.
#   수정 뒤: 두 모드 모두 글쓰기 201, 인기글 200이 각각 1초 안이다.
set -euo pipefail
cd "$(dirname "$0")/../.."

BASE=${BASE:-http://localhost:8080}
MODE=${1:-pause}

recover() {
  if [ "$MODE" = stop ]; then docker compose start redis >/dev/null 2>&1 || true
  else docker compose unpause redis >/dev/null 2>&1 || true; fi
}
trap recover EXIT

email="b16-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"b16u$RANDOM\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)

write() {
  local out
  if out=$(curl -s -o /dev/null --max-time 15 -w '%{http_code} %{time_total}s' -X POST "$BASE/api/posts" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{"title":"점검 중 글","content":"내용"}'); then
    echo "POST /api/posts → ${out}"
  else
    echo "POST /api/posts → 15초 안에 응답 없음"
  fi
}
popular() {
  local out
  if out=$(curl -s -o /dev/null --max-time 15 -w '%{http_code} %{time_total}s' "$BASE/api/posts/popular"); then
    echo "GET /api/posts/popular → ${out}"
  else
    echo "GET /api/posts/popular → 15초 안에 응답 없음"
  fi
}

echo "== 평소"
write; popular

if [ "$MODE" = stop ]; then
  echo "== Redis 내림(docker compose stop redis)"
  docker compose stop redis >/dev/null 2>&1
else
  echo "== Redis 일시 정지(docker compose pause redis)"
  echo "   (멈춘 동안 다른 터미널에서: jcmd \$(pgrep -f BoardApplication) Thread.print | grep -B2 -A30 'http-nio.*exec')"
  docker compose pause redis >/dev/null 2>&1
fi
write; popular
