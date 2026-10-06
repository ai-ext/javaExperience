# S06. REST API 설계와 HTTP 클라이언트

> - REST는 URL 모양보다 리소스와 HTTP 메서드의 의미를 일관되게 지키는 계약이다.
> - 동기 호출의 기본은 <code>RestClient</code>, 비동기·스트리밍은 <code>WebClient</code>, 선언형 경계는 HTTP Interface로 고른다.
> - 타임아웃은 연결·응답 등 각 대기 구간에 명시하고, 재시도는 멱등성과 중복 처리 계약을 확인한 뒤 적용한다.

## 1. 왜 알아야 하나

결제 <code>POST</code>가 타임아웃 났다고 그대로 재전송하면, 첫 요청은 처리됐지만 응답만 유실된 경우 주문이 중복 생성될 수 있다. 부분 업데이트를 <code>PUT</code>으로 구현하면 생략된 필드가 지워질 수 있다. 외부 API에 타임아웃이 없으면 요청 스레드와 연결 풀이 잠식된다.

목록을 <code>createdAt</code>만으로 정렬하면 동시간 행이 페이지 경계에서 중복·누락될 수 있다. <code>Page</code>를 그대로 공개하면 내부 타입과 전체 건수 쿼리가 계약에 묶인다. Jackson 3 전환도 패키지·확장 API 변화뿐 아니라 JSON 호환성을 확인해야 한다.

## 2. 핵심 개념

| 용어 | 뜻 | 설계 시 확인할 점 |
|---|---|---|
| 리소스 | HTTP 요청의 대상. URI로 식별한다. | URL은 명사 중심으로 정하고 표현(JSON)과 리소스를 구별한다. |
| 안전성(safe) | 요청이 의도한 상태 변경을 하지 않는 성질 | <code>GET</code>, <code>HEAD</code>는 읽기로 제한한다. |
| 멱등성(idempotent) | 반복 적용의 상태 효과가 한 번 적용과 같은 성질 | 응답 코드가 같다는 뜻은 아니다. 재전송·재시도 판단 기준이다. |
| 표현(representation) | 리소스를 특정 미디어 타입으로 옮긴 데이터 | <code>Accept</code>는 응답 형식, <code>Content-Type</code>은 요청 본문 형식이다. |
| 페이지네이션 | 컬렉션을 여러 응답으로 분할 | 정렬 안정성, 크기 상한, 변경 중 일관성을 정한다. |
| API 버전 | 요청·응답 계약의 호환 세대 | 경로·헤더·미디어 타입 중 하나를 정해 폐기 일정을 공유한다. |
| HTTP Interface | <code>@HttpExchange</code> 인터페이스를 클라이언트 프록시로 변환 | 전송은 <code>RestClient</code> 또는 <code>WebClient</code> 어댑터가 맡는다. |

### 메서드와 상태 코드

| 의도 | 권장 메서드 | 일반적인 성공 응답 | 의미와 주의점 |
|---|---|---|---|
| 컬렉션 조회 | <code>GET /orders</code> | <code>200 OK</code> | 조회는 서버 상태를 바꾸지 않는다. 필터·정렬·페이지를 쿼리로 표현한다. |
| 단건 조회 | <code>GET /orders/{id}</code> | <code>200 OK</code>, 없으면 <code>404</code> | 캐시 가능성이 있으면 표현과 캐시 헤더도 계약의 일부다. |
| 리소스 생성 | <code>POST /orders</code> | <code>201 Created</code>와 <code>Location</code> | 같은 본문을 다시 보냈을 때 같은 생성 결과가 보장되는지는 별도 계약이다. |
| 전체 교체 | <code>PUT /orders/{id}</code> | <code>200</code> 또는 <code>204</code> | 같은 표현을 반복 적용해도 최종 상태는 같아야 한다. 생성 허용 여부도 명시한다. |
| 부분 변경 | <code>PATCH /orders/{id}</code> | <code>200</code> 또는 <code>204</code> | 패치 문서 형식과 생략·null의 의미를 정한다. 멱등성은 패치 내용에 달렸다. |
| 삭제 | <code>DELETE /orders/{id}</code> | <code>204</code> 또는 <code>200</code> | 반복 DELETE의 응답 코드는 달라도 최종 삭제 상태는 같을 수 있다. |

