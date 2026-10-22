# G3. 트랜잭션 첫 만남 — 왜 한 번에 커밋하나

> 개념 레슨 · 35분

## 이게 뭐냐

글 하나를 저장하는 API(1-3부터)는 DB에 여러 번 쓴다. `post`에 한 줄, 태그마다 `post_tag`에 한 줄씩이다. 태그가 둘이면 `INSERT`가 세 번 나간다.

세 번 중 마지막에서 실패하면 어떻게 되나? 글은 있는데 태그는 하나만 붙은, **반쯤 저장된 글**이 남는다. 사용자는 에러 화면을 봤으니 다시 쓰고, 그러면 같은 글이 두 개가 된다.

**트랜잭션**은 여러 번의 쓰기를 "전부 되거나, 전부 없던 일이 되거나" 둘 중 하나로 묶는다.

| 말 | 뜻 |
|---|---|
| 트랜잭션 시작 | 지금부터의 변경은 아직 확정이 아니다 |
| **커밋(commit)** | 지금까지의 변경을 한꺼번에 확정한다. 이때부터 다른 접속에서도 보인다 |
| **롤백(rollback)** | 지금까지의 변경을 한꺼번에 없던 일로 한다 |

git에 빗대면 쉽다. 파일 여러 개를 고치고 커밋하면 그 변경은 **커밋 하나**로 남는다. 커밋 전에 `git restore`로 버리면 고친 파일이 모두 원래대로 돌아간다. "파일 두 개만 커밋되고 하나는 빠진" 상태는 없다.

E2의 따라 해 보기 4번에서 `START TRANSACTION` ~ `ROLLBACK`을 이미 해 봤다. 이 레슨은 두 가지를 더 본다.

1. **트랜잭션이 없으면** MySQL은 문장 하나하나를 바로 커밋한다(**자동 커밋**, autocommit). 그래서 중간에 실패하면 앞의 문장들은 이미 확정되어 있다.
2. 트랜잭션 안에서 문장 하나가 실패해도(이 레슨의 "값이 너무 길다" 같은 에러) MySQL이 **알아서 전부 롤백해 주지는 않는다.** 실패한 그 문장만 무시된다. "실패했으니 전부 되돌려"라고 말하는 것은 앱의 일이다. Spring에서는 `@Transactional`이 그 말을 대신 한다. (예외도 있다. 두 트랜잭션이 서로를 기다리는 교착 상태(deadlock)에서는 MySQL이 한쪽 트랜잭션을 통째로 되돌린다. 4-2에서 만난다.)

### Spring의 `@Transactional`

서비스 메서드에 `@Transactional`을 붙이면 Spring이 메서드 앞뒤에 이렇게 끼어든다.

```text
메서드 시작 전   → 트랜잭션 시작 (START TRANSACTION)
메서드 몸통      → INSERT post, INSERT post_tag, ...
정상으로 끝나면  → COMMIT
RuntimeException이 나면 → ROLLBACK, 그리고 예외를 그대로 위로 던진다
```

그래서 **메서드 하나 = 업무 하나 = 트랜잭션 하나**가 된다. "글 쓰기"라는 업무가 서비스 메서드 하나이니 트랜잭션도 서비스에 건다. 컨트롤러는 HTTP만, 저장소는 한 테이블만 아니까 "이 업무에 무엇이 다 들어가나"를 아는 곳은 서비스다(E1).

## 예시

### SQL로 직접 — 실패해도 앞 문장은 남아 있다

트랜잭션을 눈으로 보려면 **한 접속**에서 여러 문장을 차례로 쳐야 한다. 그래서 이번에는 E2의 `sql` 함수(한 번 치고 끊는다) 대신 `mysql` 클라이언트에 들어가서 친다.

```bash
docker compose exec -e LANG=C.UTF-8 mysql mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community
```

시드 데이터를 건드리지 않도록 **임시 테이블**(`TEMPORARY`)을 만든다. 임시 테이블은 이 접속에서만 보이고, 접속을 끊으면 사라진다. 태그 이름 칸은 10글자까지만 들어가게 했다.

```text
mysql> CREATE TEMPORARY TABLE t_post (id BIGINT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(50) NOT NULL);
Query OK, 0 rows affected (0.00 sec)

mysql> CREATE TEMPORARY TABLE t_tag (post_id BIGINT NOT NULL, name VARCHAR(10) NOT NULL);
Query OK, 0 rows affected (0.00 sec)

mysql> START TRANSACTION;
Query OK, 0 rows affected (0.00 sec)

mysql> INSERT INTO t_post (title) VALUES ('트랜잭션 연습');
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO t_tag VALUES (LAST_INSERT_ID(), 'java');
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO t_tag VALUES (LAST_INSERT_ID(), '엄청나게길어서칸을넘는태그');
ERROR 1406 (22001): Data too long for column 'name' at row 1
mysql> SELECT * FROM t_post;
+----+---------------------+
| id | title               |
+----+---------------------+
|  1 | 트랜잭션 연습       |
+----+---------------------+
1 row in set (0.00 sec)
```

