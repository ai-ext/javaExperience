# R04. SQL로 데이터 다루기 — INSERT·SELECT·UPDATE·DELETE, JOIN, 트랜잭션

> 조회 전에 필요한 행과 열을 정하고, 변경 전에는 대상 행을 같은 조건으로 확인한다.
> JOIN은 연결된 행 수만큼 결과를 만든다. 1:N 관계에서 부모 열을 집계하면 합계가 부풀 수 있다.
> 관련 변경을 한 작업으로 묶을 때는 트랜잭션을 열고 확인한 뒤 COMMIT한다.

## 1. 한 줄로 말하면

SQL은 관계형 데이터베이스에서 행을 추가(`INSERT`), 조회(`SELECT`), 수정(`UPDATE`), 삭제(`DELETE`)하는 선언형 언어다. `JOIN`은 조건에 맞는 테이블 행을 결합하고, 트랜잭션은 여러 변경을 한 단위로 확정하거나 취소한다. 조건 누락, JOIN 중복, NULL, 바인딩을 놓치면 운영 데이터 손상과 잘못된 응답으로 이어진다.

## 2. 당장 알아야 할 것

> **이 저장소에 없는 실습 환경** — 이 문서의 예제는 원래 공부자료가 전제한 쇼핑몰 연습 DB `ds_practice`(`practice/schema/schema.sql`·`seed.sql`로 만드는 `member`·`product`·`orders` 등)를 쓴다. 그 파일과 DB는 이 저장소에 없다. 그대로 따라 하려면 그런 MySQL을 직접 준비해야 하고, 명령에 적힌 포트(`3306` 등)·계정도 그때 정한 값으로 바꾼다. 이 저장소에서 바로 쓸 수 있는 DB는 루트 `compose.yaml`의 MySQL(`docker compose up -d` — 호스트 `localhost:13308`, 계정 `community`/`community`, DB `community`·`practice`·`project`)이고, 테이블은 게시판용(`member`·`post`·`comment`·`tag` 등)이라 이름과 열이 다르다.

1. **SELECT 열·조건·정렬·건수를 명시한다.** `SELECT *`는 피하고 필요한 열을 쓴다. `ORDER BY` 없이는 순서가 보장되지 않는다.

   ```sql
   SELECT id, order_no, total_amount
   FROM orders
   WHERE member_id = 1 AND order_status = 'PAID'
   ORDER BY ordered_at DESC, id DESC
   LIMIT 20 OFFSET 0;
   ```

2. **논리 처리 순서를 기억한다.** 개념 순서라 물리 실행 순서와 다를 수 있다. 

   ```mermaid
   flowchart TD
     F["FROM"] --> J["JOIN · ON"]
     J --> W["WHERE"]
     W --> G["GROUP BY"]
     G --> H["HAVING"]
     H --> S["SELECT"]
     S --> O["ORDER BY"]
     O --> L["LIMIT"]
   ```

   `WHERE`는 집계 전 행, `HAVING`은 그룹을 거른다. 집계 조건은 `HAVING`에 쓴다. MySQL에서 `SELECT` 별칭은 `WHERE`에서 사용할 수 없다.

3. **JOIN은 어느 쪽 행을 보존하는지로 고른다.** `INNER`는 일치 쌍만, `LEFT`는 왼쪽 모두(오른쪽 미매칭은 NULL), `RIGHT`는 오른쪽 모두, `CROSS`는 모든 조합이다. SELF JOIN은 같은 테이블을 두 별칭으로 결합한다. MySQL 문서는 이식성을 위해 LEFT 사용을 권한다.

   | 종류 | `ds_practice`에서 확인할 행 수 |
   |---|---|
   | INNER | 회원 1번의 주문 6행 |
   | LEFT | 주문 없는 회원 181번도 NULL 주문으로 남음 |
   | RIGHT | `orders RIGHT JOIN member`에서 회원 181번 1행 |
   | CROSS | 카테고리 2개 × 회원 2명 = 4행 |
   | SELF | 카테고리 3의 부모 카테고리 1 |

   LEFT JOIN의 오른쪽 조건을 `WHERE`에 두면 NULL 행이 탈락해 INNER처럼 될 수 있다. `FULL OUTER JOIN`은 MySQL JOIN 문법에 없다.

