# P01. Spring vs Spring Boot — 무엇이 다르고 프로젝트는 어떻게 시작하나

> 3줄 요약 — Spring Framework는 DI·웹·트랜잭션 같은 애플리케이션 기반 기능을 제공한다.
> Spring Boot는 그 Framework를 빠르게 조합하고 실행하도록 기본 설정, 스타터, 내장 서버, 외부 설정과 운영 기능을 얹는다.
> 새 서버 프로젝트는 start.spring.io에서 Boot 4.1.1·Java 25·Gradle Kotlin DSL·Spring Web을 고르고, `./gradlew bootRun`으로 시작한다.

## 1. 한 줄로 말하면

Spring Framework는 자바 애플리케이션의 객체 관리와 웹·데이터 접근 등을 위한 기반 프레임워크다. Spring Boot는 그 기반 위에 실행 가능한 기본 구성을 제공해 프로젝트를 빠르게 시작하고 운영하게 하는 도구다. Boot를 쓴다고 Framework를 쓰지 않는 것이 아니다. Boot 애플리케이션 안에서 Framework의 컨테이너와 MVC 등을 그대로 사용한다.

여기서 “Spring”은 Framework 하나를 가리키기도 하고, Spring Data·Spring Security·Spring Cloud 같은 프로젝트 가족 전체를 뜻하기도 한다. Boot는 이 생태계 모듈을 애플리케이션에 연결하고 버전 조합을 관리하는 진입점이다. Spring Cloud 같은 별도 프로젝트는 Boot 호환 릴리스 열차를 확인해야 한다.

## 2. 당장 알아야 할 것

> 아래 코드와 설정 예시는 Boot 4.1.1 / Framework 7 기준이며 이 환경에서 실행하지 않았다. (미실행)

1. **Framework와 Boot의 역할을 섞지 않는다.** Framework가 DI, 빈 생명주기, AOP, Spring MVC/WebFlux, 트랜잭션 같은 기능을 제공한다. Boot는 Framework 기능과 라이브러리를 기본값으로 묶고 앱을 바로 실행하는 쪽을 맡는다. Boot가 없으면 Framework를 못 쓰는 게 아니라 조립·설정 작업이 늘어난다.

2. **`@SpringBootApplication`은 편의 묶음이다.** 아래 한 애노테이션은 보통 애플리케이션 설정 등록, 현재 패키지부터의 컴포넌트 검색, Boot 자동 구성 활성화를 함께 한다.

   ```java
   @SpringBootApplication
   public class DemoApplication {
       public static void main(String[] args) {
           SpringApplication.run(DemoApplication.class, args);
       }
   }
   ```

   메인 클래스는 컨트롤러·서비스가 위치한 패키지의 최상위에 둔다. `com.example.demo` 아래의 하위 패키지는 검색되지만, 형제 패키지인 `com.example.controller`는 기본 검색 범위 밖이다.

3. **스타터는 묶음 의존성이다.** 웹 API를 위해 Boot 4.1에서는 `spring-boot-starter-webmvc`를 고른다. Spring MVC와 내장 서블릿 서버를 시작하는 데 필요한 의존성을 한 번에 가져오며, 각각의 버전은 Boot가 관리한다. Boot 3 자료의 `spring-boot-starter-web`을 그대로 복사하지 말고 해당 Boot 버전 Initializr가 제안하는 항목을 확인한다.

   ```kotlin
   dependencies {
       implementation("org.springframework.boot:spring-boot-starter-webmvc")
   }
   ```

4. **자동 구성은 명시 설정을 대체하는 마법이 아니다.** 클래스패스와 설정 등을 보고 필요한 기본 빈 구성을 시도한다. 직접 빈을 등록하거나 속성을 바꿔 기본값을 조정할 수 있다. 빈이 왜 생겼는지 추적하는 내부 조건 분석은 → S03 참조.

