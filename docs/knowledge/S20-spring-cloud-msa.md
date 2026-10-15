# S20. Spring Cloud·MSA 패턴

> 3줄 요약 — MSA는 배포·확장의 경계를 분리하는 대신 네트워크 지연, 부분 실패, 데이터 일관성, 운영 복잡성을 서비스 간 경계로 끌어온다.
> Spring Cloud는 설정·발견·라우팅·로드밸런싱의 공통 추상화를 제공하고, 릴리스 트레인과 Spring Boot 호환성을 함께 맞춰야 한다.
> 타임아웃을 먼저 정하고, 재시도는 멱등 호출에 제한하며, 서킷브레이커·벌크헤드·레이트리미터는 서로 다른 고장 형태를 막도록 조합한다.

## 1. 왜 알아야 하나

주문 서비스가 재고 서비스를 동기 호출하는데 응답 제한은 30초, 재시도는 3회라고 하자. 재고가 느려지면 주문의 스레드·연결이 기다리며 쌓이고 재시도는 부하를 더한다. 서비스별 타임아웃과 동시 호출 한도를 정하지 않았다면 MSA의 장애 격리는 작동하지 않는다.

MSA는 코드를 잘게 쪼개는 기술이 아니라 변경·배포·데이터 소유권의 경계를 나누는 선택이다. 독립 배포나 부분 확장이 필요하지 않고 서비스 간 변경이 늘 함께 일어나면 네트워크 홉과 운영 부담만 증가한다. 경계가 명확한 모놀리스가 더 나은 시작점일 수 있다.

## 2. 핵심 개념

| 용어 | 의미 | 주의점 |
|---|---|---|
| MSA | 독립 실행·배포 가능한 서비스 경계 | 컨테이너 수가 아니라 도메인·데이터·팀 책임의 경계다. |
| 릴리스 트레인 | 함께 호환되도록 테스트되는 Spring Cloud 프로젝트 묶음 | 프로젝트별 최신 버전을 섞지 않고 Boot 호환 범위를 확인한다. |
| Service Discovery | 논리 이름에서 인스턴스 후보 목록을 찾음 | 인스턴스 선택인 Load Balancing과 별도 책임이다. |
| API Gateway | 외부 라우팅·인증·정책·관측의 공통 진입점 | 단일 병목이 되지 않게 확장하고 내부 권한 검증도 유지한다. |
| Config Server | 여러 애플리케이션에 중앙 설정을 제공 | 값 변경만으로 실행 중 프로세스가 자동 갱신되지는 않는다. |
| Circuit Breaker | 최근 결과를 바탕으로 실패가 예상되는 호출을 차단 | 타임아웃이나 동시성 제한은 아니다. |
| Retry | 실패 호출을 다시 실행 | 멱등하지 않은 생성·결제 요청은 중복 부작용이 생긴다. |
| Bulkhead | 동시 작업을 제한해 자원을 격리 | RateLimiter와 달리 진행 중 작업 수를 제한한다. |
| RateLimiter | 시간 구간별 허용 호출 수를 제한 | 처리 중 동시성 제한과 목적이 다르다. |
| 멱등성 | 같은 요청을 반복해도 결과가 한 번 실행과 같음 | HTTP 메서드 이름만으로 안전성을 단정하지 않는다. |

| 비교 | 첫 번째 | 두 번째 |
|---|---|---|
| 발견 vs 로드밸런싱 | 서비스 식별자로 인스턴스 목록 획득 | 후보 중 이번 요청 대상 선택 |
| Retry vs CircuitBreaker | 일시 실패를 다시 시도 | 장애 대상에 추가 부하가 가지 않게 차단 |

메시징은 S14, 트레이싱은 S16 참조.

## 3. 내부 동작·원리

### 요청 경로와 서비스 이름

```text
클라이언트 → Gateway(라우트·정책) → 논리 서비스 이름
   → Discovery(인스턴스 목록) → LoadBalancer(대상 선택)
   → HTTP Client(타임아웃) → 서비스 인스턴스
```

