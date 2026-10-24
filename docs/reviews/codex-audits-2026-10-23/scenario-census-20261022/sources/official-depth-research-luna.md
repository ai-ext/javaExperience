# Spring/JPA/MyBatis/MySQL 8.4 학습 시나리오 심화 기준

**조사 기준일: 2026-10-22.** 아래 내용은 공식 문서의 동작 설명을 바탕으로 구성한 실험 제안입니다. 실제 저장소 현황이나 실험 실행 결과를 보고하지 않습니다. URL은 각 항목당 1~2개로 제한했습니다. 버전 표기는 출처 문서의 버전이며, 실제 동작은 학습 환경의 MySQL·Spring Data·JPA provider·MyBatis·connection pool 버전을 고정해 확인해야 합니다.

## 1. 복합 인덱스 선택도, rows·loops, 쓰기 비용

**출처 내용:** MySQL의 복합 인덱스는 선두 컬럼부터 연속된 접두부를 조건으로 사용할 수 있습니다. `EXPLAIN ANALYZE`는 실제 실행 정보를 제공하며, 반복 실행되는 노드의 행 수는 loop당 평균일 수 있습니다. InnoDB 보조 인덱스 엔트리에는 PK 컬럼도 포함되므로 인덱스 컬럼과 PK 폭은 저장·쓰기 비용에 영향을 줍니다. [Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html), [EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)

**실험 입력:** InnoDB 테이블에 100만 행을 적재합니다. `tenant_id`는 100개 값에 균등 분포, `status`는 2개 값, `created_at`은 시간 순으로 생성합니다. `tenant_id = ? AND status = ? AND created_at >= ?` 조회를 `(tenant_id, status, created_at)`와 `(status, tenant_id, created_at)` 인덱스 각각에서 `EXPLAIN ANALYZE`로 비교합니다. 각 인덱스 구성에서 같은 10만 건을 삽입하고 갱신 시간, 인덱스 크기, 계획의 실제 rows·loops를 기록합니다.

**완료 기준:** 두 인덱스가 선두 접두부와 범위 조건을 어떻게 다루는지 계획에서 설명하고, 추정 rows와 실제 rows의 차이 및 loop 평균을 구분합니다. 인덱스가 늘었을 때 삽입·갱신 비용과 저장량이 어떻게 변했는지 측정값으로 설명합니다.

**버전 한계:** 선택도와 비용 기반 계획은 데이터 분포, 통계, 서버 설정에 따라 달라집니다. 8.4에서 관찰한 구체적 실행 계획을 다른 버전에 일반화하지 않습니다. 8.4의 `EXPLAIN ANALYZE` 출력에는 반복 노드별 평균 의미가 적용됩니다.

## 2. Snapshot read와 current/locking read

