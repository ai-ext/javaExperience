# V04 test DB 전략 보강 조사

확인일: 2026-10-20

## 결론

Spring Boot 4.1.1에서 `@AutoConfigureTestDatabase.replace`의 정확한 기본값은 `NON_TEST`다. `NON_TEST`는 모든 자동 구성 DataSource를 교체한다는 뜻이 아니다. `ContainerImageMetadata`를 가진 DataSource(예: `@ServiceConnection`), `@DynamicPropertySource`가 제공한 `spring.datasource.url`, Testcontainers JDBC URL은 test database로 판정되어 기본 교체 대상에서 제외된다. 따라서 “기본적으로 언제나 임베디드 DB로 교체되므로 컨테이너 테스트에 `NONE`이 필수”라는 일반화는 틀리다. `ANY`는 수동/자동 구성 모두 교체, `AUTO_CONFIGURED`는 자동 구성만 교체, `NONE`은 교체하지 않는 명시값이다. `replace=NONE`은 의도를 명확히 하는 선택지지만 test database 연결 유지의 보편적 필수조건은 아니다. 기본 보호가 실제 연결을 유지하는지 대상 프로젝트의 별도 실행 실험으로 확인해야 한다.

Boot 4 테스트 의존성은 feature-specific test module 및 `spring-boot-testcontainers`를 포함하는 구조다. Testcontainers 2.0부터 artifact 명명은 `org.testcontainers:mysql`에서 `org.testcontainers:testcontainers-mysql`로 바뀌고 새 패키지는 `org.testcontainers.mysql.MySQLContainer`다. Boot 4.1.1 BOM에서 관리되는 Testcontainers 버전은 이번 웹 조사에서 공식 primary 원문으로 pin하지 못했으므로 resolved dependency 확인 전까지 **미확인**으로 둔다. 상위 Testcontainers 2.0.5 릴리스는 확인됐지만 이를 Boot BOM 관리버전이라고 추론하면 안 된다.

제안된 native MySQL fixture가 실행된다면 실제 MySQL 엔진과 SQL 동작을 확인한다. 그것만으로 Testcontainers 이미지/수명, Docker, Boot `@ServiceConnection`, 컨테이너 정리 동작을 검증한 것은 아니다. 컨테이너 원문 RepositoryTest는 Testcontainers 환경이 없으면 compile-only로 한정한다. 별도 adapter slice test를 추가한다면 원문 assertion body를 옮긴 것인지 toy entity를 쓴 것인지 보고서에 분리한다. 이 보고서는 문헌 조사이며 MySQL/Java/SQL/앱 실험은 실행하지 않았다. 메인 실험 제안도 미실행이다.

## 실행 실험을 설계할 때의 판정 기준

