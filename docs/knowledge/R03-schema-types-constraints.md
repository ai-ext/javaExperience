# R03. 스키마와 테이블 설계 — 데이터 타입, VARCHAR(255)의 의미, PK·FK·제약

> 테이블 설계는 컬럼의 의미와 허용 범위를 DB에 선언하는 일이다.
> MySQL 8.4에서는 `VARCHAR(n)`의 n은 문자 수지만 저장·행·인덱스 한도는 바이트로 계산한다.
> 입력 검증은 애플리케이션에서, 마지막 무결성 방어는 `NOT NULL`·`CHECK`·`UNIQUE`·FK에서 한다.

## 1. 한 줄로 말하면

스키마는 데이터베이스의 테이블·컬럼·타입·제약·관계를 선언한 구조이고, DDL(`CREATE`·`ALTER`·`DROP TABLE`)로 만든다. 테이블 설계는 “무슨 값을 어디까지 허용할지”를 저장 전에 데이터베이스가 검사하게 해 중복·잘림·잘못된 참조가 운영 데이터로 굳는 일을 막는다. 컬럼마다 의미에 맞는 타입과 제약을 정하고, 애플리케이션의 요청 검증과 별도로 DB에서도 지켜야 하는 불변식을 표현한다.

## 2. 당장 알아야 할 것

1. **컬럼 타입은 도메인에 맞춘다.** 개수를 세는 값은 정수, 정밀한 금액은 `DECIMAL`, 생일은 `DATE`, 시각을 보존할 값은 시간 타입으로 둔다. 저장 가능한 범위가 넓다고 무조건 큰 타입을 쓰지 않는다.

   | 타입 | 범위·특성 | 바로 쓰는 기준 |
   |---|---|---|
   | `TINYINT` | 1바이트. signed -128~127, unsigned 0~255 | 작은 상태 코드·별점. 별점이면 `CHECK (rating BETWEEN 1 AND 5)`도 둔다. |
   | `SMALLINT` | 2바이트. -32,768~32,767 / unsigned 65,535 | 작은 수량·범주형 숫자 |
   | `MEDIUMINT` | 3바이트. -8,388,608~8,388,607 / unsigned 16,777,215 | MySQL 전용임을 감수할 때 |
   | `INT` | 4바이트. -2,147,483,648~2,147,483,647 / unsigned 4,294,967,295 | 일반 재고·수량·카운터 |
   | `BIGINT` | 8바이트. signed -2⁶³~2⁶³-1 / unsigned 0~2⁶⁴-1 | 증가량이 큰 ID·누적 값. Java `long`과 맞추려면 보통 signed `BIGINT` |
   | `DECIMAL(p,s)` | 십진 정밀도 보존. p는 전체 자릿수, s는 소수 자릿수 | 금액·정산·요율. 예: 원화 금액 `DECIMAL(12,0)` |
   | `FLOAT` / `DOUBLE` | 근삿값. 각각 단정밀도·배정밀도 부동소수점 | 센서·통계 계산 등 오차가 허용되는 측정값. 금액에는 쓰지 않는다. |

   `UNSIGNED`는 음수가 불가능한 열에서 양수 범위를 넓히지만, DB 간 이식성과 Java signed 타입 경계가 걸린다. `BIGINT UNSIGNED` 최댓값은 Java `long`에 들어오지 않으므로, ID에는 대개 signed `BIGINT`가 단순하다. 범위 검증은 타입만 믿지 말고 업무 규칙에 맞춰 `CHECK`도 둔다.

2. **금액은 `DECIMAL`, `DOUBLE`은 근삿값이다.** `DECIMAL(12,0)`은 연습 스키마의 원화 가격처럼 소수 단위가 없는 금액에 맞고, 소수 통화는 업무 자릿수에 맞춰 `DECIMAL(p,s)`를 고른다. `DOUBLE`은 십진수를 정확히 표현하지 못해 합계·비교에 오차가 생길 수 있다. 비교 쿼리는 3절 4단계에서 실행한다.


