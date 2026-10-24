# Spring Architecture 공식 근거 목록

확인 시각(원 조사): **2026-10-21T00:17:42+09:00 KST**. 총 **35개** 출처 레코드를 포함한다.

출처는 Spring Framework/Boot/Data, Jakarta, Hibernate, MySQL, RFC, 프로젝트 공식 코드 tag 등 1차 자료다. 원자료 사본과 다운로드 한계는 [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/fetch-manifest.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/fetch-manifest.json)에 둔다. 원 조사 시각은 2026-10-21 00:17:42 KST이며, 본 census 날짜도 2026-10-21이다. 아래는 원 조사 결과 재사용이며 이번 턴에서 35개 페이지를 모두 재-fetch하지 않았다.

## spring-di — [Dependency Injection — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)

- 주제/적용 버전: IoC/DI/검증성 / Spring Framework 7.0.9; Boot 4.1.1 프로젝트와 일치
- 뒷받침하는 주장:
  - IoC는 객체 생성·의존성 조회를 객체 자신이 아니라 컨테이너에 맡기는 구조다.
  - DI는 생성자/factory 메서드/프로퍼티를 통해 협력자를 외부에서 전달한다.
  - 인터페이스 기반으로 의존성을 제공하면 test double 사용이 쉬워져 검증성이 높아진다.
  - 생성자 순환 의존 그래프는 해결 불가하며 빈 생성 중 예외가 발생할 수 있다.
- 주의·한계:
  - DI가 모든 테스트를 자동으로 단순하게 만들지는 않는다. 단위 테스트에서 직접 인스턴스화할 수 있다는 이점과 Spring 통합 테스트 필요를 구분한다.
  - 저장소→서비스 의존 자체가 항상 오류인 것은 아니다. 실제 등록된 빈 그래프가 순환할 때 런타임 순환 의존이다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-ioc-di.html
- 신뢰도: high

## spring-bean-definition — [Bean Overview — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/core/beans/definition.html)

- 주제/적용 버전: Bean / Spring Framework 7.0.x
- 뒷받침하는 주장:
  - BeanDefinition은 타입, scope, lifecycle, constructor arguments와 collaborator metadata를 표현한다.
  - Spring 컨테이너는 definition을 토대로 bean instance를 생성·조립한다.
- 주의·한계:
  - 직접 new한 모든 Java 객체가 자동으로 Spring bean이 되는 것은 아니다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-bean-definition.html
- 신뢰도: high

## spring-bean-scopes — [Bean Scopes — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)

- 주제/적용 버전: Bean scope/lifecycle / Spring Framework 7.0.x
- 뒷받침하는 주장:
  - singleton은 JVM/class 단위 GoF singleton이 아니라 container+bean-definition 단위로 하나다.
  - prototype을 singleton에 주입하면 singleton 생성 때 주입된 한 인스턴스가 계속 사용된다.
  - prototype의 destroy callbacks는 컨테이너가 호출하지 않는다.
  - 요청/세션 scope는 web-aware ApplicationContext 범위다.
- 주의·한계:
  - 고정 singleton 수명과 요청별 state는 분리해야 한다. scope proxy, ObjectProvider 또는 명시적 메서드 인자가 필요한 경우가 있다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-bean-scopes.html
- 신뢰도: high

## spring-lifecycle — [Customizing the Nature of a Bean — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)

- 주제/적용 버전: Bean lifecycle / Spring Framework 7.0.x
- 뒷받침하는 주장:
  - 의존성 주입 이후 init/destroy callbacks가 실행된다.
  - @PostConstruct·@PreDestroy는 Spring 전용 lifecycle interface와 결합되지 않는 방법이다.
  - @PostConstruct 안의 외부 bean 호출/장시간 작업은 singleton creation lock 교착을 일으킬 수 있어 제한한다.
- 주의·한계:
  - 정상 컨테이너 종료 시점의 lifecycle이며 강제 프로세스 종료까지 정리를 보장하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-bean-lifecycle.html
- 신뢰도: high

## spring-aop-proxy — [Proxying Mechanisms — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)

