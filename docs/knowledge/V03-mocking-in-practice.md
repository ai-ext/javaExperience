# V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나

> - 외부 시스템과 비결정적 입력은 대체하고, 검증하려는 도메인 로직은 실제로 실행한다.
> - Controller 슬라이스에서는 다음 계층을 `@MockitoBean`으로 끊고, DB 동작은 가능하면 실제 DB로 확인한다.
> - mock 호출 횟수보다 사용자가 관찰하는 결과와 외부에 약속한 상호작용을 검증한다.

## 1. 한 줄로 말하면

테스트 더블은 운영 객체의 대역이고, mock은 기대 호출을 검증하는 더블이다. 외부 시스템·비결정 입력은 통제하고 도메인 로직은 실제로 실행한다.

## 2. 당장 알아야 할 것

### 2.1 경계를 세운다

내가 통제하지 못하는 협력자(외부 API·메일·결제·시각·난수)는 테스트에서 대체하고, 내가 검증하려는 도메인 로직은 실제로 실행한다. DB mock은 JPA·SQL 의미를 확인하지 못하므로 가능하면 실제 DB를 쓴다.

### 2.2 다섯 더블은 목적이 다르다

Fowler의 분류에서 다섯 종류는 별도 프레임워크 기능이 아니라 대역에 맡긴 역할이다.

| 종류 | 역할과 예 |
|---|---|
| dummy | 호출하지 않는 자리 채움: `NoticeSender dummy = (to, body) -> {};` |
| stub | 준비한 값 반환: `given(clock.instant()).willReturn(cutoff);` |
| spy | 실물 실행과 기록: `List<String> spy = spy(new ArrayList<>()); spy.add("x"); verify(spy).add("x");` |
| mock | 기대 호출 검증: `then(gateway).should().charge(command);` |
| fake | 작동하는 간략 구현: 아래 in-memory store |

Mockito 객체도 반환 설정만 하면 stub, 호출을 검증하면 mock 역할이다. fake는 실제 DB의 SQL·NULL·인덱스 동작을 재구현하지 않는다. dummy 호출 자체를 보장해야 하면 mock을 쓴다.

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

