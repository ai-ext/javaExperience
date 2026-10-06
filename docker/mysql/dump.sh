#!/usr/bin/env bash
# 실행 중인 실습 DB(community·practice)를 SQL 파일(mysqldump)로 떠 둔다. 레포 루트 어디서 실행해도 된다.
#   ./docker/mysql/dump.sh          → docker/mysql/backup/<시각>/ 에 저장(내 작업 백업·공유용 — git에 올라가지 않는다)
#   ./docker/mysql/dump.sh --seed   → docker/mysql/init/ 의 초기 데이터를 지금 DB 상태로 교체(레포의 초기 데이터를 바꿀 때만)
# init/ 의 파일은 DB를 새로 만들 때(docker compose down -v && docker compose up -d) 적재된다.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ "${1:-}" = "--seed" ]; then OUT=docker/mysql/init; else OUT=docker/mysql/backup/$(date +%Y%m%d-%H%M%S); fi
mkdir -p "$OUT"
OPTS=(--compact --single-transaction --no-tablespaces --set-gtid-purged=OFF --skip-extended-insert --complete-insert --default-character-set=utf8mb4)

dump() { # $1=파일 $2=설명, 나머지는 mysqldump 인자
  local file=$1 desc=$2
  shift 2
  {
    echo "-- javaExperience 실습 DB — $desc"
    echo "-- docker/mysql/dump.sh 로 만든 파일(mysqldump). 직접 고치기보다 DB를 고친 뒤 다시 뜬다."
    echo "SET NAMES utf8mb4;"
    echo "-- 테이블이 이름순으로 나와 참조 대상보다 먼저 만들어질 수 있어서 외래키 검사를 잠시 끈다"
    echo "SET FOREIGN_KEY_CHECKS = 0;"
    docker compose exec -T mysql mysqldump -uroot -proot "${OPTS[@]}" "$@" 2> >(grep -v 'Using a password' >&2)
    echo "SET FOREIGN_KEY_CHECKS = 1;"
  } > "$file"
  echo "  $file ($(wc -l < "$file" | tr -d ' ')줄)"
}

echo "dump → $OUT"
dump "$OUT/01-community.sql" "community DB(시나리오용). USE 없음 — 컨테이너는 MYSQL_DATABASE(community)에, 테스트는 Testcontainers DB에 적재한다" community
dump "$OUT/02-practice.sql" "practice DB(학습용, 함정이 섞인 더미 데이터). CREATE DATABASE·USE 포함" --databases practice