<code>400</code>은 잘못된 입력, <code>401</code>/<code>403</code>은 인증/권한 문제, <code>404</code>는 부재, <code>409</code>는 상태 충돌, <code>412</code>는 조건부 요청 실패에 쓴다. 비동기 접수는 <code>202</code>, 입력 오류는 정책에 따라 <code>400</code>/<code>422</code>로 응답한다. 오류는 기계가 읽는 공통 형식으로 만든다.

### 자주 혼동하는 쌍

| 구분 | 차이 |
|---|---|
| <code>PUT</code> vs <code>PATCH</code> | PUT은 대상 표현 전체를 교체한다. PATCH는 정의된 패치 형식으로 일부를 바꾼다. PATCH가 항상 비멱등인 것은 아니지만 연산에 따라 달라진다. |
| 안전성 vs 멱등성 | GET은 안전하고 멱등하다. PUT과 DELETE는 안전하지 않지만 멱등이다. POST는 기본적으로 어느 쪽도 보장하지 않는다. |
| offset vs cursor | offset은 임의 페이지 이동이 단순하지만 앞쪽 데이터 삽입·삭제에 따라 페이지가 밀린다. cursor는 정렬 키를 기준으로 이어 읽어 대규모·변경 중 목록에 유리하다. |
| 연결 타임아웃 vs 응답 타임아웃 | 연결 타임아웃은 원격 연결을 맺을 때 기다리는 한도다. 응답/읽기 타임아웃은 연결 뒤 응답 데이터가 오기를 기다리는 한도다. 호출 전체 deadline은 별도 계층에서 관리할 수 있다. |

## 3. 내부 동작·원리

요청 처리에서 서버와 클라이언트의 역할은 분리된다.

~~~~text
호출자
  │ 메서드 + URI + 헤더 + 본문(표현)
  ▼
클라이언트 인코더 ── 요청 팩토리/커넥션 풀 ── 네트워크
                                               │
                         라우팅 ← 서버 매핑/버전 선택
                                               │
                         컨트롤러 → 상태·헤더·표현
  ▲                                            │
  └──── 응답 디코더 ← 상태 검사·오류 처리 ←─────┘
~~~~

서버는 URI, 메서드 의미, 조건 헤더를 함께 해석한다. <code>If-Match</code>가 현재 버전과 일치할 때만 변경하고 아니면 <code>412</code>를 반환하면 동시 수정 손실을 막는다. 상태 코드는 클라이언트의 다음 행동을 알린다.

Spring MVC의 <code>ApiVersionStrategy</code>는 resolver로 요청 버전을 추출하고 parser로 비교 가능한 값으로 바꿔 컨트롤러 매핑과 대조한다. 미지원 버전과 기본 설정의 누락 버전은 400이다. 버전을 선택사항으로 두거나 기본값을 지정할 수 있고, 폐기는 <code>Deprecation</code>, <code>Sunset</code>, <code>Link</code> 헤더로 알린다.

Spring <code>RestClient</code>는 메서드·URI·헤더·본문을 fluent 요청으로 조립하고, terminal body/entity 변환에서 전송과 메시지 변환을 수행한다. <code>WebClient</code>는 reactive publisher 흐름과 스트리밍에 맞는다. HTTP Interface 프록시는 설정한 클라이언트 어댑터로 요청을 보낸다. 기본 URL·공통 헤더는 클라이언트에, 서비스별 정책은 호출 경계에 둔다.

재시도는 타임아웃과 별개다. 타임아웃은 서버 작업 취소를 뜻하지 않는다. 멱등 메서드라도 횟수·대기 간격·총 deadline을 제한한다. POST는 idempotency key와 서버측 결과 저장 계약 없이는 자동 재시도하지 않는다.

## 4. 코드로 확인

예제는 Spring Boot 4.1 / Framework 7 기준이며 **미실행**이다. 필요 의존성은 <code>spring-boot-starter-web</code>이며, Spring Data 웹 인자 지원은 Spring Data Commons가 추가로 필요하다.

### 예제 1 — 명시적 페이지 계약과 입력 상한

<code>Page</code> 대신 외부 계약에 필요한 필드만 DTO로 정의한다.

