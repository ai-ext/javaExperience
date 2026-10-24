# javaExperience 학습 공백 감사 — 공식 근거 목록

확인/마지막 페이지 fetch: **2026-10-21T00:17:42+09:00 KST**. 총 **35개** 공식 근거 레코드다. Spring Framework/Spring Data/Spring Boot, Jakarta Persistence/Transactions, Hibernate ORM, MySQL 공식 문서와 Spring Data JPA 4.1.1 공식 소스 tag만 사용했다.

3~6년차 경력에 대한 공식 교육 표준을 확인한 것은 아니다. 이 범위는 javaExperience가 목표로 한 실무 과제 수준에 대한 프로젝트별 역량 루브릭으로 취급해야 한다. 이 파일은 출처 색인이고, 최종 공백 판정표가 아니다.

전체 기계 판독 목록: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.json` (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.json`). 프로젝트/버전 근거: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/LOCAL_BASELINE.json` (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/LOCAL_BASELINE.json`). 원문 파일·SHA-256·다운로드 한계: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/fetch-manifest.json` (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/fetch-manifest.json`). 로컬 파일 대조표: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/LOCAL-FINDINGS.md` (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/LOCAL-FINDINGS.md`).

## 출처별 주장과 적용 한계

### spring-di — [Dependency Injection — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)

**주제 및 적용 범위:** IoC/DI/검증성; Spring Framework 7.0.9; Boot 4.1.1 프로젝트와 일치.

**뒷받침하는 주장**
- IoC는 객체 생성·의존성 조회를 객체 자신이 아니라 컨테이너에 맡기는 구조다.
- DI는 생성자/factory 메서드/프로퍼티를 통해 협력자를 외부에서 전달한다.
- 인터페이스 기반으로 의존성을 제공하면 test double 사용이 쉬워져 검증성이 높아진다.
- 생성자 순환 의존 그래프는 해결 불가하며 빈 생성 중 예외가 발생할 수 있다.

**주의/적용 한계**
- DI가 모든 테스트를 자동으로 단순하게 만들지는 않는다. 단위 테스트에서 직접 인스턴스화할 수 있다는 이점과 Spring 통합 테스트 필요를 구분한다.
- 저장소→서비스 의존 자체가 항상 오류인 것은 아니다. 실제 등록된 빈 그래프가 순환할 때 런타임 순환 의존이다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-ioc-di.html`.

### spring-bean-definition — [Bean Overview — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/definition.html)

**주제 및 적용 범위:** Bean; Spring Framework 7.0.x.

**뒷받침하는 주장**
- BeanDefinition은 타입, scope, lifecycle, constructor arguments와 collaborator metadata를 표현한다.
- Spring 컨테이너는 definition을 토대로 bean instance를 생성·조립한다.

**주의/적용 한계**
- 직접 new한 모든 Java 객체가 자동으로 Spring bean이 되는 것은 아니다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-bean-definition.html`.

### spring-bean-scopes — [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)

**주제 및 적용 범위:** Bean scope/lifecycle; Spring Framework 7.0.x.

**뒷받침하는 주장**
- singleton은 JVM/class 단위 GoF singleton이 아니라 container+bean-definition 단위로 하나다.
- prototype을 singleton에 주입하면 singleton 생성 때 주입된 한 인스턴스가 계속 사용된다.
- prototype의 destroy callbacks는 컨테이너가 호출하지 않는다.
- 요청/세션 scope는 web-aware ApplicationContext 범위다.

**주의/적용 한계**
- 고정 singleton 수명과 요청별 state는 분리해야 한다. scope proxy, ObjectProvider 또는 명시적 메서드 인자가 필요한 경우가 있다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-bean-scopes.html`.

### spring-lifecycle — [Customizing the Nature of a Bean — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)

**주제 및 적용 범위:** Bean lifecycle; Spring Framework 7.0.x.

**뒷받침하는 주장**
- 의존성 주입 이후 init/destroy callbacks가 실행된다.
- @PostConstruct·@PreDestroy는 Spring 전용 lifecycle interface와 결합되지 않는 방법이다.
- @PostConstruct 안의 외부 bean 호출/장시간 작업은 singleton creation lock 교착을 일으킬 수 있어 제한한다.

**주의/적용 한계**
- 정상 컨테이너 종료 시점의 lifecycle이며 강제 프로세스 종료까지 정리를 보장하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-bean-lifecycle.html`.