3. **문자 타입은 길이·패딩·검색 용도로 고른다.** `CHAR(n)`은 고정 길이로 공백을 채우고 조회 때 제거하므로 고정 폭 코드에 쓴다. 이름·이메일 같은 가변 문자열은 `VARCHAR`, 긴 본문은 검색·인덱스 전략을 별도로 고려해 `TEXT`에 둔다. 연습 DB는 `member.name VARCHAR(80)`, `member.email VARCHAR(160)`, `article.body TEXT`다. MySQL `JSON`은 문서를 검증해 내부 형식으로 저장한다. 자주 필터링하는 속성은 JSON 안에만 두지 말고 컬럼이나 생성 컬럼으로 분리한다.

4. **`VARCHAR(n)`의 n은 문자 수, 한도는 바이트다.** MySQL의 `VARCHAR(255)`는 최대 255문자를 뜻하며 255바이트가 아니다. `utf8mb4`는 문자당 최대 4바이트이므로 255문자의 최대 payload는 1,020바이트다. 실제 저장 공간은 데이터 바이트 길이와 길이 접두사를 쓰므로, 선언만으로 매 행에 1,020바이트를 미리 채우는 것은 아니다.

   값이 최대 255바이트면 길이 접두사 1바이트, 넘을 수 있으면 2바이트다. 단일 바이트 문자셋의 `VARCHAR(255)`가 관습이 된 배경 중 하나지만, 문서가 그 기원을 하나로 확정하지는 않는다. `utf8mb4 VARCHAR(255)`는 최대 1,020바이트여서 접두사 2바이트를 쓴다. “255면 1바이트 절약”은 현대 근거가 아니다.

   길이는 입력 상한이며 최대 행 크기·인덱스 키 폭 계산에도 반영된다. 임시 테이블의 `VARCHAR` 표현은 엔진마다 다르다. TempTable은 길이·포인터 기반으로 패딩 없이 저장하지만 MEMORY 엔진은 고정 길이 행에서 최대 선언 길이까지 패딩한다. 긴 `n`이 모든 임시 테이블에서 그대로 예약된다는 뜻은 아니다.

   InnoDB `DYNAMIC`·`COMPRESSED`의 인덱스 키 접두사 한도는 3,072바이트다. 최악 기준 `utf8mb4 VARCHAR(768)` 하나가 이를 채우며 복합 인덱스는 컬럼 폭을 합산한다. MySQL 내부 행 표현 한도는 65,535바이트이고 InnoDB 페이지 로컬 행 크기 제한과는 별개다. 긴 본문이나 모든 문자열을 무분별하게 인덱싱하지 않는다. 상세 인덱스 전략은 → R05 참조.

5. **`DATE`, `DATETIME`, `TIMESTAMP`는 시간 의미가 다르다.** `DATE`는 날짜만, `DATETIME`은 타임존 변환 없는 달력 시각, `TIMESTAMP`는 세션 타임존 기준으로 입력값을 UTC로 바꿔 저장하고 조회 때 다시 변환하는 시각이다. `TIMESTAMP` 범위는 1970~2038년이라 수명 긴 예약·업무일정에 무조건 쓰지 않는다. 연습 스키마의 주문 시각은 `DATETIME`이다. 분수 초가 필요하면 `DATETIME(6)`처럼 정밀도를 정하고 UTC 저장 규칙을 애플리케이션과 합의한다.

6. **NULL·NOT NULL·DEFAULT는 서로 다른 규칙이다.** `NULL`은 값이 없거나 아직 모른다는 뜻이고 `0`, 빈 문자열, `false`와 다르다. 필수값은 `NOT NULL`, 누락 시 업무상 안전한 값이 있을 때만 `DEFAULT`를 둔다. 예를 들어 `product.stock INT NOT NULL DEFAULT 0`은 신규 상품 재고가 0이라는 도메인 규칙이다. `DEFAULT`는 `NULL` 허용과 별개이며, `NOT NULL`만으로는 범위가 제한되지 않는다.

