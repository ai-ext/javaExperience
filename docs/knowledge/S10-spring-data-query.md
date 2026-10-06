# S10. Spring Data와 쿼리 도구

> 기본 선택은 Spring Data JPA 리포지토리다. 단순 조건은 쿼리 메서드, 고정된 복잡 쿼리는 `@Query`, 조합이 많은 검색 조건은 Specification으로 표현한다.
> `Page`는 전체 건수까지 필요할 때, `Slice`는 다음 데이터 존재 여부만 필요할 때 선택한다. 프로젝션으로 조회 폭을 좁혀 응답 목적에 맞춘다.
> SQL 제어가 핵심이면 jOOQ·MyBatis·`JdbcClient`를 검토한다. Querydsl은 Spring Data가 OpenFeign 포크를 최선 노력으로 지원하므로 의존성 선택과 유지보수 상태를 확인한다.

## 1. 왜 알아야 하나

검색 필터 조합이 늘면 `findByStatusAndCreatedAtBetweenAnd...` 메서드가 증식하고, 다음 페이지 버튼만 필요한 목록에 `Page<T>`를 쓰면 전체 건수 조회까지 발생할 수 있다. 복잡한 조인·집계를 엔티티 조회로 처리하면 불필요한 데이터를 가져오고, 엔티티를 API 응답에 노출하면 내부 변경이 응답 계약에 번진다.

이름 파서는 유효한 속성 경로를 쿼리로 해석하므로 의도와 다른 조건이 만들어질 수 있다. 데이터 쿼리와 count 쿼리의 조건이 다르면 총건수가 틀린다. 배치·리포팅처럼 SQL을 세밀하게 제어할 작업에 JPA만 쓰면 튜닝과 DB 고유 기능 사용이 어렵다.

이 문서는 Spring Data JPA의 리포지토리·`@Query`·Specification·Projection·페이징·감사와 Querydsl, jOOQ, MyBatis, `JdbcClient`를 비교한다. JPA 영속성 컨텍스트·변경 감지 → S09.

## 2. 핵심 개념

| 용어 | 뜻 | 선택할 때 보는 점 |
|---|---|---|
| Repository | 도메인 저장소 인터페이스. Spring Data가 CRUD와 선언 쿼리를 연결한다. | 엔티티 중심 CRUD |
| 쿼리 메서드 | 메서드 이름에서 조건·정렬을 해석한다. | 짧고 명확한 고정 조건 |
| 선언 쿼리 | `@Query` 또는 named query로 JPQL/SQL을 지정한다. | 길거나 모호한 쿼리 |
| Specification | 조립 가능한 Criteria 조건. JPA 4.0 `PredicateSpecification`은 쿼리 독립 predicate다. | 선택 필터 조합 |
| Projection | 엔티티 일부 속성을 표현하는 반환 타입. | 목록 응답과 조회 폭 축소 |
| Page / Slice | `Page`는 전체 건수, `Slice`는 다음 조각 여부를 제공한다. | 전체 페이지 수가 필요한지 |
| Querydsl | 생성 Q 타입으로 타입 안전하게 조건을 조립한다. | 포크·빌드 비용을 감당할 수 있는지 |
| jOOQ | 스키마 코드 생성과 SQL DSL로 SQL을 작성·실행한다. | SQL·방언 직접 제어 |
| MyBatis | XML/애노테이션 SQL과 객체 매핑을 제공한다. | SQL 소유권과 매핑 반복 절감 |
| `JdbcClient` | Spring JDBC fluent API로 위치/이름 기반 파라미터를 처리한다. | ORM 없이 Spring에서 SQL 실행 |

### 도구 비교

