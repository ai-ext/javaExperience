# P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지

> 3줄 요약 — Gradle 프로젝트는 `build.gradle.kts`와 Wrapper를 기준으로 열고, Project SDK와 Gradle JVM을 먼저 맞춘다.
> 실행은 코드에 붙은 임시 구성보다 저장된 Run Configuration으로 표준화하고, 환경변수·프로파일은 구성에 둔다.
> 디버거·HTTP Client·안전한 리팩토링·Git diff를 한 흐름으로 사용하면 “수정하고 재현하고 검증하는” 시간이 짧아진다.

## 1. 한 줄로 말하면

IntelliJ IDEA는 Java/Spring 코드를 편집하는 프로그램을 넘어 빌드 도구, 실행 프로세스, 디버거, HTTP 호출, Git 변경을 연결하는 IDE다. SDK와 Gradle JVM이 다르면 결과가 달라진다.

내일부터 Spring Boot를 개발한다면 `./gradlew` 프로젝트를 IDE에 연결하고 같은 JDK로 동기화·실행·테스트한다. 기준은 Boot 4.1·Framework 7·Java 25다.

## 2. 당장 알아야 할 것

### 2.1 프로젝트는 파일이 아니라 빌드 모델로 연다

`settings.gradle.kts` 또는 `build.gradle.kts`가 있는 루트를 연다. Gradle Wrapper가 있으면 IDE와 터미널 모두 다음을 사용한다.

```bash
./gradlew clean test
./gradlew bootRun
```

`build.gradle.kts`에 의존성을 추가한 뒤 Gradle 동기화를 수행한다. `src`를 수동으로 Mark as Sources Root 하지 말라.

### 2.2 Project SDK와 Gradle JVM은 각각 확인한다

`File | Project Structure | Project`에서 Project SDK와 Language level을 Java 25로 설정한다. 이어 `Settings | Build, Execution, Deployment | Build Tools | Gradle`의 Gradle JVM도 같은 JDK로 맞춘다. JetBrains 문서의 Gradle JVM 선택 순서는 기존 프로젝트에서 대체로 `gradle.properties`의 `org.gradle.java.home` → `JAVA_HOME` → 현재 Gradle에 맞는 JDK다.

팀에서 고정할 때는 `gradle.properties`를 사용한다.

```properties
# gradle.properties — 개발자 컴퓨터마다 경로가 달라지므로 보통은 개인 파일에 둔다.
# org.gradle.java.home=/Users/me/.jdks/jdk-25
org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8
```

경로를 커밋하면 다른 운영체제에서 깨지므로 `org.gradle.java.home`은 개인 설정에 둔다. `Reload All Gradle Projects` 후 `./gradlew -version`의 JVM을 비교한다.

### 2.3 Spring Boot 실행은 Run Configuration으로 저장한다

Spring Boot main 클래스 옆의 실행 아이콘을 누르면 임시 구성이 생긴다. 로컬에서만 잠깐 확인할 때는 충분하지만, 팀에 공유할 구성은 `Run | Edit Configurations`에서 Spring Boot 또는 Application 구성을 만든다. 이름은 `api-local`, `api-staging`처럼 목적을 드러내고 다음을 분리한다.

```text
Main class: com.example.api.ApiApplication
Program arguments: --server.port=8081
Environment variables: SPRING_PROFILES_ACTIVE=local;LOGGING_LEVEL_ROOT=INFO
Working directory: $PROJECT_DIR$
```

민감한 토큰은 구성 파일이나 Git에 넣지 말고 환경변수·비밀 저장소로 주입한다. `SPRING_PROFILES_ACTIVE=local`은 코드 변경 없이 실행 대상을 바꾼다.

### 2.4 자주 쓰는 단축키는 macOS와 Windows를 함께 기억한다

문서의 표기는 현재 선택한 keymap에 따라 달라진다. 아래는 기본 macOS / Windows·Linux 대응이며, 안 맞으면 `Settings | Keymap`에서 검색한다.

```text
Search Everywhere       Shift 두 번 / Shift 두 번
Find Action              ⌘⇧A / Ctrl+Shift+A
파일 찾기                 ⌘⇧O / Ctrl+Shift+N
정의로 이동               ⌘B / Ctrl+B
사용처 찾기               ⌥F7 / Alt+F7
최근 파일                 ⌘E / Ctrl+E
빠른 수정                 ⌥Enter / Alt+Enter
코드 생성                 ⌘N / Alt+Insert
이름 변경                 ⇧F6 / Shift+F6
메서드 추출               ⌘⌥M / Ctrl+Alt+M
실행 / 디버그             ⌃R·⌃D / Shift+F10·Shift+F9
```

