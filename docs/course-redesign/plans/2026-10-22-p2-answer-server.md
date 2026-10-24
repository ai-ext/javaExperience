# P2. 1단계 정답 서버 (D1~D10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `course/roadmap.json`의 D01~D10을 순서(step)대로 구현한 정답 서버를 만든다. 순서마다 커밋을 하나씩 남기고, 각 날의 끝에서 전체 테스트가 통과하게 한다.

**Architecture:**
- 정답 서버는 저장소 안의 독립 Gradle 프로젝트 `board-server/`에 둔다. 루트의 기존 `src/`는 건드리지 않는다.
- roadmap의 `files` 경로는 `board-server/` 기준 상대 경로다.
- 커밋은 순서 하나에 하나(`answer(D05-2): …`)이고, 날마다 로컬 태그 `answer-d05`를 단다. P5는 이 커밋에서 "이 순서의 정답 코드"를 뽑는다.
- 각 순서의 `done` 항목은 자동 테스트로 고정한다. 자동화할 수 없는 항목은 `board-server/VERIFY.md`에 실제로 실행한 명령과 출력을 기록한다.

**Tech Stack:**
- Java 21, Spring Boot 4.1.1(`spring-boot-starter-webmvc`), Spring Security, JPA(Hibernate 7), MyBatis(`mybatis-spring-boot-starter:4.1.0`)
- MySQL 8.4, Redis(Spring Data Redis·Lettuce), jjwt 0.13.0, Apache POI(엑셀)
- 테스트: Testcontainers(MySQL·Redis·WireMock·Toxiproxy 컨테이너), JUnit 5, MockMvc
- 빌드: Gradle 9.8 wrapper

**Spec:**
- `course/spec-v2.md`, `course/roadmap.json`, `course/talk-cards.md` (브랜치 `course/p1-spec-roadmap`)
- 설계 `~/research/java-onboarding/14-redesign-design.md`
- P1 판단 기록 `~/research/java-onboarding/plans/2026-10-22-p1-ledger.md`

## Global Constraints

- 작업 위치는 worktree `~/code/javaExperience/.worktrees/p1-spec-roadmap`, 브랜치 `course/p1-spec-roadmap`다(P1 위에 이어 쌓는다). push 금지. 태그는 로컬에만 단다.
- 호스트 JDK 21에서 `./gradlew`를 실행한다. JDK가 없으면 선택적으로 `tools/course/gradle-docker.sh <프로젝트 디렉터리> <gradle 인자…>`로 실행한다(Task 1이 만든다). 이 스크립트는 `eclipse-temurin:21-jdk` 컨테이너, `--network host`, Docker 데몬의 표준 소켓 `/var/run/docker.sock` 마운트, 캐시 볼륨 `jx-gradle:/root/.gradle`을 쓴다. 프로젝트 경로의 파일 공유와 host networking 지원이 필요하며, Docker Desktop은 host networking을 켜야 한다. Ryuk은 기본 동작을 유지한다.
- 패키지 루트는 `com.example.board`이고 도메인형으로 나눈다(`member`, `post`, `comment`, `point`, `coupon`, `shop`, `payment`, `admin`, `common`, `config`). 파일 경로는 roadmap `files`를 그대로 따른다. 단계 제목에만 나오는 보조 파일(enum, DTO record, 저장소 인터페이스, 기존 파일의 작은 수정)도 그 순서 커밋에 함께 넣는다.
- 엔드포인트 문자열, 상태 코드, ProblemDetail `type`, 필드 규칙, 운영 값은 `spec-v2.md`가 기준이다. 정답이 명세와 다르면 명세를 따른다.
- 엔티티 규칙은 다음과 같다(설계 5-2 D4).
  - `@NoArgsConstructor(access = PROTECTED)`, 정적 팩토리 메서드
  - `@Setter`·`@AllArgsConstructor`·`@Data` 금지
  - `@Enumerated(STRING)`, 연관관계는 LAZY
