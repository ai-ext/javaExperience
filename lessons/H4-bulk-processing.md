# H4. 대량 데이터 처리 — 나눠서 지우고 바꾸기

> 개념 레슨 · 40분

## 이게 뭐냐

"삭제하고 30일 지난 글을 진짜로 지워 주세요. 댓글도 같이요." 지울 글이 6,000개, 댓글이 18,000개다. `DELETE` 한 문장이면 될 것 같지만 세 가지에 걸린다.

- **순서** — 댓글(`comment.post_id`)이 글을 가리키는 FK가 있으면 글을 먼저 못 지운다. **자식 먼저**, 부모 나중.
- **잠금** — `DELETE`는 지우는 행을 잠근다. 잠금은 **커밋할 때까지** 유지된다. 한 트랜잭션에 18,000행이면 그동안 그 행을 고치려는 요청이 전부 기다린다. 중간에 실패하면 전부 되돌아간다.
- **메모리** — JPA로 수만 개를 다루면, 트랜잭션이 끝날 때까지 엔티티를 전부 들고 있다(E7의 영속성 컨텍스트).

그래서 **잘게 나눠서**(청크) 한다. 나누는 장치가 셋인데, 서로 다른 것을 조절한다.

| 장치 | 조절하는 것 | 이 레슨의 방법 |
|---|---|---|
| 트랜잭션 청크 | 한 번에 커밋할 행 수 = 잠금이 잡혀 있는 범위와 시간 | `DELETE … ORDER BY id LIMIT 1000`을 청크마다 따로 커밋 |
| JPA 영속성 컨텍스트 | 앱이 들고 있는 엔티티 수 | 500개마다 `flush()` + `clear()` |
| JDBC 배치 | 같은 SQL을 DB에 몇 번에 나눠 보내나 | `JdbcTemplate.batchUpdate` |

`flush()`는 "모아 둔 SQL을 지금 DB로 보내라"이고, **커밋이 아니다.** `flush()`를 아무리 불러도 트랜잭션은 하나 그대로다.

## 예시

`practice`에 연습용 표를 만들어 실험했다. 글 10,000개 중 6,000개가 오래전에 지운 글, 글마다 댓글 3개다.

```sql
CREATE TABLE lesson_h4_post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  deleted_at DATETIME NULL
);
CREATE TABLE lesson_h4_comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  body VARCHAR(100) NOT NULL,
  CONSTRAINT fk_h4_comment_post FOREIGN KEY (post_id) REFERENCES lesson_h4_post (id)
);
SET SESSION cte_max_recursion_depth = 20000;
INSERT INTO lesson_h4_post (title, deleted_at)
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10000)
SELECT CONCAT('글 ', i), IF(i <= 6000, '2026-08-01 00:00:00', NULL) FROM n;
INSERT INTO lesson_h4_comment (post_id, body)
SELECT p.id, CONCAT('댓글 ', k.k) FROM lesson_h4_post p
CROSS JOIN (SELECT 1 k UNION ALL SELECT 2 UNION ALL SELECT 3) k;
```

`WITH RECURSIVE`는 1부터 10000까지 숫자 행을 만드는 문법이다. 한도를 안 올리면 `ERROR 3636 … Recursive query aborted after 1001 iterations`가 난다(기본 1000). 지울 댓글은 `id` 1~18000, 남길 댓글은 18001~30000이 됐다.

### 부모부터 지우면 — 1451

```text
mysql> DELETE FROM lesson_h4_post WHERE deleted_at < '2026-09-05';
ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails (`practice`.`lesson_h4_comment`, CONSTRAINT `fk_h4_comment_post` FOREIGN KEY (`post_id`) REFERENCES `lesson_h4_post` (`id`))
```

### `LIMIT`은 "최대 몇 행"

```text
mysql> DELETE FROM lesson_h4_comment
    -> WHERE post_id IN (SELECT id FROM lesson_h4_post WHERE deleted_at < '2026-09-05')
    -> ORDER BY id LIMIT 1000;
Query OK, 1000 rows affected (0.03 sec)
```

한 번에 1000행만 지웠다. 나머지는 남아 있다. **0행이 나올 때까지 되풀이**한다. 매번 "앞에서부터 1000개"를 지우니 `OFFSET`이 필요 없다(지울 때 `OFFSET`으로 넘기면 앞이 지워져 당겨지면서 행을 건너뛴다). 단, 표 두 개를 조인한 `DELETE`에는 `LIMIT`을 못 쓴다.

