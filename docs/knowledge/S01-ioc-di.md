# S01. IoC 컨테이너·DI·빈 생명주기

> 3줄 요약 — Spring 컨테이너는 객체를 만들고 의존성을 연결하며 초기화·종료까지 관리한다.
> 생성자 주입은 필수 의존성과 객체 불변성을 드러내며, 생성자 순환 참조는 설계 오류로 빠르게 드러난다.
> 기본은 ApplicationContext + 싱글턴 빈 + 생성자 주입이며, 요청별 상태와 컨테이너 확장 지점은 생명주기를 구분해 사용한다.

## 1. 왜 알아야 하나

장애가 나는 방식은 대개 설정 문법보다 객체 생명주기 오해에서 시작한다. 싱글턴 서비스에 prototype 객체를 주입하고 “매 호출마다 새 객체겠지”라고 생각하면 실제로는 싱글턴 생성 시 한 번 받은 인스턴스를 계속 쓴다. 요청 범위의 사용자 정보를 일반 싱글턴에 직접 넣으면 컨테이너가 어느 HTTP 요청의 대상을 선택해야 하는지 알 수 없어 주입이 실패하거나, 잘못 설계한 공유 객체라면 요청 간 상태가 섞일 수 있다.

두 서비스가 서로의 생성자를 요구하면 어느 쪽도 먼저 만들 수 없어 애플리케이션 시작이 실패한다. 이를 setter로 바꿔 시작만 성공시켜도 두 객체가 반쯤 초기화된 채 서로를 호출하는 구조는 남는다. 시작 시점의 실패를 무조건 해결하는 것보다 의존 방향을 끊는 편이 안전하다.

또 하나의 흔한 실수는 초기화 코드가 실행되는 시점을 추정하는 것이다. @PostConstruct는 의존성 설정 이후, 일반 초기화 콜백 전에 호출되고 BeanPostProcessor는 초기화 전후에 객체를 관찰하거나 감쌀 수 있다. BeanFactoryPostProcessor는 인스턴스가 아니라 빈 정의를 고친다. 위치를 혼동하면 설정은 바뀌지 않거나, 확장 객체 자신이 너무 일찍 만들어져 다른 후처리기의 적용을 놓친다.

면접에서는 “Spring이 객체를 관리한다”에서 끝내지 말고, 누가 정의를 등록하는지, 어떤 단계에서 생성자 인자를 찾는지, 컨텍스트가 어떤 콜백을 어떤 순서로 부르는지, 싱글턴과 요청 범위가 어떻게 함께 동작하는지를 설명해야 한다.

## 2. 핵심 개념

| 개념 | 정의와 구분 |
|---|---|
| IoC | 객체 생성·연결·생명주기 제어를 컨테이너로 옮기는 원칙 |
| DI | 생성자·팩터리·프로퍼티로 협력 객체를 전달하는 조립 방식 |
| BeanDefinition | 타입, 범위, 생성 방식 등을 기록한 빈 설계 메타데이터 |
| Bean | Spring 컨테이너가 만들고 관리하는 객체. 직접 new 한 객체는 자동 주입되지 않음 |
| BeanFactory | 빈 등록·조회·생성의 기본 계약 |
| ApplicationContext | BeanFactory에 메시지·리소스·이벤트·공통 후처리기 기능을 더한 애플리케이션 컨테이너 |
| Scope | 빈 정의에 따른 인스턴스 생존 범위. singleton은 컨테이너마다 하나 |

| 선택 | 역할과 기준 |
|---|---|
| BeanFactory | 기본 빈 생성·조회. 저수준 통합 등 특별한 이유가 있을 때 직접 사용 |
| ApplicationContext | 일반 애플리케이션 기본값. 공통 인프라 후처리기 탐지, 메시지, 리소스, 이벤트와 계층형 컨텍스트 제공 |

BeanFactory와 ApplicationContext를 eager/lazy 한마디로 나누지 않는다. 실제 시점은 싱글턴 정책과 지연 설정에 따르며, ApplicationContext는 refresh 중 인프라와 기본 싱글턴을 준비한다.