7. **PK는 행을 식별하고 FK는 참조를 지킨다.** 테이블마다 기본키를 하나 정한다. 자연키(이메일·주문번호)는 업무적으로 의미 있지만 수정·재사용·개인정보 변경 위험이 있고, 대리키(`BIGINT id`)는 업무 의미 없이 행을 안정적으로 식별한다. 보통 대리키를 PK로 두고 로그인 이메일이나 주문번호에 별도 `UNIQUE`를 건다. `orders.member_id` → `member.id` 같은 FK는 부모 없는 주문이 만들어지는 것을 거부한다.

   ```mermaid
   erDiagram
     MEMBER ||--o{ ORDERS : "member_id 참조"
     ORDERS ||--|{ ORDER_ITEM : "order_id 참조"
     PRODUCT ||--o{ ORDER_ITEM : "product_id 참조"
   ```

   FK를 안 두는 이유는 서비스별 DB 소유권, 샤딩, 대량 적재·레거시 이행 등이다. 무결성 검사를 앱·배치·모니터링으로 옮기며, 동시 쓰기에서 고아 행이 생길 위험과 복구 책임도 진다. 이유 없이 “느리다”만으로 제거하지 않는다.

8. **UNIQUE와 CHECK로 잘못된 값 범위를 닫는다.** `member.email UNIQUE`는 중복 이메일을 막는다. MySQL UNIQUE 인덱스는 `NULL`을 여러 개 허용할 수 있으므로 필수 유일값이면 `NOT NULL UNIQUE`를 함께 쓴다. `CHECK (price >= 0)`처럼 행 내부의 조건을 선언한다. MySQL은 8.0.16부터 `CHECK`를 실제로 검사한다. 단 `CHECK` 결과가 `UNKNOWN`인 `NULL` 행은 통과하므로 필수이면 `NOT NULL`도 필요하다. `BOOLEAN`은 `TINYINT(1)`의 별칭이고 0/1만 허용하는 타입이 아니므로 `CHECK (auto_renew IN (0,1))`로 막는다.

   상태값이 정해져 있어도 `ENUM`을 무조건 쓰지 않는다. `ENUM`은 선택 목록을 DB에 고정하고 1 또는 2바이트로 저장하는 장점이 있지만, 목록 순서가 값의 내부 순서에 영향을 주고 상태 추가·배포 순서를 관리해야 한다. 연습 스키마는 상태를 `VARCHAR` + `CHECK`로 선언해 값 목록을 읽기 쉽게 했다.

9. **정규화는 같은 사실을 한 곳에서 관리하는 것부터 시작한다.** 주문마다 회원 이름·이메일을 반복 저장하면 이메일 변경 때 일부 주문만 바뀌는 수정 이상, 회원 삭제 때 주문 이력도 사라지는 삭제 이상, 주문 없는 회원을 넣기 어려운 삽입 이상이 생긴다. `member`에 회원 사실을 두고 `orders.member_id`로 연결한다. 주문 당시 수취인처럼 “그 시점의 스냅샷”이 필요한 값은 별도 이유가 있는 중복이므로 원본과 의미를 구분한다. ERD 전체는 → D10 참조.

## 3. 따라 하기

연습 DB `ds_practice`는 MySQL 8.4 기준이며, 여기에 있는 테이블·컬럼만 사용한다. 실제 실습은 이미 준비된 개발용 DB에서 한다. `schema.sql`은 `DROP DATABASE IF EXISTS ds_practice`를 포함하므로 아래 절차에서 다시 적재하지 않는다. DDL은 MySQL에서 암묵적 커밋을 일으켜 `ROLLBACK`으로 되돌릴 수 없으니 복사 테이블로 확인한다.

