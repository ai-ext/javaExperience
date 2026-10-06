# P19. MySQL 연결과 JPA 설정 — 의존성부터 연결 에러까지

> `spring-boot-starter-data-jpa`와 `mysql-connector-j`만 올바르게 넣으면 Boot가 DataSource·Hikari·Hibernate를 자동 구성한다.
> 운영에서는 비밀번호를 환경변수로 분리하고, 스키마 변경을 `ddl-auto=update`에 맡기지 말고 마이그레이션 도구로 관리한다.
> 연결 실패는 JDBC URL, 컨테이너 포트, 계정/DB 존재 여부, 문자셋, 풀 고갈 순서로 좁히면 대부분 빠르게 해결된다.

## 1. 한 줄로 말하면

Spring Boot의 JPA 설정은 애플리케이션이 `DataSource`를 얻고, HikariCP가 커넥션을 빌려주며, Hibernate가 그 커넥션으로 엔티티와 테이블을 매핑하도록 연결하는 설정이다. `spring.datasource.url`이 있으면 Boot는 JDBC URL에서 드라이버를 추론하고, `spring.datasource.hikari.*`로 풀을 조정하며, `spring.jpa.*`로 Hibernate 동작을 정한다. 이 구성이 필요한 이유는 코드가 매 요청마다 직접 JDBC 연결을 만들지 않고, 트랜잭션과 커넥션 수명을 일관되게 관리하기 위해서다.

## 2. 당장 알아야 할 것

### 2.1 의존성은 두 개가 출발점이다

Boot 4.1 BOM이 관리하는 버전은 직접 쓰지 않는다. JPA starter는 Spring Data JPA·Hibernate·JDBC·Hikari를 끌어오고, MySQL 드라이버는 실행 시에만 필요하므로 `runtimeOnly`로 둔다.

`build.gradle.kts`

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.mysql:mysql-connector-j")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:mysql")
}

tasks.withType<Test> { useJUnitPlatform() }
```

### 2.2 로컬 MySQL을 Compose로 고정한다

`compose.yaml`

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: p19-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: app
      MYSQL_USER: app
      MYSQL_PASSWORD: apppass
      MYSQL_ROOT_PASSWORD: rootpass
    ports:
      - "3307:3306"
    volumes:
      - p19-mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -prootpass"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  p19-mysql-data:
```

호스트의 3307과 컨테이너 내부의 3306은 다른 값이다. Spring 앱을 호스트에서 실행하면 `localhost:3307`, 앱도 Compose 안에서 실행하면 서비스명 `mysql:3306`을 쓴다.

### 2.3 `application.yml`은 공통값, 프로파일 파일은 비밀과 서버를 나눈다

`src/main/resources/application.yml`

```yaml
spring:
  application:
    name: p19-api
  profiles:
    default: mysql
  jpa:
    open-in-view: false
    show-sql: false
    hibernate:
      ddl-auto: validate
      naming:
        physical-strategy: org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
    properties:
      hibernate:
        format_sql: true
        highlight_sql: true
        jdbc:
          time_zone: UTC
  datasource:
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000
      # MySQL wait_timeout보다 짧게. 운영 서버의 실제 값에 맞춰 조정한다.
      max-lifetime: 1700000
  sql:
    init:
      mode: never

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE
```

접속 정보는 `application-mysql.yml`로 분리한다.

`src/main/resources/application-mysql.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3307}/${DB_NAME:app}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=utf8&connectionCollation=utf8mb4_unicode_ci
    username: ${DB_USERNAME:app}
    password: ${DB_PASSWORD:apppass}
```

`useSSL=false`와 `allowPublicKeyRetrieval=true`는 TLS 없는 로컬 전용이다. `serverTimezone=UTC`는 시간대, `characterEncoding`과 `utf8mb4` collation은 문자셋을 고정한다.

H2를 쓰는 빠른 단위 개발 프로파일은 다음과 같이 분리한다.

`src/main/resources/application-h2.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:p19;MODE=MySQL;DB_CLOSE_DELAY=-1
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
```

### 2.4 `ddl-auto`는 환경별 정책이다

