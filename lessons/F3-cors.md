# F3. CORS — 브라우저가 막는 이유

> 개념 레슨 · 30분

## 이게 뭐냐

curl로는 잘 되는데 studymate 실행 칸 버튼만 실패하고, 콘솔에 `blocked by CORS policy`가 뜬다. 서버 로그에는 에러가 없다. 막은 건 서버가 아니라 **브라우저**다.

### 출처(origin)

**출처**는 `프로토콜://호스트:포트` 세 가지 묶음이다. 하나라도 다르면 다른 출처다.

| 페이지 | 요청 대상 | 같은 출처? | 다른 곳 |
|---|---|---|---|
| `http://localhost:3000` | `http://localhost:3000/api/posts` | 같다 | — |
| `http://localhost:3000` (studymate) | `http://localhost:8080/api/posts` (내 서버) | **다르다** | 포트 |
| `http://localhost:8080` | `http://127.0.0.1:8080/api/posts` | **다르다** | 호스트(같은 컴퓨터여도 이름이 다르면 다르다) |
| `http://localhost:8080` | `https://localhost:8080` | **다르다** | 프로토콜 |

studymate 실행 칸은 `http://localhost:3000`에 뜬 페이지가 브라우저에서 `http://localhost:8080/api/posts`로 요청을 보낸다. 포트가 다르니 다른 출처다.

### 같은 출처 정책 — 왜 브라우저가 막나

내가 은행 사이트에 로그인해 둔 채로 이상한 사이트를 열었다고 하자. 그 사이트의 JS가 `https://bank.example/api/me`로 요청을 보내면 브라우저는 내 은행 쿠키를 붙여 보낸다(F2). 응답(내 계좌 정보)을 그 사이트의 JS가 읽을 수 있다면 큰일이다.

그래서 브라우저는 기본으로 **다른 출처의 응답을 페이지의 JS가 읽지 못하게** 막는다. 이것이 같은 출처 정책이다. 그런데 페이지를 내주는 서버(3000)와 API 서버(8080)를 따로 띄우는 일은 흔하다. 그래서 **서버가 응답 헤더로 "이 출처는 읽어도 된다"고 허락**하는 규칙이 생겼다. 그게 **CORS**(Cross-Origin Resource Sharing)다.

| 응답 헤더 | 뜻 |
|---|---|
| `Access-Control-Allow-Origin: http://localhost:3000` | 이 출처의 JS는 응답을 읽어도 된다. **이게 없으면 막힌다** |
| `Access-Control-Allow-Methods: GET,POST,…` | (preflight 답) 이 메서드로 보내도 된다 |
| `Access-Control-Allow-Headers: content-type, authorization` | (preflight 답) 이 요청 헤더를 실어도 된다 |
| `Access-Control-Expose-Headers: Location, …` | JS가 읽을 수 있는 **응답** 헤더. 기본으로는 `Content-Type` 같은 몇 개만 읽힌다 |
| `Access-Control-Max-Age: 1800` | preflight 답을 몇 초 동안 다시 묻지 않고 쓸지 |

### 단순 요청과 preflight

| | 어떤 요청 | 브라우저가 하는 일 |
|---|---|---|
| **단순 요청** | `GET`·`HEAD`·`POST`이고, 특별한 헤더가 없고, `Content-Type`이 폼·일반 텍스트 정도인 것 | 바로 보낸다. 응답에 허락 헤더가 없으면 **JS가 못 읽게** 막는다 |
| **preflight가 필요한 요청** | `Content-Type: application/json`, `Authorization` 헤더, `PUT`·`PATCH`·`DELETE` 중 하나라도 | 본 요청 전에 `OPTIONS`로 먼저 묻는다(preflight). 허락이 없으면 **본 요청을 아예 안 보낸다** |

이 게시판의 글쓰기는 JSON 본문이라 항상 preflight를 거친다.

### 기억할 것 둘

- **CORS를 검사하는 건 브라우저뿐이다.** curl·Postman·IntelliJ HTTP Client·다른 서버는 검사하지 않는다. "curl은 되는데 버튼만 실패"의 정체다.
- **CORS는 서버를 지키는 장치가 아니다.** 브라우저 안의 JS가 응답을 읽을지 정할 뿐이다. 누가 보냈는지 확인하는 일은 인증(F2)이 한다.

