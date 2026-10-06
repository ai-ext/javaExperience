# 1-5. 입력 검증과 에러 응답

## 상황

프론트 화면이 빈 제목을 막아 줘도, API는 curl·Postman·다른 서비스 누구나 호출할 수 있다. 지금은 빈 제목도, 없는 게시판도 그대로 들어오거나 500이 난다.

**잘못된 요청은 저장 전에 막고, 무엇이 왜 틀렸는지 정해진 형식으로 알려 준다.**

## 만들 것

**입력 규칙**

| 필드 | 규칙 |
|---|---|
| `boardSlug` | 필수 |
| `title` | 필수, 공백만 있으면 안 됨, 200자 이하 |
| `content` | 필수, 공백만 있으면 안 됨 |
| `tags` | 없어도 됨(`null`이나 `[]`). 있으면 최대 5개, 각 이름 1~30자 |
| `visibility` | `PUBLIC` 또는 `FOLLOWERS`. **생략하면 `PUBLIC`** |

**게시판 규칙**

| 상황 | 상태 |
|---|---|
| 없는 `boardSlug` | `404` |
| 글쓰기가 운영자 전용인 게시판(`board.write_role = 'ADMIN'`, 예: `notice`)에 일반 회원(지금은 작성자 고정 = 김자바)이 쓴다 | `403` |

**에러 응답 형식** — 모든 에러(400·403·404)에 공통이다. 표준 형식인 RFC 9457 Problem Details를 쓴다.

- `Content-Type: application/problem+json`
- 본문에 `status`(숫자)와 사람이 읽을 `detail`을 담는다.
- 400(입력 오류)이면 `errors` 배열에 **틀린 필드를 모두** 담는다. 첫 번째 필드만 담으면 안 된다.

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "입력값이 올바르지 않습니다.",
  "instance": "/api/posts",
  "errors": [
    { "field": "content", "message": "본문을 입력해 주세요." },
    { "field": "tags", "message": "태그는 5개까지입니다." }
  ]
}
```

검증에 실패한 요청은 아무것도 저장하지 않는다(글도, 새 태그도).

## 직접 확인

```bash
BASE=http://localhost:8080
post() { curl -s -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' -d "$1"; echo; echo ----; }

# V1 — 빈 제목
post '{"boardSlug":"dev","title":"","content":"본문","tags":[],"visibility":"PUBLIC"}'
# V2 — 제목 201자('[채점] 검증-실패-' 11자 + 0 190개)
T="[채점] 검증-실패-$(printf '%0190d' 0)"
post "{\"boardSlug\":\"dev\",\"title\":\"$T\",\"content\":\"본문\",\"tags\":[],\"visibility\":\"PUBLIC\"}"
# V3 — 공백 본문 + 태그 6개
post '{"boardSlug":"dev","title":"[채점] 검증-실패-본문태그","content":"   ","tags":["a","b","c","d","e","f"],"visibility":"PUBLIC"}'
# V4 — 없는 공개 범위
post '{"boardSlug":"dev","title":"[채점] 검증-실패-공개범위","content":"본문","tags":[],"visibility":"SECRET"}'
# V5 — 공개 범위 생략(통과해야 한다)
post '{"boardSlug":"dev","title":"[채점] 검증-통과","content":"본문","tags":["spring"]}'
# V6 — 없는 게시판
post '{"boardSlug":"nope","title":"[채점] 검증-실패-게시판","content":"본문","tags":[],"visibility":"PUBLIC"}'
# V7 — 운영자 전용 게시판
post '{"boardSlug":"notice","title":"[채점] 검증-실패-공지","content":"본문","tags":[],"visibility":"PUBLIC"}'
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). 요청은 위 V1~V7을 그대로 쓴다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | V1 | `400`, `Content-Type: application/problem+json`, `errors`에 `field`가 `title`인 항목 |
| C2 | V2 | `400`, `errors`에 `title` |
| C3 | V3 | `400`, `errors`에 `content`와 `tags`가 **둘 다** 있다 |
| C4 | V4 | `400`, `Content-Type: application/problem+json`(`errors`는 없어도 된다) |
| C5 | V5 | `201`, 응답 `visibility` = `PUBLIC` |
| C6 | V6 | `404`, `Content-Type: application/problem+json`, `detail`이 있다 |
| C7 | V7 | `403`, `Content-Type: application/problem+json`, `detail`이 있다 |
| C8 | 아무 오류 응답 | 본문 `status` 값이 응답 상태 코드와 같다. 스택 트레이스·예외 클래스 이름이 보이지 않는다 |
| D1 | `SELECT COUNT(*) FROM post WHERE title LIKE '[채점] 검증-실패%'` | `0` |
| D2 | `SELECT COUNT(*) FROM tag WHERE name IN ('a','b','c','d','e','f')` | `0` — 실패한 요청이 태그를 만들지 않았다 |
| R1 | 입력 검증 | 요청 DTO에 Bean Validation 애노테이션(`@NotBlank`, `@Size` 등) + 컨트롤러에 `@Valid` |
| R2 | 에러 응답 | `@RestControllerAdvice` 한 곳에서 `ProblemDetail`로 만든다. 컨트롤러마다 `try-catch`가 없다 |
| R3 | 업무 오류 | 게시판 없음·권한 없음은 서비스가 판단하고, 의미가 드러나는 예외(예: `BoardNotFoundException`)로 던진다 |
| R4 | 순서 | 검증·게시판 확인이 저장보다 먼저이거나, 같은 트랜잭션이라 실패 시 함께 롤백된다 |
| R5 | 기본값 | `visibility` 생략 → `PUBLIC`을 한 곳(DTO 또는 서비스)에서 정한다 |

