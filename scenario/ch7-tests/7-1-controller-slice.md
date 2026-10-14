# 7-1. 컨트롤러 슬라이스 테스트

## 상황

지금까지 확인은 서버를 띄우고 curl을 보내는 식이었다. 코드를 고칠 때마다 사람이 다시 해야 한다. 이제 **자동으로 도는 테스트**로 계약을 고정한다.

첫 번째는 **컨트롤러만** 시험하는 테스트다. DB도 서비스도 띄우지 않고(가짜로 바꾸고), "이 요청이 오면 이 상태 코드·헤더·JSON이 나간다"는 HTTP 계약만 빠르게 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "IntelliJ에서 컨트롤러 테스트 실행",
  "summary": "서버를 띄우지 않고 MockMvc가 가짜 HTTP 요청을 컨트롤러에 넣는다. DB도 서비스도 진짜가 아니다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "IntelliJ — PostControllerTest"
    },
    {
      "type": "code",
      "id": "run",
      "label": "실행",
      "value": "./gradlew test --tests org.example.post.PostControllerTest"
    },
    {
      "type": "code",
      "id": "result",
      "label": "결과",
      "value": "PostControllerTest > 올바른 토큰이면 201과 Location() PASSED\nPostControllerTest > 빈 제목이면 400 problem+json() PASSED\nPostControllerTest > 토큰이 없으면 401() PASSED\nPostControllerTest > 없는 글이면 404() PASSED"
    },
    {
      "type": "text",
      "id": "note",
      "value": "실행 로그에 HikariPool·Testcontainers가 없다 — DB를 띄우지 않았다",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "201 시나리오",
      "steps": [
        {
          "kind": "user",
          "text": "테스트를 실행한다(▶ 또는 gradlew)",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"제목\", ...}  ← MockMvc가 만든 요청"
        },
        {
          "kind": "server",
          "text": "@WebMvcTest: 컨트롤러·검증·Advice는 진짜, PostService는 @MockitoBean 가짜 — given(postService.create(...)).willReturn(응답)"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/1"
          ],
          "body": "{\"id\": 1, \"author\": {\"id\": 2, ...}}"
        },
        {
          "kind": "screen",
          "text": "status·header·jsonPath까지 단언하고 통과",
          "focus": [
            "result"
          ]
        }
      ]
    },
    {
      "name": "400 시나리오",
      "steps": [
        {
          "kind": "user",
          "text": "빈 제목 테스트",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"title\": \"\"}"
        },
        {
          "kind": "server",
          "text": "검증에서 막혀 서비스가 불리지 않는다 — then(postService).shouldHaveNoInteractions()로 확인"
        },
        {
          "kind": "response",
          "status": 400,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "통과 — 0.x초",
          "focus": [
            "result",
            "note"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

테스트 클래스 **`PostControllerTest`** (이름 그대로) — `@WebMvcTest(PostController.class)`

| # | 시나리오 | 단언 |
|---|---|---|
| 1 | 올바른 토큰 + 올바른 본문으로 `POST /api/posts` | `201`, `Location` 헤더, `$.author.id` |
| 2 | 빈 제목으로 `POST /api/posts` | `400`, `Content-Type: application/problem+json`, `errors`에 `title` |
| 3 | 토큰 없이 `POST /api/posts` | `401` |
| 4 | 서비스가 "글 없음" 예외를 던질 때 `GET /api/posts/{id}` | `404` |

- 서비스는 `@MockitoBean`으로 가짜로 바꾸고, 각 테스트에서 돌려줄 값을 정한다(`given(...).willReturn(...)`).
- 1-6의 토큰 확인 부품(인터셉터·ArgumentResolver 등)이 리포지토리를 쓴다면 그 리포지토리도 `@MockitoBean`으로 바꾸고 "토큰 → 회원"을 정해 준다.
- 그 부품이 `Clock` 같은 **설정 빈**(`@Configuration`)을 주입받는다면 `@WebMvcTest`는 일반 `@Configuration`을 읽지 않으므로 `@Import(ClockConfig.class)`처럼 직접 가져온다.
- 서비스가 엔티티를 돌려주고 컨트롤러가 DTO로 바꾸는 구조(1-3)라면, 테스트에서 id·게시판이 채워진 엔티티를 mock으로 꾸며야 한다. 서비스가 응답 DTO(또는 결과 객체)를 돌려주면 슬라이스 테스트가 훨씬 쉬워진다 — 구조를 고를 때의 트레이드오프다.
- DB 없이 돌아야 한다. 이 테스트만 돌리면 Testcontainers MySQL이 뜨지 않는다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- @WebMvcTest: 컨트롤러·검증·Advice는 진짜, PostService는 @MockitoBean 가짜 — given(postService.create(...)).willReturn(응답)
- 검증에서 막혀 서비스가 불리지 않는다 — then(postService).shouldHaveNoInteractions()로 확인

<details>
<summary>테스트 — 계약 확인</summary>

`PostControllerTest.java`는 실제 `PostController`와 MVC 검증·예외 처리·인증 부품을 띄운다. 서비스와 토큰 저장소만 mock으로 바꾼다.

```java
@WebMvcTest(PostController.class)
@Import(ClockConfig.class)
class PostControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean PostService postService;
    @MockitoBean PostQueryService postQueryService;
    @MockitoBean ApiTokenRepository apiTokenRepository;
}
```

201은 `Location`과 작성자 ID까지, 400은 Problem JSON의 `title` 오류와 서비스 무호출까지 확인한다. 토큰이 없으면 401과 `WWW-Authenticate`를 확인하고, 조회 서비스가 `PostNotFoundException`을 던지면 404를 확인한다.

```java
mockMvc.perform(post("/api/posts")
        .header("Authorization", "Bearer tok-kimjava")
        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", endsWith("/api/posts/22")))
        .andExpect(jsonPath("$.author.id").value(2));

mockMvc.perform(post("/api/posts")
        .header("Authorization", "Bearer tok-kimjava")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"boardSlug\":\"dev\",\"title\":\"\",\"content\":\"본문\",\"tags\":[],\"visibility\":\"PUBLIC\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.errors[*].field", hasItem("title")));
then(postService).shouldHaveNoInteractions();
```

`VALID_BODY`와 `givenToken` 준비 코드를 포함한 실행 가능한 전문은 아래 **테스트** 코드 접기에서 확인한다.

</details>

## 직접 확인

```bash
./gradlew test --tests org.example.post.PostControllerTest
```

## 채점 기준

T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| T1 | `./gradlew test --tests org.example.post.PostControllerTest` | 통과, 테스트 4개 이상 |
| R1 | 범위 | `@SpringBootTest`가 아니라 `@WebMvcTest(PostController.class)`다. 실행 로그에 Testcontainers·HikariPool 시작이 없다(DB를 띄우지 않는다) |
| R2 | 가짜 범위 | 컨트롤러가 쓰는 서비스와 인증 인터셉터가 쓰는 토큰 저장소만 `@MockitoBean`이다. 컨트롤러·Advice·검증은 실물이다 |
| R3 | 단언 | 상태 코드만 보지 않고 헤더(`Location`, `Content-Type`)와 JSON 경로(`jsonPath`)까지 확인한다 |
| R4 | 위 1~4 | 표의 네 시나리오가 모두 있다. 테스트 이름에서 입력과 기대 결과가 읽힌다 |
| R5 | 서비스 호출 | 2·3번(400·401)에서 서비스가 **호출되지 않았음**을 `verify(..., never())` 또는 `then(...).shouldHaveNoInteractions()`로 확인한다 |

## 필요한 지식

- [V02 계층별 테스트 따라 하기](../../docs/knowledge/V02-layered-tests-handson.md) — Controller 슬라이스 예제
- [V03 — Boot 4 MVC 슬라이스는 Controller를 실물로 둔다](../../docs/knowledge/V03-mocking-in-practice.md#23-boot-4-mvc-슬라이스는-controller를-실물로-둔다)
- [S18 — 슬라이스와 Testcontainers](../../docs/knowledge/S18-spring-testing.md#슬라이스와-testcontainers)
- [V01 — 테스트 하나는 한 행동을 준비·실행·검증한다](../../docs/knowledge/V01-what-and-how-to-test.md#24-테스트-하나는-한-행동을-준비실행검증한다)
- [V05 — ProblemDetail·검증 실패 응답](../../docs/knowledge/V05-testing-tricky-things.md#3단계--problemdetail검증-실패-응답)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — Boot 4의 패키지</summary>

`org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`(Boot 4에서 위치가 바뀌었다)와 `org.springframework.test.context.bean.override.mockito.MockitoBean`. 의존성 `spring-boot-starter-webmvc-test`는 이미 `build.gradle`에 있다. 요청은 `mockMvc.perform(post("/api/posts").header("Authorization", "Bearer tok-kimjava").contentType(APPLICATION_JSON).content(json))`.
</details>

## 다음 단계

[7-2. 서비스 단위 테스트 — mock과 spy](7-2-service-unit.md)