처음부터 모두 외우지 말고 `Find Action`에서 명령명으로 찾아 쓴다. 사용자 정의 단축키는 개인 keymap에 둔다.

### 2.5 자동 import와 Alt+Enter를 사용한다

빨간 심볼에서 `Alt+Enter`(macOS는 `⌥Enter`)를 누르면 import와 문맥별 빠른 수정이 나온다. `Optimize Imports`와 `Reformat Code`는 저장소 스타일을 따른다. `java.util.Date`와 `java.sql.Date`처럼 후보가 여러 개인 자동 import는 눈으로 확인한다. `Alt+Insert`는 생성자·getter·override를 만든다.

### 2.6 Lombok은 의존성과 annotation processing을 함께 맞춘다

Gradle Kotlin DSL의 최소 설정은 다음과 같다.

```kotlin
dependencies {
    compileOnly("org.projectlombok:lombok:1.18.38")
    annotationProcessor("org.projectlombok:lombok:1.18.38")
    testCompileOnly("org.projectlombok:lombok:1.18.38")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.38")
}
```

버전은 프로젝트 정책에 맞춘다. `Settings | Build, Execution, Deployment | Compiler | Annotation Processors`의 `Enable annotation processing`을 확인하고 Gradle/Maven 모델을 다시 불러온다.

### 2.7 리팩토링은 텍스트 치환이 아니라 심볼 변경이다

커서가 클래스·메서드·변수에 있을 때 `Shift+F6` Rename을 사용하면 참조와 문자열을 구분해 바꾼다. `Extract Method`(`⌘⌥M`/`Ctrl+Alt+M`), `Introduce Variable`(`⌘⌥V`/`Ctrl+Alt+V`), `Change Signature`(`Ctrl+F6`), `Inline`(`⌘⌥N`/`Ctrl+Alt+N`)도 같은 원칙이다.

적용 전 Preview에서 변경 사용처와 충돌을 확인한다. 단순 Find/Replace로 메서드명을 바꾸면 주석·문자열은 바뀌고 다른 패키지의 동일 이름은 놓친다.

### 2.8 디버거는 “멈춤 → 상태 관찰 → 한 단계 실행” 순서다

줄 왼쪽 여백을 눌러 breakpoint를 만들고 `Debug`로 실행한다. 조건 breakpoint에는 `order.getStatus() == FAILED`처럼 실제로 멈출 조건을 넣고, 로그만 보고 싶다면 로그 breakpoint를 쓴다. 멈춘 뒤 Variables, Watches, Evaluate Expression을 사용한다.

`Step Over`는 현재 줄의 다음으로, `Step Into`는 호출 내부로, `Step Out`은 현재 메서드 밖으로 이동한다. 예외가 catch되어 사라지는 문제는 Exception Breakpoint를 예외 타입에 걸어 catch 이전 지점에서 멈춘다.

### 2.9 HTTP Client로 API 호출을 프로젝트와 함께 보관한다

프로젝트 루트에 `http/local.http`를 만들면 curl 명령을 복사하지 않고 요청과 응답을 함께 다룰 수 있다.

```http
### health
GET http://localhost:8080/actuator/health
Accept: application/json

### create
POST http://localhost:8080/api/orders
Content-Type: application/json

{
  "productId": 10,
  "quantity": 2
}
```

각 요청 위의 실행 아이콘을 누른다. 환경별 base URL·토큰은 환경 파일로 분리하되 비밀값은 커밋하지 않는다.

### 2.10 Database와 Git tool window의 역할을 구분한다

Database tool window에서 MySQL 데이터소스를 추가할 때 host·port·database·user를 입력하고 드라이버를 설치한다. 운영 DB는 읽기 전용 계정과 별도 연결을 사용한다.

Git은 `⌘K`/`Ctrl+K` 커밋, `⌘⇧K`/`Ctrl+Shift+K` push, Commit 창의 diff·history·conflict resolver를 사용한다. 양쪽 변경과 테스트를 확인한 뒤 `Mark as resolved`한다. Git 명령 자체의 전략은 P13을 참조한다.

## 3. 따라 하기

### 3.1 프로젝트 생성과 열기

터미널에서 빈 저장소를 만들고 Gradle Wrapper를 생성했다고 가정한다. 실제 팀 저장소라면 이 단계 대신 clone한다.

```text
File | New | Project | Spring Boot
Language: Java
Build system: Gradle - Kotlin
JDK: 25
Spring Boot: 4.1.x
Dependencies: Spring Web
```