## 필요한 지식

- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 프론트에서 막아도 서버가 또 검사하는 이유
- [W10 — 서버: DTO 제약과 검증 오류 응답](../../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — 컨트롤러별 처리와 전역 Advice
- [P03 — 요청 검증](../../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증) · [예외 응답](../../docs/knowledge/P03-annotations-cheatsheet.md#25-예외-응답)
- [S05 — RFC 9457 응답에 ProblemDetail과 전역 Advice를 어떻게 쓰나](../../docs/knowledge/S05-mvc-request-flow.md#q5-rfc-9457-응답에-problemdetail과-전역-advice를-어떻게-쓰는가)
- [P16 — Enum은 이름과 표시값을 분리한다](../../docs/knowledge/P16-json-jackson-practical.md#27-enum은-이름과-표시값을-분리한다) — V4가 어디서 실패하는지

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 예외가 나나</summary>

`@Valid` 검증에 실패하면 `MethodArgumentNotValidException`, JSON을 객체로 못 바꾸면(V4의 `SECRET`처럼 enum에 없는 값, 깨진 JSON) `HttpMessageNotReadableException`이 난다. 서로 다른 예외라 Advice에서 각각 처리한다.
</details>

<details>
<summary>힌트 2 — problem+json</summary>

`ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "...")`로 만들고 `setProperty("errors", 목록)`. `@ExceptionHandler` 메서드가 `ProblemDetail`을 반환하면 Spring이 `application/problem+json`으로 내보낸다. `ResponseEntityExceptionHandler`를 상속하는 방법도 있다.
</details>

<details>
<summary>힌트 3 — 403과 404</summary>

`board.write_role`이 `ADMIN`인데 작성자 `member.role`이 `ADMIN`이 아니면 403. 이 판단은 서비스에서 하고, 예외 → 상태 코드 매핑은 Advice에서 한다.
</details>

## 다음 단계

[1-6. 토큰으로 작성자 정하기](1-6-token-auth.md) — 고정된 작성자(김자바)를 요청한 사람으로 바꾼다.
