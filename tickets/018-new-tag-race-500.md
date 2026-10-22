# T-018. 새 태그로 동시에 글을 쓰면 500

> 난이도 중급 · 유형 버그 · DB community · 예상 75분

## 티켓

> **요청자** 운영(에러 알림) · **배경** 해커톤 공지에 "글에 `#hackathon2026` 태그를 달아 주세요"라고 올리자마자 500 알림이 수십 건 왔다. 같은 시각에 처음 보는 태그로 글을 쓴 사람들 중 한 명만 성공하고 나머지는 "알 수 없는 오류"를 받았다. 다시 누르면 된다(그때는 태그가 이미 있으니까).

- 처음 생기는 태그로 여러 명이 동시에 글을 써도 모두 성공하게 고쳐 주세요. 태그는 이름당 한 행이어야 합니다(지금처럼 DB의 UNIQUE가 지킨다).
- "실패하면 사용자가 다시 누르면 된다"는 안 됩니다. 글 작성은 사용자가 공들여 쓴 내용이라 한 번에 성공해야 합니다.
- **완료 조건**: 같은 새 태그로 동시에 10개를 써도 10개 모두 `201`, 그 태그 행은 하나, 태그 검색으로 10개가 나온다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 아래 확인은 매번 새 태그 이름(`t018-<글 번호>`)을 만들어 쓴다.

## 지금 코드

- 먼저 재현한다: 아래 버튼 확인을 기준 코드에 돌리고 서버 로그에서 500이 난 요청의 예외(맨 아래 `Caused by`)를 읽는다.
- 글 작성이 태그 이름을 태그 행으로 바꾸는 과정(찾고 없으면 만들기)을 따라간다. 그 과정이 **어느 트랜잭션 안에서** 일어나는지, 실패하면 그 트랜잭션은 어떻게 되는지가 핵심이다.
- 비슷한 "동시에 두 번 만들기" 문제를 다른 곳은 어떻게 막았는지 찾아본다. 다만 이번에는 실패가 더 큰 트랜잭션(글 저장) 한가운데서 난다는 점이 다르다.

## 화면 시나리오

