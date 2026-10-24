# H8. 외부 HTTP 호출 — RestClient와 타임아웃

> 개념 레슨 · 40분

## 이게 뭐냐

지금까지 우리 서버는 요청을 **받기만** 했다. 16-4의 링크 미리보기에서는 처음으로 우리 서버가 **남의 서버에 요청을 보낸다.** 링크 주소의 HTML을 받아 `og:title`(페이지 제목)을 읽는다.

curl이 터미널에서 하던 일을 Java 코드가 하는 것이다. Spring에서는 `RestClient`를 쓴다.

```java
String html = restClient.get()
        .uri(URI.create("https://example.com/article"))
        .retrieve()              // 보내고 응답을 받을 준비
        .body(String.class);     // 본문을 String으로 — 여기서 실제로 기다린다
```

`RestClient`는 **동기식**이다. 응답이 올 때까지 이 줄을 실행한 스레드(요청 스레드)가 멈춰 있다. 남의 서버는 우리가 고칠 수 없다. 느릴 수도 있고 응답을 안 줄 수도 있다. 그래서 **얼마나 기다릴지(타임아웃)** 를 꼭 정한다.

| 타임아웃 | 무엇을 기다리나 | 넘으면 |
|---|---|---|
| 연결(connect) | 상대 서버와 연결이 맺어지기까지 | `Connect timed out` |
| 읽기(read) | 연결된 뒤 응답 데이터가 오기까지 | `Read timed out` |

실패는 두 종류로 나뉜다.

| 종류 | 예 | `RestClient`가 던지는 예외 |
|---|---|---|
| 응답은 왔는데 상태가 4xx·5xx | 없는 페이지 `404`, 상대 서버 오류 `500` | `HttpClientErrorException`, `HttpServerErrorException` |
| 응답 자체를 못 받음 | 연결 거부, 시간 초과 | `ResourceAccessException`(원인에 `SocketTimeoutException` 등) |

상태별 처리는 `onStatus(...)`로 바꿀 수 있다. 시간 초과는 `onStatus`로 잡히지 않는다. 응답이 없으니 상태도 없다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18310`)을 만들어 돌렸다. 앱 안에 **연습용 가짜 외부 사이트**를 두었다. `GET /fake-site/page?title=…&delay=…`는 `delay`(ms)만큼 쉰 뒤 `og:title`이 든 HTML을 준다(16-4와 같은 모양).

### 1. `RestClient`를 어떻게 만드나 — 빌더 빈이 없다

문서는 "Boot가 만들어 둔 `RestClient.Builder`를 주입받아 쓰라"고 한다. 그런데 실습 레포와 같은 의존성(`spring-boot-starter-webmvc` 등)만 두고 생성자에서 빌더를 받았더니 앱이 안 떴다.

```text
***************************
APPLICATION FAILED TO START
***************************

Description:

Parameter 0 of constructor in org.example.h8.NeedsBuilder required a bean of type 'org.springframework.web.client.RestClient$Builder' that could not be found.
```

Boot 4는 기능별로 모듈이 쪼개져 있다. `RestClient` 자동 설정은 별도 스타터다. 길은 둘이다.

| | (가) 스타터 추가 | (나) 직접 만들기 |
|---|---|---|
| 의존성 | `implementation 'org.springframework.boot:spring-boot-starter-restclient'` | 없음 |
| 만들기 | 생성자로 `RestClient.Builder builder` 주입 → `builder.build()` | `RestClient.builder().requestFactory(factory).build()` |
| 타임아웃 | `application.yml`의 `spring.http.clients.connect-timeout`·`read-timeout` | 요청 팩토리에 직접 |
| 실제로 쓴 요청 팩토리 | `JdkClientHttpRequestFactory` | 고른 것(아래는 `SimpleClientHttpRequestFactory`) |

16-4 힌트는 (나)다.

```java
SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
factory.setConnectTimeout(Duration.ofSeconds(1));
factory.setReadTimeout(Duration.ofSeconds(2));
this.restClient = RestClient.builder().requestFactory(factory).build();
```

### 2. 타임아웃이 정말 끊나 — 5초 걸리는 페이지

`delay=5000`인 가짜 페이지를 세 가지 클라이언트로 불렀다. (가)는 `spring.http.clients.read-timeout: 2s`를 넣었다.

| 클라이언트 | 걸린 시간 | 결과 |
|---|---|---|
| (가) 주입받은 빌더, 설정 **없음** | 5051ms | 끝까지 기다려 HTML 받음 |
| (가) 주입받은 빌더, `read-timeout: 2s` | **2023ms** | 예외 |
| `RestClient.create()`, 같은 설정 | 5024ms | 설정 무시, 끝까지 기다림 |
| (나) `SimpleClientHttpRequestFactory`, 읽기 2초 | **2007ms** | 예외 |

**타임아웃을 안 정하면 상대가 응답할 때까지 기다린다.** 5초가 아니라 5분이어도 기다린다. 그동안 글쓰기 요청도 멈춰 있다. 그리고 `RestClient.create()`는 Boot 설정을 **받지 않는다.** `application.yml`에 적어도 소용없다.

예외 원문이다. 같은 "2초 초과"인데 요청 팩토리마다 메시지가 다르다.

```text
(가) org.springframework.web.client.ResourceAccessException: I/O error on GET request for "http://localhost:18310/fake-site/page": Request cancelled
     원인 java.net.http.HttpTimeoutException: Request cancelled
