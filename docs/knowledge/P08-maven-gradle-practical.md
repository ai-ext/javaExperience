# P08. Maven·Gradle 실무 — 빌드 파일 읽고, 의존성 넣고, 에러 고치기

> 3줄 요약 — 빌드 도구는 의존성을 해결하고 소스 컴파일·테스트·패키징을 한 흐름으로 반복한다.  
> Spring Boot 4.1 프로젝트는 Gradle Kotlin DSL에서 Boot BOM을 적용하고, Maven에서는 `spring-boot-starter-parent`를 상속하면 관리되는 라이브러리의 버전을 보통 생략한다.  
> scope와 Wrapper를 확인하면 “로컬은 되는데 CI는 실패”와 `NoSuchMethodError`를 좁힐 수 있다.

## 1. 한 줄로 말하면

Maven과 Gradle은 의존성을 해결하고 Java를 컴파일·테스트한 뒤 실행 가능한 산출물을 만든다. 빌드 파일에는 플러그인, Java 버전, 의존성, 저장소, 작업 설정을 선언한다. Wrapper를 공유하면 개발 PC와 CI가 같은 빌드 도구를 쓴다.

## 2. 당장 알아야 할 것

1. **빌드 파일부터 읽는다.** Gradle Kotlin DSL은 `build.gradle.kts`, Maven은 `pom.xml`이다. Boot 4.1.1 플러그인은 Gradle 8.14+ 또는 9.x를 요구한다. 팀이 정한 Wrapper를 사용한다.

2. **플러그인은 빌드 기능을 더한다.** Gradle `java`는 컴파일·테스트 작업을, `org.springframework.boot`는 `bootRun`, `bootJar`를 제공한다. Maven의 `spring-boot-maven-plugin`은 `repackage`로 실행 가능한 아카이브를 만든다.

3. **의존성 좌표는 `group:artifact:version`이다.** 예: `org.springframework.boot:spring-boot-starter-webmvc:4.1.1`. Maven Central에서 좌표와 버전을 확인하고 Boot 관리 대상인지도 본다.

4. **scope는 어디서 라이브러리가 필요한지 표시한다.** Gradle의 `implementation`은 컴파일·실행에, `runtimeOnly`는 실행에만, `testImplementation`은 테스트 컴파일·실행에 필요한 라이브러리를 둔다. 아래는 자주 보는 대응 관계다.

   | Gradle | Maven 대응 | 주 용도 |
   |---|---|---|
   | `implementation` | `compile`(기본값) | 애플리케이션 코드와 실행에서 사용 |
   | `compileOnly` | `provided`와 비슷함 | 컴파일 때만 필요, 런타임·패키지에는 포함하지 않음 |
   | `runtimeOnly` | `runtime` | JDBC 드라이버 등 실행 때만 필요 |
   | `testImplementation` | `test` | 테스트 코드 컴파일·실행 |
   | `annotationProcessor` | Maven Compiler Plugin의 `annotationProcessorPaths` | Lombok 등 컴파일 시 코드 생성기 |

   이름이 같아도 규칙이 완전히 같지는 않다. Maven `provided`는 컨테이너가 런타임 라이브러리를 제공한다는 뜻도 있다. 어노테이션 프로세서는 전용 설정에 둔다.

5. **Boot BOM 대상은 버전을 생략한다.** Spring Framework, Jackson, JUnit 등의 개별 버전을 임의로 올리지 않는다. BOM 밖 라이브러리는 명시적 버전이나 팀의 버전 카탈로그로 관리한다.

6. **Gradle에는 BOM 적용을 명시한다.** Boot Gradle 플러그인만 선언했다고 의존성 버전 관리가 자동으로 켜지는 것은 아니다. `io.spring.dependency-management` 플러그인을 적용하거나 아래처럼 Gradle의 native platform으로 `spring-boot-dependencies` BOM을 가져온다.

   ```kotlin
   dependencies {
       implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
       implementation("org.springframework.boot:spring-boot-starter-webmvc")
   }
   ```

   여기서는 native platform을 사용한다. 두 방식을 불필요하게 섞지 않는다.

