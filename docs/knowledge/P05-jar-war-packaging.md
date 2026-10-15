# P05. jar·war란 무엇인가 — 빌드 결과물과 실행

> 3줄 요약 — JAR/WAR는 클래스와 리소스를 ZIP 기반으로 묶는 배포 파일이다.
> 일반 JAR은 클래스패스에 올려 실행하고, Spring Boot 실행 JAR은 `BOOT-INF`의 앱·의존성과 `JarLauncher`를 함께 담아 `java -jar`로 실행한다.
> 신규 Boot 서비스의 기본 결과물은 실행 JAR(`bootJar`); 외부 서블릿 컨테이너에 올려야 할 때만 초기화 코드와 `providedRuntime`을 갖춘 WAR를 만든다.

## 1. 한 줄로 말하면

JAR(Java Archive)은 `.class`, 설정·정적 파일 같은 리소스와 `META-INF/MANIFEST.MF` 메타데이터를 하나로 묶은 ZIP 형식의 아카이브다. WAR(Web Application Archive)는 웹 애플리케이션의 클래스와 라이브러리를 `WEB-INF` 규약에 넣은 JAR 계열 배포 형식이다.

둘 다 그 자체로 운영체제 실행 파일은 아니다. JVM이 아카이브 안에서 시작 클래스와 필요한 클래스를 찾도록 실행 방식까지 맞춰야 한다.

일반 JAR은 라이브러리 의존성을 함께 담는다고 보장하지 않는다. Spring Boot 실행 JAR은 앱 클래스와 런타임 의존성을 싣고 `JarLauncher`가 클래스패스를 구성하므로 `java -jar app.jar`로 실행된다. 산출물은 외부 톰캣 사용 여부로 고른다.

## 2. 당장 알아야 할 것

1. **JAR은 ZIP 기반 아카이브다.** `jar tf app.jar`나 `unzip -l app.jar`로 내부를 본다. 보통 클래스·리소스와 `META-INF/MANIFEST.MF`가 있으며, 라이브러리 JAR은 실행 진입점이나 앱 의존성을 포함하지 않을 수 있다.

2. **클래스패스(classpath)는 클래스·리소스를 찾을 디렉터리/JAR 목록이다.** `com.example.App`은 각 루트의 `com/example/App.class`에서 조회된다.

   ```bash
   java -cp 'build/classes/java/main:lib/*' com.example.App
   ```

   macOS/Linux 구분자는 `:`, Windows는 `;`다. 라이브러리 JAR 안의 또 다른 JAR은 일반 `-cp`로 자동 탐색되지 않는다.

3. **일반 실행 JAR에는 시작점이 필요하다.** `java -jar app.jar`는 manifest의 `Main-Class`를 실행한다. 이때 `-cp`는 무시되므로 의존성도 아카이브에 담거나 별도 실행 방식으로 제공한다.

4. **Boot 실행 JAR은 로더가 시작점이다.** `Main-Class`는 `JarLauncher`, 실제 앱은 `Start-Class`다. 앱은 `BOOT-INF/classes/`, 의존성은 `BOOT-INF/lib/*.jar`에 두며, 로더가 중첩 JAR을 클래스패스에 올린다.

5. **JVM 옵션과 애플리케이션 인자는 위치가 다르다.** `-D...`, `-Xmx...`는 `-jar` 앞에, `--server.port=8081`은 JAR 경로 뒤에 둔다.

   ```bash
   java -Xms256m -Xmx1g -Dspring.profiles.active=prod \
     -jar build/libs/service-0.0.1-SNAPSHOT.jar --server.port=8081
   ```

6. **Gradle `jar`와 `bootJar`는 다르다.** `jar`는 plain 결과물, `bootJar`는 의존성과 로더를 담은 실행 JAR이다. 기본 classifier는 plain 파일명에 `plain`을 붙이며 `build`는 `bootJar`도 만든다.

7. **라이브러리는 저장소에서 좌표로 받는다.** `org.springframework.boot:spring-boot-starter-web:4.1.1`처럼 그룹·아티팩트·버전을 지정하면 Gradle/Maven이 전이 의존성을 해결한다. 직접 `lib/`에 복사하면 버전 재현성이 흔들린다.

