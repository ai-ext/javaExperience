# F1. 검증과 에러 응답(ProblemDetail)

> 개념 레슨 · 30분

## 이게 뭐냐

API는 요청을 보내는 쪽(클라이언트 — 브라우저·앱·curl)이 무엇이든 받는다. 클라이언트가 "제목은 비면 안 된다"를 미리 검사했더라도 서버는 그 검사를 믿을 수 없다.

- curl·Postman·다른 서버는 화면 없이 바로 요청을 보낸다.
- 화면에서 도는 검사는 사용자 손에 있다. 건너뛰고 요청만 다시 보낼 수 있다.
- 클라이언트가 늘면(모바일 앱, 관리자 화면) 그쪽 검사는 또 따로다.

그래서 **서버 검증은 마지막 문**(데이터를 지키기)이다. 클라이언트가 검사했든 말든 서버는 다시 본다.

### 에러 응답도 약속이다

검증에 걸렸을 때 클라이언트는 **어느 칸이 왜** 틀렸는지 사용자에게 알려 줘야 한다. 그러려면 응답에 그 정보가 정해진 모양으로 들어 있어야 한다. 에러마다 모양이 다르면 클라이언트가 응답마다 따로 해석해야 한다.

표준 형식이 있다. **RFC 9457 Problem Details**다. Spring에서는 `ProblemDetail` 클래스가 이 모양을 만든다.

| 필드 | 뜻 | 예 |
|---|---|---|
| `status` | 상태 코드(응답 줄의 숫자와 같다) | `400` |
| `title` | 상태 코드의 이름 | `Bad Request` |
| `detail` | 사람이 읽을 설명 | `입력값이 올바르지 않습니다.` |
| `instance` | 문제가 난 요청 경로 | `/api/posts` |
| (확장) `errors` | 우리가 정해 덧붙인 필드별 목록 | `[{"field":"title","message":"…"}]` |

응답 헤더 `Content-Type`은 `application/json`이 아니라 `application/problem+json`이다. "이건 에러 설명서"라는 표시다.

### 상태 코드로 먼저 갈라 준다

| 코드 | 뜻 | 누가 고치나 | 이 게시판에서 |
|---|---|---|---|
| `400` | 요청 모양이 틀렸다 | 보낸 쪽 | 빈 제목, 태그 6개, 깨진 JSON |
| `401` | 누군지 모르겠다 | 보낸 쪽(로그인) | 토큰 없음(F2) |
| `403` | 누군지는 아는데 안 된다 | — | 일반 회원이 공지 게시판에 쓰기 |
| `404` | 대상이 없다 | 보낸 쪽 | 없는 게시판 `nope` |
| `500` | **서버가 잘못했다** | 서버 개발자 | 처리 안 한 예외 |

`500`은 "네 잘못이 아니니 고쳐서 다시 보내도 소용없다"는 뜻이다. 사용자가 고칠 수 있는 실수를 `500`으로 돌려주면 안 된다.

### Spring에서 쓰는 도구

| 하는 일 | Spring |
|---|---|
| 규칙 적기 | DTO 필드에 `@NotBlank`, `@Size(max = 200)`, `@Pattern` (Bean Validation) |
| 규칙 돌리기 | 컨트롤러 매개변수에 `@Valid` |
| 실패를 응답으로 | `@RestControllerAdvice` 클래스의 `@ExceptionHandler` 메서드 — 모든 컨트롤러의 예외를 한 곳에서 |

`@Valid`에 걸리면 Spring은 `MethodArgumentNotValidException`을 던진다. 이 예외를 컨트롤러마다 `try/catch`로 잡지 않고, `@RestControllerAdvice` **한 곳**에서 잡아 `ProblemDetail`로 바꾼다.

비슷해 보이는 어노테이션 셋은 막는 범위가 다르다.

