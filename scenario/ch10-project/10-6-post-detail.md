# 10-6. 게시글 상세 — 조회수·작성자·태그·댓글을 한 번에, N+1 없이

## 상황

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `GET /api/v1/posts/{postId}` | 조회수 +1(같은 요청의 응답에도 반영), 작성자 `{id, nickname}`, 태그, 좋아요 수, 내가 좋아요했나(로그인 시), **댓글 목록**(시간순, 답글은 부모 아래) | 200 | 404(없음·삭제·남의 `PRIVATE`) |

상세 화면은 글 하나에 딸린 것을 모두 보여 준다. 작성자, 태그, 댓글(과 댓글마다의 작성자)이다. 엔티티를 하나씩 따라가며 읽으면 쿼리가 **댓글 수만큼** 늘어난다. 이것이 N+1 문제다. 이 단계의 목표는 기능과 함께 **쿼리 수를 댓글 수와 상관없이 고정하는 것**이다.

댓글은 10-9에서 쓰기를 만든다. 지금은 시드 데이터에 있는 댓글을 **읽어서 트리로 만드는 것**만 한다. 글 1에 모든 경우가 들어 있다.

| 댓글 | 상태 | 상세에서 |
|---|---|---|
| 1 "좋은 정리네요" | 최상위, 답글 2·3 | 보인다, `replies` 2개 |
| 4 "지울 댓글" | 최상위, **삭제됨**, 답글 5(살아 있음) | 내용·작성자를 숨기고 "삭제된 댓글입니다"로 자리만, `replies`에 5 |
| 6 "record는 불변이라 좋아요" | 최상위, 답글 7(삭제됨) | 보인다, `replies` 비어 있음 |
| 8 "아무 답글 없이 지운 댓글" | 최상위, 삭제됨, 답글 없음 | **아예 빠진다** |

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 화면",
  "summary": "글 1번을 연다. 조회수가 하나 오르고, 댓글은 답글이 부모 아래 들여쓰기로 보인다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자바 record 정리", "right": "김자바" },
    { "type": "chips", "id": "tags", "items": ["java"] },
    { "type": "stats", "id": "stats", "items": [{ "id": "views", "label": "조회", "value": "11" }, { "id": "likes", "label": "좋아요", "value": "2" }] },
    { "type": "text", "id": "body", "value": "자바 record 정리 — 본문입니다.", "emphasis": "body" },
    { "type": "list", "id": "comments", "label": "댓글", "items": [
      { "id": "c1", "title": "좋은 정리네요", "meta": "이스프링" },
      { "id": "c2", "title": "  ↳ 저도 그렇게 생각해요", "meta": "박디비" },
      { "id": "c3", "title": "  ↳ 감사합니다!", "meta": "김자바" },
      { "id": "c4", "title": "삭제된 댓글입니다", "tone": "muted" },
      { "id": "c5", "title": "  ↳ 삭제된 댓글에 단 답글", "meta": "이스프링" },
      { "id": "c6", "title": "record는 불변이라 좋아요", "meta": "김자바" }
    ] },
    { "type": "toast", "id": "toast", "value": "글을 찾을 수 없어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "상세 열기",
      "steps": [
        { "kind": "user", "text": "목록에서 글 1번을 누른다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/posts/1" },
        { "kind": "db", "sql": "-- ① 글 + 작성자 + 태그 한 번에\nSELECT ... FROM posts p JOIN users a ON a.id = p.author_id\n  LEFT JOIN post_tags pt ON ... LEFT JOIN tags t ON ...\nWHERE p.id = 1 AND p.deleted_at IS NULL;\n-- ② 조회수\nUPDATE posts SET view_count = view_count + 1 WHERE id = 1;\n-- ③ 댓글 + 댓글 작성자 한 번에\nSELECT ... FROM comments c JOIN users a ON a.id = c.author_id\nWHERE c.post_id = 1 ORDER BY c.created_at, c.id;", "note": "댓글이 6개든 600개든 쿼리는 3번(로그인했으면 좋아요 여부 1번 더)" },
        { "kind": "server", "text": "평평한 댓글 목록 → 최상위 + replies 트리. 지운 부모는 답글이 있을 때만 자리를 남긴다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"data\": {\n    \"id\": 1, \"viewCount\": 11, \"likeCount\": 2, \"liked\": false,\n    \"author\": { \"id\": 1, \"nickname\": \"김자바\" },\n    \"tags\": [\"java\"],\n    \"comments\": [\n      { \"id\": 1, \"content\": \"좋은 정리네요\", \"deleted\": false, \"replies\": [ {\"id\": 2, ...}, {\"id\": 3, ...} ] },\n      { \"id\": 4, \"content\": \"삭제된 댓글입니다\", \"author\": null, \"deleted\": true, \"replies\": [ {\"id\": 5, ...} ] },\n      { \"id\": 6, ..., \"replies\": [] }\n    ]\n  }\n}" },
        { "kind": "screen", "text": "조회수·태그·댓글 트리가 그려진다", "focus": ["views", "tags", "comments"] }
      ]
    },
    {
      "name": "남의 비공개 글",
      "steps": [
        { "kind": "user", "text": "이스프링이 주소창에 /posts/24를 직접 친다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/posts/24", "headers": ["Authorization: Bearer (이스프링 토큰)"] },
        { "kind": "server", "text": "24는 김자바의 PRIVATE 글 → 403이 아니라 404. \"있지만 못 본다\"를 알려 주면 비공개 글이 있다는 사실이 샌다" },
        { "kind": "response", "status": 404, "body": "{ \"status\": 404, \"code\": \"NOT_FOUND\", \"message\": \"게시글을 찾을 수 없습니다.\", ... }" },
        { "kind": "screen", "text": "없는 글과 똑같이 보인다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/v1/posts/{postId}` — 로그인 선택(`@LoginUser(required = false) Long userId`) |
| 404 | 없는 글, `deleted_at`이 있는 글, **남의** `PRIVATE` 글(작성자 본인은 볼 수 있다). 숫자가 아닌 id(`/posts/abc`)는 400 |
| 조회수 | `view_count`를 DB에서 +1. 응답의 `viewCount`는 **올린 뒤의 값** |
| 응답 `data` | `id`, `title`, `content`, `visibility`, `viewCount`, `likeCount`, `liked`(비로그인은 `false`), `author{id, nickname}`, `tags`(이름순), `comments`, `createdAt`, `updatedAt` |
| `comments` | 최상위 댓글을 시간순으로. 각각 `{id, content, author{id, nickname}, deleted, createdAt, replies: [...]}`. 답글은 부모의 `replies`에 시간순(답글 항목에는 `replies`가 없어도 된다) |
| 지운 댓글 | 지운 답글은 빠진다. 지운 최상위 댓글은 **살아 있는 답글이 있으면** `content`="삭제된 댓글입니다", `author`=`null`, `deleted`=`true`로 자리만 남기고, 없으면 빠진다 |
| 쿼리 수 | 댓글이 몇 개든 고정(목표: 비로그인 3번, 로그인 4번) |
| 작성 응답 | 10-5의 작성 응답도 같은 모양으로(`liked: false`, `comments: []`) |

## 설계 포인트

- **N+1이 생기는 자리.** 댓글 목록을 `findByPostId`로 읽고 응답을 만들며 `comment.getAuthor().getNickname()`을 부르면, 작성자가 `LAZY`라 **댓글마다** `SELECT ... FROM users`가 나간다. 댓글 6개면 1 + 6번이다. 해결은 "필요한 것을 처음 쿼리에서 같이 가져오기"다. JPQL의 `join fetch`를 쓴다.
- **컬렉션 두 개를 한 번에 fetch join하지 않는다.** 글 + 태그 + 댓글을 한 JPQL에 모두 `join fetch`하면 행이 곱으로 불어난다(태그 2 × 댓글 6 = 12행). 컬렉션이 둘 이상이면 Hibernate가 거부하기도 한다(`MultipleBagFetchException`). 글·작성자·태그 한 쿼리, 댓글·작성자 한 쿼리로 나눈다.
- **조회수는 "읽고 +1 해서 저장"하지 않는다.** 엔티티의 `viewCount`를 +1 하고 변경 감지에 맡기면, 동시에 두 명이 열 때 둘 다 10을 읽고 11을 쓴다. `UPDATE posts SET view_count = view_count + 1`을 DB에서 바로 실행한다(`@Modifying @Query`).
  응답에는 읽었던 값 + 1을 싣는다. 두 요청이 동시에 10을 읽으면 각 응답은 11일 수 있지만 DB의 최종 값은 12다. 응답 값은 **이 요청의 증가를 반영한 값**이며, 동시 요청까지 포함한 최신 합계를 보장하지 않는다.
- **트리는 메모리에서.** 댓글을 시간순 평평한 목록으로 한 번에 읽고, 자바에서 `parent_id`별로 묶어 트리를 만든다. 부모 댓글마다 답글을 다시 조회하면 그게 또 N+1이다.
- **남의 비공개는 404.** 403("권한 없음")은 "그 글이 있다"를 알려 준다. 접근 규칙은 [G2](../../lessons/G2-access-rules-in-one-place.md)처럼 한곳에 모아 두면 10-8·10-9에서 다시 쓴다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 댓글이 6개든 600개든 쿼리는 3번(로그인했으면 좋아요 여부 1번 더)
- 평평한 댓글 목록 → 최상위 + replies 트리. 지운 부모는 답글이 있을 때만 자리를 남긴다
- 24는 김자바의 PRIVATE 글 → 403이 아니라 404. "있지만 못 본다"를 알려 주면 비공개 글이 있다는 사실이 샌다

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/v1/posts/{postId}")`. 변경된 메서드: `create`, `detail`.

```java
@GetMapping("/api/v1/posts/{postId}")
public ApiResponse<PostDetailResponse> detail(@PathVariable Long postId,
        @LoginUser(required = false) Long userId) {
    return ApiResponse.ok(postService.detail(postId, userId));
}
```

인증이 선택인 GET이라 토큰이 없으면 `userId`는 `null`이다. 잘못된 토큰을 보냈다면 인터셉터가 401로 막는다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CommentResponse.java`, `PostDetailResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 변경된 메서드: `of`.

```java
public record PostDetailResponse(Long id, String title, String content, Visibility visibility,
        int viewCount, int likeCount, boolean liked, AuthorResponse author,
        List<String> tags, List<CommentResponse> comments,
        LocalDateTime createdAt, LocalDateTime updatedAt) {
}
```

이 단계는 10-5의 `PostResponse`를 삭제하고 작성·상세가 함께 쓰는 응답 DTO로 바꾼다. 삭제된 최상위 댓글은 답글이 있을 때만 `author: null`, `deleted: true`로 반환한다. 실제 생성 메서드와 `replies` 형태는 아래 DTO 접기에 있다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`, `detail`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public PostDetailResponse detail(Long postId, Long loginUserId) {
    Post post = postRepository.findDetailById(postId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
    if (post.getVisibility() == Visibility.PRIVATE && !post.getAuthor().getId().equals(loginUserId)) {
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
    }
    postRepository.increaseViewCount(postId);
    boolean liked = loginUserId != null && postRepository.countLike(postId, loginUserId) > 0;
    return PostDetailResponse.of(post, post.getViewCount() + 1, liked,
            CommentTree.build(commentRepository.findAllWithAuthorByPostId(postId)));
}
```

없는 글·삭제된 글·남의 비공개 글은 조회수를 올리기 전에 404로 끝난다. 응답 조회수는 DB의 원자적 증가 결과와 맞춘다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`CommentRepository.java`, `PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

```java
@Query("select distinct p from Post p join fetch p.author left join fetch p.tags where p.id = :id and p.deletedAt is null")
Optional<Post> findDetailById(Long id);

@Modifying
@Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
int increaseViewCount(Long id);

@Query("select c from Comment c join fetch c.author where c.post.id = :postId order by c.createdAt, c.id")
List<Comment> findAllWithAuthorByPostId(Long postId);
```

글+작성자+태그, 조회수 UPDATE, 댓글+작성자를 각각 한 쿼리로 처리한다. 로그인했을 때만 좋아요 여부 조회가 하나 더 있다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Comment.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "post_id")
private Post post;

@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id")
private User author;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id")
private Comment parent;
```

`parent_id`가 `null`이면 최상위 댓글이고, 값이 있으면 답글이다. `deleted_at`은 화면 표시와 자리 유지 규칙에 사용한다.

</details>

<details>
<summary>설정·보조 코드</summary>

`CommentTree.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `build`.

```java
for (Comment c : flat) {
    if (c.getParent() != null && !c.isDeleted()) {
        repliesByParent.computeIfAbsent(c.getParent().getId(), k -> new ArrayList<>())
                .add(CommentResponse.reply(c));
    }
}
```

댓글을 시간순 한 번 읽은 뒤 메모리에서 부모별로 묶는다. 지운 답글은 제외하고, 지운 최상위 댓글은 살아 있는 답글이 있을 때만 남긴다. 전체 반복문은 아래 보조 코드 접기에 있다.

</details>

<details>
<summary>MyBatis / Mapper — 상세를 고정 횟수의 JOIN으로 읽기</summary>

선택 경로는 `PostMapper.xml`의 `findDetailRows`가 `posts`·`users`·`post_tags`·`tags`를 한 번에 JOIN한다. 태그 수만큼 반복된 `PostDetailRow`를 Service에서 글 하나와 이름순 태그 목록으로 조립한다. `findCommentRows`는 `comments`와 작성자 `users`를 한 번에 JOIN하고 `parentId`로 답글 트리를 만든다.

```xml
<select id="findCommentRows" resultType="org.example.board.comment.CommentRow">
    SELECT c.id, c.parent_id AS parentId, c.content, c.created_at AS createdAt,
           c.deleted_at AS deletedAt, a.id AS authorId, a.nickname AS authorNickname
    FROM comments c JOIN users a ON a.id = c.author_id
    WHERE c.post_id = #{postId}
    ORDER BY c.created_at, c.id
</select>
<update id="increaseViewCount">
    UPDATE posts SET view_count = view_count + 1 WHERE id = #{postId}
</update>
```

비로그인은 글 JOIN·조회수 UPDATE·댓글 JOIN 3번, 로그인하면 좋아요 여부 SELECT까지 4번이다. 10-5의 MyBatis 가입·인증·글쓰기 경로도 포함해 기본 10-6 스냅샷에 적용할 21개 파일 전문은 아래 **MyBatis 대체 구현 코드**에서 펼쳐 볼 수 있다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

**쿼리 수 세기** — `application.yml`에 SQL 로그를 켜고 요청 A를 보낸 뒤, 로그에서 `org.hibernate.SQL` 줄을 센다.

```yaml
logging:
  level:
    org.hibernate.SQL: debug
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "비로그인 상세(글 1)", "method": "GET", "path": "/api/v1/posts/1" },
    { "id": "B", "title": "다시 — 조회수 +1", "method": "GET", "path": "/api/v1/posts/1" },
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "M", "title": "로그인(이스프링)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "lee@example.com", "password": "password1234" } },
    { "id": "K", "title": "김자바가 좋아요한 글 11", "method": "GET", "path": "/api/v1/posts/11", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "K2", "title": "김자바가 안 누른 글 12", "method": "GET", "path": "/api/v1/posts/12", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "P1", "title": "비공개 글 — 비로그인", "method": "GET", "path": "/api/v1/posts/24" },
    { "id": "P2", "title": "비공개 글 — 남(이스프링)", "method": "GET", "path": "/api/v1/posts/24", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    { "id": "P3", "title": "비공개 글 — 작성자(김자바)", "method": "GET", "path": "/api/v1/posts/24", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "D", "title": "삭제된 글", "method": "GET", "path": "/api/v1/posts/25" },
    { "id": "X", "title": "없는 글", "method": "GET", "path": "/api/v1/posts/999999" },
    { "id": "T", "title": "숫자 아님", "method": "GET", "path": "/api/v1/posts/abc" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.id", "equals": 1 },
          { "path": "$.data.author", "equals": { "id": 1, "nickname": "김자바" } },
          { "path": "$.data.tags", "equals": ["java"] },
          { "path": "$.data.likeCount", "equals": 2 },
          { "path": "$.data.liked", "equals": false },
          { "path": "$.data.viewCount", "type": "number" }
        ]
      }
    },
    {
      "id": "C2",
      "request": "A",
      "expect": {
        "json": [
          { "path": "$.data.comments", "length": 3 },
          { "path": "$.data.comments[*].id", "equals": [1, 4, 6] },
          { "path": "$.data.comments[0].author", "equals": { "id": 2, "nickname": "이스프링" } },
          { "path": "$.data.comments[0].replies[*].id", "equals": [2, 3] },
          { "path": "$.data.comments[0].replies[0].content", "equals": "저도 그렇게 생각해요" },
          { "path": "$.data.comments[1].deleted", "equals": true },
          { "path": "$.data.comments[1].content", "equals": "삭제된 댓글입니다" },
          { "path": "$.data.comments[1].author", "type": "null" },
          { "path": "$.data.comments[1].replies[*].id", "equals": [5] },
          { "path": "$.data.comments[2].replies", "equals": [] }
        ]
      },
      "note": "지운 답글 7, 답글 없이 지운 8은 보이지 않는다"
    },
    { "id": "C3", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.data.viewCount", "equals": "{{A.body.data.viewCount + 1}}" }] } },
    {
      "id": "C4",
      "all": [
        { "request": "K", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": true }, { "path": "$.data.likeCount", "equals": 3 }] } },
        { "request": "K2", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": false }] } }
      ]
    },
    {
      "id": "C5",
      "all": [
        { "request": "P1", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "P2", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "P3", "expect": { "status": 200, "json": [{ "path": "$.data.visibility", "equals": "PRIVATE" }] } }
      ]
    },
    {
      "id": "C6",
      "all": [
        { "request": "D", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }, { "path": "$.data", "type": "null" }] } },
        { "request": "X", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ]
    },
    { "id": "C7", "request": "T", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }] } }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `200`, `id`=`1`, `author`=`{id: 1, nickname: 김자바}`, `tags`=`["java"]`, `likeCount`=`2`, `liked`=`false`(비로그인), `viewCount`는 숫자 |
