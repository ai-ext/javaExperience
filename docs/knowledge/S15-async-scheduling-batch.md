# S15. 비동기·스케줄링·Spring Batch

> `@Async`는 호출 스레드와 작업 스레드를 나누고, 실행기 설정은 대기열과 과부하 동작까지 결정한다.
> `@Scheduled`는 각 애플리케이션 인스턴스의 시계에 등록된다. 여러 인스턴스에서 한 번만 실행하려면 공유 저장소의 분산 잠금이 필요하다.
> Spring Batch는 작업 상태와 체크포인트를 저장해 실패 후 이어서 처리한다. 재시작 안전성은 저장소뿐 아니라 입력과 부수 효과의 멱등성에 달렸다.

## 1. 왜 알아야 하나
대량 정산을 `@Async`에 맡기고 HTTP 성공을 돌려줬지만 배포 재시작으로 작업이 사라질 수 있다. 복제본 세 개인 서비스에서 새벽 `@Scheduled` 정산은 각 프로세스가 실행하므로 세 번 청구될 수 있다. 또 DB 청크는 롤백됐는데 외부 API 호출은 성공했다면 재시작 시 API가 중복 호출된다. 비동기 실행, 중복 방지, 체크포인트, 외부 효과의 멱등성을 한 설계로 봐야 한다.

이 문서는 `@Async`·`TaskExecutor`, `@Scheduled`·ShedLock, Batch의 Job·Step·chunk·JobRepository를 다룬다. 프록시 경계 → S02, Virtual Thread → S07, 메시징 → S14 참조.

## 2. 핵심 개념
| 용어 | 뜻 |
|---|---|
| `TaskExecutor` / `TaskScheduler` | 즉시 제출한 작업을 실행 / 시간 조건 작업을 등록하는 Spring 추상화. 구현은 동기 실행기부터 스레드 풀까지 다르다. [1] |
| `@Async` | 호출을 실행기에 넘기는 비동기 경계. 작업 유실 방지나 큐잉을 자동 제공하지 않는다. |
| fixed rate / fixed delay | 계획된 시작 시각 간격 / 앞 실행 완료 후 대기 간격. [6] |
| ShedLock | 외부 저장소 잠금으로 중복 동시 실행을 막는다. 다른 노드의 호출은 대기하지 않고 건너뛰며, 분산 스케줄러는 아니다. [5] |
| Job / Step / chunk | 배치 작업 / 작업 단계 / 항목을 읽고 처리·기록해 커밋하는 묶음. |
| JobInstance / JobExecution | Job과 식별 매개변수로 정한 논리 작업 / 그 작업의 한 차례 실행 시도. |
| JobRepository / ExecutionContext | 실행·재시작 메타데이터 저장소 / 다음 시도에 넘길 진행 상태. |

`@Async`와 `@Scheduled`는 프로세스 안의 실행을 다룬다. JobRepository는 Batch 상태를 다룬다. 따라서 비동기 메서드가 곧 재시작 가능한 Job인 것은 아니다.

| 비교 | 선택 기준 |
|---|---|
| `TaskExecutor` vs `TaskScheduler` | 작업을 지금 실행할지, 나중·주기 실행으로 등록할지. |
| fixed rate vs fixed delay | 시작 주기를 맞출지, 완료 후 휴지 시간을 보장할지. |
| `@Async` vs Batch | 유실 가능한 짧은 메서드 작업인지, 재시작·이력이 필요한 장기 작업인지. |
| JobInstance vs JobExecution | 같은 매개변수의 실패 재시도인지, 새 논리 작업인지. |
| ShedLock vs 분산 스케줄러 | 겹친 실행을 잠금으로 건너뛰면 되는지, 실행을 예약·대기·관리해야 하는지. [5] |

## 3. 내부 동작·원리
### 3.1 `@Async`: 프록시가 실행기에 제출

