# H5. Spring 이벤트 — 저장이 끝난 뒤에 알리기

> 개념 레슨 · 35분

## 이게 뭐냐

새 글을 저장하면 팔로워에게 알림을 만들고 싶다. 가장 쉬운 방법은 서비스에서 알림 코드를 바로 부르는 것이다.

```java
@Transactional
public Long create(PostCreateRequest req) {
    Post post = posts.save(...);
    notificationService.notifyNewPost(post.getId());   // 바로 부른다
    pointService.addPoint(...);                         // 이게 실패하면?
    return post.getId();
}
```

문제는 **순서**다. 알림을 만든 뒤에 같은 트랜잭션의 다른 일(포인트 적립)이 실패하면 트랜잭션 전체가 롤백된다(G3). 글은 사라졌는데 "새 글이 올라왔어요" 알림이나 푸시는 이미 나갔다. **없는 글 알림**이다.

그래서 순서를 이렇게 바꾼다.

1. 서비스는 "글이 만들어졌다"는 **사실(이벤트)** 만 알리고 자기 일을 계속한다.
2. 트랜잭션이 **커밋에 성공하면** 그때 알림 담당이 그 사실을 받아 알림을 만든다.
3. 롤백되면 알림 담당은 아예 불리지 않는다.

Spring에서 쓰는 도구는 셋이다.

| 도구 | 하는 일 |
|---|---|
| `ApplicationEventPublisher` | 이벤트를 알리는 창구. `publishEvent(객체)` 한 줄. 서비스 생성자로 주입받는다 |
| `@EventListener` | 그 객체 타입을 받는 메서드. **`publishEvent`를 부른 그 순간** 바로 실행된다 |
| `@TransactionalEventListener` | 이벤트를 발행한 **트랜잭션의 결과**에 맞춰 실행된다. 기본값은 `AFTER_COMMIT`(커밋 성공 뒤) |

`@TransactionalEventListener`의 `phase`로 고를 수 있는 시점은 `BEFORE_COMMIT`, `AFTER_COMMIT`(기본), `AFTER_ROLLBACK`, `AFTER_COMPLETION`(커밋이든 롤백이든 끝난 뒤)이다.

이벤트 객체는 아무 클래스나 된다. 값만 담으면 되니 B4의 `record`가 짧다.

```java
public record PostCreated(Long postId) {}
```

