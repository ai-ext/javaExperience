# 2-3. 볼 수 있는 글만 — 임시저장·삭제·숨김·팔로워·차단

## 상황

지금은 id만 알면 누구나 남의 임시저장 글도, 지운 글도 볼 수 있다. 실제 커뮤니티라면 사고다.

> "임시저장 글은 쓴 사람만, 팔로워 공개 글은 팔로워만 봐야 해요. 차단한 사람 글은 서로 안 보여야 하고요."

**"이 사람이 이 글을 볼 수 있나"** 규칙 하나를 만들고, 상세와 목록 양쪽에 똑같이 적용한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "같은 목록, 보는 사람마다 다르게",
  "summary": "임시저장·삭제·숨김·팔로워 공개·차단 규칙 하나를 상세와 목록에 똑같이 적용한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "자유 게시판",
      "right": "김자바"
    },
    {
      "type": "list",
      "id": "posts",
      "items": [
        {
          "id": "row-12",
          "title": "자유글 01",
          "meta": "이스프링"
        },
        {
          "id": "row-6",
          "title": "[팔로워 공개] 이직 고민",
          "meta": "이스프링 · 팔로워 공개",
          "badge": "팔로워"
        },
        {
          "id": "row-9",
          "title": "차단 확인용 글",
          "meta": "한차단",
          "tone": "muted"
        },
        {
          "id": "row-5",
          "title": "스터디원 구해요",
          "meta": "박디비"
        }
      ],
      "footer": "전체 13개"
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
      "name": "비로그인",
      "steps": [
        {
          "kind": "user",
          "text": "로그인하지 않고 자유 게시판을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?size=20"
        },
        {
          "kind": "server",
          "text": "보는 사람 없음 → PUBLISHED이고 PUBLIC이고 삭제 안 된 글만"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [21 … 12, 9, 5, 4], \"totalElements\": 13}"
        },
        {
          "kind": "screen",
          "text": "팔로워 공개 글(6)은 없고, 9번(한차단의 글)은 보인다",
          "focus": [
            "row-9"
          ]
        }
      ]
    },
    {
      "name": "김자바로 로그인",
      "steps": [
        {
          "kind": "user",
          "text": "김자바로 로그인해 같은 게시판을 연다",
          "focus": [
            "bar"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?size=20",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "보는 사람 = 김자바. 이스프링을 팔로우하므로 6번이 보이고, 한차단이 김자바를 차단했으므로 9번은 숨긴다"
        },
        {
          "kind": "db",
          "sql": "... WHERE status = 'PUBLISHED' AND deleted_at IS NULL AND (visibility = 'PUBLIC' OR author_id = 2 OR EXISTS (SELECT 1 FROM follow f WHERE f.follower_id = 2 AND f.followee_id = p.author_id)) AND NOT EXISTS (SELECT 1 FROM member_block b WHERE ...)",
          "note": "필터는 쿼리에서 — 메모리에서 거르면 페이지 크기와 전체 건수가 틀어진다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [21 … 12, 6, 5, 4], \"totalElements\": 13}"
        },
        {
          "kind": "screen",
          "text": "같은 게시판인데 6번이 생기고 9번이 사라졌다",
          "focus": [
            "row-6"
          ]
        }
      ]
    },
    {
      "name": "남의 임시저장 글 링크",
      "steps": [
        {
          "kind": "user",
          "text": "김자바가 박디비의 임시저장 글(7번) 주소를 직접 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/7",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "볼 수 없는 글 → 403이 아니라 404. 글이 있다는 사실도 숨긴다. 조회수도 올리지 않는다"
        },
        {
          "kind": "response",
          "status": 404,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "'글을 찾을 수 없어요'",
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

**누가 보는가** — 조회 API는 토큰이 없어도 된다.

| 요청 | 보는 사람 |
|---|---|
| `Authorization` 헤더 없음 | 비로그인 |
| 올바른 토큰 | 그 토큰의 회원 |
| 헤더는 있는데 잘못된·만료·폐기 토큰 | `401`(비로그인으로 취급하지 않는다) |

**볼 수 있나** (보는 사람 v, 글 p) — 아래를 모두 만족해야 볼 수 있다.

1. 삭제된 글(`deleted_at` 있음)이 아니다 — 작성자 본인도 못 본다.
2. `status`가 `PUBLISHED`이다. 단, `DRAFT`(임시저장)는 작성자만, `HIDDEN`(운영자 숨김)은 운영자(`ADMIN`)만 볼 수 있다.
3. `visibility`가 `FOLLOWERS`면 작성자 본인이거나 작성자를 팔로우하는 회원이어야 한다.
4. v와 작성자 사이에 차단이 없다(어느 쪽이 차단했든).
5. 비로그인은 `PUBLISHED` + `PUBLIC`만 볼 수 있다.

| 화면 | 적용 |
|---|---|
| 상세 `GET /api/posts/{id}` | 볼 수 없으면 **`404`**. 403이 아니다 — 글이 있다는 사실도 숨긴다. 404일 때 조회수는 오르지 않는다 |
| 목록 `GET /api/boards/{slug}/posts` | 볼 수 있는 `PUBLISHED` 글만. 자기 임시저장 글도 목록에는 넣지 않는다. `totalElements`도 이 기준 |

사진에서 말한 `isHide`는 이 실습 DB에서는 별도 boolean이 아니라 `post.status = 'HIDDEN'`이다. `deleted_at`은 삭제 시각이고, 숨김은 운영 조치다. 둘은 같은 조건으로 다루지 않는다.

| 글 | 일반 사용자 상세 | 운영자 상세 | 게시판 목록 |
|---|---|---|---|
| `deleted_at` 있음 | 404 | 404 | 제외 |
| `deleted_at` 없음·`HIDDEN` | 404 | 차단 규칙을 통과하면 200 | 모두 제외 |
| `deleted_at` 없음·`PUBLISHED`·`PUBLIC` | 차단 규칙에 따라 200 | 차단 규칙에 따라 200 | 볼 수 있는 회원에게만 포함 |

## 구현 가이드

먼저 id 조회가 어떤 행을 돌려주는지 확인하고, 상세와 목록에서 필요한 조건을 각각 적용한다. 접기를 열어 한 역할씩 구현한다.

<details>
<summary>Controller — 비로그인 조회와 선택적 회원</summary>

```java
@GetMapping("/api/posts/{id}")
public PostDetailResponse detail(@PathVariable Long id,
                                 @RequestAttribute(required = false) AuthenticatedMember viewer) {
    return postQueryService.getDetail(id, viewer);
}
```

토큰이 없으면 `viewer == null`이다. 잘못된 토큰은 인증 인터셉터에서 `401`로 끝내고 이 메서드까지 보내지 않는다. 상세 DTO에는 `deletedAt`이나 숨김 기록을 일반 사용자에게 노출하지 않는다.

</details>

<details>
<summary>Service — 상세 조회 뒤 접근 규칙 적용</summary>

```java
@Transactional
public PostDetailResponse getDetail(Long id, AuthenticatedMember viewer) {
    Post post = postRepository.findById(id)
            .orElseThrow(PostNotFoundException::new);
    if (!postAccessPolicy.canView(viewer, post)) {
        throw new PostNotFoundException(); // 존재 여부도 숨긴다
    }
    post.increaseViewCount(); // 404일 때는 실행하지 않는다
    return toDetailResponse(post);
}
```

`findById` 다음에 정책을 적용하는 방식은 상세에 쓸 수 있다. 목록에서는 페이지를 읽고 Java에서 거르면 `items` 개수와 `totalElements`가 틀어지므로 DB 쿼리에 조건을 넣는다.

</details>

<details>
<summary>JPA / Repository — findById와 조건 조회의 차이</summary>

`JpaRepository.findById(id)`는 삭제·숨김 필터를 **자동으로 넣지 않는다**. 삭제된 행을 일반 경로에서 아예 가져오지 않으려면 파생 메서드로 시작할 수 있다.

```java
Optional<Post> findByIdAndDeletedAtIsNull(Long id);
```

하지만 `findByIdAndDeletedAtIsNullAndStatusNot(id, "HIDDEN")`만으로 전체 접근 규칙이 되지는 않는다. 임시저장 작성자, 팔로워, 상호 차단, 운영자의 숨김 글 열람이 남는다. 상세는 위 Service처럼 정책을 적용하고, 게시판 목록 쿼리는 다음 공통 조건에서 시작한다.

```java
@Query("""
    SELECT p FROM Post p JOIN FETCH p.author
    WHERE p.board = :board AND p.deletedAt IS NULL
      AND p.status = 'PUBLISHED'
      AND (p.visibility = 'PUBLIC'
           OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
           OR (:viewerId IS NOT NULL AND EXISTS (
               SELECT 1 FROM Follow f
               WHERE f.follower.id = :viewerId AND f.followee = p.author)))
      AND (:viewerId IS NULL OR NOT EXISTS (
          SELECT 1 FROM MemberBlock b
          WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
             OR (b.blocked.id = :viewerId AND b.blocker = p.author)))
    ORDER BY p.publishedAt DESC, p.id DESC
    """)
List<Post> findViewableByBoard(@Param("board") Board board,
                               @Param("viewerId") Long viewerId, Pageable pageable);

@Query("""
    SELECT COUNT(p) FROM Post p
    WHERE p.board = :board AND p.deletedAt IS NULL
      AND p.status = 'PUBLISHED'
      AND (p.visibility = 'PUBLIC'
           OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
           OR (:viewerId IS NOT NULL AND EXISTS (
               SELECT 1 FROM Follow f
               WHERE f.follower.id = :viewerId AND f.followee = p.author)))
      AND (:viewerId IS NULL OR NOT EXISTS (
          SELECT 1 FROM MemberBlock b
          WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
             OR (b.blocked.id = :viewerId AND b.blocker = p.author)))
    """)
long countViewableByBoard(@Param("board") Board board, @Param("viewerId") Long viewerId);
```

목록과 COUNT의 `WHERE`가 한 글자라도 다르게 진화하면 화면의 `totalElements`가 어긋난다. 차단 조건은 양방향이고, `:viewerId IS NULL`일 때는 비로그인 공개 글을 통과시킨다.

`Pageable`의 정렬을 쓰거나 JPQL의 `ORDER BY`를 쓰되, 최종 순서는 `publishedAt DESC, id DESC`다. [접근 규칙 강의](../../lessons/G2-access-rules-in-one-place.md)와 채점 R1·R2를 대조한다.

</details>

<details>
<summary>SQL / MyBatis — 조건을 WHERE에 놓기</summary>

먼저 DB에서 두 조건의 차이를 직접 본다. `id=8`은 삭제, `id=10`은 운영자 숨김 시드다.

```sql
SELECT id, status, deleted_at FROM post WHERE id IN (8, 10);
SELECT id FROM post WHERE id IN (8, 10) AND deleted_at IS NULL;
SELECT id FROM post WHERE id IN (8, 10)
  AND deleted_at IS NULL AND status = 'PUBLISHED';
```

첫 쿼리는 둘 다, 둘째는 숨김 10번만, 셋째는 둘 다 제외한다. MyBatis에서도 공개 목록의 `WHERE`에 `p.deleted_at IS NULL AND p.status = 'PUBLISHED'`를 넣는다. 이것만으로는 팔로워·차단 조건이 완성되지 않으므로 JPA 목록과 **동일한 규칙**을 추가하고, COUNT 쿼리에도 복사한다.

비로그인 상세의 첫 MyBatis 메서드는 이처럼 작성할 수 있다. 이 메서드는 **익명 공개 글 전용**이므로 로그인 회원의 임시저장·팔로워·숨김 권한 판정까지 대신하지 않는다.

```java
@Mapper
public interface PublicPostMapper {
    Long findAnonymousVisibleId(@Param("id") Long id);
}
```

```xml
<mapper namespace="org.example.post.PublicPostMapper">
  <select id="findAnonymousVisibleId" resultType="long">
    SELECT p.id FROM post p
    WHERE p.id = #{id}
      AND p.deleted_at IS NULL
      AND p.status = 'PUBLISHED'
      AND p.visibility = 'PUBLIC'
  </select>
</mapper>
```

</details>

위 코드는 익명 조회의 첫 예시다. 아래 **MyBatis 대체 구현 코드** 접기에는 로그인·팔로우·양방향 차단·운영자 숨김·목록 COUNT까지 적용한 Mapper·XML·Service·조회 DTO의 파일 전문이 있다.

## 직접 확인

```bash
BASE=http://localhost:8080
get() { curl -s -o /dev/null -w "%{http_code}\n" "$@"; }
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; P='Authorization: Bearer tok-park'
H='Authorization: Bearer tok-han';    A='Authorization: Bearer tok-admin'

# 상세 — 상태 코드만
get "$BASE/api/posts/6"; get -H "$K" "$BASE/api/posts/6"; get -H "$P" "$BASE/api/posts/6"; get -H "$L" "$BASE/api/posts/6"   # V1
get -H "$P" "$BASE/api/posts/7"; get -H "$K" "$BASE/api/posts/7"; get "$BASE/api/posts/7"                                     # V2
get -H "$L" "$BASE/api/posts/8"; get "$BASE/api/posts/8"                                                                         # V3
get "$BASE/api/posts/9"; get -H "$K" "$BASE/api/posts/9"; get -H "$H" "$BASE/api/posts/9"                                     # V4
get -H "$A" "$BASE/api/posts/10"; get -H "$P" "$BASE/api/posts/10"                                                              # V5
get -H 'Authorization: Bearer no-such-token' "$BASE/api/posts/2"                                                                 # V6

# 목록 — id만 뽑아 보기
ids() { python3 -c 'import sys,json; print([i["id"] for i in json.load(sys.stdin)["items"]])'; }
curl -s "$BASE/api/boards/free/posts?size=20" | ids              # V7 비로그인
curl -s -H "$K" "$BASE/api/boards/free/posts?size=20" | ids      # V8 김자바
curl -s -H "$P" "$BASE/api/boards/free/posts?size=20" | ids      # V9 박디비
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "V1a",
      "title": "V1 6번 — 비로그인",
      "method": "GET",
      "path": "/api/posts/6"
    },
    {
      "id": "V1b",
      "title": "V1 6번 — 김자바(팔로워)",
      "method": "GET",
      "path": "/api/posts/6",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V1c",
      "title": "V1 6번 — 박디비",
      "method": "GET",
      "path": "/api/posts/6",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "V1d",
      "title": "V1 6번 — 이스프링(작성자)",
      "method": "GET",
      "path": "/api/posts/6",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "V2a",
      "title": "V2 7번 — 박디비(작성자)",
      "method": "GET",
      "path": "/api/posts/7",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "V2b",
      "title": "V2 7번 — 김자바",
      "method": "GET",
      "path": "/api/posts/7",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V2c",
      "title": "V2 7번 — 비로그인",
      "method": "GET",
      "path": "/api/posts/7"
    },
    {
      "id": "V3a",
      "title": "V3 8번 — 이스프링(작성자)",
      "method": "GET",
      "path": "/api/posts/8",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "V3b",
      "title": "V3 8번 — 비로그인",
      "method": "GET",
      "path": "/api/posts/8"
    },
    {
      "id": "V4a",
      "title": "V4 9번 — 비로그인",
      "method": "GET",
      "path": "/api/posts/9"
    },
    {
      "id": "V4b",
      "title": "V4 9번 — 김자바(차단당함)",
      "method": "GET",
      "path": "/api/posts/9",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V4c",
      "title": "V4 9번 — 한차단(작성자)",
      "method": "GET",
      "path": "/api/posts/9",
      "headers": {
        "Authorization": "Bearer tok-han"
      }
    },
    {
      "id": "V5a",
      "title": "V5 10번 — 운영자",
      "method": "GET",
      "path": "/api/posts/10",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "V5b",
      "title": "V5 10번 — 박디비(작성자)",
      "method": "GET",
      "path": "/api/posts/10",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "V6",
      "title": "V6 없는 토큰으로 공개 글",
      "method": "GET",
      "path": "/api/posts/2",
      "headers": {
        "Authorization": "Bearer no-such-token"
      }
    },
    {
      "id": "V7",
      "title": "V7 free 목록 — 비로그인",
      "method": "GET",
      "path": "/api/boards/free/posts?size=20"
    },
    {
      "id": "V8",
      "title": "V8 free 목록 — 김자바",
      "method": "GET",
      "path": "/api/boards/free/posts?size=20",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V9",
      "title": "V9 free 목록 — 박디비",
      "method": "GET",
      "path": "/api/boards/free/posts?size=20",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "V1a",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V1b",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "V1c",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V1d",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "V2a",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "V2b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V2c",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "V3a",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V3b",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "V4a",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "V4b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V4c",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "V5a",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "V5b",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C6",
      "request": "V6",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C7",
      "request": "V7",
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
              17,
              16,
              15,
              14,
              13,
              12,
              9,
              5,
              4
            ]
          },
          {
            "path": "$.totalElements",
            "equals": 13
          }
        ]
      }
    },
    {
      "id": "C8",
      "request": "V8",
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
              17,
              16,
              15,
              14,
              13,
              12,
              6,
              5,
              4
            ]
          }
        ]
      }
    },
    {
      "id": "C9",
      "request": "V9",
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
              17,
              16,
              15,
              14,
              13,
              12,
              9,
              5,
              4
            ]
          }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | V1 — 6번(이스프링의 팔로워 공개 글): 비로그인 / 김자바(팔로워) / 박디비 / 이스프링(작성자) | `404` / `200` / `404` / `200` |
| C2 | V2 — 7번(박디비의 임시저장): 박디비 / 김자바 / 비로그인 | `200` / `404` / `404` |
| C3 | V3 — 8번(삭제됨): 이스프링(작성자) / 비로그인 | `404` / `404` |
| C4 | V4 — 9번(김자바를 차단한 한차단의 글): 비로그인 / 김자바 / 한차단 | `200` / `404` / `200` |
| C5 | V5 — 10번(운영자 숨김): 운영자 / 박디비(작성자) | `200` / `404` |
| C6 | V6 — 없는 토큰으로 공개 글 조회 | `401` |
| C7 | V7 | 13개: `21~12, 9, 5, 4` (`totalElements`=13) |
| C8 | V8 | 13개: `21~12, 6, 5, 4` — 팔로워 공개 6번이 보이고 차단 9번이 빠진다 |
| C9 | V9 | 13개: `21~12, 9, 5, 4` — 자기 임시저장 7번은 목록에 없다 |
| D1 | V3 **전후** `SELECT view_count FROM post WHERE id = 8` | 값이 그대로 — 404면 조회수가 오르지 않는다 |
| R1 | 규칙 한 곳 | 위 규칙이 한 클래스(예: `PostAccessPolicy`)에 모여 있다. 상세는 자바 코드로 판정하고 목록은 쿼리 조건으로 걸러야 하는데, 두 곳이 같은 규칙을 따르도록 관리한다 |
| R2 | 404 | 볼 수 없을 때 403이 아니라 404를 주는 이유를 코드나 주석으로 알 수 있다 |
| R3 | 목록 필터 위치 | 목록 필터링을 메모리(`stream().filter`)가 아니라 쿼리에서 한다 — 메모리에서 거르면 페이지 크기와 `totalElements`가 틀어진다 |
| R4 | 선택적 인증 | "헤더 없음 = 비로그인"과 "헤더가 잘못됨 = 401"을 구분한다 |

## 필요한 지식

- [D11 웹 보안 기초 — 인증과 인가](../../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인) — "객체까지 확인"이 바로 이 단계
- [D11 — 403과 404 중 무엇을 반환하나](../../docs/knowledge/D11-web-security-basics.md#q1-인증과-인가를-실제-api에서-어떻게-나누나)
- [P21 QueryDSL — 동적 조건은 null 반환 메서드로](../../docs/knowledge/P21-querydsl-setup.md#25-동적-조건은-null-반환-메서드로-만든다) — 보는 사람에 따라 조건이 바뀌는 쿼리
- [S10 — Specification과 Projection](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다)
- [W13 프론트와 백엔드의 경계](../../docs/knowledge/W13-frontend-backend-boundary.md) — 화면에서 숨기는 것과 서버가 막는 것

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 상세와 목록에 같은 규칙</summary>

상세: `policy.canView(viewer, post)`를 자바로 판정한다. 목록: 같은 규칙을 WHERE 조건으로 옮긴다 — `status = PUBLISHED`, `(visibility = PUBLIC OR author = :viewer OR EXISTS(팔로우))`, `NOT EXISTS(차단)`.

JPQL이면 `EXISTS (SELECT 1 FROM Follow f WHERE ...)`, QueryDSL이면 `JPAExpressions`로 서브쿼리를 만든다. 규칙을 바꿀 때 두 곳을 같이 고치도록 같은 클래스 옆에 둔다. </details>

<details>
<summary>힌트 2 — 비로그인</summary>

보는 사람을 `null`(또는 `Viewer.anonymous()`)로 표현하고, 쿼리 조건에서는 비로그인일 때 "PUBLIC만"으로 분기한다.
</details>

## 다음 단계

[2-4. 쿼리 수 줄이기(N+1)](2-4-n-plus-1.md)