| 빈 등록 | 동작과 용도 |
|---|---|
| @Component 계열 + 스캔 | 클래스패스에서 후보를 찾아 정의 등록. 앱이 소유한 서비스·어댑터에 적합 |
| @Bean 메서드 | 반환 객체를 등록하고 메서드명이 기본 빈 이름이 됨. 외부 라이브러리 객체나 생성 조건 표현에 적합 |

@Configuration 기본 모드는 @Bean 메서드 호출을 컨테이너 조회로 보정한다. proxyBeanMethods=false 또는 일반 @Component에서는 직접 호출을 가로채지 않는다. 이때 다른 빈을 메서드 인자로 받아 의존성을 표시한다.

| 주입 방식 | 판단 |
|---|---|
| 생성자 | 기본 추천. 필수 의존성이 드러나고 final·직접 테스트가 쉬우며 불완전 객체를 줄임 |
| setter | 선택·변경 가능한 의존성에 한정. 생성 직후 미설정 상태가 생길 수 있음 |
| 필드 | 짧지만 의존성이 숨고 불변성·일반 단위 테스트가 불편 |

| Scope | 생존 범위와 주의 |
|---|---|
| singleton | 컨테이너 안 정의별 한 객체. 기본값이며 요청별 상태를 저장하지 않음 |
| prototype | 요청할 때마다 새 객체. 이후 파괴 콜백은 자동 관리하지 않음 |
| request / session | HTTP 요청 / 세션 단위. 웹 인식 컨텍스트가 필요 |
| application / websocket | ServletContext / WebSocket 단위 |

BeanFactoryPostProcessor는 객체 생성 전 BeanDefinition을 바꾼다. BeanPostProcessor는 만들어진 객체를 초기화 전후 처리해 검사하거나 래핑한다. 정의를 고칠 때 전자, 인스턴스별 처리가 필요할 때 후자를 쓴다.

## 3. 내부 동작·원리

### 컨텍스트 시작과 빈 하나의 생성

~~~text
ApplicationContext.refresh()
  ├─ BeanDefinition 등록
  │    ├─ @Component 스캔
  │    └─ @Configuration / @Bean 파싱
  ├─ BeanFactoryPostProcessor 실행
  │    └─ BeanDefinition 메타데이터 수정
  ├─ BeanPostProcessor 등록
  ├─ 비지연 singleton 생성
  │    ├─ 생성자 인자 의존성을 먼저 조회/생성
  │    ├─ 인스턴스 생성 및 프로퍼티·필드 주입
  │    ├─ Aware 콜백
  │    ├─ BeanPostProcessor: 초기화 전
  │    │    └─ @PostConstruct 처리
  │    ├─ InitializingBean.afterPropertiesSet()
  │    ├─ 사용자 지정 init 메서드
  │    └─ BeanPostProcessor: 초기화 후 (교체·프록시 가능)
  ├─ 컨텍스트 refresh 완료
  └─ Lifecycle / SmartLifecycle 컴포넌트 시작
~~~ 

컨테이너는 BeanDefinition에 따라 생성자 인자 빈을 먼저 재귀적으로 준비한다. A→B→A 생성자 고리는 양쪽의 완성을 기다려 실패하며 보통 BeanCurrentlyInCreationException이 발생한다.

의존성 설정과 Aware 콜백 뒤, 초기화 전 BeanPostProcessor가 @PostConstruct를 포함한 처리를 한다. 이후 afterPropertiesSet(), 사용자 init이 실행될 수 있고, 초기화 후 처리기는 원본 대신 래퍼를 노출할 수 있다.

### 스코프 프록시는 왜 필요한가

싱글턴 서비스는 보통 컨텍스트 시작 중 만들어지고, request 객체는 HTTP 요청 중 만들어진다. 범위 프록시는 주입 시점에는 대리 객체를 넣고 메서드 호출 때 현재 요청의 대상을 찾아 위임한다.

