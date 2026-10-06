# S03. Spring Boot 자동 구성 원리

> 3줄 요약 — `@SpringBootApplication`은 구성 클래스, 컴포넌트 스캔, 자동 구성 활성화를 묶은 합성 애노테이션이다.
> 자동 구성 후보는 classpath의 `AutoConfiguration.imports`에서 발견되고 `@Conditional*`가 현재 환경과 사용자 빈에 맞지 않는 구성을 걸러낸다.
> 스타터는 필요한 의존성을 모으는 편의 모듈이고, 자동 구성은 조건을 만족할 때 기본 빈을 등록하는 코드다. Boot 4에서는 기술별 모듈과 스타터를 명시적으로 맞춰야 한다.

## 1. 왜 알아야 하나

운영 프로필에서만 애플리케이션이 `DataSource`를 만들지 못하거나, 테스트에서 빈이 두 개 생겨 주입이 실패하는 문제는 “Boot가 알아서 한다”는 설명만 외우면 진단하기 어렵다. 자동 구성은 매직이 아니라 **의존성·구성 메타데이터·사용자 정의 빈·조건이 순서대로 합쳐진 결과**다. 무엇을 보고 켜졌는지, 무엇 때문에 꺼졌는지를 구분하면 시작 실패를 빠르게 좁힐 수 있다.

예를 들어 서비스가 자기 `Clock` 빈을 선언했는데 자동 구성에서 만든 `Clock`도 살아 있으면 `NoUniqueBeanDefinitionException`이 날 수 있다. 기본 빈을 만드는 `@Bean`에 `@ConditionalOnMissingBean`이 없거나, 조건 대상 타입을 지나치게 넓게 선언했는지 확인해야 한다. 반대로 자동 구성이 빠졌다면 의존성 JAR만 확인하지 말고 Boot 4에서 해당 기능이 별도 모듈로 이동했는지, imports 파일이 패키징된 JAR에 들어갔는지도 확인한다.

또 메인 클래스가 `com.example.app.web`처럼 너무 안쪽 패키지에 있으면 형제 패키지의 컴포넌트가 검색되지 않는다. `@SpringBootApplication`의 컴포넌트 스캔 기준은 기본적으로 그 클래스의 패키지다. “자동 구성은 켜져 있는데 내 `@Service`는 왜 없나?”라는 문제는 자동 구성 후보 로딩과 컴포넌트 스캔을 혼동한 결과다.

## 2. 핵심 개념

| 용어 | 뜻 | 구별할 점 |
|---|---|---|
| `@SpringBootApplication` | 구성, 자동 구성, 컴포넌트 스캔을 묶은 애노테이션 | 메인 구성 클래스 한 곳에 둔다. |
| 자동 구성 | classpath, 환경, 기존 빈에 따라 기본 빈을 조건부 등록 | 컴포넌트 스캔과 다른 후보 발견 경로를 쓴다. |
| `AutoConfiguration.imports` | 자동 구성 클래스명을 한 줄씩 담는 JAR 리소스 | 실행 시 classpath에서 읽는다. |
| 조건(condition) | `@Conditional*`가 맞을 때 구성/빈 정의를 적용 | 빈 생성 후 제거하는 방식이 아니다. |
| 스타터(starter) | 함께 쓸 의존성 묶음 | 추가만으로 자동 구성이 무조건 켜지지는 않는다. |
| 자동 구성 모듈 | 자동 구성 클래스와 해당 라이브러리 연동 코드가 들어가는 모듈 | 스타터와 분리해 기능을 재사용·조합할 수 있다. |
| 조건 평가 리포트 | 조건별 일치·불일치와 이유를 기록한 진단 정보 | `--debug`로 출력하고, 빈 목록 자체와 혼동하지 않는다. |

### 자주 혼동하는 것

| 구분 | 컴포넌트 스캔 | 자동 구성 후보 발견 |
|---|---|---|
| 기준 | `@ComponentScan`의 패키지 범위 | classpath JAR의 `AutoConfiguration.imports` |
| 주 대상 | 애플리케이션의 `@Component`, `@Service` 등 | `@AutoConfiguration`으로 선언한 라이브러리 구성 |
| 범위 조정 | `scanBasePackages`, `scanBasePackageClasses` | `exclude`, `excludeName`, `spring.autoconfigure.exclude`, `@Conditional*` |

