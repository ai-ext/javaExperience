# S04. 외부 설정·프로파일

> 설정은 코드 밖에서 주입하되, 우선순위와 바인딩 방식을 알고 있어야 운영값이 예측 가능하다.
> 여러 키를 함께 관리할 때는 `@ConfigurationProperties`로 타입·검증·메타데이터를 한곳에 둔다.
> 환경 분기는 프로파일로 하고, 비밀값은 배포 환경의 비밀 저장소나 마운트 파일로 공급한다.

## 1. 왜 알아야 하나

개발 환경에서는 정상인데 배포에서 엉뚱한 DB에 붙는다면 설정이 사라진 게 아니라 더 높은 우선순위에 덮였을 수 있다. 파일에 운영 주소가 있어도 `SPRING_DATASOURCE_URL`이 테스트 DB를 가리키면 환경변수가 이긴다. 파일만 보는 디버깅으로는 원인을 놓친다.

프로파일을 단순히 “설정 파일 이름”으로 이해해도 장애가 난다. `spring.profiles.active=prod`를 `application-prod.yml` 안에 넣으면 안 된다. 프로파일을 활성화하는 속성은 어느 문서를 읽을지 결정하는 로딩 단계에서 필요한데, 이미 활성화 결과에 따라 선택될 파일 안에서 다시 활성화 조건을 바꾸려는 순환이 되기 때문이다. 프로파일 그룹을 잘못 놓으면 DB·메시징 설정이 일부만 로드되기도 한다.

설정을 필드마다 `@Value`로 흩뿌리면 오타와 단위 혼동이 첫 요청에서야 드러날 수 있다. 운영 입력은 경계에서 묶고 검증해 런타임 오류를 막아야 한다.

## 2. 핵심 개념

| 용어 | 뜻 | 운영에서 기억할 점 |
|---|---|---|
| `PropertySource` | `Environment`에 키-값을 제공하는 출처 | 같은 키가 겹치면 높은 우선순위가 이긴다. |
| Config Data | application 파일과 import를 처리하는 체계 | 프로파일 문서와 `spring.config.import`를 해석한다. |
| `application.yml` | 클래스패스나 외부 디렉터리의 기본 설정 | `application-{profile}.yml`은 프로파일별 설정이다. |
| 프로파일 | 빈·설정을 실행 환경별로 분리하는 이름 | `active`는 활성화, `on-profile`은 문서 조건이다. |
| 프로파일 그룹 | 여러 프로파일을 논리적 이름에 매핑 | `production`으로 `proddb`, `prodmq`를 함께 켠다. |
| `@ConfigurationProperties` | 접두사 속성을 객체로 바인딩 | 묶음·중첩·검증·IDE 메타데이터에 적합하다. |
| `@Value` | 단일 속성을 빈에 주입 | 단일 값이나 SpEL에 적합하다. |
| relaxed binding | 표기 변형을 같은 속성으로 연결 | `connect-timeout`을 `connectTimeout`에 바인딩한다. |
| config tree | 파일명을 키, 내용을 값으로 노출 | `configtree:`로 Secret/ConfigMap 볼륨을 읽는다. |
| 설정 메타데이터 | 설정 설명·타입의 컴파일 산출물 | 런타임 입력·검증 기능은 아니다. |

### 헷갈리기 쉬운 구분

| 비교 | 차이 |
|---|---|
| `spring.profiles.active` vs `spring.config.activate.on-profile` | 앞은 어떤 프로파일을 활성화할지 결정한다. 뒤는 현재 설정 문서를 어떤 프로파일에서 적용할지 조건을 붙인다. |
| `spring.profiles.active` vs `spring.profiles.include` | `active`는 활성 프로파일 목록을 지정하며 더 높은 우선순위의 값으로 대체될 수 있다. `include`는 추가 프로파일을 보탠다. |
| 프로파일 그룹 vs `include` | 그룹은 `production` 같은 별칭에 세부 프로파일을 묶어 한 번에 켠다. `include`는 활성 프로파일에 추가 이름을 직접 보탠다. |
| `@ConfigurationProperties` vs `@Value` | 전자는 타입이 있는 구성 객체로 바인딩하고 relaxed binding·메타데이터를 제공한다. 후자는 점 단위 주입과 SpEL 평가가 가능하다. |
| 기본 설정 파일 vs 프로파일별 설정 파일 | 기본 파일은 모든 환경의 공통값을 둔다. 프로파일별 파일은 해당 프로파일에서 바꾸거나 추가할 값만 둔다. |
| `spring.config.import` vs `spring.config.location` | import는 현재 설정 문서가 추가 설정 위치를 가져온다. location 계열은 설정 파일을 어디에서 찾을지 지정하는 시작 위치에 영향을 준다. |

