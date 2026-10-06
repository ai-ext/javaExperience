# P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도

> 애노테이션은 표시와 메타데이터일 뿐, 그 자체로 코드를 실행하지 않는다.
> 컴파일러·Spring 컨테이너·MVC·AOP 프록시·테스트 프레임워크가 읽을 때만 효과가 생긴다.
> 안 먹히면 애노테이션을 더 붙이지 말고, 읽는 주체와 실행 시점부터 확인한다.

## 1. 한 줄로 말하면

애노테이션은 선언부의 메타데이터다. 컴파일러·Spring 컨테이너·MVC·AOP·테스트 도구가 정해진 시점에 읽어 검사, 생성, 등록, 변환 또는 호출을 수행한다. @Transactional도 관리 빈을 프록시 경유로 호출할 때 적용된다.

실무에서 “애노테이션을 붙였는데 왜 아무 일도 없지?”라는 문제를 진단하려면 선언을 읽는 주체가 있는지, 그 주체가 동작하는 시점에 선언이 보이는지, 적용 대상이 조건을 만족하는지를 확인한다.

## 2. 당장 알아야 할 것

### 2.1 시점 지도

~~~mermaid
flowchart LR
    A["① 컴파일<br/>javac · 애노테이션 프로세서"] --> B["② 기동<br/>ApplicationContext · BeanFactory"]
    B --> C["③ 요청<br/>DispatcherServlet · MVC 전략"]
    C --> D["④ 메서드 호출<br/>Spring AOP 프록시"]
    E["⑤ 테스트 준비/실행<br/>Spring Test · Boot 테스트"] -.테스트 컨텍스트 구성.-> B
    E -.테스트 요청.-> C
~~~

한 애노테이션을 여러 주체가 다른 시점에 읽기도 한다. @Component는 기동 때 빈 정의가 되고, @Transactional은 프록시가 준비된 뒤 프록시 메서드 호출 때 트랜잭션을 연다.

### 2.3 컴파일 시점: 검사와 코드 생성은 다르다

@Override와 @FunctionalInterface는 각각 재정의와 함수형 인터페이스 조건을 컴파일 때 검사한다. 호출 시 동작을 더하지 않는다. Java 25 프로세서는 라운드 기반으로 생성 타입을 다음 라운드 입력으로 삼을 수 있다.

Lombok, MapStruct, QueryDSL은 설정된 프로세서 경로에서 구현체나 Q 타입을 생성한다. 라이브러리 의존성과 processor 의존성을 구분한다.

~~~kotlin
compileOnly("org.projectlombok:lombok")
annotationProcessor("org.projectlombok:lombok")
~~~

생성물이 없으면 ./gradlew clean compileJava 출력, build/generated/sources/annotationProcessor, IDE의 annotation processing 설정을 확인한다.

### 2.4 기동 시점: 애노테이션을 빈으로 바꾸는 일

@Component만 붙였다고 빈이 되지는 않는다. @SpringBootApplication 패키지의 하위가 기본 스캔 범위다. @Service, @Repository, @Controller도 같은 경로에서 발견되는 @Component 특수화다.

@Configuration/@Bean은 BeanDefinition을 등록하고, @Autowired와 @Value 계열 후처리기는 의존성과 값을 설정한다. 단일 생성자는 @Autowired를 생략할 수 있다. @Conditional은 클래스패스·사용자 빈·프로퍼티를 평가한다. 지정 starter 실측에서는 자동 구성 176개 적용, 113개 미적용이었다.

의존성 설정 뒤 @PostConstruct가 초기화 콜백으로 호출된다. Boot 4에서는 jakarta.annotation.PostConstruct를 사용한다. 외부 호출을 초기화에 넣으면 기동이 외부 상태에 묶인다.

### 2.5 요청 시점: MVC가 선언을 해석한다

Spring MVC의 RequestMappingHandlerMapping이 URL·HTTP 메서드로 핸들러를 찾고, RequestMappingHandlerAdapter가 인자를 준비해 호출한다.

| 메서드 선언 | 주 처리 주체 | 입력 처리 |
|---|---|---|
| @PathVariable, @RequestParam | 각 argument resolver | 경로·쿼리 값을 읽고 대상 타입으로 변환 |
| @RequestBody, @Valid | RequestResponseBodyMethodProcessor, HttpMessageConverter, Bean Validation | 본문 역직렬화 후 제약 검증 |
| @ExceptionHandler | ExceptionHandlerExceptionResolver | 처리 중 예외에 맞는 핸들러 선택 |

