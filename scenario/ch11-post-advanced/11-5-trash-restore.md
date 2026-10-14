# 11-5. 휴지통 — 지운 글 모아 보기와 복구

> 시나리오 DB(`community`). 이번 단계 마이그레이션은 `V22`다.

## 상황

> "실수로 글을 지웠다는 문의가 매주 와요. 3-2에서 지운 글도 DB에 남겨 뒀잖아요? 휴지통에서 30일 안에는 직접 되살리게 해 주세요. 단, 신고 때문에 운영자가 지운 글은 작성자가 되살리면 안 돼요."

3-2의 soft delete로 지운 글은 행이 남아 있다(`deleted_at`). 이제 그 행을 **작성자에게 다시 보여 주고 되살리는** 기능을 만든다.

문제는 "누가 지웠나"를 모른다는 것이다. 3-2는 작성자와 운영자 둘 다 지울 수 있게 했는데, 지금 `post`에는 지운 시각만 있다. 그래서 **지운 회원(`deleted_by`) 컬럼**을 더하고, 휴지통에는 "내가 쓰고 **내가** 지운 글"만 보여 준다.

복구는 2-3 규칙과 부딪친다. 2-3 규칙 1번은 "삭제된 글은 작성자도 못 본다"이다. 그래서 복구는 "볼 수 있나"(`canView`)를 쓰지 않고 **작성자인지 직접** 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "휴지통",
  "summary": "내가 지운 내 글을 30일 동안 모아 두고, [복구]로 되살린다. 운영자가 지운 글은 여기 없다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "휴지통", "right": "김자바" },
    {
      "type": "list",
      "id": "trash",
      "label": "지운 글 — 30일 뒤 복구 불가",
      "items": [{ "id": "trash-61", "title": "[채점] 휴지통", "meta": "자유 · 10월 10일 지움 · 11월 9일까지 복구 가능" }]
    },
    { "type": "actions", "id": "trash-actions", "items": [{ "id": "restore", "label": "복구", "variant": "primary" }] },
    { "type": "toast", "id": "restored", "value": "글을 되살렸어요", "tone": "success" },
    { "type": "toast", "id": "forbidden", "value": "운영자가 삭제한 글은 되살릴 수 없어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "휴지통 열기",
      "steps": [
        { "kind": "user", "text": "[내 정보] → [휴지통]" },
        { "kind": "request", "method": "GET", "path": "/api/me/trash", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "db", "sql": "SELECT p.*, b.slug FROM post p JOIN board b ON b.id = p.board_id\nWHERE p.author_id = 2 AND p.deleted_by = 2\n  AND p.deleted_at >= NOW() - INTERVAL 30 DAY\nORDER BY p.deleted_at DESC, p.id DESC" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 61, \"boardSlug\": \"free\", \"title\": \"[채점] 휴지통\", \"deletedAt\": \"2026-10-10T15:19:59\", \"restoreUntil\": \"2026-11-09T15:19:59\"}]}" },
        { "kind": "screen", "text": "지운 글과 복구 기한", "focus": ["trash"] }
      ]
    },
    {
      "name": "복구",
      "steps": [
        { "kind": "user", "text": "[복구]를 누른다", "focus": ["restore"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/61/restore", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "내 글인가(아니면 404) → 지운 글인가(아니면 409) → 내가 지웠나(아니면 403) → 30일 안인가(지났으면 410)" },
        { "kind": "db", "sql": "UPDATE post SET deleted_at = NULL, deleted_by = NULL WHERE id = 61", "note": "updated_at은 그대로 — 내용을 고친 게 아니다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 61, \"status\": \"PUBLISHED\", ...}" },
        { "kind": "screen", "text": "'글을 되살렸어요' — 원래 자리(발행 시각 그대로)에 다시 보인다", "focus": ["restored"] }
      ]
    },
    {
      "name": "운영자가 지운 글",
      "steps": [
        { "kind": "user", "text": "예전 글 주소로 복구를 시도한다" },
        { "kind": "request", "method": "POST", "path": "/api/posts/62/restore", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "deleted_by = 1(운영자) — 작성자라도 되살릴 수 없다" },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"직접 지운 글만 되살릴 수 있습니다.\"}" },
        { "kind": "screen", "text": "'운영자가 삭제한 글은 되살릴 수 없어요'", "focus": ["forbidden"] }
      ]
    }
  ]
}
```

## 만들 것

**V22** — `db/migration/V22__add_post_deleted_by.sql`

| 변경 | 내용 |
|---|---|
| 컬럼 | `post.deleted_by BIGINT NULL`(FK → `member`) — 지운 회원 |
| 기존 행 | 고치지 않는다. 이 컬럼 전에 지운 글(예: 8번)은 누가 지웠는지 모르므로 `NULL` — 휴지통에 안 나오고 작성자가 되살릴 수 없다 |
| 삭제(3-2) | `DELETE /api/posts/{id}`가 `deleted_at`과 함께 `deleted_by` = 지운 회원(작성자 또는 운영자)을 채운다 |

**휴지통** — `GET /api/me/trash`

| 항목 | 내용 |
|---|---|
| 인증 | 필요 — 토큰이 없으면 `401` |
| 대상 | `author_id` = 나 **그리고** `deleted_by` = 나, 지운 지 30일 안 |
| 정렬 | `deleted_at` 최신 → `id` 큰 순 |
| 응답 | `200` `{ "items": [ { "id", "boardSlug", "title", "deletedAt", "restoreUntil" } ] }` — `restoreUntil` = `deletedAt` + 30일 |

**복구** — `POST /api/posts/{id}/restore`

요청 값 규칙 — 본문은 없다. 어떤 값에도 `500`이 나오면 안 된다.

| 값 | 필수 | 형식 | 틀렸을 때 |
|---|---|---|---|
| 경로 `{id}` | 예 | 양의 정수 | 숫자가 아니면 `400`, 없는 글이면 `404` |
| 토큰 | 예 | `Bearer` | `401` |

아래 순서대로 확인한다.

| 순서 | 상황 | 결과 |
|---|---|---|
| 1 | 없는 글, 또는 **내 글이 아님**(지웠든 아니든) | `404` — 남의 지운 글이 있다는 것도 숨긴다 |
| 2 | 내 글인데 지운 글이 아님 | `409` |
| 3 | 내 글인데 **다른 사람(운영자)이 지움**, 또는 누가 지웠는지 모름(`deleted_by` NULL) | `403` |
| 4 | 지운 지 30일이 지남 | `410 Gone` |
| — | 그 밖(내가 지운 내 글, 30일 안) | `200`, 상세 모양(2-1·11-1). `deleted_at`·`deleted_by`를 비운다. `updated_at`·`published_at`은 그대로 |

되살린 글은 상세·목록·검색에 원래대로(같은 `published_at` 자리에) 다시 나온다. 좋아요·댓글·태그·이미지는 지울 때 건드리지 않았으므로 그대로 붙어 있다(3-2 R4).

## 구현 가이드

3-2의 일반 조회는 `deleted_at IS NULL`인 글만 다룬다. 휴지통은 **그 반대 행**을 읽어야 하므로 조회 목적을 분리한다. 운영자 숨김(`status = 'HIDDEN'`)은 삭제 시각과 관계없는 별도 상태다.

<details>
<summary>Controller / DTO — 휴지통 목록과 복구 응답</summary>

`MyPostController.java`와 `PostController.java`의 변경 부분이다. 토큰 없는 휴지통 요청은 직접 `401`로 막고, 복구 응답은 기존 상세 DTO를 재사용한다.

```java
@GetMapping("/api/me/trash")
public MyTrashResponse myTrash(@LoginMember AuthenticatedMember loginMember) {
    if (loginMember == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return postService.myTrash(loginMember);
}

@PostMapping("/{id}/restore") // PostController의 /api/posts 아래
public PostDetailResponse restore(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
    if (id <= 0) throw new InvalidPostFieldException("id", "id는 양의 정수여야 합니다.");
    return toDetailResponse(postService.restore(id, loginMember));
}

public record MyTrashItemResponse(Long id, String boardSlug, String title,
                                  LocalDateTime deletedAt, LocalDateTime restoreUntil) {}
public record MyTrashResponse(List<MyTrashItemResponse> items) {}
```

`restoreUntil`은 `deletedAt.plusDays(RESTORE_DAYS)`로 만든다. 삭제 기록이나 `deletedBy`는 일반 상세 DTO에 넣지 않는다.

</details>

<details>
<summary>Service — 삭제된 행을 잠그고 순서대로 검사</summary>

`PostService.restore`의 판정 순서다. 글 행을 먼저 잠가 삭제와 복구, 중복 복구가 겹쳐도 최신 상태를 기준으로 한 번씩 처리한다.

```java
@Transactional
public Post restore(Long id, AuthenticatedMember loginMember) {
    Post post = postRepository.findByIdForUpdate(id)
            .orElseThrow(PostNotFoundException::new);
    if (!post.getAuthor().getId().equals(loginMember.id())) throw new PostNotFoundException();
    if (post.getDeletedAt() == null) throw new PostNotDeletedException();
    if (!loginMember.id().equals(post.getDeletedBy())) throw new PostRestoreForbiddenException();
    if (post.getDeletedAt().plusDays(RESTORE_DAYS).isBefore(LocalDateTime.now(clock)))
        throw new PostRestoreExpiredException();
    post.restore(); // deletedAt·deletedBy만 null, publishedAt·updatedAt 유지
    // 응답에 필요한 지연 로딩 연관은 트랜잭션 안에서 읽는다.
    return post;
}
```

`postAccessPolicy.canView()`는 삭제된 글을 누구에게나 거절하므로 복구에 쓰지 않는다. 작성자와 삭제자를 각각 확인하며, 휴지통 목록과 복구가 같은 `Clock`·30일 기준을 쓴다.

</details>

<details>
<summary>JPA / Repository — 살아 있는 글과 삭제된 글의 조회 경로</summary>

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Post p WHERE p.id = :id")
Optional<Post> findByIdForUpdate(Long id);

@Query("""
    SELECT p FROM Post p JOIN FETCH p.board
    WHERE p.author.id = :memberId AND p.deletedBy = :memberId
      AND p.deletedAt IS NOT NULL AND p.deletedAt >= :since
    ORDER BY p.deletedAt DESC, p.id DESC
    """)
List<Post> findMyTrash(Long memberId, LocalDateTime since);
```

휴지통과 복구는 삭제된 행을 읽어야 한다. 일반 상세는 `PostAccessPolicy`에서 삭제된 글을 숨긴다. 전역 `deleted_at IS NULL` 필터를 엔티티에 붙이면 휴지통·복구 조회에서도 행이 사라질 수 있다.

</details>

<details>
<summary>MyBatis Mapper — 휴지통 조회·삭제·복구의 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글에서 `MyTrashMapper.java`·XML·`MyTrashRow.java`·`PostService.java` 전문을 볼 수 있다. 목록은 필요한 열만 `post`와 `board`에서 읽고, 삭제자는 로그인 회원 id를 `#{deletedBy}`로 바인딩한다.

```xml
<select id="findMyTrash" resultMap="trashRow">
    SELECT p.id, b.slug AS board_slug, p.title, p.deleted_at
    FROM post p JOIN board b ON b.id = p.board_id
    WHERE p.author_id = #{memberId} AND p.deleted_by = #{memberId}
      AND p.deleted_at IS NOT NULL AND p.deleted_at >= #{since}
    ORDER BY p.deleted_at DESC, p.id DESC
</select>
<update id="restore">
    UPDATE post SET deleted_at = NULL, deleted_by = NULL
    WHERE id = #{id} AND deleted_by = #{deletedBy} AND deleted_at = #{deletedAt}
</update>
```

Service의 `findByIdForUpdate`와 권한·만료 검사는 동일하다. Mapper의 삭제·복구 `UPDATE` 이후 JPA 영속성 컨텍스트의 글을 `EntityManager.refresh`로 갱신한다. 같은 트랜잭션의 다음 조회와 복구 상세 응답이 최신 상태를 보게 한다.

</details>

<details>
<summary>DB / SQL — 삭제와 숨김을 따로 검산</summary>

```sql
SELECT id, status, deleted_at, deleted_by
FROM post WHERE id IN (@deleted_id, @hidden_id);

SELECT id FROM post
WHERE author_id = @me AND deleted_by = @me
  AND deleted_at >= NOW() - INTERVAL 30 DAY
ORDER BY deleted_at DESC, id DESC;
```

`@deleted_id`, `@hidden_id`, `@me`는 직접 확인에서 얻은 실제 id를 `SET`으로 지정한다. 숨김만 된 글은 첫 쿼리에 `HIDDEN`이지만 `deleted_at`은 `NULL`이며, 둘째 휴지통에는 나오지 않는다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; A='Authorization: Bearer tok-admin'
mk() { curl -s -X POST "$BASE/api/posts" -H "$K" -H "$J" -d "{\"boardSlug\":\"free\",\"title\":\"$1\",\"content\":\"x\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

T=$(mk '[채점] 휴지통'); echo "T=$T"                                  # R0
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/posts/$T" -H "$K"   # R1 내가 지움 → 204
curl -s "$BASE/api/me/trash" -H "$K"; echo                             # R2
curl -i -X POST "$BASE/api/posts/$T/restore" -H "$L"                   # R3 남이 복구 → 404
curl -s -X POST "$BASE/api/posts/$T/restore" -H "$K"; echo             # R4 복구 → 200
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/$T"           # R5 비로그인 상세 → 200
curl -i -X POST "$BASE/api/posts/$T/restore" -H "$K"                   # R6 또 복구 → 409
Z=$(mk '[채점] 운영자가 지울 글'); echo "Z=$Z"
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/posts/$Z" -H "$A"   # R7 운영자가 지움
curl -i -X POST "$BASE/api/posts/$Z/restore" -H "$K"                   # R8 → 403
curl -i -X POST "$BASE/api/posts/8/restore" -H "$L"                    # R9 V22 전에 지운 글 → 403
curl -i -X POST "$BASE/api/posts/99999999/restore" -H "$K"             # R10 없는 글 → 404
curl -i -X POST "$BASE/api/posts/abc/restore" -H "$K"                  # R11 숫자 아님 → 400
curl -i -X POST "$BASE/api/posts/-1/restore" -H "$K"                   # R11B 음수 → 400(errors.id)
curl -i -X POST "$BASE/api/posts/0/restore" -H "$K"                    # R11C 0 → 400(errors.id)
curl -i "$BASE/api/me/trash"                                           # R12 토큰 없음 → 401

# C9 수동 필수 확인 — 시각을 되돌릴 수 없으니 실습 DB에서 지운 시각을 31일 전으로 바꿔 본다
E=$(mk '[채점] 오래전에 지운 글'); curl -s -o /dev/null -X DELETE "$BASE/api/posts/$E" -H "$K"
docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "UPDATE post SET deleted_at = NOW() - INTERVAL 31 DAY WHERE id = $E" 2>/dev/null
curl -i -X POST "$BASE/api/posts/$E/restore" -H "$K"                   # R13 → 410
curl -s "$BASE/api/me/trash" -H "$K"; echo                             # R14 휴지통에도 없다

# C10 동시 복구: 새 글을 지우고 같은 글의 복구 요청 10개를 동시에 보낸다.
P=$(mk '[채점] 동시 복구'); curl -s -o /dev/null -X DELETE "$BASE/api/posts/$P" -H "$K"
for i in {1..10}; do curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts/$P/restore" -H "$K" & done
wait   # 200 한 번, 409 아홉 번. DB의 deleted_at·deleted_by는 둘 다 NULL
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 지우고 되살리므로 몇 번을 눌러도 같은 결과다(8번 글은 403만 확인하고 바꾸지 않는다).

```check
{
  "requests": [
    { "id": "R0", "title": "R0 김자바의 새 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 휴지통", "content": "x" } },
    { "id": "R1", "title": "R1 김자바가 지움", "method": "DELETE", "path": "/api/posts/{{R0.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R2", "title": "R2 김자바의 휴지통", "method": "GET", "path": "/api/me/trash", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R3", "title": "R3 이스프링이 복구", "method": "POST", "path": "/api/posts/{{R0.body.id}}/restore", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "R4", "title": "R4 김자바가 복구", "method": "POST", "path": "/api/posts/{{R0.body.id}}/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R5", "title": "R5 비로그인 상세", "method": "GET", "path": "/api/posts/{{R0.body.id}}" },
    { "id": "R6", "title": "R6 또 복구", "method": "POST", "path": "/api/posts/{{R0.body.id}}/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R6B", "title": "R6B 복구 뒤 휴지통", "method": "GET", "path": "/api/me/trash", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "Z0", "title": "Z0 김자바의 새 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 운영자가 지울 글", "content": "x" } },
    { "id": "R7", "title": "R7 운영자가 지움", "method": "DELETE", "path": "/api/posts/{{Z0.body.id}}", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "R7B", "title": "R7B 김자바의 휴지통", "method": "GET", "path": "/api/me/trash", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R8", "title": "R8 김자바가 복구", "method": "POST", "path": "/api/posts/{{Z0.body.id}}/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R9", "title": "R9 이스프링이 8번(V22 전에 지운 글) 복구", "method": "POST", "path": "/api/posts/8/restore", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "R10", "title": "R10 없는 글 복구", "method": "POST", "path": "/api/posts/99999999/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R11", "title": "R11 숫자가 아닌 id", "method": "POST", "path": "/api/posts/abc/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R11B", "title": "R11B 음수 id", "method": "POST", "path": "/api/posts/-1/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R11C", "title": "R11C 0 id", "method": "POST", "path": "/api/posts/0/restore", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "R12", "title": "R12 토큰 없이 휴지통", "method": "GET", "path": "/api/me/trash" }
  ],
  "checks": [
    { "id": "C1", "request": "R1", "expect": { "status": 204 } },
    {
      "id": "C2",
      "request": "R2",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].id", "equals": "{{R0.body.id}}" },
          { "path": "$.items[0].boardSlug", "equals": "free" },
          { "path": "$.items[0].deletedAt", "type": "string" },
          { "path": "$.items[0].restoreUntil", "type": "string" }
        ]
      }
    },
    { "id": "C3", "request": "R3", "expect": { "status": 404 } },
    {
      "id": "C4",
      "all": [
        { "request": "R4", "expect": { "status": 200, "json": [{ "path": "$.id", "equals": "{{R0.body.id}}" }, { "path": "$.status", "equals": "PUBLISHED" }] } },
        { "request": "R5", "expect": { "status": 200 } }
      ]
    },
    {
      "id": "C5",
      "all": [
        { "request": "R6", "expect": { "status": 409 } },
        { "request": "R6B", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "notContains": "{{R0.body.id}}" }] } }
      ]
    },
    {
      "id": "C6",
      "all": [
        { "request": "R7", "expect": { "status": 204 } },
        { "request": "R7B", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "notContains": "{{Z0.body.id}}" }] } },
        { "request": "R8", "expect": { "status": 403 } }
      ]
    },
    { "id": "C7", "request": "R9", "expect": { "status": 403 } },
    {
      "id": "C8",
      "all": [
        { "request": "R10", "expect": { "status": 404 } },
        { "request": "R11", "expect": { "status": 400 } },
        { "request": "R11B", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "id" }] } },
        { "request": "R11C", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "id" }] } },
        { "request": "R12", "expect": { "status": 401 } }
      ]
    },
    { "id": "C9", "manual": "30일이 지난 글은 시각을 되돌려야 해서 버튼으로 못 본다 — 직접 확인의 R13(DB에서 deleted_at을 31일 전으로 바꾼 뒤 복구)이 410이고 R14 휴지통에 없는지 본다" },
    { "id": "C10", "manual": "새 글을 삭제한 뒤 POST /api/posts/{id}/restore를 같은 토큰으로 10개 동시에 보내면 200 한 번, 409 아홉 번이고 deleted_at·deleted_by는 NULL이어야 한다" }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{T}`·`{Z}`는 직접 확인에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | R1 | `204`(3-2 그대로) |
| C2 | R2 | 휴지통 첫 항목이 `{T}`, `deletedAt`·`restoreUntil`이 문자열 |
| C3 | R3(이스프링이 김자바 글 복구) | `404` |
| C4 | R4 / R5 | `200`(`status`=`PUBLISHED`) / 비로그인 상세 `200` — 다시 보인다 |
| C5 | R6 / R6B | 또 복구 `409` / 휴지통에서 빠짐 |
| C6 | R7 / R7B / R8 | 운영자 삭제 `204` / 김자바 휴지통에 없음 / 김자바가 복구 `403` |
| C7 | R9(V22 전에 지운 8번) | `403` — 누가 지웠는지 모르는 글은 되살리지 않는다 |
| C8 | R10 / R11 / R11B / R11C / R12 | 없는 글 `404` / 숫자 아닌 id `400` / 음수·0 id `400`(`errors.id`) / 토큰 없음 `401` — 500이 아니다 |
| C9 | R13 / R14 | `410` / 휴지통에 없음 — 수동 |
| C10 | 같은 글을 10번 동시에 복구 | `200` 1번·`409` 9번, DB의 `deleted_at`·`deleted_by`는 `NULL` — 수동 |
| D1 | `SELECT deleted_at, deleted_by FROM post WHERE id = {T}` | `NULL`, `NULL` — 되살렸다 |
| D2 | `SELECT deleted_at IS NOT NULL, deleted_by FROM post WHERE id = {Z}` | `1`, `1` — 운영자가 지운 기록 |
| D3 | `SELECT deleted_by FROM post WHERE id = 8` | `NULL` — 마이그레이션이 옛 행을 짐작으로 채우지 않았다 |
| R1 | 확인 순서 | 404(내 글 아님) → 409 → 403 → 410. "내 글이 아니면 404"를 맨 앞에 둬서 남의 지운 글의 상태가 새어 나가지 않는다 |
| R2 | 2-3 규칙과의 관계 | 복구가 `canView`를 쓰지 않는 이유(삭제된 글은 누구도 볼 수 없다)를 설명하고, 대신 작성자 확인을 직접 했다 |
| R3 | 지운 사람 기록 | 3-2의 삭제가 `deleted_by`도 같이 채운다(엔티티 메서드 하나에서) |
| R4 | 기간 | "30일"을 상수 하나로 두고, 휴지통 조회 조건과 복구 검사에 같은 값·같은 `Clock`을 쓴다 |
| R5 | 30일 지난 글 | 휴지통에서 사라진 글의 행은 여전히 남아 있다. 정말 지우려면(개인정보 보관 기한 등) 배치로 지우거나 익명화한다는 것을 안다 |

## 필요한 지식

- [3-2. 삭제 — soft delete](../ch3-update-delete/3-2-soft-delete.md)
- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 규칙의 예외(복구)를 어디에 둘지
- [J2 마이그레이션은 왜](../../lessons/J2-why-migrations.md) — 컬럼 추가와 기존 행
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md)
- [A5 REST API 설계와 명세서 읽기](../../lessons/A5-rest-api-design.md) — 409·403·410을 고르는 기준

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 지운 사람 남기기</summary>

`Post.delete(LocalDateTime now)`를 `delete(LocalDateTime now, Long deletedBy)`로 바꾸고 `PostService.delete()`에서 로그인 회원 id를 넘긴다. 엔티티에는 `@Column(name = "deleted_by") private Long deletedBy;`면 충분하다(회원 엔티티를 거쳐 읽을 일이 없다). `restore()`는 `deletedAt`·`deletedBy`만 `null`로.
</details>

<details>
<summary>힌트 2 — 휴지통 쿼리와 복구 순서</summary>

```java
@Query("""
        SELECT p FROM Post p JOIN FETCH p.board
         WHERE p.author.id = :memberId AND p.deletedBy = :memberId
           AND p.deletedAt IS NOT NULL AND p.deletedAt >= :since
         ORDER BY p.deletedAt DESC, p.id DESC
        """)
List<Post> findMyTrash(@Param("memberId") Long memberId, @Param("since") LocalDateTime since);
```

`since` = `LocalDateTime.now(clock).minusDays(30)`. 복구는 `findById` → 작성자 아니면 404 → `deletedAt == null`이면 409 → `!내 id.equals(deletedBy)`면 403(`deletedBy`가 `null`이어도 여기서 걸린다) → `deletedAt.plusDays(30).isBefore(now)`면 410(`HttpStatus.GONE`). 예외마다 `ApiExceptionHandler`에 상태 코드를 등록한다.
</details>

## 다음 단계

[11-6. 글 수정 이력](11-6-revisions.md)
