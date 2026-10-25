# 병합 호환성 독립 검수 — 2026-10-25

**지금 병합: No. 정제된 최신 main 기반 후보에 선별 이식한 뒤 재검토가 필요하다.** 개념 작업을 버릴 근거는 없으나, 현재 원본 branch 이력을 그대로 합칠 수 없고 실제 431경로 충돌이 남는다. 통합 후보를 만들거나 실행한 검수는 아니다.

## 고정 입력과 검수 범위

- 작업 위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night`.
- main: `a70f1bd531c1b72077d56e7363ff424ba5795143`. HEAD: `b93457b577d913f2a7dbe2635f88c1a0d6e4920a`.
- 검토 내용 snapshot: `e6f837ab420d903ad7c4a21a75744502b44492ab`. HEAD에 당시 dirty 215파일을 더하되 기존 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/AGENTS.md`와 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-learning-night-2026-10-20/RESUME.md` 변경은 제외했다. 상세 계약: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/INPUT-SNAPSHOT.json`.
- merge-base: `b9e398223a55b682004bd62f6ad2ca312cd84823`. 기존 merge-tree 기록의 결과 tree: `364ae40be5b5015e203198cda69324eb89c648c6`. 해당 기록의 exit 1과 충돌을 검수했으며 실제 branch나 main을 merge하지 않았다.
- 현재 원격 PR 상태는 조회하지 않았다. PR #9/#10은 고정 main의 로컬 Git merge commit 기록(각각 `3f99e38b`, `a70f1bd5`)과 실제 소스로만 확인했다.
- 후속 실행 중 생긴 harness/장부 변경은 고정 snapshot에 소급 포함하지 않는다. 이 검수는 제품·원문·AGENTS·RESUME를 수정하지 않았다.

## 충돌 전수 분류

`/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/merge-tree.txt`의 stage 1/2/3 경로를 집합으로 중복 제거했다. 충돌 메시지 431건과 고유 경로 431개가 일치한다. content 358, add/add 73이다. 모든 경로·stage blob·로그 줄은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/compat-review.json`에 있다.

| 범주 | 고유 경로 | 대표 근거와 처리 |
|---|---:|---|
| 생성 HTML | 340 | `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/README.html`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P16-json-jackson-practical.html`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/scenario/README.html`. 결합 소스에서 재생성해야 한다. |
| 소스·검사·생성 JS | 15 | `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/package.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/site-navigation.mjs`. 생성 bundle `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-learning.bundle.js` 1개를 포함한다. |
| 시각·자산 장부 | 15 | `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/visual-inventory.jsonl`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/visual-parity.jsonl`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/mockups-2026-10-15-batch2/asset-index.json`. ID·근거·출처별로 결합한다. |
| 이미지 | 56 | `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/mockups-2026-10-15-batch11/01-mvc-roles.jpg` 등. 공통 JPG 정제와 신규 개념 자산을 구분한다. |
| 과거 검증 증거 | 5 | `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/home-2026-10-18/VERIFICATION.md`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/knowledge-2026-10-19/web-handoff/local-validation.json` 등. 과거 기록을 현재 통합 검증으로 바꾸지 않는다. |
| 합계 | **431** | 각 경로는 정확히 한 범주에만 포함했다. |

생성 HTML 340개는 개념 135, 시나리오 121, 레슨 50, 티켓 30, 홈 2(README/index), 오류 1, 미션 1이다. HTML 충돌 수를 340개 독립 기능 결함으로 세지 않는다.

