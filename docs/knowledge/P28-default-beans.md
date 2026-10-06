# P28. Spring Boot가 기본으로 만드는 빈들 — 무엇이, 왜, 어떻게 확인·교체하나

> - 스타터를 추가하면 클래스패스와 설정 조건에 맞는 자동 구성이 기본 빈을 등록한다.
> - 기본 빈은 `--debug`, `/actuator/conditions`, `/actuator/beans`로 각각 이유·조건·결과를 확인한다.
> - 바꿀 때는 프로퍼티나 전용 커스터마이저를 우선 쓰고, 같은 역할의 빈을 직접 제공하면 자동 구성이 물러나는지 확인한다.

## 1. 한 줄로 말하면

Spring Boot 기본 빈은 애플리케이션 클래스패스, 설정 프로퍼티, 이미 등록된 빈을 살펴 자동 구성이 컨테이너에 추가하는 객체다. 웹 서버, MVC 처리기, JSON 변환기, 데이터 접근 객체처럼 매번 손으로 만들 필요가 없는 기반 부품을 앱이 바로 쓸 수 있게 한다. (빈의 개념은 → P12.)

## 2. 당장 알아야 할 것

1. **스타터가 클래스패스를 채운다.** WebMVC, Data JPA 등 기능 라이브러리가 들어오면 Boot가 클래스패스·프로퍼티·기존 빈을 조건으로 자동 구성을 평가한다.
2. **기본 빈은 시작 때 등록된다.** `@SpringBootApplication`이 자동 구성을 켜고, 조건에 맞은 구성의 `@Bean` 메서드가 결과를 컨테이너에 등록한다.
3. **빈 이름과 타입을 함께 확인한다.** 실측 예로 `dataSource`, `dispatcherServlet`, `jacksonJsonMapper`가 있다. 앱마다 결과가 다르므로 이름을 고정 계약으로 가정하지 않는다.
4. **사용자 빈이 기본 구성을 물릴 수 있다.** `@ConditionalOnMissingBean`은 특정 타입·이름이 없을 때만 기본 빈을 만든다. 정확한 조건은 리포트에서 확인한다.
5. **프로퍼티·커스터마이저를 먼저 검토한다.** 포트는 `server.port`, DB는 `spring.datasource.*`, Jackson 3는 `spring.jackson.*`로 조정한다. `JsonMapperBuilderCustomizer`는 기본 매퍼 빌더를 확장한다.
6. **Actuator 목록은 자동 공개되지 않는다.** `/actuator/beans`와 `/actuator/conditions`를 HTTP에서 보려면 endpoint를 노출 설정에 포함한다. 실측 333개는 이 프로젝트만의 결과다.

### starter에서 확인된 주요 기본 빈

아래 값은 `_data/evidence/starter-beans.tsv`의 실제 등록 결과다. `entityManagerFactory`처럼 팩토리나 프록시를 거치는 객체는 런타임 표시 타입이 인터페이스 이름과 다를 수 있다. 메시지 컨버터는 별도 빈으로 보이지 않고 `requestMappingHandlerAdapter` 내부의 MVC 구성 요소로 다뤄진다.