5. **내장 서버 덕분에 앱을 바로 실행한다.** `spring-boot-starter-webmvc`가 있는 기본 웹 앱은 별도 Tomcat 설치와 WAR 배포 절차 없이 실행 가능한 애플리케이션으로 기동할 수 있다. Boot 문서는 내장 Tomcat·Jetty 등의 선택도 다룬다. 운영체제 서비스 등록, 컨테이너 배포는 별도 운영 결정이다.

6. **설정은 코드 밖으로 뺀다.** `src/main/resources/application.yml`에 개발 기본값을 두고 환경변수나 명령행 인수로 환경별 차이를 덮어쓴다. 예를 들어 `--server.port=9090`은 설정 파일 값보다 우선한다. 비밀번호·토큰을 저장소에 커밋하지 말고 배포 환경의 비밀 설정으로 주입한다.

   ```yaml
   spring:
     application:
       name: demo
   server:
     port: ${SERVER_PORT:8080}
   ```

7. **Actuator는 운영 기능용 의존성을 추가해야 한다.** 헬스·메트릭 같은 기능은 `spring-boot-starter-actuator`를 추가해 사용한다. 의존성 추가와 어떤 엔드포인트를 외부에 공개할지는 별개로 검토한다. 상세 내용은 → S16 참조.

8. **생태계 모듈은 각자 목적이 다르다.** Spring Data는 저장소 접근 추상화, Spring Security는 인증·인가, Spring Cloud는 분산 시스템 통합 기능을 제공하는 별도 프로젝트다. Boot 스타터를 통해 연결할 수 있지만, 모듈의 API·설정 방법까지 Boot가 대신하는 것은 아니다.

9. **기준 버전과 실행 JDK를 맞춘다.** 이 문서의 기준은 Java 25와 Spring Boot 4.1.1이다. Boot 4.1.1 공식 요구사항은 Java 17 이상 26 이하, Spring Framework 7.0.9 이상이며 Java 25는 그 범위 안이다. 문서의 Java 27 선택은 Boot 4.1.1 요구 범위를 넘으므로 이 프로젝트에 선택하지 않는다. Gradle은 8.14 이상 8.x 또는 9.x, Maven은 3.6.3 이상을 쓴다.

10. **Boot 없이 Spring MVC만 쓰면 서버 연결을 직접 마련한다.** 서블릿 컨테이너에 `DispatcherServlet`과 애플리케이션 컨텍스트를 연결해야 한다. Framework 기능은 같지만 서버·설정·버전 조합을 직접 책임진다.

## 3. 따라 하기

> 아래 프로젝트 예시와 실행 명령은 이 환경에서 생성·실행하지 않았다. (미실행)

### 단계 1 — Initializr에서 뼈대 만들기

