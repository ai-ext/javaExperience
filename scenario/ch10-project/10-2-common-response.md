# 10-2. 공통 응답 틀과 전역 예외 처리

## 상황

프론트 개발자가 명세서의 "공통 응답"을 보고 부탁한다.

> "응답이 성공이든 실패든 `status`·`message`·`data` 모양이 같으면 좋겠어요. fetch 래퍼 하나로 다 받게요. 실패면 `code`를 보고 화면을 바꿀 거고요."

지금 서버는 성공하면 헬스 체크의 Map을 그대로 내보낸다. 실패하면 Spring 기본 에러 JSON(`timestamp`, `error`, `path`)이 나간다. 응답 모양이 두 가지인 셈이다. 이 단계에서는 **모든 응답을 한 가지 틀로** 맞춘다.

- 성공: 컨트롤러가 `ApiResponse.ok(데이터)`로 감싸 돌려준다.
- 실패: 예외를 던지기만 한다. 컨트롤러 밖의 **전역 예외 처리기**(`@RestControllerAdvice`) 한 곳이 실패를 공통 틀로 바꾼다. 컨트롤러마다 try/catch를 쓰지 않는다.

아직 입력을 받는 API가 없다. 그래서 400 틀(검증·깨진 JSON)은 이 단계에서 처리기만 만들어 둔다. 실제 확인은 첫 입력 API인 회원 가입(10-3)에서 한다. 이 단계의 확인은 성공 틀, 없는 주소(404), 틀린 메서드(405)다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "프론트의 공통 fetch 래퍼",
  "summary": "모든 API 호출이 지나가는 함수. 응답 모양이 하나라 성공이면 data를, 실패면 code·message를 꺼낸다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "board-api 상태", "right": "운영자" },
    { "type": "code", "id": "wrapper", "label": "api.ts", "value": "const res = await fetch(url, init);\nconst body = await res.json();   // 항상 {status, message, data, ...}\nif (body.code) throw new ApiError(body.code, body.message, body.errors);\nreturn body.data;" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "health", "label": "상태 보기", "variant": "primary" }, { "id": "typo", "label": "주소 오타", "variant": "secondary" }] },
    { "type": "stats", "id": "counts", "items": [{ "label": "회원", "value": "3" }, { "label": "글", "value": "25" }] },
    { "type": "toast", "id": "toast", "value": "요청한 주소가 없습니다. (NOT_FOUND)", "tone": "error" }
  ],
  "flows": [
    {
      "name": "성공 — 틀로 감싼 응답",
      "steps": [
        { "kind": "user", "text": "[상태 보기]를 누른다", "focus": ["health"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/health" },
        { "kind": "server", "text": "HealthController가 Map을 만들어 ApiResponse.ok(map)으로 감싼다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\n  \"status\": 200,\n  \"message\": \"OK\",\n  \"data\": { \"up\": true, \"database\": \"project\", \"users\": 3, ... }\n}" },
        { "kind": "screen", "text": "래퍼가 body.data만 꺼내 화면에 넘긴다", "focus": ["wrapper", "counts"] }
      ]
    },
    {
      "name": "실패 — 없는 주소",
      "steps": [
        { "kind": "user", "text": "(프론트 실수) 주소를 /api/v1/helth로 잘못 적었다", "focus": ["typo"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/helth" },
        { "kind": "server", "text": "맞는 컨트롤러가 없어 Spring이 NoResourceFoundException을 던진다 → GlobalExceptionHandler가 잡아 공통 틀로" },
        { "kind": "response", "status": 404, "headers": ["Content-Type: application/json"], "body": "{\n  \"status\": 404,\n  \"message\": \"요청한 주소가 없습니다.\",\n  \"code\": \"NOT_FOUND\",\n  \"errors\": [],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "래퍼가 code를 보고 에러로 던지고, 화면은 message를 토스트로 띄운다", "focus": ["wrapper", "toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 공통 응답 | `ApiResponse<T>` — 성공 `{status, message, data}`, 실패 `{status, message, code, errors, data: null}` |
| 실패 코드 | `ErrorCode` — 명세서 상태 코드 표의 `code`와 HTTP 상태, 기본 문구 |
| 서비스용 예외 | `ApiException(ErrorCode, message)` — 서비스가 "이 요청은 이 코드로 실패"를 알릴 때 던진다 |
| 전역 처리기 | `@RestControllerAdvice` 클래스 하나. 아래 표의 예외를 공통 틀로 바꾼다 |
| 헬스 체크 | `GET /api/v1/health`의 응답을 `ApiResponse.ok(...)`로 감싼다 |

| 예외(누가 던지나) | 응답 |
|---|---|
| `ApiException`(우리 서비스) | 그 코드의 상태 + `code` |
| `MethodArgumentNotValidException`(`@Valid` 실패) | 400 `VALIDATION_FAILED` + 필드별 `errors` |
| `HttpMessageNotReadableException`(본문 JSON 깨짐) | 400 `BAD_JSON` |
| `MethodArgumentTypeMismatchException`(`/posts/abc`처럼 타입이 틀린 경로·쿼리 값) | 400 `VALIDATION_FAILED` |
| `MissingServletRequestParameterException`(필수 쿼리 없음) | 400 `VALIDATION_FAILED` |
| `NoResourceFoundException`(없는 주소) | 404 `NOT_FOUND` |
| `HttpRequestMethodNotSupportedException`(틀린 메서드) | 405 `METHOD_NOT_ALLOWED` |
| 그 밖의 모든 `Exception` | 500 `INTERNAL_ERROR` — 원인은 **로그에만**, 응답에는 내부 정보를 싣지 않는다 |

10-1 명세서의 상태 코드 표에도 405 `METHOD_NOT_ALLOWED`와 500 `INTERNAL_ERROR`가 있다. 이 단계의 전역 처리기가 두 경우를 그 표에 맞는 공통 응답으로 만든다.

## 따라 치기

모두 `org.example.board.common` 패키지에 둔다.

### ApiResponse

`src/main/java/org/example/board/common/ApiResponse.java`

```java
package org.example.board.common;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

// 모든 응답의 공통 틀 — 성공: {status, message, data} / 실패: {status, message, code, errors, data:null}
public record ApiResponse<T>(
        int status,
        String message,
        @JsonInclude(JsonInclude.Include.NON_NULL) String code,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<FieldErrorItem> errors,
        T data) {

    // 필드 하나의 검증 실패 — {"field": "title", "reason": "제목은 5자 이상이어야 합니다."}
    public record FieldErrorItem(String field, String reason) {
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, "OK", null, null, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, "Created", null, null, data);
    }

    public static ApiResponse<Void> fail(ErrorCode code, String message, List<FieldErrorItem> errors) {
        return new ApiResponse<>(code.status().value(), message, code.name(), errors, null);
    }
}
```

| 코드 | 설명 |
|---|---|
| `public record ApiResponse<T>(...)` | `<T>`는 "data 자리에 올 타입은 쓰는 쪽이 정한다"는 뜻이다(제네릭, TS의 `ApiResponse<T>`와 같다). `ApiResponse<UserResponse>`처럼 쓴다. record는 [B4](../../lessons/B4-record-getter-immutable.md) |
| `@JsonInclude(JsonInclude.Include.NON_NULL) String code` | 값이 `null`이면 JSON에서 **키째 뺀다**. 성공 응답에 `"code": null`이 붙지 않게 한다 |
| `T data`에는 `@JsonInclude`가 없음 | 실패·삭제 응답에서 `"data": null`을 **보여야** 해서 일부러 안 붙였다. 전역 설정으로 null을 모두 빼면 이 칸도 사라진다 |
| `public record FieldErrorItem(...)` | record 안의 record. 바깥에서는 `ApiResponse.FieldErrorItem`으로 부른다 |
| `public static <T> ApiResponse<T> ok(T data)` | `new ApiResponse<>(200, "OK", null, null, data)`를 매번 쓰지 않게 해 주는 정적 팩토리 메서드. `static`은 [B3](../../lessons/B3-static-and-inner-classes.md) |
| `fail(...)`의 `code.name()` | enum 상수의 이름 문자열(`"NOT_FOUND"`) |

`com.fasterxml.jackson.annotation.JsonInclude` — Boot 4는 Jackson 3(`tools.jackson.*`)을 쓰지만 **애노테이션 패키지는 예전 이름 그대로**다. IntelliJ 자동 import가 다른 것을 고르지 않게 확인한다.

### ErrorCode

`src/main/java/org/example/board/common/ErrorCode.java`

```java
package org.example.board.common;

import org.springframework.http.HttpStatus;

// 명세서 1. 공통의 code 표 — 화면(프론트)이 문구 대신 이 값으로 분기한다
public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    BAD_JSON(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 메서드입니다."),
    DUPLICATE(HttpStatus.CONFLICT, "이미 존재합니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
```

| 코드 | 설명 |
|---|---|
| `public enum ErrorCode { VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "…"), … }` | enum은 "정해진 값만 있는 타입"이다(TS의 union `'A' \| 'B'`에 가깝다). 상수마다 생성자 인자로 HTTP 상태와 기본 문구를 붙였다 |
| `private final HttpStatus status;` + 생성자 | enum도 필드·생성자를 가질 수 있다. 생성자는 상수를 만들 때만 불린다 |

### ApiException

`src/main/java/org/example/board/common/ApiException.java`

```java
package org.example.board.common;

// 서비스가 "이 요청은 이 코드로 실패"를 알릴 때 던진다 — 전역 처리기가 공통 틀로 바꾼다
public class ApiException extends RuntimeException {

    private final ErrorCode code;

    public ApiException(ErrorCode code) {
        this(code, code.defaultMessage());
    }

    public ApiException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
```

| 코드 | 설명 |
|---|---|
| `extends RuntimeException` | 언체크 예외라 메서드마다 `throws`를 적지 않아도 된다. 예외 기초는 [B7](../../lessons/B7-exceptions.md) |
| `this(code, code.defaultMessage())` | 같은 클래스의 다른 생성자를 부른다. 문구를 안 주면 기본 문구를 쓴다 |
| `super(message)` | 부모(`RuntimeException`)에 문구를 넘긴다. `getMessage()`로 꺼낸다 |

### GlobalExceptionHandler

`src/main/java/org/example/board/common/GlobalExceptionHandler.java`

```java
package org.example.board.common;

import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import org.example.board.common.ApiResponse.FieldErrorItem;

// 컨트롤러 밖으로 나온 예외를 한곳에서 공통 응답 틀로 바꾼다
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 서비스가 던진 실패(401·403·404·409 …)
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApi(ApiException e) {
        return fail(e.code(), e.getMessage(), List.of());
    }

    // @Valid 검증 실패 — 필드별 이유를 errors에 담는다
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalid(MethodArgumentNotValidException e) {
        List<FieldErrorItem> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldErrorItem(fe.getField(), fe.getDefaultMessage()))
                .sorted(Comparator.comparing(FieldErrorItem::field))
                .toList();
        return fail(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.defaultMessage(), errors);
    }

    // 쿼리·경로 값의 타입이 틀림(?page=abc, /posts/abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return fail(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.defaultMessage(),
                List.of(new FieldErrorItem(e.getName(), "형식이 올바르지 않습니다.")));
    }

    // 필수 쿼리 파라미터 없음
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException e) {
        return fail(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.defaultMessage(),
                List.of(new FieldErrorItem(e.getParameterName(), "필수 값입니다.")));
    }

    // 본문이 JSON이 아니거나 깨짐
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadJson(HttpMessageNotReadableException e) {
        return fail(ErrorCode.BAD_JSON, ErrorCode.BAD_JSON.defaultMessage(), List.of());
    }

    // 없는 주소
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(NoResourceFoundException e) {
        return fail(ErrorCode.NOT_FOUND, "요청한 주소가 없습니다.", List.of());
    }

    // 주소는 있는데 메서드가 다름(DELETE /api/v1/health)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethod(HttpRequestMethodNotSupportedException e) {
        return fail(ErrorCode.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED.defaultMessage(), List.of());
    }

    // 그 밖의 예상 못 한 예외 — 원인은 로그에만 남기고, 응답에는 내부 정보를 싣지 않는다
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        log.error("처리하지 못한 예외", e);
        return fail(ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.defaultMessage(), List.of());
    }

    private ResponseEntity<ApiResponse<Void>> fail(ErrorCode code, String message, List<FieldErrorItem> errors) {
        return ResponseEntity.status(code.status()).body(ApiResponse.fail(code, message, errors));
    }
}
```

| 코드 | 설명 |
|---|---|
| `@RestControllerAdvice` | 모든 컨트롤러에 공통으로 붙는 "조언"이다. 컨트롤러 밖으로 나온 예외가 여기로 온다. 응답은 JSON |
| `@ExceptionHandler(ApiException.class)` | 이 타입(과 자식 타입) 예외를 이 메서드가 처리한다. 더 구체적인 타입의 처리기가 먼저 고려된다 — `Exception.class` 처리기는 다른 처리기가 없는 예외만 받는다 |
| `ResponseEntity<ApiResponse<Void>>` | 본문뿐 아니라 **상태 코드**까지 정해서 돌려주려고 `ResponseEntity`로 감쌌다. `Void`는 "data 자리에 아무것도 없음" |
| `e.getBindingResult().getFieldErrors()` | `@Valid`가 실패한 필드 목록. `getField()`는 필드 이름, `getDefaultMessage()`는 애노테이션에 적은 `message` |
| `.sorted(Comparator.comparing(FieldErrorItem::field))` | 필드 순서가 실행마다 달라지지 않게 이름순으로 정렬한다. `FieldErrorItem::field`는 "각 항목의 field()를 꺼내라"는 메서드 참조(람다 줄임) — [B6](../../lessons/B6-collections-optional-lambda.md) |
| `log.error("처리하지 못한 예외", e)` | 마지막 인자로 예외를 주면 스택트레이스가 로그에 남는다. 500은 반드시 로그로 원인을 남긴다 |

### HealthController — 틀로 감싸기

`HealthController`의 두 줄만 바꾼다.

```java
    @GetMapping("/api/v1/health")
    public ApiResponse<Map<String, Object>> health() {   // 반환 타입
        // … 그대로 …
        return ApiResponse.ok(body);                      // 감싸서 반환
    }
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- HealthController가 Map을 만들어 ApiResponse.ok(map)으로 감싼다
- 맞는 컨트롤러가 없어 Spring이 NoResourceFoundException을 던진다 → GlobalExceptionHandler가 잡아 공통 틀로

<details>
<summary>Controller — HTTP 연결</summary>

`HealthController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 변경된 메서드: `health`.

```java
@GetMapping("/api/v1/health")
public ApiResponse<Map<String, Object>> health() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("up", true);
    body.put("database", jdbcTemplate.queryForObject("SELECT DATABASE()", String.class));
    // users·posts·comments·likes도 10-1과 같이 채운다
    return ApiResponse.ok(body);
}
```

헬스 체크의 DB 조회는 10-1과 같다. 바뀐 부분은 `Map`을 반환하기 전에 `ApiResponse.ok`으로 감싼 응답 계약이다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`ApiResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 변경된 메서드: `ok`, `created`, `fail`.

```java
public record ApiResponse<T>(int status, String message,
        @JsonInclude(JsonInclude.Include.NON_NULL) String code,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<FieldErrorItem> errors,
        T data) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, "OK", null, null, data);
    }
}
```

성공의 `code`·`errors`는 JSON에서 빠지고, 실패의 `data: null`은 남는다. 전체 파일 접기에서 `created`와 `fail`도 이어서 확인한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiException.java`, `GlobalExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `code`, `handleApi`, `handleInvalid`, `handleTypeMismatch`.

```java
@ExceptionHandler(NoResourceFoundException.class)
public ResponseEntity<ApiResponse<Void>> handleNoResource(NoResourceFoundException e) {
    return fail(ErrorCode.NOT_FOUND, "요청한 주소가 없습니다.", List.of());
}

@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
public ResponseEntity<ApiResponse<Void>> handleMethod(HttpRequestMethodNotSupportedException e) {
    return fail(ErrorCode.METHOD_NOT_ALLOWED,
            ErrorCode.METHOD_NOT_ALLOWED.defaultMessage(), List.of());
}
```

이 단계의 C2·C3는 위 두 경로를 확인한다. 검증·깨진 JSON·예상 밖 예외도 같은 처리기 안의 별도 메서드에서 공통 틀로 만든다.

</details>

<details>
<summary>설정·보조 코드</summary>

`ErrorCode.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `status`, `defaultMessage`.

```java
NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 메서드입니다.");
```

`ErrorCode`는 HTTP 상태·기본 문구를 한곳에 묶는다. 이 단계에는 새 DB Mapper가 없고, MyBatis는 10-7의 선택 목록 실습에서 도입한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "H", "title": "성공 틀", "method": "GET", "path": "/api/v1/health" },
    { "id": "N", "title": "없는 주소", "method": "GET", "path": "/api/v1/no-such-path" },
    { "id": "M", "title": "틀린 메서드", "method": "DELETE", "path": "/api/v1/health" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "H",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.status", "equals": 200 },
          { "path": "$.message", "equals": "OK" },
          { "path": "$.data.up", "equals": true },
          { "path": "$.data.database", "equals": "project" },
          { "path": "$.code", "exists": false },
          { "path": "$.errors", "exists": false }
        ]
      }
    },
    {
      "id": "C2",
      "request": "N",
      "expect": {
        "status": 404,
        "json": [
          { "path": "$.status", "equals": 404 },
          { "path": "$.code", "equals": "NOT_FOUND" },
          { "path": "$.message", "type": "string" },
          { "path": "$.errors", "equals": [] },
          { "path": "$.data", "type": "null" }
        ]
      }
    },
    {
      "id": "C3",
      "request": "M",
      "expect": {
        "status": 405,
        "json": [
          { "path": "$.status", "equals": 405 },
          { "path": "$.code", "equals": "METHOD_NOT_ALLOWED" },
          { "path": "$.errors", "equals": [] },
          { "path": "$.data", "type": "null" }
        ]
      }
    }
  ]
}
```

10-1의 확인(C1)은 이제 실패한다. 응답이 틀로 감싸졌기 때문이고, 정상이다.

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 H | 상태 `200`, 본문 `status`=`200`, `message`=`OK`, `data.up`=`true`, `data.database`=`project`. 성공 응답에 `code`·`errors` 키가 **없다** |
| C2 | 요청 N | 상태 `404`, 본문 `status`=`404`, `code`=`NOT_FOUND`, `message`는 문자열, `errors`=`[]`, `data`=`null` |
| C3 | 요청 M | 상태 `405`, 본문 `code`=`METHOD_NOT_ALLOWED`, `errors`=`[]`, `data`=`null` |
| R1 | 처리 위치 | 실패를 컨트롤러의 try/catch가 아니라 `@RestControllerAdvice` 한 곳에서 공통 틀로 바꾼다 |
| R2 | 500 | 예상 못 한 예외는 500 `INTERNAL_ERROR`로 답하고, 원인(스택트레이스)은 로그에만 남긴다. 응답에 예외 메시지·클래스 이름을 싣지 않는다 |
| R3 | 400 준비 | `@Valid` 실패(필드별 `errors`)와 깨진 JSON(`BAD_JSON`) 처리기가 있다 — 10-3에서 확인한다 |

## 일부러 망가뜨리기

하나씩 바꾸고 다시 띄운 뒤 확인한다. 끝나면 되돌린다. 모두 Boot 4.1.1에서 재현한 결과다.

### ① `@RestControllerAdvice`를 지운다 → Spring 기본 에러 모양

없는 주소 `GET /api/v1/nothing-here`를 보낸다(요청 N과 같은 경우).

```text
{"timestamp":"2026-10-09T15:18:20.585Z","status":404,"error":"Not Found","path":"/api/v1/nothing-here"}
```

- 읽는 법: 처리기 클래스는 있지만 애노테이션이 없으면 Spring이 그 클래스를 모른다. 예외가 Spring Boot의 기본 에러 처리(`/error`)로 가서 다른 모양이 나간다. `code`가 없으니 프론트 래퍼가 실패를 알아보지 못한다.
- 고치기: 클래스 위에 `@RestControllerAdvice`를 다시 붙인다.

### ② `NoResourceFoundException` 처리기를 지운다 → 없는 주소가 500

`@ExceptionHandler(NoResourceFoundException.class)` 한 줄을 주석으로 막고 `GET /api/v1/nothing-here`를 보낸다.

```text
{"status":500,"message":"서버 오류가 발생했습니다.","code":"INTERNAL_ERROR","errors":[],"data":null}
```

로그:

```text
ERROR ... o.e.board.common.GlobalExceptionHandler  : 처리하지 못한 예외

