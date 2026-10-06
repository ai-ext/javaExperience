# J12. Virtual Threads·Structured Concurrency·Scoped Values

> 3줄 요약 — Virtual thread는 I/O 대기 중 carrier 플랫폼 스레드를 반납해, 요청당 스레드 방식의 동시성 한계를 낮춘다. CPU를 더 빠르게 쓰거나 외부 시스템 용량을 늘려 주지는 않는다.
> 스레드는 작업마다 만들고, DB·원격 API 같은 제한 자원은 커넥션 풀·세마포어로 별도 제한한다. 모니터 안 블로킹에 따른 pinning은 Java 24(JEP 491)에서 대부분 제거됐다.
> Scoped Values는 호출 구간에 불변 문맥을 전달하며 Java 25에서 정식화됐다. Structured Concurrency는 Java 27까지 프리뷰이므로 Java 25 기준 API와 프리뷰 옵션·버전을 확인한다.

## 1. 왜 알아야 하나

요청이 CPU로 5ms 일하고 DB를 150ms 기다리는 동기식 서버를 생각하자. 요청마다 플랫폼 스레드를 붙이면 CPU가 한가해도 스레드와 OS 자원이 먼저 차 대기열·timeout·재시도가 커진다. 풀만 늘리면 스택과 스케줄링 부담이 커지고, VT만 늘리면 DB 연결보다 많은 요청이 대기해 커넥션 대기와 메모리가 급증한다.

“가볍다”를 “CPU 작업도 빠르다”로 오해해도 안 된다. 8코어에서 CPU 전용 작업을 10만 개 던져도 코어 수는 그대로며, 작업 객체와 대기 비용은 남는다.

면접에서 “VT는 OS 스레드 없이 실행된다”, “모든 `synchronized`는 pinning된다”, “Structured Concurrency는 Java 25 정식 API다”라고 답하면 틀린다. 코드는 carrier에서 실행되고, JEP 491 이후 모니터 pinning은 대부분 사라졌으며, Structured Concurrency는 Java 27에서도 프리뷰다.

## 2. 핵심 개념

| 용어 | 뜻 | 기억할 점 |
|---|---|---|
| 플랫폼 스레드 | OS 스레드에 연결된 `Thread` | OS 스케줄러가 실행하며 자원 비용이 상대적으로 큼 |
| virtual thread | JVM/JDK가 관리하는 경량 `Thread` | 한 OS 스레드에 고정되지 않고, 대기 시 멈췄다가 다른 carrier에서 재개될 수 있음 |
| carrier | virtual thread가 현재 실행 중인 플랫폼 스레드 | VT의 실행 기반. VT와 일대일로 계속 묶여 있지 않음 |
| mount / unmount | VT를 carrier에 올려 실행 / carrier에서 분리 | 지원되는 블로킹 지점에서 unmount하면 carrier를 다른 일에 쓸 수 있음 |
| continuation | 중단한 실행 위치와 스택 상태를 보존해 나중에 이어 실행하는 런타임 메커니즘 | 호출 스택을 보존하므로 코드 작성자는 동기식 흐름을 유지함 |
| pinning | VT가 carrier에서 분리되지 못해 플랫폼 스레드까지 붙잡힌 상태 | Java 24 이후 `synchronized`가 주된 원인은 아니며, native·foreign 경계 같은 사례를 살펴야 함 |
| Thread-per-task | 작업마다 스레드 하나를 생성하는 실행 모델 | VT에서 권장되는 기본 모델. 스레드를 작업 수 제한용 풀로 재사용하지 않음 |
| Scoped Value | 동적 호출 구간에 값을 바인딩해 호출자·하위 호출에 공유하는 API | Java 25 정식화(JEP 506), 바인딩은 범위가 끝나면 사라짐 |
| Structured Concurrency | 관련 하위 작업을 부모 작업의 수명 안에 묶는 API | 실패·취소·관측을 작업 트리 단위로 다룸. Java 27까지 프리뷰 |

### 서로 헷갈리는 선택