Gateway는 요청을 라우팅하고 보안·메트릭 같은 교차 관심사를 적용한다. Spring Cloud Gateway 문서는 Server 및 Proxy Exchange 변형과 WebFlux/Web MVC 호환성을 설명한다. Gateway는 서비스 내부 권한 확인을 대체하지 않으며, 자체도 수평 확장·타임아웃·연결 제한 대상이다. [R4]

Discovery 데이터는 종료된 인스턴스를 잠시 포함할 수 있다. 선택한 인스턴스도 과부하나 네트워크 장애로 응답하지 않을 수 있으므로 실제 HTTP 클라이언트의 deadline·연결 풀을 설정해야 한다. Kubernetes Service는 변하는 Pod 집합 앞에 안정된 주소를 제공한다. 내부 통신은 이 Service 이름만으로도 가능하므로 Cloud Discovery와 중복 운영할 필요가 없는 경우가 많다. [R5]

### 설정 공급

Spring Cloud Config는 서버·클라이언트와 Spring `Environment`·`PropertySource` 연동을 제공하며 기본 저장소는 Git이다. 앱 시작 때 서버를 먼저 찾아야 한다면 설정 서버가 가용성·부팅 순서의 의존성이 된다. 설정 갱신은 프로세스 재시작, refresh 이벤트 등 실제 반영 경로를 따로 정한다. [R6]

Kubernetes ConfigMap은 비기밀 설정을 환경 변수·인자·볼륨 파일로 Pod에 공급하며 크기는 1 MiB 제한이다. 환경 변수는 이미 실행 중인 프로세스에 자동 반영되지 않는다. 볼륨 파일 갱신도 앱이 다시 읽어야 효력이 있다. 기밀은 ConfigMap에 저장하지 않는다. [R7]

### 복원력의 상태와 자원 제어

Resilience4j CircuitBreaker는 `CLOSED`, `OPEN`, `HALF_OPEN`과 특수 상태 `METRICS_ONLY`, `DISABLED`, `FORCED_OPEN`을 가진 유한 상태 기계다. Count-based window는 최근 N개 호출을, time-based window는 최근 N초를 집계한다. `CLOSED`에서 실패/느린 호출 기준을 넘으면 `OPEN`이 되어 호출을 즉시 거절하고, 대기 후 `HALF_OPEN`에서 제한된 시험 호출로 회복을 판정한다.

sliding window는 결과 집계 장치이지 느린 호출을 중단하거나 동시성을 제한하는 장치가 아니다. 그래서 타임아웃은 따로 둔다. [R8]

```text
CLOSED ── 임계치 초과 ──▶ OPEN ── 대기 후 ──▶ HALF_OPEN
   ▲                                         │ 성공
   └─────────────────────────────────────────┘
                         실패 ──────────────▶ OPEN
```

| 장치 | 동작 | 문서상 핵심 기본값/제약 |
|---|---|---|
| Retry | 횟수·간격·대상 예외로 재호출 | `maxAttempts=3`(최초 포함), `waitDuration=500ms` [R9] |
| Semaphore Bulkhead | 세마포어로 병렬 진입 제한 | `maxConcurrentCalls=25`, `maxWaitDuration=0` [R10] |
| Thread-pool Bulkhead | 고정 스레드와 제한 큐로 격리 | 큐 적체·컨텍스트 전달·스레드 비용을 함께 고려 [R10] |
| RateLimiter | 주기별 permission을 부여 | quota에는 적합하나 동시 실행 수를 제한하지 않음 [R11] |

Retry와 CircuitBreaker의 순서에 따라 breaker가 물리 시도별 실패를 셀지 최종 논리 호출만 셀지가 달라진다. 앱 3회와 HTTP 클라이언트 2회 재시도가 겹치면 최대 6번 원격 호출이 발생할 수 있다. 한 계층이 재시도를 소유하게 하고 전체 deadline 안에서 시도 수를 제한한다.

