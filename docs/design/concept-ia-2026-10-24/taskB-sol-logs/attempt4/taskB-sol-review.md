# Task B 독립 검토 — 한정 승인

**Spec PASS_BOUNDED → Quality PASS_BOUNDED, C0/I0/M0.** 기준 HEAD `90edde073041885f56661056e0532f4fc9ef4cc4`의 현재 reader diff와 명시 승인된 QA 구조/toolbar H1/19개 source-H1 selector 변경을 검토했다. 입력 SHA는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/input-snapshot.json`에 고정했고 품질 완료 시 다시 같음을 확인했다.

## 명세와 보존

- 134개 source root normalized text/code/Markdown SHA와 기존 ID 보존, 생성 DOM ID 고유, main landmark 하나를 독립 확인했다.
- 기존 `.knowledge-page-map` outerHTML은 134문서에서 HEAD와 같고 원문MD/baseline/src/practice/scenario/proof/frozen에 추적 변경이 없다.
- 실제 Q&A133문서의907개 답이 기본 접힘이고 질문 summary와 답이 각각 존재한다. 새 p/strong 및 list191그룹은 질문을 복제하지 않고 이동했다. 접기 밖 잔여 답 텍스트0이며 D13의 QA 없음은 유지된다.
- 원문 버전 표14곳은 기본 접힘이며 summary가 표시되고 펼칠 수 있다. scene/read H1 역할도 독립 DOM/CSS 범위에서 확인했다.
- 실제 P09 controller와 reader를 함께 초기화해 모드 전환 후 stage/foreign history/query 보존, 원문hash 진입/정리, malformed hash, 없는hash 제목focus, 중복init 방지를 검증했다.
- metadata의 List<T>/HTML 종료문자열/따옴표 roundtrip과 주입 노드 없음이 확인됐다.
- 19개 generated test diff는 HEAD에 승인된 source-H1 selector 치환만 적용한 결과와 정확히 같다. 기존 wholeSourceText/CODE/ID/frozen 기대값은 유지된다.

## 품질과 검증

관련5하네스 concept-reader/concept-dark/home/knowledge-catalog/navigation 모두 fresh PASS다. `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/mutations.json`의 독립변이10개를 모두 검출했다. 외부history/query 손실, read중 scene노출/source닫힘, Q&A 자동노출, hash 미정리, 중복init, 잘못된decode, nested표버튼 숨김, read중복제목 경계를 검증했다. 변이는 메모리 문자열/격리 DOM에서만 실행해 제품 파일을 바꾸지 않았다.

QA helper는 H3가 없는 자가점검 chapter에서만 호출되며 다른 core section·기존H3 경로는 보존된다. raw slice로 필요한 문단/목록만 감싸고 전체 원문을 재직렬화하지 않는다. 독립 fixture에서 text순서/질문1회/inline+후속답/ordered start/코드·ID 보존을 확인했다. 의존성·네트워크·storage·새mobile/light 분기·래스터filter 추가가 없다. catalog 복귀 controller는 querySelectorAll로 toolbar와 기존 anchor를 처리한다.

근거:

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/spec-pass.json` 및 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/independent-spec.json`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/all-qa.json`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/quality-pass.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/quality-static.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/quality-scope.json`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/mutations.json`와 같은 폴더의 명령별 log

이전3회 FAIL 원본은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt1`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt3`에 보존했다. I1/I2/M1/I3/I4는 모두 해소됐다.

## 승인 한계

정적/JSDOM 범위의 Task B 한정 승인이다. 실제 PC 브라우저 가독성·header·scroll·표 넘침·이미지/코드 배치는 메인 담당자 QA로 확정한다. 검토자는 build/전체24하네스/audit/브라우저/Java/DB/외부CLI를 실행하지 않았고 제품수정/commit/push/PR/merge를 하지 않았다. 134개 고유개념 전체완성·wholepixel·학습자이해도·Task C는 승인하지 않는다.
