# T-027. 뒤쪽 페이지가 느리고 글이 겹친다 — 커서 페이징, 옛 앱 호환

> 난이도 고급 · 유형 성능 · DB practice · 예상 90분

## 티켓

> **요청자** 모바일 앱 팀·DBA · **배경** 앱이 게시판을 무한 스크롤로 바꾸면서 `page=0,1,2…`를 계속 늘려 부른다. DBA: "개발 게시판 목록 쿼리가 뒤로 갈수록 읽는 행이 늘어난다, 운영 글 수면 수백 페이지째에서 수십만 행을 읽고 버린다." 앱 팀: "스크롤 중에 새 글이 올라오면 방금 본 글이 다음 묶음에 또 나온다."

- 게시판 글 목록을 **커서**로도 받을 수 있게 해 주세요. 응답에 다음 묶음용 커서(`nextCursor`)를 주고, 앱은 그 값을 그대로 다시 보냅니다(앱은 커서를 열어 보지 않는다).
- 커서로 받는 다음 묶음은 그사이 새 글이 올라와도 **겹치거나 빠지지 않아야** 합니다.
- 커서 요청에서는 전체 건수를 세지 마세요(무한 스크롤은 전체 쪽수를 안 쓴다) — 그 필드들은 `null`.
- **옛 앱이 남아 있습니다.** `page` 번호 방식은 그대로 동작해야 하고, 응답 모양은 필드가 늘어나기만 해야 합니다(첫 페이지는 `page`로 받고 그다음부터 커서로 넘어갈 수 있게, `page` 응답에도 `nextCursor`).
- **완료 조건**: 첫 묶음 → 새 글 등록 → 커서로 다음 묶음을 받으면, 새 글이 올라오기 전의 2페이지와 정확히 같다. 깨진 커서는 `400`.

**DB 시작 상태**: `practice` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드를 practice 프로파일로 켠다. 개발 게시판(`dev`)에 비로그인으로 볼 수 있는 글이 50개 있다. 새 글은 코딩하는고양이(`tok-p02`)가 쓰고 마지막에 지운다.

## 지금 코드

고급 티켓이라 실마리는 없다. 아래 D1의 `EXPLAIN ANALYZE`를 먼저 돌려 오프셋 방식이 몇 행을 읽는지 숫자로 본다.

## 화면 시나리오