### spring-aop-proxy — [Proxying Mechanisms — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)

**주제 및 적용 범위:** AOP proxy/self invocation; Spring Framework 7.0.9; transaction AOP semantics도 관련.

**뒷받침하는 주장**
- Spring AOP는 proxy 기반이며 proxy를 통과한 외부 호출만 advice/interceptor 적용 대상이다.
- 같은 대상 객체 내부의 this.method() self invocation은 proxy를 우회한다.
- self-invocation 된 @Transactional/@Retryable 메서드의 advice는 실행되지 않을 수 있다.

**주의/적용 한계**
- AspectJ weaving은 proxy-based self-invocation 제한과 다르다. 이 프로젝트는 일반 Spring proxy 관례를 전제로 해야 한다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-aop-proxy.html`.

### spring-tx-annotation — [Using @Transactional — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)

**주제 및 적용 범위:** @Transactional defaults/readOnly; Spring Framework 7.0.9.

**뒷받침하는 주장**
- 기본 propagation REQUIRED, isolation DEFAULT, read-write; RuntimeException/Error rollback, checked Exception은 기본 rollback 대상 아님.
- Spring annotation에는 readOnly, propagation, isolation, rollbackFor 등 Spring 지원 속성이 있다.
- proxy가 기본이므로 self invocation은 가로채지 않는다.

**주의/적용 한계**
- Framework 6.2부터 ALL_EXCEPTIONS global rollback 기본을 선택 가능하므로 설정을 확인한다.
- annotation 메타데이터만으로 실제 트랜잭션이 생기는 것이 아니라 proxy/interceptor와 transaction manager를 통한 호출이어야 한다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-tx-annotations.html`.

### spring-tx-rollback — [Rolling Back a Declarative Transaction — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)

**주제 및 적용 범위:** rollback/checked/caught exception; Spring Framework 7.0.x.

**뒷받침하는 주장**
- 기본 rollback rule은 unchecked RuntimeException/Error; checked exception은 rollbackFor 설정이 없으면 rollback을 유발하지 않는다.
- transaction interceptor는 호출을 빠져나오는 예외와 rollback rules를 판단한다.
- 업무 코드가 예외를 잡아 정상 반환하면 interceptor가 그 예외를 보지 않으므로 자동 rollback하지 않는다.

**주의/적용 한계**
- JDBC/Hibernate가 이미 transaction을 rollback-only로 표시한 데이터베이스 예외는 단순히 catch했다고 다시 사용 가능한 transaction이 되지 않는다.
- 개별 rollback rule 및 global default는 적용 순서/설정을 확인한다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-tx-rollback.html`.

### spring-propagation — [Transaction Propagation — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)

**주제 및 적용 범위:** REQUIRED/REQUIRES_NEW/NESTED; Spring Framework 7.0.9.

**뒷받침하는 주장**
- REQUIRED는 바깥 transaction에 참여하며 보통 하나의 physical transaction을 공유한다.
- inner scope가 rollback-only를 설정하면 outer commit에서 UnexpectedRollbackException이 드러날 수 있다.
- REQUIRES_NEW는 독립 physical transaction이며 새 connection 필요로 pool pressure/deadlock 위험이 있다.
- NESTED는 하나의 physical transaction 안 JDBC savepoint에 매핑되며 manager 지원에 의존한다.
- 참여 중인 REQUIRED scope는 기본적으로 outer scope의 isolation/readOnly/timeout을 따른다.

**주의/적용 한계**
- Propagation의 동작은 transaction manager와 resource driver 지원에 따라 달라진다.
- NESTED를 JPA 독립 transaction이나 REQUIRES_NEW와 혼동하면 안 된다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-tx-propagation.html`.

### spring-tx-thread-bound — [Understanding Declarative Transaction Implementation — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html)

**주제 및 적용 범위:** transaction thread binding/proxy; Spring Framework 7.0.x.

**뒷받침하는 주장**
- 선언형 트랜잭션은 AOP proxy와 TransactionInterceptor로 실행된다.
- imperative PlatformTransactionManager transaction은 현재 실행 thread에 bind된다.
- 새로 시작한 thread/ExecutorService worker로 transaction context는 자동 전파되지 않는다.

