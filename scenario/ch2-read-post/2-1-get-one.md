# 2-1. 단건 조회와 404

## 상황

글을 쓸 수는 있는데 읽을 수가 없다. 프론트가 글 상세 화면을 만든다.

> "글 id로 상세를 가져오고 싶어요. 조회수도 하나 올려 주세요. 없는 글이면 404로 주시고요."

**조회는 로그인하지 않아도 된다.** 1-6에서 만든 토큰 확인이 모든 `/api/**`에 걸려 있다면 GET은 토큰 없이도 지나가게 바꿔야 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 화면",
  "summary": "목록에서 글을 누르면 상세를 받아 그린다. 로그인하지 않아도 볼 수 있다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기"
    },
    {
      "type": "text",
      "id": "post-title",
      "value": "JPA 연관관계 매핑 정리",
      "emphasis": "title"
    },
    {
      "type": "text",
      "id": "post-meta",
      "value": "이스프링 · 2026-09-15 · 개발",
      "emphasis": "caption",
      "tone": "muted"
    },
    {
      "type": "chips",
      "id": "post-tags",
      "items": [
        "spring",
        "jpa"
      ]
    },
    {
      "type": "text",
      "id": "post-body",
      "value": "@ManyToOne은 기본이 즉시 로딩이라 지연 로딩으로 바꿔 두는 편입니다. …",
      "emphasis": "body"
    },
    {
      "type": "stats",
      "id": "post-stats",
      "items": [
        {
          "id": "views",
          "label": "조회",
          "value": "13"
        },
        {
          "id": "likes",
          "label": "좋아요",
          "value": "1"
        },
        {
          "id": "comments",
          "label": "댓글",
          "value": "0"
        }
      ]
    },
    {
      "type": "text",
      "id": "not-found",
      "value": "글을 찾을 수 없어요",
      "emphasis": "body",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "목록에서 글을 누른다",
      "steps": [
        {
          "kind": "user",
          "text": "목록에서 'JPA 연관관계 매핑 정리'를 누른다(로그인 안 함)"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/2"
        },
        {
          "kind": "server",
          "text": "PostService(@Transactional): 글을 찾고, 조회수를 1 올리고, 트랜잭션 안에서 작성자·태그를 DTO로 옮긴다"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET view_count = view_count + 1 WHERE id = 2"
        },
        {
          "kind": "db",
          "sql": "SELECT p.*, m.nickname FROM post p JOIN member m ON m.id = p.author_id WHERE p.id = 2"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"id\": 2,\n  \"boardSlug\": \"dev\",\n  \"title\": \"JPA 연관관계 매핑 정리\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"author\": {\n    \"id\": 3,\n    \"nickname\": \"이스프링\"\n  },\n  \"viewCount\": 13,\n  \"likeCount\": 1,\n  \"commentCount\": 0\n}"
        },
        {
          "kind": "screen",
          "text": "조회수는 응답의 viewCount(올린 뒤 값)를 그대로 쓴다",
          "focus": [
            "post-title",
            "post-meta",
            "views"
          ]
        }
      ]
    },
    {
      "name": "없는 글 주소로 들어옴",
      "steps": [
        {
          "kind": "user",
          "text": "공유받은 링크의 글이 없다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/999999"
        },
        {
          "kind": "server",
          "text": "글이 없다 → 1-5의 전역 에러 처리(@RestControllerAdvice)가 404 ProblemDetail로"
        },
        {
          "kind": "response",
          "status": 404,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\"status\": 404, \"detail\": \"글을 찾을 수 없습니다.\"}"
        },
        {
          "kind": "screen",
          "text": "'글을 찾을 수 없어요' 화면",
          "focus": [
            "not-found"
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
| 메서드·경로 | `GET /api/posts/{id}` |
| 인증 | 필요 없음(토큰 없이 200) |
| 응답 | `200`, 아래 JSON |
| 조회수 | 호출할 때마다 `post.view_count`를 1 올린다. 응답의 `viewCount`는 **올린 뒤의 값** |
| 없는 글 | `404`, `application/problem+json`(1-5의 에러 형식) |
| 숫자가 아닌 id | `400` |

이 단계에서는 임시저장·삭제·공개 범위를 따지지 않는다(2-3에서 한다). 채점도 공개 글(2번)과 없는 글로만 한다.

`findById(id)`는 **id가 같은 행을 찾을 뿐** `deleted_at`이나 운영자 숨김을 자동으로 걸러 주지 않는다. 여기서는 가장 작은 단건 조회를 만들고, [2-3](2-3-visibility.md)에서 삭제·숨김·공개 범위에 맞게 조회 경로를 확장한다.

```json
{
  "id": 2,
  "boardSlug": "dev",
  "title": "JPA 연관관계 매핑 정리",
  "content": "@ManyToOne은 기본이 즉시 로딩이라 ...",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC",
  "author": { "id": 3, "nickname": "이스프링" },
  "viewCount": 13,
  "likeCount": 1,
  "commentCount": 0,
  "createdAt": "2026-09-15T20:00:00"
}
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- PostQueryService(@Transactional): 글을 찾고, 조회수를 1 올리고, 트랜잭션 안에서 작성자·태그를 DTO로 옮긴다
- 글이 없다 → 1-5의 전역 에러 처리(@RestControllerAdvice)가 404 ProblemDetail로

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/{id}")`.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostDetailResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `increaseViewCount`.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `PostNotFoundException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handlePostNotFound`.

</details>

<details>
<summary>MyBatis — 상세 SELECT와 조회수 UPDATE</summary>

아래 **MyBatis 대체 구현 코드**의 7개 파일을 이 단계 전체 소스에 적용한다. `PostReadMapper.findDetail`은 `post`·`board`·`member`를 JOIN해 상세 응답에 필요한 열을 `PostDetailRow`로 읽는다. 결과가 없으면 기존 `PostNotFoundException`으로 `404`를 돌린다. 태그는 `post_tag`·`tag` JOIN으로 읽어 `PostDetailResponse`에 넣는다. `#{id}`는 요청 ID를 바인딩하므로 SQL 문자열에 직접 이어 붙이지 않는다.

`PostQueryService.getDetail`의 `@Transactional` 안에서 `UPDATE post SET view_count = view_count + 1 WHERE id = #{id}`를 실행하고, 응답 `viewCount`는 조회 직전 값에 1을 더한다. JPA의 변경 감지와 달리 MyBatis는 UPDATE를 명시적으로 쓴다. G1·G2를 두 번 실행해 응답과 DB의 조회수가 각각 1씩 증가하는지 D1/D2로 확인한다. 이 단계에는 아직 2-3의 공개·차단 조건을 추가하지 않는다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080

curl -i "$BASE/api/posts/2"          # G1 — 두 번 호출해 viewCount가 1씩 오르는지 본다
curl -i "$BASE/api/posts/2"          # G2
curl -i "$BASE/api/posts/999999"     # G3 — 없는 글
curl -i "$BASE/api/posts/abc"        # G4 — 숫자가 아닌 id
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "G1",
      "title": "G1 2번 글(토큰 없음)",
      "method": "GET",
      "path": "/api/posts/2"
    },
    {
      "id": "G2",
      "title": "G2 한 번 더",
      "method": "GET",
      "path": "/api/posts/2"
    },
    {
      "id": "G3",
      "title": "G3 없는 글",
      "method": "GET",
      "path": "/api/posts/999999"
    },
    {
      "id": "G4",
      "title": "G4 숫자가 아닌 id",
      "method": "GET",
      "path": "/api/posts/abc"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "G1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.id",
            "equals": 2
          },
          {
            "path": "$.boardSlug",
            "equals": "dev"
          },
          {
            "path": "$.title",
            "equals": "JPA 연관관계 매핑 정리"
          },
          {
            "path": "$.author.id",
            "equals": 3
          },
          {
            "path": "$.author.nickname",
            "equals": "이스프링"
          },
          {
            "path": "$.tags",
            "length": 2
          },
          {
            "path": "$.tags",
            "contains": "spring"
          },
          {
            "path": "$.tags",
            "contains": "jpa"
          },
          {
            "path": "$.likeCount",
            "equals": 1
          },
          {
            "path": "$.commentCount",
            "equals": 0
          },
          {
            "path": "$.viewCount",
            "type": "number"
          }
        ]
      },
      "note": "viewCount=v+1은 DB 값(D1)이 있어야 해서, G1→G2에서 1 오르는지(C2)로 대신 본다"
    },
    {
      "id": "C2",
      "request": "G2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.viewCount",
            "equals": "{{G1.body.viewCount + 1}}"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "G3",
      "expect": {
        "status": 404,
        "headers": {
          "Content-Type": {
            "contains": "application/problem+json"
          }
        }
      }
    },
    {
      "id": "C4",
      "request": "G4",
      "expect": {
        "status": 400
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | G1 **전에** `SELECT view_count FROM post WHERE id = 2` | 값을 기억해 둔다(= v) |
| C1 | G1(토큰 없음) | `200`. `id`=2, `boardSlug`=`dev`, `title`=`JPA 연관관계 매핑 정리`, `author`={3, 이스프링}, `tags`=[`spring`,`jpa`] — 순서 무관, `likeCount`=1, `commentCount`=0, `viewCount`=v+1 |
| C2 | G2 | `200`, `viewCount`=v+2 |
| D2 | G2 뒤 `SELECT view_count FROM post WHERE id = 2` | v+2 |
| C3 | G3 | `404`, `Content-Type: application/problem+json` |
| C4 | G4 | `400` |
| R1 | 연관 엔티티 | 작성자·태그를 트랜잭션 안에서 DTO로 옮긴다(`open-in-view: false`라서 밖에서 지연 로딩하면 `LazyInitializationException`) |
| R2 | 조회수 | 조회수를 올리는 위치·방법이 분명하다(변경 감지 또는 `UPDATE ... SET view_count = view_count + 1`). 읽기 전용 트랜잭션(`readOnly = true`)에서 쓰기를 하지 않는다 |
| R3 | 404 | 1-5의 전역 에러 처리(`@RestControllerAdvice`)를 재사용한다 |
| R4 | 인증 | 토큰 확인이 GET을 막지 않는다. 쓰기 API(POST)는 여전히 토큰이 필요하다 |

## 필요한 지식

- [S09 JPA·Hibernate — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1) · [OSIV와 경계](../../docs/knowledge/S09-jpa-hibernate.md#osiv와-경계) — 지연 로딩이 어디서 터지나
- [P19 — 네이밍, dialect, OSIV](../../docs/knowledge/P19-mysql-jpa-setup.md#26-네이밍-dialect-osiv)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md)
- [S08 트랜잭션 관리](../../docs/knowledge/S08-transactions.md) — `readOnly`와 쓰기
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — GET만 토큰 없이 통과시키기</summary>

인터셉터라면 `request.getMethod()`가 `GET`이고 헤더가 없을 때는 그냥 통과시킨다(헤더가 있으면 2-3에서 확인한다). 경로 패턴을 나눠 등록하는 방법도 있다.
</details>

<details>
<summary>힌트 2 — LazyInitializationException</summary>

서비스 메서드(`@Transactional`) 안에서 `post.getAuthor().getNickname()`, `post.getTags()`를 읽어 DTO를 만들어 반환한다. 컨트롤러에서 엔티티의 연관 필드를 건드리면 트랜잭션이 끝난 뒤라 실패한다.
</details>

## 다음 단계

[2-2. 게시판 목록과 페이징](2-2-board-list.md)
