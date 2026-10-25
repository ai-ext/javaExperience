# 코드 병합 준비 검수 · 2026-10-25

판정: **READY_WITH_MINOR_FIXES (검수한 코드 범위에 한정)**. Critical 0건, Important 0건, Minor 1건을 확인했다. M1은 D12 경계 단계 이동 시 focus 복구 오류다. 원본 브랜치의 실제 main 병합 가능 여부는 별도 통합·이력 검수에 의존하며, 이 문서는 실제 병합을 승인하거나 134개 학습자료 전체 완성을 선언하지 않는다.

## 고정 입력과 검수 경계

- 작업 공간: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night`
- 원격 main 기준: `a70f1bd531c1b72077d56e7363ff424ba5795143`
- HEAD: `b93457b577d913f2a7dbe2635f88c1a0d6e4920a`
- 최신 WIP 포함 검수 snapshot: `e6f837ab420d903ad7c4a21a75744502b44492ab`
- 입력: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/INPUT-SNAPSHOT.json`
- 아래 핵심 소스 16개는 검수 당시 worktree 바이트와 snapshot blob이 모두 일치했다. 해시는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/code-review.json`에 기록했다.

소스를 대조해 관련 경계를 검토한 범위는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/` 아래 `knowledge-reader.mjs`, `knowledge-reader.js`, `knowledge-reader.css`, `knowledge-catalog-data.mjs`, `knowledge-catalog-view.mjs`, `knowledge-catalog-controller.mjs`, `knowledge-dark.css`, `site-navigation.mjs`, `knowledge-navigation.css`, `d12-source-diagrams.mjs`, `p09-learning.js`, `d11-learning.js`, `d12-learning.js`, `d11-learning.mjs`, `d12-learning.mjs`다. `build.mjs`는 변경 중 registration·source wrapper·escaping·asset version·Mermaid bootstrap 경계를 집중 검토했으며 파일의 무관한 모든 기능을 전수 감사하지 않았다.

검토한 테스트는 reader 보존·hash/history 계약, catalog 검색·복귀·storage/IME·텍스트 보안, D12 도식 visible-only/anchor guard, D11/D12 데이터 계약·generated 검사의 관련 assert다. 수백만 줄의 proof 원자료와 모든 fixture payload를 재실행·전수 재검증하지 않았다.

## 확인한 결함

### M1 · D12 단계 경계에서 focus 복구 조건이 변경 전 값을 검사한다

- 분류: **Minor / 현재 HEAD에 도입된 오류 / 미수정**.
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d12-learning.js:162`와 `:164`.
- 사실: `focusWasDisabled`는 `render()` 이전 `doc.activeElement.disabled`의 Boolean이다. 활성 Next/Previous 버튼으로 이동할 때 이 값은 `false`다. `render()`가 끝점에서 해당 버튼을 disabled로 바꿔도 이미 저장한 값은 바뀌지 않아 stage 버튼으로 focus를 옮기는 분기가 실행되지 않는다.
- 재현: 기본 질문에서 끝에서 두 번째 단계 선택 → Next에 focus → 클릭; 또는 두 번째 단계 선택 → Previous에 focus → 클릭. source와 generated bundle 각각 두 방향, 총 4건에서 이동 버튼이 disabled가 된 후에도 activeElement가 그 버튼에 남고 선택 stage에는 focus가 가지 않았다.
- 정상 인접 동작: D12의 선택 stage/관측 내용 자체는 기대하는 마지막·첫 단계로 이동했다. D11은 같은 4조건에서 element 참조를 보존한 뒤 `focused.disabled`를 검사하므로 선택 stage로 focus를 이동했다. D11의 비교 위치는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d11-learning.js:131`이다.
- 실제 Chrome 재현: 메인이 `redirect-order` 질문에서 `append` → Next → 마지막 `overwrite-output`, `stderr-first` → Previous → 첫 `stdout-first`의 두 경계를 조작했다. 두 경우 모두 경계 버튼은 disabled, 선택 stage는 정상 변경됐지만 `activeTag`와 `activeText`는 `BODY`였다. JSDOM에서는 activeElement가 disabled 이동 버튼에 남는 반면 Chrome에서는 BODY로 빠지는 차이가 있다. 두 결과 모두 의도한 선택 stage로 focus가 복구되지 않는 M1을 뒷받침한다. 이 검수자는 메인이 수집한 JSON을 읽었고 브라우저를 직접 조작하지 않았다.
- 실제 Chrome 근거: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/d12-focus-native.json`. 캡처는 메인이 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/d12-focus-native.jpg`에 보관했다. 이후 Tab 순서와 수정 후 focus 복구는 아직 검증하지 않았다.
- 영향: 경계에 도달한 키보드 사용자의 focus 이동 계약이 깨진다. 실제 Chrome에서는 선택 stage 대신 BODY로 focus가 빠진다. 콘텐츠·복사 데이터·원문이 손실되는 결함은 확인되지 않았다.
- 도입 근거: `git blame -L 159,164 b93457b577d913f2a7dbe2635f88c1a0d6e4920a -- tools/site/d12-learning.js`는 모두 `b93457b577d913f2a7dbe2635f88c1a0d6e4920a` (`docs: add D12 PC dark Linux concept learning`)로 연결된다. 최신 catalog/reader CSS WIP에서 도입된 문제는 아니다.
- 교정 과제: render 전 focused element 참조를 보관하고 render 후 그 element의 `disabled`를 검사한다. D11과 같은 단순 패턴이면 충분하다. source와 generated bundle의 양방향 경계 focus 검사를 추가하고 실제 PC 키보드로 끝점 이동을 확인한다. 이번 작업은 검수이므로 제품 코드를 수정하지 않았다.
- 재현 스크립트: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/code-repro-d12-focus.mjs`
- 관찰 결과: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/code-repro-d12-focus.json`
- 재현 명령: `node LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/code-repro-d12-focus.mjs`