~~~~java
// Spring 예제 (미실행)
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class BookQueryController {
    private static final int MAX_SIZE = 100;
    private final BookService books = new BookService();

    @GetMapping("/api/books")
    BookPage list(@RequestParam(defaultValue = "0") int page,
                  @RequestParam(defaultValue = "25") int size) {
        if (page < 0 || size < 1 || size > MAX_SIZE) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "invalid page or size");
        }
        return books.findPage(page, size);
    }

    record BookView(long id, String title) {}
    record BookPage(List<BookView> items, int page, int size,
                    boolean hasNext) {}

    static class BookService {
        private final List<BookView> all = List.of(
                new BookView(1, "Spring"), new BookView(2, "Java"));

        BookPage findPage(int page, int size) {
            int from = (int) Math.min((long) page * size, all.size());
            int to = Math.min(from + size, all.size());
            return new BookPage(all.subList(from, to), page, size, to < all.size());
        }
    }
}
~~~~

실서비스에서는 입력 오류를 <code>@ControllerAdvice</code>로 400에 매핑한다. 정렬 allowlist와 고유 tie-breaker를 두고, 전체 건수가 비싸면 cursor를 고려한다.

### 예제 2 — Framework 7 내장 API 버저닝

헤더 버전으로 같은 경로의 호환되지 않는 표현을 별도 핸들러로 라우팅한다.

~~~~java
// Spring 예제 (미실행)
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class ApiVersionConfiguration implements WebMvcConfigurer {
    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer.useRequestHeader("API-Version");
    }
}

@RestController
@RequestMapping("/orders")
class OrderController {
    @GetMapping(version = "1.0")
    OrderV1 getV1() {
        return new OrderV1("order-42", "PAID");
    }

    @GetMapping(version = "2.0")
    OrderV2 getV2() {
        return new OrderV2("order-42", new Payment("PAID", "card"));
    }

    record OrderV1(String id, String status) {}
    record OrderV2(String id, Payment payment) {}
    record Payment(String status, String method) {}
}
~~~~

<code>GET /orders</code>에 <code>API-Version: 2.0</code>을 보낸다. 헤더가 표현을 바꾸면 캐시의 <code>Vary</code>와 누락·미지원 버전을 검증한다.

### 예제 3 — RestClient의 연결·읽기 시간 제한

<code>JdkClientHttpRequestFactory</code>는 JDK <code>HttpClient</code>를 사용한다. 연결과 읽기 제한은 서로 다른 구간에 적용된다.