| 환경 | 권장값 | 이유 |
|---|---|---|
| 임시 H2 개발 | `create-drop` | 시작 시 만들고 종료 때 제거한다. 데이터 보존이 목적이 아니다. |
| 로컬 MySQL | `update` 또는 Flyway | 빠른 실습에는 `update`, 팀 개발 스키마에는 Flyway가 안전하다. |
| 운영 | `validate` 또는 `none` + Flyway | 애플리케이션이 운영 테이블을 임의 변경하지 않게 한다. |

### 2.5 SQL 로그는 목적별로 켠다

`show-sql=true` 대신 다음 로거로 SQL과 바인딩을 제어한다.

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE
```

### 2.6 네이밍, dialect, OSIV

물리 네이밍 전략은 `OrderItem.productId`를 `order_item.product_id`로 바꾼다. dialect는 JDBC 메타데이터로 자동 감지하므로 일반적인 앱은 수동 지정하지 않는다.

`open-in-view=false`를 기본값으로 하고 필요한 연관 데이터는 서비스 트랜잭션 안에서 준비한다.

## 3. 따라 하기

아래 Spring 예제는 문서용 전체 구성이다(미실행).

### 3.1 프로젝트와 DB를 시작한다

```bash
mkdir p19-api && cd p19-api
docker compose up -d
docker compose ps
docker compose exec mysql mysql -uapp -papppass -e 'SELECT DATABASE(), VERSION();'
```

확인 방법: `mysql`이 `healthy`이고 CLI가 DB와 버전을 출력해야 한다.

### 3.2 엔티티·Repository·확인 API를 만든다

`src/main/java/com/example/p19/P19Application.java`

```java
package com.example.p19;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class P19Application {
    public static void main(String[] args) {
        SpringApplication.run(P19Application.class, args);
    }
}
```

`src/main/java/com/example/p19/Customer.java`

```java
package com.example.p19;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String displayName;

    protected Customer() {}
    public Customer(String displayName) { this.displayName = displayName; }
    public Long getId() { return id; }
    public String getDisplayName() { return displayName; }
}
```

`src/main/java/com/example/p19/CustomerRepository.java`

```java
package com.example.p19;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {}
```

`ddl-auto=validate`이므로 최초 테이블은 SQL로 만든다.

`sql.init.mode=never`이므로 스키마는 아래 CLI로 만들거나 Flyway의 `src/main/resources/db/migration/V1__create_customer.sql`로 관리한다.

`src/main/java/com/example/p19/CustomerController.java`

```java
package com.example.p19;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public class CustomerController {
    private final CustomerRepository repository;
    public CustomerController(CustomerRepository repository) { this.repository = repository; }

    @PostMapping
    public Customer create(@RequestBody CreateCustomer request) {
        return repository.save(new Customer(request.displayName()));
    }

    @GetMapping
    public List<Customer> findAll() { return repository.findAll(); }

    public record CreateCustomer(String displayName) {}
}
```

테이블을 만들고 실행한다.

```bash
docker compose exec -T mysql mysql -uapp -papppass app <<'SQL'
CREATE TABLE customer (
  id BIGINT NOT NULL AUTO_INCREMENT,
  display_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);
SQL
./gradlew bootRun --args='--spring.profiles.active=mysql'
```

확인 방법: 로그에 `HikariPool-1 - Start completed`가 보이면 연결 성공이다.

```bash
curl -X POST localhost:8080/customers \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Kim"}'
curl localhost:8080/customers
docker compose exec mysql mysql -uapp -papppass app \
  -e 'SELECT id, display_name FROM customer;'
```

생성 JSON, 목록 JSON, 실제 MySQL 행을 확인한다.

### 3.3 Actuator로 애플리케이션 관점에서 확인한다

의존성에 `implementation("org.springframework.boot:spring-boot-starter-actuator")`를 추가하고 다음을 설정한다.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: never
```

```bash
curl -i localhost:8080/actuator/health
```

확인 방법: HTTP 200과 `{"status":"UP"}` 또는 `/actuator/health/db`의 DB 상태를 확인한다.

### 3.4 Testcontainers로 테스트한다

Docker가 실행 중이어야 한다. `src/test/java/com/example/p19/CustomerRepositoryTest.java`:

```java
package com.example.p19;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.mysql.MySQLContainer;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

@Testcontainers
@SpringBootTest
@Import(CustomerRepositoryTest.ContainerConfig.class)
class CustomerRepositoryTest {
    @TestConfiguration(proxyBeanMethods = false)
    static class ContainerConfig {
        @Bean
        @ServiceConnection
        MySQLContainer<?> mysql() {
            return new MySQLContainer<>("mysql:8.4");
        }
    }

    private final CustomerRepository repository;
    CustomerRepositoryTest(CustomerRepository repository) { this.repository = repository; }

    @Test
    void savesToRealMysql() {
        repository.save(new Customer("Test"));
        assertThat(repository.findAll()).extracting(Customer::getDisplayName)
                .contains("Test");
    }
}
```

확인 방법: `./gradlew test --tests '*CustomerRepositoryTest'` 통과와 MySQL 컨테이너 시작 로그를 확인한다. Spring context 수명과 맞추기 위해 bean 방식을 우선한다.

### 3.5 PostgreSQL로 바꿀 때

```kotlin
runtimeOnly("org.postgresql:postgresql")
// runtimeOnly("com.mysql:mysql-connector-j") 제거
```

URL·Compose 포트·테스트 모듈(`org.testcontainers:postgresql`, `PostgreSQLContainer`)을 바꾼다. MySQL 전용 URL 옵션과 `AUTO_INCREMENT`, `TINYINT(1)`, collation도 검토한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `spring.datasource.url` | JDBC 접속 주소 | `jdbc:mysql://localhost:3307/app?...` | 호스트 실행과 컨테이너 실행의 host/port가 다르다. |
| `runtimeOnly` | 실행 시 드라이버 | `com.mysql:mysql-connector-j` | 버전은 Boot BOM에 맡긴다. |
| `spring.datasource.hikari.maximum-pool-size` | 풀의 최대 물리 연결 | `10` | 크게 잡는다고 빨라지지 않고 DB 연결 한도를 먹는다. |
| `connection-timeout` | 커넥션 대기 상한 | `30000` ms | 풀 고갈을 숨기지 말고 메트릭과 함께 본다. |
| `max-lifetime` | 연결 최대 수명 | `1700000` ms | MySQL `wait_timeout`보다 짧게 둔다. |
| `ddl-auto` | Hibernate DDL 정책 | `validate` | 운영 `update` 금지, Flyway와 역할을 나눈다. |
| `open-in-view` | 웹 요청까지 영속성 컨텍스트 유지 | `false` | 지연 로딩을 서비스 계층에서 끝낸다. |
| `org.hibernate.SQL` | SQL 로깅 | `DEBUG` | 운영 상시 활성화 금지. |
| `org.hibernate.orm.jdbc.bind` | 바인딩 값 로깅 | `TRACE` | 개인정보·비밀번호가 노출될 수 있다. |
| `/actuator/health/db` | DB health 확인 | `curl localhost:8080/actuator/health/db` | details 노출·인증 정책을 둔다. |
| `@ServiceConnection` | 테스트 컨테이너 접속정보 자동 연결 | MySQL bean | Docker 데몬이 필요하다. |

## 5. 자주 나는 에러와 해결

1. `Public Key Retrieval is not allowed` → TLS 없는 인증에 공개키가 필요하다 → 로컬 URL에 `allowPublicKeyRetrieval=true`, 운영은 TLS.
2. `Communications link failure` → 서버 미기동·host/port 오류다 → `docker compose ps`, 로그, `mysqladmin ping`을 확인한다.
3. `Access denied for user 'app'@'...'` → 계정·비밀번호 또는 기존 volume의 초기화 값이 다르다 → MySQL 사용자와 환경변수를 맞춘다.
4. `Unknown database 'app'` → DB 이름이 없다 → `SHOW DATABASES`로 확인하고 URL·`DB_NAME`을 일치시킨다.
5. `Failed to configure a DataSource: 'url' attribute is not specified` → 드라이버·활성 프로파일·URL 중 하나가 없다 → runtime 드라이버와 `--spring.profiles.active=mysql`을 확인한다.
6. `Schema-validation: missing table [customer]` → `validate`는 생성하지 않는다 → migration을 적용한다.
7. `Incorrect string value: '\\xF0\\x9F...'` → 4바이트 UTF-8이 아니다 → DB·테이블·컬럼과 URL을 `utf8mb4`로 맞춘다.
8. `HikariPool-1 - Connection is not available, request timed out after 30000ms` → 느린 쿼리·긴 트랜잭션·누수·DB 장애다 → 사용 시간과 DB 한도를 확인한 뒤 풀 크기를 조정한다.