@Valid는 제약 자체가 아니라 중첩 객체 검증 표시다. 실제 규칙은 @NotBlank, @Min 등이다. Framework 7 MVC는 파라미터 검증과 메서드 검증에 서로 다른 예외를 던질 수 있으므로 둘 다 처리한다.

### 2.6 메서드 호출 시점: 프록시를 거쳐야 advice가 적용된다

@Transactional, @Async, @Cacheable, @PreAuthorize는 기능별 인프라가 활성화된 Spring 빈을 프록시로 감싸 호출 때 interceptor/advice를 적용한다.

~~~text
호출자 → 프록시 진입 → 일치하는 advice/interceptor → 대상 메서드 → 반환/예외 처리 → 호출자
~~~

실측의 productService 타입은 ProductService$$SpringCGLIB$$0이고 productRepository에 의존한다. AOP/CGLIB 설정은 적용, JDK 설정은 미적용이었다. Boot 기본은 CGLIB이며 spring.aop.proxy-target-class=false로 JDK 프록시를 선택한다.

this.otherMethod() 호출은 프록시를 우회한다. private·final 메서드는 클래스 기반 프록시가 재정의할 수 없다. 공개 서비스 경계를 두고 프록시를 통과시킨다. 상세 원리는 → S02 참조.

| 애노테이션 | 누가 읽나 | 언제 | 결과 | 대표적으로 안 먹히는 이유 |
|---|---|---|---|---|
| @Override | javac | 컴파일 | 재정의 오류 검사 | 실제 상위 메서드와 일치하지 않음 |
| @Component 계열 | 스캐너와 구성 파서 | 컨텍스트 구성 | 빈 정의 등록 | 패키지가 스캔 범위 밖 |
| @Bean | 구성 클래스 파서 | 컨텍스트 구성 | 팩토리 메서드 빈 정의 | 구성 클래스가 로딩되지 않음 |
| @Value, @ConfigurationProperties | Spring 후처리기, Boot 바인더 | 빈 설정 | 환경값 주입·바인딩 | 키·등록·prefix 불일치 |
| @Conditional 계열 | Boot 조건 평가 | 자동 구성 선택 | 설정/빈 포함 또는 제외 | 클래스패스·프로퍼티 조건 불일치 |
| @PostConstruct | CommonAnnotationBeanPostProcessor | 빈 초기화 | 초기화 메서드 호출 | javax import, 대상이 빈이 아님 |
| @RequestMapping | RequestMappingHandlerMapping | 요청 매칭 | 경로와 메서드를 연결 | 컨트롤러 미등록, URL 불일치 |
| @RequestBody, @PathVariable | MVC resolver와 converter | 요청 처리 | HTTP 입력을 인자로 변환 | 미디어 타입·이름·타입 불일치 |
| @Valid | MVC와 Bean Validation | 인자 처리 뒤 메서드 호출 전 | 제약 위반 보고 | 제약 또는 provider 누락 |
| @Transactional | 트랜잭션 advisor/프록시 | 프록시 메서드 호출 | 트랜잭션 경계 적용 | 빈 아님, self-invocation, 인프라 누락 |
| @Async, @Cacheable | 비동기·캐시 interceptor | 프록시 호출 | 실행기 전달, 캐시 적용 | 활성화 누락, self-invocation |
| @PreAuthorize | 메서드 보안 advisor | 프록시 호출 | 권한식 평가 | 보안 미활성화, 프록시 우회 |
| @SpringBootTest, @WebMvcTest | 테스트 부트스트랩 | 컨텍스트 생성 | 전체 또는 MVC 슬라이스 구성 | 범위 또는 의존성 착오 |
| @MockitoBean | Spring Test bean override | 테스트 컨텍스트 생성 | 빈을 Mockito mock으로 교체 | 후보 중복, 슬라이스 범위 오해 |

### 2.7 안 먹힐 때는 이 순서로 진단한다

