# H3. 스케줄링 — @Scheduled와 "지금 실행" API

> 개념 레슨 · 40분

## 이게 뭐냐

"매일 0시에 명예의 전당을 계산해 주세요." 이 일은 아무도 요청을 보내지 않는다. 서버가 **정해진 시각에 스스로** 메서드를 불러야 한다. Spring에서는 두 개면 된다.

- 설정 클래스 하나에 `@EnableScheduling` — "예약 메서드를 찾아 시간표에 올려라"
- 부를 메서드에 `@Scheduled(…)` — "이 메서드를 이때 불러라". **인자 없는** 메서드만 된다.

언제 부를지는 셋 중 하나로 적는다.

| 방식 | 예 | 뜻 |
|---|---|---|
| `cron` | `@Scheduled(cron = "0 0 9 * * MON-FRI", zone = "Asia/Seoul")` | 달력 시각. 평일 서울 시각 9시 0분 0초 |
| `fixedRate` | `@Scheduled(fixedRate = 60_000)` | 앞 실행이 **시작한** 때부터 60초마다 |
| `fixedDelay` | `@Scheduled(fixedDelay = 60_000)` | 앞 실행이 **끝난** 뒤 60초 쉬고 |

숫자 단위는 밀리초다. cron은 리눅스 crontab과 달리 **6칸**이다: `초 분 시 일 월 요일`. `zone`을 안 적으면 서버(JVM)의 기본 시간대로 해석한다.

알아 둘 사실이 셋 더 있다. 이 레슨에서 전부 실행해 확인한다.

1. 예약 메서드를 부르는 스레드는 **기본 1개**(`scheduling-1`)다. 한 작업이 오래 걸리면 다른 예약 작업이 줄을 선다.
2. 예약 메서드에서 예외가 나면 로그만 남고 **다음 회차는 그대로 돈다.** 실패한 회차를 다시 해 주지는 않는다.
3. 운영자가 쓰는 **[지금 실행] API**도 같은 일을 한다. 예약 실행과 수동 실행이 같은 날짜로 겹칠 수 있다. 두 번 돌아도 결과가 한 번인 것(**멱등**)은 DB의 `UNIQUE`로 지킨다.

```text
[cron 0시]──────┐
                ├──▶ DigestJob.run(날짜) ──▶ INSERT … (UNIQUE: 작업 이름 + 날짜)
[POST …/run]────┘
```

## 예시

이 레슨을 쓰면서 Spring Boot 4.1 앱(포트 `18300`)으로 실험한 결과다. 로그 앞의 `[scheduling-1]`은 메서드를 부른 스레드 이름이다. 아래 한 줄짜리 도우미로 찍었다.

```java
static void p(String s) {
    System.out.println(LocalTime.now().truncatedTo(ChronoUnit.MILLIS) + " [" + Thread.currentThread().getName() + "] " + s);
}
```

### cron은 6칸, zone은 해석 기준

`CronExpression.parse(…).next(시각)`은 "이 시각 다음에 언제 도는가"를 계산한다. 9시를 실제로 기다리지 않고 확인할 수 있다. 기준은 2026-10-10 토요일 15:00(서울)이다.

```java
CronExpression cron = CronExpression.parse("0 0 9 * * MON-FRI");
cron.next(from.withZoneSameInstant(ZoneId.of("Asia/Seoul")));
cron.next(from.withZoneSameInstant(ZoneId.of("UTC")));
```

```text
서울로 해석    2026-10-12T09:00+09:00[Asia/Seoul]
UTC로 해석     2026-10-12T09:00Z[UTC]  = 서울 2026-10-12T18:00+09:00[Asia/Seoul]
```

같은 `0 0 9 * * MON-FRI`인데, UTC로 해석하면 서울 기준 **오후 6시**에 돈다. 내 맥은 기본 시간대가 `Asia/Seoul`이지만 서버는 UTC인 경우가 많다. 그래서 `zone = "Asia/Seoul"`을 적어 둔다.

### 스레드는 하나 — 긴 작업이 짧은 작업을 막는다

```java
@Scheduled(fixedRate = 1000)
public void tick() { p("tick"); }

@Scheduled(fixedRate = 5000, initialDelay = 2000)        // 켜고 2초 뒤 첫 실행
public void slowReport() throws InterruptedException {
    p("slowReport 시작");
    Thread.sleep(3000);
    p("slowReport 끝");
}
```

```text
15:58:41.877 [scheduling-1] tick
15:58:42.872 [scheduling-1] tick
15:58:42.872 [scheduling-1] slowReport 시작
15:58:45.882 [scheduling-1] slowReport 끝
15:58:45.883 [scheduling-1] tick
15:58:45.883 [scheduling-1] tick
15:58:45.883 [scheduling-1] tick
15:58:46.877 [scheduling-1] tick
```