- 주제/적용 버전: AOP proxy/self invocation / Spring Framework 7.0.9; transaction AOP semantics도 관련
- 뒷받침하는 주장:
  - Spring AOP는 proxy 기반이며 proxy를 통과한 외부 호출만 advice/interceptor 적용 대상이다.
  - 같은 대상 객체 내부의 this.method() self invocation은 proxy를 우회한다.
  - self-invocation 된 @Transactional/@Retryable 메서드의 advice는 실행되지 않을 수 있다.
- 주의·한계:
  - AspectJ weaving은 proxy-based self-invocation 제한과 다르다. 이 프로젝트는 일반 Spring proxy 관례를 전제로 해야 한다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-aop-proxy.html
- 신뢰도: high

## spring-tx-annotation — [Using @Transactional — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)

- 주제/적용 버전: @Transactional defaults/readOnly / Spring Framework 7.0.9
- 뒷받침하는 주장:
  - 기본 propagation REQUIRED, isolation DEFAULT, read-write; RuntimeException/Error rollback, checked Exception은 기본 rollback 대상 아님.
  - Spring annotation에는 readOnly, propagation, isolation, rollbackFor 등 Spring 지원 속성이 있다.
  - proxy가 기본이므로 self invocation은 가로채지 않는다.
- 주의·한계:
  - Framework 6.2부터 ALL_EXCEPTIONS global rollback 기본을 선택 가능하므로 설정을 확인한다.
  - annotation 메타데이터만으로 실제 트랜잭션이 생기는 것이 아니라 proxy/interceptor와 transaction manager를 통한 호출이어야 한다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-tx-annotations.html
- 신뢰도: high

## spring-tx-rollback — [Rolling Back a Declarative Transaction — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)

- 주제/적용 버전: rollback/checked/caught exception / Spring Framework 7.0.x
- 뒷받침하는 주장:
  - 기본 rollback rule은 unchecked RuntimeException/Error; checked exception은 rollbackFor 설정이 없으면 rollback을 유발하지 않는다.
  - transaction interceptor는 호출을 빠져나오는 예외와 rollback rules를 판단한다.
  - 업무 코드가 예외를 잡아 정상 반환하면 interceptor가 그 예외를 보지 않으므로 자동 rollback하지 않는다.
- 주의·한계:
  - JDBC/Hibernate가 이미 transaction을 rollback-only로 표시한 데이터베이스 예외는 단순히 catch했다고 다시 사용 가능한 transaction이 되지 않는다.
  - 개별 rollback rule 및 global default는 적용 순서/설정을 확인한다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-tx-rollback.html
- 신뢰도: high

## spring-propagation — [Transaction Propagation — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)

- 주제/적용 버전: REQUIRED/REQUIRES_NEW/NESTED / Spring Framework 7.0.9
- 뒷받침하는 주장:
  - REQUIRED는 바깥 transaction에 참여하며 보통 하나의 physical transaction을 공유한다.
  - inner scope가 rollback-only를 설정하면 outer commit에서 UnexpectedRollbackException이 드러날 수 있다.
  - REQUIRES_NEW는 독립 physical transaction이며 새 connection 필요로 pool pressure/deadlock 위험이 있다.
  - NESTED는 하나의 physical transaction 안 JDBC savepoint에 매핑되며 manager 지원에 의존한다.
  - 참여 중인 REQUIRED scope는 기본적으로 outer scope의 isolation/readOnly/timeout을 따른다.
- 주의·한계:
  - Propagation의 동작은 transaction manager와 resource driver 지원에 따라 달라진다.
  - NESTED를 JPA 독립 transaction이나 REQUIRES_NEW와 혼동하면 안 된다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-tx-propagation.html
- 신뢰도: high

## spring-tx-thread-bound — [Understanding Declarative Transaction Implementation — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html)

- 주제/적용 버전: transaction thread binding/proxy / Spring Framework 7.0.x
- 뒷받침하는 주장:
  - 선언형 트랜잭션은 AOP proxy와 TransactionInterceptor로 실행된다.
  - imperative PlatformTransactionManager transaction은 현재 실행 thread에 bind된다.
  - 새로 시작한 thread/ExecutorService worker로 transaction context는 자동 전파되지 않는다.