1. `@EnableAsync`가 비동기 인프라를 등록한다. 호출이 프록시를 지나야 인터셉터가 개입하며, 자기 호출은 우회할 수 있다(프록시 → S02).
2. 프록시는 메서드 호출을 지정된 `TaskExecutor`에 제출한다. `@Async("ioExecutor")`는 실행기를 이름으로 고른다.
3. 실행기는 작업을 시작·대기·거부한다. 큐 용량과 거부 정책에 따라 과부하 시 예외, 호출 스레드 실행, 대기가 발생한다.
4. Future 반환은 호출자가 결과·예외를 관찰하게 한다. `void` 예외는 호출자에게 돌아오지 않으므로 `AsyncUncaughtExceptionHandler`나 내부 로깅이 필요하다.

Spring의 `TaskExecutor`는 JDK `Executor`와 실행 환경 차이를 감춘다. `SyncTaskExecutor`는 동기 실행, `SimpleAsyncTaskExecutor`는 스레드를 재사용하는 풀이 아니다. 풀을 원하면 `ThreadPoolTaskExecutor`처럼 용량을 드러내는 구현을 쓴다. [1] Boot 4.1은 사용자 `Executor`가 없으면 `AsyncTaskExecutor`를 구성한다. Virtual Thread 설정에 따라 구현이 달라지며, MVC·WebFlux 통합에는 `applicationTaskExecutor` 이름이 요구될 수 있다. [2]

호출 스레드의 트랜잭션·`ThreadLocal` 보안 주체·MDC가 작업 스레드에 자동 전달된다고 가정하지 않는다. 필요한 값은 인자로 넘기고, 트랜잭션은 작업 경계에서 별도로 연다.

### 3.2 `@Scheduled`: 각 프로세스의 시간표

`@EnableScheduling`이 `@Scheduled`를 등록하고 `TaskScheduler`가 로컬 프로세스에서 실행한다. Spring cron은 초 필드를 포함한 여섯 필드이며, 업무 시간대를 `zone`으로 지정한다. fixed rate는 시작 주기, fixed delay는 완료 후 대기 시간이다. JDK 주기 실행기도 상대 지연을 받으므로 절대 시계와 실행 시각이 항상 일치하지 않는다. [6]

```text
노드 A: cron 도달 → 실행    노드 B: cron 도달 → 실행
                         ↓ 공유 저장소 잠금
노드 A: 잠금 획득 → 실행   노드 B: 잠금 실패 → 이번 호출 건너뜀
```

ShedLock은 외부 저장소의 시간 기반 잠금이다. 노드 시계 동기화를 전제하며, 최대 잠금 시간이 실제 수행시간보다 짧으면 기존 작업이 끝나기 전에 다른 노드가 잠금을 얻을 수 있다. 반대로 너무 길면 노드 장애 후 재실행을 지연시킨다. 건너뛴 호출은 큐에 쌓이지 않으므로 다음 주기 회복 여부와 멱등성을 설계한다. [5]

### 3.3 Batch의 실행·체크포인트

```text
JobLauncher(Job + JobParameters)
       ↓
JobRepository ─ JobInstance(논리 작업) / JobExecution(실행 시도)
       ↓
StepExecution → read → process → write → chunk commit / checkpoint
       └ 실패 시 상태 기록, 재시작 가능한 입력 상태부터 재실행
```

식별 JobParameters는 JobInstance를 구분한다. 영업일 정산은 영업일을 식별자로 두면 실패 재시도 때 같은 값을 사용하고 다음 날 새 값을 쓴다. 매 재시도마다 UUID를 넣으면 새 JobInstance가 되어 체크포인트를 이어 쓰지 못한다.

Chunk는 정한 건수 단위로 읽고 가공해 기록한 뒤 트랜잭션을 커밋한다. 재시작은 JobRepository만으로 충분하지 않다. Reader가 진행 위치를 저장·복원하고, 저장소 메타데이터도 재기동 후 남아야 한다. DB 롤백은 이미 성공한 외부 HTTP·파일·메일을 취소하지 않으므로 멱등 키나 중복 제거도 필요하다.

