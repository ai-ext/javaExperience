# P07. Spring Boot로 개발할 때 꼭 알아야 할 것들 — 개발 습관과 에러 해결

> 3줄 요약 — 실행 설정은 `application.yml`에 모으고 환경 차이는 프로파일·환경 변수로 나눈다.
> 문제가 나면 첫 에러 한 줄보다 가장 안쪽 `Caused by`와 애플리케이션 시작 로그를 먼저 확인한다.
> 커밋 전에는 같은 JDK로 빌드·테스트하고, 로컬 도구·DB 비밀번호·토큰은 저장소에 넣지 않는다.

## 1. 한 줄로 말하면

Spring Boot 개발의 기본기는 재현 가능한 실행 환경, 외부 설정, 관찰 가능한 로그, 작은 확인 루프를 갖추는 일이다. 설정을 코드에 박아 넣지 않고 실행 환경이 주입하게 만들면 같은 빌드를 local·dev·prod에서 안전하게 실행할 수 있다. 시작 로그와 요청·응답, 예외의 원인을 차례로 확인하면 많은 문제를 코드 전체를 훑지 않고도 좁힐 수 있다.

## 2. 당장 알아야 할 것

### 1) JDK와 빌드 도구 버전을 먼저 고정한다

Java toolchain, IntelliJ SDK, Gradle JVM을 Java 25로 맞춘다. IDE/CLI 결과가 다르면 `./gradlew -version`을 비교한다. Lombok 편집기 플러그인과 빌드 processor는 별개다.

```kotlin
compileOnly("org.projectlombok:lombok")
annotationProcessor("org.projectlombok:lombok")
```

IDEA의 Lombok 플러그인·Annotation Processing을 확인하고 Gradle을 재동기화한다.

### 2) 공통값·환경별 값·비밀값을 구분한다

공통값은 `application.yml`, 차이는 `application-local.yml`에 둔다. 프로파일은 이름만으로 켜지지 않는다. 비밀번호·토큰은 환경 변수로 주입하고 커밋하지 않는다.

```yaml
# application.yml — 저장소에 넣어도 되는 공통 설정
spring:
  application:
    name: boot-dev-essentials
server:
  port: ${PORT:8080}
logging:
  level:
    root: INFO
```

구조화된 설정은 `@ConfigurationProperties`로 묶는다. 활성 프로파일은 시작 로그로 확인한다. → S04.

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
# Maven 대응
./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=local
```

### 4) 필요한 로그만 켜고 SQL 값은 로컬에서만 본다

SLF4J를 사용하고 구현체는 Boot 기본값(Logback)에 맡긴다. 클래스·패키지별 레벨을 조절한다.

```yaml
logging:
  level:
    com.example.demo: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE # Hibernate 바인딩 값, 로컬에서만
