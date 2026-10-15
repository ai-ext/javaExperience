# S07. WebFlux·리액티브와 Virtual Threads 선택

> WebFlux는 논블로킹 I/O와 Reactive Streams 수요 제어를 끝까지 유지할 때 이점이 난다.
> Virtual Threads(VT)는 블로킹 방식의 코드를 유지하면서 대기 중인 작업의 스레드 비용을 낮춘다.
> 일반 CRUD의 기본 선택은 Spring MVC + VT이며, 리액티브 입출력·스트리밍이 실제 요구일 때 WebFlux를 고른다.

## 1. 왜 알아야 하나

WebFlux 컨트롤러에서 `JdbcTemplate`이나 `Thread.sleep()`을 호출하면, Netty 이벤트 루프가 반환할 때까지 다른 연결의 I/O 처리도 밀린다. MVC보다 적은 이벤트 루프 스레드에 여러 연결을 맡기는 구조라 막힌 루프 하나의 피해 반경이 크다. 지연과 대기열이 커지고 재시도가 겹치면 DB 부하까지 높아진다.

JDBC/JPA 중심 MVC에서 `spring.threads.virtual.enabled=true`만 켜도 모든 동시성 한계가 없어지지 않는다. Boot의 `AsyncTaskExecutor`·스케줄러와 서블릿 컨테이너의 HTTP executor는 다른 구성 지점이다. 속성이 바꿀 대상을 오해하면 `@Async`만 달라지고 요청 스레드는 그대로일 수 있다. DB 풀·외부 API 제한·CPU도 여전히 병목이다.

선택을 틀리면 코드만 복잡해지는 게 아니다. “리액티브니까 빨라졌다”는 가정으로 JDBC를 이벤트 루프에서 호출하거나, VT를 켜고 무제한 동시 DB 쿼리를 던져 커넥션 풀을 고갈시킬 수 있다. 프레임워크 모델, 라이브러리의 I/O 방식, 병목 자원 세 가지를 함께 봐야 한다.

## 2. 핵심 개념

| 용어 | 뜻 | 실무에서 기억할 점 |
|---|---|---|
| Reactive Streams | `Publisher`, `Subscriber`, `Subscription`을 중심으로 비동기 스트림과 수요 제어를 정의하는 규약 | 프로토콜이지 스레드 풀이나 특정 서버 구현 자체는 아니다. |
| `Mono<T>` | Reactor의 0개 또는 1개 결과 publisher | 단건 HTTP 응답, 단건 조회 결과에 흔히 쓴다. |
| `Flux<T>` | Reactor의 0개부터 여러 개 결과 publisher | 컬렉션, 스트림 응답처럼 여러 요소가 흐를 때 쓴다. |
| Backpressure | 구독자가 처리 가능한 만큼 `request(n)`으로 수요를 알리는 흐름 제어 | 데이터 생산 속도를 조절해 과속 생산자가 소비자를 압도하는 일을 줄인다. 모든 외부 시스템까지 자동 제한하는 기능은 아니다. |
| Event loop | 연결 이벤트를 소수의 전용 스레드에서 처리하는 I/O 실행 모델 | 루프 스레드에서 오래 걸리는 동기 작업을 실행하면 그 루프가 맡은 연결들이 함께 지연된다. |
| Virtual Thread | JVM이 제공하는 경량 Java thread. Java 21에서 정식 기능(JEP 444)이 됐다. | 블로킹 코드의 동시성 비용을 줄이는 실행 방식이다. 세부 구현은 → J12 참조. |
| `Scheduler` | Reactor 작업을 어느 실행 문맥에서 수행할지 지정하는 추상화 | `publishOn`과 `subscribeOn`은 서로 다른 위치·범위에 영향을 준다. |
| `TaskExecutor` / `TaskScheduler` | Spring의 비동기 작업 실행기 / 예약 실행기 | `@Async`와 `@Scheduled`는 별도 경로다. 서블릿 connector executor와도 같은 빈이라고 단정하지 않는다. |

### MVC + VT와 WebFlux 비교

