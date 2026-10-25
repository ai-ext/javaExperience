# S09 JPA·Hibernate 공식 문서 검증 보고서

확인일: 2026-10-20

## 범위와 결론

대상은 `/Users/ds/research/javaexperience-s09-20261020/S09-source.md` 304줄이다. 요청대로 원문은 데이터로만 읽고 수정하지 않았다. 조사 범위는 Jakarta Persistence 3.2 표준, Hibernate ORM 7.4 문서, Spring Boot 관리 좌표이며 코드를 실행한 보고서가 아니다. 핵심 개념은 대체로 맞지만, persistence context를 트랜잭션과 동의어로 쓰는 표현, 일률적인 N+1·fetch join pagination 설명은 조건을 분명히 해야 한다.

## 확인 결과

### Jakarta Persistence 3.2 표준

- persistence context 안에서는 엔티티 타입과 primary key로 정해지는 각 persistent identity에 대해 유일한 엔티티 인스턴스가 존재한다. 따라서 동일 `EntityManager`/context에서 이미 포함된 엔티티를 `find()`하면 기존 인스턴스를 돌려준다. 단, 이는 모든 `EntityManager` 또는 모든 트랜잭션 사이의 동일성을 뜻하지 않는다. context는 transaction-scoped일 수도, extended일 수도 있고 application-managed일 수도 있다. `find()`가 transaction 없이 허용되는 경우 transaction-scoped context의 결과는 detached일 수 있다. 원문의 “현재 작업 단위”는 유지 가능하나 “컨텍스트가 트랜잭션마다 반드시 새로 생긴다”는 식으로 읽히지 않도록 한다. 근거: [Jakarta Persistence 3.2 §3.1, §3.2, §7.1](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [EntityManager API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html).
- `merge(detached)`는 detached 원본을 managed로 되살리는 동작이 아니다. state를 같은 identity의 기존 managed 인스턴스 또는 새 managed copy로 복사하고 그 managed 객체를 반환한다. detached 입력과 반환값은 Java object identity가 다르다. 다만 입력 자체가 이미 같은 context의 managed 객체라면 그 객체가 반환될 수 있다는 표준 예외가 있다. 원문의 설명은 detached 조건을 명시하면 정확하다. 근거: [Jakarta Persistence 3.2 §3.3.7](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [EntityManager.merge API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html).
- `remove()`는 managed entity를 removed로 표시한다. removed 객체에 `contains()`를 호출하면 false다. 실제 DELETE 동기화는 flush 또는 commit까지 미뤄질 수 있다. detached 객체에 `remove()`를 호출하면 `IllegalArgumentException`이다. 따라서 removed 상태를 “컨텍스트에서 완전히 사라진 객체”로 오해하면 안 된다. 근거: [Jakarta Persistence 3.2 §3.3.3, §3.3.8](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [EntityManager API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html).
- 변경은 즉시 DB에 동기화되지 않는다. `flush()`는 persistence context 상태를 DB와 동기화할 뿐 commit이 아니다. AUTO 모드는 변경 결과가 영향을 줄 쿼리 전 flush를 요구하고, provider가 추가로 flush하는 시점을 허용한다. 실패가 `flush()`에서 반드시 드러난다거나 반드시 commit까지 미뤄진다고 일반화할 수 없다. 제약 조건·DB 실행 시점에 따라 flush 또는 commit 경계에서 나타날 수 있다. `@Version` 낙관적 검사는 provider가 merge 중 및/또는 flush/commit 때 수행할 수 있다. 그러므로 “낙관적 충돌은 commit 때 발생한다”도 부정확하다. 근거: [Jakarta Persistence 3.2 §3.3.4, §3.4.4](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [EntityManager API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html).
- JPA 기본 fetch는 `ManyToOne`/`OneToOne` EAGER, collection 연관은 LAZY다. EAGER는 데이터가 로드되어야 한다는 요구이지 SQL JOIN을 써야 한다는 보장이 아니다. LAZY도 provider에게 힌트이며 provider가 더 많은 데이터를 미리 가져올 수 있다. 실제 접근 가능성은 그 시점에 연관 데이터가 로드됐는지, 객체가 managed인지/프록시가 초기화됐는지, context가 열려 있는지에 의존한다. “LAZY는 컨텍스트가 열린 상태에서 접근해야 한다”는 실무 설명은 미초기화 상태라는 조건을 덧붙여야 한다. 근거: [Jakarta Persistence 3.2 §11.1.25, §11.1.26, §3.8](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

### Hibernate ORM 7.4 동작

- Hibernate 7.4 기본 `AUTO` flush는 transaction commit 전, 대기 중인 entity actions와 겹치는 JPQL/HQL query 전, 동기화 등록이 없는 native SQL 전 발생한다. 서로 다른 테이블에 대한 query는 flush를 일으키지 않을 수 있다. IDENTITY 키는 insert에서 생성되므로 Hibernate는 `persist()` 직후 물리 insert가 필요할 수 있다. 원문의 AUTO 설명은 “겹치는 query” 조건을 넣으면 더 정확하다. 근거: [Hibernate ORM 7.4 User Guide §7.1](https://docs.hibernate.org/orm/7.4/userguide/html_single/#flushing), [§3.7.10 IDENTITY](https://docs.hibernate.org/orm/7.4/userguide/html_single/#identifiers-generators-identity).
- 예제의 `PurchaseOrder.lines`에는 `@BatchSize(size=32)`가 명시돼 있다. Hibernate의 `@BatchSize`는 session에 있는 미초기화 collection 중 최대 batch 크기까지 한 select로 초기화할 수 있게 한다. 따라서 collection 3개를 차례로 접근하는 단순 LAZY 예를 무조건 1+3 SQL이라고 적을 수 없다. 다만 최대치이지 고정 SQL 수 보장이 아니다. session queue에 선택될 collection 수, 이미 초기화된 상태, mapping/접근 방식, dialect의 IN 제약 등 실제 조건이 영향을 준다. 코드만으로 1+1이라고도 확정하지 않는다. 원문 예제는 `@BatchSize` 때문에 plain LAZY의 N+1 일반 예와 구분해 설명해야 한다. 근거: [Hibernate 7.4 User Guide §12.8](https://docs.hibernate.org/orm/7.4/userguide/html_single/#fetching-batch), [Hibernate `@BatchSize` API](https://docs.hibernate.org/orm/7.4/javadocs/org/hibernate/annotations/BatchSize.html).
- Hibernate 7.4에서는 collection fetch join과 HQL `limit` 또는 pagination이 SQL 제한으로 처리되는 동작으로 변경됐다. 공식 7.4 소개는 subquery 안의 limit/offset을 지원하는 DB에서 안전하다고 하고 Sybase ASE는 예외라고 명시한다. HQL guide는 미지원 DB에서 전체 결과를 가져와 JVM에서 limit할 수 있다고 설명한다. 따라서 “컬렉션 fetch join pagination은 항상 메모리 pagination/잘못된 결과”라는 옛 일반론은 7.4에 적용하면 틀리다. 다만 최신 7.4 문서는 현재 7.4.13.Final이며 요청 범위의 7.4.5.Final에서 동작을 별도 실행 확인하지 않았다. 7.4 migration guide는 이 변경이 7.4 항목임을 확인한다. 근거: [Hibernate 7.4 What’s New](https://docs.hibernate.org/orm/7.4/whats-new/), [Hibernate 7.4 HQL Guide §4.5.1](https://docs.hibernate.org/orm/7.4/querylanguage/html_single/#limits), [Hibernate 7.4 Migration Guide](https://docs.hibernate.org/orm/7.4/migration-guide/).
- `@EntityGraph`와 fetch join은 fetch 계획을 선언하지만 표준이나 해당 선언 자체가 모든 상황의 SQL statement count를 보장하지 않는다. 한 query 또는 N+1 제거를 보장한다고 적기보다, mapping, 다른 eager 연관, 중복 제거, dialect/provider 선택을 포함한 실제 SQL을 관찰할 수단이 필요하다고 적는다. 근거: [Jakarta Persistence 3.2 §3.8 Entity Graphs](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [Hibernate ORM 7.4 User Guide §12 Fetching](https://docs.hibernate.org/orm/7.4/userguide/html_single/#fetching).
- `EntityEntry.loadedState` 등 snapshot 구조는 Hibernate 내부 구현 관찰에 한정한다. dirty checking 자체는 표준 동작이지만, 모든 provider가 특정 스냅샷 객체/필드 구조를 쓰거나 모든 상황에서 loaded-state snapshot을 보유한다는 약속은 아니다. Hibernate는 enhancement 기반 inline dirty tracking 및 immutable/read-only 최적화도 문서화한다. 근거: [Hibernate ORM 7.4 User Guide §6.2.2, §6.13, §7](https://docs.hibernate.org/orm/7.4/userguide/html_single/).

### 원문 주장 정밀화

- “모든 관계를 EAGER로 바꾸면 ... 조인”은 EAGER 자체가 JOIN 보장은 아니다. “불필요한 데이터를 요구하고 provider가 secondary SELECT를 추가할 수도 있어 비용과 SQL 형태를 통제하기 어렵다”가 정확하다.
- `findAll()` 뒤 각 자식 컬렉션을 읽는 N+1 설명은 batch fetch, 이미 초기화된 연관, 2차 캐시 등을 배제한 전형적 사례로 한정한다. 이 원문의 `PurchaseOrder.lines`는 `@BatchSize(size=32)` 대상이다.
- `@EntityGraph` 설명의 “N+1 방지 보장은 아니다”는 적절하다. fetch join도 쿼리 하나를 모든 추가 eager 연관을 포함한 전체 호출의 count 보장으로 확대하면 안 된다.
- “영속성 컨텍스트는 트랜잭션 범위”는 transaction-scoped context를 쓰는 일반 사례로 제한한다. Jakarta Persistence는 extended 및 application-managed context도 정의한다.
- flush/제약 오류 및 optimistic lock 오류를 “flush 또는 commit 시점”으로 적은 원문은 방향상 타당하다. 단, 낙관적 검증은 merge 시에도 허용된다.

## 버전 및 출처 한계

- 본문은 Jakarta Persistence 3.2 및 Hibernate ORM 7.4 공식 가이드/API를 기준으로 했다. Hibernate 7.4 온라인 가이드는 확인 시점에 7.4.13.Final을 표시한다. collection pagination의 7.4 변경은 공식 What’s New와 Migration Guide에서 확인했으나, 7.4.5.Final 바이너리로 재현하지 않았다.
- 원문이 말하는 Spring Boot 4.1.1 → Hibernate ORM 7.4.5.Final 좌표는 공식 [Spring Boot Managed Dependency Coordinates](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)에서 확인 가능하다. 단, live 좌표 페이지는 이후 업데이트될 수 있어 고정판 주장에는 Boot 4.1.1 버전별 문서/릴리스 BOM 링크를 함께 보존하는 것이 좋다.
- 공식 Jakarta Persistence spec URL에 `.html` 없는 경로는 404였다. 보고서에서 성공 확인한 canonical URL은 `.html`이 붙은 경로다. 공식 Hibernate ORM 7.4 user guide URL은 redirect 후 현재 7.4.13 문서였다.
- 이번 보고서는 JPA/Hibernate 기능 문헌검증만 수행했다. 본문 코드, DDL, SQL statement 수, latency, 동시성 충돌 시점의 특정 로그, Spring proxy, HTTP/OSIV 동작은 실행하지 않았다. 이 작업에서 별도 Hibernate 7.4.5 / H2 / JDK 21 probe도 수행하지 않았다. 따라서 수치나 실행 결과를 주장하지 않는다.
- MySQL, Java 25, HTTP/OSIV, Spring proxy, 마이그레이션의 실제 운영 스키마, `EntityEntry.loadedState` 런타임 값은 범위 밖이다. 외부 실패 조회는 Jakarta spec 경로 한 건(확장자 누락 404)이며 올바른 공식 `.html` 경로로 다시 확인했다.

## 공식 URL 목록

- Jakarta Persistence 3.2 specification: https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html
- Jakarta Persistence 3.2 EntityManager API: https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html
- Hibernate ORM 7.4 User Guide: https://docs.hibernate.org/orm/7.4/userguide/html_single/
- Hibernate ORM 7.4 `@BatchSize` API: https://docs.hibernate.org/orm/7.4/javadocs/org/hibernate/annotations/BatchSize.html
- Hibernate ORM 7.4 What’s New: https://docs.hibernate.org/orm/7.4/whats-new/
- Hibernate ORM 7.4 HQL Guide: https://docs.hibernate.org/orm/7.4/querylanguage/html_single/
- Hibernate ORM 7.4 Migration Guide: https://docs.hibernate.org/orm/7.4/migration-guide/
- Spring Boot Managed Dependency Coordinates: https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html