interface ProductStore {
    void save(Long id, String name);
    Optional<String> find(Long id);
}
final class FakeProductStore implements ProductStore {
    private final Map<Long, String> rows = new HashMap<>();
    public void save(Long id, String name) { rows.put(id, name); }
    public Optional<String> find(Long id) { return Optional.ofNullable(rows.get(id)); }
}
```

이 구현은 in-memory 상태 흐름만 확인한다. DB 쿼리 검증을 대신하지 않는다.

### 2.2.1 spy는 실물의 일부 동작을 보존한다 (보강)

spy는 실제 객체를 감싸고, 별도 설정이 없는 호출은 실제 메서드를 실행한다. 필요한 메서드 일부는 다른 값으로 바꾸거나 호출 여부를 기록해 검증할 수 있다. 반면 mock은 같은 클래스라도 처음부터 가짜 객체다. 예를 들어 `LegacyInventory`를 mock으로 만들면 `find("local")`은 준비하지 않은 반환값을 줄 뿐 실제 저장소를 조회하지 않는다. spy는 같은 호출을 실제 구현에 넘긴다.

| 같은 `LegacyInventory`의 미설정 `find("local")` | 동작 |
|---|---|
| `mock(LegacyInventory.class)` | 실제 메서드 없이 `int` 기본값 `0` 반환 |
| `spy(new LegacyInventory())` | 실제 메서드 실행, 여기서는 `7` 반환 |

Mockito에서 직접 만들 때는 `LegacyInventory spy = spy(new LegacyInventory());`를 쓴다. 필드 선언은 `@ExtendWith(MockitoExtension.class)`와 함께 `@Spy LegacyInventory inventory = new LegacyInventory();`처럼 쓸 수 있다. `@Spy` 필드는 Mockito 확장이나 `MockitoAnnotations.openMocks(this)`가 초기화해야 한다.

Spring 컨텍스트 테스트라면 `@MockitoSpyBean LegacyInventory inventory;`가 기존 빈을 spy로 감싼다. 이 이름은 Spring Framework 7의 API다. Boot 3.4에서 deprecated된 `@SpyBean`은 Boot 4에서 제거 대상이고, Framework의 `@MockitoSpyBean`을 사용한다.

#### `when`을 쓰면 설정 중에도 실제 메서드가 호출된다 (보강)

일반 mock과 달리 spy에 `when(spy.find("remote")).thenReturn(99)`를 쓰면 `when`의 인자를 계산하면서 `find`를 먼저 실행한다. 실제 조회나 파일 쓰기처럼 부작용이 있으면 준비 단계에서 부작용이 생기며, 메서드가 예외를 던지면 stubbing 자체가 완료되지 않는다. 이때는 `doReturn(99).when(spy).find("remote")`를 쓰면 메서드를 먼저 실행하지 않고 반환값을 설정한다.

아래 테스트 첫 두 메서드가 예외와 호출 횟수로 두 동작을 보여 준다. `doReturn` 계열은 spy의 위험한 실제 호출을 피할 때 쓰고, 일반 mock의 단순한 stubbing은 읽기 쉬운 `when`으로 둔다.

#### 상태, final·private 메서드 주의 (보강)

실제 메서드를 호출한 spy 내부의 상태는 다음 호출에도 남는다. 다만 Mockito의 `spy(original)`은 원본 객체로 계속 위임하는 프록시가 아니라 상태를 복사해 spy 객체를 만든다. 따라서 spy를 조작했다고 전달한 `original`의 필드도 바뀔 것이라 기대하면 안 된다. 세 번째 테스트는 spy의 호출 횟수는 1이지만 원본 객체의 횟수는 0인 점을 확인한다.

final 메서드와 클래스의 처리는 Mockito 버전 및 MockMaker 설정에 따라 다르다. Mockito 5 기본 inline MockMaker에서는 final도 다룰 수 있지만, 다른 MockMaker를 선택한 프로젝트에서는 제한될 수 있으니 현재 테스트 설정을 확인한다.

private 메서드는 Mockito로 직접 stub하거나 verify할 수 없다. private 구현을 억지로 끊기보다 외부에 드러난 동작을 검증하거나 필요한 협력자를 주입한다.

spy는 레거시 코드에서 외부 호출 한 군데만 잠시 막아야 하거나, 실제 경로를 실행하며 특정 협력자 호출을 확인하는 경우에 제한적으로 유용하다. 그러나 spy가 여러 개 필요하거나 내부 메서드까지 stub하고 싶다면 의존성 경계가 섞였다는 설계 신호일 수 있다. 외부 의존성을 주입해 분리하고, 상태와 동작이 있는 간단한 fake를 만들 수 있다면 보통 그 편이 테스트 의도를 분명히 한다.

다음 순수 단위 테스트는 문서 예제와 동일하다. Spring 컨텍스트 없이 JUnit 5와 Mockito만 사용한다.

```java
package com.example.practice.product;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SpyExamplesTest {
    @Test
    void whenStyleRunsRealMethodWhileStubbing() {
        LegacyInventory inventory = spy(new LegacyInventory());

        assertThatThrownBy(() -> when(inventory.find("remote")).thenReturn(99))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("remote call");
        assertThat(inventory.realCalls()).isEqualTo(1);
    }

    @Test
    void doReturnStubsWithoutRunningRealMethod() {
        LegacyInventory inventory = spy(new LegacyInventory());

        doReturn(99).when(inventory).find("remote");

        assertThat(inventory.find("remote")).isEqualTo(99);
        assertThat(inventory.realCalls()).isZero();
        verify(inventory).find("remote");
    }

    @Test
    void realCallsChangeSpyStateButNotTheOriginalInstance() {
        LegacyInventory original = new LegacyInventory();
        LegacyInventory inventory = spy(original);

        assertThat(inventory.find("local")).isEqualTo(7);

        assertThat(inventory.realCalls()).isEqualTo(1);
        assertThat(original.realCalls()).isZero();
        verify(inventory).find("local");
    }

    static class LegacyInventory {
        private int realCalls;

        int find(String location) {
            realCalls++;
            if ("remote".equals(location)) {
                throw new IllegalStateException("remote call");
            }
            return 7;
        }

        int realCalls() {
            return realCalls;
        }
    }
}
```

참고: Mockito 5.24.0 Javadoc — https://javadoc.io/static/org.mockito/mockito-core/5.24.0/org.mockito/org/mockito/Mockito.html
참고: @MockitoBean and @MockitoSpyBean — https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html
참고: SpyBean (Spring Boot 3.5 API) — https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/test/mock/mockito/SpyBean.html

### 2.3 Boot 4 MVC 슬라이스는 Controller를 실물로 둔다

현재 실습 프로젝트의 정확한 import는 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`와 `AutoConfigureMockMvc`다. `@MockitoBean`은 `org.springframework.test.context.bean.override.mockito.MockitoBean`이다. Controller·MVC 변환은 실제로 돌리고 다음 Service 경계를 mock한다.