Spring Batch 6은 공통 인프라 설정과 저장소별 설정을 분리했다. 공식 변경 문서는 `@EnableBatchProcessing`이 JDBC에만 묶이지 않으며 JDBC·Mongo 저장소용 전용 애노테이션을 소개한다. 새 chunk 구현·동시성 모델, 실패 실행 복구, graceful shutdown, JFR 관측성, local chunking·remote step도 변경 목록에 포함한다. 운영 재시작이 필요하면 resourceless 인프라와 내구성 저장소를 구분해 선택한다. [4]

## 4. 코드로 확인

### 예제 1 — 고정 주기와 완료 후 지연 (순수 Java)

다음 프로그램은 각 작업을 80ms 동안 실행하지만 두 방식 모두 설정값은 50ms다. 실제 시작 간격을 비교한다. 값은 머신 부하에 따라 달라질 수 있다. 두 API는 상대 지연을 사용한다. [6]

```java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class SchedulerTimingDemo {
    public static void main(String[] args) throws InterruptedException {
        run("fixed-rate", true);
        run("fixed-delay", false);
    }

    private static void run(String label, boolean fixedRate) throws InterruptedException {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        AtomicInteger runNumber = new AtomicInteger();
        CountDownLatch finished = new CountDownLatch(3);
        long startedAt = System.nanoTime();

        Runnable task = () -> {
            int number = runNumber.incrementAndGet();
            long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
            System.out.printf("%s start #%d at %dms%n", label, number, elapsedMs);
            try {
                Thread.sleep(80);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                scheduler.shutdown();
            } finally {
                finished.countDown();
            }
            if (number == 3) {
                scheduler.shutdown();
            }
        };

        if (fixedRate) {
            scheduler.scheduleAtFixedRate(task, 0, 50, TimeUnit.MILLISECONDS);
        } else {
            scheduler.scheduleWithFixedDelay(task, 0, 50, TimeUnit.MILLISECONDS);
        }

        finished.await();
        scheduler.awaitTermination(1, TimeUnit.SECONDS);
    }
}
```

JDK 21 Corretto에서 실제 실행한 출력:

```text
fixed-rate start #1 at 1ms
fixed-rate start #2 at 92ms
fixed-rate start #3 at 173ms
fixed-delay start #1 at 0ms
fixed-delay start #2 at 137ms
fixed-delay start #3 at 281ms
```

fixed rate는 이전 실행이 끝나지 않았다고 같은 주기 작업을 동시에 겹쳐 실행하지 않는다. 늦어진 작업은 다음 시작이 밀리거나 가능한 시점에 이어진다. fixed delay는 매번 완료 후 50ms를 더 기다린다. 따라서 완료 후 휴지 시간을 보장하는 작업은 fixed delay가 더 직접적이다. 이 예제는 JDK 실행기 동작을 확인할 뿐, 여러 노드에서 한 번만 실행하는 Spring 분산 잠금을 검증하지 않는다.

### 예제 2 — 업무별 제한이 있는 `@Async` 실행기

Spring Boot 앱의 컴포넌트 스캔 안에 두 클래스를 둔다. 실제 외부 I/O 대신 실행 스레드 이름을 반환한다. 큐와 스레드 수는 예시이므로 운영 부하에 맞게 조정한다. Spring 예제 (미실행).

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Configuration(proxyBeanMethods = false)
@EnableAsync
class AsyncConfiguration {
    @Bean("ioBoundExecutor")
    ThreadPoolTaskExecutor ioBoundExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("io-bound-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        return executor;
    }
}

