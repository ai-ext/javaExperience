# 10-8. 수정(PUT 전체 교체)과 삭제(soft) — 작성자 검증 403

## 상황

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `PUT /api/v1/posts/{postId}` | 작성자만. 전체 교체(title·content·tags·visibility) — 빠진 필드는 기본값 | 200 | 400, 401, 403, 404 |
| `DELETE /api/v1/posts/{postId}` | 작성자만. soft delete(`deleted_at`) | 200 `data: null` | 401, 403, 404 |

두 가지가 새로 나온다.

- **PUT은 "전체 교체"다.** 보낸 것이 글의 새 모습 전부다. `{"title": "새 제목"}`만 보내면 본문은 `null`, 태그는 없음, 공개 범위는 `PUBLIC`이 된다. 일부만 바꾸는 것은 `PATCH`의 몫이다(이 명세서에는 없다). 화면은 수정 폼의 모든 칸을 다시 보낸다.
- **403이 처음 나온다.** 로그인은 했지만(401 아님) 남의 글이다. 단, **남의 비공개 글**은 10-6처럼 404다. 403을 주면 "그런 글이 있다"가 샌다.

실패를 판단하는 순서는 다음과 같다. 토큰이 없으면 401(인터셉터). 본문 규칙 위반이면 400(`@Valid`). 글이 없거나, 삭제됐거나, 남의 비공개면 404. 남의 글이면 403. 모두 통과하면 200이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 수정 화면",
  "summary": "수정 폼은 모든 칸을 다시 보낸다(PUT = 전체 교체). 비운 칸은 비운 대로 저장된다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글 수정", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "[채점] 10-8 수정 후" },
    { "type": "field", "id": "content", "label": "본문", "value": "", "multiline": true },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["After", "after2"] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "save", "label": "저장", "variant": "primary" }, { "id": "delete", "label": "삭제", "variant": "danger" }] },
    { "type": "toast", "id": "toast", "value": "작성자만 수정할 수 있습니다.", "tone": "error" }
  ],
  "flows": [
    {
      "name": "수정 저장",
      "steps": [
        { "kind": "user", "text": "본문을 비우고 태그를 바꿔 [저장]", "focus": ["title", "content", "tags", "save"] },
        { "kind": "request", "method": "PUT", "path": "/api/v1/posts/27", "headers": ["Authorization: Bearer (김자바)", "Content-Type: application/json"], "body": "{\n  \"title\": \"[채점] 10-8 수정 후\",\n  \"tags\": [\"After\", \"after2\"]\n}" },
        { "kind": "server", "text": "글 찾기 → 작성자 확인 → post.replace(...) — 엔티티 값만 바꾸면 커밋 때 JPA가 UPDATE를 만든다(변경 감지)" },
        { "kind": "db", "sql": "UPDATE posts SET content = NULL, title = '[채점] 10-8 수정 후' WHERE id = 27;\nDELETE FROM post_tags WHERE post_id = 27 AND tag_id = 9;\nINSERT INTO post_tags (post_id, tag_id) VALUES (27, 10), (27, 11);", "note": "@DynamicUpdate라 바뀐 컬럼만 SET에 들어간다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"data\": { \"id\": 27, \"title\": \"[채점] 10-8 수정 후\", \"content\": null, \"tags\": [\"after\", \"after2\"], \"visibility\": \"PUBLIC\", ... }\n}" },
        { "kind": "screen", "text": "상세 화면으로 돌아간다", "focus": ["bar"] }
      ]
    },
    {
      "name": "남의 글을 수정",
      "steps": [
        { "kind": "user", "text": "이스프링이 김자바 글의 수정 주소로 요청을 보낸다", "focus": ["save"] },
        { "kind": "request", "method": "PUT", "path": "/api/v1/posts/27", "headers": ["Authorization: Bearer (이스프링)"], "body": "{\"title\": \"[채점] 남이 수정\"}" },
        { "kind": "server", "text": "글은 있고 공개 글이지만 작성자가 아니다 → 403" },
        { "kind": "response", "status": 403, "body": "{ \"status\": 403, \"code\": \"FORBIDDEN\", \"message\": \"작성자만 수정할 수 있습니다.\", ... }" },
        { "kind": "screen", "text": "화면에서 버튼을 숨겼더라도 서버가 다시 막는다", "focus": ["toast"] }
      ]
    },
    {
      "name": "삭제",
      "steps": [
        { "kind": "user", "text": "김자바가 [삭제]", "focus": ["delete"] },
        { "kind": "request", "method": "DELETE", "path": "/api/v1/posts/27", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "db", "sql": "UPDATE posts SET deleted_at = NOW() WHERE id = 27;", "note": "행은 남는다 — 댓글·좋아요도 그대로" },
        { "kind": "response", "status": 200, "body": "{ \"status\": 200, \"message\": \"OK\", \"data\": null }" },
        { "kind": "screen", "text": "목록으로 이동 — 이 글은 이제 상세·목록 어디에도 없다(404)", "focus": ["bar"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| `PUT /api/v1/posts/{postId}` | 로그인 필수. 본문 규칙은 작성(10-5)과 같다 — 요청 record를 함께 쓴다(`PostRequest`). 빠진 필드는 기본값(본문 `null`, 태그 없음, `PUBLIC`) |
| 성공(PUT) | `200`, `data` = 상세 모양(10-6과 같음, 조회수는 올리지 않는다), `updatedAt` 갱신 |
| `DELETE /api/v1/posts/{postId}` | 로그인 필수. `deleted_at`에 지금 시각. 행·태그·댓글은 지우지 않는다 |
| 성공(DELETE) | `200`, `data` = `null` |
| 실패 | 토큰 없음 401 · 규칙 위반 400 · 없음·이미 삭제·**남의 비공개** 404 · 남의 글 403 `FORBIDDEN` |

**필드 규칙** — 작성(10-5)과 같은 `PostRequest`다. 전체 교체라 빠진 필드는 기본값이 된다. 잘못된 입력은 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 필수 | 안 됨 — 없음·`null`·공백만 거절 | 다듬은 뒤 5~100자 | 문자열 | 없음 | `400 VALIDATION_FAILED`, `errors`에 `title` |
| `content` | 선택 | 생략·`null`이면 `null`로 바뀐다 | 10000자 이하 | 문자열 | `null` | `400`, `errors`에 `content` |
| `tags` | 선택 | 생략·`null`이면 모두 뗀다 | 0~5개, 각 1~20자 | 문자열 배열 | `[]` | `400`, `errors`에 `tags`·`tags[0]` |
| `visibility` | 선택 | 생략·`null`이면 `PUBLIC` | `PUBLIC`·`PRIVATE` | 정해진 값 | `PUBLIC` | `400`, `errors`에 `visibility` |
| `{postId}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`(`errors`에 `postId`), 없는 글 `404` |
| 본문 전체 | 필수 | — | — | JSON | — | `400 BAD_JSON` |

## 설계 포인트

- **변경 감지.** 트랜잭션 안에서 읽은 엔티티의 값을 바꾸면 `save`를 부르지 않아도 커밋 때 UPDATE가 나간다. 그래서 엔티티에 "값을 바꾸는 메서드"(`replace(...)`, `delete()`)를 두고 서비스는 그것만 부른다. setter를 열어 두지 않는다.
- **덮어쓰기 주의 — `@DynamicUpdate`.** Hibernate는 기본으로 UPDATE에 **모든 컬럼**을 넣는다. 수정 요청이 글을 읽은 뒤 커밋하기 전에, 다른 요청이 `view_count`를 올렸다(10-6). 그러면 수정의 UPDATE가 읽었던 옛 조회수로 덮어쓴다. 엔티티에 `@DynamicUpdate`를 붙이면 바뀐 컬럼만 SET에 들어간다.
- **태그 교체.** 엔티티의 태그 `Set`을 `clear()` 후 `addAll(...)` 하면 JPA가 `post_tags`의 지울 행·넣을 행을 계산해 DELETE·INSERT한다. `post_tags`를 직접 SQL로 다루지 않는다.
- **동시 수정·삭제.** 쓰기 트랜잭션은 `posts` 한 행을 `SELECT ... FOR UPDATE`로 먼저 잠근다. 앞선 삭제가 커밋됐다면 행이 없어 404다. MyBatis 경로는 `deleted_at IS NULL` 조건부 UPDATE의 영향 행 수가 0이면 404로 끝낸다.
- **찾기 + 권한을 한 메서드로.** 수정·삭제가 "없으면 404, 남의 비공개면 404, 남의 글이면 403"을 똑같이 쓴다. `findWritable(userId, postId)` 같은 메서드 하나로 모은다(10-9의 댓글 삭제도 같은 모양이다).
- **soft delete 뒤의 조회.** 10-6의 상세·10-7의 목록이 이미 `deleted_at IS NULL`만 보므로, 삭제된 글은 자동으로 404·목록 제외가 된다. 그래서 조건을 한 곳에 두는 것이 중요하다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 글 찾기 → 작성자 확인 → post.replace(...) — 엔티티 값만 바꾸면 커밋 때 JPA가 UPDATE를 만든다(변경 감지)
- @DynamicUpdate라 바뀐 컬럼만 SET에 들어간다
- 글은 있고 공개 글이지만 작성자가 아니다 → 403
- 행은 남는다 — 댓글·좋아요도 그대로

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PutMapping("/api/v1/posts/{postId}")`, `@DeleteMapping("/api/v1/posts/{postId}")`. 변경된 메서드: `update`, `delete`.

```java
@PutMapping("/api/v1/posts/{postId}")
public ApiResponse<PostDetailResponse> update(@LoginUser Long userId, @PathVariable Long postId,
                                              @Valid @RequestBody PostRequest request) {
    return ApiResponse.ok(postService.update(userId, postId, request));
}

@DeleteMapping("/api/v1/posts/{postId}")
public ApiResponse<Void> delete(@LoginUser Long userId, @PathVariable Long postId) {
    postService.delete(userId, postId);
    return ApiResponse.ok(null);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record PostRequest(
        @NotNull @Size(min = 5, max = 100) String title,
        @Size(max = 10000) String content,
        @Size(max = 5) List<@Size(min = 1, max = 20) String> tags,
        @Pattern(regexp = "PUBLIC|PRIVATE") String visibility) {
    public PostRequest {
        title = title == null ? null : title.strip();
        tags = tags == null ? List.of() : tags.stream()
                .map(t -> Objects.requireNonNullElse(t, "").strip().toLowerCase(Locale.ROOT))
                .distinct().toList();
        visibility = visibility == null ? "PUBLIC" : visibility;
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`, `update`, `delete`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public PostDetailResponse update(Long userId, Long postId, PostRequest request) {
    Post post = findWritable(userId, postId, "작성자만 수정할 수 있습니다.");
    post.replace(request.title(), request.content(), Visibility.valueOf(request.visibility()),
            findOrCreateTags(request.tags()));
    boolean liked = postRepository.countLike(postId, userId) > 0;
    return PostDetailResponse.of(post, post.getViewCount(), liked,
            CommentTree.build(commentRepository.findAllWithAuthorByPostId(postId)));
}

@Transactional
public void delete(Long userId, Long postId) {
    findWritable(userId, postId, "작성자만 삭제할 수 있습니다.").delete();
}

private Post findWritable(Long userId, Long postId, String forbiddenMessage) {
    if (entityManager.createNativeQuery("select id from posts where id = :id and deleted_at is null for update")
            .setParameter("id", postId).getResultList().isEmpty())
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
    Post post = postRepository.findDetailById(postId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
    boolean isAuthor = post.getAuthor().getId().equals(userId);
    if (post.getVisibility() == Visibility.PRIVATE && !isAuthor)
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
    if (!isAuthor) throw new ApiException(ErrorCode.FORBIDDEN, forbiddenMessage);
    return post;
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `replace`, `delete`.

```java
@Entity
@Table(name = "posts")
@DynamicUpdate // 바뀐 컬럼만 UPDATE해 조회수·좋아요 수를 옛 값으로 덮지 않는다.
public class Post {
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void replace(String title, String content, Visibility visibility, Set<Tag> tags) {
        this.title = title;
        this.content = content;
        this.visibility = visibility;
        this.tags.clear();
        this.tags.addAll(tags);
        this.updatedAt = now();
    }

    public void delete() { this.deletedAt = now(); }
}
```

</details>

<details>
<summary>MyBatis Mapper — 같은 계약의 SQL 대체 구현</summary>

JPA의 변경 감지 대신 `PostService`가 권한을 검사하고 Mapper의 SQL을 순서대로 호출한다. `UPDATE`는 `view_count`·`like_count`를 SET에 포함하지 않는다. 수정·삭제 SQL의 영향 행 수가 0이면 그사이 삭제된 글로 보고 404를 반환한다. 태그 교체는 성공한 수정 다음에만 진행한다. 전체 구현은 **MyBatis 대체 코드** 토글에서 확인한다.

```java
int updatePost(@Param("postId") Long postId, @Param("title") String title,
               @Param("content") String content, @Param("visibility") String visibility,
               @Param("updatedAt") LocalDateTime updatedAt);
int softDelete(@Param("postId") Long postId, @Param("deletedAt") LocalDateTime deletedAt);
void unlinkTags(Long postId);
void linkTag(@Param("postId") Long postId, @Param("tagId") Long tagId);
```

```xml
<update id="updatePost">
  UPDATE posts SET title = #{title}, content = #{content},
      visibility = #{visibility}, updated_at = #{updatedAt}
  WHERE id = #{postId} AND deleted_at IS NULL
</update>
<update id="softDelete">
  UPDATE posts SET deleted_at = #{deletedAt}
  WHERE id = #{postId} AND deleted_at IS NULL
</update>
<delete id="unlinkTags">
  DELETE FROM post_tags WHERE post_id = #{postId}
</delete>
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
tok() { curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1@example.com\",\"password\":\"password1234\"}" | sed -E 's/.*"accessToken":"([^"]+)".*/\1/'; }
KIM=$(tok kim); LEE=$(tok lee)
ID=$(curl -s -X POST "$BASE/api/v1/posts" -H "Authorization: Bearer $KIM" -H 'Content-Type: application/json' \
  -d '{"title":"[채점] 10-8 수정 전","content":"원래 본문","tags":["before"]}' | sed -E 's/.*"data":\{"id":([0-9]+).*/\1/')
put() { curl -s -i -X PUT "$BASE/api/v1/posts/$1" -H 'Content-Type: application/json' "${@:2}"; echo; echo ----; }

put $ID -H "Authorization: Bearer $KIM" -d '{"title":"[채점] 10-8 수정 후","tags":["After","after2"]}'   # U 전체 교체
put $ID -H "Authorization: Bearer $LEE" -d '{"title":"[채점] 남이 수정"}'                                # F 남의 글
put $ID -d '{"title":"[채점] 토큰 없음"}'                                                               # N 토큰 없음
put $ID -H "Authorization: Bearer $KIM" -d '{"title":"abc"}'                                           # V 규칙 위반
put 24 -H "Authorization: Bearer $LEE" -d '{"title":"[채점] 남의 비공개"}'                               # PV 남의 비공개
curl -s -i -X DELETE "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $LEE"; echo                   # D1 남이 삭제
curl -s -i -X DELETE "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $KIM"; echo                   # D 삭제
curl -s -i "$BASE/api/v1/posts/$ID"; echo                                                             # D2 삭제 뒤 상세
curl -s -i -X DELETE "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $KIM"; echo                   # D3 다시 삭제

# 잘못된 입력 — 500이 아니다(삭제 D 전에 보낸다)
put $ID -H "Authorization: Bearer $KIM" -d '{}'                                         # V1 400 title
put $ID -H "Authorization: Bearer $KIM" -d '{"title":"[채점] 10-8 공개 범위","visibility":"SECRET"}'   # V3 400 visibility
put abc -H "Authorization: Bearer $KIM" -d '{"title":"[채점] 10-8 숫자 아님"}'           # V6 400 postId
put $ID -H "Authorization: Bearer $KIM" -d '{"title":"  다섯글자다  "}'                  # B1 200
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 그 글로만 확인한다(그 글은 마지막에 삭제된다).

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "M", "title": "로그인(이스프링)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "lee@example.com", "password": "password1234" } },
    { "id": "P", "title": "확인용 글 만들기", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-8 수정 전", "content": "원래 본문", "tags": ["before"], "visibility": "PUBLIC" } },
    { "id": "U", "title": "전체 교체", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-8 수정 후", "tags": ["After", "after2"] } },
    { "id": "G", "title": "수정 뒤 상세", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}" },
    { "id": "F", "title": "남의 글 수정", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "title": "[채점] 남이 수정" } },
    { "id": "N", "title": "토큰 없음", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "body": { "title": "[채점] 토큰 없음" } },
    { "id": "V", "title": "규칙 위반", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "abc" } },
    {"id": "V1", "title": "빈 객체(제목 없음)", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {}},
    {"id": "V2", "title": "태그 6개", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-8 태그 초과", "tags": ["a", "b", "c", "d", "e", "f"]}},
    {"id": "V3", "title": "없는 공개 범위", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-8 공개 범위", "visibility": "SECRET"}},
    {"id": "V4", "title": "본문 10001자", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-8 본문 초과", "content": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"}},
    {"id": "V5", "title": "깨진 JSON", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}", "Content-Type": "application/json"}, "body": "{\"title\":"},
    {"id": "V6", "title": "경로 id가 숫자가 아님", "method": "PUT", "path": "/api/v1/posts/abc", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-8 숫자 아님"}},
    {"id": "B1", "title": "경계 안쪽 — 제목 다듬어 5자", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "  다섯글자다  "}},
    {"id": "B2", "title": "경계 안쪽 — 제목 100자", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    { "id": "X", "title": "없는 글", "method": "PUT", "path": "/api/v1/posts/999999", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 없는 글" } },
    { "id": "PV", "title": "남의 비공개 글(24)", "method": "PUT", "path": "/api/v1/posts/24", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" }, "body": { "title": "[채점] 남의 비공개" } },
    { "id": "D1", "title": "남이 삭제", "method": "DELETE", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    { "id": "DN", "title": "토큰 없이 삭제", "method": "DELETE", "path": "/api/v1/posts/{{P.body.data.id}}" },
    { "id": "D", "title": "삭제", "method": "DELETE", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "D2", "title": "삭제 뒤 상세", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}" },
    { "id": "D3", "title": "다시 삭제", "method": "DELETE", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "D4", "title": "삭제된 글 수정", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 삭제된 글 수정" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "U",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.id", "equals": "{{P.body.data.id}}" },
          { "path": "$.data.title", "equals": "[채점] 10-8 수정 후" },
          { "path": "$.data.content", "type": "null" },
          { "path": "$.data.tags", "equals": ["after", "after2"] },
          { "path": "$.data.visibility", "equals": "PUBLIC" },
          { "path": "$.data.author.id", "equals": 1 }
        ]
      },
      "note": "보내지 않은 content는 null이 된다(전체 교체)"
    },
    { "id": "C2", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.data.title", "equals": "[채점] 10-8 수정 후" }, { "path": "$.data.content", "type": "null" }, { "path": "$.data.tags", "equals": ["after", "after2"] }] } },
    { "id": "C3", "request": "F", "expect": { "status": 403, "json": [{ "path": "$.status", "equals": 403 }, { "path": "$.code", "equals": "FORBIDDEN" }, { "path": "$.errors", "equals": [] }, { "path": "$.data", "type": "null" }] } },
    {
      "id": "C4",
      "all": [
        { "request": "N", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "V", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "VALIDATION_FAILED" }, { "path": "$.errors[*].field", "contains": "title" }] } }
      ]
    },
    {
      "id": "C5",
      "all": [
        { "request": "X", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "PV", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ],
      "note": "남의 비공개 글은 403이 아니라 404"
    },
    {
      "id": "C6",
      "all": [
        { "request": "D1", "expect": { "status": 403, "json": [{ "path": "$.code", "equals": "FORBIDDEN" }] } },
        { "request": "DN", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } }
      ]
    },
    { "id": "C7", "request": "D", "expect": { "status": 200, "json": [{ "path": "$.status", "equals": 200 }, { "path": "$.data", "type": "null" }, { "path": "$.code", "exists": false }] } },
    {
      "id": "C8",
      "all": [
        { "request": "D2", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "D3", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "D4", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
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
                "contains": "title"
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
                "contains": "tags"
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
                "contains": "visibility"
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
          "request": "V5",
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
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.data.title",
                "equals": "다섯글자다"
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.data.title",
                "equals": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
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

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 U | `200`, 같은 id, `title` 바뀜, `content`=`null`(보내지 않음 → 기본값), `tags`=`["after","after2"]`, `visibility`=`PUBLIC`, 작성자 그대로 |
| C2 | 요청 G | 상세도 바뀐 값 |
| C3 | 요청 F | `403 FORBIDDEN`, `errors`=`[]`, `data`=`null` |
| C4 | 요청 N·V | 토큰 없음 `401`, 규칙 위반 `400`(`field`에 `title`) |
| C5 | 요청 X·PV | 없는 글·남의 비공개 글 모두 `404` |
| C6 | 요청 D1·DN | 남이 삭제 `403`, 토큰 없이 삭제 `401` |
| C7 | 요청 D | `200`, `data`=`null` |
| C8 | 요청 D2·D3·D4 | 삭제된 글은 상세·다시 삭제·수정 모두 `404` |
| C9 | V1~V6 | 제목 없음 `title` / 태그 6개 `tags` / `SECRET` `visibility` / 본문 10001자 `content` / 경로 `abc` `postId` — 모두 `400 VALIDATION_FAILED` / 깨진 JSON `400 BAD_JSON` — `500`이 아니다 |
| C10 | B1 / B2 | 경계 바로 안쪽은 통과한다 — 제목 다듬어 정확히 5자 `200`, 제목 100자 `200` |
| D1 | 요청 D 뒤 `SELECT deleted_at IS NOT NULL FROM posts WHERE id = <P의 id>` | `1` — 행은 남아 있고 지운 시각만 있다 |
| R1 | 변경 | 엔티티에 의미 있는 이름의 변경 메서드(`replace`, `delete`)가 있고 setter를 열지 않았다 |
| R2 | 권한 | 수정·삭제가 같은 "찾기 + 작성자 확인" 메서드를 쓴다. 403과 404를 고르는 기준이 한곳에 있다 |
| R3 | UPDATE | `@DynamicUpdate`(또는 같은 효과)로 수정이 `view_count`·`like_count`를 옛 값으로 덮지 않는다 — SQL 로그의 `update posts set ...`에 바꾼 컬럼만 있다 |

## 필요한 지식

- [G2 권한 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md)
- [G3 트랜잭션 첫 만남](../../lessons/G3-first-transaction.md) — 변경 감지는 커밋 때 UPDATE
- [A2 HTTP 해부](../../lessons/A2-http-anatomy.md) — PUT과 PATCH, 401과 403
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — 영속성 컨텍스트와 변경 감지
- [W11 트랜잭션은 왜 서비스에](../../docs/knowledge/W11-why-tx-in-service.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 요청 record를 같이 쓴다</summary>

10-5의 요청 record(`PostRequest`)를 그대로 받는다. 압축 생성자가 `visibility`가 없으면 `PUBLIC`, `tags`가 없으면 빈 목록으로 채우므로 "빠진 필드는 기본값"이 저절로 된다. `content`는 없으면 `null`이다.
</details>

<details>
<summary>힌트 2 — 엔티티 메서드</summary>

```java
public void replace(String title, String content, Visibility visibility, Set<Tag> tags) {
    this.title = title;
    this.content = content;
    this.visibility = visibility;
    this.tags.clear();
    this.tags.addAll(tags);
    this.updatedAt = now();
}

public void delete() {
    this.deletedAt = now();
}
```

클래스 위에 `@DynamicUpdate`(`org.hibernate.annotations`)를 붙인다.
</details>

<details>
<summary>힌트 3 — 404와 403을 고르는 메서드</summary>

```java
private Post findWritable(Long userId, Long postId, String forbiddenMessage) {
    if (entityManager.createNativeQuery("select id from posts where id = :id and deleted_at is null for update")
            .setParameter("id", postId).getResultList().isEmpty())
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
    Post post = postRepository.findDetailById(postId)          // 삭제된 글은 여기서 빈 값
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
    boolean isAuthor = post.getAuthor().getId().equals(userId);
    if (post.getVisibility() == Visibility.PRIVATE && !isAuthor) {
        throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
    }
    if (!isAuthor) {
        throw new ApiException(ErrorCode.FORBIDDEN, forbiddenMessage);
    }
    return post;
}
```

`Long`끼리는 `==`가 아니라 `equals`로 비교한다(`==`는 같은 객체인지를 본다 — 127 넘는 id에서 틀린다).
</details>

## 다음 단계

[10-9. 댓글](10-9-comments.md) — 댓글 쓰기·목록·삭제. 답글은 한 단계까지만.
