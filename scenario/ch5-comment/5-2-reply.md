# 5-2. 답글(1단계까지)

## 상황

> "댓글에 답글을 달 수 있게 해 주세요. 근데 답글의 답글은 안 돼요. 화면이 계속 오른쪽으로 밀려서요."

같은 API에 `parentId`를 받는다. 부모가 **같은 글의, 최상위, 지워지지 않은 댓글**인지 확인해야 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "답글 달기",
  "summary": "댓글에 답글을 단다. 답글의 답글은 막는다(화면이 계속 오른쪽으로 밀리지 않게).",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기",
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
          "id": "c-new",
          "title": "↳ [채점] 답글",
          "meta": "김자바 · 방금 전"
        }
      ]
    },
    {
      "type": "field",
      "id": "reply-input",
      "label": "답글",
      "value": "[채점] 답글"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "reply",
          "label": "답글 등록",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "답글에는 답글을 달 수 없어요",
      "tone": "warning"
    }
  ],
  "flows": [
    {
      "name": "댓글에 답글",
      "steps": [
        {
          "kind": "user",
          "text": "1번 댓글의 [답글]을 눌러 쓰고 등록한다",
          "focus": [
            "c1",
            "reply-input",
            "reply"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/11/comments",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"content\": \"[채점] 답글\", \"parentId\": 1}"
        },
        {
          "kind": "server",
          "text": "부모 확인: 같은 글의 댓글인가, 최상위인가, 지워지지 않았나"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO comment (post_id, member_id, parent_id, content, ...) VALUES (11, 2, 1, '[채점] 답글', ...)"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET comment_count = comment_count + 1 WHERE id = 11"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/comments/8"
          ],
          "body": "{\"id\": 8, \"parentId\": 1, ...}"
        },
        {
          "kind": "screen",
          "text": "1번 아래에 들여쓰기로 붙는다",
          "focus": [
            "c-new"
          ]
        }
      ]
    },
    {
      "name": "답글에 또 답글",
      "steps": [
        {
          "kind": "user",
          "text": "(화면에선 버튼을 숨기지만) 2번 답글에 답글을 보낸다",
          "focus": [
            "c2"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/11/comments",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"content\": \"[채점] 답글의 답글\", \"parentId\": 2}"
        },
        {
          "kind": "server",
          "text": "부모(2)가 이미 답글이다 → 400. '부모가 없다'(404)와 '부모가 규칙에 안 맞다'(400)를 구분한다"
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
          "text": "'답글에는 답글을 달 수 없어요'",
          "focus": [
            "toast"
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
| 메서드·경로 | `POST /api/posts/{postId}/comments`(5-1과 같다) |
| 요청 | `{ "content": "...", "parentId": 1 }` — `parentId`가 없으면 5-1처럼 최상위 댓글 |
| 응답 | `201`, 5-1과 같은 JSON에 `parentId`가 채워진다 |
| `comment_count` | 답글도 1 증가 |

| 부모(`parentId`) 상황 | 결과 |
|---|---|
| 없는 댓글 id | `404` |
| 다른 글의 댓글 | `400` |
| 답글(부모가 또 부모를 가짐) | `400` |
| 지워진 댓글 | `400` |

**필드 규칙** — `content`는 5-1과 같다. 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `content` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | 1~1000자 | 문자열 | 없음 | `400`, `errors`에 `content` |
| `parentId` | 선택 | 생략·`null`이면 최상위 댓글 | 있는 댓글 id | 숫자 | `null` | 숫자가 아니면(`"abc"`) `400`, 없는 댓글(`999999`·`-1`) `404`, 위 표의 규칙 위반 `400` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 부모 확인: 같은 글의 댓글인가, 최상위인가, 지워지지 않았나
- 부모(2)가 이미 답글이다 → 400. '부모가 없다'(404)와 '부모가 규칙에 안 맞다'(400)를 구분한다

<details>
<summary>Controller — HTTP 연결</summary>

`CommentController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

```java
@PostMapping("/api/posts/{postId}/comments")
public ResponseEntity<CommentResponse> create(@PathVariable Long postId,
        @LoginMember AuthenticatedMember loginMember,
        @Valid @RequestBody CommentCreateRequest request) {
    Comment comment = commentService.create(postId, loginMember, request);
    return ResponseEntity.created(URI.create("/api/comments/" + comment.getId()))
            .body(CommentResponse.from(comment));
}
```

경로는 5-1과 같다. `parentId` 유무는 Service가 판단하며, 응답에는 저장된 답글의 ID와 `parentId`가 들어간다. 아래 **전체 구현 코드** 접기에서 Controller 전문을 볼 수 있다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CommentCreateRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record CommentCreateRequest(
        @NotBlank @Size(max = 1000) String content,
        Long parentId
) {}
```

`parentId`가 `null`이면 최상위 댓글이다. 응답 DTO `CommentResponse`는 선행 단계 파일이고, 저장된 `Comment`의 부모 ID를 `parentId`로 보낸다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`CommentService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public Comment create(Long postId, AuthenticatedMember member, CommentCreateRequest request) {
    Post post = findCommentablePost(postId, member);
    Comment parent = resolveParent(postId, request.parentId());
    Comment saved = commentRepository.save(new Comment(post, author, parent,
            request.content(), LocalDateTime.now()));
    postRepository.incrementCommentCount(postId);
    return saved;
}
```

위 코드는 흐름을 보여 주는 발췌다. 실제 전문에서는 `author`를 `MemberRepository`에서 얻고 반환 전에 작성자 이름을 로딩한다. `resolveParent`는 `findById` 실패 시 404, 다른 글·답글·삭제된 댓글이면 400을 던진다. 검증이 끝난 뒤 저장과 숫자 증가를 한 트랜잭션에서 실행한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Comment.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id")
private Comment parent;
```

`parent_id`는 같은 `comment` 테이블의 ID를 가리킨다. 부모가 없는 행은 최상위 댓글이고, 부모가 있는 행은 한 단계 답글이다. 한 단계 제한은 DB 컬럼 자체가 아니라 Service의 부모 검증으로 지킨다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`CommentNotFoundException.java`, `InvalidParentCommentException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleCommentNotFound`, `handleInvalidParentComment`.

```java
@ExceptionHandler(CommentNotFoundException.class)
public ProblemDetail handleCommentNotFound(CommentNotFoundException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    problem.setInstance(URI.create(request.getRequestURI()));
    return problem;
}
```

규칙 위반은 `InvalidParentCommentException`을 별도로 받아 `BAD_REQUEST`로 바꾼다. `@Valid`의 내용 오류는 필드별 `errors`를 포함한 400이고, `parentId`의 타입 자체가 잘못되면 본문 역직렬화 단계에서 400이다.

</details>

<details>
<summary>MyBatis — 부모 조회·INSERT·트랜잭션</summary>

MyBatis 대체 코드에서는 `MyBatisCommentMapper.findParent(parentId)`가 `comment`의 `post_id`, `parent_id`, `deleted_at`을 읽는다. `MyBatisCommentService`가 JPA와 같은 순서로 검사한다.

```xml
<select id="findParent" resultType="org.example.comment.ParentCommentRow">
    SELECT id, post_id, parent_id, deleted_at FROM comment WHERE id = #{parentId}
</select>
<insert id="insertComment" parameterType="org.example.comment.CommentInsertRow"
        useGeneratedKeys="true" keyProperty="id">
    INSERT INTO comment(post_id, member_id, parent_id, content, created_at, updated_at)
    VALUES (#{postId}, #{memberId}, #{parentId}, #{content}, #{at}, #{at})
</insert>
```

`@Transactional` 메서드에서 부모를 조회하고, `insertComment`의 생성 키를 응답 ID에 넣은 뒤 `comment_count = comment_count + 1`을 실행한다. 두 SQL 중 하나가 실패하면 함께 롤백한다. 아래 **MyBatis 대체 구현 코드** 접기에는 Mapper·XML·Service 전문이 있다.

</details>

## 직접 확인

11번 글(이스프링의 "트랜잭션은 어디에 거나요?")에는 시드 댓글이 있다: 1번(최상위), 2번(1번의 답글), 6번(지워진 최상위).

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
post() { curl -s -i -X POST "$BASE/api/posts/$1/comments" -H "$K" -H 'Content-Type: application/json' -d "$2"; echo; echo ----; }

post 11 '{"content":"[채점] 답글","parentId":1}'          # Q1
post 11 '{"content":"[채점] 답글의 답글","parentId":2}'   # Q2
post 11 '{"content":"[채점] 지운 댓글에","parentId":6}'   # Q3
post 3  '{"content":"[채점] 다른 글 부모","parentId":1}'  # Q4
post 11 '{"content":"[채점] 없는 부모","parentId":999999}' # Q5

# 잘못된 입력 — 500이 아니다
post 11 '{"content":"[채점] 숫자 아닌 부모","parentId":"abc"}'  # V1 400
post 11 '{"content":"[채점] 음수 부모","parentId":-1}'          # V2 404
post 11 '{"content":"   ","parentId":1}'                       # V3 400
post 3  '{"content":"[채점] 부모 null","parentId":null}'         # B1 201 최상위
post 11 '{"content":"[채점] 관찰-소수 부모","parentId":1.5}'     # O1 관찰
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "Q1",
      "title": "1번 댓글에 답글",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 답글",
        "parentId": 1
      }
    },
    {
      "id": "Q2Q3Q4",
      "title": "답글의 답글·지운 댓글에·다른 글의 부모(세 요청을 한 번에)",
      "method": "POST",
      "path": "/api/posts/{{pid}}/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"content\":\"{{content}}\",\"parentId\":{{parent}}}",
      "concurrent": {
        "count": 3,
        "vars": {
          "pid": [
            "11",
            "11",
            "3"
          ],
          "parent": [
            "2",
            "6",
            "1"
          ],
          "content": [
            "[채점] 답글의 답글",
            "[채점] 지운 댓글에",
            "[채점] 다른 글 부모"
          ]
        }
      }
    },
    {
      "id": "Q5",
      "title": "없는 부모",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 없는 부모",
        "parentId": 999999
      }
    },
    {
      "id": "V1",
      "title": "V1 parentId가 숫자가 아님",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 숫자 아닌 부모",
        "parentId": "abc"
      }
    },
    {
      "id": "V2",
      "title": "V2 parentId 음수(없는 댓글)",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 음수 부모",
        "parentId": -1
      }
    },
    {
      "id": "V3",
      "title": "V3 답글인데 content가 공백만",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "   ",
        "parentId": 1
      }
    },
    {
      "id": "B1",
      "title": "B1 parentId null이면 최상위(통과)",
      "method": "POST",
      "path": "/api/posts/3/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 부모 null",
        "parentId": null
      }
    },
    {
      "id": "O1",
      "title": "관찰 O1 — parentId 1.5(소수)",
      "method": "POST",
      "path": "/api/posts/11/comments",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "[채점] 관찰-소수 부모",
        "parentId": 1.5
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Q1",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.parentId",
            "equals": 1
          },
          {
            "path": "$.postId",
            "equals": 11
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "Q2Q3Q4",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C3",
      "request": "Q5",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "V1",
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
          "request": "V2",
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
        }
      ]
    },
    {
      "id": "C5",
      "request": "B1",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.parentId",
            "equals": null
          },
          {
            "path": "$.postId",
            "equals": 3
          }
        ]
      }
    },
    {
      "id": "C6",
      "manual": "관찰(채점 안 함) — O1 parentId 1.5: 정답 코드에서는 201 — Jackson이 소수를 정수 1로 잘라 1번 댓글의 답글로 저장한다(DeserializationFeature.ACCEPT_FLOAT_AS_INT 기본값). 막으려면 spring.jackson.deserialization.accept-float-as-int=false"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | Q1 **전** `SELECT comment_count FROM post WHERE id = 11` | 값 c를 기억 |
| C1 | Q1 | `201`, `parentId`=1, `postId`=11 |
| C2 | Q2 / Q3 / Q4 | `400` / `400` / `400` |
| C3 | Q5 | `404` |
| C4 | V1 / V2 / V3 | `parentId` `"abc"` `400`(`application/problem+json`) / `-1` `404` / 답글이어도 공백 `content`는 `400`(`errors`에 `content`) — 어느 것도 `500`이 아니다 |
| C5 | B1 | `parentId`가 `null`이면 최상위 댓글로 `201`, `parentId`=null(3번 글에 단다 — 11번 글 최상위 목록은 5-3이 정확히 본다) |
| C6 | 관찰 O1 — `parentId` `1.5` | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. (정답 코드: `201` — 소수가 `1`로 잘려 1번 댓글의 답글이 된다) |
| D2 | Q5까지 끝난 뒤 같은 쿼리(V1~V3 포함, O1 전) | c+1 — 실패한 요청은 숫자를 바꾸지 않았다 |
| D3 | `SELECT parent_id FROM comment WHERE id = {Q1 응답 id}` | `1` |
| R1 | 부모 검증 | 세 조건(같은 글·최상위·안 지워짐)을 서비스에서 확인하고, 실패를 의미 있는 예외로 던진다 |
| R2 | 자기 참조 | `Comment.parent`가 `@ManyToOne(LAZY)` 자기 참조다 |
| R3 | 400과 404 | "부모가 없다"(404)와 "부모가 규칙에 안 맞다"(400)를 나눈 이유를 설명할 수 있다 |

## 필요한 지식

- [P20 JPA 엔티티·연관관계 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md)
- [W10 — 서비스와 DB: 안내 검사와 최종 고유성](../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성) — 어떤 검사를 어디에 둘까
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md)

## 다음 단계

[5-3. 댓글 목록과 삭제](5-3-comment-list-delete.md)
