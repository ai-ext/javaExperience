# 7-3. 통합 테스트 — Testcontainers

## 상황

슬라이스·단위 테스트는 빠르지만 "진짜로 붙였을 때"는 확인하지 못한다. 엔티티 매핑, 실제 SQL, 트랜잭션, 인증 부품이 함께 돌 때만 보이는 문제가 있다. 마지막으로 **진짜 MySQL(Testcontainers) 위에서 사용자 흐름 하나를 처음부터 끝까지** 돌린다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "통합 테스트 — 사용자 흐름 한 바퀴",
  "summary": "진짜 MySQL(Testcontainers) 위에서 글쓰기 → 조회 → 좋아요 → 댓글 → 삭제를 처음부터 끝까지 돌린다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "IntelliJ — PostFlowIntegrationTest"
    },
    {
      "type": "code",
      "id": "run",
      "label": "실행",
      "value": "./gradlew test"
    },
    {
      "type": "code",
      "id": "result",
      "label": "결과",
      "value": "Creating container for image: mysql:8.4 … started\nPostFlowIntegrationTest > 글쓰기부터 삭제까지() PASSED\nPostFlowIntegrationTest > 비로그인 자유 게시판 목록 순서() PASSED\nBUILD SUCCESSFUL"
    }
  ],
  "flows": [
    {
      "name": "한 바퀴",
      "steps": [
        {
          "kind": "user",
          "text": "전체 테스트를 실행한다",
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
          "body": "{\"boardSlug\": \"dev\", \"title\": \"통합 테스트\", ...}"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/22"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/22/like",
          "headers": [
            "Authorization: Bearer tok-lee"
          ]
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"likeCount\": 1, ...}"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/22/comments",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-lee"
          ],
          "body": "{\"content\": \"좋아요\"}"
        },
        {
          "kind": "response",
          "status": 201
        },
        {
          "kind": "request",
          "method": "DELETE",
          "path": "/api/posts/22",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "response",
          "status": 204
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/22"
        },
        {
          "kind": "response",
          "status": 404
        },
        {
          "kind": "screen",
          "text": "서비스·리포지토리를 가짜로 바꾸지 않았다 — 실제 SQL·트랜잭션·인증이 함께 돈다",
          "focus": [
            "result"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

테스트 클래스 **`PostFlowIntegrationTest`** (이름 그대로) — `@SpringBootTest` + `@AutoConfigureMockMvc`

흐름(한 테스트 메서드 또는 단계별 메서드):

1. 김자바(`tok-kimjava`)가 `dev` 게시판에 글을 쓴다 → `201`
2. 비로그인으로 그 글 상세 → `200`
3. 이스프링(`tok-lee`)이 좋아요 → `likeCount` 1
4. 이스프링이 댓글 → `201`
5. 상세에서 `likeCount`=1, `commentCount`=1
6. 김자바가 글을 지운다 → `204`
7. 상세 → `404`, 이스프링이 다시 좋아요 → `404`

추가로 하나 더: **시드 데이터 규칙 확인** — 비로그인으로 `GET /api/boards/free/posts?size=20`의 id 순서가 `21~12, 9, 5, 4`인지(2-3).

- 테스트 프로파일은 이미 Testcontainers MySQL에 시나리오 dump를 넣는다(`application-test.yml`). 따로 설정할 것은 없다.
- 테스트끼리 순서에 기대지 않는다. 각 테스트가 자기 데이터를 만들어 쓴다.

## 구현 가이드

`GET /api/boards/free/posts?size=20` 계약을 기준으로 아래 순서대로 구현한다. 먼저 직접 작성하고, 막힌 역할만 펼쳐 아래의 전체 구현 코드와 비교한다.

<details>
<summary>테스트 / 계약 검증</summary>

`PostFlowIntegrationTest.java`는 `@SpringBootTest`와 실제 MySQL Testcontainers를 사용한다. 서비스와 리포지토리를 mock으로 바꾸지 않고, 같은 테스트에서 만든 글 ID를 다음 요청에 이어 쓴다. `@Transactional`을 테스트 클래스에 붙이지 않아 요청별 커밋 뒤의 결과도 확인한다.

```java
@SpringBootTest
@AutoConfigureMockMvc
class PostFlowIntegrationTest {
    @Autowired MockMvc mockMvc;

    @Test
    void 글쓰기_조회_좋아요_댓글_삭제까지_한_흐름() throws Exception {
        String created = mockMvc.perform(post("/api/posts")
                .header("Authorization", "Bearer tok-kimjava")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"boardSlug\":\"dev\",\"title\":\"[통합] 흐름 확인\",\"content\":\"본문\",\"tags\":[],\"visibility\":\"PUBLIC\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer postId = JsonPath.read(created, "$.id");
        // postId로 상세 → 좋아요 → 댓글 → 다시 상세 → 삭제 → 404를 검증한다.
    }
}
```

각 요청·응답 단언의 실행 가능한 전문은 아래 **테스트** 코드 접기에서 확인한다. 두 번째 테스트는 비로그인 자유 게시판 목록의 시드 ID와 `totalElements`를 확인한다.

</details>

## 직접 확인

```bash
./gradlew test --tests org.example.post.PostFlowIntegrationTest
./gradlew test        # 전체 — 지금까지 만든 테스트가 모두 통과해야 한다
```

## 채점 기준

T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| T1 | `./gradlew test --tests org.example.post.PostFlowIntegrationTest` | 통과 |
| T2 | `./gradlew test` | 전체 통과(2-4·4-2·7-1·7-2 테스트 포함) |
| R1 | 흐름 | 위 1~7과 시드 데이터 확인이 모두 있다. 앞 단계 응답의 id를 다음 단계에 이어 쓴다 |
| R2 | 진짜로 붙였나 | 서비스·리포지토리를 mock으로 바꾸지 않았다. 실제 MySQL에서 돈다 |
| R3 | 트랜잭션 함정 | 테스트 클래스에 `@Transactional`을 붙였다면, 그것 때문에 커밋 후에만 생기는 문제(동시성·커밋 뒤 동작)가 가려진다는 것을 알고 선택했다 |
| R4 | 독립성 | 다른 테스트가 만든 데이터에 기대지 않는다. 같은 테스트를 두 번 돌려도 통과한다 |
| R5 | 속도 | 컨텍스트가 테스트 클래스마다 새로 뜨지 않게 설정을 맞췄다(`@MockitoBean` 남발·서로 다른 프로퍼티 조합은 컨텍스트 캐시를 깨뜨린다) |

## 필요한 지식

- [V04 테스트 DB 전략](../../docs/knowledge/V04-test-db-strategy.md) — H2 대신 진짜 MySQL을 쓰는 이유
- [V04 — `@Transactional` 함정을 재현](../../docs/knowledge/V04-test-db-strategy.md#4단계--transactional-함정을-재현)
- [S18 — 컨텍스트 캐시 키](../../docs/knowledge/S18-spring-testing.md#컨텍스트-캐시-키)
- [V06 현업 테스트 실무](../../docs/knowledge/V06-testing-at-work.md) — 레거시에 테스트 붙이기, CI
- [V01 — 검증할 계약에 맞춰 범위를 정한다](../../docs/knowledge/V01-what-and-how-to-test.md#22-검증할-계약에-맞춰-범위를-정한다)

## 다음 단계

여기까지 왔다면 API 하나를 만들고(1장) 읽고(2장) 고치고(3장) 반응을 붙이고(4·5·6장) 테스트로 지키는(7장) 백엔드의 한 바퀴를 돌았다.

다음은 [8-1. 회원 활동 요약](../ch8-query-deep/8-1-activity-summary.md) — 많은 데이터(학습용 DB)로 쿼리를 깊게 판다.

[학습용 미션](../../practice/MISSIONS.md)은 정규 단계와 별개인 선택 연습이다(8·9장과 같은 학습용 DB를 쓴다).
