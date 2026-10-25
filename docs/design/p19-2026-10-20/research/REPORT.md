# P19 원문 기술 검토 및 교정 권고

**검토 기준일:** 2026-10-20  
**대상:** `LOCAL_HOME/research/javaexperience-p19-20261020/P19-source.md`  
**검토 범위:** Spring Boot 4.1.1, Testcontainers 2.0.5, Hibernate 7.4.5.Final을 중심으로 의존성 좌표와 권장 모듈, 테스트 주입/SQL 초기화, H2 프로파일, naming strategy, Actuator health, Hikari 설정의 공식 문서 대조.

## 요약

원문은 JDBC URL과 커넥션 풀, ORM 설정을 연결해 설명하는 큰 흐름은 유지할 만하다. 다만 버전이 명시된 예제라면 의존성 이름과 권장 구성이 현재 문서와 맞아야 한다. 가장 직접적인 수정은 `spring-boot-starter-web`을 Boot 4.1.1의 권장 모듈인 `spring-boot-starter-webmvc`로 교체하고, Testcontainers 2.0.5의 MySQL 의존성 좌표를 `org.testcontainers:mysql`에서 `org.testcontainers:testcontainers-mysql`로 바로잡는 일이다. 테스트 코드에는 추가로 두 가지 조건을 밝혀야 한다. 단일 생성자라는 이유만으로 JUnit 테스트 클래스 생성자 주입이 항상 활성화되는 것은 아니며, `@Sql`은 스크립트를 실행하는 도구이지 Hibernate의 schema validation을 실행하지 않는다.

H2 프로파일은 URL과 설정만으로 데이터베이스를 제공하지 않는다. H2 라이브러리가 해당 실행 classpath에 있어야 한다. Actuator 문구는 health component의 실제 등록·노출 조건을 빠뜨려 결과 URL을 보장하는 것처럼 보인다. Hibernate naming strategy는 “클래스가 없다”는 식으로 고치면 안 된다. 메인이 실제 Hibernate 7.4.5.Final JAR에서 클래스 존재를 확인한 상태지만, 이번 공식 웹 조사에서는 해당 Javadoc 원문을 읽지 못해 deprecated 여부와 대체 권장 방식을 확정하지 못했다. 그 구분을 남긴 채 검증된 설명으로 제한해야 한다.

## 수정 우선순위

### 1. Boot 4.1.1 web starter 명칭을 권장 구성으로 갱신

원문 §2.1의 `implementation("org.springframework.boot:spring-boot-starter-web")`는 Boot 4.1.1에서도 존재한다. 그러므로 “더 이상 쓸 수 없다”거나 “artifact가 없다”고 쓰면 부정확하다. 하지만 Boot 4.1.1 Build Systems 목록은 이 starter를 Spring MVC용이라고 설명하면서 `spring-boot-starter-webmvc`로 deprecated되었다고 표시한다. `spring-boot-starter-webmvc`는 MVC와 Tomcat starter, `spring-boot-starter-webmvc-test`는 MVC/Tomcat 테스트 starter로 각각 목록에 올라 있다. Web 문서도 대부분의 웹 애플리케이션이 `spring-boot-starter-webmvc`로 시작한다고 안내한다.

따라서 신규 예제 의존성은 `spring-boot-starter-webmvc`로 바꾸는 편이 정확하다. 기존 프로젝트 유지보수 설명이 필요하면 `starter-web`은 현재 사용 가능하지만 deprecated이고 권장 대체가 `starter-webmvc`라고 함께 적는다. 테스트 dependency는 무조건 현재의 `spring-boot-starter-test`를 지우라는 의미가 아니다. Boot 4의 테스트 지원이 기능별 `-test` 모듈로 나뉘므로 이 프로젝트가 필요한 테스트 범위에서 `spring-boot-starter-webmvc-test`를 포함해야 하는지 명시적으로 대조하라는 교정이다. 원문의 일반 `spring-boot-starter-test`가 JUnit/AssertJ 기반 테스트를 지원한다는 설명과 기능별 테스트 모듈의 존재는 양립할 수 있다.

### 2. Testcontainers 2.0.5 좌표를 정확히 수정

§2.1의 `testImplementation("org.testcontainers:mysql")`는 원문이 지정한 2.0.5 사용 예와 맞지 않는다. Testcontainers Java의 MySQL 모듈 공식 페이지는 Gradle 좌표를 `org.testcontainers:testcontainers-mysql:2.0.5`로 보여준다. 문서 예제에서 version을 생략하는 BOM 구성을 사용할 수 있더라도 artifact 이름은 `testcontainers-mysql`이다. 원문처럼 Boot dependency management만으로 Testcontainers 모듈까지 버전이 관리된다고 독자가 오해하지 않도록, 별도 Testcontainers BOM 사용 여부 또는 해당 모듈 버전을 명확히 해야 한다. 조사 범위에서는 Boot 4.1.1 BOM이 해당 Testcontainers 2.0.5 모듈 버전을 관리하는지 확인하지 않았다.

