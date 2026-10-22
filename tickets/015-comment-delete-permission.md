# T-015. 댓글 삭제 권한 — 글 작성자·운영자

> 난이도 중급 · 유형 기존 API 변경 · DB community · 예상 45분

## 티켓

> **요청자** 운영팀·기획 · **배경** 광고 댓글이 달려도 운영자가 지울 수 없어서 DB로 처리하고 있다. 글쓴이들도 "내 글에 달린 악성 댓글을 내가 지우게 해 달라"고 요청한다. 글 삭제는 이미 운영자도 할 수 있는데 댓글만 작성자 전용이다.

- 댓글 삭제를 **댓글 작성자 · 그 댓글이 달린 글의 작성자 · 운영자**가 할 수 있게 바꿔 주세요. 그 밖의 회원은 지금처럼 403입니다.
- 다른 사람 글에 달린 댓글은 글 작성자 권한으로 지울 수 없습니다(내 글의 댓글만).
- 누가 지우든 삭제 방식(soft delete)·댓글 수(`comment_count`) 감소·목록 표시 규칙은 지금과 같습니다.
- **완료 조건**: 세 경우 모두 204이고, 댓글 수가 정확히 한 번만 줄어든다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 글 11(질문 게시판)은 이스프링(회원 3)의 글, 글 3은 박디비(회원 4)의 글이다. 운영자 토큰은 `tok-admin`.

## 지금 코드

- 글 삭제와 댓글 삭제가 권한을 어떻게 다르게 확인하는지 나란히 놓고 본다.
- 댓글에서 그 댓글이 달린 글의 작성자까지 가려면 어떤 연관을 따라가야 하는지, 그때 쿼리가 몇 번 나가는지 본다.

## 화면 시나리오

