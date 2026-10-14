# F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳

> 개념 레슨 · 35분

## 이게 뭐냐

[F1](F1-validation-errors.md)에서 `@NotBlank`·`@Size`와 `@Valid`, 그리고 `ProblemDetail`로 돌려주는 법을 봤다. 이 레슨은 그 다음 질문을 실제 요청으로 확인한다.

- `null`, `""`, `"   "`는 각각 어느 규칙에 걸리나
- 경계값(정확히 20자, 21자, `0`)은 통과하나
- DTO 안의 객체와 리스트의 **원소**까지 검사하려면 무엇이 더 필요한가
- 글자 수가 아니라 **바이트 수**를 막아야 할 때는 어떻게 하나
- 검증을 빼먹으면 어디서, 어떤 에러로 터지나

마지막 질문이 제일 중요하다. 같은 "빈 닉네임"이라도 **어디서 걸리느냐**에 따라 응답 코드가 달라진다.

| 어디서 걸리나 | 예외 | 응답 |
|---|---|---|
| JSON을 객체로 바꿀 때 | `HttpMessageNotReadableException` | `400` |
| `@Valid @RequestBody` 검사 | `MethodArgumentNotValidException` | `400` |
| `@RequestParam`에 붙인 `@Min` 같은 제약 | `HandlerMethodValidationException` | `400` |
| 검증을 통과해 DB의 `NOT NULL`·길이 제약에서 | `DataIntegrityViolationException` | **`500`** |

`400`은 "보낸 쪽이 고쳐서 다시 보내라", `500`은 "서버가 잘못했다"다(F1). 사용자가 고칠 수 있는 실수가 DB까지 내려가면 `500`이 된다. 그래서 검증은 **DB에 닿기 전에** 끝내야 한다.

### 제약마다 보는 것이 다르다

| 제약 | 보는 것 | `null`이면 |
|---|---|---|
| `@NotNull` | 값이 있나 | 실패 |
| `@NotEmpty` | 길이·크기가 0보다 큰가(문자열·리스트) | 실패 |
| `@NotBlank` | 공백을 빼고도 글자가 있나(문자열만) | 실패 |
| `@Size(min, max)` | 길이·크기가 범위 안인가(양끝 포함) | **통과** |
| `@Positive` · `@Min` · `@Max` | 숫자 범위 | **통과** |
| `@Email` · `@Pattern` | 모양 | **통과** |

아래 네 줄은 `null`을 **통과시킨다.** "값이 있으면 이 모양이어야 한다"는 뜻이라서다. 필수 입력이면 `@NotBlank @Size(max = 20)`처럼 둘을 같이 붙인다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1.1 앱(`spring-boot-starter-validation`)을 띄워 curl로 보냈다. 에러 처리기는 F1의 `ApiExceptionHandler`와 같고, 무엇이 거절됐는지 보이도록 `rejected`(보낸 값)만 더 넣었다. 응답은 실제로 받은 그대로다.

### ① 같은 값을 세 규칙에

```java
record ThreeRequest(@NotNull String notNull, @NotEmpty String notEmpty, @NotBlank String notBlank) {}
```

세 칸에 **같은 값**을 넣어 보낸다.

```text
# 셋 다 null
"errors":[{"field":"notBlank","message":"공백일 수 없습니다","rejected":null},
          {"field":"notEmpty","message":"비어 있을 수 없습니다","rejected":null},
          {"field":"notNull","message":"널이어서는 안됩니다","rejected":null}]
# 셋 다 ""
"errors":[{"field":"notBlank","message":"공백일 수 없습니다","rejected":""},
          {"field":"notEmpty","message":"비어 있을 수 없습니다","rejected":""}]
# 셋 다 "   "
"errors":[{"field":"notBlank","message":"공백일 수 없습니다","rejected":"   "}]
```

| 보낸 값 | `@NotNull` | `@NotEmpty` | `@NotBlank` |
|---|---|---|---|
| `null` (또는 필드 자체를 뺌) | 막음 | 막음 | 막음 |
| `""` | 통과 | 막음 | 막음 |
| `"   "` | 통과 | 통과 | 막음 |

필드를 아예 빼고 `{}`를 보내도 `null`과 결과가 같았다. JSON에 없는 필드는 `null`이 된다.

