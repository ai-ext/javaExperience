# P25. 외부 API 연동 실무 — RestClient·HTTP Interface

> 외부 API 호출은 `RestClient`를 기본값으로 두고, 리액티브 흐름이면 `WebClient`를 선택한다.
> HTTP Interface는 반복되는 URL·직렬화 코드를 Java 인터페이스로 숨기지만, 프록시 등록과 오류 정책은 애플리케이션이 책임진다.
> 타임아웃·인증·4xx/5xx·재시도·민감정보 로깅을 함께 설계해야 “호출은 되는데 장애 때 멈추는” 클라이언트가 되지 않는다.

## 1. 한 줄로 말하면

Spring의 외부 API 클라이언트는 HTTP 요청을 만들고 응답을 DTO로 변환하며 실패를 애플리케이션 예외로 바꾸는 경계 코드다. 일반적인 동기 MVC 서비스에서는 Spring Framework 6.1부터 제공된 `RestClient`를 기본으로 사용하고, WebFlux의 논블로킹 파이프라인에서는 `WebClient`를 사용한다. `RestTemplate`은 동기식이지만 새 코드에서는 `RestClient`로 대체하는 방향이고, HTTP Interface는 `@HttpExchange`가 붙은 인터페이스를 실행 가능한 프록시로 만든다.

이 경계에서 타임아웃을 생략하면 스레드가 외부 서버를 기다리며 고갈된다. 상태 코드를 예외로 바꾸지 않으면 500 응답을 정상 DTO로 처리할 수 있고, 모든 예외를 재시도하면 결제·주문 같은 비멱등 요청이 중복 실행된다.

## 2. 당장 알아야 할 것

### 2.1 클라이언트 선택

일반 Spring MVC의 동기 호출은 `RestClient`, WebFlux에서 끝까지 논블로킹인 흐름은 `WebClient`를 쓴다. 선언적 endpoint가 많으면 HTTP Interface를 고려하고, 기존 OpenFeign 조직은 팀 표준을 유지한다.

WebFlux에서 `RestClient`를 직접 호출하거나 WebClient를 매번 `.block()`하면 각각 이벤트 루프를 막거나 논블로킹 이점을 잃는다. `RestTemplate`은 기존 코드 유지보수에만 두고 새 코드는 `RestClient` 기준으로 작성한다.

### 2.2 의존성과 설정

Boot BOM이 관리하는 의존성에는 버전을 직접 쓰지 않는다. Boot 4.1의 Gradle Kotlin DSL 최소 설정은 다음과 같다.

`build.gradle.kts`

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> { useJUnitPlatform() }
```

Maven에서는 `org.springframework.boot:spring-boot-starter-web`만 `<dependency>`로 넣고 Boot parent 또는 dependency management가 버전을 관리하게 한다. HTTP Interface를 직접 등록할 때는 위 웹 스타터로 충분하다. Apache HttpClient를 요청 팩토리로 선택할 때만 Boot BOM이 관리하는 `org.apache.httpcomponents.client5:httpclient5`를 추가한다.

`application.yml`

```yaml
partner:
  base-url: ${PARTNER_BASE_URL:http://localhost:8089}
  api-key: ${PARTNER_API_KEY:local-dev-key}
  connect-timeout: 2s
  read-timeout: 3s
```

API 키를 YAML에 직접 커밋하지 않는다. 환경 변수·Secret manager에서 주입하고, 로그·예외 메시지·분산 추적 baggage에도 넣지 않는다.

### 2.3 `RestClient` 빈 구성

```java
package example.client;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class PartnerClientConfig {
    @Bean
    RestClient partnerRestClient(
            RestClient.Builder builder,
            @Value("${partner.base-url}") String baseUrl,
            @Value("${partner.api-key}") String apiKey) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(3));

        return builder
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Accept", "application/json")
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }
}
```

`connectTimeout`은 TCP 연결을 기다리는 시간이고 `readTimeout`은 연결 후 응답 바이트를 기다리는 시간이다. 둘 중 하나만 설정하면 다른 단계에서 무한 대기가 남는다.

Java 25의 JDK `HttpClient`를 쓰기 싫다면 `HttpComponentsClientHttpRequestFactory`를 선택하고 Apache HttpClient의 connection/request/response timeout을 명시한다. 기본 요청 팩토리의 구체 구현과 버전별 지원 여부를 가정하지 말고, 사용 중인 Spring Boot 문서와 Javadoc에서 확인한다.

### 2.4 GET, POST, DTO, 상태 코드

```java
package example.client;

