# D1. JSON과 Jackson — 본문이 객체가 되기까지

> 개념 레슨 · 35분

## 이게 뭐냐

HTTP 본문은 **글자**다. `curl -d '{"title":"장보기","priority":2}'`로 보낸 것도 그냥 글자다. 서버는 이 글자를 Java 객체로 바꿔야 메서드에 넘길 수 있고, 메서드가 돌려준 객체는 다시 글자로 바꿔야 응답으로 보낼 수 있다.

이 두 일을 하는 라이브러리가 **Jackson**이다. Spring Boot에 기본으로 들어 있다. Jackson은 JSON을 보고 `MemoRequest`라는 **진짜 객체를 만든다.** 그래서 모양이 안 맞으면 만들다가 실패하고, 그 실패는 **내 메서드가 불리기 전에** 일어난다.

| 방향 | 이름 | 서버에서 언제 |
|---|---|---|
| JSON 글자 → 객체 | 역직렬화(읽기) | `@RequestBody MemoRequest request` |
| 객체 → JSON 글자 | 직렬화(쓰기) | 컨트롤러가 객체를 `return` |

### 요청 하나가 지나가는 길

```text
POST /api/lesson/d1/memos   Content-Type: application/json   {"title":"장보기","priority":2}
   │
   ▼ Spring: Content-Type이 JSON이다 → JSON 변환기(HttpMessageConverter)를 고른다
   ▼ Jackson: 글자를 읽어 new MemoRequest("장보기", 2, ...)를 만든다   ← 여기서 실패하면 400. 내 메서드는 안 불린다
   ▼ 내 메서드 echo(request) 실행
   ▼ Jackson: 돌려준 객체에서 값을 꺼내 JSON 글자를 쓴다              ← 꺼낼 게 없으면 {}
응답 본문 {"title":"장보기","priority":2,...}
```

Jackson이 JSON 키와 Java 쪽 이름을 맞추는 규칙(record 구성 요소, getter, 안쪽 클래스는 `static`)은 [B3](./B3-static-and-inner-classes.md)·[B4](./B4-record-getter-immutable.md)에서 봤다. 이 레슨은 그다음, **값이** 어떻게 바뀌는지다.

### Boot 4는 Jackson 3

Boot 4.1.1의 `spring-boot-starter-webmvc`가 `spring-boot-starter-jackson`을 끌고 와서 Jackson **3.1.5**가 들어 있다(`gradlew dependencies`로 확인). 따로 의존성을 넣을 필요가 없다. 인터넷 글의 상당수는 Jackson **2** 기준이라 두 가지를 구별한다.

- 패키지: Jackson 3는 `tools.jackson.databind`, Jackson 2는 `com.fasterxml.jackson.databind`. 에러 로그에 어느 쪽이 찍히는지 보면 안다.
- 어노테이션(`@JsonProperty` 등)은 3에서도 **`com.fasterxml.jackson.annotation` 그대로**다. 헷갈리기 쉬운 부분이다.

기본 동작도 바뀌었다. 같은 record를 Jackson 3.1.5와 2.21.5에 각각 **설정 없이** 넣어 본 결과다(Boot 3 앱에서 잰 것이 아니다. Spring이 설정을 바꿔 줄 수 있다).

| 상황 | Jackson 3 (Boot 4 앱에서도 같음) | Jackson 2 단독 |
|---|---|---|
| DTO에 없는 키(`"titel"`)가 옴 | **무시**하고 통과 | `UnrecognizedPropertyException` |
| `int` 칸에 `null`이 오거나 키가 없음 | **거절** → `400` | `0`으로 채우고 통과 |
| `LocalDateTime`을 JSON으로 | `"2026-10-10T09:30:00"` 문자열 | 예외 — 날짜 모듈을 따로 붙여야 한다 |
| getter 없는 객체를 JSON으로 | `{}`(에러 없음) | `InvalidDefinitionException` |