8. **WAR는 외부 서블릿 컨테이너가 필요할 때 선택한다.** `SpringBootServletInitializer`와 `configure`를 구현하고, 내장 컨테이너는 Gradle `providedRuntime` 또는 Maven `provided`로 분리한다. 실행 WAR는 `java -jar`도 가능하다.

9. **확장자만으로 실행 여부를 판단하지 않는다.** `unzip -p app.jar META-INF/MANIFEST.MF`에서 `Main-Class`와 `Start-Class`를 확인한다.

## 3. 따라 하기

Boot 4.1.1·Java 25 기준 예제다. 같은 소스를 Corretto 21.0.6에서 실행 검증했다(Java 25 전용 문법 없음).

### 1단계 — 순수 Java 클래스를 실행 JAR로 묶기

단일 파일을 `_scratch/P05/JarClasspathDemo.java`에 둔다.

```java
package demo;

public class JarClasspathDemo {
    public static void main(String[] args) {
        var resource = JarClasspathDemo.class.getResource("JarClasspathDemo.class");
        System.out.println("resource-protocol=" + resource.getProtocol());
        System.out.println("argument=" + args[0]);
    }
}
```

컴파일하고 `Main-Class`를 지정해 아카이브를 만든다. 실제 작업에서는 출력 파일도 지정 경로 아래 둔다.

```bash
mkdir -p _scratch/P05/plain-classes
javac -d _scratch/P05/plain-classes _scratch/P05/JarClasspathDemo.java
jar --create \
  --file _scratch/P05/jar-classpath-demo.jar \
  --main-class demo.JarClasspathDemo \
  -C _scratch/P05/plain-classes .
java -jar _scratch/P05/jar-classpath-demo.jar hello
unzip -l _scratch/P05/jar-classpath-demo.jar
```

확인 방법 — `jar:`는 클래스가 아카이브에서 로드됐고 인자가 `main`에 전달됐음을 보여준다.

```text
resource-protocol=jar
argument=hello
```

`unzip -l`에는 `META-INF/MANIFEST.MF`와 `demo/JarClasspathDemo.class`가 나타난다. 이 작은 JAR은 외부 의존성이 없으므로 바로 실행된다. 외부 라이브러리를 추가했다면 plain JAR 하나에 그 라이브러리가 자동으로 들어가는 것은 아니다.

### 2단계 — Spring Boot 실행 JAR 만들고 실행하기

Gradle 프로젝트의 최소 파일은 다음과 같다. 팀 프로젝트에 Gradle Wrapper가 있으면 전역 `gradle` 대신 `./gradlew`를 사용한다.

`settings.gradle.kts`

```kotlin
rootProject.name = "p05-packaging-demo"
```

`build.gradle.kts`

```kotlin
plugins {
    java
    war
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
    providedRuntime(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    providedRuntime("org.springframework.boot:spring-boot-starter-tomcat-runtime")
}
```

JAR만 필요하면 `war`와 `providedRuntime` 선언은 생략한다. 이 예제는 같은 앱으로 실행 WAR도 만든다.

`src/main/java/com/example/demo/DemoApplication.java`

```java
package com.example.demo;

import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class DemoApplication extends SpringBootServletInitializer {
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(DemoApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/hello")
    Map<String, String> hello() {
        return Map.of("message", "packaged-ok");
    }
}
```

빌드한다. `clean`은 이전 결과물을 지워 이번 산출물을 확실히 보게 해준다.

```bash
./gradlew clean bootJar jar
ls -lh build/libs
```

확인 방법 — 실제 Boot 4.1.1 프로젝트에서는 `BUILD SUCCESSFUL`이 나왔고 두 파일이 생성됐다.

```text
build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.jar        # bootJar 실행 JAR
build/libs/p05-packaging-demo-0.0.1-SNAPSHOT-plain.jar  # jar plain JAR
```

이제 구조와 manifest를 확인한다.

```bash
unzip -l build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.jar \
  | grep -E 'META-INF/MANIFEST|BOOT-INF/(classes|lib)/' | head -20
unzip -p build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.jar META-INF/MANIFEST.MF
```

실제 목록 중 핵심은 다음과 같다. `BOOT-INF/lib`에는 각각 별개의 의존성 JAR이 중첩돼 있다.