| 비교 | 첫 번째 | 두 번째 | 언제 고르나 |
|---|---|---|---|
| VT vs 플랫폼 스레드 | 블로킹 I/O 중심의 대량 작업에 높은 동시성 | CPU 작업, 장시간 전용 작업 또는 VT가 다루지 못하는 환경 | 대기 비중이 높고 요청별 순차 코드를 유지하고 싶으면 VT |
| 가상 스레드 풀 vs 작업별 생성 | 풀은 스레드 재사용·작업 수 제한을 결합 | 작업별 생성은 작업 수와 실행 스레드 수를 분리 | 기본은 `newVirtualThreadPerTaskExecutor()`; 자원 제한은 세마포어·커넥션 풀 |
| `ThreadLocal` vs `ScopedValue` | 스레드 수명 동안 변경 가능한 스레드별 슬롯 | 제한된 동적 범위에 값 바인딩 | 요청 ID·인증 주체처럼 호출 문맥을 전달하는 불변 값이면 Scoped Value |
| `ExecutorService` vs Structured Concurrency | 제출·Future 실행 도구, 작업 수명은 호출자가 설계 | 관련 자식 작업을 scope 안에서 join·취소·close | 한 요청의 병렬 fan-out/fan-in이면 구조화된 범위가 더 잘 맞음 |

## 3. 내부 동작·원리

### 플랫폼 스레드의 한계에서 VT까지

플랫폼 스레드는 OS 스레드와 스택·커널 자원을 점유한다. 요청이 소켓이나 JDBC를 기다리는 동안 CPU가 놀아도 스레드는 점유되어, 동시 요청이 늘면 thread-per-request가 병목이 된다.

Virtual thread도 `java.lang.Thread`다. JDK 스케줄러가 실행할 VT를 carrier에 올린다. 지원되는 블로킹 I/O에서 런타임은 호출 상태와 재개 지점을 보존(continuation)하고 VT를 suspend한다. 대기가 풀리면 다시 스케줄링해 어느 carrier에서든 실행을 잇는다.

```text
요청용 VT A ──실행──> carrier P1(OS thread)
     │
     ├─ blocking I/O ──> A unmount · continuation 보존 · I/O 대기
     │                         │
요청용 VT B ──실행─────────────┴──> carrier P1 재사용
     │
     └─ A의 I/O 완료 ──> 스케줄러에 재제출 ──> A를 carrier P2에 mount ──> 재개
```

동시 VT 수가 carrier 수를 넘어도 CPU 코어가 늘지는 않는다. 긴 I/O 대기 중 carrier를 다른 요청에 써 처리량을 높일 수 있지만 개별 왕복시간을 줄이지는 않는다.

### 어떤 블로킹은 양보하고 어떤 블로킹은 붙잡나

지원 블로킹 연산은 VT를 unmount할 수 있지만, native 메서드 등 실행 프레임을 분리할 수 없는 곳에서 블로킹하면 pinning되어 carrier도 묶인다. VT 수만 늘려서는 이를 해결하지 못한다.

Java 21에서는 모니터 안 블로킹이 주요 pinning 사례라 `synchronized`를 `ReentrantLock`으로 바꾸라는 조언이 흔했다. Java 24 JEP 491은 모니터 규약은 유지하면서 블로킹 VT가 carrier를 반납하게 해 이런 pinning 대부분을 없앴다. 남은 native·foreign 구간은 관측하고, 일괄 락 교체는 피한다.

### 왜 풀링하지 않고 자원별로 제한하나

VT를 풀링하면 작업별 수명 모델을 잃고 풀 크기를 DB 용량 제한으로 오해하기 쉽다. 작업마다 만들고 DB pool·HTTP 연결 제한·rate limit은 실제 병목에 맞춘다.

20-permit `Semaphore`는 외부 API 동시 진입을 20개로 제한한다. 대기 요청도 메모리와 timeout을 소비하므로 ingress·queue·backpressure도 정하고, 세마포어가 처리 용량 자체를 늘린다고 생각하지 않는다.

### ThreadLocal이 불편해지는 이유와 Scoped Values

`ThreadLocal`은 스레드별 슬롯이다. VT 수가 많으면 map·값 메모리가 누적되고 `InheritableThreadLocal` 상속도 고려해야 한다. 작업별 VT는 풀 재사용에 따른 요청 간 값 누출을 줄이지만 mutable 값의 동기화 문제까지 없애지는 않는다.

`ScopedValue.where(KEY, value).run(...)`/`call(...)`은 동적 범위에 문맥을 바인딩한다. 하위 호출은 `KEY.get()`으로 읽고 범위가 끝나면 바인딩도 사라진다. 값 객체까지 immutable하게 만들지는 않는다. JEP 506은 Java 25 정식화이며 ThreadLocal을 대체·폐기하지 않는다.

### Structured Concurrency가 보장하려는 수명