import java.math.BigDecimal;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

record CreateProduct(String name, BigDecimal price) {}

@Component
public class PartnerClient {
    private final RestClient client;

    public PartnerClient(RestClient partnerRestClient) {
        this.client = partnerRestClient;
    }

    public Product find(String id) {
        return client.get()
                .uri("/products/{id}", id)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                    throw new PartnerBadRequestException(response.getStatusCode().value());
                })
                .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                    throw new PartnerUnavailableException(response.getStatusCode().value());
                })
                .body(Product.class);
    }

    public Product create(CreateProduct command, String idempotencyKey) {
        return client.post()
                .uri("/products")
                .header("Idempotency-Key", idempotencyKey)
                .body(command)
                .retrieve()
                .body(Product.class);
    }

}

class PartnerBadRequestException extends RuntimeException {
    PartnerBadRequestException(int status) { super("partner 4xx: " + status); }
}
class PartnerUnavailableException extends RuntimeException {
    PartnerUnavailableException(int status) { super("partner 5xx: " + status); }
}
```

`retrieve()` 뒤에 최종 연산인 `body`, `toEntity`, `toBodilessEntity` 등을 호출해야 실제 응답을 소비한다. 일치하는 `onStatus`가 없으면 400 이상은 `RestClientResponseException` 계열로 변환된다.

호출부에서 `try { ... } catch (Exception e) { return null; }`처럼 뭉뚱그리지 말고, 재시도 가능한 장애·업무상 4xx·영구 실패를 구분한다. 헤더까지 필요하면 `toEntity(Product.class)`로 받는다.

### 2.5 HTTP Interface

```java
package example.client;

import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.bind.annotation.PathVariable;

@HttpExchange(accept = "application/json")
public interface ProductApi {
    @GetExchange("/products/{id}")
    Product find(@PathVariable String id);
}
```

수동 등록은 어떤 `RestClient`를 프록시에 연결하는지 명확하다.

```java
@Configuration
class ProductApiConfig {
    @Bean
    ProductApi productApi(RestClient partnerRestClient) {
        var adapter = org.springframework.web.client.support.RestClientAdapter
                .create(partnerRestClient);
        var factory = org.springframework.web.service.invoker.HttpServiceProxyFactory
                .builderFor(adapter).build();
        return factory.createClient(ProductApi.class);
    }
}
```

Spring Boot 4.1에서는 HTTP Service Client 자동 구성과 `@ImportHttpServices` 계열 등록을 사용할 수 있지만, 인터페이스를 만들었다고 모든 빈이 저절로 생기는 것은 아니다. 프로젝트의 Boot 4.1 reference에서 자동 구성 방식과 그룹별 `RestClient` 설정을 확인하고, 단순하고 예측 가능한 앱은 위 수동 등록을 기본으로 둔다.

자동 구성을 쓸 때도 `baseUrl`, 인증 헤더, 타임아웃, 어떤 요청 팩토리인지 테스트로 고정한다. HTTP Interface는 메서드 선언을 줄여 줄 뿐, 오류 변환·재시도·관측 정책을 대신 결정하지 않는다.

### 2.6 인증과 로깅

API 키는 `.defaultHeader`, 만료되는 Bearer 토큰은 요청 시점에 토큰을 조회하는 `ClientHttpRequestInterceptor`로 넣는다. URL·method·status·소요 시간만 기록하고 `Authorization`, `Cookie`, API 키, 전체 body는 마스킹한다. body를 먼저 소비하면 DTO 변환이 실패하므로 운영 기본값은 메타데이터다.

### 2.7 재시도와 멱등성

재시도는 연결 실패·일시적 503·429처럼 일시적이고 재시도 가능한 경우에만 짧은 지수 백오프와 최대 횟수를 둔다. POST 결제처럼 서버가 처리했지만 응답만 유실된 상황에서는 클라이언트가 실패를 보았어도 이미 성공했을 수 있다.

`Idempotency-Key`를 서버가 지원할 때 같은 키로 재시도하고, 지원하지 않으면 자동 재시도하지 않는다. Spring Retry 또는 Resilience4j를 도입할 수 있지만 이 문서의 기본 추천은 “멱등 GET만 2~3회, 쓰기 요청은 명시적 정책 없이는 0회”다.

## 3. 따라 하기

### 3.1 실제 로컬 서버 띄우기

프로젝트 루트에 다음 파일을 만든다.

`compose.yaml`

```yaml
services:
  wiremock:
    image: wiremock/wiremock:latest
    ports:
      - "8089:8080"
    volumes:
      - ./wiremock:/home/wiremock