1. 기대한 동작을 컴파일·기동·요청·호출·테스트 중 하나로 분류하고 읽는 주체를 찾는다.
2. 프로세서/starter/활성화 설정과 대상 존재 여부를 확인한다. 빈은 /actuator/beans에서 이름·타입을 본다.
3. Boot --debug 조건 보고서에서 조건 불충족 이유를 확인한다.
4. URL 매핑, 프록시 경유, 테스트 슬라이스와 협력 빈 구성을 점검한다.

## 3. 따라 하기

Spring Initializr에서 Boot 4.1.1, Java 25, Gradle Kotlin, Web MVC를 고른다. 예제는 (미실행)이다.

### 1단계: 프로젝트와 AOP 의존성

Spring Initializr에서 Java, Gradle Kotlin, Boot 4.1.1, Web MVC를 선택한다. 생성된 build.gradle.kts의 dependencies에 다음을 추가한다.

~~~kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-aspectj")
}
~~~

Maven은 parent를 org.springframework.boot:spring-boot-starter-parent:4.1.1로 두고 spring-boot-starter-webmvc, spring-boot-starter-aspectj를 dependencies에 추가한다.

**확인 방법:** ./gradlew dependencies --configuration runtimeClasspath로 두 starter가 런타임 경로에 있는지 확인한다. Maven이면 ./mvnw dependency:tree를 확인한다.

### 2단계: 서비스 작성

기본 패키지는 com.example.p27로 통일하고 Initializr가 만든 애플리케이션 클래스의 하위에 둔다.

파일: src/main/java/com/example/p27/GreetingService.java
~~~java
package com.example.p27;

import org.springframework.stereotype.Service;

@Service
public class GreetingService {
    public String greet(String name) {
        return "Hello, " + name;
    }
}
~~~

**확인 방법:** ./gradlew bootRun으로 실행한다. 컴파일 성공은 확인되지만 아직 URL이 없으므로 응답은 다음 단계에서 확인한다.

### 3단계: 읽힐 애노테이션 정의

애노테이션은 메서드에만 붙이고 런타임까지 남긴다. RetentionPolicy.RUNTIME은 AOP가 실행 중 표시를 찾아야 하기 때문이다.

파일: src/main/java/com/example/p27/TraceCall.java
~~~java
package com.example.p27;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TraceCall {
}
~~~

**확인 방법:** 메서드 이외 위치에 붙이면 @Target 제약으로 컴파일 오류가 난다. 이 선언만 추가해도 로그는 생기지 않는다. 아직 읽는 주체가 없기 때문이다.

### 4단계: Aspect로 프록시 호출 감싸기

파일: src/main/java/com/example/p27/TraceCallAspect.java
~~~java
package com.example.p27;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TraceCallAspect {
    private static final Logger log =
            LoggerFactory.getLogger(TraceCallAspect.class);

    @Around("@annotation(com.example.p27.TraceCall)")
    public Object trace(ProceedingJoinPoint invocation) throws Throwable {
        String method = invocation.getSignature().toShortString();
        try {
            log.info("시작 {}", method);
            return invocation.proceed();
        } catch (Throwable error) {
            log.warn("실패 {}", method, error);
            throw error;
        } finally {
            log.info("종료 {}", method);
        }
    }
}
~~~

@Aspect는 advice 선언이다. AspectJ가 클래스패스에 있으면 Boot가 프록시 인프라를 구성하므로 @EnableAspectJAutoProxy를 붙이지 않는다.

**확인 방법:** 재기동해 Aspect 빈이 생성되는지 확인한다. 서비스에 표식을 붙이기 전에는 일치하는 호출이 없어 로그가 없는 것이 정상이다.

### 5단계: 표식을 붙이고 HTTP 호출

GreetingService.greet에 @TraceCall을 붙이고 컨트롤러를 추가한다.

파일: src/main/java/com/example/p27/GreetingController.java
~~~java
package com.example.p27;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {
    private final GreetingService greetingService;

    public GreetingController(GreetingService greetingService) {
        this.greetingService = greetingService;
    }

    @GetMapping("/greet")
    public String greet(@RequestParam(defaultValue = "world") String name) {
        return greetingService.greet(name);
    }
}
~~~

GreetingService.java를 다음 내용으로 바꾼다.

~~~java
package com.example.p27;

import org.springframework.stereotype.Service;

