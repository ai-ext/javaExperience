# V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일

> 인증·인가·CSRF는 각각 다른 응답을 검증한다.
> 비동기는 Awaitility, 커밋 이벤트는 실제 commit, 동시성은 테스트 트랜잭션을 끄고 확인한다.
> MockMvc 업로드와 서블릿 컨테이너의 크기 제한은 별도 테스트다.

## 1. 한 줄로 말하면

보안 필터·트랜잭션·스레드·시계·컨테이너 조건을 통제해 운영 실패를 재현한다. 기존 상품 API 예와 아직 없는 기능의 적용 템플릿을 구분한다.

## 2. 당장 알아야 할 것

1. **Boot 4 import:** MVC 테스트는 `org.springframework.boot.webmvc.test.autoconfigure`, JPA 테스트는 `org.springframework.boot.data.jpa.test.autoconfigure`; `@AutoConfigureTestDatabase`는 `org.springframework.boot.jdbc.test.autoconfigure`다. 기준은 Security 7.1.1, JUnit 6.0.3.
2. **인증·인가:** 익명 401, 권한 부족 403을 나눈다. 기본 로그인은 302일 수 있다. `@WithMockUser`·`user()`·`jwt()`는 가짜 인증 주입이다.
3. **CSRF:** 변경 메서드에 토큰 있는 요청은 통과하고 누락·무효는 거부되는지 본다.
4. **예외:** 기존 상품 없음 ProblemDetail 404의 `title`·`detail`, 새 입력 검증 400의 `errors.name`을 확인한다.
5. **비동기:** 업무 로직은 직접 호출, `@Async` 경계는 주입한 프록시를 호출해 Awaitility로 대기한다. `sleep`은 쓰지 않는다.
6. **스케줄·이벤트:** 직접 호출은 작업 로직만 검증한다. 트리거와 `AFTER_COMMIT`은 컨텍스트·실제 commit이 필요하다.
7. **동시성:** 기본 롤백 테스트 트랜잭션을 끄고 각 서비스 트랜잭션으로 실제 DB 경합을 만든다.
8. **파일·시간·외부 호출:** MockMvc와 실제 포트 업로드는 다른 경계를 본다. `Clock` 고정, 외부 실패·timeout을 재현한다.

## 3. 따라 하기

기준은 Boot 4.1.1 / Framework 7.0.9 / Java 25다. 연습 프로젝트는 JDK 21이며 예제는 미실행 템플릿이다.

### 1단계 — 테스트 의존성과 Boot 4 import

`practice/starter/build.gradle.kts`에 보안 기능을 넣을 때만 아래 첫 줄을 추가하고, 테스트 도구는 테스트 의존성으로 둔다. 버전은 Boot BOM이 관리하게 한다.

```kotlin
implementation("org.springframework.boot:spring-boot-starter-security") // 보안 기능 추가 시
 testImplementation("org.springframework.security:spring-security-test")
testImplementation("org.awaitility:awaitility")
```

Maven은 두 라이브러리에 `<scope>test</scope>`를 둔다.

```java
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
```

**확인:** `cd practice/starter && ./gradlew dependencies --configuration testRuntimeClasspath`에서 두 테스트 라이브러리가 해석되는지 본다. 보안 의존성은 기존 앱에 없으므로 인증 예제를 도입할 때만 추가한다.

### 2단계 — 실제 상품 API 인증·인가·CSRF

MVC 슬라이스에 필터 체인을 가져와 상품 읽기엔 `PRODUCT_READER`, 익명엔 401을 적용한다.