- 생성자 주입만 쓴다(필드 주입 금지). 서비스는 `PostService` + `PostServiceImpl`처럼 roadmap에 인터페이스·구현 쌍이 있는 곳만 그렇게 만든다.
- 스키마는 `src/main/resources/schema.sql` 하나로 만든다. Flyway는 쓰지 않는다. `spring.sql.init.mode=always`, `spring.jpa.hibernate.ddl-auto=validate`.
- 비밀값(JWT 서명키 `BOARD_JWT_SECRET`, PG 서명키 `BOARD_PG_SECRET`, DB 비밀번호)은 환경 변수로만 주입한다. yml에는 `${…}` 자리표시자만 둔다.
- 코드 주석은 한글로 쓴다. 이유와 제약만 짧게 적는다.
- 문서·코드에 `Docker Desktop`, `studymate`를 쓰지 않는다.

**고정 값** (명세에 없어서 여기서 정한다. 모든 Task가 같은 값을 쓴다)

| 항목 | 값 |
|---|---|
| JWT 만료 | 3600초, 서명 HS256 |
| 활동 포인트 | 글 작성 +10, 댓글 작성 +2(`point_ledger.type` `EARN`) |
| 활동 랭킹 점수 | 글 10, 댓글 2 (Redis Sorted Set 키 `ranking:activity`) |
| 로컬 시드(`src/main/resources/data-local.sql`, local 프로파일만) | ADMIN 계정 `admin@board.local`, 쿠폰 id 1(총 10장, 30일 유효), 상점 아이템 3개 |
| PG 재시도 | 연결 실패와 5xx만 재시도. 최대 3회(첫 시도 포함), 백오프 200ms·400ms + 지터 0~100ms. 같은 `Idempotency-Key`를 쓴다. 응답 타임아웃은 재시도하지 않고 `UNKNOWN`으로 둔다 |
| 인기글 | 좋아요 수 내림차순 상위 20개, 캐시 키 `popular:posts`, TTL 60s |
| 쿠폰 잔여 수량 키 | `coupon:{couponId}:stock` |
| 로그인 제한 키 | `login:fail:{email}`, 10분 5회 |

## Review Focus

1. **인증 없는 경로의 기본값**: 공개 범위 표에 없는 새 경로가 생겼을 때 기본은 인증이 필요해야 한다(deny-by-default). 401 응답을 확인하는 테스트로 고정한다. 담당 Task 3: `SecurityRulesTest.미등록_경로는_401`.
2. **같은 멱등 키의 동시 요청**: `POST /api/shop/orders`에 같은 `Idempotency-Key`로 두 요청이 동시에 와도 주문과 차감은 한 번만 일어나야 한다. 담당 Task 7: `OrderIdempotencyConcurrencyTest`.
3. **콜백이 먼저 오는 경우**: 승인 응답보다 콜백이 먼저 도착해도 적립은 한 번이어야 하고, 최종 상태는 `DONE`이어야 한다. 담당 Task 8: `PgCallbackOrderingTest`.
4. **Redis가 없는 상태로 기동**: Redis 연결 실패가 애플리케이션 기동 실패로 번지면 안 된다. 캐시만 비활성처럼 동작해야 한다. 담당 Task 9: `PopularPostFallbackTest`에 "Redis 컨테이너 중지 상태에서 컨텍스트 기동" 케이스.
5. **엑셀 비정상 입력**: 숫자가 아닌 `memberId`, 빈 행, 1,001행, `.xls`가 들어오는 경우를 다룬다. 1,001행은 400, 나머지는 `skipped[]`에 사유와 함께 담는다. 담당 Task 10: `ExcelMemberIdReaderTest`.

---

## 날마다 공통 진행 규칙 (Task 1~10 모두 적용)

각 Task는 하루치다. 구현자는 `course/roadmap.json`에서 해당 `days[n]`을 읽고, `steps`를 `no` 순서대로 처리한다. 순서 하나마다 다음을 한다.
1. 그 순서의 `done` 항목마다 실패하는 테스트를 쓴다. 테스트 위치는 순서의 `files` 중 테스트 파일이 있으면 거기, 없으면 해당 도메인의 `…IntegrationTest`다.
2. `tools/course/gradle-docker.sh board-server test --tests <클래스>`로 실패를 확인한다.
3. `files`와 제목에 적힌 파일을 구현한다.
4. 같은 명령으로 통과를 확인한다.
5. 커밋한다: `git add board-server && git commit -m "answer(Dnn-m): <단계 제목 앞부분>"`

자동 테스트로 만들기 어려운 `done` 항목(브라우저 CORS, EXPLAIN 전후 비교, 컨테이너를 실제로 멈추는 확인)은 `board-server/VERIFY.md`의 `## Dnn-m` 절에 적는다. 실행한 명령과 실제 출력 발췌를 남긴다.