`scanBasePackages`는 컴포넌트 스캔 범위만 바꾼다. 엔티티나 Spring Data 저장소 탐색 범위까지 바꾸지는 않는다. `@EntityScan`, `@Enable...Repositories`는 별도로 설정한다. 메인 클래스는 도메인 패키지들을 포괄하는 루트 패키지에 둔다.

스타터와 자동 구성 모듈도 다르다. 애플리케이션이 `spring-boot-starter-data-jpa`를 추가하면 관련 라이브러리와 Boot의 JPA 지원이 의존성 그래프에 들어온다. 그 다음 자동 구성 클래스의 조건이 맞아야 기본 빈이 등록된다. 즉 **의존성 추가는 조건을 평가할 재료를 제공하고, 조건 평가는 실제 구성을 결정한다.**

## 3. 내부 동작·원리

### `@SpringBootApplication`은 세 역할을 묶는다

Boot 4.1.1 API의 선언을 풀면 `@SpringBootApplication`은 `@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@ComponentScan`을 포함한다. 실제 `@ComponentScan`에는 테스트용 `TypeExcludeFilter`도 지정돼 있다. 기본 컴포넌트 탐색 기준 패키지는 애노테이션이 붙은 클래스의 패키지다. `@EnableAutoConfiguration`은 `AutoConfigurationImportSelector`를 통해 자동 구성 후보 선택을 시작한다.

### 후보 검색부터 빈 생성까지

```text
SpringApplication.run(Main.class, args)
  │
  ├─ Environment와 ApplicationContext 준비
  ├─ @SpringBootApplication 구성 분석
  │    ├─ 사용자 구성과 컴포넌트 스캔
  │    └─ @EnableAutoConfiguration
  │          └─ AutoConfigurationImportSelector (DeferredImportSelector)
  │                ├─ classpath의 AutoConfiguration.imports 후보 읽기
  │                ├─ 중복·명시적 제외 처리
  │                └─ 조건 필터와 구성 순서 적용
  ├─ 조건에 맞는 사용자/자동 구성의 BeanDefinition 등록
  ├─ ApplicationContext.refresh(): 빈 생성·초기화, 웹 서버 기동 등
  ├─ ApplicationStartedEvent → ApplicationRunner / CommandLineRunner
  └─ ApplicationReadyEvent → 요청 수신 준비 완료
```