소스 충돌 15개 전체: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-learning.bundle.js`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-new-visual.css`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-new-visual.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-preparation.css`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-preparation.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-service-preview.css`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-visual.css`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-visual.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-view.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/package.json`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/site-navigation.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-home-new-visual.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-site-navigation.mjs`. 로그의 2112–2141행에서 확인한다.

## 3-way 대조로 확인한 것

단순한 main 대 snapshot 차이를 삭제 회귀로 판정하지 않았다. base→main과 base→snapshot, 그리고 기존 가상 merge tree의 blob을 함께 확인했다.

| 대상 | base | main | snapshot | 실제 해석 |
|---|---:|---:|---:|---|
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs` | 668줄 | 727줄 | 821줄 | 양쪽이 base를 변경했고 11개 충돌 블록이 생겼다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/package.json` | 56줄 | 70줄 | 96줄 | 양쪽 scripts 추가. main 전용 7개, 개념 전용 33개, build 명령은 서로 다르다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs` | 211줄 | 226줄 | 308줄 | main 과정/flow 수집과 개념 reader/상태 수집을 함께 유지해야 한다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/site-navigation.mjs` | 없음 | 47줄 | 43줄 | add/add. 과정 일자·지도 메뉴 및 현재 공간 판별 2블록 충돌. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-view.mjs` | 없음 | 30줄 | 30줄 | add/add. 결과 설명 위치와 `?read=1` CTA가 다르다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-data.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-controller.mjs` | 없음 | 존재 | main과 blob 동일 | 검색·정렬·과제 복귀 controller를 main에서 잃었다고 판단할 근거가 없다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.mjs`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.js`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-reader.css` | 없음 | 없음 | 신설 | reader는 개념 쪽 신규 기능이다. main 변경을 삭제한 파일이 아니다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/course/` | 0파일 | 305파일 | 0파일 | **가상 tree는 305파일 모두 main blob 그대로 보존**한다. snapshot 부재는 삭제가 아니다. |
| `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/course/` | 0파일 | 20파일 | 0파일 | **가상 tree는 20파일 모두 main blob 그대로 보존**한다. |

`/Users/ds/code/javaExperience/.worktrees/concept-learning-night/README.md`, `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/spring-config-tabs.mjs`도 가상 tree에서 main blob과 같다. main의 변경을 모두 개념 branch가 덮어쓴다는 주장은 틀리다. 아래 위험은 실제 충돌 구간을 한쪽 파일로 통째 선택할 때의 위험이다.

## Critical

### C1 — 현재 입력은 병합 가능한 완성본이 아니다

기존 가상 merge 계산이 431경로에서 중단됐다. 특히 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs`의 import, 개념 장면, reader 조립, CSS·JS 연결에 11개 충돌 블록이 있다. 이 상태에서 “현재 main에 안전하게 병합 가능” 판정은 할 수 없다. main/개념 어느 한쪽 파일을 그대로 택하는 해결도 아래 보존 조건을 충족하지 않는다.

### C2 — 원본 이력 직접 병합은 정제 공통 기반 규칙과 맞지 않는다

`/Users/ds/code/javaExperience/.worktrees/concept-learning-night/AGENTS.md:26-30`은 정제 공통 기반 `64b9a0a2aac819a669eadd92a97f928185325ea9`를 기준으로 후속 통합하며, 기존 원본 이력의 공개 제외 캡처를 재유입하지 말라고 명시한다. 현재 Git으로 다음을 다시 확인했다.

| 커밋 | main의 조상 | snapshot의 조상 |
|---|---|---|
| 정제 공통 기반 `64b9a0a2…` | 예 | 아니오 |
| 공통 PR #8 merge `1f443faa…` | 예 | 아니오 |
| 원본 공통 snapshot `aed347fc…` | 아니오 | 예 |

최종 tree에서 제외 파일을 지우는 것만으로 원본 부모 이력까지 정제되지는 않는다. 공개 제외 캡처 실제 경로·해시·도달 이력 전수 감사는 메인 담당자가 별도로 확인한다. 이 검수는 이미지를 열어 보지 않았다. `64b9a0a2…` 자체를 지금의 출발점으로 삼아 최신 main의 후속 기능을 버리는 방식도 피해야 한다. 최신 main `a70f1bd5…`에 그 정제 기반이 이미 조상으로 포함돼 있다.

## Important

### I1 — 공통 build의 과정 v2·설정 탭과 개념 reader를 구간별로 결합해야 한다