```screen
{
  "title": "글쓰기 — 이벤트 태그",
  "summary": "처음 보는 태그로 여러 명이 동시에 [저장]을 누른다. 모두 성공해야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-018] 해커톤 참가 후기" },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["hackathon2026"] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "save", "label": "저장", "variant": "primary" }] },
    { "type": "toast", "id": "toast-500", "value": "알 수 없는 오류가 발생했어요", "tone": "error" },
    { "type": "toast", "id": "toast-ok", "value": "글을 올렸어요", "tone": "success" }
  ],
  "flows": [
    {
      "name": "지금(버그) — 동시에 10명",
      "steps": [
        { "kind": "user", "text": "10명이 거의 동시에 같은 새 태그로 [저장]을 누른다", "focus": ["tags", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"free\", \"title\": \"[T-018] 동시\", \"content\": \"x\", \"tags\": [\"hackathon2026\"]}"
        },
        { "kind": "server", "text": "10개 트랜잭션이 모두 '태그 없음'을 보고 INSERT → 하나만 성공, 나머지는 UNIQUE 위반(Duplicate entry … for key 'tag.uk_tag_name') → 글 저장 트랜잭션째 롤백 → 500" },
        { "kind": "db", "sql": "INSERT INTO tag (name, created_at) VALUES ('hackathon2026', …)  -- 9개는 중복 키 오류" },
        { "kind": "response", "status": 500, "body": "{\"status\": 500, \"error\": \"Internal Server Error\"}" },
        { "kind": "screen", "text": "9명이 오류 토스트를 본다", "focus": ["toast-500"] }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        { "kind": "user", "text": "같은 상황", "focus": ["save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"free\", \"title\": \"[T-018] 동시\", \"content\": \"x\", \"tags\": [\"hackathon2026\"]}"
        },
        { "kind": "server", "text": "태그가 이미 생겼으면 그 행을 쓰고, 동시에 생기는 중이면 기다렸다가 그 행을 쓴다 — 글 저장 트랜잭션은 깨지지 않는다" },
        { "kind": "response", "status": 201, "body": "{\"id\": 31, …, \"tags\": [\"hackathon2026\"], …}" },
        { "kind": "screen", "text": "10명 모두 성공", "focus": ["toast-ok"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `POST /api/posts`(태그를 받는 `PATCH /api/posts/{id}`도 같은 코드를 쓴다) |
| 고칠 동작 | 아직 없는 태그로 동시에 여러 글을 써도 모두 `201` |
| 지킬 것 | 태그 이름당 행 하나(`uk_tag_name`), 각 글에 그 태그가 연결된다 |
| 그대로인 것 | 응답 모양, 이미 있는 태그를 쓰는 경우, 검증(400) 규칙 |

## 직접 확인

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'

curl -s -X POST "$BASE/api/posts" -H 'Authorization: Bearer tok-kimjava' -H "$J" -d '{"boardSlug":"free","title":"[T-018] 기준","content":"x"}'   # 요청 A — 이 id로 새 태그 이름을 만든다
TAG="t018-{A의 id}"
for t in kimjava lee park han admin kimjava lee park han admin; do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H "Authorization: Bearer tok-$t" -H "$J" \
    -d "{\"boardSlug\":\"free\",\"title\":\"[T-018] 동시\",\"content\":\"x\",\"tags\":[\"$TAG\"]}" &
done; wait                                                                                   # 요청 P — 동시에 10개
curl -s "$BASE/api/posts/search?tag=$TAG&size=50"                                           # 요청 S
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 태그 이름을 쓰므로 몇 번을 눌러도 같은 조건(처음 생기는 태그)으로 확인한다.

```check
{
  "requests": [
    { "id": "A", "title": "태그 이름용 글", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[T-018] 기준", "content": "x" } },
    {
      "id": "P",
      "title": "새 태그로 동시에 10개",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer {{tok}}" },
      "body": { "boardSlug": "free", "title": "[T-018] 동시", "content": "x", "tags": ["t018-{{A.body.id}}"] },
      "concurrent": { "count": 10, "vars": { "tok": ["tok-kimjava", "tok-lee", "tok-park", "tok-han", "tok-admin"] } }
    },
    { "id": "S", "title": "그 태그로 검색", "method": "GET", "path": "/api/posts/search?tag=t018-{{A.body.id}}&size=50" }
  ],
  "checks": [
    { "id": "C1", "request": "P", "expect": { "status": 201, "bodyText": { "notContains": "Internal Server Error" } } },
    { "id": "C2", "request": "P", "expect": { "json": [{ "path": "$.tags", "equals": ["t018-{{A.body.id}}"] }] } },
    { "id": "C3", "request": "S", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 10 }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | 동시 10개 모두 `201`(500 없음) |
| C2 | 요청 P | 10개 응답 모두 그 새 태그가 붙어 있다 |
| C3 | 요청 S | 그 태그로 검색하면 10개 |
| D1 | `SELECT name, COUNT(*) FROM tag WHERE name LIKE 't018-%' GROUP BY name HAVING COUNT(*) > 1` | 0행 — 이름이 같은 태그 행이 없다 |
| D2 | `SELECT t.name, COUNT(*) FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE t.name LIKE 't018-%' GROUP BY t.name` | 누른 횟수만큼 행이 있고 모두 `10` |
| T1 | (선택) 동시성 테스트 | 같은 새 태그로 스레드 여러 개가 동시에 글을 쓰는 테스트(기존 좋아요 동시성 테스트 방식) |
| R1 | 원인 | "찾고 없으면 INSERT"가 두 트랜잭션 사이에서 왜 깨지는지, 그리고 **중복 키 예외를 잡아도 소용없는 이유**(그 트랜잭션은 이미 롤백 전용이 되고, Hibernate 세션도 더 쓸 수 없다)를 설명할 수 있다 |
| R2 | 고친 방법 | 다음 중 하나를 고르고 이유를 말한다 — ① `INSERT … ON DUPLICATE KEY UPDATE`(또는 `INSERT IGNORE`)로 DB가 중복을 흡수한 뒤 **잠금 읽기**(`FOR SHARE`/`FOR UPDATE`)로 다시 찾기, ② 태그 만들기를 별도 트랜잭션(`REQUIRES_NEW`)으로 빼고 충돌하면 다시 찾기 |
| R3 | 다시 찾기의 함정 | REPEATABLE READ에서는 같은 트랜잭션의 **평범한 SELECT가 다른 트랜잭션이 방금 커밋한 행을 못 볼 수 있다**(트랜잭션 처음의 스냅숏을 읽는다). 그래서 다시 찾을 때 잠금 읽기나 새 트랜잭션이 필요하다는 것을 안다 |

## 필요한 지식

- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 롤백 전용(rollback-only), 전파(`REQUIRES_NEW`), 격리 수준과 스냅숏
- [P18 동시성 — 재고·카운터](../docs/knowledge/P18-concurrency-inventory.md) — "확인 후 만들기" 경쟁과 DB 제약
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — UNIQUE가 최후의 방어선인 이유
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 잡아도 되는 예외와 잡아도 늦은 예외

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 왜 try-catch로 안 되나</summary>

`tagRepository.save(new Tag(...))`가 중복 키로 실패하는 순간 글 저장 트랜잭션은 rollback-only로 표시되고, 예외를 잡아 계속 가도 커밋할 때 `UnexpectedRollbackException`(또는 세션 오류)이 난다. 실패가 "큰 트랜잭션 안에서 나지 않게" 하거나, "실패를 DB가 흡수하게" 해야 한다.
</details>

<details>
<summary>힌트 2 — 한 가지 방법</summary>

태그 저장소에 네이티브 `INSERT INTO tag (name, created_at) VALUES (:name, :now) ON DUPLICATE KEY UPDATE id = id`(`@Modifying`)를 두고, 그 뒤 `@Lock(LockModeType.PESSIMISTIC_READ)`를 붙인 이름 조회로 다시 읽는다. 다른 트랜잭션이 같은 이름을 넣는 중이면 INSERT가 그 커밋을 기다린 뒤 중복으로 흡수되고, 잠금 읽기는 스냅숏이 아니라 최신 커밋 행을 본다. 이미 있는 태그는 지금처럼 먼저 평범하게 찾아서 쓴다.
</details>
