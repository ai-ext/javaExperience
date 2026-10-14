# 0-5. 에러 읽기 — 스택트레이스에서 내 코드 찾기

## 상황

500이 나면 IntelliJ의 Run 창에 빨간 글씨가 수십 줄 쏟아진다. 첫 수업에서는 그중 빨간 줄 하나만 보고 AI에게 물었다. 그렇게 하면 같은 에러를 다음에도 혼자 못 읽는다. 하지만 이 긴 로그에서 **사람이 읽어야 할 줄은 보통 세 줄**이다. 나머지는 Spring·Tomcat이 요청을 내 코드까지 전달한 경로라 건너뛰면 된다.

이 단계에서는 회원 별명을 돌려주는 API를 **일부러 버그가 있는 채로** 만든다. 500을 낸 뒤 로그에서 원인 줄을 찾아 IntelliJ에서 그 줄로 이동하고, 고친 다음 다시 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "회원 카드 화면",
  "summary": "회원 번호로 별명을 조회한다. 없는 번호를 넣으면 버그 있는 서버는 500, 고친 서버는 404로 답한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "회원 카드", "right": "김자바" },
    { "type": "field", "id": "member-id", "label": "회원 번호", "value": "3" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "find", "label": "조회", "variant": "primary" }] },
    { "type": "text", "id": "nickname", "value": "KIMJAVA", "emphasis": "title" },
    { "type": "toast", "id": "toast", "value": "잠시 후 다시 시도해 주세요", "tone": "error" },
    { "type": "code", "id": "server-log", "label": "서버 로그(Run 창)", "value": "java.lang.NullPointerException: Cannot invoke \"String.toUpperCase()\" because \"nickname\" is null\n\tat org.example.start.MemberController.find(MemberController.java:20)" }
  ],
  "flows": [
    {
      "name": "있는 번호",
      "steps": [
        { "kind": "user", "text": "회원 번호 1을 넣고 [조회]를 누른다", "focus": ["member-id", "find"] },
        { "kind": "request", "method": "GET", "path": "/api/start/members/1" },
        { "kind": "server", "text": "NICKNAMES.get(1L) → \"kimjava\" → 대문자로 바꿔 돌려준다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\n  \"id\": 1,\n  \"nickname\": \"KIMJAVA\"\n}" },
        { "kind": "screen", "text": "별명 KIMJAVA가 보인다", "focus": ["nickname"] }
      ]
    },
    {
      "name": "없는 번호 — 버그 있는 서버",
      "steps": [
        { "kind": "user", "text": "회원 번호 3을 넣고 [조회]를 누른다", "focus": ["member-id", "find"] },
        { "kind": "request", "method": "GET", "path": "/api/start/members/3" },
        { "kind": "server", "text": "NICKNAMES.get(3L) → 없으니 null. 그 null에 .toUpperCase()를 부르다 NullPointerException" },
        { "kind": "server", "text": "처리하지 못한 예외라 Tomcat이 500으로 답하고, Run 창에 ERROR 줄과 스택트레이스(약 45줄)를 남긴다" },
        { "kind": "response", "status": 500, "headers": ["Content-Type: application/json"], "body": "{\n  \"timestamp\": \"2026-10-09T12:57:27.420Z\",\n  \"status\": 500,\n  \"error\": \"Internal Server Error\",\n  \"path\": \"/api/start/members/3\"\n}" },
        { "kind": "screen", "text": "사용자에게는 '잠시 후 다시 시도'만 보인다. 원인은 응답이 아니라 서버 로그에만 있다", "focus": ["toast", "server-log"] }
      ]
    },
    {
      "name": "없는 번호 — 고친 서버",
      "steps": [
        { "kind": "user", "text": "(null 검사를 넣고 다시 띄운 뒤) 회원 번호 3으로 [조회]", "focus": ["find"] },
        { "kind": "request", "method": "GET", "path": "/api/start/members/3" },
        { "kind": "server", "text": "nickname == null이면 ResponseStatusException(HttpStatus.NOT_FOUND)를 던진다 — 일부러 던진 404라 ERROR 로그도 남지 않는다" },
        { "kind": "response", "status": 404, "headers": ["Content-Type: application/json"], "body": "{\n  \"timestamp\": \"2026-10-09T12:56:27.376Z\",\n  \"status\": 404,\n  \"error\": \"Not Found\",\n  \"path\": \"/api/start/members/3\"\n}" },
        { "kind": "screen", "text": "'없는 회원이에요'를 띄울 수 있다 — 404는 사용자 입력 문제, 500은 서버 코드 문제", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/start/members/{id}` |
| 데이터 | 메모리의 `Map` — `1 → kimjava`, `2 → leespring` |
| 있는 id | 상태 `200`, `{ "id": 1, "nickname": "KIMJAVA" }`(별명은 대문자로) |
| 없는 id | 상태 `404` — **처음에는 일부러 이걸 빼고** 500을 본 뒤에 고친다 |

## 따라 치기

### 1단계 — 버그가 있는 채로 만든다

`src/main/java/org/example/start/MemberController.java`

```java
package org.example.start;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MemberController {

    public record MemberView(Long id, String nickname) {
    }

    private static final Map<Long, String> NICKNAMES = Map.of(1L, "kimjava", 2L, "leespring");

    @GetMapping("/api/start/members/{id}")
    public MemberView find(@PathVariable Long id) {
        String nickname = NICKNAMES.get(id);
        return new MemberView(id, nickname.toUpperCase());
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 15 | `private static final Map<Long, String> NICKNAMES = Map.of(1L, "kimjava", 2L, "leespring");` | `static final`은 클래스에 하나뿐인 상수다. `Map.of(키, 값, 키, 값)`는 바꿀 수 없는 Map이다. `1L`의 `L`은 `Long` 숫자라는 표시다 |
| 18 | `@PathVariable Long id` | 경로의 `{id}` |
| 19 | `String nickname = NICKNAMES.get(id);` | 키가 없으면 `null`이 돌아온다. 예외가 아니다 |
| 20 | `nickname.toUpperCase()` | `null`에 메서드를 부르면 `NullPointerException`(NPE)이 난다. **버그는 여기** |

앱을 다시 띄우고 `GET /api/start/members/1`(200)과 `GET /api/start/members/3`(500)을 보낸다.

### 2단계 — 로그에서 원인 줄을 찾는다

`/members/3`을 보내면 Run 창에 아래가 찍힌다(실측, `./gradlew bootRun`). 원래 로그에는 없는 **`>>` 표시를 볼 줄 앞에 붙였다.** 나머지 줄 앞은 칸을 맞추려고 띄웠다.

```text
>> 2026-10-09T22:06:28.953+09:00 ERROR 50812 --- [javaExperience] [nio-8169-exec-1] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: java.lang.NullPointerException: Cannot invoke "String.toUpperCase()" because "nickname" is null] with root cause

>> java.lang.NullPointerException: Cannot invoke "String.toUpperCase()" because "nickname" is null
>>	at org.example.start.MemberController.find(MemberController.java:20) ~[main/:na]
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103) ~[na:na]
	at java.base/java.lang.reflect.Method.invoke(Method.java:580) ~[na:na]
	at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:252) ~[spring-web-7.0.9.jar:7.0.9]
	at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:184) ~[spring-web-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:117) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:934) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.handleInternal(RequestMappingHandlerAdapter.java:853) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.mvc.method.AbstractHandlerMethodAdapter.handle(AbstractHandlerMethodAdapter.java:86) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:963) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.DispatcherServlet.doService(DispatcherServlet.java:866) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1000) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at org.springframework.web.servlet.FrameworkServlet.doGet(FrameworkServlet.java:892) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at jakarta.servlet.http.HttpServlet.service(HttpServlet.java:622) ~[tomcat-embed-core-11.0.24.jar:6.1]
	at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:874) ~[spring-webmvc-7.0.9.jar:7.0.9]
	at jakarta.servlet.http.HttpServlet.service(HttpServlet.java:710) ~[tomcat-embed-core-11.0.24.jar:6.1]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:132) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.websocket.server.WsFilter.doFilter(WsFilter.java:59) ~[tomcat-embed-websocket-11.0.24.jar:11.0.24]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:111) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.springframework.web.filter.RequestContextFilter.doFilterInternal(RequestContextFilter.java:100) ~[spring-web-7.0.9.jar:7.0.9]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:116) ~[spring-web-7.0.9.jar:7.0.9]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:111) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.springframework.web.filter.FormContentFilter.doFilterInternal(FormContentFilter.java:93) ~[spring-web-7.0.9.jar:7.0.9]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:116) ~[spring-web-7.0.9.jar:7.0.9]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:111) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.springframework.web.filter.CharacterEncodingFilter.doFilterInternal(CharacterEncodingFilter.java:199) ~[spring-web-7.0.9.jar:7.0.9]
	at org.springframework.web.filter.OncePerRequestFilter.doFilter(OncePerRequestFilter.java:116) ~[spring-web-7.0.9.jar:7.0.9]
	at org.apache.catalina.core.ApplicationFilterChain.doFilter(ApplicationFilterChain.java:111) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:165) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.core.StandardContextValve.invoke(StandardContextValve.java:77) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.authenticator.AuthenticatorBase.invoke(AuthenticatorBase.java:535) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.core.StandardHostValve.invoke(StandardHostValve.java:115) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.valves.ErrorReportValve.invoke(ErrorReportValve.java:86) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.core.StandardEngineValve.invoke(StandardEngineValve.java:71) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:347) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:406) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:71) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:1307) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:2036) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:74) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.util.threads.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:949) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.util.threads.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:483) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
	at org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:74) ~[tomcat-embed-core-11.0.24.jar:11.0.24]
```

읽는 순서:

| 순서 | 볼 줄 | 여기서 얻는 것 |
|---|---|---|
| ① | `ERROR ... threw exception [Request processing failed: ...] with root cause` | **언제** 났나 — 요청을 처리하다 났다. `with root cause`는 "바로 아래에 진짜 원인 예외를 찍는다"는 뜻이다 |
| ② | `java.lang.NullPointerException: Cannot invoke "String.toUpperCase()" because "nickname" is null` | **무엇이** 났나 — `예외 이름: 메시지`. Java 14부터 NPE 메시지가 어떤 변수가 null이었는지(`"nickname"`)까지 알려 준다 |
| ③ | 아래로 내려가며 **처음 나오는 `at org.example...`** → `MemberController.find(MemberController.java:20)` | **어디서** 났나 — `패키지.클래스.메서드(파일:줄)`. 여기서는 마침 첫 줄이지만, 첫 줄이 `java.base`나 라이브러리일 때가 많다(아래 [망가뜨리기](#일부러-망가뜨리기) ②) |
| 무시 | `at java.base/jdk.internal.reflect...`, `at org.springframework...`, `at org.apache.catalina...` | Tomcat이 요청을 받아 Spring을 거쳐 내 메서드를 부르기까지의 경로다. 매번 거의 같다 |
| 무시 | `~[main/:na]`, `~[spring-web-7.0.9.jar:7.0.9]` | 그 줄의 코드가 어느 jar(라이브러리 파일)에 있는지 표시한 것. IntelliJ로 띄우면 `~[classes/:na]`처럼 조금 다르게 보일 수 있다 |

**스택트레이스는 위가 최근이다.** 맨 위 `at` 줄이 예외가 실제로 터진 곳이고, 아래로 갈수록 "그걸 부른 곳"이다. 맨 아래 `Thread.run`이 출발점이다.

### 3단계 — IntelliJ에서 그 줄로 간다

- Run 창의 `MemberController.java:20`은 **파란 링크**로 보인다. 클릭하면 그 파일의 20번째 줄이 열린다.
- 링크가 안 보이면 `⌘O`(Windows `Ctrl+N`)로 `MemberController`를 열고, `⌘L`(Windows `Ctrl+G`)로 `20`번 줄로 간다.
- 로그가 너무 길면 Run 창에서 `⌘F`(Windows `Ctrl+F`)로 `org.example`을 검색한다. 첫 번째로 걸린 `at` 줄이 그 줄이다.

### 4단계 — 고친다

"없는 회원"은 서버 고장이 아니라 **요청한 것이 없는** 상황이다. 500이 아니라 404로 답한다.

```java
package org.example.start;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class MemberController {

    public record MemberView(Long id, String nickname) {
    }

    private static final Map<Long, String> NICKNAMES = Map.of(1L, "kimjava", 2L, "leespring");

    @GetMapping("/api/start/members/{id}")
    public MemberView find(@PathVariable Long id) {
        String nickname = NICKNAMES.get(id);
        if (nickname == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 회원: " + id);
        }
        return new MemberView(id, nickname.toUpperCase());
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 5, 9 | `import ...HttpStatus;`, `import ...ResponseStatusException;` | 새로 쓰는 클래스 두 개 |
| 22~24 | `if (nickname == null) { throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 회원: " + id); }` | `throw`는 예외를 **일부러 던진다**. `ResponseStatusException`을 던지면 Spring이 그 상태 코드(404)로 답한다 |

다시 띄우고 `/members/3`을 보내면 `404`가 나온다. Run 창에는 아무 줄도 남지 않는다. 일부러 던진 4xx라서 Spring이 에러로 보지 않는다.

### 500과 4xx는 로그 모양이 다르다

| 상태 | 뜻 | 로그 |
|---|---|---|
| 4xx | 요청이 잘못됐다(없는 것, 빠진 값, 틀린 형식) | Spring이 처리한 것은 `WARN ... Resolved [...]` **한 줄**(0-3). 내가 `ResponseStatusException`으로 던진 것은 **아무것도 없음** |
| 500 | 서버 코드가 처리하지 못한 예외 | `ERROR` 줄 + **스택트레이스 수십 줄** |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- NICKNAMES.get(1L) → "kimjava" → 대문자로 바꿔 돌려준다
- NICKNAMES.get(3L) → 없으니 null. 그 null에 .toUpperCase()를 부르다 NullPointerException
- 처리하지 못한 예외라 Tomcat이 500으로 답하고, Run 창에 ERROR 줄과 스택트레이스(약 45줄)를 남긴다
- nickname == null이면 ResponseStatusException(HttpStatus.NOT_FOUND)를 던진다 — 일부러 던진 404라 ERROR 로그도 남지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`MemberController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/start/members/{id}")`. 변경된 메서드: `find`.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 있는 번호
curl -i "$BASE/api/start/members/1"

# 요청 B — 없는 번호(고치기 전 500, 고친 뒤 404)
curl -i "$BASE/api/start/members/3"
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "있는 번호", "method": "GET", "path": "/api/start/members/1" },
    { "id": "B", "title": "없는 번호", "method": "GET", "path": "/api/start/members/3" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.id", "equals": 1 },
          { "path": "$.nickname", "equals": "KIMJAVA" }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": { "status": 404 }
    }
  ]
}
```

1단계 코드에서 누르면 C2가 `500`으로 실패한다. 4단계까지 고치면 통과한다.

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, `id`=`1`, `nickname`=`KIMJAVA` |
| C2 | 요청 B | 상태 `404`(500이 아니다) |
| R1 | null 처리 | `Map.get` 결과를 쓰기 전에 `null`을 확인한다 |
| R2 | 상태 코드 | 없는 것은 404로 답한다(`ResponseStatusException` 등). 500이나 `200 + 빈 값`으로 넘기지 않는다 |

## 일부러 망가뜨리기

### ① 기동 실패 — `Caused by` 맨 아래를 본다

요청 중 500과 달리, **앱이 뜨다가 실패**하면 예외가 겹겹이 감싸여 `Caused by:`가 여러 번 나온다. 바깥 예외는 "무엇을 하다 실패했나"이고, **맨 아래 `Caused by`가 진짜 원인**이다.

0-6에서 만들 `ConfigController`의 `@Value("${start.greeting}")`를 `@Value("${start.greating}")`(오타)로 바꾸면 이렇게 된다(실측, `./gradlew bootRun`, 경로 앞부분은 `...`로 줄였다).

```text
>> 2026-10-09T22:15:46.523+09:00 ERROR 60373 --- [javaExperience] [           main] o.s.boot.SpringApplication               : Application run failed

>> org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'configController' defined in file [.../build/classes/java/main/org/example/start/ConfigController.class]: Unexpected exception during bean creation
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:538) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:333) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:371) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:331) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:196) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.instantiateSingleton(DefaultListableBeanFactory.java:1225) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingleton(DefaultListableBeanFactory.java:1191) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:1121) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:994) ~[spring-context-7.0.9.jar:7.0.9]
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:621) ~[spring-context-7.0.9.jar:7.0.9]
	at org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:143) ~[spring-boot-web-server-4.1.1.jar:4.1.1]
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:756) ~[spring-boot-4.1.1.jar:4.1.1]
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:445) ~[spring-boot-4.1.1.jar:4.1.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:321) ~[spring-boot-4.1.1.jar:4.1.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1365) ~[spring-boot-4.1.1.jar:4.1.1]
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1354) ~[spring-boot-4.1.1.jar:4.1.1]
	at org.example.Main.main(Main.java:11) ~[main/:na]