### 1단계: 기존 테이블 정의를 읽는다

프로젝트의 DB 접속 정보로 `ds_practice`에 접속한다. 로컬 MySQL 클라이언트를 쓴다면 아래처럼 접속한다(비밀번호는 프롬프트에서 입력).

```bash
mysql --default-character-set=utf8mb4 -h 127.0.0.1 -u <사용자> -p ds_practice
```

```sql
SHOW CREATE TABLE product\G

SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('member', 'product', 'orders', 'order_item', 'review')
ORDER BY table_name, ordinal_position;
```

**확인 방법** — (예상) `product.price`는 `decimal(12,0) NOT NULL`, `product.stock`은 `int NOT NULL DEFAULT 0`, `review.rating`은 `tinyint NOT NULL`로 보인다. `SHOW CREATE TABLE`에는 PK·FK·CHECK·인덱스 정의도 함께 표시된다.

### 2단계: CREATE·ALTER·DROP의 영향 범위를 복사 테이블로 확인한다

`CREATE TABLE ... LIKE`는 `product`의 컬럼·인덱스를 복사해 빈 테이블을 만든다. 이어 `name`의 최대 길이를 바꿔 `SHOW CREATE TABLE`로 확인한 뒤 삭제한다. 이 복사본은 데이터가 없으므로 `ALTER` 결과가 운영 데이터에 미칠 영향을 만들지 않는다. `r03_product_probe`가 이미 있다면 이름을 바꿔 사용한다.

```sql
CREATE TABLE r03_product_probe LIKE product;
ALTER TABLE r03_product_probe
  MODIFY COLUMN name VARCHAR(180) NOT NULL;
SHOW CREATE TABLE r03_product_probe\G
DROP TABLE r03_product_probe;
```

**확인 방법** — (예상) `SHOW CREATE TABLE` 출력에서 `name` 길이 변경을 확인하고, 마지막 DROP 후 복사 테이블이 사라진다. Spring Boot 프로젝트에서는 승인된 DDL을 버전이 붙은 DB 마이그레이션 파일에 저장하고, Gradle Kotlin DSL·Maven 중 어느 빌드 도구를 쓰든 배포 파이프라인에서 적용 순서를 관리한다. 빌드 파일 설정은 → P19 참조.

### 3단계: 제약이 실제 오류를 막는지 확인한다

연습 스키마의 `product`는 가격이 음수가 되는 것을 `ck_product_price_stock`으로 막는다. 아래 UPDATE는 의도적으로 실패하는 검증이다. `id = 1`은 시드에 있는 상품이다. 오류가 나도 명시적으로 롤백해 실습 트랜잭션을 정리한다.

```sql
START TRANSACTION;
UPDATE product SET price = -1 WHERE id = 1;
-- (예상) ERROR 3819: Check constraint 'ck_product_price_stock' is violated.
ROLLBACK;
```

**확인 방법** — (예상) UPDATE가 제약 오류로 거부된다. 같은 세션에서 `ROLLBACK`한 뒤 `SELECT id, price FROM product WHERE id = 1;`을 실행하면 원래 가격이다. 오류 문구의 제약 이름은 스키마 정의에서 찾는다.

### 4단계: 업무 데이터 변경은 트랜잭션 경계를 확인한다

금액은 십진 정확도를 유지하는 `DECIMAL`에 둔다. 부동소수점 비교가 왜 금액 계산에 맞지 않는지도 아래 읽기 전용 쿼리로 확인한다.

```sql
SELECT
  CAST(0.1 AS DOUBLE) + CAST(0.2 AS DOUBLE) = CAST(0.3 AS DOUBLE) AS double_equal,
  CAST(0.1 AS DECIMAL(2,1)) + CAST(0.2 AS DECIMAL(2,1))
    = CAST(0.3 AS DECIMAL(2,1)) AS decimal_equal;

START TRANSACTION;
UPDATE product SET price = price + 1 WHERE id = 1;
SELECT id, price FROM product WHERE id = 1;
ROLLBACK;
SELECT id, price FROM product WHERE id = 1;
```