```text
META-INF/MANIFEST.MF
BOOT-INF/classes/com/example/demo/DemoApplication.class
BOOT-INF/classes/com/example/demo/HelloController.class
BOOT-INF/lib/spring-boot-webmvc-4.1.1.jar
BOOT-INF/lib/spring-webmvc-7.0.9.jar
BOOT-INF/lib/tomcat-embed-core-11.0.24.jar
```

manifest의 핵심 줄은 다음과 같다. Boot가 만든 JAR의 `Main-Class`는 로더이고 `Start-Class`가 우리 앱의 시작 클래스다.

```text
Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.example.demo.DemoApplication
Spring-Boot-Version: 4.1.1
```

JVM 옵션은 JAR 앞, Spring 옵션은 뒤에 둬서 실행한다.

```bash
java -Dspring.profiles.active=prod \
  -jar build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.jar \
  --server.port=18085
curl -i http://localhost:18085/hello
```

확인 방법 — 실제 로그에 `The following 1 profile is active: "prod"`, `Tomcat started on port 18085`가 찍혔고, curl 본문은 다음과 같았다.

```json
{"message":"packaged-ok"}
```

`java -D... -jar ...`에서 `-D`를 JAR 경로 뒤로 옮기면 JVM 시스템 속성이 설정되지 않는다. 반대로 `--server.port`는 Spring 애플리케이션 인자이므로 JAR 뒤에 둔다.

### 3단계 — 실행 가능한 WAR와 plain WAR 비교

같은 예제에서 실행 WAR와 plain WAR를 빌드한다.

```bash
./gradlew bootWar war
ls -lh build/libs
unzip -l build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.war \
  | grep -E 'WEB-INF/(classes|lib|lib-provided)/' | head -20
unzip -p build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.war META-INF/MANIFEST.MF
```

확인 방법 — 실제 `bootWar`에는 `WEB-INF/classes`와 앱 의존성 `WEB-INF/lib`, 별도 디렉터리 `WEB-INF/lib-provided`가 있었다. manifest의 시작점은 `org.springframework.boot.loader.launch.WarLauncher`였다. plain 파일명은 `-plain.war`이며 웹 컨테이너용 일반 WAR다. Boot 실행 로더가 없어 `java -jar` 대상은 아니다.

```text
WEB-INF/classes/com/example/demo/DemoApplication.class
WEB-INF/lib/spring-webmvc-7.0.9.jar
WEB-INF/lib-provided/tomcat-embed-core-11.0.24.jar
Main-Class: org.springframework.boot.loader.launch.WarLauncher
Start-Class: com.example.demo.DemoApplication
```

실행 WAR를 내장 서버로 직접 띄우는 것도 확인한다.

```bash
java -jar build/libs/p05-packaging-demo-0.0.1-SNAPSHOT.war --server.port=18086
curl -i http://localhost:18086/hello
```

실제 응답은 `{"message":"packaged-ok"}`였다. 외부 톰캣 배포 시 Java/Servlet 호환성과 배포 로그, context path를 확인한다. `providedRuntime`은 테스트에도 의존성을 제공한다.

**Maven 대응:** Boot parent를 쓰면 `./mvnw package`가 `repackage`까지 실행한다. WAR는 `<packaging>war</packaging>`, 톰캣 의존성 `provided`, `SpringBootServletInitializer`를 설정한다. Parent 없이 쓸 때는 Maven 플러그인에 `repackage` goal을 직접 연결한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 파일 목록·manifest | 구조와 진입점 확인 | `unzip -l app.jar` / `unzip -p app.jar META-INF/MANIFEST.MF` | Boot는 `Main-Class`와 `Start-Class`가 다르다. |
| plain JAR 실행 | 외부 클래스패스 사용 | `java -cp 'app.jar:lib/*' com.example.App` | `-cp` 뒤에 FQCN을 쓴다. |
| Boot 실행 JAR | 내장 서버 앱 실행 | `java -jar app.jar` | 외부 `-cp`는 무시된다. |
| JVM 속성 | 프로파일·메모리 설정 | `java -Dspring.profiles.active=prod -jar app.jar` | `-D`는 `-jar` 앞에 둔다. |
| Boot 인자 | Spring 설정 덮어쓰기 | `java -jar app.jar --server.port=8081` | JAR 경로 뒤에 둔다. |
| Gradle plain JAR | 의존성 없는 결과물 | `./gradlew jar` | 대개 파일명에 `-plain`이 붙는다. |
| Gradle 실행 아카이브 | JAR 또는 WAR 빌드 | `./gradlew bootJar` / `bootWar` | `build/libs/`에 생성된다. |
| Maven 패키징 | JAR/WAR 생성 | `./mvnw package` | `repackage` 실행 설정을 확인한다. |
| 의존성 충돌 조사 | 선택 버전 확인 | `./gradlew dependencyInsight --dependency spring-web --configuration runtimeClasspath` | `NoSuchMethodError` 때 확인한다. |

