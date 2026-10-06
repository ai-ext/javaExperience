# J11. java.util.concurrent

> `java.util.concurrent`는 스레드 수명과 작업 큐, 공유 상태의 원자성, 대기·신호를 목적에 맞게 나눠 제공한다.
> 풀의 크기만 정하고 큐와 거절을 방치하면 과부하가 큐 지연·메모리 고갈·무한 대기로 바뀐다.
> Java 25에서는 `CompletableFuture`의 기본 비동기 실행 규칙과 `ForkJoinPool`의 스케줄링 기능도 달라졌다.

## 1. 왜 알아야 하나

`newFixedThreadPool()`에 작업을 계속 넣으면 고정 스레드 수와 달리 기본 무한 큐는 계속 자란다. 처리량을 넘는 유입은 큐 지연과 메모리 고갈로 나타난다. 포화 때 `DiscardPolicy`가 `submit()` 작업을 버리면 호출자가 가진 `Future.get()`은 끝나지 않을 수도 있다.

`CompletableFuture.supplyAsync()`가 블로킹 HTTP 호출을 하면 비동기 체인만으로 격리되지 않는다. 특히 Java 25는 실행기 미지정 async 단계의 기본 동작도 바뀌었다. 이 문서는 풀·완료 단계·잠금·원자 변수·동시 컬렉션·동기화 도구를 다룬다. Virtual Threads·Structured Concurrency는 J12, Spring `@Async`는 S15 참조.

## 2. 핵심 개념

| 용어 | 정의·경계 |
|---|---|
| `Executor` | `Runnable` 실행 계약. 호출 스레드에서 직접 실행할 수도 있다. |
| `ExecutorService` | 작업 제출, `Future`, 취소와 종료를 관리한다. |
| `ThreadPoolExecutor` | 작업자·큐·생존 시간·거절 정책을 조합하는 실행기다. |
| `Future<T>` | 완료·취소·결과 조회. `get()`은 블로킹하고 실패를 `ExecutionException`으로 감싼다. |
| `CompletableFuture<T>` | 완료 단계 연결이 가능한 `Future`/`CompletionStage` 구현이다. |
| CAS | 예상 값과 현재 값이 같을 때만 교체하는 원자 연산이다. |
| `BlockingQueue` | 용량 조건에서 생산자·소비자를 대기시키며 메모리 가시성도 제공한다. |
| 동기화 도구 | latch는 완료 게이트, semaphore는 permit 수, barrier는 단계 합류를 조정한다. |
| work-stealing | `ForkJoinPool`이 다른 작업자의 분할 작업을 가져오는 방식이다. |

| 비교 | 차이와 선택 |
|---|---|
| `execute` / `submit` | 결과·취소 조회가 필요하면 `submit`의 `Future`; 둘 다 거절될 수 있다. |
| `thenApply` / `thenCompose` | 값 변환 / 후속 비동기 결과를 평탄화. 후자는 중첩 Future 방지에 쓴다. |
| `thenX` / `thenXAsync` | 완료 스레드에서 실행될 수 있음 / 실행기 사용. `Async`에 실행기 없으면 기본 풀을 쓴다. |
| `AtomicLong` / `LongAdder` | 단일 값의 정확한 원자 업데이트 / 경합 큰 통계 합산. |
| `ReadWriteLock` / `StampedLock` | 재진입 읽기·쓰기 잠금 / 비재진입 stamp와 낙관 읽기. |
| latch / semaphore / barrier | 일회성 완료 / 동시 점유 제한 / 정해진 참여자의 재사용 가능한 합류. |

## 3. 내부 동작·원리

### `ThreadPoolExecutor`: 큐가 스레드 증가를 결정한다

`execute`는 제출 때마다 최대 크기까지 스레드를 늘리지 않는다. 작업자 수가 코어보다 작으면 새 작업자를 만들고, 그렇지 않으면 큐 삽입을 시도한다. 큐가 거부한 뒤에야 최대 크기까지 늘리고, 그마저 불가능할 때 거절 정책을 적용한다.