7. **저장소는 의존성을 내려받는 위치다.** Gradle은 `repositories { mavenCentral() }`로 선언한다. Maven Central은 Maven 기본 저장소다. 사내 미러 정책을 따르고 인증 정보는 커밋하지 않는다.

8. **명령은 Wrapper로 실행한다.** `./gradlew` 또는 `./mvnw`는 프로젝트가 고정한 버전을 사용한다. Wrapper 파일도 소스 관리에 포함한다.

## 3. 따라 하기

아래는 Java 25와 Spring Boot 4.1.1 기준의 전체 예제다. Gradle을 기본으로 하고 Maven 대응 설정도 제시한다. (예제 미실행)

### 3-1. 최소 API 프로젝트 만들기

Spring Initializr에서 Gradle-Kotlin 또는 Maven, Java 25, Spring Web MVC, Spring Boot Test를 고르면 Wrapper와 기본 구조를 얻는다. 직접 만들면 다음 구성을 사용한다.

```text
hello-api/
├── settings.gradle.kts
├── build.gradle.kts
└── src/
    ├── main/java/com/example/demo/DemoApplication.java
    └── main/java/com/example/demo/HelloController.java
```

`settings.gradle.kts` — 프로젝트 이름.

```kotlin
rootProject.name = "hello-api"
```

`build.gradle.kts` — 플러그인, Java toolchain, 저장소, 의존성, 테스트 엔진을 선언한다. BOM이 버전을 관리한다.

```kotlin
import org.gradle.api.tasks.testing.Test

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
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
```

`src/main/java/com/example/demo/DemoApplication.java` — 진입점.

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

`src/main/java/com/example/demo/HelloController.java` — 확인용 endpoint.

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

**확인 방법:** `./gradlew bootRun` 후 다른 터미널에서 `curl -i http://localhost:8080/hello`를 실행한다. `200`, 본문 `hello`, 로그의 `Started DemoApplication`을 확인한다. 포트가 사용 중이면 비운 뒤 재시도한다.

### 3-2. 같은 프로젝트를 Maven으로 구성하기

Maven을 선택한 프로젝트의 `pom.xml` 전체 예다. `spring-boot-starter-parent`가 dependency management와 플러그인 설정을 상속한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>hello-api</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

앞 단계의 두 Java 파일을 그대로 쓴다. **확인 방법:** `./mvnw spring-boot:run` 후 같은 `curl`을 호출한다. Wrapper가 없다면 Initializr 또는 팀 승인 절차로 만든다. Boot Maven 플러그인은 Maven 3.6.3 이상을 요구한다.

### 3-3. 의존성을 추가하고 결과 확인하기

요청 검증 기능이 필요하면 Boot Validation starter를 BOM 버전으로 추가한다.

Gradle의 `dependencies`에 추가한다.

```kotlin
implementation("org.springframework.boot:spring-boot-starter-validation")
```

Maven의 `<dependencies>`에 추가한다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

**확인 방법:** Gradle `dependencies --configuration runtimeClasspath` 또는 Maven `dependency:tree -Dincludes=org.springframework.boot:spring-boot-starter-validation`로 그래프를 확인한다. 함께 추가된 전이 의존성과 선택 버전도 살핀 뒤 `test`를 실행한다.

### 3-4. 사내 저장소를 추가할 때

Gradle의 `repositories` 예다. 사내 저장소 정책에 맞게 URL을 바꾼다.

```kotlin
repositories {
    maven {
        url = uri("https://repo.example.com/repository/maven-public")
        credentials {
            username = System.getenv("MAVEN_REPO_USER")
            password = System.getenv("MAVEN_REPO_PASSWORD")
        }
    }
}
```

