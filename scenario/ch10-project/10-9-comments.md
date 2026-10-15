# 10-9. 댓글 — 작성·목록(답글 트리)·삭제

## 상황

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts/{postId}/comments` | 토큰. `content` 1~500자, `parentId` 선택(같은 글의 최상위 댓글만 — 답글의 답글 금지) | 201 | 400(부모가 답글·다른 글), 401, 404 |
| `GET /api/v1/posts/{postId}/comments` | 시간순, 답글은 `replies`로. 삭제된 부모는 "삭제된 댓글입니다"로 자리만 | 200 | 404 |
| `DELETE /api/v1/comments/{commentId}` | 작성자만, soft delete | 200 | 401, 403, 404 |

10-6에서 댓글을 **읽어 트리로 만드는 것**은 해 두었다. 이번에는 쓰기와 지우기를 더하고, 같은 트리를 댓글 전용 API로도 내보낸다. 새로 생각할 것은 **부모 규칙**이다. 답글은 한 단계까지만 허용한다. 부모는 같은 글의, 지워지지 않은, 최상위 댓글이어야 한다. 이 규칙은 애노테이션으로 표현할 수 없다. DB를 봐야 알 수 있으므로 서비스에서 확인하고 400으로 답한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "댓글 영역",
  "summary": "글 아래 댓글 목록. 최상위 댓글에만 [답글] 버튼이 있고, 답글에는 없다(한 단계까지만).",
  "screen": [
    { "type": "bar", "id": "bar", "label": "[채점] 10-9 댓글용 글", "right": "이스프링" },
    { "type": "list", "id": "comments", "label": "댓글", "items": [
      { "id": "c-top", "title": "[채점] 첫 댓글", "meta": "이스프링 · [답글] [삭제]" },
      { "id": "c-reply", "title": "  ↳ [채점] 답글", "meta": "김자바" }
    ] },
    { "type": "field", "id": "input", "label": "댓글 쓰기", "value": "[채점] 첫 댓글" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "write", "label": "등록", "variant": "primary" }, { "id": "remove", "label": "삭제", "variant": "danger" }] },
    { "type": "toast", "id": "toast", "value": "답글은 같은 글의 최상위 댓글에만 달 수 있습니다.", "tone": "error" }
  ],
  "flows": [
    {
      "name": "댓글 쓰기",
      "steps": [
        { "kind": "user", "text": "이스프링이 댓글을 쓰고 [등록]", "focus": ["input", "write"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/28/comments", "headers": ["Authorization: Bearer (이스프링)", "Content-Type: application/json"], "body": "{ \"content\": \"[채점] 첫 댓글\" }" },
        { "kind": "db", "sql": "INSERT INTO comments (post_id, author_id, parent_id, content, created_at)\nVALUES (28, 2, NULL, '[채점] 첫 댓글', NOW());" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/v1/comments/41"], "body": "{\n  \"status\": 201,\n  \"data\": { \"id\": 41, \"postId\": 28, \"parentId\": null, \"content\": \"[채점] 첫 댓글\", \"author\": { \"id\": 2, \"nickname\": \"이스프링\" }, ... }\n}" },
        { "kind": "screen", "text": "목록 맨 아래에 붙는다", "focus": ["comments", "c-top"] }
      ]
    },
    {
      "name": "답글에 또 답글",
      "steps": [
        { "kind": "user", "text": "(화면 버그로 버튼이 보였다) 답글에 [답글]", "focus": ["c-reply"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/28/comments", "headers": ["Authorization: Bearer (이스프링)"], "body": "{ \"content\": \"답글의 답글\", \"parentId\": 42 }" },
        { "kind": "server", "text": "부모 42를 찾아 보니 parent_id가 있다(답글) → 400" },
        { "kind": "response", "status": 400, "body": "{\n  \"status\": 400,\n  \"code\": \"VALIDATION_FAILED\",\n  \"errors\": [ { \"field\": \"parentId\", \"reason\": \"답글은 같은 글의 최상위 댓글에만 달 수 있습니다.\" } ],\n  \"data\": null\n}" },
        { "kind": "screen", "text": "화면이 막지 못해도 서버가 막는다", "focus": ["toast"] }
      ]
    },
    {
      "name": "답글 달린 댓글 삭제",
      "steps": [
        { "kind": "user", "text": "이스프링이 자기 댓글 [삭제]", "focus": ["c-top", "remove"] },
        { "kind": "request", "method": "DELETE", "path": "/api/v1/comments/41", "headers": ["Authorization: Bearer (이스프링)"] },
        { "kind": "db", "sql": "UPDATE comments SET deleted_at = NOW() WHERE id = 41;" },
        { "kind": "response", "status": 200, "body": "{ \"status\": 200, \"message\": \"OK\", \"data\": null }" },
        { "kind": "screen", "text": "목록을 다시 받으면 \"삭제된 댓글입니다\" 아래에 김자바의 답글이 그대로 있다", "focus": ["comments"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| `POST /api/v1/posts/{postId}/comments` | 로그인 필수. 본문 `{content, parentId?}`. `content`는 앞뒤 공백 제거 후 1~500자 |
| 글 확인 | 글이 없음·삭제·남의 비공개면 404 |
| 부모 확인 | `parentId`가 있으면 그 댓글이 **같은 글**의, **최상위**(부모 없음), **안 지운** 댓글이어야 한다. 아니면 400 `VALIDATION_FAILED`, `errors[0].field`=`parentId` |
| 성공(작성) | `201`, `Location: /api/v1/comments/{id}`, `data` = `{id, postId, parentId, content, author{id, nickname}, createdAt}` |
| `GET /api/v1/posts/{postId}/comments` | 로그인 선택. 글 확인은 위와 같다(404). `data` = 10-6 상세의 `comments`와 같은 트리 배열 |
| `DELETE /api/v1/comments/{commentId}` | 로그인 필수. 없음·이미 지움·글이 지워짐 404 → 남의 댓글 403 → `deleted_at` 기록, `200` `data: null` |

명세서에 없던 것을 정했다. 작성 응답의 `Location`은 `/api/v1/comments/{id}`다(삭제 주소와 같은 자원). 댓글 목록의 `data`는 페이지 없이 트리 배열 그대로다.

**필드 규칙** — 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `content` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | 앞뒤 공백 제거 뒤 1~500자(다듬어 500자는 성공, 501자는 거절) | JSON 문자열(숫자는 400) | 없음 | `400 VALIDATION_FAILED`, `errors`에 `content` |
| `parentId` | 선택 | 생략·`null`이면 최상위 댓글 | 같은 글의 최상위·안 지운 댓글 id | JSON 정수(소수·숫자 문자열은 400) | `null` | 숫자가 아니면 `400 BAD_JSON`, 규칙 위반·없는 댓글 `400 VALIDATION_FAILED`(`errors[0].field`=`parentId`) |
| `{postId}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`(`errors`에 `postId`), 없는 글 `404` |
| 본문 전체 | 필수 | — | — | JSON | — | `400 BAD_JSON` |

## 설계 포인트

- **트리는 10-6의 것을 그대로.** 상세와 댓글 목록이 같은 함수(평평한 목록 → 트리)를 쓰면 "삭제된 부모" 규칙이 두 곳에서 어긋나지 않는다.
- **부모 규칙은 서비스에서, 400으로.** 부모를 찾고 세 조건을 본다. 10-7에서 넓힌 `ApiException.invalid("parentId", "...")`를 그대로 쓴다. 없는 부모도 400이다. 부모 댓글은 경로의 자원(글)이 아니라 본문의 값이라서다. 경로의 글이 없을 때만 404다.
- **"지운 부모에 답글"은?** 지운 댓글에는 답글을 달지 못하게 했다(부모 조건 "안 지운"). 이미 달린 답글은 부모가 지워져도 남는다.
- **동시 쓰기 순서.** 작성·답글·삭제는 글 행을 먼저 잠그고 필요하면 부모 또는 대상 댓글 행을 잠근다. 이미 삭제된 글/댓글은 기다린 다음 404 또는 `parentId` 400으로 끝낸다. 그래서 삭제된 부모에 새 답글이 달리지 않는다.
- **삭제 순서.** 404(없음·지움)를 먼저, 그다음 403(남의 것)이다. 이미 지운 댓글을 남이 지우려 하면 404다. "지워진 남의 댓글"이 있다는 것을 알려 줄 이유가 없다.
- **연관관계 저장.** `new Comment(post, author, parent, content)`처럼 엔티티 객체를 넣으면 JPA가 `post_id`·`author_id`·`parent_id`를 채운다. 응답의 `postId`는 `comment.getPost().getId()`로 꺼내며, 추가 쿼리는 나가지 않는다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 부모 42를 찾아 보니 parent_id가 있다(답글) → 400

<details>
<summary>Controller — HTTP 연결</summary>

`CommentController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