## 예시

실측 방법: 서버 하나(1-5 정답 코드, 8209 포트)를 띄우고, 브라우저(Chromium)로 `http://localhost:8209`의 페이지를 연 뒤 그 안에서 `http://127.0.0.1:8209/api/posts`로 요청을 보냈다. 호스트 이름이 달라 **다른 출처**가 된다. 아래 결과는 브라우저 콘솔과 요청 결과를 그대로 옮긴 것이다. 학습자 환경이라면 `localhost:3000`(studymate) → `localhost:8080`(내 서버)이 같은 모양이 된다.

### ① CORS 설정이 없을 때 — JSON POST

curl로 preflight를 흉내 내 보면 서버는 `200`으로 답하지만 허락 헤더가 없다.

```text
$ curl -i -X OPTIONS …/api/posts -H 'Origin: http://localhost:3000' \
    -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 200
Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
Content-Length: 0
```

브라우저에서 JSON을 POST 하면:

```text
Access to fetch at 'http://127.0.0.1:8209/api/posts' from origin 'http://localhost:8209' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
Failed to load resource: net::ERR_FAILED
→ fetch 결과: TypeError: Failed to fetch
```

- 요청을 보낸 브라우저 쪽 코드에는 상태 코드조차 안 온다. `TypeError: Failed to fetch` 하나뿐이다. 이유는 콘솔에만 있다.
- 이때 DB에는 글이 **안 들어갔다.** preflight에서 막혀 본 POST가 아예 나가지 않았기 때문이다. (브라우저가 예전에 받은 preflight 허락을 기억하고 있으면 다르다 — 따라 해 보기 3번.)

### ② CORS 설정이 없을 때 — curl로 같은 POST

```text
$ curl -i -X POST …/api/posts -H 'Origin: http://localhost:3000' -H 'Content-Type: application/json' -d '{…}'
HTTP/1.1 201
Location: /api/posts/27
```

`Origin` 헤더까지 붙였는데도 저장됐다. curl은 preflight를 보내지도, 허락 헤더를 검사하지도 않는다. **CORS는 서버를 지키지 않는다**는 말이 이것이다.

### ③ CORS 설정을 넣었을 때

1-1의 [CORS 열기](../scenario/ch1-create-post/1-1-receive-request.md#cors-열기) 표대로 만든 설정이다.

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .exposedHeaders("Location", "WWW-Authenticate");
    }
}
```

```text
$ curl -i -X OPTIONS …/api/posts -H 'Origin: http://localhost:3000' \
    -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 200
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: content-type
Access-Control-Expose-Headers: Location, WWW-Authenticate
Access-Control-Max-Age: 1800
```

브라우저에서 보낸 요청도 이제 `201`을 받고, 응답의 `Location` 헤더(`/api/posts/29`)까지 읽혔다(1-6 코드에 같은 설정을 넣고 `tok-lee`로 보낸 실측).

허락 목록에 없는 출처(`Origin: https://evil.example`)로 보내면 Spring이 본 요청까지 거절한다. 이때는 글이 저장되지 않았다.

```text
HTTP/1.1 403
Vary: Origin

Invalid CORS request
```

## 따라 해 보기

10분. 1-1에서 `CorsConfig`를 만든 실습 레포에서 한다.

**1. preflight를 curl로 흉내 낸다.** 1-1의 "직접 확인"에 있는 요청 C(`OPTIONS` + `Origin` + `Access-Control-Request-Method: PATCH`)를 보내고, 응답에서 `Access-Control-Allow-Origin`·`Access-Control-Allow-Methods`에 `PATCH`가 있는지 본다.

**2. 브라우저에서 두 번 오가는 걸 본다.** studymate의 1-1 실행 칸을 열고 개발자 도구 **Network** 탭에서 **Disable cache**를 켠 채 버튼을 누른다. `posts` 요청이 두 줄 생긴다. 하나는 `OPTIONS`(preflight), 하나는 `POST`다. `OPTIONS` 줄을 눌러 응답 헤더의 `Access-Control-Allow-Origin`을 찾는다.

Disable cache를 끄고 다시 누르면 `POST` 한 줄만 보일 수 있다. 응답의 `Access-Control-Max-Age: 1800` 때문에 브라우저가 30분 동안 preflight 답을 기억해 두고 다시 묻지 않는 것이다.

