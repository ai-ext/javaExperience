#!/usr/bin/env bash
# 생성 HTML 손편집 감시: 다시 빌드한 결과가 커밋된 HTML 과 같아야 한다. 다르면 차이만 보이고 실패한다(되돌리지 않는다).
# 빌드는 HTML 을 덮어쓰므로, 커밋 안 된 HTML 변경이 있으면 지우지 않도록 빌드 전에 멈춘다.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! git diff --quiet HEAD -- ':(top)*.html' || [[ -n "$(git ls-files -o --exclude-standard -- ':(top)*.html')" ]]; then
  echo "커밋 안 된 HTML 변경이 있다. 빌드가 덮어쓰므로 먼저 커밋하거나 치운다:" >&2
  git status --short -- ':(top)*.html' >&2
  exit 2
fi
npm run -s build >/dev/null
status=0
git diff --stat --exit-code -- ':(top)*.html' || status=1
new=$(git ls-files -o --exclude-standard -- ':(top)*.html')
if [[ -n "$new" ]]; then echo "빌드가 새로 만든 HTML(커밋 안 됨):"; echo "$new"; status=1; fi
if [[ $status -ne 0 ]]; then echo "생성 HTML 이 소스와 다르다 — md/JSON 소스를 고치고 npm run build 결과를 커밋한다." >&2; else echo "생성 HTML = 커밋된 HTML"; fi
exit $status