4. **집계는 행의 단위를 확인한다.** outer join 결과에서 `COUNT(*)`는 짝이 없는 왼쪽 행도 세지만 `COUNT(o.id)`는 실제 주문만 센다. `COUNT(column)`은 NULL을 세지 않는다. 그룹화되지 않은 열을 집계 열과 함께 임의로 선택하지 않는다.

5. **1:N JOIN 뒤 부모 값을 더하지 않는다.** 주문 한 건이 항목 세 개와 JOIN되면 주문 합계가 세 행에 반복된다. `SUM(DISTINCT total_amount)`도 금액이 같은 다른 주문을 합쳐버리므로 해법이 아니다. 주문 헤더 합계는 헤더에서 계산하거나 주문별 항목 집계를 먼저 만든다.

6. **JOIN·서브쿼리·EXISTS를 목적에 맞게 쓴다.** 상세 열이 필요하면 JOIN, 회원별 집계 하나면 그룹화나 상관 서브쿼리, 연관 행 존재 여부만 필요하면 `EXISTS`를 쓴다. EXISTS는 자식 행 수만큼 회원이 중복되지 않는다. NULL 가능성이 있는 목록에 `NOT IN`을 쓰면 UNKNOWN이 될 수 있어 `NOT EXISTS`가 안전한 선택이다.

7. **INSERT에는 열 목록을 쓴다.** 여러 행은 `VALUES (...), (...)`, 다른 조회 결과는 `INSERT ... SELECT`로 추가한다. MySQL UPSERT는 `ON DUPLICATE KEY UPDATE`이며, 대상의 어떤 PK/UNIQUE 충돌에도 실행될 수 있다.

8. **UPDATE·DELETE는 SELECT로 대상을 미리 확인한다.** MySQL에서 WHERE 없는 UPDATE는 전체 행을 수정하고 DELETE는 전체 행을 지운다. 같은 WHERE의 SELECT·변경문을 트랜잭션에서 실행하고 영향 행 수를 확인한다. `--safe-updates`는 키 기반 조건을 요구하는 보조 보호다.

9. **autocommit과 바인딩을 안다.** MySQL 기본 autocommit은 문장마다 성공 즉시 확정한다. `START TRANSACTION` 뒤 `COMMIT`은 확정, `ROLLBACK`은 미확정 변경 취소다. 앱에서는 문자열 덧붙임 대신 `?`에 값을 바인딩한다. 값이 아닌 테이블명·정렬 키워드는 바인딩되지 않으므로 허용 목록에서 고른다.

## 3. 따라 하기

실습 DB는 `practice/schema/schema.sql`로 만든 MySQL 8.4 `ds_practice`다. 아래 결과는 **(예상)**이며 Docker와 MySQL을 여기서 실행하지 않았다. 모든 변경 예제는 끝에서 `ROLLBACK`한다.

### 1단계: 접속하고 스키마 확인

```bash
# 직접 준비한 MySQL의 예시 값(포트 3306·계정 devuser·DB ds_practice) — 이 저장소 compose는 13308·community·practice
mysql --host=127.0.0.1 --port=3306 --user=devuser --password \
  --default-character-set=utf8mb4 ds_practice
```

```sql
SHOW TABLES;
DESCRIBE orders;
DESCRIBE order_item;
```

**확인 방법 (예상)**: 테이블 16개와 `orders.id`, `order_no`, `member_id`, `order_status`, `total_amount`, `ordered_at` 등이 보인다. 스키마의 타입·FK는 → R03 참조.

### 2단계: Spring JDBC에서 값을 바인딩

Boot 4.1.1 / Java 25 / Gradle Kotlin DSL 기준이다. Maven 대응 의존성은 `org.springframework.boot:spring-boot-starter-jdbc`, `com.mysql:mysql-connector-j`(runtime)이다.