>> Caused by: org.springframework.util.PlaceholderResolutionException: Could not resolve placeholder 'start.greating' in value "${start.greating}"
	at org.springframework.util.PlaceholderResolutionException.withValue(PlaceholderResolutionException.java:81) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.util.PlaceholderParser$ParsedValue.resolve(PlaceholderParser.java:296) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.util.PlaceholderParser.replacePlaceholders(PlaceholderParser.java:129) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.util.PropertyPlaceholderHelper.replacePlaceholders(PropertyPlaceholderHelper.java:96) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.core.env.AbstractPropertyResolver.doResolvePlaceholders(AbstractPropertyResolver.java:286) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.core.env.AbstractPropertyResolver.resolveRequiredPlaceholders(AbstractPropertyResolver.java:257) ~[spring-core-7.0.9.jar:7.0.9]
	at org.springframework.context.support.PropertySourcesPlaceholderConfigurer.lambda$processProperties$0(PropertySourcesPlaceholderConfigurer.java:184) ~[spring-context-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractBeanFactory.resolveEmbeddedValue(AbstractBeanFactory.java:959) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.doResolveDependency(DefaultListableBeanFactory.java:1679) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.resolveDependency(DefaultListableBeanFactory.java:1658) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.ConstructorResolver.resolveAutowiredArgument(ConstructorResolver.java:912) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:791) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.ConstructorResolver.autowireConstructor(ConstructorResolver.java:240) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.autowireConstructor(AbstractAutowireCapableBeanFactory.java:1380) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1219) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:565) ~[spring-beans-7.0.9.jar:7.0.9]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:525) ~[spring-beans-7.0.9.jar:7.0.9]
	... 16 common frames omitted


   FAILURE: Build failed with an exception.

   * What went wrong:
   Execution failed for task ':bootRun' (registered by plugin 'org.springframework.boot').
   > Process 'command '.../bin/java'' finished with non-zero exit value 1

   * Try:
   > Run with --stacktrace option to get the stack trace.
   > Run with --info or --debug option to get more log output.
   > Run with --scan to get full insights from a Build Scan (powered by Develocity).
   > Get more help at https://help.gradle.org.

   BUILD FAILED in 2s
