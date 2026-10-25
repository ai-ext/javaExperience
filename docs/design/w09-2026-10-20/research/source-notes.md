# 공식 출처별 확인 노트

확인일: 2026-10-20 (Asia/Seoul). 아래는 라이브 공식 문서 본문을 확인한 기록이다. URL은 각 출처의 본문 페이지다.

## 1. Hibernate ORM 7.4 User Guide

URL: https://docs.hibernate.org/orm/7.4/userguide/html_single/

- 확인 본문 요지: “Fetching” 및 `LazyInitializationException` 설명은 필요한 지연 연관을 Persistence Context가 닫히기 전에 초기화하라고 권고한다. 닫히기 전에 로드되지 않은 association에 접근하면 예외가 발생할 수 있다. `hibernate.enable_lazy_load_no_trans`는 unsafe로 표시되고 기본값은 false/disabled이며 사용을 권장하지 않는다.
- 날짜/버전: 사용자 지정 원문 URL `/7.4/`를 직접 열어 확인. 브라우저는 2026-10-20 현재 페이지를 읽었음. 가이드 본문에서 게시/개정일은 별도 확인하지 못함.
- 한계: 이 가이드는 Hibernate ORM 동작을 설명한다. Spring OSIV, 특정 Jackson 버전의 프로퍼티 탐색, 응답 JSON, 애플리케이션별 SQL 수를 직접 증명하지 않는다. 공식 문서가 예외 조건을 설명해도 모든 serializer 경로에서 예외가 난다는 의미는 아니다. Javadocs는 검색 결과에서 7.0 URL로 노출되어 7.4 사실의 근거로 사용하지 않았음.

## 2. Spring Boot Common Application Properties

URL: https://docs.spring.io/spring-boot/appendix/application-properties/index.html

- 확인 본문 요지: `spring.jpa.open-in-view`는 `OpenEntityManagerInViewInterceptor` 등록 설정이며, JPA EntityManager를 요청 처리 전체 동안 thread에 바인딩한다고 기술한다. 해당 속성 표의 기본값은 `true`로 표시된다.
- 날짜/버전: 현행 공식 Appendix 문서를 2026-10-20 확인. 이 URL은 버전 없는 현행 문서 경로이며 W09의 Boot 4.1.1 세부 버전과 동일하다고 단정하지 않음.
- 한계: 문서가 말하는 범위는 MVC 요청의 EntityManager 바인딩이다. 트랜잭션을 요청 내내 유지하거나 모든 lazy 접근이 성공한다는 보장이 아니며, 예외 부재·SQL 개수·성능도 약속하지 않는다.

## 3. Spring Data JPA 4.1 Projections

URL: https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html

- 확인 본문 요지: 페이지는 Spring Data JPA 4.1.1로 표시된다. 인터페이스 projection은 조회 결과를 runtime proxy로 제공하며, 닫힌 projection은 필요한 속성을 알 수 있어 실행 최적화가 가능하다. 열린 `@Value` projection은 임의 대상 속성에 접근할 수 있어 해당 최적화를 적용할 수 없다. JPA interface projection 구성은 대체로 Tuple 쿼리다. 클래스 DTO projection은 생성자 기반이며 proxy를 만들지 않고 중첩 projection을 적용할 수 없다. 파생 쿼리 projection은 최상위 속성 선택을 제한하지만 join으로 해석되는 nested property는 전체 nested property가 선택될 수 있다. JPQL DTO projection은 constructor expression을 쓸 수 있다.
- 날짜/버전: 페이지 본문에 Spring Data JPA 4.1.1. 라이브 확인일 2026-10-20.
- 한계: projection 선언만으로 모든 DB/provider의 실제 SQL 모양이나 열 수를 보장하지 않는다. DTO의 생성자/쿼리, provider, 데이터 구조를 함께 봐야 한다. 해당 페이지의 nested join 설명은 derived projection 맥락을 포함하므로 모든 사용자 작성 쿼리에 일괄 일반화하지 않는다.

## 4. MapStruct 1.6.3 Reference Guide

URL: https://mapstruct.org/documentation/1.6/reference/html/

- 확인 본문 요지: MapStruct는 컴파일 시 mapper interface 구현을 생성하는 Java annotation processor다. 구현은 reflection 없이 일반 Java 메서드 호출로 소스·대상 객체를 매핑한다. 생성 예제는 property 접근자 호출을 사용한다. 1.6.3 문서는 Spring component model에서 생성 구현을 DI 대상으로 사용할 수 있다고 설명한다.
- 날짜/버전: 버전 고정 1.6 문서 경로 및 본문으로 1.6.3 확인. 문서 사이트 릴리스 목록은 1.6.3을 2024-11-09 stable로 표시함. 라이브 확인일 2026-10-20.
- 한계: 생성 mapper의 동작이 SQL fetch 계획을 정의하지 않는다. 문서는 JPA 지연 필드가 언제 로딩되는지나 매퍼 실행 시 SQL 횟수를 정하지 않으며, 그 결론은 property 접근과 Hibernate 상태를 결합해 도출한 추론이다.

## 5. Java Language Specification, Java SE 25, Chapter 8

URL: https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html

보조 URL: https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html

- 확인 본문 요지: record component에 대응하는 필드는 `private final`이다. 참조형 final 변수는 같은 참조를 유지하지만 그 참조 대상이 가변 객체이면 내부 상태는 변할 수 있다. 따라서 record의 불변성은 참조/상태 재할당 수준이지 중첩 객체까지 깊은 불변이라는 보장은 아니다.
- 날짜/버전: 공식 Java SE 25 JLS. 검색/본문 현재판에서 확인일 2026-10-20.
- 한계: record의 언어 규칙을 설명하는 출처이며 특정 DTO 안의 컬렉션을 복사하는 구현 여부나 애플리케이션 계약은 판단하지 않는다.

## 기존 자료 대조

`/Users/ds/research/java-beginner-theory/01-jpa-associations.md`는 개념과 기존 용어를 파악하는 참고자료로만 읽었다. 그 문서의 Hibernate 7.2 등 기존 인용을 현행 근거로 재사용하지 않았다. 위 URL을 라이브로 다시 확인했으며, 이 파일은 자료 간 대조 노트이지 공식 출처가 아니다.
