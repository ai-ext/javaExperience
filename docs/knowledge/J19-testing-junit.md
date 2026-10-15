# J19. Java 단위 테스트 (JUnit·Mockito·AssertJ)

> 기준일(2026-09-28)의 Boot 4.1.1 관리 버전은 JUnit Jupiter 6.0.3, Mockito 5.23.0, AssertJ 3.27.7이다.
> 좋은 단위 테스트는 공개 동작을 빠르고 결정론적으로 검증하며, mock은 외부 협력자의 경계에 한정한다.
> 커버리지 수치는 실행된 바이트코드의 양이지, 요구사항을 제대로 검증했다는 증거가 아니다.

## 1. 왜 알아야 하나

`@BeforeEach`에서 만든 객체를 `PER_CLASS`로 바꾼 뒤 테스트 간 상태가 새어 나가면, 단독 실행은 통과하고 전체 실행만 실패한다. `spy`에 `when(spy.load()).thenReturn(...)`을 쓰면 스텁을 설정하는 순간 실제 `load()`가 먼저 호출돼 파일·DB 접근이 발생할 수 있다.

Mockito의 static mock을 닫지 않으면 같은 스레드에서 뒤에 실행되는 테스트까지 영향받는다. 모두 테스트가 있다는 사실만으로는 막을 수 없는 결함이다.

또한 line coverage가 100%여도 결과를 단 한 번도 검증하지 않는 테스트라면 잘못된 구현을 통과시킬 수 있다. 테스트 수나 커버리지 숫자를 목표로 삼으면 유지비만 늘고 회귀를 못 잡는 테스트가 생긴다. 여기서는 테스트 러너의 흐름, 테스트 더블 선택, 입력 경계와 협력 계약의 검증법을 연결한다.

범위는 JVM 안에서 실행하는 단위 테스트다. Spring 컨텍스트·슬라이스 테스트와 Testcontainers는 → S18 참조.

## 2. 핵심 개념

| 용어 | 뜻 | 실무 판단 |
|---|---|---|
| 단위 테스트 | 한 단위의 공개 동작을 빠르고 격리해 확인 | 단위는 클래스보다 규칙의 경계로 정한다. |
| JUnit Platform | 테스트 발견·엔진 실행을 맡는 공통 기반 | IDE·Gradle·Maven이 같은 실행 인터페이스를 쓴다. |
| JUnit Jupiter | JUnit 프로그래밍·확장 모델과 실행 엔진 | `@Test`, `@BeforeEach`, `@ParameterizedTest` 제공. |
| JUnit Vintage | Platform에서 JUnit 3/4를 실행하는 엔진 | 마이그레이션을 마치면 제거한다. |
| assertion | 기대 결과와 실제 결과를 비교해 실패를 보고 | Arrange–Act–Assert의 Assert 단계다. |
| 테스트 더블 | 테스트에서 협력 객체를 대신하는 객체 | stub·mock·spy·fake·dummy 역할을 구분한다. |
| stub | 호출에 미리 정한 값을 돌려주는 더블 | 계산 결과에 필요한 입력 경계를 만든다. |
| mock | 호출 여부·횟수·인자를 검증하는 더블 | 메일 발송처럼 관찰 가능한 협력 계약에 쓴다. |
| spy | 실제 객체에 위임하면서 호출을 기록하거나 일부 동작을 바꾸는 더블 | 실제 동작이 실행될 수 있음을 전제로 다룬다. |
| fake | 실제 구현보다 단순하지만 동작하는 대체 구현 | 인메모리 저장소처럼 프로토콜을 재현할 때 쓴다. |
| dummy | 호출되지 않고 자리만 채우는 값 | 테스트에서 사용되지 않는 필수 인자에 한정한다. |
| JaCoCo | 클래스 파일을 계측해 실행 커버리지를 계산하는 도구 | 품질의 충분조건이나 테스트 정확도 점수가 아니다. |

