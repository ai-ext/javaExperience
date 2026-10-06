# P29. static 완전 정리 — 클래스 변수·정적 메서드·상수, 그리고 Spring에서의 static

> `static` 멤버는 객체마다 복사되지 않고, 해당 클래스를 정의한 클래스 로더의 클래스에 속한다.
> Spring singleton 빈도 컨테이너마다 하나의 객체를 공유하므로 일반적인 서비스 코드에 static 상태를 둘 이유가 거의 없다.
> 순수하고 무상태인 계산은 static 유틸리티로, 설정·저장소·외부 연동·교체가 필요한 동작은 생성자 주입 빈으로 만든다.

## 1. 한 줄로 말하면

`static` 필드·메서드·초기화 블록·중첩 클래스는 객체가 아니라 클래스에 속한다. static 필드는 모든 인스턴스가 공유하며, 클래스 초기화 때 필드 초기화와 static 블록이 실행된다. 서버의 static 가변 상태는 요청 간 공유 버그를 부른다.

## 2. 당장 알아야 할 것

아래 원칙을 순서대로 적용하면 대부분의 사용처를 결정할 수 있다.

1. **객체마다 다르면 인스턴스 필드다.** 이름·금액처럼 객체별 값에 `static`을 붙이면 모든 객체가 한 값을 공유한다.
2. **요청 상태를 static 가변 필드에 두지 않는다.** 여러 요청이 동시에 읽고 써 사용자 값이 섞인다. JVM 내부 단순 카운터라면 `AtomicLong`/`LongAdder`가 경쟁을 줄이지만, 여러 서버의 집계나 업무 영속성은 저장소가 맡아야 한다.
3. **static 메서드는 객체 상태 없는 연산에 쓴다.** 호출할 때 `this`가 없어 인스턴스 필드를 직접 읽지 못한다. 하위 클래스의 같은 static 메서드는 오버라이드가 아니라 숨김이며, 호출 선택은 컴파일 시점 타입 기준이다. `Type.method()`로 호출한다.
4. **`static final`은 재대입만 막는다.** `static final List`의 원소는 바뀔 수 있다. primitive/String 상수 표현식만 컴파일 타임 상수가 될 수 있고, 상수 이름은 `UPPER_SNAKE_CASE`로 쓴다.
5. **초기화는 첫 능동 사용 직전이다.** JVM은 준비 단계에서 static 저장공간을 기본값으로 채운다. 인스턴스 생성, static 메서드 호출, 필드 대입 또는 비상수 static 필드 읽기 전에 부모부터 초기화하고, 클래스 안에서는 필드와 블록을 선언 순서로 실행한다. 상수 변수 읽기는 예외가 될 수 있다.
6. **외부 인스턴스가 필요 없으면 static 중첩 클래스를 쓴다.** non-static 내부 클래스는 바깥 객체 참조를 보유하므로 오래 사는 목록/콜백에 넣으면 외부 객체 수명도 늘 수 있다.
7. **Spring singleton과 static은 범위가 다르다.** singleton은 IoC 컨테이너마다 빈 정의별 객체 하나, static은 클래스 로더가 정의한 클래스 상태다. `@Autowired`/`@Value`를 static 필드에 붙이면 주입되지 않으므로 생성자 주입을 쓴다. 단, placeholder 후처리기 같은 인프라의 `@Bean` 메서드는 문서가 static을 요구할 수 있다.
8. **기본 추천:** 입력만으로 결정되는 무상태 연산만 static 유틸리티로 둔다. 설정·저장소·시계·외부 연동·테스트 대역이 필요한 로직은 Spring 빈과 생성자 주입을 선택한다.
## 3. 따라 하기

기존 Spring Boot 4.1 프로젝트에 static 유틸과 생성자 주입 서비스를 추가한다. 코드는 Boot 4.1.1 / Java 25 기준이며 미실행이다.

### 단계 1 — 프로젝트 뼈대 준비

프로젝트 루트에서 소스 폴더를 만든다:

```sh
mkdir -p src/main/java/com/example/staticdemo src/main/resources
```

```text
static-demo/
├── settings.gradle.kts
├── build.gradle.kts
└── src/main/
    ├── java/com/example/staticdemo/
    └── resources/application.properties
```

