# S02. AOP와 프록시

> 3줄 요약 — AOP는 로깅·메트릭처럼 여러 객체에 흩어지는 관심사를 한곳에 모은다.
> Spring AOP는 빈 참조를 프록시로 감싸 메서드 호출 경계에서 advice를 실행한다. 따라서 외부에서 프록시를 거치는 호출만 가로챈다.
> Boot 4.1은 기본적으로 CGLIB 프록시를 선택하며, 인터페이스 계약을 우선할 때는 JDK 프록시로 바꿀 수 있다.

## 1. 왜 알아야 하나

`@Aspect`에 `@Around`를 붙였는데도 같은 객체의 내부 호출에는 로그가 안 남거나, `final` 메서드에서 메트릭이 빠지는 경우가 있다. Spring AOP의 경계는 애노테이션이 아니라 “호출이 프록시를 통과했는가”다.

또한 프록시가 구현 클래스가 아니라 인터페이스 타입으로만 보이는 상황도 있다. JDK 동적 프록시는 구현한 인터페이스를 통해 호출되므로, 구현 클래스에만 있는 메서드나 구현 타입 주입이 기대와 다를 수 있다. 반대로 CGLIB는 클래스를 상속하므로 `final` 클래스는 프록시화하지 못하고 `final` 메서드는 재정의하지 못한다. 기본 프록시 종류와 제약을 알면 런타임 프록시 오류, AOP 누락, 테스트와 운영 간 차이를 좁힐 수 있다.

## 2. 핵심 개념

AOP(Aspect-Oriented Programming)는 핵심 업무 코드 여러 곳에 흩어지는 공통 관심사를 별도의 모듈로 모으는 방식이다. AOP의 모듈화 단위는 aspect다. 로깅, 메트릭, 보안 검사, 트랜잭션 경계가 전형적인 관심사다. 이 문서는 공통 AOP와 프록시 원리를 다루며, `@Transactional`의 전파·롤백 규칙은 → S08 참조.

| 용어 | 뜻 | 기억할 점 |
|---|---|---|
| Aspect | 횡단 관심사와 실행 규칙을 묶은 모듈 | Spring에서는 보통 `@Aspect` 클래스로 표현 |
| Advice | 매칭된 시점에 실행할 동작 | `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around` |
| Pointcut | 어떤 조인 포인트에 적용할지 나타내는 조건식 | `execution(...)`, `within(...)`, `@annotation(...)` 등 |
| Join point | advice가 끼어들 수 있는 프로그램 실행 지점 | Spring AOP에서는 Spring 빈의 메서드 실행만 지원 |
| Target | 실제 업무 객체 | 프록시가 위임하는 원본 객체 |
| Proxy | 호출을 가로채 advice 체인을 태운 뒤 target에 위임하는 객체 | 호출자가 빈을 얻어 사용하는 참조 |
| Advisor | pointcut과 advice의 조합 | 프레임워크의 자동 프록시 생성기가 적용 후보를 판정할 때 사용 |

헷갈리는 개념은 다음처럼 나눠 생각한다.

| 구분 | Spring AOP | AspectJ weaving |
|---|---|---|
| 적용 방식 | 런타임 프록시로 빈 메서드 호출을 가로챔 | 컴파일, 후처리, 또는 클래스 로딩 때 바이트코드를 직조(weave) |
| 적용 범위 | Spring 컨테이너가 관리하는 객체의 메서드 실행 | 설정한 클래스 바이트코드의 실행 지점. 생성자·필드 접근 등도 가능 |
| 내부 호출 | `this.other()`는 프록시를 다시 통과하지 않음 | 직조된 코드의 실행 지점이면 내부 호출도 적용 가능 |
| 운영 복잡도 | 비교적 단순. 별도 위버 없이 IoC 프록시 사용 | 위빙 플러그인·위버·에이전트와 빌드/클래스로더 설정 필요 |

`@Aspect` 애노테이션을 사용한다고 곧바로 AspectJ 위빙이 되는 것은 아니다. Spring은 AspectJ 애노테이션 문법과 pointcut 표현식 일부를 읽어 Spring AOP 프록시를 만들 수 있다. 프록시 대신 실제 AspectJ 위빙을 사용하려면 컴파일 시점 위빙이나 load-time weaving을 따로 구성해야 한다.

## 3. 내부 동작·원리

### 프록시 호출 흐름