```java
@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean ProductService productService;
}
```

`@MockitoBean`은 빈을 mock으로 교체하며 기본값으로 빈이 없으면 새로 만들 수도 있다. 반드시 기존 빈을 대체해야 하면 `@MockitoBean(enforceOverride = true)`를 쓴다. 여러 후보가 있으면 `@Qualifier`를 지정한다.

### 2.4 순수 단위 테스트는 생성자 주입, 스프링 테스트는 컨텍스트 주입

`ProductService`는 생성자로 `ProductRepository`를 받으므로, 서비스를 실제로 생성하고 저장소만 Mockito mock으로 넘길 수 있다. Spring Context가 불필요해 더 빠르고 정책 로직도 실행된다. MVC·빈 설정까지 검증해야 할 때만 `@MockitoBean`을 쓴다. 그 필드의 이름과 qualifier는 컨텍스트 캐시에 영향을 주므로 여러 클래스에서 일관되게 유지한다.

### 2.5 Mockito는 필요한 상호작용만 준비·검증한다

```java
given(repo.findByIdAndDeletedAtIsNull(404L)).willReturn(Optional.empty());
then(repo).should().findByIdAndDeletedAtIsNull(404L);
```

예외는 `willThrow(error)`로 stubbing한다. 전달 DTO는 `ArgumentCaptor<T>`로 캡처하고, 재시도 횟수가 계약이면 `times(2)`, 외부 효과 순서가 계약이면 `InOrder`로 검증한다.

```java
ArgumentCaptor<ChargeCommand> sent = ArgumentCaptor.forClass(ChargeCommand.class);
then(gateway).should(times(1)).charge(sent.capture());
assertThat(sent.getValue().amount()).isEqualTo(expectedAmount);
InOrder flow = inOrder(gateway, inventory);
flow.verify(gateway).charge(command);
flow.verify(inventory).decrease(command.productId(), command.quantity());
```

`@MockitoSettings(strictness = Strictness.STRICT_STUBS)`는 쓰이지 않은 stubbing을 찾는다. 설정은 테스트별로 필요한 것만 두고 `lenient()`를 남용하지 않는다. 일반 객체 mock 반환값은 `null`일 수 있으므로 명시적으로 정한다.

### 2.6 인프라 목적을 분리한다

Service 단위 테스트는 저장소 대역으로 빠르게 분기와 정책을 확인한다. JPA 매핑·쿼리·제약조건은 `ProductMySqlIntegrationTest`처럼 Testcontainers MySQL로 확인한다. DB 전략은 → V04 참조. HTTP 클라이언트의 응답 매핑은 `MockRestServiceServer`나 WireMock으로 요청을 고정한다.

### 2.7 시간과 난수는 작은 의존성으로 넣는다

`now()`와 `UUID.randomUUID()`를 정책 코드가 직접 호출하면 경계 조건을 재현하기 어렵다. 시간은 `Clock`으로, ID는 `Supplier<UUID>` 또는 `IdGenerator`로 감싼다.

```java
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

final class ExpiryPolicy {
    private final Clock clock;
    ExpiryPolicy(Clock clock) { this.clock = clock; }
    boolean expired(Instant expiry) { return !expiry.isAfter(Instant.now(clock)); }
    static ExpiryPolicy at(Instant instant) {
        return new ExpiryPolicy(Clock.fixed(instant, ZoneOffset.UTC));
    }
}
```

