# H1. 동시성 맛보기 — 두 요청이 동시에 오면

> 개념 레슨 · 35분

## 이게 뭐냐

두 사람이 같은 글의 좋아요를 거의 같은 순간에 눌렀다. 서버에는 요청 두 개가 **동시에** 들어온다.

- Spring 서버는 요청마다 **스레드**를 하나씩 내어 동시에 처리한다. 톰캣이 일꾼 여러 명을 두고 들어오는 요청을 나눠 주는 셈이다.
- 그런데 서비스 객체는 **하나**다(E1의 빈). DB의 `post` 행도 하나다. 일꾼 여럿이 같은 것을 동시에 만진다.

좋아요 수를 이렇게 올리면 위험하다.

```text
1. 읽기   — like_count를 읽는다 (5)
2. 계산   — 5 + 1 = 6
3. 쓰기   — like_count = 6 으로 저장
```

두 요청이 1번을 동시에 하면 둘 다 `5`를 읽고, 둘 다 `6`을 쓴다. 좋아요는 둘인데 숫자는 하나만 올랐다. 이것을 **갱신 손실**(lost update)이라고 한다. 문제는 **읽기와 쓰기 사이에 틈**이 있다는 것이다. 그 틈에 다른 요청이 끼어든다.

### 고치는 가장 쉬운 방법

읽기·계산·쓰기를 **DB에게 한 문장으로** 맡긴다.

```sql
UPDATE post SET like_count = like_count + 1 WHERE id = ?;
```

`like_count + 1`의 `like_count`는 앱이 아까 읽어 둔 값이 아니라 **DB가 그 순간 가진 값**이다. 그리고 DB는 한 행을 동시에 두 문장이 고치지 못하게 막는다. 먼저 고친 쪽이 끝날(커밋할) 때까지 다른 쪽은 **기다린다**(행 잠금). 그래서 순서대로 하나씩 올라간다.

## 예시

### jshell — 두 스레드가 같은 객체를 만진다

DB 없이 Java만으로 먼저 본다. 읽기와 쓰기 사이에 `Thread.sleep(100)`을 **일부러** 넣었다. 틈을 넓혀서 매번 재현되게 하려는 것이다(실제 서버에서는 이 틈이 DB 왕복·다른 계산 시간이다). JDK 21 `jshell`에서 실행한 그대로다.

```java
class Post {
    int likeCount = 0;
    void likeNaive() throws InterruptedException {
        int current = likeCount;   // 1. 읽기
        Thread.sleep(100);         // 2. 그 사이에 다른 일(일부러 넓힌 틈)
        likeCount = current + 1;   // 3. 읽은 값 + 1을 쓰기
    }
}
Post post = new Post()
Runnable click = () -> { try { post.likeNaive(); } catch (InterruptedException e) {} };
Thread a = new Thread(click), b = new Thread(click);
a.start(); b.start(); a.join(); b.join();
```

- `Runnable`은 "실행할 일 하나"를 담는 타입이다. `() -> { ... }`는 B6에서 본 람다다.
- `start()`는 스레드를 출발시키고, `join()`은 그 스레드가 끝날 때까지 기다린다.

```text
jshell> post.likeCount
$10 ==> 1
```

두 번 눌렀는데 `1`이다. Java가 제공하는 "그 순간의 값에 +1"(`AtomicInteger`)로 바꾸면 이렇다.

```text
jshell> AtomicInteger safe = new AtomicInteger(0)
safe ==> 0

jshell> Thread c = new Thread(() -> safe.incrementAndGet()), d = new Thread(() -> safe.incrementAndGet());
c ==> Thread[#26,Thread-2,5,main]
d ==> Thread[#27,Thread-3,5,main]

jshell> c.start(); d.start(); c.join(); d.join();

jshell> safe.get()
$19 ==> 2
```

(`AtomicInteger`는 `import java.util.concurrent.atomic.AtomicInteger;` 후에 쓴다.) 다만 서버에서는 이 방법을 못 쓴다. 숫자가 Java 메모리가 아니라 **DB에** 있고, 서버가 여러 대일 수도 있기 때문이다.