~~~~java
// Spring 예제 (미실행)
import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
class PartnerClientConfiguration {
    @Bean
    RestClient partnerRestClient() {
        HttpClient jdkClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();

        JdkClientHttpRequestFactory factory =
                new JdkClientHttpRequestFactory(jdkClient);
        factory.setReadTimeout(Duration.ofSeconds(3));

        return RestClient.builder()
                .baseUrl("https://partner.example")
                .requestFactory(factory)
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
~~~~

<code>connectTimeout</code>은 연결 수립, <code>setReadTimeout</code>은 읽기 제한이다. 풀 대기와 전체 deadline까지 설정한 것은 아니므로 전송 라이브러리에 맞춰 추가 제한을 정하고 재시도 포함 총 시간은 상위 요청보다 짧게 둔다.

HTTP Interface를 쓰면 같은 전송 설정을 선언형 계약 뒤에 감출 수 있다.

~~~~java
// Spring 예제 (미실행)
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

@HttpExchange("/inventory")
interface InventoryApi {
    @GetExchange("/items/{sku}")
    Item find(@PathVariable("sku") String sku);

    record Item(String sku, int available) {}
}
~~~~

프록시는 <code>HttpServiceProxyFactory</code>와 <code>RestClientAdapter</code>로 만든다. <code>WebClient</code>는 reactive 흐름·스트리밍에 쓰고, MVC에서 습관적으로 <code>.block()</code>하면 비동기 이점을 잃는다.

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화와 이전 방식의 한계 | 근거 |
|---|---|---|
| Spring Framework 6.1 | <code>RestClient</code>가 추가됐다. 기존 <code>RestTemplate</code>의 template 방식은 fluent 호출 구성에 한계가 있었다. | [REST Clients](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html) |
| Spring Framework 7.0 | API 버저닝이 매핑·검증·폐기 안내를 제공해 앱별 요청 버전 파싱 중복을 줄였다. | [API Versioning](https://docs.spring.io/spring-framework/reference/web/webmvc-versioning.html), [설정](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/api-version.html) |
| Spring Framework 7.0 | Jackson 3가 기본이 되고 Jackson 2는 deprecated 됐다. <code>tools.jackson</code> 패키지와 새 serializer API에 맞춘 전환이 필요하다. | [Framework 7.0 Release Notes](https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes), [Boot JSON](https://docs.spring.io/spring-boot/reference/features/json.html) |
| 현재 기준 | 예제 버전은 Java 25, Boot 4.1.1, Framework 7.0.9다. Boot 4의 기본 JSON 라이브러리는 Jackson 3다. | 공통 브리프 기준표, [Boot JSON](https://docs.spring.io/spring-boot/reference/features/json.html) |

하위 라이브러리 버전은 공통 브리프의 Boot BOM을 따른다.

## 6. 실무 가이드

- **기본값 추천:** 새 동기 호출은 <code>RestClient</code>로 시작한다. reactive·스트리밍은 <code>WebClient</code>, 선언형 계약은 HTTP Interface로 분리한다.
- 기존 <code>RestTemplate</code>은 변경 영역부터 옮긴다. Framework 7 문서는 이를 deprecated 처리한다.
- 작은 목록은 offset, 크고 변동 많은 목록은 고유 정렬 키 기반 cursor/keyset을 택한다. 페이지 상한·정렬 allowlist·tie-breaker를 두고 불필요한 전체 count는 피한다.
- 비호환 API는 버전과 폐기 일정을 제공한다. 헤더 버전은 캐시의 <code>Vary</code>를 설정한다.
- <code>springdoc-openapi</code> 문서와 실제 오류·보안·버전별 계약을 비교한다.
- 연결·응답·풀 대기·전체 deadline을 구분하고 목적지별 지연·타임아웃·재시도를 관측한다.
- 재시도는 횟수·backoff/jitter·총 deadline을 제한한다. POST는 idempotency key 계약이 없으면 재시도하지 않는다.
- 회복성 패턴(서킷브레이커)은 → S20 참조.

### HTTP 캐시와 조건부 GET (보강)

HTTP 캐싱은 응답의 저장 허용 여부와 저장한 표현을 다시 쓸 수 있는 시점을 `Cache-Control`로 정하고, 응답 검증자(validator)로 원본의 변경 여부를 확인하는 계약이다. API는 JSON 본문뿐 아니라 이 헤더와 304 응답까지 함께 설계해야 한다. `max-age=N`은 응답이 N초 동안 fresh 상태라는 뜻이며, `max-age=0`은 저장 금지가 아니라 저장 후 즉시 재검증이 필요하다는 뜻이다. 만료된 항목을 원본 확인 없이 쓰지 않게 하려면 `must-revalidate`도 설정한다.

정책은 응답의 사용자 범위로 고른다.

- `Cache-Control: public, max-age=60`은 브라우저뿐 아니라 공유 캐시(CDN·프록시)도 60초간 재사용할 수 있음을 허용한다. 익명 카탈로그처럼 사용자에 따라 내용이 달라지지 않는 표현에 쓴다. `public`은 임의로 붙이는 성능 옵션이 아니다.
- `Cache-Control: private, max-age=0, must-revalidate`는 브라우저 같은 개인 캐시에만 저장하게 하고 매번 서버에서 유효성을 확인하게 한다. 로그인한 사용자 프로필 등 개인별 표현에 적합하다. `private`만으로 브라우저 안의 계정 전환까지 분리되는 것은 아니므로 서버는 현재 인증 주체의 표현과 검증자를 비교해야 한다.
- `Cache-Control: no-store`는 개인·공유 캐시 모두 저장하지 말라는 지시다. 비밀 정보나 저장 자체를 피해야 하는 응답에 사용한다. `no-cache`는 저장을 막는 말이 아니라 재사용 전 검증을 요구하는 지시이므로 둘을 혼동하지 않는다.

ETag는 선택한 표현의 버전을 나타내는 불투명한 토큰이며, 응답 값은 따옴표로 감싼다. 표현 데이터가 바뀔 때마다 바뀌는 강한 ETag(`"profile-v42"`)를 쓰면 바이트 단위 표현의 변경도 잡을 수 있다. 바이트가 달라도 의미상 같은 표현을 허용할 때만 약한 ETag(`W/"profile-v42"`)를 고려한다. Last-Modified는 수정 시각을 HTTP 날짜로 제공하는 대안이다. HTTP 날짜는 초 단위라 같은 초에 여러 번 수정되는 데이터에는 변경을 놓칠 수 있으므로 ETag가 더 정확하다.

클라이언트는 저장해 둔 응답을 확인하려고 `If-None-Match: "profile-v42"` 또는 `If-Modified-Since: <Last-Modified 값>`을 보낸다. 서버가 현재 표현과 같다고 판단한 GET/HEAD에는 `304 Not Modified`와 본문 없는 응답을 돌려준다. 클라이언트는 보관 중인 본문을 재사용한다. 바뀌었다면 `200 OK`와 새 본문, 새 ETag 및 Last-Modified를 반환한다. 두 조건 헤더가 함께 오면 정확도가 더 높은 `If-None-Match`를 우선하고 `If-Modified-Since`는 무시한다. 따라서 ETag가 있으면 날짜 검증을 함께 지원해도 ETag 비교가 최종 기준이다.

Spring Boot 4.1 / Spring Framework 7, Java 25 기준으로 Spring MVC 컨트롤러에서는 `WebRequest.checkNotModified(etag, lastModified)`가 두 조건 헤더를 처리하고, 변경되지 않은 GET을 304로 표시한다. 다음 예는 현재 인증 사용자의 프로필 표현 버전을 ETag로 쓰고, 그 사용자의 마지막 수정 시각도 함께 보낸다. `ProfileSnapshot`은 DTO와 표현 버전을 원자적으로 제공한다고 가정한다.

```java
@RestController
class ProfileController {
    private final ProfileService profiles;

    ProfileController(ProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/api/me/profile")
    ResponseEntity<ProfileDto> me(Authentication authentication, WebRequest request) {
        ProfileSnapshot profile = profiles.load(authentication.getName());
        long modified = profile.updatedAt()
                .truncatedTo(ChronoUnit.SECONDS).toEpochMilli();
        String etag = "\"profile-" + profile.representationVersion() + "\"";
        CacheControl policy = CacheControl.maxAge(Duration.ZERO)
                .cachePrivate().mustRevalidate();

        if (request.checkNotModified(etag, modified)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag).lastModified(modified)
                    .cacheControl(policy).build();
        }
        return ResponseEntity.ok()
                .eTag(etag).lastModified(modified)
                .cacheControl(policy).body(profile.dto());
    }
}
```

실제 첫 응답에는 `Cache-Control: private, max-age=0, must-revalidate`, `ETag`, `Last-Modified`가 붙는다. 다음 요청은 예를 들어 `If-None-Match: "profile-42"`를 보내며, 서버가 여전히 같은 인증 사용자의 같은 표현 버전을 찾으면 304를 돌려준다. 조건이 맞지 않으면 전체 최신 프로필을 200으로 응답한다. Spring MVC는 `CacheControl.noStore()`도 제공하며, `CacheControl.maxAge(...).cachePublic()`은 실제로 공유 가능한 표현에만 사용한다.

**함정:** 개인 API를 `public`으로 표시하면 공유 캐시가 사용자 간에 응답을 재사용할 수 있다. 쿠키 기반 인증이라고 공유 캐시가 자동으로 모든 응답을 차단한다고 가정하지 말고, 사용자 응답에는 `private` 또는 저장 금지가 필요한 경우 `no-store`를 명시한다. `Vary: Cookie`는 쿠키 전체를 캐시 키로 만들 뿐 개인 정보 보호 정책을 대체하지 않는다. 또한 ETag를 사용자 ID가 아닌 공통 레코드 버전만으로 만들면 두 계정의 검증자가 우연히 같아져 이전 계정의 캐시 본문에 304를 허용할 수 있다. 검증자는 인증 후 선택된 표현의 실제 버전을 반영하고, 표현이 바뀌면 반드시 바뀌게 한다. 응답 변환·권한에 따라 본문이 달라진다면 그 차이도 검증자 계산에 반영한다.

참고: HTTP Caching — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-caching.html
참고: RFC 9110: HTTP Semantics — https://www.rfc-editor.org/rfc/rfc9110.html
참고: RFC 9111: HTTP Caching — https://www.rfc-editor.org/rfc/rfc9111.html

## 7. 함정·안티패턴

1. **증상:** GET이 상태를 바꾼다 → **원인:** 조회에 쓰기를 숨겼다 → **대처:** GET/HEAD는 읽기 전용으로 둔다.
2. **증상:** 결제·주문이 중복된다 → **원인:** 타임아웃 뒤 POST를 무조건 재시도했다 → **대처:** idempotency key와 서버의 결과 재생 계약을 둔다.
3. **증상:** PUT 뒤 생략된 필드가 초기화된다 → **원인:** 부분 DTO를 전체 교체로 처리했다 → **대처:** 전체 표현을 보내거나 PATCH에서 null·생략 의미를 정의한다.
4. **증상:** 페이지에서 중복·누락이 난다 → **원인:** 불안정한 정렬 또는 동시 변경이다 → **대처:** 고유 tie-breaker를 두고 대규모 목록은 cursor/스냅샷을 고려한다.
5. **증상:** 정렬 요청이 오류·예상 밖 쿼리를 만든다 → **원인:** 필드를 제한 없이 매핑했다 → **대처:** 공개 정렬 키 allowlist와 페이지 상한을 둔다.
6. **증상:** 느린 하위 호출이 스레드·연결을 점유한다 → **원인:** 타임아웃이 없거나 한 구간만 설정했다 → **대처:** 풀·연결·응답·전체 제한과 재시도 총 시간을 정한다.
7. **증상:** Jackson 전환 후 직렬화 오류·계약 차이가 난다 → **원인:** 패키지/API 변화나 Jackson 세대 혼용이다 → **대처:** <code>tools.jackson</code>과 날짜·enum·null·다형성 계약을 확인한다.
8. **증상:** 캐시가 다른 API 버전 응답을 돌려준다 → **원인:** 버전 헤더가 캐시 키에 없다 → **대처:** <code>Vary</code>와 CDN 키를 맞추고 폐기 정책을 문서화한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. PUT과 PATCH를 어떻게 구분하며, PATCH는 재시도해도 안전한가?

PUT은 전체 표현 교체라 반복 후 최종 상태가 같아야 한다. PATCH는 연산에 따라 멱등일 수도 아닐 수도 있다. 생략과 null의 의미를 정하지 않으면 부분 수정에서 데이터가 지워진다.

**꼬리 질문:** <code>PATCH {"counter": counter + 1}</code> 같은 연산은 멱등인가? → 아니다. 동일 요청 재적용마다 값이 증가하므로 조건부 버전 검사나 별도 중복 제거 계약 없이는 안전하게 재시도할 수 없다.

### Q2. PUT/DELETE가 멱등이라는 말은 응답도 똑같다는 뜻인가?

아니다. 멱등성은 반복 요청의 상태 효과가 같은 성질이다. 첫 DELETE는 204, 다음은 404여도 최종 상태가 같을 수 있다.

**꼬리 질문:** 그럼 POST는 절대 재시도하면 안 되는가? → 일반적으로 자동 재시도하지 않는다. 서버가 idempotency key를 고유하게 저장하고 같은 키의 결과를 재생하는 계약이 있으면 중복 생성 위험을 통제할 수 있다.

### Q3. 목록 API에서 offset과 cursor를 어떤 기준으로 선택하나?

offset은 임의 페이지 이동이 쉽고 작은 안정적 목록에 단순하다. 깊은 offset은 비싸고 데이터 변경에 페이지가 밀린다. cursor는 대규모 목록에 유리하지만 임의 이동이 어렵다.

**꼬리 질문:** <code>createdAt</code>으로만 정렬하면 무엇이 문제인가? → 같은 타임스탬프를 가진 행들의 순서가 고정되지 않아 페이지 사이에서 중복·누락이 생길 수 있다. <code>id</code>를 최종 tie-breaker로 추가한다.

### Q4. 요청 타임아웃이 난 뒤 서버가 작업을 했는지 알 수 있나?

보통 알 수 없다. 타임아웃은 클라이언트가 더 기다리지 않는 것이지 서버 취소·롤백을 뜻하지 않는다. 작업이 이미 반영됐을 가능성까지 고려해 재시도한다.

**꼬리 질문:** 어떤 제한을 설정하나? → 풀 획득, 연결 수립, 응답 읽기, 전체 deadline을 구분하고 재시도까지 합친 시간이 상위 제한보다 짧게 둔다.

### Q5. <code>RestClient</code>, <code>WebClient</code>, HTTP Interface의 선택 기준은?

<code>RestClient</code>는 동기 호출의 기본이다. <code>WebClient</code>는 reactive 조합·스트리밍에 맞는다. HTTP Interface는 전송 방식이 아니라 두 클라이언트에 연결할 선언형 계약이다.

**꼬리 질문:** MVC 코드에서 <code>WebClient.block()</code>만 호출하면 이점이 있는가? → 호출 스레드를 막으므로 reactive 비동기 이점을 대부분 잃는다. 프로젝트의 동시성 모델에 맞는 동기 클라이언트를 쓰거나 호출 체인을 reactive로 유지한다.

### Q6. API 버저닝에서 Framework 7 지원은 무엇을 자동화하나?

resolver가 버전을 읽고 parser가 해석해 컨트롤러 매핑과 지원 여부를 확인한다. 기본 설정은 필수 버전 누락과 미지원 버전을 400으로 처리한다. 기본값과 폐기 헤더도 설정할 수 있다.

**꼬리 질문:** 헤더 버저닝을 택하면 무엇을 놓치기 쉬운가? → 캐시가 헤더별 표현 차이를 모를 수 있다. <code>Vary: API-Version</code>과 CDN/프록시 캐시 키를 함께 설정하고 문서화한다.

### Q7. Jackson 3 전환에서 소스 코드 외에 무엇을 검증해야 하나?

Boot 4의 기본은 Jackson 3이며 데이터 API는 <code>tools.jackson</code> 패키지다. 커스텀 serializer API와 Jackson 2 의존성 혼재를 확인하고 외부 JSON 호환성을 검증한다.

**꼬리 질문:** 어떤 계약 테스트를 두나? → null/필드 생략, 날짜·시간대, enum 이름, 알 수 없는 필드, 다형성 JSON을 대표 샘플로 직렬화·역직렬화해 기존 계약과 비교한다.

### Q8. springdoc이 OpenAPI 문서를 생성하면 API 계약 검토는 끝나는가?

아니다. springdoc은 OpenAPI와 Swagger UI 생성을 돕지만 버전별 요청/응답, 오류, 인증, 제약이 실제와 맞는지 검토해야 한다. 런타임 정책은 자동 문서에서 빠질 수 있다.

**꼬리 질문:** 릴리스에서 무엇을 비교할 수 있나? → 생성된 OpenAPI 스펙을 저장해 변경분을 비교하고, 호환성 정책에 따라 제거·타입 변경·필수화 같은 breaking change를 배포 전에 차단한다.

## 9. 참고문헌

- REST Clients — https://docs.spring.io/spring-framework/reference/integration/rest-clients.html — <code>RestClient</code>, <code>WebClient</code>, <code>RestTemplate</code>, HTTP Service Clients의 기능과 요청/응답 변환.
- Spring Framework 6.1 Release Notes — https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-6.1-Release-Notes — <code>RestClient</code> 도입 세대와 동작 변경 사항.
- API Versioning — https://docs.spring.io/spring-framework/reference/web/webmvc-versioning.html — 버전 추출·파싱·검증과 폐기 헤더 동작.
- API Version 설정 — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/api-version.html — <code>WebMvcConfigurer</code>로 헤더 등 버전 전달 방식을 구성하는 법.
- Mapping Requests — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html — MVC 요청 매핑 기준.
- Spring Data Extensions — https://docs.spring.io/spring-data/commons/reference/repositories/core-extensions.html — MVC에서 <code>Pageable</code>·<code>Sort</code> 인자를 해석하는 웹 지원.
- JSON — https://docs.spring.io/spring-boot/reference/features/json.html — Boot의 JSON 라이브러리 통합과 Jackson 3 기본 설정.
- Spring Framework 7.0 Release Notes — https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes — Jackson 3 기본 지원과 Jackson 2 deprecated 및 마이그레이션 영향.
- <code>JdkClientHttpRequestFactory</code> Javadoc — https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api//org/springframework/http/client/JdkClientHttpRequestFactory.html — JDK <code>HttpClient</code> 기반 요청 팩토리와 읽기 타임아웃 설정.
- Error Responses — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html — Spring MVC의 <code>ProblemDetail</code> / <code>ErrorResponse</code> 지원.
- RFC 9110: HTTP Semantics — https://www.rfc-editor.org/rfc/rfc9110.html — 리소스, 메서드 의미, 안전성·멱등성, 상태 코드의 HTTP 표준.
- RFC 9457: Problem Details for HTTP APIs — https://www.rfc-editor.org/rfc/rfc9457.html — 기계가 읽는 표준 HTTP 오류 본문 형식.
- springdoc-openapi — https://springdoc.org/ — Spring Boot 애플리케이션의 OpenAPI 3 및 Swagger UI 문서.