- 주의·한계:
  - Reactive transaction은 Reactor Context를 사용하므로 imperative thread-local 설명을 그대로 적용하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-thread-bound-tx.html
- 신뢰도: high

## spring-test-thread-bound — [Transaction Management in TestContext Framework ](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)

- 주제/적용 버전: @Transactional test/concurrent test / Spring Framework 7.0.9
- 뒷받침하는 주장:
  - 테스트 @Transactional은 현재 테스트 thread에 test-managed transaction을 bind한다.
  - ExecutorService로 시작한 worker들은 그 테스트 thread transaction에 자동 참여하지 않고 별도 transaction/autocommit 효과를 낼 수 있다.
  - 테스트 method transaction은 기본적으로 끝에서 rollback된다.
- 주의·한계:
  - 문서는 preemptive timeout 사례를 예로 들지만 그 ThreadLocal 원리는 별도 worker thread에도 적용된다. 동시성 테스트는 cleanup/commit 관찰점을 별도 설계한다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-test-thread-tx.html
- 신뢰도: high

## spring-data-jpa-tx — [Transactionality — Spring Data JPA Reference ](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html)

- 주제/적용 버전: Service business-unit transaction/readOnly / Spring Data JPA 4.1.1
- 뒷받침하는 주장:
  - Spring Data는 여러 repository operation을 하나의 unit of work로 묶을 때 facade/service method에 transaction boundary를 선언하는 방식을 권한다.
  - readOnly=true는 JDBC hint이며 쓰기 금지 보안 검사로 보장되지 않는다.
  - Hibernate 사용 시 Spring Data JPA는 read-only transaction에서 flush mode를 MANUAL로 설정해 dirty checking을 생략할 수 있다.
- 주의·한계:
  - provider/transaction manager/DB에 따라 실제 최적화·쓰기 제한은 다르다. 한 MySQL 버전/provider의 성능효과를 무측정으로 단정하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-data-jpa-transactions.html
- 신뢰도: high

## spring-jdbc-enforce-readonly — [DataSourceTransactionManager Javadoc ](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/DataSourceTransactionManager.html)

- 주제/적용 버전: readOnly enforcement / Spring Framework 7.0.9 API
- 뒷받침하는 주장:
  - 기본 Connection.setReadOnly(true)는 JDBC hint다.
  - explicit SET TRANSACTION READ ONLY enforcement는 manager 설정으로 별도 적용할 수 있고 MySQL을 포함한 DB에 명시 SQL을 전송한다.
- 주의·한계:
  - Jdbc transaction manager 옵션으로 모든 JpaTransactionManager가 자동 적용한다고 일반화하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-read-only-tx-manager.html
- 신뢰도: high

## jakarta-tx-annotation — [Jakarta Transactions Transactional API ](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/transaction/transactional)

- 주제/적용 버전: Jakarta @Transactional vs Spring @Transactional / Jakarta Transactions 2.0 API shape; Spring also accepts this standard annotation
- 뒷받침하는 주장:
  - jakarta.transaction.Transactional의 표준 attributes는 TxType value, rollbackOn, dontRollbackOn이며 readOnly 속성이 없다.
  - Jakarta 표준 기본 rollback은 unchecked RuntimeException 계열이며 checked exception은 기본 rollback 대상이 아니다.
  - Spring의 org.springframework.transaction.annotation.Transactional은 별도 readOnly/rollbackFor 속성을 제공한다.
- 주의·한계:
  - Jakarta annotation은 CDI/Jakarta EE interceptor 규격을 정의한다. Spring 지원은 Spring의 metadata adapter를 통해 호환되며 모든 Spring 전용 속성이 자동 생기지 않는다.
- 원문 사본: None
- 신뢰도: high

## jakarta-persistence-spec — [Jakarta Persistence 3.2 Specification ](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

