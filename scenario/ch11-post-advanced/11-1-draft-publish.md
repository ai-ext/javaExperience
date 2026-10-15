# 11-1. 임시저장했다가 발행하기

> 시나리오 DB(`community`) — 8·9장에서 `practice` 프로파일로 띄웠다면 프로파일 없이 다시 띄운다. 11장의 마이그레이션은 `V20`부터 쓴다(9장까지 `V6`).
>
> 11~16장은 한 레포에서 **순서대로** 이어서 한다. 장마다 쓰는 DB가 다르다 — 11·13·14장은 `community`(기본 프로파일), 12·15·16장은 `practice`(`practice` 프로파일). 각 단계 맨 위에 적어 둔다. 마이그레이션 번호도 장마다 정해져 있다(11장 V20대, 12장 V30대, 13장 V40대, 14장 V50대, 15장 V60대, 16장 V70대). 장을 건너뛰고 뒤 장을 먼저 하면, 나중에 앞 장의 낮은 번호가 "이미 지나간 버전"이 되어 Flyway가 앱 기동을 막는다(`outOfOrder` 기본값 `false`).

## 상황

> "긴 글 쓰다가 날아가면 화나잖아요. [임시저장]으로 저장해 두고, 다 쓰면 [발행]을 누르게 해 주세요. 목록에는 발행한 순서대로 떠야 해요."

2-3에서 임시저장(`DRAFT`) 글을 **"작성자만 볼 수 있다"**고 정했다. 그런데 지금 API로는 임시저장 글을 **만들 방법이 없다** — `POST /api/posts`는 항상 `PUBLISHED`로 저장한다. 이번 단계에서 임시저장으로 쓰기, 내 임시저장 글 모아 보기, 발행하기를 만든다.