(나) org.springframework.web.client.ResourceAccessException: I/O error on GET request for "http://localhost:18310/fake-site/page": Read timed out
     원인 java.net.SocketTimeoutException: Read timed out
```

연결 타임아웃은 응답하지 않는 주소로 확인했다(예시 주소는 RFC 5737 문서용 `http://192.0.2.1/`. 아래 측정값은 `10.255.255.1`로 잰 것이다).
회사망 같은 곳에서는 이런 "응답 없는 주소"가 바로 거절되거나 프록시가 받아서 다르게 굴 수 있으므로, 정답 테스트(`PgClientTest`)처럼 로컬 소켓으로 SYN이 버려지게 만드는 방법이 믿을 만하다. (나)는 `1006ms` 만에 `Connect timed out`, (가)는 `1002ms` 만에 `HTTP connect timed out`(`HttpConnectTimeoutException`)이었다. 아무도 안 듣는 포트(`localhost:18399`)는 기다릴 것도 없이 `0ms`에 `Connection refused`였다.

### 3. 상태 코드 — `onStatus`

가짜 사이트에 `404`·`500`을 돌려주게 하고 `retrieve().body(String.class)`로 받았다.

```text
404 → org.springframework.web.client.HttpClientErrorException$NotFound: 404 : "상태 404"
500 → org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "상태 500"
```

`onStatus`로 4xx를 우리 예외로 바꿨다.

```java
String body = restClient.get().uri(uri)
        .retrieve()
        .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
            throw new LinkNotFoundException(response.getStatusCode().value());
        })
        .body(String.class);
```

```text
404 → org.example.h8.H8Controller$LinkNotFoundException: 링크 페이지가 없음 status=404
500 → org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "상태 500"
```

조건(`is4xxClientError`)에 맞는 것만 바뀌고, `500`은 원래대로다.

### 4. 실패해도 글은 저장한다 — 실패 허용

미리보기는 장식이다. 상대 사이트가 먹통이어도 글쓰기는 성공해야 한다. 실패하면 **제목 없이(`null`)** 넘어간다. 이렇게 "보조 기능이 실패하면 빼고 계속"을 실패 허용(fail-open)이라 한다. 반대로 결제처럼 결과가 꼭 필요한 호출은 실패하면 우리도 에러로 끝낸다.

```java
public String fetchTitle(String url) {
    try {
        String html = restClient.get().uri(URI.create(url)).retrieve().body(String.class);
        return extractTitle(html);
    } catch (RuntimeException e) {
        log.warn("미리보기 실패 url={} : {}", url, e.toString());
        return null;
    }
}
```

(나)의 클라이언트로 다섯 주소를 불렀다.

| 주소 | `title` | 걸린 시간 |
|---|---|---|
| 정상 페이지 | `spring-cache-guide` | 106ms |
| 5초 걸리는 페이지 | `null` | 2124ms |
| `og:title` 없는 페이지 | `title` 태그 값(`no-og` 뒤에 사이트 이름) | 43ms |
| `404` 페이지 | `null` | 4ms |
| 안 열리는 포트 | `null` | 0ms |

실패마다 로그가 한 줄씩 남는다.

```text
WARN … LinkPreviewService : 미리보기 실패 url=http://localhost:18310/fake-site/page?title=slow&delay=5000 : org.springframework.web.client.ResourceAccessException: I/O error on GET request for "http://localhost:18310/fake-site/page": Read timed out
```