## 4. 코드로 확인

아래 Spring 예제는 Boot 4.1 / Framework 7 기준 구성 조각이며 환경 의존성이 있어 미실행했다. Cloud·Resilience4j 의존성 버전은 Boot와 맞는 릴리스 트레인 및 호환표를 확인해 고른다. 열람한 Cloud train의 지원 Boot와 기준 Boot 4.1.1은 직접 일치하지 않아 호환성을 단정하지 않는다.

### 예제 1 — Resilience4j CircuitBreaker를 명시적으로 구성

같은 breaker 인스턴스를 재사용해야 상태·메트릭이 요청마다 초기화되지 않는다. RestClient의 연결·응답 타임아웃도 별도로 구성한다.

```java
import java.time.Duration;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Configuration
class InventoryConfiguration {
    @Bean
    CircuitBreaker inventoryCircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(20)
                .minimumNumberOfCalls(10)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(10))
                .permittedNumberOfCallsInHalfOpenState(3)
                .build();
        return CircuitBreaker.of("inventory", config);
    }

    @Bean
    RestClient inventoryRestClient(RestClient.Builder builder) {
        return builder.baseUrl("http://inventory").build();
    }
}

@Service
class InventoryReader {
    private final RestClient client;
    private final CircuitBreaker breaker;

    InventoryReader(RestClient inventoryRestClient, CircuitBreaker inventoryCircuitBreaker) {
        this.client = inventoryRestClient;
        this.breaker = inventoryCircuitBreaker;
    }

    String findItem(String id) {
        return breaker.executeSupplier(() -> client.get()
                .uri("/items/{id}", id).retrieve().body(String.class));
    }
}
```

이 코드는 포화 시 `CallNotPermittedException`을 던지며 fallback은 정하지 않는다. 사용자에게 허용되는 대체 응답과 오류 매핑을 업무 요구에 맞춘다. Resilience4j Spring Boot starter/Aspect 연동의 Boot 4.1 호환성은 별도 확인이 필요하다.

### 예제 2 — Kubernetes ConfigMap과 Service

`inventory`는 같은 namespace의 Service DNS 이름이다. ConfigMap은 기밀을 저장하지 않는다.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: orders-config
data:
  application.yaml: |
    spring:
      application:
        name: orders
    inventory:
      base-url: http://inventory
---
apiVersion: v1
kind: Service
metadata:
  name: inventory
spec:
  selector:
    app: inventory
  ports:
    - name: http
      port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orders
  template:
    metadata:
      labels:
        app: orders
    spec:
      containers:
        - name: orders
          image: example/orders:1.0.0
          volumeMounts:
            - name: config
              mountPath: /config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: orders-config
