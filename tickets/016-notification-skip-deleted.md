# T-016. 알림 목록에서 지워진 글·댓글 알림 빼기

> 난이도 중급 · 유형 기존 API 변경 · DB community · 예상 50분

## 티켓

> **요청자** CS·프론트 팀 · **배경** "알림을 눌렀더니 없는 글이라고 나온다"는 문의가 많다. 글쓴이가 글을 지웠거나 댓글 단 사람이 댓글을 지운 뒤에도 알림이 그대로 남아 있다. 게다가 종 아이콘의 빨간 숫자(안 읽은 개수)가 목록에 보이는 안 읽은 알림 수보다 크다.

- 내 알림 목록에서 **삭제된 글**에 대한 알림과 **삭제된 댓글**에 대한 댓글 알림을 빼 주세요. 알림 행 자체는 지우지 않습니다(나중에 글 복구 기능이 생길 수 있다).
- 안 읽은 개수(`unreadCount`)도 같은 기준으로 세 주세요. 목록과 숫자가 다르면 안 됩니다.
- **완료 조건**: 지워진 글·댓글 알림이 목록과 숫자 어디에도 나오지 않고, 살아 있는 알림은 그대로 최신순이다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 알림 테이블은 비어 있다 — 아래 요청들이 이스프링(회원 3)의 새 글 두 개에 박디비(회원 4)의 좋아요·댓글을 달아 알림을 만든다.

## 지금 코드

- 알림 목록은 쿼리 두 개(목록, 안 읽은 개수)로 만든다. 둘이 어떤 조건을 공유하고 있는지 본다.
- 글과 댓글은 지워도 행이 남는다(soft delete). 알림 행에서 글·댓글의 삭제 여부까지 가려면 무엇을 조인해야 하는지 본다.

## 화면 시나리오

```screen
{
  "title": "알림 — 종 아이콘",
  "summary": "지워진 글·댓글 알림은 목록에서도, 빨간 숫자에서도 빠진다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "알림", "right": "이스프링" },
    { "type": "stats", "id": "badge", "items": [{ "id": "unread", "label": "안 읽음", "value": "1" }] },
    {
      "type": "list",
      "id": "notifications",
      "items": [
        { "id": "n-like", "title": "박디비님이 내 글을 좋아해요", "meta": "방금" },
        { "id": "n-gone", "title": "박디비님이 댓글을 남겼어요 (지워진 댓글)", "tone": "muted", "badge": "빠져야 함" }
      ]
    },
    { "type": "toast", "id": "toast-404", "value": "글을 찾을 수 없습니다", "tone": "error" }
  ],
  "flows": [
    {
      "name": "지금(문제) — 눌러 보면 404",
      "steps": [
        { "kind": "user", "text": "지워진 댓글 알림을 누른다", "focus": ["n-gone"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"type\": \"COMMENT\", \"commentId\": 9, …}, …], \"unreadCount\": 4}" },
        { "kind": "screen", "text": "지운 글로 이동해 '글을 찾을 수 없습니다'", "focus": ["toast-404"] }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        { "kind": "user", "text": "종 아이콘을 누른다", "focus": ["badge"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "목록과 안 읽은 개수가 같은 조건(글 삭제 안 됨, 댓글 알림이면 댓글 삭제 안 됨)으로 조회한다" },
        { "kind": "db", "sql": "SELECT … FROM notification n JOIN post p ON p.id = n.post_id LEFT JOIN comment c ON c.id = n.comment_id WHERE n.member_id = 3 AND p.deleted_at IS NULL AND c.deleted_at IS NULL ORDER BY n.created_at DESC, n.id DESC" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"type\": \"LIKE\", \"postId\": 23, …}], \"unreadCount\": 1}" },
        { "kind": "screen", "text": "살아 있는 알림만, 숫자도 1", "focus": ["notifications", "unread"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/me/notifications` (`unreadOnly`·`size` 그대로) |
