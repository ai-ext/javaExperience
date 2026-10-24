# J2. 마이그레이션은 왜 필요한가

> 개념 레슨 · 35분

## 이게 뭐냐

코드를 바꾸는 일은 쉽다. 새 코드를 빌드해 옛 jar를 **갈아 끼우면** 끝이다.

DB는 갈아 끼울 수 없다. 테이블 안에 **데이터**가 있기 때문이다. 글 145개가 든 `post` 테이블을 지우고 새로 만들 수는 없다. 그래서 DB 구조(스키마)는 "지금 상태에서 **이만큼 바꿔라**"라는 변경을 차례로 적용해서 바꾼다.

```sql
-- 변경 1: 메모 테이블을 만든다
CREATE TABLE memo (...);
-- 변경 2: 고정 여부 열을 더한다
ALTER TABLE memo ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
```

이 변경 하나하나를 **마이그레이션**이라고 한다.

### 손으로 하면 무엇이 문제인가

DB는 하나가 아니다. 내 노트북, 동료 노트북, 테스트용 DB(7장의 Testcontainers), 운영 DB… 변경 2를 CloudBeaver에서 손으로 실행한다고 해 보자.

- **빠뜨린다** — 내 DB에는 했는데 동료 DB에는 안 했다. 동료가 새 코드를 받으면 서버가 안 뜬다(아래 "일부러 틀려 보기" 3번).
- **두 번 한다** — 했는지 기억이 안 나서 또 실행하면 `Duplicate column name` 에러가 난다(따라 해 보기에서 직접 낸다).
- **순서가 꼬인다** — 변경 1 전에 변경 2를 하면 테이블이 없어서 실패한다.
- **기록이 없다** — 운영 DB가 지금 어느 상태인지 아무도 모른다.

### 해결: 변경을 파일로, 적용 기록을 DB 안에

**Flyway** 같은 마이그레이션 도구가 하는 일은 단순하다.

1. 변경을 **번호 붙은 SQL 파일**로 레포에 둔다. `src/main/resources/db/migration/V1__create_memo.sql`, `V2__add_memo_pinned.sql`… 파일 이름의 `V` 뒤 숫자가 순서다(밑줄 **두 개** 뒤는 설명).
2. 각 DB 안에 **기록 테이블**(`flyway_schema_history`)을 만들어 "이 DB에는 몇 번까지 적용했다"를 적는다.
3. 앱이 뜰 때마다 파일과 기록을 비교해서 **아직 안 한 번호만, 순서대로, 한 번씩** 실행한다.

코드와 스키마 변경이 같은 커밋에 들어가니, 코드를 받으면 그 코드가 기대하는 스키마로 가는 방법도 같이 받는다. git이 코드의 변경 이력을 들고 다니듯, 마이그레이션 파일이 스키마의 변경 이력을 들고 다닌다.

### 규칙 하나: 이미 적용한 파일은 고치지 않는다

Flyway는 파일마다 **체크섬**(내용으로 계산한 숫자)을 기록해 둔다. 이미 적용한 파일의 내용이 바뀌면 체크섬이 달라져 앱이 뜨지 않는다. 고치고 싶으면 새 번호의 파일을 **추가**한다. 운영 DB에서 이미 실행된 V1을 고쳐 봐야, 운영 DB는 고친 V1을 다시 실행하지 않기 때문이다. 다른 DB끼리 상태가 갈라지는 것을 막는 장치다.

## 예시

이 레슨을 쓰면서 빈 MySQL DB(`lesson_flyway`)에 작은 Spring Boot 4.1 앱을 붙여 Flyway 12.4로 실행한 결과다. 의존성은 9-1과 같다(`spring-boot-starter-flyway`, `flyway-mysql`). 앱이 뜰 때 Flyway가 먼저 돈다. 로그는 Flyway 줄만 골라 시각·프로세스 번호를 뗐다.

**V1만 있을 때 — 첫 실행**

```sql
-- src/main/resources/db/migration/V1__create_memo.sql
CREATE TABLE memo (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    content    VARCHAR(200) NOT NULL,
    created_at DATETIME     NOT NULL,
    PRIMARY KEY (id)
);
```