```

SQL은 DEBUG, 파라미터 확인은 TRACE로 한다. 민감값이 포함될 수 있어 로컬에서만 켠다.

### 5) DevTools는 개발 전용 의존성으로 둔다

`developmentOnly("org.springframework.boot:spring-boot-devtools")`로 추가한다. 클래스패스 변경 시 재시작하며 패키징된 앱에는 기본 포함되지 않는다. 재시작 오류는 DevTools restart를 잠시 꺼 보고, 멀티 모듈이면 클래스 로더 구성을 확인한다.

### 6) 로컬 DB는 목적에 따라 고른다

짧은 SQL 실습은 종료 시 데이터가 사라지는 메모리 H2로 시작한다. 팀 개발에서 운영 DB 호환성이 필요하면 Docker Compose로 같은 엔진을 띄운다. Boot Compose 지원은 개발 중 서비스 연결을 도와준다.

```kotlin
// PostgreSQL을 Compose로 띄우는 프로젝트에 추가
runtimeOnly("org.postgresql:postgresql")
developmentOnly("org.springframework.boot:spring-boot-docker-compose")
```

### 7) 첫 진단은 시작 로그와 가장 안쪽 예외다

시작 로그에서 활성 프로파일·포트와 `Started ...`까지 도달했는지 본다. 중첩 예외는 마지막 `Caused by`가 실제 원인을 가리키는 경우가 많다. IDE breakpoint에서 호출 스택·변수를 확인하고, 상태를 바꾸는 평가식은 피한다.

### 8) 요청은 실제 HTTP로 재현한다

POST·PUT은 `curl`, HTTPie, IntelliJ HTTP Client에서 method·header·body를 지정한다. JSON이면 Content-Type과 DTO 구조를 맞춘다. API 탐색은 개발용 Swagger UI를 쓴다.

### 9) Actuator는 진단에 필요한 endpoint만 노출한다

Actuator의 `beans`, `mappings`, `loggers`는 로컬 진단에 유용하다. 필요한 endpoint만 로컬 프로파일에서 노출하고 `*` 설정을 운영에 복사하지 않는다. 운영 노출은 → S16 참조.

### 10) 커밋 전 검사는 늘 같은 명령으로 한다

저장소 Wrapper로 빌드·테스트를 재현한다. 실패하면 변경과 기존 상태를 구분한다.

```bash
./gradlew clean check
# Maven 대응
./mvnw clean verify
```

`.gitignore`에는 빌드 산출물과 로컬 `.env`를 넣고, 팀이 공유할 IDE 설정은 정책을 정한다. Git에 올린 비밀값은 삭제만으로 회수되지 않으므로 커밋하지 않는다.

## 3. 따라 하기

아래 Spring 예제는 미실행이다. Spring Initializr에서 Boot 4.1.1, Java 25, Gradle Kotlin DSL, Spring Web MVC·JDBC·Actuator를 고른 프로젝트에서 시작한다. H2와 DevTools는 아래 빌드 파일에 포함했다. 명령은 루트에서 실행한다.

### 단계 1 — 빌드와 실행 가능한 API 만들기

`build.gradle.kts`에 Java toolchain으로 빌드 JDK를 고정한다.

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    runtimeOnly("com.h2database:h2")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

`src/main/java/com/example/demo/DemoApplication.java`:

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

`src/main/java/com/example/demo/StatusController.java`:

```java
package com.example.demo;

import java.util.List;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StatusController {
    private final Environment environment;

    public StatusController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/status")
    public StatusResponse status() {
        return new StatusResponse("ok", List.of(environment.getActiveProfiles()));
    }

    @PostMapping(path = "/echo", consumes = MediaType.APPLICATION_JSON_VALUE)
    public EchoResponse echo(@RequestBody EchoRequest request) {
        return new EchoResponse(request.name());
    }

    public record StatusResponse(String status, List<String> profiles) {}
    public record EchoRequest(String name) {}
    public record EchoResponse(String name) {}
}
```

`src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: boot-dev-essentials
server:
  port: ${PORT:8080}
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
```

`src/main/resources/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
management:
  endpoints:
    web:
      exposure:
        include: health,info,beans,mappings,loggers
```

H2 콘솔과 상세 Actuator endpoint는 이 `local` 설정에서만 켠다. 실제 프로젝트에서는 같은 경로를 운영 프로파일에 복사하지 말고, 원격 접근 제어를 별도로 구성한다.

**확인 방법:**

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

로그에 Tomcat 8080 시작과 활성 프로파일 `local`이 보여야 한다. 포트는 `PORT=8081` 또는 `--server.port=8081`로 바꾼다.

### 단계 2 — 프로파일·JSON 요청·로그를 확인한다

다른 터미널에서 GET·POST를 호출한다. `-i`는 상태와 헤더를 표시한다.

```bash
curl -i http://localhost:8080/api/status
curl -i -X POST http://localhost:8080/api/echo \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada"}'
```

**확인 방법(기대 결과):** 첫 응답은 `HTTP/1.1 200`과 `{"status":"ok","profiles":["local"]}`, 둘째는 `HTTP/1.1 200`과 `{"name":"Ada"}` 형태다. 키 순서는 달라질 수 있다. IntelliJ HTTP Client에서는 같은 URL·method·헤더·본문을 `.http` 파일에 저장해 재현한다.

Swagger UI가 필요하면 `build.gradle.kts`의 dependencies에 다음을 추가한다. springdoc 문서가 안내하는 Boot 4 계열 starter를 사용한다.

```kotlin
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1")
```

**확인 방법(기대 결과):** 재시작 후 `/swagger-ui/index.html`에서 endpoint를 보고 `/api/status`를 호출한다. 운영 공개 시 인증·접근 통제를 둔다.

### 단계 3 — 로컬 DB를 선택한다

이 실습은 메모리 H2에 연결된다. JDBC starter나 H2 드라이버가 빠지면 DataSource 오류가 날 수 있고, DB는 앱 재시작 시 비워진다.

팀에서 실제 PostgreSQL 호환 동작을 확인할 때는 프로젝트 루트에 `compose.yaml`을 둔다.

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: demo
      POSTGRES_USER: demo
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set in local environment}
    ports:
      - "5432:5432"
```