## 3. 내부 동작·원리

### 3.1 값은 PropertySource 순서대로 합성된다

Spring Boot는 설정을 한 파일에서만 읽지 않는다. 먼저 여러 출처를 `Environment`에 연결하고, 같은 키가 있으면 나중 순위의 값을 사용한다. Boot 4.1 참조 문서의 우선순위를 낮은 쪽에서 높은 쪽으로 요약하면 다음과 같다.

1. `SpringApplication.setDefaultProperties()`로 둔 기본 속성
2. `@Configuration`에 선언한 `@PropertySource` — 컨텍스트 refresh 과정에서 추가되므로 `logging.*`, `spring.main.*`처럼 refresh 전에 읽히는 설정에는 너무 늦다.
3. Config Data — `application.properties`/YAML, 프로파일별 문서, import한 설정
4. `random.*`를 제공하는 `RandomValuePropertySource`
5. OS 환경변수
6. Java 시스템 속성 (`System.getProperties()`)
7. JNDI (`java:comp/env`)
8. `ServletContext` 초기화 파라미터
9. `ServletConfig` 초기화 파라미터
10. `SPRING_APPLICATION_JSON`으로 넣은 인라인 JSON
11. 커맨드라인 옵션 (`--key=value`)
12. 테스트 애노테이션의 `properties` 속성
13. 테스트의 `@DynamicPropertySource`
14. 테스트의 `@TestPropertySource`
15. Devtools 활성화 시 전역 설정

예를 들어 환경변수는 `application.yml`보다 높고 `@TestPropertySource`는 테스트 파일보다 높다. 예상과 다르면 `Environment` 또는 Actuator의 `env`, `configprops`로 출처를 확인한다. 진단 엔드포인트는 정보 노출을 통제한다.

### 3.2 Config Data 안에서도 순서가 있다

Config Data 파일끼리만 보면 다음 순서로 뒤의 항목이 앞의 항목을 덮는다.

```text
JAR 안 application.properties / application.yml
  < JAR 안 application-{profile}.properties / .yml
  < JAR 밖 application.properties / application.yml
  < JAR 밖 application-{profile}.properties / .yml
  < OS 환경변수·시스템 속성·커맨드라인 등 상위 PropertySource
```

기본 파일에 공통값을 두고 프로파일 파일에는 차이만 둔다. `.properties`와 YAML을 같은 위치에 함께 두면 `.properties`가 우선하므로 한 프로젝트에서 형식을 통일한다. YAML은 `---`, Properties는 `#---`로 문서를 나눌 수 있고 각 문서는 `spring.config.activate.on-profile` 조건을 가질 수 있다.

### 3.3 프로파일 이름은 “실행 모드”가 아니라 조합 키다

시작할 때 `spring.profiles.active`가 프로파일을 정하고, 지정이 없으면 `default`가 활성화된다. `spring.profiles.default=none`으로 기본 프로파일을 없앨 수 있으며, 커맨드라인 `--spring.profiles.active=prod`는 파일 설정을 덮는다. 활성화 후 `application-prod.yml`이 읽힌다. `spring.config.activate.on-profile=prod`는 한 파일의 문서 조건이고 `@Profile("prod")`는 빈 등록 조건이다.

`production` 그룹에 `proddb`, `prodmq`를 선언하면 그룹을 켰을 때 구성원도 함께 켜진다. `spring.profiles.active`, `default`, `include`, `group`은 프로파일 선택 전에 읽어야 하므로 프로파일별 파일이나 조건부 문서 안에 선언할 수 없다.