```screen
{
  "title": "내 글의 댓글 — 글쓴이가 삭제",
  "summary": "글쓴이·운영자에게도 댓글 [삭제] 버튼이 보이고, 누르면 204 뒤 목록에서 사라진다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "트랜잭션은 어디에 거나요?", "right": "이스프링" },
    {
      "type": "list",
      "id": "comments",
      "label": "댓글",
      "items": [
        { "id": "c-ad", "title": "광고 같은 댓글이에요", "meta": "박디비", "badge": "삭제", "tone": "warning" },
        { "id": "c-ok", "title": "트랜잭션은 서비스 메서드에 거는 게 일반적이에요", "meta": "박디비" }
      ]
    },
    { "type": "toast", "id": "toast-done", "value": "댓글을 삭제했어요", "tone": "success" },
    { "type": "toast", "id": "toast-forbidden", "value": "삭제할 권한이 없어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "글쓴이가 남의 댓글 삭제",
      "steps": [
        { "kind": "user", "text": "이스프링이 자기 글의 광고 댓글에서 [삭제]를 누른다", "focus": ["c-ad"] },
        { "kind": "request", "method": "DELETE", "path": "/api/comments/{광고 댓글 id}", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "댓글을 찾고(지운 댓글이면 404) → 댓글 작성자인가, 이 댓글이 달린 글의 작성자인가, 운영자인가 → 하나라도 맞으면 soft delete + comment_count - 1(한 트랜잭션)" },
        { "kind": "db", "sql": "UPDATE comment SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?; UPDATE post SET comment_count = comment_count - 1 WHERE id = 11 AND comment_count > 0" },
        { "kind": "response", "status": 204 },
        { "kind": "screen", "text": "광고 댓글이 사라지고 토스트", "focus": ["comments", "toast-done"] }
      ]
    },
    {
      "name": "남의 글에 달린 댓글 — 거절",
      "steps": [
        { "kind": "user", "text": "이스프링이 박디비 글(글 3)에 달린 댓글을 지우려 한다", "focus": ["comments"] },
        { "kind": "request", "method": "DELETE", "path": "/api/comments/{그 댓글 id}", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"댓글을 삭제할 권한이 없습니다.\"}" },
        { "kind": "screen", "text": "권한 없음 토스트", "focus": ["toast-forbidden"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `DELETE /api/comments/{id}` |
| `204` | 요청자가 **댓글 작성자** 또는 **그 댓글이 달린 글의 작성자** 또는 **운영자(`ADMIN`)** |
| `403` | 위 셋이 아님 |
| `404` | 없는 댓글, 이미 지운 댓글(누가 지웠든) — 권한 확인보다 먼저 |
| 그대로인 것 | soft delete, `comment_count` 1 감소(같은 트랜잭션), 댓글 목록 표시 규칙 |

## 직접 확인

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'

curl -s "$BASE/api/posts/11"                                                                                            # 요청 P0 — 지금 commentCount
curl -s -X POST "$BASE/api/posts/11/comments" -H 'Authorization: Bearer tok-park' -H "$J" -d '{"content":"[T-015] 광고"}'   # 요청 A
curl -i -X DELETE "$BASE/api/comments/{A의 id}" -H 'Authorization: Bearer tok-kimjava'                                   # 요청 B — 아무 관계 없음
curl -i -X DELETE "$BASE/api/comments/{A의 id}" -H 'Authorization: Bearer tok-lee'                                       # 요청 C — 글 작성자
curl -s "$BASE/api/posts/11"                                                                                            # 요청 P1 — 처음과 같은 수
curl -s -X POST "$BASE/api/posts/11/comments" -H 'Authorization: Bearer tok-han' -H "$J" -d '{"content":"[T-015] 광고 2"}'  # 요청 E
curl -i -X DELETE "$BASE/api/comments/{E의 id}" -H 'Authorization: Bearer tok-admin'                                     # 요청 F — 운영자 (한 번 더: 요청 G)
curl -s -X POST "$BASE/api/posts/3/comments" -H 'Authorization: Bearer tok-kimjava' -H "$J" -d '{"content":"[T-015] 남의 글"}'  # 요청 H
curl -i -X DELETE "$BASE/api/comments/{H의 id}" -H 'Authorization: Bearer tok-lee'                                       # 요청 I — 남의 글
curl -i -X DELETE "$BASE/api/comments/{H의 id}" -H 'Authorization: Bearer tok-park'                                      # 요청 J — 글 3의 작성자
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 댓글을 만들어 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "P0", "title": "처음 댓글 수", "method": "GET", "path": "/api/posts/11" },
    { "id": "A", "title": "박디비가 글 11에 댓글", "method": "POST", "path": "/api/posts/11/comments", "headers": { "Authorization": "Bearer tok-park" }, "body": { "content": "[T-015] 광고" } },
    { "id": "B", "title": "관계없는 김자바가 삭제", "method": "DELETE", "path": "/api/comments/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "C", "title": "글 작성자 이스프링이 삭제", "method": "DELETE", "path": "/api/comments/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "P1", "title": "다시 댓글 수", "method": "GET", "path": "/api/posts/11" },
    { "id": "E", "title": "한차단이 글 11에 댓글", "method": "POST", "path": "/api/posts/11/comments", "headers": { "Authorization": "Bearer tok-han" }, "body": { "content": "[T-015] 광고 2" } },
    { "id": "F", "title": "운영자가 삭제", "method": "DELETE", "path": "/api/comments/{{E.body.id}}", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "G", "title": "운영자가 한 번 더", "method": "DELETE", "path": "/api/comments/{{E.body.id}}", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "H", "title": "김자바가 글 3(박디비 글)에 댓글", "method": "POST", "path": "/api/posts/3/comments", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "content": "[T-015] 남의 글" } },
    { "id": "I", "title": "이스프링이 남의 글 댓글 삭제", "method": "DELETE", "path": "/api/comments/{{H.body.id}}", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "J", "title": "글 3의 작성자 박디비가 삭제", "method": "DELETE", "path": "/api/comments/{{H.body.id}}", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "L", "title": "글 11 댓글 목록", "method": "GET", "path": "/api/posts/11/comments" }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "A", "expect": { "status": 201 } },
        { "request": "B", "expect": { "status": 403 } },
        { "request": "C", "expect": { "status": 204 } }
      ]
    },
    { "id": "C2", "request": "P1", "expect": { "status": 200, "json": [{ "path": "$.commentCount", "equals": "{{P0.body.commentCount}}" }] } },
    {
      "id": "C3",
      "all": [
        { "request": "E", "expect": { "status": 201 } },
        { "request": "F", "expect": { "status": 204 } },
        { "request": "G", "expect": { "status": 404 } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "H", "expect": { "status": 201 } },
        { "request": "I", "expect": { "status": 403 } },
        { "request": "J", "expect": { "status": 204 } }
      ]
    },
    {
      "id": "C5",
      "request": "L",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$[*].id", "notContains": "{{A.body.id}}" },
          { "path": "$[*].id", "notContains": "{{E.body.id}}" }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A·B·C | 관계없는 회원 `403`, **글 작성자** `204` |
| C2 | 요청 P0·P1 | 댓글 하나 달고 지운 뒤 `commentCount`가 처음과 같다(한 번만 줄었다) |
| C3 | 요청 E·F·G | **운영자** `204`, 이미 지운 댓글은 운영자에게도 `404` |
| C4 | 요청 H·I·J | 남의 글에 달린 댓글은 글 작성자 권한이 없다(`403`), 그 글의 작성자는 `204` |
| C5 | 요청 L | 지운 두 댓글이 목록에 없다(답글이 없는 최상위라 자리도 남지 않는다) |
| D1 | `SELECT p.comment_count, (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS actual FROM post p WHERE p.id IN (3, 11) ORDER BY p.id` | 각 행의 두 값이 같다(글 3 `0 0`, 글 11 `4 4`) — 몇 번을 돌려도 어긋나지 않는다 |
| D2 | `SELECT COUNT(*) FROM comment WHERE content LIKE '[T-015]%' AND deleted_at IS NULL` | `0` — 이 티켓으로 만든 댓글은 모두 지워졌다 |
| R1 | 권한 판정 위치 | "누가 지울 수 있나"를 한 메서드(또는 정책 클래스)에 모았다. 글 삭제의 "작성자 또는 운영자" 판정과 나란히 읽힌다 |
| R2 | 순서 | 404(없음·이미 지움)를 403보다 먼저 본다. 반대면 지워진 댓글에 대해 권한 오류가 나와 상태가 드러난다 |
| R3 | 쿼리 | 글 작성자 확인을 위해 댓글 → 글 → 작성자 id까지 따라갈 때 어떤 SELECT가 더 나가는지 로그로 확인했다(프록시의 id만 읽으면 로딩이 안 된다는 점 포함) |

## 필요한 지식

- [S12 Spring Security 구조](../docs/knowledge/S12-security-architecture.md) — 인가 규칙을 어디에 두나
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — soft delete와 숫자 감소를 한 트랜잭션으로
- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — 지연 로딩 프록시에서 id만 읽을 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 판정</summary>

`boolean canDelete = 댓글 작성자 id == 내 id || 댓글.getPost().getAuthor().getId() == 내 id || "ADMIN".equals(내 role)`. 로그인 회원 정보에는 이미 역할(role)이 들어 있다. 글 삭제 쪽 코드가 같은 모양이다.
</details>

<details>
<summary>힌트 2 — 지연 로딩</summary>

`comment.getPost()`는 프록시라 `getId()`까지는 쿼리가 안 나가지만, `getAuthor()`를 부르면 글을 읽는 SELECT가 한 번 나간다. 서비스 메서드가 트랜잭션 안이라 문제는 없다. 거슬리면 댓글을 읽을 때 글을 함께 fetch하는 조회 메서드를 하나 더 둔다.
</details>
