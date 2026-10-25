# task13 · V04 독립 감사

판정: **needs_completion**. 원문264줄을 44개 주요 의미 단위로 대조했다. covered 14, partial 18, missing 5, unrun 7. 전체 문서 완료는 false다.

기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 원문 SHA256: `1fe115e967ba5602aeb8547c93e8a29eed1838549893a8598f90e1b905773cda`. 검토자 gpt-6.1-sol/high. 출력 경로: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task13.

새 검사 `npm --prefix tools/site run test:v04`: exit 0. UTC 2026-10-21T23:59:23.231836+00:00 ~ 2026-10-21T23:59:35.584955+00:00. 원시 출력·종료값·HEAD·관련 소스 SHA는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task13/runs/sol-20261021T235923.215202Z에 보존했다. 이는 Node/jsdom·현재 HTML·frozen 근거 대조이며 Java/DB/HTTP 재실행 성공이 아니다.

## Spec 검토

원문 전문·9fence·기존 목차가 HTML에 보존된다. 추가10질문·27장면은 mock unit, NON_TEST 교체4조건, fixture INFERRED/ISOLATED, H2/MySQL collation 반례, proxy/lazy, 지연 flush/IDENTITY, rollback/AFTER_COMMIT, 독립 observer, REQUIRES_NEW, 실제 추가TCP/동기MockMvc를 구분한다. 원문 TC class는 컴파일만, 원본 unit2는 mock/new, native adapter는 원문 assertion body2개만 재사용했다고 표시돼 있다.

전체 의미 단위의 상세 대응은 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task13/source-coverage.json에 기록했다. 기존 개념 지도는 목차이므로 독립 개념 장면으로 세지 않았다. 설정·목적별 선택·오류 해결·DTO/fetch 수정·container 수명/비용의 범위는 아직 충족되지 않았다. 미실행 원문을 추가 toy로 대체하지 않는다.