### 3.4 설정 바인딩은 이름을 정규화하고 타입을 변환한다

등록된 `@ConfigurationProperties("payment.client")`는 Binder가 Environment에서 접두사 속성을 찾아 타입에 맞게 채운다. `connect-timeout`은 Java의 `connectTimeout`에 바인딩된다. 환경변수는 점을 `_`로, 이름을 대문자로 바꾸고 하이픈을 제거한다. 예: `my.service.remote-address` → `MY_SERVICE_REMOTEADDRESS`; 목록 인덱스는 밑줄로 감싼 숫자를 쓴다.

이 규칙이 relaxed binding이다. 접두사와 파일 키는 소문자 kebab-case로 통일한다. 기간 같은 값은 타입 변환을 활용해 수기 단위 계산을 피한다. 목록은 더 높은 우선순위에서 항목별 병합되지 않고 전체 교체되므로 프로파일별 완성 목록 또는 Map을 사용한다.

### 3.5 바인딩 다음에 검증하고 빈이 사용한다

값은 바인딩·변환된 뒤 빈에서 사용된다. `@Validated` 타입은 Jakarta Validation 공급자와 `@NotBlank`, `@Min` 같은 제약으로 기동 시 검증할 수 있고, 중첩 객체는 `@Valid`로 cascade한다.

구성 타입은 `@ConfigurationPropertiesScan` 또는 `@EnableConfigurationProperties`로 등록해야 한다. `@Value`는 SpEL을 지원하지만 `@ConfigurationProperties`와 같은 메타데이터·relaxed binding을 제공하지 않으므로 단일 값에 적합하다.

### 3.6 외부 파일을 Config Data로 가져온다

`spring.config.import`는 추가 파일을 가져온다. 선택 파일에만 `optional:`을 붙인다. Kubernetes가 ConfigMap·Secret을 키별 파일로 마운트하면 `configtree:`로 디렉터리 파일명을 키, 내용을 값으로 읽는다. 예를 들어 `/etc/config/myapp/username`은 `myapp.username`이다. YAML 문서 하나가 마운트되면 YAML 파일로 import한다.

### 3.7 메타데이터는 개발 도구를 돕는다

`spring-boot-configuration-processor`는 컴파일 때 설정 메타데이터를 생성해 IDE의 자동완성·설명을 돕는다. 추가 힌트는 `additional-spring-configuration-metadata.json`으로 보완할 수 있다. 메타데이터는 런타임 바인딩이나 검증을 하지 않는다.

## 4. 코드로 확인

아래 예제는 Spring Boot 4.1.x를 기준으로 하며, `spring-boot-starter-validation`을 의존성에 포함한다고 가정한다. 예제는 Spring 애플리케이션이므로 이 환경에서 실행하지 않았다. 1번 예제의 메인 애플리케이션을 나머지 예제에도 사용한다.

### 예제 1 — 타입 안전한 속성, 기본값, 검증

`application.yml`:

```yaml
payment:
  provider: acme
  connect-timeout: 2s
  max-attempts: 3
```

```java
package example.payment;

import java.time.Duration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.validation.annotation.Validated;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PaymentApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentApplication.class, args);
    }
}

@ConfigurationProperties("payment")
@Validated
record PaymentProperties(
        @NotBlank String provider,
        Duration connectTimeout,
        @Min(1) int maxAttempts) {
}
```

`PaymentProperties`에 `@ConfigurationPropertiesScan`으로 등록된 설정이 바인딩된다. `connect-timeout`은 Java 이름 `connectTimeout`과 매칭된다. `max-attempts: 0`이나 빈 `provider`는 검증에서 기동 실패로 바뀐다. 프로덕션에서 검증 애노테이션이 작동하려면 Jakarta Validation 구현체가 필요하다. (Spring 예제, 미실행)

### 예제 2 — 운영 프로파일 그룹과 문서 조건

`application.yml`의 프로파일 그룹은 일반 문서에 둔다. 커맨드라인에서 그룹 이름을 활성화하면 관련 프로파일이 함께 켜진다.