org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/v1/nothing-here for request '/api/v1/nothing-here'.
```

- 읽는 법: Spring 6.1부터는 맞는 컨트롤러가 없을 때 "정적 파일도 없다"는 예외(`NoResourceFoundException`)를 던진다. 전용 처리기가 없으면 마지막 `Exception` 처리기가 받아서 500이 된다. 오타 주소 하나가 "서버 오류"로 둔갑한다.
- 고치기: 처리기를 되돌린다. **`Exception` 전체를 잡는 처리기를 둘 때는, Spring이 원래 4xx로 답하던 예외를 빠뜨리지 않았는지** 본다(405·400도 같은 이유로 처리기를 따로 두었다).

### ③ `ApiResponse`의 `@JsonInclude`를 지운다 → 성공에도 `code: null`

요청 H를 보낸다.

```text
{"status":200,"message":"OK","code":null,"errors":null,"data":{"up":true,"database":"project","users":3,"posts":25,"comments":40,"likes":30}}
```

에러는 아니지만 명세서의 성공 모양과 다르다. 프론트 래퍼가 `"code" in body`로 실패를 판단하면 성공도 실패로 오해한다. C1이 실패한다.

## 필요한 지식

- [D1 JSON과 Jackson](../../lessons/D1-json-jackson.md) — 응답 객체가 JSON이 되는 규칙, null·날짜 처리
- [A5 REST API 설계와 명세서 읽기](../../lessons/A5-rest-api-design.md) — 공통 응답 틀과 ProblemDetail 비교
- [F1 검증과 에러 응답이 왜 필요한가](../../lessons/F1-validation-errors.md) — 400을 어떻게 알려 줄까
- [B7 예외](../../lessons/B7-exceptions.md) — `RuntimeException`, 체크·언체크
- [B3 static과 안쪽 클래스](../../lessons/B3-static-and-inner-classes.md) — 정적 팩토리 메서드, record 안의 record
- [W08 예외는 어디서 처리하나](../../docs/knowledge/W08-where-to-handle-exceptions.md)
- [P16 JSON·Jackson](../../docs/knowledge/P16-json-jackson-practical.md) — `@JsonInclude`, null 처리

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 응답이 여전히 기본 에러 모양이다</summary>

처리기 클래스가 `org.example.board` 아래 패키지에 있는지 본다. `@SpringBootApplication`이 붙은 클래스의 패키지와 그 아래만 Spring이 찾는다. 애노테이션은 `@ControllerAdvice`가 아니라 `@RestControllerAdvice`(JSON 응답)다.
</details>

<details>
<summary>힌트 2 — 상태 코드는 200인데 본문 status가 404다</summary>

처리기 메서드가 `ApiResponse`를 그냥 반환하면 HTTP 상태는 기본값 200이다. `ResponseEntity.status(code.status()).body(...)`로 상태까지 정한다(또는 메서드에 `@ResponseStatus`).
</details>

<details>
<summary>힌트 3 — 헬스 체크가 data 안에 또 status를 갖는다</summary>

`body.put("status", ...)` 같은 키를 Map에 넣지 않았는지 본다. 틀의 `status`와 헷갈린다. 헬스 정보는 `up`·`database`·숫자들만 둔다.
</details>

## 다음 단계

[10-3. 회원 가입](10-3-signup.md) — 첫 입력 API. 비밀번호는 BCrypt 해시로 저장하고, 이메일이 겹치면 409, 입력이 틀리면 이 단계에서 만든 400 틀로 답한다.