```

| 순서 | 볼 줄 | 얻는 것 |
|---|---|---|
| ① | `ERROR ... Application run failed` | 기동 실패다. 요청은 아직 하나도 안 받았다 |
| ② | 그 아래 첫 예외 줄 — `Error creating bean with name 'configController'` | **누구를** 만들다 실패했나 — 내 `ConfigController` |
| ③ | **맨 아래 `Caused by:`** — `Could not resolve placeholder 'start.greating'` | **왜** — 설정 키 `start.greating`이 없다 |
| 주의 | `at org.example.Main.main(Main.java:11)` | 내 패키지 줄이지만 원인이 아니다. 앱의 출발점(`SpringApplication.run`을 부른 곳)일 뿐이다. 기동 실패에서는 내 코드 줄이 아예 없을 때가 많다. 그때는 메시지 속 **내 클래스 이름·설정 키**로 찾아간다 |
| 무시 | `... 16 common frames omitted` | 위 예외와 겹치는 줄을 생략했다는 표시 |
| 무시 | `FAILURE: Build failed with an exception.` ~ `BUILD FAILED` | `bootRun`으로 띄웠을 때 Gradle이 "앱이 비정상 종료했다"고 덧붙인 말이다. 원인은 그 위에 있다 |

### ② 첫 `at` 줄이 내 코드가 아닐 때

1단계 코드의 `find` 메서드를 이렇게 바꾼다. 응답을 Map으로 만드는 흔한 모양이다.

```java
    @GetMapping("/api/start/members/{id}")
    public Map<String, Object> find(@PathVariable Long id) {
        String nickname = NICKNAMES.get(id);
        return Map.of("id", id, "nickname", nickname);
    }