세 번째 `INSERT`가 실패했는데 **글은 아직 있다.** MySQL은 실패한 문장 하나만 무시했다. 이제 앱이 할 일을 손으로 한다.

```text
mysql> ROLLBACK;
Query OK, 0 rows affected (0.00 sec)

mysql> SELECT * FROM t_post;
Empty set (0.01 sec)

mysql> SELECT * FROM t_tag;
Empty set (0.01 sec)
```

글도, 먼저 들어간 `java` 태그도 없던 일이 되었다. 같은 일을 트랜잭션 **없이** 하면 이렇다.

```text
mysql> INSERT INTO t_post (title) VALUES ('자동 커밋');
Query OK, 1 row affected (0.00 sec)

mysql> INSERT INTO t_tag VALUES (LAST_INSERT_ID(), '엄청나게길어서칸을넘는태그');
ERROR 1406 (22001): Data too long for column 'name' at row 1
mysql> SELECT * FROM t_post;
+----+---------------+
| id | title         |
+----+---------------+
|  2 | 자동 커밋     |
+----+---------------+
1 row in set (0.00 sec)
```

- 태그 없는 글이 확정되어 남았다. 이제 `ROLLBACK`을 쳐도 소용없다. 문장마다 이미 커밋되었다.
- id가 `1`이 아니라 **`2`** 다. 롤백한 글이 `1`번을 한 번 썼기 때문이다. `AUTO_INCREMENT` 번호는 롤백해도 돌려받지 않는다. 그래서 id에 빈 번호가 생기는 것은 정상이다.

`exit`로 나오면 임시 테이블은 사라진다.

### Spring에서 — `@Transactional`이 있을 때와 없을 때

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(MySQL, 태그 이름 칸 10글자)으로 위와 같은 일을 해 봤다. 서비스 메서드 두 개는 `@Transactional`만 다르다.

```java
@Service
public class G3Service {   // 실험 앱의 클래스 이름 그대로
    private final PostRepository posts;
    private final PostTagRepository tags;
    G3Service(PostRepository posts, PostTagRepository tags) { this.posts = posts; this.tags = tags; }

    // 트랜잭션 없음
    public Long createWithoutTx(String title, List<String> tagNames) {
        Post post = posts.save(new Post(title, LocalDateTime.now()));
        for (String name : tagNames) tags.save(new PostTag(post.getId(), name));
        return post.getId();
    }

    // 메서드 전체가 한 트랜잭션
    @Transactional
    public Long createWithTx(String title, List<String> tagNames) {
        Post post = posts.save(new Post(title, LocalDateTime.now()));
        for (String name : tagNames) tags.save(new PostTag(post.getId(), name));
        return post.getId();
    }
}
```

두 메서드에 태그 `java`와 `엄청나게길어서칸을넘는태그`를 넘겼다. 둘 다 응답은 `500`이었다(지금은 이 예외를 `400`으로 바꾸는 처리가 없어서다). 트랜잭션 관리자의 로그(`org.springframework.orm.jpa.JpaTransactionManager`를 `DEBUG`로 켰다)에서 핵심 줄만 골랐다. 시각·스레드 이름은 떼고, 긴 패키지 이름과 줄 끝은 `...`로 줄였다.

```text
### createWithoutTx
Creating new transaction with name [...SimpleJpaRepository.save]
insert into lab_post (like_count,published_at,title) values (?,?,?)
Committing JPA transaction ...
Creating new transaction with name [...SimpleJpaRepository.save]
insert into lab_post_tag (name,post_id) values (?,?)
Committing JPA transaction ...
Creating new transaction with name [...SimpleJpaRepository.save]
insert into lab_post_tag (name,post_id) values (?,?)
Data truncation: Data too long for column 'name' at row 1
Rolling back JPA transaction ...

### createWithTx
Creating new transaction with name [lab.G3Service.createWithTx]
insert into lab_post (like_count,published_at,title) values (?,?,?)
Participating in existing transaction
insert into lab_post_tag (name,post_id) values (?,?)
Participating in existing transaction
insert into lab_post_tag (name,post_id) values (?,?)
Data truncation: Data too long for column 'name' at row 1
Participating transaction failed - marking existing transaction as rollback-only
Rolling back JPA transaction ...
```