| 판단 기준 | Spring MVC + Virtual Threads | Spring WebFlux |
|---|---|---|
| 프로그래밍 모델 | 요청 하나를 순차적인 일반 메서드 호출로 처리 | `Mono`·`Flux`를 조립해 비동기 결과를 반환 |
| I/O 호출 | JDBC/JPA 등 블로킹 라이브러리를 자연스럽게 호출. 요청을 처리하는 실제 executor도 VT를 쓰도록 설정해야 한다. | 논블로킹 HTTP·DB 클라이언트가 체인 전체에 있어야 장점이 난다. 블로킹 호출은 별도 스케줄러로 격리한다. |
| 동시 대기 요청 | VT가 블로킹 대기 비용을 줄인다. DB·외부 시스템의 동시성 한도는 그대로다. | 적은 이벤트 루프 스레드로 많은 I/O 대기 연결을 다룰 수 있다. |
| 데이터 흐름 제어 | MVC 기본 모델에는 Reactive Streams demand 전파가 없다. | 스트림 안에서 `request(n)` 기반 demand와 취소를 전파할 수 있다. |
| 잘 맞는 상황 | 전형적인 CRUD, JDBC/JPA, 동기 라이브러리, 명령형 코드의 추적·디버깅이 중요한 팀 | WebClient·리액티브 데이터 드라이버를 통한 다중 I/O 조합, 장기 스트리밍, 기존 리액티브 파이프라인 |
| 주요 위험 | 무제한 동시성으로 DB 풀·외부 서비스가 먼저 포화됨 | 이벤트 루프 블로킹, publisher를 직접 구독, 숨은 버퍼·취소 미처리, 잘못된 스케줄러 전환 |

Spring MVC와 WebFlux 모듈은 함께 존재한다. MVC 앱에서 `WebClient`를 쓰는 것만으로 애플리케이션 전체를 WebFlux로 바꿀 이유는 없다. 반대로 WebFlux 서버를 골랐다고 데이터 접근 계층이 자동으로 논블로킹이 되는 것도 아니다. [1][3]

## 3. 내부 동작·원리

### 3.1 MVC + VT 요청 경로

```text
HTTP 연결
  → Tomcat connector의 요청 executor
  → DispatcherServlet → Controller → Service → JDBC/JPA
  → 응답
```

서블릿 모델은 보통 요청을 스레드 하나로 실행하고, I/O 대기 중에도 그 스레드를 점유한다. VT를 요청 executor에 연결하면 대기 비용은 낮아져도 DB 작업 시간은 사라지지 않는다. 따라서 DB 커넥션·쿼리 동시 수와 외부 호출을 제한한다.

`spring.threads.virtual.enabled`는 Boot가 관리하는 작업 실행·예약 구성에 영향을 준다. Boot의 `AsyncTaskExecutor`는 `@EnableAsync`, MVC 비동기 처리 등에 연결되며, 사용자 `Executor`나 `AsyncConfigurer`가 있으면 자동 구성 조건이 달라진다. 이 목록이 Tomcat connector executor까지 자동 변경한다는 뜻은 아니다.

요청 스레드에 VT를 쓰려면 Tomcat executor를 따로 설정한다. Tomcat 11은 작업마다 VT를 만드는 `VirtualThreadExecutor`를 제공한다. [2][7]

### 3.2 WebFlux 요청과 Reactive Streams 수요

일반적인 리액티브 컨트롤러 경로는 다음과 같다.

```text
요청 소켓
  → Reactor Netty 이벤트 루프
  → WebFilter / DispatcherHandler / Controller
  → Publisher 구독
  → Subscription.request(n)
  → 데이터가 demand에 맞춰 전달되고 응답 소켓으로 기록
```

Spring의 `HttpHandler`는 논블로킹 I/O와 Reactive Streams backpressure를 묶는 서버 추상화다. Reactor Netty뿐 아니라 Tomcat·Jetty 등의 어댑터도 있지만, WebFlux라는 이름이 Netty만 지원한다는 뜻은 아니다. 중요한 것은 서버 이름보다 애플리케이션 호출 경로가 블로킹되지 않고 수요 신호를 전달하는가다. [3]