Boot API는 `AutoConfigurationImportSelector`를 `DeferredImportSelector`로 설명하고, `@AutoConfiguration`은 `ImportCandidates`를 이용해 발견된다고 명시한다. 따라서 자동 구성은 애플리케이션 패키지를 훑다가 우연히 찾는 게 아니다. Boot가 JAR들에 있는 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`를 모아 후보로 삼는다. 같은 리소스를 여러 라이브러리가 제공할 수 있으므로 패키징 시 리소스 병합 규칙도 중요하다.

후보는 제외 설정과 각 `@Conditional*`를 거쳐 적용 여부가 정해진다. 조건은 classpath, `Environment`, 현재 빈 정의를 검사하며 일치한 구성만 빈 정의를 등록한다. 자동 구성은 보통 `@Configuration(proxyBeanMethods = false)`다.

`@ConditionalOnMissingBean`이 사용자 빈을 존중하는 이유는 자동 구성 해석이 사용자 구성 정의 뒤에 지연 선택되도록 되어 있기 때문이다. 그래도 이 조건은 **지금까지 처리된 정의**를 기준으로 평가된다. Boot 문서는 빈 조건을 자동 구성 클래스에 두는 방식을 권한다. `@Bean` 메서드 각각에 조건을 복잡하게 흩뜨리면 다른 자동 구성 처리 순서에 따라 의도와 달라질 수 있다. `@AutoConfiguration(after = ...)`는 구성 정의를 어느 순서로 처리할지 정할 뿐, 빈 생성 순서를 직접 지정하지 않는다. 실제 생성은 의존 관계와 `@DependsOn` 등에 따른다.

### 조건 애노테이션 선택

| 조건 | 검사 대상 | 사용처 |
|---|---|---|
| `@ConditionalOnClass` / `@ConditionalOnMissingClass` | classpath | 선택 라이브러리 유무 |
| `@ConditionalOnBean` / `@ConditionalOnMissingBean` | 등록된 빈 정의 | 기본 빈 제공과 대체 허용 |
| `@ConditionalOnProperty` / `@ConditionalOnBooleanProperty` | `Environment` 속성 | 기능 토글 |
| `@ConditionalOnResource` | classpath/파일 리소스 | 설정 파일·스키마 존재 |
| `@ConditionalOnWebApplication` | Servlet/Reactive 컨텍스트 | 웹 전용 구성 |
| `@ConditionalOnExpression` | SpEL 결과 | 제한적으로 사용; 빈 참조는 조기 초기화를 유발할 수 있음 |

클래스 수준 `@ConditionalOnClass`는 애노테이션 메타데이터를 ASM으로 읽으므로 누락된 선택 의존성을 처리할 수 있다. 선택 클래스를 `@Bean` 반환형에 바로 쓰면 조건 적용 전에 JVM이 타입을 로드하다 실패할 수 있다. 해당 빈들을 조건이 붙은 중첩 `@Configuration`에 분리한다.

`@ConditionalOnProperty`는 기본적으로 속성이 있고 값이 `false`가 아니면 맞는다. 명시적 토글은 `havingValue = "true"`로 제한하고, 여러 `name`은 모두 만족해야 한다. SpEL에서 빈을 참조하면 후처리나 프로퍼티 바인딩 전에 조기 초기화될 수 있다.

### `SpringApplication` 기동과 이벤트

`SpringApplication.run`은 `ApplicationStartingEvent`, `ApplicationEnvironmentPreparedEvent`, `ApplicationContextInitializedEvent`, `ApplicationPreparedEvent` 순으로 진행한다. refresh 뒤 `ApplicationStartedEvent`, 두 runner, `ApplicationReadyEvent` 순서다. 실패 시 `ApplicationFailedEvent`와 `FailureAnalyzer`가 진단에 관여한다.

따라서 `ApplicationStartedEvent` 리스너 안에서 아직 실행 전인 runner의 작업 결과를 기대하면 타이밍 오류다. 반대로 `ApplicationReadyEvent`는 runner 이후라 초기 데이터 준비 완료를 확인하는 데 맞는다. 외부 설정과 프로파일이 `Environment`에 들어오는 세부 우선순위는 → S04 참조.

### 기동 runner와 준비 상태 다루기 (보강)

기동 작업의 경계는 “컨텍스트 생성 완료”가 아니라 “요청을 받아도 되는가”다. 전체 흐름을 이벤트와 함께 보면 다음과 같다.

```text
SpringApplication 시작
  → Environment 준비 → ApplicationContext 초기화·정의 로딩
  → refresh (싱글톤 초기화, 내장 웹 서버 초기화)
  → ApplicationStartedEvent
  → LivenessState.CORRECT
  → @Order 순서로 ApplicationRunner / CommandLineRunner 실행
  → ApplicationReadyEvent
  → ReadinessState.ACCEPTING_TRAFFIC
  → run() 반환
```

`ApplicationStartedEvent`는 refresh 뒤이지만 runner보다 먼저다. 이 시점의 리스너는 runner가 채울 캐시나 검증 결과를 사용할 수 없다. runner가 모두 끝난 뒤 `ApplicationReadyEvent`가 발행되고, 이어 readiness가 `ACCEPTING_TRAFFIC`으로 바뀐다. 따라서 runner가 오래 걸리는 동안 프로세스와 웹 서버가 떠 있어도 정상적으로 준비됐다는 뜻은 아니다. Actuator readiness probe를 사용하는 배포 환경은 이 상태를 보고 트래픽을 보류할 수 있다. `WebServerInitializedEvent`와 `ContextRefreshedEvent`는 refresh 과정 중, `ApplicationStartedEvent` 전에 발생한다.

두 runner는 실행 시점은 같고 인자 형태가 다르다. `ApplicationRunner`는 옵션을 해석한 `ApplicationArguments`를 받으므로 `--mode=warmup input.csv`에서 `mode`의 값과 위치 인자 `input.csv`를 따로 읽는다. `CommandLineRunner`는 원래 전달된 문자열 배열 전체를 받는다. 예를 들어 아래 코드는 필수 데이터 준비를 먼저 실행하고, 그 다음 원시 인자를 출력한다. `@Order`의 숫자가 낮은 runner부터 호출된다.

```java
// Spring Boot 4.1 / Java 25
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration(proxyBeanMethods = false)
class StartupTasks {
    @Bean
    @Order(10)
    ApplicationRunner warmRequiredData(RequiredDataWarmup warmup) {
        return (ApplicationArguments args) -> {
            List<String> modes = args.getOptionValues("mode");
            List<String> files = args.getNonOptionArgs();
            System.out.printf("mode=%s files=%s%n", modes, files);
            warmup.load(modes, files); // 실패를 숨기지 않으면 기동 실패
        };
    }