```text
o.f.c.i.s.JdbcTableSchemaHistory : Schema history table `lesson_flyway`.`flyway_schema_history` does not exist yet
o.f.core.internal.command.DbValidate : Successfully validated 1 migration (execution time 00:00.012s)
o.f.c.i.s.JdbcTableSchemaHistory : Creating Schema History table `lesson_flyway`.`flyway_schema_history` ...
o.f.core.internal.command.DbMigrate : Current version of schema `lesson_flyway`: << Empty Schema >>
o.f.core.internal.command.DbMigrate : Migrating schema `lesson_flyway` to version "1 - create memo"
o.f.core.internal.command.DbMigrate : Successfully applied 1 migration to schema `lesson_flyway`, now at version v1 (execution time 00:00.018s)
```

기록 테이블이 없으니 만들고, 빈 DB라 V1부터 실행했다.

**V2를 추가하고 다시 실행**

```sql
-- src/main/resources/db/migration/V2__add_memo_pinned.sql
ALTER TABLE memo ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
```

```text
o.f.core.internal.command.DbValidate : Successfully validated 2 migrations (execution time 00:00.024s)
o.f.core.internal.command.DbMigrate : Current version of schema `lesson_flyway`: 1
o.f.core.internal.command.DbMigrate : Migrating schema `lesson_flyway` to version "2 - add memo pinned"
o.f.core.internal.command.DbMigrate : Successfully applied 1 migration to schema `lesson_flyway`, now at version v2 (execution time 00:00.070s)
```

"지금 1번까지 됐다" → 2번만 실행했다. 기록 테이블은 이렇다.

```text
+----------------+---------+-----------------+-------------------------+-------------+---------+
| installed_rank | version | description     | script                  | checksum    | success |
+----------------+---------+-----------------+-------------------------+-------------+---------+
|              1 | 1       | create memo     | V1__create_memo.sql     | -1066018744 |       1 |
|              2 | 2       | add memo pinned | V2__add_memo_pinned.sql |  -242721122 |       1 |
+----------------+---------+-----------------+-------------------------+-------------+---------+
```

**파일을 안 바꾸고 또 실행**

```text
o.f.core.internal.command.DbMigrate : Current version of schema `lesson_flyway`: 2
o.f.core.internal.command.DbMigrate : Schema `lesson_flyway` is up to date. No migration necessary.
```

아무것도 안 한다. 서버를 몇 번 다시 켜도 `ALTER TABLE`이 두 번 실행되지 않는다. 동료가 이 코드를 받아 자기 DB(아직 0번)로 띄우면 V1·V2가 차례로 실행된다. 모든 DB가 같은 길을 따라 같은 상태에 도착한다.

## 따라 해 보기

15분. Flyway를 실제로 붙이는 것은 9-1에서 한다. 여기서는 Flyway가 하는 일을 **손으로 흉내 내서** 원리를 본다. 시드 데이터를 건드리지 않도록 G3처럼 임시 테이블만 쓴다(접속을 끊으면 사라진다).

```bash
docker compose exec -e LANG=C.UTF-8 mysql mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community
```

**1. 기록 테이블을 만들고, 지금 몇 번까지 됐는지 본다.**

```text
mysql> CREATE TEMPORARY TABLE my_history (version INT PRIMARY KEY, script VARCHAR(50), checksum BIGINT);
Query OK, 0 rows affected (0.01 sec)

mysql> SELECT version FROM my_history ORDER BY version DESC LIMIT 1;
Empty set (0.01 sec)
```

아무것도 없다(빈 DB). 그러니 V1부터.

**2. V1을 실행하고 기록한다.** `CRC32('…')`는 글자에서 숫자를 계산하는 함수다. 체크섬 흉내다(Flyway의 계산 방식과 똑같지는 않다).

```text
mysql> CREATE TEMPORARY TABLE memo (id BIGINT PRIMARY KEY, content VARCHAR(200) NOT NULL);
Query OK, 0 rows affected (0.00 sec)

mysql> INSERT INTO my_history VALUES (1, 'V1__create_memo.sql', CRC32('CREATE TEMPORARY TABLE memo (id BIGINT PRIMARY KEY, content VARCHAR(200) NOT NULL);'));
Query OK, 1 row affected (0.01 sec)
```

**3. 다시 "몇 번까지?"를 묻고, V2를 실행하고 기록한다.**

