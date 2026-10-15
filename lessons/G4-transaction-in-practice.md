# G4. 트랜잭션 실전 — 롤백 규칙·readOnly·전파·프록시 함정

> 개념 레슨 · 40분

## 이게 뭐냐

[G3](G3-first-transaction.md)에서 `@Transactional`을 붙이면 메서드가 "다 되거나 다 없던 일"이 되는 것을 봤다. 그런데 `@Transactional`이 붙어 있어도 **기대와 다르게** 끝나는 경우가 있다. 이 레슨은 그 경우를 모두 실제 로그로 본다.

| 기대 | 실제 | 왜 |
|---|---|---|
| 예외가 났으니 롤백 | **커밋** | checked 예외는 기본 롤백 대상이 아니다 |
| 예외를 잡았으니 커밋 | **롤백** + `UnexpectedRollbackException` | 안쪽에서 이미 "롤백만 가능"으로 찍혔다 |
| `@Transactional` 메서드니 트랜잭션 안 | **트랜잭션 없음** | 같은 객체 안에서 `this.`로 불렀다 |
| `REQUIRES_NEW`니 따로 커밋 | **같이 롤백** | 역시 `this.`로 불렀다 |
| `readOnly`는 그냥 힌트 | 쓰기가 **에러** | 이 환경(MySQL 드라이버)은 읽기 전용 연결에서 쓰기를 거절한다 |

### 먼저 알아 둘 것 — 프록시

`@Transactional`은 메서드 안에 코드를 끼워 넣지 않는다. Spring은 서비스 빈을 다른 빈에 넣어 줄 때, 진짜 객체 대신 **대리 객체**(프록시)를 넣는다. 컨트롤러가 `service.create()`를 부르면 실제로는 이렇게 흐른다.

```text
컨트롤러 → [프록시] 트랜잭션 시작 → [진짜 G4Service].create() → [프록시] 커밋 또는 롤백
```

프록시는 **바깥에서 들어오는 호출**만 본다. `create()` 안에서 `this.other()`를 부르면 `this`는 진짜 객체라서 프록시를 거치지 않는다. 그러면 `other()`에 붙은 `@Transactional`은 아무도 읽지 않는다. 이 한 줄이 아래 ③·④의 원인이다.

### 전파 — 이미 트랜잭션이 있을 때

| 설정 | 바깥에 트랜잭션이 있으면 | 없으면 |
|---|---|---|
| `REQUIRED`(기본) | 거기에 **참여**한다(`Participating in existing transaction`) | 새로 시작 |
| `REQUIRES_NEW` | 바깥을 **잠시 멈추고** 새로 시작한다. 따로 커밋·롤백된다 | 새로 시작 |

`REQUIRED`로 참여한 안쪽은 독립된 트랜잭션이 아니다. 바깥과 한 몸이다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1.1 앱(JPA + MySQL)을 띄웠다. 테이블은 연습용 `lesson_g4_post(title VARCHAR(50))`와 `lesson_g4_audit(message)`다. `JpaTransactionManager`를 `DEBUG`로 켜고, 메서드 안에서 지금 트랜잭션이 있는지를 찍었다(`TransactionSynchronizationManager.isActualTransactionActive()`, `getCurrentTransactionName()`). 로그는 시각·스레드를 떼고, `Opened new EntityManager`·`Exposing JPA transaction` 같은 반복 줄은 뺐다.

### ① checked 예외 — 기본은 커밋, `rollbackFor`면 롤백

G3에서 본 대로 `throws Exception` 메서드는 예외가 나도 커밋된다. 같은 몸통에 `rollbackFor`만 붙였다.

```java
@Transactional(rollbackFor = Exception.class)
public void checkedRollbackFor(String title) throws Exception {
    posts.save(new G4Post(title));
    throw new Exception("외부 시스템 응답 없음");
}
```

```text
### 기본 @Transactional
Creating new transaction with name [org.example.g4.G4Service.checkedDefault]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
insert into lesson_g4_post (title) values (?)
Initiating transaction commit
Committing JPA transaction on EntityManager [...]

### rollbackFor = Exception.class
Creating new transaction with name [org.example.g4.G4Service.checkedRollbackFor]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,-java.lang.Exception
insert into lesson_g4_post (title) values (?)
Initiating transaction rollback
Rolling back JPA transaction on EntityManager [...]
```

둘 다 응답은 `500`이었다. DB에는 `checked-default`만 남았다. 트랜잭션 설정 끝의 **`-java.lang.Exception`** 이 "이 예외면 롤백(`-`)"이라는 규칙이다. 로그 첫 줄만 봐도 롤백 규칙이 붙었는지 안다.

### ② 같은 객체 안에서 부르면 트랜잭션이 없다