## 5. 자주 나는 에러와 해결

1. **`no main manifest attribute, in app.jar` → plain JAR을 `java -jar`로 실행했다.** 일반 `jar` 산출물에는 실행용 `Main-Class`가 없을 수 있다. 서버 앱은 `./gradlew bootJar`로 다시 만들고, 직접 만든 Java JAR은 `jar --main-class 패키지명.클래스명`으로 시작점을 넣는다.

2. **`Could not find or load main class ...` → 클래스패스 루트나 FQCN이 맞지 않는다.** `com.example.App`이면 클래스패스 루트 아래 `com/example/App.class`가 있어야 한다. 클래스 파일이 들어 있는 디렉터리/JAR을 `-cp`에 넣고, 패키지 선언과 대소문자까지 맞춘다.

3. **`NoClassDefFoundError`/`ClassNotFoundException` → 런타임 의존성이 빠졌다.** plain JAR만 복사하면 라이브러리는 따라오지 않는다. `bootJar`를 쓰거나 `-cp 'app.jar:lib/*'`와 라이브러리를 함께 배포한다.

4. **`NoSuchMethodError`, `AbstractMethodError` → 컴파일과 실행 시 라이브러리 버전이 다르다.** 중복 의존성 또는 컨테이너 공유 라이브러리가 원인일 수 있다. `dependencyInsight`/`dependency:tree`로 버전을 확인하고 BOM으로 정렬한다.

5. **WAR 배포 중 `ServletContext` 오류가 난다 → 초기화 방식이나 Servlet API가 맞지 않는다.** `configure` 반환값, `providedRuntime`/`provided`, 대상 톰캣의 Java·Servlet 호환성을 확인한다.

6. **`Web server failed to start. Port 8080 was already in use.` → 포트가 점유됐다.** `--server.port=8081`로 바꾸거나 기존 프로세스를 확인한다.

## 6. 한 단계 더

- Java 런처는 JAR 안의 JAR을 클래스패스로 보지 않는다. Boot `JarLauncher`가 `BOOT-INF/classes`와 `BOOT-INF/lib`를 읽어 실행 클래스패스를 만든다.
- 그래서 실행 JAR의 `Main-Class`는 로더이고 앱 시작 클래스는 `Start-Class`다. 일반 JAR은 앱 main을 `Main-Class`로 지정한다.
- Gradle `jar`/`war`는 일반 아카이브, `bootJar`/`bootWar`는 로더·의존성·실행 manifest를 포함한다. 파일명과 내부를 확인한다.
- 외부 컨테이너는 `SpringBootServletInitializer`로 앱을 구동한다. `providedRuntime`은 내장 서버를 `WEB-INF/lib-provided`에 분리한다.
- `unzip -l`, manifest, 실제 `java -jar`로 확인한다. IDE 실행만으로 패키징을 판정하지 않는다.
- Boot 2.3은 레이어드 아카이브로 이미지 캐시를 지원했다. 세부 배포는 → S19, Gradle/Maven은 → P08 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. 왜 `java -jar app.jar -cp lib/*`는 클래스패스를 추가하지 않나?

`-jar`는 manifest의 `Main-Class`로 시작하고 해당 JAR을 클래스 출처로 삼아 `-cp`를 무시한다. classpath 실행은 `java -cp 'app.jar:lib/*' com.example.Main`처럼 클래스명을 직접 지정한다.

