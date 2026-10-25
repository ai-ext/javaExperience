#!/usr/bin/env bash
# 사용: run-site.sh <시나리오 json>      (tools/site 에서: npm run check:html)
#   VIEWPORT=1440x900|390x844  THEME=light|dark  SUMMARY=1(유형별 개수 + 유형마다 첫 항목)
# 저장소 루트를 127.0.0.1 http 서버로 띄우고, 시나리오 [{name, path, js?, root?, flow?}] 마다
# 페이지를 새로 열어(js 실행 후) check.js 로 재서 `이름<TAB>JSON` 한 줄을 낸다. 마지막 줄은 콘솔 에러.
#   js   : 페이지를 연 뒤 실행할 문장(await 가능). 접기 열기·흐름 단계 이동 같은 상태 만들기.
#   root : check.js 검사 범위 선택자(없으면 화면 전체)
#   flow : true 면 흐름 재생 조작부 검사(extra.js __flowCheck)를 check 다음에 돌린다.
# 사이트 공통 추가 검사: 가로 넘침(hscroll) — 가로 스크롤, 또는 html·body overflow-x 로 화면 밖에서 잘린 요소.
# 검사 전에 화면 낭독기 전용 글(1px sr-only)을 뺀다 — 잘림·반복 오탐(extra.js __hideSrOnly).
set -euo pipefail
if [[ -n "${SITE_BASE_URL:-}" ]]; then
  exec node "$(dirname "$0")/run-shared.mjs" "$1"
fi
SCN=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
B=~/.claude/skills/gstack/browse/dist/browse
export GSTACK_SKIP_ASIDE=1
THEME=${THEME:-light}
case "$THEME" in light|dark) ;; *) echo "THEME 은 light|dark" >&2; exit 2 ;; esac

PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SRV=$!
# 서버는 어떤 경우에도 끈다. 브라우저 데몬은 KEEP_BROWSER=1 이 아니면 같이 끈다.
cleanup() { kill "$SRV" 2>/dev/null || true; wait "$SRV" 2>/dev/null || true; [[ "${KEEP_BROWSER:-}" == 1 ]] || $B stop >/dev/null 2>&1 || true; }
trap cleanup EXIT
for _ in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; python3 -c 'import time; time.sleep(0.2)'; done

CHECK="$(cat "$HERE/check.js")
$(cat "$HERE/extra.js")"
# 사이트에는 테마 단추가 없고 CSS 가 prefers-color-scheme 과 :root[data-theme] 를 함께 본다. 속성으로 강제한다.
# browse 의 js 는 코드에 await 가 있으면 async 함수 본문으로 감싸 마지막 식을 돌려주지 않는다.
# 아래 js 는 모두 await 를 포함하므로(상태 js·extra.js) 결과를 받으려면 명시적 return 이 필요하다.
THEME_JS="document.documentElement.dataset.theme = '$THEME';"
$B viewport "${VIEWPORT:-1440x900}" >/dev/null 2>&1 || true
$B goto about:blank >/dev/null 2>&1
$B console --clear >/dev/null 2>&1 || true
errs=""
n=$(jq 'length' "$SCN")
for ((i = 0; i < n; i++)); do
  name=$(jq -r ".[$i].name" "$SCN"); path=$(jq -r ".[$i].path" "$SCN")
  js=$(jq -r ".[$i].js // \"\"" "$SCN"); root=$(jq -r ".[$i].root // \"\"" "$SCN"); flow=$(jq -r ".[$i].flow // false" "$SCN")
  url="http://127.0.0.1:$PORT/$path"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
  if [[ "$code" != 200 ]]; then echo "$name	{\"ok\":false,\"counts\":{\"http\":1},\"first\":[\"http: $code $path\"]}"; continue; fi
  $B goto about:blank >/dev/null 2>&1
  $B goto "$url" >/dev/null 2>&1
  out=$($B js "return (async () => { try { $THEME_JS await document.fonts.ready; $js } catch (e) { return JSON.stringify({ok:false,counts:{script:1},items:[{type:'script',detail:String(e)}]}); } return null; })()" 2>/dev/null | tail -1)
  if [[ "$out" == *'"script"'* ]]; then echo "$name	$out"; continue; fi
  res=$($B js "$CHECK
return (() => { __hideSrOnly(); const r = JSON.parse(__htmlCheck(${root:+\"$root\"})); const h = __hscroll(); if (h) { r.ok = false; r.counts.hscroll = 1; r.items.push({ type: 'hscroll', where: h.where, text: '', detail: '가로 스크롤 ' + Math.max(0, h.over) + 'px, 화면 밖으로 잘린 요소 ' + h.n + '개' }); } return JSON.stringify(r); })()" 2>/dev/null | tail -1)
  if [[ "$flow" == true ]]; then
    f=$($B js "$CHECK
return __flowCheck()" 2>/dev/null | tail -1)
    if [[ "$f" != ok* ]]; then res=$(echo "$res" | jq -c --arg d "$f" '.ok = false | .counts.flow = 1 | .items += [{type: "flow", where: "section.flow", text: "", detail: $d}]' 2>/dev/null || echo "$res"); fi
  fi
  if [[ "${SUMMARY:-}" == 1 ]]; then res=$(echo "$res" | jq -c '{ok, counts, first: ([.items | group_by(.type)[] | .[0] | "\(.type): \(.where[-40:]) \(.text[0:30]) — \(.detail[0:90])"])}' 2>/dev/null || echo "$res"); fi
  echo "$name	$res"
  e=$($B console --errors 2>/dev/null | grep -v UNTRUSTED | grep -v '^\s*$' | tr '\n' ' ' || true)
  [[ -n "$e" && "$e" != *"no console errors"* && "$e" != *"(no "* ]] && errs+="[$name] $e "
  $B console --clear >/dev/null 2>&1 || true
done
echo "console	${errs:-0}"