```java
public void outerNoTx(String title) {         // @Transactional 없음
    TxProbe.print("outerNoTx");
    this.innerTx(title);                       // 같은 객체의 메서드
}

@Transactional
public void innerTx(String title) {
    TxProbe.print("innerTx");
    posts.save(new G4Post(title));
    throw new IllegalStateException("innerTx 실패");
}
```

컨트롤러는 `outerNoTx`를 불렀다.

```text
TX-PROBE : outerNoTx → 트랜잭션 있음=false, 이름=null, readOnly=false
TX-PROBE : innerTx → 트랜잭션 있음=false, 이름=null, readOnly=false
Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.save]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
insert into lesson_g4_post (title) values (?)
Committing JPA transaction on EntityManager [...]
Request processing failed: java.lang.IllegalStateException: innerTx 실패
```

`innerTx` 안에서도 **트랜잭션 있음=false**다. `Creating new transaction … G4Service.innerTx` 줄이 아예 없다. 트랜잭션은 저장소의 `save()`가 혼자 열고 바로 커밋했다(G3의 "트랜잭션 없을 때"와 같은 모양). 그래서 예외가 났는데도 `self-invocation` 글이 DB에 남았다.

고치는 법은 트랜잭션 진입점을 **바깥에서 부르는 메서드**로 옮기는 것이다. `outerNoTx`에 `@Transactional`을 붙이거나, `innerTx`를 다른 빈으로 옮겨 그 빈을 주입받아 부른다.

### ③ `REQUIRES_NEW` — `this.`로 부르면 / 다른 빈으로 부르면

본 작업이 실패해도 **감사 기록은 남기고** 싶다. 감사 기록 메서드에 `REQUIRES_NEW`를 붙였다. 먼저 같은 클래스 안에 두고 `this.`로 불렀다.

```java
@Transactional
public void auditSelf(String title) {
    posts.save(new G4Post(title));
    this.writeAudit("감사: " + title);
    throw new IllegalStateException("본 작업 실패");
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void writeAudit(String message) { audits.save(new G4Audit(message)); }
```

```text
Creating new transaction with name [org.example.g4.G4Service.auditSelf]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
insert into lesson_g4_post (title) values (?)
TX-PROBE : G4Service.writeAudit(this.) → 트랜잭션 있음=true, 이름=org.example.g4.G4Service.auditSelf, readOnly=false
Participating in existing transaction
insert into lesson_g4_audit (message) values (?)
Initiating transaction rollback
Rolling back JPA transaction on EntityManager [...]
```

`writeAudit` 안의 트랜잭션 **이름이 `auditSelf`** 다. 새 트랜잭션이 아니라 바깥 것을 그대로 쓰고 있다. 롤백 한 번에 글과 감사 기록이 **둘 다** 사라졌다.

이번에는 같은 메서드를 `AuditService`라는 **다른 빈**에 두고 주입받아 불렀다(`auditService.write(…)`).

```text
Creating new transaction with name [org.example.g4.G4Service.auditBean]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
insert into lesson_g4_post (title) values (?)
Suspending current transaction, creating new transaction with name [org.example.g4.AuditService.write]
TX-PROBE : AuditService.write → 트랜잭션 있음=true, 이름=org.example.g4.AuditService.write, readOnly=false
Participating in existing transaction
insert into lesson_g4_audit (message) values (?)
Committing JPA transaction on EntityManager [...]
Resuming suspended transaction after completion of inner transaction
Initiating transaction rollback
Rolling back JPA transaction on EntityManager [...]
```

```text
+----+--------------------+
| id | message            |
+----+--------------------+
|  2 | 감사: audit-bean   |
+----+--------------------+
```

바깥을 멈추고(`Suspending`) 새로 열고, 감사 기록만 **먼저 커밋**한 뒤, 바깥으로 돌아와(`Resuming`) 글은 롤백했다. 감사 기록이 남았다. id가 `2`인 것은 롤백된 `auditSelf`의 감사 기록이 `1`번을 썼기 때문이다(G3: 번호는 돌려받지 않는다).

`REQUIRES_NEW`는 바깥이 DB 연결을 쥔 채로 연결을 **하나 더** 쓴다. 동시에 요청이 많으면 연결이 모자랄 수 있으니 "따로 커밋돼야 하는 일"에만 쓴다.

### ④ `readOnly = true`에서 쓰면

```java
@Transactional(readOnly = true)
public void readOnlyJdbcInsert(String title) {
    jdbc.update("INSERT INTO lesson_g4_post (title) VALUES (?)", title);
}
```

```text
Creating new transaction with name [org.example.g4.G4Service.readOnlyJdbcInsert]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
TX-PROBE : readOnlyJdbcInsert → 트랜잭션 있음=true, 이름=…readOnlyJdbcInsert, readOnly=true
Executing prepared SQL statement [INSERT INTO lesson_g4_post (title) VALUES (?)]
Initiating transaction rollback
Request processing failed: org.springframework.dao.TransientDataAccessResourceException: PreparedStatementCallback; SQL [INSERT INTO lesson_g4_post (title) VALUES (?)]; Connection is read-only. Queries leading to data modification are not allowed
```