**출처 내용:** InnoDB `REPEATABLE READ`에서 일관 읽기는 트랜잭션 안의 스냅샷을 읽습니다. `READ COMMITTED`는 각 일관 읽기마다 새 스냅샷을 설정합니다. `SELECT ... FOR SHARE` 같은 locking read는 잠금 읽기이며 일반 일관 읽기와 구별해야 합니다. [Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html), [Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

**실험 입력:** 세션 A와 B에서 같은 계좌 행을 사용합니다. A는 트랜잭션을 시작해 `balance`를 읽고, B는 값을 바꿔 커밋합니다. A가 다시 일반 `SELECT`를 수행한 뒤 `SELECT ... FOR UPDATE`를 수행합니다. 이 흐름을 `REPEATABLE READ`와 `READ COMMITTED`에서 반복합니다.

**완료 기준:** 격리 수준별 일반 `SELECT` 결과 차이와 locking read의 대기/최신 값 관찰을 표로 정리합니다. 스냅샷 조회 결과와 잠금 조회 결과를 같은 개념으로 취급하지 않습니다.

**버전 한계:** 실험은 MySQL 8.4 및 InnoDB 기준입니다. 세션별 격리 수준과 읽기/쓰기 문맥, 트랜잭션 시작 시점에 따라 관찰값이 달라질 수 있습니다.

## 3. Unique 경쟁과 retry 경계

**출처 내용:** Unique 제약은 중복 키 데이터 변경을 거부합니다. 중복 키 오류가 난 문장만 롤백되더라도 해당 문장이 설정한 잠금은 트랜잭션이 끝날 때까지 유지될 수 있습니다. MySQL 문서는 deadlock 및 lock wait timeout이 발생할 수 있으며 애플리케이션이 retry를 처리해야 한다고 설명합니다. [PRIMARY KEY and UNIQUE Index Constraints](https://dev.mysql.com/doc/refman/8.4/en/constraint-primary-key.html), [InnoDB Error Handling](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html)

**실험 입력:** `email UNIQUE` 테이블에 두 세션이 같은 신규 이메일을 동시에 삽입합니다. 한 요청은 성공, 다른 요청은 duplicate key를 받아야 합니다. 두 번째 세션은 중복 오류 뒤에도 트랜잭션에서 후속 작업을 하고, 전체 rollback/retry 방식과 오류 문장만 처리하는 방식의 차이를 관찰합니다. 별도 흐름으로 두 행을 서로 반대 순서로 갱신해 deadlock을 만들고, 전체 트랜잭션 단위 재시도를 적용합니다.

**완료 기준:** 동시 요청에서도 unique 제약으로 중복 행이 생기지 않음을 확인합니다. 재시도는 실패 트랜잭션을 정리한 뒤 새 트랜잭션으로 수행하며, 중복 입력을 업무상 성공으로 취급할지 오류로 반환할지 명시합니다.

**버전 한계:** 구체적인 예외 클래스와 SQLState 매핑은 드라이버·ORM에 따라 다릅니다. 재시도 가능한 오류 분류와 backoff 정책은 애플리케이션 수준에서 정해야 합니다.

## 4. JPA flush, bulk DML, fetch join pagination

**출처 내용:** JPA의 `AUTO` flush에서는 조회 결과에 영향을 줄 수 있는 영속성 컨텍스트 변경을 조회 전에 반영해야 합니다. Bulk update/delete는 DB에 직접 반영되고 영속성 컨텍스트와 자동 동기화되지 않으며, cascade나 optimistic locking을 우회할 수 있습니다. [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [Spring Data JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

**실험 입력:** 엔티티 한 건의 필드를 바꾸고 같은 필드를 조건으로 하는 JPQL 조회를 실행해 SQL flush 시점을 기록합니다. 이어서 관리 중인 엔티티가 있는 상태에서 `@Modifying` bulk update를 수행하고, 동일 엔티티를 영속성 컨텍스트에서 다시 읽습니다. 마지막으로 부모 20건, 부모별 자식 3건을 만들고 컬렉션 fetch join으로 `Pageable` 첫 페이지(크기 5)를 조회합니다.

**완료 기준:** 조회 전 flush 여부와 bulk DML 후 메모리 객체/DB 값의 차이를 확인하고, clear/refresh 등 동기화 전략을 설명합니다. 페이지 결과가 루트 부모 5건인지, 조인 행 기준 제한으로 잘리거나 중복되는지 확인하고, 루트 ID 페이지 조회 후 연관 데이터 별도 조회 같은 대안을 제시합니다.

**버전 한계:** 명세는 Jakarta Persistence 3.2 기준이며, SQL 생성·fetch join pagination 경고 및 처리 방식은 Hibernate 등 provider에 따라 다릅니다. Spring Data의 페이지 count/query 재작성 동작도 버전에 따라 달라질 수 있습니다.

## 5. NULL, `NOT IN`, 집계 fanout

**출처 내용:** SQL의 `NULL`은 비교에서 미정 값을 만들며 `IN` 목록에 `NULL`이 있고 일치값이 없을 때 결과는 `NULL`이 될 수 있습니다. 집계 함수는 함수 종류와 인자에 따라 `NULL` 처리 방식이 다릅니다. 집계 전 조인으로 행이 증식하면 합계·개수가 부풀 수 있습니다. [Comparison Operators](https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html), [Aggregate Functions](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions-and-modifiers.html)

**실험 입력:** `orders(id, amount)` 2행과 `blocked_order(order_id)`에 `NULL` 한 행을 준비합니다. `NOT IN (SELECT order_id ...)`와 `NOT EXISTS` 결과를 비교합니다. 각 주문에 상품 2개와 결제 3개를 붙인 후 양쪽 테이블을 한 번에 조인해 `SUM(amount)`와 `COUNT(*)`를 실행하고, 먼저 주문별 집계한 결과와 비교합니다.

**완료 기준:** `NOT IN`이 예상보다 0행을 반환할 수 있는 이유를 3값 논리로 설명하고 NULL 처리 정책을 반영한 대안을 작성합니다. 조인 fanout으로 합계가 6배가 되는 입력을 설명하고, 집계 단위를 보존하는 쿼리를 제시합니다.

**버전 한계:** 비교·집계의 SQL 의미를 검증하는 항목입니다. 실행 계획과 집계 최적화의 세부는 인덱스 및 MySQL 버전에 좌우됩니다.

## 6. Online DDL, metadata lock, backfill

**출처 내용:** Online DDL이 동시 DML을 허용하더라도 완료 단계에서 metadata lock이 필요할 수 있고, 테이블을 사용하는 기존 트랜잭션이 끝날 때까지 기다릴 수 있습니다. 8.4 문서는 작업별 `INSTANT`/`INPLACE`/재구축 지원과 공간 요구사항을 구분합니다. [InnoDB Online DDL Operations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html), [Metadata Locking](https://dev.mysql.com/doc/refman/8.4/en/metadata-locking.html)

**실험 입력:** 세션 A에서 테이블을 조회한 뒤 트랜잭션을 열어 둡니다. 세션 B에서 해당 테이블에 `ALTER TABLE ... ADD INDEX`를 실행하고 대기 상태 및 `performance_schema.metadata_locks`를 관찰합니다. 별도 컬럼 추가 실험에서는 nullable 컬럼 추가 → PK 범위별 작은 batch backfill → 제약/인덱스 추가 순으로 수행하며 각 단계의 잠금·실행시간·재시작 지점을 기록합니다.

**완료 기준:** DDL 실행 단계와 최종 metadata lock 대기를 구분해 관찰합니다. Backfill은 반복 실행해도 같은 결과가 나고, 작은 batch 단위로 진행상태를 재개할 수 있어야 합니다. 적용한 `ALGORITHM`과 `LOCK` 옵션이 지원되지 않을 때 조용히 다른 방식으로 전환되지 않도록 확인합니다.

**버전 한계:** DDL 알고리즘 지원은 작업 종류, 테이블 구조, 8.4 마이너 버전에 따라 차이가 있습니다. “online”은 무잠금을 뜻하지 않습니다.

## 7. Connection pool 고갈과 timeout

**출처 내용:** HikariCP 풀 크기 한도에 도달하고 유휴 연결이 없으면 호출자는 `connectionTimeout`까지 연결을 기다린 뒤 예외를 받을 수 있습니다. Spring 실행기 역시 thread pool과 queue 용량이 과도한 대기·거부에 영향을 줍니다. [HikariCP README](https://github.com/brettwooldridge/HikariCP), [Spring Task Execution and Scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)

**실험 입력:** 실습 환경에서 pool size를 2, `connectionTimeout`을 1초로 설정합니다. 두 작업이 각각 연결을 얻고 3초간 트랜잭션을 유지하게 한 뒤 세 번째 요청을 즉시 제출합니다. 풀 active/idle/pending 지표와 연결 획득 시간을 기록합니다. 이후 트랜잭션 유지 시간을 줄여 다시 실행합니다.

**완료 기준:** 세 번째 요청의 연결 대기가 설정된 timeout 근방에서 실패하고, 첫 두 연결 반환 후 재실행이 성공함을 확인합니다. 장애 원인을 SQL 실행 지연과 연결 대기 지연으로 분리해 로그/지표에서 식별합니다.

**버전 한계:** HikariCP의 기본값과 최소 허용 timeout은 버전에 따라 다를 수 있으므로 실험에서는 값을 명시적으로 설정합니다. 개발 환경에서는 제한된 요청만 사용합니다.

## 8. Backup/restore 및 PITR

**출처 내용:** Point-in-time recovery는 보통 특정 시점의 full backup을 복원한 뒤 그 이후의 binary log를 재생해 목표 시각까지 적용합니다. MySQL 8.4 문서는 binary logging 기본 활성화 상태를 설명하지만, 실제 설정·보존·백업 정합성은 별도로 확인해야 합니다. [Point-in-Time Recovery](https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery.html), [Database Backup Methods](https://dev.mysql.com/doc/refman/8.4/en/backup-methods.html)

**실험 입력:** 격리된 MySQL 실습 환경에서 full backup을 만듭니다. 백업 뒤 marker row A를 삽입하고, 이어서 삭제문을 실행한 시각을 기록합니다. 백업을 별도 인스턴스에 복원하고 binary log를 삭제문 직전 시점까지 재생합니다.

**완료 기준:** 복구된 데이터에 marker row A가 있고 삭제문은 반영되지 않아야 합니다. 사용한 백업 시각, binlog 파일/position 또는 목표 시각, 복구 후 row 검증값을 기록합니다.

**버전 한계:** 백업 도구별 일관성 옵션과 binary log 형식·보존 설정은 구성마다 다릅니다. 문서 절차만으로 실제 백업 파일 복원 가능성을 입증할 수 없으므로 복구 리허설이 필요합니다.

## 9. Idempotency, outbox, 중복 메시지

**출처 내용:** Transactional outbox는 업무 데이터와 전송할 메시지를 같은 DB 트랜잭션에 기록해 원자성을 맞춥니다. 메시지 relay가 재전송할 수 있으므로 consumer는 중복을 감당해야 합니다. [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox), [Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html)

**실험 입력:** 주문 생성과 outbox 이벤트 기록을 같은 트랜잭션으로 구현합니다. relay가 전송 후 발행 완료 표시를 하기 전에 강제 종료되는 상황을 재현해 동일 `event_id`를 다시 발행합니다. Consumer에는 처리한 event ID에 unique 제약을 둡니다.

**완료 기준:** 주문은 한 번만 생성되고, 이벤트 중복 전달에도 업무 효과가 한 번만 적용됩니다. 재발행 기록과 중복 감지 결과를 확인합니다. DB와 broker 사이를 분산 트랜잭션으로 묶지 않는 한 exactly-once 전달이라고 표현하지 않습니다.

**버전 한계:** Outbox·idempotent consumer는 아키텍처 패턴이며 특정 Spring/MySQL 버전의 기본 보장이 아닙니다. 메시지 broker의 재시도·순서·확인 semantics는 선택한 broker 문서를 별도로 따라야 합니다.

## 10. DI singleton lifecycle과 thread safety

**출처 내용:** Spring singleton은 컨테이너·bean 정의당 공유 인스턴스입니다. 컨테이너는 생성된 singleton 인스턴스를 안전하게 공개하지만, bean 내부에 둔 가변 상태까지 자동으로 thread-safe하게 만들어주지는 않습니다. 생성·주입 후 lifecycle callback이 실행됩니다. [Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html), [Bean Lifecycle](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)

**실험 입력:** singleton `CounterService`에 일반 `int` 필드를 두고 여러 스레드에서 각각 10만 번 증가시키는 동기화 없는 메서드를 호출합니다. 관찰 후 `AtomicInteger` 또는 임계 구역 동기화를 적용해 다시 실행합니다. 초기화 callback에서 주입된 의존성 및 초기 상태를 기록하고, context 종료 시 destroy callback 실행도 확인합니다.

**완료 기준:** bean 인스턴스가 호출자 간 공유됨을 확인하고, 동시 증가에서 최종값이 요청 총합보다 작아질 수 있음을 관찰합니다. 동기화된 버전은 최종값을 정확히 맞추며, lifecycle callback 실행 시점과 종료 동작을 설명합니다.

**버전 한계:** singleton 범위와 lifecycle은 Spring Framework 기준입니다. Spring의 안전한 객체 공개가 비즈니스 필드 접근의 동시성 보장을 의미하지는 않습니다. MyBatis를 함께 쓰는 경우 `SqlSession`은 thread-safe하지 않으므로 singleton service 필드로 직접 공유하지 않습니다. [MyBatis-Spring Using API](https://mybatis.org/spring/using-api.html)

도구 가용성 확인 결과, 현재 세션에는 `mcp__codex_apps__search_service_web_run` 검색 도구가 있어 이를 사용했습니다. 외부 CLI 호출이나 Codex 대화형 실행은 하지 않았습니다.