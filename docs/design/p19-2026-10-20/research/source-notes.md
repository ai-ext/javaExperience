# P19 공식 문서 조사 노트

확인일: 2026-10-20 (Asia/Seoul)

범위: 입력 `LOCAL_HOME/research/javaexperience-p19-20261020/P19-source.md`의 버전/의존성/설정/테스트/헬스체크/Hikari 관련 주장 대조. 공식 프로젝트 문서와 공식 API 문서만 이용했다. 웹 도구가 반환한 문서 본문을 확인했으며, 로컬 프로젝트는 수정하거나 실행하지 않았다.

## 출처별 본문 요지와 한계

1. Spring Boot 4.1.1 Build Systems, https://docs.spring.io/spring-boot/reference/using/build-systems.html
   - 문서 헤더는 4.1.1. 본문은 `spring-boot-starter-web`이 Spring MVC/Tomcat용이며 `spring-boot-starter-webmvc`로 deprecated됨을 표기한다. `spring-boot-starter-webmvc`와 `spring-boot-starter-webmvc-test`를 각각 애플리케이션 및 테스트 starter로 수록한다. BOM으로 버전을 관리한다고 설명한다.
   - 확인한 내용은 Boot 문서의 starter 명명/권장 상태다. 개별 저장소 설정이 실제 어떤 dependency graph를 가져오는지 또는 특정 Gradle 플러그인의 동작까지 검증한 것은 아니다.

2. Spring Boot 4.1.1 Web, https://docs.spring.io/spring-boot/reference/web/index.html
   - “Most web applications” 시작 모듈로 `spring-boot-starter-webmvc`를 명시한다.
   - 문서 설명이며 실제 애플리케이션 구성 검증은 아니다.

3. Spring Boot 4.1.1 Testcontainers, https://docs.spring.io/spring-boot/reference/testing/testcontainers.html
   - `@Bean`으로 container를 관리하는 예시와, container bean이 다른 bean보다 먼저 시작되고 의존 bean 파괴 후 정지함을 설명한다. JUnit extension이 관리하는 static container는 클래스 실행 뒤, non-static은 각 테스트 메서드 뒤 정지한다. 캐시된 Spring context 재사용과 생명주기 충돌 가능성 때문에 context가 유지되는 경우 Spring bean 또는 `@ImportTestcontainers` 관리를 권한다. `@ServiceConnection`에는 `spring-boot-testcontainers` 테스트 의존성이 필요하다. `GenericContainer`는 이미지 형식 식별이 안 되므로 `@ServiceConnection(name=...)`가 필요할 수 있다.
   - 확인 본문은 Boot의 공식 권고. 이 문서가 MySQL 전용 모든 버전 조합을 실행 검증한 것은 아니다.

4. Testcontainers Java 2.0.5 MySQL module, https://java.testcontainers.org/modules/databases/mysql/
   - 공식 페이지의 Gradle/Maven 좌표는 `org.testcontainers:testcontainers-mysql:2.0.5`. 샘플은 `MySQLContainer`를 사용하고, 이 모듈만으로 DB driver JAR이 들어오지 않으므로 적절한 JDBC driver를 별도로 추가하라고 명시한다.
   - 기존 1.x 좌표 `org.testcontainers:mysql`와의 호환성/폐기 시점을 이 페이지가 직접 설명하지 않는다. 2.0.5 문서의 현재 사용 좌표를 근거로 교정하며 과거 버전 전반의 좌표 변천사로 일반화하지 않는다.

5. Spring Boot 4.1.1 Testing, https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html
   - MVC 테스트 설명에서 `@WebMvcTest`를 `spring-boot-webmvc-test` module과 연결한다. `spring-boot-starter-webmvc-test`는 Build Systems 공식 starter 목록에서 확인했다.
   - `spring-boot-starter-test` 자체가 포함하는 모든 focused test module이 특정 애플리케이션에 자동 추가되는지는 dependency 구성을 확인해야 한다. 보고서는 기존 starter-test를 반드시 제거하라는 뜻이 아니라, Boot 4 권장 모듈 구성을 반영하도록 의존성을 검토하라는 수준으로 권고한다.

6. Spring Framework TestContext SQL scripts, https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/executing-sql.html
   - `@Sql`을 테스트 전후 SQL 스크립트/구문 실행용으로 설명한다. 파싱 설정은 `@SqlConfig`가 담당한다. `@Sql`이 DDL schema validation을 수행하는 설정이라고 설명하지 않는다.
   - `@Sql`의 구체적인 사용 결과는 SQL 내용과 DB, 설정에 좌우된다. 본문은 `@Sql`이 Hibernate `ddl-auto=validate`를 대체하지 않는다는 구분의 근거다.

7. Spring Framework `@Sql`, https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-sql.html
   - 클래스 또는 메서드에 SQL script를 적용하는 annotation임을 보여준다. 별도 DDL validation 기능은 기술하지 않는다.