```text
worker < core?  ─예→ 새 worker가 실행
       아니오 ↓
  queue.offer 성공? ─예→ 큐에서 대기
       아니오 ↓
worker < max? ─예→ worker 추가 / 아니오→ reject
```

무한 `LinkedBlockingQueue`는 코어 스레드가 바쁜 동안 계속 쌓이므로 `maximumPoolSize`가 사실상 작동하지 않고, 장기 과부하가 메모리 고갈과 긴 대기로 바뀐다. `ArrayBlockingQueue`는 백로그 크기를 제한하고, `SynchronousQueue`는 저장하지 않고 작업자에게 넘긴다. `AbortPolicy`는 예외로 실패를 알리고, `CallerRunsPolicy`는 풀 종료 전 제출 스레드가 작업해 입력을 늦춘다. 후자는 요청 스레드 지연이나 잠금 내 실행을 만들 수 있다. `DiscardPolicy`/`DiscardOldestPolicy`는 버려진 작업의 `Future`를 영원히 미완료로 둘 수 있어 완료를 기다리는 업무에는 피한다.

`shutdown()`은 새 작업을 거부하고 제출된 작업을 끝낸 뒤 종료한다. `shutdownNow()`는 대기 작업을 반환하고 실행 중 작업에는 interrupt를 요청할 뿐, 강제 종료하지 않는다. 종료 대기와 interrupt 협력을 작업 코드까지 설계한다.

### Future와 `CompletableFuture`: 실행 위치와 실패 흐름

`Future.get()`은 블로킹하고, 작업 실패를 `ExecutionException`으로 전달한다. `cancel(true)`도 interrupt 요청이지 코드 강제 종료가 아니다. `CompletableFuture`의 비-async 단계는 선행 완료 스레드 또는 완료 메서드의 호출자에서 실행될 수 있다. `*Async`에 실행기를 주지 않으면 Java 25에서는 common pool을 사용한다.

```text
supplyAsync → thenApply(값 변환) → thenCompose(비동기 결과 평탄화)
      └─ 실패 → exceptionally(복구) / handle(변환) / whenComplete(관찰)
```

`thenApply` 함수가 다른 Future를 반환하면 중첩되므로 비동기 다음 단계에는 `thenCompose`를 쓴다. `exceptionally`는 실패를 값으로 복구하고, `handle`은 성공·실패 양쪽을 새 값으로 바꾸며, `whenComplete`는 결과를 관찰한다. `join()`은 unchecked `CompletionException`, `get()`은 `ExecutionException`과 `InterruptedException`을 노출한다. `allOf()`는 완료 장벽이며 결과 컬렉션은 반환하지 않는다.

### 잠금, CAS, 고경합 카운터

`synchronized`는 모니터 진입·탈출로 잠금을 자동 반납한다. `ReentrantLock`은 `tryLock`, 시간 제한·인터럽트 대기, 여러 `Condition`이 필요할 때 쓰되 `unlock()`을 `finally`에서 보장한다. 공정 모드는 대기 순서를 고려하지만 처리량을 낮출 수 있고, 무인자 `tryLock()`은 공정 설정에서도 대기자를 앞지를 수 있다.

`ReadWriteLock`은 읽기 공유·쓰기 배타 방식이다. `ReentrantReadWriteLock`은 쓰기 잠금에서 읽기로 내려갈 수 있지만 읽기에서 쓰기로 승격할 수 없다. `StampedLock`은 낙관 stamp로 읽은 값을 먼저 복사한 뒤 `validate()`하고, 실패하면 읽기 잠금으로 재조회한다. 재진입 불가이므로 보호된 코드에서 같은 잠금을 다시 요구하면 멈출 수 있다.

