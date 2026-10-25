# R04 SQL CRUD·JOIN 개념 근거 조사

> 메인 검토 주: EXISTS 공식 절은15.2.15.6이다. 아래 Luna 초안의15.2.15.7 표기는 main-verification.json에서 정정했다. ROW_COUNT의 직접 근거도 메인이 information-functions 문서로 보완 확인했다. 실행은 메인의 별도 native/JDBC 증거를 따른다.

**확인일:** 2026-10-20 (Asia/Seoul) · **대상:** `docs/knowledge/R04-sql-crud-join.md` 및 동일 사본 · **자료:** MySQL 8.4 Reference Manual, Spring Framework 7.0.9 API, Java SE 21 API · **실행 여부:** 조사자는 SQL, Java, MySQL 서버를 실행하지 않았다. 본문 예시 결과는 원문 표기대로 예상값이며 실제 측정 결과가 아니다.

## 핵심 판정

SELECT 예시는 열을 명시하고 `WHERE`로 대상 행을 좁힌 뒤 `ORDER BY ordered_at DESC, id DESC LIMIT 20 OFFSET 0`으로 결정적인 정렬 tie-breaker와 페이지 크기를 지정한다. MySQL 문법 순서가 `FROM/WHERE/GROUP BY/HAVING/ORDER BY/LIMIT`이라는 사실은 논리 평가 단계와 같다는 뜻이 아니다. 보고서의 Mermaid 순서는 교육용 논리 모델로 유지하되, optimizer의 물리 접근·조인 순서는 별개라고 함께 설명하는 것이 정확하다. MySQL SELECT 문법은 LIMIT과 ORDER BY를 포함하며, 조인 문서는 `STRAIGHT_JOIN`을 예외적 optimizer 순서 제어로 설명한다. 출처 [SELECT §15.2.13](https://dev.mysql.com/doc/refman/8.4/en/select.html), [JOIN §15.2.13.2](https://dev.mysql.com/doc/refman/8.4/en/join.html).

JOIN 설명은 타당하다. MySQL 8.4는 `LEFT`·`RIGHT` outer join과 `CROSS`를 문법에 포함하고, 미매칭 LEFT 행의 오른쪽 열을 NULL로 채운다고 명시한다. 오른쪽 테이블 조건을 `WHERE`에 두면 그 NULL 확장 행이 조건을 통과하지 못할 수 있으므로, 왼쪽 행을 보존하면서 오른쪽 매칭 조건을 제한하려면 `ON`에 둔다. MySQL은 RIGHT가 LEFT와 유사하다고 하고 이식성을 위해 LEFT 사용을 권한다. SELF JOIN은 별칭을 둔 같은 테이블의 재참조다. 문법에 FULL OUTER JOIN은 없다. 다만 이 자료만으로 모든 호환 DB나 향후 버전의 지원 여부를 일반화하지 말고 “MySQL 8.4 JOIN 문법에 없음”으로 한정한다.

집계 예의 `COUNT(*)`와 `COUNT(o.id)` 구별도 정확하다. NULL 확장된 미매칭 행은 `COUNT(*)`에는 한 행으로 포함되지만, `COUNT(expr)`는 expr이 NULL인 행을 세지 않는다. 따라서 부모별 실제 자식 수에는 nullable한 오른쪽 PK를 세는 방식이 적절하다. `ONLY_FULL_GROUP_BY`가 활성화된 MySQL은 GROUP BY에 없고 함수 종속성으로도 결정되지 않는 비집계 열을 거부한다. 함수 종속성으로 결정되는 열 등 문서의 허용 조건이 있으므로 “모든 비그룹 열은 언제나 금지”보다 해당 모드의 판정 규칙을 안내한다. MySQL SELECT에서 별칭은 `ORDER BY`, `GROUP BY`, `HAVING`에서 허용되지만 `WHERE`에서는 허용되지 않는다. `WHERE`는 그룹 전 행 필터, `HAVING`은 그룹 필터라는 요약과 `HAVING SUM(...)` 예시는 맞다. 출처 [Aggregate Functions §14.19.1](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html), [GROUP BY Handling §14.19.3](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html), [SELECT §15.2.13](https://dev.mysql.com/doc/refman/8.4/en/select.html).

1:N에서 주문 헤더 금액이 항목마다 반복되므로 JOIN 결과에서 `SUM(o.total_amount)`가 부풀 수 있다는 설명은 관계의 행 단위로부터 성립한다. `SUM(DISTINCT o.total_amount)`는 주문 ID가 아니라 금액 값의 중복을 제거하므로, 금액이 같은 별도 주문을 하나로 합쳐 누락시킬 수 있다. 따라서 헤더 테이블에서 합산하거나 주문별로 먼저 한 행으로 집계한다. EXISTS는 존재 여부 조건으로 부모 행을 자식 수만큼 출력하는 조인이 아니므로 중복 방지 의도에 알맞다. `NOT IN` 하위쿼리 결과에 NULL이 있으면 비교가 UNKNOWN이 될 수 있다는 주장은 SQL 3값 논리와 MySQL의 비교 동작에 맞는다. NOT NULL이 보장되지 않는 연관 키에는 `NOT EXISTS`가 안전한 패턴이다. 실행계획/성능상 EXISTS가 항상 더 빠르다고 말해서는 안 된다. 출처 [Subqueries with EXISTS or NOT EXISTS §15.2.15.7](https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html), [비교 연산자](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html).

## 변경문·동시성·애플리케이션 바인딩

UPSERT 문법은 `INSERT ... VALUES (...) AS incoming ON DUPLICATE KEY UPDATE ...`의 행 별칭을 지원한다. 문서상 이 절은 지정한 단일 UNIQUE 키만이 아니라 PRIMARY KEY 또는 UNIQUE 인덱스 어느 쪽의 충돌에도 발동할 수 있다. 복수 UNIQUE 충돌이 서로 다른 행을 가리키는 설계에서는 예상치 못한 갱신/오류 위험이 있으므로 충돌 키 구성을 확인해야 한다. 영향을 받은 행 수는 보통 insert 1, 기존 행 갱신 2, 값이 기존과 같아 변경이 없으면 0이며 `CLIENT_FOUND_ROWS` 옵션은 마지막 경우 보고값을 1로 바꾼다. 그러므로 “항상 충돌행 1개 갱신” 또는 영향 행 수를 단순 변경 건수로 해석하면 안 된다. 출처 [INSERT ... ON DUPLICATE KEY UPDATE §15.2.7.2](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html).

`ROW_COUNT()`는 바로 앞 문장의 영향 행 수를 반환하므로, 예제처럼 UPDATE/DELETE 직후 별도 SELECT로 읽는 것은 그 사이 다른 SQL이 없다는 전제에서 의미가 분명하다. MySQL 기본 autocommit은 각 성공 문장을 별도 트랜잭션으로 확정한다. 명시적 트랜잭션에서는 `COMMIT`/`ROLLBACK`이 경계를 만든다. InnoDB의 문장 오류는 보통 실패한 문장만 되돌리지만, 일부 오류(예: deadlock)는 전체 트랜잭션 롤백을 일으킬 수 있으므로 “에러면 무조건 문장만 롤백”이라고 절대화하지 않는다. 트랜잭션 경계 밖의 앞선 성공 문장까지 자동 취소되는 것도 아니다. 출처 [COMMIT/ROLLBACK §15.3.1](https://dev.mysql.com/doc/refman/8.4/en/commit.html), [InnoDB Error Handling §17.20.5](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html).

사전 SELECT는 변경 대상을 눈으로 확인하는 절차이지 동시성 잠금이나 원자적 보장이 아니다. 그 뒤 다른 트랜잭션이 값을 바꿀 수 있다. 재고 예처럼 `UPDATE ... WHERE id=? AND stock>0`로 조건을 변경문에 넣고 영향 수를 확인하는 방식이 핵심이다. 더 복잡한 다중 문장 불변조건에는 적절한 트랜잭션 격리·잠금·제약조건을 고려한다. `--safe-updates`는 mysql 클라이언트 옵션(`--i-am-a-dummy`)으로 세션 `SQL_SAFE_UPDATES`를 설정하는 보호다. 서버가 모든 무조건 UPDATE/DELETE를 보편적으로 금지하는 기능으로 설명하면 부정확하다. 키 열 조건, LIMIT 및 선택 인덱스 조건에 영향을 받으며 오류 1175 사례는 조건/인덱스 상태를 특정해야 한다. 출처 [mysql client options §6.5.1.1](https://dev.mysql.com/doc/refman/8.4/en/mysql-command-options.html), [UPDATE §15.2.17](https://dev.mysql.com/doc/refman/8.4/en/update.html), [DELETE §15.2.2](https://dev.mysql.com/doc/refman/8.4/en/delete.html).

JDBC의 `?`는 값 파라미터 자리를 나타내므로 테이블명, 컬럼명, `ASC`/`DESC` 같은 SQL 문법 식별자를 대체하지 않는다. 이들은 코드의 허용 목록으로 선택한다. `PreparedStatement.setLong(int, long)`의 파라미터 인덱스는 1부터 시작한다. 원문 Java의 `PreparedStatementCreator`가 SQL을 준비하고 `ps.setLong(1, memberId)`로 바인딩한 뒤 `JdbcTemplate.query(..., RowMapper)`로 행을 매핑하는 사용 형태는 Spring API와 맞는다. 다만 조사 대상 원문은 Boot 4.1.1 / Java 25라고 하지만 별도 실행 계획은 Spring Framework 7.0.9 직접 fixture 및 JDK 21이라고 한다. 이 보고서 검증은 Framework API와 Java 21 API이며, Boot BOM 정합성, Connector/J 9.7.0 호환, 컴파일·실연결은 검증하지 않았다. Connector/J 페이지가 열리지 않아 드라이버 주장은 확정하지 않는다. 출처 [JdbcTemplate 7.0.9 API](https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html), [PreparedStatement Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html).

## 원문과 seed의 예상 결과 대조

로컬 원문에는 SQL 7블록, Java 1, Kotlin 1, YAML 1, bash 2, Mermaid 1블록이 있다. `schema.sql`은 회원·주문·상품 등 관계와 InnoDB 제약조건을 선언하며, `seed.sql`은 회원 200명과 주문 1,000건, 주문항목 2,500건 등을 생성하는 정적 생성문을 포함한다. 따라서 원문의 회원 1 주문 6행, 회원 181/182 주문 없음, 주문 1 금액 17,919·항목 3행, 회원 쿠폰 id 300 존재, 상품 id 1 재고 33은 현재 파일 정의로부터 예상한 값으로 취급해야 하며 SQL 실측이 아니다. 특히 회원 1의 주문 수는 seed의 `member_id = 1 + MOD(n-1,180)`에서 n=1..1000일 때 6건이라는 정적 계산과 부합한다. 회원 181/182는 이 생성 범위에 나타나지 않는다. 주문 1 항목 세 행도 `order_id=1+MOD(n-1,1000)` 생성 규칙상 정적 예상이다. 보고서의 `INNER 6`, `LEFT 2`, `RIGHT 1`, `CROSS 4`, SELF 부모 관계 및 ROLLBACK 후 상태 역시 실행 결과라고 쓰지 않는다. Seed 전체 SQL을 MySQL 8.4.11에서 적재하거나 원문 코드의 동작을 재현하지 않았으므로 제약조건/세션 설정을 포함한 실측 확인은 메인 실행자의 별도 격리 검증 범위다.

## 자료 접근 기록 및 한계

확인 버전 범위는 MySQL 8.4 매뉴얼(8.4 계열 문서), Spring Framework 7.0.9 Javadoc, Java SE 21 API다. 접속 환경에서 원문 R03 조사에 기록된 native MySQL 8.4.11 macOS ARM64 및 JDK 21 설치 사실은 실행자가 제공한 전제이지 본 조사에서 재확인한 환경 진단이 아니다. 공식 페이지는 2026-10-20에 열었다. 관련 공식 1차 출처 URL, 절 번호, 확인 항목, 접근 실패는 `_data/source-notes.md`와 `_data/source-access.json`에 기록했다. 웹 도구 오류는 Connector/J URL의 내부 오류뿐이며, 그 동작은 미확인이다. 그 밖에 주어진 주요 URL은 열렸다. 이 리서치는 실행 결과·벤치마크·현행 설치 상태를 보증하지 않는다.