- 주제/적용 버전: Entity/EntityManager/relationship ownership / Jakarta Persistence 3.2.0; Boot 4.1.1 BOM
- 뒷받침하는 주장:
  - entity class에는 public/protected no-arg constructor가 필요하며 entity class, methods, persistent fields는 non-final 조건을 가진다.
  - new/managed/detached/removed 상태와 transaction persistence-context lifecycle 정의.
  - merge는 detached state를 managed copy에 복사하고 managed instance를 반환한다. 원본이 같은 instance가 아닐 수 있다.
  - flush는 persistence context 변경을 DB에 동기화하며 commit과 동일하지 않다.
  - 양방향 관계에서는 owning side가 DB 관계 업데이트를 결정하고 mappedBy가 inverse side를 표시한다.
  - orphanRemoval은 부모가 private-owned인 association에 사용하도록 설계됐다.
  - EntityManager/persistence context는 concurrent thread 간 공유 불가; thread-safe 보장 없음.
- 주의·한계:
  - 명세는 provider-neutral이다. SQL 발생 시점, provider optimization, database lock 동작을 정하지 않는다.
  - EntityManagerFactory는 thread-safe일 수 있어도 개별 EntityManager/persistence context는 별도다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/jakarta-persistence-3-2-spec.html
- 신뢰도: high

## jakarta-entitymanager-api — [EntityManager API Javadoc ](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html)

- 주제/적용 버전: EntityManager operations / Jakarta Persistence 3.2.0
- 뒷받침하는 주장:
  - persist는 새 entity를 managed 상태로 만든다.
  - managed state 변경은 자동 dirty checking 대상이며 명시 update/save가 필수는 아니다.
  - merge는 managed copy를 반환하고 전달 객체와 다른 object identity를 가질 수 있다.
  - AUTO flush는 결과 영향을 받는 query 전 flush 가능; COMMIT flush는 transaction commit 전.
  - clear/detach는 미flush 변경을 DB에 쓰지 않고 떼어낼 수 있다.
- 주의·한계:
  - JPA API contract는 Hibernate/MySQL SQL 구체 동작을 규정하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/jakarta-entitymanager-api.html
- 신뢰도: high

## spring-data-new-state — [Entity State Detection Strategies — Spring Data JPA Reference ](https://docs.spring.io/spring-data/jpa/reference/data-commons/is-new-state-detection.html)

- 주제/적용 버전: Repository save/persist/merge / Spring Data JPA 4.1.1
- 뒷받침하는 주장:
  - save()는 isNew 판정 후 persist 또는 merge를 호출한다.
  - 기본은 nullable @Version이 있으면 null 여부로 먼저 판단하고, 없으면 id null/primitive 0 여부를 본다.
  - assigned non-null id + version 없음이면 기본적으로 existing으로 간주해 merge 경로를 탄다. DB row 존재 여부를 먼저 확인한다는 뜻이 아니다.
  - Persistable 구현은 isNew()로 전략을 바꾼다.
- 주의·한계:
  - merge 반환값을 사용해야 한다. merge는 request DTO를 덮어쓰듯 안전하게 patch하지 않는다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-data-new-state.html
- 신뢰도: high

## spring-data-derived-delete — [Spring Data JPA 4.1.1 Query Methods ](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

- 주제/적용 버전: derived delete/count semantics / Spring Data JPA 4.1.1
- 뒷받침하는 주장:
  - derived delete는 먼저 matching entities query, then EntityManager.remove per entity 방식이며 @PreRemove lifecycle semantics를 유지한다.
  - 4.1.1 implementation의 numeric return은 database DELETE affected-row count가 아니라 미리 조회한 resultList.size()다.
  - @Modifying @Query bulk delete는 single executeUpdate SQL이고 persistence context synchronization/lifecycle semantics가 달라진다.
- 주의·한계:
  - 동시 delete race에서 두 번째 manager/provider SQL affected-row behavior, exception, rollback outcome는 실제 DB/provider에서 검증해야 한다. 카운터 감소는 이 return type을 affected-row evidence라고 단정하지 말아야 한다.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-data-jpa-derived-delete.html
- 신뢰도: high for implementation semantics; medium for race outcome

## spring-data-jpa-delete-code — [JpaQueryExecution.java at Spring Data JPA 4.1.1 tag ](https://github.com/spring-projects/spring-data-jpa/blob/4.1.1/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/query/JpaQueryExecution.java)