~~~text
singleton service → request-scope proxy → 현재 요청의 대상
~~~

요청이 없는 스케줄러나 일반 컨텍스트에서는 활성 request 범위가 없어 호출이 실패한다. prototype을 singleton 생성자에 직접 넣어도 생성 시 한 번 만든 객체가 계속 남는다. 매번 새 객체가 필요하면 ObjectProvider<T>.getObject()나 팩터리로 조회를 늦춘다.

### 생명주기와 종료

초기화 콜백은 의존성 설정 후 짧은 준비·검증에 쓴다. @PostConstruct는 Spring 인터페이스와 결합하지 않고, InitializingBean은 Spring API에 결합한다. 도메인 클래스에 애노테이션을 두기 싫으면 @Bean(initMethod=...)를 쓴다. 순서는 @PostConstruct → afterPropertiesSet() → 사용자 init이며 같은 메서드를 중복 지정하지 않는다.

종료에서는 @PreDestroy, DisposableBean.destroy(), 사용자 지정 destroy 메서드가 대응한다. 이 콜백은 컨테이너가 정상적으로 닫힐 때 유효하다. 프로세스 강제 종료나 prototype 인스턴스처럼 컨테이너가 소유권을 관리하지 않는 대상까지 자동 정리를 보장하지 않는다.

Lifecycle / SmartLifecycle은 컨텍스트 시작·중지와 정지 순서·완료를 다룬다. 소비자처럼 종료 전에 신규 작업을 멈추고 진행 중 작업을 정리해야 할 때 쓰며, 긴 작업을 @PostConstruct에 넣으면 컨텍스트가 수명을 조율하기 어렵다.

### ApplicationEvent

ApplicationContext는 ApplicationEventPublisher로 같은 컨텍스트의 ApplicationListener / @EventListener에 알린다. Framework 4.2부터 일반 객체도 발행 가능하며, 발행자와 구독자를 잇는 내부 관찰자 메커니즘이다.

이벤트는 내구성·재시도나 DB 커밋과 외부 발송의 원자성을 보장하지 않는다. 컨텍스트 내부 연결에 쓰고, 신뢰성 있는 외부 전달은 메시징으로 별도 설계한다.

## 4. 코드로 확인

다음은 Boot 4.1 / Framework 7 프로젝트용 코드다. 실행 환경을 구성하지 않아 모두 (미실행)이다.

### 예제 1 — 생성자 주입으로 의존성 조립 (미실행)

~~~java
package example.ioc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@SpringBootApplication
public class IocApplication {
    public static void main(String[] args) {
        SpringApplication.run(IocApplication.class, args);
    }
}

interface PaymentGateway {
    void charge(long amount);
}

@Component
class LoggingPaymentGateway implements PaymentGateway {
    @Override
    public void charge(long amount) {
        System.out.println("charged: " + amount);
    }
}

@Service
class CheckoutService {
    private final PaymentGateway paymentGateway;

    CheckoutService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    void checkout(long amount) {
        paymentGateway.charge(amount);
    }
}
~~~

CheckoutService는 컨테이너 API를 직접 호출하지 않고 필요한 계약을 생성자에서 선언한다. 구현 선택은 컴포넌트 스캔과 타입 후보 해석에 맡긴다. 구현체가 둘 이상이면 @Qualifier 또는 명시적인 조립 정책을 둔다. “생성자 하나면 @Autowired가 필요 없다”는 점을 기억한다.

### 예제 2 — singleton에 request 빈 연결 (미실행)

~~~java
package example.ioc;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import org.springframework.context.annotation.ScopedProxyMode;

@RequestScope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@Component
class RequestTrace {
    private final String traceId = java.util.UUID.randomUUID().toString();

    String traceId() {
        return traceId;
    }
}

@Component
class AuditService {
    private final RequestTrace requestTrace;

    AuditService(RequestTrace requestTrace) {
        this.requestTrace = requestTrace;
    }