static·final mock을 여러 곳에서 써야 한다면 `Clock`, 결제 게이트웨이 같은 주입 경계가 없는지 살핀다. 지원 여부보다 설계 신호로 다룬다.

## 3. 따라 하기

> **이 저장소에 없는 예제 프로젝트** — `practice/starter`는 원래 공부자료가 쓰던 상품 API 예제 프로젝트다(자체 `compose.yaml`: 호스트 `13307` → 컨테이너 `3306`, DB `ds_practice`, 계정 `practice`/`practice`). 이 저장소에는 없으므로 아래 경로·명령은 그런 프로젝트를 직접 만들었을 때의 예시로 읽는다. 이 저장소에서는 루트 프로젝트에 같은 패턴을 적용한다 — `./gradlew test`는 Testcontainers의 일회용 MySQL을 쓰고, 개발 DB는 루트 [`compose.yaml`](../../compose.yaml)(호스트 `localhost:13308`, 계정 `community`/`community`)이다.

실습은 Boot 4.1.1·Gradle 9.8·JDK 21인 `practice/starter` 상품 API를 쓴다. Java 25 호환 코드이며 새 예제는 실행하지 않았다.

### 1단계 — 테스트 의존성 확인

`practice/starter/build.gradle.kts`에 이미 다음 두 의존성이 있다.

```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-test")
testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
```

Maven은 같은 artifact를 `<scope>test</scope>`로 추가하고 Boot parent/BOM으로 버전을 관리한다: `spring-boot-starter-test`, `spring-boot-starter-webmvc-test`.

**확인 방법:** `cd practice/starter && ./gradlew dependencies --configuration testRuntimeClasspath`. 기존 README 검증 기록에는 2개 테스트 통과가 있지만 아래 예제는 아직 실행하지 않았다.

### 2단계 — Controller 요청과 Service 경계를 검증

`src/test/java/com/example/practice/product/ProductControllerMockingTest.java`를 만든다. `ProductController`와 MVC 직렬화·예외 처리기는 실제이고 `ProductService`만 대역이다.

```java
package com.example.practice.product;

import com.example.practice.common.GlobalExceptionHandler;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductControllerMockingTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean ProductService productService;

    @Test
    void returnsProductAsJson() throws Exception {
        LocalDateTime created = LocalDateTime.of(2026, 8, 31, 0, 0);
        given(productService.getById(1L)).willReturn(new ProductResponse(
                1L, 3L, "상품A-01", "GOODS", new BigDecimal("9700"), 33,
                "ON_SALE", created, LocalDateTime.of(2026, 9, 1, 0, 0)));

        mockMvc.perform(get("/api/products/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("상품A-01"));
        then(productService).should().getById(1L);
    }

    @Test
    void turnsMissingProductIntoProblemDetail() throws Exception {
        given(productService.getById(999L)).willThrow(new ProductNotFoundException(999L));

        mockMvc.perform(get("/api/products/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product not found"));
    }
}
```

**확인 방법:** `cd practice/starter && ./gradlew test --tests 'com.example.practice.product.ProductControllerMockingTest'`. 예상 결과는 JSON 200과 ProblemDetail 404다. Boot 3 패키지 오류가 나면 import를 `org.springframework.boot.webmvc.test.autoconfigure`로 고친다.

### 3단계 — 외부 HTTP를 서버 없이 고정 응답으로 확인

`MockRestServiceServer`는 실제 `RestClient` 요청을 매칭하고 고정 응답을 준다. 다음 파일 두 개를 추가한다.

`src/main/java/com/example/practice/client/PartnerClient.java`:

```java
package com.example.practice.client;

import java.math.BigDecimal;
import org.springframework.web.client.RestClient;

public class PartnerClient {
    private final RestClient restClient;

    public PartnerClient(RestClient restClient) { this.restClient = restClient; }

    public RateResponse rate(long productId) {
        return restClient.get().uri("/rates/{id}", productId)
                .retrieve().body(RateResponse.class);
    }

    public record RateResponse(BigDecimal price) {}
}
```

