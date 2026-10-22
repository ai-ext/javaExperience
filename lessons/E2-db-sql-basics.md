# E2. DB와 테이블·SQL 기초

> 개념 레슨 · 40분

## 이게 뭐냐

서버를 다시 켜면 메모리에 넣은 글은 사라진다. 그래서 오래 남길 데이터는 **DB 서버**(여기서는 MySQL)에 맡긴다. 앱 서버는 DB 서버에 접속해 "이거 넣어 줘", "이거 찾아 줘"라고 부탁한다. 그 부탁에 쓰는 말이 **SQL**이다.

### 테이블·행·열·키

DB는 데이터를 **표**로 보관한다. 글 안에 작성자 정보를 통째로 넣지 않고 작성자 번호만 적어 둔다. 닉네임이 바뀌어도 `member` 표 한 곳만 고치면 되기 때문이다. 예를 들어 `post`의 4번 행(제목 "주말 회고")은 `author_id`가 3이고, 닉네임은 `member`의 3번 행("이스프링")에 있다.

| 용어 | 뜻 | 실제 예(`community` DB) |
|---|---|---|
| **테이블**(table) | 열 이름과 타입이 정해진 표 | `post` |
| **행**(row) | 표의 한 줄 — 글 한 개 | `id`=4인 행 |
| **열**(column) | 모든 행이 같은 열을 가진다 | `title`, `view_count` |
| **기본키**(primary key, PK) | 행을 하나로 가리키는, 겹치지 않는 값 | `post.id` |
| **외래키**(foreign key, FK) | 다른 테이블의 PK를 가리키는 열 | `post.author_id` → `member.id` |

**외래키 제약**이 있으면 DB는 없는 회원 번호를 거절한다(아래 "일부러 틀려 보기"). 앱 코드가 실수해도 DB가 한 번 더 막는다.

### SQL — 원하는 결과를 글로 적는다

```sql
SELECT id, title, view_count
FROM post
WHERE board_id = 4
ORDER BY view_count DESC
LIMIT 3;
```

| SQL | 하는 일 |
|---|---|
| `FROM post` | 어느 표에서 |
| `WHERE …` | 어떤 행만 |
| `ORDER BY … DESC` | 어떤 순서로(`DESC` 큰 것부터, `ASC` 작은 것부터) |
| `LIMIT 3` | 몇 개만 |
| `SELECT id, title` | 어느 열만 |
| `JOIN member ON …` | 다른 표에서 짝을 찾아 옆에 붙이기 |
| `INSERT` · `UPDATE` · `DELETE` | 넣기 · 고치기 · 지우기 |

**어떻게 찾을지는 내가 정하지 않는다.** "이런 결과를 달라"고만 쓰면 DB가 방법을 고른다.

## 예시

### 어디서 실행하나 — 두 가지

**① CloudBeaver(웹 DB 도구)** — `http://localhost:8978`에 로그인한다. 왼쪽 목록에서 `community (시나리오)`를 누르고, 위쪽 막대의 **SQL** 버튼을 눌러 편집기를 연다. 쿼리를 쓰고 실행(`Ctrl+Enter`)하면 커서가 있는 문장 하나가 실행되고, 결과가 아래 표로 나온다. 바꾸는 문장(`INSERT`·`UPDATE`·`DELETE`)은 실행하는 순간 바로 확정된다(자동 커밋).

**② 터미널** — 이 저장소 compose의 MySQL 컨테이너(`mysql` 서비스) 안에 있는 `mysql` 클라이언트를 쓴다. 저장소 루트(`compose.yaml`이 있는 폴더)에서 실행한다. 매번 길게 치기 싫으니 함수로 만든다(zsh·bash 둘 다 된다).

```bash
sql() { docker compose exec -T mysql mysql --default-character-set=utf8mb4 -t -ucommunity -pcommunity community -e "$1"; }
```

| 부분 | 뜻 |
|---|---|
| `docker compose exec -T mysql` | compose의 `mysql` 서비스 컨테이너 안에서 명령을 돌린다. `-T`는 터미널 없이 결과만 받는다 |
| `--default-character-set=utf8mb4` | **꼭 붙인다.** 빼면 한글이 `???`로 나온다(아래 "일부러 틀려 보기") |
| `-t` | 결과를 표 모양으로. 빼면 탭으로 구분된 글자로 나온다 |
| `-ucommunity -pcommunity community` | 계정 `community`, 비밀번호 `community`, DB `community` |

실행할 때마다 `mysql: [Warning] Using a password on the command line interface can be insecure.`가 한 줄 나온다. 비밀번호를 명령에 적었다는 경고일 뿐이라 무시해도 된다.