@Service
public class GreetingService {
    @TraceCall
    public String greet(String name) {
        return "Hello, " + name;
    }
}
~~~

**확인 방법:** curl 'http://localhost:8080/greet?name=Spring'은 Hello, Spring을 반환하고 로그에 시작/종료가 찍힌다. MVC가 파라미터를 만들고 서비스 프록시가 advice를 적용한다. 실패하면 빈 등록, Aspect 스캔, 프록시 경유를 확인한다. 예제는 (미실행)이다.

### 6단계: MVC 슬라이스 테스트에서 협력 빈 교체

컨트롤러 테스트는 MVC 관련 빈만 올리는 @WebMvcTest와 서비스 대역용 @MockitoBean을 조합한다. 이 작업공간의 practice/starter에는 같은 패턴의 완성 예제가 src/test/java/com/example/practice/product/ProductControllerTest.java에 있다.

**확인 방법:** cd practice/starter 후 ./gradlew test --tests '*ProductControllerTest'를 실행한다. MockMvc로 응답 상태·본문을 확인한다. 이 슬라이스는 실제 ProductService와 AOP 전체를 검증하지 않는다. Spring 테스트는 이 문서에서 실행하지 않았다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| @Component 계열 | 클래스 스캔으로 빈 등록 | @Service class OrderService | 스캔 패키지를 확인한다. |
| @Autowired / 생성자 주입 | 빈 의존성 연결 | OrderService(Repository repository) | 생성자 하나면 생략 가능하다. |
| @PostConstruct | 의존성 설정 뒤 초기화 | void warmUp() | 무거운 기동 작업에 주의한다. |
| @RequestMapping 계열 | HTTP 요청 연결 | @GetMapping("/orders/{id}") | 컨트롤러와 HTTP method를 확인한다. |
| @RequestBody / @Valid | 본문 변환과 검증 | @Valid 요청 DTO | DTO 제약과 validation 의존성이 필요하다. |
| @Transactional | 트랜잭션 advisor 선택 | 서비스 공개 메서드 | 프록시 호출이어야 한다. |
| @SpringBootTest | 통합 컨텍스트 테스트 | 전체 앱 컨텍스트 | 기본은 서버를 띄우지 않는다. |
| @WebMvcTest / @MockitoBean | MVC 슬라이스와 mock | 특정 컨트롤러 테스트 | 업무 빈은 슬라이스에서 빠질 수 있다. |

메타 애노테이션으로 사용자 정의 stereotype을 만들 수는 있지만, 새 표식이 새 실행 동작을 뜻하지는 않는다. 효과를 만들려면 프로세서, 빈 후처리기, MVC 확장점, AOP advice 등 해당 독자를 구현하거나 등록한다.

## 5. 자주 나는 에러와 해결

1. **No qualifying bean of type ... available →** 스캔되지 않았거나 테스트 슬라이스에서 빠졌다. → 패키지 범위와 @Import/@MockitoBean을 확인한다.

2. **@Transactional인데 트랜잭션이 없다 →** 직접 생성 또는 내부 호출로 프록시를 건너뛰었다. → 컨테이너 빈을 주입하고 외부 호출 경계에 둔다.

3. **검증 오류가 통과한다 →** DTO 제약 또는 Validation provider가 없다. → @Valid 위치와 Boot validation starter를 확인한다.

4. **Lombok/MapStruct 생성 코드가 없다 →** 프로세서 경로나 IDE 처리가 빠졌다. → Gradle 선언과 생성 디렉터리를 확인한다.

5. **@WebMvcTest에서 서비스 빈이 없다 →** 슬라이스는 업무 빈을 로드하지 않는다. → @MockitoBean으로 대체하거나 @SpringBootTest를 쓴다.


## 6. 한 단계 더

처리 주체와 시점을 따라가면 원인이 보인다. 컴파일러/프로세서는 검사·생성, Spring은 빈 구성, MVC는 요청 변환, AOP는 프록시 advice, 테스트 애노테이션은 컨텍스트 범위를 맡는다.

애노테이션 목록과 용도 → P03, Retention·리플렉션 내부 → J06, AOP 프록시 → S02, Boot 자동 구성 원리 → S03 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. @Transactional을 붙이면 바로 트랜잭션이 시작되나?