| | `null` | `""` | `"   "` |
|---|---|---|---|
| `@NotNull` | 막음 | 통과 | 통과 |
| `@NotEmpty` | 막음 | 막음 | 통과 |
| `@NotBlank` | 막음 | 막음 | 막음 |

제목·본문처럼 "글자가 있어야 하는" 문자열에는 `@NotBlank`를 쓴다.

## 예시

같은 요청 `{"title": "", "content": "본문", …}`(빈 제목)을 세 단계 코드에 보냈다. 실습 레포의 1-5 정답 코드에서 한 부분씩 빼 가며 실제로 받은 응답이다.

**① 검증 없음** — DTO에 규칙이 있어도 `@Valid`가 없으면 아무도 검사하지 않는다.

```text
HTTP/1.1 201
Location: /api/posts/24

{"id":24,"boardSlug":"dev","title":"","content":"   ",…}
```

```text
$ sql "SELECT id, CONCAT('[', title, ']') AS title, CONCAT('[', content, ']') AS content FROM post ORDER BY id DESC LIMIT 1"
+----+-------+---------+
| id | title | content |
+----+-------+---------+
| 24 | []    | [   ]   |
+----+-------+---------+
```

빈 제목, 공백뿐인 본문이 DB에 들어갔다. `title` 열은 `NOT NULL`이지만 빈 문자열은 `NULL`이 아니라서 DB도 막지 않는다.

**② `@Valid`만 있고 에러 처리 없음** — 막기는 막는다.

```text
HTTP/1.1 400
Content-Type: application/json

{"timestamp":"2026-10-09T15:10:08.616Z","status":400,"error":"Bad Request","path":"/api/posts"}
```

`400`은 맞다. 그런데 **어느 필드가 왜** 틀렸는지가 없다. 서버 로그에는 있다.

```text
WARN … .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.bind.MethodArgumentNotValidException: Validation failed for argument [0] in public … PostController.create(org.example.post.PostCreateRequest): [Field error in object 'postCreateRequest' on field 'title': rejected value []; codes [NotBlank.postCreateRequest.title,…]; … default message [제목을 입력해 주세요.]] ]
```

같은 상태에서 없는 게시판(`"boardSlug":"nope"`)을 보내면 서비스가 던진 예외를 아무도 처리하지 않아 `500`이 된다.

```text
HTTP/1.1 500
Content-Type: application/json

{"timestamp":"2026-10-09T15:10:08.878Z","status":500,"error":"Internal Server Error","path":"/api/posts"}
```

**③ `@Valid` + `@RestControllerAdvice`** — 1-5의 목표 모양이다.

```text
HTTP/1.1 400
Content-Type: application/problem+json

{"detail":"입력값이 올바르지 않습니다.","instance":"/api/posts","status":400,"title":"Bad Request","errors":[{"message":"제목을 입력해 주세요.","field":"title"}]}
```

공백 본문 + 태그 6개를 보내면 **둘 다** 담긴다. 사용자가 한 번에 다 고칠 수 있다.

```text
{"detail":"입력값이 올바르지 않습니다.","instance":"/api/posts","status":400,"title":"Bad Request","errors":[{"message":"태그는 5개까지입니다.","field":"tags"},{"message":"본문을 입력해 주세요.","field":"content"}]}
```

없는 게시판과 공지 게시판은 서비스가 판단하고, 각각 `404`·`403`으로 나간다.

```text
HTTP/1.1 404
Content-Type: application/problem+json

{"detail":"게시판을 찾을 수 없습니다: nope","instance":"/api/posts","status":404,"title":"Not Found"}
```

```text
HTTP/1.1 403
Content-Type: application/problem+json

{"detail":"이 게시판에는 글을 쓸 권한이 없습니다: notice","instance":"/api/posts","status":403,"title":"Forbidden"}
```

③의 핵심만 줄인 코드다. 위 응답들은 실습 레포 정답 코드(`instance` 설정, `null` 메시지 처리, 404·403 처리 포함)로 실측했다.