main의 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs:49-58`은 과정 로드, 75-88행은 날짜 원본 제외와 과정·설계 공개 문서 수집, 210-222행은 Spring 설정 탭·course ID 자동 링크 제외·원문 HTML id 수집, 588-607행은 티켓 흐름·Java/티켓 복귀·일자·지도 렌더링과 과정 우선 홈을 담당한다. 620행과 638행의 과정 CSS·JS, 713-725행의 최종 주입 링크 검사도 보존 대상이다.

개념 snapshot의 같은 파일은 20-63행 개념 렌더러 import, 90-115행 개념 bundle 생성, 594-704행 26종 개념 장면과 reader 조립, 724-744행 개념 CSS·JS, D12 source anchor guard를 추가했다. main 쪽을 통째 채택하면 개념 기능을, 개념 쪽을 통째 채택하면 과정 기능을 잃는다. 가상 tree에는 과정 코드 대부분이 자동 결합됐지만 SpringConfigTabs import와 CSS/JS 연결은 실제 충돌 구간이므로 “자동으로 다 보존됐다”도 성립하지 않는다.

P1/45일 보존의 기준은 파일 존재만이 아니다. main의 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/course-pages.mjs:453-519`는 45일 홈·추천·일자 진도·Java·티켓 진입을 만들고, 329-433행은 SQL 복사·채점·이전/다음·진도를 조립하며, 80-164행은 Java/티켓을 원래 일자로 돌려보낸다. 617-640행은 렌더러가 주입한 링크를 검사한다. 이 호출 경로와 기존 main의 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/course.js` 진도·선택 티켓·설정 탭 실행을 함께 유지해야 한다.

### I2 — scripts·공통 메뉴·대응 테스트도 함께 결합해야 한다

main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/package.json:7-16`의 build에는 course source/day 선행 생성기가 있다. main 전용 `check:course-data`, `check:generated`, `check:html`, `validate:course`, `test:course`, `audit:images`, `test:course-pages` 7개와 개념 전용 script 33개를 합치면 **고유 script 88개**다. 기존 가상 package 충돌은 마지막 테스트 script 구간이지만, 파일 전체를 개념 쪽 것으로 덮으면 main 선행 생성기와 검사 진입점도 사라진다.

