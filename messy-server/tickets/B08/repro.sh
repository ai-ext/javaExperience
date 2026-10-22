#!/usr/bin/env bash
# B08 재현: 회원 API 응답에 비밀번호 해시가 보인다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl, jq
#
# 실행: bash tickets/B08/repro.sh
#
# 하는 일: 새 회원으로 가입·로그인한 뒤 GET /api/members/me 응답을 그대로 찍는다.
# 기대 증상(결함 상태): 응답에 passwordHash($2a$10$... BCrypt 해시)와 pointBalance·updatedAt이 함께 보이고,
#                       createdAt에 +09:00 오프셋이 없다. 수정 뒤에는 id·email·nickname·role·createdAt 다섯 필드뿐이다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
email="b08-$RANDOM$RANDOM@t.com"
nick="b08u$RANDOM"

curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"$nick\"}" >/dev/null
token=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken)

echo "GET /api/members/me 응답:"
curl -s "$BASE/api/members/me" -H "Authorization: Bearer $token" | jq .
echo
echo "필드 목록: $(curl -s "$BASE/api/members/me" -H "Authorization: Bearer $token" | jq -c 'keys')"