CAS는 “현재 값이 예상값과 같을 때 교체”를 원자적으로 한다. 재시도 경합과 ABA(A→B→A로 돌아와 비교가 통과하는 현상)를 고려한다. 여러 원자 변수로 나눈 상태 전체가 원자적인 것은 아니다. `LongAdder`는 고경합 업데이트를 여러 셀로 분산하지만 `sum()`은 단일 시점의 원자 스냅샷이 아니다. 통계에는 적합하고 잔액 검사·고유 번호 같은 제어에는 부적합하다.

### `ConcurrentHashMap`, 큐와 조정 도구

Java 8 이후 `ConcurrentHashMap`은 segment 대신 power-of-two bin 테이블을 사용한다. 빈 bin 삽입에는 CAS를 쓰고 충돌 bin은 선두 노드 중심으로 갱신한다. 조회는 테이블 전체 잠금을 요구하지 않는다. 긴 충돌 bin은 트리화하고, resize 중 `MOVED` forwarding node를 두어 작업자들이 bin 이동에 참여할 수 있다. 따라서 동시 갱신 중 `size()`·순회는 전체 원자 스냅샷이 아니다. `computeIfAbsent`/`merge`는 키 단위 복합 갱신을 원자화하지만 매핑 함수에 느린 I/O나 같은 맵의 재귀 갱신을 넣지 않는다. null 키·값은 허용되지 않는다.

`BlockingQueue.put/take`는 가득 참·비어 있음에서 기다리고, `offer/poll`은 즉시 또는 제한 시간 내 결과를 준다. 큐 삽입 전 생산자의 동작은 다른 스레드의 해당 원소 접근 이후와 happens-before 관계를 가진다.

| 도구 | 맞는 용도 | 조심할 점 |
|---|---|---|
| `CountDownLatch(n)` | n회 완료 후 여러 대기자 해제 | 일회성. 작업 실패에도 `finally`에서 count 감소 |
| `Semaphore(n)` | 제한된 자원의 동시 점유 수 | 소유권 없음. permit 회수 누수를 `finally`로 방지 |
| `CyclicBarrier(n)` | 고정 참여자의 반복 단계 합류 | 중단·시간 초과 시 barrier가 깨져 다른 참여자도 예외 |

### `ForkJoinPool`: 작업 분할과 work-stealing

작업자가 재귀 분할 작업을 처리하고, 한가하면 다른 작업자의 일을 훔친다. `RecursiveTask`/`RecursiveAction`으로 큰 CPU 계산을 나누는 데 맞는다. blocking I/O나 긴 잠금 대기는 작업자를 소진해 병렬 진행을 막으므로 별도 실행기 또는 `ManagedBlocker`를 고려한다.

Java 25에서 `ForkJoinPool`은 `ScheduledExecutorService`를 구현하고 `submitWithTimeout`을 제공한다. 이는 취소가 많은 timeout 예약의 처리 효율을 겨냥한 변화다. 예약 API가 있다는 이유로 blocking 업무까지 같은 풀에 섞지는 않는다.

## 4. 코드로 확인

아래 순수 Java 코드는 JDK 21로 실제 실행했다. 마지막 출력은 스레드 스케줄링과 무관하도록 latch로 작업 상태를 고정했다.

### 예제 1 — 제한된 큐, 최대 작업자, 거절

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class PoolDemo {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch started = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
                1, 2, 10, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(1),
                new ThreadPoolExecutor.AbortPolicy());
        Runnable task = () -> {
            started.countDown();
            try {
                release.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        };
        pool.execute(task); // core thread
        pool.execute(task); // queue
        pool.execute(task); // queue full: grow to maximum
        started.await();
        try {
            pool.execute(task); // saturated: rejected
        } catch (java.util.concurrent.RejectedExecutionException e) {
            System.out.println("rejected=" + e.getClass().getSimpleName());
        }
        System.out.printf("pool=%d active=%d queued=%d%n",
                pool.getPoolSize(), pool.getActiveCount(), pool.getQueue().size());
        release.countDown();
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }
}
```

실제 출력:

```text
rejected=RejectedExecutionException
pool=2 active=2 queued=1
```

### 예제 2 — `thenCompose`와 예외 복구

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FutureDemo {
    public static void main(String[] args) {
        try (ExecutorService io = Executors.newSingleThreadExecutor()) {
            CompletableFuture<Integer> total = CompletableFuture
                    .supplyAsync(() -> "21", io)
                    .thenApply(Integer::parseInt)
                    .thenCompose(n -> CompletableFuture.supplyAsync(() -> n * 2, io));
            System.out.println("total=" + total.join());
            CompletableFuture<Integer> failed = CompletableFuture.supplyAsync(() -> {
                throw new IllegalStateException("remote failure");
            }, io);
            int recovered = failed.exceptionally(ex -> {
                Throwable cause = ex instanceof CompletionException ? ex.getCause() : ex;
                System.out.println("cause=" + cause.getClass().getSimpleName());
                return -1;
            }).join();
            System.out.println("recovered=" + recovered);
        }
    }
}
```