@Service
class ReportService {
    @Async("ioBoundExecutor")
    public CompletableFuture<String> generate(String reportId) {
        return CompletableFuture.completedFuture(
                reportId + " generated on " + Thread.currentThread().getName());
    }
}
```

호출자는 반환된 Future에 `thenApply`, `whenComplete` 또는 `exceptionally`를 연결해 결과와 실패를 소비한다. 완료를 관찰하지 않는 호출은 “성공 응답은 받았지만 작업은 실패” 상태를 만들기 쉽다. Boot 문서상 MVC·WebFlux 등은 `applicationTaskExecutor`라는 이름을 요구하는 통합이 있으므로, 웹 요청 처리기와 별도 업무 실행기를 함께 두면 이름·타입 요구를 각각 만족시키도록 설정한다. [2]

### 예제 3 — 시간대와 주기를 드러내는 스케줄

cron은 초부터 시작하는 Spring의 여섯 필드 표현식이다. 새벽 03:00 UTC에 한 번, 정리 작업은 앞선 실행 완료 5분 뒤에 다시 시작한다. Spring 예제 (미실행).

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
class SchedulingConfiguration {
}

@Component
class MaintenanceJobs {
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void dailyReconciliation() {
        System.out.println("start daily reconciliation");
    }

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT30S")
    public void cleanupExpiredRows() {
        System.out.println("start cleanup");
    }
}
```

복제본 환경에서 한 번만 실행해야 한다면 공유 잠금 Provider와 ShedLock 애노테이션을 함께 설정한다. 실행시간이 잠금 만료를 넘거나 호출을 건너뛰면 안 되면 ShedLock만으로 충분하지 않다.

### 예제 4 — 명시적 JobRepository와 청크 경계

Boot 4.1이 관리하는 Spring Batch 6 계열 API의 `JobBuilder`·`StepBuilder` 형식이다. 단순 목록을 쓰는 예시이므로 입력 위치 체크포인트나 운영용 재시작을 보여 주지는 않는다. 운영 Job은 재시작 가능한 Reader와 내구성 있는 JobRepository를 구성해야 한다. Spring 예제 (미실행).

```java
import java.util.List;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.support.ListItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration(proxyBeanMethods = false)
class ImportJobConfiguration {
    @Bean
    ItemReader<String> sourceReader() {
        return new ListItemReader<>(List.of("  alpha  ", " beta ", "gamma"));
    }

    @Bean
    Step normalizeStep(JobRepository jobRepository,
                       PlatformTransactionManager transactionManager,
                       ItemReader<String> sourceReader) {
        return new StepBuilder("normalizeStep", jobRepository)
                .<String, String>chunk(2, transactionManager)
                .reader(sourceReader)
                .processor(String::trim)
                .writer(chunk -> chunk.forEach(System.out::println))
                .build();
    }

    @Bean
    Job normalizeJob(JobRepository jobRepository, Step normalizeStep) {
        return new JobBuilder("normalizeJob", jobRepository)
                .start(normalizeStep)
                .build();
    }
}
```

`chunk(2, transactionManager)`는 두 항목 단위 커밋이다. 이 목록 Reader는 영속 체크포인트가 아니므로 운영 재시작에는 JobParameters와 저장 상태를 따로 설계한다. Boot 자동 실행이 필요 없으면 `spring.batch.job.enabled=false`를 고려한다.

## 5. 버전별 변화 — 왜 바뀌었나
- **Java 5** — `ScheduledExecutorService`가 지연·주기 작업 API로 추가됐다. 직접 `sleep` 루프를 관리하던 부담을 실행기 계약으로 옮겼다. [6]
- **Spring 실행 추상화** — `TaskExecutor`·`TaskScheduler`는 JDK와 애플리케이션 실행 환경의 차이를 감추는 역할을 한다. 이번에 읽은 현재 레퍼런스에서 세부 도입 버전 이력은 확인하지 않아 날짜를 단정하지 않는다. [1]
- **Spring Batch 6.0** — Framework 7 등 의존성을 올리고 JDBC에 묶인 설정을 공통·저장소별로 나눴다. 새 chunk·동시성 모델, 실패 실행 복구, graceful shutdown, local chunking 등이 추가됐다. 다양한 저장소와 실행 경로를 수용하려는 변화다. [4]
- **Boot 4.1 현재** — `Executor` Bean이 없을 때 자동 `AsyncTaskExecutor`를 제공하며 Virtual Thread 설정에 따라 구현이 다르다. 이전 버전 대비 도입 시점은 확인하지 않았다. [2]

