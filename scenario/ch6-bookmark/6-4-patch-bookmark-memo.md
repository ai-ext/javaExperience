# 6-4. 북마크 메모 부분 수정 — 생략과 null 구분

## 상황

> "폴더는 그대로 두고 메모만 고칠게요. 메모를 지우고 싶을 때는 `null`을 보내고요."

6-1의 `PUT`은 북마크 전체 상태를 정한다. 이 단계는 **이미 있는 내 북마크의 메모만** 바꾸는 `PATCH`다. `{}`는 아무것도 바꾸지 않고, `{"memo":null}`은 메모를 지운다. Java의 `String memo` 하나로는 두 요청이 모두 `null`이 되므로, DTO에서 **필드가 있었는지**도 기억해야 한다.

## 화면 시나리오

```screen
{
  "title": "북마크 메모 수정",
  "summary": "메모를 고쳐도 폴더와 북마크 ID는 그대로다.",
  "screen": [
    { "type": "text", "id": "post", "value": "JPA 연관관계 매핑 정리", "emphasis": "title" },
    { "type": "field", "id": "memo", "label": "메모", "value": "다시 읽기" },
    { "type": "actions", "id": "save", "items": [{ "id": "submit", "label": "메모 저장", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "메모만 바꾸기",
    "steps": [
      { "kind": "request", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": ["Authorization: Bearer tok-kimjava"], "body": "{\"memo\":\"다시 읽기\"}" },
      { "kind": "server", "text": "서비스가 내 북마크를 찾고 memo 필드가 있는 경우에만 바꾼다" },
      { "kind": "db", "sql": "UPDATE bookmark SET memo='다시 읽기',updated_at=NOW() WHERE member_id=2 AND post_id=2", "note": "folder_id와 created_at은 그대로" },
      { "kind": "response", "status": 200, "body": "{\"postId\":2,\"bookmarked\":true,\"folderId\":null,\"memo\":\"다시 읽기\"}" }
    ]
  }]
}
```

## 만들 것

| 요청 본문 | 결과 |
|---|---|
| `{}` | `200`, 현재 메모 그대로. 불필요한 UPDATE가 없어도 된다. |
| `{ "memo": null }` | `200`, 메모 `null`로 지운다. |
| `{ "memo": "다시 읽기" }` | `200`, 문자열로 교체한다. 빈 문자열도 허용한다. |
| `memo` 201자 또는 문자열/null 외 타입 | `400`, 기존 메모 유지. |
| `{"memoPresent":true}`처럼 `memo` 없이 내부 플래그만 전송 | `200`, 기존 메모 유지. 클라이언트가 DTO 내부 상태를 설정할 수 없어야 한다. |

경로는 `PATCH /api/posts/{id}/bookmark`이고 6-1과 같은 `BookmarkResponse` DTO를 반환한다. 토큰 없음 `401`, 내 북마크가 없으면 `404`다. `folderId`를 함께 보내도 이 단계에서는 변경하지 않는다. 폴더 이동은 6-2의 별도 계약을 사용한다. 이미 만든 북마크의 메모 수정이므로 `bookmark` 행을 새로 만들지 않는다.

## 구현 가이드

`{}`와 `{"memo":null}`을 서로 다른 요청으로 취급하는 부분부터 만든다. 메모를 바꾸더라도 폴더와 북마크 ID는 유지한다.

<details>
<summary>Controller — 기존 북마크에만 PATCH 연결</summary>

```java
@PatchMapping("/api/posts/{id}/bookmark")
public BookmarkResponse patchMemo(@PathVariable Long id,
        @LoginMember AuthenticatedMember loginMember,
        @RequestBody BookmarkMemoPatchRequest request) {
    return bookmarkService.patchMemo(id, loginMember, request);
}
```

기존 `BookmarkController`에 추가한다. 인증하지 않은 요청은 기존 1-6 인증 흐름에서 `401`이 된다.

</details>

<details>
<summary>DTO — memo 생략과 명시적 null 구분</summary>

DTO의 핵심은 **존재 여부와 값을 따로 담는 것**이다. 다음은 한 방법이다. `@JsonSetter`는 JSON에 `memo` 키가 있을 때 호출되므로 명시적 `null`도 구분된다. Jackson의 타입 변환 설정에 따라 숫자가 문자열로 변환될 수 있으므로, 잘못된 타입 `400`을 보장하려면 `JsonNode`로 받아 `isTextual()`·`isNull()`을 검사한다.

