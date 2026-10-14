# H6. @Async와 스레드 풀 — 느린 일은 뒤에서

> 개념 레슨 · 35분

## 이게 뭐냐

H1에서 봤듯 톰캣은 요청마다 스레드(일꾼)를 하나 내어 준다. 그 스레드는 컨트롤러 → 서비스 → 리스너까지 **처음부터 끝까지 혼자** 일하고, 다 끝나야 응답을 보낸다. H5의 `AFTER_COMMIT` 리스너도 같은 스레드에서 돈다.

알림마다 외부 푸시 서버를 부르고, 한 건에 0.5초가 걸린다고 하자. 팔로워가 3명이면 글쓰기 응답이 1.5초 늦는다. 30명이면 15초다. 사용자는 푸시가 다 나갈 때까지 기다릴 이유가 없다.

`@Async`는 이렇게 말하는 표시다.

> **이 메서드는 지금 스레드에서 돌리지 말고, 다른 스레드에 맡겨라. 나는 기다리지 않고 바로 다음 줄로 간다.**

맡길 스레드는 **스레드 풀**에서 나온다. 스레드를 미리 몇 개 만들어 두고 일이 오면 빈 스레드에 준다. 모두 바쁘면 일을 **큐**(대기열)에 쌓아 둔다. 이 풀을 Spring에서는 실행기(`Executor`)라고 부른다.

필요한 것은 둘이다.

| 무엇 | 어디에 |
|---|---|
| `@EnableAsync` | `@Configuration` 클래스 하나에. 이게 없으면 `@Async`는 그냥 무시된다 |
| `@Async` | 다른 스레드에서 돌릴 메서드에. 반환형은 `void` 또는 `CompletableFuture` |

### 프록시 — `@Async`가 일하는 방법

Spring은 `@Async`가 붙은 빈을 그대로 주입하지 않는다. 겉모양이 같은 **대리 객체(프록시)** 로 감싸서 준다. 다른 빈이 `sender.sendAsync(1)`을 부르면 먼저 프록시가 받는다. 프록시는 "이 메서드에 `@Async`가 있네" 하고 실행기에 일을 넘긴 뒤 바로 돌아온다. G3에서 붙인 `@Transactional`도 이 방식으로 동작한다.

그래서 **같은 클래스 안에서 `this.메서드()`로 부르면** 프록시를 안 거치고 `@Async`가 무시된다. 아래에서 실측한다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18310`)을 만들어 돌렸다. 푸시 한 건은 `Thread.sleep(500)`으로 흉내 냈다.

```java
@Configuration
@EnableAsync
public class AsyncConfig {}

@Component
public class PushSender {
    public void send(long memberId) {          // 그냥 메서드
        sleep(500);
        log.info("푸시 보냄 memberId={}", memberId);
    }

    @Async
    public void sendAsync(long memberId) {     // 다른 스레드에서
        sleep(500);
        log.info("푸시 보냄 memberId={}", memberId);
    }
}

@Service
public class NotifyService {
    private final PushSender sender;   // 다른 빈 — 프록시가 들어온다

    public void notifySync()  { for (long id = 1; id <= 3; id++) sender.send(id); }
    public void notifyAsync() { for (long id = 1; id <= 3; id++) sender.sendAsync(id); }

    public void notifySelf()  { for (long id = 1; id <= 3; id++) this.pushInside(id); }

