#!/usr/bin/env bash
set -euo pipefail

# MySQL 8.4 성능 실습용 전용 컨테이너. compose 서비스와 볼륨을 사용하지 않는다.

CONTAINER_NAME="javaexperience-db-perf-v1"
FIXTURE_LABEL="javaexperience.fixture=db-perf-v1"
DATABASE_NAME="javaexperience_perf"
IMAGE="mysql:8.4"
ACTION="${1:-}"
DB_PORT="${PERF_DB_PORT:-13319}"
ROW_COUNT="${PERF_ROW_COUNT:-500000}"
ROOT_PASSWORD="${PERF_DB_ROOT_PASSWORD:-perf-local-only}"

usage() {
  cat <<'EOF'
사용법: tools/db-perf-fixture.sh {up|reset|status|down}

환경변수:
  PERF_DB_PORT              호스트 포트 (기본 13319)
  PERF_ROW_COUNT            생성할 post_like 행 수 (board/member/post/tag/comment도 함께 생성), 100000~1000000 (기본 500000)
  PERF_DB_ROOT_PASSWORD     전용 컨테이너 root 암호 (기본 perf-local-only)

up은 컨테이너가 이미 실행 중이면 데이터를 다시 만들지 않는다.
reset은 전용 컨테이너를 새로 만들어 실험 DB를 처음 상태로 되돌린다.
EOF
}

fail() {
  printf '오류: %s\n' "$1" >&2
  exit 1
}

[[ -n "$ACTION" ]] || { usage; exit 2; }
case "$ACTION" in
  up|reset|status|down) ;;
  *) usage; exit 2 ;;
esac

if [[ ! "$DB_PORT" =~ ^[0-9]+$ ]] || (( DB_PORT < 1024 || DB_PORT > 65535 )); then
  fail 'PERF_DB_PORT는 1024~65535 사이의 숫자여야 합니다.'
fi
if [[ ! "$ROW_COUNT" =~ ^[0-9]+$ ]] || (( ROW_COUNT < 100000 || ROW_COUNT > 1000000 )); then
  fail 'PERF_ROW_COUNT는 100000~1000000 사이의 숫자여야 합니다.'
fi
if [[ -z "$ROOT_PASSWORD" ]]; then
  fail 'PERF_DB_ROOT_PASSWORD는 빈 값일 수 없습니다.'
fi
command -v docker >/dev/null 2>&1 || fail 'Docker CLI를 찾을 수 없습니다.'
docker info >/dev/null 2>&1 || fail 'Docker 엔진이 실행 중인지 확인하세요.'

container_exists() {
  docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1
}

ensure_owned_container() {
  local label_value
  label_value="$(docker inspect --format "{{ index .Config.Labels \"javaexperience.fixture\" }}" "$CONTAINER_NAME")"
  [[ "$label_value" == "db-perf-v1" ]] || fail "이름이 같은 다른 컨테이너가 있어 보호를 위해 중단했습니다: $CONTAINER_NAME"
}

remove_fixture() {
  if container_exists; then
    ensure_owned_container
    docker rm -f "$CONTAINER_NAME" >/dev/null
  fi
}

show_status() {
  local published_address
  if ! container_exists; then
    printf '성능 fixture 컨테이너가 없습니다. tools/db-perf-fixture.sh up 으로 시작하세요.\n'
    return
  fi
  ensure_owned_container
  docker inspect --format '상태: {{.State.Status}}' "$CONTAINER_NAME"
  published_address="$(docker port "$CONTAINER_NAME" 3306/tcp | head -n 1 || true)"
  printf '접속 주소: %s / DB: %s\n' "${published_address:-포트 바인딩 없음}" "$DATABASE_NAME"
}

if [[ "$ACTION" == "status" ]]; then
  show_status
  exit 0
fi

if [[ "$ACTION" == "down" ]]; then
  remove_fixture
  printf '전용 성능 fixture 컨테이너를 제거했습니다.\n'
  exit 0
fi

if [[ "$ACTION" == "up" ]] && container_exists; then
  ensure_owned_container
  if [[ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")" == "true" ]]; then
    show_status
    printf '기존 데이터를 유지했습니다. 처음 상태가 필요하면 reset을 사용하세요.\n'
    exit 0
  fi
fi

if [[ "$ACTION" == "reset" ]]; then
  remove_fixture
elif container_exists; then
  # 종료 상태의 전용 컨테이너만 교체한다.
  remove_fixture
fi

docker run --detach --rm \
  --label "$FIXTURE_LABEL" \
  --name "$CONTAINER_NAME" \
  --publish "127.0.0.1:${DB_PORT}:3306" \
  --env "MYSQL_ROOT_PASSWORD=${ROOT_PASSWORD}" \
  --env "MYSQL_DATABASE=${DATABASE_NAME}" \
  "$IMAGE" \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_0900_ai_ci >/dev/null

ready=0
for _ in {1..60}; do
  if docker exec --env "MYSQL_PWD=${ROOT_PASSWORD}" "$CONTAINER_NAME" \
      mysqladmin ping --host=127.0.0.1 --user=root --silent >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" != "1" ]]; then
  remove_fixture
  fail 'MySQL 8.4 준비 시간 초과. docker logs javaexperience-db-perf-v1로 확인하세요.'
fi

if ! {
  printf 'SET @target_rows = %s;\n' "$ROW_COUNT"
  cat "$(dirname "$0")/db-perf-fixture-init.sql"
} | docker exec --interactive --env "MYSQL_PWD=${ROOT_PASSWORD}" "$CONTAINER_NAME" \
      mysql --user=root "$DATABASE_NAME"; then
  remove_fixture
  fail 'fixture 데이터 생성에 실패해 전용 컨테이너를 제거했습니다. docker logs로 원인을 확인하세요.'
fi

printf 'MySQL 8.4 성능 fixture를 준비했습니다.\n'
printf '주소: 127.0.0.1:%s / DB: %s / 행 수: %s\n' "$DB_PORT" "$DATABASE_NAME" "$ROW_COUNT"
printf '전용 컨테이너 이름: %s (compose 볼륨을 사용하지 않습니다)\n' "$CONTAINER_NAME"
