# 0-6. Gradle 의존성과 application.yml 읽기

## 상황

0-1에서 "DB가 꺼져 있으면 DB를 안 쓰는 코드인데도 앱이 안 뜬다"를 봤다. 왜 그럴까. 답은 두 파일에 있다. **`build.gradle`**은 "이 앱이 어떤 라이브러리를 쓰나"를 적은 파일이고, **`application.yml`**은 "그 라이브러리를 어떻게 설정하나"를 적은 파일이다.

이 단계에서는 두 파일을 한 줄씩 읽는다. 그다음 `application.yml`에 내 설정 값을 넣고, 그 값을 코드로 읽어 돌려주는 API를 만든다. 의존성 한 줄, 설정 한 글자를 일부러 틀려서 어떤 에러가 나는지도 본다.

**시작 전 실제 파일을 먼저 확인한다.** 아래 `build.gradle`과 `application.yml` 전문은 이 단계를 설명하는 **완성 예시**다. 저장소의 현재 연습용 파일에는 H2 의존성이 더 있거나, MySQL 포트·`ddl-auto` 값이 다르거나, `spring.application.name`이 빠져 있을 수 있다. 예시를 통째로 덮어쓰지 말고 `spring.application.name`, `spring.datasource.url`, `spring.jpa.hibernate.ddl-auto`를 실제 파일과 비교한다. 이 단계의 응답에 필요한 `spring.application.name: javaExperience`가 없다면 추가한다. MySQL로 실행한다면 URL 포트가 `compose.yaml`의 공개 포트와 일치해야 한다. 기존 학습 데이터를 지우는 DB 재설정은 이 실습의 일부가 아니다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "서버 설정 확인 화면",
  "summary": "서버가 application.yml에서 읽은 값을 돌려준다. 코드를 바꾸지 않고 설정만 바꿔 다시 띄우면 응답이 바뀐다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "서버 설정", "right": "김자바" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "load", "label": "설정 보기", "variant": "primary" }] },
    { "type": "text", "id": "greeting", "value": "반가워요, 백엔드!", "emphasis": "title" },
    { "type": "stats", "id": "values", "items": [{ "id": "app-name", "label": "앱 이름", "value": "javaExperience" }, { "id": "max-items", "label": "최대 개수", "value": "5" }] },
    { "type": "code", "id": "yml", "label": "application.yml", "value": "start:\n  greeting: 반가워요, 백엔드!\n  max-items: 5" }
  ],
  "flows": [
    {
      "name": "설정 값 보기",
      "steps": [
        { "kind": "user", "text": "[설정 보기]를 누른다", "focus": ["load"] },
        { "kind": "request", "method": "GET", "path": "/api/start/config" },
        { "kind": "server", "text": "앱이 뜰 때 Spring이 ConfigController를 만들면서, 생성자 매개변수의 @Value(\"${start.greeting}\") 등을 application.yml 값으로 채워 넣었다" },
        { "kind": "server", "text": "요청이 오면 필드에 들고 있던 값을 ConfigView record로 돌려준다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\n  \"appName\": \"javaExperience\",\n  \"greeting\": \"반가워요, 백엔드!\",\n  \"maxItems\": 5\n}" },
        { "kind": "screen", "text": "인사말과 값들이 보인다 — yml의 start.max-items가 JSON에서는 maxItems(숫자)가 됐다", "focus": ["greeting", "values", "yml"] }
      ]
    },
    {
      "name": "설정만 바꿔 다시 띄우기",
      "steps": [
        { "kind": "user", "text": "(application.yml의 greeting을 '오늘도 화이팅'으로 바꾸고 앱을 다시 띄운 뒤) [설정 보기]", "focus": ["yml", "load"] },
        { "kind": "request", "method": "GET", "path": "/api/start/config" },
        { "kind": "server", "text": "자바 코드는 그대로다. 설정 값은 앱이 뜰 때 한 번 읽히므로, 다시 띄워야 새 값이 들어간다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\n  \"appName\": \"javaExperience\",\n  \"greeting\": \"오늘도 화이팅\",\n  \"maxItems\": 5\n}" },
        { "kind": "screen", "text": "인사말이 바뀌었다", "focus": ["greeting"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 설정 | `application.yml` 맨 아래에 `start.greeting`=`반가워요, 백엔드!`, `start.max-items`=`5` |
| 앱 이름 선행 확인 | `spring.application.name`이 `javaExperience`인지 확인하고, 없으면 추가한다 |
| 메서드·경로 | `GET /api/start/config` |
| 응답 | 상태 `200`, `{ "appName": "javaExperience", "greeting": "반가워요, 백엔드!", "maxItems": 5 }` |
| 읽는 법 | `@Value("${설정 키}")`로 읽는다. `appName`은 이미 있는 `spring.application.name` |

## 따라 치기

### build.gradle 한 줄씩

이 단계에서 읽을 `build.gradle`의 기준 예시다. 실제 파일에는 다른 연습용 의존성이 있을 수 있다. **지금은 고치지 말고 읽기만 한다.**

```groovy
plugins {
    id 'java'
    // bootRun / bootJar 태스크 제공 + 실행 가능한 fat jar 패키징
    id 'org.springframework.boot' version '4.1.1'
    // Boot BOM을 적용해서 아래 의존성들의 버전을 생략할 수 있게 해줌
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'org.example'
version = '1.0-SNAPSHOT'

java {
    toolchain {
        // 컴파일·실행 JDK를 고정 (Boot 4는 Java 17 이상 필요, 로컬에 설치된 21 사용)
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring MVC + 내장 Tomcat + Jackson (Boot 4부터 starter-web → starter-webmvc로 이름 변경)
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    // JPA(Hibernate) + HikariCP 커넥션 풀
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    // @Valid, @NotBlank 같은 요청 값 검증
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    // MySQL JDBC 드라이버 — 컴파일엔 필요 없고 실행할 때만 필요
    runtimeOnly 'com.mysql:mysql-connector-j'

    // 테스트: JUnit·AssertJ·Mockito·MockMvc 묶음 (버전은 Boot BOM이 관리하므로 junit-bom 따로 두지 않음)
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    // @DataJpaTest(리포지토리만 띄우는 테스트)
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    // 테스트용 일회용 MySQL 컨테이너 — application-test.yml의 jdbc:tc: URL이 쓴다
    testImplementation 'org.testcontainers:testcontainers-mysql'
    // Gradle이 JUnit Platform 테스트를 실행할 때 필요한 런처
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
    // 테스트는 application-test.yml(Testcontainers MySQL)을 쓰게 한다
    systemProperty 'spring.profiles.active', 'test'
}
```

| 줄 | 무엇 | 뜻 |
|---|---|---|
| 1~7 | `plugins { ... }` | Gradle에 기능을 더한다. `java`는 컴파일, `org.springframework.boot`는 `bootRun`(앱 실행)·`bootJar`(실행 파일 만들기)를 준다. `io.spring.dependency-management`는 아래 의존성의 **버전을 Boot가 정해 주게** 한다 |
| 9~10 | `group`, `version` | 이 프로젝트의 이름표 |
| 12~17 | `java { toolchain { ... 21 } }` | Java 21로 컴파일·실행한다. PC에 JDK 21이 있어야 한다(이 레포 설정으로는 Gradle이 대신 받아 오지 않는다) |
| 19~21 | `repositories { mavenCentral() }` | 라이브러리를 받아 오는 곳 |
| 25 | `implementation '...spring-boot-starter-webmvc'` | **웹 서버 묶음**. Spring MVC(`@RestController`·`@GetMapping`) + 내장 Tomcat(8080 포트 서버) + Jackson(JSON). 0장 코드는 전부 이것 위에서 돈다 |
| 27 | `implementation '...spring-boot-starter-data-jpa'` | **DB 묶음**. JPA·Hibernate(객체 ↔ 테이블) + HikariCP(DB 연결 풀) + JDBC. **이 줄이 있으면 Spring이 앱을 띄울 때 DB 연결을 준비한다.** 그래서 DB가 꺼져 있으면 앱이 안 뜬다 |
| 29 | `implementation '...spring-boot-starter-validation'` | `@NotBlank`·`@Valid` 같은 입력 검증(1-5) |
| 31 | `runtimeOnly 'com.mysql:mysql-connector-j'` | MySQL 드라이버. 코드에서 직접 부르지 않고 **실행할 때만** 필요해서 `runtimeOnly` |
| 34~40 | `testImplementation`, `testRuntimeOnly` | 테스트할 때만 쓴다. 앱 실행 파일에는 안 들어간다 |
| 43~ | `tasks.named('test') { ... }` | `./gradlew test`의 설정 |

- **`implementation` vs `runtimeOnly` vs `testImplementation`**: 코드에서 `import`해서 쓰면 `implementation`, 실행할 때만 있으면 되면 `runtimeOnly`, 테스트 코드에서만 쓰면 `testImplementation`이다.
- **버전이 안 적혀 있는 이유**: Boot 플러그인(4.1.1)이 "이 Boot 버전과 맞는 라이브러리 버전 목록(BOM)"을 갖고 있어서 대신 정한다. 라이브러리끼리 버전이 안 맞아 터지는 일을 막는다.
- **`build.gradle`을 고친 뒤**: IntelliJ 오른쪽 위에 뜨는 코끼리 아이콘(Load Gradle Changes)을 눌러야 IntelliJ가 새 라이브러리를 안다. 터미널의 `./gradlew`는 매번 다시 읽는다.
- **`./gradlew`**: 레포에 들어 있는 Gradle 실행기다. PC에 Gradle을 따로 설치하지 않아도 정해진 버전이 돈다.

### application.yml 한 줄씩

`src/main/resources/application.yml`에서 기존 `spring.application.name`을 먼저 확인하고, 없으면 추가한다. 그 뒤 맨 아래에 `start:` 묶음을 **새로 더한다**. 다음 전문은 이 장의 완성 예시이며, 나머지 설정이 실제 파일과 다르면 자신의 DB 실행 환경에 맞는 값을 유지한다.

```yaml
spring:
  application:
    name: javaExperience
  datasource:
    # javaExperience MySQL(localhost:13308)의 community DB(시나리오용). javaExperience DB 컨테이너가 떠 있어야 한다
    url: jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  jpa:
    hibernate:
      # 테이블은 docker/mysql/init/ 의 dump가 만든다. 엔티티가 테이블과 다르면 기동이 실패한다(테이블을 몰래 바꾸지 않음)
      ddl-auto: validate
    # 트랜잭션이 끝나면 커넥션을 바로 반납한다(컨트롤러·직렬화 단계까지 붙잡지 않음)
    open-in-view: false
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    # 실행되는 SQL과 바인딩 값 — 쿼리가 몇 번 나가는지(N+1) 볼 때 쓴다
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace

# 0-6 — 내가 정한 설정 값. 코드에서 @Value("${start.greeting}")로 읽는다
start:
  greeting: 반가워요, 백엔드!
  max-items: 5
```

| 줄 | 키(점으로 이은 이름) | 뜻 |
|---|---|---|
| 1~3 | `spring.application.name` | 앱 이름. 로그의 `[javaExperience]` 칸에 찍힌다 |
| 4~8 | `spring.datasource.url`·`username`·`password` | 어느 DB에 어떤 계정으로 붙나. `localhost:13308`은 javaExperience compose가 띄우는 MySQL이다 |
| 9~12 | `spring.jpa.hibernate.ddl-auto: validate` | 앱이 뜰 때 Java 엔티티와 DB 테이블 모양이 맞는지 **검사만** 한다(엔티티를 처음 만드는 1-2부터 의미가 있다) |
| 14 | `spring.jpa.open-in-view: false` | DB 연결을 요청 끝까지 붙잡지 않는다(1-2부터 DB를 쓰고, 지연 로딩과 엮이는 일은 1-4에서 본다) |
| 19~23 | `logging.level.*` | 패키지별 로그 수준. `debug`·`trace`는 더 자세히 찍는다(0-2에서 `org.springframework.web: debug`를 잠깐 넣었다) |
| 26~28 | `start.greeting`, `start.max-items` | **내가 정한 키.** `spring.`으로 시작하는 키는 Spring이 읽고, 그 밖의 키는 내 코드가 `@Value`로 읽는다 |

- **들여쓰기가 곧 구조다.** 스페이스 2칸씩 안으로 들어가면 "그 아래"다. `spring:` 아래 `datasource:` 아래 `url:` → 키 이름은 `spring.datasource.url`. **탭은 쓸 수 없고**, 칸 수가 하나만 틀려도 앱이 안 뜬다(아래 [망가뜨리기](#일부러-망가뜨리기) ⑥).
- `#` 뒤는 주석이다. 값 `반가워요, 백엔드!`처럼 쉼표·느낌표가 있어도 따옴표 없이 문자열이 된다.
- 키는 계층(점)으로 묶이고, 앱이 **뜰 때 한 번** 읽힌다. 값을 바꾸면 다시 띄운다.

### 설정을 읽는 컨트롤러

`src/main/java/org/example/start/ConfigController.java`

```java
package org.example.start;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigController {

    public record ConfigView(String appName, String greeting, int maxItems) {
    }

    private final String appName;
    private final String greeting;
    private final int maxItems;

    public ConfigController(@Value("${spring.application.name}") String appName,
                            @Value("${start.greeting}") String greeting,
                            @Value("${start.max-items}") int maxItems) {
        this.appName = appName;
        this.greeting = greeting;
        this.maxItems = maxItems;
    }

    @GetMapping("/api/start/config")
    public ConfigView config() {
        return new ConfigView(appName, greeting, maxItems);
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 10 | `public record ConfigView(...)` | 응답 DTO(0-4) |
| 13~15 | `private final String appName;` | 필드. `final`이라 생성자에서 한 번만 넣는다 |
| 17~19 | `public ConfigController(@Value("${spring.application.name}") String appName, ...)` | **생성자에서 설정 값을 받는다.** Spring이 이 컨트롤러 객체를 만들 때 생성자를 부르면서, `@Value("${키}")`가 붙은 매개변수에 yml 값을 넣어 준다. `max-items`의 `5`는 `int`로 바꿔 넣는다 |
| 20~22 | `this.appName = appName;` | 받은 값을 필드에 담아 둔다(0-1의 생성자와 같다) |
| 26~27 | `config()` | 담아 둔 값을 돌려준다 |

- **왜 생성자로 받나**: 필드에 바로 `@Value`를 붙여도 동작한다. 하지만 생성자로 받으면 "이 객체는 이 값들이 있어야 만들어진다"가 코드에 드러나고, `final`로 못 바꾸게 할 수 있다. 1-3에서 서비스를 받을 때도 같은 방법(생성자 주입)을 쓴다.
- **실행할 때 값 덮어쓰기**: `./gradlew bootRun --args='--start.greeting=안녕'`처럼 넘기면 yml 값보다 우선한다(IntelliJ는 Run 설정의 Program arguments).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 앱이 뜰 때 Spring이 ConfigController를 만들면서, 생성자 매개변수의 @Value("${start.greeting}") 등을 application.yml 값으로 채워 넣었다
- 요청이 오면 필드에 들고 있던 값을 ConfigView record로 돌려준다
- 자바 코드는 그대로다. 설정 값은 앱이 뜰 때 한 번 읽히므로, 다시 띄워야 새 값이 들어간다

<details>
<summary>Controller — HTTP 연결</summary>

`ConfigController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/start/config")`. 변경된 메서드: `config`.

</details>

<details>
<summary>설정·보조 코드</summary>

`application.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "설정 값 보기", "method": "GET", "path": "/api/start/config" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.appName", "equals": "javaExperience" },
          { "path": "$.greeting", "equals": "반가워요, 백엔드!" },
          { "path": "$.maxItems", "equals": 5 }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, `appName`=`javaExperience`, `greeting`=`반가워요, 백엔드!`, `maxItems`=`5`(숫자) |
| R1 | 설정 위치 | 값이 코드에 박혀 있지 않고 `application.yml`의 `start.*`에서 온다(`@Value`) |
| R2 | 주입 | 설정 값을 생성자 매개변수로 받아 `final` 필드에 담는다 |

## 일부러 망가뜨리기

메시지는 Boot 4.1.1에서 재현한 원문이다. 하나씩 해 보고 되돌린다. `build.gradle`을 바꿨다면 Load Gradle Changes도 다시 누른다.

### ① 웹 의존성을 뺀다 → 컴파일 에러 57개

25번 줄 `implementation '...spring-boot-starter-webmvc'`를 지우고 `./gradlew compileJava`.

```text
.../src/main/java/org/example/config/CorsConfig.java:4: error: package org.springframework.web.servlet.config.annotation does not exist
import org.springframework.web.servlet.config.annotation.CorsRegistry;
                                                        ^
...
.../src/main/java/org/example/start/GreetingController.java:3: error: package org.springframework.web.bind.annotation does not exist
...
57 errors
```

- `package ... does not exist`는 "그 라이브러리가 아예 없다"는 뜻이다. 내 코드의 오타가 아니다. 이 에러가 import 줄마다 수십 개 나오면 **의존성(build.gradle)을 의심**한다. 맨 첫 에러 하나만 봐도 충분하다.
- 같은 에러가 IntelliJ 편집기에서만 나고 `./gradlew compileJava`는 통과하면, build.gradle을 고친 뒤 Load Gradle Changes를 안 누른 것이다.

### ② JPA 의존성을 뺀다 → DB 없이도 뜬다

27번 줄 `implementation '...spring-boot-starter-data-jpa'`를 지우고, DB를 끈 채로 띄운다.

```text
INFO ... org.example.Main : Started Main in 0.803 seconds (process running for 1.024)
```

`/api/start/config`도 잘 답한다. **DB 연결을 준비하는 것은 이 한 줄**이었다. 0-1에서 "DB를 안 쓰는데 DB가 필요한" 이유다. 1-2부터는 DB에 저장하니 되돌린다.

### ③ MySQL 드라이버를 뺀다 → `Caused by` 여섯 겹

31번 줄 `runtimeOnly 'com.mysql:mysql-connector-j'`를 지우고 띄운다. 컴파일은 된다(`runtimeOnly`였으니까). 앱이 뜨다가 실패한다. `Caused by:` 줄만 모으면:

```text
Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'dataSourceScriptDatabaseInitializer' defined in class path resource [org/springframework/boot/jdbc/autoconfigure/DataSourceInitializationAutoConfiguration.class]: Unsatisfied dependency expressed through method 'dataSourceScriptDatabaseInitializer' parameter 0: Error creating bean with name 'dataSource' ...
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'dataSource' defined in class path resource [org/springframework/boot/jdbc/autoconfigure/DataSourceConfiguration$Hikari.class]: Failed to instantiate [com.zaxxer.hikari.HikariDataSource]: Factory method 'dataSource' threw exception with message: Failed to load driver class com.mysql.cj.jdbc.Driver
Caused by: org.springframework.beans.BeanInstantiationException: Failed to instantiate [com.zaxxer.hikari.HikariDataSource]: Factory method 'dataSource' threw exception with message: Failed to load driver class com.mysql.cj.jdbc.Driver
Caused by: java.lang.RuntimeException: Failed to load driver class com.mysql.cj.jdbc.Driver
Caused by: java.lang.RuntimeException: Failed to load class com.mysql.cj.jdbc.Driver
Caused by: java.lang.ClassNotFoundException: com.mysql.cj.jdbc.Driver
```

0-5의 규칙대로 **맨 아래**를 본다. `ClassNotFoundException: com.mysql.cj.jdbc.Driver` — 실행할 때 MySQL 드라이버 클래스가 없다. 위의 다섯 줄은 "그래서 dataSource를 못 만들었고, 그래서 ..."라고 바깥으로 전해진 것이다.

### ④ DB를 띄우지 않는다 → `Unable to determine Dialect`

`docker compose stop mysql`(또는 처음부터 안 띄움) 상태에서 앱을 띄운다. 0-1에서 본 그것이다. 로그에 예외 묶음이 **두 개** 있다.

```text
WARN ... org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 0, SQLState: 08S01
WARN ... org.hibernate.orm.jdbc.error : Communications link failure
...
Caused by: java.net.ConnectException: Connection refused
...
ERROR ... o.s.boot.SpringApplication : Application run failed
...
Caused by: org.hibernate.HibernateException: Unable to determine Dialect without JDBC metadata (please set 'jakarta.persistence.jdbc.url' for common cases or 'hibernate.dialect' when a custom Dialect implementation must be provided)
```

마지막 `Caused by`(Dialect를 정할 수 없다)는 "DB에 물어보지 못해서"의 결과다. 진짜 이유는 그 **위쪽 `WARN` 묶음**의 `Connection refused`(DB 포트에 아무도 없다)다. 맨 아래 `Caused by`가 알쏭달쏭하면 `ERROR` 줄 바로 위의 `WARN`도 본다.

- 고치기: javaExperience 레포 루트에서 `docker compose up -d`로 DB를 띄운다. `docker compose ps mysql`이 `healthy`인지 확인하고 앱을 띄운다.
- (참고) DB 없이 잠깐 띄우기 — 실행 인자에 아래를 주면 DB 자동 설정을 끄고 뜬다(실측). JPA 저장소(`Repository`)를 만드는 1-2부터는 쓸 수 없다.

  ```text
  --spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration
  ```

  Boot 4에서 이 클래스들의 패키지가 바뀌었다. 인터넷 글에 많은 Boot 3 이름(`org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration`, `org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration`)을 넣으면 **에러 없이 무시되고** 위와 같은 DB 에러가 그대로 난다(실측).

### ⑤ 설정 키 오타 → 앱이 안 뜬다

`ConfigController`의 `@Value("${start.greeting}")`를 `@Value("${start.greating}")`로 바꾼다. 0-5의 [기동 실패](0-5-read-stack-trace.md#일부러-망가뜨리기) 예시가 바로 이것이다.

```text
Caused by: org.springframework.util.PlaceholderResolutionException: Could not resolve placeholder 'start.greating' in value "${start.greating}"
```

yml에서 키를 지워도 같다. 없어도 되는 값이면 `@Value("${start.greeting:기본 인사}")`처럼 `:` 뒤에 기본값을 둔다.

### ⑥ 들여쓰기 한 칸 → 로그 맨 위에서 바로 실패

28번 줄 `  max-items: 5`를 `   max-items: 5`(스페이스 3칸)로 바꾼다. Spring 배너도 찍히기 전에 실패한다.

```text
22:00:14.041 [main] ERROR org.springframework.boot.SpringApplication -- Application run failed
mapping values are not allowed here
 in 'reader', line 28, column 13:
       max-items: 5
                ^
```

- 파일 이름은 안 나오고 `line 28, column 13`만 나온다. yml을 막 고쳤다면 `application.yml`의 그 줄을 본다.

### ⑦ 같은 최상위 키를 두 번 → 앱이 안 뜬다

파일 맨 아래에 `logging:`을 새로 하나 더 쓴다(이미 19번 줄에 있다).

```text
22:17:44.502 [main] ERROR org.springframework.boot.SpringApplication -- Application run failed
while constructing a mapping
 in 'reader', line 1, column 1:
    spring:
    ^
found duplicate key logging
 in 'reader', line 30, column 1:
    logging:
    ^
```

있는 묶음 안에 줄을 더한다.

### ⑧ 숫자 자리에 글자 → 앱이 안 뜬다

`max-items: 다섯`으로 바꾼다. `int` 매개변수에 넣지 못한다.

```text
Caused by: org.springframework.beans.TypeMismatchException: Failed to convert value of type 'java.lang.String' to required type 'int'; For input string: "다섯"
Caused by: java.lang.NumberFormatException: For input string: "다섯"
```

### ⑨ 앱을 두 번 띄운다 → 포트 사용 중

이미 떠 있는데 한 번 더 실행하면(IntelliJ에서 ▶를 두 번, 또는 터미널 `bootRun`이 남아 있을 때) 이렇게 나온다. 실측은 포트 8169로 했다. 8080이면 숫자만 다르다.

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Web server failed to start. Port 8169 was already in use.

Action:

Identify and stop the process that's listening on port 8169 or configure this application to listen on another port.
```

- 고치기: 먼저 떠 있는 것을 끈다. 누가 쓰는지 모르면 `lsof -i :8080`(맥)으로 PID를 보고 끈다. 포트를 바꾸려면 yml에 `server.port: 8081`을 넣거나 실행 인자로 `--server.port=8081`을 준다. 브라우저나 curl에서 쓰는 서버 주소도 새 포트로 바꾼다.
- 이렇게 Spring이 원인을 알아본 기동 실패는 `Description`·`Action` 상자로 나온다. 상자가 있으면 스택트레이스보다 상자를 먼저 읽는다.

## 필요한 지식

- [P08 Maven·Gradle 실전](../../docs/knowledge/P08-maven-gradle-practical.md) — 의존성 범위(`implementation`·`runtimeOnly`), 래퍼
- [S04 설정과 프로파일](../../docs/knowledge/S04-config-profiles.md) — yml 키, `@Value`, 실행 인자로 덮어쓰기
- [S03 Boot 자동 설정](../../docs/knowledge/S03-boot-autoconfig.md) — 의존성이 있으면 왜 DB 연결을 준비하나
- [P14 Docker Compose로 로컬 환경](../../docs/knowledge/P14-docker-compose-local.md) — `docker compose up -d`, 포트
- [R08 앱에서 DB로 연결](../../docs/knowledge/R08-app-to-db-connection.md) — JDBC URL·드라이버·커넥션 풀

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — yml에 넣을 네 줄</summary>

맨 아래(왼쪽 끝에서 시작)에 `start:`를 쓰고, 그 아래 스페이스 두 칸 들여서 `greeting: 반가워요, 백엔드!`와 `max-items: 5`.
</details>

<details>
<summary>힌트 2 — 값이 안 바뀐다</summary>

yml을 고친 뒤 앱을 다시 띄웠는지 본다. 설정은 앱이 뜰 때 한 번만 읽힌다.
</details>

## 다음 단계

[0-7. Lombok DTO](0-7-lombok-dto.md)에서 같은 요청·응답을 다른 DTO 작성법으로 바꿔 본다. 그다음 1장에서 게시판 API를 키운다.