```

WireMock은 컨테이너로 독립 실행할 수 있고, 테스트에서 실제 HTTP 클라이언트와 같은 네트워크 계층을 통과시켜 지연·상태 코드·잘못된 응답을 재현하는 데 쓴다. `latest`는 예제 편의를 위한 값이므로 팀에서는 검증한 이미지 digest로 고정한다.

`wiremock/mappings/product.json`

```json
{
  "request": { "method": "GET", "urlPath": "/products/p-1" },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "id": "p-1", "name": "Keyboard", "price": 49000 }
  }
}
```

```bash
docker compose up -d
curl -i http://localhost:8089/products/p-1
```

확인 방법: `HTTP/1.1 200`과 JSON의 `"id":"p-1"`가 보이면 서버와 stub이 준비된 것이다. 종료는 `docker compose down`이다.

### 3.2 애플리케이션에서 호출하기

앞 절의 `build.gradle.kts`, `application.yml`, `PartnerClientConfig`, `PartnerClient`를 넣고 다음 controller를 추가한다.

`src/main/java/example/ApiApplication.java`

```java
package example;

import example.client.PartnerClient;
import example.client.Product;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class ApiApplication {
    public static void main(String[] args) { SpringApplication.run(ApiApplication.class, args); }
}

@RestController
class ProductController {
    private final PartnerClient partnerClient;
    ProductController(PartnerClient partnerClient) { this.partnerClient = partnerClient; }

    @GetMapping("/products/{id}")
    Product get(@PathVariable String id) { return partnerClient.find(id); }
}
```

`Product`는 위 주석처럼 `Product.java`로 분리한다. `CreateProduct`와 `PartnerError`도 public으로 공개할 경우 각각 파일로 분리한다. 실제 Java 파일에서는 public 타입마다 파일을 분리한다.

```bash
./gradlew bootRun
curl -i http://localhost:8080/products/p-1
```

확인 방법: 응답에 `{"id":"p-1","name":"Keyboard","price":49000}`가 나오고 WireMock 로그에 GET 요청이 남는다.

### 3.3 실패를 재현하고 테스트하기

`wiremock/mappings/partner-503.json`에 `/products/down` → status 503, `Content-Type: application/json`, `{"code":"TEMPORARY"}`를 반환하는 stub을 추가한다.

```bash
curl -i http://localhost:8089/products/down
curl -i http://localhost:8080/products/down
```

확인 방법: 애플리케이션 요청은 `PartnerUnavailableException`이므로 운영에서는 `@RestControllerAdvice`로 내부 표준 오류와 503으로 변환한다. 외부 body를 그대로 노출하지 않는다.

완전한 전송 계층 테스트는 WireMock 같은 mock web server가 적합하다. 서버를 띄우지 않는 빠른 단위 테스트에는 `MockRestServiceServer`를 쓴다.

```java
@SpringBootTest
class PartnerClientTest {
    @Autowired RestClient partnerRestClient;
    @Autowired PartnerClient partnerClient;