| 빼는 알림 | 글이 삭제된 알림(`post.deleted_at` 있음), 댓글 알림 중 그 댓글이 삭제된 것(`comment.deleted_at` 있음) |
| `unreadCount` | 위 알림을 뺀 기준으로 센다 — `unreadOnly=true` 목록(크기 제한 안)의 개수와 같다 |
| 그대로인 것 | 응답 모양, 최신순(`created_at DESC, id DESC`), 알림 행(지우지 않는다), 읽음 처리 API |

## 직접 확인

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'; LEE='Authorization: Bearer tok-lee'; PARK='Authorization: Bearer tok-park'

curl -s -X POST "$BASE/api/posts" -H "$LEE" -H "$J" -d '{"boardSlug":"free","title":"[T-016] 지울 글","content":"x"}'   # 요청 A
curl -s -X PUT "$BASE/api/posts/{A의 id}/like" -H "$PARK"                                                             # 요청 B
curl -s -X POST "$BASE/api/posts/{A의 id}/comments" -H "$PARK" -H "$J" -d '{"content":"[T-016] 댓글"}'                 # 요청 C
curl -s -X POST "$BASE/api/posts" -H "$LEE" -H "$J" -d '{"boardSlug":"free","title":"[T-016] 남길 글","content":"x"}'   # 요청 D
curl -s -X PUT "$BASE/api/posts/{D의 id}/like" -H "$PARK"                                                             # 요청 E
curl -s -X POST "$BASE/api/posts/{D의 id}/comments" -H "$PARK" -H "$J" -d '{"content":"[T-016] 지울 댓글"}'            # 요청 F
curl -i -X DELETE "$BASE/api/comments/{F의 id}" -H "$PARK"                                                            # 요청 G — 댓글 삭제
curl -i -X DELETE "$BASE/api/posts/{A의 id}" -H "$LEE"                                                                # 요청 H — 글 삭제
curl -s "$BASE/api/me/notifications?size=100" -H "$LEE"                                                              # 요청 I
curl -s "$BASE/api/me/notifications?unreadOnly=true&size=100" -H "$LEE"                                              # 요청 K
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글·댓글로 알림을 만들므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "이스프링 글 1(지울 글)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "free", "title": "[T-016] 지울 글", "content": "x" } },
    { "id": "B", "title": "박디비 좋아요(글 1)", "method": "PUT", "path": "/api/posts/{{A.body.id}}/like", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "C", "title": "박디비 댓글(글 1)", "method": "POST", "path": "/api/posts/{{A.body.id}}/comments", "headers": { "Authorization": "Bearer tok-park" }, "body": { "content": "[T-016] 댓글" } },
    { "id": "D", "title": "이스프링 글 2(남길 글)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "boardSlug": "free", "title": "[T-016] 남길 글", "content": "x" } },
    { "id": "E", "title": "박디비 좋아요(글 2)", "method": "PUT", "path": "/api/posts/{{D.body.id}}/like", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "F", "title": "박디비 댓글(글 2)", "method": "POST", "path": "/api/posts/{{D.body.id}}/comments", "headers": { "Authorization": "Bearer tok-park" }, "body": { "content": "[T-016] 지울 댓글" } },
    { "id": "G", "title": "박디비가 그 댓글 삭제", "method": "DELETE", "path": "/api/comments/{{F.body.id}}", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "H", "title": "이스프링이 글 1 삭제", "method": "DELETE", "path": "/api/posts/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "I", "title": "이스프링 알림 목록", "method": "GET", "path": "/api/me/notifications?size=100", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "K", "title": "이스프링 안 읽은 알림만", "method": "GET", "path": "/api/me/notifications?unreadOnly=true&size=100", "headers": { "Authorization": "Bearer tok-lee" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "I",
      "expect": { "status": 200, "json": [{ "path": "$.items[*].postId", "notContains": "{{A.body.id}}" }] }
    },
    {
      "id": "C2",
      "request": "I",
      "expect": { "status": 200, "json": [{ "path": "$.items[*].commentId", "notContains": "{{F.body.id}}" }] }
    },
    {
      "id": "C3",
      "request": "I",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].type", "equals": "LIKE" },
          { "path": "$.items[0].postId", "equals": "{{D.body.id}}" },
          { "path": "$.items[0].actor", "equals": { "id": 4, "nickname": "박디비" } }
        ]
      }
    },
    {
      "id": "C4",
      "all": [
        { "request": "K", "expect": { "status": 200, "json": [{ "path": "$.unreadCount", "equals": "{{K.body.items.length}}" }] } },
        { "request": "I", "expect": { "status": 200, "json": [{ "path": "$.unreadCount", "equals": "{{K.body.unreadCount}}" }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 I | 삭제된 글(A)에 대한 알림(좋아요·댓글 모두)이 없다 |
| C2 | 요청 I | 삭제된 댓글(F)에 대한 알림이 없다 |
| C3 | 요청 I | 맨 위는 살아 있는 글 D의 박디비 좋아요 알림 — 최신순 그대로 |
| C4 | 요청 I·K | `unreadCount`가 안 읽은 목록의 개수와 같다(목록만 거르고 숫자는 안 거른 구현을 잡는다) |
| D1 | `SELECT n.type, p.deleted_at IS NOT NULL AS post_deleted, c.deleted_at IS NOT NULL AS comment_deleted FROM notification n JOIN post p ON p.id = n.post_id LEFT JOIN comment c ON c.id = n.comment_id WHERE n.member_id = 3 ORDER BY n.id DESC LIMIT 4` | 한 번 돌린 직후: `COMMENT 0 1` · `LIKE 0 0` · `COMMENT 1 0` · `LIKE 1 0` — 알림 행 4개는 그대로 남아 있고, 응답에는 `LIKE 0 0`만 나온다 |
| R1 | 같은 조건 | 목록 쿼리와 개수 쿼리가 **같은 조건**을 쓴다. 한쪽만 고치면 생기는 숫자 불일치를 설명할 수 있다(조건 조각을 공유하거나, 두 쿼리를 나란히 두고 테스트로 묶는다) |
| R2 | 조인 | 댓글이 없는 좋아요 알림이 빠지지 않게 댓글은 `LEFT JOIN`(또는 `n.comment IS NULL OR …`)으로 걸었다. 자바에서 목록을 받아 거르지 않았다(그러면 `size`보다 적게 오고 개수도 틀린다) |
| R3 | 남기기 vs 지우기 | 알림 행을 지우지 않고 읽을 때 거른 이유(복구 가능성, 쓰기 경로가 여러 곳)와, 반대로 글·댓글 삭제 때 알림을 지우는 방법의 장단점을 말할 수 있다 |

## 필요한 지식

- [R04 SQL CRUD와 JOIN](../docs/knowledge/R04-sql-crud-join.md) — `LEFT JOIN`에서 조건을 WHERE에 두면 생기는 일
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — 파생 쿼리로 안 되는 COUNT를 `@Query`로
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — soft delete 행이 남을 때 읽기 쪽이 지는 책임

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 목록</summary>

목록 JPQL에 `JOIN n.post p LEFT JOIN n.comment c`를 더하고 `AND p.deletedAt IS NULL AND (c IS NULL OR c.deletedAt IS NULL)`. 보낸 사람 `JOIN FETCH n.actor`는 그대로 둔다.
</details>

<details>
<summary>힌트 2 — 개수</summary>

`countByMember_IdAndReadAtIsNull` 같은 파생 쿼리로는 조인 조건을 표현할 수 없다. 같은 FROM·WHERE를 쓴 `@Query("SELECT COUNT(n) FROM Notification n JOIN n.post p LEFT JOIN n.comment c WHERE …")`로 바꾼다.
</details>
