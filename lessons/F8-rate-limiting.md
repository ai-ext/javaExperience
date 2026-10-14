# F8. 요청 수 제한·도배 방지 — 429와 Retry-After

> 개념 레슨 · 30분

## 이게 뭐냐

로그인한 회원이 1초에 글을 50개 올린다. 토큰도 맞고(F2), 권한도 있고(F7), 값도 멀쩡하다(F6). 그래도 막아야 한다. 게시판이 한 사람 글로 덮이고, 그 사이 DB는 다른 사람의 요청을 처리하느라 느려진다.

그래서 서버가 **요청을 센다.** "누가, 무엇을, 얼마 동안 몇 번" 할 수 있는지 정하고, 넘으면 저장하지 않고 거절한다. 이것을 **요청 수 제한**(rate limiting)이라고 한다. 이 레슨의 규칙은 **"회원 한 명이 1분에 글 5개까지"** 다.

클라이언트 쪽에서 연속 전송을 막아 두어도 제한이 되지 않는다. `for i in $(seq 50); do curl -X POST …; done` 한 줄이면 클라이언트를 거치지 않고 50번 보낸다. 세는 일은 서버가, 글쓰기 API 안에서 한다.

### 거절은 `429`와 `Retry-After`로

| 무엇 | 뜻 | 근거 |
|---|---|---|
| `429 Too Many Requests` | 일정 시간 동안 요청을 너무 많이 보냈다 | RFC 6585 |
| 본문 | 왜 막혔는지 설명을 담는 게 좋다 | RFC 6585 |
| `Retry-After: 40` 헤더 | **40초** 뒤에 다시 시도하라(날짜 형식도 허용) | RFC 9110 |

`429`도 `400`처럼 "보낸 쪽이 바꿔야 하는" 응답이다. 다만 바꿀 것은 값이 아니라 **시간**이다. `Retry-After`가 있으면 클라이언트는 그만큼 기다렸다 다시 보내면 된다. 없으면 클라이언트는 언제 다시 보낼지 짐작해야 하고, 보통 곧바로 다시 보내 또 막힌다.

### 무엇을 기준으로 세나

| 기준 | 좋은 점 | 조심할 점 |
|---|---|---|
| 회원 id | 사람마다 따로 센다 | 로그인 전 요청(가입·로그인)에는 못 쓴다 |
| IP 주소 | 로그인 전에도 쓸 수 있다 | 회사·학교·카페는 여러 사람이 IP 하나를 같이 쓴다. 한 명 때문에 모두 막힌다 |

글쓰기는 로그인한 회원만 하니 **회원 id**로 센다. IP는 로그인 시도처럼 회원을 모르는 곳에 느슨하게 보탠다.

### 어떻게 세나 — 세 가지 방식

| 방식 | 세는 법 | "1분에 5개"가 뜻하는 것 |
|---|---|---|
| **고정 윈도우** | 시계의 1분 칸(`12:00:00`~`12:00:59`)마다 0부터 센다 | 같은 "분" 안에 5개 |
| 슬라이딩 윈도우 | 지금부터 거꾸로 60초 안의 요청을 센다 | 어느 순간에 봐도 직전 60초에 5개 |
| 토큰 버킷 | 통에 토큰 5개, 요청마다 하나씩 쓰고 시간이 지나면 조금씩 다시 찬다 | 몰아서 5개, 그 뒤엔 채워지는 속도만큼 |

이 레슨은 가장 단순한 **고정 윈도우**를 DB `COUNT`로 만들어 본다. 나머지 둘은 표의 뜻만 알면 된다. 여러 서버가 같은 숫자를 함께 세야 하면 보통 Redis 같은 공용 저장소에 둔다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1.1 앱을 practice DB에 붙여 띄웠다. 토큰 확인은 F7의 `AuthInterceptor`를 그대로 쓰고, 글은 연습용 테이블 `lesson_f8_post(author_id, title, created_at DATETIME(3))`에 저장한다. `(author_id, created_at)` 인덱스를 붙였다. 셀 때 이 두 칸으로 찾기 때문이다.

### ① 이번 분 칸에 쓴 글을 센다