`build.gradle.kts`:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}
repositories { mavenCentral() }
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("com.mysql:mysql-connector-j")
}
```

`src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    # 직접 준비한 MySQL 예시(3306·ds_practice). 이 저장소 compose라면 localhost:13308/practice
    url: jdbc:mysql://localhost:3306/ds_practice?characterEncoding=UTF-8
    username: ${DB_USER}
    password: ${DB_PASSWORD}
```

`src/main/java/example/OrderReadRepository.java` (미실행 — DB 연결 필요):

```java
package example;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class OrderReadRepository {
    private static final String SQL = """
            SELECT o.id AS order_id, o.order_no, o.total_amount
            FROM member m JOIN orders o ON o.member_id = m.id
            WHERE m.id = ?
            ORDER BY o.ordered_at DESC, o.id DESC
            """;
    private static final RowMapper<OrderSummary> MAPPER = (rs, n) ->
            new OrderSummary(rs.getLong("order_id"), rs.getString("order_no"),
                    rs.getBigDecimal("total_amount"));
    private final JdbcTemplate jdbc;

    public OrderReadRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<OrderSummary> findByMemberId(long memberId) {
        return jdbc.query(connection -> {
            PreparedStatement ps = connection.prepareStatement(SQL);
            ps.setLong(1, memberId);
            return ps;
        }, MAPPER);
    }

    public record OrderSummary(long id, String orderNo, BigDecimal totalAmount) {}
}
```

`?`는 SQL에 값으로 붙고 `setLong(1, ...)`의 번호는 1부터 시작한다. `JdbcTemplate`은 PreparedStatement·연결 자원을 관리한다. **확인 방법 (예상)**: 회원 181 조회는 빈 목록, 회원 1은 6건이다.

### 3단계: JOIN 결과 확인

```sql
-- INNER: 회원 1의 주문 6건
SELECT m.id member_id, o.id order_id, o.order_status
FROM member m JOIN orders o ON o.member_id = m.id
WHERE m.id = 1 ORDER BY o.id;

-- LEFT: 주문 없는 회원 181, 182 보존
SELECT m.id, m.name, o.id order_id, o.order_status
FROM member m LEFT JOIN orders o ON o.member_id = m.id
WHERE m.id IN (181, 182) ORDER BY m.id;

-- RIGHT: 오른쪽 member의 181번을 보존
SELECT m.id member_id, o.id order_id
FROM orders o RIGHT JOIN member m ON m.id = o.member_id
WHERE m.id = 181;

-- CROSS 2 × 2 = 4행
SELECT c.id category_id, m.id member_id
FROM category c CROSS JOIN member m
WHERE c.id IN (1, 2) AND m.id IN (181, 182);

-- SELF: category 3의 parent는 category 1
SELECT c.id, c.name, p.id parent_id, p.name parent_name
FROM category c LEFT JOIN category p ON p.id = c.parent_id
WHERE c.id IN (1, 3) ORDER BY c.id;
```

**확인 방법 (예상)**: INNER 6행, LEFT 2행(181·182의 주문 열 NULL), RIGHT 1행(NULL 주문), CROSS 4행, SELF 2행(카테고리 3의 부모는 `상품`). 오른쪽 조건을 유지하며 미매칭 회원도 남길 땐 조건을 ON에 둔다.

```sql
SELECT m.id, o.id paid_order_id
FROM member m LEFT JOIN orders o
  ON o.member_id = m.id AND o.order_status = 'PAID'
WHERE m.id BETWEEN 181 AND 182;

-- 주문이 있는 회원만 중복 없이 조회
SELECT m.id, m.name
FROM member m
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.member_id = m.id AND o.order_status = 'PAID');
```

### 4단계: 1:N 합계 함정 확인

```sql
SELECT o.id, o.total_amount, COUNT(oi.id) item_rows,
       SUM(o.total_amount) wrong_total