```text
mysql> SELECT version FROM my_history ORDER BY version DESC LIMIT 1;
+---------+
| version |
+---------+
|       1 |
+---------+
1 row in set (0.00 sec)

mysql> ALTER TABLE memo ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
Query OK, 0 rows affected (0.00 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql> INSERT INTO my_history VALUES (2, 'V2__add_memo_pinned.sql', CRC32('ALTER TABLE memo ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;'));
Query OK, 1 row affected (0.00 sec)

mysql> SELECT * FROM my_history;
+---------+-------------------------+------------+
| version | script                  | checksum   |
+---------+-------------------------+------------+
|       1 | V1__create_memo.sql     | 1994079397 |
|       2 | V2__add_memo_pinned.sql | 4052246174 |
+---------+-------------------------+------------+
2 rows in set (0.00 sec)
```

**4. 기록을 안 보고 V2를 한 번 더 실행한다.** "했었나?" 싶어서 또 친 상황이다.

```text
mysql> ALTER TABLE memo ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
ERROR 1060 (42S21): Duplicate column name 'pinned'
```

기록을 먼저 봤다면 "2번까지 됐다"를 알고 건너뛰었을 것이다. Flyway가 뜰 때마다 기록부터 읽는 이유다.

**5. 이미 적용한 V1을 고쳤다면.** `VARCHAR(200)`을 `VARCHAR(500)`으로 바꾼 글의 체크섬을 기록과 비교한다.

```text
mysql> SELECT checksum, CRC32('CREATE TEMPORARY TABLE memo (id BIGINT PRIMARY KEY, content VARCHAR(500) NOT NULL);') AS edited FROM my_history WHERE version = 1;
+------------+------------+
| checksum   | edited     |
+------------+------------+
| 1994079397 | 3990500287 |
+------------+------------+
1 row in set (0.01 sec)
```

숫자가 다르다. "적용했을 때의 V1"과 "지금 파일의 V1"이 다르다는 것을 글자를 하나하나 비교하지 않고도 안다. Flyway는 이 차이를 발견하면 앱을 멈춘다(아래 1번).

`exit`로 나오면 두 임시 테이블은 사라진다.

## 일부러 틀려 보기

예시의 Flyway 앱으로 실제로 낸 에러들이다.

**1. 적용한 V1을 고친다.** V2까지 적용된 DB에서 `V1__create_memo.sql`의 `VARCHAR(200)`을 `VARCHAR(500)`으로 고치고 앱을 띄웠다. 앱이 뜨지 않는다.

```text
Caused by: org.flywaydb.core.api.exception.FlywayValidateException: Validate failed: Migrations have failed validation
Migration checksum mismatch for migration version 1
-> Applied to database : -1066018744
-> Resolved locally    : 1786988193
Either revert the changes to the migration, or run repair to update the schema history.
```

`Applied to database`는 기록 테이블의 체크섬(위 표의 `-1066018744`), `Resolved locally`는 지금 파일의 체크섬이다. 고치는 법은 V1을 **원래대로 되돌리고**, 바꾸고 싶은 것은 `V3__…sql`로 새로 쓰는 것이다. 되돌리고 다시 띄우니 `Schema … is up to date`로 정상이었다.

**2. 이미 테이블이 있는 DB에 붙인다.** 기록 테이블만 지우고(테이블 `memo`는 남긴 채) 앱을 띄웠다. 지금까지 시나리오 DB가 바로 이 상태다. Docker가 처음 뜰 때 dump로 테이블을 만들었고, 기록 테이블은 없다.

```text
Caused by: org.flywaydb.core.api.FlywayException: Found non-empty schema(s) `lesson_flyway` but no schema history table. Use baseline() or set baselineOnMigrate to true to initialize the schema history table.
```

"테이블은 있는데 기록이 없으니, V1을 실행해도 되는지 모르겠다"는 말이다. 9-1에서 `baseline-on-migrate`로 "이 DB는 이미 V1까지 된 상태다"라고 기록만 남기고 시작한다.

**3. 코드만 바꾸고 마이그레이션을 빠뜨린다.** 다른 빈 DB에 V1만 둔 채, 엔티티에는 새 필드를 먼저 추가했다. JPA 설정은 실습 레포와 같은 `ddl-auto: validate`(엔티티와 테이블이 다르면 기동 실패)다.

```java
@Entity
public class Memo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private boolean pinned;   // 새로 추가한 필드 — 테이블에는 아직 없다
    protected Memo() {}
}
```

```text
o.f.core.internal.command.DbMigrate : Successfully applied 1 migration to schema `lesson_flyway2`, now at version v1 (execution time 00:00.024s)
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing column [pinned] in table [memo]
```

