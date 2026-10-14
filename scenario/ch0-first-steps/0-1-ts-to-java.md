# 0-1. Java로 첫 API — 타입·변수·클래스·생성자·record

## 상황

A0에서는 코드를 "이렇게 쓴다"로만 따라 쳤다. 이제 그 코드를 Java 문법으로 읽는다. 처음 막히는 곳은 거의 다 **문법 순서**와 **생성자**다. Java는 변수·매개변수를 늘 `타입 이름` 순서로 쓴다(`String name`).

이 단계에서는 이름을 받아 인사말을 돌려주는 API 하나를 만든다. 코드는 짧지만 Java의 기본 문법이 거의 다 들어 있다. 타입과 변수, 클래스, 생성자, `record`, `import`, 세미콜론이다. 완성 코드를 그대로 따라 치고, 줄마다 무슨 뜻인지 읽는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "인사 받기 화면",
  "summary": "이름을 넣고 버튼을 누르면 서버가 인사말을 JSON으로 돌려준다. 쿼리의 name이 매개변수로 들어가고, record가 JSON 응답이 되는 길을 본다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "백엔드 첫걸음", "right": "김자바" },
    { "type": "field", "id": "name", "label": "이름", "value": "김자바" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "send", "label": "인사 받기", "variant": "primary" }] },
    { "type": "text", "id": "message", "value": "김자바님, 반가워요", "emphasis": "title" },
    { "type": "text", "id": "length", "value": "이름 글자 수: 3", "emphasis": "caption", "tone": "muted" }
  ],
  "flows": [
    {
      "name": "이름을 넣고 보내기",
      "steps": [
        { "kind": "user", "text": "이름 칸에 '김자바'를 넣고 [인사 받기]를 누른다", "focus": ["name", "send"] },
        { "kind": "request", "method": "GET", "path": "/api/start/hello?name=김자바" },
        { "kind": "server", "text": "GreetingController.hello가 쿼리의 name을 String name 매개변수로 받는다 — @RequestParam" },
        { "kind": "server", "text": "인사말(String)과 글자 수(int)를 만들어 new Greeting(name, message, nameLength)로 응답 객체를 만든다" },
        { "kind": "server", "text": "Spring이 Greeting record를 JSON으로 바꾼다 — 구성 요소 이름이 그대로 JSON 키가 된다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"김자바\",\n  \"message\": \"김자바님, 반가워요\",\n  \"nameLength\": 3\n}"
        },
        { "kind": "screen", "text": "화면은 응답의 message를 제목으로, nameLength를 작은 글씨로 그린다", "focus": ["message", "length"] }
      ]
    },
    {
      "name": "이름을 비우고 보내기",
      "steps": [
        { "kind": "user", "text": "이름 칸을 비우고 [인사 받기]를 누른다 — 화면이 name 쿼리를 아예 붙이지 않는다", "focus": ["name", "send"] },
        { "kind": "request", "method": "GET", "path": "/api/start/hello" },
        { "kind": "server", "text": "name이 없으니 @RequestParam(defaultValue = \"익명\")의 기본값 '익명'이 들어간다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"익명\",\n  \"message\": \"익명님, 반가워요\",\n  \"nameLength\": 2\n}"
        },
        { "kind": "screen", "text": "'익명님, 반가워요'가 보인다", "focus": ["message"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/start/hello` |
| 쿼리 | `name` — 없으면 `익명` |
| 응답 | 상태 `200`, `Content-Type: application/json`, 아래 JSON |
| 패키지 | `org.example.start` — 0장 코드는 모두 여기에 둔다 |
| 준비 | DB 띄우기, CORS 설정 파일 하나 — 아래 [준비](#준비) |

응답 본문(`?name=김자바`일 때):

```json
{ "name": "김자바", "message": "김자바님, 반가워요", "nameLength": 3 }
```

| 필드 | 타입 | 뜻 |
|---|---|---|
| `name` | 문자열 | 받은 이름 그대로 |
| `message` | 문자열 | `이름 + "님, 반가워요"` |
| `nameLength` | 숫자 | 이름의 글자 수 |

### 준비

**① DB가 떠 있는지 본다.** 실습 레포에는 DB를 쓰는 라이브러리(JPA)가 이미 들어 있다. 그래서 0장처럼 DB를 안 쓰는 코드만 있어도, DB가 꺼져 있으면 앱이 아예 뜨지 않는다. 실습 DB는 javaExperience MySQL(`localhost:13308`) 안에 있다([시작하기](../../README.md)에서 `application.yml`을 이 DB로 맞췄다). javaExperience DB 컨테이너가 떠 있으면 된다.

```bash
docker compose ps mysql   # STATUS가 Up … (healthy)면 준비 끝
```

이걸 빼먹고 `Main`을 실행하면 로그 맨 아래에 이런 줄이 나오고 앱이 꺼진다(실측, Boot 4.1.1). 왜 그런지는 0-6에서 본다.

```text
Caused by: org.hibernate.HibernateException: Unable to determine Dialect without JDBC metadata (please set 'jakarta.persistence.jdbc.url' for common cases or 'hibernate.dialect' when a custom Dialect implementation must be provided)
```

그보다 위쪽 `WARN` 줄에는 `Communications link failure`, `Caused by: java.net.ConnectException: Connection refused`가 보인다. "DB에 연결하지 못했다"는 뜻이다.

**② CORS 설정을 넣는다.** 이 페이지 아래쪽의 실행 칸(버튼)은 **브라우저가** 내 서버로 요청을 보낸다. 브라우저 화면과 내 서버는 출처(포트)가 다르다. 그래서 서버가 허락해 주지 않으면 브라우저가 응답을 막는다. 아래 파일을 그대로 붙여 넣는다. 어떻게 동작하는지는 1-1의 [CORS 열기](../ch1-create-post/1-1-receive-request.md#cors-열기)에서 자세히 본다. 0-3에서 쓸 `X-Client` 헤더도 미리 허락해 둔다. 1-1에 갔을 때 이 파일이 있으면 그대로 둔다.

`src/main/java/org/example/config/CorsConfig.java`

```java
package org.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 브라우저 화면가 다른 출처인 이 서버의 응답을 읽도록 허락한다. 자세한 이유는 1-1
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Client")
                .exposedHeaders("Location", "WWW-Authenticate");
    }
}
```

## 따라 치기

`org.example` 아래에 `start` 패키지를 만든다. IntelliJ에서 `org.example` 폴더를 오른쪽 클릭하고 New → Package → `start`를 고른다. 그 안에 파일 두 개를 만든다.

### 파일 1 — 응답 모양 `Greeting.java`

`src/main/java/org/example/start/Greeting.java`

```java
package org.example.start;

// 응답 JSON의 모양. 구성 요소 이름(name·message·nameLength)이 그대로 JSON 키가 된다
public record Greeting(String name, String message, int nameLength) {
}
```

| 줄 | 코드 | 처음 보는 사람용 설명 |
|---|---|---|
| 1 | `package org.example.start;` | 이 파일이 사는 폴더 이름. 폴더 `org/example/start` ↔ 패키지 `org.example.start`. 다르면 컴파일 에러가 난다 |
| 3 | `// ...` | 한 줄 주석. `/* */`도 된다 |
| 4 | `public record Greeting(...)` | **record**는 "값을 담기만 하는 클래스"를 한 줄로 만드는 문법이다(Java 16+). 괄호 안이 **구성 요소**다 |
| 4 | `String name` | **타입이 먼저, 이름이 뒤.** `String`은 대문자로 시작하는 클래스다 |
| 4 | `int nameLength` | `int`는 정수(소수점 없음). 소문자로 시작하는 **기본 타입**이다 |
| 4~5 | `{ }` | record 본문. 지금은 비어 있다 |
| — | 파일 이름 | `public` 클래스·record 이름과 파일 이름이 같아야 한다(`Greeting` ↔ `Greeting.java`) |

`record Greeting(String name, String message, int nameLength)` 한 줄로 Java가 아래를 **저절로** 만든다.

- 필드 세 개: `private final String name;` 등. `final`은 "한 번 넣으면 못 바꾼다"는 뜻이다.
- **생성자** 하나: `new Greeting("김자바", "...", 3)`로 객체를 만들 때 불리는 특별한 메서드다. 필드에 값을 채운다.
- 꺼내는 메서드: `name()`, `message()`, `nameLength()`. 이름 앞에 `get`이 붙지 않는다.
- `equals`·`hashCode`·`toString`.

같은 것을 **보통 클래스**로 쓰면 이렇다. 생성자를 직접 쓰는 연습용이다. 만들지 않아도 된다.

```java
public class Greeting {
    private final String name;        // 필드: 타입 이름;
    private final String message;
    private final int nameLength;

    // 생성자 — 클래스와 이름이 같고, 반환 타입을 쓰지 않는다
    public Greeting(String name, String message, int nameLength) {
        this.name = name;             // this.name = 이 객체의 필드, name = 매개변수
        this.message = message;
        this.nameLength = nameLength;
    }

    // getter — Jackson(JSON 변환기)은 getXxx()를 보고 JSON 키 xxx를 만든다
    public String getName() { return name; }
    public String getMessage() { return message; }
    public int getNameLength() { return nameLength; }
}
```

Java는 **클래스 이름**을 생성자 이름으로 쓴다. 생성자에는 반환 타입을 쓰지 않는다(`void`도 안 쓴다).

### 파일 2 — 요청을 받는 `GreetingController.java`

`src/main/java/org/example/start/GreetingController.java`

```java
package org.example.start;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {

    @GetMapping("/api/start/hello")
    public Greeting hello(@RequestParam(defaultValue = "익명") String name) {
        String message = name + "님, 반가워요";
        int nameLength = name.length();
        return new Greeting(name, message, nameLength);
    }
}
```

| 줄 | 코드 | 처음 보는 사람용 설명 |
|---|---|---|
| 3~5 | `import org.springframework...GetMapping;` | 다른 패키지의 클래스를 이 파일에서 쓰겠다는 선언. **패키지 전체 이름.클래스 이름** 순서다. IntelliJ에서 빨간 글자에 `Alt+Enter`(맥 `⌥↩`)를 누르면 자동으로 넣어 준다 |
| 7 | `@RestController` | **어노테이션**. Spring에게 "이 클래스는 HTTP 요청을 받는 곳이고, 반환값을 그대로 응답 본문으로 쓴다"고 알려 주는 표시다. 0-2에서 떼어 본다 |
| 8 | `public class GreetingController {` | 클래스 선언. `public`은 "다른 패키지에서도 보인다" |
| 10 | `@GetMapping("/api/start/hello")` | 이 메서드가 `GET /api/start/hello`를 맡는다 |
| 11 | `public Greeting hello(...)` | **반환 타입 `Greeting`이 메서드 이름 앞에 온다.** |
| 11 | `@RequestParam(defaultValue = "익명") String name` | 쿼리스트링의 `name`을 이 매개변수에 넣는다. 없으면 `"익명"`. 매개변수도 `타입 이름` 순서다 |
| 12 | `String message = name + "님, 반가워요";` | **지역 변수 선언: `타입 이름 = 값;`** 문자열은 `+`로 잇는다. 문장 끝 `;`는 빼면 안 된다 |
| 13 | `int nameLength = name.length();` | 문자열 길이. `length`는 **메서드**라 괄호 `()`를 붙인다 |
| 14 | `return new Greeting(name, message, nameLength);` | `new`로 생성자를 불러 객체를 만들고 돌려준다. 인자의 **순서와 개수**가 record 선언과 같아야 한다 |

#### 요청과 코드 맞춰 보기

```text
요청  GET http://localhost:8080/api/start/hello?name=김자바
      http://localhost:8080   → 서버 주소(Main이 띄운 Tomcat)
      /api/start/hello        → @GetMapping("/api/start/hello")가 붙은 hello 메서드
      name=김자바             → @RequestParam String name

응답  {"name":"김자바","message":"김자바님, 반가워요","nameLength":3}
      → hello가 return한 Greeting 객체가 JSON이 된 것. 키는 record 구성 요소 이름
```

#### 자주 헷갈리는 것

- `var`도 있다. `var message = name + "님";`처럼 쓰면 타입을 추론한다. 하지만 처음에는 타입을 직접 쓰는 연습을 한다.
- `String`(대문자, 클래스)과 `int`(소문자, 기본 타입)는 종류가 다르다. 기본 타입은 `null`이 될 수 없다. `null`이 필요하면 `Integer`를 쓴다. 0-4에서 이 차이 때문에 에러가 난다.
- `static`은 "객체 없이 클래스에 붙어 있는 것"이다. `Main.main`이 `static`이라 객체를 만들지 않고도 앱이 시작된다. 0-4에서 자세히 본다.
- Java 문자열은 큰따옴표 `"`만 된다. 작은따옴표 `'a'`는 글자 하나(`char`)다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- GreetingController.hello가 쿼리의 name을 String name 매개변수로 받는다 — @RequestParam
- 인사말(String)과 글자 수(int)를 만들어 new Greeting(name, message, nameLength)로 응답 객체를 만든다
- Spring이 Greeting record를 JSON으로 바꾼다 — 구성 요소 이름이 그대로 JSON 키가 된다
- name이 없으니 @RequestParam(defaultValue = "익명")의 기본값 '익명'이 들어간다

<details>
<summary>Controller — HTTP 연결</summary>

`GreetingController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/start/hello")`. 변경된 메서드: `hello`.

</details>

<details>
<summary>설정·보조 코드</summary>

`CorsConfig.java`, `Greeting.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `addCorsMappings`.

</details>

## 직접 확인

`Main`을 다시 실행한 뒤:

```bash
BASE=http://localhost:8080   # 서버 주소가 다르면 여기만 바꾼다

# 요청 A — 이름을 넣어서(한글은 --data-urlencode로 보내면 안전하다)
curl -i -G "$BASE/api/start/hello" --data-urlencode 'name=김자바'

# 요청 B — 이름 없이
curl -i "$BASE/api/start/hello"
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "이름을 넣어서", "method": "GET", "path": "/api/start/hello?name=김자바" },
    { "id": "B", "title": "이름 없이", "method": "GET", "path": "/api/start/hello" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "headers": { "Content-Type": { "contains": "application/json" } },
        "json": [
          { "path": "$.name", "equals": "김자바" },
          { "path": "$.message", "equals": "김자바님, 반가워요" },
          { "path": "$.nameLength", "equals": 3 }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.name", "equals": "익명" },
          { "path": "$.message", "equals": "익명님, 반가워요" },
          { "path": "$.nameLength", "equals": 2 }
        ]
      }
    }
  ]
}
```

"CORS로 막혔어요"가 뜨면 [준비](#준비)의 `CorsConfig`를 넣고 앱을 다시 띄웠는지 본다.

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용 — 통과/실패에 넣지 않는다).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, `Content-Type`이 `application/json`, 본문 `name`=`김자바`, `message`=`김자바님, 반가워요`, `nameLength`=`3`(숫자) |
| C2 | 요청 B | 상태 `200`, 본문 `name`=`익명`, `message`=`익명님, 반가워요`, `nameLength`=`2` |
| R1 | 응답 객체 | 응답을 문자열로 이어 붙이지 않고 `record`(또는 생성자·getter가 있는 클래스)로 만든다 |
| R2 | 패키지 | 0장 코드가 `org.example.start` 패키지(폴더 `org/example/start`)에 있다 |

## 일부러 망가뜨리기

완성한 코드를 한 군데씩 바꿔 보고, 나는 에러를 직접 읽는다. 하나 보고 나면 원래대로 되돌린다. 아래 메시지는 Boot 4.1.1·Java 21에서 실제로 재현한 원문이다. 경로 앞부분은 `...`로 줄였다.

**컴파일 에러는 어디에 뜨나** — 앱이 뜨기 전에 막힌다. IntelliJ에서는 아래 **Build** 창에, 터미널에서는 `./gradlew compileJava` 결과에 뜬다. 형식은 `파일경로:줄번호: error: 메시지`이고, 다음 줄에 문제의 코드와 `^`(어디인지)가 나온다. IntelliJ에서는 파일 경로를 클릭하면 그 줄로 간다.

### ① 순서를 뒤집어 쓰기 — `name: String`

`Greeting.java` 4번 줄을 `public record Greeting(name: String, message: String, nameLength: int) {`로 바꾼다.

```text
.../src/main/java/org/example/start/Greeting.java:4: error: <identifier> expected
public record Greeting(name: String, message: String, nameLength: int) {
                           ^
.../src/main/java/org/example/start/Greeting.java:4: error: class, interface, enum, or record expected
public record Greeting(name: String, message: String, nameLength: int) {
                                                                  ^
2 errors
```

- 읽는 법: `<identifier> expected`는 "여기에 이름이 와야 하는데 `:`가 왔다"는 뜻이다. `^`가 `name` 바로 뒤를 가리킨다.
- 고치기: `타입 이름` 순서로 `String name`.

### ② 소문자 `string`

`String name`을 `string name`으로 바꾼다.

```text
.../src/main/java/org/example/start/Greeting.java:4: error: cannot find symbol
public record Greeting(string name, String message, int nameLength) {
                       ^
  symbol:   class string
  location: class Greeting
1 error
```

- 읽는 법: `cannot find symbol`은 "그런 이름을 모른다"는 뜻이다. `symbol: class string`으로 무엇을 못 찾았는지 알 수 있다.
- 고치기: Java의 문자열 타입은 `String`(대문자)이다. 숫자는 `int`·`long`·`double` 중에서 고른다.

### ③ 세미콜론 빠뜨리기

`GreetingController.java` 12번 줄 끝의 `;`를 지운다.

```text
.../src/main/java/org/example/start/GreetingController.java:12: error: ';' expected
        String message = name + "님, 반가워요"
                                         ^
1 error
```

### ④ 타입이 안 맞을 때

13번 줄을 `int nameLength = name;`으로 바꾼다.

```text
.../src/main/java/org/example/start/GreetingController.java:13: error: incompatible types: String cannot be converted to int
        int nameLength = name;
                         ^
1 error
```

- 문자열을 정수 칸에 넣을 수 없다는 에러다. Java는 이 검사를 **빌드할 때 반드시** 한다. 무시하고 실행할 방법이 없다.

### ⑤ 생성자 인자 개수가 다를 때

14번 줄을 `return new Greeting(name, message);`로 바꾼다.

```text
.../src/main/java/org/example/start/GreetingController.java:14: error: constructor Greeting in record Greeting cannot be applied to given types;
        return new Greeting(name, message);
               ^
  required: String,String,int
  found:    String,String
  reason: actual and formal argument lists differ in length
1 error
```

- 읽는 법: `required`는 선언된 생성자가 받는 타입 목록이고, `found`는 내가 넘긴 것이다. 두 줄을 나란히 놓고 비교하면 된다.

### ⑥ import 빠뜨리기

`import org.springframework.web.bind.annotation.RequestParam;` 줄을 지운다.

```text
.../src/main/java/org/example/start/GreetingController.java:11: error: cannot find symbol
    public Greeting hello(@RequestParam(defaultValue = "익명") String name) {
                           ^
  symbol:   class RequestParam
  location: class GreetingController
1 error
```

- 고치기: `@RequestParam`의 빨간 글자에 커서를 두고 `Alt+Enter` → Import class.

### ⑦ 기본값을 빼고 이름 없이 부르기 — 컴파일은 되고 요청이 400

11번 줄을 `@RequestParam String name`으로 바꾸고 앱을 다시 띄운 뒤 요청 B를 보낸다. 응답은 `400`이다. 이번에는 Build 창이 아니라 **앱 실행 로그(Run 창)**에 한 줄이 남는다.

```text
WARN ... .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.bind.MissingServletRequestParameterException: Required request parameter 'name' for method parameter type String is not present]
```

- `@RequestParam`은 기본이 **필수**다. 없어도 되면 `defaultValue`를 주거나 `@RequestParam(required = false)`로 쓴다. `required = false`이면 값이 없을 때 `null`이 들어온다.

## 필요한 지식

- [P09 Java 문법 기초](../../docs/knowledge/P09-java-syntax-basics.md) — 변수·타입·클래스·메서드 선언 순서
- [P04 생성자와 빌더](../../docs/knowledge/P04-constructors-builder.md) — 생성자가 무엇을 하고, 언제 여러 개를 두나
- [J05 모던 문법](../../docs/knowledge/J05-modern-syntax.md) — `record`, `var`
- [J01 타입과 String](../../docs/knowledge/J01-types-string.md) — 기본 타입(`int`)과 참조 타입(`String`, `Integer`)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 패키지를 어디에 만드나</summary>

`src/main/java/org/example` 아래에 `start` 폴더다. `Main.java`가 있는 폴더의 **하위**여야 Spring이 찾는다(0-2에서 이유를 본다).
</details>

<details>
<summary>힌트 2 — 앱을 다시 띄워야 하나</summary>

Java 코드를 바꾸면 앱을 다시 띄워야 반영된다. IntelliJ 오른쪽 위 ▶(Run) 옆의 재시작 버튼을 누르거나, 멈추고 다시 실행한다.
</details>

<details>
<summary>힌트 3 — 한글이 깨져 보일 때</summary>

curl에서 한글 쿼리는 `-G`와 `--data-urlencode 'name=김자바'`로 보낸다. 브라우저 주소창은 자동으로 인코딩해 준다.
</details>

## 다음 단계

[0-2. 어노테이션은 무엇인가](0-2-annotations.md) — 방금 붙인 `@RestController`·`@GetMapping`을 떼어 보고, 왜 404가 나는지 본다.