**3. 설정을 잠깐 끈다.** `CorsConfig`의 `@Configuration`을 주석 처리하고 서버를 다시 켠 뒤, **Disable cache를 켠 채** 같은 버튼을 누른다. Console에 예시 ①과 같은 `Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header`가 뜨고, 글은 저장되지 않는다. 같은 요청을 curl로 보내면 `201`이다.

Disable cache를 **끄고** 누르면 결과가 다르다. 같은 브라우저 탭에서 설정을 켠 서버로 한 번 보낸 뒤, 설정을 끈 서버로 다시 보내 실측했다.

```text
(설정 있음) OPTIONS → POST          → 201
(설정 끔, 캐시된 preflight 답 사용)  POST만 나감
Access to fetch at 'http://127.0.0.1:8209/api/posts' from origin 'http://localhost:8209' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
→ fetch 결과: TypeError: Failed to fetch
(Disable cache 켬)                   OPTIONS만 나가고 막힘 — "Response to preflight request …"
```

두 번째 경우 브라우저는 기억해 둔 허락을 믿고 `POST`를 바로 보냈다. **글은 DB에 저장됐다.** 응답에 허락 헤더가 없어서 JS가 결과를 못 읽었을 뿐이다. 코드는 실패로 알지만 서버에서는 이미 일이 끝난 셈이다. CORS가 서버를 지키는 장치가 아니라는 또 하나의 증거다. 확인했으면 주석을 되돌린다.

## 일부러 틀려 보기

**1. 1-6의 토큰 확인이 preflight까지 막는다** — 1-6에서 `/api/**`에 인터셉터를 걸고 "`Authorization`이 없으면 401"을 넣는다. 그런데 브라우저의 preflight `OPTIONS`에는 **토큰이 없다.** preflight를 통과시키는 줄이 없는 인터셉터(1-6 정답 코드 그대로)에 `CorsConfig`만 넣어 실측한 결과다.

```text
$ curl -i -X OPTIONS …/api/posts -H 'Origin: http://localhost:3000' \
    -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type,authorization'
HTTP/1.1 500
Access-Control-Allow-Origin: http://localhost:3000
…
{"timestamp":"…","status":500,"error":"Internal Server Error","path":"/api/posts"}
```

허락 헤더는 붙었지만 상태가 `500`이다. 인터셉터가 던진 "인증 필요" 예외가 preflight 처리 중에 터졌는데, 컨트롤러 메서드가 아니라서 `@RestControllerAdvice`도 `401`로 바꿔 주지 못했다. 브라우저는 preflight 응답이 `2xx`가 아니면 실패로 본다.

```text
Access to fetch at 'http://127.0.0.1:8209/api/posts' from origin 'http://localhost:8209' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
→ fetch 결과: TypeError: Failed to fetch
```

토큰을 제대로 실은 요청인데도 실패한다. 고치는 법은 인터셉터 맨 앞에 한 줄이다.

```java
if (CorsUtils.isPreFlightRequest(request)) {   // org.springframework.web.cors.CorsUtils
    return true;   // preflight는 토큰 확인을 건너뛴다 — 본 요청에서 확인한다
}
```

이렇게 고치면 preflight는 `200`, 본 요청은 토큰이 있으면 `201`이 된다. 토큰 없이 보낸 본 요청은 `401`인데, 이 `401` 응답에도 `Access-Control-Allow-Origin`과 `Access-Control-Expose-Headers: Location, WWW-Authenticate`가 붙어 있어서 브라우저 코드가 `401`이라는 사실과 본문을 읽을 수 있었다.

**2. `exposedHeaders`를 뺀다** — 설정에서 `.exposedHeaders(...)` 줄만 지우고 브라우저로 글을 쓰면 `201`은 오는데 브라우저 코드에서 `Location` 헤더가 `null`로 읽혔다. curl에서는 `Location`이 멀쩡히 보인다. 1-2의 `Location` 확인이 **실행 칸에서만** 실패하는 원인이다.

## 확인 문제

**1.** 다음 중 `http://localhost:3000` 페이지와 **같은 출처**인 것은? ㉠ `http://localhost:3000/api` ㉡ `http://localhost:8080` ㉢ `http://127.0.0.1:3000` ㉣ `https://localhost:3000`