루트에는 `settings.gradle.kts`, `build.gradle.kts`, `gradlew`, `gradle/wrapper/`가 있어야 한다. 기존 프로젝트는 `build.gradle.kts`가 있는 루트를 열고 동기화한다.

확인 방법:

```bash
./gradlew clean test
./gradlew -version
```

두 번째 출력의 JVM이 Project SDK와 Java 25로 일치하면 첫 검증이 끝난다. Boot 예제는 여기서 `(미실행)`이다.

### 3.2 실행 구성에 프로파일과 포트를 넣기

`src/main/resources/application-local.yml`을 만든다.

```yaml
server:
  port: 8081
spring:
  application:
    name: idea-demo
```

`src/main/java/com/example/idea/IdeaDemoApplication.java`는 다음처럼 둔다.

```java
package com.example.idea;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class IdeaDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdeaDemoApplication.class, args);
    }

    @RestController
    static class HealthController {
        @GetMapping("/hello")
        String hello() {
            return "hello";
        }
    }
}
```

Run Configuration을 저장한다.

```text
Name: idea-demo-local
Main class: com.example.idea.IdeaDemoApplication
Program arguments: --spring.profiles.active=local
Environment: SPRING_PROFILES_ACTIVE=local
JRE: Project SDK (Java 25)
```

프로파일은 한 곳에만 넣고 Run 로그와 `.http` 응답을 확인한다.

```http
GET http://localhost:8081/hello
```

예상 응답은 `hello`다. Spring Boot 예제는 `(미실행)`이다.

### 3.3 리팩토링을 안전하게 적용하기

다음 메서드의 `discountedPrice` 계산 부분에 커서를 두고 `Extract Method`를 실행한다.

```java
public int price(int original, boolean vip) {
    int discountedPrice = vip ? original * 90 / 100 : original;
    return discountedPrice;
}
```

메서드명을 `calculatePrice`로 바꾸고 Preview·diff에서 호출부와 반환식을 확인한다. `./gradlew test`와 Find Usages 결과로 검증한다.

### 3.4 디버거로 인자와 컬렉션을 관찰하기

아래 순수 Java 파일을 `_scratch/P15/IdeaDebugDemo.java`로 저장하고 main 왼쪽의 breakpoint를 `total` 계산 다음 줄에 둔다.

```java
import java.util.Arrays;

public class IdeaDebugDemo {
    public static void main(String[] args) {
        String profile = args.length == 0 ? "local" : args[0];
        int total = Arrays.stream(new int[]{3, 5, 8})
                .map(value -> value * 2)
                .sum();
        System.out.printf("profile=%s, total=%d%n", profile, total);
    }
}
```

구성의 Program arguments에 `staging`을 넣고 Debug로 실행한다. breakpoint에서 `profile`을 Evaluate하면 `"staging"`, `total`은 `32`여야 한다. `Step Over`로 `printf`까지 이동한 다음 Resume한다.

실행 검증 결과 (지정된 JDK 21로 실행):

```text
profile=staging, total=32
```

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| Search Everywhere | 파일·클래스·설정 검색 | Shift 두 번 → `Gradle JVM` | 검색어를 영어 메뉴명으로도 시도 |
| Find Action | 명령 실행 | `Ctrl+Shift+A` → `Invalidate Caches` | 단축키를 몰라도 된다 |
| Project Structure | SDK·모듈 확인 | `Ctrl+Alt+Shift+S` | Gradle 모델과 수동 변경이 충돌할 수 있음 |
| Gradle tool window | 동기화·task 실행 | `Reload All Gradle Projects` | Wrapper task를 우선 사용 |
| Run Configuration | args·env·JDK 저장 | `api-local` | 비밀값을 공유 파일에 저장 금지 |
| Alt+Enter | 오류의 문맥별 수정 | import 추가, quick-fix | 제안 내용을 읽고 적용 |
| Rename | 심볼과 참조 변경 | `Shift+F6` | 문자열·외부 API 계약은 별도 확인 |
| Extract Method | 긴 로직 분리 | `Ctrl+Alt+M` | 동작 변경 없는지 테스트 |
| Breakpoint | 특정 실행 지점 정지 | 조건 `id == 0` | 트래픽 많은 서버에서는 조건 필수 |
| Evaluate Expression | 현재 상태로 식 계산 | `order.getTotal()` | getter가 부작용을 가지면 호출 주의 |
| `.http` | REST 요청 저장·실행 | `GET http://localhost:8081/hello` | 토큰 파일 커밋 금지 |
| Database | SQL·스키마·row 확인 | MySQL data source | 운영 계정으로 쓰지 않기 |
| Git diff | 변경 검토·충돌 해결 | Commit 창 | resolve가 정답을 보장하지 않음 |