`stub`과 `mock`은 Mockito에서 같은 생성 함수로 만들 수 있어도 역할이 다르다. stub은 반환값을 제공하고 mock은 호출을 검증한다. spy 용어는 문헌마다 조금씩 다르므로 더블의 이름보다 검증 목적을 먼저 합의한다.

| 헷갈리는 쌍 | 차이 | 선택 기준 |
|---|---|---|
| mock vs spy | mock은 답을 설정하고, spy의 미설정 호출은 실제 구현에 위임한다. | 대체는 mock, 레거시 일부 덮기는 spy. 가능하면 의존성을 분리한다. |
| `when` vs `doReturn` | `when`은 대상 호출을 먼저 평가하고, `doReturn`은 spy 메서드를 호출하지 않는다. | mock은 `when`; spy 호출에 부작용이 있으면 `doReturn`. |
| 상태 검증 vs 행위 검증 | 최종 값·상태를 검사 vs 외부 호출의 종류·횟수·인자를 검사 | 비즈니스 결과는 상태, 외부에 남는 효과는 필요한 만큼 행위로 본다. 내부 호출 순서를 과하게 고정하지 않는다. |
| 커버리지 vs 테스트 강도 | 실행한 코드 비율 vs 오류를 넣었을 때 테스트가 실패하는 정도 | 커버리지는 빈틈을 찾는 지도, assertion과 검토가 검증력의 근거다. |

**기준 의존성.** Boot 4.1.1은 JUnit Jupiter 6.0.3, Mockito 5.23.0, AssertJ 3.27.7을 관리한다. BOM 사용 시 버전을 반복하지 않는다. 순수 Gradle은 적절한 버전과 `useJUnitPlatform()`을 지정한다.

```kotlin
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.mockito:mockito-core")
    testImplementation("org.mockito:mockito-junit-jupiter")
    testImplementation("org.assertj:assertj-core")
}
tasks.test { useJUnitPlatform() }
```

## 3. 내부 동작·원리

### JUnit 실행 흐름

```text
Gradle / Maven / IDE
        │ Launcher API로 실행 요청
        ▼
JUnit Platform ── 테스트 클래스·메서드 탐색
        │ 엔진 선택
        ├── Jupiter Engine ── Jupiter 테스트·확장 실행
        └── Vintage Engine ── JUnit 3/4 테스트 실행(선택)
        │
        ▼
Extension 콜백 → 인스턴스 생성 → 라이프사이클 → 테스트 호출
        │                                  │
        └── ParameterResolver / 조건 / 인터셉터 ─┘
        ▼
Assertion 결과·예외 → TestExecutionListener → IDE·빌드 리포트
```

Platform은 실행 도구와 엔진을 분리해 같은 Launcher에서 Jupiter와 Vintage를 실행한다. Jupiter는 애노테이션뿐 아니라 엔진과 확장 모델도 제공한다. 발견된 테스트에 확장 콜백을 적용한 뒤 각 호출 결과를 보고하며, assertion 실패와 예상하지 않은 예외는 모두 실패다.

기본 생명주기 `PER_METHOD`는 테스트 메서드마다 새 인스턴스를 만들어 인스턴스 필드 공유를 막는다. `@BeforeEach`·`@AfterEach`는 테스트 invocation 전후에, `@BeforeAll`·`@AfterAll`은 클래스 전후에 한 번 실행된다.

후자는 기본 설정에서 `static`이어야 한다. `@TestInstance(PER_CLASS)`는 이를 풀지만 인스턴스 상태를 공유하므로 각 테스트가 fixture를 독립적으로 초기화한다.

`@ParameterizedTest`는 테스트 템플릿을 입력마다 실행한다. `@ValueSource`, `@EnumSource`, `@CsvSource`, `@MethodSource` 등이 인자를 제공하고 각 행은 별도 결과로 보고된다.

표는 CSV, 복잡·재사용 데이터는 method source가 알맞다. 6.0.3의 `@ParameterizedClass`는 공식 가이드에서 실험 기능으로 표시하므로 기본 선택은 `@ParameterizedTest`다.