```yaml
spring:
  profiles:
    group:
      production:
        - proddb
        - prodmq

service:
  banner: local-default
---
spring:
  config:
    activate:
      on-profile: production

service:
  banner: production
```

```properties
# application-proddb.properties
spring.datasource.url=jdbc:postgresql://db.internal:5432/orders
```

```shell
java -jar payment.jar --spring.profiles.active=production
```

기동 후 `production`, `proddb`, `prodmq`가 활성화되고, 문서 조건을 만족해 배너 값도 `production`으로 바뀐다. 그룹 선언이나 `spring.profiles.active`를 조건부 두 번째 문서에 넣으면 안 된다. 실제 메시징 설정이 필요하면 `application-prodmq.yml`처럼 구성원 프로파일 설정 파일에 둔다. (Spring 예제, 미실행)

### 예제 3 — Kubernetes Secret 볼륨을 config tree로 읽기

마운트된 디렉터리 구조를 다음과 같이 둔다. 파일 내용은 플랫폼의 Secret에서 공급하며 저장소에 올리지 않는다.

```text
/etc/config/
└── payment/
    ├── api-key
    └── endpoint
```

`application.yml`:

```yaml
spring:
  config:
    import: "optional:configtree:/etc/config/"
```

이 디렉터리는 `payment.api-key`, `payment.endpoint` 속성을 제공한다. 값을 `Environment`에서 읽거나 다음처럼 설정 객체로 묶을 수 있다.

```java
package example.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("payment")
record PaymentEndpoint(String apiKey, String endpoint) {
}
```

실제 운영에서 두 파일이 꼭 있어야 한다면 `optional:`을 제거해 설정 누락을 기동 단계에서 실패시키고, 선택적 개발 환경에서만 optional import를 쓴다. 로그에 설정 객체 전체를 출력하면 키가 노출될 수 있으므로 비밀값 필드는 마스킹한다. (Spring 예제, 미실행)

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Boot 2.4** — 복잡한 파일 처리와 프로파일 활성화 설정을 위해 Config Data 처리가 바뀌었다. `spring.config.import`가 도입됐으며 없는 위치를 무시하려면 명시적으로 `optional:`을 붙인다. 근거: [Spring Boot 2.4 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.4-Release-Notes).
- **Spring Boot 4.1.x (이 문서의 기준)** — 공통 규칙에 지정된 현재 기준은 4.1.1이다. 이 문서는 공식 4.1 레퍼런스의 현재 설정 계약을 따른다. 이 주제에 대해 2.4의 Config Data 도입에 견줄 별도 변경 사항은 이번 조사에서 확인하지 못했다.

## 6. 실무 가이드

- 여러 관련 값(DB 클라이언트, 외부 API, 재시도 정책)이 한 덩어리면 `@ConfigurationProperties`로 묶어라. **기본값 추천: `@ConfigurationProperties` + 생성자 기반 record + 시작 시 검증.** 값의 소유 관계가 한 타입에 모이고, 파일 키 자동완성·검증·테스트가 쉬워진다.
- 단일 문자열 하나를 컴포넌트에서 즉시 써야 하고 설정 계약으로 재사용하지 않는다면 `@Value`를 써라. 단, placeholder 이름은 `@Value("${payment.provider}")`처럼 canonical kebab-case로 적는다.
- 공통값은 `application.yml`, 환경별 값은 `application-{profile}.yml`이나 배포 주입으로 나눠라. DB·메시징 프로파일은 `production` 그룹으로 묶는다.
- 설정 문서 일부만 프로파일 조건에 따라 적용하면 `spring.config.activate.on-profile`을 사용하라. 빈을 프로파일에 따라 등록하려면 `@Profile`을 써라. 두 기능은 작동 단계가 다르다.
- 외부 환경변수로 값을 덮도록 운영한다면 같은 키가 기본 YAML·외부 YAML·환경변수 어디에 있는지 배포 정의와 함께 추적하라. 원인 분석 때는 추측 대신 최종 PropertySource와 `env`/`configprops`를 확인하라.
- 하나의 YAML/Properties 파일을 추가할 때 `spring.config.import`를 써라. 플랫폼에 따라 파일이 없을 수 있다면 `optional:`을 붙이고, 반드시 필요한 운영 설정이면 필수 import로 두어 누락 즉시 실패시켜라.
- Kubernetes가 키별 파일을 볼륨으로 마운트하면 `configtree:`를 사용하라. 한 파일에 여러 키가 들어 있는 경우에는 그 파일 형식 그대로 import한다.
- 비밀번호, 토큰, 개인키는 JAR 안 `application.yml`이나 형상관리 저장소에 넣지 않는다. Secret Manager나 Kubernetes Secret 등 배포 플랫폼의 비밀 전달 방법으로 주입하고, 로그·오류 메시지·진단 엔드포인트의 노출도 통제한다.
- 필수 키 누락·형식 오류·범위 밖 값은 기동 실패로 검증해 첫 외부 호출까지 오류가 잠복하지 않게 한다.
- IDE 자동완성을 제공하는 라이브러리나 공통 모듈을 만들면 `spring-boot-configuration-processor`를 annotation processor로 등록하고 설명 메타데이터를 제공하라. 메타데이터만으로 입력 검증이 되리라 기대하지 않는다.

