# 5-3. 댓글 목록과 삭제

## 상황

> "글 아래에 댓글을 보여 주세요. 답글은 그 댓글 아래에요. 댓글을 지웠는데 답글이 달려 있으면 대화가 끊겨 보이니까 '삭제된 댓글입니다'로 자리만 남겨 주세요."

댓글을 **트리 모양**(최상위 → 답글)으로 조립하고, 삭제·차단 규칙에 따라 무엇을 보여 줄지 정한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "댓글 목록",
  "summary": "평평한 댓글 행들을 트리(최상위 → 답글)로 조립해 보낸다. 지운 댓글·차단한 사람의 댓글 규칙도 여기서.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기 · 댓글",
      "right": "김자바"
    },
    {
      "type": "list",
      "id": "comments",
      "items": [
        {
          "id": "c1",
          "title": "트랜잭션은 서비스 메서드에 거는 게 기본이에요.",
          "meta": "박디비"
        },
        {
          "id": "c2",
          "title": "↳ 감사합니다! 컨트롤러가 아니라 서비스군요.",
          "meta": "이스프링"
        },
        {
          "id": "c3",
          "title": "저는 리포지토리에도 붙였어요.",
          "meta": "한차단"
        },
        {
          "id": "c4",
          "title": "삭제된 댓글입니다",
          "tone": "muted"
        },
        {
          "id": "c5",
          "title": "↳ 어떤 질문이었나요?",
          "meta": "박디비"
        }
      ]
    },
    {
      "type": "actions",
      "id": "menu",
      "items": [
        {
          "id": "delete",
          "label": "내 댓글 삭제",
          "variant": "danger"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "비로그인으로 보기",
      "steps": [
        {
          "kind": "user",
          "text": "글 아래 댓글을 펼친다(로그인 안 함)"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/11/comments"
        },
        {
          "kind": "db",
          "sql": "SELECT c.*, m.nickname FROM comment c JOIN member m ON m.id = c.member_id WHERE c.post_id = 11 ORDER BY c.created_at, c.id",
          "note": "한 번에 읽는다 — 댓글마다 답글을 따로 조회하지 않는다"
        },
        {
          "kind": "server",
          "text": "메모리에서 트리로: 지운 4번은 살아 있는 답글(5)이 있어 자리만 남기고, 답글 없는 지운 6번은 뺀다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"id\": 1, \"replies\": [2]}, {\"id\": 3, \"replies\": []}, {\"id\": 4, \"deleted\": true, \"content\": \"삭제된 댓글입니다\", \"author\": null, \"replies\": [5]}]"
        },
        {
          "kind": "screen",
          "text": "대화가 끊기지 않게 '삭제된 댓글입니다' 자리가 남는다",
          "focus": [
            "c4",
            "c5"
          ]
        }
      ]
    },
    {
      "name": "김자바로 보기",
      "steps": [
        {
          "kind": "user",
          "text": "김자바로 로그인해 같은 댓글을 본다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/11/comments",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "한차단과 김자바는 차단 관계 → 3번 댓글을 뺀다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"id\": 1, ...}, {\"id\": 4, \"deleted\": true, ...}]"
        },
        {
          "kind": "screen",
          "text": "3번이 없다",
          "focus": [
            "c3"
          ]
        }
      ]
    },
    {
      "name": "내 댓글 삭제",
      "steps": [
        {
          "kind": "user",
          "text": "내 댓글의 [삭제]를 누른다",
          "focus": [
            "delete"
          ]
        },
        {
          "kind": "request",
          "method": "DELETE",
          "path": "/api/comments/7",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "db",
          "sql": "UPDATE comment SET deleted_at = NOW() WHERE id = 7"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET comment_count = comment_count - 1 WHERE id = 3"
        },
        {
          "kind": "response",
          "status": 204
        },
        {
          "kind": "screen",
          "text": "목록에서 빠지고 댓글 수가 줄어든다"
        }
      ]
    }
  ]
}
```

## 만들 것

**목록** — `GET /api/posts/{postId}/comments`

| 항목 | 내용 |
|---|---|
| 인증 | 필요 없음(토큰이 있으면 그 회원 기준 — 2-3과 같은 방식) |
| 글 | 2-3 규칙상 볼 수 없는 글이면 `404` |
| 정렬 | 최상위 댓글은 작성 순(`created_at`, `id` 오름차순), 답글도 작성 순 |
| 지운 최상위 댓글 | 살아 있는 답글이 있으면 `deleted: true`, `content: "삭제된 댓글입니다"`, `author: null`로 **자리를 남긴다**. 답글이 없으면 목록에서 뺀다 |
| 지운 답글 | 뺀다 |
| 차단 | 보는 사람과 차단 관계인 회원의 댓글은 뺀다(최상위면 그 아래 답글까지) |

```json
[
  { "id": 1, "author": { "id": 4, "nickname": "박디비" }, "content": "트랜잭션은 서비스 메서드에 거는 게 기본이에요.",
    "createdAt": "2026-09-25T09:00:00", "deleted": false,
    "replies": [ { "id": 2, "author": { "id": 3, "nickname": "이스프링" }, "content": "감사합니다! ...", "createdAt": "2026-09-25T10:00:00" } ] },
  { "id": 4, "author": null, "content": "삭제된 댓글입니다", "createdAt": "2026-09-25T12:00:00", "deleted": true,
    "replies": [ { "id": 5, "author": { "id": 4, "nickname": "박디비" }, "content": "어떤 질문이었나요?", "createdAt": "2026-09-25T13:00:00" } ] }
]
```

**삭제** — `DELETE /api/comments/{id}`

| 항목 | 내용 |
|---|---|
| 인증·권한 | 필요. 댓글 작성자만(아니면 `403`) |
| 저장 | `comment.deleted_at`에 지금 시각(soft delete), `post.comment_count` 1 감소 |
| 응답 | `204` |
| 없거나 이미 지운 댓글 | `404` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 한 번에 읽는다 — 댓글마다 답글을 따로 조회하지 않는다
- 메모리에서 트리로: 지운 4번은 살아 있는 답글(5)이 있어 자리만 남기고, 답글 없는 지운 6번은 뺀다
- 한차단과 김자바는 차단 관계 → 3번 댓글을 뺀다

<details>
<summary>Controller — HTTP 연결</summary>

`CommentController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/posts/{postId}/comments")`, `@DeleteMapping("/api/comments/{id}")`. 변경된 메서드: `list`, `delete`.