```

`/members/3`의 로그(실측):

```text
java.lang.NullPointerException
	at java.base/java.util.Objects.requireNonNull(Objects.java:233) ~[na:na]
	at java.base/java.util.ImmutableCollections$MapN.<init>(ImmutableCollections.java:1193) ~[na:na]
	at java.base/java.util.Map.of(Map.java:1385) ~[na:na]
	at org.example.start.MemberController.find(MemberController.java:20) ~[main/:na]
```

- 메시지가 없는 NPE다. `Map.of`는 `null` 값을 받지 않아 안에서 터졌다.
- 첫 세 줄은 Java 기본 라이브러리(`java.base`) 안이다. 거기를 고칠 수는 없다. **내려가다 처음 만나는 `org.example`** 줄(`MemberController.java:20`)이 내가 고칠 곳이다. "내가 `Map.of`에 `null`을 넘겼다"고 읽는다.

### ③ 숫자가 아닌 id — 500이 아니라 400

`GET /api/start/members/abc`를 보낸다. 스택트레이스 없이 `WARN` 한 줄만 남는다. 0-3의 ⑤와 같다. 내 메서드가 불리기 전에 Spring이 `Long` 변환에 실패해 400으로 답했기 때문이다.

## 필요한 지식

- [D05 디버깅 방법론](../../docs/knowledge/D05-debugging-methodology.md) — 재현 → 로그 → 가설 → 확인
- [J04 예외](../../docs/knowledge/J04-exceptions.md) — 예외가 던져지고 감싸이는 방식(`Caused by`)
- [W06 서버 디버깅은 왜 다른가](../../docs/knowledge/W06-why-server-debugging.md) — 원인이 응답이 아니라 서버 로그에 있는 이유
- [P15 IntelliJ 실전](../../docs/knowledge/P15-intellij-practical.md) — 파일·줄 이동, Run 창 검색
- [W08 예외는 어디서 처리하나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — 404로 바꿔 던지는 위치

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 로그가 너무 길다</summary>

Run 창에서 `org.example`을 검색한다. 첫 번째로 걸린 `at org.example...(파일:줄)`이 고칠 곳이다. 기동 실패라면 `Caused by`를 검색해 맨 마지막 것을 본다.
</details>

<details>
<summary>힌트 2 — 404로 답하기</summary>

`throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 회원: " + id);` — `org.springframework.web.server.ResponseStatusException`, `org.springframework.http.HttpStatus`를 import한다.
</details>

## 다음 단계

[0-6. Gradle 의존성과 application.yml 읽기](0-6-gradle-and-yml.md) — 라이브러리는 어디서 오고 설정 값은 코드로 어떻게 들어오는지 본다. 위 ①의 기동 실패를 직접 만들어 본다.