**확인 방법** — 첫 쿼리는 (예상) `double_equal = 0`, `decimal_equal = 1`. UPDATE 후 조회 값은 1 증가하고, 마지막 조회에서는 원래 값으로 돌아온다. 데이터 변경 예제는 실제 업무 DB에서 실행하기 전에 대상·WHERE 조건을 확인한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| CREATE/ALTER/DROP TABLE | 구조 생성·변경·삭제 | `CREATE TABLE ...` / `ALTER TABLE ...` / `DROP TABLE ...` | 대형 ALTER의 행 수·알고리즘·락을 검토하고, DDL은 일반 DML처럼 롤백되지 않는다. |
| `PRIMARY KEY` | 행 식별, NULL·중복 금지 | `id BIGINT PRIMARY KEY` | 테이블당 하나, 안정적인 키를 고른다. |
| `FOREIGN KEY` | 참조 무결성 | `FOREIGN KEY (member_id) REFERENCES member(id)` | 양쪽 타입과 부호를 맞춘다. |
| `UNIQUE` | 중복 방지 | `email VARCHAR(160) NOT NULL UNIQUE` | NULL 허용 여부와 콜레이션도 결정한다. |
| `NOT NULL / DEFAULT` | 필수 여부·생략값 | `stock INT NOT NULL DEFAULT 0` | DEFAULT가 도메인 규칙에 맞는지 확인한다. |
| `CHECK` | 행 내부 값 검증 | `CHECK (price >= 0)` | MySQL 8.0.16+, NULL이면 통과할 수 있다. |
| `ON DELETE` | 부모 삭제 시 자식 동작 | `RESTRICT` / `CASCADE` / `SET NULL` | 삭제 범위와 nullable 여부를 확인한다. |
| `DECIMAL / VARCHAR` | 금액 / 가변 문자열 | `DECIMAL(12,0)` / `VARCHAR(160)` | 금액은 정확도, 문자열은 문자셋 바이트를 고려한다. |

## 5. 자주 나는 에러와 해결

1. **`Data too long for column 'name' at row 1` →** 허용 문자 수 초과다. 기본 SQL mode의 `STRICT_TRANS_TABLES`는 값을 자르는 대신 오류를 낸다. **해결:** 도메인 최대 길이와 앱 검증을 확인한 뒤 적정하게 조정한다.
2. **`ERROR 1071 (42000): Specified key was too long; max key length is 3072 bytes` →** `utf8mb4` 문자열 또는 복합 키의 최악 바이트 폭이 한도를 넘었다. **해결:** 인덱스 폭을 줄이거나 별도 검색 전략을 검토한다(→ R05).
3. **`ERROR 150 "Foreign key constraint is incorrectly formed"` →** 부모/자식의 타입·부호·문자셋·엔진 또는 참조 키가 맞지 않는다. **해결:** 두 테이블의 `SHOW CREATE TABLE`을 비교하고 인덱스까지 확인한다.
4. **`Cannot delete or update a parent row: a foreign key constraint fails` →** 자식 행이 부모를 참조 중이다. **해결:** 이력은 보존하고 기본 거부를 유지한다. 전파 삭제가 도메인 규칙일 때만 `CASCADE`를 쓴다.
5. **`ERROR 3819 ... Check constraint ... is violated` →** 가격 음수나 별점 0처럼 CHECK 범위를 벗어났다. **해결:** 입력 원인을 고치고 제약은 정당한 업무 규칙일 때만 변경한다.
6. **`Duplicate entry ... for key 'email'` →** UNIQUE 값이 기존 행과 충돌했다. 사전 SELECT만으로 동시 요청을 막을 수 없다. **해결:** UNIQUE를 유지하고 오류를 도메인 응답으로 바꾼다.
7. **`Column 'member_id' cannot be null` / `Field ... doesn't have a default value` →** 필수값이 누락됐다. **해결:** 선택 사항인지 확인해 nullable/default 규칙을 정하고, 임의 기본값으로 오류를 숨기지 않는다.