| 빈 이름 | 실측 타입 | 역할 | 어떤 스타터·자동 구성이 만드나 | 바꾸려면 |
|---|---|---|---|---|
| `tomcatServletWebServerFactory` | `org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory` | 내장 Tomcat 생성 | WebMVC와 Tomcat 자동 구성 | `server.*`; 서버 교체는 의존성과 설정 점검 |
| `dispatcherServlet` | `org.springframework.web.servlet.DispatcherServlet` | MVC 요청을 핸들러에 전달 | WebMVC 자동 구성 | 보통 컨트롤러·`WebMvcConfigurer`로 확장 |
| `requestMappingHandlerAdapter` | `org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter` | 컨트롤러 호출과 요청·응답 변환 | WebMVC 자동 구성 | `WebMvcConfigurer#extendMessageConverters`; 통째 교체는 MVC 기본 설정 손실 주의 |
| `errorAttributes` / `basicErrorController` | `org.springframework.boot.webmvc.error.DefaultErrorAttributes` / `org.springframework.boot.webmvc.autoconfigure.error.BasicErrorController` | 기본 오류 정보와 `/error` 처리 | WebMVC 오류 자동 구성 | API 오류 형식은 `@ControllerAdvice` |
| `jacksonJsonMapper` | `tools.jackson.databind.json.JsonMapper` | Jackson 3 JSON 매핑 | JSON·WebMVC 자동 구성 | `spring.jackson.*` 또는 `JsonMapperBuilderCustomizer` |
| `dataSource` | `com.zaxxer.hikari.HikariDataSource` | JDBC 연결 풀 | JDBC 자동 구성과 HikariCP | `spring.datasource.*`; 필요하면 직접 빈 |
| `entityManagerFactory` | `jdk.proxy2.$Proxy129` (실측 표시) | JPA 영속성 단위 준비 | Data JPA·Hibernate 자동 구성 | DB 연결·엔티티·JPA 프로퍼티 조정 |
| `transactionManager` | `org.springframework.orm.jpa.JpaTransactionManager` | JPA 트랜잭션 경계 관리 | Hibernate JPA 구성 | `@Transactional`; 다중 DB면 매니저 선택 명시 |
| `jdbcTemplate` | `org.springframework.jdbc.core.JdbcTemplate` | JDBC SQL 실행 | JDBC 자동 구성과 `dataSource` | 기존 `DataSource`를 재사용 |
| `mvcValidator` | `org.springframework.boot.validation.autoconfigure.ValidatorAdapter` | MVC 요청 객체 검증 | Validation과 WebMVC 자동 구성 | 제약 애노테이션·Validator로 확장 |
| `applicationTaskExecutor` | `org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor` | 앱 비동기 작업 실행 | 태스크 실행 자동 구성 | `spring.task.execution.*`; 풀 한도 설정 |
| `simpleMeterRegistry` / `observationRegistry` | `io.micrometer.core.instrument.simple.SimpleMeterRegistry` / `io.micrometer.observation.SimpleObservationRegistry` | 메트릭·관측의 기본 레지스트리 | Actuator·Micrometer 자동 구성 | Prometheus 등 내보내기 설정 추가 |
| `productService` | `com.example.practice.product.ProductService$$SpringCGLIB$$0` | 상품 서비스의 CGLIB 프록시 | 사용자 `@Service`와 AOP | 예제의 `@Transactional` 때문에 프록시 생성 |

이 실습 환경은 빈 이름에 포함된 영역 단어로 셌을 때 웹/MVC/오류 97, JSON 23, DB/JPA/JDBC 47, 검증 5, 비동기/스케줄 15, Actuator/관측 118개다. 한 빈이 여러 이름 패턴에 걸리므로 영역 수는 **중복 집계**이며 더해서 333이 되지 않는다. 정확한 전체 수는 TSV의 빈 행 수 333이다.

## 3. 따라 하기

**검증 상태:** 사전 빌드된 Boot 4.1.1 앱에 `--debug`를 주어 실제 조건 리포트를 읽었다. 로컬 MySQL이 없어 서비스는 정상 기동하지 못했다. 아래 Gradle·YAML·Java 변경 예시는 적용·실행하지 않았다(미실행).

### 1단계: 예제 프로젝트와 연결 의존성을 확인한다

리포지토리 루트에서 실습 프로젝트로 이동한다. 이 예제의 Boot 플러그인은 4.1.1이며 WebMVC·Data JPA·Validation·Actuator와 MySQL 드라이버가 들어 있다. Gradle Kotlin DSL을 기본으로 쓴다.

~~~kotlin
// practice/starter/build.gradle.kts의 해당 부분
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    runtimeOnly("com.mysql:mysql-connector-j")
}
~~~

제공된 폴더는 Java 21 toolchain이다. Java 25 기준으로 맞출 때는 위처럼 바꾸고 JDK 25를 설치한다. 예제 코드는 21 이후 문법을 쓰지 않는다.

