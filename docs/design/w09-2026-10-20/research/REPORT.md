# W09 DTO 관련 공식 문헌 검증

확인일: 2026-10-20 (Asia/Seoul)

## 결론

근거 링크: [Hibernate ORM 7.4 User Guide](https://docs.hibernate.org/orm/7.4/userguide/html_single/), [Spring Boot application properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html), [Spring Data JPA 4.1 projections](https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html), [MapStruct 1.6.3](https://mapstruct.org/documentation/1.6/reference/html/), [Java SE 25 JLS, record classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html). URL별 확인 본문 요지·버전/날짜·한계는 [`_data/source-notes.md`](_data/source-notes.md)에 기록했다.

W09의 핵심 논지는 공식 문서와 부합한다. 엔티티를 JSON 응답으로 반환하면 응답 변환이 엔티티의 접근자와 객체 그래프를 탐색하는 동안 지연 데이터 접근이 뒤늦게 일어날 수 있다. 세션이 닫힌 채 미초기화 프록시나 컬렉션에 접근하면 Hibernate `LazyInitializationException` 조건에 해당한다. 반면 OSIV는 Spring MVC 요청 처리 동안 EntityManager를 스레드에 바인딩해 지연 로딩이 일어날 수 있는 구간을 넓힌다. 이것은 요청 중 접근이 언제나 성공한다거나 예외가 불가능하다는 보증이 아니다. 실제 연결·트랜잭션·세션 상태, 접근 대상과 설정을 확인해야 한다.

DTO는 응답 필드를 명시하는 데 유용하지만, DTO라는 타입만으로 조회 계획이 정해지는 것은 아니다. 수동 매퍼나 MapStruct 생성 코드가 `entity.getCustomer().getName()`처럼 연관 getter를 호출하면 필요한 값이 이미 로드되지 않은 상황에서 ORM 접근이 뒤따를 수 있다. 여러 루트 객체를 반복 매핑하면 추가 조회가 반복될 가능성이 있어 N+1 위험이 남는다. 이 문헌 검토로 SQL 수나 N+1의 실제 발생을 입증하지는 않는다. 그런 결론은 조회·매핑 경로와 실행 로그를 별도로 확인해야 한다.

단순한 읽기 결과는 DTO 프로젝션과 비교할 수 있다. Spring Data JPA 문서는 인터페이스 프로젝션을 대체로 `Tuple` 조회와 런타임 proxy로 구성한다고 설명하고, 닫힌 projection은 필요한 속성을 알고 있어 최적화 가능성이 있다고 한다. 클래스 기반 projection은 DTO의 생성자 입력 속성을 이용하고 proxy를 만들지 않으며 중첩 projection을 적용할 수 없다. JPA derived projection은 최상위 속성 선택을 제한하지만, join으로 해석되는 중첩 속성은 관련 중첩 속성 전체가 선택될 수 있다. 그러므로 인터페이스 projection이라고 항상 최소 열만 읽는다고 단정할 수 없고, 실제 쿼리 문법과 반환형을 확인해야 한다. DTO 클래스 직접 매핑과 쿼리에서 스칼라 값을 선택하는 클래스 projection은 책임과 조회 경로가 다르다.

MapStruct 1.6.3은 annotation processor로 mapper 구현을 컴파일 시 생성하며 생성 코드는 reflection 대신 일반 Java 메서드 호출을 사용한다. 이는 객체 변환 구현 방식에 관한 사실이다. 데이터베이스에서 어떤 연관을 언제 가져올지는 repository/query의 fetch 계획에 남아 있으며 MapStruct가 이를 자동 결정한다고 문서화되어 있지 않다. 따라서 매핑 방식 선택과 fetch 계획을 함께 설계하되 둘을 동일시하지 않는다.

Java record의 컴포넌트 필드는 `final` 참조지만 참조 대상 객체까지 자동으로 불변이 되지는 않는다. `List` 컴포넌트는 같은 리스트 참조를 유지해도 리스트 내용이 바뀔 수 있다. 따라서 record를 얕은 불변 데이터 운반체로 설명하는 것은 타당하며, 깊은 불변성이 필요하면 복사·불변 객체 여부를 따로 설계해야 한다.

## 적용 범위를 정확히 말하기

“지연 로딩은 세션이 닫히면 실패한다”는 말은 초기화되지 않은 지연 데이터에 실제로 접근하려는 경우를 가리킨다. 이미 초기화된 값, 식별자만 필요한 프록시 접근 등은 다를 수 있다. Hibernate 7.4 문서는 필요한 association을 문맥이 닫히기 전에 로드하는 것을 권하고, 여러 관계를 무조건 join fetch 하라는 뜻으로 제시하지 않는다. 가이드도 join fetch의 적용 대상을 제한해 설명하므로, 조회 화면에 필요한 범위를 정하고 결과 형태에 맞는 전략을 택한다.

OSIV의 범위는 영속성 컨텍스트의 생존 범위와 데이터베이스 트랜잭션 범위를 구분해야 한다. Spring Boot 문서가 설명하는 것은 MVC 요청 처리 동안 EntityManager를 스레드에 바인딩하는 interceptor다. 이로 인해 응답 변환 단계가 EntityManager를 사용할 여지가 생길 수는 있지만, 쿼리 실행 가능성은 구체적인 상태와 구성에 달려 있다. DB 장애, 분리된/닫힌 상태, 잘못된 접근, 그 밖의 런타임 오류가 사라진다는 뜻은 아니다. 따라서 W09의 OSIV 문장을 보편적인 결과처럼 읽히지 않도록 “설정과 접근 상태가 허용하면 직렬화 중 지연 조회가 가능하다”고 제한하는 편이 정확하다.

프로젝션 선택도 “필요한 열만”이라는 목표와 실제 쿼리 결과를 구분한다. 인터페이스 projection의 닫힌 형태는 Spring Data가 필요한 backing 속성을 알 수 있다는 뜻이지, 어떤 입력 쿼리에서도 DB가 반드시 그 열만 반환한다는 보증이 아니다. 열린 projection은 `@Value` 표현식이 대상 객체의 다른 속성도 참조할 수 있어 해당 최적화가 어렵다. 클래스 DTO projection은 생성자에서 입력 속성을 결정할 수 있지만, 명시한 JPQL constructor expression, 파생 쿼리, native query는 동작 조건이 서로 다르다. 특히 nested property가 join을 요구하는 파생 projection의 한계를 모든 interface projection이나 사용자 JPQL에 확대해서는 안 된다.

매퍼에서는 생성된 코드도 결국 접근자 호출을 실행한다. MapStruct가 컴파일 시 구현을 만든다는 사실은 매핑 로직을 어디서 실행할지 설명하지만, 관계를 fetch할 쿼리나 트랜잭션을 자동 설계한다는 뜻은 아니다. 수동 매핑도 마찬가지다. 여러 엔티티를 순회해 연관 getter를 읽는 구조라면 N+1은 검토할 위험이다. 확정하려면 실제 repository query, fetch 상태, 데이터 분포, SQL 로그를 확인해야 한다. 본 보고서는 그 실행 증거를 만들지 않았다.

## W09에서 유지하거나 다듬을 점

- 유지: 미초기화 지연 연관을 닫힌 Session에서 초기화하면 예외가 날 수 있고, getter 기반 직렬화/매핑 중 접근이 조회를 유발할 수 있다는 설명.
- 표현을 제한: “OSIV가 켜져 있으면 변환 중 조회되어 예외가 쿼리 폭증으로 바뀐다”는 문장은 가능한 결과로 표현해야 한다. OSIV 자체가 폭증을 보장하지 않으며 요청 중 모든 접근의 성공도 보장하지 않는다.
- 구체화: Spring Boot 문서의 OSIV 범위는 Spring MVC에서 `OpenEntityManagerInViewInterceptor`가 요청 처리 전체 동안 EntityManager를 thread-bound 상태로 두는 것이다. 트랜잭션 전체가 요청 끝까지 유지된다는 뜻과 혼동하지 않는다.
- 비교 보강: 클래스 기반 projection은 DTO constructor input properties로 필드 선택을 최적화할 수 있지만 실제 결과는 조회 방식에 달려 있다. 인터페이스 projection의 닫힌/열린 구분과 nested join 한계를 함께 설명한다.
- 유지: DTO 매핑이나 MapStruct 적용만으로 N+1이 해결되지 않는다는 설명. 다만 실행 전에는 가능성/위험으로 표기하고 실제 SQL 횟수는 주장하지 않는다.
- 유지: record 자체가 깊은 불변성을 보장하지 않는다는 설명.

## 메인 세션 격리 fixture에 대한 경계

예정된 H2/Hibernate/Jackson fixture는 해당 조합 및 fixture 설정에서 지연 연관 접근과 직렬화 동작을 재현·관찰하는 실험으로 보고한다. 이는 MySQL 동작, Spring Boot 자동 설정, Spring MVC 요청 생명주기/OSIV, 실제 HTTP 응답을 실행한 결과와 다르다. 특히 OSIV 범위를 실험하려면 Spring MVC와 해당 interceptor 설정이 fixture에 실제 포함되어 있어야 한다. 본 연구 단계에서는 fixture를 실행하지 않았으며, 그 결과를 가정하거나 SQL 수·성능·HTTP 응답으로 제시하지 않는다.

## 검증 범위와 재현 계획의 구분

메인 세션에서 예정한 격리 fixture는 H2와 Hibernate를 이용해 매핑/세션 종료 조건을 만들고, Jackson 직렬화가 getter를 어떤 경로로 호출하는지 관찰할 수 있다. fixture에 쿼리 카운터를 넣는 경우에도 결과는 그 fixture의 스키마, seed 데이터, Hibernate 버전, 설정에 한정된다. 이를 MySQL의 SQL 생성이나 비용, Boot 자동설정 또는 실제 MVC `OpenEntityManagerInViewInterceptor` 동작으로 확대할 수 없다. OSIV 검증을 하려면 Spring MVC 컨텍스트에서 해당 interceptor의 등록 여부와 요청 종료 시점까지 별도로 포함해야 한다. HTTP status/body 검증은 서버와 클라이언트를 실제 구동해 요청을 보낸 경우에만 보고할 수 있다. 이 작업은 그러한 실행을 하지 않았으므로 모든 실험값은 미보고 상태다.

## 근거와 추론 / 미확인

**공식 문서가 직접 뒷받침:** Hibernate 7.4는 지연 연관을 Persistence Context 종료 전에 초기화하라고 권고하고, 닫힌 문맥에서 접근 시 `LazyInitializationException`을 설명한다. 위험 설정 `hibernate.enable_lazy_load_no_trans`의 기본값은 비활성화다. Boot 문서의 OSIV는 MVC 요청 전체 EntityManager 바인딩이다. Spring Data JPA는 projection 유형별 동작과 중첩 속성의 조인 선택 한계를 명시한다. MapStruct는 생성 코드의 일반 메서드 호출 방식을 설명한다. Java record 컴포넌트는 `final` 필드로 대응한다.

**문헌에서 도출한 추론:** 접근자 기반 mapper/serializer가 지연 필드에 닿을 때 추가 ORM 조회가 가능하고, 여러 결과를 반복 매핑하면 N+1 형태가 가능하다. OSIV의 가용 범위가 늘면 조회가 웹 응답 변환 시점까지 지연될 수 있다. 이들은 구현·상태를 전제로 한 조건부 결론이다.

**미확인/미실행:** 해당 예제의 실제 SQL 문장 수, 쿼리 계획, 시간·메모리 성능, 반환 JSON, 실제 HTTP 상태/본문, MySQL/Boot 구성에서의 결과. Hibernate 문서만으로 Jackson 구체 버전의 serializer 접근 순서도 확정하지 않는다.
