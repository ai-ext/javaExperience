# 1-1. 요청 받기 — 일단 success

## 상황

프론트 개발자가 글쓰기 화면을 만들면서 이렇게 말했다.

> "저장 버튼 누르면 이 JSON을 `POST /api/posts`로 보낼게요. 일단 받아지기만 하면 돼요."

아직 저장도, 응답 형식도 정하지 않았다. **요청이 서버에 들어오는 입구부터 연다.** 요청을 받아서 객체로 바꾸고, 받았다는 표시로 `success`만 돌려준다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts` |
| 요청 헤더 | `Content-Type: application/json` |
| 요청 본문 | 아래 JSON — 전용 요청 클래스로 받는다 |
| 응답 | 상태 `200`, 본문은 문자열 `success` |
| 그 밖에 | 받은 제목(title)을 로그로 남긴다 |

요청 본문:

```json
{
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC"
}
```

| 필드 | 타입 | 뜻 |
|---|---|---|
| `boardSlug` | 문자열 | 게시판 주소 이름 — `notice`, `dev`, `qna`, `free` |
| `title` | 문자열 | 제목 |
| `content` | 문자열 | 본문 |
| `tags` | 문자열 배열 | 태그 이름들 |
| `visibility` | 문자열 | 공개 범위 — `PUBLIC`(전체) 또는 `FOLLOWERS`(팔로워만) |

이 단계에서는 값이 맞는지 검사하지 않는다(1-5에서 한다).

## 직접 확인

```bash
BASE=http://localhost:8080   # 서버 주소가 다르면 여기만 바꾼다

# 요청 A — 정상 요청
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}'

# 요청 B — 깨진 JSON(닫는 괄호 없음)
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' -d '{"title": "[채점] 깨짐"'
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용 — 통과/실패에 넣지 않는다).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, 본문이 정확히 `success` |
| C2 | 요청 B | 상태 `400` |
| R1 | 컨트롤러 | `@RestController`이고 `POST /api/posts`에 매핑되어 있다(`@PostMapping`, 또는 클래스의 `@RequestMapping("/api/posts")` + `@PostMapping`) |
| R2 | 요청 객체 | 본문을 `Map`이나 `String`이 아니라 전용 클래스(권장: `record`, 예: `PostCreateRequest`)로 받는다. 필드 이름이 JSON과 같다 |
| R3 | 로그 | 받은 제목을 SLF4J 로거로 남긴다(`System.out.println`이 아님). 자리표시자 `{}`를 쓴다 |

## 필요한 지식

- [W01 API 하나 만들 때 실제 작업 순서](../../docs/knowledge/W01-api-dev-order.md) — 지금 어디부터 만드는지 감 잡기
- [P03 애노테이션 — 웹 매핑과 입력 위치](../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치) — `@RestController`, `@PostMapping`, `@RequestBody`
- [P16 JSON·Jackson — `@RequestBody`가 동작하는 지점](../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점) — JSON이 객체가 되는 과정과 400이 나는 이유
- [P16 — 요청과 응답은 DTO로 고정한다](../../docs/knowledge/P16-json-jackson-practical.md#21-요청과-응답은-dto로-고정한다)
- [W07 왜 System.out.println 대신 로거를 쓰나](../../docs/knowledge/W07-why-logger.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 파일을 만들까</summary>

`org.example` 아래에 게시글 기능용 패키지(예: `org.example.post`)를 하나 만들고, 컨트롤러 클래스 하나와 요청 `record` 하나로 시작한다. `HelloController`가 어떻게 생겼는지 먼저 보자.
</details>

<details>
<summary>힌트 2 — 본문을 객체로 받기</summary>

컨트롤러 메서드의 매개변수에 `@RequestBody`를 붙이면 Spring이 JSON을 그 타입으로 바꿔 준다. `record`의 구성 요소 이름이 JSON 필드 이름과 같아야 한다. 반환 타입이 `String`이면 그 문자열이 그대로 응답 본문이 된다.
</details>

<details>
<summary>힌트 3 — 로거</summary>

`private static final Logger log = LoggerFactory.getLogger(클래스이름.class);` (`org.slf4j`) 후 `log.info("게시글 작성 요청: {}", ...)`.
</details>

## 다음 단계

[1-2. DTO로 응답하기](1-2-dto-response.md) — `success` 대신 만든 글의 정보를 JSON으로 돌려준다. 그러면 이 단계의 채점(C1)은 실패하게 되는데, 정상이다.
