# 6-0. 북마크 설정 — 내 글과 폴더까지

## 상황

> "읽던 글을 나중에 다시 보려고 저장해요. 메모와 폴더를 고를 수 있지만, 다른 사람 폴더에는 저장하면 안 돼요."

먼저 `PUT`으로 북마크를 **만드는 동작**에 집중한다. 이미 저장한 글은 다시 요청해도 같은 북마크 한 행이다. 6-1에서는 같은 URL에 수정(upsert)과 DELETE를 붙인다.

## 화면 시나리오

```screen
{
  "title": "글 북마크",
  "summary": "토큰의 회원이 글을 저장하고 선택한 메모를 함께 기록한다.",
  "screen": [
    { "type": "text", "id": "post", "value": "JPA 연관관계 매핑 정리", "emphasis": "title" },
    { "type": "field", "id": "memo", "label": "메모", "value": "[북마크실습] 복습" },
    { "type": "actions", "id": "save", "items": [{ "id": "submit", "label": "저장", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "기본 폴더에 저장",
    "steps": [
      { "kind": "request", "method": "PUT", "path": "/api/posts/2/bookmark", "headers": ["Authorization: Bearer tok-kimjava"], "body": "{\"memo\":\"[북마크실습] 복습\"}" },
      { "kind": "server", "text": "글 조회 권한과 폴더 소유권을 확인하고 내 북마크 한 행을 저장한다" },
      { "kind": "db", "sql": "INSERT INTO bookmark (member_id,post_id,folder_id,memo,created_at,updated_at) VALUES (2,2,NULL,'[북마크실습] 복습',NOW(),NOW())", "note": "UNIQUE(member_id,post_id)" },
      { "kind": "response", "status": 200, "body": "{\"bookmarkId\":7,\"postId\":2,\"bookmarked\":true,\"folderId\":null,\"memo\":\"[북마크실습] 복습\"}" }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `PUT /api/posts/{id}/bookmark`; 토큰의 회원으로 저장한다. 내 글도 북마크 가능하다. |
| 요청 DTO | `{ "folderId"?, "memo"? }`. 생략·`null` 폴더는 기본 폴더, 생략·`null` 메모는 메모 없음. `memo`는 최대 200자. |
| 성공 | `200` `{ "bookmarkId", "postId", "bookmarked": true, "folderId", "memo" }`. 반복 PUT은 같은 `bookmarkId`와 한 행이다. |
| 실패 | 토큰 없음 `401`; 없는/볼 수 없는/미발행 글 `404`; 다른 회원 폴더나 없는 폴더 `404`; 메모 201자·잘못된 타입 `400`. |
| DB | `bookmark`의 `UNIQUE(member_id, post_id)`를 확인한다. `folder_id`가 있으면 `bookmark_folder.member_id`도 토큰 회원과 같아야 한다. |

Controller는 경로 ID와 `@RequestBody` 요청 DTO를 받고 북마크 응답 DTO를 돌려준다. 본문이 없는 요청은 `{}`와 같이 처리한다.

Service는 먼저 글 가시성을 확인한 뒤 **폴더 ID만 찾지 말고 회원 ID까지 조건**으로 조회한다. 폴더 검증에 실패하면 북마크 행을 새로 만들지 않는다. 이미 저장돼 있으면 이번 단계에서는 같은 값의 반복 PUT을 처리하고, 보내는 값으로 메모·폴더를 바꾸는 upsert는 6-1에서 완성한다.

좋아요와 달리 내 글 저장은 허용된다. 좋아요의 `like_count`처럼 `post`의 숫자 열을 변경하지 않는다. 저장한 글을 나중에 읽을 때 글이 삭제될 수 있으므로 북마크 행을 어떻게 표시할지는 6-3에서 다룬다.

## 구현 가이드

먼저 기본 폴더에 메모 없이 저장하고, 다음에 메모와 폴더 소유권 검사를 붙인다.

<details>
<summary>Controller — 경로 ID와 선택 본문 DTO</summary>

```java
@RestController
@RequestMapping("/api/posts/{id}/bookmark")
public class BookmarkController {
    @PutMapping
    public BookmarkResponse set(@PathVariable Long id,
            @LoginMember AuthenticatedMember me,
            @RequestBody(required = false) BookmarkRequest request) {
        return service.set(id, me, request == null ? new BookmarkRequest(null, null) : request);
    }
}
```

`@RequestBody(required = false)`는 본문 없는 PUT도 `{}`와 같게 받기 위한 선택이다. 클래스 경로와 `@PutMapping`을 합치면 `/api/posts/{id}/bookmark`다. 실제 클래스에는 Service 필드와 생성자도 있다.

</details>

<details>
<summary>DTO — folderId·memo 입력과 저장 상태 응답</summary>

```java
public record BookmarkRequest(JsonNode folderId, JsonNode memo) { }
public record BookmarkResponse(
        Long bookmarkId, Long postId, boolean bookmarked,
        Long folderId, String memo) { }