### Spring + MySQL — 실제 요청 두 개

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18120`, MySQL)을 만들어 실제로 요청을 보냈다. 4-1에서 처음 만들기 쉬운 모양 그대로다. 글을 읽고, 숫자에 1을 더해 엔티티에 넣으면, 트랜잭션 커밋 때 JPA가 `UPDATE`를 보낸다(3-1의 변경 감지).

```java
@Transactional
public int likeNaive(Long postId, long pauseMs) throws InterruptedException {
    Post post = posts.findById(postId).orElseThrow();
    int current = post.getLikeCount();
    if (pauseMs > 0) Thread.sleep(pauseMs);   // 실험용: 틈을 넓힌다
    post.setLikeCount(current + 1);
    return current + 1;
}
```

하나씩 보내면 당연히 맞다.

```text
$ B=http://localhost:18120
$ curl -s -X POST "$B/h1/posts/1/reset"
$ curl -s -w '\n' -X POST "$B/h1/posts/1/like-naive?pauseMs=200"
1
$ curl -s -w '\n' -X POST "$B/h1/posts/1/like-naive?pauseMs=200"
2
$ curl -s -w '\n' "$B/h1/posts/1/count"
2
```

이제 둘을 **동시에** 보낸다. 명령 끝의 `&`는 "끝나길 기다리지 말고 바로 다음 명령으로", `wait`는 "뒤로 보낸 명령이 다 끝날 때까지 기다리기"다.

```text
$ curl -s -X POST "$B/h1/posts/1/reset"
$ curl -s -w '\n' -X POST "$B/h1/posts/1/like-naive?pauseMs=200" & curl -s -w '\n' -X POST "$B/h1/posts/1/like-naive?pauseMs=200" & wait
1
1
$ curl -s -w '\n' "$B/h1/posts/1/count"
1
```

두 요청 모두 `1`이라고 답했고, DB에도 `1`이다. 세 번 해서 세 번 모두 같았다.

`sleep`이 없으면 괜찮을까? 틈을 넓히지 않고(`pauseMs` 없이) 20개를 동시에 보냈다.

```bash
curl -s -X POST "$B/h1/posts/1/reset"
for i in $(seq 1 20); do curl -s -o /dev/null -X POST "$B/h1/posts/1/like-naive" & done; wait
curl -s "$B/h1/posts/1/count"
```

여섯 번 돌려 `3`, `4`, `4`, `3`, `5`, `5`가 나왔다. **20번 눌렀는데 3~5만 올랐다.** 일부러 넓힌 틈이 없어도, 요청이 몰리면 읽기와 쓰기 사이의 짧은 틈에 다른 요청이 끼어든다.

SQL 로그를 보면 이유가 보인다. 앱이 계산한 **숫자**를 그대로 써 넣는다.

```text
select p1_0.id,p1_0.like_count,p1_0.published_at,p1_0.title from lab_post p1_0 where p1_0.id=?
update lab_post set like_count=?,published_at=?,title=? where id=?
```

### 고친 코드 — DB가 한 문장으로 +1

```java
// 저장소
@Modifying
@Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :id")
int increaseLikeCount(@Param("id") Long id);

