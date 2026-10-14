# 5-0. 댓글 목록 — DB 행을 응답 DTO로

## 상황

> "글 아래에 댓글을 보여 주세요. 댓글이 아직 없는 글에서는 빈 목록이 보여야 해요."

먼저 `GET` 하나로 **삭제되지 않은 최상위 댓글**을 읽는다. 댓글 작성은 5-1, 답글은 5-2에서 만든다. 5-3에서는 같은 API의 응답에 답글과 삭제된 댓글 자리 표시를 추가한다.

## 화면 시나리오

```screen
{
  "title": "댓글 목록 읽기",
  "summary": "볼 수 있는 글의 최상위 댓글을 작성 순서대로 받는다.",
  "screen": [
    { "type": "text", "id": "post", "value": "트랜잭션은 어디에 거나요?", "emphasis": "title" },
    { "type": "list", "id": "comments", "items": [
      { "id": "c1", "title": "트랜잭션은 서비스 메서드에 거는 게 기본이에요.", "meta": "박디비" },
      { "id": "c3", "title": "저는 리포지토리에도 붙였어요.", "meta": "한차단" }
    ] }
  ],
  "flows": [{
    "name": "최상위 댓글 읽기",
    "steps": [
      { "kind": "request", "method": "GET", "path": "/api/posts/11/comments" },
      { "kind": "server", "text": "글 조회 권한을 확인하고 최상위·미삭제 댓글을 작성 순서로 조회한다" },
      { "kind": "db", "sql": "SELECT c.id,c.content,m.nickname FROM comment c JOIN member m ON m.id=c.member_id WHERE c.post_id=11 AND c.parent_id IS NULL AND c.deleted_at IS NULL ORDER BY c.created_at,c.id", "note": "댓글과 작성자를 한 번에 조회" },
      { "kind": "response", "status": 200, "body": "[{\"id\":1,\"content\":\"트랜잭션은 서비스 메서드에 거는 게 기본이에요.\",\"author\":{\"id\":4,\"nickname\":\"박디비\"},\"createdAt\":\"2026-09-25T09:00:00\",\"deleted\":false},{\"id\":3,\"content\":\"저는 리포지토리에도 붙였어요.\",\"author\":{\"id\":6,\"nickname\":\"한차단\"},\"createdAt\":\"2026-09-25T11:00:00\",\"deleted\":false}]" },
      { "kind": "screen", "text": "두 댓글을 표시한다", "focus": ["comments"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `GET /api/posts/{postId}/comments`. 토큰 없이도 공개 글을 읽을 수 있다. |
| 성공 | `200` 댓글 DTO 배열. 각 항목은 `id`, `content`, `author: { id, nickname }`, `createdAt`, `deleted:false`를 포함한다. 이 단계에는 `replies` 필드를 아직 넣지 않는다. |
| 정렬 | `created_at ASC, id ASC`. 같은 시각의 순서도 안정적이어야 한다. |
| 빈 상태 | 글은 있지만 댓글이 없으면 `200 []`. 글이 없거나 2-3 규칙상 볼 수 없으면 `404`. 경로 ID 형식 오류는 `400`. |
| DB | `comment.post_id → post.id`, `comment.member_id → member.id`. `parent_id IS NULL`·`deleted_at IS NULL`을 DB 조건으로 적용한다. |

Controller는 경로 ID를 받고 응답 DTO 배열을 반환한다. Service는 먼저 글이 보이는지 확인한다. Repository에서는 글의 댓글 전체를 불러 Java에서 거르지 말고 조건과 정렬을 쿼리에 둔다. 예를 들어 `findByPostIdAndParentIdIsNullAndDeletedAtIsNullOrderByCreatedAtAscIdAsc`에서 시작할 수 있다. 작성자 이름을 DTO로 만드는 과정에서 댓글마다 회원 SELECT가 추가되면 `JOIN FETCH c.member` 또는 DTO 조회로 줄인다.

시드의 11번 글은 최상위 댓글 1·3이 살아 있다. 2·5는 답글이고 4·6은 삭제돼서 이번 결과에는 없다. 3번 글은 댓글이 없어 `[]`다. **5-3에 도달하면** 같은 URL에 `replies`와 삭제 자리 표시, 차단 회원 필터를 추가한다. 지금의 응답 DTO에 없는 정보를 빈 배열로 꾸며 내지 않는다.

## 구현 가이드

먼저 글 3의 빈 목록을 반환하고, 그다음 글 11의 최상위 댓글을 작성자와 함께 읽는다.

<details>
<summary>Controller — 글 경로 ID로 목록 반환</summary>

```java
@GetMapping("/{postId}/comments")
public List<CommentResponse> comments(@PathVariable Long postId,
        @LoginMember AuthenticatedMember viewer) {
    return commentQueryService.listTopLevel(postId, viewer);
}
```

클래스 경로가 `/api/posts`인 경우다. 2-3의 `@LoginMember` 인자 해석기는 토큰이 없으면 `viewer=null`을 넘기므로 공개 글은 비로그인도 읽는다. 잘못된 토큰은 `401`, 잘못된 ID는 `400`이다.

</details>

<details>
<summary>DTO — 댓글과 작성자를 구분해 담기</summary>

```java
public record CommentAuthorResponse(Long id, String nickname) { }
public record CommentResponse(Long id, String content,
        CommentAuthorResponse author, LocalDateTime createdAt, boolean deleted) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(comment.getId(), comment.getContent(),
                new CommentAuthorResponse(comment.getMember().getId(),
                        comment.getMember().getNickname()),
                comment.getCreatedAt(), false);
    }
}
```

이 단계에서 `deleted`는 살아 있는 댓글만 반환하므로 항상 `false`다. `replies` 필드를 미리 빈 목록으로 만들지 않는다.

</details>

<details>
<summary>Service — 글을 볼 수 있는지 먼저 검사</summary>

2-3에서 만든 조회 권한 규칙에 **viewer를 전달해** 글을 확인한 뒤 Repository를 호출한다. 글이 없거나 볼 수 없으면 `404`, 글은 있는데 댓글이 없으면 빈 리스트를 반환한다. 각 `Comment`를 응답 DTO로 바꾸며 `comment.member.nickname`을 읽는다.

```java
Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
if (!postAccessPolicy.canView(viewer, post)) {
    throw new PostNotFoundException();
}
return commentRepository.findTopLevel(postId).stream()
        .map(CommentResponse::from).toList();