```text
mysql> DELETE c FROM lesson_h4_comment c JOIN lesson_h4_post p ON p.id = c.post_id
    -> WHERE p.deleted_at < '2026-09-05' LIMIT 1000;
ERROR 1064 (42000): You have an error in your SQL syntax; … near 'LIMIT 1000' at line 1
```

### 한 번에 vs 1000건씩 — 누가 기다리나

터미널 A가 `START TRANSACTION` 후 `DELETE`를 하고 **커밋 전**에 멈춘다. 그동안 터미널 B가 댓글 하나를 고친다(기다림 한도 3초로 줄임). 실제 결과다.

| A가 한 것 | B가 고친 댓글 | B 결과 |
|---|---|---|
| 18,000행 한 번에 `DELETE` | 17000번(지울 대상) | `ERROR 1205 … Lock wait timeout exceeded` |
| 〃 | 25000번(남길 댓글) | 바로 성공 |
| `ORDER BY id LIMIT 1000` | 17000번 | 바로 성공 |
| 〃 | 500번(이번 청크) | `ERROR 1205` |

한 번에 지우면 지울 대상 전부가 커밋 때까지 잠긴다. 1000건씩이면 잠긴 건 이번 청크 1000행뿐이고, 커밋하면 풀린다.

### 청크 루프 — 청크 하나가 트랜잭션 하나

```java
@Service
public class TrashPurge {
    private static final int CHUNK = 1000;
    private static final Logger log = LoggerFactory.getLogger(TrashPurge.class);   // org.slf4j
    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    // 생성자 생략

    // 이 메서드에는 @Transactional을 붙이지 않는다 — 청크마다 따로 커밋해야 하니까
    public long purge(LocalDateTime cutoff) {
        long comments = deleteInChunks("comment",
                "DELETE FROM lesson_h4_comment WHERE post_id IN "
                        + "(SELECT id FROM lesson_h4_post WHERE deleted_at < ?) ORDER BY id LIMIT ?", cutoff);
        long posts = deleteInChunks("post",
                "DELETE FROM lesson_h4_post WHERE deleted_at < ? ORDER BY id LIMIT ?", cutoff);
        log.info("purge 끝 comment={} post={}", comments, posts);
        return posts;
    }

    private long deleteInChunks(String name, String sql, LocalDateTime cutoff) {
        long total = 0;
        int round = 0;
        while (true) {
            Integer deleted = tx.execute(status -> jdbc.update(sql, cutoff, CHUNK));   // 한 청크 = 한 트랜잭션
            round++;
            total += deleted;
            log.info("{} 청크 {}: {}건 (누적 {})", name, round, deleted, total);
            if (deleted < CHUNK) return total;
        }
    }
}
```

`TransactionTemplate.execute`는 람다 하나를 트랜잭션 하나로 실행하고 커밋한다(E4·E7에서 쓴 것). `jdbc.update`는 영향받은 행 수를 돌려준다.

```text
comment 청크 1: 1000건 (누적 1000)
comment 청크 2: 1000건 (누적 2000)
…
comment 청크 18: 1000건 (누적 18000)
comment 청크 19: 0건 (누적 18000)
post 청크 1: 1000건 (누적 1000)
…
post 청크 6: 1000건 (누적 6000)
post 청크 7: 0건 (누적 6000)
purge 끝 comment=18000 post=6000
```

남은 행은 글 4,000, 댓글 12,000이다. 처리 건수를 청크마다 로그로 남기면, 중간에 죽어도 어디까지 됐는지 보인다. 다시 돌려도 남은 것만 지운다.

### JPA로 2만 개 넣기 — 들고 있는 엔티티가 쌓인다

한 트랜잭션에서 `em.persist`를 2만 번 했다. 5,000개마다 영속성 컨텍스트가 관리하는 엔티티 수를 찍었다(`em.unwrap(Session.class).getStatistics().getEntityCount()`).

```java
for (int i = 1; i <= 20_000; i++) {
    em.persist(new LessonH4Post("대량 " + i));
    if (i % 5000 == 0) p(i + "개째 — 들고 있는 엔티티 " + managed() + "개");
    if (clearEvery500 && i % 500 == 0) {
        em.flush();   // 쌓인 SQL을 DB로 (커밋 아님)
        em.clear();   // 들고 있던 엔티티를 놓는다
    }
}
```

| | 5,000개째 | 20,000개째 | 커밋 직전 힙(GC 후) |
|---|---|---|---|
| 그냥 | 5,000개 | **20,000개** | 30MB |
| 500개마다 `flush`·`clear` | 500개 | 500개 | 23MB |