이번 단계 매핑: `@PostMapping("/api/v1/posts/{postId}/comments")`, `@GetMapping("/api/v1/posts/{postId}/comments")`, `@DeleteMapping("/api/v1/comments/{commentId}")`. 변경된 메서드: `create`, `list`, `delete`.

```java
@PostMapping("/api/v1/posts/{postId}/comments")
public ResponseEntity<ApiResponse<CommentCreatedResponse>> create(@LoginUser Long userId,
        @PathVariable Long postId, @Valid @RequestBody CommentRequest request) {
    CommentCreatedResponse created = commentService.create(userId, postId, request);
    return ResponseEntity.created(URI.create("/api/v1/comments/" + created.id()))
            .body(ApiResponse.created(created));
}

@GetMapping("/api/v1/posts/{postId}/comments")
public ApiResponse<List<CommentResponse>> list(@PathVariable Long postId,
        @LoginUser(required = false) Long userId) {
    return ApiResponse.ok(commentService.list(postId, userId));
}

@DeleteMapping("/api/v1/comments/{commentId}")
public ApiResponse<Void> delete(@LoginUser Long userId, @PathVariable Long commentId) {
    commentService.delete(userId, commentId);
    return ApiResponse.ok(null);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CommentCreatedResponse.java`, `CommentRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record CommentRequest(
        @NotBlank(message = "댓글 내용은 필수입니다.")
        @Size(max = 500, message = "댓글은 500자 이하여야 합니다.")
        String content, Long parentId) {
    public CommentRequest { content = content == null ? null : content.strip(); }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static CommentRequest fromJson(JsonNode body) {
        if (body == null || !body.isObject()) throw new IllegalArgumentException("JSON 객체가 필요합니다.");
        JsonNode rawContent = body.get("content");
        JsonNode rawParent = body.get("parentId");
        if (rawContent != null && !rawContent.isNull() && !rawContent.isTextual())
            throw new IllegalArgumentException("content는 문자열이어야 합니다.");
        if (rawParent != null && !rawParent.isNull() && (!rawParent.isIntegralNumber() || !rawParent.canConvertToLong()))
            throw new IllegalArgumentException("parentId는 정수여야 합니다.");
        return new CommentRequest(rawContent == null || rawContent.isNull() ? null : rawContent.asText(),
                rawParent == null || rawParent.isNull() ? null : rawParent.longValue());
    }
}

public record CommentCreatedResponse(Long id, Long postId, Long parentId, String content,
                                     AuthorResponse author, LocalDateTime createdAt) { }
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`CommentService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`, `list`, `delete`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public CommentCreatedResponse create(Long userId, Long postId, CommentRequest request) {
    lockActivePost(postId); // posts 한 행을 FOR UPDATE로 잠근다.
    Post post = findVisiblePost(postId, userId);
    User author = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    Comment parent = request.parentId() == null ? null : findParent(post, request.parentId());
    Comment comment = commentRepository.save(new Comment(post, author, parent, request.content()));
    return CommentCreatedResponse.from(comment);
}

private Comment findParent(Post post, Long parentId) {
    if (!lockActiveComment(parentId))
        throw ApiException.invalid("parentId", "답글은 같은 글의 최상위 댓글에만 달 수 있습니다.");
    return commentRepository.findById(parentId)
            .filter(p -> p.getPost().getId().equals(post.getId()) && p.getParent() == null && !p.isDeleted())
            .orElseThrow(() -> ApiException.invalid("parentId", "답글은 같은 글의 최상위 댓글에만 달 수 있습니다."));
}

@Transactional
public void delete(Long userId, Long commentId) {
    List<?> postIds = entityManager.createNativeQuery("select post_id from comments where id = :id")
            .setParameter("id", commentId).getResultList();
    if (postIds.isEmpty()) throw new ApiException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다.");
    lockActivePost(((Number) postIds.get(0)).longValue());
    if (!lockActiveComment(commentId))
        throw new ApiException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다.");
    Comment comment = commentRepository.findById(commentId)
            .filter(c -> !c.isDeleted() && !c.getPost().isDeleted())
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다."));
    if (!comment.getAuthor().getId().equals(userId))
        throw new ApiException(ErrorCode.FORBIDDEN, "작성자만 삭제할 수 있습니다.");
    comment.delete();
}

private void lockActivePost(Long postId) {
    if (entityManager.createNativeQuery("select id from posts where id = :id and deleted_at is null for update")
            .setParameter("id", postId).getResultList().isEmpty())
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
}

private boolean lockActiveComment(Long commentId) {
    return !entityManager.createNativeQuery("select id from comments where id = :id and deleted_at is null for update")
            .setParameter("id", commentId).getResultList().isEmpty();
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`의 삭제되지 않은 글 조건과 10-6에서 만든 `CommentRepository.java`의 작성자 JOIN을 함께 확인한다. 직접 작성한 JPQL·SQL과 두 파일의 메서드를 비교한다.