**주의/적용 한계**
- Reactive transaction은 Reactor Context를 사용하므로 imperative thread-local 설명을 그대로 적용하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-thread-bound-tx.html`.

### spring-test-thread-bound — [Transaction Management in TestContext Framework](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)

**주제 및 적용 범위:** @Transactional test/concurrent test; Spring Framework 7.0.9.

**뒷받침하는 주장**
- 테스트 @Transactional은 현재 테스트 thread에 test-managed transaction을 bind한다.
- ExecutorService로 시작한 worker들은 그 테스트 thread transaction에 자동 참여하지 않고 별도 transaction/autocommit 효과를 낼 수 있다.
- 테스트 method transaction은 기본적으로 끝에서 rollback된다.

**주의/적용 한계**
- 문서는 preemptive timeout 사례를 예로 들지만 그 ThreadLocal 원리는 별도 worker thread에도 적용된다. 동시성 테스트는 cleanup/commit 관찰점을 별도 설계한다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-test-thread-tx.html`.

### spring-data-jpa-tx — [Transactionality — Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html)

**주제 및 적용 범위:** Service business-unit transaction/readOnly; Spring Data JPA 4.1.1.

**뒷받침하는 주장**
- Spring Data는 여러 repository operation을 하나의 unit of work로 묶을 때 facade/service method에 transaction boundary를 선언하는 방식을 권한다.
- readOnly=true는 JDBC hint이며 쓰기 금지 보안 검사로 보장되지 않는다.
- Hibernate 사용 시 Spring Data JPA는 read-only transaction에서 flush mode를 MANUAL로 설정해 dirty checking을 생략할 수 있다.

**주의/적용 한계**
- provider/transaction manager/DB에 따라 실제 최적화·쓰기 제한은 다르다. 한 MySQL 버전/provider의 성능효과를 무측정으로 단정하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-data-jpa-transactions.html`.

### spring-jdbc-enforce-readonly — [DataSourceTransactionManager Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/DataSourceTransactionManager.html)

**주제 및 적용 범위:** readOnly enforcement; Spring Framework 7.0.9 API.

**뒷받침하는 주장**
- 기본 Connection.setReadOnly(true)는 JDBC hint다.
- explicit SET TRANSACTION READ ONLY enforcement는 manager 설정으로 별도 적용할 수 있고 MySQL을 포함한 DB에 명시 SQL을 전송한다.

**주의/적용 한계**
- Jdbc transaction manager 옵션으로 모든 JpaTransactionManager가 자동 적용한다고 일반화하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-read-only-tx-manager.html`.

### jakarta-tx-annotation — [Jakarta Transactions Transactional API](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/transaction/transactional)

**주제 및 적용 범위:** Jakarta @Transactional vs Spring @Transactional; Jakarta Transactions 2.0 API shape; Spring also accepts this standard annotation.

**뒷받침하는 주장**
- jakarta.transaction.Transactional의 표준 attributes는 TxType value, rollbackOn, dontRollbackOn이며 readOnly 속성이 없다.
- Jakarta 표준 기본 rollback은 unchecked RuntimeException 계열이며 checked exception은 기본 rollback 대상이 아니다.
- Spring의 org.springframework.transaction.annotation.Transactional은 별도 readOnly/rollbackFor 속성을 제공한다.

**주의/적용 한계**
- Jakarta annotation은 CDI/Jakarta EE interceptor 규격을 정의한다. Spring 지원은 Spring의 metadata adapter를 통해 호환되며 모든 Spring 전용 속성이 자동 생기지 않는다.
- Confidence: high.
- Fetch 상태: browser page fetch successful; direct raw HTTP endpoint returned 404.

### jakarta-persistence-spec — [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

**주제 및 적용 범위:** Entity/EntityManager/relationship ownership; Jakarta Persistence 3.2.0; Boot 4.1.1 BOM.