발행에서 중요한 건 **발행 시각(`published_at`)**이다. 게시판 목록은 `published_at` 최신순이다(2-2). 사흘 전에 쓰기 시작해 오늘 발행한 글은 "오늘 올라온 글"이어야 목록 맨 위에 온다. 그래서 임시저장 글은 `published_at`이 비어 있고(`NULL`), 발행하는 순간 채운다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 임시저장과 발행",
  "summary": "임시저장한 글은 나만 보이고 목록에 없다. [발행]을 누르는 순간 발행 시각이 찍히고 목록 맨 위에 뜬다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "김자바" },
    { "type": "select", "id": "board", "label": "게시판", "value": "자유" },
    { "type": "field", "id": "title", "label": "제목", "value": "스프링 첫 프로젝트 회고" },
    { "type": "field", "id": "content", "label": "본문", "value": "아직 반쯤 썼다…", "multiline": true },
    {
      "type": "actions",
      "id": "write-actions",
      "items": [
        { "id": "save-draft", "label": "임시저장", "variant": "secondary" },
        { "id": "publish-now", "label": "바로 발행", "variant": "primary" }
      ]
    },
    {
      "type": "list",
      "id": "drafts",
      "label": "내 임시저장 글",
      "items": [{ "id": "draft-row", "title": "스프링 첫 프로젝트 회고", "meta": "자유 · 10월 10일 15:04 저장" }]
    },
    { "type": "actions", "id": "draft-actions", "items": [{ "id": "publish", "label": "발행", "variant": "primary" }] },
    { "type": "toast", "id": "toast", "value": "발행했어요", "tone": "success" },
    { "type": "toast", "id": "conflict", "value": "이미 발행된 글이에요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "임시저장",
      "steps": [
        { "kind": "user", "text": "제목·본문을 쓰다가 [임시저장]을 누른다", "focus": ["save-draft"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"free\", \"title\": \"스프링 첫 프로젝트 회고\", \"content\": \"아직 반쯤 썼다…\", \"status\": \"DRAFT\"}"
        },
        { "kind": "server", "text": "status가 DRAFT → 발행 시각은 비워 둔다. 1-5의 입력 검증은 그대로" },
        { "kind": "db", "sql": "INSERT INTO post (..., status, published_at, created_at, updated_at)\nVALUES (..., 'DRAFT', NULL, NOW(), NOW())" },
        { "kind": "response", "status": 201, "body": "{\"id\": 22, \"status\": \"DRAFT\", \"publishedAt\": null, ...}" },
        { "kind": "screen", "text": "'임시저장했어요' — 내 임시저장 글 목록에 생긴다. 게시판 목록에는 없다", "focus": ["drafts"] }
      ]
    },
    {
      "name": "내 임시저장 글을 열어 발행",
      "steps": [
        { "kind": "user", "text": "[내 임시저장 글]을 연다", "focus": ["drafts"] },
        { "kind": "request", "method": "GET", "path": "/api/me/drafts", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "db", "sql": "SELECT p.*, b.slug FROM post p JOIN board b ON b.id = p.board_id\nWHERE p.author_id = 2 AND p.status = 'DRAFT' AND p.deleted_at IS NULL\nORDER BY p.updated_at DESC, p.id DESC" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 22, \"boardSlug\": \"free\", \"title\": \"스프링 첫 프로젝트 회고\", \"updatedAt\": \"2026-10-10T15:04:24\"}]}" },
        { "kind": "user", "text": "글을 마저 쓰고 [발행]을 누른다", "focus": ["publish"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/22/publish", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "볼 수 있나(404) → 작성자인가(403) → 아직 DRAFT인가(409) 순서로 확인" },
        { "kind": "db", "sql": "UPDATE post SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW() WHERE id = 22" },
        { "kind": "response", "status": 200, "body": "{\"id\": 22, \"status\": \"PUBLISHED\", \"publishedAt\": \"2026-10-10T15:30:00\", ...}" },
        { "kind": "screen", "text": "'발행했어요' — 자유 게시판 맨 위에 뜨고, 임시저장 목록에서는 빠진다", "focus": ["toast"] }
      ]
    },
    {
      "name": "두 번 누름",
      "steps": [
        { "kind": "user", "text": "다른 탭에 열어 둔 같은 글에서 [발행]을 또 누른다", "focus": ["publish"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/22/publish", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "이미 PUBLISHED — 발행 시각을 다시 찍지 않는다" },
        { "kind": "response", "status": 409, "body": "{\"status\": 409, \"detail\": \"임시저장 글만 발행할 수 있습니다.\"}" },
        { "kind": "screen", "text": "'이미 발행된 글이에요'", "focus": ["conflict"] }
      ]
    }
  ]
}
```

## 만들 것

**글쓰기에 상태 추가** — `POST /api/posts`

필드 규칙 — 1-5의 규칙에 `status` 한 줄이 더해진다. 틀리면 저장하지 않고 `400` + `errors: [{field, message}]`(틀린 필드가 여럿이면 **모두**). 어떤 잘못된 입력에도 `500`이 나오면 안 된다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `boardSlug` | 예 | 안 됨(공백만도 안 됨) | — | 있는 게시판 slug | — | 400(`boardSlug`), 없는 게시판은 404(1-4) |
| `title` | 예 | 안 됨(공백만도 안 됨) | 1~200자 | 문자열 | — | 400(`title`) |
| `content` | 예 | 안 됨(공백만도 안 됨) | — | 문자열 | — | 400(`content`) |
| `tags` | 아니오 | null·`[]` 허용 | 5개까지, 이름 1~30자 | 문자열 배열 | `[]` | 400(`tags…`) |
| `visibility` | 아니오 | null 허용 | — | `PUBLIC`·`FOLLOWERS` | `PUBLIC` | 400(`visibility`) |
| **`status`** | 아니오 | null 허용(=생략). **빈 문자열은 안 됨** | — | `DRAFT`·`PUBLISHED`(대문자 그대로) | `PUBLISHED` | 400(`status`) |

| 항목 | 내용 |
|---|---|
| `DRAFT`로 저장 | `post.status = 'DRAFT'`, `published_at = NULL` |
| `PUBLISHED`로 저장 | 지금처럼 `published_at` = 지금 |
| 응답 | 1-2의 작성 응답 + `status`, `publishedAt`(임시저장이면 `null`) |

**내 임시저장 글** — `GET /api/me/drafts`

| 항목 | 내용 |
|---|---|
| 인증 | 필요 — 토큰이 없으면 `401` |
| 대상 | 내가 쓴 `DRAFT` 글, 지운 글 제외 |
| 정렬 | `updated_at` 최신 → `id` 큰 순 |
| 응답 | `200` `{ "items": [ { "id", "boardSlug", "title", "updatedAt" } ] }` |

**발행** — `POST /api/posts/{id}/publish`

| 상황 | 결과 |
|---|---|
| 요청 본문 | 없음. 경로의 `{id}`만 쓴다 — 숫자가 아니면(`/api/posts/abc/publish`) `400` |
| 내 임시저장 글 | `200`, 상세 모양(2-1) + `status`=`PUBLISHED`, `publishedAt`=지금. DB는 `status`·`published_at`·`updated_at`만 바뀐다 |
| 없는 글(예: `99999999`), 볼 수 없는 글(남의 임시저장 글 포함), 지운 글 | `404` — 2-3 규칙 그대로 |
| 볼 수는 있지만 내 글이 아님 | `403` |
| 내 글인데 이미 `PUBLISHED`(또는 운영자가 숨긴 `HIDDEN`) | `409` — 상태가 맞지 않는다 |

- 상세 응답(`GET /api/posts/{id}`)에도 `status`·`publishedAt`을 넣는다. 작성자는 자기 임시저장 글을 상세로 열 수 있다(2-3).
- 목록·검색에서 임시저장 글을 빼는 일은 2-3에서 이미 했다 — 발행하면 `status`가 바뀌므로 저절로 목록에 들어온다.
- 스키마 변경 없음 — `post.status`, `post.published_at`(NULL 허용)은 처음부터 있다.

**형식이 아예 틀린 값도 어느 필드인지 알려 주기** — 공통 예외 처리기(`ApiExceptionHandler`)

값의 **형식**이 틀리면 검증(`@Pattern` 등)까지 가지도 못한다. 지금은 `400`이지만 `errors`가 없어서 무엇을 고쳐야 할지 모른다. 이번 단계에서 한 번 고쳐 두면 11장 뒤의 모든 단계(이미지 id·투표 선택지·예약 시각·쿼리 날짜 등)가 같은 모양을 쓴다.

| 틀린 곳 | 예 | 지금 | 바꾼 뒤 |
|---|---|---|---|
| 본문 필드 형식 | `"tags": "java"`(목록 자리에 문자열), `"status": ["DRAFT"]` | `HttpMessageNotReadableException` → `400` "요청 본문을 읽을 수 없습니다", `errors` 없음 | `400` + `errors: [{"field": "tags", …}]` — 원인 예외(`JacksonException`)의 `getPath()`가 필드 경로다. 목록 안이면 `imageIds[0]`처럼 Bean Validation과 같은 모양 |
| 경로·쿼리 값 형식 | `/api/posts/abc/publish`, `?size=abc` | `MethodArgumentTypeMismatchException` → Spring 기본 응답(ProblemDetail도 아님) | `400` + `errors: [{"field": "id", …}]` — 예외의 `getName()`이 파라미터 이름이다 |
| JSON 문법 자체가 깨짐 | `{"title":` | `400` | 그대로 `400`(어느 필드인지 정할 수 없어 `errors` 없음) |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- status가 DRAFT → 발행 시각은 비워 둔다. 1-5의 입력 검증은 그대로
- 볼 수 있나(404) → 작성자인가(403) → 아직 DRAFT인가(409) 순서로 확인
- 이미 PUBLISHED — 발행 시각을 다시 찍지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`MyPostController.java`, `PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/me/drafts")`, `@PostMapping("/{id}/publish")`. 변경된 메서드: `myDrafts`, `publish`.

```java
@GetMapping("/api/me/drafts")
public MyDraftsResponse myDrafts(@LoginMember AuthenticatedMember loginMember) {
    if (loginMember == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return postService.myDrafts(loginMember);
}

@PostMapping("/{id}/publish")
public PostDetailResponse publish(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
    return toDetailResponse(postService.publish(id, loginMember));
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`MyDraftItemResponse.java`, `MyDraftsResponse.java`, `PostCreateRequest.java`, `PostDetailResponse.java`, `PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
// PostCreateRequest: null/생략은 서비스에서 PUBLISHED로 바꾼다.
@Pattern(regexp = "DRAFT|PUBLISHED", message = "상태는 DRAFT 또는 PUBLISHED여야 합니다.")
String status

public record MyDraftItemResponse(Long id, String boardSlug, String title, LocalDateTime updatedAt) { }
public record MyDraftsResponse(List<MyDraftItemResponse> items) { }
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`, `PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `publish`, `myDrafts`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public Post publish(Long id, AuthenticatedMember loginMember) {
    Post post = postRepository.findByIdForUpdate(id).orElseThrow(PostNotFoundException::new);
    if (!accessPolicy.canView(loginMember, post)) throw new PostNotFoundException();
    if (!post.getAuthor().getId().equals(loginMember.id())) throw new PostForbiddenException();
    if (!"DRAFT".equals(post.getStatus())) throw new PostNotDraftException();
    post.publish(LocalDateTime.now());
    // 응답 직렬화는 트랜잭션 밖에서 이뤄져 필요한 연관 값을 여기서 읽는다.
    post.getBoard().getSlug();
    post.getAuthor().getNickname();
    post.getTags().forEach(Tag::getName);
    return post;
}
```

```java
@Transactional(readOnly = true)
public MyDraftsResponse myDrafts(AuthenticatedMember loginMember) {
    List<MyDraftItemResponse> items = postRepository.findMyDrafts(loginMember.id()).stream()
            .map(p -> new MyDraftItemResponse(p.getId(), p.getBoard().getSlug(), p.getTitle(), p.getUpdatedAt()))
            .toList();
    return new MyDraftsResponse(items);
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

발행할 글 행을 먼저 잠그면 두 요청이 동시에 DRAFT를 읽고 둘 다 발행하는 일을 막는다. 기다린 요청은 앞 요청이 커밋한 뒤 PUBLISHED를 확인해 409를 받는다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Post p WHERE p.id = :id")
Optional<Post> findByIdForUpdate(@Param("id") Long id);

@Query("""
        SELECT p FROM Post p JOIN FETCH p.board
        WHERE p.author.id = :authorId AND p.status = 'DRAFT' AND p.deletedAt IS NULL
        ORDER BY p.updatedAt DESC, p.id DESC
        """)
List<Post> findMyDrafts(@Param("authorId") Long authorId);
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `publish`.

```java
// 생성자는 DRAFT일 때 발행 시각을 비워 둔다.
this.publishedAt = "PUBLISHED".equals(status) ? now : null;

public void publish(LocalDateTime now) {
    this.status = "PUBLISHED";
    this.publishedAt = now;
    this.updatedAt = now;
}
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `PostNotDraftException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleUnreadable`, `handleTypeMismatch`, `handlePostNotDraft`.

```java
@ExceptionHandler(PostNotDraftException.class)
public ProblemDetail handlePostNotDraft(PostNotDraftException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    problem.setInstance(URI.create(request.getRequestURI()));
    return problem;
}
```

`HttpMessageNotReadableException`과 경로 타입 오류의 처리기는 JSON 원래 필드와 경로 `id`를 `errors`에 담아 `400`으로 응답한다. 전체 코드는 아래 역할별 코드 토글에서 확인한다.

</details>

<details>
<summary>MyBatis Mapper — 임시저장·발행 SQL</summary>

**MyBatis 대체 코드** 토글은 이 단계에서 추가한 임시저장·발행 경로를 Mapper로 실행한다. 선행 단계의 JPA 읽기·일반 글쓰기는 유지하며, 임시저장 INSERT의 새 id를 받아 글을 반환하고 `post_tag` 연결은 기존 JPA 트랜잭션에서 저장한다.

발행 전에 `SELECT ... FOR UPDATE`로 글 행을 잠근 뒤 404→403→409를 검사한다. 발행 UPDATE도 `status='DRAFT'`를 조건에 넣고 영향 행 수가 0이면 롤백한다. 임시저장 목록은 게시판을 JOIN해 한 번에 읽는다.

```java
int insertDraft(DraftInsertRow row);
Long lockPost(@Param("id") Long id);
int publish(@Param("id") Long id, @Param("now") LocalDateTime now);
List<MyDraftRow> findMyDrafts(@Param("authorId") Long authorId);
```

```xml
<select id="lockPost" resultType="long">
  SELECT id FROM post WHERE id = #{id} FOR UPDATE
</select>
<insert id="insertDraft" useGeneratedKeys="true" keyProperty="id">
  INSERT INTO post (board_id, author_id, title, content, excerpt, status, visibility,
                    view_count, like_count, comment_count, published_at, created_at, updated_at)
  VALUES (#{boardId}, #{authorId}, #{title}, #{content}, LEFT(#{content}, 100), 'DRAFT', #{visibility},
          0, 0, 0, NULL, #{now}, #{now})
</insert>
<update id="publish">
  UPDATE post SET status = 'PUBLISHED', published_at = #{now}, updated_at = #{now}
  WHERE id = #{id} AND status = 'DRAFT' AND deleted_at IS NULL
</update>
<select id="findMyDrafts" resultType="org.example.post.MyDraftRow">
  SELECT p.id, b.slug AS board_slug, p.title, p.updated_at
  FROM post p JOIN board b ON b.id = p.board_id
  WHERE p.author_id = #{authorId} AND p.status = 'DRAFT' AND p.deleted_at IS NULL
  ORDER BY p.updated_at DESC, p.id DESC
</select>
```

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 확인하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "P0",
      "title": "P0 임시저장으로 쓰기(김자바)",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[채점] 임시저장 글", "content": "쓰는 중", "status": "DRAFT" }
    },
    { "id": "P1", "title": "P1 비로그인 상세", "method": "GET", "path": "/api/posts/{{P0.body.id}}" },
    { "id": "P2", "title": "P2 자유 게시판 목록(size=50)", "method": "GET", "path": "/api/boards/free/posts?size=50" },
    { "id": "P3", "title": "P3 내 임시저장 글", "method": "GET", "path": "/api/me/drafts", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P4", "title": "P4 이스프링이 발행", "method": "POST", "path": "/api/posts/{{P0.body.id}}/publish", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "P5", "title": "P5 작성자가 발행", "method": "POST", "path": "/api/posts/{{P0.body.id}}/publish", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P6", "title": "P6 또 발행", "method": "POST", "path": "/api/posts/{{P0.body.id}}/publish", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P7", "title": "P7 자유 게시판 목록 첫 글", "method": "GET", "path": "/api/boards/free/posts?size=1" },
    { "id": "P8", "title": "P8 발행 뒤 내 임시저장 글", "method": "GET", "path": "/api/me/drafts", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P9", "title": "P9 남의 공개 글(2번) 발행", "method": "POST", "path": "/api/posts/2/publish", "headers": { "Authorization": "Bearer tok-kimjava" } },
    {
      "id": "P10",
      "title": "P10 잘못된 상태 값",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[채점] 잘못된 상태", "content": "x", "status": "SECRET" }
    },
    { "id": "P11", "title": "P11 토큰 없이 내 임시저장 글", "method": "GET", "path": "/api/me/drafts" },
    { "id": "P12", "title": "P12 status 빈 문자열", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 상태", "content": "x", "status": "" } },
    { "id": "P13", "title": "P13 status 소문자", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 상태", "content": "x", "status": "draft" } },
    { "id": "P14", "title": "P14 빈 제목 + 잘못된 상태", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "", "content": "x", "status": "X" } },
    { "id": "P15", "title": "P15 status에 숫자", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 상태", "content": "x", "status": 1 } },
    { "id": "P16", "title": "P16 status null(=생략)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c11" }, "body": { "boardSlug": "free", "title": "[채점] 상태 생략", "content": "x", "status": null } },
    { "id": "P17", "title": "P17 제목 200자 임시저장", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c11" }, "body": { "boardSlug": "free", "title": "가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차", "content": "x", "status": "DRAFT" } },
    { "id": "P18", "title": "P18 제목 201자 임시저장", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가나다라마바사아자차가", "content": "x", "status": "DRAFT" } },
    { "id": "P19", "title": "P19 없는 글 발행", "method": "POST", "path": "/api/posts/99999999/publish", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P20", "title": "P20 숫자가 아닌 id 발행", "method": "POST", "path": "/api/posts/abc/publish", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "F1", "title": "F1 목록 자리에 문자열(tags)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 형식", "content": "x", "tags": "java" } },
    { "id": "F2", "title": "F2 문자열 자리에 목록(status)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 형식", "content": "x", "status": ["DRAFT"] } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "P0",
      "expect": {
        "status": 201,
        "json": [
          { "path": "$.status", "equals": "DRAFT" },
          { "path": "$.publishedAt", "type": "null" }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        { "request": "P1", "expect": { "status": 404 } },
        { "request": "P2", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "notContains": "{{P0.body.id}}" }] } }
      ]
    },
    {
      "id": "C3",
      "request": "P3",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].id", "equals": "{{P0.body.id}}" },
          { "path": "$.items[0].boardSlug", "equals": "free" },
          { "path": "$.items[0].title", "equals": "[채점] 임시저장 글" }
        ]
      }
    },
    { "id": "C4", "request": "P4", "expect": { "status": 404 } },
    {
      "id": "C5",
      "request": "P5",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.id", "equals": "{{P0.body.id}}" },
          { "path": "$.status", "equals": "PUBLISHED" },
          { "path": "$.publishedAt", "type": "string" }
        ]
      }
    },
    { "id": "C6", "request": "P6", "expect": { "status": 409 } },
    {
      "id": "C7",
      "all": [
        { "request": "P7", "expect": { "status": 200, "json": [{ "path": "$.items[0].id", "equals": "{{P0.body.id}}" }] } },
        { "request": "P8", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "notContains": "{{P0.body.id}}" }] } }
      ]
    },
    { "id": "C8", "request": "P9", "expect": { "status": 403 } },
    {
      "id": "C9",
      "request": "P10",
      "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "equals": "status" }] }
    },
    { "id": "C10", "request": "P11", "expect": { "status": 401 } },
    {
      "id": "C11",
      "all": [
        { "request": "P12", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "status" }] } },
        { "request": "P13", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "status" }] } },
        { "request": "P15", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "status" }] } }
      ]
    },
    {
      "id": "C12",
      "request": "P14",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.errors[*].field", "contains": "title" },
          { "path": "$.errors[*].field", "contains": "status" }
        ]
      }
    },
    {
      "id": "C13",
      "all": [
        { "request": "P16", "expect": { "status": 201, "json": [{ "path": "$.status", "equals": "PUBLISHED" }, { "path": "$.publishedAt", "type": "string" }] } },
        { "request": "P17", "expect": { "status": 201, "json": [{ "path": "$.status", "equals": "DRAFT" }] } },
        { "request": "P18", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "title" }] } }
      ]
    },
    {
      "id": "C14",
      "all": [
        { "request": "P19", "expect": { "status": 404 } },
        { "request": "P20", "expect": { "status": 400 } }
      ]
    },
    {
      "id": "C15",
      "all": [
        { "request": "F1", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "tags" }] } },
        { "request": "F2", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "status" }] } },
        { "request": "P20", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "id" }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{D}`는 P0에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | P0 | `201`, `status`=`DRAFT`, `publishedAt`=`null` |
| C2 | P1 / P2 | `404` / 목록에 `{D}` 없음 |
| C3 | P3 | `200`, 첫 항목이 `{D}`(`boardSlug`=`free`, 제목 그대로) |
| C4 | P4(남이 발행) | `404` — 남의 임시저장 글은 있다는 것도 드러내지 않는다 |
| C5 | P5 | `200`, `status`=`PUBLISHED`, `publishedAt`이 문자열 |
| C6 | P6(또 발행) | `409` |
| C7 | P7 / P8 | 자유 게시판 첫 글이 `{D}` / 임시저장 목록에서 빠짐 |
| C8 | P9(김자바가 이스프링의 공개 글 2번 발행) | `403` |
| C9 | P10 | `400`, `errors[0].field`=`status` |
| C10 | P11 | `401` |
| C11 | P12 / P13 / P15(`status`가 `""`·`"draft"`·숫자 `1`) | 모두 `400`, `errors`에 `status` — 500이 아니다 |
| C12 | P14(빈 제목 + 없는 상태) | `400`, `errors`에 `title`과 `status` **둘 다** |
| C13 | P16 / P17 / P18 | `status: null`은 생략과 같다 → `201` `PUBLISHED` / 제목 정확히 200자 임시저장 → `201` `DRAFT` / 201자 → `400`(`title`) |
| C14 | P19 / P20 | 없는 글 발행 `404` / 숫자가 아닌 id `400` |
| C15 | F1 / F2 / P20 | 형식이 아예 틀린 값도 `400` + `errors`에 그 필드 — 목록 자리에 문자열 `tags`, 문자열 자리에 목록 `status`, 경로의 숫자 자리에 `abc` → `id`(이 단계 전에는 `400`이지만 `errors`가 없다) |
| D1 | P0 **직후**(P5 전) `SELECT status, published_at FROM post WHERE id = {D}` | `DRAFT`, `NULL` |
| D2 | P5 뒤 `SELECT status, published_at IS NOT NULL, updated_at = published_at FROM post WHERE id = {D}` | `PUBLISHED`, `1`, `1` — 발행하면서 발행 시각이 찍혔고, 발행이 마지막 변경이다 |
| D3 | `SELECT COUNT(*) FROM post WHERE id = 2 AND status = 'PUBLISHED'` | `1` — P9가 남의 글을 건드리지 않았다 |
| D4 | `SELECT COUNT(*) FROM post WHERE title = '[채점] 잘못된 상태'` | `0` — 400이 난 요청은 아무것도 저장하지 않았다(이 단계 전 코드는 `status`를 몰라서 그냥 저장한다) |
| R1 | 확인 순서 | 404(볼 수 없음) → 403(작성자 아님) → 409(상태) 순서를 지킨다. 409를 먼저 보면 남의 글의 상태가 새어 나간다는 것을 설명할 수 있다 |
| R2 | 상태 바꾸기 | 발행을 엔티티 메서드(`post.publish(now)`) 하나로 한다 — `status`와 `publishedAt`을 서비스에서 따로따로 고치지 않는다(하나만 바뀌는 실수를 막는다) |
| R3 | 발행 시각 | 임시저장 글을 만들 때 `published_at`을 채우지 않는다. "쓴 시각"(`created_at`)과 "공개된 시각"(`published_at`)이 왜 다른 컬럼인지 말할 수 있다 |
| R5 | 검증 위치 | `status` 값 검사를 요청 DTO(`@Pattern`)에서 한다. 서비스에서 `Enum.valueOf`로 바꾸다 실패하면 `IllegalArgumentException` → 500이 된다는 것을 안다 |
| R4 | 임시저장 목록 | `GET /api/me/drafts`가 글마다 게시판을 따로 읽지 않는다(`JOIN FETCH` 또는 DTO 조회 — 2-4) |

## 필요한 지식

- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 2-3의 "볼 수 있나" 규칙을 발행에서도 그대로 쓴다
- [A5 REST API 설계와 명세서 읽기](../../lessons/A5-rest-api-design.md) — 상태를 바꾸는 동작을 `POST /{id}/publish`로 둘지, `PATCH`로 `status`를 고칠지
- [D03 REST API 개발 과정](../../docs/knowledge/D03-rest-api-dev-process.md)
- [P20 JPA 엔티티 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — 변경 감지로 UPDATE가 나가는 원리

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디를 고치나</summary>

1. `PostCreateRequest`에 `status`를 더하고 `@Pattern(regexp = "DRAFT|PUBLISHED")`로 검사한다. 생략(`null`)은 `@Pattern`이 통과시킨다.
2. `Post` 생성자가 지금은 무조건 `publishedAt = now`다. `status`가 `PUBLISHED`일 때만 채운다.
3. `Post`에 `publish(LocalDateTime now)`를 만들어 `status`·`publishedAt`·`updatedAt`을 함께 바꾼다.
4. 작성 응답·상세 응답 DTO에 `status`, `publishedAt`을 더한다. 상세 DTO를 만드는 곳이 두 군데(조회 서비스·수정 컨트롤러)인지 확인한다.
</details>

<details>
<summary>힌트 2 — 발행 서비스</summary>

3-1의 `patch()`와 모양이 같다. `findById` → `accessPolicy.canView(...)`가 거짓이면 404 → 작성자가 아니면 403 → `"DRAFT"`가 아니면 409용 예외 → `post.publish(LocalDateTime.now())`.

409용 예외를 새로 만들고 `ApiExceptionHandler`에 `HttpStatus.CONFLICT`로 등록한다. `@Transactional` 안이라 `save()`를 부르지 않아도 커밋 때 UPDATE가 나간다. </details>

<details>
<summary>힌트 3 — 내 임시저장 글 쿼리</summary>

```java
@Query("""
        SELECT p FROM Post p JOIN FETCH p.board
         WHERE p.author.id = :authorId AND p.status = 'DRAFT' AND p.deletedAt IS NULL
         ORDER BY p.updatedAt DESC, p.id DESC
        """)
List<Post> findMyDrafts(@Param("authorId") Long authorId);
```

컨트롤러는 4-3의 `/api/me/likes`처럼 `@LoginMember`가 `null`이면 401 예외를 던진다(GET은 토큰 없이도 인터셉터를 지나기 때문).
</details>

<details>
<summary>힌트 4 — 형식 오류에서 필드 이름 꺼내기</summary>

```java
@ExceptionHandler(HttpMessageNotReadableException.class)
public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다.");
    problem.setInstance(URI.create(request.getRequestURI()));
    // Boot 4는 Jackson 3 — 패키지가 tools.jackson.core. 경로가 비어 있으면(JSON 문법 오류) errors 없이 둔다
    if (ex.getCause() instanceof JacksonException jackson && !jackson.getPath().isEmpty()) {
        problem.setProperty("errors", List.of(Map.of("field", fieldPath(jackson), "message", "형식이 올바르지 않습니다.")));
    }
    return problem;
}

@ExceptionHandler(MethodArgumentTypeMismatchException.class)
public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("errors", List.of(Map.of("field", ex.getName(), "message", "형식이 올바르지 않습니다: " + ex.getValue())));
    return problem;
}
```

`fieldPath`는 `getPath()`의 각 `Reference`에서 `getPropertyName()`이 있으면 `.`으로 잇고, 없으면(목록 칸) `[getIndex()]`를 붙인다 — `imageIds[0]`.
</details>

## 다음 단계

[11-2. 글에 이미지 첨부](11-2-image-upload.md)