JPA로 새 엔티티를 `save()`해도 같은 `Connection is read-only. Queries leading to data modification are not allowed`(이번엔 `JpaSystemException`으로 감싸져)가 났다. 둘 다 `500`, 둘 다 저장 안 됨.

정리하면 `readOnly`의 결과는 **쓰는 방법에 따라** 다르다.

| `readOnly = true` 안에서 | 결과 | 어디서 봤나 |
|---|---|---|
| 읽어 온 엔티티 값 바꾸기(변경 감지) | 에러 없이 **조용히 저장 안 됨** | [E7 ⑤](E7-jpa-update-delete.md) |
| `INSERT`·`UPDATE`를 직접 보내기 | **에러**(`Connection is read-only…`) | 위 |

Spring 문서는 `readOnly`를 "읽기만 하니 최적화해도 된다"는 **힌트**라고 설명하고, 쓰기를 막는다고 약속하지 않는다. 쓰기를 거절한 것은 이 환경의 MySQL 드라이버다. 그러니 `readOnly`를 "쓰기 금지 장치"로 기대지 말고, 조회 메서드에만 붙인다.

## 따라 해 보기

10분. 2-2 이후의 실습 레포에서 한다.

**1. 트랜잭션 로그를 켠다.** `application.yml`에 넣고 다시 켠다.

```yaml
logging:
  level:
    org.springframework.orm.jpa.JpaTransactionManager: debug
```

**2. 글 상세(`GET /api/posts/{id}`)와 글쓰기(`POST /api/posts`)를 한 번씩 부른다.** 로그에서 `Creating new transaction with name [`로 시작하는 줄을 찾는다.

- 이름이 **서비스 메서드**(`…PostService.getPost` 같은)인가, 저장소의 `SimpleJpaRepository…`인가? 저장소 이름만 나오면 서비스에 `@Transactional`이 없거나 ②처럼 프록시를 안 거쳤다.
- 줄 끝에 `readOnly`가 붙었나? 2-2 정답 코드는 목록(`PostQueryService.list`)에만 `readOnly = true`를 붙인다. 상세는 조회수를 올리는 **쓰기**라서 붙이면 안 된다(2-1 채점 R2). 상세 줄에 `readOnly`가 보이면 ④와 E7 ⑤의 상황이다. 게시판 목록(`GET /api/boards/free/posts`)도 한 번 불러 비교한다.
- 글쓰기에서 `Participating in existing transaction`이 저장 횟수만큼 나오나?

**3. 끝나면** `debug`를 지우거나 `info`로 돌린다. 요청마다 줄이 많이 찍힌다.

## 일부러 틀려 보기

**1. 내가 던진 예외를 내가 잡는다** — 커밋된다.

```java
@Transactional
public void catchOwn(String title) {
    posts.save(new G4Post(title));
    try { throw new IllegalStateException("알림 발송 실패"); }
    catch (IllegalStateException e) { /* 잡고 정상 반환 */ }
}
```

로그는 `Initiating transaction commit`, 응답은 `200`, 글은 남았다. 프록시는 메서드 **밖으로 나온** 예외만 본다. 실패인데 저장돼야 한다면 괜찮지만, "실패했는데 왜 남았지?"의 흔한 원인이다.

**2. 저장소가 던진 예외를 잡는다** — 이번에는 반대로 **롤백**된다.

```java
@Transactional
public void catchInner(String title) {
    posts.save(new G4Post(title));
    try { posts.save(new G4Post("…50자를 넘는 제목…")); }   // 칸이 모자라 실패
    catch (RuntimeException e) { /* 잡았으니 첫 글은 커밋되겠지? */ }
}
```

```text
insert into lesson_g4_post (title) values (?)
Participating in existing transaction
insert into lesson_g4_post (title) values (?)
HHH000247: ErrorCode: 1406, SQLState: 22001
Data truncation: Data too long for column 'title' at row 1
Participating transaction failed - marking existing transaction as rollback-only
Initiating transaction commit
Committing JPA transaction on EntityManager [...]
Request processing failed: org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
```

`save()`도 `@Transactional` 메서드다. 바깥 트랜잭션에 **참여**한 채로 실패해서, 공유하는 트랜잭션에 "롤백만 가능"을 찍었다. 바깥 코드가 예외를 잡고 커밋하려 하자 Spring이 실제로는 롤백하고 `UnexpectedRollbackException`을 던졌다. 로그에 `Committing`이 찍혀 있어도 DB에 첫 글은 **없다.** 응답은 `500`이다. 잡고 넘어갈 일이면 그 저장을 `REQUIRES_NEW`(③)로 떼어 내거나, 저장 전에 값을 검사해(F6) 예외가 안 나게 한다.