- Spring TestContext의 테스트 관리 트랜잭션은 테스트 실행 스레드에 결합된다. `@Transactional` 테스트 메서드는 기본 rollback이고, `TestTransaction.flagForCommit(); TestTransaction.end()`로 commit 경로를 관찰한 뒤 필요하면 새 트랜잭션을 시작할 수 있다. 기본 rollback 관찰과 커밋 후 이벤트 관찰은 별도 케이스로 둔다. `@TransactionalEventListener(AFTER_COMMIT)`은 실제 commit 경로가 있어야 검증 가능하다.
- `@Sql`의 `INFERRED`는 기존 Spring 관리 트랜잭션에 참여할 수 있으면 참여하고, 없으면 transaction manager로 트랜잭션을 시도한다. `ISOLATED`는 독립 트랜잭션으로 실행하고 commit한다. `BEFORE_TEST_METHOD` 및 `AFTER_TEST_METHOD`는 실행 phase 이름일 뿐 cleanup 의미를 자동 보장하지 않는다. 테스트 rollback에 포함되는 fixture와 별도 commit되는 정리는 환경별로 판정해야 한다.
- `schema.sql`과 `seed.sql`을 모두 `spring.sql.init.schema-locations`에 넣는 설정도 두 파일 내용이 해당 SQL 초기화 parser에서 실행 가능한 문장이면 실행될 수 있지만, 관례상 schema DDL은 `schema-locations`, 데이터 적재는 `data-locations`로 분리한다. 실행 가능성과 설정 의도/재사용성을 구분한다. `spring.sql.init.mode=always`, `create-drop`은 초기화·삭제 대상이 위험하므로 실험은 격리된 복사본 또는 새 guarded 서버에서만 계획한다. 학생 DB와 기존 DB는 대상에서 제외한다.
- Spring의 JDBC 트랜잭션 자원 결합은 thread-bound이다. 일반적인 `MockMvc` 호출은 테스트 메서드가 직접 DispatcherServlet을 호출하는 같은 스레드 구성일 때 테스트 트랜잭션에 참여할 수 있다. 비동기 MVC 처리는 예외다. `RANDOM_PORT` 서버 요청은 서버 스레드에서 처리되므로 테스트 메서드 스레드의 트랜잭션에 자동 참여한다고 가정할 수 없다. 테스트 설정, 전파, 실제 요청 실행 방식 확인이 필요하다. `REQUIRES_NEW`, async/background 작업도 외부 테스트 rollback 범위 밖에서 commit될 수 있다.
- `static @Container`는 JUnit extension 기준 테스트 클래스 종료 시 멈출 수 있지만 Spring TestContext는 동일 설정의 ApplicationContext를 캐시해 더 오래 재사용할 수 있다. 정지된 컨테이너를 참조하는 context 문제를 피하려면 Spring bean/import 방식의 컨테이너 수명도 비교한다. 정적 컨테이너, context cache, Testcontainers 재사용은 서로 다른 기능/수명 축이다. 성능 시간은 측정 전에는 기재하지 않는다.
- JPA fixture에서는 assigned ID와 `IDENTITY` 생성을 나눠 INSERT 발생 시점을 본다. persist 이후 SQL이 즉시 나오는지, `flush()` 전후 SQL/ID/제약 위반 관찰 시점이 어떻게 달라지는지를 기록하되 provider/dialect 의존성을 적는다. DB commit과 SQL flush를 같은 개념으로 쓰지 않는다. 트랜잭션 열린 상태의 lazy 접근과 닫힌 상태의 접근을 분리한다.
- MySQL 8.4 기본 `utf8mb4_0900_ai_ci`는 case-insensitive 및 accent-insensitive다. 후보 차등 실험은 `e`/`é`, 대소문자 값의 equality 및 unique 제약 충돌, 명시적 `COLLATE`, MySQL 전용 함수/metadata, FK column type/constraint를 포함할 수 있다. H2 문서는 MySQL 모드가 일부 호환 차이만 구현하며 문자열 대소문자 기본값도 다를 수 있음을 명시한다. 어떤 쿼리가 실제로 실패하거나 동일 결과를 내는지는 H2 2.4.240과 MySQL 8.4.11 양쪽에서 실행하기 전 단정하지 않는다. `MODE=MySQL`은 엔진 동등성 증명이 아니다. 또한 “모든 MySQL SQL이 H2에서 실패한다”도 근거 없는 과장이다.
- Order/lazy/HTTP 시나리오는 제공된 starter의 `Product`/`ProductRepository` 테스트만으로 입증되지 않는 별도 패턴이다. 추가 toy fixture를 쓸 경우 그 범위를 표시한다.

## 안전한 실험 경계

예정된 native 실험은 공식 portable MySQL 8.4.11, 새 0700 datadir, 새 socket, 자체 PID, 새 loopback port, MySQL X off, 임시 권한 계정 및 TLS 조건을 고정하고 외부 study schema/seed 복사본만 새 인스턴스에 적재하는 계획이다. 실제 값과 설정은 메인 담당이 실행 전에 검토한다. 토큰/계정은 공개 toy 또는 새 임시 값만 사용하고 실제 secret은 쓰지 않는다. 이번 조사자는 서버/Docker/Java/SQL을 실행하거나 패키지를 설치하지 않았고 repository 원문도 수정하지 않았다.

## 출처

아래 직접 URL, 접근 결과, 버전과 claim map은 `/_data/source-access.json`에 보존했다. 접근 실패 URL도 기록했다. Spring 7.0.9 API의 일부 개별 javadoc URL은 fetch 실패했으므로 가능한 7.0.9 Transaction API 및 직접 열린 API로 범위를 제한했다. 조사 결과를 실제 런타임 동작으로 확대하지 않았다.