패키지 `org.testcontainers.mysql.MySQLContainer`와 클래스명은 공식 MySQL 모듈의 예시와 일치한다. 이 항목을 임의로 옛 패키지로 바꿀 근거는 없다. MySQL module JAR만으로 Connector/J가 자동 추가되지 않는다는 주의도 공식 문서에 있다. 애플리케이션 runtime의 `mysql-connector-j`를 테스트 runtime classpath에서도 사용할 수 있는 구성인지 dependency scope를 함께 확인하라는 설명을 넣어야 한다. 기존 원문의 `runtimeOnly`는 Gradle 테스트 runtime에서 일반적으로 보이지만, 이번 보고서는 실제 dependency graph를 실행하지 않았으므로 프로젝트별 확인 대상으로 둔다.

원문의 Spring-managed `@Bean` 컨테이너 방식은 좋은 방향이다. Boot 문서는 컨테이너 bean을 다른 bean보다 먼저 시작하고 의존 bean을 정리한 뒤 컨테이너를 정지시키며, context cache와 JUnit extension 종료 시점이 충돌할 수 있다고 설명한다. 따라서 “Spring context 수명과 맞춰 bean 방식을 우선”이라는 권고는 공식 lifecycle 설명과 부합한다. 다만 코드에 `@Testcontainers`를 붙였다고 해서 bean 방식과 JUnit extension 방식이 모두 반드시 필요한 것은 아니다. bean으로 컨테이너를 관리하는 코드에서는 annotation이 실질적으로 무엇을 관리하는지 혼동되지 않도록 불필요한 선언 여부를 재검토하라고 권한다. Boot의 `@ServiceConnection` 사용에는 `spring-boot-testcontainers` 테스트 의존성이 필요하다는 점은 이미 원문 dependency에 포함되어 있다.

### 3. 테스트 클래스 생성자 주입에 조건을 붙임

원문 테스트는 `CustomerRepositoryTest(CustomerRepository repository)`라는 package-private 생성자에 `@Autowired`가 없다. Spring TestContext의 JUnit Jupiter 테스트 생성자 주입은 매개변수에 `@Autowired`를 붙이거나, `@TestConstructor(autowireMode = ALL)` 또는 적용 중인 기본 autowire mode 설정을 통해 활성화할 수 있다. 기본 설정이 `ALL`인 실행 환경이라면 현재 형식이 동작할 수 있지만, 아무 설정 없이 모든 환경에서 자동 주입된다고 제시하면 과장이다.

교정은 코드 예제의 생성자에 `@Autowired`를 추가하거나 `@TestConstructor`를 명시하는 방식이 가장 이해하기 쉽다. 필드 주입/메서드 주입으로 변경하는 것도 가능하지만 예제 전체의 스타일을 바꿀 이유는 없다. 이 권고는 실행 결과가 아니라 Spring TestContext의 생성자 주입 조건을 독자에게 드러내기 위한 것이다. 이번 작업에서는 테스트를 실행하지 않았으므로 “테스트 통과”라는 결론은 없다.

### 4. `@Sql`과 `ddl-auto=validate`의 역할을 분리

§3.2는 `ddl-auto=validate`로 두었기 때문에 최초 테이블을 SQL로 만든다고 설명한다. 그 설명은 맞다. 바로 다음에는 `sql.init.mode=never`라서 CLI 또는 Flyway로 스키마를 만들라고 한다. 이는 앱 시작 시 Boot SQL initialization을 끄겠다는 설정과 일관된다. 다만 테스트 예제에 `@Sql` import가 있지만 annotation 자체는 코드에 붙어 있지 않다. 사용하지 않는 import는 제거해야 한다. 만약 테스트에서 schema script를 실행하려는 의도라면 `@Sql("/...")`를 실제 클래스/메서드에 선언하거나 Flyway의 test context migration을 이용하도록 예제 목적을 분명히 해야 한다.

`@Sql`은 Spring TestContext에서 DB에 SQL script 또는 statement를 테스트 전후로 실행하는 annotation이다. `@SqlConfig`는 script parsing 설정을 제공한다. 이 기능만으로 Hibernate가 entity mapping과 schema를 비교하는 `validate` 절차를 수행하는 것은 아니다. 원문에 “`@Sql`로 validate한다”는 주장은 없으므로 이 부분은 오류 판정보다 import/의도 불일치 정리 권고다. `@Sql`을 언급하는 문맥에서 Hibernate validation과 혼동하지 않도록 한 문장 덧붙일 수 있다.