```java
// DTO — 규칙을 적는다
public record PostCreateRequest(
        @NotBlank(message = "게시판을 선택해 주세요.") String boardSlug,
        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하여야 합니다.") String title,
        // … 나머지 필드
) {}

// 컨트롤러 — @Valid가 규칙을 돌린다
public ResponseEntity<PostResponse> create(@Valid @RequestBody PostCreateRequest request) { … }

// 모든 컨트롤러의 에러를 한 곳에서 ProblemDetail로
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
                .toList();
        problem.setProperty("errors", errors);   // 틀린 필드를 모두 담는다
        return problem;                          // Spring이 application/problem+json으로 내보낸다
    }
    // 404·403·깨진 JSON 처리는 1-5에서 이어서 만든다
}
```

## 따라 해 보기

10분. 1-4까지 끝낸 실습 레포에서 한다.

**1. 지금 서버가 빈 제목을 받아 주는지 본다.**

```bash
curl -i -X POST http://localhost:8080/api/posts -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"","content":"   ","tags":[],"visibility":"PUBLIC"}'
```

`201`이 나오면 예시 ①과 같은 상태다. E2의 `sql` 함수로 `sql "SELECT id, CONCAT('[', title, ']') AS title FROM post ORDER BY id DESC LIMIT 1"`을 실행해 `[]`가 들어간 것을 확인한다.

**2. 규칙 하나와 `@Valid`를 넣는다.** `PostCreateRequest`의 `title` 앞에 `@NotBlank(message = "제목을 입력해 주세요.")`(`import jakarta.validation.constraints.NotBlank;`)를, 컨트롤러 매개변수 앞에 `@Valid`(`import jakarta.validation.Valid;`)를 붙인다. 서버를 다시 켜고 같은 curl을 보낸다.

- 응답이 예시 ②처럼 `400`과 `timestamp`·`status`·`error`·`path`뿐인지 본다.
- 서버 로그에서 `MethodArgumentNotValidException`이 들어간 `WARN` 줄을 찾아, `on field 'title'`과 `default message [제목을 입력해 주세요.]`를 읽는다. 응답에 담고 싶은 정보가 여기 다 있다.

**3. 생각해 본다.** 클라이언트가 "제목 칸이 틀렸다"를 알려 주려면 이 로그의 무엇이 응답 본문으로 나가야 하나? 그 일을 하는 곳이 `@RestControllerAdvice`이고, 1-5에서 만든다.

## 일부러 틀려 보기

**1. `@Valid`만 빼 본다** — 예시 ①이 된다. DTO의 `@NotBlank`는 **표시**일 뿐이다(B8: 어노테이션은 누군가 읽어야 일이 생긴다). 읽고 실행하는 쪽이 `@Valid`다. 빈 제목이 `201`로 저장되면 가장 먼저 `@Valid`가 붙었는지 본다.

**2. 에러 처리에서 업무 예외를 빠뜨린다** — `@RestControllerAdvice`에 검증 예외만 처리하고 `BoardNotFoundException`을 빼면, 없는 게시판이 예시 ②의 `500`이 된다. 서버 로그에는 `ERROR … Request processing failed: org.example.board.BoardNotFoundException: 게시판을 찾을 수 없습니다: nope`가 남는다. 사용자 잘못을 서버 잘못으로 알리는 셈이다.

**3. JSON을 깨뜨린다** — `-d '{"title": "깨짐"'`(닫는 괄호 없음). 이건 `@Valid`까지 가지도 못한다. JSON을 객체로 바꾸는 단계에서 `HttpMessageNotReadableException`이 난다. 검증 예외와 **다른 예외**라서 따로 처리해야 한다. 정답 코드의 응답은 이렇다.

```text
HTTP/1.1 400
Content-Type: application/problem+json

{"detail":"요청 본문을 읽을 수 없습니다.","instance":"/api/posts","status":400,"title":"Bad Request"}
```

