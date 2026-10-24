# 0-3. 요청의 네 자리 — 경로·쿼리·헤더·본문

## 상황

요청 한 통에는 값이 실리는 자리가 네 곳 있다. 경로(`/echo/7`), 쿼리(`?q=spring`), 헤더(`X-Client: javaExperience`), 본문(JSON)이다. 서버는 이 네 자리를 **각각 다른 어노테이션**으로 받는다. 이걸 짝지어 두지 않으면 "`@PathVariable`이 뭐였더라", "`@RequestBody`를 두 개 놓으면 왜 안 되지"에서 계속 막힌다.

이 단계에서는 **받은 것을 그대로 돌려주는 API(echo)**를 만든다. 응답의 키 이름에 `fromPath`처럼 어느 자리에서 왔는지를 적어 두었다. 그래서 버튼을 누르면 내가 보낸 값이 서버의 어느 매개변수로 들어갔는지 바로 보인다. 본문을 `Map`으로 받는 방법과 DTO로 받는 방법도 나란히 비교한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "요청 실험실",
  "summary": "경로·쿼리·헤더·본문 칸을 채워 보내면, 서버가 각 자리에서 받은 값을 이름표를 붙여 그대로 돌려준다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "요청 실험실", "right": "김자바" },
    { "type": "field", "id": "path-id", "label": "경로의 id", "value": "7" },
    { "type": "field", "id": "query-q", "label": "쿼리 q", "value": "spring" },
    { "type": "field", "id": "header-client", "label": "헤더 X-Client", "value": "javaExperience" },
    { "type": "field", "id": "body", "label": "본문(JSON)", "value": "{\"title\": \"첫 요청\", \"tags\": [\"java\", \"spring\"], \"extra\": \"덤\"}", "multiline": true },
    { "type": "actions", "id": "buttons", "items": [{ "id": "send-map", "label": "Map으로 받기", "variant": "primary" }, { "id": "send-dto", "label": "DTO로 받기", "variant": "secondary" }] },
    { "type": "code", "id": "result", "label": "서버가 받은 것", "value": "fromPath   ← @PathVariable\nfromQuery  ← @RequestParam\nfromHeader ← @RequestHeader\nfromBody   ← @RequestBody" }
  ],
  "flows": [
    {
      "name": "Map으로 받기",
      "steps": [
        { "kind": "user", "text": "네 칸을 채우고 [Map으로 받기]를 누른다", "focus": ["path-id", "query-q", "header-client", "body", "send-map"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/echo/7?q=spring",
          "headers": ["Content-Type: application/json", "X-Client: javaExperience"],
          "body": "{\n  \"title\": \"첫 요청\",\n  \"tags\": [\"java\", \"spring\"],\n  \"extra\": \"덤\"\n}"
        },
        { "kind": "server", "text": "경로의 7 → @PathVariable Long id, 쿼리 q=spring → @RequestParam String q, 헤더 X-Client → @RequestHeader(\"X-Client\") String client" },
        { "kind": "server", "text": "본문 JSON 전체 → @RequestBody Map<String, Object> body. 키가 무엇이든 들어온 그대로 담긴다(extra도)" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"fromPath\": 7,\n  \"fromQuery\": \"spring\",\n  \"fromHeader\": \"javaExperience\",\n  \"fromBody\": {\n    \"title\": \"첫 요청\",\n    \"tags\": [\"java\", \"spring\"],\n    \"extra\": \"덤\"\n  }\n}"
        },
        { "kind": "screen", "text": "각 값이 어느 자리에서 왔는지 이름표와 함께 보인다", "focus": ["result"] }
      ]
    },
    {
      "name": "DTO로 받기",
      "steps": [
        { "kind": "user", "text": "같은 값으로 [DTO로 받기]를 누른다", "focus": ["send-dto"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/echo/7/dto?q=spring",
          "headers": ["Content-Type: application/json", "X-Client: javaExperience"],
          "body": "{\n  \"title\": \"첫 요청\",\n  \"tags\": [\"java\", \"spring\"],\n  \"extra\": \"덤\"\n}"
        },
        { "kind": "server", "text": "본문 → @RequestBody EchoBody body. record EchoBody(String title, List<String> tags)에 있는 필드만 채우고 모르는 extra는 버린다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"fromPath\": 7,\n  \"fromQuery\": \"spring\",\n  \"fromHeader\": \"javaExperience\",\n  \"fromBody\": {\n    \"title\": \"첫 요청\",\n    \"tags\": [\"java\", \"spring\"]\n  }\n}"
        },
        { "kind": "screen", "text": "fromBody에 extra가 없다 — DTO는 정한 모양만 받는다", "focus": ["result"] }
      ]
    },
    {
      "name": "쿼리 q를 빠뜨렸을 때",
      "steps": [
        { "kind": "user", "text": "쿼리 칸을 비우고 보낸다", "focus": ["query-q", "send-map"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/echo/7",
          "headers": ["Content-Type: application/json", "X-Client: javaExperience"],
          "body": "{\"title\": \"첫 요청\"}"
        },
        { "kind": "server", "text": "@RequestParam은 기본이 필수다. 컨트롤러 메서드에 들어가기 전에 Spring이 막는다 — 로그: Required request parameter 'q' ... is not present" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/json"] },
        { "kind": "screen", "text": "400 — 요청을 고쳐서 다시 보내야 한다", "focus": ["result"] }
      ]
    },
    {
      "name": "본문 형식을 안 알렸을 때(Content-Type)",
      "steps": [
        { "kind": "user", "text": "(클라이언트 실수) Content-Type을 text/plain으로 보낸다", "focus": ["body", "send-map"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/echo/7?q=spring",
          "headers": ["Content-Type: text/plain", "X-Client: javaExperience"],
          "body": "{\"title\": \"첫 요청\"}"
        },
        { "kind": "server", "text": "JSON 변환기는 application/json 본문만 읽는다. 글자는 JSON처럼 생겼어도 형식표가 text/plain이라 읽지 않는다 — 로그: Content-Type 'text/plain;charset=UTF-8' is not supported" },
        { "kind": "response", "status": 415, "headers": ["Accept: application/json, application/*+json"] },
        { "kind": "screen", "text": "415 Unsupported Media Type — 응답 헤더 Accept가 '이 형식으로 보내라'를 알려 준다", "focus": ["result"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 1 | `POST /api/start/echo/{id}` — 본문을 `Map<String, Object>`로 받는다 |
| 메서드·경로 2 | `POST /api/start/echo/{id}/dto` — 본문을 DTO(`record EchoBody(String title, List<String> tags)`)로 받는다 |
| 경로 `{id}` | 숫자 → 응답 `fromPath` |
| 쿼리 `q` | 필수 → 응답 `fromQuery` |
| 헤더 `X-Client` | 필수 → 응답 `fromHeader` |
| 본문 | JSON(`Content-Type: application/json`) → 응답 `fromBody` |
| 응답 | 상태 `200`, `{ "fromPath", "fromQuery", "fromHeader", "fromBody" }` |
| CORS | `X-Client` 헤더를 허락해야 버튼이 동작한다 — 0-1의 `CorsConfig`에 이미 들어 있다 |

## 따라 치기

`src/main/java/org/example/start/EchoController.java`

```java
package org.example.start;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EchoController {

    // 본문 DTO — JSON의 title·tags만 받는다(모르는 필드는 버린다)
    public record EchoBody(String title, List<String> tags) {
    }

    // 응답 — 어느 자리에서 온 값인지 이름에 적었다
    public record EchoResponse(Long fromPath, String fromQuery, String fromHeader, Object fromBody) {
    }

    // 본문을 Map으로 — 들어온 JSON을 키·값 그대로 받는다
    @PostMapping("/api/start/echo/{id}")
    public EchoResponse echo(@PathVariable Long id,
                             @RequestParam String q,
                             @RequestHeader("X-Client") String client,
                             @RequestBody Map<String, Object> body) {
        return new EchoResponse(id, q, client, body);
    }

    // 본문을 DTO로 — 정한 필드만 받는다
    @PostMapping("/api/start/echo/{id}/dto")
    public EchoResponse echoDto(@PathVariable Long id,
                                @RequestParam String q,
                                @RequestHeader("X-Client") String client,
                                @RequestBody EchoBody body) {
        return new EchoResponse(id, q, client, body);
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 3~4 | `import java.util.List;` | `List`·`Map`은 Java 기본 라이브러리(`java.util`)에 있다 |
| 17 | `public record EchoBody(String title, List<String> tags)` | 본문 DTO. `List<String>`은 "문자열 목록"이다. `<>` 안은 목록에 든 타입이다. 클래스 안의 record라 바깥에서는 `EchoController.EchoBody`로 부른다 |
| 21 | `Object fromBody` | `Object`는 "아무 객체나"다. Map이든 DTO든 담으려고 이렇게 했다. 보통 API에서는 쓰지 않는다 |
| 25 | `@PostMapping("/api/start/echo/{id}")` | `{id}`는 경로 안의 **변수 자리**다 |
| 26 | `@PathVariable Long id` | `{id}` 자리의 글자를 `Long`(큰 정수)으로 바꿔 넣는다. 매개변수 이름 `id`와 `{id}`가 같아야 한다 |
| 27 | `@RequestParam String q` | `?q=...`. 이름이 같으면 `@RequestParam("q")`의 `"q"`를 생략할 수 있다 |
| 28 | `@RequestHeader("X-Client") String client` | 요청 헤더 `X-Client`의 값. 헤더 이름에 `-`가 있어 Java 변수 이름으로 못 쓰니 괄호 안에 적는다 |
| 29 | `@RequestBody Map<String, Object> body` | 본문 JSON 전체를 Map으로 받는다. `Map<String, Object>`는 "키는 문자열, 값은 아무거나"다 |
| 30 | `return new EchoResponse(id, q, client, body);` | 받은 네 가지를 그대로 담아 돌려준다 |
| 38 | `@RequestBody EchoBody body` | 같은 본문을 DTO로 받는다. `title`·`tags`만 채워지고, 모르는 키 `extra`는 버린다 |

### 요청 글과 한 줄씩 맞춰 보기

아래 [직접 확인](#직접-확인)의 요청 A가 서버에 도착한 모양이다. HTTP 클라이언트가 자동으로 붙이는 `Host`·`User-Agent` 같은 머리글은 빼고 주요 줄만 옮겼다.

```text
POST /api/start/echo/7?q=spring       ← @PostMapping · ① 경로의 7 · ② 쿼리 q
Content-Type: application/json        ← "본문은 JSON이에요" — 없거나 다르면 415
X-Client: javaExperience              ← ③ 헤더 → @RequestHeader("X-Client")

{"title":"첫 요청","tags":["java","spring"],"extra":"덤"}   ← ④ 본문 → @RequestBody
```

| 자리 | HTTP 요청에서 | Spring에서 | 없으면 |
|---|---|---|---|
| ① 경로 | URL 안 `/echo/7` | `@PathVariable Long id` + 경로의 `{id}` | 다른 주소라 404 |
| ② 쿼리 | `?q=spring` | `@RequestParam String q` | 400(필수일 때) |
| ③ 헤더 | `-H 'X-Client: javaExperience'` | `@RequestHeader("X-Client") String client` | 400(필수일 때) |
| ④ 본문 | `-d '{...}'` + `-H 'Content-Type: application/json'` | `@RequestBody 타입 이름` — **하나만** | 400(본문 없음), 415(형식 다름) |

### 본문은 왜 `@RequestBody` 하나뿐인가

경로·쿼리·헤더는 요청 맨 앞(주소·머리글)에 있어서 몇 번이든 꺼내 읽을 수 있다. **본문은 요청 끝에 붙은 한 덩어리 흐름(스트림)이다.** 서버는 그것을 처음부터 끝까지 **한 번** 읽는다. 첫 번째 `@RequestBody`가 다 읽고 나면 두 번째 `@RequestBody`가 읽을 것이 남아 있지 않다. 그래서 400이 난다(아래 [망가뜨리기](#일부러-망가뜨리기) ①).

본문에서 여러 값을 받고 싶으면 **그 값들을 다 담는 객체 하나**를 만든다.

### Map으로 받기 vs DTO로 받기

| | `Map<String, Object>` | DTO(`record EchoBody`) |
|---|---|---|
| 모르는 키(`extra`) | 그대로 담긴다 | 버려진다 |
| 값 꺼내기 | `body.get("title")` → `Object`라 `(String)`으로 바꿔야 한다. 오타 `body.get("titel")`도 컴파일된다(결과는 `null`) | `body.title()` → 이미 `String`. 오타는 컴파일 에러 |
| 타입이 틀린 값(`"tags": 3`) | 그대로 담긴다 | 400(변환 실패) |
| 어디에 쓰나 | 이 echo처럼 "뭐가 오는지 그대로 보기" | **보통의 API 전부** — 받을 모양을 코드로 못 박는다 |

실무 API에서는 DTO로 받는다. 1-1의 채점 기준에도 "Map이 아니라 전용 클래스로 받는다"가 있다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 경로의 7 → @PathVariable Long id, 쿼리 q=spring → @RequestParam String q, 헤더 X-Client → @RequestHeader("X-Client") String client
- 본문 JSON 전체 → @RequestBody Map<String, Object> body. 키가 무엇이든 들어온 그대로 담긴다(extra도)
- 본문 → @RequestBody EchoBody body. record EchoBody(String title, List<String> tags)에 있는 필드만 채우고 모르는 extra는 버린다
- @RequestParam은 기본이 필수다. 컨트롤러 메서드에 들어가기 전에 Spring이 막는다 — 로그: Required request parameter 'q' ... is not present

<details>
<summary>Controller — HTTP 연결</summary>

`EchoController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/start/echo/{id}")`, `@PostMapping("/api/start/echo/{id}/dto")`. 변경된 메서드: `echo`, `echoDto`.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "Map으로 받기",
      "method": "POST",
      "path": "/api/start/echo/7?q=spring",
      "headers": { "X-Client": "javaExperience" },
      "body": { "title": "첫 요청", "tags": ["java", "spring"], "extra": "덤" }
    },
    {
      "id": "B",
      "title": "DTO로 받기",
      "method": "POST",
      "path": "/api/start/echo/7/dto?q=spring",
      "headers": { "X-Client": "javaExperience" },
      "body": { "title": "첫 요청", "tags": ["java", "spring"], "extra": "덤" }
    },
    {
      "id": "C",
      "title": "쿼리 q 없이",
      "method": "POST",
      "path": "/api/start/echo/7",
      "headers": { "X-Client": "javaExperience" },
      "body": { "title": "첫 요청" }
    },
    {
      "id": "D",
      "title": "본문 형식 text/plain",
      "method": "POST",
      "path": "/api/start/echo/7?q=spring",
      "headers": { "Content-Type": "text/plain", "X-Client": "javaExperience" },
      "body": "{\"title\":\"첫 요청\"}"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.fromPath", "equals": 7 },
          { "path": "$.fromQuery", "equals": "spring" },
          { "path": "$.fromHeader", "equals": "javaExperience" },
          { "path": "$.fromBody", "equals": { "title": "첫 요청", "tags": ["java", "spring"], "extra": "덤" } }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.fromPath", "equals": 7 },
          { "path": "$.fromBody.title", "equals": "첫 요청" },
          { "path": "$.fromBody.tags", "equals": ["java", "spring"] },
          { "path": "$.fromBody.extra", "exists": false }
        ]
      }
    },
    { "id": "C3", "request": "C", "expect": { "status": 400 } },
    { "id": "C4", "request": "D", "expect": { "status": 415 } }
  ]
}
```

버튼은 브라우저가 보내므로, 개발자 도구(F12) → Network 탭에 요청 A 앞의 `OPTIONS` 줄이 하나 더 보인다. `X-Client` 같은 직접 만든 헤더를 붙이면 브라우저가 먼저 "이 헤더를 보내도 되나"를 묻는다(preflight, 1-1).

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, `fromPath`=`7`(숫자), `fromQuery`=`spring`, `fromHeader`=`javaExperience`, `fromBody`가 보낸 JSON과 같다(`extra` 포함) |
| C2 | 요청 B | 상태 `200`, `fromPath`=`7`, `fromBody`의 `title`·`tags`가 보낸 값과 같고 `extra`는 없다 |
| C3 | 요청 C | 상태 `400` |
| C4 | 요청 D | 상태 `415` |
| R1 | 매개변수 | 네 자리를 각각 `@PathVariable`·`@RequestParam`·`@RequestHeader`·`@RequestBody`로 받는다. `@RequestBody`는 메서드마다 하나 |
| R2 | DTO | 본문 DTO가 `record`(또는 static 클래스)다 |

## 일부러 망가뜨리기

하나씩 바꾸고 다시 띄운 뒤 요청을 보낸다. 끝나면 되돌린다. 아래는 모두 Boot 4.1.1에서 재현한 원문이다. 4xx 에러는 앱 로그에 **`WARN` 한 줄**(`Resolved [...]`)만 남는다. 스택트레이스가 없으니 이 한 줄을 읽으면 된다.

### ① `@RequestBody`를 두 개 둔다 → 400

`echoDto`의 매개변수 끝에 `@RequestBody Map<String, Object> raw`를 하나 더 붙이고 요청 B를 보낸다.

```text
WARN ... .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.http.converter.HttpMessageNotReadableException: Required request body is missing: public org.example.start.EchoController$EchoResponse org.example.start.EchoController.echoDto(java.lang.Long,java.lang.String,java.lang.String,org.example.start.EchoController$EchoBody,java.util.Map<java.lang.String, java.lang.Object>)]
```

- 읽는 법: 본문을 보냈는데 `Required request body is missing`(본문이 없다)가 나온다. 첫 번째가 본문을 다 읽어 버려서 두 번째에게는 빈 흐름만 남았다. 뒤에 붙은 것은 문제가 난 메서드의 전체 모양이다. `EchoController$EchoBody`의 `$`는 "`EchoController` 안의 `EchoBody`"라는 뜻이다.
- 고치기: `@RequestBody`는 하나만 둔다. 여러 값이 필요하면 DTO 하나에 필드로 담는다.

### ② Content-Type을 빼고 보낸다 → 415

Postman에서 `Content-Type: application/json`을 지정하지 않고 폼 본문을 선택하면 `application/x-www-form-urlencoded`(HTML 폼 형식)로 보낼 수 있다.

```text
WARN ... .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.HttpMediaTypeNotSupportedException: Content-Type 'application/x-www-form-urlencoded;charset=UTF-8' is not supported]
```

브라우저에서 본문을 문자열로만 보내고 `Content-Type`을 적지 않으면 브라우저가 `text/plain;charset=UTF-8`을 붙인다. 그때는 `Content-Type 'text/plain;charset=UTF-8' is not supported`(요청 D와 같다)가 나온다. 응답 헤더 `Accept: application/json, application/*+json`이 서버가 받는 형식이다.

### ③ 쿼리 `q`를 빼고 보낸다 → 400 (요청 C)

```text
WARN ... Resolved [org.springframework.web.bind.MissingServletRequestParameterException: Required request parameter 'q' for method parameter type String is not present]
```

### ④ 헤더 `X-Client`를 빼고 보낸다 → 400

```text
WARN ... Resolved [org.springframework.web.bind.MissingRequestHeaderException: Required request header 'X-Client' for method parameter type String is not present]
```

없어도 되는 값이면 `@RequestParam(required = false)`, `@RequestHeader(value = "X-Client", required = false)`로 쓴다. 그러면 값이 없을 때 `null`이 들어온다.

### ⑤ 경로에 숫자 대신 글자 → 400

`POST /api/start/echo/abc?q=spring`

```text
WARN ... Resolved [org.springframework.web.method.annotation.MethodArgumentTypeMismatchException: Method parameter 'id': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: "abc"]
```

경로·쿼리·헤더는 원래 **전부 글자**다. `Long`·`int`로 선언하면 Spring이 대신 바꿔 준다. 바꿀 수 없는 글자가 오면 메서드에 들어가기 전에 400이 난다.

### ⑥ 닫는 괄호가 없는 JSON → 400

본문을 `{"title": "깨짐"`으로 보낸다.

```text
WARN ... Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Unexpected end-of-input: expected close marker for Object (start marker at [Source: REDACTED (`StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION` disabled); byte offset: #UNKNOWN])]
```

`Source: REDACTED`는 Jackson 3가 보안상 본문 내용을 로그에 싣지 않는다는 표시다. 무엇을 보냈는지는 실행 패널의 요청 본문에서 확인한다.

### ⑦ CORS 설정에서 `X-Client`를 뺀다 → 브라우저 요청은 실패

`CorsConfig`의 `.allowedHeaders(...)`에서 `"X-Client"`를 지우고 다시 띄운다. 실행 패널의 브라우저 요청은 "CORS로 막혔어요"로 실패한다. preflight 헤더는 브라우저가 관리하므로 아래 Postman 절차로 OPTIONS 응답을 직접 살펴본다.

<details>
<summary>Postman 설정 · OPTIONS preflight</summary>

- URL: 상단 API 서버 주소 + `/api/start/echo/7?q=spring`
- Method: `OPTIONS`
- Headers: `Origin: http://localhost:3000`, `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: content-type,x-client`
- Postman에서는 CORS 검사를 하지 않으므로 서버가 돌려준 헤더를 직접 비교한다.

</details>

```text
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: content-type
```

(실측은 `Origin: http://localhost:3020`으로 했다. 출처 값만 다르다.) `x-client`를 허락해 달라고 물었는데 `Allow-Headers`에 `content-type`만 돌아왔다. 그래서 브라우저가 본 요청을 보내지 않는다. 서버 로그에는 아무것도 남지 않는다. 막은 쪽이 서버가 아니라 브라우저이기 때문이다.

## 필요한 지식

- [P03 애노테이션 — 웹 매핑과 입력 위치](../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치) — `@PathVariable`·`@RequestParam`·`@RequestHeader`·`@RequestBody`
- [P16 JSON·Jackson — `@RequestBody`가 동작하는 지점](../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점) — 본문이 객체가 되는 순서와 400·415
- [W13 프론트와 백엔드의 경계](../../docs/knowledge/W13-frontend-backend-boundary.md) — 화면이 보내는 것과 서버가 받는 것
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — Map 대신 DTO로 받는 이유
- [D11 웹 보안 기초 — Origin과 CORS](../../docs/knowledge/D11-web-security-basics.md#31-요청-경계-https-origin-cors) — preflight와 허락 헤더

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 응답 모양</summary>

응답 record는 `record EchoResponse(Long fromPath, String fromQuery, String fromHeader, Object fromBody)`. `fromBody`를 `Object`로 두면 Map과 DTO를 둘 다 담을 수 있다.
</details>

<details>
<summary>힌트 2 — 경로 변수</summary>

`@PostMapping("/api/start/echo/{id}")`의 `{id}`와 `@PathVariable Long id`의 이름이 같아야 한다. 이름이 다르면 `@PathVariable("id") Long postId`처럼 괄호 안에 적는다.
</details>

<details>
<summary>힌트 3 — 버튼 요청은 CORS에서 막힌다</summary>

`CorsConfig`의 `allowedHeaders`에 `"X-Client"`가 있는지, 바꾼 뒤 앱을 다시 띄웠는지 본다. Postman에서 OPTIONS 요청의 `Access-Control-Allow-Headers`에도 `x-client`가 있는지 확인한다.
</details>

## 다음 단계

[0-4. DTO 만들기](0-4-dto-rules.md) — DTO를 클래스 안에 만들 때 생기는 실제 에러(static이 아닐 때, getter가 없을 때)를 고장 내고 고친다.
