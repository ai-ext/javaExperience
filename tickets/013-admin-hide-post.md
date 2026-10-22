# T-013. 운영자 글 숨김·복구 API

> 난이도 중급 · 유형 새 API · DB community · 예상 75분

## 티켓

> **요청자** 운영팀 · **배경** 신고가 들어온 글을 숨길 때마다 개발자에게 DB `UPDATE`를 부탁하고 있다. 숨긴 글은 이미 "운영자만 보는 글"로 처리되고 있으니, 상태만 바꾸는 운영자 API와 숨긴 글 목록 화면이 있으면 된다.

- 운영자가 글을 숨기거나(`HIDDEN`) 다시 보이게(`PUBLISHED`) 하는 API를 만들어 주세요. 같은 요청을 두 번 보내도 성공입니다.
- 임시저장 글은 아직 공개된 적이 없으니 숨기거나 복구할 대상이 아닙니다(충돌로 거절). 삭제된 글은 없는 글과 같습니다.
- 운영자 화면에 숨긴 글 목록을 페이지로 보여 주세요(숨긴 글이 많아지면 한 번에 다 못 본다).
- 운영자가 아니면 두 API 모두 거절합니다. 토큰이 없으면 401, 운영자가 아니면 403.
- **완료 조건**: 숨긴 글은 일반 목록·상세에서 사라지고(작성자 본인에게도), 복구하면 그대로 돌아온다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 이미 숨김 상태인 글은 10번 하나, 임시저장 글은 7번, 삭제된 글은 8번이다. 운영자 토큰은 `tok-admin`.

## 지금 코드

- 운영자만 부를 수 있는 API가 이미 하나 있다. 운영자 확인을 어디서 하는지, 거절 예외가 몇 번 상태로 바뀌는지 본다.
- "숨김 글은 운영자만 본다"는 규칙은 상세(자바 판정)와 목록(쿼리 조건) 두 곳에 이미 있다. 이번 티켓은 그 규칙을 고치는 게 아니라 상태 값을 바꾸는 입구를 만드는 것이다.
- 충돌(409)로 바꿔 주는 예외가 이미 있는지, 없으면 어디에 더하는지 본다.

## 화면 시나리오

```screen
{
  "title": "운영자 — 숨긴 글 관리",
  "summary": "신고된 글을 숨기면 숨긴 글 목록 맨 위에 생기고, 일반 사용자에게는 404가 된다. [복구]로 되돌린다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "운영 — 숨긴 글", "right": "운영자" },
    {
      "type": "list",
      "id": "hidden-list",
      "items": [
        { "id": "h-12", "title": "자유글 01", "meta": "이스프링 · free", "badge": "숨김", "tone": "warning" },
        { "id": "h-10", "title": "[숨김] 운영자가 숨긴 글", "meta": "박디비 · free", "badge": "숨김", "tone": "warning" }
      ],
      "footer": "1 / 2 페이지"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        { "id": "hide", "label": "숨기기", "variant": "danger" },
        { "id": "restore", "label": "복구", "variant": "secondary" }
      ]
    },
    { "type": "toast", "id": "toast-draft", "value": "임시저장 글은 숨길 수 없어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "신고된 글 숨기기",
      "steps": [
        { "kind": "user", "text": "신고 화면에서 글 12의 [숨기기]를 누른다", "focus": ["hide"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/admin/posts/12/status",
          "headers": ["Authorization: Bearer tok-admin", "Content-Type: application/json"],
          "body": "{\"status\": \"HIDDEN\"}"
        },
        { "kind": "server", "text": "운영자 확인 → 글 찾기(삭제됐으면 404) → 임시저장이면 409 → 상태만 바꾼다(이미 HIDDEN이면 그대로)" },
        { "kind": "db", "sql": "UPDATE post SET status = 'HIDDEN' WHERE id = 12" },
        { "kind": "response", "status": 200, "body": "{\"id\": 12, \"status\": \"HIDDEN\"}" },
        { "kind": "screen", "text": "숨긴 글 목록 맨 위에 글 12가 생긴다", "focus": ["hidden-list", "h-12"] }
      ]
    },
    {
      "name": "숨긴 글 목록 — 페이지",
      "steps": [
        { "kind": "user", "text": "숨긴 글 관리 화면을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/admin/posts/hidden?page=0&size=1", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "db", "sql": "SELECT … FROM post WHERE status = 'HIDDEN' AND deleted_at IS NULL ORDER BY id DESC LIMIT 1 OFFSET 0 (+ COUNT)" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 12, \"title\": \"자유글 01\", \"boardSlug\": \"free\", \"author\": {\"id\": 3, \"nickname\": \"이스프링\"}}], \"page\": 0, \"size\": 1, \"totalElements\": 2, \"totalPages\": 2, \"hasNext\": true}" },
        { "kind": "screen", "text": "1 / 2 페이지", "focus": ["hidden-list"] }
      ]
    },
    {
      "name": "임시저장 글 — 거절",
      "steps": [
        { "kind": "user", "text": "글 7(임시저장)의 [숨기기]를 누른다", "focus": ["hide"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/admin/posts/7/status",
          "headers": ["Authorization: Bearer tok-admin", "Content-Type: application/json"],
          "body": "{\"status\": \"HIDDEN\"}"
        },
        { "kind": "response", "status": 409, "body": "{\"status\": 409, \"detail\": \"임시저장 글은 숨기거나 복구할 수 없습니다.\"}" },
        { "kind": "screen", "text": "오류 토스트", "focus": ["toast-draft"] }
      ]
    }
  ]
}
```