하루가 끝나면 `tools/course/gradle-docker.sh board-server test` 전체를 통과시킨 뒤 `git tag answer-dnn`을 단다.

`trap`(겪을 것)은 정답 코드가 그 함정을 피한 상태여야 한다. 또 함정을 다시 넣으면 실패하는 테스트가 최소 1개 있어야 한다. 예: D04의 `@AllArgsConstructor` 금지는 ArchUnit 대신 리플렉션 테스트로 엔티티의 public 생성자가 0개인지 확인한다.

---

### Task 1: D01 프로젝트 뼈대 + Gradle 실행 도구

**Files:** roadmap D01 steps 1~4의 `files`와 `tools/course/gradle-docker.sh`, `board-server/VERIFY.md`, `board-server/gradlew`·`gradle/wrapper/*`, `board-server/settings.gradle`

**Interfaces:**
- Produces:
  - `tools/course/gradle-docker.sh DIR ARGS…`: 종료 코드는 gradle의 것을 그대로 돌려준다.
  - `com.example.board.BoardApplication`
  - 요청 ID 헤더 `X-Request-Id`(없으면 UUID 생성), MDC 키 `requestId`
  - 프로파일 `local`·`test`·`prod`

- [ ] **Step 1**: `tools/course/gradle-docker.sh` 작성. 프로젝트 디렉터리는 Docker 런타임이 공유할 수 있는 경로를 사용한다. `$HOME` 내부로 제한하지 않는다. 확인: `tools/course/gradle-docker.sh board-server --version` → `Gradle 9.8`
- [ ] **Step 2**: D01-1. start.spring.io로 받은 구성과 같게 만든다. 의존성은 webmvc, actuator, validation, lombok뿐이고 JPA는 Step 3에서 넣는다. 테스트 `BoardApplicationTests.contextLoads`, `HealthEndpointTest.health_UP`(`GET /actuator/health` → 200 `{"status":"UP"}`)
- [ ] **Step 3**: D01-2. JPA, MySQL, `compose.yaml`(mysql:8.4, 포트 `13310:3306`), `schema.sql`(빈 파일 허용). Testcontainers MySQL로 `contextLoads`가 통과한다.
- [ ] **Step 4**: D01-3. `HealthEndpointTest.env_비노출`(`GET /actuator/env` → 404). prod yml에 비밀값 자리표시자만 있는지 확인하는 `ProfileConfigTest`
- [ ] **Step 5**: D01-4. `RequestIdFilterTest`: 요청에 헤더가 없으면 응답에 UUID 형식 `X-Request-Id`가 붙고, 있으면 같은 값이 돌아온다. logback 패턴에 `%X{requestId}`가 들어 있다.
- [ ] **Step 6**: 전체 테스트를 통과시키고 태그 `answer-d01`

### Task 2: D02 공통 기반

**Interfaces:**
- Produces:
  - `ErrorCode`(enum: `VALIDATION`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `DUPLICATE`, `TOO_MANY_ATTEMPTS`, `COUPON_EXHAUSTED`, `COUPON_UNUSABLE`, `INSUFFICIENT_POINTS`, `IDEMPOTENCY_MISMATCH`, `PG_TIMEOUT`, `PG_DECLINED`, `INVALID_SIGNATURE`). 각 값은 HTTP 상태와 `type` URI(`/errors/…`, spec-v2 §5)를 가진다.
  - `BusinessException(ErrorCode, String detail)`
  - `BaseEntity`(`createdAt`, `updatedAt`)
  - `BoardProperties`(`board.*` 바인딩)
  - `ForbiddenWordChecker.contains(String): boolean`
  - `NicknameNormalizer.normalize(String): String` (static)
  - `CommonCodeRegistry.name(String group, String code): Optional<String>`
  - 테스트 기반 `TestcontainersConfig`(`@ServiceConnection` MySQL 8.4). 이후 모든 통합 테스트가 이것을 import한다.