```java
@Component
public class PostRateLimiter {
    static final int LIMIT = 5;
    private final JdbcTemplate jdbc;

    /** 허용이면 0, 막아야 하면 기다릴 초(Retry-After) */
    public long check(long memberId, LocalDateTime now) {
        LocalDateTime windowStart = now.truncatedTo(ChronoUnit.MINUTES);       // 16:05:20.224 → 16:05:00
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM lesson_f8_post WHERE author_id = ? AND created_at >= ?",
                Integer.class, memberId, windowStart);
        if (count < LIMIT) return 0;
        long millisLeft = Duration.between(now, windowStart.plusMinutes(1)).toMillis();
        return Math.max(1, (millisLeft + 999) / 1000);                          // 올림 — "0초 기다려"는 없다
    }
}
```

남은 시간을 올림하고 최소 1초로 두는 것은, 내림해서 `Retry-After: 0`을 주면 클라이언트가 곧바로 다시 보내 또 막히기 때문이다. 서비스는 세어 보고, 넘었으면 예외를 던지고, 아니면 저장한다. 시각은 Java에서 **한 번** 잡아 세기와 저장에 같이 쓴다. DB 컨테이너의 시계(UTC)와 앱의 시계(Asia/Seoul)가 달라서, 한쪽은 `NOW()`, 한쪽은 Java 시각을 쓰면 아홉 시간이 어긋난다.

```java
@Transactional
public long create(long memberId, String title) {
    LocalDateTime now = LocalDateTime.now();
    long retryAfter = limiter.check(memberId, now);
    if (retryAfter > 0) throw new TooManyPostsException(retryAfter);
    jdbc.update("INSERT INTO lesson_f8_post (author_id, title, created_at) VALUES (?, ?, ?)", memberId, title, now);
    …
}

// 처리기 — 상태 429, 헤더 Retry-After, 본문 ProblemDetail
@ExceptionHandler(TooManyPostsException.class)
public ResponseEntity<ProblemDetail> tooMany(TooManyPostsException ex) {
    ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    p.setProperty("retryAfterSeconds", ex.retryAfterSeconds());
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.retryAfterSeconds()))
            .body(p);
}
```

### ② 여섯 번째에서 막힌다

회원 6(`tok-p06`)으로 16:05:20에 여섯 번 연달아 보냈다. 앞의 숫자는 보낸 시각이다.

```text
16:05:20.024  HTTP/1.1 201  {"id":7}
16:05:20.065  HTTP/1.1 201  {"id":8}
16:05:20.106  HTTP/1.1 201  {"id":9}
16:05:20.141  HTTP/1.1 201  {"id":10}
16:05:20.182  HTTP/1.1 201  {"id":11}
16:05:20.224  HTTP/1.1 429
              Retry-After: 40
              Content-Type: application/problem+json

              {"detail":"글은 1분에 5개까지 쓸 수 있습니다.","instance":"/f8/posts","status":429,"title":"Too Many Requests","retryAfterSeconds":40}
```

이번 칸은 16:06:00에 끝난다. 남은 시간 39.776초를 올림해 `40`이다.

### ③ 40초 기다리면 된다

같은 회원으로, 받은 `Retry-After`만큼 기다렸다 다시 보냈다.

```text
16:05:20.225  Retry-After 40초 기다린다
16:06:00.224  HTTP/1.1 201  {"id":12}
```

새 칸(16:06)이 시작돼 카운트가 0부터 다시 셌다.

### ④ 고정 윈도우의 구멍 — 분이 바뀌는 순간

회원 3(`tok-p03`)으로 16:06:58.5쯤 다섯 개, 16:07:00.3쯤 다섯 개를 더 보냈다.

```text
16:06:58.466  HTTP/1.1 201  {"id":13}
16:06:58.917  HTTP/1.1 201  {"id":14}
16:06:59.008  HTTP/1.1 201  {"id":15}
16:06:59.110  HTTP/1.1 201  {"id":16}
16:06:59.221  HTTP/1.1 201  {"id":17}
16:07:00.273  HTTP/1.1 201  {"id":18}
16:07:00.347  HTTP/1.1 201  {"id":19}
16:07:00.381  HTTP/1.1 201  {"id":20}
16:07:00.416  HTTP/1.1 201  {"id":21}
16:07:00.453  HTTP/1.1 201  {"id":22}
16:07:00.488  HTTP/1.1 429  Retry-After: 60
```