기본 메시지(`공백일 수 없습니다`)는 서버 JVM의 언어 설정을 따른다. 같은 요청에 `-H 'Accept-Language: en'`을 붙이면 `must not be blank`로 바뀌었다. 화면에 그대로 보여 줄 문구라면 F1처럼 `message = "제목을 입력해 주세요."`를 직접 적는다.

### ② 경계값 — 딱 그 값, 하나 넘친 값

```java
record SignupRequest(
        @NotBlank @Size(min = 2, max = 20) String nickname,
        @Size(max = 30) @MaxBytes(30) String bio,          // ④에서 본다
        @NotNull @Positive Integer age,
        @NotEmpty @Size(max = 3) List<@NotBlank String> tags,
        @NotNull @Valid Address address) {}

record Address(@NotBlank String city) {}
```

| 보낸 값 | 결과 |
|---|---|
| `nickname` 한글 20자 | 통과 |
| `nickname` 한글 21자 | `크기가 2에서 20 사이여야 합니다` |
| `nickname` `"가"`(1자) | 같은 메시지 |
| `age` `-1` / `0` / `1` | `0보다 커야 합니다` / `0보다 커야 합니다` / 통과 |
| `age` 없음 | `널이어서는 안됩니다` (`@Positive`가 아니라 `@NotNull`이 잡았다) |

`@Size(max = 20)`은 20을 **포함**한다. `@Positive`는 `0`을 **막는다**(0을 허용하려면 `@PositiveOrZero`). 경계는 "정확히 그 값"과 "하나 넘친 값"을 둘 다 보내 봐야 안다.

### ③ 중첩 객체와 리스트 원소

```text
# tags: ["java", " "]
"errors":[{"field":"tags[1]","message":"공백일 수 없습니다","rejected":" "}]
# tags: []
"errors":[{"field":"tags","message":"비어 있을 수 없습니다","rejected":[]}]
# tags: ["a","b","c","d"]
"errors":[{"field":"tags","message":"크기가 0에서 3 사이여야 합니다","rejected":["a","b","c","d"]}]
# address: {"city": ""}
"errors":[{"field":"address.city","message":"공백일 수 없습니다","rejected":""}]
```

- `List<@NotBlank String>` — 꺾쇠 **안**에 붙인 제약은 원소 하나하나를 본다. 몇 번째가 틀렸는지 `tags[1]`로 나온다.
- 리스트 **자체**에 붙인 `@NotEmpty`·`@Size(max = 3)`는 개수를 본다. 둘은 따로 붙인다.
- `@Valid Address address` — 이 `@Valid`가 "안으로 들어가서 `city`도 검사하라"는 표시다. 오류 이름이 `address.city`다.

`@Valid`를 뺀 DTO(`record SignupNoCascade(@NotBlank String nickname, @NotNull Address address)`)에 같은 빈 도시를 보냈다.

```text
{"result":"통과","req":{"nickname":"자바","address":{"city":""}}}
```

`Address` 안에 `@NotBlank`가 있어도, 바깥에서 들어가라고 하지 않으면 아무도 안 본다. 컨트롤러 매개변수의 `@Valid`가 첫 문을 열고, 필드의 `@Valid`가 안쪽 문을 연다.

### ④ 글자 수가 아니라 바이트 수 — 직접 만든 제약

`@Size`는 **글자 수**를 센다. 그런데 바이트로 정해진 한계가 있다. [10-3](../scenario/ch10-project/10-3-signup.md)의 BCrypt는 72바이트까지만 받는다. UTF-8에서 영문은 1바이트, 한글은 3바이트다. 10-3과 같은 모양으로 `@MaxBytes`를 만들었다.

```java
@Constraint(validatedBy = MaxBytesValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface MaxBytes {
    int value();
    String message() default "UTF-8 기준 {value}바이트 이하여야 합니다.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class MaxBytesValidator implements ConstraintValidator<MaxBytes, String> {
    private int max;
    @Override public void initialize(MaxBytes a) { this.max = a.value(); }
    @Override public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return true;   // null은 @NotNull·@NotBlank가 맡는다
        return value.getBytes(StandardCharsets.UTF_8).length <= max;
    }
}
```