Maven 대응 artifactId는 `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, `mysql-connector-j`다. Boot parent 버전은 4.1.1로 둔다.

**확인 방법:** `./gradlew dependencies --configuration runtimeClasspath`를 실행해 HikariCP, Hibernate, Jackson 3, Actuator 의존성이 선택됐는지 본다. 버전은 Spring Boot 4.1.1 dependency management가 정한다. 직접 버전을 덮어쓰지 않는다.

### 2단계: 앱을 띄워 자동 구성된 빈을 본다

예제는 로컬 MySQL을 요구한다. 루트 기준으로 아래처럼 기동한다.

~~~bash
cd practice/starter
docker compose up -d
./gradlew bootRun
~~~

기본 `application.yml`에는 `spring.datasource.url`, 계정, JPA `ddl-auto: validate`가 있다. 따라서 컨테이너가 없거나 포트가 맞지 않으면 DataSource 빈을 만들더라도 연결 검증에서 기동이 실패할 수 있다.

Actuator에서 빈과 자동 구성 조건을 확인하려면 `practice/starter/src/main/resources/application.yml`에 다음을 추가하고 앱을 재기동한다.

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,beans,conditions
~~~

**확인 방법:** 다른 터미널에서 아래 명령을 실행한다. `beans`는 전체 컨테이너 빈 목록, `conditions`는 조건 평가 결과다.

~~~bash
curl -s http://localhost:8080/actuator/beans | jq
curl -s http://localhost:8080/actuator/conditions | jq
~~~

실측 `/actuator/beans` 발췌는 아래와 같다. 전체 목록은 333개이며 의존성도 함께 기록돼 있다.

~~~text
dataSource              com.zaxxer.hikari.HikariDataSource
dispatcherServlet       org.springframework.web.servlet.DispatcherServlet
jacksonJsonMapper       tools.jackson.databind.json.JsonMapper
transactionManager      org.springframework.orm.jpa.JpaTransactionManager
productService          com.example.practice.product.ProductService$$SpringCGLIB$$0
~~~

### 3단계: 조건이 왜 적용됐는지 본다

Actuator URL을 열 수 없는 로컬 실행에서는 `--debug`로 기동한다. Gradle 인자는 `--args` 뒤에 전달한다.

~~~bash
./gradlew bootRun --args=--debug
~~~

실제 Boot 4.1.1 실습 앱의 조건 리포트에는 다음이 출력됐다. 앱 빈이 없어서 Boot의 Jackson 매퍼가 만들어지고, 앱 `DataSource`가 없어서 풀 구성이 선택됐다는 뜻이다.

~~~text
JacksonAutoConfiguration#jacksonJsonMapper matched:
  - @ConditionalOnMissingBean (types: tools.jackson.databind.json.JsonMapper; SearchStrategy: all)
    did not find any beans (OnBeanCondition)
~~~

동일한 실행의 DataSource 조건은 Hikari 계열 풀 구성을 선택했으며, 내장 DB 구성은 명시된 MySQL URL 때문에 적용되지 않았다. 이 조건 리포트는 시작 중에도 출력되므로 이후 DB 연결 오류가 나더라도 자동 구성의 판단 근거를 볼 수 있다. `/actuator/conditions`에는 이 결과가 JSON으로 제공된다.

조건 요약에는 적용 176개, 미적용 113개가 기록됐다. 이는 빈 개수가 아니라 조건 평가 수다. CBOR/XML 구성은 해당 기능 조건이 맞지 않아 미적용됐다.

### 4단계: 기본 설정을 유지하며 동작 하나를 바꾼다

전역 JSON 정책이 필요하면 지원되는 설정 프로퍼티부터 적용한다. 아래 예시는 null 값인 프로퍼티를 직렬화 결과에서 제외한다. API 응답 계약 전체가 달라지므로 DTO 단위 정책이 필요하다면 별도 Jackson 애노테이션을 검토한다.

~~~yaml
spring:
  jackson:
    default-property-inclusion: non_null
~~~

빌더 API를 세밀하게 만질 때는 Boot 4의 `JsonMapperBuilderCustomizer`를 등록한다. 이 예제는 비 ASCII 문자를 JSON 문자열에서 이스케이프한다. 기본 매퍼 자체를 새로 만드는 방식이 아니므로 자동 구성한 `jacksonJsonMapper`를 계속 사용한다.

~~~java
package com.example.practice.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.json.JsonWriteFeature;

@Configuration(proxyBeanMethods = false)
public class JsonConfiguration {

    @Bean
    JsonMapperBuilderCustomizer jsonMapperBuilderCustomizer() {
        return builder -> builder.enable(JsonWriteFeature.ESCAPE_NON_ASCII);
    }
}
~~~

(위 커스터마이저 예제는 문서에 제시한 코드로, 이 작업에서 개별 컴파일·실행하지 않았다.)

**확인 방법:** 앱을 다시 시작해 기존 API의 JSON 응답을 비교한다. 변경 전에는 한글이 그대로 보이고 변경 후에는 JSON 안에서 `\u` 이스케이프 형태로 보일 수 있다. 클라이언트가 JSON을 파싱하면 문자열 값은 같다.

직접 `DataSource`를 대체할 필요가 있을 때는 다음처럼 앱 빈을 제공한다. `DataSourceProperties`를 이용하므로 `spring.datasource.*` 바인딩을 계속 이용하며, 같은 역할의 Boot 기본 구성이 빠지는지 조건 리포트에서 확인한다.

~~~java
package com.example.practice.config;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class CustomDataSourceConfiguration {

    @Bean
    DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }
}
~~~

(대체 DataSource 예제는 설명용이며 개별 실행하지 않았다. 실제로 연결 URL·사용자·암호와 DB 드라이버가 필요하다.)

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 스타터 | 기능 클래스패스 추가 | `spring-boot-starter-webmvc` | 스타터별 자동 구성은 조건부 |
| `@ConditionalOnMissingBean` | 사용자 빈이 있으면 기본 빈 생성을 생략 | 같은 목적의 `DataSource` 빈 등록 | 모든 자동 구성 빈에 일괄 적용되는 규칙은 아님 |
| 프로퍼티 | 기본 동작의 값 변경 | `server.port: 8081` | 지원되는 속성 이름을 문서에서 확인 |
| `@Bean` 대체 | 기본 타입의 생성 방식을 사용자 코드로 제공 | `DataSource` 반환 빈 | 다중 후보, 초기화 순서, 조건 일치 확인 |
| `/actuator/beans` | 실제 등록 이름·타입·의존성 조회 | `/actuator/beans` | 개발 진단에만 노출하고 운영 접근 제한 |
| `/actuator/conditions` | 구성별 적용·미적용 이유 조회 | `/actuator/conditions` | Actuator 웹 노출 설정이 필요 |
| `--debug` | 시작 시 조건 평가 리포트 출력 | `./gradlew bootRun --args=--debug` | 출력이 길면 원하는 구성명으로 로그 검색 |

## 5. 자주 나는 에러와 해결

1. **`/actuator/beans`가 404다** → endpoint가 HTTP에 노출되지 않았다 → Actuator 의존성과 `management.endpoints.web.exposure.include`를 확인한다.
2. **`Communications link failure`로 기동 실패** → 드라이버가 있어도 DB 서버는 자동 실행되지 않는다 → `docker compose up -d`, 포트 13307, URL·계정, 컨테이너 상태를 확인한다.
3. **`Failed to configure a DataSource: url attribute is not specified`** → 연결 정보도 내장 DB 드라이버도 없다 → URL·계정을 제공하거나 목적에 맞는 DataSource 빈을 정의한다. JPA 스타터가 DB를 만들지는 않는다.
4. **`NoUniqueBeanDefinitionException: expected single matching bean but found 2`** → 같은 타입 후보가 여러 개다 → 다중 구성은 `@Qualifier`로 지정하고, 왜 후보가 둘인지 빈 목록과 조건 리포트에서 확인한다.
5. **MVC 기본 동작이 사라졌다** → `@EnableWebMvc`가 Boot MVC 구성을 대체했을 수 있다 → 전체 제어가 목적이 아니라면 이를 빼고 `WebMvcConfigurer`만 등록한다.

## 6. 한 단계 더

- 스타터가 클래스패스를 바꾸고, 자동 구성은 클래스·프로퍼티·기존 빈 조건을 평가해 빈 정의를 선택한다.
- 빈 목록은 앱 컴포넌트, 라이브러리, 자동 구성, AOP 프록시를 모두 담는다. Boot 전체의 고정 명단은 아니다.
- 기존 빈이 자동 구성의 조건부 후퇴를 유발했는지는 `/actuator/conditions`나 `--debug`에서 확인한다.
- Boot 4는 Jackson 3 `JsonMapper`를 기본으로 삼고 Jackson 2 지원은 이전용으로 표시한다. `JsonMapperBuilderCustomizer`는 Boot 4.0.0부터 제공된다.
- 자동 구성 내부는 → S03, 빈 주입은 → P11/P12, 생명주기는 → S01, AOP는 → S02, JSON은 → P16, Actuator는 → S16 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. 스타터를 추가하면 왜 내가 선언하지 않은 `DataSource`가 생기나?**

Data JPA 스타터가 JDBC·풀 구현과 자동 구성 클래스를 클래스패스에 가져온다. URL과 연결 드라이버 등 조건이 맞고 사용자가 이미 `DataSource`를 등록하지 않았으면 기본 빈 정의가 선택된다. 연결이 실제 가능한지와 빈 정의가 만들어졌는지는 구분해야 한다.

- 꼬리질문: URL만 있으면 DB 연결까지 보장되나? **아니다.** 서버 가동, 포트, 자격 증명, 네트워크가 맞아야 풀에서 실제 연결을 얻는다.

**Q2. 같은 타입의 `@Bean`을 추가하면 항상 기본 빈을 교체하나?**

`@ConditionalOnMissingBean`을 사용하는 자동 구성은 사용자가 해당 타입의 빈을 제공하면 보통 후퇴한다. 그러나 모든 Boot 빈에 이 조건이 있는 것은 아니고 조건이 이름을 볼지 타입을 볼지도 구성마다 다르다. 조건 리포트를 보고 예상한 구성이 실제로 물러났는지 확인한다.

- 꼬리질문: 자동 구성 빈이 후퇴했는데도 두 후보가 남는 이유는? **다른 설정이나 라이브러리에서 같은 타입 빈을 추가했을 수 있으므로, `/actuator/beans`의 출처와 의존성을 확인한다.**

**Q3. 333개가 Spring Boot가 만드는 고정 개수인가?**

아니다. WebMVC·Data JPA·Validation·Actuator·MySQL로 구성된 특정 앱의 측정 결과다. 스타터와 라이브러리 버전, 프로파일, 애플리케이션 빈, endpoint 구성에 따라 달라진다. 조건 요약의 176/113은 빈 개수가 아닌 조건 평가 묶음의 수다.

- 꼬리질문: 서비스마다 빈 수가 달라도 정상인가? **의존성과 설정이 다르면 정상이다.**

**Q4. 빈·조건 endpoint와 `--debug`는 무엇이 다른가?**

`/actuator/beans`는 등록된 빈 이름·타입·의존성을 보여주고, `/actuator/conditions`는 구성 조건의 성공·실패 이유를 보여준다. `--debug`는 시작 로그에 조건 리포트를 출력하므로 Actuator URL을 열 수 없을 때 유용하다. 진단 시 세 결과를 함께 보면 원인과 결과를 연결하기 쉽다.

- 꼬리질문: `jacksonJsonMapper`가 보이면 모든 응답이 이를 쓰나? **사용자 컨버터가 있으면 경로를 확인한다.**

**Q5. Boot 4에서 `ObjectMapper` 대신 무엇을 확인해야 하나?**

Boot 4의 권장 기본은 Jackson 3의 `tools.jackson.databind.json.JsonMapper`다. Jackson 3 자동 구성은 `JsonMapper` 빈과 프로퍼티를 제공한다. 직접 객체를 만들면 컨테이너 빈 설정을 건너뛰므로 기본 설정과 모듈 적용 차이가 날 수 있다.

- 꼬리질문: 직렬화 규칙 하나를 바꾸려면 매퍼 전체를 교체해야 하나? **아니다.** `spring.jackson.*`나 `JsonMapperBuilderCustomizer`로 먼저 좁게 바꾼다.

**Q6. `applicationTaskExecutor` 빈이 있다고 모든 작업이 자동으로 비동기가 되나?**

아니다. 빈은 태스크를 실행할 executor를 제공할 뿐이다. `@Async` 등 비동기 실행 경로를 켜고 호출이 그 경로를 통과해야 한다. 스레드 수, 대기열, 거절 정책과 종료 처리도 애플리케이션 부하에 맞춰야 한다.

- 꼬리질문: 운영에서 `ThreadPoolTaskExecutor`를 무조건 크게 잡으면 되나? **아니다.** DB 풀·외부 시스템 용량과 함께 한도를 정하고 지표를 관찰한다. 자세한 비동기는 → S15 참조.

## 8. 참고문헌

- Auto-configuration — https://docs.spring.io/spring-boot/reference/using/auto-configuration.html — 클래스패스와 조건에 따른 자동 구성, 교체 및 `--debug` 확인 방법.
- Endpoints — https://docs.spring.io/spring-boot/reference/actuator/endpoints.html — beans·conditions endpoint의 목적과 접근·노출 설정 개념.
- Auto-configuration Classes — https://docs.spring.io/spring-boot/appendix/auto-configuration-classes/index.html — Boot 제공 자동 구성 클래스와 조건 리포트 진입점.
- JSON — https://docs.spring.io/spring-boot/reference/features/json.html — Jackson 3 기본 `JsonMapper`, 설정 프로퍼티, Jackson 2 지원 상태.
- SQL Databases — https://docs.spring.io/spring-boot/reference/data/sql.html — DataSource와 내장 DB 자동 구성 조건, JDBC 데이터 접근 설명.
- Servlet Web Applications — https://docs.spring.io/spring-boot/reference/web/servlet.html — 기본 MVC 구성을 보존하며 `WebMvcConfigurer`를 확장하는 방법.
- `JsonMapperBuilderCustomizer` API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/jackson/autoconfigure/JsonMapperBuilderCustomizer.html — `JsonMapper.Builder`를 자동 구성 중 조정하는 Boot 4 확장점.