첫 `Future.get()`이 실패해도 `ExecutorService`의 다른 작업은 계속될 수 있어 부모 종료 뒤 자식이 남는다. Structured Concurrency는 fork된 자식을 scope에 묶고 join·close로 종료를 정리한다. 실패 정책에 따라 자식을 취소·interrupt하지만, 인터럽트 무시 작업의 강제 종료까지 보장하지 않는다.

```text
요청 R: scope open
├─ 하위 작업 A (virtual thread) ── 결과 A / 실패
├─ 하위 작업 B (virtual thread) ── 결과 B / 취소될 수 있음
└─ join: 정책에 따라 완료·실패·취소 판단
   close: 미완료 자식 취소 및 종료 확인 → 요청 R 복귀
```

이는 `ExecutorService`를 대체하는 범용 API가 아니라 요청 fan-out 수명을 구조화하는 프리뷰다. 정책은 모두 성공, 하나 성공, 실패 즉시 취소 등 작업에 맞춘다. Java 25 JEP 505부터 정적 `open`을 쓰며, 다음 프리뷰와 API를 섞지 않는다.

## 4. 코드로 확인

### 예제 1: 작업마다 가상 스레드 생성

아래 코드는 VT 8개가 동시에 대기 구간에 들어간 뒤 끝난다. `peakConcurrent`는 동시 작업 수이고, `Thread.isVirtual()`은 실행 중인 스레드가 VT인지 확인한다. 실행은 JDK 21.0.6에서 했다.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class VirtualThreadFanOut {
    public static void main(String[] args) throws InterruptedException {
        int count = 8;
        AtomicInteger active = new AtomicInteger(), peak = new AtomicInteger(), virtual = new AtomicInteger();
        CountDownLatch allStarted = new CountDownLatch(count);
        List<Thread> tasks = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            tasks.add(Thread.startVirtualThread(() -> {
                int n = active.incrementAndGet();
                peak.accumulateAndGet(n, Math::max);
                if (Thread.currentThread().isVirtual()) virtual.incrementAndGet();
                allStarted.countDown();
                try { allStarted.await(); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                finally { active.decrementAndGet(); }
            }));
        }
        for (Thread task : tasks) task.join();
        System.out.printf("tasks=%d, virtual=%d, peakConcurrent=%d%n", count, virtual.get(), peak.get());
    }
}
```

JDK 21.0.6 실제 출력:

```text
tasks=8, virtual=8, peakConcurrent=8
```

`Thread.startVirtualThread()`는 호출마다 VT를 시작한다. 운영 코드에서는 executor를 애플리케이션 수명에 맞춰 관리하고 종료 시 닫는다.

### 예제 2: 외부 자원 동시성은 Semaphore로 제한

스레드 수를 3개로 줄이지 않고도 동시에 외부 시스템에 들어가는 작업을 3개로 제한한다. 실제 서비스에서는 이미 존재하는 DB/HikariCP 연결 제한을 추가 세마포어로 중복 구현하지 않도록 기준을 정한다.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

public class SemaphoreLimit {
    public static void main(String[] args) throws InterruptedException {
        int count = 12;
        Semaphore permits = new Semaphore(3);
        AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();
        List<Thread> tasks = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            tasks.add(Thread.startVirtualThread(() -> {
                boolean acquired = false;
                try {
                    permits.acquire();
                    acquired = true;
                    int n = inFlight.incrementAndGet();
                    peak.accumulateAndGet(n, Math::max);
                    try { Thread.sleep(10); }
                    finally { inFlight.decrementAndGet(); }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    if (acquired) permits.release();
                }
            }));
        }
        for (Thread task : tasks) task.join();
        System.out.printf("tasks=%d, maxDownstreamInFlight=%d, permits=%d%n",
                count, peak.get(), permits.availablePermits());
    }
}
```

JDK 21.0.6 실제 출력:

```text
tasks=12, maxDownstreamInFlight=3, permits=3
```

인터럽트·예외에서도 permit이 회수되도록 `finally`에서 해제한다. 이 간단한 출력 검증은 제한 논리를 보이는 예제이며 취소 경쟁·대기열·요청 timeout 정책까지 구현한 운영 라이브러리는 아니다.

### 예제 3: 호출 범위에 Scoped Value 문맥 바인딩

```java
// Java 25+ (JEP 506)
import java.lang.ScopedValue;

public class RequestContextExample {
    private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

    public static void main(String[] args) {
        ScopedValue.where(REQUEST_ID, "req-7f3a").run(RequestContextExample::handle);
    }

    private static void handle() {
        loadOrder();
    }

    private static void loadOrder() {
        System.out.println("loading for " + REQUEST_ID.get());
    }
}
```