Maven은 POM에 저장소 URL과 id를, `${user.home}/.m2/settings.xml`에 같은 id의 `<server>` 인증 정보를 둔다. **확인 방법:** 사내 네트워크에서 Wrapper로 의존성을 조회하고 로그·Git diff에 인증 값이 노출되지 않는지 확인한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| Wrapper | 프로젝트가 고정한 빌드 도구 실행 | `./gradlew test`, `./mvnw test` | 스크립트와 wrapper 설정 파일을 함께 커밋 |
| Gradle 전체 빌드 | 컴파일·테스트·패키징 | `./gradlew clean build` | `build`는 테스트 실패 시 실패 |
| Boot 실행 | 개발 중 앱 실행 | `./gradlew bootRun` / `./mvnw spring-boot:run` | 사용 포트와 프로파일 확인 |
| 테스트만 | 빠르게 테스트 실행 | `./gradlew test` / `./mvnw test` | 실패한 테스트부터 읽는다 |
| 의존성 목록 | 구성에 들어온 전체 그래프 확인 | `./gradlew dependencies --configuration runtimeClasspath` | `compileClasspath`와 런타임 구성을 혼동하지 않기 |
| 버전 역추적 | Gradle이 선택한 버전·요청 경로 확인 | `./gradlew dependencyInsight --dependency spring-core --configuration runtimeClasspath` | 모듈 이름과 configuration 지정 |
| Maven 의존성 트리 | 선택된 의존성과 전이 경로 확인 | `./mvnw dependency:tree -Dincludes=org.springframework:spring-core` | 필요하면 `-Dverbose`로 생략된 충돌 경로 확인 |
| 산출물 빌드 | 배포용 패키지 생성 | `./gradlew clean build` / `./mvnw clean package` | jar 실행·구조는 → P05 참조 |
| 의존성 새로고침 | 저장소 메타데이터 재확인 | `./gradlew --refresh-dependencies`; Maven `./mvnw -U ...` | 매번 붙이는 만능 옵션이 아님 |
| 테스트 임시 생략 | 원인 분리 목적의 로컬 확인 | Gradle `-x test`, Maven `-DskipTests` | CI나 정상 릴리스 빌드의 해결책으로 쓰지 않기 |

## 5. 자주 나는 에러와 해결

1. **`Could not resolve ...` / `Could not find ...` → 좌표·저장소·네트워크 문제다.** GAV 오타, 프록시, 인증, URL을 확인하고 Gradle `dependencies`나 Maven `dependency:tree`로 요청 경로를 찾는다. 캐시가 오래됐을 때만 `--refresh-dependencies` 또는 `-U`를 쓴다.

2. **`NoSuchMethodError` / `ClassNotFoundException` → 클래스패스 또는 버전이 맞지 않는다.** Gradle `dependencyInsight`나 Maven `dependency:tree`로 선택 버전과 요청 경로를 본다. Boot 라이브러리는 BOM으로 정렬하고, override는 이유를 기록해 테스트한다.

3. **`invalid source release: 25` 등 → 빌드 JDK와 toolchain/compiler target이 다르다.** `./gradlew --version` 또는 `./mvnw -version`으로 JDK를 확인한다. `java.toolchain`·`<java.version>`과 IDE의 Gradle JVM/Maven JDK를 맞춘다.

4. **테스트 실패로 `BUILD FAILED` → 테스트는 정상 빌드의 일부다.** 실패 이름과 첫 예외를 읽고 데이터·환경·코드 변경을 확인한다. `-x test`와 `-DskipTests`는 원인 분리용 임시 우회이며 테스트 성공을 뜻하지 않는다.

5. **버전을 고쳤는데도 같은 라이브러리를 못 받음 → 선언이나 저장소 문제일 수 있다.** 좌표, mirror, VPN, proxy를 확인한다. 원격에는 파일이 있고 로컬 metadata만 낡았을 때 `--refresh-dependencies` 또는 `-U`를 쓴다. `clean`은 Gradle 의존성 캐시를 비우지 않는다.