위 스크립트 exit 0은 **관찰 자료 생성 성공**이다. 제품 정상 동작 검사를 통과했다는 뜻이 아니다. 기존 D12 계약 하네스가 녹색이어도 이 결함은 남아 있다.

## 검토 결과와 현재 근거

| 경계 | 확인 결과 | 판정 한계 |
|---|---|---|
| catalog query·alias·IME·history·복귀 | 검색어는 텍스트로 출력하고 URLSearchParams로 처리한다. 일반 click의 일회 토큰·60초 시간·target/list/referrer·수정키를 검사한다. 관련 14 tests 통과. | 같은 origin에서 임의로 변조한 storage/history는 이 앱의 인증 경계가 아니다. 실제 브라우저의 새 전체 흐름은 이번 독립 검수에서 실행하지 않았다. |
| reader 원문·ID·code·metadata | 기존 134 상세 baseline의 Markdown·원문 텍스트·code·ID, single main, Q&A, hash/query/history 검사 통과. 메타데이터는 attribute escaping, JSON의 `<` 치환을 적용한다. | 135 원본 파일과 학습자 17파일의 별도 기준 전수 해시 판정 및 학습 내용 전수 정확성은 메인 검수 범위다. |
| 최신 catalog/reader WIP | 변경은 설명 paragraph 순서와 다크 화면 폭 CSS다. reader/main 폭 규칙은 `data-concept-surface="dark"` 및 reader 존재로, catalog 규칙은 catalog root/body로 제한된다. 본문 paragraph는 74ch를 유지한다. | PC 다크 1280px+ 범위다. 새 모바일·라이트 검증을 하지 않았고 해당 지원 완료를 주장하지 않는다. |
| build 등록·버전 | D11/D12 bundle 생성·해당 문서 로드, reader/common controller 등록을 대조했다. asset URL은 해당 파일 SHA-256 앞 12자리로 생성한다. D12만 initial anchor guard를 CDN module import 앞의 inline script로 설치한다. | build 전체 재실행은 메인이 수행한다. 병합 후 main의 다른 build 변경과의 충돌 해결은 별도 검수다. |
| D12 diagram·anchor | visible 경로·폭 검증, 직렬 render, 숨김/실패 시 원문 복원, 실패 안내, DOM 완료 후 초기 anchor 단일 복원, user navigation 취소 guard와 dispose 경계를 읽었다. helper 검사 통과. | Mermaid CDN 실제 응답·브라우저 렌더는 이번 검수에서 실행하지 않았다. 다른 문서의 Mermaid 도식 전수 정상 판정은 하지 않는다. |
| P09 static/varargs·D11/D12 표시 | trusted lesson payload를 textContent/DOM으로 표시하며 UI 단계 이동은 보관된 관측을 선택한다. 문자열로 보관된 innerHTML·shell·SQL 예제를 실행하는 경로는 이 UI에서 찾지 않았다. clipboard는 요청 번호·render generation으로 늦은 응답을 격리한다. | Java/SQL/Linux proof를 새로 전수 실행하지 않았다. 텍스트 계약 일치와 실제 서버 동작 검증을 동일시하지 않는다. |

## 이번 검수에서 실행한 검사

작업 디렉터리는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site`다. 아래 순차 명령은 최종 exit 0이었다.

1. `node test-knowledge-reader.mjs` → 134개 원문·코드·ID·Markdown baseline, hash/history 등 PASS.
2. `node test-knowledge-catalog.mjs` → 14 tests, pass 14, fail 0.
3. `node test-d12-source-diagrams.mjs` → visible-only rendering and fallback PASS.
4. `node test-d12-learning.mjs` → canonical 45-state contract PASS.

별도로 M1 반례 스크립트를 실행했다. D12 source/bundle 4경계에서 잘못된 focus를 관찰했고 D11 source/bundle 4경계는 인접 정상 동작이었다. 이어 메인이 수집한 실제 Chrome 양방향 2경계 JSON을 대조해 선택 stage 대신 BODY로 focus가 빠지는 결과를 확인했다. 기존 계약 하네스 통과와 이 동작 결함은 공존한다.

기존 catalog/reader Sol 보고서는 현재 CSS·view 해시와 대조해 **과거 한정 UI 근거**로만 사용했다. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/catalog-polish-2026-10-25/SOL-REVIEW.json`의 해시 두 개는 현 소스와 일치하며, `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/reader-width-2026-10-25/SOL-REVIEW.json`의 최종 reader CSS SHA도 일치한다. 이 검수자는 새 브라우저 조작이나 캡처 전수 열람을 하지 않았다.

## 남은 작업과 판정 범위

- M1을 진행표의 수정 과제로 남긴다. 교정 후 양방향 경계 focus와 실제 PC 키보드 동작을 검증해야 해당 계약을 완료로 바꿀 수 있다.
- 원본 이력의 공개 제외 캡처, main과의 충돌·45일 과정 호환, 최종 빌드/26하네스/감사와 원문·학습자 보존은 메인과 별도 통합 검수 결과를 따른다.
- 전체 약 59k 소스 변경, proof 약 2M lines의 전수 감사, 모든 학습자료의 완성·학습 효과·보안 적합성 판정은 하지 않았다.
- 실제 merge·commit·push·PR·제품 파일 수정은 수행하지 않았다. 작성한 것은 이 검수 보고와 JSON·재현 스크립트·재현 JSON뿐이다.
