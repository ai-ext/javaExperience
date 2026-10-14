# 0-2. 어노테이션은 무엇인가 — 떼어 보면 404

## 상황

0-1에서 `@RestController`, `@GetMapping`, `@RequestParam`을 붙였다. `@`로 시작하는 이것들이 **어노테이션**이다. 처음 보면 주문처럼 느껴진다. 하지만 어노테이션 자체는 아무 일도 하지 않는다. **"이건 이런 거야"라고 붙여 두는 이름표**일 뿐이다. 이름표를 읽고 실제로 일하는 것은 Spring이다.

이 단계에서는 `pong`만 돌려주는 가장 작은 API를 만든다. 그다음 이름표를 하나씩 떼어 보면서, Spring이 그 이름표로 무엇을 하고 있었는지 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "서버 상태 확인 화면",
  "summary": "[핑]을 누르면 서버가 pong으로 답한다. 어노테이션을 떼면 같은 버튼이 404를 받는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "서버 상태", "right": "김자바" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "ping", "label": "핑", "variant": "primary" }] },
    { "type": "text", "id": "status", "value": "서버 응답: pong", "emphasis": "title" },
    { "type": "toast", "id": "toast", "value": "서버가 살아 있어요", "tone": "success" }
  ],
  "flows": [
    {
      "name": "어노테이션이 모두 있을 때",
      "steps": [
        { "kind": "user", "text": "[핑]을 누른다", "focus": ["ping"] },
        { "kind": "request", "method": "GET", "path": "/api/start/ping" },
        { "kind": "server", "text": "앱이 뜰 때 Spring이 org.example 아래에서 @RestController가 붙은 PingController를 찾아 객체(빈)로 만들어 두었다" },
        { "kind": "server", "text": "그 클래스의 @GetMapping(\"/api/start/ping\")을 읽어 주소표에 'GET /api/start/ping → PingController.ping()'을 적어 두었다. 요청이 오면 이 표를 보고 ping()을 부른다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: text/plain;charset=UTF-8"], "body": "pong" },
        { "kind": "screen", "text": "'서버 응답: pong'과 알림이 뜬다", "focus": ["status", "toast"] }
      ]
    },
    {
      "name": "@RestController를 떼었을 때",
      "steps": [
        { "kind": "user", "text": "(서버 코드에서 @RestController를 지우고 다시 띄운 뒤) [핑]을 누른다", "focus": ["ping"] },
        { "kind": "request", "method": "GET", "path": "/api/start/ping" },
        { "kind": "server", "text": "이름표가 없으니 Spring이 PingController를 객체로 만들지 않았다. @GetMapping도 읽히지 않아 주소표에 이 경로가 없다" },
        { "kind": "server", "text": "주소표에 없는 경로는 정적 파일(static 폴더)에서 찾는다. 그것도 없으니 404. 기본 로그 수준에서는 아무 줄도 남지 않는다" },
        {
          "kind": "response",
          "status": 404,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"timestamp\": \"2026-10-09T12:59:04.715Z\",\n  \"status\": 404,\n  \"error\": \"Not Found\",\n  \"path\": \"/api/start/ping\"\n}"
        },
        { "kind": "screen", "text": "코드는 그대로인데 '찾을 수 없음'이 뜬다 — 서버는 켜져 있는데 그 주소를 맡은 코드가 없다는 뜻이다", "focus": ["status"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/start/ping` |
| 응답 | 상태 `200`, 본문은 문자열 `pong` |
| 없는 경로 | `GET /api/start/pong`(오타)은 `404` — 따로 만들 것은 없다. Spring 기본 에러 JSON이 어떻게 생겼는지 본다 |

## 따라 치기

`src/main/java/org/example/start/PingController.java`

```java
package org.example.start;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @GetMapping("/api/start/ping")
    public String ping() {
        return "pong";
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 6 | `@RestController` | 클래스에 붙인 이름표다. Spring은 앱이 뜰 때 이걸 보고 ① 이 클래스의 객체를 **하나 만들어 들고 있고**(이 객체를 **빈**이라고 부른다) ② 안의 메서드를 HTTP 요청에 연결하고 ③ 반환값을 **응답 본문 그대로** 쓴다 |
| 9 | `@GetMapping("/api/start/ping")` | 메서드에 붙인 이름표다. "`GET` + 이 경로로 오면 이 메서드를 불러라". 괄호 안의 `"..."`는 어노테이션에 넘기는 값이다 |
| 10 | `public String ping()` | 반환 타입이 `String`이면 그 글자가 그대로 본문이 된다(`text/plain`). 0-1처럼 객체를 돌려주면 JSON이 된다 |

### 어노테이션이 일하는 순서

```text
앱 시작(Main.main)
 └ @SpringBootApplication (Main 클래스에 붙어 있다)
    └ "org.example과 그 아래 패키지를 전부 훑어라"(컴포넌트 스캔)
       └ @RestController 붙은 클래스를 찾는다 → 객체(빈)로 만든다
          └ 그 안의 @GetMapping·@PostMapping을 읽어 주소표를 만든다
요청 GET /api/start/ping
 └ 주소표에서 찾는다 → PingController.ping() 호출 → "pong"
```

### 주석과 무엇이 다른가

- 주석은 컴파일하면 사라지지만 어노테이션은 컴파일된 클래스에 남는다. 그래서 실행 중에 Spring이 읽을 수 있다.
- 주소는 **파일 위치가 아니라 어노테이션**으로 정한다. 파일은 `org.example` 아래 어디에 두든, `@GetMapping`에 적은 경로가 주소가 된다.

### 지금까지 본 어노테이션

| 어노테이션 | 붙는 곳 | 뜻 |
|---|---|---|
| `@SpringBootApplication` | `Main` 클래스 | 자동 설정을 켜고, 이 패키지 아래를 훑는다 |
| `@RestController` | 클래스 | 요청을 받는 객체. 반환값 = 응답 본문 |
| `@GetMapping("경로")` | 메서드 | `GET 경로` 담당 |
| `@RequestParam` | 매개변수 | 쿼리스트링 값을 넣어 준다(0-3) |
| `@Configuration` | 클래스 | 설정용 객체(0-1의 `CorsConfig`) |
| `@Override` | 메서드 | "부모의 메서드를 다시 쓴다". Spring이 아니라 **컴파일러**가 읽는다. 이름이 틀리면 컴파일 에러를 내 준다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 앱이 뜰 때 Spring이 org.example 아래에서 @RestController가 붙은 PingController를 찾아 객체(빈)로 만들어 두었다
- 그 클래스의 @GetMapping("/api/start/ping")을 읽어 주소표에 'GET /api/start/ping → PingController.ping()'을 적어 두었다. 요청이 오면 이 표를 보고 ping()을 부른다
- 이름표가 없으니 Spring이 PingController를 객체로 만들지 않았다. @GetMapping도 읽히지 않아 주소표에 이 경로가 없다
- 주소표에 없는 경로는 정적 파일(static 폴더)에서 찾는다. 그것도 없으니 404. 기본 로그 수준에서는 아무 줄도 남지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`PingController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/start/ping")`. 변경된 메서드: `ping`.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "있는 경로", "method": "GET", "path": "/api/start/ping" },
    { "id": "B", "title": "오타 경로", "method": "GET", "path": "/api/start/pong" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": { "status": 200, "bodyText": { "equals": "pong" } }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 404,
        "json": [
          { "path": "$.status", "equals": 404 },
          { "path": "$.path", "equals": "/api/start/pong" }
        ]
      }
    }
  ]
}
```

C1이 통과한 뒤 아래 [일부러 망가뜨리기](#일부러-망가뜨리기) ①을 해 보면 같은 버튼에서 C1이 `404`로 실패한다. 다시 붙이면 통과한다.

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, 본문이 정확히 `pong` |
| C2 | 요청 B | 상태 `404`, 본문 JSON의 `status`=`404`, `path`=`/api/start/pong` |
| R1 | 컨트롤러 | 클래스에 `@RestController`, 메서드에 `@GetMapping("/api/start/ping")` |
| R2 | 위치 | `org.example` 아래 패키지에 있다 |

## 일부러 망가뜨리기

하나씩 바꾸고 앱을 다시 띄운 뒤 요청 A를 보낸다. 끝나면 원래대로 되돌린다. 메시지는 Boot 4.1.1에서 재현한 원문이다.

### ① `@RestController`를 지운다 → 404, 로그는 조용하다

응답은 위 [화면 시나리오](#화면-시나리오) 두 번째 흐름의 404 JSON과 같다. **Run 창에는 아무 줄도 남지 않는다.** 404는 서버 입장에서 "없는 걸 달라고 했다"일 뿐이라 기본 로그 수준(INFO)에서는 기록하지 않는다.

**404의 원인을 로그로 보려면** — `application.yml`에는 이미 `logging:` → `level:` 묶음이 있다. 그 안의 마지막 줄(`org.hibernate.orm.jdbc.bind: trace`) 밑에 **같은 들여쓰기로** 한 줄을 넣고 다시 띄운다. 다 보면 지운다.

```yaml
logging:
  level:
    # (원래 있던 두 줄 아래에)
    org.springframework.web: debug
```

`logging:`을 파일 맨 아래에 새로 하나 더 쓰면 안 된다. 같은 키가 두 번 나와서 앱이 안 뜬다(`found duplicate key logging`, 0-6). 잘 넣었으면 요청마다 "누가 받았는지"가 찍힌다.

```text
# 고장 났을 때 — 주소표에 없어서 정적 파일 처리기로 갔다
o.s.w.s.handler.SimpleUrlHandlerMapping  : Mapped to ResourceHttpRequestHandler [classpath [META-INF/resources/], classpath [resources/], classpath [static/], classpath [public/], ServletContext [/]]
o.s.w.s.r.ResourceHttpRequestHandler     : Resource not found for path [api/start/ping]
.w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/start/ping for request '/api/start/ping'.]
o.s.web.servlet.DispatcherServlet        : Completed 404 NOT_FOUND

