#!/usr/bin/env bash
# B15 재현: 숨긴 글이 인기글에 1분간 계속 보인다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, root 비밀번호는 DB_ROOT_PASSWORD 또는 root, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080, local 시드 관리자 admin@board.local / Admin1234!)
#      커밋 시점까지 보려면 `--logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG`를 더 붙인다.
#   3) curl, jq
#
# 실행: bash tickets/B15/repro.sh
#
# 하는 일: 운영에서는 바쁜 시간대에 가끔 생겨 운에 맡겨야 한다. 여기서는 숨김 요청을 4초 늦춰 매번 보이게 한다.
#   ① 좋아요가 가장 많은 글을 만들고 인기글을 한 번 불러 캐시를 채운다.
#   ② MySQL 세션 하나가 그 글 행을 SELECT ... FOR UPDATE로 4초 잡는다(다른 배치·관리 작업이 행을 잡은 상황).
#   ③ 그동안 관리자가 그 글을 숨긴다. 숨김 요청은 그 행 잠금이 풀릴 때까지 기다린다.
#   ④ 숨김 응답이 오기 전에 다른 사용자가 인기글을 부른다.
#   ⑤ 숨김 응답(200)을 받은 뒤 인기글을 다시 부른다.
# 기대 증상(고치기 전): ⑤에서도 숨긴 글이 1위로 보인다(60초 동안). DB에서는 이미 HIDDEN이다.
#   서버 로그에서 숨김 요청 ID와 ④ 요청 ID의 "인기글 캐시 …" 줄, (DEBUG면) 커밋 줄이 어떤 순서로 찍혔는지 본다.
# 수정 뒤: ⑤에서 숨긴 글이 없다.
set -euo pipefail

cd "$(dirname "$0")/../.."
BASE=${BASE:-http://localhost:8080}
ROOT_PW=${DB_ROOT_PASSWORD:-root}

sql() {
  docker compose exec -T mysql mysql -uroot -p"$ROOT_PW" -N board -e "$1" 2>/dev/null
}
popular_ids() {
  curl -s "$BASE/api/posts/popular?size=5" | jq -c '[.items[].id]'
}

admin=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@board.local","password":"Admin1234!"}' | jq -r .accessToken)
email="b15-$RANDOM$RANDOM@t.com"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"b15u$RANDOM\"}" >/dev/null
user=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)
location=$(curl -s -D - -o /dev/null -X POST "$BASE/api/posts" -H "Authorization: Bearer $user" \
  -H 'Content-Type: application/json' -d '{"title":"신고 많이 받은 글","content":"광고","tags":[]}' \
  | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')
post_id=${location##*/}
sql "UPDATE post SET like_count = 1000000 WHERE id = $post_id"
# 앞선 캐시를 비우고 새로 채운다(글을 쓰면 인기글 캐시가 지워진다)
echo "① 인기글(캐시 채움): $(popular_ids)   숨길 글 id=$post_id"

echo "② 다른 세션이 글 행을 4초 잡는다"
sql "START TRANSACTION; SELECT id FROM post WHERE id = $post_id FOR UPDATE; SELECT SLEEP(4); ROLLBACK;" >/dev/null &
locker=$!
sleep 1

echo "③ 관리자가 숨긴다(글 행 잠금이 풀릴 때까지 기다린다)"
curl -s -o /tmp/b15-hide.json -w '   숨김 응답 %{http_code} (%{time_total}s)\n' \
  -X POST "$BASE/api/admin/posts/$post_id/hide" -H "Authorization: Bearer $admin" &
hider=$!
sleep 1

echo "④ 숨김 응답 전, 다른 사용자의 인기글: $(popular_ids)"
wait "$locker" "$hider"

echo "⑤ 숨김 응답 뒤 인기글: $(popular_ids)   DB status=$(sql "SELECT status FROM post WHERE id = $post_id")"
echo "   ⑤에 $post_id 가 남아 있으면 재현된 것이다. 60초 뒤(TTL) 다시 보면 사라진다."