## 6. 한 단계 더

스키마는 DB가 지킬 데이터 계약이다. 앱 검증은 빠른 오류를 주고, DB 제약은 배치·관리 스크립트·동시 요청을 포함한 모든 쓰기 경로를 막는다. 타입 범위와 도메인 유효 범위는 다르므로 CHECK 필요성을 판단한다. 대형 `ALTER`는 작업에 따라 테이블을 재구성하거나 메타데이터 락을 기다릴 수 있어 행 수·알고리즘·락을 사전 검토한다. FK를 빼면 참조 검사를 다른 곳에서 구현·감시해야 한다. 다음 주제는 SQL 조작 → R04, 인덱스 → R05, ERD 모델링 → D10, JPA 매핑 → P20 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. `VARCHAR(255)`면 255바이트를 저장하는가? 왜 관습처럼 보이나?**  
아니다. MySQL은 최대 255문자를 허용하고 실제 바이트 수는 문자셋에 달렸다. `utf8mb4`에서는 255자에 최대 1,020바이트가 필요해 길이 접두사는 2바이트다. 255바이트 접두사 경계가 단일 바이트 문자셋 시절 관습에 영향을 줬지만, 현대 설계에서 특별한 최적 길이라는 뜻은 아니다.  
**꼬리질문:** `VARCHAR(255)`는 행마다 1,020바이트를 차지하나? **답:** 실제 값 크기와 접두사가 저장되며, 선언 크기는 최대 행·인덱스 계산과 임시 테이블 처리에 영향을 줄 수 있다.

**Q2. 가격에 `DOUBLE` 대신 `DECIMAL`을 쓰는 이유는?**  
`DOUBLE`은 이진 부동소수점 근삿값이라 십진 소수를 모두 정확히 표현하지 못한다. 덧셈·비교·분배를 반복하면 반올림 오차가 업무 결과에 남을 수 있다. `DECIMAL(p,s)`는 십진 자릿수를 고정해 그 값을 정확히 표현한다.  
**꼬리질문:** 센서 측정값은 무조건 `DECIMAL`인가? **답:** 오차가 허용되고 범위·성능상 이점이 필요하면 `FLOAT`·`DOUBLE`을 쓸 수 있다. 정확도가 요구되는 단위·허용 오차를 먼저 정한다.

**Q3. 자연키와 대리키 중 무엇을 PK로 둘까?**  
자연키는 이메일·주문번호처럼 도메인 의미를 가진다. 값이 바뀌거나 외부 규칙에 종속되면 FK로 전파할 변경 비용과 민감 정보 노출이 생긴다. 보통 불변성이 높은 대리키를 PK로 쓰고, 자연키의 유일성은 별도 UNIQUE로 보장한다.  
**꼬리질문:** 그러면 주문번호에 제약이 없어도 되는가? **답:** 아니다. 외부 계약상 유일해야 하면 `UNIQUE NOT NULL`을 둔다. PK와 업무 유일성은 서로 다른 요구다.

**Q4. FK를 쓰지 않는 팀이 있다면 설계가 잘못된 것인가?**  
항상 그렇지는 않다. 샤딩·서비스별 데이터 소유권·고속 대량 적재에서는 DB FK가 운영 경계와 맞지 않을 수 있다. 이 경우 애플리케이션·배치·정합성 감시가 참조 무결성을 대신해야 한다. 그 책임과 고아 행 복구 절차가 없다면 FK 제거는 데이터 정합성을 약화시킨다.  
**꼬리질문:** 사전 조회로 경쟁 삽입을 막나? **답:** 조회와 쓰기 사이에 값이 바뀔 수 있어 DB 제약이 필요하다.