(JDK 21 환경이라 미실행) JEP 506은 Java 25 정식화다. `get()`은 바인딩 범위 안에서 호출한다. preview 옵션은 필요 없다.

### 예제 4: 요청 안의 병렬 하위 작업을 scope로 묶기

```java
// Java 25+ (JEP 505)
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Subtask;

public class DashboardService {
    record Dashboard(String user, int orderCount) {}

    Dashboard load(String userId) throws InterruptedException {
        try (var scope = StructuredTaskScope.open()) {
            Subtask<String> user = scope.fork(() -> findUser(userId));
            Subtask<Integer> orders = scope.fork(() -> countOrders(userId));

            scope.join();
            return new Dashboard(user.get(), orders.get());
        }
    }

    private String findUser(String id) { return "user:" + id; }
    private int countOrders(String id) { return 12; }
}
```

(JDK 21 환경이라 미실행) Java 25 프리뷰이므로 `javac --release 25 --enable-preview`와 `java --enable-preview`가 필요하다. Java 26·27은 해당 JEP의 변경을 반영한다. `join()` 전 `get()`을 호출하지 말고, 인터럽트 무시 자식의 종료 지연에 대비한다.

### 운영 관측

JFR의 `jdk.VirtualThreadStart`, `jdk.VirtualThreadEnd`, `jdk.VirtualThreadPinned`, `jdk.VirtualThreadSubmitFailed`는 각각 시작·종료·pinning·scheduler 제출 실패를 살필 때 쓴다. pinning 진단 예: `jcmd <pid> JFR.start name=vt settings=profile duration=60s filename=vt.jfr`, 이어서 `jfr print --events jdk.VirtualThreadPinned vt.jfr`. 활성 이벤트는 `jfr metadata vt.jfr`로 확인한다. Java 24 이후 남은 pinning 경로를 찾는 데 유용하다.

`jcmd <pid> Thread.dump_to_file -format=json threads.json`으로 VT 덤프도 확보한다. JFR 시간·덤프·요청 ID를 맞추고 녹화 이벤트와 기간을 필요한 만큼 설정한다.

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 이전 한계 |
|---|---|
| Java 19 (JEP 425) | VT 첫 프리뷰로 OS 스레드 수에 묶인 한계를 낮추기 시작했다. Structured Concurrency는 JEP 428 인큐베이터였다. |
| Java 20 (JEP 436) | VT 두 번째 프리뷰는 피드백을 반영했다. Structured Concurrency JEP 437 재인큐베이션, Scoped Values JEP 429 인큐베이션. |
| Java 21 (JEP 444) | VT 정식화로 Thread-local 호환·관측을 다듬었다. JEP 453 Structured Concurrency와 JEP 446 Scoped Values는 프리뷰. |
| Java 22–24 | Structured Concurrency JEP 462·480·499 프리뷰로 API 피드백을 반영했다. Java 24 JEP 491은 monitor pinning 대부분을 제거했다. Scoped Values JEP 464·481·487도 프리뷰를 거쳤다. |
| Java 25 | JEP 506 Scoped Values 정식화. JEP 505 Structured Concurrency 다섯 번째 프리뷰는 정책 선택을 위해 public 생성자 대신 `open` factory를 도입했다. |
| Java 26 | JEP 525 여섯 번째 프리뷰는 timeout 결과와 Joiner API를 조정했다. |
| Java 27 (2026-09-28 최신 GA) | JEP 533 일곱 번째 프리뷰는 join 예외 타입을 표현하도록 변경했다. 프리뷰 피드백과 타입 안정성 요구가 이어져 버전별 시그니처 확인이 필요하다. |

근거는 각 JEP에 둔다. Structured Concurrency는 기준일에 정식 기능이 아니므로 JDK별 preview 호환 정책을 확인한다.

## 6. 실무 가이드

