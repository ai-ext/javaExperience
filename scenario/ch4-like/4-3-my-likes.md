# 4-3. 내가 좋아요한 글 — 커서 페이징

## 상황

> "마이페이지에 '좋아요한 글' 탭을 만들어요. 최근에 누른 순서로, 스크롤 내리면 계속 불러오게요."

무한 스크롤에는 2-2의 페이지 번호(OFFSET) 방식이 잘 맞지 않는다. 스크롤하는 사이에 새 좋아요가 생기면 다음 페이지가 밀려 같은 글이 또 나오고, 뒤로 갈수록 느려진다. 대신 **"마지막으로 받은 것 다음부터"**를 뜻하는 커서를 돌려준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "마이페이지 — 내가 좋아요한 글",
  "summary": "스크롤하면 이어서 불러온다(무한 스크롤). 페이지 번호 대신 '여기서부터'를 뜻하는 커서를 쓴다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "내가 좋아요한 글",
      "right": "박디비"
    },
    {
      "type": "list",
      "id": "likes",
      "items": [
        {
          "id": "row-14",
          "title": "자유글 03",
          "meta": "이스프링 · 9/27 좋아요"
        },
        {
          "id": "row-12",
          "title": "자유글 01",
          "meta": "이스프링 · 9/25"
        },
        {
          "id": "row-11",
          "title": "트랜잭션은 어디에 거나요?",
          "meta": "이스프링 · 9/25"
        }
      ],
      "footer": "스크롤하면 더 불러와요"
    },
    {
      "type": "text",
      "id": "end",
      "value": "모두 불러왔어요",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "탭 열기",
      "steps": [
        {
          "kind": "user",
          "text": "마이페이지에서 '좋아요한 글' 탭을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/likes?size=3",
          "headers": [
            "Authorization: Bearer tok-park"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post_like l JOIN post p ON p.id = l.post_id WHERE l.member_id = 4 AND (볼 수 있는 글 조건) ORDER BY l.created_at DESC, l.id DESC LIMIT 4",
          "note": "size+1개를 읽어 다음이 있는지 안다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [14, 12, 11], \"nextCursor\": \"MjAyNi0wOS0yNVQwODowMHw2\"}"
        },
        {
          "kind": "screen",
          "text": "3개를 그리고 커서를 기억해 둔다",
          "focus": [
            "likes"
          ]
        }
      ]
    },
    {
      "name": "스크롤 끝에 닿음",
      "steps": [
        {
          "kind": "user",
          "text": "아래로 끝까지 스크롤한다",
          "focus": [
            "likes"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/likes?size=3&cursor=MjAyNi0wOS0yNVQwODowMHw2",
          "headers": [
            "Authorization: Bearer tok-park"
          ]
        },
        {
          "kind": "db",
          "sql": "... AND (l.created_at < '2026-09-25 08:00:00' OR (l.created_at = '2026-09-25 08:00:00' AND l.id < 6)) ORDER BY ... LIMIT 4",
          "note": "OFFSET이 아니라 '마지막 것 다음부터' — 그 사이 새 좋아요가 생겨도 중복이 없다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [9, 4, 2], \"nextCursor\": null}"
        },
        {
          "kind": "screen",
          "text": "nextCursor가 null이면 '모두 불러왔어요'. 지워진 글(8)·팔로워 공개 글(6)은 처음부터 없다",
          "focus": [
            "end"
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
| 메서드·경로 | `GET /api/me/likes?size=10&cursor=...` |
| 인증 | 필요(없으면 `401`) — 2-1에서 "GET이고 헤더가 없으면 비로그인으로 통과"로 바꿨다면, 이 API는 GET이어도 **내 것**이라 그 규칙만으로는 200이 나간다. 컨트롤러(또는 `/api/me/**` 전용 규칙)에서 로그인 회원이 없으면 401을 낸다 |
| 정렬 | **좋아요를 누른 시각** 최신순(`post_like.created_at` DESC), 같으면 `post_like.id` DESC |
| 대상 | 내가 좋아요한 글 중 **지금 볼 수 있는 글만**(2-3 규칙). 지워졌거나 볼 수 없게 된 글은 뺀다 |
| `size` | 생략하면 10, 1~100(밖이면 `400`) |
| `cursor` | 첫 요청은 생략. 다음 요청부터는 직전 응답의 `nextCursor`를 그대로 보낸다 |
| 잘못된 `cursor` | Base64·시각·관계 ID 중 하나라도 해석할 수 없으면 `400`. 서버 오류 `500`으로 처리하지 않는다 |
| 응답 | 아래 JSON. **다음 항목이 없으면 `nextCursor`는 `null`** |

```json
{
  "items": [
    { "postId": 14, "title": "자유글 03", "author": { "id": 3, "nickname": "이스프링" }, "likedAt": "2026-09-27T12:00:00" }
  ],
  "nextCursor": "MjAyNi0wOS0yN1QxMjowMDowMHw4"
}
```

커서 내용은 여러분이 정한다(예: 마지막 항목의 `likedAt`과 좋아요 id를 이어 Base64로). 클라이언트는 열어 보지 않고 그대로 돌려보낸다.

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- size+1개를 읽어 다음이 있는지 안다
- OFFSET이 아니라 '마지막 것 다음부터' — 그 사이 새 좋아요가 생겨도 중복이 없다

<details>
<summary>Controller</summary>

`LikeController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.

```java
@GetMapping("/api/me/likes")
public MyLikesResponse myLikes(@RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
                               @RequestParam(required = false) String cursor,
                               @LoginMember AuthenticatedMember me) {
    if (me == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return likeService.myLikes(me, size, cursor);
}
```

일반 GET의 익명 통과 규칙이 있으므로 이 개인 목록은 Controller에서 토큰 회원을 다시 확인한다.

</details>

<details>
<summary>Service</summary>

`LikeService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

커서는 마지막 `post_like`의 `createdAt|id`를 URL 안전 Base64로 인코딩한다. 다음 요청에서 두 값을 복원해 `size + 1`개를 조회한다. 추가 한 행이 있으면 응답에는 `size`개만 담고 마지막 응답 행으로 `nextCursor`를 만든다.

```java
List<PostLike> rows = postLikeRepository.findMyLikes(
        me.id(), cursorAt, cursorId, PageRequest.of(0, size + 1));
boolean hasNext = rows.size() > size;
List<PostLike> page = hasNext ? rows.subList(0, size) : rows;
String nextCursor = hasNext ? encodeCursor(page.get(page.size() - 1)) : null;
```

커서를 풀 때 Base64, `LocalDateTime`, 양의 관계 ID를 검증하고 잘못된 값은 `400`으로 매핑한다. MyBatis 경로에도 같은 규칙을 적용한다.

</details>

<details>
<summary>DTO / 결과 행</summary>

`MyLikeItemResponse.java`, `MyLikesResponse.java`: 필드 이름·타입을 요청·응답 예시와 대조한다.

```java
public record MyLikeItemResponse(Long postId, String title, AuthorResponse author,
                                 LocalDateTime likedAt) { }
public record MyLikesResponse(List<MyLikeItemResponse> items, String nextCursor) { }
```

</details>

<details>
<summary>JPA / Repository</summary>

`PostLikeRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

`PostLike`와 글·작성자를 함께 읽고 삭제·발행 상태·공개 범위·팔로우·차단을 **쿼리 안에서** 제한한다. 키셋 경계는 두 정렬 키를 모두 포함한다.

```sql
AND (:cursorAt IS NULL OR l.createdAt < :cursorAt
     OR (l.createdAt = :cursorAt AND l.id < :cursorId))
ORDER BY l.createdAt DESC, l.id DESC
```

필터를 Java 목록에서 뒤늦게 적용하면 `size + 1` 의미가 깨진다.

</details>

<details>
<summary>MyBatis / Mapper — 같은 가시성 조건과 키셋</summary>

`MyBatisLikeMapper.findMyLikes`는 글·작성자를 조인하고 JPA와 같은 발행·공개·팔로우·차단 조건을 SQL에 둔다. `MyLikeRow`는 정렬에 필요한 관계 ID(`likeId`)와 응답에 필요한 필드를 함께 받는다.

```xml
<if test="cursorAt != null">
  AND (l.created_at &lt; #{cursorAt} OR
       (l.created_at = #{cursorAt} AND l.id &lt; #{cursorId}))
</if>
ORDER BY l.created_at DESC, l.id DESC
LIMIT #{limit}
```

`limit`에는 `size + 1`을 바인딩한다. `MyBatisLikeService`가 마지막 응답 행의 시각·관계 ID로 같은 형식의 커서를 만든다. Controller·Mapper Java/XML·Service·조회 행의 파일 전문은 아래 MyBatis 코드 접기에 있다.

</details>

## 직접 확인

박디비(`tok-park`)로 확인한다. 박디비는 시드에서 글 8개에 좋아요를 눌렀고, 그중 6번(팔로워 공개 — 박디비는 팔로워가 아님)과 8번(삭제됨)은 지금 볼 수 없다.

```bash
BASE=http://localhost:8080
P='Authorization: Bearer tok-park'
show() { python3 -c 'import sys,json; d=json.load(sys.stdin); print([i["postId"] for i in d["items"]], d["nextCursor"])'; }

curl -s -H "$P" "$BASE/api/me/likes?size=3" | show                     # M1
NEXT=$(curl -s -H "$P" "$BASE/api/me/likes?size=3" | python3 -c 'import sys,json; print(json.load(sys.stdin)["nextCursor"])')
curl -s -H "$P" "$BASE/api/me/likes?size=3&cursor=$NEXT" | show         # M2
curl -s -H "$P" "$BASE/api/me/likes?size=20" | show                    # M3
curl -i "$BASE/api/me/likes"                                            # M4 토큰 없음
curl -i -H "$P" "$BASE/api/me/likes?size=0"                            # M5
curl -i -H "$P" "$BASE/api/me/likes?cursor=bogus"                      # M6 잘못된 커서
curl -i -H "$P" "$BASE/api/me/likes?cursor="                           # M7 빈 커서
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "M1",
      "title": "M1 첫 쪽(3개)",
      "method": "GET",
      "path": "/api/me/likes?size=3",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "M2",
      "title": "M2 다음 쪽(커서)",
      "method": "GET",
      "path": "/api/me/likes?size=3&cursor={{M1.body.nextCursor}}",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "M3",
      "title": "M3 한 번에(20개)",
      "method": "GET",
      "path": "/api/me/likes?size=20",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "M4",
      "title": "M4 토큰 없음",
      "method": "GET",
      "path": "/api/me/likes"
    },
    {
      "id": "M5",
      "title": "M5 size=0",
      "method": "GET",
      "path": "/api/me/likes?size=0",
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "M6",
      "title": "M6 잘못된 커서",
      "method": "GET",
      "path": "/api/me/likes?cursor=bogus",
      "headers": { "Authorization": "Bearer tok-park" }
    },
    {
      "id": "M7",
      "title": "M7 빈 커서",
      "method": "GET",
      "path": "/api/me/likes?cursor=",
      "headers": { "Authorization": "Bearer tok-park" }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "M1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              14,
              12,
              11
            ]
          },
          {
            "path": "$.nextCursor",
            "exists": true
          },
          {
            "path": "$.nextCursor",
            "notEquals": null
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "M2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              9,
              4,
              2
            ]
          },
          {
            "path": "$.nextCursor",
            "equals": null
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "M3",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              14,
              12,
              11,
              9,
              4,
              2
            ]
          },
          {
            "path": "$.nextCursor",
            "equals": null
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "M3",
      "expect": {
        "json": [
          {
            "path": "$.items[0].likedAt",
            "matches": "^2026-09-27T12:00:00"
          },
          {
            "path": "$.items[0].author.id",
            "equals": 3
          },
          {
            "path": "$.items[0].author.nickname",
            "equals": "이스프링"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "M4",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C6",
      "request": "M5",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C7",
      "request": "M6",
      "expect": { "status": 400 }
    },
    {
      "id": "C8",
      "request": "M7",
      "expect": { "status": 400 }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | M1 | `200`, `postId` 순서 `14, 12, 11`, `nextCursor`가 `null`이 아니다 |
| C2 | M2 | `200`, `postId` 순서 `9, 4, 2`, `nextCursor`=`null` |
| C3 | M3 | `200`, `postId` 순서 `14, 12, 11, 9, 4, 2`(6개 — 6번·8번 없음), `nextCursor`=`null` |
| C4 | M3 | 첫 항목 `likedAt`이 `2026-09-27T12:00:00`(소수점 초 무관), `author`=이스프링(3) |
| C5 | M4 | `401` |
| C6 | M5 | `400` |
| C7~C8 | M6~M7 | 잘못된 Base64 또는 빈 커서 `400` |
| R1 | 커서 조건 | `WHERE (created_at, id) < (커서값)` 형태의 키셋 조건을 쓴다. OFFSET을 쓰지 않는다. 동률(같은 시각) 처리를 위해 id까지 비교한다 |
| R2 | 다음 여부 | `size + 1`개를 읽어서 다음이 있는지 판단하는 식으로, 마지막 페이지에서 `nextCursor`를 `null`로 준다 |
| R3 | 필터 위치 | "볼 수 있는 글만"을 쿼리에서 거른다. 메모리에서 거르면 한 페이지가 `size`보다 적게 오면서 `nextCursor`는 남는 문제가 생긴다 |
| R4 | 인덱스 | `post_like`에 `(member_id, created_at, id)` 인덱스가 없어서 정렬에 filesort가 생긴다는 것을 `EXPLAIN`으로 확인했다(인덱스를 추가했다면 스키마 변경 방법도 설명할 수 있다) |

## 필요한 지식

- [W15 — 커서 경계는 완전한 정렬 순서여야 한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#커서-경계는-완전한-정렬-순서여야-한다)
- [W15 — OFFSET은 위치 번호를 알아내기 위해 앞부분을 지나간다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#offset은-위치-번호를-알아내기-위해-앞부분을-지나간다)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 정렬에 인덱스를 쓰는 조건
- [P21 QueryDSL 설정과 동적 쿼리](../../docs/knowledge/P21-querydsl-setup.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 키셋 조건</summary>

JPQL에는 튜플 비교가 없으니 `l.createdAt < :at or (l.createdAt = :at and l.id < :id)`로 풀어 쓴다. 첫 페이지는 이 조건 없이, `order by l.createdAt desc, l.id desc`로 `size + 1`개를 가져온다. 2-3의 "볼 수 있는 글" 조건을 같은 쿼리에 붙인다.
</details>

## 다음 단계

[5-0. 댓글 목록](../ch5-comment/5-0-comment-list.md) — DB 행을 응답 DTO로 읽는 것부터 시작한다.