### 5. H2 프로파일은 라이브러리 dependency가 필요

§2.3의 `application-h2.yml`에는 `jdbc:h2:mem:...` URL이 있지만, §2.1 의존성에는 H2 artifact가 없다. Boot의 SQL 문서는 embedded H2 auto-configuration에 선택한 DB의 build dependency가 필요하다고 명시한다. H2를 URL로 명시해도 드라이버/DB 구현체가 classpath에 없으면 연결할 수 없다. 따라서 H2 프로파일을 예제로 제공하려면 `runtimeOnly("com.h2database:h2")` 또는 테스트 전용 사용 의도에 맞는 test runtime dependency를 추가하라는 권고를 적어야 한다. 현재 `application-h2.yml`만으로는 독립적으로 사용할 수 없다.

정확한 scope는 H2 프로파일을 일반 애플리케이션 실행에 쓰는지, 테스트에서만 쓰는지에 따라 선택해야 한다. 자료는 “빠른 단위 개발 프로파일”이라고 표현하지만 `@SpringBootTest` 같은 통합 문맥과도 혼용될 수 있어 scope를 단정하지 않는다. 실제 H2/MySQL 호환 동작이나 스키마 migration 호환 여부는 이 검토에서 실행하지 않았다.

### 6. Naming strategy는 존재 여부, deprecated, 권장 대안을 각각 구분

원문은 `org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy`를 physical strategy로 지정하고, `OrderItem.productId`가 `order_item.product_id`로 변환된다고 설명한다. 전달받은 확인에 따르면 Hibernate 7.4.5.Final JAR에 이 클래스는 존재한다. 따라서 클래스가 없다고 단정하는 수정은 금지해야 한다. 반대로 이 사실만으로 해당 클래스가 최신 권장 방식이며 deprecated가 아니라고 단정할 수도 없다.

Hibernate 7.4.5.Final의 공식 Javadoc URL을 웹 도구로 열었으나 접근 오류가 발생했다. 공식 문서 본문에서 클래스 선언의 deprecated annotation, since/version 표시, 대체 클래스를 확인하지 못했다. 이번 공식 조사에서 확인한 Boot API의 `SpringImplicitNamingStrategy`는 이름 그대로 Hibernate의 **implicit** naming strategy이며, 원문의 `physical-strategy`와 같은 역할이라고 볼 수 없다. 대체재라고 임의 안내하면 개념이 달라 오교정이 된다. 따라서 원문에는 우선 “현재 classpath에서 해당 클래스가 제공되는지, Hibernate 7.4.5.Final API의 deprecated 표기와 migration guidance를 확인한 뒤 사용한다”는 검토 메모를 남기고, 대체 방식을 확정하기 전에는 클래스 자체를 바꾸지 말아야 한다. 보고서 작성 시점의 상태는 **존재: 메인의 실제 JAR 확인을 전제로 함 / deprecated: 공식 웹 자료로 미확인 / 대체 권장 방식: 미확인**이다.

### 7. Actuator health URL과 세부 정보 공개 문구 보완

§3.3은 `curl /actuator/health`의 기대값을 `{"status":"UP"}`으로 쓰고 “또는 `/actuator/health/db`의 DB 상태를 확인”하라고 한다. endpoint 문서에 따르면 기본 health 경로는 `/actuator/health`이지만, endpoint가 HTTP로 노출되고 접근이 허용되어야 실제로 호출할 수 있다. component 세부 경로는 health contributor가 등록된 이름과 구조에 따라 제공된다. REST API 문서는 `/actuator/health/{component}` 및 더 깊은 component 경로 탐색을 지원한다고 설명하지만, 모든 애플리케이션에 `db` component가 반드시 생성된다는 보장은 아니다. DataSource health contributor가 구성되고 health endpoint 접근이 허용된 조건을 함께 적어야 한다.

`show-details: never`는 detail 필드의 노출을 제어한다. component 자체 노출 정책은 `management.endpoint.health.show-components`와 구분해야 한다. 이 구성에서 `/health/db`가 응답될 것이라고 무조건 단정하는 문장과 “details를 never로 하면 component 목록도 감춰진다”는 해석은 피한다. Health endpoint가 UP이어도 엔드포인트 노출이나 인증·인가 설정에 따라 외부 호출 결과는 달라질 수 있다.

### 8. Hikari 수치의 의미와 일반화 범위 정리