```

`JsonNode`는 Boot 4의 `tools.jackson.databind.JsonNode`를 import한다. `folderId`는 `isIntegralNumber()`와 `canConvertToLong()`으로 Long 범위의 양의 정수인지, `memo`는 문자열/null인지 Service에서 확인해 잘못된 입력을 `400`으로 처리한다. 메모 길이는 최대 200자다. 응답의 `bookmarkId`는 반복 PUT에서도 같아야 한다.

</details>

<details>
<summary>Service — 내 폴더 확인 뒤 북마크 한 행 저장</summary>

글이 보이는지 먼저 검사한다. `folderId`가 있으면 `bookmarkFolderRepository.findByIdAndMemberId(folderId, memberId)`처럼 **ID와 소유 회원을 함께** 조건으로 찾아야 한다. 찾지 못하면 `404`를 내고 북마크는 쓰지 않는다. 메모는 아래처럼 검사한 뒤 문자열만 저장한다.

```java
JsonNode raw = request.memo();
if (raw != null && !raw.isNull() && !raw.isTextual()) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}
String memo = raw == null || raw.isNull() ? null : raw.asText();
if (memo != null && memo.length() > 200) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}
```

`@Transactional` 안에서 `(memberId, postId)` 유일 키로 중복을 합친다. 둘 다 먼저 조회하고 저장하는 방식은 동시 PUT에서 한쪽이 중복 키 오류를 맞으므로, DB의 원자적 INSERT를 사용한다. 메모·폴더를 다른 값으로 바꾸는 upsert는 6-1에서 완성한다.

```java
bookmarks.insertIfAbsent(me.id(), postId, folderId, memo);
Bookmark bookmark = bookmarks.findCurrentForUpdate(me.id(), postId)
        .orElseThrow(() -> new IllegalStateException("북마크 저장 결과를 찾을 수 없습니다."));
return new BookmarkResponse(bookmark.getId(), postId, true,
        bookmark.getFolder() == null ? null : bookmark.getFolder().getId(), bookmark.getMemo());
```

위 코드는 `set` 메서드 중 저장·응답 부분이다. 글 가시성, 폴더 소유권, 메모 검증은 이 분기보다 먼저 끝낸다. 이 단계에서는 기존 행의 메모·폴더를 바꾸지 않는다. `FOR UPDATE`는 MySQL `REPEATABLE_READ`에서 충돌 뒤 오래된 조회 스냅샷 때문에 방금 존재가 확인된 행을 못 찾는 일을 막는다.

</details>

<details>
<summary>JPA / Repository — 유일 제약과 폴더 외래키 확인</summary>

`bookmark(member_id, post_id)` 유일 제약이 마지막 중복 방어선이다. 다음 SELECT로 행 하나와 폴더 소유자를 확인한다.

```sql
SELECT bm.id, bm.member_id, bm.post_id, bm.folder_id, bm.memo
FROM bookmark bm WHERE bm.member_id = 2 AND bm.post_id = 2;
SELECT id, member_id FROM bookmark_folder WHERE id = 11;
```

JPA의 `BookmarkRepository.insertIfAbsent`는 native SQL `INSERT ... ON DUPLICATE KEY UPDATE id = id`로 동시에 온 반복 PUT을 한 행으로 합친다. `findCurrentForUpdate`는 같은 회원·글 조건으로 현재 행을 읽는다.

`BookmarkFolderRepository.findByIdAndMember_Id`는 폴더 ID와 소유자를 함께 확인한다. DB의 `UNIQUE(member_id, post_id)`가 중복을 막는다.

</details>

<details>
<summary>MyBatis — 폴더 소유권·멱등 INSERT</summary>

`MyBatisBookmarkMapper.xml`의 폴더 조회는 ID와 회원 ID를 함께 걸고, 북마크는 `(member_id, post_id)` 유일 키로 한 행만 남긴다.

```xml
<select id="findOwnedFolder" resultType="long">
    SELECT id FROM bookmark_folder WHERE id = #{folderId} AND member_id = #{memberId}