`bio`에는 `@Size(max = 30) @MaxBytes(30)`을 같이 붙였다.

| `bio` | 글자 | 바이트 | 결과 |
|---|---|---|---|
| 한글 10자 | 10 | 30 | 통과 |
| 한글 11자 | 11 | 33 | `UTF-8 기준 30바이트 이하여야 합니다.` 하나 |
| 영문 31자 | 31 | 31 | `크기가 0에서 30 사이여야 합니다` **와** 바이트 메시지, 두 개 |

한글 11자는 `@Size(max = 30)`을 가볍게 통과했다. 바이트 검사가 없었다면 그대로 다음 단계로 갔다. 10-3에서는 그 다음 단계가 BCrypt였고, 결과는 `500`이었다.

`@Size`가 세는 "글자"도 조심한다. 이모지 `😀` 11개를 `nickname`(`@Size(max = 20)`)에 넣었더니 `크기가 2에서 20 사이여야 합니다`가 나왔다. Java 문자열은 이모지 하나를 길이 2로 센다. 눈에는 11자인데 `@Size`에는 22다.

### ⑤ 검증 없이 DB까지 가면

이번에는 `@Valid`도 DTO 제약도 없이 받은 값을 그대로 `INSERT`한다. 테이블은 `nickname VARCHAR(20) NOT NULL`, `bio VARCHAR(30) NULL`이다.

```java
@PostMapping("/raw")
public Object raw(@RequestBody RawSignup req) {   // 검증 없음
    jdbc.update("INSERT INTO lesson_f6_signup (nickname, bio) VALUES (?, ?)", req.nickname(), req.bio());
    return Map.of("result", "저장");
}
```

`{"nickname": null, "bio": "안녕"}`을 보냈다.

```text
HTTP/1.1 500
Content-Type: application/json

{"timestamp":"2026-10-10T07:00:02.327Z","status":500,"error":"Internal Server Error","path":"/f6/raw"}
```

서버 로그(줄 앞의 시각·스레드는 뗐다):

```text
Executing prepared SQL statement [INSERT INTO lesson_f6_signup (nickname, bio) VALUES (?, ?)]
ERROR … Request processing failed: org.springframework.dao.DataIntegrityViolationException: PreparedStatementCallback; SQL [INSERT INTO lesson_f6_signup (nickname, bio) VALUES (?, ?)]; Column 'nickname' cannot be null] with root cause

java.sql.SQLIntegrityConstraintViolationException: Column 'nickname' cannot be null
	at com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:109)
```

C4에서 배운 순서로 읽는다. 맨 아래 원인(`root cause`)이 MySQL 드라이버가 만든 `SQLIntegrityConstraintViolationException`이다. **SQL이 DB에 갔고, DB가 거절했다.** Spring이 그것을 `DataIntegrityViolationException`으로 감쌌고, 아무도 처리하지 않아 `500`이 됐다.

같은 길로 두 개를 더 보냈다.

| 보낸 값 | 결과 |
|---|---|
| `"nickname": ""` | **`200` 저장됨.** 빈 문자열은 `NULL`이 아니다. DB는 막지 않는다 |
| `bio` 한글 31자 | `500` — `Data truncation: Data too long for column 'bio' at row 1` |
| `bio` 한글 30자 | `200` 저장됨. `VARCHAR(30)`은 바이트가 아니라 **글자** 30개다(저장된 값은 90바이트) |

DB 제약은 "마지막 안전망"이지 사용자에게 무엇을 고치라고 알려 주는 곳이 아니다. `NOT NULL`은 빈 문자열을 못 막고, 막더라도 `500`이다. 그래서 둘 다 둔다. 요청 검증은 빨리·친절하게 `400`을, DB 제약은 검증을 빠뜨린 경로가 생겨도 데이터를 지킨다(1-5의 DTO 규칙과 `post.title NOT NULL`이 그 짝이다).

### ⑥ 매개변수에 직접 붙이면 다른 예외

```java
@GetMapping("/page")
public Object page(@RequestParam @Min(1) @Max(50) int size) { … }
```