1초마다 돌아야 할 `tick`이 3초 동안 **한 번도 못 돌다가**, `slowReport`가 끝나자 밀린 세 번이 같은 밀리초에 한꺼번에 돌았다. 둘 다 `scheduling-1` 하나를 나눠 쓰기 때문이다. `spring.task.scheduling.pool.size=2`로 다시 켜면 이렇다.

```text
15:59:47.988 [scheduling-1] tick
15:59:47.988 [scheduling-2] slowReport 시작
15:59:48.978 [scheduling-1] tick
15:59:49.988 [scheduling-1] tick
15:59:50.988 [scheduling-1] tick
15:59:50.998 [scheduling-2] slowReport 끝
```

### 일이 주기보다 길면 — fixedRate도 겹치지 않는다

2.5초 걸리는 일을 1초 주기로 걸었다.

```text
fixedRate = 1000                                   fixedDelay = 1000
15:58:55.955 #1 시작                               15:59:10.811 #1 시작
15:58:58.465 #1 끝                                 15:59:13.316 #1 끝
15:58:58.474 #2 시작   ← 끝나자마자                15:59:14.335 #2 시작   ← 끝나고 1초 뒤
15:59:00.980 #2 끝                                 15:59:16.840 #2 끝
15:59:00.981 #3 시작                               15:59:17.858 #3 시작
```

`fixedRate`라도 같은 메서드가 **동시에 두 번 돌지 않았다.** 주기가 이미 지났으니 앞 실행이 끝나자마자 바로 다음을 시작했다. `fixedDelay`는 끝난 뒤 1초를 꼬박 쉬었다.

### 예외가 나도 다음 회차는 돈다

```java
@Scheduled(fixedRate = 1000)
public void work() {
    int i = n.incrementAndGet();
    p("실행 #" + i);
    if (i == 2) throw new IllegalStateException("집계 테이블이 잠겨 있음");
}
```

```text
15:59:25.469 [scheduling-1] 실행 #1
15:59:26.471 [scheduling-1] 실행 #2
ERROR … [   scheduling-1] o.s.s.s.TaskUtils$LoggingErrorHandler    : Unexpected error occurred in scheduled task

java.lang.IllegalStateException: 집계 테이블이 잠겨 있음
15:59:27.477 [scheduling-1] 실행 #3
15:59:28.475 [scheduling-1] 실행 #4
```

`LoggingErrorHandler`가 로그만 남기고 #3, #4…를 계속 불렀다. #2가 하려던 일은 그냥 **안 된 채로** 지나갔다. 실패를 알려면 15-6처럼 실행 기록을 따로 남긴다.

### [지금 실행] API — 같은 메서드, UNIQUE로 멱등

예약과 수동이 **같은 서비스 메서드**를 부른다. 컨트롤러가 `@Scheduled` 메서드를 직접 부르지 않는다.

```java
@Scheduled(cron = "${app.digest-cron:0 0 9 * * MON-FRI}", zone = "Asia/Seoul")
public void weekdayMorning() {
    p("예약 실행: " + job.runIdempotent(job.today(), "SCHEDULED"));
}

@PostMapping("/h3/jobs/daily-digest/run")
public Map<String, Object> runNow(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    LocalDate day = (date != null) ? date : job.today();
    return Map.of("runDate", day.toString(), "result", job.runIdempotent(day, "MANUAL"));
}
```

```java
@Transactional
public String runIdempotent(LocalDate day, String trigger) {
    int inserted = jdbc.update(
            "INSERT IGNORE INTO lesson_h3_digest (job_name, run_date, trigger_type, made_at) VALUES ('daily-digest', ?, ?, ?)",
            day, trigger, LocalDateTime.now(clock));
    return inserted == 1 ? "만듦" : "이미 있음";
}
```

`lesson_h3_digest`에는 `UNIQUE (job_name, run_date)`가 있다. `INSERT IGNORE`는 UNIQUE에 걸리면 에러 대신 **0행**으로 끝난다. 요청 둘을 동시에 보냈다(`&`는 "기다리지 말고 다음 명령", `wait`는 "다 끝날 때까지").

```text
$ curl -s -X POST "$B/h3/jobs/daily-digest/run" & curl -s -X POST "$B/h3/jobs/daily-digest/run" & wait
{"result":"만듦","runDate":"2026-10-05"}
{"result":"이미 있음","runDate":"2026-10-05"}
```

cron을 5초마다(`*/5 * * * * *`)로 바꿔 켜고, 수동으로 먼저 한 번 돌렸다. 예약 실행은 매번 `이미 있음`이었고 행은 하나(`MANUAL`)뿐이었다.

```text
16:02:35.028 [scheduling-1] 예약 실행: 이미 있음
16:02:40.016 [scheduling-1] 예약 실행: 이미 있음
```