Jupiter 확장은 공개 콜백으로 기능을 더한다. `@ExtendWith`는 선언적, `@RegisterExtension`은 필드 기반, `ServiceLoader`는 자동 등록이다. 생명주기·조건·파라미터 해석·호출 인터셉트가 확장 지점이다. `MockitoExtension`도 mock 필드 초기화와 테스트 후 검사를 이 모델에 연결한다.

### Mockito와 JaCoCo의 작동 방식

Mockito mock은 호출을 기록하고 stubbing 또는 기본 응답을 돌려준다. 검증은 호출 기록을 matcher와 비교한다. spy는 실제 인스턴스에 위임하므로 미설정 메서드의 부작용도 발생한다. Mockito 5는 바이트코드 변환형 inline mock maker를 기본으로 해 final 클래스 등 subclass 방식의 일부 제약을 줄였지만 모든 타입을 mock할 수 있다는 뜻은 아니다.

정적 mock은 `MockedStatic` 범위와 같은 스레드 안에서 작동하므로 try-with-resources로 닫는다. 시간·난수 등은 가능하면 `Clock`·ID 생성기처럼 주입하고, static mocking은 레거시 격리에 한정한다.

JaCoCo는 클래스 바이트코드에 probe를 넣어 실행 정보를 기록한 뒤 instruction·branch·line·method로 분석한다. line에는 디버그 정보가 필요하고 합성 코드 때문에 소스와 수치가 어긋날 수 있다. branch는 `if`·`switch`이며 예외 경로는 포함되지 않는다. 리포트는 미실행 경로를 찾고 요구사항은 assertion으로 확인한다.

## 4. 코드로 확인

### 예제 1 — 경계 입력을 파라미터화해 검증

`PricePolicy`는 `src/main/java`, 테스트는 `src/test/java`에 둔다. 의존성 버전은 Boot BOM이 관리한다.

```java
package example;

final class PricePolicy {
    long discount(long amount) {
        if (amount < 0) throw new IllegalArgumentException("amount must be non-negative");
        return amount < 10_000 ? 0 : amount / 10;
    }
}
```

```java
package example;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PricePolicyTest {
    private PricePolicy policy;

    @BeforeEach
    void setUp() { policy = new PricePolicy(); }

    @ParameterizedTest(name = "amount={0} -> discount={1}")
    @CsvSource({"9999, 0", "10000, 1000", "25000, 2500"})
    void appliesTenPercentAtTheThreshold(long amount, long expected) {
        assertThat(policy.discount(amount)).isEqualTo(expected);
    }

    @Test
    void rejectsNegativeAmounts() {
        assertThatThrownBy(() -> policy.discount(-1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("amount must be non-negative");
    }
}
```

`9999`/`10000`은 규칙의 양쪽 경계, `25000`은 일반 입력이다. AssertJ는 기대값과 실제값을 실패 메시지에 보여준다. 실제 Gradle 실행 결과다.

```text
CheckoutTest > sendsReceiptAfterPaymentIsApproved() PASSED
PricePolicyTest > appliesTenPercentAtTheThreshold(long, long) > amount="9999" -> discount="0" PASSED
PricePolicyTest > appliesTenPercentAtTheThreshold(long, long) > amount="10000" -> discount="1000" PASSED
PricePolicyTest > appliesTenPercentAtTheThreshold(long, long) > amount="25000" -> discount="2500" PASSED
PricePolicyTest > rejectsNegativeAmounts() PASSED
BUILD SUCCESSFUL in 3s
```

### 예제 2 — mock과 ArgumentCaptor로 외부 효과 검증

`PaymentGateway`는 호출 응답을 stub하고, 메일 대신 영수증을 전달받는 `ReceiptSender`는 행위 검증한다. 캡처 값으로 협력 호출의 실제 인자를 검사한다. 대상은 명시적으로 생성해 생성자 의존성을 숨기지 않는다.

