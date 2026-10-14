# 5-1. 댓글 작성

## 상황

> "글 아래에 댓글을 달 수 있게 해 주세요. 목록 화면에 댓글 수도 보여야 해요."

댓글 저장 자체는 1장과 비슷하다. 새로운 점은 **다른 테이블의 숫자(`post.comment_count`)를 같이 맞춰야 한다**는 것이다. 둘 중 하나만 반영되면 목록의 댓글 수가 틀어진다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "댓글 쓰기",
  "summary": "댓글을 저장하고, 목록에 보이는 댓글 수(post.comment_count)도 같은 트랜잭션에서 맞춘다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기",
      "right": "김자바"
    },
    {
      "type": "text",
      "id": "post-title",
      "value": "인덱스는 언제 타나요?",
      "emphasis": "title"
    },
    {
      "type": "stats",
      "id": "post-stats",
      "items": [
        {
          "id": "comments",
          "label": "댓글",
          "value": "1"
        }
      ]
    },
    {
      "type": "list",
      "id": "comments",
      "items": [
        {
          "id": "new-comment",
          "title": "[채점] 댓글",
          "meta": "김자바 · 방금 전"
        }
      ]
    },
    {
      "type": "field",
      "id": "comment-input",
      "label": "댓글",
      "value": "",
      "error": "댓글을 입력해 주세요."
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "submit",
          "label": "등록",
          "variant": "primary"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "댓글 달기",
      "steps": [
        {
          "kind": "user",
          "text": "댓글을 쓰고 [등록]을 누른다",
          "focus": [
            "comment-input",
            "submit"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/3/comments",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"content\": \"[채점] 댓글\"}"
        },
        {
          "kind": "server",
          "text": "볼 수 있는 PUBLISHED 글인가 → 댓글 저장 + 댓글 수 +1(한 트랜잭션)"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO comment (post_id, member_id, parent_id, content, ...) VALUES (3, 2, NULL, '[채점] 댓글', ...)"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET comment_count = comment_count + 1 WHERE id = 3"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/comments/7"
          ],
          "body": "{\"id\": 7, \"postId\": 3, \"parentId\": null, \"author\": {\"id\": 2, \"nickname\": \"김자바\"}, \"content\": \"[채점] 댓글\", ...}"
        },
        {
          "kind": "screen",
          "text": "입력칸을 비우고 응답으로 목록 맨 아래에 붙인다. 댓글 수 +1",
          "focus": [
            "new-comment",
            "comments"
          ]
        }
      ]
    },
    {
      "name": "공백만 입력",
      "steps": [
        {
          "kind": "user",
          "text": "스페이스만 넣고 [등록]을 누른다",
          "focus": [
            "comment-input",
            "submit"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/3/comments",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"content\": \"   \"}"
        },
        {
          "kind": "server",
          "text": "검증 실패 — 저장도, 숫자 변경도 없다"
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
          "text": "입력칸 아래 오류",
          "focus": [
            "comment-input"
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
| 메서드·경로 | `POST /api/posts/{postId}/comments` |
| 인증 | 필요 |
| 요청 | `{ "content": "좋은 글 감사합니다" }` |
| 응답 | `201`, `Location: /api/comments/{id}`, 아래 JSON |
| 함께 바꿀 것 | `post.comment_count` 1 증가(같은 트랜잭션) |

```json
{ "id": 7, "postId": 3, "parentId": null, "author": { "id": 2, "nickname": "김자바" }, "content": "좋은 글 감사합니다", "createdAt": "2026-10-06T18:00:00" }
```

| 상황 | 결과 |
|---|---|
| `content`가 없음·공백·1000자 초과 | `400` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| 토큰 없음 / 정지 회원 | `401` / `403` |

**필드 규칙** — 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `content` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 모두 거절 | 1~1000자(정확히 1000자는 성공, 1001자는 거절) | 문자열 | 없음 | `400`, `errors`에 `content` |
| `{postId}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`, 없는 글 `404` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400` |

`parentId`(답글)는 다음 단계(5-2)에서 다룬다.

## 구현 가이드

`POST /api/posts/{postId}/comments` 계약을 기준으로 아래 순서대로 구현한다. 먼저 직접 작성하고, 막힌 역할만 펼쳐 아래의 전체 구현 코드와 비교한다.

화면 시나리오에서 서버가 맡는 일:

- 볼 수 있는 PUBLISHED 글인가 → 댓글 저장 + 댓글 수 +1(한 트랜잭션)

- 검증 실패 — 저장도, 숫자 변경도 없다

<details>
<summary>Controller / HTTP</summary>

`CommentController.java`: 경로·쿼리·본문을 각 입력 형태에 맞게 받고 응답 상태와 DTO를 계약대로 만든다. 회원 ID는 인증 정보에서 얻는다. 확인할 메서드: `create`.

```java
@PostMapping("/api/posts/{postId}/comments")
public ResponseEntity<CommentResponse> create(@PathVariable Long postId,
        @LoginMember AuthenticatedMember me, @Valid @RequestBody CommentCreateRequest request) {
    Comment saved = commentService.create(postId, me, request);
    return ResponseEntity.created(URI.create("/api/comments/" + saved.getId()))
            .body(CommentResponse.from(saved));
}
```

경로 ID와 JSON 본문을 구분하고 회원 ID를 본문에서 받지 않는다. MyBatis 경로에서는 Service가 만든 DTO를 `ResponseEntity.created`에 담는다.

</details>

<details>
<summary>DTO / 입력·응답</summary>

`CommentCreateRequest.java`, `CommentResponse.java`: 요청 검증과 응답 필드를 계약에 맞춘다. 생략·null·기본값·길이의 차이를 확인한다.

```java
public record CommentCreateRequest(
        @NotBlank(message = "댓글을 입력해 주세요.")
        @Size(max = 1000, message = "댓글은 1000자 이하여야 합니다.")
        String content) { }
```

응답 DTO에는 글 ID·부모 ID(null)·작성자·내용·생성 시각·삭제 여부를 담는다. 엔티티를 그대로 JSON으로 반환하지 않는다.

</details>

<details>
<summary>Service / 규칙·트랜잭션</summary>

`CommentService.java`: 권한·상태·소유권을 먼저 확인하고 관련 쓰기를 한 트랜잭션으로 묶는다. 확인할 메서드: `create`.

```java
@Transactional
public Comment create(Long postId, AuthenticatedMember me, CommentCreateRequest request) {
    Post post = findCommentablePost(postId, me); // 볼 수 있는 PUBLISHED 글만
    Member author = memberRepository.getReferenceById(me.id());
    Comment saved = commentRepository.save(
            new Comment(post, author, request.content(), LocalDateTime.now()));
    postRepository.incrementCommentCount(postId);
    saved.getMember().getNickname(); // 응답 DTO를 위한 값 확인
    return saved;
}
```

저장과 숫자 증가 중 하나라도 실패하면 두 쓰기를 함께 롤백한다.

</details>

<details>
<summary>JPA / Repository·SQL</summary>

`CommentRepository.java`, `PostRepository.java`: `save`로 관계 행을 만들고 DB가 숫자를 한 번에 증가시키는 JPQL을 확인한다.

```java
@Modifying
@Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
int incrementCommentCount(@Param("id") Long id);
```

`post.comment_count`를 먼저 읽어 Java에서 +1로 계산하면 동시 작성에서 갱신 손실이 생긴다.

</details>

<details>
<summary>Entity / 테이블·상태</summary>

`Comment.java`: 테이블·외래키·컬럼 제약을 맞추고 변경 가능한 상태를 엔티티 메서드로 표현한다.

`post_id`와 `member_id`는 필수 연관이고, 최상위 댓글의 `parent_id`는 `NULL`이다. 생성 시 `created_at`·`updated_at`을 함께 채우며 `deleted_at`은 비운다.

</details>

<details>
<summary>MyBatis / Mapper — 생성 키와 댓글 수 함께 저장</summary>

MyBatis로 구현한다면 `CommentRepository.save`와 댓글 수 증가 쿼리를 Mapper의 두 문장으로 바꾼다. `@Transactional`은 Service에 두고 글 조회·권한 확인, 댓글 INSERT, `comment_count` 증가를 같은 트랜잭션에서 실행한다.

```xml
<insert id="insertComment" useGeneratedKeys="true" keyProperty="id">
  INSERT INTO comment(post_id, member_id, parent_id, content, created_at, updated_at)
  VALUES (#{postId}, #{memberId}, NULL, #{content}, #{at}, #{at})
</insert>
<update id="incrementCommentCount">
  UPDATE post SET comment_count = comment_count + 1 WHERE id = #{postId}
</update>
```

`CommentInsertRow.id`에 생성 키를 받아 응답 DTO와 `Location`에 쓴다. 두 번째 문장의 영향 행이 1이 아니면 실패로 처리해 INSERT도 롤백한다. 댓글 내용 검증과 2-3 조회 권한 확인은 JPA 방식과 같다. 실행 가능한 Controller·Service·Mapper Java/XML·DTO 전문은 아래 MyBatis 역할별 코드 접기에 있다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
cc() { docker compose exec -T mysql mysql -ucommunity -pcommunity community -N -e "SELECT comment_count FROM post WHERE id = $1" 2>/dev/null; }

cc 3                                                                                                   # 전
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 댓글"}'    # W1
cc 3                                                                                                   # 후
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"   "}'            # W2
LONG=$(printf 'a%.0s' $(seq 1 1001))
curl -i -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d "{\"content\":\"$LONG\"}"      # W3
curl -i -X POST "$BASE/api/posts/9/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 차단"}'     # W4
curl -i -X POST "$BASE/api/posts/8/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"[채점] 삭제글"}'   # W5
curl -i -X POST "$BASE/api/posts/3/comments" -H 'Content-Type: application/json' -d '{"content":"[채점] 토큰 없음"}'        # W6

# 잘못된 입력 — 모두 400(500이 아니다)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{}'                 # V1
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":null}'   # V2
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":""}'     # V3
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":'        # V4
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/abc/comments" -H "$K" -H 'Content-Type: application/json' -d '{"content":"x"}' # V5
# 경계 바로 안쪽 — 정확히 1000자는 201
B="[채점] 경계-$(printf '가%.0s' $(seq 1 992))"
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/3/comments" -H "$K" -H 'Content-Type: application/json' -d "{\"content\":\"$B\"}"  # B1
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "W1",
      "title": "댓글 달기",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 댓글"
      }
    },
    {
      "id": "W2W3",
      "title": "공백 본문·1001자 본문(두 요청을 한 번에)",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "{{content}}"
      },
      "concurrent": {
        "count": 2,
        "vars": {
          "content": [
            "   ",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          ]
        }
      }
    },
    {
      "id": "W4W5",
      "title": "차단한 회원의 글·삭제된 글(두 요청을 한 번에)",
      "method": "POST",
      "path": "/api/posts/{{pid}}/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "{{content}}"
      },
      "concurrent": {
        "count": 2,
        "vars": {
          "pid": [
            "9",
            "8"
          ],
          "content": [
            "[채점] 차단",
            "[채점] 삭제글"
          ]
        }
      }
    },
    {
      "id": "W6",
      "title": "토큰 없음",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "body": {
        "content": "[채점] 토큰 없음"
      }
    },
    {
      "id": "V1",
      "title": "V1 content 없음",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "V2",
      "title": "V2 content null",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": null
      }
    },
    {
      "id": "V3",
      "title": "V3 빈 문자열",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": ""
      }
    },
    {
      "id": "V4",
      "title": "V4 깨진 JSON",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"content\":"
    },
    {
      "id": "V5",
      "title": "V5 경로 id가 숫자가 아님",
      "method": "POST",
      "path": "/api/posts/abc/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 숫자 아님"
      }
    },
    {
      "id": "B1",
      "title": "B1 정확히 1000자(통과)",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 경계-가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "B2",
      "title": "B2 1자(통과)",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "가"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "W1",
      "expect": {
        "status": 201,
        "headers": {
          "Location": {
            "contains": "/api/comments/{{W1.body.id}}"
          }
        },
        "json": [
          {
            "path": "$.postId",
            "equals": 3
          },
          {
            "path": "$.parentId",
            "equals": null
          },
          {
            "path": "$.author.id",
            "equals": 2
          },
          {
            "path": "$.content",
            "equals": "[채점] 댓글"
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "W2W3",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C3",
      "request": "W4W5",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C4",
      "request": "W6",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            },
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "V3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "W2W3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.content",
                "equals": "[채점] 경계-가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.content",
                "equals": "가"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). c는 W1 전에 조회한 3번 글의 `comment_count`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | W1 **전** `SELECT comment_count FROM post WHERE id = 3` | 값 c를 기억 |
| C1 | W1 | `201`, `Location`이 `/api/comments/{응답 id}`로 끝난다. `postId`=3, `parentId`=null, `author.id`=2, `content`=`[채점] 댓글` |
| D2 | W6까지 끝난 뒤 같은 쿼리(V1~V5 포함, B1·B2 전) | c+1 — 실패한 요청은 숫자를 바꾸지 않았다 |
| D3 | `SELECT p.comment_count = (SELECT COUNT(*) FROM comment c WHERE c.post_id = 3 AND c.deleted_at IS NULL) FROM post p WHERE p.id = 3` | `1` |
| C2 | W2 / W3 | `400` / `400` |
| C3 | W4 / W5 | `404` / `404` |
| C4 | W6 | `401` |
| C5 | V1 / V2 / V3 / W2·W3 | `content` 없음·`null`·빈 문자열·공백만·1001자 모두 `400`이고 `errors`에 `content`(V1은 `application/problem+json`) |
| C6 | V4 / V5 | 깨진 JSON `400`(`application/problem+json`) / 경로 `abc` `400` — 어느 것도 `500`이 아니다 |
| C7 | B1 / B2 | 경계 바로 안쪽은 통과한다 — 정확히 1000자 `201`, 1자 `201`(W6 **뒤**에 보내므로 D2의 c+1에는 들어가지 않는다) |
| R1 | 숫자 갱신 | 댓글 저장과 `comment_count` 증가가 한 트랜잭션이다. 증가는 4-2처럼 DB에서 한 번에(`+ 1`) 한다 |
| R2 | 연관관계 | `Comment` → `Post`, `Member`가 `@ManyToOne(LAZY)`. 글 엔티티에 댓글 컬렉션을 두었다면 그 이유가 있다 |
| R3 | 응답 | 엔티티 대신 DTO를 돌려준다 |

## 필요한 지식

- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md) — 두 테이블을 함께 바꿀 때
- [P18 — 가장 싼 해결책: 조건부 원자 UPDATE](../../docs/knowledge/P18-concurrency-inventory.md#22-가장-싼-해결책-조건부-원자-update)
- [P20 — 연관관계의 주인](../../docs/knowledge/P20-jpa-entity-mapping.md#24-연관관계의-주인)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)

## 다음 단계

[5-2. 답글(1단계까지)](5-2-reply.md)