```

Service의 selector와 실제 Pod label/port가 일치해야 한다. 설정 변경을 앱이 다시 읽지 않으면 롤아웃으로 프로세스에 반영한다.

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Cloud 2022.0.0 시기 — OpenFeign 기능 완성 선언**: 선언형 클라이언트의 새 기능을 계속 확장하기보다 안정화와 기존 동작의 유지에 초점을 두게 되었고, Spring 문서는 Spring HTTP Service Clients로의 이동을 제안한다. OpenFeign 참조 문서가 2022.0.0 공지를 명시하며 현재 프로젝트 설명을 feature-complete로 표시한다. 새 개발은 교체 비용, 기존 인터페이스 수, 관측·부하분산 구성을 함께 비교한다. [R3]
- **Spring Cloud 2025.1.x — Boot 4 세대 릴리스 트레인**: Spring Boot/Spring Framework의 메이저 전환에서 프로젝트별 임의 조합을 막기 위해 트레인 단위 BOM과 호환 범위가 중요해졌다. 열람한 Release Train 참조 문서는 `2025.1.3`과 지원 Boot `4.0.8-SNAPSHOT`을 표기한다. 이 값은 문서에 적힌 그대로이며 Boot 4.1.1 지원을 뜻하지 않는다. [R1]
- **2026년 열람 시점의 개별 컴포넌트 문서**: Gateway 5.0.3, Config 5.0.5, Commons(Discovery·LoadBalancer 공통부) 5.0.3, OpenFeign 5.0.3 등이 stable 후보 버전 중 하나로 표시된다. 컴포넌트마다 patch 숫자가 다르므로 버전 번호를 맞춰 수동 조합하지 말고, 프로젝트 페이지의 버전 표기만으로 호환성을 추정하지 않는다. 트레인 BOM 및 지원 매트릭스를 통해 선택해야 한다. [R2][R3][R4][R6][R12]
- **Resilience4j 2 — Java 17 요구**: 최신 런타임·언어 수준을 활용하는 메이저로 올라오면서 Java 17 이상이 필요하다. 기존 Java 8/11 실행 환경이면 코드가 같아도 런타임 업그레이드나 다른 지원 버전 선택이 선행 조건이다. [R8]

## 6. 실무 가이드

**기본값 추천:** 모듈 경계를 명확히 한 모놀리스에서 시작한다. 이미 Kubernetes를 운영하면 내부 DNS와 단순 환경 설정은 우선 Service·ConfigMap에 맡긴다. 동기 호출은 명시적 deadline/타임아웃과 재시도 없음으로 출발하고, 멱등성·측정 근거가 있는 호출만 재시도한다.

- **if** 독립 배포·부분 확장이 실제 병목이면 **then** 데이터 소유권이 분명한 경계부터 서비스로 분리한다.
- **if** Kubernetes DNS로 충분하면 **then** Service를 쓰고, 복수 플랫폼·레지스트리 요구가 있을 때만 Spring Discovery를 추가한다.
- **if** 여러 백엔드에 외부 라우팅·인증 정책이 공통으로 필요하면 **then** Gateway를 둔다. 내부 권한 검증도 유지한다.
- **if** Git 이력·승인 및 여러 런타임에 걸친 중앙 설정 배포가 필요하면 **then** Config Server를 검토하고 부팅·갱신 절차를 정한다.
- **if** 재실행이 멱등하고 일시 오류가 복구 가능하면 **then** 제한된 재시도·backoff/jitter를 deadline 내에서 쓴다.
- **if** 연속 실패 시 회복 시간을 주거나 자원 고갈을 막아야 하면 **then** CircuitBreaker와 Bulkhead를 각각 실패 차단·동시성 제한 목적으로 설정한다.
- **if** 외부 quota가 있으면 **then** RateLimiter로 호출률을 맞추고 대기/거절 동작을 제품 정책으로 정한다.
- **if** Boot/Cloud 메이저를 올리면 **then** 호환 train과 BOM을 고정하고 개별 모듈 버전을 임의 override하지 않는다.

## 7. 함정·안티패턴

1. **무한 대기/타임아웃 불일치** — 스레드·연결이 쌓임 → 연결·응답·프록시 제한이 따로 놈 → 상위 deadline과 각 호출 제한을 정한다.
2. **비멱등 요청 재시도** — 결제·주문 중복 → 응답 유실 후 같은 요청 재실행 → idempotency key를 저장하거나 자동 재시도하지 않는다.
3. **재시도 폭풍** — 장애 중 트래픽 증가 → 계층별 재시도와 고정 간격이 겹침 → 한 계층만 소유하고 총 시도 수·deadline·jitter를 제한한다.
4. **CircuitBreaker를 타임아웃으로 오해** — 느린 호출이 자원을 계속 점유 → breaker는 결과를 집계·차단할 뿐 호출을 종료하지 않음 → HTTP timeout을 별도로 설정한다.
5. **임계치 무검토** — 한가한 서비스는 오차단, 바쁜 서비스는 늦게 차단 → window/minimum calls가 트래픽과 불일치 → 실제 지표로 조정하고 상태·거절을 관측한다.
6. **요청별 breaker 생성** — 회로가 열리지 않고 메트릭 급증 → 인스턴스 이름이 무한히 달라짐 → `inventory`처럼 안정된 업스트림별로 재사용한다.
7. **Kubernetes와 앱 Discovery 중복** — 주소 선택이 불명확 → Service와 Registry가 동시에 인스턴스 선택 → 내부 주소 결정권을 하나로 정한다.
8. **ConfigMap 비밀 저장/자동 갱신 기대** — 정보 노출 또는 변경 미반영 → ConfigMap은 비밀 저장소가 아니며 프로세스 메모리를 바꾸지 않음 → Secret/외부 저장소, 재시작·재읽기 방식을 쓴다.
9. **Cloud 버전 임의 혼합** — 자동 설정 누락·링크 오류 → Boot와 호환되지 않는 모듈 override → BOM과 공식 지원 매트릭스를 고정한다.
10. **분산 트랜잭션 오해** — 주문·재고 상태 불일치 → 하나의 `@Transactional` 경계가 아님 → 상태 전이·보상·중복 방지를 설계한다. 메시징은 S14 참조.

## 8. 자가점검 Q&A (면접 대비)

### Q1. MSA 서비스 경계를 어떻게 정하는가?
도메인 행위, 데이터 소유권, 팀 변경 책임이 함께 움직이는지 본다. 테이블별 분리는 하나의 업무 변경을 여러 API와 배포에 걸치게 해 독립성을 해친다. 서비스가 DB를 소유하고 팀이 배포 결정을 내릴 수 있는지도 경계 검증에 포함한다.
**꼬리질문:** 다른 서비스의 데이터가 필요하면? **답:** 소유 서비스 계약을 호출하거나 이벤트를 사용한다. DB 직접 조회는 소유권을 깨뜨린다. 메시징은 S14 참조.

### Q2. Discovery와 LoadBalancer는 무엇이 다른가? Kubernetes에서 둘 다 필요한가?
Discovery는 서비스 이름에서 인스턴스 후보를 찾고, LoadBalancer는 요청 대상 하나를 고른다. Kubernetes Service DNS는 내부 통신에 안정 주소를 제공하므로 Cloud Discovery가 항상 필요한 것은 아니다.
**꼬리질문:** Cloud LoadBalancer는? **답:** Service VIP를 쓰면 플랫폼이 선택하고, 앱이 Discovery 후보를 직접 고르면 클라이언트 측 선택 정책이 필요하다.

### Q3. CircuitBreaker가 열리면 호출이 멈추는데 타임아웃도 필요한가?
Breaker는 지속 실패 대상에 새 부하가 쌓이지 않게 빠르게 거절한다. 이미 시작한 느린 요청은 중단하지 않으므로 연결·응답 timeout과 전체 deadline이 별도로 필요하다. 상위 요청이 끝난 뒤 하위 호출이 계속 남지 않도록 deadline을 전파하는 점도 확인한다.
**꼬리질문:** HALF_OPEN의 목적은? **답:** 제한된 시험 호출로 회복을 확인하고 성공이면 닫고, 실패면 다시 연다.

### Q4. Retry와 CircuitBreaker를 함께 쓸 때 무엇을 정하는가?
Retry는 재실행 안전성과 지연 예산을, breaker는 실패를 어느 단위로 집계할지를 정한다. 감싸는 순서는 물리 호출별 실패와 논리 요청별 실패 중 무엇을 기록할지 바꾸며 다층 재시도는 호출량을 곱으로 늘린다.
**꼬리질문:** 결제는 재시도할 수 있나? **답:** idempotency key로 중복을 안전하게 흡수하고 deadline 안에 제한할 때만 허용한다.

### Q5. Bulkhead와 RateLimiter의 차이는?
Bulkhead는 진행 중 동시 작업 수를 제한해 자원을 격리한다. RateLimiter는 시간 구간별 허용량을 제한해 quota를 맞춘다. 느린 업스트림과 높은 호출률이 함께 있으면 둘 다 쓸 수 있다. 포화 시 기다릴지 즉시 거절할지도 정해야 호출자 지연과 큐 점유를 예측할 수 있다.
**꼬리질문:** 동시성 한도를 늘리면 처리량이 늘까? **답:** 업스트림 여력이 있을 때만 그렇다. 포화된 대상은 대기열·실패만 키우므로 지표로 조정한다.

### Q6. Config Server와 ConfigMap은 어떤 기준으로 선택하는가?
ConfigMap은 Kubernetes Pod에 환경 변수나 파일로 설정을 공급한다. Config Server는 Git 기반 중앙 설정과 여러 런타임의 공통 운영이 필요할 때 검토한다. Kubernetes를 쓰고 기본 설정이면 ConfigMap이 단순하다.
**꼬리질문:** ConfigMap 변경은 즉시 앱에 반영되는가? **답:** 환경 변수는 재시작이 필요하고 파일 방식도 앱의 재읽기가 있어야 반영된다.

### Q7. Spring Cloud 릴리스 트레인을 왜 Boot와 함께 고정하는가?
트레인은 서로 호환되는 Cloud 프로젝트와 지원 Boot 범위를 묶는다. 숫자가 가장 높은 모듈을 섞으면 실행 중 링크 오류나 자동 설정 실패가 날 수 있어 BOM/지원표가 선택 기준이다.
**꼬리질문:** OpenFeign 최신 stable을 선택하면 되는가? **답:** 아니다. 모듈의 stable 표기와 Boot 호환성은 별개다.

### Q8. OpenFeign을 신규·기존 시스템에서 어떻게 판단할까?
현재 참조 문서는 OpenFeign을 feature-complete로 안내하고 HTTP Service Clients를 권한다. 기존 시스템은 이전 위험과 유지 비용을 비교하고, 신규 시스템은 새 클라이언트와 discovery·timeout 구성을 검증한다.
**꼬리질문:** HTTP Service Client가 discovery·복원력도 제공하나? **답:** 선언형 인터페이스 자체만으로는 아니다. URI, 이름 해석, LoadBalancer, timeout, CircuitBreaker를 별도로 연결한다.

## 9. 참고문헌

- Spring Cloud Train Reference — https://docs.spring.io/spring-cloud-release/reference/index.html — 열람한 트레인 버전·지원 Boot와 구성요소. [R1]
- Spring Cloud Supported Versions — https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions — 트레인별 Boot 호환·지원 정책. [R2]
- Spring Cloud OpenFeign — https://docs.spring.io/spring-cloud-openfeign/reference/index.html — feature-complete 안내·이전 권고. [R3]
- Spring Cloud Gateway — https://docs.spring.io/spring-cloud-gateway/reference/index.html — Gateway 형식과 기능. [R4]
- Kubernetes Service — https://kubernetes.io/docs/concepts/services-networking/service/ — Service 네트워크 추상화. [R5]
- Spring Cloud Config — https://docs.spring.io/spring-cloud-config/reference/index.html — 중앙 설정 서버·클라이언트. [R6]
- Kubernetes ConfigMaps — https://kubernetes.io/docs/concepts/configuration/configmap/ — 비기밀 설정의 Pod 전달 방식. [R7]
- Resilience4j Introduction — https://resilience4j.readme.io/docs — 기능 모델과 Java 요구 버전. [R8]
- Resilience4j CircuitBreaker — https://resilience4j.readme.io/docs/circuitbreaker — 상태와 sliding window. [R8]
- Resilience4j Retry — https://resilience4j.readme.io/docs/retry — 재시도 설정과 기본값. [R9]
- Resilience4j Bulkhead — https://resilience4j.readme.io/docs/bulkhead — 세마포어·thread-pool 방식. [R10]
- Resilience4j RateLimiter — https://resilience4j.readme.io/docs/ratelimiter — 주기별 permission. [R11]
- Spring Cloud Commons — https://docs.spring.io/spring-cloud-commons/reference/index.html — Discovery와 LoadBalancer를 포함하는 공통 추상화 프로젝트 및 버전 표기. [R12]