6. **IDE에 빨간 줄이 남음 → 프로젝트 모델이 낡았을 수 있다.** Gradle/Maven 프로젝트를 Reload한다. 터미널만 성공하면 Wrapper, Project SDK, 빌드 JVM, 오프라인 모드를 확인한다. JAR을 IDE에 수동 추가하지 않는다.

7. **`Plugin ... was not found` → 플러그인 저장소 설정을 확인한다.** 라이브러리 저장소 `mavenCentral()`과 플러그인 DSL의 저장소는 다를 수 있다. 사내 mirror라면 `settings.gradle.kts`의 `pluginManagement.repositories`, 좌표, 버전을 본다.

## 6. 한 단계 더

빌드 도구는 선언에서 작업 그래프를 만들고 전이 의존성을 해석한 뒤 컴파일·테스트·패키징한다. 충돌은 트리에서 누가 어떤 버전을 요청했는지 추적한다. `implementation`·`runtimeOnly`와 Maven scope는 classpath 범위를 정하고, BOM은 호환 버전을 관리한다. Wrapper는 도구 버전을 고정하며, 멀티모듈 관계도 그래프에 포함된다.

Gradle은 `settings.gradle.kts`에 `include("app", "domain")`, app 모듈에 `implementation(project(":domain"))`을 둔다. Maven은 루트 POM의 `<packaging>pom</packaging>`과 `<modules>`로 자식 모듈을 모은다. 공통 버전과 저장소는 루트에서 관리한다.

| 선택 | 잘 맞는 상황 | 살필 점 |
|---|---|---|
| Gradle | 기존 팀 표준이 Gradle이거나, Kotlin DSL·유연한 작업 구성이 필요한 프로젝트 | DSL과 플러그인 설정 학습, Wrapper 버전 정렬 |
| Maven | 기존 팀 표준이 Maven이거나, 관례적인 POM 구성을 선호하는 프로젝트 | XML이 길어질 수 있음, 플러그인 goal과 lifecycle 이해 |

기본 추천은 **팀의 표준을 따르는 것**이다. 새 프로젝트는 CI와 운영 경험으로 고른다. 성능은 실제 구성에서 측정한다. 이미지 생성은 → S19, jar 구조는 → P05 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. Spring Boot 의존성의 버전을 생략해도 되는 이유는?

Boot BOM이 호환되는 라이브러리 버전을 관리한다. Maven은 parent, Gradle은 플러그인 또는 `platform(...)`으로 적용한다. BOM 밖 라이브러리는 버전을 따로 정한다.

**꼬리질문:** BOM이 버전 충돌을 전부 없애 주나?  
**답:** 아니다. 관리 밖 라이브러리나 override는 충돌할 수 있다. dependencyInsight나 dependency tree로 실제 선택을 확인한다.

### Q2. `implementation`과 `runtimeOnly`의 차이를 설명해 보라.

`implementation`은 컴파일과 실행에, `runtimeOnly`는 실행에 필요하다. JDBC driver가 예이며 DB 연결 설정은 별도다.

**꼬리질문:** 코드에서 `runtimeOnly` 라이브러리의 클래스를 import하면?  
**답:** 컴파일 classpath에 없어 컴파일되지 않는다. 소스에서 참조하면 `implementation`으로 옮긴다.

### Q3. `NoSuchMethodError`가 나면 왜 빌드 파일의 버전부터 추적하나?

컴파일 때와 실행 때의 클래스 버전이 다르면 메서드를 찾지 못할 수 있다. 트리에서 버전을 요청한 직접·전이 의존성을 확인한다.

**꼬리질문:** Gradle에서 선택 경로를 보는 명령은?  
**답:** `./gradlew dependencyInsight --dependency 모듈 --configuration runtimeClasspath`를 쓴다.