Spring Cloud Config 서버·클라이언트의 원격 설정 운영은 여기서 다루지 않는다. → S20 참조

## 7. 함정·안티패턴

1. **환경변수가 파일값을 덮음** — 증상: 배포에서만 다른 DB나 API 주소를 사용한다. 원인: OS 환경변수는 Config Data보다 높은 우선순위다. 대처: `SPRING_DATASOURCE_URL` 등 동일 키를 배포 매니페스트와 컨테이너 환경에서 찾고, 최종 출처를 진단한다.
2. **프로파일을 프로파일 설정 파일에서 켬** — 증상: `application-prod.yml`에 적은 `spring.profiles.active`가 기대대로 처리되지 않거나 설정이 순환적으로 꼬인다. 원인: 활성화는 해당 파일을 선택하기 전에 결정된다. 대처: 기본 문서, 환경변수, 커맨드라인, `SpringApplication.setAdditionalProfiles()`처럼 초기 설정 출처에서 활성화한다.
3. **프로파일 그룹 속성을 조건부 문서에 선언** — 증상: `prod`는 켰는데 `proddb`, `prodmq`가 함께 켜지지 않는다. 원인: `spring.profiles.group`은 non-profile-specific 문서에서만 처리된다. 대처: 그룹 선언을 일반 `application.yml` 문서로 옮긴다.
4. **목록은 프로파일 사이에서 합쳐질 것이라 기대** — 증상: 운영 프로파일을 켜자 공통 목록의 나머지 항목이 사라진다. 원인: 높은 우선순위의 목록이 낮은 목록을 항목별로 병합하지 않고 전체 대체한다. 대처: 프로파일별 완성 목록을 선언하거나 Map처럼 키로 조합 가능한 자료구조를 사용한다.
5. **`.properties`와 YAML을 같은 경로에 둠** — 증상: 수정한 YAML이 반영되지 않고 예전 값이 남는다. 원인: 같은 위치에서는 `.properties`가 우선한다. 대처: 프로젝트에 한 형식만 두고 중복 키를 검색한다.
6. **필수 설정에 `optional:`을 습관적으로 사용** — 증상: Secret 파일이 빠진 배포도 시작은 되고, 이후 호출 때 인증 실패가 난다. 원인: 파일 누락 오류를 무시하도록 선언했다. 대처: 선택 입력에만 optional을 쓰고 필수 키는 검증과 필수 import로 시작 시 실패시킨다.
7. **`@ConfigurationProperties` 클래스 미등록** — 증상: 설정 객체 생성/주입이 되지 않거나 예상한 값이 바인딩되지 않는다. 원인: 타입 애노테이션은 컴포넌트 자동 등록 애노테이션이 아니다. 대처: `@ConfigurationPropertiesScan` 또는 `@EnableConfigurationProperties`로 명시적으로 등록한다.
8. **환경변수 이름을 Java 필드 표기 그대로 변환** — 증상: `connect-timeout` 설정이 누락되어 `Duration` 기본값 또는 0에 가까운 동작을 한다. 원인: 환경변수 바인딩은 점·하이픈·목록 인덱스를 정해진 규칙으로 정규화한다. 대처: canonical 프로퍼티 이름과 변환 규칙을 배포 설정에 문서화하고 기동 검증을 건다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `application.yml`의 운영 주소가 있는데 환경변수 주소로 연결되는 이유는?

