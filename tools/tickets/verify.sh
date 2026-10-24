#!/usr/bin/env bash
# 2단계 티켓 정답 검증.
#   tools/tickets/verify.sh [--full] [B01 E01 ...]   티켓별: 결함 상태에서 확인 테스트가 단언 실패 → fix.patch 적용 후 통과
#   tools/tickets/verify.sh --all-fixes              모든 fix.patch를 번호 순으로 한 복사본에 누적 적용 → 확인 테스트 전부 + 전체 테스트 통과
# 티켓을 안 적으면 messy-server/tickets/ 아래 전부(B01~B16 정확히 16개 + E01..)를 검사한다.
# --full: 수정 뒤 전체 테스트도 통과해야 한다. 지정 테스트의 연결 실패·타임아웃 원인만 환경 예외로 구분한다.
# 판정은 종료 코드가 아니라 JUnit XML로 한다(테스트가 실제로 돌았는지, 실패가 단언 실패인지).
# messy-server 원본은 건드리지 않는다. 작업 디렉터리는 TICKET_WORK_DIR(리포 밖, 기본: 새 임시 디렉터리).
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd -P)
src="$root/messy-server"
# 별도 JDK 경로가 있으면 우선하고, 없으면 JAVA_HOME 또는 PATH의 Java를 그대로 쓴다.
if [ -n "${TICKET_JAVA_HOME:-}" ]; then
  export JAVA_HOME="$TICKET_JAVA_HOME"
fi
# 일부 로컬 Docker 포트 포워더에서 관찰된 연결 실패 예외(지정 테스트와 원인만 허용).
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
  bcount=$(printf '%s\n' ${ids[@]+"${ids[@]}"} | grep -c '^B' || true)
  if [ "$bcount" -ne 16 ]; then
    echo "B 티켓이 16개가 아니다: ${bcount}개 (${ids[*]:-없음})" >&2
    exit 1
  fi
  set -- ${ids[@]+"${ids[@]}"}
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
  ENV_FLAKY="$ENV_FLAKY" python3 - "$1" "${2:-}" <<'PY'
import sys, glob, re, os, json, xml.etree.ElementTree as ET
d, prefix = sys.argv[1], sys.argv[2]
t = f = e = s = 0
bad = []
counts = {}
allowed = set(os.environ.get("ENV_FLAKY", "").split())
CONNECTION = re.compile(r"\b(?:ConnectException|SocketTimeoutException|ConnectTimeoutException|"
                        r"HttpHostConnectException|HttpConnectTimeoutException|HttpTimeoutException|"
                        r"TimeoutException|ConnectionRequestTimeoutException|NoHttpResponseException)\b|"
                        r"connection (?:refused|reset|timed out)|connect timed out|read timed out|"
                        r"연결 (?:실패|거부)|응답 타임아웃|but was:\s*<?(?:TIMEOUT|UNREACHABLE)>?\b", re.I)
SOCKET_CAUSE = re.compile(r"\bSocketException\s*:\s*(?:Broken pipe|Connection reset)\b", re.I)
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
        message = el.get("message") or ""
        trace = el.text or ""
        text = message + "\n" + trace
        name = f"{c.get('classname','').split('.')[-1]}.{c.get('name','').split('(')[0]}"
        # 메서드 이름·일반 stack frame은 근거가 아니다. 실패 메시지·예외 종류·원인 체인만 본다.
        causes = "\n".join(line for line in trace.splitlines()
                           if line.lstrip().startswith("Caused by:"))
        reason = (el.get("type") or "") + " " + message + "\n" + causes
        # JUnit은 컨텍스트 로드 실패·환경 오류도 failure로 기록한다. 단언 실패와 구분한다.
        if ENV_PAT.search(text):
            kind = "env"
        elif typ in ASSERTION_TYPES:
            kind = "assert"
        if name in allowed and typ not in {"MultipleFailuresError", "AssertJMultipleFailuresError", "SoftAssertionError"} and (CONNECTION.search(reason) or SOCKET_CAUSE.search(causes)) and not ENV_PAT.search(reason):
            kind = "env-exception"
        bad.append(f"{kind}:{name}\t{json.dumps(reason, ensure_ascii=False)}")
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
  local unexpected=() exceptions=()
  # Bash 3.2의 nounset은 빈 배열의 길이 조회도 오류로 처리한다.
  local unexpected_count=0 exception_count=0
  local line reason name kind
  while IFS=$'\t' read -r line reason; do
    [ -n "$line" ] || continue
    name=${line#*:}
    kind=${line%%:*}
    if [ "$kind" = env-exception ] && [[ " $ENV_FLAKY " == *" $name "* ]]; then
      exceptions+=("$name ($reason)")
      exception_count=$((exception_count + 1))
    else
      unexpected+=("$name ($reason)")
      unexpected_count=$((unexpected_count + 1))
    fi
  done < <(tail -n +2 <<<"$out")
  local passed=$((tests - failures - errors - skipped))
  echo "$label: 통과 ${passed}건 / 환경 예외 ${exception_count}건 / 실패 ${unexpected_count}건 / 건너뜀 ${skipped}건"
  for reason in ${exceptions[@]+"${exceptions[@]}"}; do
    echo "$label: 환경 예외 — $reason"
  done
  if [ "$skipped" -gt 0 ]; then
    echo "$label: 건너뛴 테스트는 통과로 인정하지 않는다 — $copy/results-full" >&2
    return 1
  fi
  if [ "$unexpected_count" -gt 0 ]; then
    echo "$label: 전체 테스트 실패 ${unexpected_count}건: ${unexpected[*]:-} — $copy/results-full" >&2
    return 1
  fi
  if [ "$exception_count" -gt 0 ]; then
    full_result="통과(환경 예외 ${exception_count}건: ${exceptions[*]:-})"
  else
    full_result="전체 통과"
  fi
  echo "$label: $full_result — $copy/results-full"
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
  if [ -z "${failed[*]:-}" ]; then
    check_full "$copy" all-fixes || failed+=(all-fixes)
  fi
  [ -z "${failed[*]:-}" ] && echo "all-fixes: OK (${*} 누적 적용, 확인 테스트 포함 $full_result) — $copy"
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
    echo "$t: OK (결함 상태 단언 실패 → 수정 후 통과$($full && echo ", $full_result" || true)) — $copy"
  done
fi

if [ -n "${failed[*]:-}" ]; then
  echo "실패: ${failed[*]:-}" >&2
  exit 1
fi
