# T-026. 재시도하면 글이 두 번 올라간다 — Idempotency-Key

> 난이도 고급 · 유형 기존 API 변경 · DB community · 예상 90분

## 티켓

> **요청자** 모바일 앱 팀 · **배경** 지하철에서 글을 올리면 응답을 못 받은 앱이 자동으로 다시 보낸다. 서버는 두 번 다 받았으니 같은 글이 두세 개씩 생긴다. 앱은 "등록" 버튼을 누를 때마다 고유한 키를 만들어 재시도에도 같은 키를 보내기로 했다.

- 글 작성 요청에 `Idempotency-Key` 헤더가 있으면, **같은 회원이 같은 키로 보낸 요청은 몇 번이 오든 글을 하나만** 만들어 주세요. 두 번째부터는 처음 만든 글을 처음과 같은 모양으로 돌려줍니다(앱은 재시도인지 몰라도 된다).
- 재시도로 돌려준 응답에는 `Idempotent-Replayed: true` 헤더를, 처음 만든 응답에는 `false`를 붙여 주세요(로그·디버깅용).
- 같은 키로 **내용이 다른** 요청이 오면 앱 버그입니다 — `422`로 거절해 주세요.
- 재시도는 **동시에** 올 수도 있습니다(앞 요청이 아직 처리 중일 때 뒤 요청이 도착). 그때도 글은 하나.
- 키가 없는 요청은 지금과 똑같이 동작합니다.
- **완료 조건**: 같은 키로 5개가 동시에 와도 글 1개, 응답 5개 모두 그 글.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**. 김자바(`tok-kimjava`)가 자유 게시판(`free`)에 쓴다.

## 지금 코드

고급 티켓이라 실마리는 없다. 동시에 같은 키가 오는 경우를 먼저 손으로 재현할 방법(아래 `xargs -P 5`)을 갖춰 두고 시작한다.

## 화면 시나리오