| C2 | 요청 A | 최상위 댓글 id가 `[1, 4, 6]` 순서. 1의 작성자는 이스프링, 답글 id `[2, 3]`. 4는 `deleted`=`true`, `content`=`삭제된 댓글입니다`, `author`=`null`, 답글 `[5]`. 6의 `replies`=`[]`. 7·8은 없다 |
| C3 | 요청 B | `viewCount` = 요청 A의 `viewCount` + 1 |
| C4 | 요청 K·K2 | 김자바로 글 11은 `liked`=`true`, `likeCount`=`3`. 글 12는 `liked`=`false` |
| C5 | 요청 P1·P2·P3 | 비공개 글 24: 비로그인 `404`, 이스프링 `404`, 작성자 김자바 `200`(`visibility`=`PRIVATE`) |
| C6 | 요청 D·X | 삭제된 글·없는 글 모두 `404 NOT_FOUND`, `data`=`null` |
| C7 | 요청 T | `400 VALIDATION_FAILED` |
| D1 | 요청 A 직후 `SELECT view_count FROM posts WHERE id = 1` | 요청 A 응답의 `viewCount`와 같다 |
| R1 | 쿼리 수 | SQL 로그에서 요청 A 하나에 나가는 쿼리가 댓글 수와 상관없이 고정이다(글·작성자·태그 1, 조회수 UPDATE 1, 댓글·작성자 1 — 로그인 시 좋아요 여부 +1) |
| R2 | 조회수 | 엔티티 값을 +1 해서 저장하지 않고 `UPDATE ... SET view_count = view_count + 1` 한 번 |
| R3 | 접근 규칙 | "보이는 글인가"(삭제·비공개) 판단이 한곳(메서드 하나)에 있다 |