    @Bean
    @Order(20)
    CommandLineRunner showRawArguments() {
        return args -> System.out.println(Arrays.toString(args));
    }
}
```

`--mode=warmup input.csv`로 실행하면 첫 runner는 `mode=[warmup]`, `files=[input.csv]`로 해석하고 두 번째는 원래 토큰 배열을 본다. 옵션이 없을 수 있으므로 `getOptionValues` 결과를 필수 값처럼 바로 역참조하지 말고 기본값이나 검증을 둔다. `@Order`는 runner 호출 순서만 정한다. 빈 생성 순서나 `@PostConstruct` 순서를 지정하지 않으며, 두 runner 사이의 의존성은 가능하면 메서드 안에서 직접 순서를 보장하거나 한 작업으로 묶는다.

runner가 예외를 밖으로 던지면 시작 과정이 실패한다. 이 경우 `ApplicationFailedEvent`가 진단에 쓰이고 정상적인 `ApplicationReadyEvent` 및 `ACCEPTING_TRAFFIC` 전이는 일어나지 않는다. 필수 마이그레이션·설정 검증처럼 성공 전에는 요청을 처리하면 안 되는 작업은 동기 runner에 두면 준비 상태가 자연스럽게 보호된다. 다만 긴 네트워크 호출은 제한 시간과 재시도 정책을 정하고, 재기동 때 안전하게 다시 실행되도록 멱등성을 확보해야 한다. 실패를 잡아 로그만 남기면 Boot는 정상 기동으로 판단해 준비 상태를 열 수 있으니, 필수 작업의 실패를 삼키지 않는다.

초기화가 무거울 때는 요청 처리 필요성으로 실행 방식을 고른다.

| 방식 | 맞는 경우 | 준비 상태와 주의점 |
|---|---|---|
| `ApplicationRunner`에서 동기 처리 | 모든 요청 전에 반드시 끝나야 하는 데이터 적재·검증 | 끝날 때까지 readiness가 열리지 않는다. 시작 시간 제한에 걸리지 않도록 크기와 시간을 관리한다. |
| 별도 `TaskExecutor`나 `@Async` 작업으로 지연 | 초기 적재 중에도 일부 기능은 안전하게 서비스할 수 있음 | runner가 제출 직후 반환하면 Boot는 곧 준비 상태를 연다. 미준비 데이터에 닿는 경로를 차단하거나 readiness health contributor로 준비 완료까지 제외해야 한다. |
| 배치·별도 작업자로 분리 | 큰 색인 구축, 대량 동기화처럼 앱 기동과 독립시킬 수 있음 | 앱 시작과 데이터 구축의 장애·재시도 주기를 분리한다. 앱은 이전 데이터로 안전하게 동작하는지 정한다. |

검색 색인은 이전 버전으로도 요청을 처리할 수 있다는 전제에서 다음처럼 선택할 수 있다. `TaskExecutor`와 `SearchIndex`는 애플리케이션의 빈이다.

```java
@Bean
ApplicationRunner rebuildSearchIndex(SearchIndex index, TaskExecutor executor) {
    return args -> {
        if (args.containsOption("index-before-ready")) {
            index.rebuild();                 // 완료까지 기동을 보류
        } else {
            executor.execute(index::rebuild); // 요청 가능 상태와 병행
        }
    };
}
```

비동기 분기는 부분 색인이어도 서비스할 수 있을 때만 쓴다. 검색 요청이 완성된 색인을 요구한다면 readiness health check에서 완료 여부를 검사하거나 색인 구축을 별도 배포 단계로 옮긴다. 비동기 작업 예외는 runner 밖에서 발생하므로 별도 로깅·재시도·상태 노출이 필요하다.

예를 들어 매 요청에 필요한 기준 데이터는 첫 방식으로 로드하고, 선택적인 검색 색인은 작업 큐나 별도 작업자로 갱신한다. 비동기화를 택하면서 `ApplicationReadyEvent` 리스너 안에서 긴 작업을 직접 돌리면 이벤트 리스너가 기본적으로 같은 스레드에서 실행되어 readiness 전이를 지연시킬 수 있다. `@PostConstruct`도 refresh 중 빈 초기화에 묶이므로 장시간 작업 위치로 쓰지 않는다. 지연 초기화는 빈 생성 시점을 늦출 뿐 작업 큐나 readiness 정책을 대신하지 않고, 설정 오류 발견을 첫 요청까지 미룰 수 있다.

함정은 “프로세스가 떠 있음”, “컨텍스트가 refresh 됨”, “트래픽을 받아도 됨”을 같은 상태로 보는 것이다. 시작 이벤트에서 runner 완료를 가정하지 말고, 준비 전에도 안전한 경로만 열어 두며, runner 예외와 비동기 초기화 실패가 readiness에 어떻게 반영되는지 함께 설계한다.

참고: SpringApplication — https://docs.spring.io/spring-boot/reference/features/spring-application.html

## 4. 코드로 확인

### 예제 1: 메인 구성 클래스와 의도적인 제외 (미실행)

```java
package com.example.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