## 6. 실무 가이드
- 유실 없이 재기동 후 이어야 하는 작업은 단순 `@Async`가 아니라 Spring Batch나 내구성 있는 작업 전달 구조로 만든다.
- **기본값 추천:** 업무별 이름을 가진 `ThreadPoolTaskExecutor`에 유한 큐, 명시적 거부 정책, 종료 대기 시간을 둔다. 풀 크기는 CPU·DB 연결·원격 동시 한도에 맞춰 부하 관찰 후 정한다.
- 지속 유입량이 소비량보다 큰데 큐만 늘리면 지연과 메모리 사용이 누적된다. 실행기 대기시간·큐 길이·거부 건수를 관측한다.
- 완료 후 쉬는 간격은 fixed delay, 예정된 시작 주기 기준은 fixed rate로 선택한다. cron에는 업무 시간대를 명시하고 DST 경계를 점검한다.
- 여러 복제본 중 한 곳만 실행하면 되는 작업은 ShedLock을 설정하고, 건너뛰어도 다음 주기 회복이 가능한지 판단한다. 놓치면 안 되는 작업은 분산 스케줄러·내구성 큐를 검토한다.
- JobParameters는 논리 작업의 기준일·테넌트 등으로 설계한다. 운영 재시작에는 내구성 JobRepository, 상태 저장 Reader, 멱등 Writer를 함께 쓴다.
- 큰 입력은 페이지·커서·키셋 읽기를 검토한다. chunk 크기는 트랜잭션 시간·롤백량·메타데이터 오버헤드를 실측해 조정한다. 병렬화는 독립 파티션을 우선 검토하고 Reader·Writer의 thread safety를 확인한다.
- Virtual Thread → S07, 메시지 전달과 재시도 → S14 참조.

## 7. 함정·안티패턴
1. **`@Async` 미동작** → 자기 호출이 프록시를 우회 → Bean 경계로 나누고 프록시 제약은 S02 참조.
2. **큐 대기·메모리 폭증** → 무제한 또는 과대 큐에서 유입이 처리량을 초과 → 유한 큐, 거부 정책, 대기시간 관측을 둔다.
3. **비동기 예외 유실** → `void` 또는 무시된 Future → Future 실패를 소비하고 `void`는 예외 핸들러·로깅을 둔다.
4. **인증·트랜잭션 컨텍스트 소실** → 스레드 경계를 자동 전파로 오해 → 필요한 값을 전달하고 작업 내 트랜잭션을 연다.
5. **복제본 수만큼 스케줄 중복** → `@Scheduled`는 노드별 등록 → 공유 저장소 잠금 또는 분산 스케줄러와 업무 멱등성을 쓴다.
6. **잠금 만료 전 작업 미완료** → `lockAtMostFor`가 짧아 잠금이 먼저 풀림 → 최장 수행시간·타임아웃을 측정하고 잠금 시간을 정한다.
7. **cron 실행 시각 불일치** → 시간대 생략·DST 미검토 → `zone`을 명시하고 달력 경계를 점검한다.
8. **Batch 재시작이 처음부터 시작** → Reader 상태가 저장되지 않거나 재시도마다 JobParameters를 변경 → 재시작 가능 입력·내구성 저장소·고정 식별자를 쓴다.
9. **외부 효과 중복** → DB 롤백이 외부 요청은 되돌리지 않음 → 멱등 키·중복 제거를 추가한다.
10. **큰 chunk의 긴 롤백** → 트랜잭션 범위가 과도함 → 항목 크기와 실패 복구량을 포함해 작은 값부터 측정한다.

## 8. 자가점검 Q&A (면접 대비)
### Q1. `@Async`는 메서드를 무조건 새 스레드에서 실행하나?

아니다. 프록시가 호출을 실행기에 넘기는 구조이고 실행기 설정에 따라 동기 실행도 가능하다. 애노테이션만으로 스레드 수나 내구성을 알 수 없다.

**꼬리질문:** 자기 호출 문제는? → 프록시를 통과하지 않아 인터셉터가 실행되지 않을 수 있다. 자세한 원리는 → S02.

### Q2. 실행기 큐를 크게 하면 처리량이 늘어나는가?