아래 결과는 모두 **처음 상태(시드) 그대로인 DB**에서 실행한 것이다. 1-2 이후 단계를 하면서 글을 넣었다면 `dev`·`notice` 게시판 글과 `id`가 더 늘어 있을 수 있다. 처음 상태로 되돌리려면 이 저장소 루트에서 `docker compose down -v && docker compose up -d`(`community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`).

### 테이블 모양 보기

```text
$ sql "DESCRIBE board"
+------------+-------------+------+-----+---------+----------------+
| Field      | Type        | Null | Key | Default | Extra          |
+------------+-------------+------+-----+---------+----------------+
| id         | bigint      | NO   | PRI | NULL    | auto_increment |
| slug       | varchar(30) | NO   | UNI | NULL    |                |
| name       | varchar(50) | NO   |     | NULL    |                |
| write_role | varchar(20) | NO   |     | USER    |                |
| sort_order | int         | NO   |     | NULL    |                |
| created_at | datetime    | NO   |     | NULL    |                |
+------------+-------------+------+-----+---------+----------------+
```

| 열 | 읽는 법 |
|---|---|
| `Type` | `bigint` 큰 정수(Java `Long`), `varchar(30)` 30자까지 문자열, `datetime` 날짜+시각 |
| `Null` = `NO` | 비울 수 없다(`NOT NULL`). 넣을 때 값을 꼭 줘야 한다 |
| `Key` = `PRI` | 기본키. `UNI`는 겹치면 안 되는 값(`slug`가 `dev`인 게시판은 하나뿐) |
| `Default` | 값을 안 주면 들어가는 값 |
| `auto_increment` | 번호를 DB가 1씩 늘려 붙인다. `INSERT`할 때 `id`를 안 준다 |

### 외래키 눈으로 보기

```text
$ sql "SELECT id, board_id, author_id, title FROM post WHERE id <= 4"
+----+----------+-----------+-----------------------------------------+
| id | board_id | author_id | title                                   |
+----+----------+-----------+-----------------------------------------+
|  1 |        1 |         1 | [공지] 실습 게시판 이용 안내            |
|  2 |        2 |         3 | JPA 연관관계 매핑 정리                  |
|  3 |        3 |         4 | 인덱스는 언제 타나요?                   |
|  4 |        4 |         3 | 주말 회고                               |
+----+----------+-----------+-----------------------------------------+
```

`post` 테이블에는 게시판 이름도 작성자 닉네임도 없다. 번호(`board_id`, `author_id`)만 있다. 이름을 보려면 `board`·`member` 테이블과 **JOIN** 한다.

### SELECT · WHERE · ORDER BY · LIMIT

자유 게시판(`board_id` = 4)에서 조회수 많은 글 3개.

```text
$ sql "SELECT id, title, view_count FROM post WHERE board_id = 4 ORDER BY view_count DESC LIMIT 3"
+----+----------------------------------+------------+
| id | title                            | view_count |
+----+----------------------------------+------------+
| 10 | [숨김] 운영자가 숨긴 글          |         20 |
|  4 | 주말 회고                        |         15 |
| 21 | 자유글 10                        |         10 |
+----+----------------------------------+------------+
```

운영자가 숨긴 글(`status` = `HIDDEN`)이 1등으로 나왔다. 화면에 보여 줄 목록이라면 조건이 하나 더 필요하다. `AND`로 잇는다.

```text
$ sql "SELECT id, title, view_count FROM post WHERE board_id = 4 AND status = 'PUBLISHED' ORDER BY view_count DESC LIMIT 3"
+----+------------------------+------------+
| id | title                  | view_count |
+----+------------------------+------------+
|  4 | 주말 회고              |         15 |
| 21 | 자유글 10              |         10 |
|  5 | 스터디원 구해요        |          9 |
+----+------------------------+------------+
```

문자열 값은 작은따옴표(`'PUBLISHED'`)로 감싼다. 숫자는 그대로 쓴다.

### JOIN — 번호 대신 이름 붙이기

```text
$ sql "SELECT p.id, p.title, m.nickname, b.name FROM post p JOIN member m ON m.id = p.author_id JOIN board b ON b.id = p.board_id WHERE p.id <= 5 ORDER BY p.id"
+----+-----------------------------------------+--------------+--------------+
| id | title                                   | nickname     | name         |
+----+-----------------------------------------+--------------+--------------+
|  1 | [공지] 실습 게시판 이용 안내            | 운영자       | 공지사항     |
|  2 | JPA 연관관계 매핑 정리                  | 이스프링     | 개발         |
|  3 | 인덱스는 언제 타나요?                   | 박디비       | 질문         |
|  4 | 주말 회고                               | 이스프링     | 자유         |
|  5 | 스터디원 구해요                         | 박디비       | 자유         |
+----+-----------------------------------------+--------------+--------------+
```