FROM orders o JOIN order_item oi ON oi.order_id = o.id
WHERE o.id = 1
GROUP BY o.id, o.total_amount;
```

**확인 방법 (예상)**: 주문 1의 금액 17,919, 항목 3행, 잘못된 합계 53,757이다. 헤더 금액은 주문 테이블만 집계한다. `HAVING`은 그룹 결과 필터다.

```sql
SELECT member_id, COUNT(*) order_count, SUM(total_amount) order_total
FROM orders
WHERE order_status IN ('PAID', 'SHIPPED', 'DELIVERED')
GROUP BY member_id
HAVING SUM(total_amount) >= 100000
ORDER BY order_total DESC, member_id
LIMIT 20;
```

### 5단계: INSERT·UPDATE·DELETE를 안전하게 실습

다음 SQL 전체를 `practice/sql/R04-demo.sql`에 저장한다. INSERT 다중 행·UPSERT·INSERT SELECT, 대상 사전 확인, 변경, 롤백까지 포함한다.

```bash
# 직접 준비한 MySQL의 예시 값(포트 3306·계정 devuser·DB ds_practice) — 이 저장소 compose는 13308·community·practice
mysql --host=127.0.0.1 --port=3306 --user=devuser --password \
  --default-character-set=utf8mb4 ds_practice < practice/sql/R04-demo.sql
```

```sql
START TRANSACTION;

INSERT INTO product (category_id, name, product_type, price, stock, sale_status, created_at, updated_at)
VALUES
 (3, 'R04 상품 A', 'GOODS', 1000, 3, 'ON_SALE', '2026-09-28', '2026-09-28'),
 (3, 'R04 상품 B', 'EBOOK', 2000, 5, 'ON_SALE', '2026-09-28', '2026-09-28');

INSERT INTO coupon (code, name, discount_amount, min_order_amount, valid_from, valid_to, created_at, updated_at)
VALUES ('R04-DEMO', 'R04 쿠폰', 1000, 0, '2026-01-01', '2027-01-01', '2026-09-28', '2026-09-28') AS incoming
ON DUPLICATE KEY UPDATE discount_amount = incoming.discount_amount,
                        updated_at = incoming.updated_at;

INSERT INTO point_history (member_id, order_id, point_type, amount, balance_after, memo, created_at, updated_at)
SELECT o.member_id, o.id, 'EARN', 100, 100, 'R04 실습', '2026-09-28', '2026-09-28'
FROM orders o WHERE o.id = 1;

-- product 1의 초기 재고 33 확인 후 차감
SELECT id, name, stock FROM product WHERE id = 1;
UPDATE product SET stock = stock - 1, updated_at = '2026-09-28'
WHERE id = 1 AND stock > 0;
SELECT ROW_COUNT() changed_rows;

-- 삭제 대상 미리 확인 후 같은 PK로 삭제
SELECT id, member_id, member_coupon_status FROM member_coupon WHERE id = 300;
DELETE FROM member_coupon WHERE id = 300;
SELECT ROW_COUNT() deleted_rows;

ROLLBACK;

