# 7-1. 컨트롤러 슬라이스 테스트

## 상황

지금까지 확인은 서버를 띄우고 curl을 보내는 식이었다. 코드를 고칠 때마다 사람이 다시 해야 한다. 이제 **자동으로 도는 테스트**로 계약을 고정한다.

첫 번째는 **컨트롤러만** 시험하는 테스트다. DB도 서비스도 띄우지 않고(가짜로 바꾸고), "이 요청이 오면 이 상태 코드·헤더·JSON이 나간다"는 HTTP 계약만 빠르게 확인한다.

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
- DB 없이 돌아야 한다. 이 테스트만 돌리면 Testcontainers MySQL이 뜨지 않는다.

## 직접 확인

```bash
./gradlew test --tests '*PostControllerTest'
```

## 채점 기준

T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| T1 | `./gradlew test --tests '*PostControllerTest'` | 통과, 테스트 4개 이상 |
| R1 | 범위 | `@SpringBootTest`가 아니라 `@WebMvcTest(PostController.class)`다. 실행 로그에 Testcontainers·HikariPool 시작이 없다(DB를 띄우지 않는다) |
| R2 | 가짜 범위 | 컨트롤러가 직접 쓰는 협력 객체만 `@MockitoBean`이다. 컨트롤러·Advice·검증은 실물이다 |
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