**꼬리질문:** Spring Boot 실행 JAR이 의존성을 찾는 방법은?

`JarLauncher`가 `BOOT-INF/classes`와 `BOOT-INF/lib`를 읽는다. 일반 `-cp`가 중첩 JAR을 자동 탐색하는 것은 아니다.

### Q2. Spring Boot JAR에서 `Main-Class`와 `Start-Class`가 다른 이유는?

`Main-Class`는 부트스트랩 로더(`JarLauncher`)이고 `Start-Class`는 앱 main이다. 로더가 중첩 라이브러리 경로를 준비한 뒤 실제 앱을 호출한다.

**꼬리질문:** `BOOT-INF/classes`를 최상위에 두지 않는 까닭은?

앱 클래스는 `BOOT-INF/classes`에 있어 plain JAR처럼 클래스패스에 얹으면 보이지 않을 수 있다.

### Q3. Gradle의 `jar`와 `bootJar`가 둘 다 생성되는 이유는?

`jar`는 일반 아카이브, `bootJar`는 로더·의존성을 포함한 실행 아카이브를 만든다. 기본 classifier로 plain 산출물과 실행 산출물을 구분한다.

**꼬리질문:** `build/libs/*.jar`를 전부 배포해도 되나?

아니다. `-plain.jar`는 실행 의존성이 없을 수 있으므로 배포 파일명을 명시한다.

### Q4. Boot 서비스를 JAR 대신 WAR로 만들 때 필요한 것은?

`SpringBootServletInitializer`와 `configure`를 구현한다. Gradle은 `war`/`bootWar`와 `providedRuntime`, Maven은 `war`와 `provided`로 내장 서버를 분리한다.

**꼬리질문:** 그러면 `java -jar app.war`는 안 되나?

가능하다. 실행 WAR는 내장 런타임을 `WEB-INF/lib-provided`에 분리하고 `WarLauncher`가 직접 실행할 때 사용한다.

### Q5. `NoSuchMethodError`가 배포 JAR에서만 발생하면 무엇을 확인할까?

컴파일·실행 시 로드된 라이브러리 API가 다르다는 신호다. `dependencyInsight`/`dependency:tree`와 실제 `BOOT-INF/lib`를 보고 BOM으로 버전을 정렬한다.

**꼬리질문:** 의존성 그래프에는 충돌이 없는데 외부 톰캣에서만 발생한다면?

컨테이너 공용 클래스패스가 앱 WAR보다 우선하는지, 공유 라이브러리 버전이 겹치는지 확인한다.

### Q6. 프로파일/포트 옵션은 명령행에서 어디에 두나?

`-Dspring.profiles.active=prod`는 `-jar` 앞, `--server.port=8081`은 JAR 뒤에 둔다. 시작 로그에서 적용값을 확인한다.

**꼬리질문:** `--server.port`를 `-D`로 바꾸면 같은가?

아니다. JVM 속성은 `-Dserver.port=8081`, Boot 인자는 `--server.port=8081`이다.

## 8. 참고문헌

- JAR File Specification (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/specs/jar/jar.html — ZIP 기반 JAR 및 manifest 규격.
- The `java` Command (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html — `-jar`·`Main-Class`·classpath 규칙.
- Launching Executable Jars — https://docs.spring.io/spring-boot/specification/executable-jar/launching.html — launcher와 manifest 동작.
- Nested JARs — https://docs.spring.io/spring-boot/specification/executable-jar/nested-jars.html — 실행 JAR/WAR 내부 경로.
- Packaging Executable Archives (Gradle Plugin) — https://docs.spring.io/spring-boot/gradle-plugin/packaging.html — Gradle 실행 태스크와 classifier.
- Traditional Deployment — https://docs.spring.io/spring-boot/how-to/deployment/traditional-deployment.html — 외부 컨테이너 WAR 구성.
- Packaging Executable Archives (Maven Plugin) — https://docs.spring.io/spring-boot/maven-plugin/packaging.html — `repackage`와 Maven 레이아웃.
- Spring Boot 2.3 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.3-Release-Notes — layered archives 도입.
- JEP 238: Multi-Release JAR Files — https://openjdk.org/jeps/238 — Java 9 multi-release JAR.