`?size=0`을 보내면 `400`이 나지만, 예외가 `MethodArgumentNotValidException`이 **아니라** `HandlerMethodValidationException`이다. F1의 처리기는 앞의 것만 잡으니 이 예외는 Spring 기본 응답(`{"timestamp":…,"status":400,"error":"Bad Request",…}`)으로 나갔다. 처리기를 하나 더 만들었더니 이렇게 나왔다.

```text
{"detail":"입력값이 올바르지 않습니다.","instance":"/f6/page","status":400,"title":"Bad Request","errors":[{"field":"size","message":"1 이상이어야 합니다","rejected":0}]}
```

`?size=abc`는 검증까지 가지도 못한다. 숫자로 바꾸는 단계에서 `MethodArgumentTypeMismatchException`이 났다(`400`). [2-2](../scenario/ch2-read-post/2-2-board-list.md)의 `size`(1~50)가 이런 매개변수다.

## 따라 해 보기

10분. 1-5까지 끝낸 실습 레포에서 한다(1-6 이후라면 `-H 'Authorization: Bearer tok-kimjava'`를 붙인다). 1-5의 태그 규칙은 "최대 5개, 각 이름 1~30자"다.

**1. 세 값을 제목에 보낸다.** `title`만 `null`·`""`·`"   "`로 바꿔 세 번 보낸다.

```bash
curl -s -X POST http://localhost:8080/api/posts -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"   ","content":"본문","tags":[],"visibility":"PUBLIC"}'
```

세 번 다 `title` 오류가 나오면 `@NotBlank`다. `"   "`만 통과하면 `@NotEmpty`를 쓴 것이다.

**2. 원소 하나만 틀린다.** `"tags":["spring",""]`을 보낸다. 오류의 `field`가 `tags[1]`인지 본다. 1-5 정답 코드는 원소에 `@Size(min = 1, max = 30)`을 붙인다(`List` 꺾쇠 안). 이번엔 `"tags":["spring"," "]`(공백 한 칸)을 보낸다. 공백도 한 글자라 `@Size(min = 1)`은 **통과**시킨다. 실험 앱에서도 `nickname`에 공백 두 칸을 보냈더니 `@Size(min = 2)`는 말이 없고 `@NotBlank`만 걸렸다. 공백 태그를 막고 싶으면 원소에 `@NotBlank`를 더한다.

**3. 경계를 두 번 보낸다.** 제목 200자와 201자를 보낸다(`T=$(printf '가%.0s' {1..200})`로 만들고 `\"title\":\"$T\"`). 200자는 `201`, 201자는 `400`이어야 한다.

## 일부러 틀려 보기

**1. 바깥 `@Valid`는 두고 안쪽 `@Valid`만 뺀다** — ③의 `SignupNoCascade`다. 빈 도시가 `통과`한다. 증상이 "중첩 객체만 검사가 안 된다"면 필드의 `@Valid`부터 본다.

**2. `int`에 `@NotNull`을 붙인다** — `record AgePrimitive(@NotNull int age)`에 `{}`를 보냈다. "필드가 없으면 `0`이 들어가 통과한다"고 예상했는데, 실제로는 검증 전에 막혔다.

```text
{"timestamp":"2026-10-10T06:59:44.464Z","status":400,"error":"Bad Request","path":"/f6/age"}
WARN … Resolved [org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot map `null` into type `int` (set `DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES` to 'false' to allow)]
```

이 앱이 쓰는 Jackson 3.1.5(Boot 4.1.1 기본)는 없는 값을 원시형 `int`에 `0`으로 채우지 않고 거절했다. `400`이긴 하지만 `errors`에 `age`가 없는 "깨진 JSON" 응답이다. 사용자에게 어느 칸인지 알려 주려면 `Integer age` + `@NotNull`로 쓴다. `int`의 `@NotNull`은 아무 일도 하지 않는다(`int`는 원래 `null`이 될 수 없다).