치트시트의 용어는 대체로 맞지만 용어를 더 정밀하게 쓸 수 있다. HikariCP README 기준 `maximumPoolSize`는 유휴와 사용 중 연결을 합한 풀의 최대 크기로, 해당 풀에서 DB backend로 맺는 실제 연결 수의 상한이다. 값이 크면 무조건 빨라지지 않는다는 원문 경고는 타당하다. 다만 DB 전체 연결 한도에는 다른 애플리케이션 인스턴스, 관리 접속 등도 함께 들어가므로 한 풀 값만으로 DB 한도를 판단하지 말라고 덧붙이면 좋다.

`connectionTimeout: 30000`은 30초 동안 연결을 기다린다는 의미다. 정확히는 “풀에서 연결을 얻기 위해 호출자가 기다리는 최대 시간”이며, MySQL 접속 자체의 연결 handshake timeout이나 SQL 실행 제한시간과 같지 않다. `maxLifetime`은 연결을 풀에서 무한정 재사용하지 않도록 하는 수명 상한이다. 사용 중인 연결을 시간 도달 즉시 강제 종료하지 않고, 반환되었을 때 제거한다. Hikari는 DB나 인프라의 connection lifetime 제한보다 몇 초 짧게 설정할 것을 권고한다.

원문의 `1700000`ms는 약 28분 20초로, 실제 서버 제한보다 짧다면 가능한 예시지만 MySQL의 모든 환경에 맞는 값은 아니다. 서버의 실제 `wait_timeout`, 프록시/방화벽의 idle/lifetime 정책, Hikari 배포 버전과 운영 패턴을 확인해 설정해야 한다. “MySQL wait_timeout보다 짧게”는 조건부 운영 가이드로 표현하고 수치를 보편 기준으로 제시하지 않는다. 또 `wait_timeout`은 비활성 연결 동작과 관련된 서버 변수인 반면 Hikari `maxLifetime`은 풀 연결의 전반적인 최대 수명을 정하므로 두 숫자의 단순 비교만으로 모든 네트워크 단절을 방지한다고 약속할 수 없다.

## 편집 적용안

1. §2.1: `spring-boot-starter-web`을 신규 예제에서 `spring-boot-starter-webmvc`로 수정하고, Boot 4.1.1에서 전자는 deprecated임을 짧게 밝힌다. `spring-boot-starter-webmvc-test`를 테스트 구성 검토 항목으로 추가한다.
2. §2.1: Testcontainers MySQL artifact를 `org.testcontainers:testcontainers-mysql`로 고치고 버전 2.0.5 또는 해당 BOM 사용을 명확히 한다. 2.x 모듈에서 Connector/J를 별도로 제공해야 함을 적는다.
3. §2.3: H2 설정과 같은 Gradle 예제에 H2 dependency를 추가하거나, H2 설정은 해당 dependency를 별도 추가해야 작동한다고 설명한다.
4. §3.4: 테스트 생성자 주입을 명시적으로 활성화한다. JUnit `@Testcontainers`와 Spring `@Bean` 컨테이너 lifecycle 선언이 중복되는지 확인한다. `@Sql`을 쓰지 않으면 import를 제거하고, 쓸 경우 실제 SQL 경로를 선언한다.
5. §3.3/치트시트: `/actuator/health/db`는 DataSource health contributor 및 endpoint 접근/노출 조건에 의존한다고 고친다. details와 components 노출 설정을 구별한다.
6. §2.3 및 치트시트: naming strategy는 존재하지 않는다고 정정하지 않는다. deprecated 상태와 권장 대체는 Hibernate 7.4.5.Final 공식 API 본문을 추가 확인하기 전까지 미확인으로 표시한다.
7. §2.3/치트시트: Hikari 설정은 뜻을 정확히 하되 `maxLifetime` 예시 수치는 실제 DB/인프라 제한에 따라 조정하는 예시값이라고 명시한다.

## 검증 범위와 제한

이번 결과는 원문에 대한 교정 권고 보고서다. 공식 웹 문서 본문은 `LOCAL_HOME/research/javaexperience-p19-20261020/_data/source-notes.md`에 URL, 요지, 확인일, 확인 한계와 함께 정리했다. Boot 4.1.1 Build Systems/Web/Testing/SQL/Actuator, Testcontainers MySQL 모듈 및 Spring TestContext, HikariCP 문서를 확인했다. Hibernate 7.4.5.Final naming strategy Javadoc 직접 접근은 실패했으므로 deprecated 표시 및 대체 권장안을 미확인으로 남겼다.

어떤 코드도 생성하거나 입력 원문을 수정하지 않았다. Docker, MySQL, Spring Boot 애플리케이션 또는 테스트를 실행하지 않았으며, 실행 성공/컴파일 성공을 주장하지 않는다. 이 문서는 공식 문서 조사에 근거한 정적 검토이므로 실제 dependency resolution, profile 활성화, health component 응답, DB 스키마 호환성은 검증 대상 밖이다.