루트에 `settings.gradle.kts`를 만든다:

```kotlin
rootProject.name = "static-demo"
```

`build.gradle.kts`도 루트에 둔다:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

tasks.withType<JavaCompile>().configureEach {
    options.release.set(25)
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter")
}
```

Maven은 parent `spring-boot-starter-parent:4.1.1`, `java.version=25`, starter 및 `spring-boot-maven-plugin`을 선언한다. BOM 버전은 별도 지정하지 않는다.

**확인 방법:** `./gradlew --version`과 `./gradlew tasks`로 Wrapper 및 `bootRun`을 확인한다. Maven은 `./mvnw -version`을 쓴다.

### 단계 2 — 변하지 않는 규칙만 static 유틸리티로 둔다

`src/main/java/com/example/staticdemo/TextRules.java`:

```java
package com.example.staticdemo;

public final class TextRules {
    public static final int MAX_NAME_LENGTH = 40;

    private TextRules() {
        throw new AssertionError("utility class");
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= MAX_NAME_LENGTH
                ? trimmed
                : trimmed.substring(0, MAX_NAME_LENGTH);
    }
}
```

private 생성자로 인스턴스 생성을 막았다. 입력만 사용하는 `normalize`는 static 유틸에 적합하다. 정적 팩토리는 → P04 참조.

**확인 방법:** `TextRules.normalize("  Mina  ")`의 결과는 `Mina`, `TextRules.normalize(null)`의 결과는 빈 문자열이다. 메서드가 입력 외부 상태를 읽지 않는지 확인한다.

### 단계 3 — 설정과 업무 동작은 빈 인스턴스에 둔다

`src/main/resources/application.properties`:

```properties
demo.prefix=Hi
```

`src/main/java/com/example/staticdemo/WelcomeService.java`:

```java
package com.example.staticdemo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WelcomeService {
    private final String prefix;

    public WelcomeService(@Value("${demo.prefix:Hello}") String prefix) {
        this.prefix = prefix;
    }

    public String greet(String name) {
        return prefix + ", " + TextRules.normalize(name);
    }
}
```

설정은 Spring이 만든 인스턴스에 주입되고, 순수 문자열 정리만 static 메서드로 호출한다. 요청마다 달라지는 데이터를 `static String currentName` 같은 필드에 저장하지 않는다.

**확인 방법:** `application.properties` 값을 `Hi`에서 `Welcome`으로 바꾸면 인사말 접두어가 바뀐다. 접두어를 코드의 static 필드에 고정하지 않았으므로 프로퍼티 설정이 반영된다.

### 단계 4 — 애플리케이션 시작 시 호출해 결과를 확인한다

`src/main/java/com/example/staticdemo/StaticDemoApplication.java`:

```java
package com.example.staticdemo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StaticDemoApplication implements ApplicationRunner {
    private final WelcomeService welcomeService;

    public StaticDemoApplication(WelcomeService welcomeService) {
        this.welcomeService = welcomeService;
    }

    public static void main(String[] args) {
        SpringApplication.run(StaticDemoApplication.class, args);
    }

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("greeting=" + welcomeService.greet("  Mina  "));
    }
}
```

실행은 `./gradlew bootRun`, Maven은 `./mvnw spring-boot:run`이다. Spring 예제는 이 문서 작성 환경에서 실행하지 않았다.

**확인 방법:** 시작 로그 끝부분에 다음 행이 출력되어야 한다. 프로퍼티를 `Welcome`으로 바꿨을 때 `greeting=Welcome, Mina`로 변하는지 확인한다.

```text
greeting=Hi, Mina
```

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| static 필드 | 클래스 전체 공유 데이터 | `private static int created;` | 가변 상태는 모든 호출자가 공유하고 동시성 문제를 만든다 |
| 인스턴스 필드 | 객체별 상태 | `private final String name;` | 요청별 상태를 singleton 서비스 필드에 저장하면 안 된다 |
| static 메서드 | 객체 상태가 필요 없는 연산 | `Math.max(a, b)` | `this` 없음, 상속해도 다형적 재정의가 되지 않음 |
| 상수 | 고정된 값 | `static final int LIMIT = 10;` | 객체의 깊은 불변성과 컴파일 타임 상수는 별개 |
| 초기화 블록 | 클래스 초기화 시 한 번 설정 | `static { CACHE = Map.of(); }` | 앞선 선언 순서와 다른 클래스의 초기화 의존을 주의 |
| static 중첩 클래스 | 바깥 인스턴스가 필요 없는 보조 타입 | `static class Entry {}` | 바깥 인스턴스 멤버를 직접 쓸 수 없음 |
| 내부 클래스 | 바깥 특정 객체를 함께 다루는 타입 | `class Cursor {}` | 각 인스턴스가 바깥 객체를 암묵적으로 참조할 수 있음 |
| static import | 정적 멤버 이름으로 바로 호출 | `import static java.lang.Math.max;` | 이름 출처가 가려지면 일반 import보다 읽기 어려움 |
| 유틸리티 클래스 | 정적 순수 연산 모음 | `final class TextRules` + private 생성자 | 설정·상태·교체가 필요한 서비스를 넣지 않음 |
| Spring singleton 빈 | 컨테이너당 빈 정의별 공유 객체 | `@Service` + 생성자 주입 | 기본 scope가 singleton이라고 필드가 자동으로 thread-safe해지지 않음 |

아래 두 순수 Java 예제는 JDK 21에서 실제 실행했다.

### 예제 1 — static 공유값, 메서드 숨김과 오버라이드

```java
class StaticBasicsDemo {
    static int total;
    final int number = ++total;
    static class Parent {
        static String label() { return "Parent static"; }
        String kind() { return "Parent instance"; }
    }
    static class Child extends Parent {
        static String label() { return "Child static"; }
        @Override String kind() { return "Child instance"; }
    }
    public static void main(String[] args) {
        StaticBasicsDemo a = new StaticBasicsDemo(), b = new StaticBasicsDemo();
        System.out.printf("a=%d total=%d%n", a.number, total);
        System.out.printf("b=%d total=%d%n", b.number, total);
        Parent value = new Child();
        System.out.println(value.label());
        System.out.println(value.kind());
    }
}
```

```text
a=1 total=2
b=2 total=2
Parent static
Child instance
```

### 예제 2 — 부모/자식 초기화와 객체 생성 순서

```java
class InitializationOrderDemo {
    static class Parent {
        static int p = mark("Parent static field");
        static { System.out.println("Parent static block"); }
        int pInstance = mark("Parent instance field");
        { System.out.println("Parent instance block"); }
        Parent() { System.out.println("Parent constructor"); }
    }
    static class Child extends Parent {
        static int c = mark("Child static field");
        static { System.out.println("Child static block"); }
        int cInstance = mark("Child instance field");
        { System.out.println("Child instance block"); }
        Child() { System.out.println("Child constructor"); }
    }
    static int mark(String message) { System.out.println(message); return 1; }
    public static void main(String[] args) {
        System.out.println("main start");
        new Child();
        System.out.println("second instance");
        new Child();
    }
}
```

```text
main start
Parent static field
Parent static block
Child static field
Child static block
Parent instance field
Parent instance block
Parent constructor
Child instance field
Child instance block
Child constructor
second instance
Parent instance field
Parent instance block
Parent constructor
Child instance field
Child instance block
Child constructor
```

## 5. 자주 나는 에러와 해결

1. **`@Value`를 붙인 static 필드가 `null` 또는 기본값이다 →** Spring은 빈 객체를 생성해 의존성을 주입하지만 static 필드는 객체가 아니라 클래스에 속한다. **해결:** 생성자 매개변수에 `@Value`를 선언하고 `final` 인스턴스 필드에 보관한다. Spring의 `@Autowired` 후처리 코드도 static 필드/메서드는 지원하지 않는다고 로그를 남기고 주입 후보에서 제외한다.

2. **`non-static variable ... cannot be referenced from a static context` →** static 메서드에서 인스턴스 멤버를 `this` 없이 참조했다. **해결:** 해당 동작이 객체 상태를 필요로 하면 메서드를 인스턴스 메서드로 바꾸거나, 필요한 객체를 매개변수로 넘긴다. static 안에서 임의로 새 객체를 만드는 것으로 숨기지 않는다.

3. **`This static method cannot hide the instance method from ...` 또는 `overriding method is static` →** 부모의 인스턴스 메서드와 자식의 static 메서드는 같은 다형적 계약이 될 수 없다. **해결:** 두 메서드를 모두 인스턴스 메서드로 두어 오버라이드하거나, static 메서드 이름을 달리해 혼동을 없앤다.

4. **static 필드 값이 다음 요청/테스트에 남아 있다 →** 클래스 로더 수준의 공유 가변 상태를 썼다. Spring 컨텍스트가 바뀌어도 같은 클래스 로더를 사용하면 static 값이 남을 수 있다. **해결:** 요청·테스트별 데이터를 인스턴스/메서드 지역으로 옮기고, 실제 전역 영속 상태는 저장소로 관리한다. static 초기화가 테스트에서 한 번뿐이라는 점도 고려한다.

5. **`static final` 컬렉션을 수정했는데 컴파일된다 →** final은 참조 재대입만 금지하며 컬렉션 내용을 고정하지 않는다. **해결:** 수정이 필요 없으면 `List.of(...)`처럼 변경 불가 값을 만들고, 값 객체의 내부 참조도 외부에 가변 상태로 노출하지 않는다.

6. **placeholder 처리기 `@Bean` 설정 오류 →** `PropertySourcesPlaceholderConfigurer` 같은 `BeanFactoryPostProcessor`는 설정 클래스보다 먼저 필요해 메서드를 static으로 선언한다. **해결:** 인프라 예외에만 쓰고 일반 서비스는 생성자 주입한다.

## 6. 한 단계 더

원리만 요약하면, 인스턴스 필드는 객체마다 생기고 static 필드는 클래스 초기화 절차에 속한다. 클래스 로딩과 초기화는 다른 단계이며, JLS의 첫 능동 사용 조건에서 초기화된다. 컴파일 타임 상수 참조는 예외가 될 수 있다. static 메서드는 수신 객체가 없어 다형적 디스패치를 하지 않고, 같은 이름의 하위 메서드는 hiding이다. static 중첩 클래스는 바깥 인스턴스를 자동 보유하지 않지만 내부 클래스는 보유해 외부 객체 수명을 늘릴 수 있다. Spring singleton은 컨테이너 안의 객체 공유이고 static은 클래스 로더의 공유 상태다. 클래스 로더가 언로드될 수 있으므로 static이 항상 프로세스 종료까지 사는 것은 아니다.

**버전 변화:** Java 16 JEP 395는 내부 클래스 static 멤버 제한을 풀어 내부 record 타입을 허용했다. Java 25의 static 의미와 초기화 규칙은 JLS가 정한다.

**심화 문서:** 문법 기초 → P09, 클래스 로딩 → J13, 정적 팩토리 → P04, 동시성 → J10 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `static int count`와 `int count`의 차이는?

static 필드는 클래스 상태라 같은 클래스로 만든 모든 인스턴스가 같은 값을 읽고 쓴다. 인스턴스 필드는 객체마다 별도 슬롯이 생긴다. 객체 생성 수처럼 객체별 상태가 아닌 집계를 static으로 둘 수 있지만, 서버의 업무 상태를 무심코 전역 공유하면 요청 격리가 깨진다.

**꼬리질문:** Spring singleton 필드와 static 필드는 같은가? **답:** 아니다. singleton은 IoC 컨테이너 하나 안의 빈 객체 한 개이고, static은 클래스를 정의한 클래스 로더의 클래스 상태다.

### Q2. static 메서드에서 `this`를 쓸 수 없는 이유는?

static 호출에는 호출 대상 인스턴스가 정해져 있지 않다. 따라서 `this`라는 현재 수신 객체가 없고 인스턴스 필드를 직접 읽을 수도 없다. 인스턴스가 필요하면 명시적으로 매개변수로 전달해야 한다.

**꼬리질문:** `static void print(User user)`에서 `user.name()`은 가능한가? **답:** 가능하다. 전달받은 참조를 통해 접근하는 것은 현재 인스턴스 `this`를 쓰는 것이 아니다.

### Q3. static 메서드도 자식 클래스에서 오버라이드되는가?

아니다. static 메서드는 숨김(hiding) 대상이다. `Parent x = new Child(); x.staticCall()`은 `Child` 객체를 보고 고르지 않고 컴파일 시점 타입인 `Parent`의 메서드를 선택한다. 호출을 명료하게 하려면 클래스 이름으로 호출한다.

**꼬리질문:** 인스턴스 메서드는? **답:** 오버라이드된 인스턴스 메서드는 런타임 객체 타입에 따라 디스패치된다.

### Q4. 클래스 로드 직후 static 블록이 실행되는가?

정확히는 로딩만으로 초기화가 꼭 실행된다고 할 수 없다. 인스턴스 생성, static 메서드 호출, static 필드 대입이나 비상수 static 필드 사용 등 JLS가 정의한 능동 사용 직전에 초기화된다. 선언 부모가 먼저 초기화되고 선언 순서대로 필드/블록이 실행된다.

**꼬리질문:** `static final int X = 3`을 읽을 때 선언 클래스가 초기화되는가? **답:** X가 컴파일 타임 상수라면 그 참조만으로 초기화되지 않을 수 있다.

### Q5. `static final List`는 불변인가?

아니다. final이 막는 것은 필드 참조의 재대입이다. 리스트에 원소를 더하거나 지우는 것은 참조를 바꾸지 않으므로 가능하다. 불변 컬렉션 API나 방어적 복사를 써서 내부 상태 변경도 차단해야 한다.

**꼬리질문:** `static final String NAME = "Ada"`는? **답:** primitive/String의 상수 표현식인 final 필드는 컴파일 타임 상수가 될 수 있다. 객체 참조의 final 여부만으로는 컴파일 타임 상수가 아니다.

### Q6. Spring에서 `@Value`를 static 필드에 주입하면 왜 실패하는가?

`@Value` 처리는 빈 생성과 후처리 과정에서 빈 인스턴스의 구성에 값을 적용한다. static 필드는 객체가 아닌 클래스의 공유 상태라 정상적인 생성자 주입 대상이 아니다. 생성자 매개변수로 받고 `final` 필드에 담으면 컨테이너 수명과 의존성을 명시적으로 관리할 수 있다.

**꼬리질문:** 그럼 Spring 코드에서 static 메서드는 전부 금지인가? **답:** 아니다. 무상태 유틸리티 메서드는 적절하다. Spring 문서의 placeholder 후처리기처럼 컨테이너 초기화 단계상 static `@Bean`이 필요한 인프라 예외도 있다.

## 8. 참고문헌

- Understanding Class Members — https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html — static 필드와 메서드의 클래스 소속 의미를 확인했다.
- JLS §12.4 Initialization of Classes and Interfaces — https://docs.oracle.com/javase/specs/jls/se25/html/jls-12.html#jls-12.4 — 초기화가 일어나는 조건, 부모 초기화 순서, 동기화 절차를 확인했다.
- JLS §4.12.4 final Variables — https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.12.4 — 컴파일 타임 상수 변수의 조건을 확인했다.
- Nested Classes — https://docs.oracle.com/javase/tutorial/java/javaOO/nested.html — static 중첩 클래스와 내부 클래스의 바깥 인스턴스 참조 차이를 확인했다.
- Using `@Value` — https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/value-annotations.html — 생성자 매개변수 주입과 프로퍼티 해석, static placeholder 설정 빈을 확인했다.
- Bean Scopes — https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html — singleton이 컨테이너별 빈 정의당 단일 객체인 기본 scope임을 확인했다.
- `AutowiredAnnotationBeanPostProcessor.java` — https://raw.githubusercontent.com/spring-projects/spring-framework/main/spring-beans/src/main/java/org/springframework/beans/factory/annotation/AutowiredAnnotationBeanPostProcessor.java — Spring이 static 주입 필드와 메서드를 후보에서 제외하고 진단 로그를 남기는 구현을 확인했다.
- JEP 395: Records — https://openjdk.org/jeps/395 — Java 16에서 내부 클래스 static 멤버 제한을 완화한 변경을 확인했다.
