#!/usr/bin/env bash
# codex 검증 호출. 사용법: codex-review.sh <이름> <지시파일>   → 결과 scratchpad/reviews/<이름>.md
# gpt-6-astra로 시도하고 실패하면 gpt-6-sol로 다시 돈다. 리포는 읽기 전용으로 본다.
set -uo pipefail
name=$1; brief=$2
S="${CODEX_REVIEW_DIR:-$(pwd)/.codex-reviews}"
W="${REPO_DIR:-$(git rev-parse --show-toplevel)}"
mkdir -p "$S/reviews"
prompt="$(cat "$brief")

규칙: 너는 검증자다. 파일을 고치지 마라(읽기 전용). git log/diff/show, cat, grep, ls 등으로 직접 확인하라.
결과는 한국어 마크다운으로: 1) 판정(PASS / FAIL / PASS-with-issues) 2) 문제 목록 — 각 항목에 심각도(blocker/major/minor), 파일:줄, 근거(실제 코드 인용), 고칠 방법 3) 확인한 것 목록. 추측이면 추측이라고 표시하라."
for m in gpt-6-astra gpt-6-sol; do
  if codex exec -c model_provider=openai -m "$m" -c model_reasoning_effort=high \
      -s read-only -c approval_policy=never --skip-git-repo-check -C "$W" \
      -o "$S/reviews/$name.md" "$prompt" < /dev/null > "$S/reviews/$name.$m.log" 2>&1 \
      && [ -s "$S/reviews/$name.md" ]; then
    echo "model=$m" >> "$S/reviews/$name.md"
    echo "$S/reviews/$name.md"
    exit 0
  fi
done
echo "codex 검증 실패: $S/reviews/$name.*.log" >&2
exit 1