| 원문 줄 | 의미 단위 | 장면 | 판정 |
|---|---|---|---|
| 1–6 | 제목·3줄요약 | unit-dto, replace-static, lazy-outer, events-end, http-tcp | partial |
| 7–14 | 테스트 목적별 엔진 선택 | unit-dto, fixtures-adapter, dialect-compare | partial |
| 15–15 | Service mock/fake와 Repository 통합의 역할 | unit-dto, unit-page, fixtures-adapter | covered |
| 16–24 | mock/H2/TC/공유DB 비교표 | unit-dto, dialect-compare, containers-compile | partial |
| 25–25 | MySQL 스키마·collation/함수/upsert/잠금 | dialect-compare, dialect-unique, flush-explicit | partial |
| 26–26 | DataJpaTest 교체·rollback·Boot4 imports | replace-static, replace-dynamic, replace-none, replace-any | covered |
| 27–27 | ServiceConnection·Boot/BOM 의존성 | containers-compile | partial |
| 28–28 | 작은 fixture·factory·고정 seed 선택 | fixtures-adapter, fixtures-source | partial |
| 29–29 | context SQL init vs 메서드 Sql·cleanup | fixtures-inferred, fixtures-isolated | partial |
| 30–30 | 지연 SQL·flush·IDENTITY 조기 INSERT | flush-none, flush-explicit, flush-identity | covered |
| 31–31 | 테스트 TX lazy/rollback/HTTP 경계 | lazy-outer, lazy-closed, events-rollback, http-tcp, http-mockmvc | covered |
| 32–35 | static Container/Bean/reusable 수명 | containers-lifetime | unrun |
| 36–56 | 의존성·Java25/21·Maven·Gradle 확인 명령 | containers-compile | unrun |
| 57–101 | 완전한 원문 Repository MySQL TC 클래스 | fixtures-adapter, containers-compile | unrun |
| 102–109 | SQL 파일 실행 위치·전용 컨테이너·test 명령 | containers-compile, fixtures-adapter | unrun |
| 110–120 | FK 부모→자식 원문 fixture SQL | fixtures-source, fixtures-inferred, fixtures-isolated | covered |
| 121–132 | Sql 메서드·classpath·반복/rollback·cleanup | fixtures-inferred, fixtures-isolated | partial |
| 133–136 | 미완성 Order 패턴의 적용 범위 | lazy-outer, http-tcp, containers-compile | covered |
| 137–149 | lazy 성공을 숨기는 test transaction·예외 재현 | lazy-outer, lazy-closed | covered |
| 137–137 | DTO/fetch join/EntityGraph로 lazy 설계 수정 | lazy-outer, lazy-closed | missing |
| 150–152 | AFTER_COMMIT·flag/end·cleanup·fake 전송 | events-rollback, events-flag, events-end, events-cleanup | partial |
| 153–160 | 원문 OrderListener 부분 코드 | events-end | unrun |
| 161–162 | Product 제약 예외 시점·save/flush assertion | flush-none, flush-explicit, flush-identity | partial |
| 163–164 | RANDOM_PORT 서버/테스트 별도 TX 원리 | http-tcp, http-rollback, http-mockmvc | covered |
| 165–180 | 원문 OrderHttpTest·쓰기 API·MockMvc 권고 | http-tcp, http-mockmvc | unrun |
| 181–184 | 예외·listener·행을 직접 assertion | flush-explicit, events-end, http-rollback | covered |
| 185–195 | 치트시트 DataJpaTest/SC/Container/Sql/flush/end/H2 | replace-none, fixtures-inferred, flush-explicit, events-end, containers-lifetime, dialect-compare | partial |
| 196–198 | 오류1: H2로 연결됨 | replace-static, replace-dynamic, replace-none, replace-any | partial |
| 199–199 | 오류2: Boot3/4 import·WebMvc 패키지 | 없음 | missing |
| 200–200 | 오류3: Docker 환경/timeout/디스크 | containers-compile | missing |
| 201–201 | 오류4: Table/schema validation·경로/init | 없음 | missing |
| 202–202 | 오류5: Duplicate entry·cleanup | fixtures-inferred, fixtures-isolated, events-cleanup, http-rollback | partial |
| 203–204 | 오류6: H2 통과/MySQL 실패 | dialect-compare, dialect-unique | covered |
| 205–208 | 스레드 바인딩·REQUIRED/REQUIRES_NEW/async·캐시 | lazy-outer, requiresnew-survives, http-tcp, http-mockmvc | partial |
| 209–210 | 비용 측정·컨테이너/seed/context 수명 조정 | containers-lifetime | unrun |
| 211–212 | Boot3.1/4.0 API 변화·모듈 역사 | 없음 | missing |
| 213–216 | S09/S08/V02 연결 | 없음 | covered |
| 217–222 | Q1: DataJpaTest H2·MySQL·URL 확인 | replace-static, replace-dynamic, replace-none, containers-compile | partial |
| 223–228 | Q2: H2 compatibility vs actual engine·테스트 목적 | unit-dto, fixtures-adapter, dialect-compare, dialect-unique | covered |
| 229–234 | Q3: rollback 밖 cleanup·HTTP/REQUIRES_NEW | events-cleanup, requiresnew-survives, http-rollback, http-mockmvc | covered |
| 235–240 | Q4: save 통과/flush/IDENTITY·flush≠commit | flush-none, flush-explicit, flush-identity, events-end | covered |
| 241–246 | Q5: lazy 운영 실패·DTO/API 범위 수정 | lazy-outer, lazy-closed | partial |
| 247–252 | Q6: AFTER_COMMIT 분리·외부 전달 보장 | events-rollback, events-flag, events-end, events-cleanup | partial |
| 253–264 | 참고문헌10개 | 없음 | partial |

## Quality 진단

Spec 미통과이므로 quality 승인을 부여하지 않았다. 진단 범위에서 확정 critical/important는 0건이며 minor 1건이다.

- **V04-Q01 · minor** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/source-proof/source.json:118. runtimeScope가 preparing/native adapter proposed로 남아 L61 최종 status·execution 기록과 모순된다. 이 JSON은 보충 근거에 그대로 노출된다. 최종 실제 추가 실행 범위와 미실행 경계를 일치시키고 HTML 재생성·test:v04로 확인한다. 기존 증거는 수정하지 않았다.