**뒷받침하는 주장**
- entity class에는 public/protected no-arg constructor가 필요하며 entity class, methods, persistent fields는 non-final 조건을 가진다.
- new/managed/detached/removed 상태와 transaction persistence-context lifecycle 정의.
- merge는 detached state를 managed copy에 복사하고 managed instance를 반환한다. 원본이 같은 instance가 아닐 수 있다.
- flush는 persistence context 변경을 DB에 동기화하며 commit과 동일하지 않다.
- 양방향 관계에서는 owning side가 DB 관계 업데이트를 결정하고 mappedBy가 inverse side를 표시한다.
- orphanRemoval은 부모가 private-owned인 association에 사용하도록 설계됐다.
- EntityManager/persistence context는 concurrent thread 간 공유 불가; thread-safe 보장 없음.

**주의/적용 한계**
- 명세는 provider-neutral이다. SQL 발생 시점, provider optimization, database lock 동작을 정하지 않는다.
- EntityManagerFactory는 thread-safe일 수 있어도 개별 EntityManager/persistence context는 별도다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/jakarta-persistence-3-2-spec.html`.

### jakarta-entitymanager-api — [EntityManager API Javadoc](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html)

**주제 및 적용 범위:** EntityManager operations; Jakarta Persistence 3.2.0.

**뒷받침하는 주장**
- persist는 새 entity를 managed 상태로 만든다.
- managed state 변경은 자동 dirty checking 대상이며 명시 update/save가 필수는 아니다.
- merge는 managed copy를 반환하고 전달 객체와 다른 object identity를 가질 수 있다.
- AUTO flush는 결과 영향을 받는 query 전 flush 가능; COMMIT flush는 transaction commit 전.
- clear/detach는 미flush 변경을 DB에 쓰지 않고 떼어낼 수 있다.

**주의/적용 한계**
- JPA API contract는 Hibernate/MySQL SQL 구체 동작을 규정하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/jakarta-entitymanager-api.html`.

### spring-data-new-state — [Entity State Detection Strategies — Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/data-commons/is-new-state-detection.html)

**주제 및 적용 범위:** Repository save/persist/merge; Spring Data JPA 4.1.1.

**뒷받침하는 주장**
- save()는 isNew 판정 후 persist 또는 merge를 호출한다.
- 기본은 nullable @Version이 있으면 null 여부로 먼저 판단하고, 없으면 id null/primitive 0 여부를 본다.
- assigned non-null id + version 없음이면 기본적으로 existing으로 간주해 merge 경로를 탄다. DB row 존재 여부를 먼저 확인한다는 뜻이 아니다.
- Persistable 구현은 isNew()로 전략을 바꾼다.