| 도구 | 쿼리 작성·타입 안전성 | 강점 | 비용·적합한 상황 |
|---|---|---|---|
| Spring Data JPA | 메서드 이름, JPQL, Criteria 기반 | 리포지토리 추상화와 JPA 엔티티 작업이 자연스럽고 Boot 구성과 잘 맞음 | 엔티티 중심 업무 CRUD와 보통 수준의 조회가 기본인 서비스 |
| Querydsl | 생성 Q 타입 기반 fluent 조건 | 동적 조건이 문자열이 아니며 IDE 완성과 컴파일 검사에 유리 | JPA 검색 조건을 타입 안전하게 자주 조합해야 할 때. Q 타입 생성 설정 필요 |
| jOOQ | 코드 생성 기반 SQL DSL | 스키마·SQL 방언을 표현하고 실행까지 한 API로 다룸 | SQL 중심의 리포팅, 복잡한 조인·집계, DB 고유 기능이 중요한 서비스. 에디션별 지원 범위·라이선스를 검토 |
| MyBatis | 직접 쓴 SQL + XML/애노테이션 매핑 | 실행 SQL이 명시적이고 저장 프로시저·복잡한 결과 매핑을 다루기 쉬움 | SQL을 팀이 직접 최적화하며 CRUD 반복 코드는 프레임워크에 맡기려는 경우 |
| Spring JDBC (`JdbcClient`) | 직접 쓴 SQL + fluent 바인딩·매핑 | JPA 모델 없이 SQL을 간결하게 실행하고 `JdbcTemplate` 계열을 재사용 | 작고 명료한 SQL 작업, 기존 Spring JDBC와의 연계. 대규모 매핑 계층은 직접 설계 |

`JdbcClient`는 SQL을 직접 작성하는 Spring JDBC 외관이다. MyBatis는 SQL과 결과 매핑을 구조화하고, jOOQ는 코드 생성과 DSL로 SQL 표현의 타입 안전성을 높인다.

## 3. 내부 동작·원리

### 리포지토리 메서드는 SQL로 바로 치환되지 않는다

시작 시 저장소 팩토리가 메타데이터를 읽어 프록시를 만든다. CRUD는 기본 구현으로 위임하고, 쿼리 메서드는 선언 쿼리를 찾거나 이름을 분석한다. JPA 파생 쿼리는 속성 경로와 키워드로 JPQL을 만들며, 실행 시 JPA 구현체가 SQL로 변환해 JDBC로 전달한다.

```text
Repository 호출
    │
    ├─ 기본 CRUD 메서드 ──> 기본 저장소 구현 ──> EntityManager
    │
    └─ 쿼리 메서드
          ├─ @Query / named query ──> 선언 쿼리
          └─ 메서드 이름 ───────────> 속성 경로·키워드 분석 ──> JPQL
                                                              │
                                              JPA 구현체 ──> SQL ──> JDBC
```

메서드 이름은 단순 별칭이 아니라 쿼리 언어다. `findByLastnameAndFirstname`은 두 조건, `OrderByLastnameDesc`는 정렬, `Containing`은 `LIKE`로 해석된다. 파생 `LIKE` 조건은 입력의 와일드카드를 literal로 취급하도록 이스케이프한다. 이름 해석 결과가 의도와 같은지 확인해야 한다.

### `@Query`는 선언 시점에 쿼리를 분리한다

`@Query`는 JPQL을 지정하고, `nativeQuery = true`면 SQL을 지정한다. `Page<T>`의 전체 건수는 count 쿼리로 얻는다. 조인·그룹화가 복잡하거나 SQL이라면 `countQuery`를 명시하고 데이터 쿼리와 조건이 같은지 확인한다.

### Specification과 Projection은 서로 다른 문제를 푼다

Specification은 “어떤 행이 조건에 맞는가”를 조립한다. `PredicateSpecification<T>`은 `From`과 `CriteriaBuilder`만 사용해 쿼리 유형 결합을 줄인다. 기존 `Specification<T>`은 `CriteriaQuery`를 받아 select 구조를 다루며, JPA 4.0부터 update·delete용 타입도 제공한다. 작은 predicate를 조합하면 필터 조합마다 메서드를 만들 필요가 없다.

Projection은 “결과를 어떤 모양으로 받을 것인가”를 정한다. 인터페이스 projection은 접근자 기반 프록시를 만들고, closed projection은 필요한 값을 한정해 최적화하기 쉽다. SpEL `@Value`로 임의 속성을 참조하는 open projection은 필요한 필드를 제한하기 어렵다. 집계에는 DTO/record를 고려한다.

### 페이징은 정렬과 건수 계산의 계약이다