**답:** Boot는 높은 우선순위의 `PropertySource` 값을 적용한다. OS 환경변수는 Config Data보다, 커맨드라인은 환경변수보다 우선한다. 파일 대신 `Environment`에서 최종값과 출처를 확인한다.

**꼬리질문:** `@PropertySource`로 `spring.main.*`를 설정하면 왜 늦을 수 있나?

**답:** `@PropertySource`는 컨텍스트 refresh 중 추가된다. `spring.main.*`처럼 refresh보다 앞서 필요한 속성은 읽힌 시점에 출처가 아직 추가되지 않았을 수 있다.

### Q2. `spring.profiles.active`와 `spring.config.activate.on-profile`의 차이를 설명하라.

**답:** `spring.profiles.active`는 활성 프로파일 목록을 정하는 입력이다. `spring.config.activate.on-profile`은 그 설정 문서를 어떤 프로파일에서 적용할지 정하는 조건이다. 전자는 “무슨 프로파일로 실행할까”, 후자는 “이 문서를 언제 반영할까”에 해당한다. 활성 프로파일은 일반 문서나 명령행에서 지정하고 문서 조건에 따라 활성화를 되풀이하지 않는다.

**꼬리질문:** `@Profile`은 둘 중 어디에 가까운가?

**답:** 설정 문서 조건과 같이 특정 프로파일을 기준으로 동작하지만 적용 대상은 빈 등록이다. `@Configuration`·`@Component`를 조건부 생성하고, YAML 문서의 PropertySource 선택과는 다른 단계에서 평가된다.

### Q3. 프로파일 그룹은 어떤 문제를 해결하며 `include`와 어떻게 다른가?

**답:** 운영을 `proddb`, `prodmq`처럼 기능 단위로 분리해도 배포 명령마다 여러 이름을 적으면 빠뜨리기 쉽다. 그룹 `production`을 정의하면 별칭 하나를 활성화해 구성원들을 함께 켤 수 있다. `include`는 활성 목록에 이름을 추가하는 속성이고, 그룹은 자주 함께 쓰는 세트를 의미 있는 이름으로 선언한다. 둘 모두 프로파일 전용 문서가 아닌 문서에서 정의한다.

**꼬리질문:** `spring.profiles.group.production`을 `application-production.yml`에 두면?

**답:** 안 된다. 그룹 정의는 `production`이 활성화되기 전에 읽혀야 하므로 프로파일별 설정 파일 또는 프로파일 조건 문서 안에 놓을 수 없다.

### Q4. 왜 여러 설정 키를 `@Value`로 각각 주입하지 않고 `@ConfigurationProperties`로 묶는가?

**답:** 설정 객체는 관련 값의 접두사, 타입, 구조를 코드에 드러낸다. relaxed binding과 메타데이터, 객체 단위 검증을 지원해 키 오타와 잘못된 값이 기동 때 발견되기 쉽다. 반면 `@Value`는 단일 값 주입에 간결하고 SpEL이 필요할 때 유용하다. 여러 키를 하나의 계약으로 다룰 때는 구성 타입이 유지보수에 유리하다.

**꼬리질문:** `@Value`를 써야 한다면 프로퍼티 이름을 어떻게 표기하나?

**답:** `${payment.connect-timeout}`처럼 canonical kebab-case로 쓴다. 환경변수 및 파일의 정규화 규칙을 활용하기 쉽고 표기 변형에 덜 민감하다.

### Q5. relaxed binding은 무엇이며 환경변수 이름을 어떻게 만들까?