    String currentTraceId() {
        return requestTrace.traceId();
    }
}
~~~

AuditService는 싱글턴이어도 생성 시점에 RequestTrace의 실제 요청 객체를 보관하지 않는다. 주입되는 클래스 기반 프록시가 현재 요청에 맞는 대상을 찾아 호출을 전달한다. 이 빈은 Servlet 요청이 활성화된 웹 컨텍스트에서만 사용할 수 있다. 요청 없는 실행 경로에서도 호출해야 한다면 범위 경계를 서비스 API에 드러내거나 실행 맥락에 맞는 입력값을 전달한다.

### 예제 3 — 초기화 콜백과 컨텍스트 이벤트 (미실행)

~~~java
package example.ioc;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

record CatalogReloaded(long version) {}

@Component
class CatalogCache {
    @PostConstruct
    void warmUp() {
        // 작은 인메모리 초기 상태 구성
    }

    @PreDestroy
    void clear() {
        // 컨테이너 종료 시 보유 리소스 정리
    }

    @EventListener
    void onCatalogReloaded(CatalogReloaded event) {
        // 같은 ApplicationContext에서 발행된 이벤트 처리
    }
}
~~~

이 예제에서 초기화 메서드는 컨테이너가 의존성을 설정한 뒤 호출한다. 이벤트 리스너는 등록된 빈 메서드이며, 누군가 ApplicationEventPublisher.publishEvent(new CatalogReloaded(...))를 호출해야 실행된다. 이벤트만 선언했다고 발행이 일어나지는 않는다.

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화와 이전 한계 | 근거 |
|---|---|---|
| Spring 2.5 | @PostConstruct / @PreDestroy를 지원하기 시작했다. InitializingBean·DisposableBean을 구현해야 콜백을 받을 수 있던 결합을 낮추기 위해 애노테이션 경로를 제공했다. 현재 패키지는 jakarta.annotation이다. | [콜백 애노테이션 레퍼런스](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/postconstruct-and-predestroy-annotations.html) |
| Spring 4.2 | ApplicationEvent를 상속하지 않는 일반 객체도 발행할 수 있게 개선했다. 이벤트마다 프레임워크 기반 클래스를 만들고 도메인 데이터를 억지로 상속 구조에 맞추던 불편을 줄였다. | [ApplicationContext 이벤트](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html) |
| Spring Boot 2.6 | 순환 참조 허용 기본값이 false가 됐다. 일부 setter 고리의 자동 해결에 기대면 의존 구조가 감춰지고 반쯤 초기화된 빈을 참조할 수 있어, 시작 단계에서 고리를 드러내도록 기본 정책을 바꿨다. | [Boot 2.6 릴리스 노트](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes), 현재 프로퍼티 [참고](https://docs.spring.io/spring-boot/appendix/application-properties/index.html) |
| Spring Framework 6.0 | Java 17 이상과 Jakarta EE 9 이상을 기준선으로 올렸다. Jakarta EE 9의 패키지 이름 전환에 따라 현재 생명주기 애노테이션도 javax.annotation이 아니라 jakarta.annotation.PostConstruct / PreDestroy를 사용한다. | [Framework 6.0 릴리스 노트](https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-6.0-Release-Notes), [현재 콜백 애노테이션 API](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/postconstruct-and-predestroy-annotations.html) |

현재 기준은 Spring Boot 4.1.1, Framework 7.0.9다. 프레임워크 레퍼런스의 안정 버전 표시도 7.0.9를 가리킨다. 버전 상향으로 컨테이너 기본 개념이 바뀌었다고 오해하지 말고, 프로젝트의 등록 방식·기본 프로퍼티·패키지 네임스페이스가 현재 버전에 맞는지 확인한다.

## 6. 실무 가이드

기본값은 ApplicationContext + 생성자 주입 + stateless singleton 서비스다. 요청별 데이터는 인자나 적절한 웹 범위로 분리한다.

| 상황 | 선택 | 이유 |
|---|---|---|
| 서비스가 반드시 필요한 협력자를 가짐 | 생성자 주입 | 유효하지 않은 객체 생성을 막고 테스트에서 의존 교체가 쉽다 |
| 의존성이 선택 사항 | 명시적 선택 계약, 필요하면 ObjectProvider | 필수·선택 경계를 숨기지 않고 실제 필요 시 얻을 수 있다 |
| 외부 라이브러리 객체를 빈으로 등록 | @Bean 메서드 | 수정 불가능한 클래스도 컨테이너 조립에 참여시킨다 |
| 설정 클래스에서 다른 @Bean 결과를 사용 | 기본 proxyBeanMethods 또는 메서드 매개변수 | 기본 프록시 의미를 사용하거나, 프록시 비활성화 시 의존을 명시한다 |
| singleton이 request/session 객체를 사용 | 범위 프록시 또는 요청 데이터를 인자로 전달 | 주입은 컨텍스트 시작 중, 대상은 요청 시 생기기 때문이다 |
| singleton에서 새 prototype 인스턴스가 매번 필요 | ObjectProvider<T>, 팩터리 또는 lookup 방식 | 일반 주입은 singleton 생성 때 한 번만 일어난다 |
| 설정 메타데이터를 바꿔야 함 | BeanFactoryPostProcessor | 빈 객체가 만들어지기 전에 정의를 수정해야 한다 |
| 빈 인스턴스를 감싸거나 초기화 전후 처리 | BeanPostProcessor | 객체 생성 이후 빈별로 관찰·변환할 수 있다 |
| 백그라운드 소비자·스케줄러의 시작/정지 순서가 필요 | SmartLifecycle | 컨텍스트 종료 단계, phase, 비동기 정지를 관리한다 |
| 컨텍스트 안의 느슨한 후속 동작을 연결 | ApplicationEvent | 발행자가 모든 구독 구현을 직접 알 필요가 없다 |
| 외부 시스템에 신뢰성 있게 이벤트 전달 | 이벤트만으로 해결하지 않고 메시징·트랜잭션 설계 | ApplicationEvent 자체는 내구성·재시도·원자성을 보장하지 않는다 |

## 7. 함정·안티패턴


1. **증상:** 애플리케이션 시작 중 BeanCurrentlyInCreationException 발생 → **원인:** 생성자 A가 B를 요구하고 B가 A를 요구하는 순환 그래프 → **대처:** 공통 책임을 제3 서비스로 추출하거나 호출 경계를 이벤트·팩터리로 분리한다. setter로 바꿔 오류만 숨기지 않는다.

2. **증상:** singleton 서비스가 요청 A에서 본 사용자·추적 ID를 요청 B에도 보인다 → **원인:** 요청마다 달라지는 값을 singleton 필드에 저장해 공유했다 → **대처:** 요청 값을 메서드 인자로 전달하거나 적절한 request 범위로 옮기고, singleton 서비스는 공유 가능한 불변 설정만 보유한다.


3. **증상:** @Configuration에서 직접 부른 @Bean 메서드가 호출할 때마다 별도 객체를 반환한다 → **원인:** proxyBeanMethods=false 또는 일반 @Component의 메서드 직접 호출은 컨테이너 가로채기가 없다 → **대처:** 메서드 매개변수 주입으로 빈 간 의존성을 표현한다.

4. **증상:** prototype을 닫을 때 @PreDestroy가 호출되지 않는다 → **원인:** prototype 생성 후 컨테이너는 전체 사용·종료 생명주기를 추적하지 않는다 → **대처:** 짧은 생명주기 객체는 소비자가 정리 책임을 갖게 하거나, 컨테이너가 소유해야 할 자원은 singleton·전용 팩터리 구조로 관리한다.

5. **증상:** BeanFactoryPostProcessor를 추가했지만 설정 클래스의 @Autowired나 @PostConstruct가 기대대로 처리되지 않는다 → **원인:** 설정 메서드에서 후처리기 객체를 너무 일찍 만들며 설정 클래스가 후처리기 적용보다 앞서 생성될 수 있다 → **대처:** BeanFactoryPostProcessor를 반환하는 @Bean 메서드를 static으로 선언하고, 후처리기 생성자 의존성을 최소화한다.

6. **증상:** request 프록시 호출이 스케줄러나 요청 없는 테스트에서 실패한다 → **원인:** 현재 스레드에 활성 HTTP 요청 범위가 없다 → **대처:** request 빈을 웹 어댑터 경계 안에서만 사용하고, 외부 작업에는 필요한 사용자·추적 데이터를 명시적으로 전달한다.


## 8. 자가점검 Q&A (면접 대비)

### Q1. 생성자 주입을 권장하는 근거는 무엇인가?

필수 의존성이 생성자 시그니처에 드러나고 생성 뒤 final로 유지할 수 있다.  
의존성이 빠진 객체를 만들기 어렵고 테스트에서 대체 객체를 직접 넣기 쉽다.  
단점은 생성자 고리가 성립하지 않아 순환 참조가 시작 단계에 드러난다는 점이다.  
**꼬리질문:** 선택 의존성은 어떻게 표현하는가? **답:** Optional·nullable 계약이나 ObjectProvider처럼 선택임을 나타내는 타입을 사용한다.

### Q2. 생성자 순환 참조와 setter 순환 참조의 차이는?

생성자 A→B→A는 한 객체가 완성되기 전에 상대를 요구해 컨테이너가 만들 수 없다.  
컨테이너는 보통 BeanCurrentlyInCreationException으로 실패를 보고한다.  
setter 순환 참조는 일부 형태가 가능하더라도 미완성 객체 참조 위험을 남긴다.  
**꼬리질문:** 가장 나은 대처는? **답:** setter 전환보다 공통 책임 추출이나 의존 방향 재설계로 고리를 없앤다.

### Q3. singleton에 prototype을 넣으면 매 호출마다 새 인스턴스인가?

아니다. 의존성은 singleton을 만들 때 한 번 해결되고 그 객체가 계속 주입되어 있다.  
매 사용마다 새 prototype이 필요하면 ObjectProvider.getObject() 또는 팩터리 호출처럼 조회 시점을 늦춘다.

prototype 소멸 콜백도 컨테이너가 자동으로 끝까지 추적하지 않는다.  
**꼬리질문:** prototype은 생성 때마다 새로 만들어지는가? **답:** 컨테이너에 새 객체를 요청할 때마다 빈 정의로 인스턴스를 새로 생성한다.

### Q4. BeanFactoryPostProcessor와 BeanPostProcessor는 어디에서 갈리는가?

전자는 빈 인스턴스 생성 전에 BeanDefinition 메타데이터를 수정한다.  
후자는 생성된 인스턴스를 초기화 전후로 처리하고 교체·프록시 래핑도 할 수 있다.  
설정값·정의 수정이면 전자, 객체 행동·콜백 적용이면 후자를 검토한다.

**꼬리질문:** BFPP를 @Bean으로 등록할 때 static을 권하는 이유는? **답:** 후처리 단계가 매우 이르므로 설정 클래스 자신이 일반 후처리기 적용 전에 만들어지는 충돌을 피하기 위해서다.

### Q5. 요청 범위 빈을 싱글턴 서비스에 주입할 수 있는 이유는?

범위 프록시를 싱글턴에 넣고 실제 대상 선택을 메서드 호출 시점으로 늦출 수 있다.  
프록시는 현재 요청에 대응하는 대상을 찾아 호출을 넘긴다.  
요청이 없는 실행 맥락에서는 대상 범위가 활성화되지 않아 호출할 수 없다.  
**꼬리질문:** 프록시는 사용자 데이터를 공유해도 되게 하는가? **답:** 아니다. 요청별 대상과 공유 singleton의 상태 격리는 별도로 지켜야 한다.

### Q6. @Configuration(proxyBeanMethods=false)를 선택하면 무엇을 바꿔야 하나?

설정 클래스 내부의 @Bean 메서드 호출은 컨테이너 조회로 대체되지 않는다.  
따라서 다른 @Bean 결과를 메서드 본문에서 직접 부르지 말고 매개변수로 주입한다.  
메서드 호출을 가로채는 설정 클래스 프록시가 필요 없을 때 선택한다.  
**꼬리질문:** 일반 @Component 안의 @Bean도 호출 가로채기를 하는가? **답:** 하지 않는다. 빈 메서드 간 의존성은 메서드 인자로 표현한다.

### Q7. @PostConstruct와 SmartLifecycle은 어떤 차이가 있는가?

@PostConstruct는 빈 의존성이 설정된 뒤 해당 빈을 초기화하는 콜백이다.  
SmartLifecycle은 컨텍스트 시작·종료에 연동되는 컴포넌트의 자동 시작, 순서, 정지 완료를 다룬다.  
수명 전체를 관리하는 외부 소비자를 짧은 초기화 콜백에 넣으면 종료 통제가 약해진다.

**꼬리질문:** @PreDestroy는 강제 종료에서도 호출되는가? **답:** 정상적인 컨테이너 종료에서 실행되는 콜백이며 프로세스 강제 종료까지 보장하지 않는다.

### Q8. ApplicationEvent가 메시지 큐를 대체하는가?

ApplicationEvent는 같은 Spring 컨텍스트 안에서 발행자와 리스너를 느슨하게 연결한다.  
기본 이벤트 발행만으로 디스크 내구성·재시도·외부 전달·DB 트랜잭션 원자성은 생기지 않는다.  
그 보장이 필요하면 메시징과 트랜잭션 아웃박스 등을 별도로 설계한다.  
**꼬리질문:** 이벤트 발행 코드만으로 주문 DB 커밋과 이메일 발송이 원자적인가? **답:** 아니다. DB 커밋 이후 실패·재시도까지 포함한 전달 정책이 필요하다.

## 9. 참고문헌

- The IoC Container — https://docs.spring.io/spring-framework/reference/core/beans.html — IoC 장의 범위와 하위 자료 구성.
- Bean 등록 — https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html · https://docs.spring.io/spring-framework/reference/core/beans/java/bean-annotation.html — 스캔 후보와 @Bean 등록 방식.
- The BeanFactory API — https://docs.spring.io/spring-framework/reference/core/beans/beanfactory.html — BeanFactory와 ApplicationContext 선택 기준·기능 차이.
- Dependency Injection — https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html — 생성자·setter 주입과 순환 의존 동작.
- Bean Scopes — https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html — singleton·prototype·웹 범위와 범위 간 주입.
- Customizing the Nature of a Bean — https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html — 초기화·소멸 콜백, Lifecycle과 SmartLifecycle.
- Container Extension Points — https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html — BeanFactoryPostProcessor와 BeanPostProcessor의 대상·시점.
- Using the @Configuration annotation — https://docs.spring.io/spring-framework/reference/core/beans/java/configuration-annotation.html — inter-bean 의존성과 proxyBeanMethods=false.
- Additional Capabilities of the ApplicationContext — https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html — 컨텍스트 이벤트 발행, 일반 객체 이벤트, 리스너.
- Using @PostConstruct and @PreDestroy — https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/postconstruct-and-predestroy-annotations.html — Jakarta 생명주기 애노테이션의 콜백 처리.
- Common Application Properties — https://docs.spring.io/spring-boot/appendix/application-properties/index.html — spring.main.allow-circular-references의 현재 기본값 false.
- Spring Boot 2.6 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes — 순환 참조 기본 금지 변경과 이전 동작 복원 설정.
- Spring Framework 6.0 Release Notes — https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-6.0-Release-Notes — Java 17 및 Jakarta EE 9 기준선.

다른 주제: 프록시 기반 AOP → S02, 자동 구성 → S03.