```screen
{
  "title": "글쓰기 — 응답을 못 받은 앱의 재시도",
  "summary": "앱이 같은 키로 다시 보낸다. 서버는 처음 만든 글을 돌려주고, 글은 하나만 남는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "김자바(회원 2)" },
    { "type": "field", "id": "title", "label": "제목", "value": "출근길에 쓴 글" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "list", "id": "posts", "label": "자유 게시판", "items": [{ "id": "p-new", "title": "출근길에 쓴 글", "meta": "방금" }] }
  ],
  "flows": [
    {
      "name": "첫 요청 — 응답이 중간에 끊긴다",
      "steps": [
        { "kind": "user", "text": "등록을 누른다 — 앱이 키를 만든다", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-kimjava", "Idempotency-Key: 6f1c-…", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"출근길에 쓴 글\", \"content\": \"…\"}" },
        { "kind": "server", "text": "이 회원의 이 키는 처음 — 글을 만들고 키에 글 id를 묶어 같은 트랜잭션으로 커밋" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/posts/31", "Idempotent-Replayed: false"], "body": "{\"id\": 31, …}" },
        { "kind": "screen", "text": "(응답이 앱까지 못 왔다) 로딩이 계속 돈다", "focus": ["submit"] }
      ]
    },
    {
      "name": "재시도 — 같은 키",
      "steps": [
        { "kind": "user", "text": "앱이 자동으로 같은 요청·같은 키를 다시 보낸다", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-kimjava", "Idempotency-Key: 6f1c-…", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"출근길에 쓴 글\", \"content\": \"…\"}" },
        { "kind": "server", "text": "이미 있는 키 — 내용이 같은지 확인하고, 새로 만들지 않고 글 31을 돌려준다" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/posts/31", "Idempotent-Replayed: true"], "body": "{\"id\": 31, …}" },
        { "kind": "screen", "text": "목록에 글은 하나", "focus": ["p-new"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `V7__<설명>.sql` — 키 저장 테이블. 같은 회원·같은 키는 한 행만 있을 수 있게(DB 제약으로). 처음 요청 내용의 지문과 만든 글 id를 둔다 |
| 요청 | `POST /api/posts` + 선택 헤더 `Idempotency-Key`(1~100자, 벗어나면 `400`) |
| 처음 | 지금처럼 만들고 `201`·`Location` + `Idempotent-Replayed: false` |
| 같은 회원·같은 키·같은 내용 | 새로 만들지 않고 처음 글을 `201`·같은 `Location`·같은 본문 + `Idempotent-Replayed: true` |
| 같은 키·다른 내용 | `422` Problem Details |
| 동시에 같은 키 | 글 하나, 모든 응답이 그 글(실패 응답 없이) |
| 다른 회원의 같은 키 | 서로 상관없다(키는 회원별) |
| 그대로인 것 | 키 없는 요청, 검증(400)·권한(403) 규칙 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; H='Authorization: Bearer tok-kimjava'
K="t026-$(date +%s)"

curl -si -X POST "$BASE/api/posts" -H "$H" -H "$J" -H "Idempotency-Key: $K" -d '{"boardSlug":"free","title":"[T-026] 재시도","content":"x"}'   # 요청 K1 — 201, Replayed: false
curl -si -X POST "$BASE/api/posts" -H "$H" -H "$J" -H "Idempotency-Key: $K" -d '{"boardSlug":"free","title":"[T-026] 재시도","content":"x"}'   # 요청 K2 — 같은 id, Replayed: true
curl -si -X POST "$BASE/api/posts" -H "$H" -H "$J" -H "Idempotency-Key: $K" -d '{"boardSlug":"free","title":"[T-026] 재시도","content":"바꿈"}' # 요청 K3 — 422
seq 5 | xargs -P 5 -I{} curl -s -X POST "$BASE/api/posts" -H "$H" -H "$J" -H "Idempotency-Key: $K-p" -d "{\"boardSlug\":\"free\",\"title\":\"T026-p-$K\",\"content\":\"x\"}"; echo   # 요청 P — 같은 id 다섯 번
curl -s "$BASE/api/posts/search?q=T026-p-$K"                                        # 요청 S — totalElements 1
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 키는 매번 새로 만든 글(요청 A)의 id로 만드므로 몇 번을 눌러도 같은 결과다.

> 버튼은 브라우저에서 CORS를 거친다. 브라우저 JS는 `exposedHeaders`에 없는 응답 헤더를 읽지 못하므로 CORS 설정의 `exposedHeaders`에 `Idempotent-Replayed`를 더한다(`Location`은 이미 있다). 보내는 `Idempotency-Key`는 `addCorsMappings`의 기본값(`allowedHeaders` 전부 허용)으로 통과한다 — `allowedHeaders`를 좁혀 두었다면 거기에도 넣는다. 터미널 `curl`은 CORS와 상관없다.

```check
{
  "requests": [
    { "id": "A", "title": "키를 만들 기준 글(키 없이)", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[T-026] 기준", "content": "x" } },
    { "id": "K1", "title": "키와 함께 처음", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava", "Idempotency-Key": "t026-{{A.body.id}}" }, "body": { "boardSlug": "free", "title": "[T-026] 재시도", "content": "x" } },
    { "id": "K2", "title": "같은 키·같은 내용 재시도", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava", "Idempotency-Key": "t026-{{A.body.id}}" }, "body": { "boardSlug": "free", "title": "[T-026] 재시도", "content": "x" } },
    { "id": "K3", "title": "같은 키·다른 내용", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava", "Idempotency-Key": "t026-{{A.body.id}}" }, "body": { "boardSlug": "free", "title": "[T-026] 재시도", "content": "바꿈" } },
    {
      "id": "P",
      "title": "같은 키로 동시에 5번",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava", "Idempotency-Key": "t026-{{A.body.id}}-p" },
      "body": { "boardSlug": "free", "title": "T026-p-{{A.body.id}}", "content": "x" },
      "concurrent": { "count": 5 }
    },
    { "id": "S", "title": "그 제목으로 검색", "method": "GET", "path": "/api/posts/search?q=T026-p-{{A.body.id}}&size=50" },
    { "id": "O", "title": "다른 회원이 같은 키", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-lee", "Idempotency-Key": "t026-{{A.body.id}}" }, "body": { "boardSlug": "free", "title": "[T-026] 재시도", "content": "x" } }
  ],
  "checks": [
    { "id": "C1", "request": "K1", "expect": { "status": 201, "headers": { "Idempotent-Replayed": { "equals": "false" } } } },
    { "id": "C2", "request": "K2", "expect": { "status": 201, "headers": { "Idempotent-Replayed": { "equals": "true" }, "Location": { "endsWith": "/api/posts/{{K1.body.id}}" } }, "json": [{ "path": "$.id", "equals": "{{K1.body.id}}" }] } },
    { "id": "C3", "request": "K3", "expect": { "status": 422 } },
    { "id": "C4", "request": "P", "expect": { "status": 201, "distinct": { "path": "$.id", "count": 1 } } },
    { "id": "C5", "request": "S", "expect": { "status": 200, "json": [{ "path": "$.totalElements", "equals": 1 }] } },
    { "id": "C6", "request": "O", "expect": { "status": 201, "json": [{ "path": "$.id", "notEquals": "{{K1.body.id}}" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 K1 | `201` + `Idempotent-Replayed: false` |
| C2 | 요청 K2 | `201`, K1과 같은 `id`·`Location` + `Idempotent-Replayed: true` |
| C3 | 요청 K3 | `422` |
| C4 | 요청 P | 동시 5개 모두 `201`, `id`는 하나뿐 |
| C5 | 요청 S | 그 제목의 글은 1개 |
| C6 | 요청 O | 다른 회원은 같은 키로도 자기 글이 새로 생긴다(K1과 다른 `id`) — 회귀 가드(기준 코드도 통과) |
| D1 | `SELECT COUNT(*) FROM post WHERE title LIKE 'T026-p-%' GROUP BY title HAVING COUNT(*) > 1` | 0행 — 동시 재시도로 생긴 중복이 없다 |
| D2 | `SELECT member_id, COUNT(*) FROM idempotency_key GROUP BY member_id` (테이블 이름은 각자) | 김자바(2)는 버튼 1번에 키 2개(K·K-p), 이스프링(3)은 1개씩 늘어난다 |
| D3 | `SHOW INDEX FROM idempotency_key` | (회원, 키) UNIQUE 인덱스 |
| T1 | (선택) 동시성 테스트 | 같은 키로 스레드 5개 → 글 1개·결과 id 1개·예외 0 |
| R1 | "처음 한 번"을 누가 정하나 | 자바에서 "있나 보고 없으면 만든다"는 동시에 두 요청이 모두 "없음"을 본다 — UNIQUE 제약 + `INSERT IGNORE`(또는 중복 예외 처리)로 DB가 하나만 통과시킨다. 키 행과 글을 **같은 트랜잭션**에 넣는 이유(글 저장이 실패하면 키도 없어야 재시도가 된다) |
| R2 | 뒤에 온 요청이 처음 글을 찾는 법 | 뒤 요청의 INSERT는 앞 요청이 커밋할 때까지 기다린다. 그다음 **일반 SELECT로는 방금 커밋된 행이 안 보일 수 있다**(REPEATABLE READ — 스냅샷은 첫 일반 SELECT 때 잡힌다) → 잠금 읽기로 키 행을 읽고, 일반 SELECT는 그 뒤에 한다. 잠금 읽기가 `FOR UPDATE`가 아니라 `FOR SHARE`여야 하는 이유(중복을 만난 `INSERT IGNORE`가 이미 S 잠금을 쥐고 있어, 기다리던 요청끼리 S→X로 올리다 교착)를 말할 수 있다 |
| R3 | 운영 고려 | 키 보관 기간과 정리(예: 24시간), 처음 요청이 실패(400·500)했을 때 키를 남길지, 응답 본문 자체를 저장하는 방식(Stripe)과 글을 다시 읽는 방식의 차이, 키를 회원별로 두는 이유 |

## 필요한 지식

- [S06 REST API 설계](../docs/knowledge/S06-rest-api-clients.md) — 멱등성, 재시도와 중복
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 격리 수준, 스냅샷과 잠금 읽기
- [P18 동시성 — 재고·카운터](../docs/knowledge/P18-concurrency-inventory.md) — 유일성은 DB 제약으로
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — 복합 UNIQUE

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 순서</summary>

같은 트랜잭션 안에서: ① `INSERT IGNORE INTO <키 테이블>(member_id, 키, 지문, created_at)` → ② 1행이면 글을 만들고 키 행에 글 id를 적는다 → ③ 0행이면 `SELECT 지문, post_id … FOR SHARE`로 읽어 지문이 다르면 422, 같으면 그 글을 읽어 돌려준다. ①을 **트랜잭션의 첫 SQL**로 둔다(게시판 찾기 같은 일반 SELECT보다 먼저).
</details>

<details>
<summary>힌트 2 — 동시에 5개면 일부가 500</summary>

로그가 `Deadlock found`이고 문장이 키 행 `SELECT … FOR UPDATE`라면: 기다리던 요청들의 `INSERT IGNORE`가 중복을 만나며 그 행에 공유 잠금(S)을 쥐었고, 모두가 배타 잠금(X)으로 올리려다 서로 막혔다(T-023과 같은 모양). 읽기만 하니 `FOR SHARE`로 바꾼다.

뒤 요청이 처음 글을 `findById`로 못 찾는다면(404·NPE), 그 트랜잭션에서 키 처리 전에 일반 SELECT가 한 번 나갔기 때문이다 — 그때 잡힌 스냅샷에는 앞 요청이 나중에 커밋한 글이 없다. 키 처리를 맨 앞으로 옮긴다.
</details>