일반적인 빈 자동 프록시 구성은 `BeanPostProcessor` 기반이다. 컨테이너는 빈을 생성하고 의존성을 주입한 뒤 초기화 콜백을 처리한다. 자동 프록시 생성기는 빈을 대상으로 적용 가능한 advisor를 찾고, 대상이면 초기화 후 반환할 객체를 프록시로 감싼다. 애플리케이션의 다른 빈은 컨테이너가 반환한 프록시 참조를 주입받는다.

```text
빈 생성·주입·초기화
        │
        ▼
BeanPostProcessor / 자동 프록시 생성기
        │  적용 가능한 advisor가 있나?
        ├─ 아니오 ──► 원본 빈 반환
        └─ 예 ──────► 프록시 생성 후 반환
                          │
호출자 ── method(args) ──► 프록시
                          │  pointcut 매칭, advice 체인 실행
                          ▼
                       target 메서드
                          │
                          ▼
                 반환값 또는 예외를 프록시로 전달
```

프록시는 보통 target을 대체해 업무 코드를 복제하는 객체가 아니다. 호출을 받아 interceptor/advice를 실행한 뒤 실제 메서드를 호출한다. Spring AOP의 pointcut은 결국 프록시가 관찰할 수 있는 메서드 실행을 고른다. 객체가 컨테이너 밖에서 `new`로 만들어졌거나, 호출 경로가 프록시 참조를 지나지 않으면 자동으로 조언을 적용할 지점이 없다.

### JDK 동적 프록시와 CGLIB

JDK 프록시는 지정한 인터페이스들을 구현하는 런타임 클래스를 만들고, 인터페이스 메서드 호출을 `InvocationHandler.invoke`로 전달한다. 그래서 호출 가능한 타입의 기준은 프록시가 구현한 인터페이스다. Framework의 기본 규칙은 인터페이스가 있으면 JDK 프록시, 없으면 CGLIB다. 단, 전역 설정이 프록시 종류를 강제할 수 있고 Spring Boot는 CGLIB를 기본으로 활성화한다.

CGLIB는 target 클래스의 하위 클래스를 런타임에 만들어 오버라이드 가능한 메서드를 가로챈다. 클래스 자체가 `final`이면 상속할 수 없다. `final` 메서드는 재정의할 수 없고 `private` 메서드는 하위 클래스에서 재정의할 수 없으므로 조언 대상이 될 수 없다.

부모 클래스의 다른 패키지에 선언된 package-private 메서드처럼 하위 클래스에서 사실상 접근할 수 없는 메서드도 대상이 아니다. Boot 기본값이 CGLIB라고 해서 모든 메서드에 AOP가 붙는 것은 아니다.

| 선택 기준 | JDK 동적 프록시 | CGLIB 프록시 |
|---|---|---|
| 생성 방식 | 구현 인터페이스의 런타임 대리 객체 | target 클래스의 런타임 하위 클래스 |
| 메서드 접근 계약 | 프록시가 구현한 인터페이스 메서드 | 재정의 가능한 메서드 |
| 대표 제약 | 구현 타입에만 선언된 메서드는 인터페이스 참조로 호출 불가 | `final` 클래스·메서드, `private` 메서드 제한 |
| Boot 4.1 기본 | `spring.aop.proxy-target-class=false`로 선택 | 기본값. `spring.aop.proxy-target-class=true`와 동일한 방향 |

### self-invocation이 빠지는 이유

```text
외부 호출: caller ──► proxy ──► advice ──► target.methodA()
                                      │
target.methodA 안에서 this.methodB() 호출
                                      └──────────────► target.methodB()
                                                       (proxy 우회)
```

`methodA()`가 프록시를 통해 호출되어 조언을 받아도, 그 안의 `this.methodB()`에서 `this`는 target 객체 자신이다. target 내부에서 프록시 참조를 다시 조회하지 않으므로 `methodB()`는 advice 체인 밖에서 직접 실행된다. 이 원리는 CGLIB를 쓰는지 JDK 프록시를 쓰는지와 무관하다. 프록시 구현 종류를 바꾸는 것만으로 self-invocation은 해결되지 않는다.

기본 해결책은 조언을 받아야 하는 동작을 별도 Spring 빈으로 옮겨 빈 간 호출이 프록시 경계를 지나게 하는 것이다. 구조상 분리가 불가능하다면 자기 자신 프록시 참조를 주입하거나 `AopContext.currentProxy()`를 쓸 수 있지만, 순환 의존·프록시 결합·`exposeProxy` 설정 등 복잡성이 따라온다. 내부 호출 자체까지 위빙해야 하는 요구라면 AspectJ 위빙을 검토한다.