```screen
{
  "title": "개발 게시판 — 무한 스크롤",
  "summary": "스크롤이 끝에 닿으면 다음 묶음을 부른다. 그사이 새 글이 올라와도 이미 본 글이 다시 나오면 안 된다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "개발 게시판", "right": "(비로그인)" },
    {
      "type": "list",
      "id": "posts",
      "items": [
        { "id": "p-145", "title": "글 145" },
        { "id": "p-138", "title": "글 138", "meta": "첫 묶음의 마지막" },
        { "id": "p-137", "title": "글 137", "meta": "다음 묶음의 첫 글" }
      ],
      "footer": "불러오는 중…"
    },
    { "type": "toast", "id": "dup", "value": "(버그) 글 138이 또 나왔다", "tone": "error" }
  ],
  "flows": [
    {
      "name": "지금 — 오프셋 + 새 글",
      "steps": [
        { "kind": "user", "text": "첫 묶음(page=0) 5개를 보고 스크롤한다. 그사이 누가 새 글을 올린다", "focus": ["posts"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/dev/posts?page=1&size=5" },
        { "kind": "db", "sql": "SELECT … ORDER BY published_at DESC, id DESC LIMIT 5 OFFSET 5", "note": "앞의 행을 읽고 버린다 — 새 글 하나만큼 밀려 있다" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 138, …}, …], \"page\": 1, …}" },
        { "kind": "screen", "text": "이미 본 글 138이 다시 나온다", "focus": ["dup"] }
      ]
    },
    {
      "name": "커서",
      "steps": [
        { "kind": "user", "text": "첫 묶음 응답의 nextCursor로 다음 묶음을 부른다", "focus": ["posts"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/dev/posts?size=5&cursor=MjAyNi0wOS0yNVQxODo0OTo0OHwxMzg" },
        { "kind": "db", "sql": "SELECT … WHERE board_id = 2 AND (published_at < ? OR (published_at = ? AND id < ?)) ORDER BY published_at DESC, id DESC LIMIT 6", "note": "커서 위치부터 인덱스를 읽다가 6개에서 멈춘다. COUNT 없음" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 137, …}, …], \"page\": null, \"totalElements\": null, \"hasNext\": true, \"nextCursor\": \"…\"}" },
        { "kind": "screen", "text": "137부터 — 겹침 없음", "focus": ["p-137"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 요청 | `GET /api/boards/{slug}/posts?size=&cursor=` — `cursor`가 있으면 커서 방식(`page`는 무시), 없으면 지금의 `page` 방식 |
| 응답(공통) | 지금 필드 + `nextCursor`(문자열, 다음이 없으면 `null`) |
| 커서 방식 응답 | `items`·`size`·`hasNext`·`nextCursor`. 전체 건수를 세지 않으므로 `page`·`totalElements`·`totalPages`는 `null` |
| 순서·경계 | 지금 목록과 같은 순서(발행 시각 최신 → id 큰 순). 같은 시각의 글도 겹치거나 빠지지 않는다 |
| 오류 | 깨진 커서 `400`, 없는 게시판 `404`(지금과 같다) |
| 그대로인 것 | `page` 방식의 결과·필드, 볼 수 있는 글 규칙(로그인·팔로우·차단), 목록 SQL 수 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; H='Authorization: Bearer tok-p02'

curl -s "$BASE/api/boards/dev/posts?size=5"            # 요청 A — items 145…138, nextCursor
curl -s "$BASE/api/boards/dev/posts?page=1&size=5"     # 요청 O — 새 글 전 2페이지: 137, 133, 132, 128, 125
curl -s -X POST "$BASE/api/posts" -H "$H" -H "$J" -d '{"boardSlug":"dev","title":"[T-027] 스크롤 중 새 글","content":"x"}'   # 요청 W
curl -s "$BASE/api/boards/dev/posts?size=5&cursor=<A의 nextCursor>"   # 요청 B — O와 같다, page·totalElements null
curl -s "$BASE/api/boards/dev/posts?page=1&size=5"     # 요청 O2 — (오프셋) 138이 또 나온다
curl -s -i "$BASE/api/boards/dev/posts?cursor=abc%21"  # 요청 X — 400
curl -s -X DELETE "$BASE/api/posts/<W의 id>" -H "$H"    # 요청 Z — 새 글 지우기
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끼워 넣은 새 글을 마지막에 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "첫 묶음", "method": "GET", "path": "/api/boards/dev/posts?size=5" },
    { "id": "O", "title": "새 글 전 2페이지(page)", "method": "GET", "path": "/api/boards/dev/posts?page=1&size=5" },
    { "id": "W", "title": "스크롤 중 새 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-p02" }, "body": { "boardSlug": "dev", "title": "[T-027] 스크롤 중 새 글", "content": "x" } },
    { "id": "B", "title": "커서로 다음 묶음", "method": "GET", "path": "/api/boards/dev/posts?size=5&cursor={{A.body.nextCursor}}" },
    { "id": "O2", "title": "(비교) 새 글 뒤 2페이지(page)", "method": "GET", "path": "/api/boards/dev/posts?page=1&size=5" },
    { "id": "X", "title": "깨진 커서", "method": "GET", "path": "/api/boards/dev/posts?size=5&cursor=abc!" },
    { "id": "Z", "title": "새 글 지우기", "method": "DELETE", "path": "/api/posts/{{W.body.id}}", "headers": { "Authorization": "Bearer tok-p02" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.items", "length": 5 }, { "path": "$.nextCursor", "type": "string" }, { "path": "$.page", "equals": 0 }, { "path": "$.totalElements", "type": "number" }] } },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items", "length": 5 },
          { "path": "$.items[0].id", "equals": "{{O.body.items[0].id}}" },
          { "path": "$.items[1].id", "equals": "{{O.body.items[1].id}}" },
          { "path": "$.items[2].id", "equals": "{{O.body.items[2].id}}" },
          { "path": "$.items[3].id", "equals": "{{O.body.items[3].id}}" },
          { "path": "$.items[4].id", "equals": "{{O.body.items[4].id}}" },
          { "path": "$.hasNext", "equals": true },
          { "path": "$.nextCursor", "type": "string" }
        ]
      }
    },
    { "id": "C3", "request": "B", "expect": { "json": [{ "path": "$.page", "type": "null" }, { "path": "$.totalElements", "type": "null" }, { "path": "$.totalPages", "type": "null" }] } },
    { "id": "C4", "request": "O2", "expect": { "status": 200, "json": [{ "path": "$.page", "equals": 1 }, { "path": "$.items[0].id", "equals": "{{A.body.items[4].id}}" }] } },
    { "id": "C5", "request": "X", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `page` 방식 응답에 `nextCursor`(문자열)가 늘었고 나머지(`page: 0`, `totalElements`)는 그대로 |
| C2 | 요청 B | 새 글이 끼어든 뒤에도 커서로 받은 다음 묶음 = 새 글 전의 2페이지(요청 O) 5개 그대로, 다음 커서 있음 |
| C3 | 요청 B | 커서 요청은 `page`·`totalElements`·`totalPages`가 `null` — 전체 건수를 세지 않았다 |
| C4 | 요청 O2 | `page` 방식은 예전 그대로(새 글만큼 밀려 A의 마지막 글이 다시 나온다) — 회귀 가드(기준 코드도 통과) |
| C5 | 요청 X | 깨진 커서 `400` |
| D1 | `EXPLAIN ANALYZE SELECT id FROM post WHERE board_id = 2 AND deleted_at IS NULL AND status = 'PUBLISHED' AND visibility = 'PUBLIC' ORDER BY published_at DESC, id DESC LIMIT 5 OFFSET 45` | 10페이지째(오프셋) — 게시판의 인덱스 항목을 전부 읽어(처음 상태 62행, 버튼 확인 한 번마다 지운 글이 1행씩 는다) 거른 **50행 중 45행을 버리고** 5행을 쓴다(`Index lookup … rows=62`, `Filter … rows=50`, `Limit/Offset: 5/45`) |
| D2 | `EXPLAIN ANALYZE SELECT id FROM post WHERE board_id = 2 AND deleted_at IS NULL AND status = 'PUBLISHED' AND visibility = 'PUBLIC' AND (published_at < '2026-07-12 08:12:05' OR (published_at = '2026-07-12 08:12:05' AND id < 18)) ORDER BY published_at DESC, id DESC LIMIT 5` | 같은 위치(45번째 글 18 뒤)를 커서로 — `Index range scan on post using ix_post_board_published … rows=5`, 읽은 행 5 |
| T1 | (선택) 테스트 | 커서로 받은 묶음 = `page=1` 결과, 커서 요청의 SQL 문장 수에 COUNT가 없다(통계로 센다), 깨진 커서 `400` |
| R1 | 왜 빠른가·왜 안 겹치나 | 오프셋은 버릴 행까지 읽는다(깊을수록 선형), 키셋은 정렬 키 위치부터 인덱스를 읽다가 멈춘다. 정렬 키에 **유일한 마지막 키(id)**가 있어야 같은 시각의 글이 겹치거나 빠지지 않는다. `(board_id, published_at, id)` 인덱스 순서와 조건 모양이 맞아야 range scan이 된다 |
| R2 | 호환 | 기존 필드를 바꾸지 않고 늘리기만 했다(옛 앱은 `nextCursor`를 무시). 커서 응답에서 `null`이 되는 필드를 옛 방식에선 그대로 채운다. 커서를 불투명한 문자열로 둔 이유(정렬 키를 바꿔도 클라이언트가 안 바뀐다) |
| R3 | 대가 | 커서는 "임의의 N페이지로 점프"가 안 된다, 정렬 기준을 바꾸면(좋아요순 등) 커서 키도 바뀐다, 커서에 든 값은 위조될 수 있다(조건으로만 쓰고 권한 판단에 쓰지 않는다) |

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 두 방식의 비용과 겹침
- [R05 인덱스와 B-Tree](../docs/knowledge/R05-index-btree.md) — 복합 인덱스 순서와 range scan
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — Criteria로 조건 붙이기
- [S17 Spring Boot 애플리케이션 성능](../docs/knowledge/S17-performance-tuning.md) — 실행 계획으로 확인하기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 이미 있는 것</summary>

"내가 좋아요한 글"과 "내 북마크"가 이미 `(시각, id)` 커서를 쓴다 — 커서를 감싸고 푸는 클래스(깨지면 400)를 그대로 쓴다. 게시판 목록 쿼리를 조립하는 저장소에 "같은 조건 + 커서 뒤" 메서드를 하나 더 만든다: `publishedAt < at OR (publishedAt = at AND id < id)`, 같은 정렬, `setMaxResults(size + 1)` — 하나 더 읽어서 다음이 있는지 안다. COUNT 쿼리는 부르지 않는다.
</details>

<details>
<summary>힌트 2 — 응답 모양</summary>

목록 응답 record의 `page`·`totalElements`·`totalPages`를 `int`·`long`에서 `Integer`·`Long`으로 바꿔야 `null`을 담을 수 있다. 이 record는 조합 검색도 쓰므로 검색 응답에도 `nextCursor` 자리가 생긴다(이번 범위에선 `null`이어도 된다).
</details>
