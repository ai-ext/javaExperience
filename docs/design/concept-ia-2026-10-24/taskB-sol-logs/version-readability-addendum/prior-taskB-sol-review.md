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

## 최종 PC 보정 추가 승인

**Spec → Quality PASS_BOUNDED, C0/I0/M0.** `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/polish-addendum/delta-binding.json`은 변경을 되돌린 renderer/CSS가 기존 승인 SHA와 정확히 일치함을 증명한다. 다른 모든 기존 승인 입력 SHA는 같다.

- 읽기 제목에 focus 상태와 무관한 scroll-margin-top96px를 적용했다.
- scene workspace 직계 관찰 패널만 내부1열로 두어 값과 코드가 우측 패널에서 세로로 이어진다.
- 생성번호 badge만 제거하고 목차 표시를 block으로 바꿨다.134문서의 목차1142개는 원문 H2label 및metadata와 정확히 같고 D13의 원래8번을 포함한 절 번호를 유지한다.

renderer 비교 fixture에서 badge를 제거하면 전후 DOM/metadata/source가 동일하다. 모드JS/metadata escape/QA/source 변환은 바뀌지 않았다. fresh concept-reader/dark 하네스PASS이며 검토자 제품수정은 없다. 기존 mutation10/10 승인은 그대로 유지하며 이번에 재실행했다고 주장하지 않는다. 실제 PC 재검증·24하네스·audit는 메인 담당자가 마무리한다.

근거: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/polish-addendum/addendum.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/polish-addendum/probe.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/polish-addendum/spec-pass.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/polish-addendum/quality-pass.json` 및 같은 폴더의 로그. 이전 승인 보고서는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/taskB-sol-review.json`에 원본으로 보존했다.

## UI 장부 수집기 추가 승인

**Spec → Quality PASS_BOUNDED, C0/I0/M0.** `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs`의 collectHtml32줄 추가만 검토했다. 이전 add/ID/중복방지/status/evidence/date/mark 및 분류 코드는 한 글자도 바뀌지 않았으며 기존 승인 UI 소스 SHA도 같다. 최종 입력 목록에는 수집기 SHA `d25b1d6b9f8c89a092f848103faf6bf5b031ca3f2e207ee45a54c6e92e45d769`만 추가했다.

실제 DOM과 장부의 reader shell/mode/TOC/catalog 설명/home 직행 개수는134/268/1142/134/1로 일치한다. 신규 reader UI1679개를 포함한 전체 신규1876개는 모두unreviewed/evidence빈값/date빈값이다. 나머지197개는 기존 수집기가 감지한 QA토글191개·기존returnnav5개·home-intro fingerprint교체1개다. 이전45326행 중45325행은 ID뿐 아니라 모든 필드가 동일하고, 제거1행은 새directlink 문구를 포함하게 된 home-intro fingerprint의 교체다. 중복ID0·상태승격0이며 QA새토글191개/전체toggle13669·P09implemented89/학습상태84를 확인했다.

원본 수집기를 별도 Node process에서 fs.writeFileSync를 메모리수집으로 가로채 실제 제품 파일에 쓰지 않고 재실행했다. 출력3개가 포착됐고 생성JSONL byte가 현재장부와 같았다. 실제로 새 장부파일을 재생성했다고 주장하지 않는다.

근거: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/inventory-addendum/addendum.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/inventory-addendum/probe.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/inventory-addendum/delta-binding.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/inventory-addendum/probe.log`. 이전승인원본은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskB-sol-logs/inventory-addendum/prior-taskB-sol-review.json`에 보존했다. 이는 수집 정확성의 승인이고 새 항목의 구현/검증 완료 승격이나 Task C/134전체개념완료 승인이 아니다.