신호는 `subscribe`와 `onSubscribe`로 시작한다. 소비자는 `request(n)`으로 수요를 알리고 publisher는 요청량 이내로 `onNext`를 보낸다. 종료·실패는 `onComplete`·`onError`, 중단은 `cancel()`로 표현한다. `Mono`는 0~1개, `Flux`는 0~N개 결과를 다룬다. 모든 publisher가 cold한 것은 아니므로 hot source의 취소·버퍼 정책도 살핀다.

backpressure는 수요를 전달하지만 큐 크기·동시 실행 수·외부 시스템 처리량을 저절로 제한하지 않는다. 버퍼, 운영 한도, timeout, 취소 전파를 함께 확인한다.

### 3.3 이벤트 루프에서 블로킹하면 생기는 일

이벤트 루프는 소수의 스레드가 연결의 I/O 이벤트를 받아 짧은 핸들러를 실행한다. `JdbcTemplate`, `RestTemplate`, `Thread.sleep`, 동기 파일 읽기가 결과를 기다리면 같은 루프의 다른 연결도 처리하지 못한다. 높은 처리량은 callback이 빨리 반환한다는 전제에서 나온다.

```text
이벤트 루프 A: 요청 1 → JDBC 대기 ───────────────→ 응답 생성
                       요청 2 읽기 지연
                       요청 3 응답 쓰기 지연
```

`Mono.block()` 등으로 흐름을 동기 대기시키는 것도 위험하다. Reactor는 `parallel`·`single` 문맥에서 blocking API 사용을 예외로 드러낼 수 있다. 예외를 회피하지 말고 호출을 비동기로 바꾸거나 격리한다. [4]

### 3.4 Reactor scheduler로 레거시 블로킹 호출 격리

```text
이벤트 루프 ── 비동기 체인 ──> boundedElastic 작업 큐 → 블로킹 호출 전용 worker
       <──────── 결과 신호 ────────────────────────────────┘
```

`Mono.fromCallable(blockingCall).subscribeOn(Schedulers.boundedElastic())`로 블로킹 source를 감싸 별도 scheduler에서 실행한다. `subscribeOn`은 source 실행에, `publishOn`은 연산자 뒤의 신호 처리에 영향을 준다. `publishOn`을 뒤에 추가한다고 먼저 실행한 blocking 호출이 옮겨지지는 않는다. [4]

`boundedElastic`은 불가피한 동기 I/O를 격리하는 장치이지 무한 용량의 풀이 아니다. 대기열·동시 실행·timeout을 제한한다. 호출량이 크면 MVC + VT 또는 리액티브 드라이버를 포함한 경로를 검토한다.

## 4. 코드로 확인

다음 예제는 Spring Boot 4.1 / Spring Framework 7 기준이다. 실행 환경에는 `spring-boot-starter-web` 또는 `spring-boot-starter-webflux` 등 각 예제에 필요한 의존성이 있어야 한다. 모두 Spring 예제이며 여기서는 실행하지 않았다. **(미실행)**

### 예제 1: Boot 자동 구성에 Virtual Threads 사용 요청

```yaml
# application.yml
spring:
  threads:
    virtual:
      enabled: true
```

Java 21 이상이 전제다. Boot는 자동 구성 조건에 따라 `AsyncTaskExecutor`·`TaskScheduler`를 제공하며 `@EnableAsync`와 MVC 비동기 처리 등에 연결한다. 사용자 executor나 `AsyncConfigurer`가 있으면 선택이 달라진다. 기존 executor나 Tomcat 요청 설정까지 바꾼다고 가정하지 않는다. [2]

### 예제 2: WebFlux에서 논블로킹 `WebClient` 결과 반환

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
final class CatalogController {
    private final WebClient client;

    CatalogController(WebClient.Builder builder) {
        this.client = builder.baseUrl("https://catalog.example").build();
    }

