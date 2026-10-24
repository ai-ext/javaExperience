# C22. 테스트 트랜잭션 함정 — flush·LAZY·commit·HTTP

판정: **최신 실험 충분·원문과 보강 정합성 문제** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

테스트 자동 rollback이 실제 운영 경계를 가리는 조건을 설명하고 실제 commit·HTTP서버 스레드·cleanup을 분리한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/V04-test-db-strategy.md:133](../../../../knowledge/V04-test-db-strategy.md) — 확인 범위 133–181행.

  발췌: `### 4단계 — ’@Transactional’ 함정을 재현  (미실행) 아래 Spring 코드는 개념을 가진 실제 도메인에 적용하는 패턴이다. starter에는 ’Order’ 관계·쓰기 API·커밋 리스너가 없어 그대로 실행할 수 없으며, 기존 ’Product’ 테스트와 혼동하지 않는다.`
- $WORKTREE_ROOT/concept-learning-night/tools/site/v04-lesson-data.mjs:445 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/v04-lesson-data.mjs:445`) — 확인 범위 445–447행.

  발췌: `{id:'lazy',question:'테스트 transaction이 lazy 실패를 숨겼을까?',source:'추가 H2 LearnOrder1/LearnLine101 · service REQUIRED',sourceNote:toyNote+' @BeforeAll seed는 TestTransaction 비활성 상태에서 별도 commit했습니다.',note:'테스트의 바깥 transaction 유무만 나눈 추가 도메인입니다. 실제 상품·주문 API·OSIV·DTO를 검증한 결과가 아닙니다.',stages:[  stage('lazy','outer','바깥 test transaction이면 size1','추가 service.getEntity(1) 반환 때 컬렉션은 미초기화였지만 바깥 테스트 transaction이 유지돼 getLines().size()가1입니다. Hibernate prepared는2문장이었습니다.','LearnOrder order = service.getEntity(1);\nb`
- $WORKTREE_ROOT/concept-learning-night/tools/site/v04-lesson-data.mjs:463 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/v04-lesson-data.mjs:463`) — 확인 범위 463–465행.

  발췌: `{id:'http',question:'추가 실제 TCP와 동기 MockMvc는 같은 transaction일까?',source:'추가 Boot4.1.1/JDBC/H2 toy app · 실제 Tomcat TCP / 동기 MockMvc',sourceNote:'이번에는 추가 Boot 앱·실제 TCP201을 실행했습니다. 원문 OrderHttpTest·학습자 상품 쓰기 API·MySQL HTTP·async MVC 실행 결과가 아닙니다.',note:'실제 source response/threadID/port 원자료는 따로 보존하고 frozen에는 관찰한 same/different·flag·행 수를 기록합니다.',stages:[  stage('http','tcp','실제 TCP201은 다른 thread','추가 테스트의 미커밋 marker100을 서버는0개로 읽었습니다. 실제 TCP POST는 다른 worker에서 status201·TestManagedTx=false·ApplicationTx=t`
- $WORKTREE_ROOT/concept-learning-night/docs/design/v04-2026-10-20/source-proof/probe/java/v04/http/HttpBoundaryTest.java:26 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/docs/design/v04-2026-10-20/source-proof/probe/java/v04/http/HttpBoundaryTest.java:26`) — 확인 범위 26–59행.

  발췌: `@SpringBootTest(classes=HttpApp.class,webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"server.address=127.0.0.1","spring.sql.init.mode=never","logging.level.root=ERROR"}) @AutoConfigureMockMvc @Transactional @TestInstance(TestInstance.Lifecycle.PER_CLASS) @DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS) class HttpBoundaryTest {`

최신 V04는 H2 toy로 LAZY 감춤, assigned ID flush 없이 DB CHECK 미실행, IDENTITY 조기실패, TestTransaction flag와 end, AFTER_COMMIT 독립행 관찰, REQUIRES_NEW 잔존, 실제TCP/동기MockMvc 차이를 모두 실행했다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

원문에는 Order 도메인이 없어 그대로 실행 못한다고 쓰고 최신 화면은 추가 toy로 실제 결과를 제공한다. 이 둘을 연결하는 재현 경로가 학습자에게 명확하지 않다. 현상 자체가 빠졌다는 평가는 틀리고, 학습자 테스트가 거짓양성인지 직접 판별하게 하는 과제가 남는다.

## 실습 수행 가능성과 보완 과제

같은 변경 API를 mockMVC+outer test transaction 및 실제TCP+별도 서버transaction으로 호출하고 test rollback 뒤 독립SELECT를 비교하게 한다. commit용 테스트 cleanup도 결과를 단언한다.

검증 기대값: V04 toy 실제TCP는 서버row201이 test rollback 뒤1, 동기MockMvc row211은0. 자동rollback의 no-flush0SQL을 DB제약통과로 오인하지 않아야 한다. 비동기MVC는 별도 범위다.

선수 관계: C11/C12/C15 → C23

## 검증 수준과 제한

기존실행근거: V04 22 JUnit/추가 Boot TCP 및 원시코드. 이번실행 없음. 원문 OrderHttpTest가 실행됐다고 말하지 않는다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-test-thread-bound` — [Transaction Management in TestContext Framework](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