`Pageable`은 크기·위치·정렬을 쿼리에 전달한다. `Page<T>`는 `totalElements` 때문에 count 쿼리가 실행될 수 있다. `Slice<T>`는 다음 조각 존재 여부만 필요할 때 적합하고, `Window<T>`는 `ScrollPosition`으로 이어간다. 페이지 정렬에는 고유 보조 키(예: `id`)를 넣어 중복·누락을 줄인다.

### 감사 정보는 저장 이벤트의 메타데이터다

Spring Data auditing은 `@CreatedDate`, `@LastModifiedDate`, 선택적으로 `@CreatedBy`, `@LastModifiedBy`를 사용한다. 기능 활성화와 JPA 리스너 등록이 필요하다. 행위자는 `AuditorAware<T>`로 제공하며 날짜만 추적할 때는 구현하지 않아도 된다.

## 4. 코드로 확인

Spring 예제는 Boot 4.1 / Spring Data JPA 4.1 기준이며 DB 연결·스키마 설정을 전제한다.

### 예제 1 — 파생 쿼리, `@Query`, projection, 페이징 (미실행)

```java
// Customer.java
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer")
class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String lastName;
    private boolean active;

    protected Customer() {}
}

// CustomerName.java
interface CustomerName {
    String getEmail();
    String getLastName();
}

// CustomerRepository.java
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface CustomerRepository extends JpaRepository<Customer, Long> {
    Page<CustomerName> findByActiveTrue(Pageable pageable);

    @Query("select c from Customer c " +
           "where lower(c.email) = lower(:email)")
    Optional<Customer> findByEmail(@Param("email") String email);
}
```

반환 projection에 필요한 getter만 선언하면 호출부는 전체 엔티티가 아닌 목록 화면용 형태를 받는다. `@Query`는 이름만으로 읽기 어려운 비교 규칙을 JPQL로 고정한다. 외부 요청의 페이지 크기는 상한을 검증하고, 정렬 키를 허용 목록으로 제한한다.

### 예제 2 — 조합 가능한 조건 (미실행)

```java
import java.util.List;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

class CustomerSpecifications {
    static PredicateSpecification<Customer> isActive() {
        return (from, builder) -> builder.isTrue(from.get("active"));
    }

    static PredicateSpecification<Customer> hasLastName(String lastName) {
        return (from, builder) -> builder.equal(from.get("lastName"), lastName);
    }
}

interface SearchableCustomerRepository
        extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {}

// CustomerSearch.java
class CustomerSearch {
    static List<Customer> findActiveByLastName(
            SearchableCustomerRepository repository, String lastName) {
        return repository.findAll(CustomerSpecifications.isActive()
                .and(CustomerSpecifications.hasLastName(lastName)));
    }
}
```

`PredicateSpecification`은 Spring Data JPA 4.0 이상 API다. 속성 문자열을 직접 쓰면 리네임 오류가 컴파일 때 잡히지 않는다. 정적 메타모델을 생성해 `Customer_.lastName`처럼 표현하면 문자열 경로 오타를 줄일 수 있다.

### 예제 3 — 생성 시각과 수정 시각 감사 (미실행)

```java
// AuditedEntity.java
import java.time.Instant;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
abstract class AuditedEntity {
    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant modifiedAt;
}

// PersistenceConfiguration.java
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
class PersistenceConfiguration {}
```

실제 엔티티가 `AuditedEntity`를 상속해야 메타데이터가 적용된다. 행위자까지 저장한다면 사용자 식별자 타입에 맞춘 `AuditorAware<T>` bean도 등록한다. 테스트에서는 시계와 현재 사용자 제공자를 고정해 시간·행위자 값을 결정적으로 검증한다.

### 예제 4 — 이름 있는 매개변수로 SQL 실행 (미실행)

```java
import java.util.Optional;
import javax.sql.DataSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

record CustomerRow(long id, String email) {}

@Repository
class CustomerSqlDao {
    private final JdbcClient jdbc;

    CustomerSqlDao(DataSource dataSource) {
        this.jdbc = JdbcClient.create(dataSource);
    }

    Optional<CustomerRow> findById(long id) {
        return jdbc.sql("select id, email from customer where id = :id")
                .param("id", id)
                .query((rs, rowNum) -> new CustomerRow(
                        rs.getLong("id"), rs.getString("email")))
                .optional();
    }
}
```

