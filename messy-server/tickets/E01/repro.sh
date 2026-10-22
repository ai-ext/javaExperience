#!/usr/bin/env bash
# E01(D14-5 고도화) 재현: 인기글 캐시가 빈 순간 동시 요청이 모두 DB 목록 쿼리로 몰린다(스탬피드).
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311 root 비밀번호 DB_ROOT_PASSWORD 또는 root, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl, xargs
#
# 실행: bash tickets/E01/repro.sh          (기본 동시 100요청, N=200처럼 바꿀 수 있다)
#
# 하는 일: Redis의 인기글 키(popular:posts)를 지워 TTL이 막 끝난 상황을 만들고, 곧바로 GET /api/posts/popular를
#          N개 동시에 보낸다. 그 전후로 MySQL performance_schema에서 인기글 쿼리(ORDER BY like_count DESC) 실행 횟수를 센다.
# 기대 증상(고도화 전): DB 인기글 쿼리가 N에 가깝게(수십~100번) 실행된다. 서버 로그에도 "인기글 캐시 적재"가 그만큼 찍힌다.
# 고도화 뒤: 1번. 나머지 요청은 그 결과를 함께 받는다. 응답 형식은 그대로다.
set -euo pipefail

cd "$(dirname "$0")/../.."
BASE=${BASE:-http://localhost:8080}
ROOT_PW=${DB_ROOT_PASSWORD:-root}
N=${N:-100}

popular_query_count() {
  docker compose exec -T mysql mysql -uroot -p"$ROOT_PW" -N -e "
    SELECT COALESCE(SUM(COUNT_STAR), 0) FROM performance_schema.events_statements_summary_by_digest
    WHERE SCHEMA_NAME = 'board' AND DIGEST_TEXT LIKE '%ORDER BY \`like_count\` DESC%'" 2>/dev/null | tr -d '\r'
}

curl -s -o /dev/null "$BASE/api/posts/popular"   # 서버·커넥션 예열
docker compose exec -T redis redis-cli DEL popular:posts >/dev/null
before=$(popular_query_count)

echo "== 캐시를 비운 직후 동시 ${N}요청"
seq "$N" | xargs -P "$N" -I{} curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/popular" | sort | uniq -c

after=$(popular_query_count)
echo "== DB 인기글 쿼리 실행 횟수: $((after - before))번 (동시 ${N}요청)"