- **기본값 추천:** 동시 요청이 많고 동기식 블로킹 I/O가 중심이면 작업별 VT를 선택한다. 대기 중 carrier를 반납하면서 요청별 동기 코드 흐름을 유지한다.
- 대부분 CPU 계산이면 제한된 플랫폼 스레드 실행기를 택한다. VT는 코어 수나 계산 속도를 늘리지 않는다.
- VT를 풀링하지 말고 작업별로 만든다. DB·HTTP 연결 수와 rate는 커넥션 풀·세마포어·rate limiter로 제한한다. 같은 자원 앞에서 제한을 겹쳐 대기 원인을 숨기지 않는다.
- Java 24+에서 `synchronized`를 무조건 `ReentrantLock`으로 바꾸지 않는다. 먼저 JFR로 남은 pinning을 확인하고 lock semantics를 비교한다.
- 불변 요청 문맥은 Java 25+ Scoped Value, 변경 상태는 명시적 인자나 해당 트랜잭션 API로 표현한다.
- 요청 fan-out에는 Structured Concurrency를 검토하되, Java 27까지 프리뷰이므로 preview 배포·버전 고정을 받아들일 수 있을 때 사용한다. 장수 백그라운드 작업은 요청 scope 밖에 둔다.
- 추적을 위해 JFR·VT-aware dump·요청 ID 로그를 함께 설계한다.

Spring Boot에서 VT를 켜는 설정과 Servlet/WebFlux 선택은 이 문서 범위가 아니다(→ S07 참조).

## 7. 함정·안티패턴

1. **VT 고정 크기 풀 →** 풀 슬롯 대기가 생기고 자원 제한과 혼동된다 → 작업별 생성, permit·pool로 자원 제한.
2. **CPU 가속으로 오해 →** 코어는 늘지 않고 run queue·작업 메모리만 증가 → CPU 작업은 제한된 병렬성으로 처리.
3. **DB보다 많은 VT 유입 →** 각 대기 요청도 메모리와 timeout을 소비 → ingress·queue bound·timeout 설정.
4. **Java 21 pinning 조언을 계속 적용 →** Java 24 JEP 491 이후 일반 모니터 pinning 전제가 바뀜 → JFR로 실제 남은 pinning만 수정.
5. **ThreadLocal 일괄 금지/허용 →** VT별 데이터 비용과 mutable 값 경쟁을 모두 놓침 → 값 크기·개수·상속을 측정하고 문맥에는 Scoped Value 검토.
6. **mutable 값의 Scoped Value 공유 →** 바인딩 범위가 객체 필드 변경을 막지 않음 → 불변 snapshot을 바인딩.
7. **scope가 자식을 강제 종료한다고 오해 →** interrupt를 무시하면 close가 지연됨 → 취소 협조와 timeout 구현.
8. **Structured Concurrency 프리뷰를 공용 API로 노출 →** JDK마다 시그니처가 변함 → JDK·preview 정책 고정.
9. **일반 스레드 덤프만 의존 →** 대규모 VT 관측을 놓침 → JFR·`jcmd` JSON 덤프·요청 ID 병행.

## 8. 자가점검 Q&A (면접 대비)

### Q1. Virtual thread가 플랫폼 스레드보다 빨라지는가?

아니다. CPU 명령을 더 빨리 실행하지 않는다. I/O 대기 중 carrier를 반납해 적은 플랫폼 스레드로 더 많은 작업을 겹쳐 처리할 수 있지만 CPU-bound는 코어가 한계다.

**꼬리질문:** 대기 시간이 길어도 throughput이 오르지 않을 수 있는 이유는?

DB나 원격 서비스가 포화됐거나 pinning·메모리·유입량이 병목일 수 있다. VT는 그 용량을 늘리지 않으므로 자원별 동시성을 제한한다.

### Q2. VT는 OS 스레드 없이 실행되는가?

아니다. 실행 순간 carrier 플랫폼 스레드 위에서 돈다. 지원되는 블로킹에 unmount하고, 깨어나면 다른 carrier에 mount될 수 있다.

**꼬리질문:** continuation은 무엇을 이어 주는가?

중단 호출 위치와 상태를 보존해 그 다음 코드부터 잇게 한다. 애플리케이션은 동기식 호출·예외 흐름으로 작성한다.

### Q3. Java 21에서 `synchronized`가 pinning 이슈였다면 Java 24에서도 피해야 하는가?

Java 24 JEP 491은 모니터 보유 중에도 VT가 블로킹 시 carrier를 반납하게 했다. `synchronized`는 계속 유효하며 native·foreign pinning은 별도 진단한다.

**꼬리질문:** JEP 491이 pinning을 완전히 제거했는가?

아니다. 대부분을 없앴지만 남은 경우가 있다. 실행 JDK의 JFR 이벤트와 호출 경로를 확인한다.

### Q4. 왜 virtual-thread-per-task executor 대신 VT 풀을 만들지 않는가?