## 5. 자주 나는 에러와 해결

1. **“Unsupported class file major version” 또는 Gradle이 Java를 지원하지 않는다는 오류 →** IDE Project SDK와 Gradle JVM이 서로 다르거나 Gradle 버전이 낮다 → `./gradlew -version`, Gradle 설정, Wrapper를 차례로 확인하고 팀이 정한 Java 25와 호환되는 Wrapper를 사용한다.

2. **의존성을 추가했는데 import가 빨갛고 External Libraries에 없다 →** Gradle 동기화가 안 됐거나 파일을 잘못된 폴더에 추가했다 → `build.gradle.kts`를 저장하고 Reload를 누른 뒤 `./gradlew dependencies` 또는 `./gradlew test`로 IDE 밖에서도 확인한다.

3. **Lombok getter가 없다고 표시되거나 컴파일이 실패한다 →** `compileOnly`만 있고 `annotationProcessor`가 없거나 annotation processing이 꺼졌다 → 두 configuration을 추가하고 Gradle sync, Annotation Processors의 Enable 상태를 확인한다.

4. **코드가 전부 회색이거나 “Indexing…”이 오래 지속된다 →** 인덱스가 아직 끝나지 않았거나 캐시가 손상됐다 → 먼저 인덱싱 완료를 기다리고, 다른 프로젝트의 Gradle 동기화를 멈춘다. 마지막 수단으로 `File | Invalidate Caches… | Invalidate and Restart`를 실행한다. `Clear file system cache and Local History`는 Local History까지 지우므로 필요할 때만 선택한다.

5. **Run 버튼이 없거나 “Main method not found” →** main 클래스·소스 root·실행 구성의 JRE가 잘못됐다 → `@SpringBootApplication` 클래스의 `public static void main`과 `src/main/java` 위치, Main class를 확인하고 Application 구성으로 다시 만든다.

6. **breakpoint가 빈 원으로 남고 멈추지 않는다 →** 실행 중인 프로세스가 다른 클래스/구버전 bytecode이거나 디버그 정보가 없다 → Debug로 실행했는지, Gradle build와 IDE build가 섞이지 않았는지, Java Compiler의 Generate debugging info가 켜졌는지 확인한다.

7. **HTTP Client가 요청은 보냈지만 인증·환경이 틀린다 →** 환경 파일의 base URL 또는 헤더가 현재 Run Configuration과 다르다 → 요청에 실제 host·port를 표시하고, 토큰은 커밋하지 않는 로컬 환경 변수로 주입한다.

8. **Spring 메뉴나 gutter 아이콘이 보이지 않는다 →** Spring/Spring Boot 플러그인이 꺼졌거나 제품에서 제공하지 않는다 → `Settings | Plugins`에서 bundled 플러그인과 라이선스를 확인한다. 예전 Community/Ultimate 표는 현재 제품 문서와 다를 수 있다.

## 6. 한 단계 더

Gradle Wrapper가 의존성·컴파일·테스트를 결정하고, Run Configuration은 인자·환경을 결정하며, debugger는 JVM의 thread·stack·local variable을 보여준다. IDE에서 성공해도 `./gradlew clean test`와 CI가 성공해야 한다.

다음 단계에서는 재현·관찰·가설·검증의 디버깅 방법론을 → D05, Git 명령과 브랜치·충돌 전략을 → P13에서 이어간다. 이 문서에서는 두 주제를 IDE에서 사용하는 접점만 다뤘다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. Project SDK와 Gradle JVM이 왜 둘 다 필요한가?

Project SDK는 IDE의 언어 수준·코드 분석·일부 실행의 기준이고, Gradle JVM은 Gradle daemon과 import/build를 실행하는 JVM이다. 둘이 다르면 IDE에서는 Java 25 API가 보이는데 Gradle은 다른 JDK로 실패할 수 있다. `Project Structure`와 Gradle 설정, `./gradlew -version`을 모두 확인해야 한다.

꼬리질문: `JAVA_HOME`만 바꾸면 충분한가? → `org.gradle.java.home`과 IDE Gradle JVM도 비교해야 한다.

### Q2. 임시 Run Configuration을 저장해야 하는 상황은?

포트·프로파일·환경변수·VM option·실행 전 task처럼 팀원이 반복해서 필요한 값이 있으면 저장한다. 이름과 설정을 공유하면 “내 컴퓨터에서만 실행됨”을 줄인다. 비밀값은 저장하거나 VCS에 올리지 않는다.

꼬리질문: 실행 인자와 환경변수 중 무엇을 쓰나? → 공개 설정은 인자, 토큰은 환경변수나 비밀 주입을 사용한다.

