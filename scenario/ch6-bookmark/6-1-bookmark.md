# 6-1. 북마크 추가·삭제

## 상황

> "나중에 다시 보려고 글을 저장(북마크)하고 싶어요. 폴더에 넣을 수도 있고, 메모도 달고요."

좋아요와 비슷하지만 다른 점이 있다. **내 글도 저장할 수 있고**, 저장할 때 폴더와 메모를 함께 정한다. PUT은 "없으면 만들고, 있으면 폴더·메모를 바꾼다"(upsert)로 만든다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "북마크(저장) 시트",
  "summary": "저장하면서 폴더와 메모를 고른다. 내 글도 저장할 수 있다.",
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
      "value": "JPA 연관관계 매핑 정리",
      "emphasis": "title"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "bookmark",
          "label": "🔖 저장",
          "variant": "secondary"
        }
      ]
    },
    {
      "type": "select",
      "id": "folder",
      "label": "폴더",
      "value": "기본 폴더"
    },
    {
      "type": "field",
      "id": "memo",
      "label": "메모",
      "value": "[채점] 메모"
    },
    {
      "type": "actions",
      "id": "sheet",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        },
        {
          "id": "remove",
          "label": "저장 취소",
          "variant": "ghost"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "폴더를 찾을 수 없어요",
      "tone": "error"
    }
  ],
  "flows": [
    {
      "name": "저장하기",
      "steps": [
        {
          "kind": "user",
          "text": "🔖를 누르고 기본 폴더로 저장한다",
          "focus": [
            "bookmark",
            "folder",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/2/bookmark",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{}"
        },
        {
          "kind": "server",
          "text": "없으면 만들고, 있으면 폴더·메모를 바꾼다(upsert) — UNIQUE(member_id, post_id)가 최후의 방어선"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO bookmark (member_id, post_id, folder_id, memo, ...) VALUES (2, 2, NULL, NULL, ...)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"bookmarkId\": 7, \"postId\": 2, \"bookmarked\": true, \"folderId\": null, \"memo\": null}"
        },
        {
          "kind": "screen",
          "text": "아이콘이 채워진다",
          "focus": [
            "bookmark"
          ]
        }
      ]
    },
    {
      "name": "메모 바꾸기",
      "steps": [
        {
          "kind": "user",
          "text": "메모를 쓰고 다시 저장한다",
          "focus": [
            "memo",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/2/bookmark",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"memo\": \"[채점] 메모\"}"
        },
        {
          "kind": "db",
          "sql": "UPDATE bookmark SET memo = '[채점] 메모', updated_at = NOW() WHERE member_id = 2 AND post_id = 2"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"bookmarkId\": 7, \"memo\": \"[채점] 메모\", ...}"
        },
        {
          "kind": "screen",
          "text": "bookmarkId는 그대로 — 행이 늘지 않았다",
          "focus": [
            "memo"
          ]
        }
      ]
    },
    {
      "name": "남의 폴더 번호로",
      "steps": [
        {
          "kind": "user",
          "text": "(조작된 요청) 이스프링의 폴더 11번으로 저장한다",
          "focus": [
            "folder"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/2/bookmark",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"folderId\": 11}"
        },
        {
          "kind": "server",
          "text": "폴더를 id로만 찾지 않고 '내 폴더인가'까지 확인 → 아니면 404(남의 폴더가 있다는 것도 숨긴다)"
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
          "text": "'폴더를 찾을 수 없어요'",
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

| 메서드·경로 | 의미 | 응답 |
|---|---|---|
| `PUT /api/posts/{id}/bookmark` | 북마크 상태로 만든다. 본문 `{ "folderId"?, "memo"? }` | `200` 아래 JSON |
| `DELETE /api/posts/{id}/bookmark` | 북마크를 없앤다(없어도 성공) | `204` |

```json
{ "bookmarkId": 7, "postId": 2, "bookmarked": true, "folderId": null, "memo": "[채점] 메모" }
```

| 상황 | 결과 |
|---|---|
| 이미 북마크인데 또 PUT | `200`, 행은 그대로 1개. 보낸 `folderId`·`memo`로 바꾼다(안 보내면 `null` = 기본 폴더·메모 없음) |
| `folderId`가 남의 폴더이거나 없는 폴더 | `404` |
| `memo` 200자 초과 | `400` |
| (PUT) 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| (DELETE) 글이 지워졌거나 볼 수 없게 됐어도 | `204` — 글 상태를 따지지 않고 **내 북마크 행만** 지운다. 6-3에서 "볼 수 없는 글"로 남은 북마크도 사용자가 지울 수 있어야 한다 |
| 토큰 없음 | `401` |

**필드 규칙** — PUT 본문. 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `folderId` | 선택 | 생략·`null`이면 기본 폴더 | 내 폴더 id | 숫자 | `null` | 숫자가 아니면(`"abc"`) `400`, 남의 폴더·없는 폴더 `404` |
| `memo` | 선택 | 생략·`null`이면 메모 없음, `""`도 받는다 | 0~200자(정확히 200자는 성공, 201자는 거절) | 문자열 | `null` | `400`, `errors`에 `memo` |
| 본문 전체 | 선택 | 본문이 없으면 `{}`와 같다 | — | JSON | — | JSON이 아니면 `400` |
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`, 없는 글·볼 수 없는 글 `404` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 없으면 만들고, 있으면 폴더·메모를 바꾼다(upsert) — UNIQUE(member_id, post_id)가 최후의 방어선
- 폴더를 id로만 찾지 않고 '내 폴더인가'까지 확인 → 아니면 404(남의 폴더가 있다는 것도 숨긴다)

<details>
<summary>Controller — HTTP 연결</summary>

`BookmarkController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PutMapping("/api/posts/{id}/bookmark")`, `@DeleteMapping("/api/posts/{id}/bookmark")`. 변경된 메서드: `bookmark`, `unbookmark`.

```java
@PutMapping("/api/posts/{id}/bookmark")
public BookmarkResponse bookmark(@PathVariable Long id, @LoginMember AuthenticatedMember me,
                                 @RequestBody(required = false) JsonNode request) {
    return bookmarkService.bookmark(id, me, BookmarkRequest.from(request));
}

@DeleteMapping("/api/posts/{id}/bookmark")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void unbookmark(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
    bookmarkService.unbookmark(id, me);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`BookmarkRequest.java`, `BookmarkResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record BookmarkRequest(Long folderId, String memo) {
    public static BookmarkRequest from(JsonNode body) {
        if (body == null) return new BookmarkRequest(null, null);
        if (!body.isObject()) throw new InvalidBookmarkFieldException("body", "JSON 객체를 보내 주세요.");
        JsonNode folder = body.get("folderId");
        JsonNode memo = body.get("memo");
        Long folderId = null;
        if (folder != null && !folder.isNull()) {
            if (!folder.isIntegralNumber() || !folder.canConvertToLong() || folder.longValue() <= 0) {
                throw new InvalidBookmarkFieldException("folderId", "폴더 ID는 양의 정수여야 합니다.");
            }
            folderId = folder.asLong();
        }
        String memoValue = null;
        if (memo != null && !memo.isNull()) {
            if (!memo.isTextual() || memo.asText().length() > 200) {
                throw new InvalidBookmarkFieldException("memo", "메모는 문자열이며 200자 이하여야 합니다.");
            }
            memoValue = memo.asText();
        }
        return new BookmarkRequest(folderId, memoValue);
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`BookmarkService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `bookmark`, `unbookmark`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public BookmarkResponse bookmark(Long postId, AuthenticatedMember me, BookmarkRequest request) {
    findBookmarkablePost(postId, me); // 볼 수 있는 PUBLISHED 글인지 먼저 확인
    BookmarkFolder folder = findMyFolder(request.folderId(), me.id());
    bookmarkRepository.upsert(me.id(), postId, folder == null ? null : folder.getId(), request.memo());
    Bookmark saved = bookmarkRepository.findCurrentForUpdate(me.id(), postId).orElseThrow();
    return toResponse(saved);
}
```

DELETE는 글 공개 상태를 다시 검사하지 않고 `(memberId, postId)`로 내 행만 지운다. 없는 행을 지워도 `204`다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BookmarkFolderRepository.java`, `BookmarkRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```sql
INSERT INTO bookmark(member_id, post_id, folder_id, memo, created_at, updated_at)
VALUES (:memberId, :postId, :folderId, :memo, NOW(), NOW())
ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), memo = VALUES(memo), updated_at = NOW();
```

`UNIQUE(member_id, post_id)`가 동시 요청을 한 행으로 합친다. `findCurrentForUpdate`의 `SELECT ... FOR UPDATE`는 갱신 직후 현재 행과 ID를 읽는다. 폴더 조회는 `findByIdAndMember_Id`를 써야 한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Bookmark.java`, `BookmarkFolder.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `change`.

`Bookmark`의 `(member_id, post_id)` 유일 제약, `folder_id` 외래키, `memo`와 생성·수정 시각을 확인한다. `change`는 후속 폴더 이동에서도 사용한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`BookmarkFolderNotFoundException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleBookmarkFolderNotFound`.

```java
@ExceptionHandler(InvalidBookmarkFieldException.class)
public ProblemDetail handleInvalidBookmarkField(InvalidBookmarkFieldException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
    return problem;
}
```

남의 폴더·없는 폴더는 모두 `BookmarkFolderNotFoundException`을 거쳐 `404`다.

</details>

<details>
<summary>MyBatis — 같은 계약의 Mapper·SQL</summary>

MyBatis 대체 코드 토글의 `MyBatisBookmarkService`, `MyBatisBookmarkMapper.xml`을 펼쳐 비교한다. Controller와 DTO의 입력 검증은 JPA 버전과 공유한다.

```xml
<insert id="upsert" parameterType="org.example.bookmark.BookmarkInsertRow">
    INSERT INTO bookmark(member_id, post_id, folder_id, memo, created_at, updated_at)
    VALUES (#{memberId}, #{postId}, #{folderId}, #{memo}, #{at}, #{at})
    ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), memo = VALUES(memo), updated_at = NOW()
</insert>
<delete id="deleteByMemberAndPost">
    DELETE FROM bookmark WHERE member_id = #{memberId} AND post_id = #{postId}
</delete>
```

MyBatis의 `findBookmark`도 `FOR UPDATE`로 현재 행을 읽고, `findOwnedFolder`는 `member_id`까지 묶어 조회한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "B0",
      "title": "처음 상태로(북마크 지우기)",
      "method": "DELETE",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "B1",
      "title": "북마크",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "B2",
      "title": "메모 바꾸기",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "memo": "[채점] 메모"
      }
    },
    {
      "id": "B3",
      "title": "이스프링의 폴더로",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": 11
      }
    },
    {
      "id": "B4",
      "title": "김자바를 차단한 회원의 글",
      "method": "PUT",
      "path": "/api/posts/9/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "V1",
      "title": "V1 메모 201자",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "memo": "[채점] 경계-메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메"
      }
    },
    {
      "id": "V2",
      "title": "V2 folderId가 숫자가 아님",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "abc"
      }
    },
    {
      "id": "V3",
      "title": "V3 없는 폴더",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": 999999
      }
    },
    {
      "id": "V4",
      "title": "V4 깨진 JSON",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"memo\":"
    },
    {
      "id": "V5",
      "title": "V5 경로 id가 숫자가 아님",
      "method": "PUT",
      "path": "/api/posts/abc/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "V6",
      "title": "V6 메모 정확히 200자(통과)",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "memo": "[채점] 경계-메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메"
      }
    },
    {
      "id": "B5",
      "title": "북마크 지우기",
      "method": "DELETE",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "B6",
      "title": "한 번 더 지우기",
      "method": "DELETE",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "B7",
      "title": "토큰 없음",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "body": {}
    },
    {
      "id": "V7",
      "title": "V7 Long 범위 초과 folderId",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"folderId\":9223372036854775808}"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "B0",
      "expect": {
        "status": 204
      }
    },
    {
      "id": "C2",
      "request": "B1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.bookmarked",
            "equals": true
          },
          {
            "path": "$.postId",
            "equals": 2
          },
          {
            "path": "$.folderId",
            "equals": null
          },
          {
            "path": "$.bookmarkId",
            "type": "number"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "B2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.memo",
            "equals": "[채점] 메모"
          },
          {
            "path": "$.bookmarkId",
            "equals": "{{B1.body.bookmarkId}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "B3",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C5",
      "request": "B4",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "B5",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "B6",
          "expect": {
            "status": 204
          }
        }
      ]
    },
    {
      "id": "C7",
      "request": "B7",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C8",
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
                "contains": "memo"
              }
            ]
          }
        },
        {
          "request": "V2",
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
          "request": "V3",
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
      "id": "C9",
      "request": "V6",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.memo",
            "equals": "[채점] 경계-메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메메"
          },
          {
            "path": "$.bookmarkId",
            "equals": "{{B1.body.bookmarkId}}"
          }
        ]
      }
    },
    {
      "id": "C10",
      "request": "V7",
      "expect": {
        "status": 400,
        "headers": {
          "Content-Type": {
            "contains": "application/problem+json"
          }
        }
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | B0 | `204` |
| C2 | B1 | `200`, `bookmarked`=true, `postId`=2, `folderId`=null, `bookmarkId`가 숫자 |
| C3 | B2 | `200`, `memo`=`[채점] 메모`, `bookmarkId`가 B1과 같다 |
| D1 | B2 뒤 `SELECT COUNT(*), MAX(memo) FROM bookmark WHERE member_id = 2 AND post_id = 2` (9-5를 마친 DB라면 `memo` 대신 `note`) | `1`, `[채점] 메모` |
| C4 | B3 | `404` — 남의 폴더 |
| C5 | B4 | `404` |
| C6 | B5 / B6 | `204` / `204` |
| D2 | B6 뒤 `SELECT COUNT(*) FROM bookmark WHERE member_id = 2 AND post_id = 2` | `0` |
| C7 | B7 | `401` |
| C8 | V1 / V2 / V3 / V4 / V5 | 메모 201자 `400`(`errors`에 `memo`) / `folderId` `"abc"` `400` / 없는 폴더 `404` / 깨진 JSON `400` / 경로 `abc` `400` — 어느 것도 `500`이 아니다 |
| C9 | V6 | 메모 정확히 200자는 `200`, 같은 북마크(`bookmarkId`가 B1과 같다) — 경계 바로 안쪽은 통과 |
| C10 | V7 | Long 범위 초과 `folderId`는 `400` — 잘린 정수로 조회하거나 `500`이 나면 안 된다 |
| R1 | 남의 폴더 | 폴더를 id로만 찾지 않고 "내 폴더인가"까지 확인한다(`findByIdAndMember` 등). 남의 폴더가 있다는 사실이 드러나지 않게 404로 준다 |
| R2 | upsert | 있으면 고치고 없으면 만드는 흐름이 한 트랜잭션이다. 동시에 두 번 와도 UNIQUE(`member_id, post_id`)가 최후의 방어선이다 |
| R3 | 4장과 비교 | 좋아요와 북마크가 비슷한 코드를 복사해 붙인 것이 아니라 필요한 만큼만 공유한다(억지로 합치지도 않는다) |

## 필요한 지식

- [D11 — 안전한 SQL 바인딩과 IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) — 남의 폴더 id
- [P18 — 좌석은 재고보다 유니크 제약이 핵심이다](../../docs/knowledge/P18-concurrency-inventory.md#28-좌석은-재고보다-유니크-제약이-핵심이다)
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PUT과 204

## 다음 단계

[6-2. 폴더](6-2-folders.md)
