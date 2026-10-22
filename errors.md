# 에러 도감

실습하다 자주 만나는 에러를 모았다. 로그나 응답의 빨간 줄 하나를 **통째로** 복사해 검색 칸에 붙여 넣으면 그 에러가 나온다. 각 에러의 "찾는 말"이 붙여 넣은 줄 안에 있으면 찾아 주므로, 클래스 이름이나 경로가 내 것과 달라도 된다.

### 메시지는 어디서 왔나

모두 **Spring Boot 4.1.1 · Spring Framework 7.0.9 · Jackson 3.1.5 · Hibernate 7.4.5 · Java 21**에서 일부러 망가뜨려 재현한 원문이다. 경로 앞부분(`…/javaExperience`)과 포트·시각·PID는 내 PC마다 다르다. 재현에 쓴 서버 포트가 `8179`라서 메시지에도 `8179`가 보인다(기본 설정이면 `8080`). 메시지에 나오는 `LabController`는 재현용으로 만든 컨트롤러다.

### 스택트레이스 읽는 순서

로그가 길게 쏟아져도 다 읽을 필요는 없다. 이 순서로 본다.

1. **맨 위 요약** — `APPLICATION FAILED TO START` 상자가 있으면 그 아래 `Description:`·`Action:`이 답이다. 상자가 없으면 `ERROR`가 붙은 줄을 본다.
2. **`Caused by:` 맨 아래** — 예외는 겹겹이 포장돼 있다. 진짜 원인은 보통 가장 아래 `Caused by:`다. 단, DB 연결 실패처럼 **맨 아래 `Caused by:`가 엉뚱한 말을 하는 경우**가 있다. 그 예외는 이 도감에 따로 적어 두었다.
3. **내 패키지 첫 줄** — `at org.example.`으로 시작하는 첫 줄이 내 코드가 불린 자리다. `PostService.java:56`처럼 파일:줄이 붙어 있다. IntelliJ 실행 창에서는 이걸 누르면 그 줄로 간다.
4. **내 패키지 줄이 하나도 없으면** 내 코드가 실행되기 전에 실패한 것이다. 요청 본문 읽기, 빈 만들기, DB 연결이 여기에 해당한다. 그때는 메시지 속 클래스 이름이 단서다.

### 증상으로 찾기