`int`에 `null`이 오는 경우와 getter 없는 `{}`는 [0-4](../scenario/ch0-first-steps/0-4-dto-rules.md#일부러-망가뜨리기)에서 에러 원문까지 고장 내 본다. 여기서는 나머지를 본다.

### 알아서 바꿔 주는 값들

Jackson은 타입이 조금 달라도 웬만하면 맞춰 준다. Boot 4.1.1 앱에서 `int priority`·`String title`로 받아 본 결과다.

| 보낸 값 | 받은 값 | |
|---|---|---|
| `"priority": "3"`(글자) | `3` | 숫자로 읽히는 글자는 숫자로 |
| `"priority": 2.7` | `2` | **소수점을 버린다.** 에러 없음 |
| `"title": 123`(숫자) | `"123"` | 숫자를 글자로 |
| `"priority": "스무살"` | `400` | 숫자로 못 읽으면 거절(0-4 ④) |

### 날짜와 시간 — 시간대가 있나 없나

JSON에는 날짜 타입이 없다. 그래서 **글자**로 주고받는다. 같은 순간(서울 2026-10-10 09:30)을 Java 타입마다 쓰게 했더니:

| Java 타입 | JSON | 뜻 |
|---|---|---|
| `LocalDate` | `"2026-10-10"` | 날짜만 |
| `LocalDateTime` | `"2026-10-10T09:30:00"` | 날짜+시각. **시간대 없음** — "벽시계에 적힌 숫자"일 뿐 |
| `Instant` | `"2026-10-10T00:30:00Z"` | 세계 시간(UTC)의 한 순간. 끝의 `Z`가 UTC |
| `OffsetDateTime` | `"2026-10-10T09:30:00+09:00"` | 시각 + 서울은 UTC보다 9시간 빠르다 |

10장 명세의 시각도 시간대 없는 `LocalDateTime` 모양(`2026-10-10T09:00:00`)이다. 서버와 화면이 같은 시간대(한국)에 있다고 가정하는 셈이다. 브라우저는 시간대 없는 이 글자를 **브라우저가 있는 곳의 시각**으로 읽는다. node에서 같은 글자를 시간대만 바꿔 읽어 봤다.

```text
$ TZ=Asia/Seoul node -e 'console.log(new Date("2026-10-10T18:00:00").toISOString())'
2026-10-10T09:00:00.000Z
$ TZ=UTC node -e 'console.log(new Date("2026-10-10T18:00:00").toISOString())'
2026-10-10T18:00:00.000Z
```

같은 글자가 9시간 다른 순간이 됐다. 해외 사용자가 있는 서비스라면 `Instant`·`OffsetDateTime`처럼 시간대가 붙은 타입을 고른다.

### 큰 숫자 — JS가 못 담는 Long

Java `Long`은 9,223,372,036,854,775,807까지 담는다. JS의 `number`는 정수를 **9,007,199,254,740,991**(`Number.MAX_SAFE_INTEGER`, 2의 53승 빼기 1)까지만 정확히 담는다. 그보다 큰 id를 JSON 숫자로 보내면 API를 호출하는 브라우저(JS)에서 **다른 숫자**가 된다(아래 예시). 10장처럼 1부터 올라가는 id는 걱정 없다. 시각·서버 번호를 섞어 만드는 큰 id(W16)를 쓰면 문제가 된다. 그때는 id를 **문자열**로 보낸다.

### 어노테이션 세 개

| 어노테이션 | 하는 일 | 실측 |
|---|---|---|
| `@JsonProperty("display_name")` | JSON 키 이름을 바꾼다 | 응답 키가 `display_name`, 요청도 `display_name`으로 받는다(`name`으로 보내면 무시) |
| `@JsonInclude(NON_NULL)` | 값이 `null`이면 응답에서 키를 뺀다 | `memo`가 `null`이라 응답에 없다. **요청의 `null`을 막지는 않는다** |
| `@JsonIgnore` | 그 칸을 JSON에서 아예 뺀다 | 응답에 `password`가 없고, 요청에 `"password"`를 보내도 `null`로 들어온다 — **양쪽** 다 |

## 예시

Boot 4.1.1(Jackson 3.1.5)에서 실행했다.

```java
package org.example.lesson;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// 연습용 — JSON 글자와 Java 객체가 서로 바뀌는 모습을 본다. 다 보면 지운다
@RestController
public class JsonLessonController {

    // priority는 int(빈칸 불가), score는 Integer(null 가능)
    public record MemoRequest(String title, int priority, Integer score, LocalDateTime dueAt) {
    }

    // 받은 객체를 로그에 찍고 그대로 돌려준다
    @PostMapping("/api/lesson/d1/memos")
    public MemoRequest echo(@RequestBody MemoRequest request) {
        System.out.println("받은 객체: " + request);
        return request;
    }

    public record TimeResponse(LocalDate date, LocalDateTime localDateTime, Instant instant, OffsetDateTime offsetDateTime) {
    }

    // 같은 순간(서울 2026-10-10 09:30)을 타입마다
    @GetMapping("/api/lesson/d1/times")
    public TimeResponse times() {
        LocalDateTime t = LocalDateTime.of(2026, 10, 10, 9, 30, 0);
        return new TimeResponse(t.toLocalDate(), t, t.toInstant(ZoneOffset.ofHours(9)), t.atOffset(ZoneOffset.ofHours(9)));
    }

    // 2의 53승 + 1 — 숫자로 한 번, 글자로 한 번
    public record BigIdResponse(Long id, @JsonFormat(shape = JsonFormat.Shape.STRING) Long idAsString) {
    }

    @GetMapping("/api/lesson/d1/big-id")
    public BigIdResponse bigId() {
        long id = 9007199254740993L;
        return new BigIdResponse(id, id);
    }

    public record MemberView(
            Long id,
            @JsonProperty("display_name") String name,
            @JsonInclude(JsonInclude.Include.NON_NULL) String memo,
            @JsonIgnore String password) {
    }

    @GetMapping("/api/lesson/d1/member")
    public MemberView member() {
        return new MemberView(1L, "김자바", null, "password1234");
    }

    // 요청 쪽에서는 어떻게 되나 — 받은 객체를 글자로 돌려준다
    @PostMapping("/api/lesson/d1/member")
    public String memberIn(@RequestBody MemberView view) {
        return view.toString();
    }
}
```

실제 응답이다. `…`는 서버 주소(실측은 `http://localhost:18150`)이고, 먼저 `J='Content-Type: application/json'`을 셸에 넣어 두었다.

```text
$ curl -X POST …/api/lesson/d1/memos -H "$J" -d '{"title":"장보기","priority":2,"score":90,"dueAt":"2026-10-10T18:00:00"}'
{"title":"장보기","priority":2,"score":90,"dueAt":"2026-10-10T18:00:00"}
(서버 로그) 받은 객체: MemoRequest[title=장보기, priority=2, score=90, dueAt=2026-10-10T18:00]

$ curl -X POST …/api/lesson/d1/memos -H "$J" -d '{"title":"장보기","priority":1,"score":null}'
{"title":"장보기","priority":1,"score":null,"dueAt":null}

$ curl …/api/lesson/d1/times
{"date":"2026-10-10","localDateTime":"2026-10-10T09:30:00","instant":"2026-10-10T00:30:00Z","offsetDateTime":"2026-10-10T09:30:00+09:00"}

$ curl …/api/lesson/d1/big-id
{"id":9007199254740993,"idAsString":"9007199254740993"}

$ curl …/api/lesson/d1/member
{"id":1,"display_name":"김자바"}

$ curl -X POST …/api/lesson/d1/member -H "$J" -d '{"id":1,"display_name":"김자바","name":"무시?","memo":null,"password":"secret"}'
MemberView[id=1, name=김자바, memo=null, password=null]
```

- `score`는 `Integer`라 `null`을 받았다. 같은 자리의 `priority`(`int`)에 `null`을 보내면 `400`이다(0-4 ③).
- `member`에서 `memo`(`null`)와 `password`(`@JsonIgnore`) 키가 응답에 없다. 엔티티를 그대로 돌려주면 비밀번호 해시까지 나갈 수 있어서 응답은 DTO로 고른다(W09).

`big-id` 응답 글자를 node에서 `JSON.parse` 해 봤다. 브라우저의 `res.json()`도 같은 규칙으로 읽는다.

```text
{ id: 9007199254740992, idAsString: '9007199254740993' }
o.id === 9007199254740992      → true
Number.MAX_SAFE_INTEGER        → 9007199254740991
Number.isSafeInteger(o.id)     → false
BigInt(o.idAsString)           → 9007199254740993n
```

서버는 `…993`을 보냈는데 브라우저에는 `…992`가 들어왔다. 에러는 없다. 이 id로 상세를 부르면 **다른 글**을 부른다. 글자로 보낸 `idAsString`은 그대로다.

## 따라 해 보기

15분.

1. javaExperience의 `org.example.lesson` 패키지에 `JsonLessonController.java`를 넣고 앱을 띄운다.
2. 셸에 `J='Content-Type: application/json'`을 넣고 위 curl을 보낸다(`…` 자리에 `http://localhost:8080`). 응답과 서버 로그의 "받은 객체" 줄을 같이 본다.
3. `"priority": 2.7`, `"priority": "3"`, `"title": 123`을 하나씩 보내 "알아서 바꿔 주는 값들" 표와 같은지 본다.
4. 큰 숫자를 API를 호출하는 브라우저 쪽에서 본다. 브라우저 개발자 도구 Console에서:

```js
const o = JSON.parse('{"id":9007199254740993,"idAsString":"9007199254740993"}');
o.id;                           // 9007199254740992
o.id === 9007199254740992;      // true
```

5. `JsonLessonController`를 지운다.

## 일부러 틀려 보기

### ① 키 이름 오타 — 에러 없이 `null`

클라이언트가 `title`을 `titel`로 잘못 보냈다.

```text
$ curl -i -X POST …/api/lesson/d1/memos -H "$J" -d '{"titel":"장보기","priority":2}'
HTTP/1.1 200
{"title":null,"priority":2,"score":null,"dueAt":null}
```

Jackson 3는 모르는 키를 **조용히 버린다.** 서버는 "제목 없는 메모"를 받은 줄 안다. 막는 방법은 둘이다.

- **검증**: `title`에 `@NotBlank`를 붙이고 `@Valid`로 받는다([F1](./F1-validation-errors.md)). "제목이 비었다"는 `400`이 된다. 보통 이쪽을 쓴다.
- **모르는 키 거절**: `application.yml`에 `spring.jackson.deserialization.fail-on-unknown-properties: true`. 같은 요청이 `400`이 되고 로그에 이렇게 남는다(실측).

```text
WARN … Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Unrecognized property "titel" (class org.example.lesson.JsonLessonController$MemoRequest), not marked as ignorable]
```

### ② 시간대가 붙은 글자를 `LocalDateTime`으로 받는다

클라이언트가 끝에 `Z`(UTC) 또는 `+09:00`이 붙은 시각 글자를 보냈다.

```text
$ curl -X POST …/api/lesson/d1/memos -H "$J" -d '{"title":"a","priority":1,"dueAt":"2026-10-10T18:00:00Z"}'
{"title":"a","priority":1,"score":null,"dueAt":"2026-10-10T18:00:00"}

$ curl -i -X POST …/api/lesson/d1/memos -H "$J" -d '{"title":"a","priority":1,"dueAt":"2026-10-10T18:00:00+09:00"}'
HTTP/1.1 400
```

`Z`는 **떼어 버리고** 숫자만 받았다. UTC 18시를 보냈는데 서버는 "18시"(한국 시각이라면 9시간 차이)로 저장한다. 에러가 없어서 더 위험하다. `+09:00`은 `400`이다. 로그에는 ``Cannot deserialize value of type `java.time.LocalDateTime` from String "2026-10-10T18:00:00+09:00"`` 뒤에 `unparsed text found at index 19`(19번째 글자부터 못 읽었다)가 붙는다. **고치기**: 서버와 클라이언트가 시각 글자의 모양을 명세에 적고 맞춘다. 시간대를 주고받아야 하면 `OffsetDateTime`·`Instant`로 받는다.

### ③ 소수를 `int`로 — 조용히 버린다

`"priority": 2.7`을 보내면 `priority=2`로 들어온다(위 표). 수량·금액이라면 큰일이다. 소수가 올 수 없는 칸이면 명세에 정수라고 적어 클라이언트가 정수로 보내게 하고, 서버는 소수가 의미 있는 값이면 `BigDecimal`로 받는다.

## 확인 문제

**1.** 클라이언트가 `{"titel":"장보기","priority":2}`를 보냈다. Boot 4 서버에서 상태 코드와 `request.title()` 값은? 이 실수를 서버가 잡게 하려면?

<details>
<summary>정답</summary>

`200`, `title()`은 `null`. Jackson 3는 DTO에 없는 키(`titel`)를 무시하고, `title` 키는 안 왔으니 `null`이다. 잡으려면 `title`에 `@NotBlank`를 붙여 `@Valid`로 검증하거나(`400`), `spring.jackson.deserialization.fail-on-unknown-properties: true`로 모르는 키 자체를 `400`으로 만든다.
</details>

**2.** `record MemoRequest(String title, int priority, Integer score, ...)`에 `{"title":"a"}`를 보냈다. `priority`와 `score`는 각각 어떻게 되나?

<details>
<summary>정답</summary>

요청 전체가 `400`이다. `priority`는 `int`라 "값 없음"을 담을 수 없고, Jackson 3는 이걸 `0`으로 채우지 않고 거절한다(``Cannot map `null` into type `int` ``). `score`는 `Integer`라 키가 없어도 `null`로 받을 수 있다. 빠져도 되는 칸은 `Integer`·`Long`처럼 대문자 타입으로 선언한다.
</details>

**3.** 서버가 `"dueAt":"2026-10-10T18:00:00"`을 보냈다. 이 시각은 UTC인가? API를 호출하는 브라우저가 `new Date(dueAt)`로 읽으면 어떻게 되나?

<details>
<summary>정답</summary>

UTC가 아니다. 끝에 `Z`도 `+09:00`도 없는 `LocalDateTime` 모양이라 시간대 정보가 없다. 브라우저는 이 글자를 **브라우저가 있는 곳의 시각**으로 읽는다. 실측: 서울 시간대에서는 `2026-10-10T09:00:00.000Z`, UTC 시간대에서는 `2026-10-10T18:00:00.000Z`. 같은 글자가 다른 순간이 된다.
</details>

**4.** DB의 글 id가 `9007199254740993`이다. 서버가 `Long id`를 그대로 보내면 API를 호출하는 브라우저(JS)에서 무슨 일이 생기나? 어떻게 고치나?

<details>
<summary>정답</summary>

`JSON.parse` 결과가 `9007199254740992`가 된다(실측). JS `number`는 2의 53승 빼기 1까지만 정수를 정확히 담기 때문이다. 에러가 없어서 이 id로 다른 글을 부르게 된다. id를 **문자열**로 보낸다. 필드를 `String`으로 두거나 `@JsonFormat(shape = JsonFormat.Shape.STRING)`을 붙이면 `"9007199254740993"`으로 나간다.
</details>

**5.** `@JsonIgnore String password`가 있는 record로 요청을 받는다. 클라이언트가 `"password":"secret"`을 보내면? `@JsonInclude(NON_NULL)`은 요청의 `null`을 막아 주나?

<details>
<summary>정답</summary>

`password`는 `null`로 들어온다. `@JsonIgnore`는 응답뿐 아니라 **요청 쪽에서도** 그 칸을 뺀다(실측 `password=null`). 그래서 가입 요청 DTO에 `@JsonIgnore`를 붙이면 비밀번호를 못 받는다. 응답에서 숨길 값은 응답 DTO에 아예 넣지 않는 편이 낫다. `@JsonInclude(NON_NULL)`은 **응답을 쓸 때** `null`인 키를 빼는 것이다. 요청의 `null`은 그대로 받는다(실측 `memo=null`). 막으려면 검증(`@NotNull`)을 쓴다.
</details>

## 더 깊이

- [Spring Framework — HTTP Message Conversion](https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html) — 본문을 객체로 바꾸는 변환기
- [Spring Boot — JSON](https://docs.spring.io/spring-boot/reference/features/json.html) · [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) — Boot 4의 Jackson 3, `spring.jackson.*` 설정
- [Jackson 3.0 Release Notes](https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.0) — 바뀐 기본값 전체 목록
- [Jackson Annotations](https://github.com/FasterXML/jackson-annotations/wiki/Jackson-Annotations) — `@JsonProperty`·`@JsonInclude`·`@JsonIgnore`
- [MDN — Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) · [RFC 8259 — JSON](https://www.rfc-editor.org/rfc/rfc8259) — 숫자 정밀도
- [Java 21 API — LocalDateTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDateTime.html) — 시간대가 없는 날짜·시각
- [P16 JSON·Jackson 실무](../docs/knowledge/P16-json-jackson-practical.md) · [W20 시간과 시간대](../docs/knowledge/W20-time-timezone.md) · [W21 null 다루기](../docs/knowledge/W21-null-handling.md) · [W16 id 만들기](../docs/knowledge/W16-id-generation.md) · [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md)

## 다음

- 실습: [1-1. 요청 받기](../scenario/ch1-create-post/1-1-receive-request.md) — 글 쓰기 요청을 record로 받고, 깨진 JSON이 왜 내 메서드에 오기 전에 `400`이 되는지 본다.