여기서 제외하면 `DataSourceAutoConfiguration` 전체가 적용되지 않는다. 데이터베이스 자동 구성이 실패한다고 무조건 제외하지 말고, 조건 리포트와 실패 메시지로 빠진 조건을 먼저 찾는다. 제외 후에는 Boot가 제공하던 데이터소스 기본값도 사라진다. 클래스가 현재 classpath에 없을 수 있는 합성 애노테이션에서는 `excludeName`을 쓴다. `scanBasePackages`를 지정하는 경우는 `@Component` 검색만 늘리는 설정이라는 점을 유의한다.

### 예제 2: 라이브러리 기본 빈과 사용자 대체 허용 (미실행)

```java
package com.acme.audit.autoconfigure;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@AutoConfiguration
public class AuditAutoConfiguration {

    @Configuration(proxyBeanMethods = false)
    @ConditionalOnClass(name = "org.springframework.web.servlet.DispatcherServlet")
    @ConditionalOnProperty(prefix = "acme.audit", name = "enabled", havingValue = "true")
    static class ServletAuditConfiguration {

        @Bean
        @ConditionalOnMissingBean(AuditSink.class)
        AuditSink auditSink() {
            return new DefaultAuditSink();
        }
    }

    public interface AuditSink {
        void record(String event);
    }

    private static final class DefaultAuditSink implements AuditSink {
        @Override
        public void record(String event) {
            System.out.println("audit: " + event);
        }
    }
}
```

Servlet 라이브러리와 `acme.audit.enabled=true`가 있을 때 기본 빈을 제공하고, 같은 타입의 사용자 빈이 있으면 뒤로 물러난다. 실제 공개 API는 별도 파일로 분리한다.

### 예제 3: 자동 구성 JAR 등록과 사용자 오버라이드 (미실행)

자동 구성 모듈의 리소스 파일은 다음 경로에 둔다.

```text
src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

파일 내용은 클래스명 하나씩이다.

```text
com.acme.audit.autoconfigure.AuditAutoConfiguration
```

`acme-spring-boot`는 자동 구성 코드와 메타데이터를, `acme-spring-boot-starter`는 이를 사용하기 위한 의존성 묶음을 제공한다. 외부 클라이언트 라이브러리는 전자에서 선택 의존성으로 둘 수 있다. 단순 기능이면 두 모듈을 합쳐도 된다.

```java
package com.example.shop;