```java
@GetMapping("/api/posts/{postId}/comments")
public List<CommentThreadResponse> list(@PathVariable Long postId,
        @LoginMember AuthenticatedMember viewer) {
    return commentService.list(postId, viewer);
}

@DeleteMapping("/api/comments/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id, @LoginMember AuthenticatedMember member) {
    commentService.delete(id, member);
}
```

목록에서 `viewer`는 비로그인일 때 `null`이다. 삭제는 로그인과 작성자 확인이 필요하며 성공 본문 없이 204를 보낸다. 아래 **전체 구현 코드** 접기에 Controller 전문이 있다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CommentReplyResponse.java`, `CommentThreadResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record CommentThreadResponse(Long id, AuthorResponse author, String content,
        LocalDateTime createdAt, boolean deleted, List<CommentReplyResponse> replies) {}
```

답글 DTO에는 `id`, `author`, `content`, `createdAt`만 있다. 삭제·차단된 답글은 DTO로 만들지 않는다. 삭제된 최상위 댓글만 `author=null`, 자리표시자 `content`, `deleted=true`로 만든다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`CommentService.java`, `PostAccessPolicy.java`, `BlockPolicy.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `delete`, `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional(readOnly = true)
public List<CommentThreadResponse> list(Long postId, AuthenticatedMember viewer) {
    Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
    if (!accessPolicy.canView(viewer, post)) throw new PostNotFoundException();
    List<Comment> all = commentRepository.findByPostIdWithMember(postId);
    Long viewerId = viewer == null ? null : viewer.id();
    Set<Long> blocked = viewerId == null ? Set.of() : blockPolicy.blockRelatedIds(viewerId);
    // 답글을 parent ID별로 묶고, 최상위마다 삭제·차단 규칙을 적용해 DTO를 만든다.
}
```

위 코드는 흐름 발췌다. 실제 전문은 `Map<Long, List<Comment>>`에 답글을 묶고, 지운 최상위에 **보이는 답글**이 없을 때만 최상위를 뺀다. 차단 상대 ID는 한 번에 읽으므로 댓글 수에 따라 차단 조회가 늘지 않는다. `delete`는 서비스에서 작성자를 확인한 뒤 조건부 soft delete의 영향 행이 1일 때만 댓글 수를 감소시킨다. 숫자 변경도 1행이어야 하며, 아니면 같은 트랜잭션을 롤백한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`CommentRepository.java`, `PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

```java
@Query("SELECT c FROM Comment c JOIN FETCH c.member " +
       "WHERE c.post.id = :postId ORDER BY c.createdAt ASC, c.id ASC")
