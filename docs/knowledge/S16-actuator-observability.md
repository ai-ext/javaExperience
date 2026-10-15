# S16. Actuator·관측성 (메트릭·트레이싱·로깅)

> - Actuator는 운영 엔드포인트를 제공하지만, **사용 가능(access)** 과 **외부 노출(exposure)** 은 별개다. 필요한 엔드포인트만 인증·네트워크 경계 안에 노출한다.
> - Micrometer의 메트릭은 이름과 태그 조합마다 시계열을 만든다. 사용자·요청 식별자를 메트릭 태그로 넣으면 메트릭 저장소와 애플리케이션 메모리가 함께 커진다.
> - Observation으로 업무 구간을 한 번 계측하고 메트릭·트레이스 핸들러가 각각의 신호로 내보내게 한다. 로그의 trace ID 전파와 함께 써야 요청의 지표·흐름·상세 기록을 연결할 수 있다.

## 1. 왜 알아야 하나

`/actuator/env`를 인증 없이 공개하면 설정 정보가 노출된다. 반대로 Prometheus registry만 추가하고 scrape endpoint를 공개하지 않아 지표가 비는 일도 있다. Actuator는 endpoint access와 전송 경로 exposure를 함께 설정해야 안전하게 동작한다.

Kubernetes liveness에 DB 검사를 넣으면 DB 장애가 Pod 재시작 폭주로 번질 수 있고, readiness에 모든 health indicator를 넣으면 전체 인스턴스가 트래픽에서 빠질 수 있다. 생존 여부와 트래픽 수용 가능성을 구분해야 한다.

request ID·사용자 ID·원본 URL을 메트릭 태그로 만들면 값 조합마다 시계열과 Meter가 생긴다. 고유값을 메트릭으로 모으지 말고 route template과 제한된 상태 값으로 집계하고, 개별 요청 정보는 로그·trace에 둔다.
## 2. 핵심 개념

| 용어 | 뜻 | 점검점 |
|---|---|---|
| Actuator endpoint | health·metrics·loggers 등 운영 기능 | 기본 HTTP 경로는 `/actuator/{id}` |
| Access / Exposure | 허용 작업 / HTTP·JMX로 공개하는 경로 | 둘 다 허용돼야 실제 사용 가능 |
| HealthIndicator | 상태와 선택 정보를 반환하는 구성요소 | 여러 contributor를 health endpoint가 모음 |
| Meter / MeterRegistry | 측정값과 exporter 연결점 | 이름·태그 조합이 meter를 구분 |
| Cardinality | 고유 태그 조합 또는 시계열 수 | 무제한 값이 들어오면 급증 |
| Observation / Span | 관측 구간 / 분산 요청의 작업 단위 | handler가 메트릭·trace로 변환 |
| MDC | 로그 이벤트에 붙는 문맥 map | 비동기 경계에서 전파 확인 필요 |

| 헷갈리는 쌍 | 구분 |
|---|---|
| Access vs Exposure | Boot 4.1 access 기본은 shutdown·heapdump 외 unrestricted이나, 기본 HTTP/JMX exposure는 health뿐이다. |
| Liveness vs Readiness | liveness는 재시작이 필요한 내부 생존, readiness는 지금 트래픽을 받아도 되는지 판단한다. |
| Counter vs Gauge | Counter는 누적 이벤트, Gauge는 현재 큐 길이처럼 오르내리는 값이다. |
| Metric tag vs trace attribute | 메트릭은 저카디널리티 집계용, trace는 개별 흐름 분석용이다. 개인정보는 어느 쪽에도 무심코 넣지 않는다. |
## 3. 내부 동작·원리

### 3.1 Endpoint 접근과 노출

```text
Endpoint bean → access 허용? → HTTP/JMX exposure에 포함? → 보안 필터·네트워크 허용? → 응답
```

세 조건은 독립적이다. 기본 HTTP/JMX 노출은 health이며, Prometheus endpoint를 쓰려면 레지스트리 의존성·access·exposure를 모두 갖춰야 한다. `exclude`는 `include`보다 우선한다. `/env`, `/configprops`, `/quartz` 값은 기본 마스킹된다. `show-values=always`는 피하고 필요하면 `when-authorized`와 운영 역할을 사용한다.

### 3.2 Health와 Kubernetes

Health endpoint는 `HealthContributorRegistry`의 상태를 합친다. `HealthIndicator`는 단일 상태를, `CompositeHealthContributor`는 하위 상태 묶음을 제공한다. `management.endpoint.health.group.<name>.include/exclude`로 그룹을 만들면 `/actuator/health/{name}`에서 확인한다.