VT는 생성 부담이 낮아 작업마다 새로 만드는 것이 기본이다. 풀은 작업 동시성을 VT 수로 제한하고 스레드·작업 수명을 분리한다. 외부 자원은 별도 제한한다.

**꼬리질문:** downstream API가 초당 100건만 허용하면 어떻게 하는가?

rate limiter는 초당 처리율, 세마포어는 in-flight 수를 제한한다. 둘은 다른 제약이므로 API 계약에 맞춰 적용한다.

### Q5. `ThreadLocal`을 Scoped Value로 바꾸면 무엇이 좋아지는가?

Scoped Value는 호출 범위와 값의 수명을 드러내 문맥 전달을 이해하기 쉽다. Java 25 정식 기능이며 ThreadLocal을 폐기하거나 mutable 객체를 immutable하게 바꾸지 않는다.

**꼬리질문:** ThreadLocal이 VT에서 금지인가?

아니다. VT도 지원한다. 다만 스레드별 데이터 크기와 상속 비용을 따진다.

### Q6. `ExecutorService`로 Future 두 개를 기다리는 코드와 Structured Concurrency는 어떻게 다른가?

ExecutorService는 실패한 부모가 다른 작업을 정리하는 생명주기를 직접 짜야 한다. Structured Concurrency는 관련 작업을 scope로 묶어 join·실패·취소를 부모와 연결한다. Java 27까지 프리뷰다.

**꼬리질문:** Structured Concurrency가 모든 비동기 코드에 더 좋은가?

아니다. 요청 수명 밖의 백그라운드 작업은 그 요청의 자식이 아니다. 안정적 공개 API라면 프리뷰 여부를 먼저 판단한다.

### Q7. Scope가 닫히면 느린 자식은 즉시 죽는가?

보장되지 않는다. scope는 취소 인터럽트를 보내고 자식 종료를 기다린다. 자식이 무시하면 close가 지연되므로 timeout과 협조적 취소가 필요하다.

**꼬리질문:** 부모의 interrupt를 잡아서 무시하면?

취소 전파가 끊길 수 있다. `InterruptedException`을 전파하거나 interrupt flag를 복구하고 자원을 정리한다.

### Q8. Virtual thread pinning을 어떻게 찾는가?

JFR에서 `jdk.VirtualThreadPinned`를 수집하고 스레드 덤프·요청 ID와 대조한다. Java 24+는 남은 pinning 경로를 찾으며 이벤트 설정을 실행 JDK에서 검증한다.

**꼬리질문:** JFR 이벤트가 없으면 pinning은 없다고 결론 내려도 되는가?

아니다. 이벤트가 녹화에서 활성화됐는지 확인하고 지연·carrier 포화 지표도 함께 본다.

## 9. 참고문헌

- JEP 444: Virtual Threads — https://openjdk.org/jeps/444 — VT 정식화, 목표·플랫폼 스레드 대비 배경과 설계 근거.
- JEP 491: Synchronize Virtual Threads without Pinning — https://openjdk.org/jeps/491 — Java 24 모니터 pinning 제거와 남은 진단 필요성.
- JEP 506: Scoped Values — https://openjdk.org/jeps/506 — Java 25 정식화, ThreadLocal 대비 목적 및 프리뷰 이력.
- Virtual Threads (Java 25 Core Libraries Guide) — https://docs.oracle.com/en/java/javase/25/core/virtual-threads.html — VT 생성·용도·관측·채택 가이드.
- JEP 453: Structured Concurrency (Preview) — https://openjdk.org/jeps/453 — Java 21 프리뷰와 구조화된 작업 수명 문제.
- JEP 505: Structured Concurrency (Fifth Preview) — https://openjdk.org/jeps/505 — Java 25 프리뷰 상태, API 변경 및 설계 동기.
- Structured Concurrency (Java 25 Core Libraries Guide) — https://docs.oracle.com/en/java/javase/25/core/structured-concurrency.html — scope, fork/join/close와 Java 25 프리뷰 사용법.
- JEP 525: Structured Concurrency (Sixth Preview) — https://openjdk.org/jeps/525 — Java 26까지 프리뷰 상태와 API 변경.
- JEP 533: Structured Concurrency (Seventh Preview) — https://openjdk.org/jeps/533 — Java 27 프리뷰 상태와 버전별 변화.
- Package `jdk.jfr` (Java SE 25 API) — https://docs.oracle.com/en/java/javase/25/docs/api/jdk.jfr/jdk/jfr/package-summary.html — 이벤트 기록·Flight Recorder 제어 API의 기본 개념.