```java
// 글이 없거나 이미 삭제되면 댓글 API도 404다.
Optional<Post> findByIdAndDeletedAtIsNull(Long id);

// 댓글 목록은 댓글과 작성자를 함께 읽어 N+1을 피한다.
@Query("select c from Comment c join fetch c.author where c.post.id = :postId order by c.createdAt, c.id")
List<Comment> findAllWithAuthorByPostId(Long postId);
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Comment.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `delete`.

```java
@Entity
@Table(name = "comments")
public class Comment {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void delete() {
        this.deletedAt = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 같은 댓글 계약의 SQL</summary>

MyBatis는 `CommentMapper`가 글 행 잠금, 부모·대상 댓글 행 잠금, INSERT, soft delete를 맡는다. Service에서 같은 글·최상위·안 지운 부모인지 확인하고 `parentId` 오류를 만든다. 전체 코드는 **MyBatis 대체 코드** 토글에 있다.

```java
Long lockActivePost(Long postId);
CommentWriteRow findParent(Long parentId);
Long findPostIdByCommentId(Long commentId);
void insert(CommentWriteRow comment);
CommentWriteRow findActiveById(Long commentId);
int softDelete(@Param("commentId") Long commentId, @Param("deletedAt") LocalDateTime deletedAt);
```

```xml
<select id="lockActivePost" resultType="long">
  SELECT id FROM posts WHERE id = #{postId} AND deleted_at IS NULL FOR UPDATE
</select>
<select id="findParent" resultType="org.example.board.comment.CommentWriteRow">
  SELECT id, post_id AS postId, parent_id AS parentId FROM comments
  WHERE id = #{parentId} AND deleted_at IS NULL FOR UPDATE
</select>
<insert id="insert" useGeneratedKeys="true" keyProperty="id">
  INSERT INTO comments (post_id, author_id, parent_id, content, created_at, deleted_at)
  VALUES (#{postId}, #{authorId}, #{parentId}, #{content}, #{createdAt}, NULL)
</insert>
<update id="softDelete">
  UPDATE comments SET deleted_at = #{deletedAt}
  WHERE id = #{commentId} AND deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM posts WHERE id = comments.post_id AND deleted_at IS NULL)
</update>
```

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 그 글에만 댓글을 단다.

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "M", "title": "로그인(이스프링)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "lee@example.com", "password": "password1234" } },
    { "id": "P", "title": "댓글용 글 만들기", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-9 댓글용 글" } },
    { "id": "C", "title": "최상위 댓글(이스프링)", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "  [채점] 첫 댓글  " } },
    { "id": "R", "title": "답글(김자바)", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "content": "[채점] 답글", "parentId": "{{C.body.data.id}}" } },
    { "id": "RR", "title": "답글의 답글", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "답글의 답글", "parentId": "{{R.body.data.id}}" } },
    { "id": "XP", "title": "다른 글의 댓글을 부모로", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "다른 글 댓글이 부모", "parentId": 9 } },
    { "id": "E", "title": "공백만", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "   " } },
    {"id": "V1", "title": "빈 객체", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {}},
    {"id": "V2", "title": "content null", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": null}},
    {"id": "V3", "title": "501자", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "V4", "title": "parentId가 숫자가 아님", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "숫자 아닌 부모", "parentId": "abc"}},
    {"id": "V5", "title": "없는 부모", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "없는 부모", "parentId": 999999}},
    {"id": "V6", "title": "경로 id가 숫자가 아님", "method": "POST", "path": "/api/v1/posts/abc/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "숫자 아닌 글"}},
    {"id": "V7", "title": "깨진 JSON", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}", "Content-Type": "application/json"}, "body": "{\"content\":"},
    {"id": "V8", "title": "content 숫자 자동 변환 금지", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": 12345}},
    {"id": "V9", "title": "숫자 문자열 parentId 자동 변환 금지", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "문자열 부모", "parentId": "41"}},
    {"id": "V10", "title": "소수 parentId 정수 절삭 금지", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "소수 부모", "parentId": 1.9}},
    { "id": "N", "title": "토큰 없음", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "body": { "content": "익명" } },
    { "id": "NP", "title": "없는 글", "method": "POST", "path": "/api/v1/posts/999999/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "없는 글" } },
    { "id": "PV", "title": "남의 비공개 글(24)", "method": "POST", "path": "/api/v1/posts/24/comments", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "content": "남의 비공개 글" } },
    { "id": "G", "title": "댓글 목록", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}/comments" },
    { "id": "D1", "title": "남이 삭제(김자바)", "method": "DELETE", "path": "/api/v1/comments/{{C.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "DN", "title": "토큰 없이 삭제", "method": "DELETE", "path": "/api/v1/comments/{{C.body.data.id}}" },
    { "id": "D", "title": "작성자가 삭제(이스프링)", "method": "DELETE", "path": "/api/v1/comments/{{C.body.data.id}}", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    { "id": "G2", "title": "삭제 뒤 목록", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}/comments" },
    { "id": "GD", "title": "삭제 뒤 글 상세", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}" },
    { "id": "D2", "title": "다시 삭제", "method": "DELETE", "path": "/api/v1/comments/{{C.body.data.id}}", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    { "id": "DX", "title": "없는 댓글 삭제", "method": "DELETE", "path": "/api/v1/comments/999999", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    { "id": "GX", "title": "없는 글의 댓글 목록", "method": "GET", "path": "/api/v1/posts/999999/comments" },
    {"id": "B1", "title": "경계 안쪽 — 다듬어 정확히 500자", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "  가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가  "}},
    {"id": "B2", "title": "parentId null이면 최상위", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/comments", "headers": {"Authorization": "Bearer {{M.body.data.accessToken}}"}, "body": {"content": "[채점] 부모 null", "parentId": null}}
  ],
  "checks": [
    {
      "id": "C1",
      "request": "C",
      "expect": {
        "status": 201,
        "headers": { "Location": { "endsWith": "/api/v1/comments/{{C.body.data.id}}" } },
        "json": [
          { "path": "$.data.postId", "equals": "{{P.body.data.id}}" },
          { "path": "$.data.parentId", "type": "null" },
          { "path": "$.data.content", "equals": "[채점] 첫 댓글" },
          { "path": "$.data.author", "equals": { "id": 2, "nickname": "이스프링" } }
        ]
      }
    },
    { "id": "C2", "request": "R", "expect": { "status": 201, "json": [{ "path": "$.data.parentId", "equals": "{{C.body.data.id}}" }, { "path": "$.data.author.id", "equals": 1 }] } },
    {
      "id": "C3",
      "all": [
        { "request": "RR", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }, { "path": "$.errors[*].field", "contains": "parentId" }] } },
        { "request": "XP", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "parentId" }] } },
        { "request": "E", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "content" }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "N", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "NP", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "PV", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ]
    },
    {
      "id": "C5",
      "request": "G",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data", "length": 1 },
          { "path": "$.data[0].id", "equals": "{{C.body.data.id}}" },
          { "path": "$.data[0].deleted", "equals": false },
          { "path": "$.data[0].replies[*].id", "equals": ["{{R.body.data.id}}"] },
          { "path": "$.data[0].replies[0].author", "equals": { "id": 1, "nickname": "김자바" } }
        ]
      }
    },
    {
      "id": "C6",
      "all": [
        { "request": "D1", "expect": { "status": 403, "json": [{ "path": "$.code", "equals": "FORBIDDEN" }] } },
        { "request": "DN", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "D", "expect": { "status": 200, "json": [{ "path": "$.data", "type": "null" }] } }
      ]
    },
    {
      "id": "C7",
      "all": [
        { "request": "G2", "expect": { "status": 200, "json": [{ "path": "$.data[0].deleted", "equals": true }, { "path": "$.data[0].content", "equals": "삭제된 댓글입니다" }, { "path": "$.data[0].author", "type": "null" }, { "path": "$.data[0].replies[*].id", "equals": ["{{R.body.data.id}}"] }] } },
        { "request": "GD", "expect": { "status": 200, "json": [{ "path": "$.data.comments[0].deleted", "equals": true }, { "path": "$.data.comments[0].replies", "length": 1 }] } }
      ],
      "note": "댓글 목록과 글 상세가 같은 트리를 보여 준다"
    },
    {
      "id": "C8",
      "all": [
        { "request": "D2", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "DX", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "GX", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ]
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
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
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
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
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.code",
                "equals": "BAD_JSON"
              }
            ]
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "parentId"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.code",
                "equals": "BAD_JSON"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.data.content",
                "equals": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
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
                "path": "$.data.parentId",
                "equals": null
              }
            ]
          }
        }
      ]
    },
    {"id": "C11", "request": "V8", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}},
    {"id": "C12", "request": "V9", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}},
    {"id": "C13", "request": "V10", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 C | `201`, `Location`이 `/api/v1/comments/{id}`로 끝남, `postId`=만든 글, `parentId`=`null`, `content`는 앞뒤 공백 제거, `author`=이스프링 |
| C2 | 요청 R | `201`, `parentId`=C의 id, 작성자 김자바 |
| C3 | 요청 RR·XP·E | 모두 `400 VALIDATION_FAILED` — 답글의 답글·다른 글의 부모는 `field`=`parentId`, 공백만은 `content` |
| C4 | 요청 N·NP·PV | 토큰 없음 `401`, 없는 글·남의 비공개 글 `404` |
| C5 | 요청 G | `data`가 1개(C), `deleted`=`false`, `replies` id = `[R]`, 답글 작성자 김자바 |
| C6 | 요청 D1·DN·D | 남이 삭제 `403`, 토큰 없음 `401`, 작성자 삭제 `200`(`data`=`null`) |
| C7 | 요청 G2·GD | 지운 C가 `deleted`=`true`, "삭제된 댓글입니다", `author`=`null`로 자리만 남고 답글 R은 그대로. 글 상세의 `comments`도 같다 |
| C8 | 요청 D2·DX·GX | 이미 지운 댓글·없는 댓글 삭제, 없는 글의 목록 모두 `404` |
| C9 | V1~V7 | `content` 없음·`null`·501자 `content` / 없는 부모 `parentId` / 경로 `abc` `postId` — 모두 `400 VALIDATION_FAILED` / `parentId` `"abc"`·깨진 JSON `400 BAD_JSON` — `500`이 아니다 |
| C10 | B1 / B2 | 경계 바로 안쪽은 통과한다 — 앞뒤 공백을 붙인 500자는 다듬어 정확히 500자로 `201`, `parentId` `null`은 최상위 `201`(GX **뒤**에 보내므로 C5·C7의 댓글 수에 들어가지 않는다) |
| C11~C13 | V8 / V9 / V10 | `content` 숫자, `parentId` 숫자 문자열·소수는 Jackson 자동 변환 없이 `400 BAD_JSON` |
| D1 | 요청 D 뒤 `SELECT deleted_at IS NOT NULL FROM comments WHERE id = <C의 id>` | `1` — 행은 남는다 |
| R1 | 트리 | 상세와 댓글 목록이 같은 트리 만들기 코드를 쓴다 |
| R2 | 부모 규칙 | 같은 글·최상위·안 지움 세 조건을 한곳에서 보고, 어긋나면 `parentId` 필드 오류 400 |
| R3 | 쿼리 | 목록이 댓글 수만큼 작성자 조회를 하지 않는다(10-6의 fetch join 쿼리 재사용) |

## 필요한 지식

- [G2 권한 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md)
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md) — 애노테이션으로 못 거는 규칙
- [B6 List·Map·Optional·람다](../../lessons/B6-collections-optional-lambda.md) — `Optional.filter(...).orElseThrow(...)`
- [P20 JPA 엔티티 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — 자기 참조 `@ManyToOne`

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 파일 구성</summary>

`org.example.board.comment` 패키지: 10-6에서 만든 `Comment`·`CommentRepository`·트리 만들기에 더해 `CommentRequest`(`@NotBlank @Size(max = 500) String content, Long parentId`), 작성 응답 record, `CommentService`, `CommentController`.

`Comment`에 생성자 `Comment(Post post, User author, Comment parent, String content)`와 `delete()`를 더한다.
</details>

<details>
<summary>힌트 2 — 부모 확인을 한 줄로</summary>

```java
Comment parent = commentRepository.findById(parentId)
        .filter(p -> p.getPost().getId().equals(post.getId()) && p.getParent() == null && !p.isDeleted())
        .orElseThrow(() -> ApiException.invalid("parentId", "답글은 같은 글의 최상위 댓글에만 달 수 있습니다."));
```

`Optional.filter`는 조건이 거짓이면 빈 값으로 바꾼다. "없음"과 "조건 불만족"을 같은 400으로 묶을 때 편하다.
</details>

<details>
<summary>힌트 3 — 글 확인</summary>

상세(10-6)는 태그까지 fetch join하지만, 댓글 쓰기에는 글이 보이는지만 알면 된다. `Optional<Post> findByIdAndDeletedAtIsNull(Long id)`처럼 가벼운 조회를 하나 더 둔다. `post.getAuthor().getId()`는 지연 로딩 프록시라도 쿼리 없이 id를 준다.
</details>

## 다음 단계

[10-10. 좋아요 토글](10-10-like-toggle.md) — 누르면 좋아요, 다시 누르면 취소.