SELECT id, stock FROM product WHERE id = 1;
SELECT COUNT(*) coupon_rows FROM coupon WHERE code = 'R04-DEMO';
SELECT COUNT(*) point_rows FROM point_history WHERE memo = 'R04 실습';
SELECT COUNT(*) member_coupon_rows FROM member_coupon WHERE id = 300;
```

**확인 방법 (예상)**: UPDATE·DELETE는 각각 1행 영향. ROLLBACK 뒤 재고는 33, 쿠폰·포인트 이력은 0건, 회원 쿠폰 300번은 1건이다. `COMMIT`은 영구 반영이므로 이 예제 끝에 쓰지 않는다. 실제 사용자 입력을 받을 때는 INSERT·UPDATE에도 PreparedStatement 바인딩을 쓴다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| INSERT | 행 추가 | `INSERT INTO t (a,b) VALUES (?,?)` | 열 목록·값 개수 일치; 여러 행·SELECT 입력도 가능 |
| UPSERT | 고유 키 충돌 갱신 | `ON DUPLICATE KEY UPDATE ...` | 다른 UNIQUE 충돌에도 동작 가능 |
| SELECT·WHERE | 조회·필터 | `WHERE id = ?` | NULL은 `IS NULL` |
| JOIN | 관련 행 결합 | `LEFT JOIN orders o ON ...` | 1:N 결과 중복, outer 조건 위치 |
| GROUP BY | 그룹 집계 | `COUNT(o.id), SUM(amount)` | 미그룹 일반 열 혼용 금지 |
| UPDATE·DELETE | 행 수정·삭제 | `... WHERE id = ?` | 사전 SELECT, 키 조건, 트랜잭션 |
| 트랜잭션 | 변경 확정·취소 | `START TRANSACTION; ... ROLLBACK;` | COMMIT 뒤 취소 불가 |
| 바인딩 | SQL 값 전달 | `ps.setLong(1, id)` | 테이블명·정렬 구문은 바인딩 불가 |

## 5. 자주 나는 에러와 해결

| 메시지·증상 | 원인 → 해결 |
|---|---|
| `ERROR 1054 (42S22): Unknown column ...` | 열 이름 오타 또는 별칭 오류 → `DESCRIBE` 후 `m.id`처럼 한정한다. |
| `ERROR 1052 (23000): Column 'id' ... is ambiguous` | 여러 테이블에 같은 이름 → `m.id`, `o.id`로 명시한다. |
| `ERROR 1062 (23000): Duplicate entry ... for key ...` | PK·UNIQUE 충돌 → 중복 요청인지 확인하고 의도한 UPSERT인지 판단한다. |
| `ERROR 1452 (23000): Cannot add or update a child row...` | FK 부모가 없음 → 부모 ID를 조회해 확인한다. |
| `ERROR 1175 ... safe update mode ...` | 키 조건 없는 변경을 클라이언트가 차단 → 키 열을 이용해 SELECT하고 같은 조건으로 변경한다. |
| 변경 행이 예상보다 많음 | WHERE 누락·범위 과다 → SELECT와 COUNT로 대상 확인 후 트랜잭션에서 실행한다. |
| `column = NULL` 결과가 없음 | NULL 비교는 UNKNOWN → `IS NULL`·`IS NOT NULL` 사용. |
| `Column count doesn't match value count` | INSERT 열과 값 개수 불일치 → 각 VALUES 행 또는 SELECT 열 수를 맞춘다. |

## 6. 한 단계 더

JOIN은 논리적 결합이고 실제 접근 경로는 인덱스·통계·실행계획에 따라 달라진다. outer join이 만든 NULL 행까지 고려해 결과 행 수와 집계 단위를 검산한다. 인덱스·실행계획은 → R05, 격리수준과 Spring 트랜잭션 경계는 → S08, 타입·제약조건은 → R03, 연습 문제는 → practice/sql(Q01~) 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. LEFT JOIN에서 주문 없는 회원까지 세려면?**

- A: 회원을 왼쪽에 두고 `LEFT JOIN orders`한다. 미매칭 주문 열은 NULL이다. `COUNT(*)` 대신 `COUNT(o.id)`로 실제 주문만 센다.
- 꼬리: 주문 상태 조건을 WHERE에 두면?
  - 답: NULL 행이 탈락한다. 회원을 보존하려면 오른쪽 조건을 ON에 둔다.

**Q2. WHERE와 HAVING의 차이는?**

- A: WHERE는 그룹화 전 행을 필터링하고 HAVING은 집계한 그룹을 필터링한다. 따라서 `COUNT`, `SUM` 조건은 HAVING에 둔다. SELECT 별칭은 WHERE에서 사용할 수 없다.
- 꼬리: PAID 주문이 10건 이상인 회원 조건은?
  - 답: `WHERE order_status='PAID' GROUP BY member_id HAVING COUNT(*) >= 10`.

**Q3. 주문 JOIN 항목 뒤 헤더 금액을 SUM하면 왜 부풀 수 있나?**

- A: 주문 행이 항목 수만큼 반복되어 헤더 금액도 반복 합산된다. 헤더만 집계하거나 항목 집계를 주문별 한 행으로 만든 뒤 결합한다.
- 꼬리: `SUM(DISTINCT 금액)`이면 충분한가?
  - 답: 다른 주문의 금액이 같으면 하나가 빠지므로 일반 해법이 아니다.