**주의/적용 한계**
- merge 반환값을 사용해야 한다. merge는 request DTO를 덮어쓰듯 안전하게 patch하지 않는다.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-data-new-state.html`.

### spring-data-derived-delete — [Spring Data JPA 4.1.1 Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

**주제 및 적용 범위:** derived delete/count semantics; Spring Data JPA 4.1.1.

**뒷받침하는 주장**
- derived delete는 먼저 matching entities query, then EntityManager.remove per entity 방식이며 @PreRemove lifecycle semantics를 유지한다.
- 4.1.1 implementation의 numeric return은 database DELETE affected-row count가 아니라 미리 조회한 resultList.size()다.
- @Modifying @Query bulk delete는 single executeUpdate SQL이고 persistence context synchronization/lifecycle semantics가 달라진다.

**주의/적용 한계**
- 동시 delete race에서 두 번째 manager/provider SQL affected-row behavior, exception, rollback outcome는 실제 DB/provider에서 검증해야 한다. 카운터 감소는 이 return type을 affected-row evidence라고 단정하지 말아야 한다.
- Confidence: high for implementation semantics; medium for race outcome.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-data-jpa-derived-delete.html`.
- 구현 소스 URL: [https://github.com/spring-projects/spring-data-jpa/blob/4.1.1/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/query/JpaQueryExecution.java](https://github.com/spring-projects/spring-data-jpa/blob/4.1.1/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/query/JpaQueryExecution.java); pinned tag 4.1.1.

### spring-data-jpa-delete-code — [JpaQueryExecution.java at Spring Data JPA 4.1.1 tag](https://github.com/spring-projects/spring-data-jpa/blob/4.1.1/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/query/JpaQueryExecution.java)

**주제 및 적용 범위:** implementation detail: derived delete return; exact 4.1.1 source tag.

**뒷받침하는 주장**
- DeleteExecution calls getResultList(), loops em.remove(o), and for numeric/void simple-batch return returns resultList.size().

**주의/적용 한계**
- This shows Spring Data's selected-result count contract, not committed SQL row count under a concurrent race.
- Confidence: high.
- Fetch 상태: official GitHub page fetched via web; raw source capture pending.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-data-jpa-deleteexecution-4.1.1.java`.

### hibernate-7-4-user-guide — [Hibernate ORM 7.4 User Guide](https://docs.hibernate.org/orm/7.4/userguide/html_single/)

**주제 및 적용 범위:** Hibernate persistence context/fetch/locking; 7.4 line; latest guide page fetched reports 7.4.13.Final; project BOM pins 7.4.5.Final.

**뒷받침하는 주장**
- Hibernate persistence context is a write-behind cache; changes sync at flush.
- Fetch plans (join/select/batch/entity graph) and N+1 are provider-specific behavior to measure.
- @Version optimistic locking compares stored version to detect concurrent stale update.
- Flush MANUAL can suppress ordinary auto flush unless explicit flush.
- Hibernate 7.4 dedicates a section to entity equals/hashCode; there is no single recommended entity implementation for every lifecycle, proxy, and collection case.
- @Version prevents last-commit-wins lost updates for versioned fields; attributes explicitly excluded from optimistic locking may still be overwritten.

**주의/적용 한계**
- Fetched 7.4.13 guide is a later patch than the project's 7.4.5.Final. Use it for 7.4 concepts, but confirm patch-specific behavior against 7.4.5 source/repro.
- Native Hibernate details are not necessarily portable JPA guarantees.
- Confidence: high for 7.4 concepts; medium for exact patch behavior.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/hibernate-7-4-user-guide.html`.

### hibernate-7-4-intro — [A Short Guide to Hibernate 7](https://docs.hibernate.org/orm/7.4/introduction/html_single/)

**주제 및 적용 범위:** Hibernate implementation behavior; Hibernate ORM 7.4 line; page patch may be later than BOM.

**뒷받침하는 주장**
- Persistence context change tracking, flush, fetching, locking and entity equality topics at an overview level.

**주의/적용 한계**
- Not a JPA standard; provider specifics require User Guide and exact version checks.
- Confidence: medium.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/hibernate-7-4-introduction.html`.

### spring-boot-bom — [Spring Boot 4.1.1 Managed Dependency Coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)

**주제 및 적용 범위:** project versions; Spring Boot 4.1.1 BOM.

**뒷받침하는 주장**
- Boot 4.1.1 BOM supplies coordinated library versions including Hibernate ORM, Spring Data JPA, Spring Framework, Jakarta Persistence and MySQL Connector/J.

**주의/적용 한계**
- Project build declares versions; BOM managed versions are verified from official coordinates and the cached boot-dependencies POM. A running server version is independent from the JDBC driver version.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-boot-coordinates.html`.

### mysql-innodb-transactions — [InnoDB Locking and Transaction Model — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-transaction-model.html)

**주제 및 적용 범위:** MySQL transactions/locking; MySQL Server 8.4 manual; project compose uses 8.4 and parent reports isolated MySQL 8.4.11 run.

**뒷받침하는 주장**
- InnoDB transaction isolation, locking reads, row/table locks, deadlocks and transaction scheduling behavior are database-specific.

**주의/적용 한계**
- This subagent did not execute MySQL. Manual supports 8.4 semantics; exact local 8.4.11 runtime is parent-reported test evidence.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-isolation — [InnoDB Transaction Isolation Levels — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

**주제 및 적용 범위:** MySQL isolation/visibility; MySQL 8.4.

**뒷받침하는 주장**
- InnoDB REPEATABLE READ default and READ COMMITTED snapshot visibility differ.
- Consistent reads and locking/current reads have different semantics; transaction isolation does not make arbitrary application read-modify-write logic atomic.

**주의/적용 한계**
- Visibility of concurrent commits depends on isolation level and read type; explain snapshot vs SELECT FOR UPDATE when teaching two-transaction behavior.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-consistent-read — [Consistent Nonlocking Reads — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)

**주제 및 적용 범위:** snapshot visibility; MySQL 8.4 InnoDB.

**뒷받침하는 주장**
- REPEATABLE READ consistent reads in a transaction use a snapshot established by first consistent read; READ COMMITTED uses a fresh snapshot for each consistent read.

**주의/적용 한계**
- This is not equivalent to what a locking read sees.
- Confidence: high.
- Fetch 상태: web open successful; direct raw HTTP download returned 403.

### mysql-locking-reads — [Locking Reads — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)

**주제 및 적용 범위:** locking reads/lost update; MySQL 8.4 InnoDB.

**뒷받침하는 주장**
- SELECT FOR UPDATE / FOR SHARE request row locks; ordinary SELECT under snapshot semantics does not itself prevent concurrent writers from modifying selected rows.

**주의/적용 한계**
- Use only where business invariant requires row serialization; transaction/lock ordering and deadlocks need handling.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-unique-constraints — [PRIMARY KEY and UNIQUE Index Constraints — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/constraint-primary-key.html)

**주제 및 적용 범위:** unique likes/idempotency; MySQL 8.4 with transactional InnoDB.

**뒷받침하는 주장**
- Unique constraint is a database-enforced invariant for one row per (post_id, member_id).
- duplicate violation aborts that statement and for InnoDB is transactional.

**주의/적용 한계**
- A unique constraint prevents duplicate rows, but it does not itself define endpoint idempotent response semantics or keep a denormalized like_count correct.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-ignore — [Server SQL Modes: Effect of IGNORE — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html)

**주제 및 적용 범위:** INSERT IGNORE caveat; MySQL 8.4.

**뒷받침하는 주장**
- INSERT IGNORE can skip duplicate-key rows with warning.
- IGNORE downgrades several ignorable errors to warnings, including bad null, duplicate key, missing FK row, and some conversion errors; it is broader than duplicate-like handling.
- Thus an affected count of 0 alone does not prove a like already existed.

**주의/적용 한계**
- Exact warning/error and affected count depend on SQL mode, row shape, constraints, client/driver. Check warnings or use a narrowly scoped conflict strategy.
- Confidence: high for warning behavior; medium for JPA native-query result mapping until integration-tested.
- Fetch 상태: web open successful; direct raw HTTP download returned 403.

### mysql-row-count — [Information Functions / ROW_COUNT — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/information-functions.html)

**주제 및 적용 범위:** affected rows; MySQL 8.4.

**뒷받침하는 주장**
- MySQL exposes statement affected rows/ROW_COUNT, but statement and driver reporting conventions vary, especially INSERT ... ON DUPLICATE KEY UPDATE and CLIENT_FOUND_ROWS.

**주의/적용 한계**
- Do not assume a Spring Data derived delete's return value is this MySQL row count; inspect the actual API execution path.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-deadlocks — [How to Minimize and Handle Deadlocks — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html)

**주제 및 적용 범위:** deadlock retry; MySQL 8.4 InnoDB.

**뒷받침하는 주장**
- deadlocks are possible with correct transactional code, lock ordering/indexes affect them, application should tolerate/retry appropriate transactions.

**주의/적용 한계**
- Retry entire transaction in a fresh transaction after deadlock; never replay only one SQL statement inside transaction marked rollback-only.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### mysql-readonly — [Optimizing InnoDB Read-Only Transactions — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-performance-ro-txn.html)

**주제 및 적용 범위:** database read-only behavior; MySQL 8.4 InnoDB.

**뒷받침하는 주장**
- MySQL has server transaction read-only optimizations/explicit read-only semantics distinct from a Spring hint.

**주의/적용 한계**
- Spring @Transactional(readOnly=true) does not necessarily issue server SET TRANSACTION READ ONLY unless a manager is specifically configured to enforce it.
- Confidence: high.
- Fetch 상태: web search/open successful; direct raw HTTP download returned 403.

### spring-transactiontemplate-default — [DefaultTransactionDefinition Javadoc — Spring Framework](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/DefaultTransactionDefinition.html)

**주제 및 적용 범위:** TransactionTemplate propagation; Spring Framework 7.0.9 API.

**뒷받침하는 주장**
- DefaultTransactionDefinition base of TransactionTemplate defaults to PROPAGATION_REQUIRED, ISOLATION_DEFAULT, TIMEOUT_DEFAULT, readOnly=false.
- REQUIRED participates in current tx and creates a new one only if no transaction exists.

**주의/적용 한계**
- TransactionTemplate does not inherently mean a new transaction per execute call; explicitly set REQUIRES_NEW when independent transaction semantics are intended.
- Confidence: high.

### spring-shared-entitymanager — [JPA — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/orm/jpa.html)

**주제 및 적용 범위:** EntityManager proxy and thread-safety; Spring Framework 7.0.x; Boot 4.1.1.

**뒷받침하는 주장**
- @PersistenceContext default transaction-scoped shared EntityManager is a shared thread-safe proxy.
- The proxy delegates to the actual transaction-bound EntityManager; do not share that underlying persistence context concurrently across worker threads.

**주의/적용 한계**
- A thread-safe proxy does not make an EntityManager or Hibernate Session concurrently usable. Jakarta Persistence forbids sharing one EM across concurrent threads.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/spring-shared-entity-manager.html`.

### hibernate-basic-collections — [Hibernate ORM 7.4 User Guide, Basic collection mapping](https://docs.hibernate.org/orm/7.4/userguide/html_single/#basic-collection-mapping)

**주제 및 적용 범위:** provider-specific basic collection mapping; Hibernate ORM 7.4 line; project BOM 7.4.5.Final, source guide fetched at 7.4.13.Final.

**뒷받침하는 주장**
- Hibernate supports collection-of-basic values without @ElementCollection as a provider-specific basic-collection mapping in 7.4.
- Fallback SQL representation depends on dialect/database array support and may be ARRAY, JSON, XML, or VARBINARY.

**주의/적용 한계**
- A context-load success or H2 schema is not proof of portable JPA mapping or MySQL 8.4 behavior. Parent reports a separate MySQL 8.4.11 isolated baseline context-load result; persistence/read/write behavior still needs MySQL-specific verification.
- Confidence: high for Hibernate 7.4 mapping; medium for exact dialect behavior at pinned 7.4.5.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/hibernate-7-4-user-guide.html`.

### jakarta-persistence-entity-class — [Jakarta Persistence 3.2 Entity Class Requirements](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#the-entity-class)

**주제 및 적용 범위:** entity class contract; Jakarta Persistence 3.2.0.

**뒷받침하는 주장**
- JPA entity requires public or protected no-argument constructor and must be non-final; methods and persistent instance variables must be non-final.

**주의/적용 한계**
- Hibernate bytecode enhancement/proxy specifics are provider-specific, but these are portable spec requirements.
- Confidence: high.
- 원문 사본: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/official/jakarta-persistence-3-2-spec.html`.

### spring-boot-circular-beans — [Spring Boot application-properties reference: allow-circular-references](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

**주제 및 적용 범위:** Spring bean cycles; Spring Boot 4.1.1 property reference.

**뒷받침하는 주장**
- Boot's spring.main.allow-circular-references property default is false.
- A repository injecting a service that injects that same repository creates a runtime circular dependency only if the actual Spring bean graph forms that cycle.
- Spring Framework documents constructor cycles as unresolvable; setter cycles may be partially resolved in some cases, but Boot 4.1.1 defaults spring.main.allow-circular-references=false.

**주의/적용 한계**
- Layering direction is a design rule, not a framework prohibition. Do not claim 'repository calls service' always prevents application startup without verifying actual bean edges and injection style.
- Confidence: high.

## 프로젝트 버전과 구체 주의사항

`$REPO_ROOT/build.gradle`과 네 worktree의 `build.gradle`은 Spring Boot 4.1.1 / Java 21 toolchain을 선언한다. 캐시된 Boot 4.1.1 BOM POM은 Spring Framework 7.0.9, Hibernate ORM 7.4.5.Final, Jakarta Persistence 3.2.0, MySQL Connector/J 9.7.0을 관리한다. MySQL Connector/J는 드라이버 버전이며 MySQL Server 버전은 별개다.
`$REPO_ROOT/compose.yaml` 및 `$REPO_ROOT/src/test/resources/application-test.yml`은 MySQL 8.4 계열을 선택한다. 메인 담당자가 별도 isolated copy 실행에서 server 8.4.11/JDK21을 확인했다고 전달했다. 이 조사자는 해당 실행을 재실행하지 않았다. 이 실행환경의 `java --version` 기본값은 Corretto 11.0.22지만 프로젝트 toolchain은 Java 21이다. H2 runtime 의존성이 존재한다는 사실은 MySQL 동시성·스키마 결과 증거가 아니다.
Hibernate ORM 7.4 User Guide 페이지는 7.4.13.Final로 표시됐다. 프로젝트 BOM의 7.4.5.Final보다 후속 patch이므로 7.4 개념 근거로 사용하고, patch-specific behavior는 버전 고정 확인 또는 실행으로 검증해야 한다.
공식 dev.mysql.com 8.4 문서는 web search와 page open으로 본문을 실제 확인했지만 자동 raw-download 요청은 HTTP 403이었다. Jakarta Transactions `@Transactional` Javadoc은 web fetch 성공, 직접 raw endpoint 404였다. 이 retrieval limitation을 JSON과 manifest에 남겼고 기억으로 대체하지 않았다.
이 조사자는 repository/worktree를 수정하지 않았고 Gradle, Docker, Spring server, MySQL/H2 DB를 실행하지 않았다. exact effective runtime, schema, generated SQL, concurrency outcome는 main이 제공한 isolated test evidence 또는 별도 MySQL integration test로 한정한다.

## 특정 판정에서 구분해야 할 문맥

- **@Transactional 이름 충돌**: 학습 코드의 `jakarta.transaction.Transactional`은 JTA standard annotation이며 `readOnly` 속성이 없다. rollback override는 `rollbackOn`/`dontRollbackOn`. `org.springframework.transaction.annotation.Transactional`에는 Spring-specific `readOnly`, `rollbackFor`/`noRollbackFor`가 있다.
- **TransactionTemplate**: 기본 REQUIRED라 현재 transaction이 있으면 참여하고 없을 때만 새 physical tx를 시작한다. “매 execute가 항상 독립 새 transaction”이라고 가르치려면 REQUIRES_NEW가 명시되어야 한다. 동시 요청 테스트에서 별도 executor threads는 현재 test thread의 transaction을 공유하지 않는다.
- **AOP/self-invocation**: @Transactional 같은 proxy advice는 Spring proxy를 통과하는 외부 호출에 붙고 this.method()는 proxy를 우회한다. repository→service 방향 자체가 startup failure라는 뜻은 아니지만 실제 service→repository→same service bean circular graph는 위험하고 Boot 4.1.1 circular refs 기본은 false.
- **EntityManager**: injection된 Spring shared EntityManager proxy는 여러 thread에서 호출할 수 있는 facade일 수 있지만 실제 transaction-bound EntityManager/persistence context는 concurrent thread 사이에 공유하면 안 된다.
- **Derived delete**: Spring Data JPA 4.1.1 공식 reference는 derived delete가 대상 SELECT 후 각 entity를 `remove`한다고 설명하고, 정확한 4.1.1 implementation numeric return은 `resultList.size()`다. 이는 native DML affected-row count가 아니다. race outcome은 versionless delete 및 MySQL/ORM 동작으로 추가 재현해야 한다.
- **INSERT IGNORE**: MySQL은 중복 unique key 외에도 여러 무시 가능한 오류를 warning으로 강등한다. affected count 0만으로 “이미 좋아요”를 유일하게 판정할 수 없다.
- **Entity mapping / Hibernate extension**: JPA 3.2 portable entity는 non-final class와 public/protected no-arg constructor를 요구한다. Hibernate 7.4는 @ElementCollection 없이 basic collection을 provider-specific로 매핑할 수 있지만 ARRAY/JSON/XML/VARBINARY 선택은 DB dialect에 달렸다.
- **실무 범위**: `(post_id, member_id)` unique key는 중복 관계행을 막을 뿐 API idempotency semantics나 materialized like_count 정확성을 단독 보장하지 않는다. row-count semantics, counter update, rollback atomicity, retry boundary를 각각 확인한다.
- **연차**: 공식 출처들은 개념·API 계약을 정할 뿐 3~6년차의 보편적 학습/숙련도 기준을 정하지 않는다. 최종 점수는 프로젝트 과제 기반의 기대역량으로 명시한다.