Gradle에 PostgreSQL driver와 Boot Docker Compose 지원을 추가하면 개발 중 Compose 서비스를 감지한다. 비밀번호는 셸 환경 변수로 주입한다. 목적에 맞는 DB·프로파일 하나를 선택한다.

**확인 방법:** `export POSTGRES_PASSWORD=local-value && docker compose up -d` 후 `docker compose ps`와 앱 연결 로그를 확인한다. 같은 셸에서 `docker compose down`으로 종료한다.

### 단계 4 — 매핑과 등록 빈을 찾아 디버깅한다

IntelliJ에서 `/api/status` 첫 줄에 breakpoint를 걸고 요청을 보낸다. 호출 스택과 활성 프로파일을 보고, 조건부 breakpoint에는 안전한 비교식만 쓴다.

로컬 프로파일에서 다음 endpoint를 조회한다.

```bash
curl -s http://localhost:8080/actuator/mappings
curl -s http://localhost:8080/actuator/beans
curl -s http://localhost:8080/actuator/loggers/com.example.demo
```

**확인 방법:** `mappings`에서 두 URL, `beans`에서 `statusController`를 찾는다. 실패하면 Actuator dependency, 프로파일 로딩, HTTP 노출 목록을 확인한다.

### 단계 5 — 커밋 전 빌드한다

```bash
./gradlew clean check
```

**확인 방법:** `BUILD SUCCESSFUL`과 테스트 통과를 확인한다. Maven은 `./mvnw clean verify`. `git status --short`, `git diff --check`로 커밋 대상을 본다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 프로파일 실행 | 환경별 설정 선택 | `--spring.profiles.active=local` | 파일이 있어도 자동 활성화되지 않는다 |
| 환경 변수 | 포트·자격 증명 주입 | `DB_PASSWORD`, `PORT` | 실제 값은 커밋하지 않는다 |
| 클래스 로그 레벨 | 특정 패키지만 상세히 출력 | `logging.level.com.example.demo=DEBUG` | 루트 전체를 무조건 TRACE로 올리지 않는다 |
| SQL 로그 | SQL과 바인딩 확인 | `org.hibernate.SQL=DEBUG` | 파라미터 로그에는 민감값이 포함될 수 있다 |
| HTTP 요청 | API 재현 | `curl -i -X POST ...` | JSON이면 Content-Type과 본문 구조 확인 |
| Swagger UI | OpenAPI 문서·수동 호출 | `/swagger-ui/index.html` | 운영 공개 시 인증·접근 통제 필요 |
| 커밋 검사 | 컴파일·테스트 | `./gradlew clean check` | Wrapper를 사용해 같은 Gradle 버전 실행 |


## 5. 자주 나는 에러와 해결

1. **`Port 8080 was already in use` →** 다른 프로세스가 포트를 사용한다. `lsof -nP -iTCP:8080 -sTCP:LISTEN`으로 확인해 종료하거나 `--server.port=8081`로 실행한다.