mock unit의 SQL/proxy 미검증, MySQL adapter·H2 toy의 환경 분리, Product save와 추가 persist의 구분, Hibernate prepared와 observer JDBC 제외, flagForCommit/end와 rollback/commit, 독립 connection RowListener와 외부 전송의 차이는 코드·frozen·화면 값이 대응한다. REQUIRES_NEW73 cleanup 최종0 미측정 및 실제 TCP/동기 MockMvc의 한정 범위도 숨기지 않는다.

## 직접 본 이미지와 실행 한계

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/images/V04-lazy-v3.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/images/V04-flush-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/images/V04-http-v3.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/captures/desktop-lazy.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/captures/desktop-http.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/captures/mobile-flush.jpg

시안3/10·과거캡처3/20만 직접 열람했다. 현재 브라우저 조작·전수 픽셀·학습자 이해도는 검증하지 않았다. mobile flush의 번역 확장 overlay는 일부 안내를 가리지만 제품 원인으로 단정할 증거는 없다. 현재 브라우저 검증은 메인 담당이다.

기존 replay/Java 로그, frozen JSON, independent-review, raw TCP/MockMvc 응답을 정적으로 대조했다. 과거 실행은 native9/Java28 고유 ASSERT37개, JUnit22/11classes, facts32이며 겹치는 검증 단위다. 원문 TC/SC/Docker·수명·원문 OrderHttpTest·학습자 상품API·Java25·MySQL HTTP·async는 미실행이다. 이번 reviewer는 nativeDB/Java/브라우저/웹/외부CLI/agentLLM를 실행하지 않았다.

## 남은 작업 묶음

- 선택·환경·초기화 학습 범위: mock/H2/MySQL/공유DB 선택, fixture factory vs seed, context init vs per-test @Sql, Boot4 imports/Gradle/Maven/Java21·25 설정을 원문 의미 단위에 맞춰 보강한다.
- 오류 진단 범위: H2 오연결·Boot import·Docker/디스크·SQL 경로/schema-validation·반복 PK 오류의 관찰→원인→수정 흐름을 추가한다. 현재 추가 probe의 실패와 실제 학습자 앱 실패를 구분한다.
- 미실행 원문·수명: 원문 TC class/ServiceConnection/container lifetime/reuse·비용은 미실행으로 유지한다. 실행이 승인될 때만 별도 격리환경에서 검증하며 Java25·실제 Order/상품 API를 추가 toy 결과로 대신하지 않는다.
- 설계 수정·비동기/외부 전달: lazy 실패를 DTO/fetch 범위로 고치는 전후 사례, async 경계, 외부 notifier fake 검증을 필요 범위로 보강한다. outbox/재시도는 실행하지 않았다면 문헌·미실행으로 표시한다.
- 상태 메타데이터·현재 브라우저: V04-Q01 메타데이터 일관성 보정. 메인은 별도 preview의 desktop/mobile 현재 조작·JPG/viewport를 최종 확인한다.

원문·application·기존 증거·공유 장부·Git·다른 task 파일을 수정하지 않았다. 선택적 bs4 기반 HTML 읽기는 패키지 부재로 실패해 기존 jsdom으로 대체했으며 필수 검사에는 영향이 없다. clipboard pending/navigation race는 task9에 이미 재현돼 본 감사에서 중복하지 않았다.

요약 1: 원문264줄/44의미단위·27장면 대응을 기록했으며 전체 완료는 false다.
요약 2: covered 14 / partial 18 / missing 5 / unrun 7.
요약 3: fresh test:v04 exit0; Java/DB/HTTP는 과거 증거만 정적 대조했다.
요약 4: 확정 critical/important 0, minor1(runtimeScope 준비상태 잔존); quality는 진단만 수행했다.
요약 5: 선택·환경/오류·설계수정·container수명/실행·현재브라우저가 남았고 최종 needs_completion이다.