- 주제/적용 버전: implementation detail: derived delete return / exact 4.1.1 source tag
- 뒷받침하는 주장:
  - DeleteExecution calls getResultList(), loops em.remove(o), and for numeric/void simple-batch return returns resultList.size().
- 주의·한계:
  - This shows Spring Data's selected-result count contract, not committed SQL row count under a concurrent race.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-data-jpa-deleteexecution-4.1.1.java
- 신뢰도: high

## hibernate-7-4-user-guide — [Hibernate ORM 7.4 User Guide ](https://docs.hibernate.org/orm/7.4/userguide/html_single/)

- 주제/적용 버전: Hibernate persistence context/fetch/locking / 7.4 line; latest guide page fetched reports 7.4.13.Final; project BOM pins 7.4.5.Final
- 뒷받침하는 주장:
  - Hibernate persistence context is a write-behind cache; changes sync at flush.
  - Fetch plans (join/select/batch/entity graph) and N+1 are provider-specific behavior to measure.
  - @Version optimistic locking compares stored version to detect concurrent stale update.
  - Flush MANUAL can suppress ordinary auto flush unless explicit flush.
  - Hibernate 7.4 dedicates a section to entity equals/hashCode; there is no single recommended entity implementation for every lifecycle, proxy, and collection case.
  - @Version prevents last-commit-wins lost updates for versioned fields; attributes explicitly excluded from optimistic locking may still be overwritten.
- 주의·한계:
  - Fetched 7.4.13 guide is a later patch than the project's 7.4.5.Final. Use it for 7.4 concepts, but confirm patch-specific behavior against 7.4.5 source/repro.
  - Native Hibernate details are not necessarily portable JPA guarantees.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/hibernate-7-4-user-guide.html
- 신뢰도: high for 7.4 concepts; medium for exact patch behavior

## hibernate-7-4-intro — [A Short Guide to Hibernate 7 ](https://docs.hibernate.org/orm/7.4/introduction/html_single/)

- 주제/적용 버전: Hibernate implementation behavior / Hibernate ORM 7.4 line; page patch may be later than BOM
- 뒷받침하는 주장:
  - Persistence context change tracking, flush, fetching, locking and entity equality topics at an overview level.
- 주의·한계:
  - Not a JPA standard; provider specifics require User Guide and exact version checks.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/hibernate-7-4-introduction.html
- 신뢰도: medium

## spring-boot-bom — [Spring Boot 4.1.1 Managed Dependency Coordinates ](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)

- 주제/적용 버전: project versions / Spring Boot 4.1.1 BOM
- 뒷받침하는 주장:
  - Boot 4.1.1 BOM supplies coordinated library versions including Hibernate ORM, Spring Data JPA, Spring Framework, Jakarta Persistence and MySQL Connector/J.
- 주의·한계:
  - Project build declares versions; BOM managed versions are verified from official coordinates and the cached boot-dependencies POM. A running server version is independent from the JDBC driver version.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-boot-coordinates.html
- 신뢰도: high

## mysql-innodb-transactions — [InnoDB Locking and Transaction Model — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-transaction-model.html)

- 주제/적용 버전: MySQL transactions/locking / MySQL Server 8.4 manual; project compose uses 8.4 and parent reports isolated MySQL 8.4.11 run
- 뒷받침하는 주장:
  - InnoDB transaction isolation, locking reads, row/table locks, deadlocks and transaction scheduling behavior are database-specific.
- 주의·한계:
  - This subagent did not execute MySQL. Manual supports 8.4 semantics; exact local 8.4.11 runtime is parent-reported test evidence.
- 원문 사본: None
- 신뢰도: high

## mysql-isolation — [InnoDB Transaction Isolation Levels — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

- 주제/적용 버전: MySQL isolation/visibility / MySQL 8.4
- 뒷받침하는 주장:
  - InnoDB REPEATABLE READ default and READ COMMITTED snapshot visibility differ.
  - Consistent reads and locking/current reads have different semantics; transaction isolation does not make arbitrary application read-modify-write logic atomic.
- 주의·한계:
  - Visibility of concurrent commits depends on isolation level and read type; explain snapshot vs SELECT FOR UPDATE when teaching two-transaction behavior.