// 서비스
@Transactional
public void likeAtomic(Long postId) {
    posts.increaseLikeCount(postId);
}
```

```text
update lab_post p1_0 set like_count=(p1_0.like_count+1) where p1_0.id=?
```

같은 방식으로 20개를 동시에 세 번 보냈다. 세 번 모두 **`20`** 이었다. 둘을 동시에 보냈을 때도 `2`였다.

## 따라 해 보기

15분.

**1. jshell.** 위 jshell 예시를 붙여 넣고 `1`이 나오는 것을 본다. 그다음 `Thread.sleep(100)`을 `Thread.sleep(1)`로 바꿔 `Post` 클래스를 다시 붙여 넣고, `post`·`click`·스레드를 다시 만들어 돌린다. 1밀리초 틈으로도 `1`이 나온다(다섯 번 해서 다섯 번 `1`이었다). `sleep` 줄을 아예 지우면 `2`가 나온다(이것도 다섯 번 모두 `2`). 읽기와 쓰기 사이에 할 일이 전혀 없으면 두 스레드가 거의 겹치지 않기 때문이다. 하지만 실제 서버에서는 그 사이에 DB 왕복이 끼어 있어서 틈이 늘 있다. 그래서 Spring 예시에서는 `sleep` 없이도 숫자가 모자랐다.

**2. 터미널 두 개로 DB에서 직접 겪어 보기.** 이번에는 앱 없이 사람이 두 요청 역할을 한다. 먼저 E2의 `sql` 함수로 연습용 테이블을 만든다. 끝나면 지운다.

```bash
sql "CREATE TABLE lesson_counter (id BIGINT PRIMARY KEY, like_count INT NOT NULL); INSERT INTO lesson_counter VALUES (1, 0)"
```

터미널 두 개(A·B)를 열고 각각 `mysql`에 들어간다(G3의 접속 명령).

```bash
docker exec -it -e LANG=C.UTF-8 studymate-mysql-1 mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community
```

**(가) 읽고 +1 해서 쓰기.** 아래 순서대로 친다. 둘 다 `0`을 읽었으니 둘 다 `1`을 쓴다.

| 순서 | A | B |
|---|---|---|
| 1 | `START TRANSACTION;` | |
| 2 | `SELECT like_count FROM lesson_counter WHERE id = 1;` → `0` | |
| 3 | | `START TRANSACTION;` |
| 4 | | `SELECT like_count FROM lesson_counter WHERE id = 1;` → `0` |
| 5 | `UPDATE lesson_counter SET like_count = 1 WHERE id = 1;` | |
| 6 | `COMMIT;` | |
| 7 | | `UPDATE lesson_counter SET like_count = 1 WHERE id = 1;` |
| 8 | | `COMMIT;` |

7번에서 B는 이렇게 나온다.

```text
Query OK, 0 rows affected (0.00 sec)
Rows matched: 1  Changed: 0  Warnings: 0
```

이미 `1`이라 바뀐 게 없다(`Changed: 0`). 마지막에 `SELECT`하면 `1`이다. 두 사람이 눌렀는데 하나만 남았다.

**(나) DB에게 +1을 맡기기.** 숫자를 `0`으로 되돌리고(`UPDATE lesson_counter SET like_count = 0 WHERE id = 1;`) 다시 한다.

| 순서 | A | B |
|---|---|---|
| 1 | `START TRANSACTION;` | |
| 2 | `UPDATE lesson_counter SET like_count = like_count + 1 WHERE id = 1;` | |
| 3 | | `START TRANSACTION;` |
| 4 | | `UPDATE lesson_counter SET like_count = like_count + 1 WHERE id = 1;` |
| 5 | `COMMIT;` | |
| 6 | | `COMMIT;` |

**4번에서 B가 멈춘다.** 프롬프트가 돌아오지 않는다. A가 그 행을 고치는 중이라 B가 기다리는 것이다. 5번에서 A가 커밋하는 순간 B가 풀린다. 실제로 B 쪽에 나온 결과다(기다린 시간은 사람마다 다르다).

```text
Query OK, 1 row affected (3.36 sec)
Rows matched: 1  Changed: 1  Warnings: 0
```

`3.36 sec`가 기다린 시간이다. 마지막에 `SELECT`하면 **`2`** 다.

**3. 정리.** `exit`로 두 터미널을 나온 뒤 테이블을 지운다.

```bash
sql "DROP TABLE lesson_counter"
```

## 일부러 틀려 보기

**1. `synchronized`면 되지 않나?** Java에는 "이 메서드는 한 번에 한 스레드만"이라는 `synchronized`가 있다. 위 Spring 앱의 서비스에 붙여 봤다.

```java
@Transactional
public synchronized int likeSynchronized(Long postId) {
    Post post = posts.findById(postId).orElseThrow();
    post.setLikeCount(post.getLikeCount() + 1);
    return post.getLikeCount();
}
```

20개를 동시에 다섯 번 보냈더니 `6`, `8`, `8`, `6`, `7`이었다. 여전히 모자란다. `@Transactional`의 **커밋은 메서드가 끝난 뒤에** 일어난다. 앞 요청이 메서드를 빠져나와 아직 커밋하기 전에, 다음 요청이 들어와 옛 값을 읽는다. 게다가 서버를 두 대 띄우면 `synchronized`는 서버 안에서만 통한다. 숫자가 DB에 있으면 DB에서 막는다.

**2. 커밋을 안 하고 두면?** 따라 해 보기 2(나)에서 A가 `COMMIT` 없이 자리를 비우면 B는 계속 기다린다. 기본 대기 한도는 50초(`innodb_lock_wait_timeout`)다. A가 `START TRANSACTION`과 `+1` `UPDATE`까지만 친 상태에서, B의 한도만 5초로 줄여 재현했다.

B 터미널:

```text
mysql> SET SESSION innodb_lock_wait_timeout = 5;
Query OK, 0 rows affected (0.01 sec)