이벤트는 메시지 큐가 아니다. 같은 앱, 같은 스레드 안에서 메서드를 대신 불러 주는 장치다. 서버가 꺼지면 처리 못 한 이벤트는 그냥 사라진다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18310`, MySQL `practice` DB의 연습 테이블 `lesson_h5_post`·`lesson_h5_notice`)을 만들어 돌렸다. 서비스는 글을 저장하고 이벤트를 발행한다. `fail=true`면 **발행한 뒤에** 일부러 예외를 던진다.

```java
@Transactional
public Long create(String title, boolean fail) {
    H5Post post = posts.save(new H5Post(title));
    log.info("글 저장 id={}", post.getId());
    events.publishEvent(new PostCreated(post.getId()));
    log.info("이벤트 발행 끝");
    if (fail) throw new IllegalStateException("저장 뒤에 일부러 실패");
    return post.getId();
}
```

리스너 세 개를 한 클래스에 두었다. 클래스는 `@Component`로 빈이 되어야 한다.

```java
@Component
public class H5Listeners {
    @EventListener
    public void plain(PostCreated e) { log.info("[@EventListener] 알림 보냄 postId={}", e.postId()); }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(PostCreated e) { log.info("[AFTER_COMMIT] 알림 보냄 postId={}", e.postId()); }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void afterRollback(PostCreated e) { log.info("[AFTER_ROLLBACK] 롤백됨 postId={}", e.postId()); }
}
```

트랜잭션 시작·커밋이 로그에 보이도록 `application.yml`에 `logging.level.org.springframework.orm.jpa.JpaTransactionManager: debug`를 켰다. 아래 로그는 시각·스레드 이름 앞부분을 줄인 것이다.

**성공 — `curl -X POST "localhost:18310/h5/posts?title=ok"`**

```text
JpaTransactionManager : Creating new transaction with name [org.example.h5.H5PostService.create]
org.hibernate.SQL     : insert into lesson_h5_post (title) values (?)
H5PostService         : 글 저장 id=1
H5Listeners           : [@EventListener] 알림 보냄 postId=1
H5PostService         : 이벤트 발행 끝
JpaTransactionManager : Initiating transaction commit
JpaTransactionManager : Committing JPA transaction on EntityManager [SessionImpl(564658318<open>)]
H5Listeners           : [AFTER_COMMIT] 알림 보냄 postId=1
```

`@EventListener`는 `이벤트 발행 끝`보다 **먼저** 찍혔다. `publishEvent` 안에서 바로 불린 것이다. `AFTER_COMMIT`은 `Committing` 뒤에 찍혔다.

**실패 — `curl -X POST "localhost:18310/h5/posts?title=bad&fail=true"`**

```text
org.hibernate.SQL     : insert into lesson_h5_post (title) values (?)
H5PostService         : 글 저장 id=2
H5Listeners           : [@EventListener] 알림 보냄 postId=2
H5PostService         : 이벤트 발행 끝
JpaTransactionManager : Initiating transaction rollback
H5Listeners           : [AFTER_ROLLBACK] 롤백됨 postId=2
… Request processing failed: java.lang.IllegalStateException: 저장 뒤에 일부러 실패
```

응답은 `500`, `lesson_h5_post`에 id 2는 **없다**. 그런데 `@EventListener`는 `postId=2` 알림을 이미 보냈다. 이것이 "없는 글 알림"이다. `AFTER_COMMIT` 줄은 아예 없다.

| | 성공 | 롤백 |
|---|---|---|
| `@EventListener` | 커밋 **전**에 실행 | 실행됨 (사고) |
| `AFTER_COMMIT` | 커밋 **뒤**에 실행 | 실행 안 됨 |
| `AFTER_ROLLBACK` | 실행 안 됨 | 롤백 뒤 실행 |

### 트랜잭션이 없으면

`@Transactional`이 없는 메서드에서 `publishEvent`를 부르면 기다릴 커밋이 없다. `org.springframework.transaction.event` 로그를 `debug`로 켜면 이렇게 나온다.

```text
TransactionalApplicationListenerMethodAdapter : No transaction is active - skipping org.springframework.context.PayloadApplicationEvent[…]
H5Listeners : [@EventListener] 알림 보냄 postId=3
```

`AFTER_COMMIT`·`AFTER_ROLLBACK` 리스너는 **조용히 건너뛰었다.** 기본 로그 수준에서는 이 줄도 안 보인다. `@TransactionalEventListener(fallbackExecution = true)`로 두면 트랜잭션이 없을 때도 실행되는데, 그때는 `publishEvent` 순간 바로 실행된다(커밋을 기다리는 의미가 없어진다).

### 커밋 뒤에 DB에 쓰기

알림은 결국 `notification` 테이블에 **행을 넣는** 일이다. `AFTER_COMMIT` 리스너에서 별도 빈(`NoticeWriter`)의 `@Transactional` 메서드를 불러 `lesson_h5_notice`에 한 줄 넣어 봤다. 네 가지 방법으로 했다.

| `NoticeWriter` 메서드 | 로그 | `lesson_h5_notice` |
|---|---|---|
| `@Transactional` + `repository.save(...)` | `Participating in existing transaction`, **INSERT SQL이 안 나감**, 예외 없음 | 없음 |
| `@Transactional` + `@Modifying` 네이티브 INSERT | `InvalidDataAccessApiUsageException: No active transaction for update or delete query` | 없음 |
| `@Transactional` + `JdbcTemplate.update(...)` | 예외 없음 | **있음** |
| `@Transactional(propagation = REQUIRES_NEW)` + `save` | 아래 로그 | 있음 |

`@Transactional`의 기본값(`REQUIRED`)은 "이미 트랜잭션이 있으면 거기 끼고, 없으면 새로 연다"다. 커밋이 끝난 직후에도 Spring은 **끝난 트랜잭션을 아직 붙들고 있어서** `REQUIRED`가 거기 끼어 버린다(`Participating in existing transaction`). 그 트랜잭션은 이미 커밋됐으니 다시 커밋해 줄 사람이 없다. 그래서 같은 `REQUIRED`인데 조용히 사라지거나, 에러가 나거나, 저장되기도 한다. 이런 코드는 믿을 수 없다.

`REQUIRES_NEW`는 "있든 없든 **새 트랜잭션**을 연다"다.

```text
JpaTransactionManager : Suspending current transaction, creating new transaction with name [org.example.h5.NoticeWriter.saveRequiresNew]
org.hibernate.SQL     : insert into lesson_h5_notice (post_id,via) values (?,?)
JpaTransactionManager : Initiating transaction commit
JpaTransactionManager : Resuming suspended transaction after completion of inner transaction
```

새로 열고, 넣고, **자기가 커밋한다.** 그래서 16-1의 알림 서비스는 `REQUIRES_NEW`다.

## 따라 해 보기

15분. 실습 레포(`practice` 프로파일)에서 한다. 끝나면 되돌린다.

**1. 이벤트와 리스너를 만든다.**

```java
// PostCreatedEvent.java
public record PostCreatedEvent(Long postId, Long authorId) {}
```

```java
// PostEventLogger.java — 연습용, 끝나면 지운다
@Component
public class PostEventLogger {
    private static final Logger log = LoggerFactory.getLogger(PostEventLogger.class);