- 원문 사본: None
- 신뢰도: high

## mysql-consistent-read — [Consistent Nonlocking Reads — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)

- 주제/적용 버전: snapshot visibility / MySQL 8.4 InnoDB
- 뒷받침하는 주장:
  - REPEATABLE READ consistent reads in a transaction use a snapshot established by first consistent read; READ COMMITTED uses a fresh snapshot for each consistent read.
- 주의·한계:
  - This is not equivalent to what a locking read sees.
- 원문 사본: None
- 신뢰도: high

## mysql-locking-reads — [Locking Reads — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)

- 주제/적용 버전: locking reads/lost update / MySQL 8.4 InnoDB
- 뒷받침하는 주장:
  - SELECT FOR UPDATE / FOR SHARE request row locks; ordinary SELECT under snapshot semantics does not itself prevent concurrent writers from modifying selected rows.
- 주의·한계:
  - Use only where business invariant requires row serialization; transaction/lock ordering and deadlocks need handling.
- 원문 사본: None
- 신뢰도: high

## mysql-unique-constraints — [PRIMARY KEY and UNIQUE Index Constraints — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/constraint-primary-key.html)

- 주제/적용 버전: unique likes/idempotency / MySQL 8.4 with transactional InnoDB
- 뒷받침하는 주장:
  - Unique constraint is a database-enforced invariant for one row per (post_id, member_id).
  - duplicate violation aborts that statement and for InnoDB is transactional.
- 주의·한계:
  - A unique constraint prevents duplicate rows, but it does not itself define endpoint idempotent response semantics or keep a denormalized like_count correct.
- 원문 사본: None
- 신뢰도: high

## mysql-ignore — [Server SQL Modes: Effect of IGNORE — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html)

- 주제/적용 버전: INSERT IGNORE caveat / MySQL 8.4
- 뒷받침하는 주장:
  - INSERT IGNORE can skip duplicate-key rows with warning.
  - IGNORE downgrades several ignorable errors to warnings, including bad null, duplicate key, missing FK row, and some conversion errors; it is broader than duplicate-like handling.
  - Thus an affected count of 0 alone does not prove a like already existed.
- 주의·한계:
  - Exact warning/error and affected count depend on SQL mode, row shape, constraints, client/driver. Check warnings or use a narrowly scoped conflict strategy.
- 원문 사본: None
- 신뢰도: high for warning behavior; medium for JPA native-query result mapping until integration-tested

## mysql-row-count — [Information Functions / ROW_COUNT — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/information-functions.html)

- 주제/적용 버전: affected rows / MySQL 8.4
- 뒷받침하는 주장:
  - MySQL exposes statement affected rows/ROW_COUNT, but statement and driver reporting conventions vary, especially INSERT ... ON DUPLICATE KEY UPDATE and CLIENT_FOUND_ROWS.
- 주의·한계:
  - Do not assume a Spring Data derived delete's return value is this MySQL row count; inspect the actual API execution path.
- 원문 사본: None
- 신뢰도: high

## mysql-deadlocks — [How to Minimize and Handle Deadlocks — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html)

- 주제/적용 버전: deadlock retry / MySQL 8.4 InnoDB
- 뒷받침하는 주장:
  - deadlocks are possible with correct transactional code, lock ordering/indexes affect them, application should tolerate/retry appropriate transactions.
- 주의·한계:
  - Retry entire transaction in a fresh transaction after deadlock; never replay only one SQL statement inside transaction marked rollback-only.
- 원문 사본: None
- 신뢰도: high

## mysql-readonly — [Optimizing InnoDB Read-Only Transactions — MySQL 8.4 Manual ](https://dev.mysql.com/doc/refman/8.4/en/innodb-performance-ro-txn.html)

- 주제/적용 버전: database read-only behavior / MySQL 8.4 InnoDB
- 뒷받침하는 주장:
  - MySQL has server transaction read-only optimizations/explicit read-only semantics distinct from a Spring hint.
- 주의·한계:
  - Spring @Transactional(readOnly=true) does not necessarily issue server SET TRANSACTION READ ONLY unless a manager is specifically configured to enforce it.
