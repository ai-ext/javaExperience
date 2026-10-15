# 6-3. 내 북마크 목록

## 상황

> "저장한 글 목록을 보여 주세요. 폴더별로도요. 그런데 저장해 둔 글이 지워졌으면 목록에서 말없이 사라지면 안 돼요 — 사용자는 '내가 저장한 게 왜 없어졌지?' 해요. '볼 수 없는 글'이라고 표시해 주세요."

4-3(좋아요한 글)과 비슷한 커서 목록이지만 규칙 하나가 **반대**다. 좋아요 목록은 볼 수 없는 글을 **뺐고**, 북마크 목록은 **남기고 표시**한다. 사용자가 직접 모아 둔 것이기 때문이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "내 북마크 목록",
  "summary": "좋아요 목록과 반대로, 볼 수 없게 된 글을 빼지 않고 '볼 수 없는 글'로 남긴다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "내 북마크",
      "right": "이스프링"
    },
    {
      "type": "chips",
      "id": "folders",
      "items": [
        "전체",
        "기본",
        "스프링 공부",
        "나중에 읽기"
      ]
    },
    {
      "type": "list",
      "id": "bookmarks",
      "items": [
        {
          "id": "b5",
          "title": "자유글 02",
          "meta": "박디비 · 나중에 읽기"
        },
        {
          "id": "b4",
          "title": "JPA 연관관계 매핑 정리",
          "meta": "이스프링 · 스프링 공부"
        },
        {
          "id": "b3",
          "title": "볼 수 없는 글이에요",
          "meta": "기본",
          "tone": "muted"
        },
        {
          "id": "b2",
          "title": "차단 확인용 글",
          "meta": "한차단 · 기본"
        },
        {
          "id": "b6",
          "title": "볼 수 없는 글이에요",
          "meta": "나중에 읽기 · 메모: 나중에 다시",
          "tone": "muted"
        },
        {
          "id": "b1",
          "title": "스터디원 구해요",
          "meta": "박디비 · 메모: 스터디 참고"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "전체 보기",
      "steps": [
        {
          "kind": "user",
          "text": "내 북마크를 연다",
          "focus": [
            "folders"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/bookmarks?size=20",
          "headers": [
            "Authorization: Bearer tok-lee"
          ]
        },
        {
          "kind": "server",
          "text": "북마크마다 2-3 규칙으로 판정 — 볼 수 없으면 available: false, 제목·작성자는 null(지워진 글 제목을 흘리지 않는다)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [{\"bookmarkId\": 5, \"available\": true, \"title\": \"자유글 02\"}, …, {\"bookmarkId\": 3, \"postId\": 10, \"available\": false, \"title\": null}], \"nextCursor\": null}"
        },
        {
          "kind": "screen",
          "text": "사용자가 모아 둔 것을 말없이 지우지 않는다",
          "focus": [
            "b3",
            "b6"
          ]
        }
      ]
    },
    {
      "name": "폴더 고르기",
      "steps": [
        {
          "kind": "user",
          "text": "'나중에 읽기' 칩을 누른다",
          "focus": [
            "folders"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/bookmarks?folder=12",
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
          "body": "{\"items\": [{\"bookmarkId\": 5, ...}, {\"bookmarkId\": 6, \"available\": false, ...}], \"nextCursor\": null}"
        },
        {
          "kind": "screen",
          "text": "그 폴더의 북마크만",
          "focus": [
            "b5",
            "b6"
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
| 메서드·경로 | `GET /api/me/bookmarks?folder=...&size=10&cursor=...` |
| 인증 | 필요 |
| `folder` | 생략 = 전체, `default` = 기본 폴더(`folder_id IS NULL`), 숫자 = 그 폴더(남의 폴더·없는 폴더면 `404`) |
| 정렬 | 북마크한 시각 최신순(`bookmark.created_at` DESC), 같으면 `bookmark.id` DESC |
| 커서 | 4-3과 같은 방식. 다음이 없으면 `nextCursor`=`null` |
| `size` | 생략하면 10, 1~100 |
| 볼 수 없게 된 글 | 빼지 않는다. `available: false`, `title`·`author`는 `null`(지워진 글의 제목을 흘리지 않는다) |

```json
{
  "items": [
    { "bookmarkId": 5, "postId": 13, "folderId": 12, "memo": null, "bookmarkedAt": "2026-09-26T10:00:00",
      "available": true, "title": "자유글 02", "author": { "id": 4, "nickname": "박디비" } },
    { "bookmarkId": 3, "postId": 10, "folderId": null, "memo": null, "bookmarkedAt": "2026-09-24T12:00:00",
      "available": false, "title": null, "author": null }
  ],
  "nextCursor": null
}
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 북마크마다 2-3 규칙으로 판정 — 볼 수 없으면 available: false, 제목·작성자는 null(지워진 글 제목을 흘리지 않는다)

<details>
<summary>Controller — HTTP 연결</summary>

`BookmarkController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/me/bookmarks")`. 변경된 메서드: `myBookmarks`.

```java
@GetMapping("/api/me/bookmarks")
public MyBookmarksResponse myBookmarks(@RequestParam(required = false) String folder,
                                       @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
                                       @RequestParam(required = false) String cursor,
                                       @LoginMember AuthenticatedMember me) {
    if (me == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return bookmarkService.myBookmarks(me, folder, size, cursor);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`BookmarkItemResponse.java`, `MyBookmarksResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`BookmarkItemResponse`에는 `bookmarkId`, `postId`, `folderId`, `memo`, `bookmarkedAt`, `available`, `title`, `author`가 있다. `MyBookmarksResponse`는 `items`와 `nextCursor`를 담는다. `available=false`면 응답을 만들 때 `title`과 `author`를 둘 다 `null`로 둔다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`BookmarkService.java`, `LikeService.java`, `PostAccessPolicy.java`, `BlockPolicy.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `myBookmarks`, `viewableBy`, `blockRelatedIds`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
Cursor after = Cursor.decode(cursor);
List<Bookmark> rows = bookmarkRepository.findMyBookmarks(me.id(), folderMode, folderId,
        after == null ? null : after.at(), after == null ? null : after.id(),
        PageRequest.of(0, size + 1));
boolean hasNext = rows.size() > size;
List<Bookmark> page = hasNext ? rows.subList(0, size) : rows;
Predicate<Post> viewable = accessPolicy.viewableBy(me);
List<BookmarkItemResponse> items = page.stream()
        .map(b -> toItem(b, viewable.test(b.getPost()))).toList();
```

`viewableBy`는 팔로우·차단 ID를 한 번에 가져온다. 볼 수 없는 글도 북마크 행은 유지하고, 응답에서 제목과 작성자를 숨긴다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BookmarkRepository.java`, `FollowRepository.java`, `MemberBlockRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

```sql
SELECT b.id, b.post_id, b.folder_id, b.memo, b.created_at
FROM bookmark b
WHERE b.member_id = :memberId
  AND (b.created_at < :cursorAt OR (b.created_at = :cursorAt AND b.id < :cursorId))
ORDER BY b.created_at DESC, b.id DESC
LIMIT :sizePlusOne;
```

첫 페이지는 커서 조건을 생략한다. JPA `findMyBookmarks`는 글·작성자를 함께 fetch하고, `ALL`·`DEFAULT`·`ID` 폴더 조건을 적용한다. `size+1`번째 행은 다음 페이지 존재 여부를 판단하는 데만 쓴다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidCursorException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleInvalidCursor`.

형식이 잘못된 커서는 `Cursor.decode`에서 `InvalidCursorException`으로 바꾸고 `400` Problem Details를 돌린다. 남의 폴더 ID는 `BookmarkFolderNotFoundException`으로 `404`다.

</details>

<details>
<summary>설정·보조 코드</summary>

`Cursor.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `encode`, `decode`.

```java
String raw = at + "|" + id;
String encoded = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
```

`decode`는 반대로 시각과 ID를 복원한다. 다음 커서는 현재 페이지의 마지막 `(created_at, id)`로 만든다.

</details>

<details>
<summary>MyBatis — 목록·커서·공개 판정 SQL</summary>

MyBatis 대체 코드 토글의 `MyBatisBookmarkMapper.xml`은 `bookmark`를 키셋 순서로 조회하고 `CASE`로 2-3 공개 규칙을 적용한다. 폴더와 커서 조건은 요청이 있을 때만 붙인다.

```xml
<if test="cursorAt != null">
    AND (b.created_at &lt; #{cursorAt}
         OR (b.created_at = #{cursorAt} AND b.id &lt; #{cursorId}))
</if>
ORDER BY b.created_at DESC, b.id DESC
LIMIT #{limit}
```

`limit`은 `size+1`이다. 서비스는 `available=false` 행도 목록에 남기고 `title`·`author`를 `null`로 응답한다.

</details>

## 직접 확인

이스프링(`tok-lee`)의 시드 북마크 6개 중 10번(운영자 숨김)과 8번(삭제됨)은 지금 볼 수 없다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "K1",
      "title": "전체(size=20)",
      "method": "GET",
      "path": "/api/me/bookmarks?size=20",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K2",
      "title": "폴더 11",
      "method": "GET",
      "path": "/api/me/bookmarks?folder=11",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K3",
      "title": "폴더 12",
      "method": "GET",
      "path": "/api/me/bookmarks?folder=12",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K4",
      "title": "기본 폴더",
      "method": "GET",
      "path": "/api/me/bookmarks?folder=default",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K5",
      "title": "첫 쪽(size=4)",
      "method": "GET",
      "path": "/api/me/bookmarks?size=4",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K6",
      "title": "다음 쪽",
      "method": "GET",
      "path": "/api/me/bookmarks?size=4&cursor={{K5.body.nextCursor}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K7",
      "title": "박디비의 폴더",
      "method": "GET",
      "path": "/api/me/bookmarks?folder=1",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K8",
      "title": "토큰 없음",
      "method": "GET",
      "path": "/api/me/bookmarks"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "K1",
      "expect": {
        "json": [
          {
            "path": "$.items[*].bookmarkId",
            "equals": [
              5,
              4,
              3,
              2,
              6,
              1
            ]
          },
          {
            "path": "$.items[*].postId",
            "equals": [
              13,
              2,
              10,
              9,
              8,
              5
            ]
          },
          {
            "path": "$.items[*].available",
            "equals": [
              true,
              true,
              false,
              true,
              false,
              true
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
      "id": "C2",
      "request": "K1",
      "expect": {
        "json": [
          {
            "path": "$.items[2].title",
            "equals": null
          },
          {
            "path": "$.items[2].author",
            "equals": null
          },
          {
            "path": "$.items[4].title",
            "equals": null
          },
          {
            "path": "$.items[4].author",
            "equals": null
          },
          {
            "path": "$.items[5].memo",
            "equals": "스터디 참고"
          }
        ]
      },
      "note": "위치(3·5·6번째)는 C1의 순서 기준이다 — 순서가 틀리면 이 항목도 실패한다. 위치 없이 찾으려면 항목 객체 전체(bookmarkedAt 형식까지)를 맞춰야 해서, 명세가 정하지 않은 형식을 강요하지 않으려고 위치로 본다"
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "K2",
          "expect": {
            "json": [
              {
                "path": "$.items[*].bookmarkId",
                "equals": [
                  4,
                  1
                ]
              },
              {
                "path": "$.items[*].postId",
                "equals": [
                  2,
                  5
                ]
              }
            ]
          }
        },
        {
          "request": "K3",
          "expect": {
            "json": [
              {
                "path": "$.items[*].bookmarkId",
                "equals": [
                  5,
                  6
                ]
              },
              {
                "path": "$.items[*].postId",
                "equals": [
                  13,
                  8
                ]
              }
            ]
          }
        },
        {
          "request": "K4",
          "expect": {
            "json": [
              {
                "path": "$.items[*].bookmarkId",
                "equals": [
                  3,
                  2
                ]
              },
              {
                "path": "$.items[*].postId",
                "equals": [
                  10,
                  9
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "K5",
          "expect": {
            "json": [
              {
                "path": "$.items[*].bookmarkId",
                "equals": [
                  5,
                  4,
                  3,
                  2
                ]
              },
              {
                "path": "$.nextCursor",
                "type": "string"
              }
            ]
          }
        },
        {
          "request": "K6",
          "expect": {
            "json": [
              {
                "path": "$.items[*].bookmarkId",
                "equals": [
                  6,
                  1
                ]
              },
              {
                "path": "$.nextCursor",
                "equals": null
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "K7",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "K8",
          "expect": {
            "status": 401
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 항목은 (bookmarkId, postId, available)로 적었다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K1 | `(5,13,T) (4,2,T) (3,10,F) (2,9,T) (6,8,F) (1,5,T)` 순서, `nextCursor`=null |
| C2 | K1 | `available`=false인 두 항목(10번·8번 글)은 `title`·`author`가 `null`. 1번 항목의 `memo`=`스터디 참고` |
| C3 | K2 / K3 / K4 | `(4,2) (1,5)` / `(5,13) (6,8)` / `(3,10) (2,9)` |
| C4 | K5 / K6 | `(5) (4) (3) (2)` + `nextCursor` 있음 / `(6) (1)` + `nextCursor`=null |
| C5 | K7 / K8 | `404` / `401` |
| R1 | 4-3과의 차이 | 볼 수 없는 글을 빼지 않고 `available`로 표시한다. 같은 2-3 규칙을 쿼리 조건이 아니라 **항목별 판정**에 쓴다 |
| R2 | 정보 노출 | 볼 수 없는 글의 제목·작성자를 응답에 넣지 않는다 |
| R3 | 쿼리 | 항목마다 글·작성자를 따로 조회하지 않는다(N+1). 판정에 필요한 팔로우·차단 정보도 한 번에 가져온다 |
| R4 | 커서 재사용 | 4-3의 커서 만들기·해석 코드를 재사용한다 |

## 필요한 지식

- [W15 — 커서 경계는 완전한 정렬 순서여야 한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#커서-경계는-완전한-정렬-순서여야-한다)
- [W13 프론트와 백엔드의 경계](../../docs/knowledge/W13-frontend-backend-boundary.md) — 무엇을 응답에 넣지 말아야 하나
- [S09 — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1)

## 다음 단계

[6-4. 북마크 메모 부분 수정](6-4-patch-bookmark-memo.md) — 생략과 명시적 null을 구분한다.