2. **`NoSuchBeanDefinitionException` / `No qualifying bean of type ... available` →** 타입의 빈이 없다. 구현체 애노테이션, component scan 패키지, 활성 프로파일·조건을 확인한다.

3. **`UnsatisfiedDependencyException` →** 의존성 생성 실패를 감싼 예외다. 가장 안쪽 `Caused by`에서 빈 누락·생성자·설정 오류를 찾는다.

4. **`BeanCurrentlyInCreationException` / circular reference →** 생성자 의존이 순환한다. 역할을 분리해 방향을 끊고, 순환 허용이나 지연 주입으로 구조를 감추지 않는다.

5. **Whitelabel 404 / `No static resource ...` →** 요청 경로 handler가 없다. controller 애노테이션·매핑·패키지를 확인하고 `/actuator/mappings`에서 등록 경로를 찾는다.

6. **`405 Method Not Allowed` →** URL은 있지만 HTTP method가 다르다. 요청 method와 `@GetMapping` 등 매핑을 대조한다.

7. **`415 Unsupported Media Type` →** 요청 헤더와 endpoint 미디어 타입이 다르다. `Content-Type: application/json` 및 `consumes`를 맞춘다.

8. **`HttpMessageNotReadableException: JSON parse error` →** JSON 문법·필드 타입이 DTO와 맞지 않는다. 따옴표·괄호·타입을 확인한다. 양방향 엔티티의 응답 재귀는 필요한 필드만 가진 DTO로 끊는다.

9. **`LazyInitializationException: could not initialize proxy - no Session` →** 세션 밖에서 지연 로딩했다. 필요한 관계를 조회하고 트랜잭션 안에서 DTO를 만든다. (→ S09.)

10. **`Failed to configure a DataSource: 'url' attribute is not specified` →** JDBC URL 또는 임베디드 드라이버가 없다. DB를 쓰면 H2 의존성이나 외부 datasource URL·계정을 설정하고, 아니면 JDBC starter를 제거한다.

11. **`Table "..." not found` / `relation does not exist` →** 연결은 됐지만 테이블·스키마가 없다. 활성 DB, `schema.sql`, Flyway/Liquibase 실행 로그와 실제 이름을 확인한다.

12. **`cannot find symbol: method getName()` →** Lombok processor·import·IDE 설정을 확인한다. `compileOnly`와 `annotationProcessor`, 플러그인·annotation processing, Gradle 동기화를 점검한다. CLI 빌드만 성공하면 IDE 문제다.

## 6. 한 단계 더

`Environment`의 외부 설정은 파일 값을 덮어쓸 수 있고, 프로파일은 환경별 값을 적용한다. 자동 구성은 classpath와 조건에 맞는 빈을 제공한다. 진단 endpoint는 필요한 것만 연다. 설정 → S04, 자동 구성 → S03, Actuator → S16, 첫 API → P06, 빌드 → P08.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `application-local.yml`이 있는데 왜 적용되지 않나?

프로파일 파일은 이름만으로 선택되지 않고 활성 프로파일을 지정해야 한다. `--spring.profiles.active=local`이나 `SPRING_PROFILES_ACTIVE=local`을 실행 설정에 둔다. 시작 로그에서 실제 활성 프로파일을 확인한다.

**꼬리질문:** 로컬 IDE와 터미널의 결과가 다르면? **답:** Run Configuration, 셸 환경 변수, 전달 인자를 비교하고 각각의 시작 로그를 확인한다.

### Q2. 공통 설정과 비밀번호는 어디에 두나?

공통 동작은 `application.yml`, 로컬 차이는 `application-local.yml`, 환경마다 달라지는 민감한 값은 환경 변수나 비밀 관리 시스템에서 주입한다. 비밀이 Git 이력에 올라갔다면 파일에서 지우는 것만으로 유출을 되돌릴 수 없으므로 자격 증명을 교체한다.

**꼬리질문:** `application-prod.yml`에 `DB_PASSWORD: ${DB_PASSWORD}`를 둬도 되나? **답:** 실제 비밀번호를 쓰지 않고 환경 변수 참조만 두는 방식은 가능하다. 운영 환경에서 해당 변수 주입과 누락 시 실패 동작을 확인한다.