- **없을 때**: 저장소의 `save()`는 하나하나가 **자기만의 작은 트랜잭션**이다. 그래서 `save`마다 `Committing`이 찍힌다. 세 번째만 롤백되고, 앞의 두 번은 이미 확정되었다.
- **있을 때**: 트랜잭션은 서비스 메서드에서 **한 번** 시작한다. 안쪽 `save()`들은 새로 시작하지 않고 그 트랜잭션에 **참여**한다(`Participating in existing transaction`). 실패하면 전체가 롤백된다.

(`lab.G3Service`·`lab_post`는 실험 앱의 패키지·테이블 이름이다.) DB에는 이렇게 남았다.

```text
+----+---------------------+
| id | title               |
+----+---------------------+
| 15 | 트랜잭션 없이       |
| 17 | 정상 글             |
+----+---------------------+
+----+---------+--------+
| id | post_id | name   |
+----+---------+--------+
|  1 |      15 | java   |
|  3 |      17 | java   |
|  4 |      17 | spring |
+----+---------+--------+
```

- 15번: 트랜잭션 없이 저장한 글. 태그가 `java` 하나뿐인 반쪽짜리가 남았다.
- 16번: 트랜잭션 안에서 저장하다 실패한 글. **없다.** 번호만 쓰고 롤백되었다.
- 17번: 그다음 트랜잭션 안에서 정상 태그(`java`, `spring`)로 저장한 글. 둘 다 있다.

1-3 채점의 R3 "글·태그 저장이 서비스 메서드 하나의 `@Transactional` 안에 있다"와 D3 "실패한 요청의 새 태그가 남지 않았다"가 이 차이다.

## 따라 해 보기

10분. 위 `mysql` 접속 명령으로 들어간다.

**1. SQL 예시를 그대로 친다.** 한 줄씩 치고, 실패한 `INSERT` 다음의 `SELECT`에서 글이 아직 보이는 것을 확인한 뒤 `ROLLBACK`한다.

**2. `COMMIT`으로 바꿔 본다.** 다시 `START TRANSACTION` → 글 `INSERT` → `java` 태그 `INSERT` → 긴 태그 `INSERT`(실패) → 이번에는 `COMMIT`. 그다음 `SELECT * FROM t_post; SELECT * FROM t_tag;`를 친다.

<details>
<summary>결과와 이유</summary>

글과 `java` 태그가 **둘 다 남는다.** MySQL은 실패한 문장만 버렸고, `COMMIT`은 "지금까지 성공한 것"을 확정한다. 트랜잭션이 있다고 저절로 안전해지는 게 아니라, **실패했을 때 누군가 `ROLLBACK`을 불러야** 한다. Spring에서는 예외가 메서드 밖으로 나갈 때 `@Transactional`이 그 일을 한다.
</details>

**3. 다른 접속에서 보이나.** 터미널을 하나 더 열고 같은 명령으로 접속한다. 단, 임시 테이블은 다른 접속에서 안 보이니 이 실험만은 진짜 테이블을 읽는다. 첫 터미널에서 `START TRANSACTION; UPDATE tag SET name = '바꿈' WHERE name = 'java';`까지만 치고, 둘째 터미널에서 `SELECT id, name FROM tag WHERE id = 1;`을 친다. 그다음 첫 터미널에서 **`ROLLBACK;`** 한다(시드 데이터를 바꾸지 않도록 꼭 롤백).

<details>
<summary>결과와 이유</summary>

첫 터미널에서 같은 `SELECT`를 치면 `바꿈`이 보이는데, 둘째 터미널에는 여전히 `java`가 보인다. 커밋하기 전의 변경은 **그 트랜잭션 안에서만** 보인다. 그래서 커밋 전에 실패해 롤백해도 다른 사용자는 반쯤 바뀐 상태를 보지 않는다. (이 "보이는 범위"가 H1 동시성에서 다시 나온다.)
</details>

## 일부러 틀려 보기