Boot probe 지원은 liveness/readiness 그룹으로 애플리케이션 availability를 노출한다. 시작 중에는 liveness가 `BROKEN`, readiness가 `REFUSING_TRAFFIC`일 수 있고, 초기화가 끝나면 `CORRECT`와 `ACCEPTING_TRAFFIC`가 된다. 종료 때 readiness가 먼저 트래픽을 거부한다.

liveness에는 DB·Redis 같은 외부 검사를 넣지 않는다. 외부 장애를 재시작으로 고치려 하면 재시작 폭주와 연쇄 장애가 난다. readiness에는 필수 외부 의존성만 서비스 정책에 맞게 넣는다. 관리 포트만 검사하면 실제 요청 포트 장애를 놓칠 수 있으므로 `management.endpoint.health.probes.add-additional-paths=true`로 메인 포트의 `/livez`, `/readyz`를 고려한다.

### 3.3 Meter와 cardinality

Micrometer는 측정 코드를 `MeterRegistry`에 등록하고 클래스패스의 registry가 backend로 전달한다. Boot는 지원 registry를 자동 구성하고 composite로 묶을 수 있다. Meter는 이름과 tag 조합으로 식별된다.

- `Counter`: 증가하는 이벤트 수. 주문 접수 횟수에 사용.
- `Gauge`: 큐 길이 같은 순간값. 대상 객체를 bean 필드로 유지해 GC되지 않게 한다.
- `Timer`: 호출 수와 누적 시간·분포를 기록해 latency 측정에 적합.
- `DistributionSummary`: 바이트 수 등 시간 외 값의 분포. `LongTaskTimer`: 아직 끝나지 않은 작업.

`uri=/users/123`처럼 값이 매번 바뀌면 시계열이 증가한다. `/users/{id}`로 정규화하고 userId·requestId·timestamp는 tag에서 뺀다. 태그 값 후보가 각각 5·10·100개면 조합이 최대 5,000개다. Micrometer의 `HighCardinalityTagsDetector`는 같은 이름의 meter 수를 세어 경고하는 진단기이며 동적 metric 이름이나 실제 수집을 차단하지 않는다.

latency percentile을 인스턴스별로 계산해 평균내면 전체 서비스의 percentile이 되지 않는다. 여러 인스턴스 집계가 필요하면 histogram/SLO bucket을 검토한다. Prometheus 연동은 `micrometer-registry-prometheus`와 `/actuator/prometheus` exposure가 필요하며, endpoint는 기본 노출에 포함되지 않는다.

### 3.4 Observation, trace, MDC

`ObservationRegistry`는 Observation을 시작·종료하고 handler가 이를 메트릭이나 span으로 변환한다. Boot는 registry를 자동 구성한다. 저카디널리티 tag는 메트릭과 trace에, 고카디널리티 값은 trace에만 두는 것이 기본 원칙이다.

```text
Observation → low-cardinality tags → Meter
            → context + high-cardinality tags → Span → trace backend
            → 현재 trace 문맥 → 로그의 traceId/spanId
```

Boot 기본 sampling probability는 0.1이며 `management.tracing.sampling.probability`로 조정한다. 샘플링되지 않은 요청도 메트릭·로그에는 남을 수 있다. 원격 호출 trace 전파에는 Boot가 구성한 `RestClient.Builder`, `RestTemplateBuilder`, `WebClient.Builder`를 사용한다. 직접 만든 client는 전파가 빠질 수 있다.

Reactor에서 ThreadLocal은 자동 복원되지 않는다. `spring.reactor.context-propagation=auto`, Boot `@Async` executor의 `spring.task.execution.propagate-context=true`를 검토한다. 직접 구성한 executor에는 `ContextPropagatingTaskDecorator`를 등록한다.

MDC도 실행 흐름이 바뀔 때 자동 전파된다고 가정하지 말고 `MDC.putCloseable`로 현재 scope를 정리한다.
## 4. 코드로 확인

아래 Spring 예제는 Boot 4.1 API를 기준으로 한 코드이며, 이 작업 환경에서 애플리케이션을 빌드해 검증하지 않았다. 각 Java 클래스는 적힌 파일명으로 별도 파일에 둔다. 애플리케이션의 HTTP starter와 빌드 플러그인은 이미 구성되어 있다고 가정한다.

### 예제 1: Actuator, Prometheus, OTLP 노출 경계