```java
package example;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CheckoutTest {
    @Mock PaymentGateway gateway;
    @Mock ReceiptSender sender;

    @Test
    void sendsReceiptAfterPaymentIsApproved() {
        given(gateway.charge(1200)).willReturn(new ChargeResult(true, "tx-7"));

        try (MockedStatic<OrderIds> ids = mockStatic(OrderIds.class)) {
            ids.when(OrderIds::next).thenReturn("order-7");
            new CheckoutService(gateway, sender).checkout(1200);
            ArgumentCaptor<Receipt> receipt = ArgumentCaptor.forClass(Receipt.class);
            verify(sender).send(receipt.capture());
            assertThat(receipt.getValue()).isEqualTo(new Receipt("order-7", "tx-7", 1200));
        }
    }

    interface PaymentGateway { ChargeResult charge(long amount); }
    interface ReceiptSender { void send(Receipt receipt); }
    record ChargeResult(boolean approved, String transactionId) {}
    record Receipt(String orderId, String transactionId, long amount) {}

    static final class CheckoutService {
        private final PaymentGateway gateway;
        private final ReceiptSender sender;
        CheckoutService(PaymentGateway gateway, ReceiptSender sender) {
            this.gateway = gateway;
            this.sender = sender;
        }
        void checkout(long amount) {
            ChargeResult result = gateway.charge(amount);
            if (!result.approved()) throw new IllegalStateException("declined");
            sender.send(new Receipt(OrderIds.next(), result.transactionId(), amount));
        }
    }

    static final class OrderIds {
        static String next() { return UUID.randomUUID().toString(); }
    }
}
```

두 JUnit 테스트 클래스의 5개 invocation은 모두 통과했다.

```text
CheckoutTest > sendsReceiptAfterPaymentIsApproved() PASSED
BUILD SUCCESSFUL
```

### 예제 3 — 실행 가능한 fake로 저장소 경계 검증

fake는 `Map`으로 재고 동작을 실제처럼 제공하지만 DB·네트워크에 접근하지 않는다. 순수 Java 예제는 지정된 JDK 21로 실행했다.

```java
import java.util.HashMap;
import java.util.Map;

public class FakeInventoryDemo {
    interface StockStore {
        boolean reserve(String sku);
        int remaining(String sku);
    }
    static final class InMemoryStock implements StockStore {
        private final Map<String, Integer> stock = new HashMap<>(Map.of("book", 1));
        @Override
        public boolean reserve(String sku) {
            int count = stock.getOrDefault(sku, 0);
            if (count == 0) return false;
            stock.put(sku, count - 1);
            return true;
        }
        @Override
        public int remaining(String sku) { return stock.getOrDefault(sku, 0); }
    }
    public static void main(String[] args) {
        StockStore stock = new InMemoryStock();
        System.out.printf("reserved=%s; remaining=%d%n",
                stock.reserve("book"), stock.remaining("book"));
    }
}
```

```text
reserved=true; remaining=0
```

이 fake는 저장소 계약을 빠르게 테스트하기 좋다. SQL 문법, 트랜잭션 격리, DB 제약조건 검증은 대체하지 않는다. 그 경계 테스트는 → S18 참조.

## 5. 버전별 변화 — 왜 바뀌었나