main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/site-navigation.mjs:5-6,15-16`의 두 과정 메뉴와 현재 공간 분류를 유지해야 한다. 두 고정 ref의 모듈을 메모리의 data URL로 import해 함수만 호출한 결과, D45에 대해 main은 6개 메뉴와 `과정 v2 · 일자 목록`을, snapshot은 4개 메뉴와 null을 반환했다. 실제 통합본 실패를 재현한 결과가 아니라 선택지의 동작 차이를 확인한 것이다. `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-site-navigation.mjs`도 메뉴 수·course 경로·생성물 수집을 main 기준으로 보존해야 한다.

### I3 — PR #10의 도구·환경 전제 제거와 Spring 설정 탭을 보존해야 한다

main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-preparation.mjs:20-21`은 Docker 런타임을 안내하고 snapshot은 Docker Desktop을 전제한다. `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-visual.mjs:62`도 같은 차이가 실제 충돌로 남는다. 이 구간은 main 문구를 유지해야 한다. 반면 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/README.md`와 설정 탭 신규 모듈, course source·generated 문서들은 3-way에서 main 그대로 보존되므로 현재 모두 회귀했다고 주장하지 않는다.

설정 탭은 모듈 파일만 있어서는 작동하지 않는다. main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/build.mjs:14,210,638`의 import·변환·course.js 로드와 main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/package.json`의 탭 테스트 호출을 함께 보존해야 한다. 단순히 개념 branch에 탭이 없다는 이유만으로 자동 덮어쓰기라고 판정하지 않았으며, 실제 충돌 해결 시 빠질 수 있는 연결만 지적했다.

### I4 — 장부의 과정 범위와 개념 범위를 함께 유지해야 한다

고정 main 장부 요약은 391화면·50,616항목이며 그중 course 화면 52개, 개념 snapshot은 339화면·47,304항목이며 course 0개다. 이는 서로 다른 입력 범위의 수치다. main `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs:175-180,205-207`의 과정/flow·52화면 수집과 snapshot 같은 파일 191-221행 reader·목차·설명 읽기, 256-291행 26종 상태 수집을 모두 보존해야 한다.

장부 파일은 라인 단위 합집합이나 한쪽 덮어쓰기를 하지 말고 결합 수집기로 재생성하고 ID별 기존 상태·근거를 대조해야 한다. 개념에서 이미 남긴 검증 증거는 보존하되 새로운 통합 화면을 확인하지 않고 verified로 승격하지 않는다. main 자체의 기존 미검토·준비 중 상태는 이번 병합 결함으로 새로 세지 않는다.

### I5 — catalog view의 설명 읽기 링크와 reader를 함께 이식해야 한다

`/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-view.mjs:11-13`은 add/add 충돌이며 개념 쪽은 설명 순서·class와 `?read=1` CTA를 추가했다. reader의 기본 모드는 장면 존재 여부에 따라 달라지므로 view만 main으로 고르면 새 “설명 읽기” 진입을 보존하지 못한다. `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-catalog-controller.mjs`와 data 모듈은 main과 snapshot blob이 같아 유지하면 된다. reader는 독립 history key를 쓰고 다른 state를 spread하여 보존한다. 최종 후보에서 query·hash·장면/읽기 전환·검색 결과 복귀·뒤로 가기를 같이 검증해야 한다.

## Minor

### M1 — 공통 JPG·신규 개념 자산·과거 증거를 구분해 정리해야 한다

이미지 56경로 충돌은 모두 기능 구현 실패를 뜻하지 않는다. 예를 들어 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/home-new-visual.mjs:7-11`은 같은 다섯 장면을 main에서는 JPG, snapshot에서는 PNG로 연결한다. 공통 자산은 main의 정제 JPG와 최신 문구를 우선 보존하고 개념 신규 자산만 이식해야 한다. 자산 장부·parity의 기존 파일 출처와 해시를 함께 대조한다. 과거 검증 문서 5개는 당시 사실을 보존하고 새 통합 검증 증거를 별도로 남긴다.

## 직접 merge와 선별 이식의 차이

| 방안 | 실제 의미 | 이번 판정 |
|---|---|---|
| 원본 개념 branch를 main에 직접 merge | 원본 공통 snapshot과 모든 조상 이력을 합치며 431경로 충돌을 해소해야 한다. 현재 branch HEAD만 합치면 snapshot의 dirty 215파일도 빠질 수 있다. | 공개 제외 이력 규칙과 충돌하므로 그대로 진행 불가. |
| 오래된 정제 기반 `64b9a0a2…`에서 전체 개념 파일 복사 | 원본 부모 이력은 피할 수 있으나 후속 main의 과정 v2·PR #10과 충돌을 나중에 다시 풀어야 한다. | 최신 기능 누락 위험과 재작업을 늘린다. |
| 최신 main `a70f1bd5…` 기반 선별 이식 | main의 정제 이력·45일 과정·도구 전제 제거를 출발점으로 두고, 원본 공통 기반→개념 snapshot의 필요한 내용만 경로·hunk·자산별로 대응시켜 가져온다. | **권장.** 원본 조상 이력을 부모로 추가하지 않고 아래 순서와 합격 기준을 충족한 뒤 재검토. |

이 문서는 위 방안을 설명했으며 새 branch/worktree 생성, cherry-pick, patch 적용, squash, merge, commit, push, PR을 실행하지 않았다.

## 진행표에 넣을 필수 작업

