# 2-2. 게시판 목록과 페이징

## 상황

> "게시판 들어가면 최신 글부터 10개씩 보여 주고, 아래에 페이지 번호를 붙일 거예요. 전체 몇 개인지도 알려 주세요."

글이 수천 개여도 한 번에 다 보내지 않는다. **한 페이지만 잘라서** 보내고, 전체 건수와 다음 페이지가 있는지를 같이 알려 준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "게시판 목록",
  "summary": "한 번에 다 보내지 않고 한 페이지만. 전체 건수와 다음 페이지 여부를 같이 준다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "자유 게시판"
    },
    {
      "type": "list",
      "id": "posts",
      "items": [
        {
          "id": "row-21",
          "title": "자유글 10",
          "meta": "박디비 · 조회 10",
          "badge": "mysql"
        },
        {
          "id": "row-20",
          "title": "자유글 09",
          "meta": "이스프링 · 조회 9",
          "badge": "java"
        },
        {
          "id": "row-19",
          "title": "자유글 08",
          "meta": "박디비 · 조회 8"
        },
        {
          "id": "row-18",
          "title": "자유글 07",
          "meta": "이스프링 · 조회 7"
        },
        {
          "id": "row-17",
          "title": "자유글 06",
          "meta": "박디비 · 조회 6"
        }
      ],
      "footer": "1 / 3 페이지 · 전체 14개"
    },
    {
      "type": "actions",
      "id": "pager",
      "items": [
        {
          "id": "prev",
          "label": "이전",
          "variant": "secondary"
        },
        {
          "id": "next",
          "label": "다음",
          "variant": "secondary"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "게시판 들어가기",
      "steps": [
        {
          "kind": "user",
          "text": "'자유' 게시판을 연다",
          "focus": [
            "bar"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?page=0&size=5"
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post WHERE board_id = 4 AND status = 'PUBLISHED' AND deleted_at IS NULL ORDER BY published_at DESC, id DESC LIMIT 5 OFFSET 0"
        },
        {
          "kind": "db",
          "sql": "SELECT COUNT(*) FROM post WHERE board_id = 4 AND status = 'PUBLISHED' AND deleted_at IS NULL",
          "note": "페이지 번호를 그리려면 전체 건수가 필요하다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"items\": [\n    {\n      \"id\": 21,\n      \"title\": \"자유글 10\",\n      \"author\": {\n        \"id\": 4,\n        \"nickname\": \"박디비\"\n      },\n      \"tags\": [\n        \"mysql\"\n      ],\n      \"likeCount\": 0,\n      \"commentCount\": 0,\n      \"viewCount\": 10\n    },\n    \"…\"\n  ],\n  \"page\": 0,\n  \"size\": 5,\n  \"totalElements\": 14,\n  \"totalPages\": 3,\n  \"hasNext\": true\n}"
        },
        {
          "kind": "screen",
          "text": "목록에는 본문이 없다 — 응답이 가볍다. totalPages로 페이지 번호를 그린다",
          "focus": [
            "posts"
          ]
        }
      ]
    },
    {
      "name": "마지막 페이지로",
      "steps": [
        {
          "kind": "user",
          "text": "[다음]을 두 번 눌러 3페이지로 간다",
          "focus": [
            "next"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?page=2&size=5"
        },
        {
          "kind": "db",
          "sql": "... LIMIT 5 OFFSET 10"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [9, 6, 5, 4 …], \"hasNext\": false, ...}"
        },
        {
          "kind": "screen",
          "text": "hasNext가 false라 [다음] 버튼을 끈다",
          "focus": [
            "next"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/boards/{slug}/posts?page=0&size=10` |
| 인증 | 필요 없음 |
| 대상 | 그 게시판에서 `status = 'PUBLISHED'`이고 삭제되지 않은(`deleted_at IS NULL`) 글. 공개 범위·차단은 2-3에서 |
| 정렬 | `published_at` 최신순, 같으면 `id` 큰 순 |
| `page` | 0부터. 생략하면 0. 음수면 `400` |
| `size` | 생략하면 10. 1~50만 허용, 밖이면 `400` |
| 없는 게시판 | `404` |
| 응답 | 아래 JSON — **목록에는 본문(`content`)을 넣지 않는다** |

```json
{
  "items": [
    {
      "id": 21,
      "title": "자유글 10",
      "author": { "id": 4, "nickname": "박디비" },
      "tags": ["mysql"],
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 10,
      "publishedAt": "2026-10-04T09:00:00"
    }
  ],
  "page": 0,
  "size": 5,
  "totalElements": 14,
  "totalPages": 3,
  "hasNext": true
}
```

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 페이지 번호를 그리려면 전체 건수가 필요하다

<details>
<summary>Controller</summary>

`BoardPostController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.

</details>

<details>
<summary>DTO / 결과 행</summary>

`PostListItemResponse.java`, `PostListResponse.java`: 필드 이름·타입을 요청·응답 예시와 대조한다.

</details>

<details>
<summary>Service</summary>

`PostQueryService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

</details>

<details>
<summary>JPA / Repository</summary>

`PostRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

</details>

<details>
<summary>MyBatis — 페이지 SELECT·COUNT·태그 일괄 조회</summary>

아래 **MyBatis 대체 구현 코드**의 8개 파일을 이 단계 전체 소스에 적용한다. 2-1의 상세 SELECT·조회수 UPDATE는 유지하고, `PostReadMapper`에 게시판 ID 조회와 목록·COUNT SQL을 더한다.

`findPublishedByBoard`와 `countPublishedByBoard`는 둘 다 `board_id`·`status='PUBLISHED'`·`deleted_at IS NULL` 조건을 써야 총 건수와 페이지 항목이 맞는다. `ORDER BY published_at DESC, id DESC`로 동률 순서를 고정하고, `LIMIT #{limit} OFFSET #{offset}`으로 페이지를 자른다. `#{...}`는 숫자를 바인딩한다.

목록 SQL 결과는 `PostListRow`에 담고, 페이지에 나온 글 ID만 모아 태그를 **한 번** 더 조회해 `PostListItemResponse`로 변환한다. `content`는 목록 SELECT와 DTO에 넣지 않는다.

Service는 COUNT로 `totalElements`·`totalPages`·`hasNext`를 계산한다. 이 단계는 아직 2-3의 팔로우·차단 조건을 적용하지 않으므로 6번·9번 글이 보여야 한다. JPA와 MyBatis 양쪽에서 L1~L5의 글 순서·14건/3페이지·잘못된 입력 오류를 대조한다.

</details>

## 직접 확인

`free`(자유) 게시판으로 확인한다. 채점은 이 게시판의 시드 글로 하므로, **`free`에 직접 글을 쓰면 기대값이 달라진다**(그럴 땐 DB 초기화).

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "L1",
      "title": "L1 free 0쪽(5개씩)",
      "method": "GET",
      "path": "/api/boards/free/posts?page=0&size=5"
    },
    {
      "id": "L2",
      "title": "L2 free 2쪽(5개씩)",
      "method": "GET",
      "path": "/api/boards/free/posts?page=2&size=5"
    },
    {
      "id": "L3",
      "title": "L3 size=51",
      "method": "GET",
      "path": "/api/boards/free/posts?size=51"
    },
    {
      "id": "L4",
      "title": "L4 page=-1",
      "method": "GET",
      "path": "/api/boards/free/posts?page=-1"
    },
    {
      "id": "L5",
      "title": "L5 없는 게시판",
      "method": "GET",
      "path": "/api/boards/nope/posts"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "L1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].id",
            "equals": [
              21,
              20,
              19,
              18,
              17
            ]
          },
          {
            "path": "$.totalElements",
            "equals": 14
          },
          {
            "path": "$.totalPages",
            "equals": 3
          },
          {
            "path": "$.hasNext",
            "equals": true
          },
          {
            "path": "$.page",
            "equals": 0
          },
          {
            "path": "$.size",
            "equals": 5
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "L1",
      "expect": {
        "json": [
          {
            "path": "$.items[*].id",
            "length": 5
          },
          {
            "path": "$.items[*].title",
            "length": 5
          },
          {
            "path": "$.items[*].author.id",
            "length": 5
          },
          {
            "path": "$.items[*].author.nickname",
            "length": 5
          },
          {
            "path": "$.items[*].tags",
            "length": 5
          },
          {
            "path": "$.items[*].likeCount",
            "length": 5
          },
          {
            "path": "$.items[*].commentCount",
            "length": 5
          },
          {
            "path": "$.items[*].viewCount",
            "length": 5
          },
          {
            "path": "$.items[*].publishedAt",
            "length": 5
          },
          {
            "path": "$.items[*].content",
            "length": 0
          },
          {
            "path": "$.items[0].tags",
            "equals": [
              "mysql"
            ]
          },
          {
            "path": "$.items[1].tags",
            "equals": [
              "java"
            ]
          }
        ]
      },
      "note": "items[0]·items[1]은 C1 순서대로 21번·20번이다"
    },
    {
      "id": "C3",
      "request": "L2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].id",
            "equals": [
              9,
              6,
              5,
              4
            ]
          },
          {
            "path": "$.hasNext",
            "equals": false
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "L3",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C5",
      "request": "L4",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C6",
      "request": "L5",
      "expect": {
        "status": 404
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | L1 | `200`. `items`의 id 순서 = `21, 20, 19, 18, 17`. `totalElements`=14, `totalPages`=3, `hasNext`=true, `page`=0, `size`=5 |
| C2 | L1 | 각 항목에 `id`·`title`·`author`(id·nickname)·`tags`·`likeCount`·`commentCount`·`viewCount`·`publishedAt`가 있고 **`content`가 없다**. id 21의 `tags`=[`mysql`], id 20의 `tags`=[`java`] |
| C3 | L2 | `200`. id 순서 = `9, 6, 5, 4`, `hasNext`=false |
| C4 | L3 | `400` |
| C5 | L4 | `400` |
| C6 | L5 | `404` |
| R1 | 페이징 | `Pageable`/`PageRequest`(또는 직접 LIMIT·OFFSET)와 정렬 조건이 분명하다. 동률 정렬(`id`)까지 넣었다 |
| R2 | 건수 | 전체 건수를 구하는 쿼리가 따로 있다는 것을 알고 있다(로그로 확인) |
| R3 | 응답 모양 | 목록 전용 DTO를 쓴다. `Page` 객체를 그대로 직렬화하지 않는다(응답 모양이 라이브러리에 묶인다) |
| R4 | 입력 검증 | `page`·`size` 범위를 서버가 검사한다 |

7·8·10번은 임시저장·삭제·숨김이라 빠지고, 6번(팔로워 공개)·9번(차단 확인용)은 이 단계에서는 보이는 게 맞다.

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md) — 지금은 OFFSET, 4-3에서 커서
- [W15 — 총 건수는 별도 질문이다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#총-건수는-별도-질문이다)
- [S10 — 페이징은 정렬과 건수 계산의 계약이다](../../docs/knowledge/S10-spring-data-query.md#페이징은-정렬과-건수-계산의-계약이다)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 쿼리 파라미터 검증

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 리포지토리</summary>

`Page<Post> findByBoardAndStatusAndDeletedAtIsNull(Board board, PostStatus status, Pageable pageable)` 같은 파생 쿼리와 `PageRequest.of(page, size, Sort.by(DESC, "publishedAt").and(Sort.by(DESC, "id")))`로 시작할 수 있다. 결과 `Page`에서 `getTotalElements()`, `getTotalPages()`, `hasNext()`를 꺼내 DTO에 담는다. </details>

<details>
<summary>힌트 2 — 파라미터 검증</summary>

`@RequestParam(defaultValue = "10") @Min(1) @Max(50) int size`처럼 제약만 붙이면 Spring MVC가 스스로 검사해 범위 밖 값에 `HandlerMethodValidationException`을 던진다. 그 예외도 Advice에서 400으로 바꾼다.

컨트롤러에 `@Validated`는 **붙이지 않는다** — 붙이면 옛 방식(AOP `MethodValidationInterceptor`)이 먼저 끼어들어 `ConstraintViolationException`이 그대로 500이 된다(Boot 4.1에서 실측). </details>

## 다음 단계

[2-3. 볼 수 있는 글만](2-3-visibility.md)