```

DTO의 `from`이 조회한 댓글과 작성자 정보를 변환한다. 조회 권한 메서드 이름은 2-3에서 만든 코드에 맞춘다.

`@Transactional(readOnly = true)` 안에서 조회한다. 댓글마다 회원 쿼리가 따로 나가면 아래 `JOIN FETCH`를 확인한다.

</details>

<details>
<summary>JPA / Repository — 최상위·미삭제·정렬 조건</summary>

```java
@Query("""
    SELECT c FROM Comment c JOIN FETCH c.member
    WHERE c.post.id = :postId AND c.parent IS NULL AND c.deletedAt IS NULL
    ORDER BY c.createdAt ASC, c.id ASC
    """)
List<Comment> findTopLevel(@Param("postId") Long postId);
```

연관 필드 이름은 본인이 만든 `Comment` 엔티티와 맞춘다. `comment`·`member` SQL JOIN 결과에서 11번 글은 1·3만 남고 3번 글은 빈 결과인지 본다.

</details>

<details>
<summary>MyBatis / Mapper — 같은 목록을 직접 조회</summary>

MyBatis를 이미 설정한 경우에는 Mapper 메서드 `selectTopLevel(@Param("postId") Long postId)`에 아래 SQL을 연결한다. 조회 행의 `authorId`·`authorNickname`으로 중첩된 `author` DTO를 Service에서 만든다.

```xml
<select id="selectTopLevel" resultType="org.example.comment.CommentRow">
  SELECT c.id, c.content, c.created_at,
         m.id AS author_id, m.nickname AS author_nickname
  FROM comment c JOIN member m ON m.id = c.member_id
  WHERE c.post_id = #{postId} AND c.parent_id IS NULL
    AND c.deleted_at IS NULL
  ORDER BY c.created_at ASC, c.id ASC