## 확인 문제

**1.** `@Transactional` 메서드가 `IOException`을 던졌다. 앞에서 저장한 글은? 롤백되게 하려면?

<details>
<summary>정답</summary>

기본은 **커밋**된다. `IOException`은 checked 예외라 기본 롤백 대상(`RuntimeException`·`Error`)이 아니다. `@Transactional(rollbackFor = IOException.class)`(또는 `Exception.class`)를 붙인다. 붙었는지는 로그 첫 줄 끝의 `-java.io.IOException`으로 확인한다.
</details>

**2.** `@Transactional`이 없는 `a()`가 같은 클래스의 `@Transactional b()`를 부른다. 컨트롤러가 `a()`를 부르면 `b()`는 트랜잭션 안에서 도나?

<details>
<summary>정답</summary>

**아니다.** `this.b()`는 프록시를 거치지 않는다. ②에서 `innerTx` 안의 `트랜잭션 있음=false`로 봤다. `a()`에 붙이거나 `b()`를 다른 빈으로 옮긴다.
</details>

**3.** 같은 클래스의 `REQUIRES_NEW` 메서드를 `this.`로 불렀고, 그 뒤 바깥 메서드가 실패했다. 안쪽에서 저장한 것은?

<details>
<summary>정답</summary>

**같이 롤백된다.** `REQUIRES_NEW` 설정을 읽을 프록시를 안 거쳤으니 바깥 트랜잭션에 그냥 섞여 있다(③의 트랜잭션 이름이 `auditSelf`). 따로 커밋하려면 다른 빈의 메서드로 부른다. 16-1의 알림 저장이 그렇게 되어 있다.
</details>

**4.** 바깥 메서드가 안쪽 `REQUIRED` 저장의 예외를 `catch`로 잡고 정상 반환했다. 결과는?

<details>
<summary>정답</summary>

**전부 롤백**되고 `UnexpectedRollbackException`(`Transaction silently rolled back because it has been marked as rollback-only`)이 난다. 안쪽이 참여한 트랜잭션은 바깥과 같은 것이라, 안쪽 실패가 이미 "롤백만 가능"으로 찍었다. 잡았다고 지워지지 않는다.
</details>

**5.** "조회 메서드라 `readOnly = true`를 붙였다. 실수로 안에서 값을 바꿔도 DB가 막아 주니 괜찮다." 맞나?

<details>
<summary>정답</summary>

**틀리다.** 엔티티 값을 바꾸는 방식이면 에러도 없이 저장만 안 된다(E7 ⑤). 직접 `INSERT`를 보내면 이 환경에선 드라이버가 거절했지만, 그건 `readOnly`의 약속이 아니라 드라이버의 동작이다. `readOnly`는 최적화 힌트로 보고, 조회 메서드에만 붙인다.
</details>

## 더 깊이

- [S08 — 롤백 규칙 매칭](../docs/knowledge/S08-transactions.md#롤백-규칙-매칭) · [전파 7종](../docs/knowledge/S08-transactions.md#전파-7종) · [Q2. 내부 REQUIRED가 rollback-only가 되면](../docs/knowledge/S08-transactions.md#q2-내부-required-메서드가-rollback-only가-되면-왜-바깥-커밋에서-예외가-나는가)
- [S02 — self-invocation이 빠지는 이유](../docs/knowledge/S02-aop-proxy.md#self-invocation이-빠지는-이유) — 프록시 호출 흐름
- [W11 트랜잭션은 왜 서비스 계층에 거나](../docs/knowledge/W11-why-tx-in-service.md) — 자기 호출, 외부 호출을 트랜잭션 안에 두면 생기는 일
- 원문: [Spring — Using @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html) — 프록시 모드와 자기 호출 · [Rolling Back](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html) · [Transaction Propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html) — `UnexpectedRollbackException`, `REQUIRES_NEW`의 연결 사용 · [`@Transactional` Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html) — `readOnly`는 런타임 최적화용 힌트

## 다음

- 실습: [16-1. 새 글 알림 — 커밋된 뒤에만 보내기](../scenario/ch16-events-async-cache/16-1-new-post-event.md) — 커밋 뒤 리스너가 부르는 알림 저장이 왜 `REQUIRES_NEW`여야 하는지(R2).
- 실습: [16-2. 알림을 비동기로 — 느린 발송이 글쓰기를 막지 않게](../scenario/ch16-events-async-cache/16-2-async-notification.md) — `@Async` 스레드에는 이어 갈 트랜잭션이 없다.
- 다시 보기: [E7 ⑤](E7-jpa-update-delete.md) — `readOnly`에서 변경 감지가 조용히 빠지는 장면.
