# P20 공식 문서 근거 보고서

확인일: 2026-10-20

## 범위와 결론

대상은 현재 디렉터리의 `/Users/ds/research/javaexperience-p20-20261020/P20-source.md` 전체 386줄이다. 본 보고서는 실행 검증이 아니라 공식 명세와 공식 API 문서에 대한 문헌 검증이다. 사용된 주 근거는 Jakarta Persistence 3.2 명세/API 및 Spring Data JPA 4.1.1 문서다.

문서의 핵심 설명은 대체로 정확하다. 다만 엔티티의 필드/메서드 제한 표현, enum의 새 예외, orphanRemoval의 적용 대상 상태, `IDENTITY` 실행 설명, Java 접근제어 오류를 고칠 필요가 있다.

## 주장별 대조

### 엔티티 요건과 enum

- JPA 3.2에서 entity는 top-level 또는 static inner non-final 클래스이고, public/protected 무인자 생성자를 가져야 한다. entity의 모든 메서드와 persistent instance variable은 non-final이어야 한다. 따라서 “non-final 클래스, 무인자 생성자, final이 아닌 persistent 필드/메서드”는 방향은 맞지만 “필드/메서드”를 “persistent instance variable 및 모든 method”로 정밀화해야 한다. 근거: [Jakarta Persistence 3.2 명세 §2.1](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [Entity API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Entity.html).
- 기본 enum 매핑은 여전히 `ORDINAL`이다. 단, JPA 3.2 예외가 있다. enum 타입에 `@EnumeratedValue`로 표시한 final `String` 필드가 있으면 명시적 `@Enumerated`와 converter가 없는 경우 `STRING`으로 추론한다. `@Enumerated(EnumType.STRING)` 권장은 여전히 명료하고 유효하지만 “반드시 STRING을 써야 한다”는 식의 무예외 표현은 완화해야 한다. `@EnumeratedValue` 필드는 final이며 String 값들이 각 상수에 대해 non-null/distinct여야 한다. 근거: [Enumerated API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Enumerated.html), [EnumeratedValue API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EnumeratedValue.html).

### 관계 소유권, cascade, orphanRemoval

- 양방향 one-to-many/many-to-one에서 many 쪽이 owning side다. inverse `mappedBy`는 관계를 소유하는 entity의 자바 필드/프로퍼티 이름을 가리킨다. 명세도 양쪽 메모리 참조를 개발자가 함께 일관되게 갱신해야 한다고 명시한다. 예제의 `OrderLine.order`와 `mappedBy="order"` 설명은 맞다. 근거: [Jakarta Persistence 3.2 명세 §2.11, §3.3.4, §11.1.42](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [OneToMany API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/OneToMany.html).
- `cascade=PERSIST`/`ALL`은 JPA persist 상태 전파다. 명세의 동작은 관련 엔티티에 `persist`를 적용하는 것으로 정의한다. 이는 FK `ON DELETE CASCADE` 같은 DB 제약 옵션과 같은 개념이 아니다. 이 차이를 설명하는 본문은 정확하다. `CascadeType.ALL`은 persist뿐 아니라 remove 등도 전파하므로 사용 범위를 생명주기에 맞추라는 권고도 타당하다. 근거: [EntityManager API: persist](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html), [Jakarta Persistence 3.2 명세 §3.3.2–3.3.3](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).
- `orphanRemoval=true`는 관계에서 제거/널 처리된 target에 remove를 적용하고, flush 때 적용된다. 다만 orphan target이 new, detached 또는 이미 removed이면 이 의미가 적용되지 않는다. 따라서 본문의 “부모 컬렉션에서 빠진 자식을 삭제한다”는 요약에는 “managed 종속 엔티티의 경우, flush 시” 조건과 세 상태 예외를 덧붙여야 한다. 근거: [Jakarta Persistence 3.2 명세 §2.11, §11.1.41](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [OneToMany API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/OneToMany.html).

### IDENTITY, INSERT와 가시성

- JPA 표준은 `IDENTITY`가 DB identity column 전략임을 정의하고, `PrePersist` 콜백에는 IDENTITY 키가 아직 제공되지 않는다고 규정한다. 더 구체적으로 Hibernate 공식 가이드는 IDENTITY 키를 알기 위해 실제 row INSERT가 먼저 실행돼야 한다고 설명하며, Hibernate의 통상 동작은 `persist()` 직후 INSERT다. 따라서 원문의 “IDENTITY는 INSERT 때 DB가 키를 만든다”는 요약은 맞지만, 일반적인 `persist()` 호출 후 SQL은 전부 commit까지 미뤄진다고 읽히지 않게 별도 문장을 두는 편이 정확하다. 공급자/버전 동작을 표준 보장처럼 일반화하지 말고 Hibernate 동작으로 표기한다. 근거: [Jakarta Persistence 3.2 명세 §3.5.2, §11.1.21](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html), [Hibernate ORM 7.0 User Guide §3.7.10, §7.1.1](https://docs.hibernate.org/orm/7.0/userguide/html_single/Hibernate_User_Guide.html#identifiers-generators-identity).
- JPA는 `persist` 후 entity가 managed가 되고 DB 반영은 flush 또는 transaction commit 시점까지 일어날 수 있다고 규정한다. `flush()`는 persistence context를 DB에 동기화하지만 transaction commit과 같지 않다. 그러므로 flush 후 SQL이 실행됐더라도 commit 전 다른 transaction이 그 데이터를 볼 수 있다고 단정하면 안 된다. 이 보고서에서는 그 가시성을 특정 격리수준/DB별로 주장하지 않는다. 근거: [EntityManager API](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html), [Jakarta Persistence 3.2 명세 §3.3.2–3.3.4](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html).

### Spring Data auditing

- `@EnableJpaAuditing`으로 인프라를 활성화하고 entity 또는 mapped superclass에 `AuditingEntityListener`를 등록하는 패턴은 공식 가이드와 부합한다. `@CreatedDate`/`@LastModifiedDate`는 일시 정보를, `@CreatedBy`/`@LastModifiedBy`는 행위자를 기록한다. 날짜 필드만 기록한다면 `AuditorAware` 구현은 요구되지 않고, 사용자 필드를 기록할 때 현재 principal 제공용 `AuditorAware<T>` SPI가 필요하다. 따라서 P20의 날짜와 사용자 SPI 구분은 맞다. 코드의 `AuditorAware<String>` bean과 `auditorAwareRef`도 의도에 부합한다. 근거: [Spring Data JPA Auditing 4.1.1](https://docs.spring.io/spring-data/jpa/reference/auditing.html).

## 원본에서 확인한 정적 이슈

`OrderLine.java`에 package-private top-level enum `LineStatus`가 선언되어 있다. `OrderLine.getStatus()`는 public 메서드지만 반환 타입은 package-private이고, `/web/OrderResponse.java`는 `example.shop.domain`과 다른 `example.shop.web` 패키지에서 `l.getStatus().name()`을 호출한다. JLS 접근제어 관점에서 호출부가 반환 타입을 식별해야 하므로 컴파일 오류가 될 수 있는 접근성 문제다. 여기서는 코드를 컴파일하거나 실행하지 않았으므로 “컴파일 실패를 재현했다”고 말하지 않는다. 근거: [Java Language Specification §6.6](https://docs.oracle.com/javase/specs/jls/se25/html/jls-6.html#jls-6.6).

그 밖에 `BaseEntity`가 import한 `org.springframework.data.annotation.*`와 `jakarta.persistence.*`에 같은 단순 이름 annotation이 있는 부분은 `@CreatedDate` 등 Spring annotation을 의도한 것으로 보인다. 정확한 심볼 해석이나 앱 구동은 실행하지 않았다. 문서가 명시하듯 Spring 앱 미실행 상태다.

## 버전 및 검증 한계

- 이 작업은 공식 문서 근거 조사만 수행했다. 원본 Java 예제, Spring 앱, SQL 로그, 스키마 또는 응답을 실행·검증하지 않았다.
- 원본은 Spring Boot 4.1.1, Hibernate 7.4.5.Final, H2 2.4.240, JDK 21 조건의 별도 fixture를 추가할 수 있다고 지정하지만, 그 fixture는 본 조사에서 실행하지 않았다. 이는 문헌의 한계 조건으로만 기록하며 실행 결과나 SQL 횟수를 만들지 않는다.
- 원본의 주 실행 안내는 Java 25와 MySQL 8.4다. Java 25/MySQL에 대한 실행 검증은 없다. H2 별도 fixture 결과가 있더라도 MySQL과 동등하다고 간주할 수 없다.
- Hibernate 가이드 링크는 안정 최신판이 아닌 ORM 7.0 문서를 사용해 IDENTITY 의미를 확인했다. JPA 3.2 표준 근거와 공급자 고유 설명을 분리했으며 Hibernate 7.4.5.Final에 대한 실제 SQL 발생 시점·개수를 실증하지 않았다.
- 현재 문헌 확인일은 2026-10-20으로 기록했다. 온라인 공식 문서는 버전이 갱신될 수 있고, 이 보고서의 해석은 명시된 JPA 3.2 및 Spring Data JPA 4.1.1 문서 범위에 한정된다.