</select>
```

`CommentRow`는 조회 열에 맞춘 별도 클래스다. 이 실행 경로는 `map-underscore-to-camel-case: true`를 사용하므로 `author_id`가 `authorId`에 담긴다. 반환 DTO와 `404`/빈 배열 판단은 JPA 방식과 동일하다.

```java
public class CommentRow {
    public Long id;
    public String content;
    public LocalDateTime createdAt;
    public Long authorId;
    public String authorNickname;
}
```

이 클래스는 `org.example.comment` 패키지에 둔다. Mapper가 채운 행을 `MyBatisCommentQueryService`에서 `CommentAuthorResponse`와 `CommentResponse`로 바꾼다. 글 가시성은 `PostVisibilityMapper.findVisibleDetail`로 먼저 확인한다. 실행 가능한 Controller·Service·Mapper Java/XML과 테스트 전문은 아래 MyBatis 역할별 코드 접기에 있다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
curl -i "$BASE/api/posts/11/comments"               # 최상위 1·3
curl -i "$BASE/api/posts/3/comments"                # []
curl -i "$BASE/api/posts/999999/comments"           # 404
curl -i -H 'Authorization: Bearer tok-kimjava' "$BASE/api/posts/9/comments"  # 404, 볼 수 없는 글
```

```check
{
  "requests": [
    { "id": "A", "title": "시드 댓글", "method": "GET", "path": "/api/posts/11/comments" },
    { "id": "B", "title": "빈 목록", "method": "GET", "path": "/api/posts/3/comments" },
    { "id": "C", "title": "없는 글", "method": "GET", "path": "/api/posts/999999/comments" },
    { "id": "D", "title": "볼 수 없는 글", "method": "GET", "path": "/api/posts/9/comments", "headers": { "Authorization": "Bearer tok-kimjava" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$[*].id", "equals": [1, 3] }, { "path": "$[0].author.nickname", "equals": "박디비" }, { "path": "$[0].deleted", "equals": false }] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$", "length": 0 }] } },
    { "id": "C3", "request": "C", "expect": { "status": 404 } },
    { "id": "C4", "request": "D", "expect": { "status": 404 } }
  ]
}
```

SQL로 `SELECT c.id, c.parent_id, c.deleted_at, m.nickname FROM comment c JOIN member m ON m.id=c.member_id WHERE c.post_id=11 ORDER BY c.created_at,c.id`를 실행한다. 6행에서 왜 1·3만 결과 DTO가 되는지 각 행의 `parent_id`와 `deleted_at`으로 설명한다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1 | 댓글 있는 글 | `200`, 최상위 살아 있는 댓글 1·3 순서와 작성자 DTO |
| C2 | 빈 글 | `200 []` |
| C3~C4 | 없는/볼 수 없는 글 | `404` |
| D1 | `comment`·`member` JOIN | 1·3이 조건을 만족하고 2·4·5·6이 빠지는 이유를 설명 |
| R1 | 코드 리뷰 | 엔티티를 직접 JSON으로 보내지 않고, 작성자 조회에 N+1이 없다 |

## 필요한 지식

- [2-3. 볼 수 있는 글](../ch2-read-post/2-3-visibility.md)
- [2-5. JPA JOIN](../ch2-read-post/2-5-guided-jpa-query.md)

## 다음 단계

[5-1. 댓글 작성](5-1-create-comment.md) — 목록에 들어갈 행을 API로 저장한다.