아니다. 컨테이너가 빈을 프록시로 노출하고 프록시 호출 때 interceptor가 경계를 연다. 직접 생성과 내부 self-invocation은 적용을 우회할 수 있다.

**꼬리질문: 같은 클래스 안에서 다른 @Transactional 메서드를 부르면?** 프록시를 우회하므로 별도 전파 설정이 적용되지 않는다. 경계를 다른 빈으로 옮긴다.

### Q2. @Component가 붙었는데 빈을 찾지 못하는 이유는?

애노테이션이 스캔 범위를 넓혀주지 않는다. @SpringBootApplication의 하위 패키지인지 확인하고 빈 목록에서 등록 여부를 찾는다.

**꼬리질문: @Service와 @Component는 다른 등록 방식인가?** @Service는 같은 스캔 대상인 stereotype 특수화다. 서비스 역할을 드러낸다.

### Q3. @Override와 @Transactional의 시점 차이는?

@Override는 javac가 컴파일 때 확인한다. @Transactional은 Spring 프록시를 준비하고 메서드 호출 때 interceptor가 동작한다.

**꼬리질문: Lombok은 검사만 하나?** 아니다. 컴파일 과정에서 코드를 생성/변환한다.

### Q4. @RequestBody와 @PathVariable은 누가 메서드 인자로 바꾸나?

Spring MVC argument resolver가 인자를 만든다. @RequestBody는 HttpMessageConverter가 본문을 읽고 @PathVariable은 경로 값을 변환한다.

**꼬리질문: @Valid 자체가 공백 금지를 뜻하나?** 아니다. 공백 금지는 DTO의 @NotBlank 같은 제약이 표현한다.

### Q5. @PostConstruct가 호출되지 않을 수 있는 이유는?

대상이 Spring 빈인지, jakarta.annotation.PostConstruct를 import했는지 확인한다. 초기화 후처리기가 콜백을 실행한다.

**꼬리질문: 초기화에서 원격 서비스를 호출해도 괜찮나?** 기동이 외부 장애에 묶인다. 필수 여부와 타임아웃·실패 정책을 정한다.

### Q6. @WebMvcTest와 @SpringBootTest는 어떻게 고르나?

MVC 매핑·바인딩은 @WebMvcTest, 서비스와 자동 구성의 통합 검증은 @SpringBootTest로 확인한다. 슬라이스 테스트는 업무 서비스를 mock으로 제공한다.

**꼬리질문: @SpringBootTest 기본이면 포트가 열리나?** 아니다. 서버가 필요하면 RANDOM_PORT 또는 DEFINED_PORT를 지정한다.

## 8. 참고문헌

- Classpath Scanning and Managed Components — https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html — stereotype 및 빈 등록.
- Container Extension Points — https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html — BeanPostProcessor 시점.
- Using @Autowired — https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html — 생성자 주입.
- Using @PostConstruct and @PreDestroy — https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/postconstruct-and-predestroy-annotations.html — 초기화 콜백.
- Proxying Mechanisms — https://docs.spring.io/spring-framework/reference/core/aop/proxying.html — 프록시 종류와 제약.
- Aspect-Oriented Programming / Build Systems — https://docs.spring.io/spring-boot/reference/features/aop.html — Boot의 기본 CGLIB 설정, AspectJ 자동 프록시; https://docs.spring.io/spring-boot/reference/using/build-systems.html — Boot 4.1 starter 이름.
- Handler Methods — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html — MVC 메서드 인자 처리.
- Validation — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html — 검증 단계와 예외.
- Auto-configuration — https://docs.spring.io/spring-boot/reference/using/auto-configuration.html — 조건 보고서.
- Externalized Configuration — https://docs.spring.io/spring-boot/reference/features/external-config.html — @Value와 구조화 설정 바인딩.
- Testing Spring Boot Applications — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html — 테스트 컨텍스트와 포트 설정.
- @WebMvcTest API (Boot 4.1.1) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/webmvc/test/autoconfigure/WebMvcTest.html — MVC slice.
- @MockitoBean and @MockitoSpyBean — https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html — 테스트 빈 교체.
- JLS Chapter 9: Interfaces (Java SE 25) — https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html — 애노테이션과 함수형 인터페이스.
- Processor API (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.compiler/javax/annotation/processing/Processor.html — 프로세서 라운드.
