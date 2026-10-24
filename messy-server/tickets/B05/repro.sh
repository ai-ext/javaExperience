#!/usr/bin/env bash
# B05 재현: 부하 때만 다른 사람 값이 섞인다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#      금칙어는 기동할 때만 적재한다. 이 스크립트가 금칙어를 처음 넣었다면 서버를 다시 띄운 뒤 한 번 더 실행한다.
#   3) curl, jq, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B05/repro.sh   (N=50이 기본: 깨끗한 글 25건 + 금칙어 글 25건을 동시에 보낸다)
#
# 기대 증상(결함 상태): 혼자 보내면 깨끗한 글은 201, 금칙어 글은 400이다. 동시에 보내면
#   깨끗한 글이 400("금칙어가 포함되어 있습니다")을 받거나 금칙어 글이 201로 저장되는 건이 섞여 나온다.
#   몇 건이 섞이는지는 실행마다 다르다(0건이면 N=100으로 다시). 수정 뒤에는 항상 0건이다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
N=${N:-50}
WORD=b05금칙어
sql() { docker compose exec -T mysql mysql -uboard -pboard board -N -e "$1" 2>/dev/null; }

# 운영 금칙어 목록처럼 수백 개를 넣는다(검사 한 번이 금칙어 목록 전체를 돈다)
if [ "$(sql "SELECT COUNT(*) FROM banned_word WHERE word LIKE 'b05%'")" -lt 301 ]; then
  values="('$WORD')"
  for i in $(seq 0 299); do values="$values,('b05w${i}x')"; done
  sql "INSERT IGNORE INTO banned_word (word) VALUES $values"
  echo "금칙어 301개(b05...)를 넣었다. 서버를 다시 띄워 적재한 뒤 이 스크립트를 다시 실행하라." >&2
  exit 1
fi

email="b05-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"b05u$RANDOM\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)

clean=$(printf '오늘 점심은 김치찌개였습니다. %.0s' $(seq 1 80))
dirty="${clean} ${WORD}"
post() {
  curl -s -o /dev/null -w "$1 %{http_code}\n" -X POST "$BASE/api/posts" -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' -d "{\"title\":\"부하 $1\",\"content\":\"$2\"}"
}

echo "혼자 보낼 때: $(post clean "$clean") / $(post dirty "$dirty")"

out=$(mktemp)
for i in $(seq 1 "$N"); do
  if [ $((i % 2)) -eq 0 ]; then post clean "$clean" >>"$out" & else post dirty "$dirty" >>"$out" & fi
done
wait
echo "동시 ${N}건 결과:"
sort "$out" | uniq -c
echo "섞인 건수(깨끗한 글 400 + 금칙어 글 201): $(grep -cE '^(clean 400|dirty 201)$' "$out" || true)"
rm -f "$out"
