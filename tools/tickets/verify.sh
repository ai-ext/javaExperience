#!/usr/bin/env bash
# 2단계 티켓 정답 검증. 사용법: tools/tickets/verify.sh [--full] [B01 B02 ...]  (티켓을 안 적으면 전체)
#   티켓마다 messy-server 복사본에 확인 테스트(answer/*Test.java)를 넣고
#   ① 결함 상태에서 실패 → ② answer/fix.patch 적용 후 통과(--full이면 전체 테스트도 통과)를 확인한다.
# messy-server 원본은 건드리지 않는다. 작업 디렉터리는 TICKET_WORK_DIR(기본: 임시 디렉터리)이다.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd -P)
src="$root/messy-server"
work="${TICKET_WORK_DIR:-$(mktemp -d)}"
full=false
if [ "${1:-}" = "--full" ]; then
  full=true
  shift
fi

if [ $# -eq 0 ]; then
  set -- $(cd "$src/tickets" && ls -d B[0-9][0-9] 2>/dev/null)
fi

run() {
  (cd "$1" && ./gradlew --console=plain -q test "${@:2}") >"$1/verify.log" 2>&1
}

failed=()
for t in "$@"; do
  answer="$src/tickets/$t/answer"
  if [ ! -f "$answer/fix.patch" ]; then
    echo "$t: $answer/fix.patch 없음" >&2
    failed+=("$t")
    continue
  fi
  copy="$work/$t"
  rm -rf "$copy"
  rsync -a --exclude build --exclude .gradle --exclude tickets "$src/" "$copy/"
  mkdir -p "$copy/src/test/java/com/example/board/tickets"
  cp "$answer"/*Test.java "$copy/src/test/java/com/example/board/tickets/"

  if run "$copy" --tests "com.example.board.tickets.${t}*"; then
    echo "$t: 결함 상태인데 확인 테스트가 통과했다 (로그 $copy/verify.log)" >&2
    failed+=("$t")
    continue
  fi
  if ! (cd "$copy" && git apply "$answer/fix.patch"); then
    echo "$t: fix.patch 적용 실패" >&2
    failed+=("$t")
    continue
  fi
  if ! run "$copy" --tests "com.example.board.tickets.${t}*"; then
    echo "$t: 수정 뒤에도 확인 테스트가 실패했다 (로그 $copy/verify.log)" >&2
    failed+=("$t")
    continue
  fi
  if $full && ! run "$copy"; then
    echo "$t: 수정 뒤 전체 테스트가 실패했다 (로그 $copy/verify.log)" >&2
    failed+=("$t")
    continue
  fi
  echo "$t: OK (결함에서 실패 → 수정 후 통과$($full && echo ', 전체 테스트 통과'))"
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "실패: ${failed[*]}" >&2
  exit 1
fi