## 필요한 지식

- [E4 JPA 연관관계 첫걸음](../../lessons/E4-jpa-associations.md) — 지연 로딩, N+1을 SQL 로그로 세고 fetch join으로 줄이기
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md)
- [G2 권한 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 404와 403을 고르는 기준
- [H1 동시성 맛보기](../../lessons/H1-concurrency-taste.md) — 조회수를 읽고-더하고-쓰면 생기는 일
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — 지연 로딩, fetch join, N+1
- [S10 Spring Data 쿼리](../../docs/knowledge/S10-spring-data-query.md) — `@Query`, `@Modifying`

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 글·작성자·태그를 한 번에</summary>

```java
@Query("select distinct p from Post p join fetch p.author left join fetch p.tags "
        + "where p.id = :id and p.deletedAt is null")
Optional<Post> findDetailById(Long id);
```

태그가 없는 글도 나와야 하니 태그는 `left join fetch`다. `distinct`는 태그 수만큼 같은 글이 겹치는 것을 막는다.
</details>

<details>
<summary>힌트 2 — 댓글을 작성자와 함께</summary>

`Comment` 엔티티(`comments`)를 만든다. `post`·`author`·`parent`는 모두 `@ManyToOne(fetch = LAZY)`다. 저장소에서 이렇게 읽는다.

```java
@Query("select c from Comment c join fetch c.author where c.post.id = :postId order by c.createdAt, c.id")
List<Comment> findAllWithAuthorByPostId(Long postId);
```

`c.getParent().getId()`는 부모를 따로 조회하지 않는다. 지연 로딩 프록시도 id는 이미 알고 있다.
</details>

<details>
<summary>힌트 3 — 평평한 목록 → 트리</summary>

1. 한 바퀴 돌며 **살아 있는 답글**을 `Map<부모 id, List<답글>>`에 모은다.
2. 다시 돌며 최상위 댓글마다 `replies = map.getOrDefault(id, List.of())`를 붙인다.
3. 최상위가 삭제됐는데 `replies`가 비었으면 건너뛴다. 남기면 내용·작성자를 가린다.

답글 항목에 `replies`를 아예 빼고 싶으면 그 필드에 `@JsonInclude(JsonInclude.Include.NON_NULL)`을 붙이고 답글은 `null`로 만든다.
</details>

<details>
<summary>힌트 4 — 조회수 +1과 응답 값</summary>

```java
@Modifying
@Query("update Post p set p.viewCount = p.viewCount + 1 where p.id = :id")
int increaseViewCount(Long id);
```

서비스 메서드에 `@Transactional`이 있어야 한다(`@Modifying` 쿼리는 트랜잭션 안에서만). 벌크 UPDATE는 이미 읽어 둔 엔티티의 값을 바꾸지 않는다. 응답에는 `post.getViewCount() + 1`을 싣는다.

"내가 좋아요했나"는 아직 좋아요 엔티티가 없으니(10-10) 네이티브 쿼리로 센다. `@Query(value = "select count(*) from post_likes where post_id = :postId and user_id = :userId", nativeQuery = true) long countLike(...)`처럼 쓴다.
</details>

## 다음 단계

[10-7. 목록](10-7-post-list.md) — 최신순·인기순·페이지·커서·태그·검색. 조건이 많은 이 API를 JPA(JPQL·`Pageable`)로 만들고, 원하면 같은 목록을 MyBatis 동적 SQL로도 짜 본다(선택).