### Q3. Rename과 Find/Replace의 차이는?

Rename은 IDE가 파악한 심볼과 참조를 대상으로 하므로 타입·범위를 구분한다. Find/Replace는 텍스트이므로 문자열·주석까지 바뀌거나 다른 심볼을 놓친다. 공개 API나 JSON 필드명은 Rename 후에도 직렬화 계약과 소비자를 따로 검증한다.

꼬리질문: Rename 전에 무엇을 보나? → Find Usages·Preview와 reflection·설정 문자열을 확인한다.

### Q4. 조건 breakpoint가 일반 breakpoint보다 유리한 때는?

요청이 많은 서버에서 모든 요청을 멈추면 재현이 느려지고 다른 thread 상태도 변한다. 특정 ID·상태·횟수에서만 멈추면 관심 있는 사건만 관찰할 수 있다. 단, 조건식 자체가 무거운 메서드를 호출하거나 상태를 바꾸면 관찰이 원인을 바꿀 수 있다.

꼬리질문: catch된 예외는 어떻게 찾나? → 해당 예외 타입의 Exception Breakpoint를 걸어 catch 이전에 멈춘다.

### Q5. HTTP Client를 curl 대신 쓰는 이유는?

`.http`는 요청을 코드 저장소에 남기고 여러 요청·헤더·환경을 한 파일에서 실행한다. 리뷰어가 재현 절차를 그대로 볼 수 있고 응답을 IDE에서 확인한다. 다만 curl보다 운영 자동화나 복잡한 shell 조합에는 덜 적합하므로 목적에 맞게 선택한다.

꼬리질문: 토큰은 어떻게 관리하나? → 커밋 대상 `.http`에는 placeholder를 두고 로컬 환경 파일 또는 안전한 환경변수로 주입한다.

### Q6. Lombok 빨간 줄의 원인을 어떻게 분리하나?

첫째 `annotationProcessor`가 Gradle/Maven에 있는지, 둘째 IDE annotation processing이 켜졌는지, 셋째 Gradle 동기화와 실제 `test`가 각각 성공하는지 본다. IDE만 재시작하는 것은 원인 분리가 아니다. 컴파일은 되는데 IDE만 빨간 경우와 둘 다 실패하는 경우를 나눠야 한다.

꼬리질문: annotation processor는 무엇을 하나? → 컴파일 시 애노테이션을 읽고 검증하거나 소스·메타데이터를 생성한다. 생성 결과를 IDE와 빌드가 같은 classpath로 보아야 한다.

## 8. 참고문헌

- Getting started — https://www.jetbrains.com/help/idea/getting-started.html — IntelliJ IDEA의 프로젝트·실행·디버깅·도구 기능 진입점.
- IntelliJ IDEA keyboard shortcuts — https://www.jetbrains.com/help/idea/mastering-keyboard-shortcuts.html — Search Everywhere, Find Action, navigation·refactoring 단축키.
- Getting Started with Gradle — https://www.jetbrains.com/help/idea/getting-started-with-gradle.html — Gradle Kotlin DSL 프로젝트 생성, Wrapper, JDK 25 예제.
- Gradle JVM selection — https://www.jetbrains.com/help/idea/gradle-jvm-selection.html — `org.gradle.java.home`, `JAVA_HOME`, IDE Gradle JVM 선택 순서.
- Run/debug configurations — https://www.jetbrains.com/help/idea/run-debug-configuration.html — 임시·영구 구성, 실행 인자와 공유 방법.
- Debug code — https://www.jetbrains.com/help/idea/debugging-code.html — breakpoint, stepping, 변수·thread 관찰, Evaluate 흐름.
- Code refactoring — https://www.jetbrains.com/help/idea/refactoring-source-code.html — Preview, 충돌 확인과 Rename·Extract·Inline·Signature 변경.
- HTTP Client — https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html — `.http` 파일 작성·실행·환경·응답 기록.
- Configure annotation processors — https://www.jetbrains.com/help/idea/annotation-processors-support.html — annotation processing과 Gradle/Maven processor 경로.
- Tutorial: Explore Spring support features — https://www.jetbrains.com/help/idea/spring-support-tutorial.html — Spring/Spring Boot 플러그인과 실행·HTTP·JPA 도구 흐름.
- Invalidate caches — https://www.jetbrains.com/help/idea/invalidate-caches.html — 캐시·파일 시스템·VCS Log 인덱스 무효화와 주의점.
- IntelliJ IDEA Features — https://www.jetbrains.com/idea/features/ — 현재 통합 IntelliJ IDEA의 검색·디버거·Git·생산성 기능 개요.