    @EventListener
    public void plain(PostCreatedEvent e) { log.info("[@EventListener] postId={}", e.postId()); }

    @TransactionalEventListener   // phase 생략 = AFTER_COMMIT
    public void afterCommit(PostCreatedEvent e) { log.info("[AFTER_COMMIT] postId={}", e.postId()); }
}
```

**2. 서비스에서 발행한다.** `PostService` 생성자에 `ApplicationEventPublisher events`를 더하고, `create`의 `save(...)` 바로 뒤에 `events.publishEvent(new PostCreatedEvent(post.getId(), authorId));`를 넣는다. `create` **맨 끝**(return 바로 앞)에 연습용 실패 장치를 잠시 넣는다.

```java
if (request.title().startsWith("[롤백]")) throw new IllegalStateException("연습용 롤백");
```

**3. 두 번 보낸다.**

```bash
BASE=http://localhost:8080; W='Authorization: Bearer tok-p04'; J='Content-Type: application/json'
curl -s -X POST "$BASE/api/posts" -H "$W" -H "$J" -d '{"boardSlug":"free","title":"H5 성공","content":"본문"}'; echo
curl -s -X POST "$BASE/api/posts" -H "$W" -H "$J" -d '{"boardSlug":"free","title":"[롤백] H5","content":"본문"}'; echo
```

앱 로그에서 본다. 첫 요청은 `[@EventListener]`와 `[AFTER_COMMIT]`이 둘 다, 두 번째(`500`)는 `[@EventListener]`만 찍혀야 한다. `practice` DB를 보는 `sql` 함수(16-1 직접 확인 첫 줄)로 `sql "SELECT id, title FROM post ORDER BY id DESC LIMIT 2"`를 보면 `H5 성공`은 있고 `[롤백] H5`는 없다.

**4. 되돌린다.** 실패 장치 한 줄과 `PostEventLogger`를 지운다. 이벤트 record와 발행은 16-1에서 그대로 쓴다.

## 일부러 틀려 보기

**1. 리스너에 `@Transactional`만 붙인다.** "리스너에서 DB에 쓰니까 트랜잭션을 걸자"며 이렇게 쓰면,

```java
@Transactional
@TransactionalEventListener
public void onCreated(PostCreated e) { … }
```

앱이 **아예 안 뜬다.** Spring 7.0.9에서 실제로 받은 메시지다.

```text
Caused by: java.lang.IllegalStateException: @TransactionalEventListener method must not be annotated with @Transactional unless when declared as REQUIRES_NEW or NOT_SUPPORTED: public void org.example.h5bad.BadListener.onCreated(org.example.h5.PostCreated)
```

위 "커밋 뒤에 DB에 쓰기"의 함정을 Spring이 막아 준 것이다. 메시지대로 `@Transactional(propagation = Propagation.REQUIRES_NEW)`로 바꾸거나, 16-1처럼 쓰기를 **다른 빈**의 `REQUIRES_NEW` 메서드로 옮긴다. 다른 빈의 `REQUIRED` 메서드로 옮기면 이 검사는 통과하지만 표의 첫 세 줄처럼 된다.

**2. 리스너가 예외를 던진다.** `AFTER_COMMIT` 리스너 안에서 `throw new IllegalStateException("알림 서버 응답 없음")`을 던졌다.

```text
ERROR … o.s.t.s.TransactionSynchronizationUtils : TransactionSynchronization.afterCompletion threw exception

java.lang.IllegalStateException: 알림 서버 응답 없음
	at org.example.h5.H5Listeners.afterCommit(H5Listeners.java:26)