순간 급증을 흡수할 뿐 소비 속도를 높이지 않는다. 지속 과부하는 대기시간·메모리 증가로 나타난다. 유한 큐와 거부 정책으로 역압을 설계한다.

**꼬리질문:** 호출자 실행 거부 정책의 영향은? → 제출 스레드가 작업을 맡아 요청 경로가 느려질 수 있다.

### Q3. fixed rate와 fixed delay의 차이는?

fixed rate는 예정된 시작 시각 간격, fixed delay는 앞 실행 완료 후 지연이다. 완료 후 휴지 시간이 필요하면 fixed delay를 쓴다. 주기보다 오래 걸릴 때 실행기의 지연 동작도 확인한다.

**꼬리질문:** 동일 JDK 주기 작업은 겹치는가? → 앞 실행이 끝나기 전에 같은 주기 작업이 동시에 실행되지는 않지만, 별도 등록·노드 간 중복은 가능하다. [6]

### Q4. `@Scheduled`는 여러 노드에서 한 번만 실행되는가?

아니다. 각 컨텍스트가 스케줄을 등록한다. ShedLock은 잠금 실패 호출을 대기시키지 않고 건너뛴다. [5]

**꼬리질문:** 놓치면 안 되는 예약 실행에도 ShedLock만 쓰면 되나? → 아니다. 내구성 있는 예약·큐잉이 필요하면 분산 스케줄러나 작업 전달 구조를 쓴다.

### Q5. JobInstance와 JobExecution은?

JobInstance는 Job과 식별 매개변수의 논리적 조합이다. JobExecution은 한 차례 실행 시도다. 실패를 이어갈 재실행이면 식별 매개변수를 동일하게 유지한다.

**꼬리질문:** 재시도마다 UUID를 넣으면? → 매번 다른 JobInstance라 체크포인트를 이어갈 수 없다.

### Q6. JobRepository가 exactly-once를 보장하나?

아니다. Batch 메타데이터와 진행 상태를 기록하지만 외부 API·메일 효과까지 원자화하지 않는다. 재시도 시 중복 가능한 부수 효과는 멱등 키로 보호한다.

**꼬리질문:** 멱등 키는 어떤 값으로 만드나? → 재시도에도 같은 업무 ID·대상 기간 등 안정적인 식별자를 사용한다.

### Q7. chunk는 클수록 빠른가?

커밋 빈도를 낮출 수 있지만 트랜잭션·잠금·롤백 범위가 커진다. 데이터 크기와 Writer 비용을 포함해 측정한다.

**꼬리질문:** 너무 작으면? → 커밋과 체크포인트 오버헤드가 커진다.

### Q8. 공유 Reader를 병렬 Step에서 써도 되나?

thread safety, 읽기 순서, 체크포인트 경합을 확인해야 한다. 가능하면 입력 범위를 독립 파티션으로 나눠 각각 상태를 관리한다. Batch 6의 새 동시성 모델도 업무 상태 공유 문제를 없애지는 않는다. [4]

**꼬리질문:** 메시지 병렬 처리 설계는? → 이 문서 범위를 벗어나며 → S14 참조.

## 9. 참고문헌
1. Task Execution and Scheduling — https://docs.spring.io/spring-framework/reference/integration/scheduling.html — `TaskExecutor`·`TaskScheduler`와 실행기 종류.
2. Task Execution and Scheduling — https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html — Boot 자동 실행기와 `applicationTaskExecutor` 통합.
3. Spring Batch Reference Overview — https://docs.spring.io/spring-batch/reference/ — 안정 문서 버전과 공식 주제 구성.
4. What’s new in Spring Batch 6 — https://docs.spring.io/spring-batch/reference/whatsnew.html — Batch 6.0 인프라·chunk·동시성·복구 변경.
5. ShedLock — https://github.com/lukas-krecan/ShedLock — 잠금 동작, 노드 간 skip, 분산 스케줄러가 아닌 점.
6. ScheduledExecutorService (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ScheduledExecutorService.html — 상대 지연·주기 API.