List<Comment> findByPostIdWithMember(@Param("postId") Long postId);

@Modifying
@Query("UPDATE Comment c SET c.deletedAt = :now, c.updatedAt = :now " +
       "WHERE c.id = :id AND c.deletedAt IS NULL")
int softDeleteIfLive(@Param("id") Long id, @Param("now") LocalDateTime now);

@Modifying
@Query("UPDATE Post p SET p.commentCount = p.commentCount - 1 " +
       "WHERE p.id = :id AND p.commentCount > 0")
int decrementCommentCount(@Param("id") Long id);
```

댓글·작성자를 한 번에 읽고, 차단 상대 ID도 `MemberBlockRepository.findBlockRelatedIds` 한 번으로 조회한다. 트리 조립 중 댓글마다 DB를 조회하지 않는다. 숫자 감소는 DB의 조건부 `UPDATE`로 실행한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Comment.java`. 선행 단계의 `deleted_at` 매핑을 확인한다. 이번 단계는 조건부 UPDATE로 삭제하므로 엔티티 변경 메서드를 추가하지 않는다.

```java
@Column(name = "deleted_at")
private LocalDateTime deletedAt;
```

행을 지우지 않아 기존 답글의 `parent_id`가 유지된다. `deleted_at`이 채워진 최상위의 표시 여부는 목록 Service가 결정한다. 같은 댓글에 동시 DELETE가 와도 `WHERE deleted_at IS NULL`을 통과한 한 요청만 댓글 수를 내린다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`CommentForbiddenException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleCommentForbidden`.

```java
if (!comment.getMember().getId().equals(loginMember.id())) {
    throw new CommentForbiddenException(); // 403
}
```

없거나 이미 지운 댓글은 `CommentNotFoundException`으로 404다. 권한 확인은 Controller가 아니라 Service에서 하며, 전역 `ApiExceptionHandler`가 Problem Details 응답으로 바꾼다.

</details>

<details>
<summary>MyBatis — JOIN 목록·차단·조건부 삭제 SQL</summary>

대체 구현의 `MyBatisCommentMapper.xml`은 댓글과 작성자를 JOIN해 평평한 행 전체를 작성 순으로 읽고, `MyBatisCommentQueryService`에서 부모별로 묶는다.

```xml
<select id="selectThreadRows" resultType="org.example.comment.CommentTreeRow">
    SELECT c.id, c.parent_id, c.member_id AS author_id, m.nickname AS author_nickname,
           c.content, c.created_at, c.deleted_at
    FROM comment c JOIN member m ON m.id = c.member_id
    WHERE c.post_id = #{postId}
    ORDER BY c.created_at ASC, c.id ASC
</select>
<update id="softDelete">
    UPDATE comment SET deleted_at = #{at}, updated_at = #{at}
    WHERE id = #{id} AND deleted_at IS NULL
</update>
```

로그인 목록은 `selectBlockedMemberIds`를 한 번 더 실행해 차단 상대를 메모리에서 거른다. 삭제는 `findForDelete`로 작성자·삭제 상태를 확인한 뒤 조건부 `softDelete`, `comment_count - 1`을 한 트랜잭션에서 실행한다. SQL의 `#{}`는 값을 바인딩한다. 아래 **MyBatis 대체 구현 코드** 접기에 Mapper·XML·Service 전문이 있다.

</details>

## 직접 확인

11번 글의 시드 댓글: 1(최상위, 박디비) ← 2(답글) · 3(최상위, **한차단** — 김자바와 차단 관계) · 4(최상위, **지움**) ← 5(답글) · 6(최상위, 지움, 답글 없음).

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'
tree() { python3 -c 'import sys,json; print([(c["id"], c["deleted"], [r["id"] for r in c["replies"]]) for c in json.load(sys.stdin)])'; }
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

curl -s "$BASE/api/posts/11/comments" | tree                 # N1 비로그인
curl -s -H "$K" "$BASE/api/posts/11/comments" | tree         # N2 김자바
curl -i -H "$K" "$BASE/api/posts/9/comments"                 # N3 볼 수 없는 글