    @Test
    void product_is_decoded() {
        // 운영과 동일한 HTTP 서버를 쓰려면 WireMock 컨테이너의 base-url을 주입한다.
        // MockRestServiceServer를 쓸 때는 테스트 전용 RestClient를 bindTo()로 구성한다.
        assertThat(partnerClient.find("p-1").name()).isEqualTo("Keyboard");
    }
}
```

확인 방법: `./gradlew test`가 통과하고 WireMock을 끄면 통합 테스트가 실패해야 한다. 단위 테스트는 URL·헤더·body·상태를 검증한다.

## 4. 치트시트

| 이름 | 용도 | 주의 |
|---|---|---|
| `RestClient.get/post` | 동기 HTTP | MVC 기본값, 쓰기 재시도는 멱등성 확인 |
| `retrieve().body` | DTO 변환 | 4xx/5xx 기본 예외 |
| `onStatus` | 상태별 예외 | body·토큰 로깅 금지 |
| `requestFactory` | 구현·timeout | connect/read 모두 설정 |
| `@HttpExchange` | 선언적 client | 프록시 빈 등록 필요 |
| WireMock / MockRestServiceServer | 통합 / 단위 테스트 | 전자는 네트워크 재현, 후자는 빠름 |

## 5. 자주 나는 에러와 해결

1. `java.net.http.HttpTimeoutException: request timed out` 또는 `Read timed out` → 연결은 됐지만 응답을 기다리는 시간이 제한을 넘었다 → `readTimeout`을 명시하고 외부 API의 p95 지연과 서버 처리 시간을 조사한다. 무작정 시간을 늘리지 말고 호출 예산과 재시도 횟수를 곱해 상위 요청 timeout 안에 들어오게 한다.

2. `java.net.ConnectException: Connection refused` → host/port가 틀렸거나 WireMock·외부 서버가 실행되지 않았다 → `curl`로 같은 URL을 확인하고 Docker 포트 매핑, 컨테이너 내부에서의 `localhost` 의미를 점검한다. 애플리케이션 컨테이너에서 `localhost`는 WireMock 컨테이너가 아니다.

3. `UnknownContentTypeException` → 응답 `Content-Type`이 DTO converter가 처리할 타입이 아니거나 body가 비어 있다 → 실제 응답 headers/body를 안전한 테스트 로그로 확인하고 서버가 `application/json`을 보내게 한다. 단순히 `String`으로 바꿔 예외를 숨기지 않는다.

4. 4xx/5xx인데 `try/catch`가 잡지 못하거나 정상 흐름으로 진행된다 → `retrieve()`의 terminal operation 위치가 잘못됐거나, `onStatus`에서 다른 예외 타입을 던졌다 → `body`/`toEntity`까지 호출하고 `RestClientResponseException`, 애플리케이션의 외부 장애 예외를 명시적으로 잡는다.

5. `SSLHandshakeException: PKIX path building failed` → JVM truststore가 서버 인증서 체인을 신뢰하지 않는다 → 인증서 체인과 만료일을 확인하고 조직 CA를 올바른 truststore에 배포한다. 운영에서 `trustAll`이나 hostname 검증 해제는 해결책이 아니다.

6. 응답은 200인데 DTO 변환이 실패한다 → JSON 계약이 DTO와 다르다 → 외부 DTO와 내부 모델을 분리하고 변환 오류를 숨기지 않는다(상세 Jackson은 → P16 참조).

## 6. 한 단계 더

요청은 `RestClient`의 fluent builder에서 URI·헤더·body를 만들고, 요청 팩토리가 실제 TCP/TLS를 수행하며, message converter가 JSON과 DTO를 변환한다. `retrieve()`는 상태 처리 규칙을 적용하고 최종 연산이 응답을 읽는다.

HTTP Interface는 이 호출부를 프록시 생성 단계로 옮길 뿐 같은 요청 팩토리와 converter를 사용한다. 따라서 HTTP Interface로 바꿔도 timeout·인증·관측·재시도 정책은 그대로 검증해야 한다.

외부 API의 설계·리소스 모델 비교는 → S06, 장애 격리·bulkhead·circuit breaker는 → S20, Jackson의 상세 변환 규칙은 → P16 참조. 이 문서에서는 그 주제를 다시 설명하지 않는다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. MVC 애플리케이션에서 `RestClient`와 `WebClient` 중 무엇을 고르는가?

동기 서비스 메서드가 즉시 DTO를 반환하면 `RestClient`를 기본으로 고른다. WebFlux 파이프라인에서 `Mono`/`Flux`를 끝까지 유지해야 하면 `WebClient`를 고른다. WebClient를 도입한 뒤 모든 곳에서 `.block()`하면 선택 근거가 사라진다.

꼬리질문: RestClient를 WebFlux에서 써도 되는가?

답: 블로킹 호출이므로 이벤트 루프에서 직접 호출하면 안 된다. 별도 bounded elastic scheduler로 격리하거나 WebClient로 바꾼다.

### Q2. `retrieve()`와 `exchange()`의 차이는?

`retrieve()`는 일반적인 응답 추출과 상태 코드 처리를 간결하게 표현한다. `exchange()`는 `ClientHttpRequest`와 `ClientHttpResponse`를 직접 다뤄 상태·헤더·body를 한 번에 세밀하게 제어할 때 쓴다. 세밀한 제어가 필요 없는데 exchange를 남용하면 body 소비와 자원 처리 실수가 늘어난다.

꼬리질문: 404를 null로 받고 싶다면?

답: `onStatus`에서 404만 도메인 예외로 바꾸거나, 호출 경계에서 `Optional` 정책을 명시한다. 모든 4xx를 null로 만들면 인증 실패와 리소스 부재가 섞인다.

### Q3. connect timeout과 read timeout은 왜 둘 다 필요한가?

connect는 DNS 이후 TCP 연결 수립 단계의 대기이고 read는 연결 후 서버 응답을 기다리는 단계다. 연결은 성공했지만 서버가 처리하지 않는 장애는 read timeout이 없으면 계속 점유된다. 상위 HTTP 요청 timeout, 재시도 backoff까지 포함해 전체 시간 예산을 계산한다.

꼬리질문: timeout을 1초로 무조건 줄이면 좋은가?

답: 아니다. 정상적인 외부 API 지연 분포·네트워크 구간·업무 요구를 측정해 정한다. 너무 짧으면 정상 요청을 실패로 만들고, 너무 길면 스레드 고갈을 만든다.

### Q4. 500이면 항상 재시도해도 되는가?

아니다. 서버가 이미 명령을 처리했는지 알 수 없고 POST라면 중복 부작용이 발생할 수 있다. GET처럼 멱등인 요청도 500의 원인이 영구 오류인지 확인하고, 일시 오류에만 제한된 횟수로 재시도한다.

꼬리질문: 429는 무엇을 읽어야 하는가?

답: `Retry-After`와 공급자 rate limit 계약을 읽고 backoff한다. 여러 인스턴스가 동시에 재시도하지 않도록 jitter를 둔다.

### Q5. `@HttpExchange` 인터페이스를 만들면 바로 주입되는가?

아니다. `HttpServiceProxyFactory`와 adapter로 프록시를 만들거나 Boot 4.1의 HTTP service client 등록 방식을 적용해야 한다. 등록된 프록시가 어떤 `RestClient`, base URL, 인증·timeout을 쓰는지 확인해야 한다.

꼬리질문: 인터페이스가 RestClient보다 항상 좋은가?

답: 반복적인 CRUD 호출에는 좋지만 복잡한 동적 body·스트리밍·특수 상태 처리에는 직접 RestClient가 더 명확할 수 있다.

### Q6. 테스트에서 MockRestServiceServer와 WireMock을 어떻게 나누는가?

요청 builder와 상태 변환을 빠르게 검증하는 단위 테스트에는 MockRestServiceServer를 쓴다. 실제 포트·HTTP client·지연·connection 문제까지 확인하려면 WireMock 같은 mock web server를 쓴다. Spring 문서도 transport layer와 network condition에는 mock web server를 권장한다.

꼬리질문: 테스트에서 실제 공개 API를 호출하면 안 되는 이유는?

답: 외부 상태·rate limit·네트워크에 의존해 재현성이 없고, 실수로 쓰기 요청을 보낼 위험이 있다. 계약 테스트나 WireMock fixture로 대체한다.

## 8. 참고문헌

- REST Clients — https://docs.spring.io/spring-framework/reference/integration/rest-clients.html — `RestClient`, `WebClient`, `RestTemplate`, HTTP Interface, request factory와 응답 처리 근거.
- Calling REST Services — https://docs.spring.io/spring-boot/reference/io/rest-client.html — Spring Boot의 REST client 선택 및 자동 구성 근거.
- HTTP Service Client — https://docs.spring.io/spring-framework/reference/web/webflux-http-service-client.html — 인터페이스에서 HTTP service proxy를 만드는 개념과 Framework 버전 근거.
- WireMock Java — https://wiremock.org/docs/ — 컨테이너·mock API·지연/장애 재현의 용도 근거.
- WireMock Spring Boot Integration — https://wiremock.org/docs/spring-boot/ — Spring 테스트에서 `@EnableWireMock`, base URL 주입, stub 사용 근거.
- Testing Client Applications — https://docs.spring.io/spring-framework/reference/testing/spring-mvc-test-client.html — `MockRestServiceServer`와 mock web server를 나누는 기준.
- `RestClient.ResponseSpec` Javadoc — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestClient.ResponseSpec.html — `onStatus`, `body`, 4xx/5xx 기본 예외 동작.