브라우저에서 [start.spring.io](https://start.spring.io)를 연다. 다음 항목으로 생성한다.

| 항목 | 선택 | 이유 |
|---|---|---|
| Project | Gradle - Kotlin | 의존성과 태스크를 Kotlin DSL로 선언한다. 팀이 Maven을 표준으로 쓰면 Maven을 고른다. |
| Language | Java | 예제 코드와 런타임 언어다. |
| Spring Boot | 4.1.1 | 이 문서의 기준 안정 버전이다. `SNAPSHOT`이나 `M` 표시는 개발/마일스톤 빌드이므로 선택하지 않는다. |
| Group / Artifact | `com.example` / `demo` | 그룹 식별자와 프로젝트 이름이다. 회사·서비스 규칙에 맞게 바꾼다. |
| Packaging | Jar | 독립 실행을 시작하기에 간단하다. 기존 외부 서블릿 컨테이너에 배포할 요구가 있을 때만 War를 검토한다. |
| Configuration | YAML | 설정을 `application.yml`에 기록한다. Properties도 기능상 선택 가능하다. |
| Java | 25 | Boot 4.1.1에서 지원되는 LTS JDK다. 빌드 머신에도 JDK 25가 설치되어야 한다. |
| Dependencies | Spring Web | Boot 4.1 웹 문서의 MVC 스타터다. 생성기 검색에서 `Spring Web`을 추가한다. |

`GENERATE`를 눌러 압축을 풀고 프로젝트 디렉터리로 이동한다. `gradlew`는 지정된 Gradle 버전을 실행하는 Wrapper라 시스템 Gradle 설치가 필수는 아니다. Maven을 고르면 같은 코드에 `mvnw`를 쓴다. 빌드 도구 비교는 → P08 참조.

**확인 방법:** 압축을 푼 루트에서 `ls`(Windows는 `dir`)를 실행해 `build.gradle.kts`, `gradlew`, `src`가 보이는지 확인한다. 생성기에서 버전을 다시 볼 때 `4.1.1`인지 확인한다.

### 단계 2 — 생성된 폴더의 역할 확인

```text
demo/
├── build.gradle.kts                 # 플러그인, 저장소, 의존성, 테스트 설정
├── settings.gradle.kts              # Gradle 프로젝트 이름과 하위 프로젝트 설정
├── gradlew                          # macOS/Linux용 Gradle Wrapper
├── gradlew.bat                      # Windows용 Gradle Wrapper
├── gradle/wrapper/                  # Wrapper가 사용할 Gradle 버전 설정
└── src/
    ├── main/
    │   ├── java/com/example/demo/
    │   │   └── DemoApplication.java # main 메서드와 Boot 진입점
    │   └── resources/
    │       └── application.yml      # 환경별 설정의 기본 파일
    └── test/
        └── java/com/example/demo/
            └── DemoApplicationTests.java # 애플리케이션 컨텍스트 테스트
```

생성 옵션에 따라 파일이 더 있을 수 있다. `src/main/java`는 애플리케이션 코드, `resources`는 설정·리소스, `src/test`는 테스트 코드다. `build/`는 빌드 후 생성된다.

**확인 방법:** `DemoApplication.java`의 `package`가 `com.example.demo`이고, 같은 패키지 또는 하위 패키지에 컨트롤러를 둘 위치가 있는지 확인한다. YAML을 선택했다면 설정 파일이 `src/main/resources/application.yml`인지 본다.

### 단계 3 — 생성된 진입점과 빌드 설정 확인

생성된 메인 클래스는 다음 형태다. 패키지 줄은 Initializr의 Package name에 따라 달라진다.

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

`@SpringBootApplication`은 `@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@ComponentScan` 역할을 결합한다. 메인 메서드는 컨텍스트를 시작하고 애플리케이션 실행을 유지한다. 애노테이션의 내부 구성 원리는 → S03, 빈 검색·DI 원리는 → S01 참조.

Initializr가 만든 `build.gradle.kts`를 기본으로 사용한다. 아래는 Boot 플러그인과 Boot BOM을 이용하는 완전한 최소 Kotlin DSL 예시다. BOM이 웹·테스트 라이브러리 버전을 관리하므로 각 의존성에 버전을 중복 기입하지 않는다.

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

repositories { mavenCentral() }

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> { useJUnitPlatform() }
```

**확인 방법:** Boot 플러그인과 BOM 버전이 4.1.1, Java toolchain이 25, 웹 의존성이 `spring-boot-starter-webmvc`인지 본다.

### 단계 4 — API 하나 추가하기

`src/main/java/com/example/demo/HelloController.java`를 만든다. 메인 클래스와 같은 패키지라 컴포넌트 검색 범위에 포함된다.

```java
package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "hello";
    }
}
```

**확인 방법:** 컴파일 단계에서 `org.springframework.web.bind.annotation`을 찾을 수 없다고 하면 Spring Web 선택 여부와 Gradle 동기화를 확인한다. 엔드포인트 동작은 다음 단계에서 확인한다.

### 단계 5 — 개발 모드로 기동하고 요청 보내기

macOS/Linux:

```bash
./gradlew bootRun
```

Windows:

```bat
gradlew.bat bootRun
```

IDE에서는 Gradle 동기화를 마친 뒤 `DemoApplication.main()`을 실행해도 된다. 서버가 기동되면 별도 터미널에서 요청한다.

```bash
curl -i http://localhost:8080/hello
```

기대 응답의 핵심은 `HTTP/1.1 200`과 본문 `hello`다. 응답이 없으면 서버 시작 로그에서 포트와 예외를 먼저 확인한다. 설정의 `SERVER_PORT` 환경변수가 있으면 이 예제에서는 해당 값이 8080을 대체한다.

**확인 방법:** `curl`에서 200 및 `hello`가 오는지, 실행 로그에 서버가 시작되었다는 메시지가 있는지 확인한다. 포트를 바꾸려면 `SERVER_PORT=9090 ./gradlew bootRun`으로 실행한 뒤 `http://localhost:9090/hello`를 호출한다.