## 만들 것

**① 상태 바꾸기** — `PATCH /api/admin/posts/{id}/status`

| 항목 | 내용 |
|---|---|
| 요청 본문 | `{ "status": "HIDDEN" }` 또는 `{ "status": "PUBLISHED" }` — 그 밖의 값·없음은 `400` |
| 응답 `200` | `{ "id": 12, "status": "HIDDEN" }` — 이미 그 상태여도 `200`(멱등) |
| `401` / `403` | 토큰 없음 / 운영자 아님 |
| `404` | 없는 글, 삭제된 글 |
| `409` | 임시저장(`DRAFT`) 글 |

**② 숨긴 글 목록** — `GET /api/admin/posts/hidden?page=0&size=20`

| 항목 | 내용 |
|---|---|
| 인증 | 운영자만 — 토큰 없음 `401`, 운영자 아님 `403` |
| 대상·정렬 | `HIDDEN`이고 삭제 안 된 글, 글 번호 최신순(`id DESC`) |
| 페이지 | `page` 0부터, `size` 1~50(기본 20) |
| 응답 `200` | `{ "items": [{ "id", "title", "boardSlug", "author": { "id", "nickname" } }], "page", "size", "totalElements", "totalPages", "hasNext" }` |

- DB 변화: `post.status`만 바뀐다.

## 직접 확인