Gradle 의존성 예시:

```kotlin
// build.gradle.kts (Spring Boot 4.1.1 의존성 관리 사용)
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-opentelemetry")
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")
}
```

운영용 `application.yaml` 예시. 포트 접근은 사내 모니터링 네트워크와 앱 보안 설정으로 제한한다.

```yaml
management:
  endpoints:
    access:
      default: none
    web:
      exposure:
        include: "health,info,prometheus"
  endpoint:
    health:
      access: read-only
      probes:
        enabled: true
        add-additional-paths: true
      show-details: when-authorized
      roles: OPS
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState,db # DB가 이 서비스의 필수 준비 조건일 때만 포함
    info:
      access: read-only
    prometheus:
      access: read-only
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${APP_ENV:local}
  tracing:
    sampling:
      probability: 0.1
  opentelemetry:
    tracing:
      export:
        otlp:
          endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT}

logging:
  structured:
    format:
      console: ecs
```

`management.endpoints.access.default=none`을 설정했으므로 노출 목록에 넣은 endpoint도 개별 read access를 열어야 한다. 이 예제는 세 endpoint만 read-only로 허용한다. 앱에 DB health contributor가 없다면 readiness include에서 `db`를 제거한다.

운영 역할 인증과 실제 네트워크 제한은 앱 배포 환경에 맞춰 더한다. **(미실행: Spring Boot 애플리케이션 설정 예시)**

### 예제 2: Counter와 생명주기가 있는 Gauge

`OrderMetrics.java` — 고정된 metric name에 누적 주문 수와 현재 처리 중 주문 수를 기록한다.

```java
import java.util.concurrent.atomic.AtomicInteger;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class OrderMetrics {
    private final Counter accepted;
    private final AtomicInteger inFlight = new AtomicInteger();

    public OrderMetrics(MeterRegistry registry) {
        this.accepted = Counter.builder("orders.accepted")
                .description("Accepted order count")
                .register(registry);
        Gauge.builder("orders.inflight", this.inFlight, AtomicInteger::get)
                .description("Orders currently being processed")
                .register(registry);
    }

    public void orderAccepted() {
        accepted.increment();
    }

    public void processingStarted() {
        inFlight.incrementAndGet();
    }

    public void processingFinished() {
        inFlight.decrementAndGet();
    }
}
```

Gauge의 대상인 `inFlight`가 bean 필드라 registry가 값을 읽을 때 사라지지 않는다. 실제 서비스에서는 완료·실패 경로 모두 `processingFinished()`가 호출되도록 `try/finally`나 작업 수명주기에 연결한다. **(미실행: Boot context 필요)**

### 예제 3: 업무 동작을 Observation으로 감싸기

`CheckoutObservation.java` — `region`은 제한된 종류라 metric tag에 두고, 요청 식별자는 trace에만 둔다.

```java
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Component;

@Component
public class CheckoutObservation {
    private final ObservationRegistry registry;

    public CheckoutObservation(ObservationRegistry registry) {
        this.registry = registry;
    }

    public void reserve(String region, String requestId, Runnable businessOperation) {
        Observation.createNotStarted("checkout.reserve", registry)
                .lowCardinalityKeyValue("region", region)
                .highCardinalityKeyValue("request.id", requestId)
                .observe(businessOperation);
    }
}
```

`requestId`는 예시를 위해 trace에만 붙였다. 개인정보나 비밀값을 trace attribute로 보내도 된다는 뜻은 아니다. 업무 동작의 예외는 Observation 종료 동작에 반영되므로 호출자가 예외 정책을 소유한다. **(미실행: Boot context 및 관측 handler 필요)**

### 예제 4: 구조화 로그와 MDC 정리

`OrderAuditLogger.java` — ECS 형식은 위 YAML에서 켜고, SLF4J fluent key-value와 MDC를 사용한다.

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Component
public class OrderAuditLogger {
    private static final Logger log = LoggerFactory.getLogger(OrderAuditLogger.class);