이 호출은 **`@Transactional` 밖에서** 한다(16-4). 트랜잭션 안에서 부르면 상대를 기다리는 2초 동안 DB 커넥션도 같이 붙잡는다. H1 일부러 틀려 보기 2에서 본 "트랜잭션 안에서 외부 API를 부르지 말 것"이다.

### 5. Jsoup으로 `og:title` 꺼내기

HTML을 문자열 검색으로 뒤지면 따옴표·순서·대소문자에 걸려 넘어진다. Jsoup은 HTML을 읽어 태그 구조로 바꿔 주는 라이브러리다(`implementation 'org.jsoup:jsoup:1.23.2'`).

```java
static String extractTitle(String html) {
    if (html == null) return null;
    Document doc = Jsoup.parse(html);
    Element og = doc.selectFirst("meta[property=og:title]");   // 없으면 null
    if (og != null && !og.attr("content").isBlank()) return og.attr("content");
    String title = doc.title();                               // 없으면 빈 문자열
    return title.isBlank() ? null : title;
}
```

| 넣은 HTML(요약) | 결과 |
|---|---|
| `og:title`이 `A &amp; B` | `A & B` — 엔티티를 Jsoup이 풀어 줬다 |
| `title` 태그만 | `제목만` |
| 둘 다 없음 | `null` |
| `content` 값에 따옴표가 없는 `meta` | `따옴표 없음` |

16-4 표의 `HtmlUtils.htmlUnescape` 단계는 문자열로 직접 뽑을 때 필요한 것이다. Jsoup을 쓰면 이미 풀려 있으니 건너뛴다. 두 번 풀면 제목에 원래 들어 있던 `&amp;` 같은 글자까지 바뀐다.

`selectFirst`는 못 찾으면 `null`이다. `null` 확인 없이 `.attr(...)`을 부르면 `og:title` 없는 페이지에서 `NullPointerException`이 난다.

## 따라 해 보기

15분. 실습 레포에서 한다. 16-4 전에 클라이언트 하나만 만들어 본다.

**1.** 16-4의 가짜 외부 사이트처럼 `delay`(ms)만큼 쉬고 HTML을 주는 연습용 컨트롤러를 만든다(`GET /fake-site/page`, `Thread.sleep(delay)` 뒤 `og:title`이 든 HTML 문자열 반환, `produces = MediaType.TEXT_HTML_VALUE`).

**2.** 위 (나)의 `SimpleClientHttpRequestFactory` 클라이언트로 그 주소를 부르고 걸린 시간을 돌려주는 연습용 API를 만든다. `System.nanoTime()`을 호출 앞뒤로 재면 된다.

**3.** 세 번 부른다.

```bash
P='http://localhost:8080/fake-site/page?title=hello'
for d in 0 1500 5000; do
  curl -s -G http://localhost:8080/lab/h8/fetch --data-urlencode "url=$P&delay=$d"; echo
done
```

`0`·`1500`은 HTML이, `5000`은 약 2000ms 뒤 `Read timed out`이 나와야 한다. 그다음 `factory.setReadTimeout(...)` 줄을 지우고 `5000`을 다시 보낸다. 5초를 다 기다린다.

## 일부러 틀려 보기

**1. 속성 이름을 단수로 쓴다.** (가)에서 `spring.http.client.read-timeout: 2s`(`clients`가 아니라 `client`)로 적었다. 앱은 경고 없이 떴고, 5초 페이지를 `5124ms` 동안 기다렸다. 틀린 속성 이름은 **조용히 무시된다.** 타임아웃은 넣었다고 믿지 말고 위처럼 느린 주소로 끊기는지 재 본다.

**2. `RestClient.create()`로 만든다.** 설정을 넣었는데 안 끊긴다(예시 2의 표). Boot 설정을 받으려면 주입받은 빌더로 만들고, 직접 만들 거면 요청 팩토리에 타임아웃을 직접 넣는다.

**3. `catch (HttpClientErrorException e)`만 잡는다.** `404`는 잡히지만, 느린 사이트의 `ResourceAccessException`은 그대로 올라가 글쓰기가 `500`이 된다. 미리보기처럼 실패해도 되는 호출은 `RuntimeException`으로 넓게 잡고 로그를 남긴다.

## 확인 문제

**1.** 실습 레포에서 생성자로 `RestClient.Builder`를 받았더니 `required a bean of type 'org.springframework.web.client.RestClient$Builder' that could not be found`로 앱이 안 뜬다. 고치는 방법 두 가지는?

<details>
<summary>정답</summary>

