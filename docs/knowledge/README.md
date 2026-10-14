# 공부자료 (백엔드 지식 문서)

시나리오 단계마다 "필요한 지식"으로 링크되는 문서들이다. 브라우저로 보려면 같은 이름의 `.html`을 열면 된다(`docs/knowledge/README.html`).

> **읽기 전에** — 이 문서들은 Java 25 · Spring Boot 4.1 기준으로 따로 정리한 자료를 옮겨 온 것이다.
> 문서 안에 나오는 `practice/starter`(상품 API 예제 프로젝트), `ds_practice`(쇼핑몰 연습 DB), `_scratch/`, `_data/`는 원래 작업공간의 파일이라 **이 레포에는 없다.**
> 이 레포에서는 javaExperience 자체가 실습 프로젝트이고, DB는 `community`(시나리오)·`practice`(학습용)이다. 개념과 코드 패턴은 그대로 적용된다.

## P — 실무 따라 하기 — 당장 개발할 때 필요한 것

| 문서 | 한 줄 요약 |
|---|---|
| [P01. Spring vs Spring Boot — 무엇이 다르고 프로젝트는 어떻게 시작하나](P01-spring-vs-boot.md) | Spring Framework는 DI·웹·트랜잭션 같은 애플리케이션 기반 기능을 제공한다. |
| [P02. MVC 패턴과 계층형 구조 — Controller·Service·Repository](P02-mvc-layered-architecture.md) | MVC는 HTTP 요청과 응답을 다루는 표현 계층의 방식이다. |
| [P03. 애노테이션이란 — 그리고 실무에서 매일 쓰는 애노테이션 총정리](P03-annotations-cheatsheet.md) | 애노테이션은 컴파일러·빌드 도구·Spring 같은 프레임워크가 읽는 선언형 메타데이터다. |
| [P04. 객체 생성 — 생성자·정적 팩토리·Builder 패턴·생성자 주입](P04-constructors-builder.md) | 생성자는 객체가 반드시 지켜야 할 상태를 처음부터 완성한다. |
| [P05. jar·war란 무엇인가 — 빌드 결과물과 실행](P05-jar-war-packaging.md) | JAR/WAR는 클래스와 리소스를 ZIP 기반으로 묶는 배포 파일이다. |
| [P06. 첫 CRUD API 만들기 — 처음부터 끝까지 따라 하기](P06-first-crud-api.md) | - HTTP로 게시글 CRUD를 DB에 연결한다. |
| [P07. Spring Boot로 개발할 때 꼭 알아야 할 것들 — 개발 습관과 에러 해결](P07-boot-dev-essentials.md) | 실행 설정은 `application.yml`에 모으고 환경 차이는 프로파일·환경 변수로 나눈다. |
| [P08. Maven·Gradle 실무 — 빌드 파일 읽고, 의존성 넣고, 에러 고치기](P08-maven-gradle-practical.md) | 빌드 도구는 의존성을 해결하고 소스 컴파일·테스트·패키징을 한 흐름으로 반복한다. |
| [P09. Java 문법 기초 — 클래스·필드·메서드·생성자를 선언하고 호출하기](P09-java-syntax-basics.md) | 클래스는 상태(필드)와 동작(메서드)을 한 이름 아래 선언하고, 객체는 그 클래스로부터 만들어진다. |
| [P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue](P10-data-structures-usage.md) | 기본값은 `ArrayList`·`HashSet`·`HashMap`·`ArrayDeque`다. |
| [P11. 빈 등록과 의존성 주입 따라 하기 — @Component부터 private final + @RequiredArgsConstructor까지](P11-bean-registration-di.md) | Spring Bean은 컨테이너에 등록되어 생성과 의존성 연결을 맡기는 객체다. |
| [P12. Spring 처음 — 왜 new 대신 빈으로 받나 (IoC·DI 입문)](P12-why-beans-ioc-intro.md) | - 서비스가 의존 객체를 직접 `new` 하면 구현이 고정되어 교체와 단위 테스트가 번거롭다. |
| [P13. Git 실무 — 충돌 해결·되돌리기·브랜치 작업](P13-git-practical.md) | Git은 작업 디렉터리·스테이징·저장소를 구분한다. |
| [P14. Docker·docker compose로 로컬 개발 환경 만들기](P14-docker-compose-local.md) | Docker는 프로세스와 실행 파일을 격리하고, 이미지는 그 프로세스를 만들기 위한 불변 템플릿이다. |
| [P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지](P15-intellij-practical.md) | Gradle 프로젝트는 `build.gradle.kts`와 Wrapper를 기준으로 열고, Project SDK와 Gradle JVM을 먼저 맞춘다. |
| [P16. JSON·Jackson 실무 — 요청/응답 직렬화에서 막히는 것들](P16-json-jackson-practical.md) | JSON은 문자열 문법이고 Jackson은 Java 객체와 그 문자열 사이를 변환하는 라이브러리다. |
| [P17. 파일 업로드·다운로드와 외부 스토리지](P17-file-upload-storage.md) | multipart는 파일 바이트와 폼 필드를 한 HTTP 요청에 담는 형식이고, Spring Boot는 이를 `MultipartFile`로 바인딩한다. |
| [P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게](P18-concurrency-inventory.md) | 재고·좌석의 정답은 애플리케이션 변수의 값이 아니라 DB가 원자적으로 보장해야 한다. |
| [P19. MySQL 연결과 JPA 설정 — 의존성부터 연결 에러까지](P19-mysql-jpa-setup.md) | `spring-boot-starter-data-jpa`와 `mysql-connector-j`만 올바르게 넣으면 Boot가 DataSource·Hikari·Hibernate를 자동 구성한다. |
| [P20. JPA 엔티티·연관관계 매핑 따라 하기](P20-jpa-entity-mapping.md) | 엔티티는 자바 객체와 테이블 사이의 상태·식별자·관계를 선언한다. |
| [P21. QueryDSL 설정과 동적 쿼리 실무](P21-querydsl-setup.md) | QueryDSL은 JPQL 문자열 대신 생성된 Q 타입과 fluent API로 조건을 조립하는 도구다. |
| [P22. 데이터소스 여러 개 쓰기와 읽기 복제본 라우팅](P22-multiple-datasources.md) | 여러 DB는 DataSource·EntityManagerFactory·트랜잭션 매니저의 경계를 명시해야 한다. |
| [P23. Redis 연결과 사용 실무](P23-redis-practical.md) | Redis는 키-값 저장소이면서 String·Hash·List·Set·Sorted Set의 원자적 연산을 제공한다. |
| [P24. Kafka 연결과 사용 실무](P24-kafka-practical.md) | Kafka는 토픽 파티션에 레코드를 append하고 컨슈머 그룹이 offset을 관리한다. |
| [P25. 외부 API 연동 실무 — RestClient·HTTP Interface](P25-external-api-client.md) | 외부 API 호출은 `RestClient`를 기본값으로 두고, 리액티브 흐름이면 `WebClient`를 선택한다. |
| [P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트](P26-mail-notification.md) | Spring Boot는 `spring-boot-starter-mail`과 `spring.mail.*` 설정으로 `JavaMailSender`를 자동 구성한다. |
| [P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도](P27-annotations-when-how.md) | 애노테이션은 표시와 메타데이터일 뿐, 그 자체로 코드를 실행하지 않는다. |
| [P28. Spring Boot가 기본으로 만드는 빈들 — 무엇이, 왜, 어떻게 확인·교체하나](P28-default-beans.md) | - 스타터를 추가하면 클래스패스와 설정 조건에 맞는 자동 구성이 기본 빈을 등록한다. |
| [P29. static 완전 정리 — 클래스 변수·정적 메서드·상수, 그리고 Spring에서의 static](P29-static-complete.md) | `static` 멤버는 객체마다 복사되지 않고, 해당 클래스를 정의한 클래스 로더의 클래스에 속한다. |
| [P30. 스케줄링 실무 — @Scheduled부터 서버 여러 대·Quartz·CronJob까지](P30-scheduling-practical.md) | 만료·정산·리포트·정리 작업은 요청이 없어도 정해진 시간에 실행되어야 한다. |
| [P31. Stream 실무 패턴 모음 — for문과 나란히, 언제 무엇을](P31-stream-patterns.md) | Stream은 데이터 변환·선별·집계를 파이프라인으로 읽기 좋게 쓴다. |