**1. 서비스의 `@Transactional`을 지운다.** 위 Spring 예시의 `createWithoutTx`가 그 결과다. 태그 하나짜리 반쪽 글(15번)이 남았다. 1-3의 "일부러 망가뜨리기 5번"에서 같은 일을 API로 확인한다(새 태그만 남는다). 작성자를 지연 로딩으로 붙이는 1-4에서는("일부러 망가뜨리기 6번") 다른 증상(지연 로딩 실패)도 난다. 트랜잭션은 "한 번에 커밋"과 "DB 연결을 메서드 끝까지 붙잡아 두기"를 같이 한다. → [에러 도감: 지연 로딩 — no session](../errors.md#지연-로딩--no-session)

**2. checked 예외를 던진다.** B7에서 본 checked 예외(`Exception`을 직접 상속한 것)는 `@Transactional`의 기본 롤백 대상이 **아니다.** 같은 앱에서 글을 저장한 뒤 `throw new Exception("외부 시스템 응답 없음")`을 던졌다.

```java
@Transactional
public Long createThenChecked(String title) throws Exception {
    posts.save(new Post(title, LocalDateTime.now()));
    throw new Exception("외부 시스템 응답 없음");
}
```

```text
insert into lab_post (like_count,published_at,title) values (?,?,?)
Initiating transaction commit
Committing JPA transaction ...
Request processing failed: java.lang.Exception: 외부 시스템 응답 없음
```

응답은 `500`인데 **글은 커밋되었다**(DB에 18번 `checked 예외 뒤`가 남았다). 기본 규칙은 "`RuntimeException`과 `Error`만 롤백"이다. 이 게시판에서 만드는 예외(`PostNotFoundException` 등)는 `RuntimeException`을 상속하니 걱정 없다. checked 예외로도 롤백하려면 `@Transactional(rollbackFor = Exception.class)`처럼 적는다.

## 확인 문제

**1.** 트랜잭션 없이 `INSERT post` → `INSERT post_tag`(성공) → `INSERT post_tag`(실패)를 했다. DB에 남는 것은?

<details>
<summary>정답</summary>

**글 한 줄과 태그 한 줄.** 자동 커밋이라 성공한 문장은 그때그때 확정된다. 실패한 세 번째만 없다. 반쪽짜리 글이다.
</details>

**2.** `START TRANSACTION` 안에서 세 번째 `INSERT`가 실패했다. 아무것도 안 하고 `SELECT`하면 글이 보이나?

<details>
<summary>정답</summary>

**보인다**(같은 접속에서). MySQL은 실패한 문장 하나만 무시하고 트랜잭션은 그대로 열어 둔다. `ROLLBACK`을 불러야 전부 사라지고, `COMMIT`을 부르면 성공한 것만 확정된다.
</details>

**3.** 글을 롤백했더니 다음 글의 id가 하나 건너뛰었다. 버그인가?

<details>
<summary>정답</summary>

**아니다.** `AUTO_INCREMENT` 번호는 롤백해도 돌려받지 않는다. 그래서 id는 "빈 번호 없이 이어지는 순번"이 아니다. id로 개수를 세거나 "다음 글 번호"를 미리 계산하면 안 된다.
</details>

**4.** `@Transactional`을 컨트롤러가 아니라 서비스 메서드에 거는 이유는?

<details>
<summary>정답</summary>

트랜잭션의 경계는 **업무 하나**다. "글 쓰기 = 글 + 태그 저장"을 아는 곳은 서비스다. 컨트롤러에 걸면 HTTP 처리(JSON 변환 등)까지 트랜잭션이 길어지고, 같은 업무를 다른 경로(관리자 기능, 배치)에서 부를 때 트랜잭션이 빠진다. 저장소의 `save()` 하나하나에만 맡기면 문제 1번처럼 따로따로 커밋된다.
</details>

**5.** 서비스 메서드에 `@Transactional`이 있다. 저장 중에 `throw new IOException("파일 저장 실패")`(checked 예외)가 났다. 앞에서 저장한 글은?

<details>
<summary>정답</summary>

**커밋된다.** 기본 롤백 대상은 `RuntimeException`과 `Error`뿐이다. checked 예외로도 롤백하려면 `rollbackFor`를 적거나, 그 예외를 `RuntimeException`으로 감싸 던진다.
</details>

## 더 깊이

- [W11 트랜잭션은 왜 서비스 계층에 거나](../docs/knowledge/W11-why-tx-in-service.md) — 경계, 자기 호출, 외부 API 호출
- [W11 — Repository만으로는 왜 부족한가](../docs/knowledge/W11-why-tx-in-service.md#repository만으로는-왜-부족한가)
- [S08 트랜잭션 관리](../docs/knowledge/S08-transactions.md) — 전파, 격리 수준, `readOnly`(2-1에서 씀)
- [S08 — 롤백 규칙 매칭](../docs/knowledge/S08-transactions.md#롤백-규칙-매칭) — checked 예외가 커밋되는 이유
- [S09 — 영속 상태 변경과 flush](../docs/knowledge/S09-jpa-hibernate.md#예제-2-영속-상태-변경과-flush) — 3-1에서 `save()` 없이 고친 값이 커밋 때 저장되는 이유

## 다음

- 실습: [2-1. 단건 조회와 404](../scenario/ch2-read-post/2-1-get-one.md) — 조회수 올리기(쓰기)와 DTO 변환을 트랜잭션 안에서 한다.
- 이어서 [2-2](../scenario/ch2-read-post/2-2-board-list.md)는 G1, [2-3](../scenario/ch2-read-post/2-3-visibility.md)은 G2를 쓴다.