`src/test/java/com/example/practice/client/PartnerClientTest.java`:

```java
package com.example.practice.client;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PartnerClientTest {
    @Test
    void mapsPartnerResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        PartnerClient client = new PartnerClient(builder.build());
        server.expect(requestTo("/rates/42"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"price\":1250}", MediaType.APPLICATION_JSON));

        PartnerClient.RateResponse response = client.rate(42L);

        assertThat(response.price()).isEqualByComparingTo("1250");
        server.verify();
    }
}
```

**확인 방법:** `./gradlew test --tests 'com.example.practice.client.PartnerClientTest'`. 네트워크 없이 경로·HTTP method·JSON 변환이 통과한다. 실제 소켓·지연·재시도 검증에는 WireMock 같은 mock web server를 쓴다. (예제 미실행)

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@WebMvcTest` | MVC 슬라이스 | `@WebMvcTest(ProductController.class)` | Boot 4 패키지 사용 |
| `@MockitoBean` | 컨텍스트 빈 대체 | `@MockitoBean ProductService service` | 필드명·qualifier 일관성 |
| BDDMockito | 준비·호출 검증 | `given(...)`; `then(...).should()` | 필요한 상호작용만 확인 |
| Captor / InOrder | DTO 내용 / 계약된 순서 | `captor.capture()` | 내부 구현 순서 고정 금지 |
| `STRICT_STUBS` | 불필요 설정 찾기 | `@MockitoSettings(...)` | `lenient()` 남용 금지 |
| `MockRestServiceServer` | HTTP 응답 고정 | `bindTo(builder).build()` | 소켓 검증은 WireMock |
| `Clock.fixed` | 시간 분기 고정 | `Clock.fixed(instant, UTC)` | 전역 시계 변경 금지 |
| Testcontainers | DB 통합 | MySQL 컨테이너 | fake/mock으로 SQL 검증 불가 |

## 5. 자주 나는 에러와 해결

1. **`package org.springframework.boot.test.autoconfigure.web.servlet does not exist` →** Boot 3 패키지를 가져왔다. **해결:** Boot 4 `WebMvcTest`·`AutoConfigureMockMvc`는 `org.springframework.boot.webmvc.test.autoconfigure`에서 import한다.
2. **`No qualifying bean of type 'ProductService' available` →** `@WebMvcTest`는 전체 서비스 그래프를 올리지 않는다. **해결:** Controller 다음 계층을 `@MockitoBean`으로 교체한다.
3. **`UnnecessaryStubbingException` →** 설정한 `given(...)`이 실행 경로에서 쓰이지 않는다. **해결:** 공통 setup의 과한 stub을 테스트 안으로 옮기고 실제로 필요한 것만 둔다.
4. **`WantedButNotInvoked` 또는 반환값 `null` →** 잘못된 입력 경로를 검증했거나 mock 응답을 설정하지 않았다. **해결:** 실제 인자에 맞는 stubbing을 추가하고 관찰 가능한 계약만 verify한다.
5. **컨텍스트가 매 테스트마다 느리게 다시 뜸 →** `@MockitoBean` 필드명·qualifier가 달라 캐시 구성이 달라졌다. **해결:** 동일 mock 구성의 이름을 통일하거나 순수 단위 테스트는 생성자로 대역을 넣는다.

## 6. 한 단계 더

단위 테스트는 빠르지만 mock 경계 너머의 설정은 검증하지 못한다.
MVC 슬라이스는 웹 계층, Service 테스트는 정책을 확인한다.
DB 통합 테스트는 매핑·제약조건을 확인한다.
fake는 SQL 동작을 보장하지 못한다.
시각과 HTTP 응답은 `Clock`·mock server로 고정한다.
Mockito → J19, Spring → S18, DB → V04, 외부 클라이언트 → P25.

## 7. 자가점검 Q&A (면접 대비)

### Q1. stub과 mock을 어떻게 구분하나?

stub은 테스트 대상에 정해진 입력과 응답을 주는 데 초점을 둔다. mock은 협력자에게 어떤 호출이 갔는지를 기대값으로 설정하고 검증한다. 같은 Mockito 객체라도 반환만 설정하면 stub 역할, `verify`로 호출 계약을 확인하면 mock 역할이다.

**꼬리질문:** 호출 검증이 리팩터링에 약한 이유는? **답:** 내부 호출만 바뀌어도 깨지므로 관찰 가능한 계약만 검증한다.

### Q2. Service 테스트에서 Repository mock만 쓰면 충분한가?

Service 정책·예외 경로에는 저장소를 stub해도 Service 실물을 실행하므로 유효하다. 하지만 entity 매핑·JPQL·정렬·제약조건은 mock 호출로 검증할 수 없다. 이 부분은 프로젝트처럼 MySQL Testcontainers를 사용하는 통합 테스트가 맡는다.

**꼬리질문:** H2가 있는데 실제 DB 컨테이너가 필요한 때는? **답:** 운영 DB 방언, 인덱스·제약조건, JSON/날짜 함수, 트랜잭션 차이가 결과에 영향을 줄 때다.

### Q3. `@MockitoBean` 대신 생성자로 fake를 전달하는 기준은?

MVC·빈 설정은 컨텍스트의 Service를 바꾸는 `@MockitoBean`으로 확인한다. 단일 Service 정책은 생성자로 대역을 넣어 컨텍스트를 띄우지 않는다. 작은 대역이면 fake를 쓴다.

**꼬리질문:** mock 필드명을 왜 통일하나? **답:** qualifier와 캐시 키에 영향을 줘 중복 컨텍스트를 만들 수 있다.

### Q4. strict stubs는 무엇을 잡나?

`STRICT_STUBS`는 쓰이지 않은 stubbing과 실제 호출 인자 불일치를 드러낸다. 테스트별로 필요한 설정만 두고, 선택 경로의 공통 stub에만 `lenient()`를 쓴다.

**꼬리질문:** 예외를 고치려고 전체 테스트를 lenient로 바꿔도 되나? **답:** 안 된다. 사용되지 않은 설정이 가려지므로 해당 stub의 위치·범위를 먼저 바로잡는다.

### Q5. 외부 HTTP 클라이언트도 Mockito로 mock하면 되나?

클라이언트 메서드 호출은 Mockito로 검증한다. URL·method·JSON은 `MockRestServiceServer`나 WireMock으로 실제 client 요청을 확인한다. 연결 지연 등 전송 문제에는 mock web server를 쓴다.

**꼬리질문:** 운영 외부 API를 테스트 중 직접 호출하면 안 되는 이유는? **답:** 외부 상태·요금·데이터에 테스트가 의존하고, 테스트가 외부 시스템에 실제 변경을 만들 수 있기 때문이다.

### Q6. 테스트에서 `LocalDateTime.now()`를 고정하는 방법은?

`Clock`을 주입해 운영에서는 시스템 시계, 테스트에서는 `Clock.fixed(...)`를 쓴다. 만료 직전·정각·직후를 고정 조건으로 재현할 수 있다.

**꼬리질문:** 시스템 시간을 바꾸면 안 되나? **답:** 병렬 테스트와 공유하는 전역 상태라 순서 경쟁이 생긴다.

## 8. 참고문헌

- Strictness (Mockito 5.23.0 API) — https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/quality/Strictness.html — strict stubbing의 목적과 설정.
- Mocks Aren’t Stubs — https://martinfowler.com/articles/mocksArentStubs.html — 상태·행위 검증과 mock/stub 차이.
- Test Double — https://martinfowler.com/bliki/TestDouble.html — 다섯 테스트 더블의 분류.
- `@MockitoBean` and `@MockitoSpyBean` — https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html — 빈 대체와 컨텍스트 캐시.
- Testing Client Applications — https://docs.spring.io/spring-framework/reference/testing/spring-mvc-test-client.html — HTTP 테스트 방식 비교.
- MockRestServiceServer (Spring Framework 7.0.9 API) — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/client/MockRestServiceServer.html — RestClient 바인딩 API.
- Stubbing (WireMock) — https://wiremock.org/docs/stubbing/ — HTTP stub 설정.
- Clock (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/time/Clock.html — 시계 주입과 테스트.