```java
@WebMvcTest(ProductController.class) @Import(ProductSecurityTest.Config.class)
class ProductSecurityTest {
    @Autowired MockMvc mvc; @MockitoBean ProductService service;
    @Test void authAndRole() throws Exception {
        mvc.perform(get("/api/products/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/products/1").with(user("lee").roles("USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/products/1").with(user("lee").roles("PRODUCT_READER")))
                .andExpect(status().isOk());
    }
    @Test void csrf() throws Exception {
        mvc.perform(post("/api/products/1").with(user("lee").roles("PRODUCT_READER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/products/1").with(user("lee").roles("PRODUCT_READER")).with(csrf()))
                .andExpect(status().isMethodNotAllowed());
    }
    @TestConfiguration @EnableWebSecurity static class Config {
        @Bean SecurityFilterChain api(HttpSecurity h) throws Exception {
            return h.authorizeHttpRequests(a -> a.requestMatchers("/api/products/**")
                    .hasRole("PRODUCT_READER").anyRequest().denyAll())
                .exceptionHandling(e -> e.authenticationEntryPoint(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))).build();
        }
    }
}
```

MockMvc·Security 요청 도구와 `HttpSecurity`, `SecurityFilterChain`, `HttpStatusEntryPoint`를 import한다. 현 API의 유효 CSRF POST는 매핑이 없어 405다.

**확인:** `./gradlew test --tests '*ProductSecurityTest'`에서 익명 401·권한 부족 403·읽기 권한 GET 200을 확인한다.

### 3단계 — ProblemDetail·검증 실패 응답

현재 `ProductApiIntegrationTest`의 없는 상품 검증은 기존 응답 계약을 확인한다.

```java
mvc.perform(get("/api/products/999"))
    .andExpect(status().isNotFound())
    .andExpect(jsonPath("$.title").value("Product not found"))
    .andExpect(jsonPath("$.detail").value("Product 999 was not found"));
```

새 입력 DTO에 `@Valid`를 붙이면 전역 핸들러에서 필드 오류를 정해진 키로 내려준다. 다음은 `GlobalExceptionHandler`에 추가하는 템플릿이다(미실행).

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
ProblemDetail invalid(MethodArgumentNotValidException ex) {
    var errors = ex.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(
        FieldError::getField, FieldError::getDefaultMessage, (first, ignored) -> first));
    var p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
    p.setTitle("Validation failed"); p.setProperty("errors", errors); return p;
}
```

`@NotBlank(message="상품명은 필수입니다")` POST의 400, `$.title`, `$.errors.name`을 확인한다. 현재 API에는 이 경로가 없다.

**확인:** JSON의 `errors.name`을 확인한다.

### 4단계 — `@Async`·`@Scheduled` 결과 기다리기

스프링 설정에서 `@EnableAsync`, `@EnableScheduling`을 켠다. 컨테이너가 주입한 프록시 빈을 호출한다. 다음 빈은 연습 프로젝트에 없는 예시다.

```java
@Configuration @EnableAsync @EnableScheduling
class AsyncConfig {}

@Service
class NoticeDispatcher {
    private final BlockingQueue<String> sent = new LinkedBlockingQueue<>();
    @Async public void dispatch(String id) { sent.add(id); }
    public boolean wasSent(String id) { return sent.contains(id); }
}