8. Spring Boot 4.1.1 SQL Databases, https://docs.spring.io/spring-boot/reference/data/sql.html
   - embedded H2/HSQL/Derby auto-configuration에는 해당 DB의 build dependency가 필요하다고 설명한다. JPA starter가 `spring-jdbc`를 전이로 제공할 수 있어도 H2 database 자체 dependency와는 별개다. 외부 URL이 정해진 H2 프로파일이어도 H2 driver/database artifact는 runtime/test runtime classpath에 필요하다.
   - 문서 예시는 HSQLDB이므로 H2 의존성의 좌표/범위는 보고서에서 특정하지 않는다. `application-h2.yml`은 YAML 문서만으로 dependency를 추가하지 않는다.

9. Hibernate ORM 7.4.5.Final Javadocs class lookup, https://docs.jboss.org/hibernate/orm/7.4/javadocs/org/hibernate/boot/model/naming/CamelCaseToUnderscoresNamingStrategy.html
   - 웹 도구의 해당 URL 직접 열기가 실패했다(접근 불가 응답). 다만 본 작업을 지시한 메인이 실제 7.4.5.Final JAR에서 class 존재를 확인했다고 전달했다. 이를 전제로 “없는 클래스”라고 기술하지 않는다.
   - 이 조사 경로에서는 Hibernate 7.4.5.Final의 해당 클래스 선언/Deprecated annotation을 공식 본문으로 검증하지 못했다. 따라서 deprecated인지 여부와 대체 권장 클래스/전략은 미확인으로 남기며 추측하지 않는다. Boot 4.1.1 API에서 확인된 `SpringImplicitNamingStrategy`는 implicit strategy이며 physical naming strategy를 대신하는 동일 개념이라고 단정할 수 없다. (https://docs.spring.io/spring-boot/api/java/org/springframework/boot/hibernate/SpringImplicitNamingStrategy.html)

10. Spring Boot 4.1.1 Actuator endpoints, https://docs.spring.io/spring-boot/reference/actuator/endpoints.html
    - 기본 health URL `/actuator/health`, endpoint의 노출과 접근 허용은 별개로 제어됨을 기술한다. Actuator REST API health 문서 https://docs.spring.io/spring-boot/api/rest/actuator/health.html 는 `/actuator/health/{component}`와 더 깊은 component path를 지원하며 세부 응답 노출은 `management.endpoint.health.show-details`로 제어된다고 설명한다.
    - DB component 이름/깊이는 구성 및 등록된 health contributor에 의존한다. root health와 `/health/db`의 존재를 모든 앱에서 무조건 보장한다고 해석하면 안 된다. `show-details: never`는 details 노출 설정이지 component 목록 자체를 숨긴다는 의미로 단정할 수 없다. component 공개 정책은 `show-components`와 함께 확인해야 한다.

11. HikariCP 공식 README, https://github.com/brettwooldridge/HikariCP
    - `connectionTimeout`: 풀에서 연결을 얻기 위해 기다리는 최대 시간(기본 30,000ms). `maxLifetime`: 풀 안 연결의 최대 수명. 사용 중인 연결은 만료 시각이 지나도 즉시 제거하지 않고 반환된 뒤 제거한다. DB/인프라의 연결 수명 제한보다 몇 초 짧게 둘 것을 권고한다. `maximumPoolSize`: idle+in-use 모두 포함한 풀 최대 크기이자 DB backend의 실제 연결 상한. 모두 사용 중일 때 대기자는 `connectionTimeout`까지 기다린다.
    - README는 일반 Hikari 동작 설명이다. 특정 MySQL 서버의 실제 `wait_timeout`, 배포 제한, 적절한 pool size는 조사/부하 측정 없이 정할 수 없다. 원문의 1,700,000ms는 예시값이지 보편 최적값이 아니다.

12. Spring Framework TestContext constructor injection (현행 reference), https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/fixture-di.html
    - 테스트 constructor parameter는 SpringExtension/TestContext의 주입 설정을 충족해야 한다. 단일 생성자라는 사실만으로 모든 JUnit 설정에서 자동 주입된다고 단정하지 말고, `@Autowired`, `@TestConstructor(autowireMode=ALL)` 또는 설정된 기본 모드를 확인해야 한다.
    - 검색 본문에 해당 조건이 나오지만 이번 작업에서 특정 Spring Framework 버전의 전체 상세 페이지를 독립적으로 고정/대조하지 못한 점은 한계다. 검토 대상은 “무표기 생성자 주입은 언제나 된다”는 식의 주장을 피하는 것이다.

## 적용 시 해석

- 명시 버전은 Boot 4.1.1, Testcontainers 2.0.5, Hibernate 7.4.5.Final이다. 이 중 Boot와 Testcontainers 세부 모듈은 공식 사이트에서 직접 확인했다. Hibernate class의 존재는 전달된 jar 확인 결과를 전제로 하되, deprecated 상태는 이 웹 확인 결과만으로는 확정하지 않는다.
- 자료의 예제 코드는 실행하지 않았다. Compose/MySQL/Docker/Boot 애플리케이션 실행, 테스트 성공 판정, 수정된 코드는 없다.
- URL별 확인 날짜는 본 노트 상단 날짜이며, docs 사이트가 최신판으로 redirect하는 경우 페이지 본문 version label을 따로 확인했다. 네트워크 도구가 제공하지 않은 내용은 미확인으로 남긴다.