    @Async
    public void pushInside(long memberId) {     // 같은 클래스의 @Async
        sleep(500);
        log.info("푸시 보냄(같은 클래스) memberId={}", memberId);
    }
}
```

`curl -s -o /dev/null -w 'HTTP %{http_code} time_total=%{time_total}s\n' -X POST …`로 응답 시간을 쟀다. 로그의 `[…]`는 스레드 이름이다(앞부분 줄임).

**동기 — 1.66초**

```text
HTTP 200 time_total=1.664627s
16:01:54.192 [io-18310-exec-1] PushSender : 푸시 보냄 memberId=1
16:01:54.702 [io-18310-exec-1] PushSender : 푸시 보냄 memberId=2
16:01:55.205 [io-18310-exec-1] PushSender : 푸시 보냄 memberId=3
```

요청 스레드(`http-nio-18310-exec-1`)가 0.5초씩 세 번 기다렸다.

**`@Async` — 0.02초**

```text
HTTP 200 time_total=0.022551s
16:01:57.771 [task-2] PushSender : 푸시 보냄 memberId=2
16:01:57.776 [task-1] PushSender : 푸시 보냄 memberId=1
16:01:57.771 [task-3] PushSender : 푸시 보냄 memberId=3
```

응답은 바로 갔고, 푸시는 `task-1`~`task-3` 세 스레드가 **동시에** 0.5초 뒤 끝냈다. 순서도 섞였다.

**같은 클래스 `this.` 호출 — 1.55초**

```text
HTTP 200 time_total=1.552667s
16:01:59.807 [io-18310-exec-3] NotifyService : 푸시 보냄(같은 클래스) memberId=1
16:02:00.309 [io-18310-exec-3] NotifyService : 푸시 보냄(같은 클래스) memberId=2
16:02:00.823 [io-18310-exec-3] NotifyService : 푸시 보냄(같은 클래스) memberId=3
```

`@Async`를 붙였는데 요청 스레드에서 하나씩 돌았다. 에러도 경고도 없다. 고치는 법은 위처럼 **다른 빈**(`PushSender`)으로 옮기는 것이다.

### 예외는 어디로 가나

`@Async void` 메서드가 예외를 던지게 하고, 부르는 쪽을 `try/catch`로 감쌌다.

```text
$ curl -s -X POST localhost:18310/h6/fail-void
호출한 쪽은 예외를 못 봤다
```

```text
ERROR … [task-4] .a.i.SimpleAsyncUncaughtExceptionHandler : Unexpected exception occurred invoking async method: public void org.example.h6.PushSender.sendAsyncFail(long)

