#!/usr/bin/env bash
# 2단계 티켓 정답 검증.
#   tools/tickets/verify.sh [--full] [B01 E01 ...]   티켓별: 결함 상태에서 확인 테스트가 단언 실패 → fix.patch 적용 후 통과
#   tools/tickets/verify.sh --all-fixes              모든 fix.patch를 번호 순으로 한 복사본에 누적 적용 → 확인 테스트 전부 + 전체 테스트 통과
# 티켓을 안 적으면 messy-server/tickets/ 아래 전부(B01~B16 정확히 16개 + E01..)를 검사한다.
# --full: 수정 뒤 전체 테스트도 통과해야 한다. 환경 한정 실패(ENV_FLAKY)만 허용한다.
# 판정은 종료 코드가 아니라 JUnit XML로 한다(테스트가 실제로 돌았는지, 실패가 단언 실패인지).
# messy-server 원본은 건드리지 않는다. 작업 디렉터리는 TICKET_WORK_DIR(리포 밖, 기본: 새 임시 디렉터리).
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd -P)
src="$root/messy-server"
# 셸 기본 JAVA_HOME이 11일 수 있어 JDK 21을 따로 받는다(TICKET_JAVA_HOME으로 덮을 수 있다)
JAVA_HOME="${TICKET_JAVA_HOME:-/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home}"
export JAVA_HOME
# 이 머신의 로컬 Docker 런타임에서만 실패하는 정답 서버 테스트(포트 포워더가 끊긴 프록시 연결을 받아 둔다)
ENV_FLAKY="PgClientRetryTest.연결_실패는_재시도하고_복구되면_성공한다 PgClientRetryTest.연결_실패가_계속되면_백오프_후_3번째에_포기한다"

full=false
all_fixes=false
while [ $# -gt 0 ]; do
  case "$1" in
    --full) full=true; shift ;;
    --all-fixes) all_fixes=true; shift ;;
    *) break ;;
  esac
done

if [ ! -d "$src/tickets" ]; then
  echo "티켓 디렉터리가 없다: $src/tickets" >&2
  exit 1
