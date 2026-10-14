# T-004. 아주 큰 페이지 번호에 엉뚱한 글·500

> 난이도 쉬움 · 유형 버그 · DB community · 예상 25분

## 티켓

> **요청자** 운영(모니터링 알림) · **배경** 새벽에 크롤러가 `page=2147483647`로 목록을 긁으면서 500이 수십 건 났다. 확인해 보니 `page=429496730&size=10`은 500도 안 나고 **첫 페이지 근처의 글**을 돌려준다(빈 목록이어야 하는데).

- 게시판 글 목록과 조합 검색 두 API 모두 해당됩니다.
- 팀 결정: 페이지 번호는 **0~1000**만 받는다(그 뒤를 보는 사람은 없다 — 더 보려면 검색 조건을 좁힌다). 넘으면 `size` 범위를 벗어났을 때처럼 400.
- **완료 조건**: 어떤 page 값에도 500이나 "다른 페이지의 글"이 나오지 않는다. 정상 페이지 동작은 그대로.

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 자유 게시판(`free`)에서 비로그인이 볼 수 있는 글은 13개다.

## 지금 코드

- 먼저 재현한다: 아래 요청 A·B를 기준 코드에 보내고, 500이 날 때 서버 로그의 예외 메시지를 읽는다.
- 목록·검색이 함께 쓰는 쿼리 조립기가 OFFSET(몇 번째 행부터)을 어떻게 넘기는지 본다. `page × size`가 어떤 타입으로 계산되고 어떤 타입으로 바뀌는지가 핵심이다.
- `size` 상한은 이미 걸려 있다. 같은 방식으로 `page`에도 걸 수 있다.

## 화면 시나리오

```screen
{
  "title": "자유 게시판 — 주소창에 page를 직접 넣으면",
  "summary": "프론트는 page를 1000까지만 만들지만, 주소를 직접 고치거나 크롤러가 보내는 값은 막을 수 없다. 서버가 판정한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판" },
    {
      "type": "list",
      "id": "posts",
      "items": [
        { "id": "p17", "title": "자유글 06", "meta": "박디비 · 2026-09-30" },
        { "id": "p16", "title": "자유글 05", "meta": "이스프링 · 2026-09-29" }
      ],
      "footer": "page 429496730"
    },
    { "type": "toast", "id": "toast", "value": "잘못된 페이지 번호입니다", "tone": "error" }
  ],
  "flows": [
    {
      "name": "지금(버그) — 엉뚱한 글",
      "steps": [
        { "kind": "user", "text": "주소창에 ?page=429496730&size=10을 넣는다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?page=429496730&size=10" },
        { "kind": "server", "text": "429496730 × 10 = 4294967300(long)인데 int로 바뀌며 넘쳐서 OFFSET 4가 된다" },
        { "kind": "db", "sql": "SELECT … ORDER BY p.published_at DESC, p.id DESC LIMIT 10 OFFSET 4", "note": "원래는 OFFSET 4294967300 — 결과 0건이어야 한다" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 17, ...}, {\"id\": 16, ...}, ...], \"page\": 429496730, ...}" },
        { "kind": "screen", "text": "아주 뒤 페이지인데 다섯 번째 최신 글부터 보인다", "focus": ["posts", "p17"] }
      ]
    },
    {
      "name": "고친 뒤 — 상한 넘음",
      "steps": [
        { "kind": "user", "text": "주소창에 ?page=2147483647을 넣는다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?page=2147483647" },
        { "kind": "server", "text": "page가 0~1000을 벗어나 컨트롤러 입력 검증에서 막힌다 — 쿼리까지 가지 않는다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, ...}" },
        { "kind": "screen", "text": "오류 안내 후 첫 페이지로 돌려보낸다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/boards/{slug}/posts`, `GET /api/posts/search` |
| `page` 범위 | `0` ~ `1000`. 벗어나면 `400`(`size` 범위 위반과 같은 처리) |
| 넘침 | 어떤 `page`·`size` 조합에도 OFFSET이 넘쳐 음수(500)나 작은 값(다른 페이지의 글)이 되지 않는다 |
| 그대로인 것 | 정상 페이지의 결과·순서·`totalElements`, `page=1000`처럼 범위 안이지만 글이 없는 페이지는 `200`과 빈 `items` |

- DB 변화 없음.

