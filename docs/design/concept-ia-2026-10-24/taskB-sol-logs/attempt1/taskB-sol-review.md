# Task B 독립 명세 검토 — 수정 요청

기준 HEAD: `90edde073041885f56661056e0532f4fc9ef4cc4`. 현재 reader diff를 검토했다. **Spec FAIL: Critical 0 / Important 2 / Minor 1**. 명세 통과 뒤에만 품질을 검토하라는 순서에 따라 **Quality NOT_RUN**이다.

## TASKB-I1 — 읽기 모드에서 Q&A 답과 참고문헌이 자동 노출됨 (important)

코드: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.js`의 tools/site/knowledge-reader.js:47-53. 계약: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/TASK-B-SPEC.md`의 TASK-B-SPEC.md:31.

재현: P09/J01/S09/W11을 ?read=1로 열기. 자가점검 chapter는 open=true이고 내부 Q1~Q4 topic도 모두 open=true. 참고문헌 chapter도 open=true.

원인: 모든 chapter를 열고 topic 자신의 summary에서 자가점검 문자열만 찾는다. 실제 Q1~Q4 summary에는 그 문자열이 없으며 Q&A 의미는 부모 chapter에 있다. 참고문헌 chapter는 별도 닫기 처리가 없다.

최소 수정: 원문 DOM을 바꾸지 않고 chapter 제목/문맥으로 핵심, Q&A, 참고문헌/명시적 선택 심화를 분류한다. Q&A chapter는 질문을 보이게 열되 답이 있는 topic은 닫고, 참고문헌과 명시적 선택 심화 chapter는 닫는다.

회귀 검증: 실제 생성 P09 및 일반 J01의 Q&A chapter open + 모든 답 topic closed + 참고문헌 closed를 필수 단언한다. 현재 test의 if(quiz)는 대상이 없으면 검사를 건너뛰므로 fixture 존재도 필수 단언한다.

## TASKB-I2 — 기존 원문 H1 ID를 새 제목에서 복제함 (important)

코드: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.mjs`의 tools/site/knowledge-reader.mjs:17; tools/site/build.mjs:678-683. 계약: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/TASK-B-SPEC.md`의 TASK-B-SPEC.md:21-23,35.

재현: P09 생성 HTML의 id=p09-java-문법-기초--클래스필드메서드생성자를-선언하고-호출하기는 HEAD 1개에서 현재 2개가 된다. 새 .kr-source-title와 #p09-original 안의 기존 H1이 같은 ID를 가진다. document.getElementById는 새로 생성한 숨김 제목을 먼저 선택한다.

원인: build가 원문 H1을 original 안에 보존한 뒤 renderKnowledgeReaderPage가 동일 titleTag를 다시 reading 영역에 삽입한다. CSS는 새 .kr-source-title만 숨기고 원문 H1은 그대로 남긴다.

최소 수정: source 내부 H1은 유지하고 새 보조 제목에는 기존 id를 복제하지 않는다. 원문의 기존 H1은 reading mode에서 scope한 CSS로 숨겨 보이는 H1을 하나로 만든다. 기존 source hash/text/code/ID는 보존한다.

회귀 검증: P09/P04/W09/P19의 기존 ID별 개수가 HEAD보다 증가하지 않는지 검사하고, reader가 추가한 제목 ID가 기존 source ID와 충돌하지 않음을 단언한다. 원문 제목 hash 진입이 숨김 복제 노드를 선택하지 않아야 한다.

## TASKB-M1 — hash 없는 읽기 전환에서 제목으로 focus가 이동하지 않음 (minor)

코드: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.js`의 tools/site/knowledge-reader.js:65-70; tools/site/knowledge-reader.mjs:17. 계약: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/TASK-B-SPEC.md`의 TASK-B-SPEC.md:35.

재현: P09를 hash 없이 scene으로 열고 설명 차근차근 읽기 버튼에 focus한 뒤 click. mode는 read로 바뀌지만 document.activeElement는 계속 read button이다.

원인: .kr-reading-title는 tabindex가 없는 H1이라 focus() 호출을 받지 않는다. hash target 경로에만 tabindex=-1을 부여한다.

최소 수정: 읽기 제목을 프로그램 방식으로 focus 가능한 대상으로 만들고 읽기 전환 때 focus와 scroll 이동을 확인한다. 기존 hash target focus 동작은 보존한다.

회귀 검증: 실제 생성 P09에서 scene→read 선택 후 document.activeElement가 .kr-reading-title인지 필수 단언한다.

## 실행 근거와 판정 범위

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/test-concept-reader.log`: 기존 reader 하네스 PASS. 위 경계를 검출하지 못한다.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/test-concept-dark.log`: 기존 theme/source 하네스 PASS. 134 원문 text/code/Markdown/기존 ID와 136페이지 scope 계약이 유지된다.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/spec-probe.mjs` / `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/spec-probe.json`: 실제 생성 P09/J01/S09/W11 DOM과 HEAD 비교 관찰. probe exit 0은 결함 재현 관찰 수집 완료이며 제품 정상 의미가 아니다.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/assert-spec-boundaries.mjs` / `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/assert-spec-boundaries.log`: 필수 경계 단언 10개 모두 실패(exit 1). Q&A 답 접힘 4개, 참고문헌 접힘 4개, 새 중복 ID 1개, 제목 focus 1개다.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/input-snapshot.json`: 검토한 소스 및 baseline SHA-256.

기존 catalog controller의 하던 과제/목록 복귀는 `querySelectorAll`로 모든 anchor를 처리하므로, toolbar 추가로 첫 링크만 갱신되는 문제는 해당 경로에 없다. 홈/카탈로그 링크 변경은 원문 밖에 있으며 기존 source baseline을 고치지 않았다.

검토자는 제품·원문·Java·DB·proof·기존 review·AGENTS·RESUME를 수정하지 않았다. 변경은 이 보고서와 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs` 안에만 있다. 브라우저·fresh build·24하네스·audit·외부 CLI·commit/push/PR를 수행하지 않았다. PC 실제 렌더링 검증은 메인 담당자 소유다. 134개 개념 전체 완료를 승인하지 않는다.