import com.acme.audit.autoconfigure.AuditAutoConfiguration.AuditSink;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class ShopAuditConfiguration {
    @Bean
    AuditSink shopAuditSink() {
        return event -> System.out.println("shop audit: " + event);
    }
}
```

자동 구성 모듈은 `acme.audit` 같은 고유 접두사를 쓰고 `@ConfigurationProperties`와 Javadoc으로 키를 설명한다. `spring`, `server`, `management`는 피한다. JAR 병합 시 imports 리소스 append/merge를 확인한다.

### 조건 평가 리포트 보기 (미실행)

```bash
java -jar shop.jar --debug
```

`--debug`는 일부 핵심 로거를 올리고 조건 리포트를 출력한다. `Positive matches`, `Negative matches`, 제외 목록으로 불일치 조건을 찾는다. 내부 빈 메서드 대신 공개 조건과 사용자 빈으로 조정한다.

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Boot 2.7** — 자동 구성 후보가 커지면서 모든 종류의 팩토리 확장점을 다루던 범용 `spring.factories`에 자동 구성 등록까지 섞지 않도록 전용 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 파일을 도입했다. `@AutoConfiguration`도 2.7.0부터 제공되어 자동 구성 순서와 `proxyBeanMethods=false` 의도를 드러낸다. (2.7 릴리스 노트, `@AutoConfiguration` API)
- **Spring Boot 4.0** — 하나의 큰 의존성 모듈에 기능이 묶여 불필요한 라이브러리까지 끌고 오는 문제를 줄이도록 기술별 소형 모듈과 일관된 스타터 구성을 도입했다. 사용자는 `spring-boot-starter-web` 같은 이전 의존성 이름에 기대지 말고 실제 기능에 맞는 Boot 4 스타터를 선택해야 한다. 예를 들어 MVC는 `spring-boot-starter-webmvc`, Flyway는 `spring-boot-starter-flyway`다. 자동 구성 구현도 사용하려는 Boot 모듈이 classpath에 있는지 확인하고, 선택 의존성을 조건으로 감싸야 한다. (Boot 4.0 마이그레이션 가이드와 릴리스 노트)
- **Spring Boot 4.1.x 기준** — 현재 기준 문서는 4.1.1이며 `@SpringBootApplication`, 조건 애노테이션, `AutoConfiguration.imports`를 그대로 사용한다. Boot 4에서 이동한 기술별 패키지/모듈은 실제 참조 API와 마이그레이션 표를 확인한다. 예를 들어 데이터소스 제외 클래스는 `org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration` 패키지에 있다. (4.1.1 API와 자동 구성 문서)

## 6. 실무 가이드

- 애플리케이션 시작 클래스는 도메인 코드의 공통 루트 패키지에 둔다. 그래야 하위 패키지의 컨트롤러·서비스를 기본 스캔 범위에서 발견한다.
- 기능 라이브러리를 추가해도 자동 구성이 없으면 빈은 자동 생성되지 않는다. 해당 기능의 Boot 스타터가 있는지와 후보 등록 파일을 확인한다.
- 라이브러리 자동 구성은 기본 빈마다 우선 `@ConditionalOnMissingBean`으로 사용자 대체 경로를 둔다. 사용자 쪽은 `@Primary`로 중복을 숨기기보다 같은 타입의 기본 빈이 등록되지 않도록 만드는 것이 기본 추천이다.
- 기능이 classpath에 있을 때만 켜야 하면 `@ConditionalOnClass`를 구성 수준에 두고, 선택 타입을 참조하는 빈 선언은 별도 중첩 구성으로 격리한다.
- 사용자가 기능을 켜고 끄게 해야 하면 `@ConditionalOnProperty(prefix=..., name=..., havingValue="true")`를 쓴다. 속성이 없을 때 켤지 끌지는 의도적으로 정한다.
- 다른 Boot 자동 구성 뒤에 빈 정의가 있어야 하면 `@AutoConfiguration(after = ...)`를 사용한다. 이는 구성 처리 순서만 바꾸므로 런타임 빈 초기화 순서를 보장한다고 가정하지 않는다.
- 시작 실패나 예상 밖 빈 등록을 조사할 때 `java -jar app.jar --debug`를 실행하고 조건 리포트의 실패 사유, 제외, 일치 항목을 확인한다.
- 여러 자동 구성을 제공하거나 옵션 의존성이 있으면 `acme-spring-boot`와 `acme-spring-boot-starter`를 분리한다. 하나의 필수 의존성만 감싸는 작은 기능이면 합친 스타터도 가능하다.
- Boot 4로 올릴 때 직접 선언한 의존성이 많거나 오래된 스타터를 쓴다면 기능별 최신 스타터와 패키지를 대조한다. `starter-test`도 기술별로 제공되는지 확인한다.
- 자동 구성 클래스 자체를 애플리케이션의 `@ComponentScan`에 넣지 않는다. 전용 imports 메타데이터와 `@Import`를 통해 필요한 구성을 제한적으로 연결한다.

## 7. 함정·안티패턴

1. **증상:** 내 `@Service`가 빈으로 안 잡힌다 → **원인:** `@SpringBootApplication` 패키지 아래가 아닌 형제 패키지에 두었다 → **대처:** 메인 클래스를 루트 패키지로 옮기거나 타입 안전한 `scanBasePackageClasses`를 지정한다.
2. **증상:** 자동 구성 기본 빈과 애플리케이션 빈이 함께 등록된다 → **원인:** 자동 구성에 `@ConditionalOnMissingBean`이 빠졌거나 조건 타입과 실제 사용자 빈 타입이 맞지 않는다 → **대처:** 조건 대상을 명확히 하고 자동 구성 기본값이 조건부가 되게 한다. `@Primary`는 두 빈을 제거하지 않는다.
3. **증상:** 조건상 맞아 보이는 빈이 자동 구성되지 않는다 → **원인:** 메서드에 선택 의존성 타입을 반환형으로 선언해 조건 평가 전 클래스 로딩이 실패한다 → **대처:** `@ConditionalOnClass`가 붙은 별도 중첩 구성 안으로 해당 빈을 옮긴다.
4. **증상:** `@ConditionalOnMissingBean`이 있는데도 재정의가 먹지 않는다 → **원인:** 같은 타입이 아닌 구현/생성 팩토리 타입을 조건에서 확인하거나, 다른 자동 구성 처리 순서에 의존한다 → **대처:** 조건 반환 타입을 충분히 구체화하고 가능하면 자동 구성 클래스 수준에서 조건을 둔다.
5. **증상:** 기능 프로퍼티를 `false`로 줘도 자동 구성이 적용된다 → **원인:** 값 존재만 검사하거나 기본 `@ConditionalOnProperty`의 불리언 아닌 값 규칙을 잘못 이해했다 → **대처:** `havingValue="true"`를 지정하고 미설정 시의 동작을 결정한다.
6. **증상:** 앱은 빌드되는데 패키징 후 커스텀 자동 구성이 사라진다 → **원인:** fat JAR 병합 중 같은 경로의 `AutoConfiguration.imports`가 덮어써졌다 → **대처:** Shade/Shadow 설정에서 리소스를 append하고 결과 JAR의 `META-INF/spring` 내용을 확인한다.
7. **증상:** Boot 4 업그레이드 뒤 특정 통합 빈이나 타입이 사라진다 → **원인:** 해당 기술 모듈/스타터가 분리됐거나 클래스 패키지가 이동했다 → **대처:** Boot 4 마이그레이션 표에서 기술별 스타터와 모듈을 추가하고 import 패키지를 고친다.
8. **증상:** 자동 구성 순서를 바꿨지만 실제 빈이 먼저 생성되는 문제는 남는다 → **원인:** `@AutoConfigureBefore/After`를 빈 인스턴스 생성 순서로 오해했다 → **대처:** 구성 정의 의존성을 만들고 실제 초기화 제어는 주입 관계, `@DependsOn` 등으로 표현한다.
9. **증상:** 자동 구성 조건 표현식 평가 중 특정 빈이 너무 일찍 만들어진다 → **원인:** `@ConditionalOnExpression`에서 빈을 참조했다 → **대처:** class/property/bean 조건 애노테이션으로 나눠 표현한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `@SpringBootApplication`은 어떤 기능을 켜며, 컴포넌트 스캔 범위는 무엇으로 정해지나?
`@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@ComponentScan`의 합성 애노테이션이다. 기본 스캔 기준은 이 애노테이션이 붙은 클래스의 패키지다. 자동 구성 후보 검색은 컴포넌트 스캔과 별도 경로다.

**꼬리질문:** `scanBasePackages`가 엔티티도 찾나? **답:** 아니다. 엔티티/저장소 탐색은 별도 설정이다.

### Q2. 스타터를 추가하면 자동 구성이 무조건 켜지나?
아니다. 스타터는 의존성 묶음이다. 자동 구성 JAR가 후보를 등록하고, 관련 조건이 맞아야 빈 정의가 등록된다. 따라서 의존성 트리와 조건 리포트를 함께 본다.

**꼬리질문:** `DataSource`가 없으면? **답:** JDBC 드라이버/스타터와 조건 평가, 제외 목록을 본다.

### Q3. `AutoConfiguration.imports`는 무엇이고 왜 필요한가?
라이브러리 JAR가 제공하는 자동 구성 클래스 이름 목록이다. Boot의 지연 import 선택자가 이를 발견해 조건 평가 대상으로 만든다. 구성은 컴포넌트 스캔 대신 명시적인 메타데이터로 공개한다.

**꼬리질문:** JAR 병합 시 주의점은? **답:** imports 파일을 append/merge해 덮어쓰지 않는다.

### Q4. `@ConditionalOnMissingBean`은 어떤 문제를 막나?
라이브러리의 기본 빈이 사용자가 제공한 대체 빈과 중복 등록되는 일을 막는다. 조건은 현재까지 처리된 빈 정의를 보므로 순서가 중요하다. Boot는 빈 조건을 자동 구성 클래스에 두는 편을 권한다.

**꼬리질문:** `@Primary`가 해결하나? **답:** 선택 우선순위만 정해 중복 빈은 남는다.

### Q5. 선택 라이브러리 타입을 `@Bean` 반환형에 바로 써도 되나?
그 타입이 없는 환경에서 JVM 클래스 로딩이 먼저 실패할 수 있다. `@ConditionalOnClass`가 구성 클래스 수준에서 메타데이터로 판정하도록 하고, 선택 타입을 사용하는 빈을 별도 구성으로 분리한다.

**꼬리질문:** `name`은 언제 쓰나? **답:** 합성 애노테이션에서 선택 클래스를 문자열로 참조할 때다.

### Q6. `@AutoConfiguration(after = X.class)`는 무엇의 순서를 정하나?
자동 구성 클래스의 정의 처리 순서를 정한다. 이 순서는 정의되는 빈 인스턴스의 생성 순서와 같지 않으며, 실제 생성은 의존 그래프와 `@DependsOn` 등에 좌우된다.

**꼬리질문:** 서로 참조 없는 구성 순서는? **답:** `afterName`/`beforeName`이나 `@AutoConfigureOrder`를 쓴다.

### Q7. `--debug` 조건 리포트에서 무엇을 읽어야 하나?
어떤 자동 구성이 positive/negative match인지, 어떤 조건에서 불일치했는지와 제외 내역을 본다. 단순히 “자동 구성이 없다”가 아니라 classpath, 프로퍼티, 기존 빈 가운데 어느 전제가 깨졌는지 찾는다.

**꼬리질문:** Actuator endpoint인가? **답:** 아니다. 시작 로그의 진단 리포트다.

### Q8. Boot 4로 업그레이드하며 자동 구성 의존성을 왜 다시 봐야 하나?
Boot 4는 큰 모듈을 기술별 소형 모듈과 일관된 스타터들로 나눴다. 특히 스타터에 기대던 암묵적 전이 의존성과 클래스 패키지 경로가 달라질 수 있다. 마이그레이션 가이드에서 기술별 main/test 스타터를 대조한다.

**꼬리질문:** 데이터소스 import도 바뀔 수 있나? **답:** 그렇다. 기술별 모듈/패키지 이동의 영향을 받는다.

## 9. 참고문헌

- Creating Your Own Auto-configuration — https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html — 조건과 커스텀 스타터.
- Auto-configuration — https://docs.spring.io/spring-boot/reference/using/auto-configuration.html — 기본 동작과 제외·진단.
- SpringApplication — https://docs.spring.io/spring-boot/reference/features/spring-application.html — 기동 이벤트 순서.
- Structuring Your Code — https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html — 메인 클래스와 스캔 범위.
- SpringBootApplication API (4.1.1) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/SpringBootApplication.html — 합성 구성과 애트리뷰트.
- AutoConfiguration API (4.1.1) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/AutoConfiguration.html — imports 발견, 조건, 순서.
- AutoConfigurationImportSelector API (4.1.1) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/AutoConfigurationImportSelector.html — 후보 선택과 제외.
- Spring Boot 2.7 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.7-Release-Notes — imports 메타데이터 도입.
- Spring Boot 4.0 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes — 4.0 변경 사항.
- Spring Boot 4.0 Migration Guide — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide — 모듈·스타터 구조.