## 직접 확인

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/boards/free/posts?page=429496730&size=10"   # 요청 A — 지금: 엉뚱한 글
curl -i "$BASE/api/boards/free/posts?page=2147483647"           # 요청 B — 지금: 500
curl -i "$BASE/api/posts/search?page=2147483647"                # 요청 C — 검색도 500
curl -i "$BASE/api/boards/free/posts?page=1001"                 # 요청 D — 상한 바로 위
curl -s "$BASE/api/boards/free/posts?page=1000"                 # 요청 E — 상한(빈 목록)
curl -s "$BASE/api/boards/free/posts?page=1&size=5"             # 요청 F — 정상 페이지
```

> 이 확인은 **처음 데이터**의 좋아요 수·조회수·글 수를 기대값으로 쓴다. 작업하면서 글을 열어 보거나(조회수 +1) 좋아요·글쓰기를 했다면 먼저 `bash scripts/java-db.sh --reset`으로 되돌린 뒤 누른다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "page × size가 int를 넘음", "method": "GET", "path": "/api/boards/free/posts?page=429496730&size=10" },
    { "id": "B", "title": "page = int 최댓값(목록)", "method": "GET", "path": "/api/boards/free/posts?page=2147483647" },
    { "id": "C", "title": "page = int 최댓값(검색)", "method": "GET", "path": "/api/posts/search?page=2147483647" },
    { "id": "D", "title": "상한 바로 위", "method": "GET", "path": "/api/boards/free/posts?page=1001" },
    { "id": "E", "title": "상한(빈 목록)", "method": "GET", "path": "/api/boards/free/posts?page=1000" },
    { "id": "F", "title": "정상 둘째 페이지", "method": "GET", "path": "/api/boards/free/posts?page=1&size=5" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "anyOf": [
          { "status": 400 },
          { "status": 200, "json": [{ "path": "$.items", "length": 0 }] }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "B",
          "expect": { "anyOf": [{ "status": 400 }, { "status": 200, "json": [{ "path": "$.items", "length": 0 }] }] }
        },
        {
          "request": "C",
          "expect": { "anyOf": [{ "status": 400 }, { "status": 200, "json": [{ "path": "$.items", "length": 0 }] }] }
        }
      ]
    },
    { "id": "C3", "request": "D", "expect": { "status": 400 } },
    {
      "id": "C4",
      "request": "E",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items", "length": 0 },
          { "path": "$.page", "equals": 1000 },
          { "path": "$.totalElements", "equals": 13 }
        ]
      }
    },
    {
      "id": "C5",
      "request": "F",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [16, 15, 14, 13, 12] },
          { "path": "$.hasNext", "equals": true }
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
| C1 | 요청 A | `400`(또는 `200`이면 빈 `items`) — 다른 페이지의 글이 나오지 않는다 |
| C2 | 요청 B·C | 목록·검색 모두 `400`(또는 `200`이면 빈 `items`) — 500이 아니다 |
| C3 | 요청 D | `400` — 팀이 정한 상한(1000)을 지킨다 |
| C4 | 요청 E | `200`, 빈 `items`, `page` 1000, 전체 13건 그대로 |
| C5 | 요청 F | 정상 페이지는 그대로 `16, 15, 14, 13, 12` |
| D1 | `SELECT COUNT(*) FROM post WHERE board_id = 4 AND status = 'PUBLISHED' AND visibility = 'PUBLIC' AND deleted_at IS NULL` | `13` — 요청 E의 `totalElements`와 같다. 13건이면 `size=10`의 마지막 페이지는 1이다 |
| R1 | 원인 | `(int)` 캐스팅이 넘치면 예외 없이 값이 바뀐다(4294967300 → 4)는 것을 설명할 수 있다. 500보다 "틀린 데이터 200"이 더 위험한 이유도 |
| R2 | 고친 곳 | 입력 경계(컨트롤러 파라미터 검증)에서 막았다. 두 API에 같은 상한을 쓰도록 한 곳에 상수로 두면 더 좋다 |
| R3 | 이중 방어 | 쿼리 쪽도 넘치면 조용히 잘리지 않게(`Math.toIntExact` 등) 했거나, 상한 덕분에 넘칠 수 없다는 근거(1000 × 50)를 댈 수 있다 |
| R4 | 재현 먼저 | 고치기 전에 요청으로 재현하고 로그의 예외(`First result cannot be negative`)를 확인했다 |

## 필요한 지식

- [J01 기본 타입·참조 타입·박싱·String](../docs/knowledge/J01-types-string.md) — int 범위와 넘침(오버플로)
- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 아주 뒤 페이지가 왜 비싸고, 왜 상한을 두나
- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 입력 경계에서 막기
- [D05 디버깅 방법론](../docs/knowledge/D05-debugging-methodology.md) — 재현 → 관찰 → 가설 → 검증

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 숫자 계산</summary>

`PageRequest.getOffset()`은 `long`이다(429496730 × 10 = 4294967300). 그걸 `(int)`로 바꾸면 2³²(4294967296)를 뺀 4가 된다. `page=2147483647`(size 10)이면 음수가 되어 Hibernate가 예외를 던진다.
</details>

<details>
<summary>힌트 2 — 고치기</summary>

`size`에 이미 붙어 있는 `@Max(50)`처럼 `page`에 `@Max(1000)`을 붙인다(두 컨트롤러). 숫자는 상수 하나로 둔다. 쿼리 쪽 `(int)`는 `Math.toIntExact(...)`로 바꾸면 넘칠 때 조용히 틀리지 않고 예외로 드러난다.
</details>