| 시점 | 변화 | 이전 한계와 바뀐 이유 |
|---|---|---|
| JUnit 4 → JUnit 5 | Platform·테스트 엔진·Jupiter 모델을 분리하고 Vintage로 JUnit 3/4를 함께 실행한다. | 실행기와 프레임워크 결합을 낮추고 레거시와 새 모델을 공존시키려는 변화다. [JUnit 가이드](https://docs.junit.org/6.0.3/_exports/junit-user-guide-6.0.3.html) |
| JUnit 6.0 계열 | 최소 Java 17, Platform·Jupiter·Vintage 공통 버전 번호, 일부 폐기 API 제거. 기준일 Boot 4.1.1 관리는 6.0.3이다. | Java 8 호환 부담과 하위 프로젝트 버전 정렬 문제를 줄인다. [6.0.0-M1 릴리스 노트](https://docs.junit.org/6.0.0-M1/release-notes/) |
| Mockito 5.0 | inline mock maker를 기본으로 전환했다. 기준일 Boot 4.1.1 관리 버전은 5.23.0이다. | JDK 내부 API 변화에 대응해 subclass 기반의 제약을 줄이려는 선택이다. [Mockito v5.0.0 릴리스](https://github.com/mockito/mockito/releases/tag/v5.0.0) |
| AssertJ 3.17 이후 | recursive comparison은 `equals` 재정의 타입도 기본으로 필드 비교한다. | 필드 비교 기대와 `equals` 우선 동작의 차이를 줄였다. 자세한 변경은 [공식 가이드](https://assertj.github.io/doc/) 참조. |
| JaCoCo | 큰 변화 없음 — 카운터의 현재 정의는 [공식 문서](https://www.jacoco.org/jacoco/trunk/doc/counters.html) 참조. | 소스가 아닌 클래스 파일을 분석한다는 핵심 해석 기준을 사용한다. |

## 6. 실무 가이드

- **기본값:** JUnit Jupiter + AssertJ, 외부 경계에만 필요한 mock을 사용한다.
- 경계 입력 표는 `@CsvSource`, 짧은 값은 `@ValueSource`·`@EnumSource`, 복합 데이터는 `@MethodSource`로 표현한다.
- 기본 `PER_METHOD`를 유지한다. `PER_CLASS`는 공유 fixture가 꼭 필요할 때만 쓰고 매 테스트 초기화한다.
- 상태는 실제 객체·fake, 메일·결제 같은 외부 효과는 mock `verify`로 검사한다. 복합 인자는 captor, 고정값은 `eq`로 비교한다.
- 시간·ID는 주입하고 레거시 static mock만 try-with-resources에 제한한다. JaCoCo는 branch 누락을 찾는 용도로 쓴다.

### 작은 기능으로 Red-Green-Refactor를 완주하기 (보강)

Spring Boot 4.1·Java 25 프로젝트라도 순수한 정책 객체의 단위 테스트에는 `@SpringBootTest`를 붙이지 않는다. 컨텍스트를 띄우지 않고 JUnit Jupiter와 AssertJ로 객체를 직접 만들어, 새 테스트가 요구사항 한 가지만 검증하도록 한다. 아래 기능은 “주문 금액이 30,000원 이상이면 배송비 무료, 그 미만이면 3,000원”이다.

**Red:** 먼저 실패 테스트 하나만 쓴다. 아직 `ShippingFee`가 없으면 테스트가 컴파일되지 않으므로, `forSubtotal`이 일단 늘 3,000을 반환하는 얇은 골격을 둔다. 테스트는 실행되지만 임계값 30,000에서 기대값과 다르다는 assertion 실패가 난다. 컴파일 실패와 동작 실패를 구분한다.

**Green:** 실패를 없애는 최소 분기만 구현한다. 그 뒤 경계 바로 아래를 검증하는 두 번째 테스트를 추가해, 두 규칙이 함께 유지되는지 확인한다.

**Refactor:** 테스트 이름과 공개 동작 검증은 그대로 둔 채 금액을 상수로 추출한다. 내부 메서드 호출 순서나 분기 모양은 검증하지 않는다. 작은 변경 뒤 관련 테스트를 다시 실행한다.

```java
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ShippingFeeTest {
    @Test
    void waivesFeeAtFreeShippingThreshold() {
        assertThat(new ShippingFee().forSubtotal(30_000L)).isZero();
    }

    @Test
    void chargesFeeOneWonBelowThreshold() {
        assertThat(new ShippingFee().forSubtotal(29_999L)).isEqualTo(3_000L);
    }
}

final class ShippingFee {
    private static final long FREE_SHIPPING_FROM = 30_000L;
    private static final long STANDARD_FEE = 3_000L;

    long forSubtotal(long subtotal) {
        return subtotal >= FREE_SHIPPING_FROM ? 0L : STANDARD_FEE;
    }
}
```

첫 테스트의 이름은 무료 배송 경계를, 둘째는 경계 바로 아래의 유료 배송을 설명한다. 각각 해당 입력에서 반환되는 요금만 확인하므로 검증 범위가 좁고 실패 원인을 테스트 이름만으로 찾기 쉽다. 첫 Red 단계에서는 `STANDARD_FEE`를 그대로 반환하는 골격을 사용하고, 조건식을 넣은 뒤 두 테스트를 모두 실행한다. JUnit 및 AssertJ 버전은 Boot BOM에 맡긴다.

### Flaky 테스트를 격리하고 원인을 좁히기 (보강)

테스트 하나가 간헐적으로 실패하면 시간 제한부터 늘리지 말고, 실패한 테스트명·반복 번호·난수 seed·실행 순서·병렬 설정을 기록한다. 실패 테스트만 단독 실행하고, 같은 프로세스의 테스트 클래스, 전체 스위트 순으로 범위를 넓혀 재현 여부를 비교한다. 단독 실행에서는 통과하고 전체에서만 실패하면 공유 상태 가능성이 커진다.

그때 병렬 실행을 끄거나 순서를 섞어 다시 실행해 원인을 분리한다. 한 번에 한 조건만 바꿔야 어떤 조건이 재현에 영향을 줬는지 알 수 있다.

| 흔한 원인 | 격리·재현 방법 |
|---|---|
| 공유 fixture, static 필드, 정리되지 않은 파일 | 테스트마다 데이터를 새로 만들고 `@AfterEach` 또는 `try/finally`에서 회수한다. 임시 디렉터리는 JUnit `@TempDir`를 이용한다. 실패한 assertion 뒤에도 정리되는지 확인한다. |
| 현재 시각, sleep, 시간대 경계 | sleep으로 타이밍을 맞추지 않는다. 시각은 `Clock`으로 주입하고 경계 테스트는 고정된 시각으로 실행한다. CI와 로컬의 기본 시간대 차이도 기록한다. |
| 난수·UUID·컬렉션 순서 | 재현 가능한 seed를 주고 실패 로그에 남긴다. 정렬 계약이 없다면 집합의 순서에 기대지 말고, 순서가 요구사항이면 정렬 결과를 검증한다. |
| 공유 DB와 테스트 간 데이터 충돌 | 각 테스트가 고유한 tenant/key를 쓰고 해당 데이터만 삭제한다. 롤백에만 기대지 않는다. 특히 실제 HTTP 서버를 띄우는 `@SpringBootTest(RANDOM_PORT)`는 요청과 테스트 코드가 다른 스레드·트랜잭션에서 실행되므로 테스트 트랜잭션 롤백이 서버 쪽 변경을 되돌리지 않는다. |
| 병렬 실행의 공용 자원 충돌 | 테스트 순서에 의존하지 않게 만든다. JVM 안의 알려진 공용 자원은 JUnit `@ResourceLock`으로 직렬화할 수 있지만, 별도 프로세스나 CI worker까지 잠그지는 못한다. 그 경우 DB schema·파일 경로·포트·테스트 데이터를 worker별로 분리한다. |

Spring 테스트 컨텍스트는 설정이 같은 테스트 사이에서 캐시될 수 있다. 매 테스트에서 공유 컨텍스트나 전역 테이블 전체를 무작정 초기화하면 다른 테스트의 상태를 건드릴 수 있으므로, 자신이 만든 데이터만 정리하고 실제 DB 격리 수준을 확인한다.

Testcontainers를 JUnit 확장으로 종료하면서 캐시된 Spring 컨텍스트가 컨테이너를 계속 참조하는 조합도 확인한다. 컨텍스트와 서비스의 수명이 맞지 않으면 Boot가 관리하는 컨테이너 bean 방식을 고려한다.

속도는 한 번의 전체 테스트 시간만 보지 말고 CI에서 단위 테스트, slice 테스트(예: `@DataJpaTest`), 전체 컨텍스트·통합 테스트, 필요한 경우 종단 간 테스트를 각각 재고 추세를 남긴다. 단위 테스트는 빠른 피드백에, slice는 특정 기술 경계에, 전체 컨텍스트는 설정과 연결 검증에 쓴다.

컨텍스트 캐시가 켜진 반복 실행과 최초 기동은 시간이 다를 수 있으므로 차이를 구분해 기록한다. 느린 계층과 테스트를 찾아낸 뒤 그 경계에서만 필요한 검증을 남긴다.

**함정:** 전체 실행에서만 나는 실패를 반복 실행으로 덮거나 timeout을 늘리면 재현 정보가 사라진다. 실패 seed와 실행 조건을 보존하고, 공유 상태를 실제로 제거해 단독·클래스·전체 범위에서 다시 확인한다. `@ResourceLock` 하나로 DB나 여러 worker의 경합까지 해결된다고 가정하지 않는다.

참고: JUnit 6.0.3 User Guide — https://docs.junit.org/6.0.3/_exports/junit-user-guide-6.0.3.html
참고: Testing Spring Boot Applications — https://docs.spring.io/spring-boot/4.1/reference/testing/spring-boot-applications.html
참고: Testcontainers — https://docs.spring.io/spring-boot/4.1/reference/testing/testcontainers.html

## 7. 함정·안티패턴

1. **증상:** 전체 실행에서 필드 값이 섞인다 → **원인:** `PER_CLASS`·static fixture 공유 → **대처:** 기본 `PER_METHOD`, 공유 시 `@BeforeEach`에서 초기화.
2. **증상:** spy stubbing 때 네트워크가 실행된다 → **원인:** `when(spy.call())`이 실제 호출 → **대처:** 의존성 주입, 불가피하면 `doReturn(value).when(spy).call()`.
3. **증상:** static 응답이 다음 테스트에 남는다 → **원인:** `MockedStatic` 미종료 → **대처:** try-with-resources로 한 테스트에 한정한다.
4. **증상:** private 메서드 변경에 테스트가 깨진다 → **원인:** 내부 호출·순서를 계약으로 고정 → **대처:** 공개 결과와 외부 효과만 검증한다.
5. **증상:** 커버리지는 100%인데 오답이 통과한다 → **원인:** 실행만 하고 결과를 검증하지 않음 → **대처:** 경계별 assertion과 branch 입력을 추가한다.
6. **증상:** `verifyNoMoreInteractions`가 리팩터링마다 깨진다 → **원인:** 모든 내부 호출을 고정 → **대처:** 외부에서 관찰되는 부작용만 검증한다.
7. **증상:** `@ParameterizedClass`가 IDE에서 예상과 다르게 발견된다 → **원인:** JUnit 6.0.3에서 실험 기능 → **대처:** 안정 API `@ParameterizedTest`를 기본으로 쓴다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. JUnit Platform과 Jupiter는 같은 것인가?

아니다. Platform은 테스트를 발견해 엔진에 위임하고, Jupiter는 JUnit 테스트·확장 모델을 제공한다. Vintage 같은 다른 엔진도 Platform에서 실행한다.

**꼬리질문:** JUnit 4 테스트도 실행할 수 있나? **답:** Vintage Engine을 추가하면 되고, 이전 후 제거한다.

### Q2. `@BeforeAll`을 기본 설정에서 static으로 요구하는 이유는?

기본 `PER_METHOD`에서는 모든 테스트 전에 한 번 실행할 `@BeforeAll`을 특정 인스턴스에 둘 수 없어 static을 요구한다. `PER_CLASS`는 인스턴스 메서드를 허용하지만 필드도 공유한다.

**꼬리질문:** `PER_CLASS`가 순서를 보장하나? **답:** 아니다. 인스턴스만 공유하므로 테스트는 순서에 의존하면 안 된다.

### Q3. `@ParameterizedTest`와 반복 테스트의 차이는?

파라미터화 테스트는 다른 입력으로 규칙을 검증하고, 반복 테스트는 같은 호출을 반복한다. 경계 값 표라면 파라미터화가 적합하다.

**꼬리질문:** 복합 객체는 어떻게 공급하나? **답:** `@MethodSource`에서 만들고 invocation별 실패를 추적한다.

### Q4. mock과 stub은 무엇이 다른가?

stub은 설정한 값을 돌려주고, mock은 호출 자체를 검증한다. Mockito mock이 두 역할을 겸해도 테스트의 검증 계약은 구분한다.

**꼬리질문:** 저장 결과를 검증할 때 호출도 검증하나? **답:** 보통은 상태를 본다. 메시지 발송 등 외부 효과면 호출을 검증한다.

### Q5. spy에서 `when(...).thenReturn(...)`이 위험한 이유는?

`when()` 인자 호출이 먼저 평가된다. spy는 실제 객체에 위임하므로 파일 접근이나 예외가 발생할 수 있다. 먼저 의존성을 분리하고 꼭 필요한 경우 `doReturn`을 쓴다.

**꼬리질문:** 모든 mock에 `doReturn`을 쓸까? **답:** 아니다. 부작용을 피해야 하는 spy에 한정한다.

### Q6. ArgumentCaptor를 matcher 대용으로 써야 하나?

검증 시점에 인자를 캡처해 여러 필드를 검사할 때 쓴다. 고정값 비교라면 `verify(mock).send(expected)`가 간결하다. stubbing보다 verification에 둔다.

**꼬리질문:** generic 인자는? **답:** `@Captor`로 선언하고 캡처한 값의 타입과 내용을 확인한다.

### Q7. static mocking은 언제 쓰는가?

레거시 static 의존성을 분리하기 전 임시로 쓴다. `MockedStatic`은 같은 스레드의 try-with-resources 안에서 닫는다. 새 코드는 `Clock` 등을 주입한다.

**꼬리질문:** 클래스 전체에서 공유해도 되나? **답:** 피한다. 테스트 간 오염을 막도록 한 테스트에 한정한다.

### Q8. JaCoCo line coverage 100%면 테스트가 충분한가?

아니다. 실행됐다는 뜻일 뿐 결과 검증은 보장하지 않는다. exception 경로는 JaCoCo branch에도 포함되지 않는다. 핵심은 경계 입력과 assertion이다.

**꼬리질문:** 커버리지는 쓸모없나? **답:** 아니다. 미실행 코드·branch를 찾는 지표로 쓴다.

### Q9. AssertJ를 쓰는 이유와 recursive comparison의 주의점은?

fluent assertion은 조건과 실패 내용을 읽기 쉽게 한다. `assertThatThrownBy`, `SoftAssertions`, `usingRecursiveComparison()`이 대표 API다. 재귀 비교는 계약 밖의 내부 필드까지 고정하지 않게 주의한다.

**꼬리질문:** 항상 재귀 비교할까? **답:** 아니다. 도메인 `equals`나 핵심 필드 검증이 더 안정적일 수 있다.

## 9. 참고문헌

- JUnit 6.0.3 User Guide — https://docs.junit.org/6.0.3/_exports/junit-user-guide-6.0.3.html — 구조·생명주기.
- JUnit Parameterized Classes and Tests — https://docs.junit.org/6.0.3/writing-tests/parameterized-classes-and-tests.html — 인자 공급과 실험 API.
- JUnit Registering Extensions — https://docs.junit.org/6.0.3/extensions/registering-extensions.html — 확장 등록 방식.
- JUnit 6.0.0-M1 Release Notes — https://docs.junit.org/6.0.0-M1/release-notes/ — Java 17과 공통 버전.
- Spring Boot Managed Dependency Coordinates — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — 기준 의존성 버전.
- Mockito 5.23.0 Javadoc — https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html — stubbing·spy·captor·mock maker API.
- Mockito MockedStatic Javadoc — https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/MockedStatic.html — 정적 mock의 스레드 범위와 종료 규칙.
- Mockito v5.0.0 Release — https://github.com/mockito/mockito/releases/tag/v5.0.0 — inline maker 전환.
- AssertJ Core User Guide — https://assertj.github.io/doc/ — assertion 및 재귀 비교.
- JaCoCo Coverage Counters — https://www.jacoco.org/jacoco/trunk/doc/counters.html — 카운터 산출 원리.
- Martin Fowler, “Mocks Aren't Stubs” — https://martinfowler.com/articles/mocksArentStubs.html — stub/mock과 검증 유형.