**Q5. `CHECK (price >= 0)`인데 NULL이 들어갈 수 있는가?**  
가능하다. 비교 결과가 `UNKNOWN`인 NULL 행은 MySQL CHECK 위반으로 처리되지 않는다. 필수 가격이면 `NOT NULL`을 추가하고, `CHECK`로 음수만 금지한다. MySQL 8.0.16부터 CHECK가 적용되므로 이전 버전 동작과 혼동하지 않는다.  
**꼬리질문:** API 검증이 있으면 CHECK는 불필요한가? **답:** 아니다. 모든 쓰기 경로를 보호한다.

**Q6. `ON DELETE CASCADE`는 언제 선택하나?**  
부모가 없어질 때 자식도 도메인상 함께 사라져야 하고, 그 전파 범위가 좁고 예측 가능할 때 쓴다. 주문·결제·포인트처럼 보존해야 하는 이력에는 보통 삭제를 거부하거나 별도 상태 전이를 쓴다. `SET NULL`을 선택하면 FK 열이 NULL을 허용해야 한다.  
**꼬리질문:** 기본 FK 동작은 무엇인가? **답:** MySQL InnoDB는 자식이 참조 중인 부모 삭제·키 변경을 거부한다(`RESTRICT`와 `NO ACTION`은 동등).

## 8. 참고문헌

- MySQL 8.4 Reference Manual — The JSON Data Type — https://dev.mysql.com/doc/refman/8.4/en/json.html — JSON 검증과 내부 저장 형식.
- MySQL 8.4 Reference Manual — CHAR/VARCHAR, utf8mb4, storage requirements — https://dev.mysql.com/doc/refman/8.4/en/char.html · https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-utf8mb4.html · https://dev.mysql.com/doc/refman/8.4/en/storage-requirements.html — 문자 길이·문자셋 바이트·길이 접두사.
- MySQL 8.4 Reference Manual — Integer, fixed-point, floating-point, numeric syntax, ENUM — https://dev.mysql.com/doc/refman/8.4/en/integer-types.html · https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html · https://dev.mysql.com/doc/refman/8.4/en/floating-point-types.html · https://dev.mysql.com/doc/refman/8.4/en/numeric-type-syntax.html · https://dev.mysql.com/doc/refman/8.4/en/enum.html — 범위·정밀도·BOOLEAN 별칭·ENUM 특성.
- MySQL 8.4 Reference Manual — DATETIME and TIMESTAMP — https://dev.mysql.com/doc/refman/8.4/en/datetime.html — 날짜/시각 범위와 TIMESTAMP UTC 변환.
- MySQL 8.4 Reference Manual — Row and InnoDB limits — https://dev.mysql.com/doc/refman/8.4/en/column-count-limit.html · https://dev.mysql.com/doc/refman/8.4/en/innodb-limits.html — 행 크기·인덱스 키 폭 한도.
- MySQL 8.4 Reference Manual — Internal Temporary Table Use — https://dev.mysql.com/doc/refman/8.4/en/internal-temporary-tables.html — 임시 테이블의 VARCHAR 처리와 메모리/디스크 전환.
- MySQL 8.4 Reference Manual — Server SQL Modes — https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html — 기본 SQL mode와 STRICT_TRANS_TABLES.
- MySQL 8.4 Reference Manual; MySQL 8.0.16 CHECK announcement — https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html · https://dev.mysql.com/blog-archive/mysql-8-0-16-introducing-check-constraint/ — CHECK 문법·NULL 처리와 적용 버전.
- MySQL 8.4 Reference Manual — FOREIGN KEY Constraints — https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html — FK 무결성과 referential action.
- MySQL 8.4 Reference Manual — Online DDL Operations — https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html — ALTER 작업별 재구성·동시 DML 지원.