① `spring-boot-starter-restclient` 의존성을 더한다. Boot 4는 `RestClient` 자동 설정이 이 별도 모듈에 있다. ② 빌더를 주입받지 않고 `RestClient.builder().requestFactory(factory).build()`로 직접 만든다(16-4 힌트 1). ②는 타임아웃을 팩토리에 직접 넣는다.
</details>

**2.** 타임아웃을 아무 데도 정하지 않고, 응답에 5초 걸리는 사이트를 불렀다. 어떻게 되나?

<details>
<summary>정답</summary>

**5초를 다 기다린다**(실측 5051ms). 상대가 영영 응답하지 않으면 그만큼 계속 기다린다. 그동안 요청 스레드가 묶이고 사용자 화면도 멈춘다. 연결·읽기 타임아웃을 모두 정한다.
</details>

**3.** `application.yml`에 `spring.http.clients.read-timeout: 2s`를 넣었는데 `RestClient.create()`로 만든 클라이언트는 5초를 기다렸다. 왜인가?

<details>
<summary>정답</summary>

`RestClient.create()`는 Boot가 만든 빌더를 쓰지 않아 Boot 설정이 적용되지 않는다. 주입받은 `RestClient.Builder`로 만든 클라이언트만 2초에 끊겼다.
</details>

**4.** `onStatus(HttpStatusCode::is4xxClientError, …)`를 달았다. 상대 사이트가 응답 없이 2초를 넘겨 시간 초과가 났다. `onStatus` 처리기가 불리나?

<details>
<summary>정답</summary>

**안 불린다.** `onStatus`는 **응답이 왔을 때** 상태 코드를 보고 처리한다. 시간 초과·연결 거부는 응답이 없으니 상태도 없고, `ResourceAccessException`으로 따로 나온다. 둘 다 `try/catch`로 다룬다.
</details>

**5.** 링크 미리보기 호출을 글 저장 `@Transactional` 메서드 **안**에서 하면 무엇이 나쁜가? 미리보기가 실패하면 글쓰기 응답은?

<details>
<summary>정답</summary>

상대를 기다리는 동안(최대 2초) **DB 커넥션과 트랜잭션을 붙잡는다.** 느린 링크가 몰리면 커넥션이 바닥나 다른 요청까지 기다린다. 그래서 트랜잭션 밖에서 먼저 가져오고 결과만 넘긴다. 실패하면 제목만 `null`로 두고 글은 저장한다(`201`). 미리보기는 실패해도 되는 보조 기능이다.
</details>

## 더 깊이

- [S06 — 예제 3 RestClient의 연결·읽기 시간 제한](../docs/knowledge/S06-rest-api-clients.md#예제-3--restclient의-연결읽기-시간-제한)
- [P25 — RestClient 빈 구성](../docs/knowledge/P25-external-api-client.md#23-restclient-빈-구성)
- [P25 — connect timeout과 read timeout은 왜 둘 다 필요한가?](../docs/knowledge/P25-external-api-client.md#q3-connect-timeout과-read-timeout은-왜-둘-다-필요한가)
- [W14 — MVC에서 외부 HTTP 호출이 5초 걸릴 때 무엇이 블로킹되는가?](../docs/knowledge/W14-sync-async-blocking.md#q2-mvc에서-외부-http-호출이-5초-걸릴-때-무엇이-블로킹되는가)
- [D13 — 용어 사전(SSRF)](../docs/knowledge/D13-backend-glossary.md) — 사용자가 준 주소를 서버가 대신 여는 위험
- Spring Framework Reference — REST Clients: https://docs.spring.io/spring-framework/reference/integration/rest-clients.html
- Spring Boot 4.1 Reference — Calling REST Services: https://docs.spring.io/spring-boot/4.1/reference/io/rest-client.html
- Spring Boot 4.1 — Common Application Properties(`spring.http.clients.*`): https://docs.spring.io/spring-boot/4.1/appendix/application-properties/index.html
- RFC 9110 — 멱등 메서드와 재시도: https://www.rfc-editor.org/rfc/rfc9110.html
- jsoup — CSS 선택자로 요소 찾기: https://jsoup.org/cookbook/extracting-data/selector-syntax

## 다음

- 실습: [16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기](../scenario/ch16-events-async-cache/16-4-link-preview.md) — 연결 1초·읽기 2초 클라이언트로 `og:title`을 가져오고, 실패하면 제목 없이 `201`로 저장한다.
- 16장을 마치면 [16-1](../scenario/ch16-events-async-cache/16-1-new-post-event.md)부터 다시 돌려 로그의 스레드 이름(`http-nio-…`, `notify-…`)을 따라가 본다.