- [ ] D02 steps 1~5를 공통 진행 규칙대로 처리한다. 반드시 포함할 테스트:
  - `GlobalExceptionHandlerTest`: `GET /api/unknown` → 404, `application/problem+json`, `instance=/api/unknown`. 검증 실패 시 `errors[]`에 `{field, reason}`이 담긴다.
  - `ForbiddenWordLoaderTest`: 기동 후 `banned_word`에 넣은 단어를 감지한다. 적재가 `@PostConstruct`가 아니라 `ApplicationReadyEvent` 시점에 일어난다(리스너 메서드 어노테이션을 확인).
  - `NicknameNormalizerTest`: 앞뒤 공백 제거, 연속 공백을 하나로 줄이기.
- [ ] 태그 `answer-d02`

### Task 3: D03 회원·인증

**Interfaces:**
- Produces:
  - `SecurityConfig.filterChain(HttpSecurity): SecurityFilterChain`. spec-v2 §3 공개 범위 표를 따르고 나머지는 `authenticated()`다.
  - `JwtProvider.issue(Long memberId, Role role): String`, `parse(String token): AuthMember`
  - `AuthMember`(record: `id`, `role`). 컨트롤러는 `@AuthenticationPrincipal AuthMember`로 받는다.
  - `Role`(enum `USER`, `ADMIN`)
  - `AuthService.signup(SignupRequest): Long`, `login(LoginRequest): TokenResponse`

- [ ] D03 steps 1~6. 반드시 포함할 테스트:
  - `SecurityRulesTest`: 아래 다섯 가지를 확인한다.
    - 토큰 없이 `GET /api/members/me` → 401 `/errors/unauthorized`
    - USER 토큰으로 `GET /api/admin/reports` → 403 `/errors/forbidden`
    - `GET /actuator/env` → 401
    - **미등록 경로는 401** (Review Focus 1)
    - `OPTIONS /api/posts` preflight(Origin `http://127.0.0.1:8765`) → 200, `Access-Control-Allow-Origin` 일치
  - `AuthApiTest`: 아래 다섯 가지를 확인한다.
    - 가입 201
    - 이메일 중복 409 `/errors/duplicate`
    - 로그인 200 `{accessToken, tokenType:"Bearer", expiresIn:3600}`
    - 비밀번호 틀림 401. 응답 `detail`이 이메일 오류와 같아야 한다.
    - `GET /api/members/me` 응답에 `passwordHash` 키가 없다.
- [ ] 태그 `answer-d03`

### Task 4: D04 게시글 쓰기 (JPA)

**Interfaces:**
- Produces: `Post.create(Member, String title, String content): Post`, `PostService.create(Long memberId, PostCreateRequest): Long`, `PostStatus`(`ACTIVE`, `HIDDEN`, `DELETED`)

- [ ] D04 steps 1~5. 반드시 포함할 테스트:
  - `PostCreateApiTest`: 201과 `Location: /api/posts/{postId}`. 제목 공백만이면 400이고 `errors[0].field=title`. 태그 6개면 400. 태그 중복은 제거된다.
  - `EntityRulesTest`: `com.example.board` 아래 `@Entity` 클래스 전부에 대해 public 생성자 0개, `set`으로 시작하는 public 메서드 0개.
- [ ] 태그 `answer-d04`

### Task 5: D05 조회·수정·삭제·댓글·좋아요 (JPA)

**Interfaces:**
- Consumes: Task 4의 `Post`, `PostService`
- Produces: `Post.update(String title, String content)`, `Post.patch(…)`, `Post.delete()`, `Post.increaseLikeCount()`/`decreaseLikeCount()` (DB 원자 UPDATE를 쓰면 엔티티 메서드 대신 리포지토리 `@Modifying` 쿼리), `CommentService`, `PostLikeService.like(Long postId, Long memberId)`/`unlike(…)`

- [ ] D05 steps 1~6. 반드시 포함할 테스트:
  - `PostCrudApiTest`: 상세 200, PUT 200, PATCH 제목만 → 본문 유지, DELETE 204 → GET 404, 남의 글 수정 403.
  - `CommentApiTest`: 작성 201. 댓글 20개 목록에서 **SQL 2회 이하**(Hibernate `Statistics.getPrepareStatementCount()`). 삭제 시 작성자 204, 남 403, ADMIN 204.
  - `PostLikeApiTest`: PUT → 204, 다시 PUT → 204이고 `like_count=1`. DELETE를 두 번 해도 204.
- [ ] 태그 `answer-d05`

### Task 6: D06 목록·검색 (MyBatis)

