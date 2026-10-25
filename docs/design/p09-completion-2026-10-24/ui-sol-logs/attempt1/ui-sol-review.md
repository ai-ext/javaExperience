# P09 UI 독립 검수

판정: spec PASS(C0/I0/M0), quality 변경 요청(C0/I0/M1).

## M1: 배열 입력 설명값 회귀검사 공백

현재 제품의 배열 길이와 원소 값은 정확하다. 그러나 신규 검사는 DOM을 같은 stage.values와 비교하고 sum 반환만 actual13과 대조한다. 그래서 `sum-items`의 배열 길이를 `99`로, `sum-array`의 원소를 `[40, 60]`으로 각각 잘못 바꾸고 같은 data로 메모리 bundle을 만들면 전체 신규 검사가 통과한다. 9개 상태의 모든 label/value를 독립 기대값으로 고정하고 source 기반 입력·길이·원소와 실행 반환/선택마커를 구분해 대조해야 한다.

재현: `node /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt1/quality-mutations.mjs`

기록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt1/quality-mutations.json 및 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt1/quality-mutations.stdout.log

## 확인한 검출력

clipboard render generation, request ID, stale catch, stale success guard의 각 삭제 변형과 선택마커 문자열 리터럴 훼손은 모두 실패했다. `npm run test:p09`, `test:concept-reader`, `test:concept-dark`, `git diff --check`는 직접 실행해 통과했다. spec 상세는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt1/spec.json에 있다.

## 범위와 다음 단계

실제 PC 시각·확대·스크롤·OS 정상 clipboard는 메인 담당 관문이다. 메인이 발견한 varargs focus 잘림은 별도 수정 예정이며 이 보고의 직접재현 발견수에 합치지 않았다. 새 모바일·라이트·D11·inventory는 범위 밖이다. 제품파일·원문·학습자 서버·proof를 수정하거나 commit/push하지 않았다. 배열 설명값 검사 및 focus 수정 후 새 입력으로 재검수가 필요하다.