## 6. 한 단계 더

요청은 EntityManager→Hikari→JDBC→MySQL 순서로 흐른다. `maxLifetime`은 MySQL `wait_timeout`보다 짧게, 풀 크기는 DB 한도와 함께 정한다. `open-in-view=false`에서는 서비스 트랜잭션 안에서 조회를 끝낸다. JPA/N+1→S09, 풀 산정→S17, DB→D10, Compose→P14.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `driver-class-name`을 생략해도 되는 이유는?

Boot가 `jdbc:mysql` URL과 classpath의 Connector/J에서 드라이버를 추론하기 때문이다. URL도 없고 임베디드 DB도 없으면 DataSource 자동 구성이 실패한다.

꼬리질문: Boot BOM의 역할은? → 호환 버전을 관리해 개별 버전을 생략하게 한다.

### Q2. 운영에서 `ddl-auto=update`를 피하는 이유는?

시작 시 Hibernate가 DDL을 실행하므로 변경 검토·순서·롤백이 배포와 섞이고, 삭제나 타입 변경은 데이터 손실을 낳을 수 있다. Flyway migration과 운영 `validate`/`none`을 사용한다.

꼬리질문: `validate`는 생성하나? → 생성하지 않고 매핑과 스키마만 검사한다.

### Q3. `localhost:3306`과 `mysql:3306` 중 무엇을 쓰나?

호스트에서 앱을 실행하면 매핑 포트 `localhost:3307`, Compose 안의 앱이면 서비스 DNS `mysql:3306`이다. 컨테이너에서 `localhost`는 MySQL 컨테이너가 아니라 앱 컨테이너 자신이다.

꼬리질문: 3307은 왜 쓰나? → 호스트 3306 충돌을 피한 것이며 컨테이너 내부 포트는 3306이다.

### Q4. `allowPublicKeyRetrieval=true`를 운영에도 넣나?

TLS 없는 로컬 인증 오류의 임시 해결책이다. 운영은 TLS와 서버 인증서를 구성하고 `sslMode`를 정책에 맞게 설정한다. `useSSL=false`도 로컬 전용이다.

꼬리질문: Connector/J 기본값은? → `allowPublicKeyRetrieval=false`다.

### Q5. `show-sql=true`와 logger 설정의 차이는?

`show-sql`은 콘솔 출력용 단순 옵션이고, `org.hibernate.SQL`·`org.hibernate.orm.jdbc.bind`는 레벨과 appender로 제어한다. 후자는 파라미터에 민감정보가 들어갈 수 있어 진단 시에만 켠다.

꼬리질문: p6spy가 항상 우월한가? → 아니다. 추가 계층과 마스킹·성능을 검토한 뒤 선택한다.

### Q6. Hikari 타임아웃 때 풀만 키우면 안 되는 이유는?

느린 SQL·긴 트랜잭션·누수·DB 장애가 원인일 수 있다. `maximum-pool-size`를 먼저 키우면 DB 동시성·`max_connections`를 초과할 수 있으므로 사용 시간을 측정하고 DB 용량과 함께 결정한다.

꼬리질문: `maxLifetime`은 `wait_timeout`과 어떻게 두나? → 서버가 먼저 끊기기 전에 교체하도록 더 짧게 둔다.

## 8. 참고문헌

- SQL Databases :: Spring Boot — https://docs.spring.io/spring-boot/reference/data/sql.html — DataSource 근거.
- Data Access :: Spring Boot — https://docs.spring.io/spring-boot/how-to/data-access.html — 풀 바인딩 근거.
- MySQL Connector/J Configuration Properties — https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html — 속성 근거.
- HikariCP README — https://github.com/brettwooldridge/HikariCP — Hikari 근거.
- Testcontainers :: Spring Boot — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html — 테스트 근거.
- Health (health) :: Spring Boot — https://docs.spring.io/spring-boot/api/rest/actuator/health.html — health 근거.