# 정상일 때 — 내 메서드가 받았다
s.w.s.m.m.a.RequestMappingHandlerMapping : Mapped to org.example.start.PingController#ping()
o.s.web.servlet.DispatcherServlet        : Completed 200 OK
```

(실측 로그에서 앞쪽 시각·스레드 칸은 줄였다.)

`Mapped to org.example...`가 보이면 내 코드까지 왔다는 뜻이다. `No static resource`가 보이면 **주소표에 내 메서드가 없다**는 뜻이다. 이때는 어노테이션·경로 오타·패키지 위치를 본다.

### ② `@GetMapping`을 지운다 → 404

클래스는 빈으로 만들어진다. 하지만 메서드에 주소가 없으니 주소표에 들어가지 않는다. 로그는 ①과 같다.

### ③ `@RestController`를 `@Controller`로 바꾼다 → 404

`@Controller`는 "반환한 문자열은 **화면(뷰) 이름**"으로 해석한다. 서버가 HTML 화면을 만들던 시절의 방식이다. debug 로그를 켜면 이렇게 보인다.

```text
s.w.s.m.m.a.RequestMappingHandlerMapping : Mapped to org.example.start.PingController#ping()
o.s.w.servlet.view.InternalResourceView  : View name [pong], model {}
o.s.w.servlet.view.InternalResourceView  : Forwarding to [pong]
.w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/start/pong for request '/api/start/pong'.]
o.s.web.servlet.DispatcherServlet        : Completed 404 NOT_FOUND
```

내 메서드는 불렸다. 그런데 `pong`이라는 화면을 찾으러 갔다가 없어서 404가 났다. `@RestController` = `@Controller` + `@ResponseBody`("반환값을 본문으로")다.

### ④ 클래스를 `org.example` 밖에 둔다 → 404

`src/main/java/start/PingController.java`(패키지 `start`)처럼 `Main`이 있는 `org.example`의 **바깥**으로 옮긴다. 컴포넌트 스캔은 `org.example`과 그 아래만 훑기 때문에 이 클래스를 못 찾는다. 로그는 ①과 같다.

### ⑤ 같은 주소를 두 메서드가 맡는다 → 앱이 안 뜬다

`PingController`의 경로를 0-1과 같은 `"/api/start/hello"`로 바꾼다. 이번에는 요청을 보내기도 전에 **기동이 실패**한다.

```text
Caused by: java.lang.IllegalStateException: Ambiguous mapping. Cannot map 'pingController' method
org.example.start.PingController#ping()
to {GET [/api/start/hello]}: There is already 'greetingController' bean method
org.example.start.GreetingController#hello(String) mapped.
```

`'pingController'`, `'greetingController'`는 Spring이 만든 객체(빈)의 이름이다. 클래스 이름의 첫 글자를 소문자로 바꾼 것이다.

### ⑥ 같은 이름의 클래스를 다른 패키지에 만든다 → 앱이 안 뜬다

레포에는 이미 `org.example.controller.HelloController`가 있다. 0장 코드를 `org.example.start.HelloController`라는 이름으로 만들면 이렇게 된다.

```text
Caused by: org.springframework.context.annotation.ConflictingBeanDefinitionException: Annotation-specified bean name 'helloController' for bean class [org.example.start.HelloController] conflicts with existing, non-compatible bean definition of same name and class [org.example.controller.HelloController]
```

빈 이름이 둘 다 `helloController`가 되어 부딪쳤다. 클래스 이름을 다르게 짓는다. 0장 클래스 이름이 `GreetingController`, `PingController`인 이유다.

## 필요한 지식

- [P03 애노테이션 — 웹 매핑과 입력 위치](../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치) — 자주 쓰는 어노테이션 표
- [P27 애노테이션은 언제·어떻게 동작하나](../../docs/knowledge/P27-annotations-when-how.md) — 이름표를 누가 언제 읽나
- [P12 빈과 IoC 입문](../../docs/knowledge/P12-why-beans-ioc-intro.md) — Spring이 객체를 대신 만들어 들고 있는 이유
- [S05 MVC 요청 흐름](../../docs/knowledge/S05-mvc-request-flow.md) — 요청이 컨트롤러 메서드까지 가는 길(주소표 = 핸들러 매핑)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 0-1과 같은 모양</summary>

0-1의 `GreetingController`에서 매개변수를 빼고 반환 타입을 `String`으로 바꾼 모양이다.
</details>

<details>
<summary>힌트 2 — 404인데 원인을 모르겠다</summary>

[일부러 망가뜨리기](#일부러-망가뜨리기) ①의 debug 로그를 켜고, 요청 한 번에 `Mapped to org.example...`가 찍히는지 본다.
</details>

## 다음 단계

[0-3. 요청의 네 자리](0-3-request-four-places.md) — 클라이언트가 보내는 경로·쿼리·헤더·본문이 서버의 어느 매개변수로 들어가는지 하나의 API로 확인한다.
