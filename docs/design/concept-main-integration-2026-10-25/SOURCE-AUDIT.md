# 기계적 원문·보존기준 감사

- 검사 ref: base `a70f1bd531c1b72077d56e7363ff424ba5795143`, source snapshot `af274f94e72ee2a344329c1e3bd3f1f70737c690` (source worktree HEAD `b93457b577d913f2a7dbe2635f88c1a0d6e4920a`), merge-base `b9e398223a55b682004bd62f6ad2ca312cd84823`.
- 입력 스냅샷은 고정 Git ref로 비교했다. 브라우저·외부 CLI·테스트·빌드는 실행하지 않았다.
- 기계 판독 상세·전체 해시 목록: `source-audit.json`.

## 판정 요약

- `docs/knowledge/*.md`: **135개 중 24개 차이, 111개 동일**. source snapshot의 기준은 main이 아니다. 후보에는 main 원문을 우선 보존해야 한다.
- ref 경계는 구분해야 한다. `b9e39822 → aed347fc`와 `aed347fc → af274f9` 모두 `docs/knowledge/*.md` 변경은 **0개**다. 반면 `aed347fc → af274f9`에는 개념 후속 작업이 있으며 135개 생성 HTML과 reader/dark 소스가 바뀐다. reader/dark 구현 커밋은 `90edde07`, `8c851029` 두 건이다. 원본 Markdown 수정 건수와는 별도다.
- 기존 source SHA 기준은 `preservation-baseline.json#/documents[*]/sha256` 24개, `concept-ia.../source-baseline.json#/pages[*]/sourceSHA256` 23개에서 main과 불일치한다. 보존 테스트 삭제나 기존 hash를 임의로 바꾸면 안 된다.
- 통합 HTML을 다시 생성한 뒤 sourceText/code/ID 기준을 새 integration baseline으로 산출해야 한다. 기존 증거 파일은 그대로 둔다.
- 26개 불일치는 고정 ref에서 확인되지 않았다. 정확한 source Markdown hash 차이는 24개이며 `taskSourceHash` 필드는 확인한 registry에 없다. 2개를 추정으로 추가하지 않았다.

## PR #10의 실제 원문 변경

mainline merge `a70f1bd5`의 Markdown 차이는 세 파일이다. 모두 도구/환경 가정 정리다. 해당 세 생성 HTML의 기존 ID 집합과 code block 수는 유지되며, P15의 경로 주석이 든 code block 문자열/hash만 바뀐다. reader UI DOM·interaction 계약에 직접 영향은 없다고 판단했다(추정). 원문 hash와 text 기준은 변한다.

| 파일 | main 쪽 변경 | 영향 |
|---|---|---|
| `docs/knowledge/D07-onprem-vs-cloud.md` | Docker Desktop에서 Docker runtime 중립으로 전제 변경 | 환경 가정 — UI 계약 직접 변화 없음(추정), 원문 baseline hash는 달라짐 |
| `docs/knowledge/P15-intellij-practical.md` | code block 주석의 LOCAL_HOME 개인 경로를 $USER_HOME 변수 예시로 변경 | 문서 안전·이식성. 기존 ID 29개와 code block 15개 수는 같고 문자열 1개 변경 |
| `docs/knowledge/R08-app-to-db-connection.md` | 192.168.65.1 설명의 Colima 등 예시를 제거, runtime/environment 변동은 유지 | 환경 설명 — UI 계약 직접 변화 없음(추정), 원문 baseline hash는 달라짐 |

## 24개 Markdown 차이