    public void accepted(String orderId) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable("event", "order.accepted")) {
            log.atInfo()
                    .addKeyValue("orderId", orderId)
                    .log("Order accepted");
        }
    }
}
```

Boot의 ECS 출력은 MDC의 key-value를 JSON 필드로 포함한다. `orderId`처럼 값 종류가 큰 필드는 로그에서는 요청을 좁히는 데 쓸 수 있지만, 메트릭 태그로 재사용하지 않는다. MDC scope는 현재 실행 흐름에서 닫힌다. 별도 스레드나 Reactor로 넘길 때는 문맥 전파 설정을 추가로 확인한다. **(미실행: Boot logging 설정 및 SLF4J 2 런타임 필요)**

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화와 이전 한계 | 근거 |
|---|---|---|
| Boot 3.0 | Micrometer 1.10 Observation API와 Micrometer Tracing 자동 구성을 도입했다. 메트릭과 trace를 따로 계측하던 수고를 하나의 관측 구간으로 줄였다. | [3.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes) |
| Boot 4.0 | `spring-boot-starter-opentelemetry`를 추가해 SDK 구성과 OTLP 메트릭·trace 내보내기를 묶었다. exporter를 직접 조립하던 시작 비용을 줄였다. | [4.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes) |
| Boot 4.1.1 기준 | 관리 버전은 Micrometer 1.17.1이다. 하위 버전은 임의로 덮어쓰기보다 Boot dependency management를 따른다. | [Dependency Coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html) |
## 6. 실무 가이드

**기본값 추천:** health와 필요한 scrape endpoint만 read-only로 노출하고, 관리 포트·네트워크 정책·인증으로 보호한다. 전체 endpoint 공개는 기본값으로 두지 않는다.

- if 상태 확인이 목적이면 then health를 열고 상세 정보는 `when-authorized`로 둔다.
- if Prometheus를 붙이면 then registry 의존성, endpoint access/exposure, scrape path를 모두 맞추고 수집망을 제한한다.
- if Kubernetes liveness를 구성하면 then 내부 liveness 상태만 확인한다. 외부 의존성은 필요할 때 readiness에서 판단한다.
- if 지표를 추가하면 then Counter/Timer/Gauge를 용도에 맞게 선택하고 제한된 값만 tag에 넣는다. percentile 집계가 필요하면 histogram/SLO를 검토한다.
- if 한 요청을 여러 신호에서 연결하려면 then Observation과 trace correlation을 쓰고, request ID는 메트릭 tag에서 제외한다.
- if async 실행 뒤에 traceId가 없으면 then Reactor·TaskExecutor 문맥 전파와 직접 만든 executor의 decorator를 확인한다.
- if 로그 수집 형식이 JSON이면 then ECS·GELF·Logstash JSON 중 파이프라인에 맞는 것을 쓴다. logfmt는 Boot 내장 형식이라 단정하지 말고 `StructuredLogFormatter` 구현을 검토한다.
- 배포 파이프라인과 이미지 운용은 이 문서 범위가 아니다 → S19 참조.
## 7. 함정·안티패턴

| 증상 | 원인 | 대처 |
|---|---|---|
| 민감 Actuator endpoint가 외부에서 조회됨 | `include=*`와 인증·네트워크 제한 부재 | endpoint 최소 공개, read-only access, 역할 인증과 관리망 제한 |
| Prometheus scrape가 비어 있음 | registry만 추가하고 endpoint 노출 또는 scrape path 누락 | 의존성·access·exposure·`metrics_path` 확인 |
| DB 장애에 Pod가 재시작·퇴출됨 | DB 검사를 liveness에 넣거나 모든 지표를 readiness에 포함 | liveness는 내부 상태, readiness는 필수 조건만 |
| 시계열·메모리가 급증 | ID·원본 URL 등 무제한 tag 또는 metric 이름 사용 | route template과 제한된 tag 사용, detector로 meter 수 확인 |
| Gauge가 0이 되거나 사라짐 | 측정 대상 객체가 GC됨 | 대상 객체를 충분한 수명의 bean 필드로 유지 |
| trace 하위 호출이나 비동기 로그에서 문맥이 끊김 | 수동 client 생성, ThreadLocal 전파·정리 누락 | Boot builder와 context propagation 사용, MDC scope 정리 |
## 8. 자가점검 Q&A (면접 대비)

### Q1. 기본 health 노출은 모든 Actuator endpoint가 공개됐다는 뜻인가?

아니다. Boot 4.1은 access와 HTTP/JMX exposure를 따로 설정한다. 기본 exposure는 health뿐이며 다른 endpoint는 별도로 공개해야 한다.

**꼬리질문:** access 기본값을 `none`으로 바꾼 경우 health exposure만으로 충분한가? **답:** 아니다. health access도 다시 허용해야 한다.

### Q2. DB 장애 때 liveness와 readiness 중 무엇을 실패시킬까?

보통 readiness만 고려한다. liveness 실패는 Pod 재시작으로 이어지므로 DB 장애를 앱 재시작으로 해결하려 해서는 안 된다. readiness도 모든 Pod를 동시에 제외할 위험을 검토한다.

**꼬리질문:** DB가 모든 Pod에서 공유된다면? **답:** 전체 트래픽 차단과 fallback·부분 기능 저하 중 서비스 정책에 맞는 선택을 한다.

### Q3. request ID를 메트릭 tag로 넣으면 왜 위험한가?

태그 조합마다 Meter와 시계열이 생긴다. 요청마다 ID가 달라지면 메트릭 수가 요청량을 따라 늘어 비용과 메모리가 압박받는다. 개별 요청 값은 로그·trace에 둔다.

**꼬리질문:** `/users/123` 경로는? **답:** `/users/{id}`처럼 정규화한다.

### Q4. Timer와 Counter를 어떻게 구분하는가? 인스턴스별 p95 평균은 전체 p95인가?

Counter는 누적 이벤트, Timer는 작업 수와 시간 분포를 기록한다. 여러 인스턴스의 p95 평균은 전체 분포의 p95가 아니다. 집계 가능한 histogram/SLO bucket을 검토한다.

**꼬리질문:** Gauge를 쓸 때 주의점은? **답:** Gauge 대상 객체의 생명주기를 유지해야 한다.

### Q5. Observation은 로그·메트릭·trace를 같은 저장소에 넣는 API인가?

아니다. 관측 구간을 정의하고 handler가 메트릭과 span 등으로 변환한다. 저카디널리티 tag는 두 신호에 쓸 수 있고 고카디널리티 값은 trace에만 둔다. 로그는 별도 형식과 correlation으로 연결한다.

**꼬리질문:** 모든 요청 span이 남는가? **답:** 아니다. 기본 sampling probability가 0.1이다.

### Q6. 직접 생성한 `RestClient`에도 trace propagation이 자동 적용되는가?

Boot가 구성한 `RestClient.Builder`, `RestTemplateBuilder`, `WebClient.Builder`를 써야 자동 전파를 기대할 수 있다. 직접 만든 client는 전파 설정이 빠질 수 있다.

**꼬리질문:** async 로그에 traceId가 없다면? **답:** client builder, Reactor/TaskExecutor 전파, MDC 형식과 정리 범위를 확인한다.

### Q7. ECS JSON과 logfmt는 어떻게 선택하는가?

Boot structured logging은 ECS·GELF·Logstash JSON을 제공하고 MDC 및 SLF4J key-value를 JSON 필드로 출력할 수 있다. logfmt는 내장 형식이라고 가정하지 말고 필요하면 `StructuredLogFormatter`로 지원한다.

**꼬리질문:** MDC를 `put`하고 정리하지 않으면? **답:** 재사용 스레드에 값이 남을 수 있으므로 `putCloseable` 같은 scope를 쓴다.
## 9. 참고문헌

- Production-ready Features — https://docs.spring.io/spring-boot/reference/actuator/index.html — Actuator 운영 기능 개요.
- Endpoints — https://docs.spring.io/spring-boot/reference/actuator/endpoints.html — access·exposure·보안·health 그룹·probe.
- Monitoring over HTTP — https://docs.spring.io/spring-boot/reference/actuator/monitoring.html — HTTP 경로와 management endpoint 설정.
- Metrics — https://docs.spring.io/spring-boot/reference/actuator/metrics.html — Micrometer, 커스텀 meter, Prometheus scrape.
- Observability — https://docs.spring.io/spring-boot/reference/actuator/observability.html — Observation과 cardinality·context propagation.
- Tracing — https://docs.spring.io/spring-boot/reference/actuator/tracing.html — OTLP, sampling, client propagation, correlation ID.
- Logging — https://docs.spring.io/spring-boot/reference/features/logging.html — ECS·GELF·Logstash JSON과 MDC.
- Meters — https://docs.micrometer.io/micrometer/reference/concepts/meters.html — Meter 종류와 이름·태그 식별.
- High Cardinality Tags Detector — https://docs.micrometer.io/micrometer/reference/concepts/high-cardinality-tags-detector.html — 카디널리티 위험과 detector의 한계.
- Spring Boot 3.0 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes — Observation·Tracing 자동 구성 도입.
- Spring Boot 4.0 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes — OpenTelemetry 스타터와 OTLP 지원.
- Managed Dependency Coordinates — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — Boot 4.1.1의 Micrometer 1.17.1.