### Advice 순서

서로 다른 aspect의 우선순위는 `@Order` 또는 `Ordered`로 정할 수 있다. 숫자가 낮을수록 우선순위가 높다. 중첩된 `@Around` advice라면 우선순위가 높은 aspect가 바깥에서 먼저 진입하고, `proceed()` 이후에는 역순으로 빠져나온다.

`@Order`는 빈 생성 순서를 지정하지 않는다. 같은 aspect 안에 선언한 여러 advice 메서드의 실행 순서에도 의존하지 말고 순서 제어가 필요하면 aspect를 나누어 각각 순서를 지정한다.

## 4. 코드로 확인

### 예제 1 — JDK 프록시의 호출 위임 (순수 Java, 실행 완료)

다음 프로그램은 인터페이스 호출이 `InvocationHandler`로 전달되는 구조를 보인다. Spring은 이 기본 프록시 앞뒤에 advisor 판정과 interceptor 체인을 추가한다.

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class ProxyDemo {
    interface GreetingService {
        String greet(String name);
    }

    static final class GreetingServiceImpl implements GreetingService {
        @Override
        public String greet(String name) {
            System.out.println("target: " + name);
            return "Hello, " + name;
        }
    }

    public static void main(String[] args) {
        GreetingService target = new GreetingServiceImpl();
        InvocationHandler handler = (proxy, method, arguments) -> {
            System.out.println("before: " + method.getName());
            Object result = method.invoke(target, arguments);
            System.out.println("after: " + method.getName());
            return result;
        };
        GreetingService proxy = (GreetingService) Proxy.newProxyInstance(
                GreetingService.class.getClassLoader(),
                new Class<?>[]{GreetingService.class},
                handler);

        System.out.println("result: " + proxy.greet("Ada"));
    }
}
```

JDK 21 실행 출력:

```text
before: greet
target: Ada
after: greet
result: Hello, Ada
```

`Proxy.newProxyInstance`는 인터페이스 구현 프록시를 만들고, 호출을 handler로 전달한다. 실제 Spring은 여기에 여러 advisor와 interceptor를 적용한다.

### 예제 2 — 실행 시간 로깅 aspect

Boot 애플리케이션은 `spring-boot-starter-aop`를 포함하면 AOP 자동 설정을 이용할 수 있다. 순수 Spring Framework 구성에서는 아래 설정처럼 자동 프록시 기능을 켠다. pointcut은 `com.example.order` 하위 패키지의 public 메서드 실행을 선택한다.

```java
package com.example.order;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(10)
public class ExecutionLogAspect {
    private static final Logger log = LoggerFactory.getLogger(ExecutionLogAspect.class);