</select>
<insert id="insertIfAbsent" parameterType="org.example.bookmark.BookmarkInsertRow"
        useGeneratedKeys="true" keyProperty="id">
    INSERT INTO bookmark(member_id, post_id, folder_id, memo, created_at, updated_at)
    VALUES (#{memberId}, #{postId}, #{folderId}, #{memo}, #{at}, #{at})
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
</insert>
```

같은 키로 다시 요청하면 기존 행의 메모·폴더를 바꾸지 않는다. `MyBatisBookmarkService`는 글 가시성·발행 상태와 입력 타입을 확인하고, 폴더 소유권 검사를 통과한 뒤 INSERT와 `findBookmark`를 한 트랜잭션에서 실행한다.

`findBookmark` SQL 끝의 `FOR UPDATE`로 충돌 뒤에도 현재 행을 읽는다. 아래 **MyBatis 대체 구현 코드** 접기에서 Controller·Service·Mapper·XML 전문을 비교할 수 있다.

</details>

## 직접 확인

시드의 글 2는 이스프링의 공개 글이며 김자바의 북마크 행이 없다. 다른 회원의 11번 폴더는 선택할 수 없다. 이전 실습으로 북마크가 있으면 6-1의 DELETE로 지우고 시작한다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
curl -i -X PUT "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"memo":"[북마크실습] 복습"}'
curl -i -X PUT "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"memo":"[북마크실습] 복습"}'
curl -i -X PUT "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"folderId":11}'
```

```check
{
  "requests": [
    {
      "id": "A",
      "title": "북마크 설정",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "memo": "[북마크실습] 복습"
      }
    },
    {
      "id": "B",
      "title": "한 번 더 설정",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "memo": "[북마크실습] 복습"
      }
    },
    {
      "id": "C",
      "title": "남의 폴더",
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
      "id": "D",
      "title": "없는 글",
      "method": "PUT",
      "path": "/api/posts/999999/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "E",
      "title": "인증 없음",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "body": {}
    },
    {
      "id": "F",
      "title": "Long 범위 초과 폴더 ID",
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
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.postId",
            "equals": 2
          },
          {
            "path": "$.bookmarked",
            "equals": true
          },
          {
            "path": "$.memo",
            "equals": "[북마크실습] 복습"
          },
          {
            "path": "$.bookmarkId",
            "type": "number"
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.bookmarkId",
            "equals": "{{A.body.bookmarkId}}"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C4",
      "request": "D",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C5",
      "request": "E",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C6",
      "request": "F",
      "expect": {
        "status": 400
      }
    }
  ]
}
```

SQL로 `SELECT id, member_id, post_id, folder_id, memo FROM bookmark WHERE member_id=2 AND post_id=2`를 실행한다. A·B 뒤 한 행이고 ID가 같아야 한다. `SELECT id, member_id FROM bookmark_folder WHERE id=11`은 회원 3을 보여 주므로 C는 이 행에 연결할 수 없다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C2 | 반복 PUT | `200`, 같은 `bookmarkId`, 메모 유지 |
| C3~C5 | 남의 폴더·없는 글·인증 없음 | `404`·`404`·`401` |
| C6 | Long 범위 초과 폴더 ID | `400` — `500`이 아니다 |
| D1 | `bookmark`·`bookmark_folder` SELECT | 내 북마크 한 행, 남의 폴더는 연결되지 않음 |
| R1 | 코드 리뷰 | 요청 DTO와 응답 DTO를 구분하고 회원 ID를 토큰에서 가져온다. 폴더는 ID와 소유자를 함께 확인한다 |

## 필요한 지식

- [4-0. 관계 행과 멱등](../ch4-like/4-0-set-like.md)
- [1-7. 직접 DB 확인](../ch1-create-post/1-7-direct-db-dml.md)

## 다음 단계

[6-1. 북마크 추가·삭제](6-1-bookmark.md) — 메모·폴더 upsert와 DELETE를 완성한다.