java.lang.IllegalStateException: 푸시 서버 오류 memberId=26
```

부른 쪽은 이미 다음 줄로 가 버려서 잡을 수 없다. 예외는 `task-4` 스레드에서 로그 한 줄로 끝난다. 실패를 기록하려면 `@Async` 메서드 **안에서** 잡아야 한다(16-2의 `FAILED` 기록).

결과가 필요하면 `CompletableFuture`를 돌려준다. 메서드 안에서는 `return CompletableFuture.completedFuture("SENT " + memberId);`처럼 감싸 돌려주고, 부른 쪽은 `join()`으로 기다린다. 실패하면 `join()`에서 예외가 나온다.

```text
join에서 잡았다: java.util.concurrent.CompletionException: java.lang.IllegalStateException: 푸시 서버 오류 memberId=26
```

단, `join()`은 끝날 때까지 **기다린다.** 응답 경로에서 `join()`하면 응답 시간이 다시 늘어난다.

### Boot가 만들어 주는 풀과 직접 만드는 풀

실행기를 따로 만들지 않으면 Boot 4.1이 `applicationTaskExecutor` 빈(`ThreadPoolTaskExecutor`)을 만든다. 스레드 이름은 `task-N`이다. 1초짜리 작업 10개를 한꺼번에 넣어 기본값을 확인했다.

| 설정 | 결과 |
|---|---|
| 기본값 | 스레드 `task-1`~`task-8`(**8개**), 다 끝나는 데 2.0초. 큐는 끝이 없다 |
| `spring.task.execution.pool.core-size=2` (6개 넣음) | 스레드 2개, 3.0초 |

풀의 순서가 중요하다. **core 수까지 스레드 → 큐 → 큐가 차면 max까지 스레드 → 그래도 넘치면 거절.** core 2, max 4, 큐 2로 두고 1초짜리 8개를 넣었다.

```text
작업 1 시작 thread=task-1
작업 2 시작 thread=task-2
작업 5 시작 thread=task-3
작업 6 시작 thread=task-4
작업 7 거절: org.springframework.core.task.TaskRejectedException: ExecutorService in active state did not accept task: …
작업 8 거절: org.springframework.core.task.TaskRejectedException: ExecutorService in active state did not accept task: …
작업 4 시작 thread=task-2
작업 3 시작 thread=task-4
```

마지막 두 줄은 1초 뒤에 찍혔다. 3·4는 큐에 들어가 1초를 기다렸고, 5·6이 오자 큐가 차서 스레드 3·4가 생겼다. 7·8은 갈 곳이 없어 **부른 쪽에서** `TaskRejectedException`이 났다. 큐를 끝없이 두면(기본값) max는 영영 안 쓰인다.

16-2처럼 업무별 풀을 직접 만들면 Boot의 풀은 **물러난다**. 아래 빈 하나만 두었더니 실행기 빈 목록이 `{"notificationExecutor": "…ThreadPoolTaskExecutor"}` 하나였고, 이름 없는 `@Async`도 `notify-1`·`notify-2`에서 돌았다.

```java
@Bean
public ThreadPoolTaskExecutor notificationExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(4);
    executor.setQueueCapacity(2);
    executor.setThreadNamePrefix("notify-");
    return executor;
}
// 쓰는 쪽: @Async("notificationExecutor")
```

여기에 `executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());`를 더해 같은 8개를 넣으면, 거절 대신 7·8을 **요청 스레드가 직접** 돌렸다(`thread=http-nio-18310-exec-1`). 일은 안 버리지만 요청이 2.0초 붙잡혔다(`submitMs: 2011`).

### 가상 스레드를 켜면

Java 21의 가상 스레드는 아주 가볍게 많이 만들 수 있는 스레드다. `spring.threads.virtual.enabled=true`를 켜면 Boot가 만드는 실행기가 바뀐다.

| | 끔(기본) | 켬 |
|---|---|---|
| `applicationTaskExecutor` 클래스 | `ThreadPoolTaskExecutor` | `SimpleAsyncTaskExecutor` |
| 1초 작업 10개(`core-size=2`도 줌) | `task-1`·`task-2`만, **5.0초** | `task-1`~`task-10` 동시, **1.0초** |
| `Thread.currentThread().isVirtual()` | `false` | `true` |

가상 스레드 모드는 **풀이 아니다.** 작업마다 새 스레드를 만들고(이름 번호가 계속 올라간다), `pool.*` 설정은 무시된다. 그래서 "동시에 몇 개까지"라는 제한이 사라진다. 직접 만든 `notificationExecutor` 빈이 있으면 가상 스레드를 켜도 그 풀(`notify-`, `isVirtual=false`)을 그대로 쓴다.

## 따라 해 보기

15분. 실습 레포에서 연습 패키지(`lab.h6`)를 만들어 한다. 끝나면 패키지째 지운다.

**1.** 위 예시의 `AsyncConfig`, `PushSender`, `NotifyService`를 붙여 넣고(`sleep`은 `Thread.sleep`을 `try/catch`로 감싼 정적 메서드), `POST /lab/h6/sync`·`/lab/h6/async`·`/lab/h6/self`가 각각 `notifySync()`·`notifyAsync()`·`notifySelf()`를 부르는 컨트롤러를 만든다. `/lab/**`가 토큰 검사에 걸리면 F2에서 만든 인증 필터의 제외 경로에 잠시 더한다.

**2.** 세 번 재 본다.

```bash
for p in sync async self; do
  curl -s -o /dev/null -w "$p %{time_total}s\n" -X POST http://localhost:8080/lab/h6/$p
done
```

`sync`·`self`는 1.5초 남짓, `async`는 0.1초 아래여야 한다. 앱 로그에서 `async`만 `task-…` 스레드인지 본다.

**3.** `application.yml`에 `spring.task.execution.pool.core-size: 1`을 넣고 다시 띄운다. `async`의 응답 시간은 그대로인데, 로그의 세 줄이 **0.5초 간격**으로 `task-1` 하나에서 찍힌다. 응답은 빨라도 일은 풀 크기만큼만 동시에 된다.

## 일부러 틀려 보기

**1. `@EnableAsync`를 지운다.** 실험 앱에서 지웠더니 `async`가 `1.656656s`로 돌아갔고, 로그가 요청 스레드(`http-nio-18310-exec-1`)에서 0.5초 간격으로 찍혔다. 에러는 없다. `@Async`가 안 먹으면 ① `@EnableAsync`, ② 같은 클래스 `this.` 호출부터 본다.

**2. `@Async` 메서드 안에서 예외를 안 잡는다.** 위 `fail-void`처럼 부른 쪽은 성공으로 안다. 16-2라면 글쓰기는 `201`인데 푸시 실패 기록(`FAILED`)이 하나도 안 남는다. 회원 한 명 단위로 `try/catch` 해서 기록하고 다음 회원으로 넘어간다.

**3. 큐를 작게 두고 거절 정책을 안 정한다.** 위 core 2·max 4·큐 2 실험처럼 바쁠 때 `TaskRejectedException`이 **부른 쪽**에서 난다. 거절된 7·8번 일은 아무도 실행하지 않았다. 알림이었다면 그대로 사라진다. 16-2가 큐 100에 `CallerRunsPolicy`를 쓰는 이유다.

## 확인 문제

**1.** `NotifyService` 안에서 `this.pushInside(id)`를 불렀다. `pushInside`에 `@Async`가 있는데 응답이 1.5초 걸린다. 왜이고, 어떻게 고치나?

<details>
<summary>정답</summary>

`@Async`는 **프록시**가 처리한다. `this.`는 프록시가 아니라 자기 자신을 바로 부르므로 그냥 메서드 호출이 된다. 로그의 스레드 이름도 요청 스레드(`http-nio-…`)였다. `@Async` 메서드를 **다른 빈**으로 옮겨 주입받아 부른다.
</details>

**2.** `@Async void` 메서드에서 예외가 났다. 부른 쪽의 `try/catch`는 잡나? 예외는 어디에 남나?

<details>
<summary>정답</summary>

**못 잡는다.** 부른 쪽은 일을 넘기자마자 다음 줄로 갔다. 예외는 작업 스레드에서 `SimpleAsyncUncaughtExceptionHandler`의 ERROR 로그(`Unexpected exception occurred invoking async method`)로만 남는다. 실패를 기록하려면 `@Async` 메서드 안에서 잡거나, `CompletableFuture`를 돌려받아 확인한다.
</details>

**3.** core 2, max 4, 큐 100인 풀에 1초짜리 작업 10개를 한꺼번에 넣었다. 스레드는 몇 개까지 늘어나나?

<details>
<summary>정답</summary>

**2개.** core까지 채운 뒤 나머지 8개는 큐(100칸)에 들어간다. max까지 늘리는 건 **큐가 가득 찼을 때**뿐이다. 실험에서 큐 2칸일 때는 5·6번째에서야 스레드 3·4가 생겼다.
</details>

**4.** `@Async` 메서드가 `CompletableFuture`를 돌려준다. 컨트롤러에서 바로 `join()`하고 응답했다. 응답이 빨라지나?

<details>
<summary>정답</summary>

**아니다.** `join()`은 작업이 끝날 때까지 기다린다. 일은 다른 스레드가 했지만 요청 스레드가 그만큼 기다렸다가 응답한다. 결과가 당장 필요 없을 때(알림, 푸시) 응답과 떼어 낼 수 있어야 빨라진다.
</details>

**5.** `spring.threads.virtual.enabled=true`를 켜고 `spring.task.execution.pool.core-size=2`를 두었다. 1초짜리 작업 10개는 몇 초에 끝나나? 동시 실행 수를 제한하려면?

<details>
<summary>정답</summary>

**약 1초.** 가상 스레드 모드의 Boot 실행기는 `SimpleAsyncTaskExecutor`라 작업마다 새 스레드를 만들고 `pool.*` 설정을 무시한다(실측 10개 동시, 1.0초). 제한이 필요하면 `ThreadPoolTaskExecutor` 빈을 직접 만든다. 그 빈이 있으면 가상 스레드를 켜도 그 풀을 쓴다.
</details>

## 더 깊이

- [S15 — @Async: 프록시가 실행기에 제출](../docs/knowledge/S15-async-scheduling-batch.md#31-async-프록시가-실행기에-제출)
- [S15 — 예제 2 업무별 제한이 있는 @Async 실행기](../docs/knowledge/S15-async-scheduling-batch.md#예제-2--업무별-제한이-있는-async-실행기)
- [W14 — 예제 3 @Async로 best-effort 후처리](../docs/knowledge/W14-sync-async-blocking.md#예제-3--async로-best-effort-후처리)
- [W25 — @Async로 실행한 작업은 호출한 트랜잭션에 포함되는가?](../docs/knowledge/W25-spring-multithreading.md#q7-async로-실행한-작업은-호출한-트랜잭션에-포함되는가) — 작업 스레드에는 부른 쪽 트랜잭션이 없다
- Spring Boot 4.1 Reference — Task Execution and Scheduling: https://docs.spring.io/spring-boot/4.1/reference/features/task-execution-and-scheduling.html
- `@EnableAsync` Javadoc(프록시 모드, 실행기 찾는 순서): https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/scheduling/annotation/EnableAsync.html
- `ThreadPoolTaskExecutor` Javadoc: https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/scheduling/concurrent/ThreadPoolTaskExecutor.html
- Java 21 `ThreadPoolExecutor`(core → 큐 → max → 거절): https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html

## 다음

- 실습: [16-2. 알림을 비동기로 — 느린 발송이 글쓰기를 막지 않게](../scenario/ch16-events-async-cache/16-2-async-notification.md) — `notificationExecutor`(core 2·max 4·큐 100·`CallerRunsPolicy`)로 커밋 뒤 알림을 넘기고, 푸시 실패를 `FAILED`로 남긴다.
- 레슨: [H7. 캐시 — @Cacheable과 무효화](H7-cache-cacheable-evict.md) — 같은 프록시가 이번에는 "메서드를 아예 안 부르기"를 한다.