`JdbcClient`는 `JdbcTemplate`과 `NamedParameterJdbcTemplate`에 위임하므로 기존 JDBC 예외 변환·리소스 처리 기반을 재사용한다. 복잡한 배치·저장 프로시저는 템플릿이나 전용 API가 더 직접적일 수 있다.

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화 | 이전 방식의 한계와 근거 |
|---|---|---|
| Spring Framework 6.1 | `JdbcClient` 추가 | 위치·이름 기반 템플릿을 번갈아 쓰던 API를 하나의 fluent facade로 묶었다. [API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/simple/JdbcClient.html)는 도입 버전과 위임 대상을 명시한다. |
| Spring Data JPA 4.0 | `PredicateSpecification`, update/delete specification 추가 | predicate만 필요한 조건도 쿼리 객체에 묶이던 한계를 줄이려고 쿼리 독립 인터페이스를 추가했다. [Specifications](https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html) 참조. |
| Spring Data JPA 4.1.1 / Boot 4.1.1 기준 | Querydsl OpenFeign 포크를 best-effort 지원 | 원본 유지보수 둔화로 fork 좌표·processor를 구분해야 한다. [확장 문서](https://docs.spring.io/spring-data/jpa/reference/repositories/core-extensions.html) 및 [JPA 버전](https://docs.spring.io/spring-data/jpa/reference/) 참조. |
| MyBatis Starter 3.0 → 4.0 | 호환표상 Boot 3.2–3.5에서 Boot 4.0+ 대상으로 변경 | Boot 메이저 버전에 맞는 starter 경계를 확인한다. [호환표](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/) 참조. |

공식 문서에서 OpenFeign Querydsl은 7.1, jOOQ 매뉴얼은 최신 안정 버전 3.21을 표시한다. 둘은 Boot가 관리하는 Spring Data JPA 버전과 별개이므로 각각 호환표를 확인한다.

## 6. 실무 가이드

- 기본값은 **Spring Data JPA Repository + 파생 메서드**다. CRUD와 단순 조회의 구현량이 작다.
- 조건이 고정되고 이름이 길어지면 `@Query`를 쓴다. 메서드명 해석에 쿼리 의도를 맡기지 않는다.
- 요청마다 필터가 달라지면 Specification으로 조건을 나누고 조립한다. null/공백 규칙도 한 곳에서 정한다.
- 필요한 필드만 반환하면 Projection을 써서 엔티티와 API 응답 계약을 분리한다.
- 전체 건수가 필요하면 `Page<T>`, “더 보기”만 필요하면 count 비용을 줄이는 `Slice<T>`를 쓴다.
- 타입 안전한 검색 조건 조합이 핵심이면 Querydsl을 고려한다. OpenFeign 포크 좌표와 annotation processor 설정을 빌드에서 검증한다.
- SQL 방언·집계·스키마 타입 생성이 중요하면 jOOQ를 검토하고 라이선스와 에디션을 확인한다.
- SQL을 직접 리뷰·튜닝하며 매핑을 선언하려면 MyBatis를 쓰고 mapper와 Java 메서드를 통합 검증한다.
- 작은 직접 SQL 호출은 `JdbcClient`, 대량·복잡 JDBC 작업은 `JdbcTemplate` 계열을 검토한다.
- 감사 시각은 `@CreatedDate`·`@LastModifiedDate`, 행위자는 `AuditorAware`로 제공한다.

## 7. 함정·안티패턴

1. **메서드 이름에 `Distinct`를 붙였는데 중복 값이 제거되지 않음 →** 엔티티 id를 포함해 distinct entity가 되어 속성값 중복과 다른 의미가 됨 → **무엇을 distinct 할지 결과 열을 정의하고 JPQL/projection으로 명시한다.** `countDistinctByLastname`이 실제로는 id를 distinct count할 수 있다.
2. **`Page`를 모든 목록에 사용해 DB 부하가 커짐 →** 전체 원소 수를 구하는 count 쿼리가 필요할 수 있음 → **전체 건수가 화면에 필요 없으면 `Slice`를 사용한다.** 페이지 count가 핵심이면 `countQuery`를 직접 지정한다.
3. **native `Page`의 전체 건수가 틀림 →** 자동 유도된 count 쿼리가 복잡한 SQL의 조인·그룹·필터 의미를 유지하지 못함 → **데이터 쿼리와 동일한 조건을 반영한 `countQuery`를 선언하고 양쪽 결과를 검증한다.**
4. **동적 필터마다 repository 메서드가 증식 →** 각 조건 조합을 메서드 이름으로 표현함 → **조건이 선택적이면 Specification으로 나누어 조립한다.** 몇 개 안 되는 고정 조합은 가독성 좋은 쿼리 메서드가 더 단순하다.
5. **인터페이스 projection에 SpEL을 많이 넣음 →** open projection이 임의 엔티티 속성을 참조해 필요한 조회 필드 최적화를 막음 → **closed projection을 우선하고 계산은 default method나 서비스 계층으로 옮긴다.**
6. **쿼리 메서드 이름이 컴파일되니 안전하다고 간주 →** 유효하지만 의도와 다른 쿼리로 분석될 수 있음 → **JPQL과 결과를 확인하고 `Distinct`, null, 대소문자, `LIKE` 입력을 점검한다.**
7. **Querydsl 의존성만 넣고 빌드가 깨짐 →** JPA Q 타입 annotation processing을 빼먹거나 원본과 OpenFeign fork 좌표를 혼용함 → **한 계열의 런타임·processor 좌표를 맞추고 생성 소스 경로와 CI 빌드를 확인한다.** Spring Data는 OpenFeign 통합을 best-effort로 지원한다.
8. **감사 시각이 비어 있음 →** auditing 미활성화, JPA entity listener 누락 또는 저장 경로가 기대한 리스너를 거치지 않음 → **`@EnableJpaAuditing`, listener, 실제 엔티티 상속/매핑 여부를 함께 확인한다.** 행위자 필드만 두고 `AuditorAware`를 구현하지 않는 실수도 검사한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 쿼리 메서드와 `@Query`는 어떻게 고르는가?

조건이 단순하고 이름만으로 정책을 설명할 수 있으면 파생 메서드를 택한다. 이름이 문장처럼 길어지거나 distinct·조인·집계 의미가 모호하면 `@Query`로 쿼리를 명시한다. `@Query`는 JPQL을 기본으로 하고 native SQL도 선언할 수 있다.

**꼬리질문 — native `Page`에 `countQuery`가 필요한 이유는?**
복잡한 데이터 SQL에서 전체 건수 쿼리를 안전하게 유도하기 어렵기 때문이다. 반환 페이지의 total 값과 실제 필터 의미가 같도록 별도 count SQL을 둔다.

### Q2. Specification은 쿼리 메서드와 무엇이 다른가?

쿼리 메서드는 미리 정한 조건 조합을 선언한다. Specification은 Criteria predicate를 함수로 만들어 요청에 들어온 조건만 조립한다. 그러므로 선택 필터 조합이 늘어나는 목록 검색에 적합하고, 고정된 단순 쿼리까지 모두 Specification으로 만들 필요는 없다.

**꼬리질문 — JPA 4.0의 `PredicateSpecification`은 기존 타입과 무엇이 다른가?**
predicate 생성에 필요한 `From`과 `CriteriaBuilder`에 집중해 쿼리 유형에 덜 묶인다. `Specification`은 `CriteriaQuery`도 받아 select 구조와 더 직접 상호작용한다.

### Q3. Projection이 성능에 도움이 되는 이유는?

반환 목적에 필요한 속성만 표현하므로 전체 엔티티 로딩·직렬화와 응답 계층의 결합을 줄일 수 있다. closed interface projection은 필요한 속성을 프레임워크가 알 수 있다. 반면 SpEL open projection은 어떤 필드를 읽을지 사전에 알기 어려워 최적화 이점이 줄어든다.

**꼬리질문 — repository CRUD 메서드의 반환형만 projection 인터페이스로 바꾸면 되는가?**
아니다. 기반 리포지토리 메서드를 같은 시그니처로 재정의하면 기본 구현 메서드가 호출될 수 있다. projection 전용 query method를 따로 선언한다.

### Q4. `Page`와 `Slice` 중 무엇을 선택하는가?

전체 건수·마지막 페이지 정보가 제품 요구사항이면 `Page`를 택한다. `Slice`는 현재 조각과 다음 조각 존재 여부만 필요할 때 적절하다. `Page`는 count 쿼리 비용을 만들 수 있으므로 실제 화면 계약을 먼저 확인한다.

**꼬리질문 — 페이지 사이에 행이 중복되거나 빠지는 이유는?**
정렬 키가 중복이면 DB가 동률 행의 순서를 보장하지 않을 수 있다. 고유한 보조 정렬 키를 추가해 순서를 안정화한다.

### Q5. Querydsl을 새 프로젝트에서 선택할 때 주의점은?

생성 Q 타입과 fluent 조건이 타입 안전성과 자동완성을 준다. 하지만 Spring Data 문서는 원본 Querydsl 유지보수 둔화와 OpenFeign fork 지원을 명시하고, fork는 best-effort다. 저장소 정책, artifact 좌표, annotation processor 설정까지 감당 가능한지 판단한다.

**꼬리질문 — Spring Data JPA가 Querydsl을 직접 제공하는가?**
아니다. 통합 인터페이스를 제공하지만 라이브러리와 Q 타입 생성은 별도 의존성·annotation processing이 필요하다.

### Q6. `@CreatedDate`만 사용해도 `AuditorAware`가 필요한가?

아니다. 생성·수정 시각만 추적하면 감사 인프라가 현재 사용자를 알아낼 필요가 없다. `@CreatedBy`나 `@LastModifiedBy`까지 기록할 때 `AuditorAware<T>`가 행위자를 제공한다.

**꼬리질문 — 감사 기능을 켰는데 날짜가 채워지지 않는다면?**
`@EnableJpaAuditing`, `AuditingEntityListener`와 해당 메타데이터가 실제 엔티티에 적용됐는지 확인한다. 저장 경로가 JPA listener를 통하는지도 함께 점검한다.

## 9. 참고문헌

- Spring Data JPA Reference — https://docs.spring.io/spring-data/jpa/reference/ — Spring Data JPA 안정 버전 4.1.1과 공식 레퍼런스 진입점.
- JPA Query Methods — https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html — 파생 쿼리, 키워드, declared query와 distinct 주의점.
- Specifications — https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html — `PredicateSpecification`과 query-bound specification의 구조 및 조합.
- Projections — https://docs.spring.io/spring-data/commons/reference/repositories/projections.html — interface projection, closed/open projection 동작.
- Auditing — https://docs.spring.io/spring-data/commons/reference/auditing.html — 날짜·행위자 애노테이션과 `AuditorAware` 설정.
- Spring Data Extensions — https://docs.spring.io/spring-data/jpa/reference/repositories/core-extensions.html — Querydsl 상태, OpenFeign 통합과 processor 예제.
- `@Query` API — https://docs.spring.io/spring-data/jpa/reference/api/java/org/springframework/data/jpa/repository/Query.html — JPQL/native 지정, count query, query rewriter 요소.
- Repository Query Return Types — https://docs.spring.io/spring-data/commons/reference/repositories/query-return-types-reference.html — `Page`, `Slice`, `Window` 등 지원 반환형 정의.
- Spring JDBC Core — https://docs.spring.io/spring-framework/reference/data-access/jdbc/core.html — `JdbcTemplate`의 자원·예외 처리와 JDBC 기본 작업.
- `JdbcClient` API — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/simple/JdbcClient.html — fluent query/update API, 템플릿 위임, 도입 버전.
- OpenFeign Querydsl — https://openfeign.github.io/querydsl/ — fork의 쿼리 DSL 개요, 지원 백엔드와 현재 릴리스 정보.
- jOOQ User Manual — https://www.jooq.org/doc/latest/manual/ — SQL building, code generation, SQL execution의 공식 매뉴얼 구성.
- MyBatis 3 Introduction — https://mybatis.org/mybatis-3/ — XML/애노테이션 SQL, 저장 프로시저와 결과 매핑 개요.
- MyBatis Spring Boot Starter — https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/ — Boot 버전 호환표, DataSource·SqlSession·mapper 자동 구성.