| 순서 | 작업 | 현재 상태 | 합격 기준 |
|---|---|---|---|
| P1 | 고정 입력 manifest와 내용 이식 범위 확정 | 검수 완료; 구현 미착수 | HEAD 외 215 dirty 파일 포함 범위와 제외 AGENTS/RESUME 명시; 후속 harness 로그를 원본 snapshot 성과로 혼합하지 않음 |
| P2 | 최신 main 기반 정제 후보 계획 및 공개 제외 검사 | 필수 선행; 구현 미착수 | main a70f1bd5 기반; raw aed347fc 조상 유입 없음; 제외 캡처 tree·이력 검사 통과 |
| P3 | 공통 main 자산·PR #10 문구와 신규 개념 자산 선별 | 미착수 | main JPG/출처 보존, 신규 자산 경로 정상, Docker 런타임 문구 유지 |
| P4 | build.mjs와 package.json 구간별 결합 | 미착수 | main course 선행 생성기/45일 렌더링/설정 탭/주입 링크 검사 + 개념 번들/reader/D12 guard 동시 보존; script 88개 합집합 |
| P5 | 공통 navigation·홈·catalog·reader와 테스트 결합 | 미착수 | 6메뉴·과정 현재 표시, course-home 우선 진입/참고 도감, 기존 과제 진도와 과정 진도 독립, catalog 설명 읽기·검색 복귀·hash 동작 |
| P6 | 생성 HTML과 bundle 재생성 | 미착수 | 충돌 HTML 340개를 수동 선택하지 않고 결합 소스에서 재생성; 과정 D00~D45/Java/티켓 출력·링크 유지 |
| P7 | 장부·parity·자산 출처 조정 | 미착수 | course 52 화면 수집 유지 + 개념 26종 상태/reader 수집; 기존 ID별 근거 보존, 통합 검증 없는 verified 증가 없음 |
| P8 | 통합 후보에서 main 검사와 개념 검사 실행 | 미착수 | course data/validate/tests/course-pages/config-tabs/generated/navigation/home/image audits + 개념 검사 26종/reader/dark/catalog와 build·3 audit 통과 |
| P9 | 통합 UI 및 원문·안전 이력 최종 검수 | 미착수 | PC dark 홈/과정/개념 목록·reader 실제 UI, 원문/링크, 최종 tree/도달 이력 검사; 그 뒤 병합 판정 재검토 |

P8의 최소 명령 묶음은 통합 후보에서 `npm run build`, `npm run check:course-data`, `npm run validate:course`, `npm run test:course`, `npm run test:course-pages`, `npm run test:home`, `npm run test:navigation`, `npm run test:knowledge-catalog`, `npm run test:concept-reader`, `npm run test:concept-dark`, `npm run audit:images`, `npm run audit:visual`, `npm run audit:version-cards`, `npm run audit:parity`와 개념 26종 해당 테스트다. 실행 위치는 앞으로 만들 격리 통합 후보의 site 도구 디렉터리이며 후보 생성 후 해당 절대경로를 기록한다. 현재 원본 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site`에서 통합 검사를 실행했다는 뜻이 아니다. `check:generated`와 `check:html`은 후보 파일 추적 상태와 서버 조건을 맞춰 실행한다. 이는 앞으로의 합격 기준이며 이 검수에서 통합 실행한 결과가 아니다.

## 재현 근거와 검증 한계

직접 사용한 조회는 `git show <고정 ref>:<파일>`, `git diff <base> <main> -- <파일>`, `git log --oneline <base>..<main>`, `git ls-tree -r <고정 ref> -- <대상>`, `git merge-base --is-ancestor <커밋> <고정 ref>`다. stage 파싱과 비교는 기존 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/merge-readiness-2026-10-25/merge-tree.txt` 및 고정 객체에서 수행했다. navigation 함수의 읽기 전용 probe만 별도로 실행했으며 파일을 만들거나 앱을 띄우지 않았다.

실제 통합 후보를 checkout하거나 build·test·browser 검증하지 않았다. 따라서 현재 개념 branch의 검사 통과나 기존 main의 검사 통과를 양쪽 통합 성공으로 바꾸어 말하지 않는다. main 자체의 준비 중 표시·기존 미완료 과제나 교육 내용 완성도는 별도 문제다. 최종 승인에는 정제 후보의 실제 실행과 PC dark UI 검증이 필요하다. 새 모바일 QA 관문은 추가하지 않는다. main의 기존 모바일 코드 보존 여부는 정적 호환 범위에서 대조할 수 있다.