<details>
<summary>정답</summary>

**㉠만.** 경로(`/api`)는 출처에 들어가지 않는다. ㉡은 포트, ㉢은 호스트 이름, ㉣은 프로토콜이 다르다. `localhost`와 `127.0.0.1`은 같은 컴퓨터를 가리키지만 **글자가 다르면 다른 출처**다.
</details>

**2.** curl로는 `201`인데 studymate 실행 칸 버튼만 실패한다. 서버 로그에는 아무 에러가 없다. 무엇을 의심하고, 어디를 보나?

<details>
<summary>정답</summary>

**CORS.** 실행 칸은 브라우저(다른 출처)에서 보내고, curl은 CORS를 검사하지 않는다. 브라우저 개발자 도구의 **Console**에서 `blocked by CORS policy` 뒤의 이유를 읽고, **Network**에서 `OPTIONS` 요청의 응답 헤더(`Access-Control-Allow-Origin` 등)와 상태 코드를 본다. 서버 로그가 깨끗한 것도 단서다. 본 요청이 서버에 오지도 않았을 수 있다.
</details>

**3.** 브라우저가 preflight(`OPTIONS`)를 먼저 보내는 요청을 모두 고르라. ㉠ `GET /api/posts/1`(헤더 없음) ㉡ `POST /api/posts` + `Content-Type: application/json` ㉢ `DELETE /api/posts/1` ㉣ `GET /api/posts/1` + `Authorization: Bearer tok-lee`

<details>
<summary>정답</summary>

**㉡㉢㉣.** ㉡은 JSON `Content-Type`, ㉢은 `DELETE` 메서드, ㉣은 `Authorization` 헤더 때문이다. ㉠은 단순 요청이라 바로 보낸다(다만 허락 헤더가 없으면 응답을 JS가 못 읽는다).
</details>

**4.** 1-6에서 토큰 인터셉터를 붙인 뒤 실행 칸이 전부 `CORS로 막혔어요`가 됐다. curl 테스트는 모두 통과한다. 원인과 고치는 법은?

<details>
<summary>정답</summary>

인터셉터가 preflight `OPTIONS`까지 토큰을 검사해 막는다. preflight에는 `Authorization`이 없으니 `401`이나 `500`이 되고, 브라우저는 preflight가 `2xx`가 아니면 본 요청을 보내지 않는다. curl은 preflight를 보내지 않으니 통과한다. 인터셉터 맨 앞에서 `CorsUtils.isPreFlightRequest(request)`면 `true`를 돌려 통과시킨다(1-6 채점 R6).
</details>

**5.** "CORS 설정에 허락한 출처만 넣었으니, 다른 사람은 우리 API로 글을 못 쓴다." 맞는가?

<details>
<summary>정답</summary>

**틀리다.** CORS는 브라우저가 지키는 규칙이다. curl이나 다른 서버는 `Origin`을 아무렇게나 쓰거나 아예 안 보낼 수 있고, 예시 ②처럼 그냥 저장된다. 누가 쓸 수 있는지는 인증·인가(F2, 1-6)가 정한다.
</details>

## 더 깊이

- [D11 — 요청 경계: HTTPS, Origin, CORS](../docs/knowledge/D11-web-security-basics.md#31-요청-경계-https-origin-cors) · [CORS preflight 관찰](../docs/knowledge/D11-web-security-basics.md#43-cors-preflight-관찰)
- [D11 — CORS와 CSRF는 어떻게 다른가](../docs/knowledge/D11-web-security-basics.md#q2-cors와-csrf는-어떻게-다른가)
- [S05 — CORS 프리플라이트가 일반 요청과 다른 점은](../docs/knowledge/S05-mvc-request-flow.md#q4-cors-프리플라이트가-일반-요청과-다른-점은) — Spring MVC 안에서 preflight가 처리되는 위치

## 다음

- 실습: [1-1. 요청 받기 — CORS 열기](../scenario/ch1-create-post/1-1-receive-request.md#cors-열기)를 다시 읽고, [1-6. 토큰으로 작성자 정하기](../scenario/ch1-create-post/1-6-token-auth.md)에서 preflight를 통과시킨다.
- 레슨: [G1. 페이징과 정렬](G1-paging-and-sorting.md) — 2장(조회) 전에.