**Interfaces:**
- Produces:
  - `CursorPage<T>(List<T> items, String nextCursor)`
  - `PostQueryService.search(PostSearchCondition, String cursor, int size): CursorPage<PostSummary>`
  - 커서는 마지막 `id`를 Base64URL로 인코딩한 문자열이다.

- [ ] D06 steps 1~5. 반드시 포함할 테스트:
  - `PostListApiTest`: 200 `{items, nextCursor}`. 25건일 때 size 20 → 다음 커서로 나머지 5건, 이때 `nextCursor=null`. `size=51` → 400, `keyword=a` → 400, `sort=title` → 400, `tag=spring` 필터, 숨김·삭제 글 제외.
  - `PostListExplainTest`: `EXPLAIN`의 `key`가 (`status`, `id`) 인덱스 이름이다. 인덱스 전후 비교는 `VERIFY.md`에 기록한다.
  - `MyBatisInjectionTest`: `keyword`에 `' OR 1=1 --`를 넣어도 결과가 0건이다. 매퍼 XML 전체에 `${`가 없다(파일 문자열 검사).
- [ ] 태그 `answer-d06`

### Task 7: D07 포인트·쿠폰 상점

**Interfaces:**
- Produces:
  - `PointService.earn(Long memberId, int amount, String refType, Long refId)`, `spend(…)`. 잔액은 `UPDATE member SET point_balance = point_balance + ? WHERE id = ?` 원자 갱신이고, 차감은 `AND point_balance >= ?` 조건부 갱신이다. 같은 트랜잭션에서 `point_ledger`를 추가한다.
  - `CouponService.issue(Long couponId, Long memberId): Long`
  - `OrderService.order(Long memberId, String idempotencyKey, OrderRequest): OrderResponse`

- [ ] D07 steps 1~6. 반드시 포함할 테스트:
  - `PointConcurrencyTest`: 같은 회원에게 동시에 50회 적립(+10)하면 잔액 500, ledger 50행. 잔액 = ledger 합계.
  - `CouponIssueApiTest`: 201, 같은 회원 재발급 409 `/errors/duplicate`.
  - `OrderApiTest`: 201. 같은 키와 같은 본문 → 같은 응답(차감 1회). 같은 키에 다른 본문 → 422. 잔액 부족 → 409 `/errors/insufficient-points`.
  - `OrderIdempotencyConcurrencyTest`: 같은 키로 동시 2요청 → 주문 1건, 차감 1회 (Review Focus 2).
- [ ] 태그 `answer-d07`

### Task 8: D08 포인트 충전 (외부 PG 모의)

**Interfaces:**
- Produces:
  - `PgClient.approve(String orderId, int amount, String idempotencyKey): PgApproval`, `findByOrderId(String orderId): Optional<PgApproval>`
  - `ChargeService.charge(Long memberId, String idempotencyKey, int amount): ChargeResponse`. 구조는 세 단계다: REQUESTED 저장 트랜잭션 → 트랜잭션 밖에서 PG 호출 → 결과 반영 트랜잭션.
  - `PgSignatureVerifier.verify(byte[] rawBody, String signatureHex): boolean`(상수 시간 비교)
  - WireMock 스텁은 `board-server/src/test/resources/wiremock/` 아래에 두고, compose의 WireMock 컨테이너도 같은 디렉터리를 마운트한다.

- [ ] D08 steps 1~5. 반드시 포함할 테스트:
  - `ChargeApiTest`: 201, 잔액이 증가하고 `pg_payment` 상태는 `DONE`.
  - `PgTimeoutTest`: Toxiproxy로 응답을 5초 지연시키면 504 `/errors/pg-timeout`. `pg_payment`는 `UNKNOWN`이고 응답까지 3.5초 이내. 이후 `findByOrderId` 조회 또는 서명된 콜백 하나로 `DONE`이 되고, 적립은 1회.
  - `PgClientRetryTest`: 503 두 번 뒤 200이면 성공하고 PG가 받은 요청은 3번이다. 모두 같은 `Idempotency-Key`. 400이면 재시도하지 않는다(1번).
  - `PgCallbackApiTest`: 서명이 맞으면 200. 틀리면 401 `/errors/invalid-signature`. 없는 `orderId`면 404. 같은 콜백 두 번 → 적립 1회. `amount` 불일치 → 400.
  - `PgCallbackOrderingTest`: 콜백이 승인 응답보다 먼저 와도 적립 1회, 최종 `DONE` (Review Focus 3).
  - `ChargeTransactionBoundaryTest`: PG 지연 중 Hikari active 커넥션이 0이다. 즉 PG 호출 동안 커넥션을 쥐지 않는다(`HikariPoolMXBean` 조회).