| 파일 | main → sourceSnapshot SHA-256 | 의미·계약 검토 |
|---|---|---|
| `docs/knowledge/B01-account-lifecycle.md` | `d943f8d70251` → `1c77c1d160fc` | 환경/적용경계: 외부 쇼핑몰 DB 전제 제거 및 저장소 DB 설명으로 전환(학습 재현조건 변화). |
| `docs/knowledge/D07-onprem-vs-cloud.md` | `9bbf63985fd6` → `0945450013d2` | 환경: Docker Desktop 가정과 Docker runtime 중립 전제가 서로 다름. |
| `docs/knowledge/D15-server-sizing.md` | `03566e20e03b` → `c6291e448122` | 환경: Desktop host.docker.internal 전제와 Docker/Linux 안내 차이. |
| `docs/knowledge/P15-intellij-practical.md` | `1934dcd71470` → `ad7e96740156` | 개인 경로 예시: 사용자 홈 절대경로와 변수화 경로 차이. |
| `docs/knowledge/P27-annotations-when-how.md` | `9e8d005e3bbd` → `58aed5ddac32` | 환경/검증사실: starter 프로젝트 부재 주장과 실제 존재, 실행 테스트 기록이 상이. |
| `docs/knowledge/P28-default-beans.md` | `1a2954a11f5b` → `b11eabe4017b` | 환경/구성: 외부 starter 경로·저장소 부재 주장과 실제 workspace 프로젝트 안내가 상이. |
| `docs/knowledge/R01-what-is-db-server.md` | `6347c0763df0` → `a98a91fe40e1` | 기술/실습사실: 테이블 열 이름, DB 이름, schema/seed 경로·파괴성·실행 여부가 상이. |
| `docs/knowledge/R02-rdb-vs-nosql.md` | `ba6c6a42b1d3` → `7f4fa04984a6` | 환경: ds_practice 외부 DB 예시 전제 제거. |
| `docs/knowledge/R03-schema-types-constraints.md` | `2ce709a98f85` → `4e23b082e208` | 환경: 저장소 외부 DB/schema 전제 및 주의 안내 변경. |
| `docs/knowledge/R04-sql-crud-join.md` | `991732cdc314` → `78af924291e7` | 환경/실습 전제: 외부 DB 접속·계정·스키마 안내 변경. |
| `docs/knowledge/R05-index-btree.md` | `462d8205bbb6` → `2c693e3d1312` | 환경: 외부 ds_practice 실습 DB 설명 제거. |
| `docs/knowledge/R06-db-client-tools.md` | `212fef44f314` → `71526557b37d` | 환경/도구 계약: 대상 compose, 실제 노출 포트(13306/13307/13308), DB 접속 및 도구 설정 설명 변경. |
| `docs/knowledge/R07-backup-restore.md` | `dd4ac9dfa666` → `81373b08db28` | 환경/안전계약: schema/seed 위치 및 DROP DATABASE 경고 적용 경로 변경. |
| `docs/knowledge/R08-app-to-db-connection.md` | `e43df252c82f` → `e3c2f069cd43` | 환경/측정 조건: 예제 프로젝트 유무, compose 및 연결확인 경로 변경. |
| `docs/knowledge/README.md` | `0f4893133df4` → `cca06c75f20a` | 환경/탐색: DB 세트와 공개 포트/계정 설명 변경. |
| `docs/knowledge/S09-jpa-hibernate.md` | `319d3c667ef5` → `23e3a001a2af` | 기술 표현: flush/commit 시점 설명 축약; 트랜잭션 경계 계약 검토 필요. |
| `docs/knowledge/V01-what-and-how-to-test.md` | `12d292d32f72` → `a03fdd8ce086` | 환경: starter 프로젝트 부재 및 프로젝트 실행 경로 설명 제거. |
| `docs/knowledge/V02-layered-tests-handson.md` | `81bdae218584` → `41e6cc507fbc` | 검증 사실/환경: 기존 테스트 실행 기록 범위와 starter 프로젝트 부재 설명 변경. |
| `docs/knowledge/V03-mocking-in-practice.md` | `ead246c1e58a` → `fee49db918c6` | 환경: starter 프로젝트 부재 설명 제거. |
| `docs/knowledge/V04-test-db-strategy.md` | `c4deeef605ea` → `1fe115e967ba` | 기술/환경: Boot 관리 의존성 버전·실제 프로젝트·Testcontainers 설명 변경. |
| `docs/knowledge/V05-testing-tricky-things.md` | `4288b4f42adf` → `a3f5b0fad8ee` | 환경: starter 프로젝트 부재 설명 제거. |
| `docs/knowledge/V06-testing-at-work.md` | `9cd9bbd30d63` → `e1b7dc3ee7f7` | 환경: starter 경로와 현재 저장소 경계 설명 변경. |
| `docs/knowledge/W05-jpa-vs-mybatis-strategy.md` | `d7ef63b047a7` → `a52e675e43f7` | 기술 표현: AUTO flush 문구의 commit-only와 stale query flush 차이; 기술 검토 필요. |
| `docs/knowledge/W25-spring-multithreading.md` | `bbfae11d571e` → `817cc1dead9c` | 검증 사실/환경: 실행이 있었던 workspace와 설명의 관찰 범위가 달라짐. |