DB에 남은 것은 **1.6초 사이에 10개**다(`16:06:58.869`~`16:07:00.480`). 규칙은 "1분에 5개"인데, 고정 윈도우는 "같은 분 칸 안에 5개"만 지킨다. 칸이 바뀌면 바로 다시 5개다. 이게 싫으면 슬라이딩 윈도우를 쓴다. 정책 문구("1분에 5개")와 실제로 세는 방식이 같은 말인지 확인해야 한다.

## 따라 해 보기

10분. 두 방식이 **같은 순간에 다른 숫자**를 내는 것을 SQL로 본다. G3처럼 `mysql`에 들어가 임시 테이블로 한다(접속을 끊으면 사라진다).

```bash
docker exec -it -e LANG=C.UTF-8 studymate-mysql-1 mysql --default-character-set=utf8mb4 -ucommunity -pcommunity practice
```

**1. 분이 바뀌기 직전에 글 다섯 개를 넣는다.**

```sql
CREATE TEMPORARY TABLE t_post (id BIGINT PRIMARY KEY AUTO_INCREMENT, author_id BIGINT NOT NULL, created_at DATETIME(3) NOT NULL);
INSERT INTO t_post (author_id, created_at) VALUES
  (2, '2026-10-10 12:00:58.400'), (2, '2026-10-10 12:00:58.600'), (2, '2026-10-10 12:00:59.000'),
  (2, '2026-10-10 12:00:59.200'), (2, '2026-10-10 12:00:59.400');
```

**2. 여섯 번째 요청이 12:01:00.200에 왔다고 치고 두 방식으로 센다.**

```sql
SET @now = '2026-10-10 12:01:00.200';
SELECT COUNT(*) AS fixed_window FROM t_post
 WHERE author_id = 2 AND created_at >= DATE_FORMAT(@now, '%Y-%m-%d %H:%i:00');
SELECT COUNT(*) AS sliding_window FROM t_post
 WHERE author_id = 2 AND created_at > @now - INTERVAL 1 MINUTE;
```

```text
+--------------+
| fixed_window |
+--------------+
|            0 |
+--------------+
+----------------+
| sliding_window |
+----------------+
|              5 |
+----------------+
```

고정 윈도우는 `12:01:00`부터 세니 0개 — **허용**. 슬라이딩은 `12:00:00.200` 이후를 세니 5개 — **거절**. 두 SQL의 차이는 `WHERE`의 시작 시각 하나다. "최근 1분"(`NOW() - INTERVAL 1 MINUTE`)이라고 적으면 고정 윈도우가 아니라 슬라이딩 윈도우다.

## 일부러 틀려 보기

**1. 동시에 보낸다** — 세고(`SELECT COUNT`) 저장하는(`INSERT`) 사이는 비어 있다. 회원 4(`tok-p04`)로 요청 20개를 **동시에** 보냈다.

```text
16:07:04.954 동시에 20 개
Counter({'HTTP/1.1 201': 12, 'HTTP/1.1 429': 8})
```

```text
+-----------+-----+
| author_id | cnt |
+-----------+-----+
|         4 |  12 |
+-----------+-----+
```

한도가 5인데 12개가 들어갔다. 여러 요청이 동시에 `COUNT`를 해서 모두 "아직 5개 미만"을 봤다. `@Transactional`로 묶었는데도 그렇다. 트랜잭션은 "다 되거나 다 없던 일"을 보장할 뿐, 다른 요청이 끼어들지 못하게 줄을 세우지는 않는다(H1).

줄을 세우는 한 방법은 같은 회원의 요청이 **같은 행을 잠그게** 하는 것이다. 세기 전에 그 회원의 `member` 행을 `FOR UPDATE`로 읽었다. 잠금은 트랜잭션이 끝날 때 풀리니 `@Transactional` 안이어야 한다.

```java
jdbc.queryForObject("SELECT id FROM member WHERE id = ? FOR UPDATE", Long.class, memberId);   // 같은 회원은 여기서 한 줄로
```

회원 5(`tok-p05`)로 같은 20개를 동시에 보냈다.

```text
16:08:04.973 동시에 20 개
Counter({'HTTP/1.1 429': 15, 'HTTP/1.1 201': 5})
```

정확히 5개다. 대신 같은 회원의 글쓰기가 한 줄로 서서 기다린다. 트래픽이 크면 Redis의 원자적 증가(`INCR`) 같은 다른 길을 찾는다.