- [ ] 태그 `answer-d08`

### Task 9: D09 Redis

**Interfaces:**
- Produces:
  - `PopularPostService.getPopular(): List<PostSummary>`. Redis 장애 시 DB에서 조회하고 경고 로그만 남긴다.
  - `PostChangedEvent(Long postId)`. `@TransactionalEventListener(phase = AFTER_COMMIT)`로 캐시를 지운다.
  - `CouponStockCounter.tryDecrease(Long couponId): boolean`
  - `ActivityRankingService.add(Long memberId, int score)`, `top(int size)`
  - `LoginAttemptLimiter.check(String email)`, `recordFailure(String email)`, `reset(String email)`

- [ ] D09 steps 1~6. 반드시 포함할 테스트:
  - `PopularPostCacheTest`: 두 번째 조회에서 SQL이 0회. 글 삭제를 커밋한 직후 인기글에서 빠진다. 커밋 전에는 지워지지 않는다(롤백 시나리오).
  - `PopularPostFallbackTest`: Redis 컨테이너를 멈추면 `GET /api/posts/popular` → 200, `POST /api/posts` → 201, 각각 1초 이내. **Redis가 멈춘 상태로 컨텍스트 기동 성공** (Review Focus 4).
  - `CouponIssueConcurrencyTest`: 수량 10장 쿠폰에 50명이 동시에 발급을 요청하면 정확히 10명이 201, 나머지는 409 `/errors/coupon-exhausted`. DB `issued_quantity=10`.
  - `ActivityRankingApiTest`: 점수 내림차순. `size=51` → 400.
  - `LoginAttemptLimiterTest`: 5회 실패 뒤 6번째는 429 `/errors/too-many-attempts`. 성공하면 카운터가 초기화된다.
- [ ] 태그 `answer-d09`

### Task 10: D10 관리자 · AOP · 테스트

**Interfaces:**
- Produces:
  - `@Audited(action = "HIDE_POST")` 어노테이션과 `AuditLogAspect`. 대상 메서드가 성공으로 끝난 뒤 `audit_log`를 추가한다.
  - `AdminService.hidePost(Long postId, Long reportId)`
  - `ExcelMemberIdReader.read(MultipartFile): ExcelReadResult(List<Long> memberIds, List<Skipped> skipped)`
  - `CouponBulkIssueService.bulkIssue(Long couponId, MultipartFile): BulkIssueResponse(int issued, List<Skipped> skipped)`

- [ ] D10 steps 1~6. 반드시 포함할 테스트:
  - `ReportApiTest`: 201, 재신고 409.
  - `AdminControllerTest`(`@WebMvcTest`): USER 토큰으로 `GET /api/admin/reports` → 403.
  - `AdminFlowIntegrationTest`: 아래를 확인한다.
    - 숨김 → 200. 이후 상세 404, 연결한 신고는 `RESOLVED`, 인기글에서 바로 빠진다.
    - `audit-logs`에 `HIDE_POST` 1건.
    - 대량 지급(1,000행) → 200 `{issued, skipped[]}`, `BULK_ISSUE_COUPON` 1건.
  - `AuditAspectSelfInvocationTest`: 같은 클래스 안에서 `this.hidePost()`로 호출하면 감사 로그가 남지 않는다. 함정 재현용이고 결과는 `assertThat(count).isZero()`로 고정한다.
  - `ExcelMemberIdReaderTest`: 아래 다섯 가지 (Review Focus 5).
    - 숫자가 아닌 셀 → skipped(사유 `NOT_A_NUMBER`)
    - 빈 행 → 건너뜀
    - 1,001행 → 400
    - `.xls` → 400
    - 정상 1,000행 → 1,000건
- [ ] 태그 `answer-d10`, 최종 전체 테스트 통과

## 실행 후

- 보고할 것: 태그 10개, 날짜별 테스트 수, `VERIFY.md`, 명세와 다르게 판단한 곳(원장의 Ruling).
- P3(Java 트랙)와 P4(어수선한 서버)는 이 결과의 `answer-d10`에서 출발한다.