엔티티가 작아서 차이가 7MB지만, 들고 있는 수는 계속 늘었다. 엔티티가 크거나 수십만 개면 메모리가 모자란다(Hibernate 문서의 경고). 걸린 시간은 두 방식을 두 번씩 재서 3.9~9.3초로 들쭉날쭉해 어느 쪽이 빠르다고 말할 수 없었다.

`clear()` 뒤에는 그 객체를 고쳐도 저장되지 않는다.

```text
clear 전 contains: true
clear 후 contains: false
DB 제목: 글 7001          ← changeTitle("clear 뒤에 고침")을 했지만 UPDATE가 안 나갔다
```

### `saveAll`과 `batchUpdate`

`posts.saveAll(5개)`의 SQL 로그는 `insert into lesson_h4_post (deleted_at,title) values (?,?)` **다섯 줄**이었다. `saveAll`은 `save`를 하나씩 부른다. `spring.jpa.properties.hibernate.jdbc.batch_size=50`을 켜고 통계(`generate_statistics=true`)를 보면 이렇다.

```text
executing 5 JDBC statements
executing 0 JDBC batches
```

`@GeneratedValue(strategy = IDENTITY)`(AUTO_INCREMENT)는 INSERT마다 DB가 만든 id를 받아야 해서 Hibernate가 묶지 않는다. 묶어 보내려면 `JdbcTemplate.batchUpdate`를 쓴다.

```java
int[] counts = tx.execute(s -> jdbc.batchUpdate("UPDATE lesson_h4_post SET title = ? WHERE id = ?", params));
```

2,000행을 한 트랜잭션에서 세 번씩 돌렸다. URL에 `rewriteBatchedStatements=true`를 붙이면 드라이버(Connector/J 9.7)가 여러 문장을 한 번에 보낸다.

| URL | 돌려준 배열 | 시간(3회) |
|---|---|---|
| 기본 | 길이 2000, 전부 `1` | 475 · 415 · 402ms |
| `rewriteBatchedStatements=true` | 길이 2000, 전부 `1` | 189 · 183 · 210ms |

배열은 "각 파라미터 묶음이 몇 행을 바꿨나"다. 두 경우 모두 `1`이 2,000개였다.

## 따라 해 보기

15분. G3의 mysql 접속 명령에서 맨 끝 DB 이름 `community`를 `practice`로 바꿔 들어간다(진짜 `post`·`comment`는 건드리지 않는다).

**1.** 예시의 `CREATE`·`INSERT`를 실행하고 `SELECT COUNT(*)`로 10000·30000을 확인한다.

**2.** 부모부터 `DELETE` → `1451`을 본다.

**3.** 댓글 `DELETE … ORDER BY id LIMIT 1000`을 `0 rows affected`가 나올 때까지 손으로 되풀이한다(19번). 그다음 글도 같은 방식으로(7번).

**4. 잠금 보기.** 5의 `DROP` 두 줄을 먼저 하고 1을 다시 해 데이터를 되살린다(표가 남아 있으면 `CREATE`가 `ERROR 1050`). 그다음 터미널 두 개를 같은 방식으로 연다.

| 순서 | A | B |
|---|---|---|
| 1 | `START TRANSACTION;` | |
| 2 | 댓글 `DELETE`(LIMIT 없이) | |
| 3 | | `SET SESSION innodb_lock_wait_timeout = 3;` |
| 4 | | `UPDATE lesson_h4_comment SET body = '수정' WHERE id = 17000;` → 3초 뒤 `1205` |
| 5 | `ROLLBACK;` | |

2번을 `ORDER BY id LIMIT 1000`으로 바꾸면 4번이 바로 끝난다.

**5. 정리.** `DROP TABLE lesson_h4_comment; DROP TABLE lesson_h4_post;` (자식 먼저)

## 일부러 틀려 보기

**1. 바깥에 `@Transactional`.** 청크 루프를 트랜잭션 하나 안에서 불렀다(`tx.executeWithoutResult(s -> purge.purge(…))`, 서비스에 `@Transactional`을 붙인 것과 같다). 로그는 위와 **똑같이** `청크 1…19`가 찍혔다. 그런데 루프가 끝나고 커밋 전에 B가 17000번을 고치자 `ERROR 1205`였다. 안쪽 `tx.execute`가 새 트랜잭션을 열지 않고 바깥 트랜잭션에 **합류**했기 때문이다. 18,000행 잠금이 끝까지 유지됐고, 롤백하자 30,000행이 전부 돌아왔다. 바깥 트랜잭션 없이 돌리면 같은 시점에 B는 `Rows matched: 0`(이미 지워짐)으로 바로 끝났다.