| 부분 | 뜻 |
|---|---|
| `FROM post p` | `post`를 짧게 `p`라고 부른다(별칭) |
| `JOIN member m ON m.id = p.author_id` | 글마다 `member`에서 `id`가 글의 `author_id`와 같은 행을 찾아 옆에 붙인다 |
| `p.title`, `m.nickname` | 두 표에 같은 이름의 열(`id`, `created_at`)이 있으니 어느 표의 열인지 앞에 적는다 |

## 따라 해 보기

15분. 위 예시를 CloudBeaver나 터미널에서 직접 실행해 같은 결과가 나오는지 본 뒤, 넣기·고치기·지우기를 해 본다. **시드 데이터는 건드리지 않도록** 내가 넣은 태그 하나로만 연습한다. 아래 명령은 한 줄에 문장 여러 개를 `;`로 이어 놓았다. CloudBeaver에서는 문장을 **하나씩** 실행한다.

**1. INSERT — 태그 하나 넣기**

```text
$ sql "INSERT INTO tag (name, created_at) VALUES ('연습태그', NOW()); SELECT id, name FROM tag WHERE name = '연습태그'"
+----+--------------+
| id | name         |
+----+--------------+
|  9 | 연습태그     |
+----+--------------+
```

- 열 목록 `(name, created_at)`과 값 목록 `('연습태그', NOW())`가 순서대로 짝이 된다.
- `id`는 안 줬다. `auto_increment`라 DB가 붙였다. 1-3 이후라면 `채점태그`가 먼저 들어가 있어서 번호가 더 클 수 있다.
- `NOW()`는 DB 서버의 지금 시각이다.

**2. UPDATE — 고치기.** `WHERE`로 고칠 행을 꼭 좁힌다.

```text
$ sql "UPDATE tag SET name = '연습태그2' WHERE name = '연습태그'; SELECT ROW_COUNT()"
+-------------+
| ROW_COUNT() |
+-------------+
|           1 |
+-------------+
```

`ROW_COUNT()`는 바로 앞 문장이 바꾼 행 수다. `1`이 나와야 한다. CloudBeaver에서는 결과 칸에 바뀐 행 수가 바로 나온다.

**3. DELETE — 지우고 확인하기**

```text
$ sql "DELETE FROM tag WHERE name = '연습태그2'; SELECT COUNT(*) FROM tag WHERE name LIKE '연습%'"
+----------+
| COUNT(*) |
+----------+
|        0 |
+----------+
```

`LIKE '연습%'`는 "`연습`으로 시작하는"이다. `%`는 아무 글자나 몇 글자든.

이제 같은 태그를 다시 넣어 보면 번호가 `9`로 돌아가지 않고 더 커진다(시드에서 1~3번만 했다면 `10`). 한 번 쓴 `auto_increment` 번호는 지워도 다시 쓰지 않는다. 그러니 "가장 최근 글 번호 = 글 개수"라고 가정하면 안 된다. 다시 넣었다면 3번으로 지운다.

**4. 트랜잭션으로 안전하게 — `WHERE` 없는 UPDATE 맛보기 (터미널에서만)**

`WHERE`를 빼면 **모든 행**이 바뀐다. 진짜로 해 보면 시드가 망가지니, 트랜잭션 안에서 하고 `ROLLBACK`으로 되돌린다. **이 실습은 터미널의 `sql` 함수로만 한다.** CloudBeaver에서 `UPDATE` 한 문장만 실행하면 자동 커밋으로 그 자리에서 21개 제목이 전부 바뀐다.

```text
$ sql "START TRANSACTION; UPDATE post SET title = '앗'; SELECT ROW_COUNT() AS 바뀐_행; SELECT id, title FROM post WHERE id <= 3; ROLLBACK; SELECT id, title FROM post WHERE id <= 3"
+------------+
| 바뀐_행    |
+------------+
|         21 |
+------------+
+----+-------+
| id | title |
+----+-------+
|  1 | 앗    |
|  2 | 앗    |
|  3 | 앗    |
+----+-------+
+----+-----------------------------------------+
| id | title                                   |
+----+-----------------------------------------+
|  1 | [공지] 실습 게시판 이용 안내            |
|  2 | JPA 연관관계 매핑 정리                  |
|  3 | 인덱스는 언제 타나요?                   |
+----+-----------------------------------------+
```