fi
if [ $# -eq 0 ]; then
  ids=($(cd "$src/tickets" && ls -d [A-Z][0-9][0-9] 2>/dev/null | sort || true))
  bcount=$(printf '%s\n' "${ids[@]:-}" | grep -c '^B' || true)
  if [ "$bcount" -ne 16 ]; then
    echo "B 티켓이 16개가 아니다: ${bcount}개 (${ids[*]:-없음})" >&2
    exit 1
  fi
  set -- "${ids[@]}"
fi
for t in "$@"; do
  [[ "$t" =~ ^[A-Z][0-9][0-9]$ ]] || { echo "티켓 이름이 이상하다: $t" >&2; exit 1; }
done

work="${TICKET_WORK_DIR:-}"
if [ -z "$work" ]; then
  work=$(mktemp -d)
fi
mkdir -p "$work"
work=$(cd "$work" && pwd -P)
case "$work/" in
  "$root"/*) echo "TICKET_WORK_DIR는 리포 밖이어야 한다: $work" >&2; exit 1 ;;
esac

# 복사본을 만든다. 독립 git 저장소로 만들어 git apply가 상위 리포를 보지 않게 한다.
make_copy() {
  local copy=$1
  rm -rf "$copy"
  mkdir -p "$copy"
  rsync -a --exclude build --exclude .gradle --exclude tickets "$src/" "$copy/"
  (cd "$copy" && git init -q && git add -A && git -c user.email=v@local -c user.name=verify commit -qm base)
}

add_confirm_tests() {
  local copy=$1 t=$2
  mkdir -p "$copy/src/test/java/com/example/board/tickets"
  local n=0
  for f in "$src/tickets/$t/answer/"*Test.java; do
    [ -f "$f" ] || continue
    cp "$f" "$copy/src/test/java/com/example/board/tickets/"
    n=$((n + 1))
  done
  [ "$n" -gt 0 ] || { echo "$t: answer/*Test.java 없음" >&2; return 1; }
}

# gradle test 실행. 결과 XML을 단계별 디렉터리에 보관한다.
run_tests() {
  local copy=$1 stage=$2; shift 2
  rm -rf "$copy/build/test-results/test"
  (cd "$copy" && ./gradlew --console=plain test "$@") >"$copy/$stage.log" 2>&1 || true
  rm -rf "$copy/results-$stage"
  if [ -d "$copy/build/test-results/test" ]; then
    cp -R "$copy/build/test-results/test" "$copy/results-$stage"
  else
    mkdir -p "$copy/results-$stage"
  fi
}

# XML 요약: "tests failures errors skipped" 와 실패한 "클래스단순명.메서드" 목록
summarize() {
  python3 - "$1" "${2:-}" <<'PY'
import sys, glob, re, xml.etree.ElementTree as ET
d, prefix = sys.argv[1], sys.argv[2]
t = f = e = s = 0
bad = []
counts = {}
ASSERTION_TYPES = {"AssertionError", "AssertionFailedError", "MultipleFailuresError",
                   "AssertJMultipleFailuresError", "SoftAssertionError", "ComparisonFailure"}
ENV_PAT = re.compile(r"Failed to load ApplicationContext|ApplicationContext failure threshold|"
                     r"Could not find a valid Docker environment|ContainerLaunchException|"
                     r"Error creating bean with name|UnsatisfiedDependencyException|NoSuchBeanDefinitionException")
for p in glob.glob(d + "/*.xml"):
    r = ET.parse(p).getroot()
    cls = r.get("name", "")
    if prefix and not cls.startswith(prefix):
        continue
    t += int(r.get("tests", 0)); f += int(r.get("failures", 0)); e += int(r.get("errors", 0)); s += int(r.get("skipped", 0))
    for c in r.findall("testcase"):
        el = c.find("failure") if c.find("failure") is not None else c.find("error")
        if el is None:
            continue
        kind = el.tag
        typ = (el.get("type") or "").split(".")[-1]
        text = (el.get("message") or "") + "\n" + (el.text or "")[:4000]
        # JUnit은 컨텍스트 로드 실패·환경 오류도 failure로 기록한다. 단언 실패와 구분한다.
        if ENV_PAT.search(text):
            kind = "env"
        elif typ in ASSERTION_TYPES:
            kind = "assert"
        bad.append(f"{kind}:{c.get('classname','').split('.')[-1]}.{c.get('name','').split('(')[0]}")
        counts[kind] = counts.get(kind, 0) + 1
print(t, f, e, s, counts.get("assert", 0), counts.get("env", 0))
for b in bad:
    print(b)
PY
}

check_red() {
  local copy=$1 t=$2
  run_tests "$copy" red --tests "com.example.board.tickets.${t}*"
  local out; out=$(summarize "$copy/results-red" "com.example.board.tickets.$t")
  read -r tests failures errors skipped asserts envs <<<"$(head -1 <<<"$out")"
  if [ "$tests" -eq 0 ]; then
    echo "$t: 결함 상태에서 확인 테스트가 하나도 돌지 않았다(컴파일·환경 오류?) — $copy/red.log" >&2; return 1
  fi
  if [ "$errors" -gt 0 ] || [ "$envs" -gt 0 ]; then
    echo "$t: 결함 상태 실패에 컨텍스트·환경 오류가 섞였다(error ${errors}건, 환경 ${envs}건) — $copy/results-red" >&2; return 1
  fi
  if [ "$failures" -eq 0 ]; then
    echo "$t: 결함 상태인데 확인 테스트가 통과했다 — $copy/red.log" >&2; return 1
  fi
  if [ "$asserts" -eq 0 ]; then
    echo "$t: 결함 상태 실패 중 단언 실패(AssertionError 계열)가 없다 — $(tail -n +2 <<<"$out" | tr '\n' ' ') — $copy/results-red" >&2; return 1
  fi
}

check_green() {
  local copy=$1 t=$2 stage=$3
  run_tests "$copy" "$stage" --tests "com.example.board.tickets.${t}*"
  local out; out=$(summarize "$copy/results-$stage" "com.example.board.tickets.$t")
  read -r tests failures errors skipped _asserts _envs <<<"$(head -1 <<<"$out")"
  if [ "$tests" -eq 0 ] || [ "$skipped" -eq "$tests" ] || [ $((failures + errors)) -gt 0 ]; then
    echo "$t: 수정 뒤 확인 테스트 실패(tests=$tests failures=$failures errors=$errors skipped=$skipped) — $copy/$stage.log" >&2; return 1
  fi
}

check_full() {
  local copy=$1 label=$2
  run_tests "$copy" full
  local out; out=$(summarize "$copy/results-full")
  read -r tests failures errors skipped _asserts _envs <<<"$(head -1 <<<"$out")"
  [ "$tests" -gt 0 ] || { echo "$label: 전체 테스트가 돌지 않았다 — $copy/full.log" >&2; return 1; }
  local unexpected=()
  while read -r line; do
    [ -n "$line" ] || continue
    local name=${line#*:}
    [[ " $ENV_FLAKY " == *" $name "* ]] || unexpected+=("$line")
  done < <(tail -n +2 <<<"$out")
  if [ ${#unexpected[@]} -gt 0 ]; then
    echo "$label: 전체 테스트 실패 ${#unexpected[@]}건: ${unexpected[*]} — $copy/results-full" >&2; return 1
  fi
}

apply_fix() {
  local copy=$1 t=$2
  local patch="$src/tickets/$t/answer/fix.patch"
  [ -s "$patch" ] || { echo "$t: fix.patch 없음/빔" >&2; return 1; }
  (cd "$copy" && git apply --check "$patch" && git apply "$patch") >"$copy/apply-$t.log" 2>&1 \
    || { echo "$t: fix.patch 적용 실패 — $copy/apply-$t.log" >&2; return 1; }
  # 적용 뒤 실제로 바뀐 파일이 있어야 한다
  (cd "$copy" && [ -n "$(git status --porcelain -- . ':!src/test/java/com/example/board/tickets')" ]) \
    || { echo "$t: fix.patch를 적용했는데 바뀐 파일이 없다" >&2; return 1; }
}

failed=()
if $all_fixes; then
  copy="$work/all-fixes"
  make_copy "$copy"
  for t in "$@"; do add_confirm_tests "$copy" "$t"; done
  (cd "$copy" && git add -A && git -c user.email=v@local -c user.name=verify commit -qm tests)
  for t in "$@"; do
    apply_fix "$copy" "$t" && (cd "$copy" && git add -A && git -c user.email=v@local -c user.name=verify commit -qm "$t") || failed+=("$t")
  done
  if [ ${#failed[@]} -eq 0 ]; then
    check_full "$copy" all-fixes || failed+=(all-fixes)
  fi
  [ ${#failed[@]} -eq 0 ] && echo "all-fixes: OK (${*} 누적 적용, 확인 테스트 포함 전체 통과) — $copy"
else
  for t in "$@"; do
    copy="$work/$t"
    if ! { make_copy "$copy" && add_confirm_tests "$copy" "$t" \
        && (cd "$copy" && git add -A && git -c user.email=v@local -c user.name=verify commit -qm tests) \
        && check_red "$copy" "$t" && apply_fix "$copy" "$t" && check_green "$copy" "$t" green; }; then
      failed+=("$t"); continue
    fi
    if $full && ! check_full "$copy" "$t"; then
      failed+=("$t"); continue
    fi
    echo "$t: OK (결함 상태 단언 실패 → 수정 후 통과$($full && echo ', 전체 테스트 통과' || true)) — $copy"
  done
fi

if [ ${#failed[@]} -gt 0 ]; then
  echo "실패: ${failed[*]}" >&2
  exit 1
fi