### 단계 6 — 테스트·실행 JAR 만들기

```bash
./gradlew test
./gradlew bootJar
java -jar build/libs/demo-0.0.1-SNAPSHOT.jar
```

다른 터미널에서 다시 `curl http://localhost:8080/hello`를 보낸다. `bootRun`은 개발 편의 태스크, `bootJar`는 실행할 패키지를 만드는 태스크다. 실행 JAR의 내부 구조와 WAR 배포 차이는 → P05 참조.

Maven 대응 명령은 `./mvnw test`, `./mvnw spring-boot:run`, `./mvnw package`, `java -jar target/demo-0.0.1-SNAPSHOT.jar`다. 생성된 Maven 파일의 parent/BOM이 Boot 버전 관리를 담당한다.

**확인 방법:** 테스트가 `BUILD SUCCESSFUL`로 끝나고, `bootJar` 뒤 `build/libs`에 실행 JAR이 생기는지 본다. `java -jar` 실행 후 같은 URL에서 200과 `hello`를 받으면 개발 실행과 패키지 실행을 모두 확인한 것이다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| start.spring.io | 새 프로젝트 뼈대 생성 | Java 25 + Boot 4.1.1 + Gradle Kotlin | 팀의 JDK·빌드 표준과 버전을 맞춘다. |
| Spring Web | Spring MVC HTTP API | `spring-boot-starter-webmvc` | WebFlux 앱이면 `spring-boot-starter-webflux`를 검토한다. 둘은 실행 모델이 다르다. |
| `@SpringBootApplication` | 앱 설정·검색·자동 구성 진입 | 메인 클래스에 선언 | 메인 클래스를 루트 패키지에 둔다. |
| `application.yml` | 기본 외부 설정 | `server.port: 8080` | 시크릿은 저장소에 넣지 않는다. |
| 프로파일/환경변수 | 환경별 설정 차이 적용 | `SERVER_PORT=9090` | 프로파일을 활성화하는 방식과 우선순위는 → S04 참조. |
| `bootRun` | 개발 중 앱 실행 | `./gradlew bootRun` | 개발 머신의 JDK 및 포트 점유를 확인한다. |
| `bootJar` | 실행 가능한 Jar 생성 | `./gradlew bootJar` | 일반 `jar` 결과와 실행 Jar의 차이는 → P05 참조. |
| Actuator 스타터 | 헬스·메트릭 등 운영 기능 추가 | `spring-boot-starter-actuator` | 의존성을 넣는 것과 엔드포인트 공개 범위는 별도다. → S16 |
| Maven Wrapper | Maven 프로젝트 빌드 | `./mvnw spring-boot:run` | 명령은 생성된 wrapper 파일이 있는 프로젝트 루트에서 실행한다. |

## 5. 자주 나는 에러와 해결

1. **`UnsupportedClassVersionError` 또는 “class file has wrong version” →** 빌드·실행 JDK가 컴파일 대상보다 낮다. **해결:** `java -version`과 IDE의 Project SDK, Gradle JVM을 모두 확인하고 Java 25로 맞춘다. 터미널의 JDK만 바꿨는데 IDE Gradle JVM이 이전 버전인 경우도 확인한다.

2. **`./gradlew: Permission denied` →** Wrapper 스크립트에 실행 권한이 없다(특히 저장소를 압축 파일로 옮긴 경우). **해결:** macOS/Linux에서 `chmod +x gradlew` 후 다시 실행한다. Windows는 `gradlew.bat`을 쓴다.

