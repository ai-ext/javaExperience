# Task B 독립 명세 재검토 — 수정 요청

Attempt 2: **Spec FAIL(C0/I1/M0), Quality NOT_RUN**. 기준 HEAD `90edde073041885f56661056e0532f4fc9ef4cc4`와 수정된 reader diff를 검토했다. 최초 FAIL은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt1`에 보존했다.

이전 Q&A/참고문헌 펼침, P09 title ID 중복, 읽기 제목 focus의 세 항목은 현재 독립 DOM 관찰로 해소됐다. 실제 생성 134페이지의 source/ID/main/metadata 검사는 fresh reader 하네스가 통과했고 theme 하네스도 통과했다.

## TASKB-I3 — P16 scene 제목이 원문 숨김 대상으로 선택됨

`/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs:684`의 조립 후 첫 H1 replace는 reader의 visual 안에 있는 `#p16-heading`에 `p16-original-title`을 붙인다. HEAD에서는 이 class가 source H1에만 있고 `#p16-heading`에는 없다. 기존 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-json-visual.css:104`는 이 class를 1px로 줄이고 clip-path로 숨긴다. 결과적으로 실제 P16 장면 제목이 사라진다.

최소 수정: P16 원문 titleTag에 조립 전에 숨김 class를 적용하거나 명시 source H1을 선택한다. 조립 후 첫 H1 선택은 제거한다. source ID/reader 제목/scene H1을 보존한다. 생성 P16의 실제 `#p16-heading`에 숨김 class가 없는지 필수 회귀 검사로 확인한다.

재현과 실행 근거:

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/p16-title-probe.json`: HEAD와 현재 title DOM 및 기존 CSS computed width/clip-path 비교.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/p16-title-probe.log`: scene 제목에 숨김 class가 없어야 한다는 독립 계약 실패(exit 1).
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/spec-probe.json`: 이전 세 finding 수정 관찰.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/test-concept-reader.log` 및 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/test-concept-dark.log`: fresh PASS.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/input-snapshot.json`: 현재 입력 SHA-256.

제품 파일 수정은 없다. 명세 FAIL이므로 품질 검토는 수행하지 않았다. PC 실제 가독성/배치 QA는 메인 담당자 소유이며 134개 고유 개념 완료를 승인하지 않는다.