**Q4. 존재 여부 조회에는 왜 EXISTS가 잘 맞나?**

- A: 자식의 열이나 전체 행이 아니라 존재만 확인한다. 부모 행을 주문 건수만큼 복제하지 않는다. 미존재에는 `NOT EXISTS`를 쓴다.
- 꼬리: NOT IN의 NULL 함정은?
  - 답: 비교 목록 안에 NULL이 있으면 UNKNOWN이 될 수 있어 NOT EXISTS가 더 안전하다.

**Q5. UPDATE 전 SELECT를 먼저 하는 순서는?**

- A: 같은 WHERE로 행과 값을 확인한 뒤 트랜잭션에서 변경한다. 영향 행 수를 확인하고 맞지 않으면 COMMIT 전에 ROLLBACK한다. WHERE 없는 변경은 금지한다.
- 꼬리: 재고 차감 조건은?
  - 답: `WHERE id = ? AND stock > 0`처럼 키와 상태를 함께 검사한다.

**Q6. autocommit에서 UPDATE 뒤 ROLLBACK하면 취소되나?**

- A: 기본 autocommit에서는 문장 성공 시 확정되어 뒤의 ROLLBACK으로 되돌릴 수 없다. 여러 문장을 START TRANSACTION으로 묶는다. COMMIT 후도 일반 ROLLBACK으로 취소되지 않는다.
- 꼬리: 한 SQL 문장이 에러나면?
  - 답: InnoDB는 실패한 문장의 변경을 되돌리지만 전체 업무 단위 롤백은 앱 트랜잭션 경계에서 처리한다.

**Q7. `?`에 테이블명을 넣을 수 있나?**

- A: 불가능하다. `?`는 값 자리다. 테이블명·정렬 방향은 코드의 허용 목록에서 선택하고 사용자 값은 바인딩한다.
- 꼬리: 문자열 덧붙임의 문제는?
  - 답: SQL injection과 타입·인용부호 오류가 생긴다.

## 8. 참고문헌

- MySQL 8.4 — SELECT Statement — https://dev.mysql.com/doc/refman/8.4/en/select.html — SELECT·WHERE·별칭·LIMIT.
- MySQL 8.4 — JOIN Clause — https://dev.mysql.com/doc/refman/8.4/en/join.html — JOIN 종류, 미매칭 행 NULL, RIGHT 대신 LEFT 권고.
- MySQL 8.4 — INSERT Statement — https://dev.mysql.com/doc/refman/8.4/en/insert.html — 다중 INSERT·INSERT SELECT·UPSERT.
- MySQL 8.4 — UPDATE Statement — https://dev.mysql.com/doc/refman/8.4/en/update.html — WHERE 생략 시 전체 행 수정.
- MySQL 8.4 — DELETE Statement — https://dev.mysql.com/doc/refman/8.4/en/delete.html — WHERE 생략 시 전체 행 삭제.
- MySQL 8.4 — START TRANSACTION, COMMIT, ROLLBACK — https://dev.mysql.com/doc/refman/8.4/en/commit.html — autocommit·트랜잭션 종료.
- MySQL 8.4 — Working with NULL Values — https://dev.mysql.com/doc/refman/8.4/en/working-with-null.html — NULL은 IS NULL로 비교.
- MySQL 8.4 — mysql Client Options — https://dev.mysql.com/doc/refman/8.4/en/mysql-command-options.html — `--safe-updates` 동작.
- PostgreSQL Tutorial — Joins Between Tables — https://www.postgresql.org/docs/current/tutorial-join.html — JOIN 예제와 미매칭 행.
- PostgreSQL Tutorial — Transactions — https://www.postgresql.org/docs/current/tutorial-transactions.html — 변경을 원자적 단위로 묶는 이유.
- Spring Framework 7.0.9 API — JdbcTemplate — https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html — PreparedStatementCreator와 RowMapper 기반 query.
- Java SE 25 API — PreparedStatement — https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/PreparedStatement.html — setLong와 1부터 시작하는 파라미터 번호.