```java
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import tools.jackson.databind.JsonNode;

public class BookmarkMemoPatchRequest {
    private boolean memoPresent;
    private JsonNode memo;

    @JsonSetter("memo")
    public void setMemo(JsonNode memo) {
        this.memoPresent = true;
        this.memo = memo;
    }

    @JsonIgnore
    public boolean isMemoPresent() { return memoPresent; }
    public JsonNode getMemo() { return memo; }
}
```

`isMemoPresent()`는 Jackson이 JSON 입력 속성으로 인식하지 않도록 `@JsonIgnore`를 붙이고 `com.fasterxml.jackson.annotation.JsonIgnore`를 import한다. Lombok `@Getter`만 붙이는 DTO로는 필드 존재 여부를 얻을 수 없다.

</details>

<details>
<summary>Service — 내 행을 찾고 메모만 바꾸기</summary>

`member_id`와 `post_id` **둘 다** 조건으로 내 북마크를 잠가 찾는다. `memoPresent=false`면 그대로 반환하고, `true`면 `memo == null || memo.isNull()`을 메모 삭제로, `memo.isTextual()`을 문자열 변경으로 해석한다. 나머지 타입은 `400`이다. 문자열 길이 200자를 확인한 뒤 Service 트랜잭션에서 `memo`와 `updated_at`만 변경한다.

```java
if (request.isMemoPresent()) {
    JsonNode value = request.getMemo();
    if (value != null && !value.isNull() && !value.isTextual()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    String memo = value == null || value.isNull() ? null : value.asText();
    if (memo != null && memo.length() > 200) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    // 기존 북마크의 memo만 갱신한다.
}
```

`bookmarkId`·`folderId`·`created_at`은 유지한다. 다른 사람의 북마크를 `postId`만으로 찾으면 안 된다.

</details>

<details>
<summary>JPA / Repository — 변경된 행 하나 확인</summary>

Repository 조회는 회원과 글의 쌍으로 잠근다. JPA가 기존 북마크의 메모 변경을 UPDATE하는지 SQL 로그를 본다. 북마크 Entity에 `@DynamicUpdate`를 붙여 PATCH가 읽어 둔 다른 필드(특히 `folder_id`)를 UPDATE 문에 넣지 않게 한다. 동시에 폴더 이동이 일어나도 메모 수정이 폴더를 되돌리지 않도록 하기 위해서다.

```java
@Query(value = "SELECT * FROM bookmark WHERE member_id = :memberId AND post_id = :postId FOR UPDATE",
       nativeQuery = true)
Optional<Bookmark> findCurrentForUpdate(@Param("memberId") Long memberId,
                                        @Param("postId") Long postId);
```

`SELECT id, folder_id, memo, created_at, updated_at FROM bookmark WHERE member_id=2 AND post_id=2`를 A·C·D 뒤 비교한다. MyBatis로 구현해도 UPDATE의 `WHERE`에 두 ID를 넣고, 없는 행이면 `404`로 처리한다.

</details>

<details>
<summary>MyBatis — 내 북마크 잠금 조회와 메모만 UPDATE</summary>

`MyBatisBookmarkService.patchMemo`도 DTO의 `memoPresent`를 먼저 확인한다. 회원과 글로 행을 잠가 조회하므로 없는 행은 `404`이고, 빈 객체는 UPDATE 없이 현재 응답을 돌려준다. 값이 있으면 Service에서 문자열 또는 `null`인지, 200자 이하인지 검사한 뒤 Mapper를 호출한다.

```java
BookmarkRow row = bookmarks.findBookmark(me.id(), postId);
if (row == null) throw new BookmarkNotFoundException();
if (request.isMemoPresent()) {
    JsonNode value = request.getMemo();
    if (value != null && !value.isNull() && !value.isTextual()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    String memo = value == null || value.isNull() ? null : value.asText();
    if (memo != null && memo.length() > 200) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    if (bookmarks.updateMemo(me.id(), postId, memo) != 1) {
        throw new BookmarkNotFoundException();
    }
    row.memo = memo;
}
return new BookmarkResponse(row.id, postId, true, row.folderId, row.memo);
```

```xml
<select id="findBookmark" resultType="org.example.bookmark.BookmarkRow">
    SELECT id, folder_id, memo FROM bookmark
    WHERE member_id = #{memberId} AND post_id = #{postId} FOR UPDATE
</select>
<update id="updateMemo">
    UPDATE bookmark SET memo = #{memo}, updated_at = NOW()
    WHERE member_id = #{memberId} AND post_id = #{postId}
</update>
```

