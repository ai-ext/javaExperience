# P03. 애노테이션이란 — 그리고 실무에서 매일 쓰는 애노테이션 총정리

> 애노테이션은 컴파일러·빌드 도구·Spring 같은 프레임워크가 읽는 선언형 메타데이터다.  
> 애노테이션 이름보다 누가 언제 읽고 어떤 동작으로 연결하는지 알아야 한다.  
> 웹 입력에는 바인딩과 검증을 함께 적용하고, 객체 등록·주입·트랜잭션 경계는 서로 다른 역할로 구분한다.

## 1. 한 줄로 말하면

애노테이션은 클래스·메서드·필드 등에 붙이는 메타데이터다. 컴파일러는 `@Override`를 검사하고 Lombok 프로세서는 코드를 생성하며 Spring은 `@RestController` 같은 표시를 읽어 프레임워크 동작을 연결한다. 읽고 실행하는 주체가 없으면 애노테이션만으로 동작하지 않는다.

직접 만든 것을 읽는 실행 예제는 3절, `Retention`·프로세서·리플렉션 내부는 → J06 참조.

## 2. 당장 알아야 할 것

아래 Spring 코드 조각은 설명용이며 미실행이다.

### 2.1 컴포넌트 등록과 설정 메서드

`@Component` 계열은 컴포넌트 스캔 후보이며, `@Service`, `@Repository`, `@Controller`는 역할을 표시한다. `@Bean` 메서드는 반환 객체를 빈으로 등록한다.

```java
@Service
class OrderService { }

@Configuration
class ClockConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
```

### 2.2 생성자 주입과 빈 선택

단일 생성자에는 `@Autowired`를 생략할 수 있다. 같은 타입 빈이 여럿이면 기본 후보에 `@Primary`, 주입 지점에 `@Qualifier`를 쓴다. 생성자 주입을 기본으로 한다.

```java
@Service
class CheckoutService {
    CheckoutService(@Qualifier("stripeGateway") PaymentGateway gateway) { }
}
```

설정 하나는 `@Value`, 설정 묶음은 `@ConfigurationProperties`로 바인딩한다. 후자는 스캔 또는 `@EnableConfigurationProperties`로 등록한다.

### 2.3 웹 매핑과 입력 위치

```java
@RestController
@RequestMapping("/api/orders")
class OrderController {
    @GetMapping("/{id}") OrderView one(@PathVariable("id") long id) { ... }
    @GetMapping List<OrderView> list(@RequestParam(name="email", required=false) String email) { ... }
    @PostMapping OrderView create(@RequestBody CreateOrder body) { ... }
}
```

`@PathVariable`은 `/orders/17`의 경로 조각, `@RequestParam`은 `?email=a@b.com` 쿼리, `@RequestBody`는 JSON 본문을 읽는다. 공통 매핑은 `@RequestMapping`, HTTP별 매핑은 `@GetMapping`·`@PostMapping` 등으로 분리한다.

### 2.4 요청 검증

```java
record CreateOrder(@NotBlank String customer, @Email String email,
                   @Size(min=1, max=64) String sku) { }

@PostMapping
OrderView create(@Valid @RequestBody CreateOrder request) { ... }
```

인자에 `@Valid`를 붙여 제약을 실행한다. `@NotNull`은 null, `@NotBlank`는 공백 문자열, `@Size`는 길이, `@Email`은 형식을 검사한다. 제약과 함께 Validation starter가 필요하다. Spring `@Validated`는 그룹 검증이나 메서드 검증에 쓴다.

### 2.5 예외 응답

`@ExceptionHandler`는 예외 처리 메서드, `@RestControllerAdvice`는 여러 컨트롤러에 적용하는 전역 처리기다. 팀 오류 응답 형식은 Advice에서 상태·코드·메시지로 통일한다.

### 2.6 JPA와 트랜잭션

`@Entity`·`@Id`·`@GeneratedValue`·`@Column`은 엔티티와 식별자·컬럼을, `@OneToMany` 등은 관계를 매핑한다. `@Transactional`은 별도인 Spring 트랜잭션 경계다. 관계의 소유 측·지연 로딩은 → S09 참조.

### 2.7 프로파일

`@Profile("local")` 빈은 해당 프로파일에서만 등록된다. 환경별 설정은 `application-local.yml` 등으로 분리하고 비밀값은 저장소에 두지 않는다(→ S04 참조).

### 2.8 테스트 범위 선택

`@SpringBootTest`는 전체 컨텍스트, `@WebMvcTest`는 MVC 슬라이스, `@DataJpaTest`는 JPA 슬라이스를 올린다. Spring 테스트 컨텍스트의 mock 빈은 Framework 7 `@MockitoBean`으로 대체한다. Boot 4.1 import:

```java
org.springframework.boot.test.context.SpringBootTest
org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
org.springframework.test.context.bean.override.mockito.MockitoBean
```

→ S18 참조.

### 2.9 Lombok

Lombok은 접근자·생성자·빌더·로거 코드를 컴파일 시 생성한다. `@Data`는 `equals`·`hashCode`·`toString`까지 만들기 때문에 JPA 연관 객체에 무심코 붙이지 말고 필요한 기능만 고른다.

### 2.10 자주 혼동하는 쌍

| 비교 | 선택 |
|---|---|
| `@Component` / `@Bean` | 스캔 가능한 내 클래스 / 생성 방법을 지정할 외부 객체 |
| `@Controller` / `@RestController` | 뷰 반환 / 응답 본문 반환 |
| `@Valid` / `@Validated` | 표준 DTO 제약 / Spring 그룹·메서드 검증 |
| `@RequestParam` / `@PathVariable` | 검색·페이지 쿼리 / 경로의 자원 식별자 |

## 3. 따라 하기

DB 없이 검증·라우팅 애노테이션을 연결하는 최소 API다. Java 25, Spring Boot 4.1.1 기준. (Spring 예제, 미실행)

### 1단계: 의존성 추가

프로젝트 루트 `build.gradle.kts`:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}
java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}
repositories { mavenCentral() }
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
}
```

Maven은 parent `spring-boot-starter-parent:4.1.1`과 두 starter를 쓰고 Boot Maven plugin도 `4.1.1`로 맞춘다.

**확인:** `./gradlew dependencies --configuration runtimeClasspath`에 두 starter가 보이는지 확인한다.

### 2단계: 애플리케이션 진입점 작성

`src/main/java/com/example/annotations/AnnotationApplication.java`:

```java
package com.example.annotations;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AnnotationApplication {
    public static void main(String[] args) { SpringApplication.run(AnnotationApplication.class, args); }
}
```

**확인:** `./gradlew bootRun` 후 로그에 `Started AnnotationApplication`이 표시되는지 본다.

### 3단계: 입력 DTO와 컨트롤러 작성

`src/main/java/com/example/annotations/CreateOrderRequest.java`:

```java
package com.example.annotations;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(@NotBlank String customerName,
        @NotBlank @Email String email, @NotBlank @Size(max = 64) String sku) { }
```

`src/main/java/com/example/annotations/OrderController.java`:

```java
package com.example.annotations;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody CreateOrderRequest body) {
        return Map.of("accepted", true, "sku", body.sku());
    }

    @GetMapping("/{id}")
    public String find(@PathVariable("id") long id,
            @RequestParam(name = "view", defaultValue = "full") String view) {
        return "id=" + id + ",view=" + view;
    }
}
```

**확인:** `./gradlew bootRun` 후 `curl -i -X POST http://localhost:8080/api/orders -H 'Content-Type: application/json' -d '{"customerName":"민수","email":"minsu@example.com","sku":"BOOK-1"}'`을 호출한다. `201 Created`와 `{"accepted":true,"sku":"BOOK-1"}` 응답을 확인한다. `customerName`이 빈 문자열이면 `400 Bad Request`; `GET /api/orders/10?view=brief`는 `id=10,view=brief`를 반환한다.

### 4단계: 애노테이션을 직접 읽기

전체 코드는 `_scratch/P03/AnnotationDemo.java`에 저장해 실행했다. 런타임 보존 설정 후 메서드 애노테이션 값을 리플렉션으로 읽는다.

```java
import java.lang.annotation.*;
public class AnnotationDemo { @Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD) @interface UseCase { String value(); }
    static class OrderService { @UseCase("create-order") public void create() {} }
    public static void main(String[] args) throws Exception { var m = OrderService.class.getMethod("create"); System.out.println(m.getAnnotation(UseCase.class).value()); }
}
```

실행 명령: `java _scratch/P03/AnnotationDemo.java`

실제 출력:

```text
create-order
```

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@Component`, `@Service`, `@Repository` | 스캔해 빈 등록; 역할 표현 | `@Service class OrderService {}` | `@Service`가 트랜잭션을 자동 설정하진 않음. `@Repository`는 저장소 예외 변환 대상 표시 |
| `@Controller`, `@RestController` | MVC 처리 | `@RestController` | 전자는 기본적으로 뷰, 후자는 응답 본문을 반환 |
| `@Configuration`, `@Bean` | 설정과 명시적 빈 생성 | `@Bean Clock clock()` | 반환 객체 생성 경로 제어에 사용 |
| `@Autowired`, `@Qualifier`, `@Primary` | 의존성 선택·주입 | `@Qualifier("fastClient")` | 단일 생성자 주입은 `@Autowired` 생략 가능 |
| `@Value` | 속성 하나 주입 | `@Value("${app.region}") String region` | 관련 설정은 `@ConfigurationProperties`로 묶기 |
| `@RequestMapping`, `@GetMapping` 등 | 경로·HTTP 메서드 매핑 | `@PostMapping("/orders")` | 경로와 메서드 충돌 시 시작 오류 |
| `@PathVariable`, `@RequestParam`, `@RequestBody` | 경로·쿼리·본문 바인딩 | `@PathVariable("id") long id` | JSON 본문에는 올바른 `Content-Type` 필요 |
| `@ResponseStatus`, `@ExceptionHandler`, `@RestControllerAdvice` | 상태 지정·예외 응답 | `@ExceptionHandler(NotFound.class)` | 전역 Advice로 오류 형식을 통일 |
| `@Valid`, `@Validated`, `@NotNull`, `@NotBlank`, `@Size`, `@Email` | 객체·메서드 검증과 제약 선언 | `@Valid @RequestBody Input body` | 검증 의존성과 실행 지점이 모두 있어야 함; `@Email`만으로 필수는 아님 |
| `@Entity`, `@Id`, `@GeneratedValue`, `@Column` | 엔티티·식별자·컬럼 매핑 | `@Entity class Order { @Id Long id; }` | DB에 맞는 생성 전략과 영속성 규칙을 확인 |
| `@OneToMany` 등 | JPA 연관관계 | `@OneToMany(mappedBy="order")` | 양방향의 소유 측과 동기화 필요 |
| `@Transactional` | Spring 트랜잭션 경계 | `@Transactional public void place()` | 프록시 호출 경계를 통과해야 적용 |
| `@ConfigurationProperties`, `@Profile` | 설정 묶음·환경별 빈 | `@Profile("local")` | 설정 객체는 스캔 또는 명시 등록 |
| `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`, `@MockitoBean` | 통합·MVC·JPA 테스트, 빈 대체 | `@WebMvcTest(OrderController.class)` | 테스트 범위에 맞는 구성만 올림; Boot 4 패키지는 2.8절 참고 |
| Lombok `@Getter`, `@Setter`, `@RequiredArgsConstructor`, `@Builder`, `@Data`, `@Slf4j` | 접근자·생성자·빌더·로거 생성 | `@RequiredArgsConstructor` | 필요한 것만 선택; `@Data`는 엔티티 연관관계에 주의 |

## 5. 자주 나는 에러와 해결

1. **`No qualifying bean of type '...OrderService' available` →** 클래스가 스캔 범위 밖이거나 stereotype이 없어 빈이 등록되지 않았다. → 메인 애플리케이션 패키지 아래에 두고 `@Service` 등으로 등록한다. 의존성을 임의로 `new` 해서 컨테이너 밖 객체로 만들지 않는다.
2. **`Not a managed type: class ...` →** JPA가 타입을 엔티티로 인식하지 못한다. → `jakarta.persistence.Entity`를 import했는지, `@Entity`가 있는지, 엔티티 스캔 범위 안인지 확인한다. Boot 4에서는 구 `javax.persistence`와 혼용하지 않는다.
3. **빈 값인데도 요청이 통과하거나 `NoProviderFoundException` →** 필드 제약만 있고 `@Valid`가 없거나, Validation 구현체 의존성이 없다. → 컨트롤러 인자에 `@Valid`를 붙이고 Boot Validation starter가 runtime classpath에 들어 있는지 확인한다.
4. **`415 Unsupported Media Type` 또는 `HttpMessageNotReadableException` →** 요청의 `Content-Type`이 맞지 않거나 본문 JSON이 DTO 형태와 다르다. → `Content-Type: application/json`을 보내고 필드명·자료형·JSON 문법을 DTO에 맞춘다.
5. **`Ambiguous mapping. Cannot map ...` →** 같은 HTTP 메서드와 경로를 여러 handler가 선언했다. → 클래스·메서드 매핑을 펼쳐 충돌을 찾고 URL 또는 HTTP 메서드를 분리한다.

## 6. 한 단계 더

애노테이션은 선언 위치와 속성으로 메타데이터를 남기고, 프레임워크가 이를 스캔하거나 호출 시 읽어 객체 생성·인자 변환·검증·프록시 같은 동작과 연결한다. 같은 `@Transactional`도 호출 경계가 프록시를 통과하지 않으면 기대한 효과가 나지 않을 수 있다.

따라서 애노테이션을 발견하면 먼저 적용 대상, 읽는 주체, 읽는 시점, 실제 실행 조건을 확인한다. 내부 메커니즘 → J06, 빈 등록·주입 → S01/P11, 요청 처리 → S05, 트랜잭션 → S08, JPA → S09, 설정 → S04, 테스트 → S18 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. `@Service`를 붙이면 그 클래스가 자동으로 실행되는가?**  
아니다. 애노테이션 표시는 빈 등록 자체가 아니다.  
컴포넌트 스캔이 후보를 찾아 빈 정의로 등록해야 한다.  
컨테이너가 만든 빈에 의존성 주입과 후처리가 적용된다.  
**꼬리질문: 애플리케이션 바깥에서 직접 `new` 하면?** Spring 관리가 적용되지 않아 주입·프록시 같은 기능을 기대할 수 없다.

**Q2. `@Component`와 `@Bean` 중 무엇을 고르는가?**  
내가 작성하고 스캔할 클래스에는 `@Component` 계열을 붙인다.  
외부 라이브러리 타입은 선언부를 수정할 수 없으므로 `@Bean`으로 등록한다.

팩토리·생성자 인자를 조절할 때도 `@Bean`이 알맞다.  
**꼬리질문: `@Bean` 메서드를 아무 클래스에나 두면 같은가?** 설정 클래스 방식과 일반 컴포넌트 방식의 메서드 호출 의미가 다를 수 있어 설정 목적에는 `@Configuration`을 둔다.

**Q3. `@Valid`와 `@Validated`는 어떻게 구분하는가?**  
일반 DTO 제약 실행에는 표준 `@Valid`가 보통 충분하다.  
Spring `@Validated`는 그룹 선택과 메서드 파라미터 검증을 제공한다.  
메서드 검증은 프록시 경유 호출이어야 적용된다.  
**꼬리질문: 메서드 검증이 켜져 있는데 호출해도 실행되지 않는 경우는?** 동일 객체 내부에서 자기 메서드를 직접 부르면 프록시 경계를 건너뛸 수 있다.

**Q4. `/orders/10`과 `/orders?id=10`에는 무엇을 붙이는가?**  
경로에서 리소스를 식별할 때 `@PathVariable`을 쓴다.  
`@RequestParam`은 검색·정렬·페이지처럼 선택 가능한 조건에 알맞다.

각 위치를 구분하면 API URL의 의미와 필수 여부가 분명해진다.  
**꼬리질문: 필수 쿼리가 아니면?** `required=false`나 기본값을 선언하고 Java 타입도 null 가능성에 맞춘다.

**Q5. DTO에 `@NotBlank`를 썼는데 검증되지 않는 이유는?**  
DTO의 제약은 검사 규칙만 선언하고 실행 지점은 선언하지 않는다.  
컨트롤러 인자에 `@Valid`를 붙여 바인딩 뒤 검증을 요청한다.  
Validation starter가 없으면 제약 구현체가 없을 수 있다.  
**꼬리질문: `@Email`만 쓰면 입력은 필수인가?** 아니다. null을 허용할 수 있으므로 필수 이메일이면 `@NotBlank`도 둔다.

**Q6. 단위 테스트에서 `@SpringBootTest`를 항상 써야 하는가?**  
아니다. 전체 구성의 통합 확인이면 `@SpringBootTest`를 선택한다.

MVC 요청은 `@WebMvcTest`, JPA 매핑·쿼리는 `@DataJpaTest`로 줄인다.  
작은 컨텍스트는 테스트 범위가 선명하고 시작 부담도 줄인다.  
**꼬리질문: `@MockitoBean`과 Mockito `@Mock`의 차이는?** 전자는 Spring 테스트 컨텍스트의 빈을 대체하고, 후자는 일반 객체 mock을 만들어 테스트에서 직접 주입·사용한다.

## 8. 참고문헌

- Classpath Scanning and Managed Components — https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html — 스캔과 빈 등록.
- Handler Methods — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html — MVC 핸들러 인자와 응답.
- Java Bean Validation — https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html — Spring 검증 연계.
- Jakarta Validation — https://jakarta.ee/specifications/bean-validation/ — 표준 제약 검증.
- Externalized Configuration — https://docs.spring.io/spring-boot/reference/features/external-config.html — `@Value`·`@ConfigurationProperties`.
- WebMvcTest (Spring Boot 4.1.1 API) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/webmvc/test/autoconfigure/WebMvcTest.html — MVC 슬라이스와 import.
- SpringBootTest (Spring Boot 4.1.1 API) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/test/context/SpringBootTest.html — 통합 테스트 애노테이션.
- DataJpaTest (Spring Boot 4.1.1 API) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html — JPA 슬라이스와 import.
- MockitoBean (Spring Framework 7.0.9 API) — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/context/bean/override/mockito/MockitoBean.html — 테스트 빈 대체.
- Lombok features — https://projectlombok.org/features/ — 코드 생성 애노테이션.