실제 출력:

```text
total=42
cause=IllegalStateException
recovered=-1
```

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 이전 한계 | 근거 |
|---|---|---|
| Java 5 | Executor, Future, 큐, 잠금, latch·semaphore의 표준 계약을 제공했다. 직접 스레드와 `wait/notify`만으로 작업 수명·결과·가시성을 재사용하기 어려웠다. | Java SE 25 API의 관련 클래스는 `Since: 1.5`. |
| Java 7 | `ForkJoinPool`이 재귀 분할과 work-stealing을 제공했다. 일반 풀에는 이 계산 모델이 없었다. | [`ForkJoinPool`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ForkJoinPool.html), Since 1.7. |
| Java 8 | `LongAdder`, 캐시용 `ConcurrentHashMap` 연산, ForkJoinPool 개선이 추가됐다. 단일 CAS 카운터 경합과 복수 호출로 쪼갠 키 갱신 문제를 다뤘다. | [JEP 155](https://openjdk.org/jeps/155). |
| Java 9 | `CompletableFuture` 개선과 `Flow`는 JEP 266, 형식 안전한 저수준 원자 접근은 `VarHandle` JEP 193으로 들어왔다. | [JEP 266](https://openjdk.org/jeps/266), [JEP 193](https://openjdk.org/jeps/193). |
| Java 25 | ForkJoinPool의 예약 API와 `submitWithTimeout`, `CompletableFuture` async 기본 실행을 common pool로 통일했다. 이전에는 parallelism<2일 때 새 스레드 fallback이 있었다. | [JDK-8362881](https://bugs.openjdk.org/browse/JDK-8362881). 취소가 많은 timeout 처리 성능을 위한 변화다. |

## 6. 실무 가이드

- 풀 기본값은 **유한 `ArrayBlockingQueue` + `AbortPolicy`를 지정한 `ThreadPoolExecutor`**다. 큐 대기, 거절 수, 활성·완료 작업을 보고 크기를 조정한다.
- 결과 대기에는 timeout 있는 `Future`; 여러 단계를 조합할 때는 `CompletableFuture`와 명시 실행기를 쓴다. I/O 실행기는 common pool의 계산 작업과 분리한다.
- 여러 필드의 불변식은 우선 하나의 `synchronized`/`ReentrantLock`으로 묶는다. timeout 획득, 인터럽트 대기, 복수 `Condition`이 필요할 때 `Lock`을 고른다.
- 읽기 잠금 계열은 측정 뒤 도입한다. 낙관 읽기의 재검증을 감당할 수 있을 때만 `StampedLock`을 쓴다.
- 정확한 원자값은 `AtomicLong`, 경합 큰 통계는 `LongAdder`. 키 단위 갱신은 `ConcurrentHashMap.compute`/`merge`로 원자화한다.
- 자원 동시 점유를 제한하면 `Semaphore` permit을 `finally`에서 반납한다. 반복적 CPU 분할은 `ForkJoinPool`; blocking I/O는 전용 실행기로 분리한다.
- 실행기 종료 때 `shutdown`·`awaitTermination`을 호출하고, 인터럽트에 협력하도록 작업을 작성한다.

## 7. 함정·안티패턴

1. **힙이 차고 지연이 누적됨** → 무한 큐에 처리량보다 많은 작업이 쌓임 → 유한 큐, 거절·역압력, 큐 대기 경보를 둔다.
2. **`Future.get()`이 영원히 대기** → discard 정책이 제출 작업을 버림 → 기본은 `AbortPolicy`; 거절과 timeout을 호출자에게 전달한다.
3. **CF 단계가 요청 스레드를 점유** → 비-async 함수가 완료 스레드에서 블로킹 → I/O와 계산 단계를 다른 실행기로 분리한다.
4. **비동기 체인에서 실패가 숨음** → 실패 뒤 성공 전용 단계는 실행되지 않음 → 경계에서 `exceptionally`/`handle`하고 cause를 기록한다.
5. **락 이후 전체 처리가 정지** → `unlock` 누락 또는 StampedLock 재진입 오해 → `finally`로 해제하고 중복 획득 호출을 제거한다.
6. **조건부 카운터 결과가 틀림** → `LongAdder.sum()`을 제어 값으로 사용하거나 여러 atomic 값을 하나의 불변식으로 취급 → 단일 잠금 또는 CAS 상태로 보호한다.
7. **맵에 중복 생성·지연** → `get`/`put` 분리 또는 느린 I/O를 `computeIfAbsent`에 넣음 → 원자 키 API와 짧은 매핑 함수를 쓴다.
8. **ForkJoin 계산도 멈춤** → 작업자가 블로킹 I/O를 기다림 → blocking 경로를 분리하거나 `ManagedBlocker`를 쓴다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `maximumPoolSize`를 늘렸는데 worker 수가 그대로인 이유는?

코어가 찬 뒤 executor는 먼저 큐에 삽입한다. 큐가 받아 주면 최대 worker까지 늘리지 않는다.

**꼬리질문:** 포화 시 작업을 거절하려면? → 유한 큐와 명시 거절 정책을 조합한다.

### Q2. `thenApply`는 비동기인가? `thenApplyAsync`는 새 스레드를 만드는가?

`thenApply`는 완료 스레드에서 실행될 수 있다. `thenApplyAsync`도 명시 실행기가 없으면 Java 25 common pool을 쓸 뿐 새 스레드를 보장하지 않는다.

**꼬리질문:** blocking HTTP는 어디서 실행할까? → 전용 I/O 실행기를 지정한다.

### Q3. `thenApply` 대신 `thenCompose`가 필요한 경우는?

함수가 비동기 결과를 반환할 때다. `thenApply`면 중첩 Future가 되고 `thenCompose`는 한 단계로 평탄화한다.

**꼬리질문:** 독립 단계 둘을 묶으려면? → `thenCombine`; 완료만 모으면 `allOf`를 쓴다.

### Q4. `Future.cancel(true)`면 작업이 즉시 종료되는가?

아니다. 실행 스레드에 interrupt를 요청하고, 코드는 이에 협력해야 한다.

**꼬리질문:** `CompletableFuture.cancel`은? → 완료 상태를 취소로 만들지만 실제 계산을 강제 중단하지 않는다.

### Q5. `LongAdder`가 `AtomicLong`보다 나은가?

경합이 큰 통계 업데이트에는 유리하지만 `sum()`은 원자 스냅샷이 아니다. 잔액·순번 등 제어 값에는 적절하지 않다.

**꼬리질문:** 여러 필드 상태의 원자성은? → 각 원자 변수만으로는 보장되지 않아 잠금이나 단일 CAS 상태가 필요하다.

### Q6. `ConcurrentHashMap`의 `containsKey` 후 `put`은 원자적인가?

아니다. 두 호출 사이에 다른 스레드가 갱신할 수 있다. `putIfAbsent`나 `computeIfAbsent`를 쓴다.

**꼬리질문:** 동시 갱신 중 `size()`는 전체 스냅샷인가? → 아니다. 전체 맵을 잠그지 않는 관찰값이다.

### Q7. 읽기 잠금에서 쓰기 잠금으로 승격할 수 있나?

`ReentrantReadWriteLock`은 승격을 지원하지 않아 여러 reader가 쓰기 잠금을 기다리면 교착할 수 있다.

**꼬리질문:** 쓰기에서 읽기로 내려가려면? → 읽기 잠금을 추가 획득한 다음 쓰기 잠금을 놓는다.

### Q8. latch·semaphore·barrier 중 자원 풀 제한에 쓸 것은?

`Semaphore`다. permit 수가 동시 점유 수를 제한한다. latch는 일회성 완료, barrier는 정해진 참여자의 반복 합류다.

**꼬리질문:** permit 반납은 어디서? → 예외에도 누수되지 않도록 `finally`에서 `release()`한다.

### Q9. ForkJoinPool의 work-stealing은 blocking I/O 정체도 해결하나?

아니다. 분할 계산을 나누는 방식이며, 작업자 모두가 대기하면 진행이 느려진다.

**꼬리질문:** 피할 수 없는 blocking이면? → `ManagedBlocker` 또는 별도 실행기를 사용한다.

## 9. 참고문헌

- Java SE 25 `java.util.concurrent` package — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html — 실행기, Future, 큐, 동기화 도구의 패키지 개요와 메모리 가시성 계약.
- Java SE 25 `ThreadPoolExecutor` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html — 큐 선택, 풀 성장 순서, 거절 정책, 종료 동작.
- Java SE 25 `CompletableFuture` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html — 단계 실행 스레드, async 기본 실행기, 예외·조합 API.
- Java SE 25 `ForkJoinPool` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ForkJoinPool.html — work-stealing과 blocking 관리.
- Java SE 25 `StampedLock` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/StampedLock.html — stamp, 낙관 읽기 검증, 재진입 금지.
- Java SE 25 `ReentrantLock` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html — 재진입, 공정성, 인터럽트 대기와 `Condition`.
- Java SE 25 `ReadWriteLock` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReadWriteLock.html — 읽기 공유와 쓰기 배타 계약.
- Java SE 25 `ReentrantReadWriteLock` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantReadWriteLock.html — 공정성, 잠금 다운그레이드와 승격 제약.
- Java SE 25 `LongAdder` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/LongAdder.html — 경합 분산과 합계의 용도·한계.
- Java SE 25 `ConcurrentHashMap` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html — 조회·키 연산 계약, null 금지, 동시 bulk 작업.
- OpenJDK 25 `ConcurrentHashMap.java` — https://github.com/openjdk/jdk/blob/jdk-25-ga/src/java.base/share/classes/java/util/concurrent/ConcurrentHashMap.java — CAS, forwarding node 및 동시 resize 구현 근거.
- Java SE 25 `BlockingQueue` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/BlockingQueue.html — blocking/nonblocking 삽입·제거와 happens-before.
- Java SE 25 `CountDownLatch` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CountDownLatch.html — 일회성 완료 게이트와 가시성 계약.
- Java SE 25 `Semaphore` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Semaphore.html — permit 수량 제어와 acquire/release 계약.
- Java SE 25 `CyclicBarrier` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CyclicBarrier.html — 반복 단계 합류, barrier action, broken 상태.
- JEP 155: Concurrency Updates — https://openjdk.org/jeps/155 — Java 8의 LongAdder, ConcurrentHashMap·ForkJoin 개선 동기.
- JEP 266: More Concurrency Updates — https://openjdk.org/jeps/266 — Java 9의 `CompletableFuture` 개선 및 `Flow` 추가.
- JEP 193: Variable Handles — https://openjdk.org/jeps/193 — 저수준 원자 접근과 메모리 순서 제어를 위한 `VarHandle`.
- JDK-8362881: Updates to ForkJoinPool and CompletableFuture — https://bugs.openjdk.org/browse/JDK-8362881 — Java 25 예약 실행 API, `submitWithTimeout`, 기본 async 실행기 변경.