Flyway는 V1까지 잘 했지만, 엔티티가 기대하는 `pinned` 열이 없어서 서버가 뜨지 않는다. "손으로 하면 빠뜨린다"의 결과가 이것이다. `V2__add_memo_pinned.sql`을 **같은 커밋에** 넣고 다시 띄우니 `Migrating schema … to version "2 - add memo pinned"` 다음에 앱이 정상으로 떴다. 9-3에서 `excerpt` 열을 추가할 때 엔티티와 V3를 함께 바꾸는 이유다.

## 확인 문제

**1.** 코드는 파일을 갈아 끼워 배포하는데, DB 스키마는 왜 "변경"을 차례로 적용하나?

<details>
<summary>정답</summary>

DB에는 **데이터**가 들어 있어서 지우고 새로 만들 수 없다. 지금 상태에서 필요한 만큼만 바꾸는 변경(`CREATE`·`ALTER`…)을 순서대로 적용해야 데이터를 지킨 채 구조를 바꿀 수 있다.
</details>

**2.** Flyway는 V3를 이미 적용한 DB와 V1만 적용한 DB에서 각각 무엇을 실행하나? 어떻게 아나?

<details>
<summary>정답</summary>

V3까지 된 DB는 V4 이후(없으면 아무것도 안 함), V1만 된 DB는 V2·V3를 차례로 실행한다. 각 DB 안의 `flyway_schema_history`에 "몇 번까지 적용했나"가 적혀 있어서 안다.
</details>

**3.** V2에 오타가 있는 것을 발견했다. 운영 DB에는 V2가 이미 적용되었다. V2 파일을 고쳐도 되나?

<details>
<summary>정답</summary>

**안 된다.** 이미 적용된 파일을 고치면 체크섬이 달라져 앱이 뜨지 않는다(`Migration checksum mismatch`). 설령 우회해도 운영 DB는 고친 V2를 다시 실행하지 않으니, 새로 만드는 DB와 운영 DB의 상태가 갈라진다. 고치는 내용을 **V3로 새로 추가**한다.
</details>

**4.** 엔티티에 필드를 추가하고 커밋했는데, 동료의 서버가 `Schema validation: missing column`으로 뜨지 않는다. 무엇을 빠뜨렸나?

<details>
<summary>정답</summary>

그 열을 추가하는 **마이그레이션 파일**을 같은 커밋에 넣지 않았다. 내 DB에는 손으로(또는 다른 방법으로) 열을 만들어 두어서 몰랐던 것이다. 코드와 스키마 변경은 항상 함께 다닌다.
</details>

**5.** 이미 테이블과 데이터가 있는 시나리오 DB에 Flyway를 처음 붙이면 무슨 일이 생기나?

<details>
<summary>정답</summary>

기록 테이블이 없는데 테이블이 있으니 Flyway가 `Found non-empty schema(s) … but no schema history table`로 멈춘다. 그대로 V1(`CREATE TABLE`)을 실행하면 "이미 있는 테이블"이라 실패할 것이기 때문이다. 9-1에서 지금 스키마를 V1(기준선)으로 정하고, 이미 있는 DB에는 "V1까지 됐다"고만 기록하게 한다(`baseline-on-migrate`).
</details>

## 더 깊이

- [S11 — Flyway와 Liquibase](../docs/knowledge/S11-cache-redis-migration.md#flyway와-liquibase)
- [S11 — 무중단 스키마 변경 흐름](../docs/knowledge/S11-cache-redis-migration.md#무중단-스키마-변경-흐름) — 9-5의 expand·contract
- [P19 — `ddl-auto`는 환경별 정책이다](../docs/knowledge/P19-mysql-jpa-setup.md#24-ddl-auto는-환경별-정책이다) — 왜 `update`로 스키마를 바꾸지 않나
- [R07 백업과 복원](../docs/knowledge/R07-backup-restore.md) — 스키마를 바꾸기 전에

## 다음

- 실습: [8-1. 회원 활동 요약](../scenario/ch8-query-deep/8-1-activity-summary.md) — 8장은 쿼리, 9장이 스키마 변경이다.
- 9장 시작: [9-1. Flyway 도입 — 지금 스키마를 기준선으로](../scenario/ch9-schema-change/9-1-flyway.md) — 일부러 틀려 보기 2번의 에러를 기준선으로 푼다.