**답:** 설정 이름의 대소문자, 하이픈, 밑줄 등 표기 차이를 Binder가 Java 속성과 대응시키는 규칙이다. 파일에는 `payment.connect-timeout`, Java에는 `connectTimeout`을 쓸 수 있다. 환경변수에서는 점을 `_`로 바꾸고 대문자로 만들며 하이픈은 제거한다. 목록 인덱스는 환경변수에서 밑줄 사이 숫자로 표현한다.

**꼬리질문:** 그러면 프로퍼티 이름을 camelCase나 임의 표기로 섞어도 괜찮나?

**답:** 바인딩이 허용하는 표기는 많아도 저장소 키와 접두사는 kebab-case로 통일한다. 허용 변형을 남용하면 운영 변수명이 서로 다르게 작성돼 누락 원인이 된다.

### Q6. `@Validated`만 붙이면 중첩 설정도 자동으로 검증되는가?

**답:** 상위 `@ConfigurationProperties` 타입에 `@Validated`를 붙이고 Jakarta Validation 공급자와 제약 애노테이션이 있어야 검증된다. 중첩 객체는 상위 필드에 `@Valid`를 두어 cascading 검증을 켠다. 이 검증은 설정 빈 생성 시 실행되므로 잘못된 값으로 서버가 뜨는 것을 막는다.

**꼬리질문:** 설정 메타데이터도 `max-attempts >= 1`을 강제하는가?

**답:** 아니다. 메타데이터는 IDE 자동완성과 설명에 쓰인다. 입력 제약은 `@Min(1)` 같은 실제 Validation 규칙으로 선언한다.

### Q7. Kubernetes ConfigMap과 Secret을 `configtree:`로 읽는 기준은?

**답:** 디렉터리에 각 설정 키가 파일명, 각 값이 파일 내용으로 마운트되는 트리 형태에 쓴다. 예를 들어 `etc/config/payment/api-key`는 `payment.api-key`가 된다. 단일 파일 안에 YAML 문서가 통째로 있다면 그 형식을 import하고 config tree로 오해하지 않는다.

**꼬리질문:** Secret 파일이 운영에 반드시 필요한데 import를 `optional:`로 지정해도 되나?

**답:** 필수값에는 부적절하다. 누락 오류를 감춰 뒤늦은 인증 실패로 바뀔 수 있다. 필수 import와 설정 검증을 사용해 부팅 시 실패하게 한다.

### Q8. 활성 프로파일에서 목록 항목을 하나만 수정하면 기본 목록에 덧붙는가?

**답:** 아니다. 여러 문서의 복합 속성이 항상 필드 단위로 합쳐지지는 않는다. 특히 `List`는 높은 우선순위 문서의 목록으로 통째로 대체된다. 프로파일별 완성 목록을 적거나, 항목별 식별자가 있는 Map으로 모델링해야 한다.

**꼬리질문:** 공통 설정 파일이 있어도 외부 YAML을 함께 둘 수 있나?

**답:** 가능하지만 같은 디렉터리에서 `.properties`와 YAML을 동시에 두면 `.properties`가 우선한다. 형식 하나를 선택하고 외부 프로파일 파일이 기본값을 어떻게 덮는지 의도적으로 관리한다.

## 9. 참고문헌

- Externalized Configuration :: Spring Boot — https://docs.spring.io/spring-boot/reference/features/external-config.html — `PropertySource` 순서, Config Data, relaxed binding, 검증, config tree, 메타데이터 및 `@Value` 비교를 확인했다.
- Profiles :: Spring Boot — https://docs.spring.io/spring-boot/reference/features/profiles.html — 활성·기본 프로파일, 그룹, 프로파일별 문서와 그룹 정의 제약을 확인했다.
- Spring Boot 2.4 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.4-Release-Notes — Config Data 파일 처리 변경과 `spring.config.import`, optional 위치 의미를 확인했다.
- Generating Your Own Metadata by Using the Annotation Processor :: Spring Boot — https://docs.spring.io/spring-boot/specification/configuration-metadata/annotation-processor.html — `spring-boot-configuration-processor`의 컴파일 처리 및 추가 메타데이터 설정을 확인했다.