    @GetMapping("/items/{id}")
    Mono<Item> find(@PathVariable String id) {
        return client.get()
                .uri("/items/{id}", id)
                .retrieve()
                .bodyToMono(Item.class);
    }

    record Item(String id, String name) {}
}
```

컨트롤러는 `Mono`를 반환해 서버가 구독·취소·예외 처리를 맡게 한다. 외부 API의 4xx/5xx, 연결·응답 timeout, 재시도 정책은 서비스에 맞춰 추가한다. `catalog.example`은 실제 주소로 바꾸며 WebFlux 스타터의 `WebClient.Builder`를 전제로 한다. **(미실행)**

### 예제 3: 불가피한 JDBC 호출을 격리

```java
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
final class LegacyCatalogService {
    private final JdbcTemplate jdbcTemplate;

    LegacyCatalogService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Mono<Item> find(long id) {
        return Mono.fromCallable(() -> jdbcTemplate.queryForObject(
                        "select id, name from catalog where id = ?",
                        (rs, rowNum) -> new Item(
                                rs.getLong("id"), rs.getString("name")),
                        id))
                .subscribeOn(Schedulers.boundedElastic());
    }

    record Item(long id, String name) {}
}
```

`fromCallable`이 JDBC를 감싸고 `subscribeOn`이 별도 scheduler에서 실행한다. 메서드 안에서 `subscribe()`하지 않는다. JDBC 드라이버·DataSource와 `catalog` 테이블이 필요하고, 조회 결과가 없을 때의 예외도 처리해야 한다. JDBC 자체는 여전히 동기식이며 DB 연결 풀과 조회 동시 수가 한도를 정한다. **(미실행)**

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Framework 5.0 — WebFlux 추가.** 기존 Spring MVC는 Servlet API와 Servlet 컨테이너를 중심으로 만들어져 논블로킹 서버 I/O와 Reactive Streams backpressure를 기반으로 하는 별도 웹 스택이 필요했다. WebFlux는 이후 MVC와 나란히 배포되며 Reactor Netty 및 Servlet 계열 서버를 지원한다. [1]
- **JDK 19 → 20 — Virtual Threads 프리뷰(JEP 425, 436). JDK 21 — 정식화(JEP 444).** 대기 시간이 긴 서버에서 스레드당 자원 비용 때문에 thread-per-request 방식의 동시성이 제한되는 문제가, 기존 `Thread` 코드를 최대한 유지하는 경량 스레드 기능을 낳았다. Java 21에서 정식화됐고, VT의 JVM 내부 동작은 → J12 참조. [6]
- **Spring Framework 6.1 — `SimpleAsyncTaskScheduler` 추가.** 기존의 풀 재사용 모델과 다른 VT의 thread-per-task 실행을 예약 작업에 연결하되, 하나의 scheduler thread가 예약 시점을 관리하고 실행마다 새 스레드를 시작한다. fixed-delay 작업은 scheduler thread 하나에서 실행되므로 VT 친화 설정에서 fixed-rate나 cron 방식이 권장된다. [5]
- **Spring Boot 4.1.1 / Framework 7.0.9 — 현재 문서 기준.** Java 21 이상에서 `spring.threads.virtual.enabled`를 켜면 Boot가 관리하는 task execution·scheduling 자동 구성이 가상 스레드용 구현을 선택한다. 사용자 정의 실행기와 서블릿 컨테이너 설정까지 무조건 바꾸지는 않으므로 적용 지점을 확인해야 한다. [2][5]

## 6. 실무 가이드

**기본 추천: 일반적인 CRUD는 Spring MVC + Virtual Threads부터 검토한다.** Java 25·Boot 4.1.1에서 JDBC/JPA와 동기 라이브러리를 유지하며 블로킹 대기 비용을 줄이기 쉽다. 실제 요청 executor 적용 여부와 DB 동시성을 확인한다.

- if JDBC/JPA·동기 SDK가 중심이면 then MVC + VT를 검토한다. 리액티브 wrapper가 블로킹 라이브러리를 논블로킹으로 바꾸지는 않는다.
- if 여러 독립 I/O를 조합하고 client·data access가 논블로킹이면 then WebFlux를 검토한다.
- if 지속 스트림과 소비자 수요 제어가 필요하면 then `Flux`·backpressure를 쓰고 큐·응답 버퍼 한도도 정한다.
- if WebFlux의 레거시 블로킹 호출을 피할 수 없으면 then `fromCallable` + `boundedElastic`로 격리하고 timeout·동시성을 제한한다.
- if `@Async`가 기대와 다르면 then 사용자 `Executor`, `AsyncConfigurer`, `applicationTaskExecutor`와 auto-config 조건을 확인한다.
- if Tomcat 요청 thread를 VT로 바꾸려면 then task executor와 별도로 connector executor를 구성한다.
- if CPU나 DB가 병목이면 then VT/WebFlux 선택과 별개로 CPU 병렬성·DB 풀·벌크헤드·timeout을 조정한다. 성능 비교는 같은 부하와 자원 조건에서 측정한다.

## 7. 함정·안티패턴

1. **증상:** WebFlux 요청이 몰릴 때 unrelated API까지 타임아웃된다. → **원인:** 이벤트 루프에서 JDBC·동기 HTTP·`Thread.sleep()`을 실행했다. → **대처:** 논블로킹 client/driver로 교체하거나 소스 호출 자체를 `boundedElastic` 등 명시된 executor로 격리하고, timeout·동시성 한도를 둔다.
2. **증상:** 리액티브 controller에서 값이 바로 필요하다며 `.block()`을 호출한다. → **원인:** 비동기 결과를 다시 요청 스레드에서 기다리며 이벤트 루프를 막는다. → **대처:** `Mono`/`Flux`를 반환하고 `map`, `flatMap`으로 조합한다. imperative 경계가 필요하다면 그 경계와 executor를 분명히 분리한다.
3. **증상:** `spring.threads.virtual.enabled=true` 후 Tomcat 요청 스레드는 여전히 기존 풀처럼 동작한다. → **원인:** Boot의 task executor 설정과 Tomcat protocol handler executor를 같은 것으로 생각했다. → **대처:** `@Async`·예약 작업·MVC async와 HTTP 요청 executor 각각의 실제 빈/서버 설정을 관찰한다. Tomcat 요청 VT는 별도 connector 구성이 필요하다.
4. **증상:** VT 활성화 후 DB connection timeout, DB CPU 상승, 외부 API 429가 늘었다. → **원인:** 값싼 스레드를 무제한 허가로 오해해 downstream에 동시 작업을 밀어 넣었다. → **대처:** semaphore·bulkhead·커넥션 풀·rate limit·queue를 병목 자원 기준으로 제한한다.
5. **증상:** `publishOn`을 붙였는데도 JDBC가 event loop에서 돈다. → **원인:** `publishOn` 뒤에 있는 코드만 옮겼고, publisher source의 실행 문맥을 바꾸지 않았다. → **대처:** 블로킹 호출을 `Mono.fromCallable`로 만들고 그 source에 `subscribeOn(boundedElastic())`을 적용한다.
6. **증상:** `@Scheduled(fixedDelay=...)`를 VT로 병렬 실행한다고 기대했지만 예약 작업이 밀린다. → **원인:** `SimpleAsyncTaskScheduler`의 fixed-delay 작업은 단일 scheduler thread에서 실행된다. → **대처:** 해당 작업이 VT scheduler 모델과 맞는지 확인하고 fixed-rate/cron 또는 명시적 실행기·스케줄러로 요구 동시성을 설계한다.
7. **증상:** `@Async` 호출을 했는데 동기 실행되거나 실행기가 달라진다. → **원인:** auto-config back-off 조건, 잘못된 빈 이름/형식, `AsyncConfigurer`, 프록시를 거치지 않는 자기 호출을 놓쳤다. → **대처:** 현재 선택된 executor bean과 프록시 경계를 확인하고, Boot가 기대하는 `applicationTaskExecutor` 등 명명 규칙을 따른다.
8. **증상:** 리액티브 API 내부에서 응답이 없어지거나 취소 후 작업이 계속 돈다. → **원인:** 직접 `subscribe()`해 WebFlux가 체인을 관리하지 못하거나 cancellation을 무시했다. → **대처:** 일반 controller와 service는 publisher를 반환하고, 애플리케이션이 구독 수명주기를 직접 소유해야 하는 제한된 경우에만 `subscribe()`한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `Mono`·`Flux`를 반환하면 요청이 별도 스레드로 자동 이동하나?

아니다. publisher 타입은 결과 신호 모델이지 스레드 지시자가 아니다. 동기 코드가 어느 스레드에서 실행되는지는 source와 operator의 scheduler, 구독 경로에 달려 있다. 그래서 `Mono.fromCallable(blocking).subscribeOn(...)`처럼 블로킹 source의 실행 문맥을 지정한다.

**꼬리질문:** 그럼 `WebClient`도 매 호출마다 새 스레드를 만드나? **답:** 아니다. Reactor Netty 같은 클라이언트는 논블로킹 I/O와 이벤트 기반 처리를 이용한다. API 타입이 `Mono`인 것만으로 호출 구현이 논블로킹인지 판단하지 말고 실제 connector/driver를 본다.

### Q2. WebFlux에서 이벤트 루프 블로킹이 왜 MVC보다 크게 번지나?

MVC는 보통 요청별 worker가 블로킹을 감당한다. WebFlux는 여러 연결의 callback을 적은 이벤트 루프 스레드에 맡기므로 callback 하나가 오래 막히면 같은 루프가 담당하는 다른 연결 처리가 함께 대기한다. 소수 스레드의 높은 활용을 얻는 대신 짧은 non-blocking callback이라는 전제가 필요하다.

**꼬리질문:** WebFlux 컨트롤러에서 `Thread.sleep(100)`을 하면? **답:** sleep을 수행한 event loop가 그동안 다른 I/O callback을 실행하지 못한다. 요청 대기열과 지연이 늘어날 수 있고, sleep을 VT나 다른 scheduler에서 해도 해당 API가 전체적으로 리액티브인 것은 아니다.

### Q3. backpressure가 DB 과부하를 자동으로 막나?

그렇지 않다. Reactive Streams subscriber가 publisher에 demand를 전달해 스트림 생산 속도를 조절하는 프로토콜이다. JDBC 호출이나 이미 발생한 DB 쿼리 동시 수를 자동 제한하지 않으며, 중간 operator가 buffer를 둘 수도 있다. DB 연결 풀과 concurrency cap, timeout은 별도로 설계한다.

**꼬리질문:** 소비자가 `cancel()`하면 진행 중인 DB 쿼리도 반드시 중단되나? **답:** publisher와 connector가 cancellation을 아래 계층까지 전달하는지에 달렸다. 일반 동기 JDBC 작업이 취소 신호만으로 안전하게 멈춘다고 가정하지 말고 driver 기능과 정리 동작을 확인한다.

### Q4. MVC + VT와 WebFlux 중 무엇이 더 빠른가?

보편적인 승자는 없다. MVC + VT는 동기 호출과 기존 라이브러리를 유지하며 I/O 대기 동시성을 높이는 데 적합하다. WebFlux는 논블로킹 I/O가 end-to-end인 workload에서 스레드 점유를 낮추고 스트림 demand를 전달하는 데 유리하다. CPU, DB, pool, 네트워크 병목은 별도로 측정해야 한다.

**꼬리질문:** JDBC를 많이 쓰는데 WebFlux가 꼭 필요하면? **답:** JDBC는 블로킹이므로 해당 호출을 분리할 실행기·동시성 한도와 cancellation/timeout 동작을 설계한다. 스택 대부분이 blocking이면 MVC + VT가 단순한 선택인지 같이 비교한다.

### Q5. `spring.threads.virtual.enabled=true`는 무엇을 전부 바꾸나?

Boot가 자동 구성하는 task execution과 scheduling 실행기 선택에 영향을 준다. Boot 문서는 `AsyncTaskExecutor`의 통합 지점과 scheduling 구성을 설명한다. 사용자가 executor를 제공했는지, Boot의 auto-config가 물러나는지 확인해야 한다. Tomcat HTTP 요청 executor까지 자동으로 변경한다고 추론해서는 안 된다.

**꼬리질문:** Boot MVC 앱의 요청을 VT로 처리하려면? **답:** Boot 속성만 보지 말고 서블릿 컨테이너가 사용하는 protocol-handler executor를 확인한다. Tomcat의 VT executor를 연결할 때는 운영 종료와 작업 취소, 동시 요청·DB 제한까지 함께 점검한다.

### Q6. `@Async`와 `@Scheduled`는 같은 executor를 쓰나?

동일하다고 가정하면 안 된다. `@Async`는 task execution의 `AsyncTaskExecutor` 선택 문제이고 `@Scheduled`는 `TaskScheduler`의 예약·실행 문제다. Boot 자동 구성 조건과 빈 이름, 사용자 설정에 따라 달라진다. VT 모드의 `SimpleAsyncTaskScheduler`에서도 fixed-delay 예외가 있다.

**꼬리질문:** `@Async` 메서드 안에서 CPU 계산을 수천 건 실행해도 VT면 괜찮나? **답:** VT는 CPU 계산량을 줄이지 않는다. CPU 코어 수 기준으로 병렬 실행을 제한하고 전용 bounded executor나 작업 큐를 사용한다.

### Q7. WebFlux + `boundedElastic`이면 JDBC도 리액티브해지나?

아니다. 이는 블로킹 JDBC를 이벤트 루프에서 떼어 worker에서 실행하게 할 뿐 호출의 I/O 방식은 동기식이다. bounded scheduler 용량을 초과하면 큐잉과 지연이 생길 수 있다. 장기적으로는 DB 접근 방식과 서버 모델이 요구사항에 맞는지 검토한다.

**꼬리질문:** `subscribeOn`과 `publishOn` 차이는? **답:** `subscribeOn`은 source 구독과 실행 문맥을 지정하는 데 사용되며 위치 영향이 source 기준으로 작다. `publishOn`은 해당 위치 이후 downstream 신호 처리 문맥을 바꾼다. 블로킹 source를 옮기는 데는 source 자체를 감싼 뒤 `subscribeOn`을 두는 패턴이 명확하다.

## 9. 참고문헌

1. Spring WebFlux — https://docs.spring.io/spring-framework/reference/web/webflux.html — WebFlux의 Reactive Streams backpressure, 논블로킹 특성, MVC와 공존하는 모듈 개요.
2. Spring Boot Task Execution and Scheduling — https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html — `spring.threads.virtual.enabled`, auto-configured `AsyncTaskExecutor`의 조건과 사용 통합점.
3. Spring Reactive Core — https://docs.spring.io/spring-framework/reference/web/webflux/reactive-spring.html — `HttpHandler`, 서버 어댑터와 Reactive Streams 처리 구조.
4. Reactor Core Reference: Threading and Schedulers — https://docs.spring.io/projectreactor/reactor-core/docs/3.7.x/reference/html/coreFeatures/schedulers.html — `subscribeOn`·`publishOn`, `boundedElastic`, blocking API 주의점.
5. Spring Framework Task Execution and Scheduling — https://docs.spring.io/spring-framework/reference/integration/scheduling.html — `SimpleAsyncTaskScheduler`, fixed-delay 동작과 Spring 스케줄링 지원.
6. JEP 444: Virtual Threads — https://openjdk.org/jeps/444 — VT 도입 목적과 JDK 19·20 preview, JDK 21 정식화 이력.
7. Apache Tomcat 11 `VirtualThreadExecutor` API — https://tomcat.apache.org/tomcat-11.0-doc/api/org/apache/tomcat/util/threads/VirtualThreadExecutor.html — 작업마다 새 virtual thread를 만드는 Tomcat executor API.