3. **`Web server failed to start. Port 8080 was already in use` →** 다른 앱이 같은 포트를 사용한다. **해결:** 기존 프로세스를 종료하거나 `SERVER_PORT=9090 ./gradlew bootRun`처럼 포트를 바꾼다. 설정 파일과 환경변수 중 무엇이 적용되는지 확인한다.

4. **`/hello`가 404이고 컨트롤러가 등록되지 않는다 →** 메인 클래스의 검색 기준 패키지 밖에 컨트롤러를 뒀거나 `@RestController`·`@GetMapping`이 빠졌다. **해결:** 컨트롤러를 메인 클래스와 같은 패키지 또는 하위 패키지로 이동하고 URL 경로가 `/hello`인지 확인한다.

5. **`package org.springframework.web.bind.annotation does not exist` →** Spring MVC 웹 의존성이 빠졌거나 Gradle 동기화가 실패했다. **해결:** Boot 4.1 프로젝트에 `spring-boot-starter-webmvc`가 있는지 확인하고 Wrapper로 다시 동기화한다. 오프라인 모드·프록시·Maven Central 접근 실패도 점검한다.

6. **`NoSuchMethodError` 등 라이브러리 버전 충돌 →** Spring Framework 또는 Jackson 같은 Boot 관리 라이브러리 버전을 개별적으로 덮어써 서로 맞지 않는 조합을 만들었을 가능성이 크다. **해결:** 우선 직접 버전 선언을 제거하고 Boot 의존성 관리를 사용한다. 꼭 올려야 한다면 Boot 4.1.1 호환 버전인지 확인한다.

## 6. 한 단계 더

- Boot는 Framework 컨텍스트를 시작하고 메인 클래스 기준으로 설정·빈 검색을 시작한다.
- 스타터는 라이브러리 묶음, Boot 의존성 관리는 버전 조합을 제공한다.
- 자동 구성은 클래스패스와 설정을 보고 기본 빈을 구성하며 직접 등록한 설정으로 조정할 수 있다.
- 웹 스타터는 MVC와 서버 실행 구성요소를 넣어 `main`으로 앱을 띄운다.
- 외부 설정은 코드 변경 없이 환경별 값을 공급하며 입력원 우선순위를 따른다.
- Boot 플러그인은 실행·패키징 태스크, Actuator 스타터는 운영 기능을 보탠다.
- 심화: 자동 구성 → S03, 설정 → S04, DI → S01, 패키징 → P05, 빌드 → P08, Actuator → S16.

## 7. 자가점검 Q&A (면접 대비)

### Q1. Spring Framework와 Spring Boot는 어떤 관계인가?

Framework는 컨테이너·DI·웹·트랜잭션 같은 기반 기능을 제공한다. Boot는 이를 대체하지 않고 기본 설정과 의존성 조합, 실행 방식을 제공한다. Boot 프로젝트의 Controller도 Spring Framework의 MVC 기능을 사용한다.

**꼬리질문: Boot를 쓰면 Spring을 몰라도 되는가?**
아니다. 빈 등록·요청 처리·트랜잭션 등의 실제 동작은 Framework 기능이다. Boot 기본값을 이해해야 커스터마이징과 오류 분석도 가능하다.

### Q2. 스타터를 쓰는 이유는 무엇인가?

기능 하나에 필요한 라이브러리 묶음을 빠뜨리지 않고 선택하고, 서로 맞는 버전으로 관리하기 위해서다. 웹 앱은 Boot 4.1 기준 `spring-boot-starter-webmvc`를 사용한다. 스타터는 기능 API 그 자체라기보다 의존성 조합을 단순화한다.

**꼬리질문: 스타터가 모든 설정을 고정하는가?**
아니다. 시작 기본값을 제공할 뿐 애플리케이션 설정과 명시적으로 등록한 빈으로 조정할 수 있다.

### Q3. `@SpringBootApplication`은 왜 메인 클래스에 두는가?