```

응답은 **`200`** 이고 글도 저장돼 있었다. 이미 커밋이 끝났으니 되돌릴 수 없다. 대신 알림은 하나도 안 생겼고 로그 한 줄만 남는다. 그래서 16-1 힌트의 리스너는 `try/catch`로 잡아 **무엇이 실패했는지**(`postId`)를 직접 로그에 남긴다.

**3. 컨트롤러에서 발행한다.** `publishEvent`를 `@Transactional` 서비스 밖(컨트롤러)으로 옮기면 "트랜잭션이 없으면"의 상황이다. 에러도 없이 `AFTER_COMMIT` 리스너만 안 불린다. 16-1 힌트 3이 이 경우다.

## 확인 문제

**1.** `@EventListener`로 알림을 만들었다. 글 저장 뒤 같은 트랜잭션의 다른 작업이 실패해 롤백됐다. 알림은?

<details>
<summary>정답</summary>

**만들어진다(보내진다).** `@EventListener`는 `publishEvent`를 부른 순간 실행된다. 롤백은 그 뒤의 일이라 알림을 되돌리지 못한다. 예시에서 `postId=2` 글은 DB에 없는데 `[@EventListener] 알림 보냄 postId=2`가 찍혔다. 커밋 성공 뒤에만 하려면 `@TransactionalEventListener(AFTER_COMMIT)`.
</details>

**2.** `@TransactionalEventListener`를 붙였는데 로그가 전혀 안 찍힌다. 에러도 없다. 가장 먼저 볼 곳은?

<details>
<summary>정답</summary>

**`publishEvent`가 트랜잭션 안에서 불렸는지.** 트랜잭션이 없으면 기본적으로 건너뛴다(`fallbackExecution` 기본값 `false`). `debug` 로그에만 `No transaction is active - skipping`이 남는다. `@Transactional` 서비스 메서드 안, `save` 뒤에서 발행한다.
</details>

**3.** `@TransactionalEventListener`에 `phase`를 안 적으면 언제 실행되나? `BEFORE_COMMIT`을 쓰면 "커밋이 확정된 뒤"인가?

<details>
<summary>정답</summary>

생략하면 **`AFTER_COMMIT`**. `BEFORE_COMMIT`은 커밋을 **시도하기 직전**이라 그 뒤 커밋이 실패할 수 있다. 되돌릴 수 없는 일(알림, 메일)은 `AFTER_COMMIT`에 둔다.
</details>

**4.** `AFTER_COMMIT` 리스너가 다른 빈의 `@Transactional`(기본 `REQUIRED`) 메서드로 `repository.save(notice)`를 했다. 로그에 에러가 없는데 알림 행이 없다. 왜이고, 어떻게 고치나?

<details>
<summary>정답</summary>

`REQUIRED`는 **이미 커밋이 끝난 원래 트랜잭션**에 끼어든다(`Participating in existing transaction`). 그 트랜잭션을 다시 커밋해 줄 곳이 없어 INSERT가 나가지 않았다. 쓰기 메서드를 `@Transactional(propagation = Propagation.REQUIRES_NEW)`로 바꿔 **새 트랜잭션을 열고 스스로 커밋**하게 한다.
</details>

**5.** `AFTER_COMMIT` 리스너에서 예외가 나면 클라이언트는 무엇을 받나? 그래서 리스너는 어떻게 쓰나?

<details>
<summary>정답</summary>

**정상 응답(이 레슨에서 `200`)**. 글은 이미 커밋됐고, 예외는 `TransactionSynchronization.afterCompletion threw exception` 로그로만 남는다. 아무도 다시 시도하지 않으니 리스너가 직접 `try/catch`로 잡아 `postId` 같은 단서를 로그에 남긴다. 반드시 전달돼야 하는 일이면 아웃박스 같은 다른 설계가 필요하다(더 깊이).
</details>

## 더 깊이

- [S08 — 이벤트와 커밋의 관계](../docs/knowledge/S08-transactions.md#이벤트와-커밋의-관계)
- [S08 — 예제 3 커밋 후 알림과 그 한계](../docs/knowledge/S08-transactions.md#예제-3--커밋-후-알림과-그-한계)
- [S08 — 전파 7종](../docs/knowledge/S08-transactions.md#전파-7종) — `REQUIRED`와 `REQUIRES_NEW`
- [S08 — 아웃박스: DB 커밋과 메시지 전달 사이를 메우기](../docs/knowledge/S08-transactions.md#아웃박스-db-커밋과-메시지-전달-사이를-메우기)
- Spring Framework Reference — Transaction-bound Events: https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html
- `TransactionalEventListener` Javadoc(`phase`, `fallbackExecution`): https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html
- `ApplicationEventPublisher` Javadoc: https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/context/ApplicationEventPublisher.html
- Spring Framework Reference — Transaction Propagation: https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html

## 다음

- 실습: [16-1. 새 글 알림 — 커밋된 뒤에만 보내기](../scenario/ch16-events-async-cache/16-1-new-post-event.md) — 오늘의 이벤트·`AFTER_COMMIT`·`REQUIRES_NEW`로 팔로워 알림을 만들고, `rollback-test`로 롤백 때 알림이 없는지 확인한다.
- 레슨: [H6. @Async와 스레드 풀](H6-async-thread-pool.md) — `AFTER_COMMIT` 리스너도 요청 스레드에서 돈다. 느린 알림이 응답을 붙잡지 않게 하려면.