→ [에러 도감: 깨진 JSON (400)](../errors.md#깨진-json-400)

## 확인 문제

**1.** 이 API를 부르는 웹 화면은 제목이 비면 전송 버튼을 막는다. 그래도 서버에서 `@Valid`로 또 검사해야 하는 이유를 두 가지 대라.

<details>
<summary>정답</summary>

- API는 우리 화면 말고도 curl·Postman·다른 서비스·다른 앱이 부를 수 있다. 화면의 검사는 그 요청들을 막지 못한다.
- 화면에서 도는 검사는 사용자 손에 있다. 검사를 건너뛰거나 요청을 고쳐 다시 보낼 수 있다.

클라이언트 검증은 빨리 알려 주는 편의, 서버 검증은 데이터를 지키는 마지막 문이다.
</details>

**2.** 각 상황의 상태 코드는? ㉠ 제목이 201자 ㉡ `boardSlug`가 `nope` ㉢ 일반 회원이 공지 게시판에 씀 ㉣ 서비스 코드에서 `NullPointerException`

<details>
<summary>정답</summary>

㉠ `400`(요청 모양이 틀림) ㉡ `404`(대상이 없음) ㉢ `403`(누군지는 아는데 권한이 없음) ㉣ `500`(서버 코드의 잘못 — 보낸 쪽이 고칠 수 없다).
</details>

**3.** DTO의 `title`에 `@NotBlank`를 붙였는데 빈 제목이 여전히 `201`로 저장된다. 가장 먼저 의심할 곳은?

<details>
<summary>정답</summary>

컨트롤러 매개변수의 **`@Valid`**. `@NotBlank`는 규칙을 적어 둔 표시일 뿐이고, 그 규칙을 실행시키는 것이 `@Valid`다. 없으면 검사가 아예 안 돈다(예시 ①).
</details>

**4.** 공백 본문 + 태그 6개 요청에 `errors`를 첫 번째 것 하나만 담아 돌려주면 무엇이 불편한가?

<details>
<summary>정답</summary>

사용자는 본문을 고쳐 다시 보낸 뒤에야 태그도 틀렸다는 걸 안다. 고치고 보내기를 틀린 개수만큼 반복해야 한다. 틀린 필드를 **모두** 담으면 화면이 각 칸 아래에 한 번에 표시할 수 있다(1-5 채점 C3).
</details>

**5.** `title`이 `"   "`(공백 세 칸)일 때 `@NotNull`·`@NotEmpty`·`@NotBlank` 중 막는 것은?

<details>
<summary>정답</summary>

**`@NotBlank`만.** `"   "`는 `null`이 아니고(`@NotNull` 통과) 길이가 3이라 비어 있지도 않다(`@NotEmpty` 통과). `@NotBlank`는 앞뒤 공백을 빼고도 글자가 있어야 통과한다.
</details>

## 더 깊이

- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 클라이언트·서버·DB 각 층이 맡는 검사
- [W10 — 서버: DTO 제약과 검증 오류 응답](../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답)
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 컨트롤러별 처리와 전역 Advice
- [P03 — 요청 검증](../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증) · [예외 응답](../docs/knowledge/P03-annotations-cheatsheet.md#25-예외-응답)
- [S05 — RFC 9457 응답에 ProblemDetail과 전역 Advice를 어떻게 쓰나](../docs/knowledge/S05-mvc-request-flow.md#q5-rfc-9457-응답에-problemdetail과-전역-advice를-어떻게-쓰는가)

## 다음

- 실습: [1-5. 입력 검증과 에러 응답](../scenario/ch1-create-post/1-5-validation.md) — 규칙 전부와 `400`·`404`·`403`을 `ProblemDetail`로 만든다.
- 레슨: [F2. 인증과 토큰](F2-auth-token.md) — `401`은 언제인가. 서버가 "누가 보냈는지" 아는 법.