    @Around("execution(public * com.example.order..*(..))")
    public Object logExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long started = System.nanoTime();
        try {
            return joinPoint.proceed();
        } finally {
            long elapsedMicros = (System.nanoTime() - started) / 1_000;
            log.debug("{} took {} µs", joinPoint.getSignature().toShortString(), elapsedMicros);
        }
    }
}
```

`finally`이므로 정상 반환과 예외 종료 모두 시간이 기록된다. 실제 서비스에서는 모든 호출을 무조건 로그로 남기기보다 관심 패키지와 로그 레벨을 제한한다. `proceed()` 생략은 원래 메서드를 건너뛰고, 중복 호출은 업무 부작용을 반복한다. Spring 설정을 직접 구성한다면 다음처럼 활성화한다.

```java
package com.example.order;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@EnableAspectJAutoProxy
class AopConfiguration {}
```

Spring 코드 예제 (미실행). Boot 4.1 / Framework 7 API 기준이다.

### 예제 3 — Micrometer 메트릭과 빈 경계

`Timer`에 동적 주문 번호나 전체 인자 문자열을 태그로 넣으면 메트릭 시계열 수가 폭증할 수 있다. 메서드 전체를 하나의 타이머로 모으거나, 제한된 종류의 태그만 사용한다.

```java
package com.example.order;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceMetricsAspect {
    private final MeterRegistry registry;

    public ServiceMetricsAspect(MeterRegistry registry) {
        this.registry = registry;
    }

    @Around("execution(public * com.example.order..*(..))")
    public Object measure(ProceedingJoinPoint joinPoint) throws Throwable {
        Timer.Sample sample = Timer.start(registry);
        try {
            return joinPoint.proceed();
        } finally {
            sample.stop(registry.timer("app.service.duration"));
        }
    }
}
```

타이머는 예외가 발생해도 완료된다. 성공·실패를 나누는 값이 필요하다면 제한된 값의 결과 태그를 적용하고, 고유 ID나 임의 입력값은 태그로 넣지 않는다. 이 예제는 기본 `MeterRegistry`와 `Timer.Sample`을 사용하는 Spring 코드다 (미실행).

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Framework 2.0부터 `@Order` 제공:** 같은 우선순위로 취급되던 컴포넌트 가운데 실행 우선순위를 표현할 방법이 필요했다. 낮은 값이 높은 우선순위이며, 현재도 기본은 `Ordered.LOWEST_PRECEDENCE`다. [Order API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html)
- **Spring Framework 4.0부터 다양한 컴포넌트와 컬렉션 주입에 애노테이션 기반 정렬 지원:** 클래스패스 등록만으로 조립되는 컴포넌트 목록에 순서를 반영하기 어려웠던 점을 보완했다. 이 정렬은 싱글턴 시작 순서와 별개다. 같은 API 문서의 버전 설명을 참고한다.
- **Spring Framework 7.0:** 프록시 설정을 통합해 여러 자동 프록시 처리기가 전역 기본 설정을 일관되게 공유하고, `@Proxyable`을 빈 메서드나 컴포넌트에 붙여 개별 프록시 종류 또는 인터페이스를 선택할 수 있다. 전역으로 프록시 타입을 강제하던 설정의 거친 범위를 빈 단위로 좁히려는 변화다. [프록시 메커니즘 문서](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- **Spring Boot 4.1.1 (기준일):** 자동 설정은 CGLIB를 기본으로 하며 `spring.aop.proxy-target-class=false`로 JDK 프록시를 선택한다. Framework의 일반 기본 동작(인터페이스가 있으면 JDK)과 Boot 기본 설정을 혼동하면 안 된다. [Boot AOP 문서](https://docs.spring.io/spring-boot/reference/features/aop.html)

AspectJ는 compile-time, post-compile, load-time 위빙을 제공한다. 클래스 파일을 언제 직조하는가는 빌드와 클래스 로딩 환경에 따라 정하는 배포 선택이며, Spring AOP 프록시와 다른 실행 모델이다. 자세한 구성은 AspectJ LTW 문서를 참고한다.

## 6. 실무 가이드

- **기본값 추천:** Boot 애플리케이션에서는 CGLIB 기본값을 그대로 사용하고, 구현 세부보다 인터페이스 계약으로 서비스를 주입한다. 클래스 기반 프록시로 통일하면 인터페이스가 없는 빈도 프록시화할 수 있어 Boot 기본 설정과 일치한다.
- 빈을 인터페이스에만 의존시키고 구현 타입 노출을 피하고 싶으면 `spring.aop.proxy-target-class=false`로 JDK 프록시를 선택한다. 구현체만 가진 메서드는 프록시 참조에서 사용할 수 없으므로 필요한 동작을 인터페이스에 선언한다.
- pointcut은 패키지·애노테이션 등 안정된 경계로 제한한다.
- 공통 로깅은 업무 결과와 예외를 바꾸지 않는 `@Around` 또는 `@After`로 구현한다. 원래 예외를 삼키거나 반환값을 변형하지 않도록 `proceed()`의 반환값과 예외를 그대로 전달한다.
- 메트릭은 고정된 이름과 유한한 태그 값을 쓴다. 메서드명 태그 정도로 경계를 제한하고, 요청·사용자 식별자와 임의 입력값은 태그로 쓰지 않는다.
- `@Order`가 필요한 독립적인 aspect에만 우선순위를 명시한다. 값이 낮은 aspect가 바깥에서 먼저 진입하므로 보안/검증/관측의 진입과 종료 순서를 이 기준으로 설계한다.
- 내부 호출까지 가로채야 한다면 우선 빈 책임을 나눠 외부 빈 호출로 만든다. 그 구조가 도메인 모델을 해치고 더 넓은 join point가 필요할 때만 AspectJ 위빙을 검토한다.

## 7. 함정·안티패턴

1. **내부 호출에 advice가 없음 →** `this.other()`가 target 안에서 직접 실행되어 프록시를 통과하지 않는다 → 조언 대상 동작을 별도 빈으로 옮기거나 필요한 경우 위빙을 선택한다.
2. **`final`/`private` 메서드에 붙인 advice가 동작하지 않음 →** CGLIB 하위 클래스는 해당 메서드를 override할 수 없다 → public/protected 등 프록시가 가로챌 수 있는 메서드 경계를 설계하고, 필요한 로직을 분리한다.
3. **`@Aspect` 클래스를 만들었지만 아무 로그도 안 나옴 →** aspect가 컨테이너 빈이 아니거나 pointcut이 빈 메서드와 일치하지 않는다 → `@Component`/`@Bean`으로 등록하고, 실제 프록시를 통과하는 메서드 시그니처와 패키지를 확인한다.
4. **구현 클래스 주입이 실패하거나 구현체 고유 메서드를 못 찾음 →** JDK 프록시 참조는 인터페이스 타입이다 → 주입 타입을 인터페이스로 통일하거나 Boot 기본 CGLIB를 쓰고, 구현체 세부 메서드 호출을 제거한다.
5. **`@Order`를 줬는데 시작 순서가 바뀌지 않음 →** `@Order`는 advice/정렬 우선순위를 지정하며 빈 초기화 순서를 제어하지 않는다 → 시작 의존성은 의존 관계와 `@DependsOn` 등 별도 수단으로 표현한다.
6. **메트릭 시계열이 끝없이 늘어남 →** 요청 ID·주문번호 같은 고유값을 태그로 사용했다 → 유한한 태그만 허용하고 이미 생긴 고카디널리티 시계열은 수집 설정에서 정리한다.
7. **`@Aspect`는 곧 AspectJ 위빙이라고 생각함 →** 애노테이션 문법을 쓰더라도 Spring은 기본적으로 프록시를 만든다 → 생성자·필드 접근·내부 호출이 필요하면 위빙을 명시적으로 설정한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. Spring AOP의 join point는 무엇이며 AspectJ와 어떻게 다른가?

Spring AOP는 Spring 빈의 메서드 실행만 조언한다. AspectJ 위빙은 바이트코드에 적용되어 생성자·필드 접근 등 더 넓은 지점을 선택할 수 있다.

**꼬리질문:** Spring에서 AspectJ pointcut 문법을 쓰면 곧 위빙인가?
**답:** 아니다. Spring이 AspectJ 애노테이션과 표현식 일부를 해석해도 자동 프록시 방식일 수 있다. 위빙은 별도 컴파일러 또는 로드타임 위버 구성이 필요하다.

### Q2. 인터페이스가 있는데도 Boot에서 CGLIB 프록시가 나오는 이유는?

Framework의 일반 선택 규칙은 인터페이스가 있으면 JDK 프록시지만 Boot 자동 설정은 CGLIB를 기본으로 켠다. 실제 동작은 Boot의 `spring.aop.proxy-target-class` 설정 영향을 받는다. JDK 프록시를 원하면 이를 `false`로 설정한다.

**꼬리질문:** JDK 프록시로 전환할 때 먼저 확인할 것은?
**답:** 주입 타입과 호출 타입이 인터페이스인지 확인한다. 인터페이스 밖의 구현체 메서드에는 프록시 참조로 접근할 수 없다.

### Q3. `@Transactional` 또는 커스텀 advice가 내부 호출에서 빠지는 이유는?

외부 호출은 프록시를 거쳐 advice가 실행되지만, target 내부의 `this.other()`는 자기 자신의 메서드를 직접 부른다. 다시 프록시를 통하지 않으므로 내부 메서드 advice가 생략된다. `@Transactional` 고유 정책은 → S08 참조.

**꼬리질문:** 프록시 타입을 CGLIB로 강제하면 해결되는가?
**답:** 아니다. JDK/CGLIB 모두 프록시 경계를 통과하는 호출만 가로챈다. 빈을 분리해 빈 간 호출로 만들거나, 필요한 경우 AspectJ 위빙을 사용한다.

### Q4. CGLIB가 `final` 메서드에 advice를 적용하지 못하는 이유는?

CGLIB는 target의 하위 클래스를 만들고 메서드를 override해 호출을 가로챈다. `final` 메서드는 override가 금지되어 있고 private 메서드는 하위 클래스에서 재정의할 수 없다. 그래서 해당 메서드는 프록시 advice의 경계가 될 수 없다.

**꼬리질문:** Boot 기본값이 CGLIB면 final 클래스 빈은 어떻게 되는가?
**답:** 상속이 불가능하므로 CGLIB 프록시를 생성할 수 없다. 프록시가 필요한 클래스를 final로 선언하지 않거나, Framework 7의 빈별 프록시 선택에서 인터페이스 프록시가 가능한 구조인지 검토한다.

### Q5. `@Order(1)`과 `@Order(10)` 중 무엇이 먼저 실행되나?

작은 값인 1이 더 높은 우선순위다. 중첩된 around advice라면 1이 바깥에서 먼저 진입하고, `proceed()` 뒤 종료 처리는 10 다음에 1 순서로 돌아온다. 이를 빈 생성 순서와 혼동하면 안 된다.

**꼬리질문:** 같은 aspect 안의 여러 advice 메서드 순서를 무엇으로 보장할 수 있나?
**답:** 선언 순서에 의존하지 않는다. 실행 순서를 명확하게 해야 한다면 aspect를 나눠 각각 `@Order`를 준다.

### Q6. 로깅·메트릭용 `@Around`에서 `proceed()`는 몇 번 호출해야 하나?

일반적인 관측 advice는 정확히 한 번 호출하고 반환값과 예외를 그대로 전달한다. `try/finally`에서 시간을 기록하면 예외 종료도 관측할 수 있다. 캐시처럼 실행을 의도적으로 대체하는 advice는 예외적인 경우다.

**꼬리질문:** `proceed()`를 두 번 부르면?
**답:** target 메서드가 두 번 실행되어 DB 저장이나 메시지 발행 같은 업무 부작용도 중복될 수 있다. 재시도는 오류 분류, 재시도 횟수, 멱등성 정책이 있는 별도 동작으로 설계한다.

### Q7. `@Order`가 있는데도 aspect 실행 순서가 기대와 다르면 무엇을 점검하나?

각 aspect가 Spring 빈인지, `@Order` 값이 기대 순서인지 확인한다. 같은 aspect 내부 advice 순서는 보장되지 않으며, 여러 advisor에 pointcut이 겹치는지도 살핀다.

**꼬리질문:** 주입된 aspect 빈 목록의 순서와 advice 우선순위는 항상 같은가?
**답:** 아니다. `@Order`의 컬렉션 정렬과 빈 시작 순서는 서로 다른 규칙이다. 실제 프록시의 advisor 적용 순서를 기준으로 설계한다.

### Q8. AspectJ 위빙을 Spring AOP 대신 선택할 만한 경우는?

Spring 컨테이너가 관리하지 않는 객체나 생성자·필드 접근을 조언해야 하거나, 내부 호출을 포함한 넓은 실행 지점이 요구될 때 위빙을 검토한다. 대신 빌드 플러그인·위버·클래스로더 구성이 필요하다. 프록시로 해결되면 Spring AOP가 단순하다.

**꼬리질문:** load-time weaving은 애플리케이션 코드 실행이 끝난 뒤에도 클래스를 바꾸나?
**답:** 아니다. 클래스 로더가 클래스를 JVM에 정의할 때 위빙한다. 이미 정의된 클래스를 실행 도중 바꾸는 일반적인 런타임 weaving과 구분해야 한다.

## 9. 참고문헌

- Aspect Oriented Programming with Spring — https://docs.spring.io/spring-framework/reference/core/aop.html — Spring AOP의 목적과 AspectJ 표현식 기반 지원을 확인.
- Proxying Mechanisms — https://docs.spring.io/spring-framework/reference/core/aop/proxying.html — JDK/CGLIB 선택, final/private 제약, 프록시 호출 의미, Framework 7 설정을 확인.
- Declaring Advice — https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html — advice 종류와 선언 형식을 확인.
- Declaring a Pointcut — https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/pointcuts.html — Spring AOP join point 및 pointcut 설계자를 확인.
- Using the auto-proxy facility — https://docs.spring.io/spring-framework/reference/core/aop-api/autoproxy.html — 자동 프록시 생성과 BeanPostProcessor 기반 구성을 확인.
- Aspect-Oriented Programming — https://docs.spring.io/spring-boot/reference/features/aop.html — Boot 4.1.1 CGLIB 기본값과 JDK 프록시 설정을 확인.
- Using AspectJ with Spring Applications — https://docs.spring.io/spring-framework/reference/core/aop/using-aspectj.html — Spring AOP 범위를 넘어 AspectJ 컴파일러/위버를 함께 쓰는 방법을 확인.
- `@Order` Javadoc — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html — 정렬 우선순위와 버전 이력을 확인.
- `java.lang.reflect.Proxy` Javadoc — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/Proxy.html — JDK 동적 프록시와 `InvocationHandler` 디스패치를 확인.
- AspectJ Load-Time Weaving — https://eclipse.dev/aspectj/doc/released/devguide/ltw.html — compile-time·post-compile·load-time 위빙의 차이를 확인.