보통 설정 등록, 자동 구성 활성화, 컴포넌트 검색의 시작점이기 때문이다. 검색 범위는 기본적으로 메인 클래스 패키지와 하위 패키지다. 루트 패키지가 잘못되면 컨트롤러나 서비스가 검색되지 않을 수 있다.

**꼬리질문: 컨트롤러를 반드시 같은 패키지에 둬야 하는가?**
아니다. 하위 패키지면 기본 검색된다. 형제 패키지라면 패키지 구조를 바꾸거나 검색 범위를 명시해야 한다.

### Q4. Boot 앱은 왜 Tomcat 설치 없이 실행되는가?

웹 스타터가 내장 서블릿 컨테이너 의존성을 포함하고 Boot가 애플리케이션 시작 과정에서 서버를 함께 기동하기 때문이다. 앱 프로세스가 서버 프로세스 역할을 한다. 외부 컨테이너 배포가 필요하면 다른 패키징 방식을 선택할 수도 있다.

**꼬리질문: Boot는 Tomcat만 지원하는가?**
아니다. 공식 문서는 내장 Jetty 등도 다룬다. 실제 선택은 추가 의존성과 설정에 따른다.

### Q5. `application.yml`과 환경변수가 동시에 값을 지정하면 무엇이 이기는가?

Boot는 여러 PropertySource에 우선순위를 둔다. 환경변수는 보통 설정 파일을 덮어쓰고, 명령행 인수는 환경변수보다 우선한다. 예를 들어 `--server.port=9090`으로 실행하면 YAML의 8080보다 명령행 값이 적용된다.

**꼬리질문: 데이터베이스 비밀번호도 YAML에 넣어 커밋해도 되는가?**
안 된다. 로컬 예제의 더미 값과 달리 실제 시크릿은 환경의 비밀 관리 기능 등을 통해 외부 주입한다.

### Q6. Spring Data·Security·Cloud도 Spring Boot의 일부인가?

Spring Boot와 함께 사용하는 Spring 프로젝트들이지만 각각 별도의 프로젝트다. Data는 데이터 접근, Security는 인증·인가, Cloud는 분산 시스템 통합 같은 영역을 담당한다. Boot 스타터와 자동 구성이 통합을 쉽게 하지만 각 프로젝트의 개념까지 감추지는 않는다.

**꼬리질문: Spring Cloud 버전은 Boot 버전과 숫자를 같게 고르면 되는가?**
아니다. Spring Cloud 공식 호환성 안내에서 Boot와 맞는 릴리스 열차를 확인해야 한다. 이 자료는 Cloud 조합의 구체 버전을 다루지 않는다.

## 8. 참고문헌

- Spring Initializr — https://start.spring.io — Gradle Kotlin DSL·Java·Boot·패키징·설정 형식·Java 버전과 의존성을 선택하는 프로젝트 생성기.
- Spring Boot — https://docs.spring.io/spring-boot/index.html — Boot의 목표와 독립 실행·운영 기능 소개, 안정 버전 목록.
- System Requirements — https://docs.spring.io/spring-boot/system-requirements.html — Boot 4.1.1의 Java·Gradle·Maven 요구사항.
- Developing Your First Spring Boot Application — https://docs.spring.io/spring-boot/tutorial/first-application/index.html — 첫 애플리케이션의 사전 조건과 시작 절차.
- Spring Framework Overview — https://docs.spring.io/spring-framework/reference/overview.html — Framework의 모듈과 Spring 프로젝트 가족의 의미.
- Using the `@SpringBootApplication` Annotation — https://docs.spring.io/spring-boot/reference/using/using-the-springbootapplication-annotation.html — 애노테이션이 결합하는 세 가지 기능.
- Web — https://docs.spring.io/spring-boot/reference/web/index.html — MVC·리액티브 웹 스타터와 내장 HTTP 서버 선택 안내.
- Enabling Production-ready Features — https://docs.spring.io/spring-boot/reference/actuator/enabling.html — Actuator 스타터 추가 방법.
- Externalized Configuration — https://docs.spring.io/spring-boot/reference/features/external-config.html — 설정 입력원과 PropertySource 우선순위.