- 원문 사본: None
- 신뢰도: high

## spring-transactiontemplate-default — [DefaultTransactionDefinition Javadoc — Spring Framework ](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/DefaultTransactionDefinition.html)

- 주제/적용 버전: TransactionTemplate propagation / Spring Framework 7.0.9 API
- 뒷받침하는 주장:
  - DefaultTransactionDefinition base of TransactionTemplate defaults to PROPAGATION_REQUIRED, ISOLATION_DEFAULT, TIMEOUT_DEFAULT, readOnly=false.
  - REQUIRED participates in current tx and creates a new one only if no transaction exists.
- 주의·한계:
  - TransactionTemplate does not inherently mean a new transaction per execute call; explicitly set REQUIRES_NEW when independent transaction semantics are intended.
- 원문 사본: None
- 신뢰도: high

## spring-shared-entitymanager — [JPA — Spring Framework Reference ](https://docs.spring.io/spring-framework/reference/data-access/orm/jpa.html)

- 주제/적용 버전: EntityManager proxy and thread-safety / Spring Framework 7.0.x; Boot 4.1.1
- 뒷받침하는 주장:
  - @PersistenceContext default transaction-scoped shared EntityManager is a shared thread-safe proxy.
  - The proxy delegates to the actual transaction-bound EntityManager; do not share that underlying persistence context concurrently across worker threads.
- 주의·한계:
  - A thread-safe proxy does not make an EntityManager or Hibernate Session concurrently usable. Jakarta Persistence forbids sharing one EM across concurrent threads.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/spring-shared-entity-manager.html
- 신뢰도: high

## hibernate-basic-collections — [Hibernate ORM 7.4 User Guide, Basic collection mapping ](https://docs.hibernate.org/orm/7.4/userguide/html_single/#basic-collection-mapping)

- 주제/적용 버전: provider-specific basic collection mapping / Hibernate ORM 7.4 line; project BOM 7.4.5.Final, source guide fetched at 7.4.13.Final
- 뒷받침하는 주장:
  - Hibernate supports collection-of-basic values without @ElementCollection as a provider-specific basic-collection mapping in 7.4.
  - Fallback SQL representation depends on dialect/database array support and may be ARRAY, JSON, XML, or VARBINARY.
- 주의·한계:
  - A context-load success or H2 schema is not proof of portable JPA mapping or MySQL 8.4 behavior. Parent reports a separate MySQL 8.4.11 isolated baseline context-load result; persistence/read/write behavior still needs MySQL-specific verification.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/hibernate-7-4-user-guide.html
- 신뢰도: high for Hibernate 7.4 mapping; medium for exact dialect behavior at pinned 7.4.5

## jakarta-persistence-entity-class — [Jakarta Persistence 3.2 Entity Class Requirements ](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#the-entity-class)

- 주제/적용 버전: entity class contract / Jakarta Persistence 3.2.0
- 뒷받침하는 주장:
  - JPA entity requires public or protected no-argument constructor and must be non-final; methods and persistent instance variables must be non-final.
- 주의·한계:
  - Hibernate bytecode enhancement/proxy specifics are provider-specific, but these are portable spec requirements.
- 원문 사본: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/concept-census-20261021/_data/official/jakarta-persistence-3-2-spec.html
- 신뢰도: high

## spring-boot-circular-beans — [Spring Boot application-properties reference: allow-circular-references ](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

- 주제/적용 버전: Spring bean cycles / Spring Boot 4.1.1 property reference
- 뒷받침하는 주장:
  - Boot's spring.main.allow-circular-references property default is false.
  - A repository injecting a service that injects that same repository creates a runtime circular dependency only if the actual Spring bean graph forms that cycle.
  - Spring Framework documents constructor cycles as unresolvable; setter cycles may be partially resolved in some cases, but Boot 4.1.1 defaults spring.main.allow-circular-references=false.
- 주의·한계:
  - Layering direction is a design rule, not a framework prohibition. Do not claim 'repository calls service' always prevents application startup without verifying actual bean edges and injection style.
- 원문 사본: None
- 신뢰도: high