**3. 검증을 빼고 DB에 맡긴다** — ⑤ 그대로다. 빈 문자열은 들어가고, `null`은 `500`이 된다. → [에러 도감: 중복 키](../errors.md#중복-키)도 같은 `DataIntegrityViolationException` 가족이다.

## 확인 문제

**1.** `nickname`에 `@Size(min = 2, max = 20)`만 붙였다. 요청에서 `nickname`을 아예 빼면?

<details>
<summary>정답</summary>

**통과한다.** `@Size`는 값이 **있을 때** 길이를 본다. `null`은 검사 대상이 아니다. 필수라면 `@NotBlank @Size(min = 2, max = 20)`으로 둘 다 붙인다. 이 상태로 DB의 `NOT NULL` 컬럼에 넣으면 ⑤처럼 `500`이 된다.
</details>

**2.** `tags`가 `["java", ""]`일 때 `@NotEmpty List<String> tags`는 막나? `List<@NotBlank String> tags`는?

<details>
<summary>정답</summary>

앞의 것은 **통과**한다. 리스트에 원소가 두 개 있으니 비어 있지 않다. 원소의 내용은 보지 않는다. 뒤의 것은 `tags[1]` 오류로 **막는다.** 꺾쇠 안의 제약이 원소마다 돈다. 둘은 보는 대상이 다르니 필요하면 둘 다 붙인다.
</details>

**3.** `@Size(max = 72)`인 비밀번호 칸에 한글 30자를 넣었다. 통과하나? BCrypt(72바이트 한계)에는 안전한가?

<details>
<summary>정답</summary>

`@Size`는 **통과**(30자 ≤ 72). 하지만 UTF-8로 90바이트라 BCrypt 한계를 넘는다. 글자 수 제약은 바이트를 보장하지 않는다. 10-3처럼 `@MaxBytes(72)` 같은 바이트 제약을 따로 만든다.
</details>

**4.** 검증 없이 `null` 닉네임을 `NOT NULL` 컬럼에 넣었다. 응답 코드와, 로그 맨 아래 원인 예외는?

<details>
<summary>정답</summary>

`500`. 원인은 `java.sql.SQLIntegrityConstraintViolationException: Column 'nickname' cannot be null`(MySQL 드라이버), Spring이 감싼 이름은 `DataIntegrityViolationException`이다. 사용자 실수인데 서버 잘못으로 알려 준 셈이라, 요청 단계에서 `@NotBlank`로 `400`을 내는 게 맞다.
</details>

**5.** `@RequestParam @Min(1) int size`에 `0`을 보냈다. F1의 `MethodArgumentNotValidException` 처리기만 있으면 응답은 어떤 모양인가?

<details>
<summary>정답</summary>

`400`이지만 `errors`가 없는 Spring 기본 모양(`timestamp`·`status`·`error`·`path`)이다. 매개변수에 직접 붙인 제약은 `HandlerMethodValidationException`으로 오기 때문이다. 같은 `ProblemDetail` 모양을 원하면 그 예외의 처리기도 만든다.
</details>

## 더 깊이

- [W10 — 서버: DTO 제약과 검증 오류 응답](../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답) · [서비스와 DB: 안내 검사와 최종 고유성](../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성)
- [P03 — 요청 검증](../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증)
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — `NOT NULL`, `VARCHAR(n)`이 세는 것
- 원문: [Hibernate Validator 레퍼런스](https://docs.hibernate.org/validator/9.0/reference/en-US/html_single/)(9.0판, 이 앱이 쓴 것은 Boot 4.1.1 기본 9.1.3) — 내장 제약 목록, 컨테이너 원소 제약, 직접 만드는 제약 · [Spring Framework — Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html) — 두 예외가 갈리는 조건 · [Spring Boot 4.1 — Validation](https://docs.spring.io/spring-boot/reference/io/validation.html) · [`HandlerMethodValidationException`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/method/annotation/HandlerMethodValidationException.html) · [`DataIntegrityViolationException`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataIntegrityViolationException.html)

## 다음

- 실습: [1-5. 입력 검증과 에러 응답](../scenario/ch1-create-post/1-5-validation.md) — 오늘 본 경계값(제목 200자, 태그 5개·30자)이 채점 요청에 그대로 있다.
- 실습: [10-3. 회원가입](../scenario/ch10-project/10-3-signup.md) — `@MaxBytes`로 비밀번호 72바이트를 막는다.
- 레슨: [F7. 권한과 역할](F7-roles-and-ownership.md) — 값은 맞는데 **할 자격**이 없는 요청(`401`·`403`).