전체 SHA-256과 diff 변경 줄 수는 JSON의 `changedMarkdown`에 있다. 해시가 다른 이유를 자동으로 UI 결함으로 분류하지 않았다. 일부는 환경/프로젝트 존재성 사실 변경이며, `R01`, `R06`, `V04`, `S09`, `W05` 등은 실제 실습·기술 계약까지 대조해야 한다.

## 보존 검사 기준과 재대응

| 기준 | 검사 계약 | main 원문을 쓸 때 처리 |
|---|---|---|
| `tools/site/test-p09-preservation.mjs` (source snapshot, 10–15행) | preservation baseline 135개 원문 SHA, 학습자 서버 코드 17개 SHA. `p09-2026-10-20/html-baseline.json`의 ID/code/blocks/wholeSourceText도 별도 고정. | 24개 원문 SHA 불일치가 예상된다. 원문 보존 검사 자체는 유지하고, 승인된 새 통합 기준을 별도 등록한다. 학습자 서버 코드는 그대로여야 한다.
| `tools/site/test-knowledge-dark.mjs` (source snapshot, 9–46행) | 136 페이지 다크 표식·body class·마지막 stylesheet, reader root/selector, source text·code·ID·Markdown SHA. | 23개 개념 source 문서 SHA mismatch. 렌더 HTML text/code/IDs는 최종 build 후 재산출. CSS/DOM 계약 검사는 유지한다.
| `tools/site/test-knowledge-reader.mjs` (source snapshot, 10–36행) | 134개 source 문서의 텍스트·code·Markdown SHA·existing IDs, reader/단일 main/목차 ID 계약. 28개 Q&A의 별도 수량 조건. | 23개 source hash mismatch. Source UI 동작·접근성 계약은 보존하고 원문 기준만 새 integration source tree로 연결한다.
| `tools/site/test-knowledge-generated.mjs` (main, 26–30행) | 지식 목록의 README/P16 기존 앵커·중복 ID | README는 별도 원문 변경, P16 Markdown은 동일. regenerated HTML의 기존 앵커 존재를 확인한다.
| `docs/design/concept-learning-night-2026-10-20/baseline.json#/files` | 공통 원본 3,403 tracked path의 역사 SHA-256 | `aed347fc` source snapshot과 비교하면 3,234 동일·169 변경·0 누락. 최신 main에서는 2,314 동일·567 변경·522 누락. 이 수는 기존 baseline을 현행으로 고칠 이유가 아니다. historical registry를 보존하고 현행 main과 통합 tree용 manifest를 분리한다.

`preservation-baseline.json`의 24개 `/documents/{i}/sha256` 및 `concept-ia.../source-baseline.json`의 23개 `/pages/{i}/sourceSHA256`의 정확한 old/new 값은 JSON의 `preservationBaselineRebindCandidates`, `conceptIaBaselineRebindCandidates`에 있다.

HTML text/code/ID의 새 값은 아직 만들지 않았다. 최종 생성 HTML에 의존하므로 실행하지 않은 빌드 결과를 꾸며 넣지 않고 `newValueForHTMLKeys: null`로 남겼다. 24개 중 8개 Markdown은 fenced code text가 바뀌고, R06은 code block 8→6개, R08은 12→11개다. 따라서 해당 source page의 `sourceCode` hash array도 재산출 대상이다. heading 집합이 달라지는 B01/P15/R04/R08은 `existingIds`도 생성 결과와 비교한다. 정확한 경로와 fenced code ordinal은 JSON `readerContractImpactAssessment`에 기록했다.

## 역사 증거

복사 대상인 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-integration/docs/design/` 아래 source-proof 27개 디렉터리(1,374개 파일)와 `concept-cycle-2026-10-22/tasks/task1`부터 `task24`까지의 리뷰 JSON/Markdown(48개 파일)은 source snapshot의 바이트를 유지한다. 파일별 SHA-256·크기는 JSON `historicalProof.byteManifest`에 기록했다. 이 자료는 과거 작업 상태를 입증한다. baseline 재대응은 별도 통합 소스 트리의 검사 기준을 추가하는 일이며, 옛 source-proof·리뷰·실패 로그의 내용이나 hash를 수정하는 일이 아니다.

## 실행·제한

- 완료: 고정 ref의 Git tree/hash/diff/test 소스 읽기와 JSON/Markdown 감사 산출.
- 미실행: build, 테스트, 브라우저, 외부 CLI. 따라서 merged generated HTML의 새 text/code/ID hash는 확인 전이다.
- 실제 파일 변경은 이번 감사의 `source-audit.json` 및 `SOURCE-AUDIT.md` 두 개뿐이다.