| 증상 | 먼저 볼 에러 |
|---|---|
| 서버가 뜨자마자 꺼진다 | [빈을 찾을 수 없음](#빈을-찾을-수-없음) · [빈 순환 참조](#빈-순환-참조) · [포트 사용 중](#포트-사용-중) · [DataSource 설정 없음](#datasource-설정-없음) · [DB에 연결 못 함](#db에-연결-못-함) · [DB 이름이나 계정이 틀림](#db-이름이나-계정이-틀림) · [MySQL 드라이버 없음](#mysql-드라이버-없음) · [테이블 없음](#테이블-없음) · [컬럼 이름 불일치](#컬럼-이름-불일치) |
| 빌드(컴파일)가 안 된다 | [의존성 누락 — 패키지 없음](#의존성-누락--패키지-없음) · [생성자 인자 불일치](#생성자-인자-불일치) · [final 필드가 초기화되지 않음](#final-필드가-초기화되지-않음) |
| 요청했더니 `415` | [Content-Type 없음](#content-type-없음-415) |
| 요청했더니 `400` | [깨진 JSON](#깨진-json-400) · [본문 없음 또는 @RequestBody 두 개](#본문-없음-또는-requestbody-두-개-400) · [DTO를 만들 생성자를 못 고름](#dto를-만들-생성자를-못-고름-400) |
| 요청했더니 `404`·`405` | [경로 오타](#경로-오타-404) · [메서드가 다름](#메서드가-다름-405) |
| 요청했더니 `500` | [비정적 안쪽 DTO](#비정적-안쪽-dto-500) · [지연 로딩 — no session](#지연-로딩--no-session) · [엔티티 기본 생성자 없음](#엔티티-기본-생성자-없음) · [중복 키](#중복-키) · [테이블 없음](#테이블-없음) · [new로 만든 객체의 null](#new로-만든-객체의-null) |
| 에러는 없는데 결과가 이상하다 | [응답이 빈 {}](#응답이-빈-) · [한글이 깨져 보임](#한글이-깨져-보임) |

## 빈을 찾을 수 없음

**찾는 말** — `required a bean of type` · `that could not be found` · `No qualifying bean of type`

**언제 나나** — 서버를 켤 때다. 서버가 뜨지 않고 바로 꺼진다. 서비스 클래스에서 `@Service`를 빼거나, 직접 만든 저장소 구현 클래스에서 `@Repository`를 빼면 난다.

**실제 메시지** — `PostService`에서 `@Service`를 지웠을 때

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 0 of constructor in org.example.post.PostController required a bean of type 'org.example.post.PostService' that could not be found.


Action:

Consider defining a bean of type 'org.example.post.PostService' in your configuration.
```

**로그에서 볼 줄** — `APPLICATION FAILED TO START` 상자의 `Description:` 한 줄이다. "**누가**(`PostController`의 생성자 0번째 인자) **무엇을**(`PostService` 타입 빈) 못 찾았나"로 읽는다. 위쪽 `WARN` 줄의 `UnsatisfiedDependencyException … No qualifying bean of type …`도 같은 말이다.

**원인** — Spring은 `@Component` 계열(`@Service`·`@Repository`·`@Controller`·`@RestController`)이 붙은 클래스만 객체(빈)로 만들어 둔다. 표시가 없으면 만들지 않는다. 그래서 생성자로 그 객체를 달라는 쪽(`PostController`)을 만들 수 없다. `Main`과 다른 패키지(예: `com.other`)에 둔 클래스도 스캔 범위 밖이라 같은 에러가 난다.

**고치는 법** — 메시지에 나온 타입(`PostService`)의 클래스에 `@Service`를 붙인다. 인터페이스라면 그 **구현 클래스**에 `@Repository`를 붙인다. `JpaRepository`를 상속한 인터페이스(`PostRepository` 등)는 Spring Data JPA가 구현을 만들어 주므로 붙일 것이 없다. 클래스가 `org.example` 아래 패키지에 있는지도 확인한다.

**관련 단계** — [1-3 일부러 망가뜨리기](scenario/ch1-create-post/1-3-service-layer.md#일부러-망가뜨리기) · [P11 빈 등록과 의존성 주입](docs/knowledge/P11-bean-registration-di.md)

## 빈 순환 참조

**찾는 말** — `form a cycle` · `circular references` · `allow-circular-references`

**언제 나나** — 서버를 켤 때다. A가 생성자로 B를 받고, B도 생성자로 A를 받으면 난다.

**실제 메시지** — `PostService`가 생성자로 `PostController`를 받게 했을 때(`PostController`는 이미 `PostService`를 받는다)

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  postController defined in URL […/org/example/post/PostController.class]
↑     ↓
|  postService defined in URL […/org/example/post/PostService.class]
└─────┘


Action:

Relying upon circular references is discouraged and they are prohibited by default. Update your application to remove the dependency cycle between beans. As a last resort, it may be possible to break the cycle automatically by setting spring.main.allow-circular-references to true.
```

**로그에서 볼 줄** — `┌─────┐` 상자다. 상자 안에 적힌 빈들이 서로를 물고 있다. 위에서 아래로 "↓ 이걸 만들려면 다음 게 필요하다"고 읽는다.

**원인** — 생성자 주입은 "B가 다 만들어져야 A를 만든다"는 뜻이다. 서로가 서로를 먼저 요구하면 어느 쪽도 먼저 만들 수 없다. 대부분 계층이 거꾸로 흐를 때 생긴다. 서비스가 컨트롤러를 부르거나, 서비스 둘이 서로를 부르는 경우다.

**고치는 법** — 방향을 한쪽으로 정한다. 컨트롤러 → 서비스 → 저장소다. 서비스가 컨트롤러를 알 필요는 없으니 그 생성자 인자를 지운다. 서비스 둘이 서로 필요하면 공통 부분을 세 번째 클래스로 빼낸다. `allow-circular-references: true`는 문제를 숨길 뿐이라 쓰지 않는다.

**관련 단계** — [1-3 일부러 망가뜨리기](scenario/ch1-create-post/1-3-service-layer.md#일부러-망가뜨리기) · [W02 왜 Controller·Service·Repository로 나누나](docs/knowledge/W02-why-layers.md)

## 포트 사용 중

**찾는 말** — `was already in use` · `Web server failed to start`

**언제 나나** — 서버를 켤 때다. 이미 같은 포트로 떠 있는 서버가 있으면 난다. IntelliJ에서 실행 버튼을 두 번 눌렀거나, 터미널 `./gradlew bootRun`이 아직 살아 있을 때 흔하다.

**실제 메시지**

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Web server failed to start. Port 8179 was already in use.

Action:

Identify and stop the process that's listening on port 8179 or configure this application to listen on another port.
```

**로그에서 볼 줄** — `Description:`의 `Port 8179 was already in use.`다. 숫자가 내 포트(보통 `8080`)다.

**원인** — 포트 하나는 프로그램 하나만 쓸 수 있다. 먼저 뜬 서버가 그 포트를 잡고 있다.

**고치는 법** — 먼저 떠 있는 서버를 끈다. IntelliJ 실행 창의 빨간 네모(Stop)를 누르거나, 터미널에서 `lsof -i :8080`으로 PID를 찾아 `kill <PID>`한다. 둘 다 띄워야 하면 `application.yml`에 `server.port: 8081`처럼 다른 포트를 준다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md) · [P07 Spring Boot로 개발할 때 꼭 알아야 할 것들](docs/knowledge/P07-boot-dev-essentials.md)

## DataSource 설정 없음

**찾는 말** — `'url' attribute is not specified` · `Failed to configure a DataSource` · `Failed to determine a suitable driver class`

**언제 나나** — 서버를 켤 때다. `build.gradle`에 `spring-boot-starter-data-jpa`가 있는데 `application.yml`에 `spring.datasource.url`이 없으면 난다.

**실제 메시지** — `application.yml`의 `url:` 줄을 주석 처리했을 때

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.

Reason: Failed to determine a suitable driver class


Action:

Consider the following:
	If you want an embedded database (H2, HSQL or Derby), please put it on the classpath.
	If you have database settings to be loaded from a particular profile you may need to activate it (no profiles are currently active).
```

**로그에서 볼 줄** — `Description:` 첫 줄이다. `'url' attribute is not specified`가 핵심이다.

**원인** — JPA 의존성을 넣으면 Boot가 DB 연결(DataSource)을 자동으로 만들려고 한다. 어디로 연결할지(`url`)를 몰라서 멈춘다.

**고치는 법** — `application.yml`에 아래 세 줄이 `spring:` → `datasource:` 밑에 정확한 들여쓰기(공백 2칸씩)로 있는지 확인한다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
```

**관련 단계** — [1-2 설정 읽기](scenario/ch1-create-post/1-2-dto-response.md#설정-읽기) · [P19 MySQL 연결과 JPA 설정](docs/knowledge/P19-mysql-jpa-setup.md)

## DB에 연결 못 함

**찾는 말** — `Communications link failure` · `Connection refused` · `Unable to determine Dialect without JDBC metadata` · `Could not obtain connection`

**언제 나나** — 서버를 켤 때다. MySQL이 꺼져 있거나 `url`의 포트가 틀리면 난다. **두 경우의 메시지가 똑같다.**

**실제 메시지** — `url`의 포트를 아무도 안 쓰는 번호로 바꿨을 때(MySQL이 꺼진 것과 같은 상황)

```text
WARN … org.hibernate.orm.jdbc       : HHH100046: Could not obtain connection to query JDBC database metadata
WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 0, SQLState: 08S01
WARN … org.hibernate.orm.jdbc.error : Communications link failure

Caused by: com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure

The last packet sent successfully to the server was 0 milliseconds ago. The driver has not received any packets from the server.
Caused by: java.net.ConnectException: Connection refused
```

로그 맨 끝(`Application run failed`)의 마지막 `Caused by:`는 이렇게 나온다.

```text
Caused by: org.hibernate.HibernateException: Unable to determine Dialect without JDBC metadata (please set 'jakarta.persistence.jdbc.url' for common cases or 'hibernate.dialect' when a custom Dialect implementation must be provided)
```

**로그에서 볼 줄** — 주의할 곳이다. **맨 아래 `Caused by:`(Dialect 어쩌고)는 진짜 원인이 아니다.** DB에 못 붙어서 DB 종류를 알아내지 못했다는 뒤따른 결과일 뿐이다. 로그 **위쪽**의 `WARN … Communications link failure`와 그 밑 `Caused by: java.net.ConnectException: Connection refused`가 원인이다. "그 주소에서 아무도 대답하지 않는다"는 뜻이다.

**원인** — 앱이 `url`에 적힌 호스트·포트로 TCP 연결을 열지 못했다. MySQL 컨테이너가 꺼져 있거나, 포트 번호가 다르다. 예를 들면 이 저장소의 DB 컨테이너가 꺼져 있거나, `application.yml`의 `url` 포트가 compose의 호스트 포트 `13308`([README — DB 접속 정보](./README.md#db-접속-정보))과 다른 경우다. 지금 main의 `application.yml`은 `localhost:3306`을 가리키므로 compose DB를 쓰려면 `13308`로 바꾼다.

**고치는 법**

1. 이 저장소 루트에서 `docker compose ps mysql` → `healthy`인지 본다. 꺼져 있으면 `docker compose up -d`.
2. `application.yml`의 `url` 포트가 `13308`(`DB_PORT`를 바꿨다면 그 값)인지 본다.
3. 그래도 안 되면 `docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "SELECT 1"`로 DB 자체가 응답하는지 확인한다.

**관련 단계** — [1-2 일부러 망가뜨리기](scenario/ch1-create-post/1-2-dto-response.md#일부러-망가뜨리기) · [R08 앱 서버와 DB 서버는 어떻게 연결되나](docs/knowledge/R08-app-to-db-connection.md)

## DB 이름이나 계정이 틀림

**찾는 말** — `Access denied for user` · `ErrorCode: 1044` · `ErrorCode: 1045`

**언제 나나** — 서버를 켤 때다. `url`의 DB 이름에 오타가 있거나 `username`·`password`가 틀리면 난다.

**실제 메시지** — DB 이름을 `comunity`(m 하나)로 틀렸을 때. "Unknown database"가 아니라 **Access denied**로 나온다.

```text
WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 1044, SQLState: 42000
WARN … org.hibernate.orm.jdbc.error : Access denied for user 'community'@'%' to database 'comunity'
Caused by: java.sql.SQLSyntaxErrorException: Access denied for user 'community'@'%' to database 'comunity'
```

비밀번호를 틀렸을 때(`192.168.65.1`은 Docker Desktop이 보는 내 PC 주소라 환경마다 다르다)

```text
WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 1045, SQLState: 28000
WARN … org.hibernate.orm.jdbc.error : Access denied for user 'community'@'192.168.65.1' (using password: YES)
Caused by: java.sql.SQLException: Access denied for user 'community'@'192.168.65.1' (using password: YES)
```

두 경우 모두 맨 끝 `Caused by:`는 [DB에 연결 못 함](#db에-연결-못-함)과 같은 `Unable to determine Dialect without JDBC metadata`다.

**로그에서 볼 줄** — 위쪽 `WARN`의 `Access denied …` 줄이다. `to database '…'`가 붙어 있으면(1044) **DB 이름**을, `(using password: YES)`가 붙어 있으면(1045) **계정·비밀번호**를 본다.

**원인** — `community` 계정은 `community`·`practice` 두 DB만 쓸 수 있다. 없는 DB 이름은 "권한 없는 DB"로 취급되어 1044가 난다. 비밀번호가 틀리면 로그인 자체가 거절되어 1045가 난다.

**고치는 법** — `url`의 `/community?` 부분 철자를 확인한다. `username`·`password`는 `community`/`community`다. 계정이 아예 없다고 나오면 먼저 `url`의 포트가 `13308`인지 본다. 다른 포트(예: `3306`)에 떠 있는 다른 MySQL에 붙으면 `community` 계정이 없다. 포트가 맞는데도 계정이 없으면 DB 볼륨이 이 저장소의 초기 데이터로 만들어지지 않은 것이다. 이 저장소 루트에서 `docker compose down -v && docker compose up -d`로 새로 만든다(그동안의 데이터가 지워진다. 남길 것이 있으면 먼저 `./docker/mysql/dump.sh`).

**관련 단계** — [1-2 일부러 망가뜨리기](scenario/ch1-create-post/1-2-dto-response.md#일부러-망가뜨리기) · [R08 앱 서버와 DB 서버는 어떻게 연결되나](docs/knowledge/R08-app-to-db-connection.md)

## MySQL 드라이버 없음

**찾는 말** — `Failed to load driver class com.mysql.cj.jdbc.Driver` · `ClassNotFoundException: com.mysql.cj.jdbc.Driver`

**언제 나나** — 서버를 켤 때다. `build.gradle`에서 `runtimeOnly 'com.mysql:mysql-connector-j'` 줄이 빠지면 난다. 컴파일은 된다. 드라이버는 실행할 때만 필요해서다.

**실제 메시지**

```text
Caused by: java.lang.RuntimeException: Failed to load driver class com.mysql.cj.jdbc.Driver
Caused by: java.lang.RuntimeException: Failed to load class com.mysql.cj.jdbc.Driver
Caused by: java.lang.ClassNotFoundException: com.mysql.cj.jdbc.Driver
```

**로그에서 볼 줄** — 맨 아래 `Caused by: java.lang.ClassNotFoundException: com.mysql.cj.jdbc.Driver`다. "이 이름의 클래스가 실행 환경에 없다"는 뜻이다.

**원인** — `url`이 `jdbc:mysql:`로 시작하니 Boot는 MySQL 드라이버 클래스를 찾는다. 그 클래스는 `mysql-connector-j` 라이브러리 안에 있는데, 의존성이 없어서 못 찾는다.

**고치는 법** — `build.gradle`의 `dependencies { }` 안에 `runtimeOnly 'com.mysql:mysql-connector-j'`를 넣는다. IntelliJ 오른쪽 Gradle 창에서 새로고침(Reload)을 누르고 다시 실행한다.

**관련 단계** — [1-2 설정 읽기](scenario/ch1-create-post/1-2-dto-response.md#설정-읽기) · [P08 Maven·Gradle 실무](docs/knowledge/P08-maven-gradle-practical.md)

## 테이블 없음

**찾는 말** — `missing table` · `doesn't exist` · `ErrorCode: 1146`

**언제 나나** — 두 가지로 나타난다. `ddl-auto: validate`(실습 레포 기본)이면 **서버를 켤 때** 실패한다. `ddl-auto: none`이면 서버는 뜨고 **저장 요청 때** `500`이 난다.

**실제 메시지** — `@Table(name = "post")`를 `"posts"`로 틀렸을 때. 서버를 켤 때(`validate`)는 이렇게 나온다.

```text
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing table [posts]
```

요청 때(`none`)는 이렇게 나온다.

```text
WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 1146, SQLState: 42S02
WARN … org.hibernate.orm.jdbc.error : Table 'community.posts' doesn't exist
ERROR … Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.dao.InvalidDataAccessResourceUsageException: could not execute statement [Table 'community.posts' doesn't exist] [insert into posts (author_id,board_id,comment_count,content,created_at,deleted_at,like_count,published_at,status,title,updated_at,view_count,visibility) values (?,?,?,?,?,?,?,?,?,?,?,?,?)]; …] with root cause
java.sql.SQLSyntaxErrorException: Table 'community.posts' doesn't exist
	…
	at org.example.post.PostService.create(PostService.java:53) ~[main/:na]
```

**로그에서 볼 줄** — 기동 실패라면 `Schema validation: missing table [이름]`이다. 대괄호 안이 **엔티티가 찾은 테이블 이름**이다. 요청 실패라면 `Table '…' doesn't exist`와 그 아래 `at org.example…` 첫 줄(저장을 부른 자리)이다.

**원인** — 엔티티가 가리키는 테이블 이름(`@Table(name=…)`, 없으면 클래스 이름을 snake_case로 바꾼 것)이 DB에 없다. 철자(`posts`↔`post`)나 DB 선택(`community`가 아닌 다른 DB)이 틀렸다.

**고치는 법** — 테이블을 만들거나 바꾸지 말고 **엔티티를 테이블에 맞춘다**. CloudBeaver나 `SHOW TABLES`로 실제 이름을 보고 `@Table(name = "post")`로 고친다. Hibernate 7의 표기는 `Schema validation:`이다(하이픈 없음). 옛 글의 `Schema-validation:`으로 검색하면 안 나온다.

**관련 단계** — [1-4 일부러 망가뜨리기](scenario/ch1-create-post/1-4-save-to-db.md#일부러-망가뜨리기) · [P20 JPA 엔티티·연관관계 매핑](docs/knowledge/P20-jpa-entity-mapping.md)

## 컬럼 이름 불일치

**찾는 말** — `missing column`

**언제 나나** — `ddl-auto: validate`일 때 서버를 켜면 난다. 엔티티 필드가 가리키는 컬럼이 테이블에 없을 때다.

**실제 메시지** — `@Column(name = "view_count")`를 `"view_cnt"`로 틀렸을 때

```text
ERROR … j.LocalContainerEntityManagerFactoryBean : Failed to initialize JPA EntityManagerFactory: Unable to build Hibernate SessionFactory  [persistence unit: default] ; nested exception is org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing column [view_cnt] in table [post]
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing column [view_cnt] in table [post]
```

**로그에서 볼 줄** — `missing column [컬럼] in table [테이블]`이다. 어느 엔티티(테이블)의 어느 필드인지 바로 알려 준다. 한 번에 하나씩만 알려 주므로, 고치고 다시 켜면 다음 불일치가 나올 수 있다.

**원인** — Boot는 필드 이름을 snake_case로 바꿔 컬럼을 찾는다(`viewCount` → `view_count`). `@Column(name = …)`에 틀린 이름을 적었거나, 필드 이름 자체가 컬럼과 다르면 테이블에 없는 컬럼을 찾게 된다. 예를 들어 필드가 `views`면 `views` 컬럼을 찾는다.

**고치는 법** — 테이블의 실제 컬럼 이름(`SHOW COLUMNS FROM post`)을 보고 `@Column(name = "view_count")`로 맞추거나, `@Column(name=…)`을 지워 자동 변환에 맡긴다. 테이블 쪽을 바꾸지 않는다.

**관련 단계** — [1-4 일부러 망가뜨리기](scenario/ch1-create-post/1-4-save-to-db.md#일부러-망가뜨리기) · [P20 JPA 엔티티·연관관계 매핑](docs/knowledge/P20-jpa-entity-mapping.md)

## 의존성 누락 — 패키지 없음

**찾는 말** — `package jakarta.persistence does not exist` · `package org.springframework.data.jpa.repository does not exist` · `does not exist` · `cannot find symbol`

**언제 나나** — 빌드(컴파일)할 때다. 서버는 아예 시작도 못 한다. `build.gradle`에서 그 패키지를 주는 의존성이 빠졌을 때 난다. 예를 들면 `spring-boot-starter-data-jpa`가 빠진 경우다.

**실제 메시지** — `implementation 'org.springframework.boot:spring-boot-starter-data-jpa'` 줄을 지웠을 때(에러 98개 중 일부)

```text
…/javaExperience/src/main/java/org/example/post/Post.java:3: error: package jakarta.persistence does not exist
import jakarta.persistence.Column;
                          ^
…/javaExperience/src/main/java/org/example/tag/TagRepository.java:3: error: package org.springframework.data.jpa.repository does not exist
…/javaExperience/src/main/java/org/example/post/Post.java:23: error: cannot find symbol
@Entity
 ^
  symbol: class Entity
98 errors

* What went wrong:
Execution failed for task ':compileJava'
> Compilation failed; see the compiler output below.
```

**로그에서 볼 줄** — **첫 번째** `error:` 줄이다. 에러가 수십 개라도 원인은 하나인 경우가 많다. `package X does not exist`의 `X`가 어느 의존성에 들어 있는지 생각한다. `jakarta.persistence`·`org.springframework.data.jpa`는 data-jpa가, `jakarta.validation`은 validation이 준다.

**원인** — `import`한 패키지가 컴파일할 때 쓰는 라이브러리 목록에 없다. 의존성을 안 넣었거나, 넣고 나서 IntelliJ가 Gradle을 다시 읽지 않았다.

**고치는 법** — `build.gradle`에 해당 스타터를 넣고 IntelliJ Gradle 창에서 Reload를 누른다. 이미 있는데도 나면 Reload만 하면 되는 경우가 많다. 버전은 적지 않는다. Boot 플러그인이 맞춰 준다.

**관련 단계** — [1-2 설정 읽기](scenario/ch1-create-post/1-2-dto-response.md#설정-읽기) · [P08 Maven·Gradle 실무](docs/knowledge/P08-maven-gradle-practical.md)

## 생성자 인자 불일치

**찾는 말** — `cannot be applied to given types` · `actual and formal argument lists differ in length`

**언제 나나** — 컴파일할 때다. 생성자 주입으로 바꾼 클래스를 어디선가 `new PostService()`처럼 인자 없이 만들고 있으면 난다.

**실제 메시지** — 컨트롤러에서 `this.postService = new PostService();`라고 썼을 때

```text
…/javaExperience/src/main/java/org/example/post/PostController.java:24: error: constructor PostService in class PostService cannot be applied to given types;
        this.postService = new PostService();   // 망가뜨린 코드
                           ^
  required: PostRepository,BoardRepository,TagRepository
  found:    no arguments
  reason: actual and formal argument lists differ in length
```

**로그에서 볼 줄** — `required:`(생성자가 원하는 것)와 `found:`(내가 넘긴 것) 두 줄이다.

**원인** — `PostService`의 생성자는 저장소 셋(`PostRepository`·`BoardRepository`·`TagRepository`)을 받는다. 인자 없이는 만들 수 없다. 인자를 맞춰 넣으려 해도 저장소는 인터페이스라 `new`로 만들 수 없다. 구현은 Spring Data JPA가 서버를 켤 때 만든 객체 하나뿐이고, 그것은 Spring만 넣어 줄 수 있다.

**고치는 법** — 직접 `new` 하지 않는다. 필요한 객체를 생성자 인자로 받고(`public PostController(PostService postService)`), Spring이 넣어 주게 한다.

**관련 단계** — [1-3 일부러 망가뜨리기](scenario/ch1-create-post/1-3-service-layer.md#일부러-망가뜨리기) · [P12 왜 new 대신 빈으로 받나](docs/knowledge/P12-why-beans-ioc-intro.md)

## final 필드가 초기화되지 않음

**찾는 말** — `not initialized in the default constructor` · `might not have been initialized`

**언제 나나** — 컴파일할 때다. `@Autowired private final PostService postService;`처럼 필드 주입에 `final`을 같이 쓰면 난다.

**실제 메시지**

```text
…/javaExperience/src/main/java/org/example/post/PostController.java:23: error: variable postService not initialized in the default constructor
    private final PostService postService;
                              ^
```

**로그에서 볼 줄** — `error:` 줄의 변수 이름이다.

**원인** — `final` 필드는 객체가 만들어질 때(생성자 안에서) 반드시 값이 정해져야 한다. 필드 주입(`@Autowired`)은 객체를 **다 만든 뒤에** 값을 넣는다. 그래서 `final`과 함께 쓸 수 없다.

**고치는 법** — `@Autowired`를 지우고 그 필드를 받는 생성자를 만든다. 생성자가 하나면 `@Autowired`를 안 붙여도 Spring이 그 생성자로 넣어 준다. 이것이 "생성자 주입 + `final`" 조합이다.

**관련 단계** — [1-3 따라 치기](scenario/ch1-create-post/1-3-service-layer.md#따라-치기) · [P11 빈 등록과 의존성 주입](docs/knowledge/P11-bean-registration-di.md)

## Content-Type 없음 (415)

**찾는 말** — `Content-Type '` · `Unsupported Media Type` · `HttpMediaTypeNotSupportedException`

**언제 나나** — `@RequestBody`가 있는 API에 JSON을 보내면서 `Content-Type: application/json` 헤더를 빠뜨렸을 때다. `curl -d`는 헤더를 안 주면 `application/x-www-form-urlencoded`로 보낸다. `fetch`에 문자열 본문만 주면 `text/plain`으로 보낸다.

**실제 메시지** — 응답

```text
HTTP/1.1 415
Accept: application/json, application/*+json

{"timestamp":"2026-10-09T12:55:10.148Z","status":415,"error":"Unsupported Media Type","path":"/api/posts"}
```

서버 로그(`WARN`)

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.HttpMediaTypeNotSupportedException: Content-Type 'application/x-www-form-urlencoded;charset=UTF-8' is not supported]
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.HttpMediaTypeNotSupportedException: Content-Type 'text/plain;charset=UTF-8' is not supported]
```

**로그에서 볼 줄** — 서버 로그 `Resolved [...]`의 `Content-Type '…'`이다. 내가 실제로 보낸 타입이 찍힌다. 응답의 `Accept:` 헤더는 서버가 받을 수 있는 타입이다.

**원인** — 서버는 `Content-Type`을 보고 본문을 어떻게 읽을지 정한다. JSON 읽기(Jackson)는 `application/json`일 때만 동작한다.

**고치는 법** — 요청에 헤더를 붙인다. curl은 `-H 'Content-Type: application/json'`, fetch는 `headers: { "Content-Type": "application/json" }`이다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md) · [P16 JSON·Jackson 실무](docs/knowledge/P16-json-jackson-practical.md)

## 깨진 JSON (400)

**찾는 말** — `JSON parse error` · `Unexpected character` · `was expecting double-quote`

**언제 나나** — 본문 JSON 문법이 틀렸을 때다. 마지막 쉼표, 작은따옴표, 따옴표 없는 키가 흔한 원인이다.

**실제 메시지** — 본문이 `{"boardSlug":"dev","title":"t",}`(끝에 쉼표)일 때. 응답은 이렇게 온다.

```text
HTTP/1.1 400

{"timestamp":"2026-10-09T12:55:10.206Z","status":400,"error":"Bad Request","path":"/api/posts"}
```

서버 로그에는 이렇게 남는다.

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Unexpected character ('}' (code 125)): was expecting double-quote to start property name]
```

**로그에서 볼 줄** — 응답에는 이유가 없다. 서버 로그 `JSON parse error:` 뒤가 이유다. `('}' (code 125))`가 문제의 글자다.

**원인** — 요청이 컨트롤러에 닿기 전에 Jackson이 본문을 읽다가 실패했다. 내 코드는 실행되지 않았다. 그래서 `at org.example…` 줄도 없다.

**고치는 법** — 본문을 JSON 검사기(예: 브라우저 콘솔의 `JSON.parse(…)`)에 넣어 본다. 끝 쉼표를 지우고 키·문자열은 큰따옴표로 감싼다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md) · [P16 JSON·Jackson 실무](docs/knowledge/P16-json-jackson-practical.md)

## 본문 없음 또는 @RequestBody 두 개 (400)

**찾는 말** — `Required request body is missing`

**언제 나나** — 두 경우다. (1) 본문 없이 요청을 보냈을 때. (2) 한 메서드에 `@RequestBody`를 두 개 붙였을 때. (2)는 **본문을 제대로 보내도** 난다.

**실제 메시지** — `create(@RequestBody PostCreateRequest a, @RequestBody Map<String, Object> b)`로 만들고 정상 JSON을 보냈을 때. 응답은 `400`이고 로그는 이렇다.

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.http.converter.HttpMessageNotReadableException: Required request body is missing: public java.lang.String org.example.post.LabController.twoBodies(org.example.post.PostCreateRequest,java.util.Map<java.lang.String, java.lang.Object>)]
```

본문 없이 보냈을 때도 같은 말이다.

```text
WARN … Resolved [org.springframework.http.converter.HttpMessageNotReadableException: Required request body is missing: public org.springframework.http.ResponseEntity<org.example.post.PostResponse> org.example.post.PostController.create(org.example.post.PostCreateRequest)]
```

**로그에서 볼 줄** — `Required request body is missing:` 뒤에 **어느 메서드**인지 나온다. 그 메서드의 `@RequestBody` 개수부터 센다.

**원인** — 요청 본문은 한 번만 읽을 수 있는 스트림 하나다. 첫 번째 `@RequestBody`가 다 읽고 나면 두 번째에게는 남은 게 없다.

**고치는 법** — `@RequestBody`는 메서드에 하나만 둔다. 여러 값이 필요하면 그 값들을 필드로 가진 DTO 하나로 받는다. URL 경로 값은 `@PathVariable`, 쿼리는 `@RequestParam`, 헤더는 `@RequestHeader`로 받는다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md) · [1-2 DB에 저장하고 201로 응답](scenario/ch1-create-post/1-2-dto-response.md)

## DTO를 만들 생성자를 못 고름 (400)

**찾는 말** — `although at least one Creator exists` · `no delegate- or property-based Creator` · `Cannot construct instance of`

**언제 나나** — 요청 DTO를 일반 클래스로 만들었는데, 기본 생성자(인자 없는 생성자) 없이 생성자를 **두 개 이상** 두었을 때다.

**실제 메시지**

```text
WARN … Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot construct instance of `org.example.post.LabController$TwoCtors` (although at least one Creator exists): cannot deserialize from Object value (no delegate- or property-based Creator)]
```

**로그에서 볼 줄** — 백틱(`` ` ``) 안의 클래스 이름이다. `$` 뒤가 안쪽 클래스 이름이다.

**원인** — Jackson은 JSON으로 객체를 만들 생성자를 골라야 한다. 생성자가 여럿이고 어느 것을 쓸지 표시가 없으면 고르지 못한다. 참고로 Boot 4(Jackson 3)에서는 **생성자가 딱 하나면** 기본 생성자 없이도 그 생성자의 인자 이름으로 값을 채워 성공했다(재현 결과 `200`).

**고치는 법** — 가장 쉬운 길은 `record`로 바꾸는 것이다. 클래스로 둬야 하면 기본 생성자 + setter를 두거나, 쓸 생성자에 `@JsonCreator`를 붙인다.

**관련 단계** — [1-2 DB에 저장하고 201로 응답](scenario/ch1-create-post/1-2-dto-response.md) · [P16 JSON·Jackson 실무](docs/knowledge/P16-json-jackson-practical.md)

## 경로 오타 (404)

**찾는 말** — `"status":404` · `No static resource` · `NoResourceFoundException`

**언제 나나** — 요청 주소가 어떤 `@…Mapping`과도 맞지 않을 때다. `/api/post`↔`/api/posts`, 클래스의 `@RequestMapping`과 메서드 경로를 합친 결과를 잘못 계산한 경우가 흔하다.

**실제 메시지** — `POST /api/post`(s 빠짐)

```text
HTTP/1.1 404

{"timestamp":"2026-10-09T12:55:10.233Z","status":404,"error":"Not Found","path":"/api/post"}
```

서버 로그에는 **아무것도 안 남는다**(기본 로그 수준). `logging.level.org.springframework.web: debug`를 켜면 이렇게 보인다.

```text
DEBUG … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/post for request '/api/post'.]
```

**로그에서 볼 줄** — 로그가 조용한 게 특징이다. 응답 본문의 `"path"`가 서버가 받은 주소다. 그 주소와 컨트롤러의 매핑을 글자 단위로 비교한다.

**원인** — 맞는 컨트롤러 메서드가 없으면 Spring은 정적 파일(`static/`)에서 찾아보고, 그것도 없으면 404를 준다. 컨트롤러 클래스에 `@RestController`가 빠져서 매핑 자체가 등록되지 않았을 때도 같은 404다.

**고치는 법** — `@RequestMapping("/api/posts")` + `@PostMapping`이면 주소는 `/api/posts`다. 서버를 켤 때 컨트롤러 클래스에 `@RestController`(또는 `@Controller`)가 붙어 있는지도 본다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md)

## 메서드가 다름 (405)

**찾는 말** — `HttpRequestMethodNotSupportedException` · `Request method` · `Method Not Allowed`

**언제 나나** — 주소는 맞는데 HTTP 메서드가 다를 때다. 예를 들어 `POST`만 만든 `/api/posts`를 브라우저 주소창으로 열면(`GET`) 난다.

**실제 메시지**

```text
HTTP/1.1 405
Allow: POST

{"timestamp":"2026-10-09T12:55:10.244Z","status":405,"error":"Method Not Allowed","path":"/api/posts"}
```

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.HttpRequestMethodNotSupportedException: Request method 'GET' is not supported]
```

**로그에서 볼 줄** — 응답의 `Allow:` 헤더가 그 주소가 받는 메서드다.

**원인** — 경로는 매핑에 있지만 그 메서드(`GET`)용 핸들러가 없다.

**고치는 법** — 요청 메서드를 `Allow:`에 맞추거나, 그 메서드용 `@GetMapping`을 만든다.

**관련 단계** — [1-1 요청 받기](scenario/ch1-create-post/1-1-receive-request.md)

## 비정적 안쪽 DTO (500)

**찾는 말** — `non-static inner classes like this can only by instantiated` · `Type definition error` · `InvalidDefinitionException`

**언제 나나** — 요청 DTO를 컨트롤러 클래스 **안에** `public class CreateRequest { … }`로 만들었을 때다(`static` 없음). 요청이 올 때 난다. 클라이언트 잘못이 아니라 서버 정의 문제라서 `400`이 아니라 **`500`**이다.

**실제 메시지**

```text
ERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet] : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.http.converter.HttpMessageConversionException: Type definition error: [simple type, class org.example.post.LabController$InnerRequest]]

tools.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `org.example.post.LabController$InnerRequest`: non-static inner classes like this can only by instantiated using default, no-argument constructor
```

**로그에서 볼 줄** — `tools.jackson.databind.exc.InvalidDefinitionException:` 줄이다. Boot 4는 Jackson 3라서 예외·databind 패키지가 `tools.jackson`이다(Jackson 2는 `com.fasterxml.jackson`). 단 `@JsonCreator`·`@JsonProperty` 같은 애노테이션은 그대로 `com.fasterxml.jackson.annotation`이다. 스택트레이스에 `at org.example…` 줄이 **없다**. 내 메서드가 불리기 전, 본문을 DTO로 바꾸다 실패했기 때문이다. 메시지의 `$` 뒤 클래스 이름이 단서다.

**원인** — `static`이 없는 안쪽 클래스는 바깥 객체(`LabController` 인스턴스)가 있어야 만들 수 있다. Jackson은 바깥 객체 없이 안쪽 객체만 만들 방법이 없다.

**고치는 법** — 셋 중 하나를 고른다. (1) `public static class`로 바꾼다. (2) 안쪽에 `record`로 둔다(record는 자동으로 static이다). (3) 가장 깔끔하게, 파일을 따로 빼서 `PostCreateRequest.java`로 만든다.

**관련 단계** — [1-2 DB에 저장하고 201로 응답](scenario/ch1-create-post/1-2-dto-response.md) · [P16 JSON·Jackson 실무](docs/knowledge/P16-json-jackson-practical.md)

## 지연 로딩 — no session

**찾는 말** — `Could not initialize proxy` · `no session` · `LazyInitializationException`

**언제 나나** — 요청 때 `500`이다. `@ManyToOne(fetch = LAZY)` 같은 지연 로딩 연관을 **트랜잭션 밖에서** 처음 건드릴 때 난다. 서비스 메서드에서 `@Transactional`을 빼거나, 컨트롤러(트랜잭션 밖)에서 `post.getAuthor().getNickname()`을 부르면 난다.

**실제 메시지** — `PostService.create`에서 `@Transactional`을 지웠을 때

```text
ERROR … Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.hibernate.LazyInitializationException: Could not initialize proxy [org.example.member.Member#2] - no session] with root cause

org.hibernate.LazyInitializationException: Could not initialize proxy [org.example.member.Member#2] - no session
	at org.hibernate.proxy.AbstractLazyInitializer.initialize(AbstractLazyInitializer.java:178) ~[hibernate-core-7.4.5.Final.jar:7.4.5.Final]
	…
	at org.example.member.Member$HibernateProxy.getNickname(Unknown Source) ~[main/:na]
	at org.example.post.PostService.create(PostService.java:56) ~[main/:na]
```

`@Transactional`은 두고 서비스의 "미리 읽어 두기" 두 줄을 지우면, 같은 메시지가 컨트롤러에서 난다.

```text
	at org.example.member.Member$HibernateProxy.getNickname(Unknown Source) ~[main/:na]
	at org.example.post.PostController.toResponse(PostController.java:39) ~[main/:na]
```

**로그에서 볼 줄** — `[org.example.member.Member#2]`는 "id 2인 Member를 아직 안 읽은 대리 객체(proxy)"라는 뜻이다. 그 아래 `at org.example…` 첫 줄이 트랜잭션 밖에서 그 객체를 건드린 자리다.

**원인** — 지연 로딩 객체는 처음 쓸 때 DB에서 읽는다. 그러려면 열려 있는 DB 세션(트랜잭션)이 필요하다. 실습 레포는 `open-in-view: false`라서 서비스 메서드의 트랜잭션이 끝나면 세션도 닫힌다.

**고치는 법** — 서비스 메서드에 `@Transactional`을 붙인다. 응답에 필요한 연관 값(작성자 닉네임, 태그 이름)은 **트랜잭션 안에서** 읽어 DTO로 바꾸거나 미리 건드려 둔다. 엔티티를 그대로 응답하지 않는다.

**관련 단계** — [1-4 일부러 망가뜨리기](scenario/ch1-create-post/1-4-save-to-db.md#일부러-망가뜨리기) · [W11 트랜잭션은 왜 서비스 계층에 거나](docs/knowledge/W11-why-tx-in-service.md) · [W09 DTO는 왜 쓰나](docs/knowledge/W09-why-dto.md)

## 엔티티 기본 생성자 없음

**찾는 말** — `No default constructor for entity` · `InstantiationException`

**언제 나나** — 서버는 뜨고 저장도 된다. **DB에서 그 엔티티를 읽어 올 때** `500`이 난다. 1-4에서는 이미 있는 태그(`spring`)를 `findByName`으로 읽을 때다.

**실제 메시지** — `Tag`에서 `protected Tag() {}`를 지웠을 때

```text
ERROR … threw exception [Request processing failed: org.springframework.orm.jpa.JpaSystemException: No default constructor for entity 'org.example.tag.Tag'] with root cause

org.hibernate.InstantiationException: No default constructor for entity 'org.example.tag.Tag'
	…
	at org.example.post.PostService.create(PostService.java:48) ~[main/:na]
```

같은 줄을 `Post`에서 지우면 글 저장(`201`)은 성공한다. `Post`를 DB에서 읽는 기능(2장 조회)을 만들 때 터진다.

**로그에서 볼 줄** — `for entity '…'`의 클래스 이름과 `at org.example…` 첫 줄(읽기를 부른 자리)이다.

**원인** — JPA는 DB 행을 객체로 만들 때 **인자 없는 생성자**로 빈 객체를 만든 뒤 필드를 채운다. 인자 있는 생성자만 있으면 빈 객체를 만들 수 없다. 저장은 내가 `new`로 만든 객체를 쓰니 문제가 없다.

**고치는 법** — 엔티티마다 `protected Tag() {}`처럼 인자 없는 생성자를 둔다. `protected`면 JPA는 쓸 수 있고, 다른 코드가 함부로 빈 객체를 만들지는 못한다.

**관련 단계** — [1-4 일부러 망가뜨리기](scenario/ch1-create-post/1-4-save-to-db.md#일부러-망가뜨리기) · [P20 JPA 엔티티·연관관계 매핑](docs/knowledge/P20-jpa-entity-mapping.md)

## 중복 키

**찾는 말** — `Duplicate entry` · `DuplicateKeyException` · `SQLIntegrityConstraintViolationException`

**언제 나나** — 유일(UNIQUE) 제약이 있는 컬럼에 이미 있는 값을 넣을 때다. `tag.name`이 그렇다. 같은 태그를 "있는지 확인 안 하고" 또 `INSERT`하면 난다.

**실제 메시지** — `JdbcTemplate`으로 `INSERT INTO tag (name, created_at) VALUES ('jdbc태그', …)`를 두 번 실행했을 때

```text
org.springframework.dao.DuplicateKeyException: PreparedStatementCallback; SQL [INSERT INTO tag (name, created_at) VALUES (?, ?)]; Duplicate entry 'jdbc태그' for key 'tag.uk_tag_name'
Caused by: java.sql.SQLIntegrityConstraintViolationException: Duplicate entry 'jdbc태그' for key 'tag.uk_tag_name'
```

**로그에서 볼 줄** — `Duplicate entry '값' for key '테이블.제약이름'`이다. 어느 값이 어느 제약에 걸렸는지 알려 준다.

**원인** — DB가 같은 이름의 태그를 두 개 두지 못하게 막았다. 정상적인 보호 장치다.

**고치는 법** — 넣기 전에 이름으로 찾고, 없을 때만 넣는다(1-3의 `findByName(...).orElseGet(...)`). 요청 안에 같은 이름이 두 번 오면 먼저 중복을 지운다.

**관련 단계** — [1-4 데이터 넣는 두 가지](scenario/ch1-create-post/1-4-save-to-db.md#데이터-넣는-두-가지)

## new로 만든 객체의 null

**찾는 말** — `is null` · `Cannot invoke` · `NullPointerException`

**언제 나나** — 필드 주입(`@Autowired private PostService postService;`)을 쓰는 클래스를 Spring 밖에서 `new PostController()`로 만들어 쓰면 난다. 테스트 코드에서 흔하다.

**실제 메시지**

```text
Caused by: java.lang.NullPointerException: Cannot invoke "org.example.post.PostService.create(org.example.post.PostCreateRequest)" because "this.postService" is null
	at org.example.post.PostController.create(PostController.java:29)
```

**로그에서 볼 줄** — `because "…" is null`의 변수 이름과 바로 아래 `at` 줄이다. Java 21은 어느 변수가 null인지 알려 준다.

**원인** — `@Autowired`는 Spring이 만든 객체에만 값을 넣는다. 내가 `new`로 만든 객체의 필드는 아무도 채우지 않아 `null`이다. 필드 주입은 컴파일러가 이걸 막아 주지 못한다.

**고치는 법** — 생성자 주입으로 바꾼다. 그러면 `new PostController()`는 컴파일부터 안 되고, 테스트에서는 `new PostController(가짜서비스)`처럼 필요한 걸 직접 넘기게 된다.

**관련 단계** — [1-3 일부러 망가뜨리기](scenario/ch1-create-post/1-3-service-layer.md#일부러-망가뜨리기) · [P11 빈 등록과 의존성 주입](docs/knowledge/P11-bean-registration-di.md)

## 응답이 빈 {}

**찾는 말** — `{}`

**언제 나나** — 에러 없이 `200`인데 본문이 `{}`다. 응답 DTO를 일반 클래스로 만들고 **getter를 안 만들었을 때**다.

**실제 메시지** — `private final String title;`과 생성자만 있는 클래스를 돌려줬을 때

```text
HTTP/1.1 200

{}
```

서버 로그에는 아무것도 없다.

**로그에서 볼 줄** — 없다. 응답 본문이 단서다.

**원인** — Jackson은 `getXxx()` 메서드(또는 public 필드, record 구성 요소)로 응답에 넣을 값을 찾는다. private 필드만 있으면 넣을 게 없어 빈 객체가 된다. Boot 4(Jackson 3)에서는 이때 에러 없이 `{}`를 돌려줬다.

**고치는 법** — 응답 DTO를 `record`로 만든다(이름 그대로 접근 메서드가 생긴다). 클래스로 둬야 하면 필드마다 `getTitle()` 같은 getter를 만든다.

**관련 단계** — [1-2 DB에 저장하고 201로 응답](scenario/ch1-create-post/1-2-dto-response.md) · [W09 DTO는 왜 쓰나](docs/knowledge/W09-why-dto.md)

## 한글이 깨져 보임

**찾는 말** — `ë¡œ` · `ì` · `ê¸`

**언제 나나** — `docker exec … mysql -e "INSERT … '한글'"`로 터미널에서 한글을 넣었는데, 앱이나 CloudBeaver에서 `SQLë¡œ ë„£ì€ ê¸€`처럼 보일 때다. 에러는 나지 않는다.

**실제 메시지** — 같은 `INSERT`를 문자셋 옵션 없이 한 번, `--default-character-set=utf8mb4`로 한 번 넣고 조회했을 때

```text
id	title
28	SQL로 넣은 글2
27	SQLë¡œ ë„£ì€ ê¸€
```

**로그에서 볼 줄** — 없다. 조회 결과가 단서다.

**원인** — 컨테이너 안 `mysql` 클라이언트의 기본 문자셋이 `latin1`이다(`SHOW VARIABLES LIKE 'character_set_client'` → `latin1`). UTF-8 한글 바이트를 latin1 글자로 읽어 한 번 더 변환해 저장해 버린다.

**고치는 법** — 터미널로 한글을 넣을 때는 항상 `--default-character-set=utf8mb4`를 붙인다. 이미 깨진 행은 지우고 다시 넣는다. 앱(JPA·JdbcTemplate)으로 넣은 한글은 이 문제가 없다.

**관련 단계** — [1-4 데이터 넣는 두 가지](scenario/ch1-create-post/1-4-save-to-db.md#데이터-넣는-두-가지)
