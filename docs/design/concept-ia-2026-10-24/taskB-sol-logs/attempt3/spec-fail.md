# Task B 독립 명세 재검토 — 수정 요청

Attempt 3: **Spec FAIL(C0/I1/M0), Quality NOT_RUN**. 이전 두 FAIL은 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt1`와 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2`에 보존했다. Q&A/참고문헌, ID, focus 및 P16 장면 제목 문제는 현재 수정됐으며 fresh reader/dark 하네스가 통과한다.

## TASKB-I4 — 접힌 원문 표의 펼침 버튼이 숨겨짐

`LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.css:61`의 `details[class$="-original"] > summary`는 outer 원문 wrapper뿐 아니라 내부 `.version-original`도 숨긴다. JS가 `.version-original`을 명시적으로 닫으므로, J03 읽기 모드에서 원문 표6행의 `원문 표 보기` summary는 display:none인 채 접근할 수 없다. 같은 구조가14문서에 있다.

최소 수정: 숨김 대상은 outer 원문 wrapper의 summary로 제한한다. 내부 version-original의 원문 표 펼침 조작은 유지하며 source DOM/text/code/표 원본은 고치지 않는다. 실제 J03/S09의 read 모드에서 summary 표시와 펼침을 회귀 검사한다.

증거: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt3/hidden-source-tables.json` 및 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt3/hidden-source-tables.log`. 독립 계약은 exit1이다. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt3/input-snapshot.json`에 입력 SHA를 고정했다.

승인19개 generated test 변경은 HEAD에서 source H1 selector 문자열만 치환한 결과와 정확히 같은 것을 정적으로 확인했다. 기존 wholeSourceText/code/ids/frozen 단언 변경은 없었다. 메인 PC 실제 QA와 제품 수정은 수행하지 않았다. Quality는 명세 통과 후에만 진행한다.