@SpringBootTest // NoticeDispatcherAsyncTest, 미실행
class NoticeDispatcherAsyncTest {
    @Autowired NoticeDispatcher dispatcher;
    @Test void waitsForAsyncWork() {
        dispatcher.dispatch("notice-7");
        await().atMost(Duration.ofSeconds(3))
                .untilAsserted(() -> assertThat(dispatcher.wasSent("notice-7")).isTrue());
    }
}
```

정리 로직은 직접 호출하고, 스케줄 등록만 `cleanup.delay=50`과 Awaitility로 확인한다.

**확인:** 조건이 제한 시간 안에 충족돼야 통과한다. 자기 호출은 프록시를 우회한다.

### 5단계 — 이벤트 발행과 커밋 후 부수 효과

이벤트 발행은 `@RecordApplicationEvents`와 테스트 인자 `ApplicationEvents`로 관찰한다.

```java
@SpringBootTest @RecordApplicationEvents // 미실행 템플릿
class ProductEventTest {
    @Autowired ProductService service; // 상태 변경 기능 추가 시
    @Test void publishesEvent(ApplicationEvents events) {
        service.changePrice(1L, new BigDecimal("10000")); // 현재 클래스에는 없는 예시 메서드
        assertThat(events.stream(ProductPriceChanged.class)).hasSize(1);
    }
}
```

`AFTER_COMMIT` 리스너의 실제 효과는 `TransactionTemplate.executeWithoutResult(tx -> orderService.submit(order))`처럼 커밋한 뒤 outbox 저장 등을 확인한다. 테스트 메서드 전체가 `@Transactional`이면 테스트 종료 시 롤백되므로 리스너가 안 불리는 것이 정상이다. 기본 `@TransactionalEventListener`는 트랜잭션이 없으면 실행되지 않는다.

**확인:** 이벤트 발행과 커밋 후 효과를 별도 단언한다.

### 6단계 — 마지막 재고 한 개를 두 스레드가 구매

`product.stock`은 음수를 금지한다. 읽고 나중에 저장하는 대신 조건부 UPDATE로 원자 차감한다.

```java
@Service class InventoryService {
    private final JdbcTemplate jdbc;
    InventoryService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Transactional boolean tryPurchase(long id) {
        return jdbc.update("UPDATE product SET stock=stock-1 WHERE id=? AND stock>0", id) == 1;
    }
}
```

기존 통합 테스트와 같은 Testcontainers MySQL/schema/seed를 쓰고 전용 컨테이너에서 상품 1 재고를 1로 만든다. 테스트 핵심(미실행):

```java
@Test @Transactional(propagation = Propagation.NOT_SUPPORTED)
void onlyOneBuyerGetsLastItem() throws Exception {
    jdbc.update("UPDATE product SET stock=1 WHERE id=1");
    var pool = Executors.newFixedThreadPool(2);
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    Callable<Boolean> buy = () -> { ready.countDown(); start.await(); return inventory.tryPurchase(1); };
    try {
        var a = pool.submit(buy); var b = pool.submit(buy);
        assertThat(ready.await(2, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        assertThat(List.of(a.get(5, TimeUnit.SECONDS), b.get(5, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(true, false);
        assertThat(jdbc.queryForObject("SELECT stock FROM product WHERE id=1", Integer.class)).isZero();
    } finally { start.countDown(); pool.shutdownNow(); }
}
```

`JdbcTemplate`, `InventoryService`를 주입한다. 각 worker의 서비스 호출이 자체 트랜잭션을 만든다. `@DataJpaTest` 기본 롤백 트랜잭션에 넣지 않는다.

**확인:** 두 작업을 함께 출발시켜 승자 하나와 재고 0을 확인한다.

### 7단계 — 파일·Clock·외부 timeout

업로드 경로 추가 시 `MockMultipartFile`로 MVC 입력을 만든다. 현재 엔드포인트는 없다.

```java
var file = new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1, 2, 3});
mvc.perform(multipart("/api/products/1/image").file(file)).andExpect(status().isCreated());
```

앱의 5MB 업무 한도 초과를 확인하는 MVC 테스트(미실행):

```java
var oversized = new MockMultipartFile("file", "large.bin", "application/octet-stream",
        new byte[5 * 1024 * 1024 + 1]);
mvc.perform(multipart("/api/products/1/image").file(oversized))
        .andExpect(status().isPayloadTooLarge());
```

컨테이너 한도는 별도 설정이다.

```yaml
spring.servlet.multipart.max-file-size: 5MB
spring.servlet.multipart.max-request-size: 6MB
```

MockMvc는 Tomcat multipart 파서의 제한을 검증하지 않는다. 최대 용량 설정으로 실제 413이 나오는지는 `RANDOM_PORT` 실제 HTTP 업로드 테스트로 확인한다. Boot 문서 기준 기본값은 파일 1MB, 요청 10MB다. 클라이언트가 준 MIME 타입과 파일명은 신뢰하지 않는다.

시각은 `Clock` 주입으로 고정한다(미실행 패턴).

```java
Clock clock = Clock.fixed(Instant.parse("2026-10-04T00:00:00Z"), ZoneOffset.UTC);
ExpiryPolicy policy = new ExpiryPolicy(clock);
assertThat(policy.isExpired(Instant.parse("2026-10-03T23:59:59Z"))).isTrue();
```

고정 시계로 만료 경계를 검증한다. 외부 실패는 대역으로 재현한다(클래스명은 앱 계약에 맞춘다).

```java
willThrow(new ResourceAccessException("timeout", new SocketTimeoutException()))
        .given(gateway).fetch("item-1");
assertThatThrownBy(() -> service.load("item-1"))
        .isInstanceOf(PartnerUnavailableException.class);
```

실제 timeout 값은 지연 mock 서버로 확인한다.

**확인:** 파일 업무 제한과 컨테이너 제한을 분리하고, Clock 경계는 대기 없이 검증한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@WithMockUser`·`user()`·`jwt()` | 테스트 인증 | `.with(user("u").roles("ADMIN"))` | 자격 증명 검증 아님 |
| `csrf()` | CSRF 요청 | `.with(csrf())` | 누락도 검증 |
| ProblemDetail | 오류 계약 | `$.title`, `$.errors.name` | 상태 코드 포함 |
| Awaitility | 비동기 대기 | `await().untilAsserted(...)` | timeout 지정 |
| `ApplicationEvents` | 이벤트 관찰 | `events.stream(Type.class)` | 기록 애노테이션 필요 |
| `TransactionTemplate` | commit 검증 | `executeWithoutResult(...)` | rollback과 구분 |
| `CountDownLatch` | 동시 시작 | ready 후 시작 해제 | finally에서 해제 |
| `MockMultipartFile` | multipart 입력 | `.file(file)` | 컨테이너 제한 아님 |
| `Clock.fixed` | 시간 고정 | `Instant`, UTC | 경계 테스트 |

**기본값 추천:** 웹은 MockMvc, 비동기는 Awaitility, DB 경합은 Testcontainers 실제 DB로 시작한다.

## 5. 자주 나는 에러와 해결

1. `package ...web.servlet does not exist` → Boot 3 import → Boot 4 `org.springframework.boot.webmvc.test.autoconfigure`로 수정한다.
2. 익명 요청이 302인데 401 기대 → form login entry point → API entry point를 명시한다.
3. 가짜 사용자에도 보안 미적용 → 테스트 의존성·필터 체인 누락 → MVC 슬라이스에 보안 설정을 import한다.
4. POST가 403 → CSRF 누락 → 권한을 갖춘 요청에 유효 토큰을 넣고 누락 응답을 따로 본다.
5. Awaitility timeout → 프록시 우회·관찰 상태 비가시성 → 주입 빈과 thread-safe 상태를 확인한다.
6. AFTER_COMMIT 미호출 → 롤백 또는 트랜잭션 밖 발행 → `TransactionTemplate`으로 commit한다.
7. worker가 테스트 데이터를 못 찾음 → 외부 테스트 트랜잭션 미커밋 → `NOT_SUPPORTED`와 실제 DB를 쓴다.
8. MockMvc 파일은 통과, 운영은 413 → 컨테이너 제한 미검증 → 실제 포트 multipart로 확인한다.

## 6. 한 단계 더

MockMvc와 가짜 사용자는 각각 서버·인증 전체를 검증하지 않는다. 경계 연결은 통합, 업무 분기는 단위 테스트로 확인한다.

테스트 선택 → V01, 계층별·DB 테스트 → V02·V04, mock 경계 → V03, 종합 → S18 참조. 보안→S12·S13, 스케줄→P30, 동시성→P18, 파일→P17.

## 7. 자가점검 Q&A (면접 대비)

### Q1. 인증 실패와 권한 부족을 왜 구별하나?
401은 인증이 없고 403은 인증 주체의 권한 부족이다. 클라이언트 동작이 달라 각각 확인한다. entry point가 302인지도 본다.

**꼬리질문:** `@WithMockUser`가 JWT 검증도 하나? **답:** 아니다. 테스트 보안 컨텍스트만 설정한다.

### Q2. CSRF 테스트에 유효 토큰만 넣으면 충분한가?
유효 토큰 요청이 통과하는지 확인한다. 누락·무효 토큰도 시험해 보호를 확인한다. 권한이 충분한 요청으로 CSRF 거부를 분리한다.

**꼬리질문:** GET에도 토큰을 보내나? **답:** 상태 변경 메서드 보호가 중심이다. 안전 메서드와 변경 메서드 계약을 나눈다.

### Q3. Async 메서드 테스트에서 `sleep`이 불안정한 이유는?
고정 대기는 부하에 따라 느리거나 짧다. Awaitility는 조건 달성 시 끝나고 timeout이면 실패한다. 업무 로직은 동기 단위 테스트로 확인한다.

**꼬리질문:** 자기 호출은 왜 async가 아닐 수 있나? **답:** Spring 프록시를 건너뛰기 때문이다. 외부에서 주입한 빈을 호출한다.

### Q4. AFTER_COMMIT 테스트가 롤백 테스트에서 동작하지 않는 이유는?
리스너는 commit 뒤 실행되지만 테스트 트랜잭션은 보통 rollback한다. `TransactionTemplate`으로 커밋해 효과를 확인한다.

**꼬리질문:** 트랜잭션 없이 발행하면? **답:** 기본 설정에선 리스너가 실행되지 않는다.

### Q5. 동시성 테스트에서 외부 트랜잭션을 끄는 이유는?
미커밋 데이터는 worker 연결에서 안 보일 수 있고 경쟁도 가려진다. 외부 트랜잭션을 끄고 서비스 호출이 자체 트랜잭션을 쓰게 한다.

**꼬리질문:** 두 작업 출발은 어떻게 맞추나? **답:** 준비·시작 `CountDownLatch`로 동기화하고 sleep은 쓰지 않는다.

### Q6. MockMultipartFile 테스트가 컨테이너 업로드 크기도 검증하나?
아니다. MockMvc는 실제 multipart 파싱을 하지 않는다. 앱 검증과 컨테이너 413을 나누고, 후자는 실제 포트로 확인한다.

**꼬리질문:** MIME 타입은 신뢰 가능한가? **답:** 클라이언트 입력이므로 파일 내용과 정책을 별도 검사한다.

## 8. 참고문헌

- Spring Security Testing — https://docs.spring.io/spring-security/reference/servlet/test/index.html — 테스트 지원.
- Setting Up MockMvc and Spring Security — https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/setup.html — 필터 설정.
- Running a Test as a User — https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/authentication.html — 사용자 주입.
- Testing with CSRF Protection — https://docs.spring.io/spring-security/reference/servlet/test/mockmvc/csrf.html — CSRF 토큰.
- Awaitility Usage — https://github.com/awaitility/awaitility/wiki/Usage — 조건 대기.
- Application Events — https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/application-events.html — 이벤트 기록.
- Transaction-bound Events — https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html — 커밋 단계.
- MockMvc — https://docs.spring.io/spring-framework/reference/testing/mockmvc.html — MVC 테스트 범위.
- Boot 4.1.1 `@DataJpaTest` API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html — 기본 롤백·패키지.
- Framework `MockMultipartFile` API — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/mock/web/MockMultipartFile.html — multipart 파일 객체.
- Common Application Properties — https://docs.spring.io/spring-boot/appendix/application-properties/index.html — 업로드 제한값.
- Task Execution and Scheduling — https://docs.spring.io/spring-framework/reference/integration/scheduling.html — 실행기 설정.