**2. `flush()`면 커밋된 줄 알기.** 위 1과 같은 이유다. `flush`는 SQL을 보낼 뿐이다. 커밋 경계는 `TransactionTemplate`이나 `@Transactional` 메서드가 끝나는 곳이다.

**3. `clear()` 뒤에 옛 객체 고치기.** 예시의 `DB 제목: 글 7001`. 고칠 게 있으면 `clear()` 전에 고치거나, 다시 `find`해서 고친다.

## 확인 문제

**1.** `DELETE FROM t WHERE … LIMIT 500`을 한 번 실행했다. 대상이 2,000행이면 몇 행이 지워지나? 다 지우려면?

<details>
<summary>정답</summary>

**500행.** `LIMIT`은 한 문장이 지울 최대 행 수다. 영향받은 행이 0(또는 500 미만)이 될 때까지 되풀이한다.
</details>

**2.** 글과 댓글(`comment.post_id` FK)을 지운다. 순서는? 반대로 하면?

<details>
<summary>정답</summary>

**댓글 먼저, 글 나중.** 글을 먼저 지우면 `ERROR 1451 Cannot delete or update a parent row`다(`ON DELETE CASCADE`가 없을 때).
</details>

**3.** 18,000행을 한 트랜잭션으로 지우는 동안 다른 요청이 그중 한 행을 고치려 하면? 1000건씩 청크마다 커밋하면?

<details>
<summary>정답</summary>

한 번에: 커밋까지 기다리다 `1205 Lock wait timeout`이 날 수 있다. 청크: 잠긴 건 지금 청크 1000행뿐이라 다른 행은 바로 고쳐진다.
</details>

**4.** 청크 루프 안에서 `tx.execute`로 청크마다 커밋하게 짰는데, 그 메서드를 부르는 서비스에 `@Transactional`이 붙어 있다. 어떻게 되나?

<details>
<summary>정답</summary>

안쪽 트랜잭션이 바깥에 **합류**해서 청크마다 커밋되지 않는다. 로그는 청크별로 찍히지만 잠금은 끝까지 유지되고, 실패하면 전부 롤백된다. 청크 루프를 감싸는 메서드에는 트랜잭션을 걸지 않는다.
</details>

**5.** 한 트랜잭션에서 `em.persist`를 2만 번 했다. 500개마다 `flush()`·`clear()`를 넣으면 무엇이 달라지고 무엇이 그대로인가?

<details>
<summary>정답</summary>

달라지는 것: 들고 있는 엔티티가 2만 개까지 쌓이지 않고 500개 이하로 유지된다(메모리). 그대로인 것: **트랜잭션은 하나**다. `flush`는 커밋이 아니다. 그리고 `clear()` 전에 받은 객체를 나중에 고쳐도 저장되지 않는다.
</details>

## 더 깊이

- [E7 JPA로 수정·삭제하기](./E7-jpa-update-delete.md) — 영속성 컨텍스트, `@Modifying` 벌크 수정과 `clearAutomatically`
- [G3 첫 트랜잭션](./G3-first-transaction.md) — 트랜잭션 경계와 롤백
- [H1 동시성 맛보기](./H1-concurrency-taste.md) — 행 잠금과 `1205`
- [S15 비동기·스케줄링·Spring Batch](../docs/knowledge/S15-async-scheduling-batch.md) — 청크 경계와 체크포인트(Spring Batch)
- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — 영속성 컨텍스트와 flush
- MySQL 8.0 — `DELETE`(LIMIT 반복, 다중 테이블 제약): https://dev.mysql.com/doc/refman/8.0/en/delete.html
- MySQL 8.0 — InnoDB Locking: https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html
- MySQL 8.0 — FOREIGN KEY: https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html
- Hibernate ORM 7 User Guide — Batching(기본 꺼짐, IDENTITY는 insert 배치 불가, flush/clear): https://docs.hibernate.org/orm/7.0/userguide/html_single/
- Spring Framework — JDBC Batch Operations: https://docs.spring.io/spring-framework/reference/data-access/jdbc/advanced.html

## 다음

- 실습: [15-4. 휴지통 비우기 — 자식 먼저, 1000건씩](../scenario/ch15-scheduling-batch/15-4-trash-purge.md) — 진짜 `post`·`comment`·`post_like`… FK 순서, 답글 먼저, 30일 경계까지.
- 예약 실행은 [H3. 스케줄링](./H3-scheduling.md)에서.