```bash
BASE=http://localhost:8080
ADMIN='Authorization: Bearer tok-admin'
J='Content-Type: application/json'

curl -s -X PATCH "$BASE/api/admin/posts/12/status" -H "$ADMIN" -H "$J" -d '{"status":"HIDDEN"}'   # 요청 A (두 번 보내 A2)
curl -i "$BASE/api/posts/12"                                                                      # 요청 B — 비로그인
curl -i "$BASE/api/posts/12" -H 'Authorization: Bearer tok-lee'                                   # 요청 C — 작성자
curl -s "$BASE/api/boards/free/posts?size=20"                                                     # 요청 P — 목록에서 사라짐
curl -s "$BASE/api/admin/posts/hidden?page=0&size=1" -H "$ADMIN"                                  # 요청 L
curl -s "$BASE/api/admin/posts/hidden?page=1&size=1" -H "$ADMIN"                                  # 요청 L2
curl -i -X PATCH "$BASE/api/admin/posts/12/status" -H 'Authorization: Bearer tok-kimjava' -H "$J" -d '{"status":"HIDDEN"}'  # 요청 E
curl -i -X PATCH "$BASE/api/admin/posts/7/status" -H "$ADMIN" -H "$J" -d '{"status":"HIDDEN"}'    # 요청 G — 임시저장
curl -s -X PATCH "$BASE/api/admin/posts/12/status" -H "$ADMIN" -H "$J" -d '{"status":"PUBLISHED"}' # 요청 R — 복구
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 마지막에 글 12를 복구하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "HIDDEN" } },
    { "id": "A2", "title": "한 번 더 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "HIDDEN" } },
    { "id": "B", "title": "비로그인 상세", "method": "GET", "path": "/api/posts/12" },
    { "id": "C", "title": "작성자 상세", "method": "GET", "path": "/api/posts/12", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "D", "title": "운영자 상세", "method": "GET", "path": "/api/posts/12", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "P", "title": "자유 게시판 목록", "method": "GET", "path": "/api/boards/free/posts?size=20" },
    { "id": "L", "title": "숨긴 글 1쪽", "method": "GET", "path": "/api/admin/posts/hidden?page=0&size=1", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "L2", "title": "숨긴 글 2쪽", "method": "GET", "path": "/api/admin/posts/hidden?page=1&size=1", "headers": { "Authorization": "Bearer tok-admin" } },
    { "id": "E", "title": "일반 회원이 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "status": "HIDDEN" } },
    { "id": "F", "title": "토큰 없이 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "body": { "status": "HIDDEN" } },
    { "id": "M", "title": "일반 회원이 목록", "method": "GET", "path": "/api/admin/posts/hidden", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "N", "title": "토큰 없이 목록", "method": "GET", "path": "/api/admin/posts/hidden" },
    { "id": "G", "title": "임시저장 글", "method": "PATCH", "path": "/api/admin/posts/7/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "HIDDEN" } },
    { "id": "H", "title": "삭제된 글", "method": "PATCH", "path": "/api/admin/posts/8/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "HIDDEN" } },
    { "id": "K", "title": "허용 안 되는 상태 값", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "DRAFT" } },
    { "id": "R", "title": "복구", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": { "Authorization": "Bearer tok-admin" }, "body": { "status": "PUBLISHED" } },
    { "id": "R2", "title": "복구 뒤 비로그인 상세", "method": "GET", "path": "/api/posts/12" }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "A", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "id": 12, "status": "HIDDEN" } }] } },
        { "request": "A2", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "id": 12, "status": "HIDDEN" } }] } }
      ]
    },
    {
      "id": "C2",
      "all": [
        { "request": "B", "expect": { "status": 404 } },
        { "request": "C", "expect": { "status": 404 } },
        { "request": "D", "expect": { "status": 200 } },
        { "request": "P", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "notContains": 12 }] } }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "L",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.items[0]", "equals": { "id": 12, "title": "자유글 01", "boardSlug": "free", "author": { "id": 3, "nickname": "이스프링" } } },
              { "path": "$.totalElements", "equals": 2 },
              { "path": "$.hasNext", "equals": true }
            ]
          }
        },
        { "request": "L2", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [10] }, { "path": "$.hasNext", "equals": false }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "E", "expect": { "status": 403 } },
        { "request": "F", "expect": { "status": 401 } },
        { "request": "M", "expect": { "status": 403 } },
        { "request": "N", "expect": { "status": 401 } }
      ]
    },
    {
      "id": "C5",
      "all": [
        { "request": "G", "expect": { "status": 409 } },
        { "request": "H", "expect": { "status": 404 } },
        { "request": "K", "expect": { "status": 400 } }
      ]
    },
    {
      "id": "C6",
      "all": [
        { "request": "R", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "id": 12, "status": "PUBLISHED" } }] } },
        { "request": "R2", "expect": { "status": 200 } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A·A2 | 두 번 다 `200`, `{id: 12, status: "HIDDEN"}` — 멱등 |
| C2 | 요청 B·C·D·P | 숨긴 글은 비로그인·**작성자**에게 `404`, 운영자에게 `200`, 게시판 목록에 없다 |
| C3 | 요청 L·L2 | 숨긴 글 목록 1쪽 `12`(제목·게시판·작성자), 전체 2개·다음 있음 → 2쪽 `10`, 다음 없음 |
| C4 | 요청 E·F·M·N | 운영자 아님 `403`, 토큰 없음 `401` — 두 API 모두 |
| C5 | 요청 G·H·K | 임시저장 `409`, 삭제된 글 `404`, `DRAFT`로 바꾸기 `400` |
| C6 | 요청 R·R2 | 복구 `200 PUBLISHED`, 비로그인 상세가 다시 `200` |
| D1 | `SELECT id, status, deleted_at FROM post WHERE id IN (7, 8, 10, 12) ORDER BY id` | `7 DRAFT NULL` · `8 PUBLISHED (삭제 시각)` · `10 HIDDEN NULL` · `12 PUBLISHED NULL` — 거절된 요청(G·H·K·E)이 아무것도 바꾸지 않았고 12는 복구됐다 |
| R1 | 권한 확인 위치 | 운영자 확인이 두 API 모두에 빠짐없이 있다(한쪽만 막는 실수가 흔하다). 회원 역할 문자열 비교가 여러 곳에 흩어지면 한 곳으로 모으는 방안을 말할 수 있다 |
| R2 | 상태 전이 | 허용 전이(PUBLISHED↔HIDDEN)를 엔티티 메서드나 한 곳에 두고, 컨트롤러에서 `if`로 흩지 않는다. 요청 값 검증(400)과 상태 충돌(409)을 구분한다 |
| R3 | 목록 정렬 | "숨긴 시각"이 없어서 글 번호순으로 했다는 한계를 안다 — 숨긴 순서가 필요하면 무엇이 더 필요한지(컬럼·이력 테이블) 말할 수 있다 |

## 필요한 지식

- [S12 Spring Security 구조](../docs/knowledge/S12-security-architecture.md) — 인증(401)과 인가(403)의 차이, 권한 확인을 어디에 두나
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 409·403 예외를 전역 핸들러로
- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 값 검증(400)과 상태 규칙(409)
- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 관리자 화면은 페이지 번호가 맞는 경우

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 401과 403</summary>

PATCH는 토큰이 없으면 인터셉터가 이미 401을 낸다. GET은 토큰이 없어도 통과하므로 목록 API는 컨트롤러에서 "로그인 안 함 → 401"을 직접 확인한 뒤 "운영자 아님 → 403"을 본다. 운영자 확인은 기존 운영자 API가 쓰는 예외를 그대로 쓴다.
</details>

<details>
<summary>힌트 2 — 상태 바꾸기</summary>

글 엔티티에 `hide()`·`publish()`(또는 `changeStatus`) 메서드를 두고, 서비스는 `findById` → 삭제됐으면 404 → `DRAFT`면 409 → 변경 감지로 저장. 숨긴 글 목록은 Spring Data의 `Page<Post> findByStatusAndDeletedAtIsNull(String status, Pageable pageable)` + `@EntityGraph(attributePaths = {"author", "board"})`처럼 작성자·게시판을 함께 읽는다.
</details>
