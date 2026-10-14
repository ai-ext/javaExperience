# 0-4. DTO 만들기 — record·static·기본 생성자

## 상황

첫 수업에서 가장 오래 막힌 곳이 여기다. 요청을 받을 DTO 클래스를 컨트롤러 **안에** 만들었더니 이런 에러가 났다. "기본 생성자가 없다." 그런데 생성자는 분명히 있었다. 진짜 원인은 `static`이 빠진 것이었다.

DTO(Data Transfer Object)는 **JSON과 Java 객체 사이를 오가는 그릇**이다. 그릇을 만드는 규칙은 세 가지뿐이다. 이 단계에서는 프로필 하나를 받아 "성인인지"를 붙여 돌려주는 API를 만든다. 그다음 DTO를 일부러 규칙에 어긋나게 만들어 실제 에러를 보고 고친다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "프로필 만들기 화면",
  "summary": "이름과 나이를 보내면 서버가 DTO로 받아, 성인 여부를 붙인 응답 DTO로 돌려준다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "프로필 만들기", "right": "김자바" },
    { "type": "field", "id": "name", "label": "이름", "value": "김자바" },
    { "type": "field", "id": "age", "label": "나이", "value": "20" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "save", "label": "만들기", "variant": "primary" }] },
    { "type": "text", "id": "result", "value": "김자바 · 20살 · 성인", "emphasis": "title" },
    { "type": "toast", "id": "toast", "value": "프로필을 만들었어요", "tone": "success" }
  ],
  "flows": [
    {
      "name": "정상 — record DTO",
      "steps": [
        { "kind": "user", "text": "이름·나이를 넣고 [만들기]를 누른다", "focus": ["name", "age", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/profile",
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"김자바\",\n  \"age\": 20\n}"
        },
        { "kind": "server", "text": "Jackson이 ProfileRequest record의 생성자를 불러 name·age를 넣는다(JSON 키 = 구성 요소 이름)" },
        { "kind": "server", "text": "컨트롤러가 age >= 19로 adult를 계산해 ProfileResponse record를 만든다. Jackson이 name()·age()·adult()를 불러 JSON을 만든다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"김자바\",\n  \"age\": 20,\n  \"adult\": true\n}"
        },
        { "kind": "screen", "text": "'김자바 · 20살 · 성인'이 보인다", "focus": ["result", "toast"] }
      ]
    },
    {
      "name": "고장 — static이 빠진 안쪽 클래스",
      "steps": [
        { "kind": "user", "text": "(서버 DTO를 'public class ProfileRequest'로 바꾼 뒤) [만들기]를 누른다", "focus": ["save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/profile",
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"김자바\",\n  \"age\": 20\n}"
        },
        { "kind": "server", "text": "Jackson이 ProfileRequest 객체를 만들려는데, 안쪽(비정적) 클래스라 바깥 ProfileController 객체가 있어야 만들 수 있다. Jackson은 그걸 가지고 있지 않다" },
        { "kind": "server", "text": "InvalidDefinitionException: ... non-static inner classes like this can only by instantiated using default, no-argument constructor — 요청이 아니라 서버 코드 문제라 500" },
        { "kind": "response", "status": 500, "headers": ["Content-Type: application/json"] },
        { "kind": "screen", "text": "사용자는 고칠 수 없는 오류 — '잠시 후 다시 시도해 주세요'", "focus": ["toast"] }
      ]
    },
    {
      "name": "나이를 빠뜨렸을 때",
      "steps": [
        { "kind": "user", "text": "(클라이언트 버그) age 없이 보낸다", "focus": ["age", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/start/profile",
          "headers": ["Content-Type: application/json"],
          "body": "{\n  \"name\": \"김자바\"\n}"
        },
        { "kind": "server", "text": "record의 int age에 넣을 값이 없다. int는 null이 될 수 없어 Jackson 3는 거절한다 — Cannot map `null` into type `int`" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/json"] },
        { "kind": "screen", "text": "400 — 보내는 쪽이 age를 넣도록 고친다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/start/profile` |
| 요청 본문 | `{ "name": "김자바", "age": 20 }` — 요청 DTO로 받는다 |
| 응답 | 상태 `200`, `{ "name": "김자바", "age": 20, "adult": true }` — 응답 DTO로 돌려준다 |
| `adult` | `age >= 19`이면 `true` |
| DTO 위치 | 컨트롤러 클래스 **안에** 둔다(일부러 — 이 단계의 주제) |

## 따라 치기

`src/main/java/org/example/start/ProfileController.java`

```java
package org.example.start;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    // 요청 본문 DTO. 클래스 안에 둔 record는 저절로 static이다
    public record ProfileRequest(String name, int age) {
    }

    // 응답 DTO. record는 name()·age()·adult()를 만들어 주고, Jackson이 그걸로 JSON을 만든다
    public record ProfileResponse(String name, int age, boolean adult) {
    }

    @PostMapping("/api/start/profile")
    public ProfileResponse create(@RequestBody ProfileRequest request) {
        boolean adult = request.age() >= 19;
        return new ProfileResponse(request.name(), request.age(), adult);
    }
}
```

| 줄 | 코드 | 설명 |
|---|---|---|
| 11 | `public record ProfileRequest(String name, int age)` | 요청 DTO. **클래스 안에 둔 record는 자동으로 `static`이다.** 그래서 바깥 객체 없이도 만들 수 있다 |
| 15 | `public record ProfileResponse(String name, int age, boolean adult)` | 응답 DTO. `boolean`은 `true`/`false` |
| 19 | `@RequestBody ProfileRequest request` | 본문 JSON → `ProfileRequest`. 0-3에서 본 그대로다 |
| 20 | `request.age() >= 19` | record의 값은 `age()`처럼 **괄호를 붙여** 꺼낸다(`getAge()`가 아니다) |
| 21 | `new ProfileResponse(...)` | 생성자에 넘기는 순서 = record 선언 순서 |

### DTO 규칙 세 가지

Jackson(JSON ↔ 객체 변환기)이 DTO를 다룰 때 필요한 것은 둘이다. **만들 수 있어야 하고**(요청), **값을 꺼낼 수 있어야 한다**(응답).

| 규칙 | 왜 | 지키는 법 |
|---|---|---|
| ① 바깥 객체 없이 만들 수 있어야 한다 | Jackson은 `new 바깥객체.new 안쪽클래스()`를 할 수 없다 | **record**(자동 static), 또는 **`static` 클래스**, 또는 **별도 파일**의 클래스 |
| ② 만드는 방법을 알아야 한다 | 빈 객체를 만든 뒤 setter로 채우거나, 생성자 매개변수 이름을 보고 넣는다 | record(생성자 자동), 또는 기본 생성자 + setter |
| ③ 값을 꺼낼 수 있어야 한다 | 응답 JSON을 만들 때 `getXxx()`(또는 record의 `xxx()`)를 부른다 | record, 또는 getter |

**record를 쓰면 세 규칙이 한 번에 지켜진다.** 그래서 이 과정에서는 DTO를 record로 만든다.

### static이 뭐길래

```java
public class ProfileController {
    public class Inner { }          // 안쪽(비정적) 클래스 — "ProfileController 객체 하나에 딸린" 클래스
    public static class Nested { }  // static 클래스 — 바깥 클래스 이름만 빌려 쓰는 독립 클래스
}

ProfileController controller = new ProfileController();
ProfileController.Inner a = controller.new Inner();         // 바깥 객체가 반드시 있어야 만든다
ProfileController.Nested b = new ProfileController.Nested(); // 바깥 객체 없이 만든다
```

- `static`은 "객체가 아니라 **클래스에** 붙어 있다"는 뜻이다. 필드에 붙이면 객체마다가 아니라 클래스에 하나만 있다(예: `private static final Logger log`). 메서드에 붙이면 객체 없이 부른다(`Main.main`, `Long.parseLong`).
- 비정적 안쪽 클래스의 생성자는 겉으로는 빈 괄호 `()`처럼 보인다. 하지만 컴파일러가 **바깥 객체를 받는 숨은 매개변수**를 넣는다. 그래서 "기본 생성자가 없다"는 에러가 난다. 눈에 보이는 생성자가 있어도 난다.

### record 대신 static 클래스로 쓴다면

record를 쓸 수 없는 경우(예: 값을 나중에 바꿔야 하는 객체)에는 이렇게 쓴다. 기본 생성자 + getter + setter 모양이다.

```java
    public static class ProfileRequest {
        private String name;
        private int age;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }
    }
```

- 생성자를 하나도 쓰지 않으면 Java가 **빈 생성자(기본 생성자)**를 만들어 준다. Jackson은 그 생성자로 빈 객체를 만든 뒤 `setName`·`setAge`로 채운다.
- 이 모양으로 바꾸면 컨트롤러에서는 `request.getAge()`, `request.getName()`으로 꺼낸다.
- 이 코드도 실측으로 같은 응답이 나왔다. 다만 **나이를 빠뜨리면 차이가 난다.** record는 400이고, 이 클래스는 `age`가 `0`인 채로 200이 나온다(`{"name":"김자바","age":0,"adult":false}`). setter가 불리지 않아 `int`의 초깃값 `0`이 남기 때문이다. 조용히 틀린 값이 들어가는 쪽이 더 위험하다.

### record는 실행 중에도 모양을 지킨다

record는 컴파일된 뒤에도 클래스로 남는다. Jackson은 실행 중에 그 구성 요소(`name`·`age`)를 보고 본문 JSON을 객체로 만든다. 그래서 모양이 안 맞으면(예: `int age`에 넣을 값이 없으면) 메서드에 들어가기 전에 400으로 거절된다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- Jackson이 ProfileRequest record의 생성자를 불러 name·age를 넣는다(JSON 키 = 구성 요소 이름)
- 컨트롤러가 age >= 19로 adult를 계산해 ProfileResponse record를 만든다. Jackson이 name()·age()·adult()를 불러 JSON을 만든다
- Jackson이 ProfileRequest 객체를 만들려는데, 안쪽(비정적) 클래스라 바깥 ProfileController 객체가 있어야 만들 수 있다. Jackson은 그걸 가지고 있지 않다
- InvalidDefinitionException: ... non-static inner classes like this can only by instantiated using default, no-argument constructor — 요청이 아니라 서버 코드 문제라 500

<details>
<summary>Controller — HTTP 연결</summary>

`ProfileController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/start/profile")`. 변경된 메서드: `create`.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 성인
curl -i -X POST "$BASE/api/start/profile" -H 'Content-Type: application/json' -d '{"name":"김자바","age":20}'

# 요청 B — 미성년
curl -i -X POST "$BASE/api/start/profile" -H 'Content-Type: application/json' -d '{"name":"이프론","age":15}'

# 요청 C — 나이에 글자
curl -i -X POST "$BASE/api/start/profile" -H 'Content-Type: application/json' -d '{"name":"김자바","age":"스무살"}'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "성인", "method": "POST", "path": "/api/start/profile", "body": { "name": "김자바", "age": 20 } },
    { "id": "B", "title": "미성년", "method": "POST", "path": "/api/start/profile", "body": { "name": "이프론", "age": 15 } },
    { "id": "C", "title": "나이에 글자", "method": "POST", "path": "/api/start/profile", "body": { "name": "김자바", "age": "스무살" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.name", "equals": "김자바" },
          { "path": "$.age", "equals": 20 },
          { "path": "$.adult", "equals": true }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.name", "equals": "이프론" },
          { "path": "$.age", "equals": 15 },
          { "path": "$.adult", "equals": false }
        ]
      }
    },
    { "id": "C3", "request": "C", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, `name`=`김자바`, `age`=`20`, `adult`=`true` |
| C2 | 요청 B | 상태 `200`, `name`=`이프론`, `age`=`15`, `adult`=`false` |
| C3 | 요청 C | 상태 `400`(글자를 `int`로 바꿀 수 없다) |
| R1 | 요청 DTO | 컨트롤러 안에 두었다면 `record`이거나 `static` 클래스다(비정적 안쪽 클래스가 아니다) |
| R2 | 응답 DTO | `record`이거나 getter가 있다. 요청 DTO를 그대로 돌려주지 않는다 |

## 일부러 망가뜨리기

메시지는 Boot 4.1.1(Jackson 3.1.5)에서 재현한 원문이다. **Jackson 3에서 달라진 점**은 따로 표시했다. Jackson 2 비교는 jackson-databind 2.18.2를 단독으로 돌려 잰 것이다(Boot 3 앱에서 잰 것이 아니다).

### ① static을 뺀 안쪽 클래스 → 500

`ProfileRequest`를 위 [static 클래스 모양](#record-대신-static-클래스로-쓴다면)에서 **`static`만 뺀** `public class ProfileRequest { ... }`로 바꾸고 요청 A를 보낸다.

```text
ERROR ... o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.http.converter.HttpMessageConversionException: Type definition error: [simple type, class org.example.start.ProfileController$ProfileRequest]] with root cause

tools.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `org.example.start.ProfileController$ProfileRequest`: non-static inner classes like this can only by instantiated using default, no-argument constructor
 at [Source: REDACTED (`StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION` disabled); byte offset: #1]
	at tools.jackson.databind.exc.InvalidDefinitionException.from(InvalidDefinitionException.java:70) ~[jackson-databind-3.1.5.jar:3.1.5]
	at tools.jackson.databind.DeserializationContext.reportBadDefinition(DeserializationContext.java:1995) ~[jackson-databind-3.1.5.jar:3.1.5]
	... (Jackson·Spring·Tomcat 줄이 수십 줄 이어진다)
```

- **어디를 보나**: `with root cause` 다음 빈 줄 아래의 예외 줄이다. `ProfileController$ProfileRequest`는 "`ProfileController` 안의 `ProfileRequest`"이고, `non-static inner classes`가 원인을 말해 준다.
  이 에러는 **내 메서드가 불리기 전에** 나서 아래 `at` 줄에 `org.example`이 하나도 없다. 그래서 메시지 속 **클래스 이름**으로 찾아간다.
- **왜 500인가**: 요청 JSON은 멀쩡하다. 서버의 DTO 정의가 잘못됐다(`Type definition error`). 그래서 4xx가 아니라 5xx다. 앞의 0-3 에러들과 달리 `ERROR` 줄 + 긴 스택트레이스로 남는다.
- **"기본 생성자가 없다"고 읽히는 이유**: 빈 괄호 생성자는 있다. 하지만 안쪽 클래스라 바깥 객체를 받는 숨은 매개변수가 붙어서, Jackson이 보기에는 진짜 "인자 없는 생성자"가 아니다.
- **고치기**: `static`을 붙이거나, record로 바꾸거나, 별도 파일(`ProfileRequest.java`)로 뺀다.
- **Jackson 3에서 달라진 점**: 문장은 Jackson 2.18과 **같다**("can only by instantiated"의 오타까지 같다). 다른 것은 두 가지다.
  패키지가 `com.fasterxml.jackson.databind`에서 `tools.jackson.databind`로 바뀌었고, 위치가 `line: 1, column: 2`가 아니라 `byte offset: #1`로 나온다. 검색할 때는 패키지 이름을 빼고 문장으로 찾는다.

### ② getter 없는 응답 클래스 → 200인데 `{}`

`ProfileResponse`를 getter 없는 static 클래스로 바꾼다.

```java
    public static class ProfileResponse {
        private final String name;
        private final int age;
        private final boolean adult;

        public ProfileResponse(String name, int age, boolean adult) {
            this.name = name;
            this.age = age;
            this.adult = adult;
        }
    }
```

요청 A의 응답:

```text
HTTP/1.1 200
{}
```

- **에러도 로그도 없다.** 그래서 더 찾기 어렵다. 필드가 `private`이고 getter가 없으면 Jackson은 꺼낼 값이 없다고 보고 빈 객체를 쓴다.
- **고치기**: record로 바꾸거나 `getName()`·`getAge()`·`isAdult()`(boolean은 `is`)를 만든다.
- **Jackson 3에서 달라진 점**: Jackson 2 기본 설정은 이 경우 예외를 던졌다. `InvalidDefinitionException: No serializer found for class ... and no properties discovered to create BeanSerializer (to avoid exception, disable SerializationFeature.FAIL_ON_EMPTY_BEANS)`(2.18.2 단독 실측). Jackson 3는 예외 없이 `{}`를 쓴다(3.1.5 단독·Boot 4.1.1 앱 둘 다 실측).

### ③ 나이를 빠뜨림(record의 `int`) → 400

본문을 `{"name":"김자바"}`로 보낸다.

```text
WARN ... Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot map `null` into type `int` (set `DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES` to 'false' to allow)]
```

`"age": null`로 보내도 같은 줄이 나온다.

- **Jackson 3에서 달라진 점**: Jackson 2는 같은 record에 `age`를 `0`으로 채우고 넘어갔다(2.18.2 단독 실측: `Rec[name=김자바, age=0]`). Jackson 3는 기본값으로 **거절**한다.
  없어도 되는 값이면 `Integer age`(null 가능)로 선언하고 코드에서 `null`을 처리한다. 위 [static 클래스 + setter](#record-대신-static-클래스로-쓴다면) 모양은 Jackson 3에서도 setter가 안 불려 `0`이 된다.

### ④ 나이에 글자 → 400 (요청 C)

```text
WARN ... Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot deserialize value of type `int` from String "스무살": not a valid `int` value]
```

`"age": "20"`처럼 **숫자로 읽히는 글자**는 400이 아니다. `20`으로 바꿔 받는다(실측).

### ⑤ (참고) 생성자만 있고 기본 생성자가 없는 static 클래스

`public static class ProfileRequest`에 `public ProfileRequest(String name, int age)` 생성자와 getter만 두고 setter와 빈 생성자는 없앤다. 이 레포에서는 **에러 없이 동작한다**(실측).

Gradle(Spring Boot 플러그인)이 생성자 매개변수 이름을 클래스 파일에 남기기 때문이다(`-parameters`). Jackson 3는 그 이름(`name`, `age`)을 JSON 키와 맞춰 생성자를 부른다.

매개변수 이름이 남지 않게 컴파일되면(`-parameters` 없이) 이렇게 실패한다(Jackson 3.1.5 단독 실측).

```text
tools.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `K$Req` (no Creators, like default constructor, exist): cannot deserialize from Object value (no delegate- or property-based Creator)
```

"기본 생성자 없음"이라는 말이 나오는 진짜 경우가 이것이다. ①과는 원인이 다르다.

## 필요한 지식

- [P16 — 생성 규칙: getter, 생성자, record](../../docs/knowledge/P16-json-jackson-practical.md#25-생성-규칙-getter-생성자-record) — Jackson이 객체를 만들고 읽는 방법
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 요청·응답 모양을 따로 두는 이유
- [P29 static 완전 정리](../../docs/knowledge/P29-static-complete.md) — static 필드·메서드·중첩 클래스
- [P04 생성자와 빌더](../../docs/knowledge/P04-constructors-builder.md) — 기본 생성자가 언제 생기고 언제 사라지나
- [W21 null 다루기](../../docs/knowledge/W21-null-handling.md) — `int`와 `Integer`, 값이 없을 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — record 두 개</summary>

컨트롤러 클래스 안에 `public record ProfileRequest(String name, int age) {}`와 `public record ProfileResponse(String name, int age, boolean adult) {}`를 둔다.
</details>

<details>
<summary>힌트 2 — 500이 나는데 내 코드 줄이 로그에 없다</summary>

`with root cause` 아래 예외 이름과 메시지에 나온 클래스 이름(`...$ProfileRequest`)을 본다. `non-static inner classes`면 `static`을 붙이거나 record로 바꾼다.
</details>

## 다음 단계

[0-5. 에러 읽기](0-5-read-stack-trace.md) — 500이 났을 때 긴 로그에서 내 코드의 몇 번째 줄이 문제인지 찾아가는 순서를 연습한다.