## W — 왜·비교 — "왜 이렇게 하나"에 답하는 문서

| 문서 | 한 줄 요약 |
|---|---|
| [W01. API 하나 만들 때 실제 작업 순서 — DB부터? 컨트롤러부터?](W01-api-dev-order.md) | API 개발은 DB나 컨트롤러 중 하나를 먼저 만드는 경주가 아니다. 먼저 사용자 요구와 HTTP 계약을 합의하고, 데이터 제약을 설계한 뒤 한 기능을 저장소부터 응답까지 작은 단위로 연결한다. |
| [W02. 왜 Controller·Service·Repository로 나누나 — 안 나누면 생기는 일](W02-why-layers.md) | Controller·Service·Repository는 관습적으로 파일을 세 개 만드는 규칙이 아니라, 서로 다른 변경 이유와 실행 경계를 분리하는 방법이다. |
| [W03. DB 접근 방식 총비교 — JDBC부터 JPA·MyBatis·QueryDSL·jOOQ까지](W03-db-access-comparison.md) | JDBC는 SQL 실행의 기반이고, 각 도구는 SQL 작성·결과 매핑·반복 CRUD 가운데 다른 불편을 줄인다. |
| [W04. MyBatis XML 쿼리 실무 — mapper·동적 SQL·#{}와 ${}](W04-mybatis-xml-practical.md) | SQL 값은 #{}로 바인딩하고, 문법 조각은 검증된 값만 ${}로 치환한다. |
| [W05. JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략](W05-jpa-vs-mybatis-strategy.md) | JPA는 객체와 도메인 상태를 다루고, MyBatis는 SQL과 결과 매핑을 다룬다. |
| [W06. 디버깅은 왜 서버에선 브레이크포인트·로그로, 프론트에선 console.log로 하나](W06-why-server-debugging.md) | 서버 코드는 내 컴퓨터 밖의 JVM에서 여러 사용자의 요청을 함께 처리한다. 브라우저 코드는 개발자 도구가 붙어 있는 내 탭에서 실행되므로 즉시 멈춰 값을 볼 수 있다. |
| [W07. 왜 System.out.println 대신 로거(SLF4J)를 쓰나](W07-why-logger.md) | 서버에서 로그는 문자열을 화면에 찍는 일이 아니라, 운영 중 켜고 끄고 분류해 수집할 사건을 남기는 일이다. |
| [W08. 예외는 어디서 잡나 — 계층별 처리와 전역 핸들러](W08-where-to-handle-exceptions.md) | 예외는 실제로 복구하거나 더 적절한 의미로 바꿀 책임이 있는 곳에서 잡는다. |
| [W09. DTO는 왜 쓰나 — 엔티티를 그대로 반환하면 생기는 일](W09-why-dto.md) | DTO는 DB 객체를 꾸미는 보일러플레이트가 아니라 외부에 공개할 데이터 계약이다. |
| [W10. 검증은 어디서 하나 — 프론트·서버·DB, 왜 둘 다 하나](W10-where-to-validate.md) | 프론트 검증은 사용자가 빨리 고칠 수 있게 돕고, 서버 검증은 위조된 요청을 포함한 모든 입력을 신뢰 경계에서 걸러낸다. |
| [W11. 트랜잭션은 왜 서비스 계층에 거나](W11-why-tx-in-service.md) | 서비스 메서드는 보통 한 번의 업무 요청이 보장해야 할 데이터 불변식을 모으는 곳이라, 트랜잭션 경계를 두기 적합하다. |
| [W12. 인터페이스는 왜 만드나 — DI·테스트, 그리고 과잉 추상화](W12-why-interfaces.md) | 인터페이스는 Spring DI를 켜기 위한 문법이 아니라, 호출자와 구현 사이에 교체 가능한 계약을 둔다. |
| [W13. 프론트와 백엔드의 경계 — 무엇을 서버에서만 해야 하나](W13-frontend-backend-boundary.md) | 브라우저 코드와 요청은 사용자가 바꿀 수 있으므로, 화면의 결과를 서버가 사실로 믿으면 안 된다. |
| [W14. 동기 vs 비동기, 블로킹 vs 논블로킹 — 백엔드에서 언제](W14-sync-async-blocking.md) | 동기/비동기는 결과를 누가 어떻게 이어 받는지, 블로킹/논블로킹은 호출한 스레드가 기다리는지를 가리킨다. |
| [W15. 페이징 — OFFSET vs 커서(키셋), 무엇을 언제](W15-paging-offset-vs-cursor.md) | 얕고 번호 이동·전체 건수가 필요한 목록은 `OFFSET`과 `Page`가 단순하다. |
| [W16. ID 생성 전략 — AUTO_INCREMENT vs UUID vs ULID·Snowflake](W16-id-generation.md) | 기본 단일 DB CRUD라면 내부 PK는 `BIGINT AUTO_INCREMENT`가 가장 단순하고 인덱스도 작다. |
| [W17. 캐시는 어디에 — 브라우저·CDN·서버 로컬·Redis·DB](W17-where-to-cache.md) | 캐시는 요청이 자주 읽히고 원본 계산이 비싸며, 정해진 시간 동안 오래된 값을 허용할 때 둔다. |
| [W18. REST vs GraphQL vs gRPC — 선택 기준](W18-rest-graphql-grpc.md) | 세 방식은 서로 다른 계층의 문제를 푼다. REST는 HTTP 자원과 표준 의미를, GraphQL은 클라이언트가 필요한 필드를 조합하는 질의 계약을, gRPC는 스키마로 생성하는 원격 메서드 계약을 |
| [W19. Lombok을 쓸까 말까 — 편리함과 함정](W19-lombok-or-not.md) | Lombok은 컴파일 시 반복 코드를 만들어 주므로 런타임 성능 기능이나 프레임워크 마법은 아니다. |
| [W20. 시간·타임존은 왜 매번 문제인가](W20-time-timezone.md) | 시간 문제의 대부분은 “언제 발생했나”와 “어느 지역 시계로 몇 시였나”를 같은 값으로 취급하면서 시작한다. |
| [W21. null 처리 전략 — Optional·JSpecify·DB NULL](W21-null-handling.md) | `null`은 값이 비어 있다는 정보이면서, 호출자가 예상하지 못한 결함일 수도 있다. 그래서 경계마다 뜻을 정하고 타입과 제약으로 드러낸다. |
| [W22. 로컬에선 되는데 서버에선 왜 안 되나 — 환경 차이 점검](W22-works-locally-not-on-server.md) | 로컬과 운영은 같은 코드라도 설정·런타임·OS·네트워크·데이터·자원 조건이 다르면 다른 프로그램처럼 동작한다. |
| [W23. 캐시와 인메모리 — 무엇이고, 왜 빠르고, 왜 쓰나](W23-cache-and-in-memory.md) | 캐시는 느린 원본 데이터의 사본을 더 가까운 곳에 두어, 반복 조회의 지연과 원본 부하를 줄이는 기법이다. |
| [W24. DB는 왜 쓰나 — 파일이나 메모리에 저장하면 안 되나](W24-why-database.md) | 회원·주문을 한 서버 메모리에만 두면 프로세스 재시작 순간 사라지고, 파일에 바로 쓰면 동시 요청과 부분 실패를 직접 해결해야 한다. |
| [W25. 스프링은 왜 멀티스레드인가 — 요청마다 스레드, 공유되는 싱글턴 빈](W25-spring-multithreading.md) | Spring MVC의 동기 요청은 보통 Tomcat 작업 스레드 하나가 컨트롤러부터 응답까지 맡는다. |
| [W26. 네이밍 컨벤션 — camelCase부터 Controller·Impl까지, 왜 그렇게 짓나](W26-naming-conventions.md) | 이름은 실행 규칙이라기보다 사람이 의도를 읽고 도구가 대상을 찾게 하는 약속이다. |

## V — 테스트 실전

| 문서 | 한 줄 요약 |
|---|---|
| [V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지](V01-what-and-how-to-test.md) | 테스트는 코드가 아니라 **변경 위험과 외부 계약**을 검증한다. |
| [V02. 계층별 테스트 따라 하기 — Controller·Service·Repository·통합](V02-layered-tests-handson.md) | Controller는 HTTP 계약, Service는 규칙, Repository는 SQL 결과를 검증한다. |
| [V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나](V03-mocking-in-practice.md) | - 외부 시스템과 비결정적 입력은 대체하고, 검증하려는 도메인 로직은 실제로 실행한다. |
| [V04. 테스트 DB 전략 — H2 vs Testcontainers, 데이터 준비, @Transactional의 함정](V04-test-db-strategy.md) | 서비스·도메인 로직은 DB 없이 빠르게 검증하고, SQL·제약·방언을 검증할 Repository/API 테스트에는 운영과 같은 DB 엔진을 쓴다. |
| [V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일](V05-testing-tricky-things.md) | 인증·인가·CSRF는 각각 다른 응답을 검증한다. |
| [V06. 현업 테스트 실무 — 레거시에 테스트 붙이기, 버그 재현, CI, 커버리지](V06-testing-at-work.md) | 레거시 테스트는 기존 동작을 먼저 기록해 안전한 변경 경계를 만든다. |

## R — 데이터베이스 실전

| 문서 | 한 줄 요약 |
|---|---|
| [R01. DB 서버란 무엇인가 — DBMS·데이터베이스·스키마·테이블, 그리고 MySQL·PostgreSQL](R01-what-is-db-server.md) | DBMS는 데이터를 관리하는 소프트웨어이고, DB 서버는 그 DBMS가 실행되어 연결을 받는 프로세스·머신이다. |
| [R02. RDB vs NoSQL — MongoDB·Redis·Cassandra는 무엇이고 언제 쓰나](R02-rdb-vs-nosql.md) | 기본값은 RDB다. 주문·결제처럼 관계와 제약, 여러 행의 원자성이 중요한 데이터는 MySQL에 둔다. |
| [R03. 스키마와 테이블 설계 — 데이터 타입, VARCHAR(255)의 의미, PK·FK·제약](R03-schema-types-constraints.md) | 테이블 설계는 컬럼의 의미와 허용 범위를 DB에 선언하는 일이다. |
| [R04. SQL로 데이터 다루기 — INSERT·SELECT·UPDATE·DELETE, JOIN, 트랜잭션](R04-sql-crud-join.md) | 조회 전에 필요한 행과 열을 정하고, 변경 전에는 대상 행을 같은 조건으로 확인한다. |
| [R05. 인덱스와 B-Tree — 왜 빨라지고, 언제 안 타나](R05-index-btree.md) | - 인덱스는 정렬된 키를 B-Tree 페이지에 저장해 전체 행을 훑지 않고 후보를 좁힌다. |
| [R06. DB 클라이언트 도구 — DBeaver는 무엇이고 왜 여러 DB에 붙을 수 있나](R06-db-client-tools.md) | DBeaver는 DB 서버가 아니라 접속·SQL 실행·결과 확인·스키마 탐색을 돕는 데스크톱 DB 클라이언트다. |
| [R07. 백업과 복원 — DB와 서버에서 각각 무엇을, 어떻게 지키나](R07-backup-restore.md) | - 백업은 파일을 만드는 일이 아니라 정해진 RPO·RTO 안에 검증된 상태로 돌아오는 절차다. |
| [R08. 앱 서버와 DB 서버는 어떻게 연결되나 — 요청 하나가 DB까지 가는 전체 그림](R08-app-to-db-connection.md) | 요청 스레드는 풀에서 이미 연결된 JDBC 커넥션을 빌려 SQL을 보내고, MySQL 세션이 결과를 돌려주면 트랜잭션 종료 시 커넥션을 풀에 반납한다. |

## B — 백엔드 기능 설계

| 문서 | 한 줄 요약 |
|---|---|
| [B01. 계정 생명주기 API — 이메일·휴대폰 인증, 비밀번호 재설정, 로그인 시도 제한](B01-account-lifecycle.md) | 가입은 `PENDING → ACTIVE`, 코드는 만료·1회 사용. |

## D — 개발 전 과정·용어

| 문서 | 한 줄 요약 |
|---|---|
| [D01. 코드가 운영 서버에 올라가기까지 — 개발 전 과정 한 장](D01-dev-lifecycle-overview.md) | 기능은 티켓에서 시작해 로컬 구현, 브랜치·PR 리뷰, 자동 검증, 배포를 거쳐 운영 데이터와 만나며 완성된다. |
| [D02. 서버·네트워크 기초 용어 — 요청이 서버에 닿기까지](D02-server-network-basics.md) | 브라우저 요청은 URL 해석과 DNS 조회를 거쳐 IP 주소와 포트의 서버 프로세스에 도착한다. |
| [D03. REST API 개발 과정 — 요구사항에서 배포 가능한 API까지](D03-rest-api-dev-process.md) | API 작업은 엔드포인트 하나를 코딩하는 일이 아니라, 소비자와 합의한 계약을 구현하고 안전하게 배포하는 과정이다. |
| [D04. 빌드란 무엇인가 — 소스 코드가 실행 파일·이미지가 되기까지](D04-build-pipeline-explained.md) | 빌드는 코드를 컴파일하는 한 단계가 아니라, 선언된 입력을 검증하고 실행·배포 가능한 산출물로 바꾸는 자동화 과정이다. |
| [D05. 디버깅 방법론 — 재현·관찰·가설·검증](D05-debugging-methodology.md) | 디버깅은 증상을 재현하고 원인 후보를 증거로 좁히는 과정이다. |
| [D06. 배포란 무엇인가 — 환경·방식·무중단 배포·롤백](D06-deployment-concepts.md) | 배포는 실행 가능한 변경을 특정 환경에 적용하는 일이고, 릴리스는 그 기능을 사용자에게 사용할 수 있게 하는 결정이다. |
| [D07. 온프레미스 vs 클라우드 — 서버는 어디에 있고 누가 관리하나](D07-onprem-vs-cloud.md) | 온프레미스는 장비와 시설부터 애플리케이션까지 조직이 직접 소유·운영하는 방식이고, 클라우드는 필요한 컴퓨팅 자원을 네트워크로 빌려 쓰는 방식이다. |
| [D08. CI/CD와 협업 흐름 — Git 브랜치부터 파이프라인·GitOps까지](D08-cicd-collaboration.md) | 변경은 짧은 Git 브랜치와 PR로 검토하고, CI가 같은 커밋을 빌드·테스트해 병합 가능 여부를 알려준다. |
| [D09. 운영과 관측 — 배포 이후 서버를 지켜보는 법](D09-operations-observability.md) | 배포는 운영의 시작이다. 사용자가 체감하는 신호를 SLI로 정하고 목표를 SLO로 합의한다. |
| [D10. DB 기초 — 백엔드 개발자가 알아야 할 관계형 데이터베이스](D10-database-basics.md) | 관계형 DB는 표 모음이 아니라 제약조건과 트랜잭션으로 데이터를 지키는 서버다. |
| [D11. 웹 보안 기초 — 백엔드 개발자가 막아야 할 것들](D11-web-security-basics.md) | 인증은 “누구인가”, 인가는 “무엇을 해도 되는가”를 확인한다. |
| [D12. 리눅스·터미널 기본 — 서버에서 살아남기](D12-linux-terminal-basics.md) | 터미널은 명령을 입력하는 창이고, 쉘은 그 명령을 해석해 프로그램을 실행하는 인터프리터다. |
| [D13. 백엔드 개발 용어 사전 — 회의에서 들리는 말 전부](D13-backend-glossary.md) | 백엔드 개발은 요구사항을 코드로 바꾸고, 검증한 산출물을 운영 환경에 배포한 뒤 관측·개선하는 흐름이다. |
| [D14. 백엔드 개발자를 위한 운영체제 기초 — 프로세스·스레드·메모리·I/O](D14-os-basics-backend.md) | 프로그램은 프로세스가 되어 주소 공간을 얻고, 스레드가 CPU를 나눠 쓰며, 시스템 콜을 통해 커널의 메모리·파일·소켓을 사용한다. |
| [D15. 서버 사양은 어떻게 정하나 — CPU·메모리·디스크·네트워크를 숫자로 잡는 법](D15-server-sizing.md) | 사양은 부하에서 SLO를 지키는 처리량을 재고 피크·장애 여유를 계산해 정한다. |

## J — Java 언어·JVM

| 문서 | 한 줄 요약 |
|---|---|
| [J01. 기본 타입·참조 타입·박싱·String](J01-types-string.md) | 기본 타입은 값을 직접 다루고, wrapper는 객체 참조와 `null`을 다룬다. `==`는 wrapper의 값 비교가 아니라 참조 비교다. `String`은 불변이며 `+`의 성능 구현은 컴파일 |
| [J02. OOP와 Object 규약](J02-oop-object-contracts.md) | 객체지향의 중심은 데이터와 행위를 한 타입의 경계 안에 두고, 구현 대신 지켜야 할 계약으로 협력하는 것이다. |
| [J03. 제네릭](J03-generics.md) | - 제네릭은 타입을 매개변수로 받아 컴파일 시점에 잘못된 조합을 막는다. Java는 대부분의 타입 인자를 바이트코드 실행 전에 지우고, 캐스트와 브리지 메서드를 컴파일러가 보충한다. |
| [J04. 예외 처리](J04-exceptions.md) | 예외는 실패 지점에서 복구 지점으로 제어를 옮기고, 실패의 종류와 원인을 전달한다. |
| [J05. 모던 문법 (Java 10~25)](J05-modern-syntax.md) | `var`는 타입을 지우지 않고 선언부의 반복만 줄인다. |
| [J06. enum·애노테이션·리플렉션](J06-enum-annotation-reflection.md) | - `enum`은 제한된 값 집합을 타입으로 고정하며, 상수별 동작과 `EnumMap`·`EnumSet`으로 상태와 권한을 안전하게 표현한다. |
| [J07. 컬렉션 프레임워크 내부](J07-collections-internals.md) | 컬렉션은 필요한 연산과 순서 계약을 기준으로 선택한다. |
| [J08. 람다·함수형 인터페이스](J08-lambda-functional.md) | 람다는 **함수형 인터페이스의 추상 메서드 하나를 구현하는 표현식**이며, 대상형이 문맥에서 결정한다. |
| [J09. Stream API](J09-stream-api.md) | Stream은 컬렉션이 아니라 데이터 소스에 적용할 계산의 파이프라인이며, 중간 연산은 최종 연산 전까지 실행되지 않는다. |
| [J10. 스레드와 Java Memory Model](J10-jmm-threads.md) | 스레드 간 공유 상태는 우연한 타이밍이 아니라 동기화 규칙으로 전달해야 한다. |
| [J11. java.util.concurrent](J11-juc.md) | `java.util.concurrent`는 스레드 수명과 작업 큐, 공유 상태의 원자성, 대기·신호를 목적에 맞게 나눠 제공한다. |
| [J12. Virtual Threads·Structured Concurrency·Scoped Values](J12-virtual-threads.md) | Virtual thread는 I/O 대기 중 carrier 플랫폼 스레드를 반납해, 요청당 스레드 방식의 동시성 한계를 낮춘다. CPU를 더 빠르게 쓰거나 외부 시스템 용량을 늘려 주지는 않는다. |
| [J13. JVM 구조·클래스 로딩·바이트코드](J13-jvm-classloading.md) | JVM 명세는 클래스 이름만으로 타입을 구별하지 않는다. **바이너리 이름과 정의한 클래스로더**가 함께 타입 정체성을 만든다. |
| [J14. 메모리 구조와 GC](J14-memory-gc.md) | Java 메모리는 JVM 명세의 실행 영역과 HotSpot의 실제 메모리 배치가 다르다. |
| [J15. JIT·성능 분석·프로파일링](J15-jit-profiling.md) | HotSpot은 인터프리터로 시작해 실행 프로파일을 모으고, 자주 실행되는 코드를 C1·C2로 단계적으로 컴파일한다. |
| [J16. 컨테이너 환경의 JVM](J16-jvm-in-containers.md) | 컨테이너 메모리·CPU 한도는 cgroup으로 적용되고, HotSpot은 이를 읽어 힙과 내부 스레드 풀의 기본 크기를 정한다. |
| [J17. Java 버전 로드맵·LTS·마이그레이션](J17-versions-roadmap.md) | Java는 6개월마다 기능 릴리스가 나오고, 2023년 Java 21부터 LTS 간격은 2년이다. |
| [J19. Java 단위 테스트 (JUnit·Mockito·AssertJ)](J19-testing-junit.md) | 기준일(2026-09-28)의 Boot 4.1.1 관리 버전은 JUnit Jupiter 6.0.3, Mockito 5.23.0, AssertJ 3.27.7이다. |
| [J20. I/O·NIO·HttpClient·JDBC 기초](J20-io-nio-jdbc.md) | 바이트 스트림은 바이트, Reader는 문자이므로 경계에서 문자 인코딩을 명시한다. |
| [J21. 디자인 패턴과 SOLID — Spring 안에서 찾기](J21-design-patterns-solid.md) | SOLID는 패턴 이름을 외우는 규칙이 아니라 변경 이유와 의존성의 방향을 통제하는 설계 기준이다. |
| [J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기](J22-coding-test-algorithms.md) | 입력은 `BufferedReader`로 받고 출력은 `StringBuilder`에 모은다. |
| [J23. 트리 자료구조와 순회 — 이진 트리·BST](J23-tree-traversal.md) | 트리는 부모·자식 관계로 자료를 계층화하며, 이진 트리는 자식 수만 최대 2개로 제한한다. |
| [J24. 컴파일 언어 vs 인터프리터 언어 — Java는 어떻게 실행되나](J24-compiled-vs-interpreted.md) | Java는 소스를 바이트코드로 컴파일하고, JVM은 그 바이트코드를 해석하거나 네이티브 코드로 컴파일해 실행한다. |
| [J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프](J25-data-structures-map.md) | 자료구조는 데이터를 담는 모양이며, 모양이 달라지면 접근·삽입·삭제·정렬 비용도 달라진다. |

## S — Spring 심화

| 문서 | 한 줄 요약 |
|---|---|
| [S01. IoC 컨테이너·DI·빈 생명주기](S01-ioc-di.md) | Spring 컨테이너는 객체를 만들고 의존성을 연결하며 초기화·종료까지 관리한다. |
| [S02. AOP와 프록시](S02-aop-proxy.md) | AOP는 로깅·메트릭처럼 여러 객체에 흩어지는 관심사를 한곳에 모은다. |
| [S03. Spring Boot 자동 구성 원리](S03-boot-autoconfig.md) | `@SpringBootApplication`은 구성 클래스, 컴포넌트 스캔, 자동 구성 활성화를 묶은 합성 애노테이션이다. |
| [S04. 외부 설정·프로파일](S04-config-profiles.md) | 설정은 코드 밖에서 주입하되, 우선순위와 바인딩 방식을 알고 있어야 운영값이 예측 가능하다. |
| [S05. Spring MVC 요청 처리 흐름](S05-mvc-request-flow.md) | 요청은 서블릿 컨테이너가 받고 `DispatcherServlet`이 MVC 구성요소에 위임해 처리한다. |
| [S06. REST API 설계와 HTTP 클라이언트](S06-rest-api-clients.md) | - REST는 URL 모양보다 리소스와 HTTP 메서드의 의미를 일관되게 지키는 계약이다. |
| [S07. WebFlux·리액티브와 Virtual Threads 선택](S07-webflux-vs-vt.md) | WebFlux는 논블로킹 I/O와 Reactive Streams 수요 제어를 끝까지 유지할 때 이점이 난다. |
| [S08. 트랜잭션 관리](S08-transactions.md) | Spring 트랜잭션은 `PlatformTransactionManager`가 자원 트랜잭션을 시작·커밋·롤백하고, `@Transactional`은 그 경계를 선언하는 방법이다. |
| [S09. JPA·Hibernate](S09-jpa-hibernate.md) | JPA는 객체 상태와 관계형 데이터 사이의 표준 계약이고 Hibernate는 그 계약을 SQL로 실행하는 ORM 구현체다. |
| [S10. Spring Data와 쿼리 도구](S10-spring-data-query.md) | 기본 선택은 Spring Data JPA 리포지토리다. 단순 조건은 쿼리 메서드, 고정된 복잡 쿼리는 `@Query`, 조합이 많은 검색 조건은 Specification으로 표현한다. |
| [S11. 캐시·Redis·DB 마이그레이션](S11-cache-redis-migration.md) | 캐시는 DB의 대체물이 아니라 만료와 무효화 규칙이 있는 파생 데이터다. |
| [S12. Spring Security 아키텍처](S12-security-architecture.md) | Spring Security는 Servlet 필터 체인 안에서 인증과 인가를 수행한다. |
| [S13. JWT·OAuth2·OIDC](S13-jwt-oauth2.md) | JWT는 서명된 형식이지 암호화된 비밀 저장소가 아니며, OAuth2는 인가 위임, OIDC는 그 위에 얹힌 로그인 규약이다. |
| [S14. 메시징 (Kafka·RabbitMQ)](S14-messaging.md) | Kafka는 보관 가능한 파티션 로그와 소비자별 오프셋으로 이벤트를 재생하고, RabbitMQ는 교환기 라우팅으로 큐에 작업을 전달한다. |
| [S15. 비동기·스케줄링·Spring Batch](S15-async-scheduling-batch.md) | `@Async`는 호출 스레드와 작업 스레드를 나누고, 실행기 설정은 대기열과 과부하 동작까지 결정한다. |
| [S16. Actuator·관측성 (메트릭·트레이싱·로깅)](S16-actuator-observability.md) | - Actuator는 운영 엔드포인트를 제공하지만, **사용 가능(access)** 과 **외부 노출(exposure)** 은 별개다. 필요한 엔드포인트만 인증·네트워크 경계 안에 노출한다. |
| [S17. Spring Boot 애플리케이션 성능](S17-performance-tuning.md) | - 성능 튜닝은 숫자를 크게 올리는 일이 아니라 포화 지점을 찾아 제한을 맞추는 일이다. |
| [S18. Spring Boot 테스트](S18-spring-testing.md) | 테스트 범위에 맞는 컨텍스트만 띄워라: 기본은 단위 테스트, MVC/JPA는 슬라이스, 설정·빈 조립까지 검증할 때만 `@SpringBootTest`다. |
| [S19. 패키징·컨테이너화·배포](S19-packaging-deploy.md) | 실행 JAR는 배포 가능한 단위이고, 계층은 변경 범위를 작게 만드는 장치다. |
| [S20. Spring Cloud·MSA 패턴](S20-spring-cloud-msa.md) | MSA는 배포·확장의 경계를 분리하는 대신 네트워크 지연, 부분 실패, 데이터 일관성, 운영 복잡성을 서비스 간 경계로 끌어온다. |
| [S21. Spring Boot 3→4·Framework 7 변화와 마이그레이션](S21-boot4-migration.md) | Boot 4는 단순한 버전 교체가 아니라 Framework 7·Jakarta EE 11·Jackson 3·재편된 모듈 경계를 함께 올리는 메이저 업그레이드다. |
| [S22. 아키텍처 스타일과 DDD 기초 — 코드를 어떻게 나눌까](S22-architecture-ddd.md) | 레이어드의 핵심 문제는 레이어 수가 아니라 비즈니스 규칙이 `Service`와 ORM 모델에 흩어지고 의존성 방향이 뒤엉키는 데 있다. |
| [S23. OpenAPI·Swagger UI — API 계약을 문서로 확인하기](S23-openapi-swagger.md) | 구현한 요청·응답 계약을 OpenAPI 문서와 Swagger UI에서 확인하고 유지한다. |