mysql> UPDATE lesson_counter SET like_count = like_count + 1 WHERE id = 1;
ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction
```

트랜잭션을 오래 열어 두면 같은 행을 만지는 다른 요청이 줄줄이 기다리다 실패한다. 트랜잭션 안에서 외부 API를 부르거나 오래 계산하면 안 되는 이유다. (A는 `ROLLBACK;`으로 끝낸다.)

## 확인 문제

**1.** `like_count`가 `10`인 글에 두 요청이 동시에 와서, 둘 다 `10`을 읽고 `11`을 저장했다. 최종 값은? 이 현상의 이름은?

<details>
<summary>정답</summary>

**`11`**, 갱신 손실(lost update). 두 번째 쓰기가 첫 번째 쓰기를 덮었다. 읽기와 쓰기 사이에 틈이 있어서다.
</details>

**2.** 예시에서 `Thread.sleep`을 넣은 이유는? `sleep`이 없는 실제 코드에서는 이 문제가 안 생기나?

<details>
<summary>정답</summary>

틈을 넓혀 **매번** 재현하려고 넣었다. `sleep`이 없어도 생긴다. 이 레슨의 실험에서 `sleep` 없이 20개를 동시에 보내도 3~5만 올랐다. 틈이 좁으면 드물게 생길 뿐이고, 드물게 생기는 버그가 더 찾기 어렵다.
</details>

**3.** 두 요청이 모두 `like_count`를 `5`로 읽었다. 각 요청이 ㉠ 앱에서 계산한 값으로 `UPDATE post SET like_count = 6 WHERE id = ?`를 보낼 때와 ㉡ `UPDATE post SET like_count = like_count + 1 WHERE id = ?`를 보낼 때, 최종 값은 각각 얼마인가?

<details>
<summary>정답</summary>

**㉠ `6`, ㉡ `7`.** ㉠은 둘 다 아까 읽어 둔 `5`로 계산한 숫자를 쓰니 하나가 다른 하나를 덮는다(갱신 손실). ㉡의 `like_count`는 앱이 읽어 둔 값이 아니라 **DB가 그 순간 가진 값**이다. 두 번째 문장은 행 잠금 때문에 첫 문장이 끝날 때까지 기다렸다가 `6`에 1을 더한다.
</details>

**4.** 따라 해 보기 2(나)의 4번에서 B의 `UPDATE`가 바로 끝나지 않은 이유는? 그래서 결과는?

<details>
<summary>정답</summary>

A가 같은 행을 고친 채 커밋하지 않아서, DB가 그 행을 잠가 두었다. B는 A가 끝날 때까지 기다렸다가, A가 커밋한 `1`에서 `+1` 해 **`2`** 가 되었다. 기다리게 하는 것 자체가 "하나씩 순서대로"를 만든다.
</details>

**5.** 서비스 메서드에 `synchronized`를 붙였는데 숫자가 여전히 모자랐다. 이유 두 가지는?

<details>
<summary>정답</summary>

① `@Transactional`의 커밋이 `synchronized` 메서드가 **끝난 뒤**에 일어나서, 다음 요청이 커밋 전의 옛 값을 읽을 수 있다. ② `synchronized`는 서버(JVM) 하나 안에서만 통한다. 서버를 여러 대 띄우면 서로를 모른다. 숫자가 DB에 있으니 DB에서 막는다(한 문장 `UPDATE`, 또는 락).
</details>

## 더 깊이

- [P18 — 문제는 읽기 → 판단 → 쓰기가 분리될 때 생긴다](../docs/knowledge/P18-concurrency-inventory.md#21-문제는-읽기--판단--쓰기가-분리될-때-생긴다)
- [P18 — 가장 싼 해결책: 조건부 원자 UPDATE](../docs/knowledge/P18-concurrency-inventory.md#22-가장-싼-해결책-조건부-원자-update)
- [P18 — JVM 락의 범위를 오해하지 않는다](../docs/knowledge/P18-concurrency-inventory.md#25-jvm-락의-범위를-오해하지-않는다) — `synchronized`의 한계
- [P18 — 낙관적 락은 충돌을 허용하고 재시도한다](../docs/knowledge/P18-concurrency-inventory.md#24-낙관적-락은-충돌을-허용하고-재시도한다) — 다른 고치는 법
- [W25 스프링이 멀티스레드라는 것](../docs/knowledge/W25-spring-multithreading.md) — 요청마다 스레드, 빈은 하나
- [S08 — 격리수준과 동시성 이상](../docs/knowledge/S08-transactions.md#격리수준과-동시성-이상)

## 다음

- 실습: [4-1. 좋아요·취소(멱등)](../scenario/ch4-like/4-1-like-toggle.md) — 같은 요청이 **두 번** 와도 결과가 같게.
- 그다음 [4-2. 동시에 눌러도 맞는 like_count](../scenario/ch4-like/4-2-like-concurrency.md)에서 오늘의 갱신 손실을 테스트로 재현하고 고친다. 거기서는 좋아요 **행 추가**와 숫자 갱신이 함께라 교착 상태(deadlock)까지 만난다(4-2 힌트 1).