### 고정 Clock — "오늘"을 정하는 곳은 하나

위 응답의 `runDate`가 실제 날짜(10일)가 아니라 `2026-10-05`다. `LocalDate.now()` 대신 `LocalDate.now(clock)`을 쓰고, `Clock`을 빈으로 만들었기 때문이다.

```java
@Bean
Clock clock(@Value("${app.fixed-now:}") String fixedNow) {
    ZoneId seoul = ZoneId.of("Asia/Seoul");
    if (fixedNow.isBlank()) return Clock.system(seoul);                 // 운영: 진짜 시계
    return Clock.fixed(Instant.parse(fixedNow), seoul);                 // 연습·테스트: 멈춘 시계
}
```

`--app.fixed-now=2026-10-04T15:00:00Z`로 켰다. UTC 10월 4일 15시는 서울 10월 5일 0시다. 15장의 "지금 = 2026-10-05 00:00"이 이 방식이다. 다만 고정 시계는 **날짜 계산만** 고정한다. `@Scheduled`의 실제 타이머는 진짜 시간으로 돈다.

## 따라 해 보기

15분. 0~9장 앱에 `h3` 패키지를 만들어 한다.

**1. 스레드 하나 겪기.** `@EnableScheduling`을 붙인 설정 클래스와 위 `tick`·`slowReport`를 넣고 켠다. 10초 뒤 로그에서 `slowReport 끝` 바로 뒤에 `tick`이 같은 시각으로 여러 줄 찍히는지 본다. `application.yml`에 `spring.task.scheduling.pool.size: 2`를 넣고 다시 켜면 `scheduling-2`가 보인다. 확인했으면 두 메서드를 지운다(계속 로그가 찍힌다).

**2. 멱등 테이블을 만든다.** E7에서 만든 `sqlp` 함수(`practice` DB)로 만든다. 앱도 `practice` 프로파일로 띄운다(15장처럼). 앱이 보는 DB와 표를 만든 DB가 다르면 `Table … doesn't exist`가 난다.

```sql
CREATE TABLE lesson_h3_digest (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(64) NOT NULL,
  run_date DATE NOT NULL,
  trigger_type VARCHAR(16) NOT NULL,
  made_at DATETIME NOT NULL,
  CONSTRAINT uk_digest UNIQUE (job_name, run_date)
);
```

**3. 서비스·컨트롤러·예약 메서드**를 위 예시대로 넣는다. 앱에 이미 `Clock` 빈이 있으면(8장 이후) 그걸 쓰고 위 `Clock` 빈은 넣지 않는다(같은 타입 빈이 둘이면 켜지지 않는다). `app.fixed-now`가 없으면 `--app.fixed-now=2026-10-04T15:00:00Z`로 켠다(IntelliJ 실행 설정의 Program arguments). 동시에 두 번, 날짜 지정(`?date=2026-10-02`), 잘못된 날짜(`?date=2026-1-5` → `400`)를 보내 본다.

**4. 정리.** `sqlp "DROP TABLE lesson_h3_digest"`.

## 일부러 틀려 보기

**1. crontab을 그대로 붙여 넣기.** `@Scheduled(cron = "0 9 * * MON-FRI")`(5칸)이면 앱이 **켜지지 않는다.**

```text
Caused by: java.lang.IllegalStateException: Encountered invalid @Scheduled method 'run': Cron expression must consist of 6 fields (found 5 in "0 9 * * MON-FRI")
```

**2. 예약 메서드에 날짜를 받기.** `public void run(LocalDate date)`에 `@Scheduled`를 붙이면 역시 켜지지 않는다.

```text
Caused by: java.lang.IllegalStateException: Could not create recurring task for @Scheduled method 'run': Only no-arg methods may be annotated with @Scheduled
```

날짜가 필요하면 예약 메서드 안에서 `LocalDate.now(clock)`으로 구해 서비스에 넘긴다(위 예시).

**3. "있나 보고 없으면 넣기".** UNIQUE를 뺀 표(`ALTER TABLE lesson_h3_digest DROP INDEX uk_digest`)에 이렇게 짰다(`sleep`은 집계 시간 흉내).

```java
Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM lesson_h3_digest WHERE job_name = 'daily-digest' AND run_date = ?", Integer.class, day);
if (n > 0) return "이미 있음";
Thread.sleep(200);
jdbc.update("INSERT INTO lesson_h3_digest …", …);
```

하나씩 보내면 두 번째는 `이미 있음`이다. 동시에 두 개를 보내면 둘 다 `만듦`이었고 같은 날짜 행이 **두 줄** 생겼다. 둘 다 "없네"를 본 뒤에 넣었기 때문이다(H1의 틈과 같다). 같은 코드에 UNIQUE만 걸면 하나는 `500`이 됐다.