### Q4. Wrapper를 쓰면 무엇이 재현 가능해지나?

Wrapper가 빌드 도구 버전을 고정해 개발자와 CI가 같은 도구를 쓴다. JDK와 저장소 환경은 별도로 맞춘다.

**꼬리질문:** 로컬에 Gradle을 설치했는데 `gradle build`를 써도 되나?  
**답:** 팀 빌드에는 `./gradlew build`를 쓴다. 전역 설치 버전은 Wrapper와 다를 수 있다.

### Q5. 테스트가 실패해 패키징되지 않을 때 `-x test`로 해결했다고 해도 되나?

테스트 task를 제외할 뿐 실패를 해결하지 않는다. 원인 분리용 로컬 우회로만 쓰고 정상 CI는 테스트를 통과시킨다.

**꼬리질문:** Gradle `clean`은 의존성 캐시도 지우나?  
**답:** 아니다. 산출물을 지운다. 의존성 갱신은 `--refresh-dependencies`다.

### Q6. Maven과 Gradle 중 무엇을 선택할까?

기존 팀 표준을 따른다. 새 프로젝트는 팀이 익숙한 DSL, 플러그인, CI 운영 경험으로 고른다.

**꼬리질문:** Gradle이 항상 Maven보다 빠른가?  
**답:** 아니다. 캐시와 플러그인, CI 조건에 따라 달라 같은 조건에서 측정한다.

## 8. 참고문헌

- Spring Boot Gradle Plugin — https://docs.spring.io/spring-boot/gradle-plugin/index.html — 플러그인이 제공하는 기능과 호환 Gradle 버전을 확인했다.
- Spring Boot Gradle Plugin: Getting Started — https://docs.spring.io/spring-boot/gradle-plugin/getting-started.html — 플러그인 적용 예와 dependency management 선택지를 확인했다.
- Spring Boot Gradle Plugin: Managing Dependencies — https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html — Boot BOM 적용 및 버전 생략 방식을 확인했다.
- Spring Boot Gradle Plugin: Running — https://docs.spring.io/spring-boot/gradle-plugin/running.html — Gradle에서 애플리케이션 실행하는 기능을 확인했다.
- Spring Boot Maven Plugin — https://docs.spring.io/spring-boot/maven-plugin/index.html — Maven 플러그인의 기능과 최소 Maven 버전을 확인했다.
- Spring Boot Maven Plugin: Using the Plugin — https://docs.spring.io/spring-boot/maven-plugin/using.html — parent의 의존성 관리와 repackage 설정을 확인했다.
- Gradle User Manual: Dependency Management — https://docs.gradle.org/current/userguide/dependency_management.html — Gradle이 의존성 해석 규칙과 강제 override의 주의점을 설명하는 내용을 읽었다.
- Gradle User Manual: Declaring Dependencies — https://docs.gradle.org/current/userguide/declaring_dependencies.html — `group:name:version`, 모듈·프로젝트 의존성 선언을 확인했다.
- Gradle User Manual: Dependency Configurations — https://docs.gradle.org/current/userguide/dependency_configurations.html — `implementation`, `compileOnly`, `runtimeOnly`, 테스트 구성을 확인했다.
- Gradle User Manual: Declaring Repositories — https://docs.gradle.org/current/userguide/declaring_repositories.html — Maven Central, 사설 저장소 선언과 저장소 설정을 확인했다.
- Gradle User Manual: Gradle Wrapper — https://docs.gradle.org/current/userguide/gradle_wrapper.html — Wrapper 사용과 빌드 도구 버전 고정 내용을 확인했다.
- Maven: Introduction to the Dependency Mechanism — https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html — 전이 의존성, nearest-definition 중재, scope와 BOM을 확인했다.
- Spring Boot Reference: Web — https://docs.spring.io/spring-boot/reference/web/index.html — Boot 4 웹 애플리케이션에서 `spring-boot-starter-webmvc`를 사용하는 점을 확인했다.