- `START TRANSACTION` ~ `ROLLBACK` 사이의 변경은 **없던 일**이 된다. `ROLLBACK` 대신 `COMMIT`이면 확정된다.
- 반드시 **한 번의 `sql "…"` 안에** 다 넣는다. 명령이 끝나면 접속이 끊기고, 끊긴 트랜잭션은 자동으로 되돌려지지만, 따로 나눠 치면 `UPDATE`가 트랜잭션 밖에서 바로 확정될 수 있다.
- 시드에 글이 21개라 `21`이 나왔다. 1-2 이후라면 더 크다.
- 서비스 메서드에 붙이는 `@Transactional`이 이 `START TRANSACTION`~`COMMIT`/`ROLLBACK`을 대신 해 준다(G3에서 자세히).

## 일부러 틀려 보기

메시지는 MySQL 클라이언트가 보여 준 원문이다(`at line 1`은 터미널에서만 붙는다).

**1. 댓글이 달린 글을 지운다** — 외래키가 막는다.

```text
$ sql "DELETE FROM post WHERE id = 11"
ERROR 1451 (23000) at line 1: Cannot delete or update a parent row: a foreign key constraint fails (`community`.`comment`, CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`))
```

`comment` 테이블의 행이 `post_id = 11`로 이 글을 가리키고 있다. 글만 지우면 주인 없는 댓글이 생기니 DB가 거절한다. 이 앱이 글을 지울 때 행을 지우지 않고 `deleted_at`에 시각만 찍는 이유 중 하나다.

**2. 없는 회원을 작성자로 넣는다**

```text
$ sql "INSERT INTO post (board_id, author_id, title, content, created_at, updated_at) VALUES (4, 999, '없는 회원', '본문', NOW(), NOW())"
ERROR 1452 (23000) at line 1: Cannot add or update a child row: a foreign key constraint fails (`community`.`post`, CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `member` (`id`))
```

**3. 비울 수 없는 열을 뺀다**

```text
$ sql "INSERT INTO post (board_id, author_id, title, content) VALUES (4, 2, '시각 빠짐', '본문')"
ERROR 1364 (HY000) at line 1: Field 'created_at' doesn't have a default value
```

`created_at`은 `NOT NULL`인데 기본값도 없다. JPA로 저장할 때는 엔티티가 이 값을 채워 준다(E3).

**4. 이미 있는 이름으로 태그를 넣는다**

```text
$ sql "INSERT INTO tag (name, created_at) VALUES ('java', NOW())"
ERROR 1062 (23000) at line 1: Duplicate entry 'java' for key 'tag.uk_tag_name'
```

`tag.name`이 `UNIQUE`다. → [에러 도감: 중복 키](../errors.md#중복-키)

**5. 문자열에 따옴표를 빼먹는다**

```text
$ sql "SELECT * FROM post WHERE title = 주말 회고"
ERROR 1064 (42000) at line 1: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '회고' at line 1
```

`near '회고'` — 이 근처에서 문법이 깨졌다는 뜻이다. `'주말 회고'`로 고친다.

**6. `--default-character-set=utf8mb4`를 뺀다**

```text
$ docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "SELECT id, nickname FROM member WHERE id <= 3"
id	nickname
1	???
2	???
3	????
```

DB에는 한글이 멀쩡히 있다. 컨테이너 안 클라이언트의 기본 문자셋(`latin1`)이 한글을 못 보여 줄 뿐이다. 더 위험한 건 이 상태로 한글을 `INSERT`하면 정말로 깨져서 저장된다는 점이다. → [에러 도감: 한글이 깨져 보임](../errors.md#한글이-깨져-보임)

## 확인 문제

직접 SQL을 써서 답을 구한다. 정답은 시드 기준이다.

**1.** 자유 게시판(`slug`가 `free`)에 있는 글은 모두 몇 개인가? 게시판 번호를 외우지 말고 `slug`로 찾는다.

<details>
<summary>정답</summary>

**17개.**

```sql
SELECT COUNT(*) FROM post p JOIN board b ON b.id = p.board_id WHERE b.slug = 'free';
```

`COUNT(*)`는 행 수다. `board_id = 4`로 써도 17이지만, 번호는 환경마다 다를 수 있어서 의미 있는 값(`slug`)으로 JOIN 하는 편이 안전하다. 숨김·임시저장·삭제된 글도 행으로는 남아 있어서 함께 세어진다.
</details>

**2.** 닉네임 `이스프링`이 쓴 글 중 조회수가 가장 높은 글의 `id`·제목·조회수는?

<details>
<summary>정답</summary>

**11 · `트랜잭션은 어디에 거나요?` · 33**

```sql
SELECT p.id, p.title, p.view_count
FROM post p JOIN member m ON m.id = p.author_id
WHERE m.nickname = '이스프링'
ORDER BY p.view_count DESC
LIMIT 1;
```

`WHERE`가 JOIN 한 뒤의 열(`m.nickname`)로 거를 수 있다는 점이 요점이다.
</details>

**3.** 태그 `mysql`이 붙은 글의 `id`를 작은 순으로 모두 적어라.

<details>
<summary>정답</summary>

**3, 13, 15, 17, 19, 21** (6개)

```sql
SELECT p.id, p.title
FROM post p
JOIN post_tag pt ON pt.post_id = p.id
JOIN tag t ON t.id = pt.tag_id
WHERE t.name = 'mysql'
ORDER BY p.id;
```

글과 태그는 서로 여러 개씩 이어진다(다대다). 그래서 둘 사이에 `post_tag`라는 **연결 테이블**이 있고, JOIN을 두 번 한다. `post_tag`의 기본키는 `(post_id, tag_id)` 두 열을 묶은 것이다.
</details>

**4.** 글 11의 댓글 중 지워지지 않은 것(`deleted_at`이 비어 있는 것)은 몇 개인가? 아래 두 쿼리의 결과가 왜 다른지도 설명하라.

```sql
SELECT COUNT(*) FROM comment WHERE post_id = 11 AND deleted_at = NULL;
SELECT COUNT(*) FROM comment WHERE post_id = 11 AND deleted_at IS NULL;
```

<details>
<summary>정답</summary>

**4개.** 첫 쿼리는 `0`, 둘째 쿼리는 `4`가 나온다.

SQL에서 `NULL`은 "값을 모름"이다. `deleted_at = NULL`은 참도 거짓도 아닌 "모름"이 되어 어떤 행도 통과하지 못한다. 비어 있는지는 반드시 `IS NULL`(반대는 `IS NOT NULL`)로 묻는다. JavaScript의 `=== null`과 다른 점이라 자주 틀린다.
</details>

**5.** 따라 해 보기 4번에서 `ROLLBACK` 대신 `COMMIT`을 썼다면 어떻게 되나? 되돌리려면?

<details>
<summary>정답</summary>

모든 글의 제목이 `앗`으로 **확정**된다. SQL로는 원래 제목을 알 수 없으니 되돌릴 방법이 없다. 이 실습 DB라면 이 저장소 루트에서 `docker compose down -v && docker compose up -d`로 처음 상태로 돌린다(세 DB가 모두 처음 덤프로 돌아간다). 운영 DB라면 백업에서 복구해야 하는 사고다. 그래서 `UPDATE`·`DELETE`는 같은 `WHERE`로 `SELECT`를 먼저 해서 몇 행이 걸리는지 확인하는 습관을 들인다.
</details>

## 더 깊이

- [R01 DB 서버는 무엇인가](../docs/knowledge/R01-what-is-db-server.md) — DB 서버·database·스키마
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — `NOT NULL`·`UNIQUE`·FK가 막아 주는 것
- [R04 SQL CRUD와 JOIN](../docs/knowledge/R04-sql-crud-join.md) — `LEFT JOIN`, 1:N 합계 함정
- [D10 데이터베이스 기초](../docs/knowledge/D10-database-basics.md) — 모델링부터 트랜잭션까지 큰 그림
- [R05 인덱스와 B-Tree](../docs/knowledge/R05-index-btree.md) — 글이 많아지면 `WHERE`가 왜 느려지나(J1에서 다시)
- [R02 RDB와 NoSQL](../docs/knowledge/R02-rdb-vs-nosql.md) — 왜 관계형 DB부터 배우나

## 다음

- 레슨: [E3. JPA는 무엇인가](E3-what-is-jpa.md) — 오늘 손으로 쓴 `INSERT`를 Java 객체 저장으로 바꿔 주는 도구.
- 실습: [1-2. DB에 저장하고 201로 응답](../scenario/ch1-create-post/1-2-dto-response.md) — API로 넣은 글을 `SELECT`로 확인한다. `post` 한 행을 SQL로 직접 넣어 보는 것은 [1-4의 "데이터 넣는 두 가지"](../scenario/ch1-create-post/1-4-save-to-db.md#데이터-넣는-두-가지).