```text
java.sql.SQLIntegrityConstraintViolationException: Duplicate entry 'daily-digest-2026-10-05' for key 'lesson_h3_digest.uk_digest'
```

두 줄은 막았지만 사용자에게 500은 이상하다. 처음부터 `INSERT IGNORE`(또는 `DuplicateKeyException`을 잡아 "이미 있음")로 DB에게 판정을 맡긴다.

## 확인 문제

**1.** `0 30 2 * * *`는 언제 도나? 리눅스 crontab의 `30 2 * * *`를 그대로 넣으면?

<details>
<summary>정답</summary>

**매일 2시 30분 0초.** 첫 칸이 초다. 5칸을 넣으면 `Cron expression must consist of 6 fields`로 **앱이 켜지지 않는다.**
</details>

**2.** `@Scheduled(cron = "0 0 9 * * *")`만 적고 UTC 서버에 배포했다. 서울 기준 몇 시에 도나?

<details>
<summary>정답</summary>

**18시.** `zone`이 없으면 JVM 기본 시간대(UTC)의 9시다. `zone = "Asia/Seoul"`을 적는다.
</details>

**3.** 기본 설정에서 1초마다 도는 작업과 3초 걸리는 작업이 같이 있다. 1초짜리는 어떻게 되나?

<details>
<summary>정답</summary>

3초짜리가 도는 동안 **못 돌다가** 끝나면 밀린 만큼 몰아서 돈다. 예약 스레드가 기본 1개(`scheduling-1`)라서다. `spring.task.scheduling.pool.size`로 늘린다.
</details>

**4.** 예약 메서드가 예외를 던졌다. 다음 회차는? 실패한 회차는?

<details>
<summary>정답</summary>

다음 회차는 **그대로 돈다**(`LoggingErrorHandler`가 로그만 남김). 실패한 회차는 **다시 해 주지 않는다.** 실패를 알려면 실행 기록·알림을 따로 둔다.
</details>

**5.** 0시 예약 실행과 운영자의 [지금 실행]이 같은 날짜로 동시에 들어왔다. 결과 행이 하나만 생기게 하려면?

<details>
<summary>정답</summary>

결과 테이블에 **`UNIQUE (작업 이름, 기준일)`**을 걸고, 넣을 때 `INSERT IGNORE`처럼 걸리면 0행으로 끝나게 한다. "있나 보고 넣기"는 동시에 오면 둘 다 넣는다. 두 진입점은 같은 서비스 메서드를 부른다.
</details>

## 더 깊이

- [P30 스케줄링 실무](../docs/knowledge/P30-scheduling-practical.md) — 주기 선택, cron과 시간대, 풀 크기, ShedLock
- [S15 비동기·스케줄링·Spring Batch](../docs/knowledge/S15-async-scheduling-batch.md) — 프로세스마다 시간표가 따로라는 것
- [W20 시간과 시간대](../docs/knowledge/W20-time-timezone.md) — `Clock` 주입
- [H1 동시성 맛보기](./H1-concurrency-taste.md) — "읽고 판단하고 쓰기" 사이의 틈
- Spring Framework 7 API — `@Scheduled`(6칸 cron, `zone`, `fixedRate`·`fixedDelay`): https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/Scheduled.html
- Spring Framework 7 API — `TaskUtils`(반복 작업의 예외는 로그 후 억제): https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/TaskUtils.html
- Spring Boot — `spring.task.scheduling.pool.size`(기본 1): https://docs.spring.io/spring-boot/appendix/application-properties/index.html
- Java 21 API — `Clock`: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html
- MySQL 8.0 — `INSERT … ON DUPLICATE KEY UPDATE`: https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html

서버를 두 대 띄우면 두 대 모두 같은 예약을 돈다. UNIQUE가 결과를 하나로 지켜 주지만, 메일·외부 API처럼 DB 밖의 일은 두 번 일어난다. 그때는 ShedLock 같은 분산 락을 쓴다.

## 다음

- 실습: [15-1. 명예의 전당 — 매일 0시 배치와 멱등](../scenario/ch15-scheduling-batch/15-1-hall-of-fame.md) — 오늘의 cron·zone·[지금 실행]·UNIQUE·`app.fixed-now`가 그대로 나온다.
- [15-3. 예약 발행](../scenario/ch15-scheduling-batch/15-3-scheduled-publish.md) — 1분마다 도는 배치.
- [15-6. 배치 실행 기록과 다시 돌리기](../scenario/ch15-scheduling-batch/15-6-job-runs-retry.md) — 예외가 나도 다음 회차는 돈다는 것을 기록으로 잡는다.
- 많은 행을 지우는 배치는 [H4. 대량 데이터 처리](./H4-bulk-processing.md)에서.
