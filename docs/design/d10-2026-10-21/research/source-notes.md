# 출처 메모

확인일은 모두 2026-10-21이다. 아래 요약은 열어 본 공식 문서의 짧은 의역이다. 원문 문장을 길게 옮기지 않았다. IDs는 `/Users/ds/research/javaexperience-d10-20261021/sources.json`과 연결된다.

- **S01 PostgreSQL current** — 페이지가 실제 `PostgreSQL 18.6 Documentation`으로 제목을 표시하고 Supported Versions에서 Current를 18로 표시했다. `/docs/current/`는 버전 고정 URL이 아니며 확인 시점의 current를 나타낸다.
- **S02 PostgreSQL constraints** — CHECK는 식이 거짓인 행을 거부하며 NULL 결과는 통과한다. UNIQUE의 기본 NULL 처리와 `NULLS NOT DISTINCT`, PK의 비NULL 성격, FK 참조 대상 키 조건을 설명한다. PostgreSQL은 FK 자식 열 인덱스를 자동 생성하지 않는다고 명시한다.
- **S03 PostgreSQL SELECT** — FROM에서 입력을 구성하고 WHERE에서 행을 걸러 그룹/집계/HAVING을 처리하는 SELECT 구조를 설명한다. 결과 정렬은 ORDER BY 절로 요구해야 한다. LEFT JOIN의 왼쪽 행 보존과 NULL 확장 행을 읽는 근거로 사용했다.
- **S04 PostgreSQL aggregate functions** — 집계 함수는 입력값 집합에서 결과 하나를 계산한다. 보고서의 COUNT와 SUM 차이는 이 정의와 COUNT 표현식별 NULL 동작에 기초한다.
- **S05 PostgreSQL subquery expressions** — EXISTS는 서브쿼리가 한 행 이상을 반환하는지 평가하며 Boolean 결과를 낸다. EXISTS 자체에는 원고에 없는 주문 상태 조건이 추가되지 않는다.
- **S06 PostgreSQL UPDATE** — UPDATE의 대상과 WHERE 조건을 정의한다. 동시 갱신 시 행을 기다린 뒤 최신 버전의 조건을 다시 확인하는 문맥이 있어 조건부 갱신의 해석 근거가 된다.
- **S07 PostgreSQL EXPLAIN** — 계획은 데이터와 통계 속성에 맞춰 선택된다. 추정 cost/rows, 실제 실행을 하는 EXPLAIN ANALYZE, 실행시간·버퍼 정보의 해석을 다룬다.
- **S08 PostgreSQL multicolumn indexes** — 복합 B-tree에서 선두 컬럼의 조건이 범위 축소에 중요하다. 선두 필터가 없을 때 skip scan을 고려할 수 있는 예외와 조건도 설명한다.
- **S09 PostgreSQL index-only scans** — INCLUDE로 인덱스에 반환 컬럼을 포함할 수 있지만 MVCC visibility map에 따라 heap 확인이 남을 수 있다.
- **S10 PostgreSQL transaction isolation** — READ COMMITTED는 statement snapshot, REPEATABLE READ는 첫 일반 문장 snapshot, SERIALIZABLE은 직렬 실행 가능성을 보장하고 실패를 반환할 수 있다.
- **S11 PostgreSQL explicit locking** — 행 잠금과 충돌 대기를 설명하며 서로의 잠금을 순환 대기하는 데드락을 풀기 위해 한 트랜잭션을 중단한다.
- **S12 PostgreSQL high availability/replication** — 비동기 전파는 replica에 오래된 읽기를 만들고 승격 시 아직 반영되지 않은 트랜잭션을 잃을 수 있다.
- **S13 PostgreSQL SQL dump** — `pg_dump`는 일관된 시점의 논리 덤프를 생성하고 별도 복원 과정을 필요로 한다. replica와 별도 백업의 역할 구분을 보완한다.
- **S14 MongoDB Database Manual** — Transactions 페이지는 다중 문서 ACID transactions를 설명한다. Schema Validation 페이지는 flexible schema와 선택적 타입·범위 검증을 설명한다. 두 URL 모두 본문 헤더의 Current는 9.0이었다.
- **S15 MySQL primary/unique constraints** — MySQL 8.4의 PK와 UNIQUE 인덱스 조건, NULL 허용 차이를 확인했다.
- **S16 MySQL foreign keys** — InnoDB 참조 제약의 부모 인덱스 요구와 지원 자식 인덱스의 자동 생성을 설명한다.
- **S17 MySQL isolation levels** — 기본 REPEATABLE READ와 일관 읽기 스냅샷, locking read의 구별을 확인했다.
- **S18 MySQL next-key locking** — InnoDB의 next-key 잠금은 레코드와 인접 간격을 함께 잠가 특정 범위 삽입을 막을 수 있다. 접근 인덱스·조건과 함께 해석해야 한다.
- **S19 SQLite EXPLAIN QUERY PLAN** — SCAN/SEARCH 같은 계획 용어를 제공하지만 출력 형식은 안정 API가 아니며 버전에서 바뀔 수 있다고 경고한다.
- **S20 SQLite WAL** — reader의 snapshot과 writer 하나 제약, SQLITE_BUSY 가능성을 설명한다. 이를 PostgreSQL row lock/deadlock으로 부르지 않는 근거다.
- **S21 SQLite foreign keys** — FK enforcement는 기본 비활성 상태이며 각 연결에서 활성화해야 한다. 트랜잭션 안에서 pragma를 바꾸지 못하는 제약과 인덱스 고려도 제시한다.
- **S22 Python 3.14 sqlite3** — 페이지의 실제 제목은 Python 3.14.8이다. Connection의 autocommit, isolation_level, 명시적 트랜잭션 API를 다룬다.
- **S23 HikariCP 공식 저장소** — maximumPoolSize가 유휴/사용 중 연결의 상한이며 풀이 가득 차면 connectionTimeout까지 요청이 기다릴 수 있다는 설정 의미를 확인했다.
- **S24 UTA Lecture Notes on Database Normalization** — 강의노트 본문에서 candidate key를 minimal superkey로 정의하고, 2NF의 모든 후보키/proper subset/비주요 속성 조건과 3NF의 “좌변은 superkey 또는 우변은 prime attribute” 조건을 확인했다. 키 요약이 놓치는 경우도 설명한다. 자료 자체가 2012년 작성·2014년 개정이라고 표기한다.

## 원문 URL/버전 주의

원고의 PostgreSQL `current` 인용은 확인 시점 헤더를 함께 기록하고, 학습 본문의 제품 근거는 `/docs/18/` 고정 URL을 우선했다. MySQL 기능 근거는 `/refman/8.4/` 고정 페이지의 헤더에서 버전을 확인했다. MongoDB 및 SQLite 공식 문서는 확인 당시 current 헤더도 기록했다. SQLite와 HikariCP는 버전 고정 URL이 아닌 공식 문서/저장소 페이지라서 보고서에서 확인 범위를 해당 페이지 내용으로 한정했다.