## 확인 문제

**1.** `Retry-After: 40`의 뜻은?

<details>
<summary>정답</summary>

이 응답을 받은 뒤 **40초** 기다렸다 다시 보내라는 뜻이다. RFC 9110은 초 단위 숫자와 날짜(`Retry-After: Sat, 10 Oct 2026 07:06:00 GMT`) 두 형식을 허용한다. 클라이언트는 둘 다 읽을 수 있어야 한다.
</details>

**2.** 고정 윈도우 "1분에 5개"에서, 같은 회원의 글 10개가 2초 안에 모두 통과할 수 있나?

<details>
<summary>정답</summary>

**있다.** 분이 바뀌기 직전에 5개, 바뀐 직후에 5개면 두 개의 다른 칸이라 둘 다 허용이다(④에서 1.6초에 10개). "어느 60초를 잘라도 5개 이하"가 필요하면 슬라이딩 윈도우를 쓴다.
</details>

**3.** 회사 사무실 50명이 같은 공인 IP로 나간다. 글쓰기 제한을 IP 기준 "1분에 5개"로 걸면?

<details>
<summary>정답</summary>

50명이 **합쳐서** 1분에 5개만 쓸 수 있다. 한 사람이 도배하면 나머지 49명도 막힌다. 로그인이 필요한 글쓰기는 회원 id로 센다. IP 기준은 로그인 전 요청에 넉넉하게 거는 보조선이다.
</details>

**4.** `COUNT` 뒤 `INSERT`를 `@Transactional` 하나로 묶었다. 동시에 들어온 요청 20개 중 몇 개가 통과할 수 있나?

<details>
<summary>정답</summary>

**5개보다 많이** 통과할 수 있다(실측 12개). 트랜잭션은 끼어들기를 막지 않는다. 동시에 센 요청들이 모두 같은 숫자(5 미만)를 본다. 같은 회원의 요청이 한 줄로 서도록 행을 잠그거나(`FOR UPDATE`, 실측 정확히 5개), 세기와 늘리기를 한 번에 하는 원자적 연산을 쓴다.
</details>

**5.** 서버가 두 대이고 각자 메모리(`ConcurrentHashMap`)에 회원별 카운터를 둔다. "1분에 5개"가 지켜지나?

<details>
<summary>정답</summary>

**안 지켜진다.** 요청이 두 서버에 나뉘어 가면 각 서버가 따로 5개씩 세어 최대 10개가 통과한다. 서버를 재시작해도 카운터가 사라진다. 여러 서버가 같은 숫자를 봐야 하면 DB나 Redis처럼 공용 저장소에서 센다. 이 레슨의 DB `COUNT`는 서버가 몇 대든 같은 테이블을 센다.
</details>

## 더 깊이

- [W10 — 중복 검사와 경쟁 조건](../docs/knowledge/W10-where-to-validate.md#중복-검사와-경쟁-조건) — "세고 나서 쓰기"가 동시에 깨지는 같은 모양
- [P23 Redis 실무](../docs/knowledge/P23-redis-practical.md) — 여러 서버가 공유하는 카운터
- 원문: [RFC 6585 — 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4) — 본문 설명, `Retry-After`, 캐시 금지 · [RFC 9110 — Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) — 초·날짜 두 형식 · [Redis — Rate limiter](https://redis.io/docs/latest/develop/use-cases/rate-limiter/) — 고정·슬라이딩 윈도우, `INCR`+`EXPIRE`, 원자 갱신 · [Bucket4j 8.14 레퍼런스](https://bucket4j.com/8.14.0/toc.html) — 토큰 버킷 · [OWASP API4:2023 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/) — 제한이 없거나 너무 느슨할 때

## 다음

- 레슨: [H1. 동시성 맛보기](H1-concurrency-taste.md) — "일부러 틀려 보기 1"의 12개가 왜 생기는지, 잠금을 더 깊게.
- 실습: [13-3. 작성자 기간 정지](../scenario/ch13-operations/13-3-member-suspension.md) — 도배한 회원에게 운영자가 내리는 다음 조치. 막힌 요청을 `403`과 사유로 알려 주는 모양이 `429`와 닮았다.
- 레슨: [G4. 트랜잭션 실전](G4-transaction-in-practice.md) — `@Transactional`이 롤백하지 않는 경우들.