MyBatis 대체 구현 토글의 `BookmarkController.java`, `BookmarkMemoPatchRequest.java`, `MyBatisBookmarkService.java`, `MyBatisBookmarkMapper.java`, `MyBatisBookmarkMapper.xml`에서 실행 가능한 전체 코드를 볼 수 있다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
curl -i -X PUT "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"memo":"처음 메모"}'
curl -i -X PATCH "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{}'
curl -i -X PATCH "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"memo":null}'
curl -i -X PATCH "$BASE/api/posts/2/bookmark" -H "$K" -H 'Content-Type: application/json' -d '{"memo":"다시 읽기"}'
```

```check
{
  "requests": [
    { "id": "A", "title": "기존 북마크 준비", "method": "PUT", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": "처음 메모" } },
    { "id": "B", "title": "메모 생략", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": {} },
    { "id": "C", "title": "명시적 null", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": null } },
    { "id": "D", "title": "새 문자열", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": "다시 읽기" } },
    { "id": "E", "title": "숫자 메모", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": 123 } },
    { "id": "P", "title": "북마크하지 않은 새 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "dev", "title": "[메모실습] 새 글", "content": "아직 김자바의 북마크가 없는 글입니다.", "tags": [], "visibility": "PUBLIC" } },
    { "id": "F", "title": "없는 내 북마크", "method": "PATCH", "path": "/api/posts/{{P.body.id}}/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": "없음" } },
    { "id": "G", "title": "인증 없음", "method": "PATCH", "path": "/api/posts/2/bookmark", "body": { "memo": "인증 없음" } },
    { "id": "H", "title": "내부 플래그 주입", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memoPresent": true } },
    { "id": "I", "title": "메모 뒤 내부 플래그", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memo": "순서1", "memoPresent": false } },
    { "id": "J", "title": "내부 플래그 뒤 메모", "method": "PATCH", "path": "/api/posts/2/bookmark", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "memoPresent": false, "memo": "순서2" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "처음 메모" }] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "처음 메모" }, { "path": "$.bookmarkId", "equals": "{{A.body.bookmarkId}}" }] } },
    { "id": "C3", "request": "C", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": null }] } },
    { "id": "C4", "request": "D", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "다시 읽기" }, { "path": "$.bookmarkId", "equals": "{{A.body.bookmarkId}}" }] } },
    { "id": "C5", "request": "E", "expect": { "status": 400 } },
    { "id": "C6", "all": [{ "request": "P", "expect": { "status": 201 } }, { "request": "F", "expect": { "status": 404 } }] },
    { "id": "C7", "request": "G", "expect": { "status": 401 } },
    { "id": "C8", "request": "H", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "다시 읽기" }, { "path": "$.bookmarkId", "equals": "{{A.body.bookmarkId}}" }] } },
    { "id": "C9", "request": "I", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "순서1" }] } },
    { "id": "C10", "request": "J", "expect": { "status": 200, "json": [{ "path": "$.memo", "equals": "순서2" }] } }
  ]
}
```

DB에서 `SELECT id,folder_id,memo,created_at,updated_at FROM bookmark WHERE member_id=2 AND post_id=2`를 A·C·D 뒤 비교한다. D 뒤에는 `memo='다시 읽기'`, 행 ID와 폴더·생성 시각은 A와 같아야 한다. E 뒤에도 값이 바뀌면 안 된다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C4 | 준비·생략·null·문자열 | 메모만 지정한 의미대로 달라지고 ID는 유지 |
| C5~C10 | 잘못된 타입·없는 내 행·인증 없음·내부 플래그 주입/순서 | `400`·`404`·`401`·메모 키 존재만 반영 |
| D1 | `bookmark` SELECT | 한 행, 폴더·생성 시각 유지, 실패 뒤 메모 유지 |
| R1 | 코드 리뷰 | DTO가 키 존재와 값을 구분하고, Service가 내 행만 수정한다 |

## 필요한 지식

- [6-1. 북마크 PUT·DELETE](6-1-bookmark.md)
- [3-1. 게시글 PATCH](../ch3-update-delete/3-1-patch.md)

## 다음 단계

[6-5. 내가 표시한 글](6-5-my-marked-posts.md) — 저장한 관계를 조건으로 조회한다.