CID=$(curl -s -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 지울 댓글"}' | jid)   # N4
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$L"          # N5 남의 댓글
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$K"          # N6 작성자
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$K"          # N7 다시
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "N1",
      "title": "11번 글 댓글 — 비로그인",
      "method": "GET",
      "path": "/api/posts/11/comments"
    },
    {
      "id": "N2",
      "title": "11번 글 댓글 — 김자바",
      "method": "GET",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "N3",
      "title": "볼 수 없는 글의 댓글",
      "method": "GET",
      "path": "/api/posts/9/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "N4",
      "title": "지울 댓글 달기",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 지울 댓글"
      }
    },
    {
      "id": "N5",
      "title": "남의 댓글 지우기(이스프링)",
      "method": "DELETE",
      "path": "/api/comments/{{N4.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "N6",
      "title": "작성자가 지우기",
      "method": "DELETE",
      "path": "/api/comments/{{N4.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "N7",
      "title": "다시 지우기",
      "method": "DELETE",
      "path": "/api/comments/{{N4.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "N1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              1,
              3,
              4
            ]
          },
          {
            "path": "$[0].replies[0].id",
            "equals": 2
          },
          {
            "path": "$[2].deleted",
            "equals": true
          },
          {
            "path": "$[2].content",
            "equals": "삭제된 댓글입니다"
          },
          {
            "path": "$[2].author",
            "equals": null
          },
          {
            "path": "$[2].replies[*].id",
            "equals": [
              5
            ]
          },
          {
            "path": "$[*].replies[*].id",
            "notContains": 6
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "N2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              1,
              4
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "N3",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "N4",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "N5",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "N6",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "N7",
          "expect": {
            "status": 404
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). 5-2 채점에서 1번 댓글에 김자바의 답글이 더 달려 있을 수 있다 — 그래도 아래 기대는 같다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | N1 | `200`. 최상위 id 순서 `1, 3, 4`. 1번의 답글 첫 항목은 2번. 4번은 `deleted`=true, `content`=`삭제된 댓글입니다`, `author`=null, 답글 [5]. 6번은 없다 |
| C2 | N2 | `200`. 최상위 id 순서 `1, 4` — 3번(한차단)이 빠진다 |
| C3 | N3 | `404` |
| D1 | N4 **전** `SELECT comment_count FROM post WHERE id = 3` | 값 c를 기억 |
| C4 | N4 / N5 / N6 / N7 | `201` / `403` / `204` / `404` |
| D2 | N7 뒤 같은 쿼리 | c — 달았다 지웠으니 원래대로 |
| D3 | `SELECT deleted_at IS NOT NULL FROM comment WHERE id = {N4 응답 id}` | `1` — 행은 남아 있다 |
| R1 | 쿼리 수 | 댓글을 한두 번의 쿼리로 읽어서 메모리에서 트리로 조립한다. 댓글마다 답글을 따로 조회하지 않는다(N+1) |
| R2 | 표시 규칙 | 자리 남기기·빼기·차단 규칙이 한 곳에 모여 있고 테스트하기 쉽다(엔티티 → 트리 DTO 변환 함수) |
| R3 | 삭제 권한 | 작성자 확인이 서비스에 있다 |
| R4 | 숫자 | 삭제 시 `comment_count` 감소가 같은 트랜잭션이다 |

## 필요한 지식

- [S09 — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1) — 트리를 만들다 생기는 N+1
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 저장 모양(평평한 행)과 응답 모양(트리)이 다르다
- [D11 — 인증과 인가](../../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인)
- [J25 자료구조 지도](../../docs/knowledge/J25-data-structures-map.md) — `Map<Long, List<…>>`로 묶기

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 트리 조립</summary>

그 글의 댓글을 작성자와 함께 한 번에 읽는다(`join fetch c.member`). `Map<Long, List<Comment>> repliesByParent`로 답글을 부모 id별로 묶은 뒤, 최상위 댓글을 돌면서 규칙(지움·차단)에 따라 DTO를 만든다. "살아 있는 답글이 있나"는 차단으로 빠진 답글을 제외하고 센다.
</details>

## 다음 단계

[6-0. 북마크 설정](../ch6-bookmark/6-0-set-bookmark.md) — PUT 한 동작과 내 관계 행부터 만든다.