### Q3. `UnsatisfiedDependencyException`을 보면 무엇부터 할까?

그 예외는 의존성 생성 실패를 감싸는 경우가 많다. 가장 안쪽 `Caused by`와 실패한 생성자 인자 타입을 찾고, 빈 등록·component scan·profile·설정 바인딩을 검사한다. 예외 이름만으로 원인을 단정하지 않는다.

**꼬리질문:** `NoSuchBeanDefinitionException`은 언제 나오나? **답:** 요청된 타입을 만족하는 빈 후보가 없을 때다. 실제 구현체가 등록됐는지, 패키지 검색·조건·프로파일에서 빠졌는지 확인한다.

### Q4. SQL 로그를 운영에서도 TRACE로 켜면 왜 위험한가?

바인딩 파라미터에 사용자 입력·개인정보·토큰이 포함될 수 있다. 로그가 수집·보존되면 접근 권한이 넓어져 데이터 노출면이 커진다. 필요한 경우 로컬이나 제한된 재현 환경에서 짧게 켜고 끈다.

**꼬리질문:** SQL만 확인하려면? **답:** `org.hibernate.SQL`을 DEBUG로 설정하고, 값 확인이 꼭 필요할 때만 바인딩 logger를 추가한다.

### Q5. H2와 Docker Compose DB는 어떻게 고르나?

간단한 코드 실습·빠른 로컬 시작에는 H2 메모리 DB가 편하지만 프로세스 종료 시 데이터가 사라진다. 팀 재현성과 실제 DB 엔진 호환성이 필요하면 운영과 같은 엔진을 Compose로 띄운다. 선택한 DB의 JDBC URL과 드라이버가 프로파일에 함께 설정됐는지 확인한다.

**꼬리질문:** H2에서 통과한 쿼리가 PostgreSQL에서 실패할 수 있나? **답:** SQL 문법, 타입 변환, 대소문자·예약어, 제약 조건이 다를 수 있다. DB 종속 동작은 같은 엔진으로 확인한다.

### Q6. 404·405·415는 각각 무엇을 먼저 비교하나?

404는 URL에 대응하는 handler가 있는지, 405는 HTTP method가 맞는지, 415는 Content-Type/consumes가 맞는지 본다. `mappings` endpoint에서 실제 경로·method를 보고 HTTP 요청과 대조한다. 요청 본문 오류인 400 계열은 JSON 파싱과 필드 타입을 확인한다.

**꼬리질문:** 404와 서버 미기동은 어떻게 구분하나? **답:** 서버 미기동은 연결 자체가 실패한다. 404는 HTTP 상태와 응답 본문을 돌려받았으므로 서버까지 요청이 도착한 것이다.

## 8. 참고문헌

- Spring Boot Developer Tools — https://docs.spring.io/spring-boot/reference/using/devtools.html — 재시작.
- Spring Boot Logging — https://docs.spring.io/spring-boot/reference/features/logging.html — 기본 구현·레벨.
- Spring Boot Profiles — https://docs.spring.io/spring-boot/reference/features/profiles.html — 프로파일 활성화.
- Spring Boot Externalized Configuration — https://docs.spring.io/spring-boot/reference/features/external-config.html — 외부 설정.
- Spring Boot Development-time Services — https://docs.spring.io/spring-boot/reference/features/dev-services.html — Compose 연결.
- Spring Boot SQL Databases — https://docs.spring.io/spring-boot/reference/data/sql.html — DataSource·H2.
- Spring Boot Actuator Endpoints — https://docs.spring.io/spring-boot/reference/actuator/endpoints.html — 노출 설정.
- springdoc-openapi — https://springdoc.org/ — starter·Swagger UI.
- IntelliJ IDEA: Configure annotation processors — https://www.jetbrains.com/help/idea/annotation-processors-support.html — IDE processor 설정.
- Hibernate logging — https://docs.hibernate.org/stable/orm/logging/ — logger 카테고리.
