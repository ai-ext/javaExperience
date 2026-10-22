# T-003. 게시판 글 목록 정렬 옵션

> 난이도 쉬움 · 유형 기존 API 변경 · DB community · 예상 30분

## 티켓

> **요청자** 프론트 팀 · **배경** 게시판 목록 위에 [최신순 · 좋아요순 · 조회순] 정렬 버튼을 단다. 지금 API는 최신순만 된다.

- 게시판 글 목록 API에 정렬 파라미터를 추가해 주세요. 안 보내면 지금처럼 최신순입니다.
- 좋아요 0개인 글이 많아서, 값이 같을 때 순서가 매번 바뀌면 페이지를 넘길 때 글이 겹치거나 빠집니다. 같으면 최신순으로 이어 주세요.
- 모르는 정렬 값은 조용히 무시하지 말고 400으로 알려 주세요(프론트 오타를 바로 알 수 있게).
- **완료 조건**: 정렬만 바뀌고 "볼 수 있는 글" 조건·전체 건수·페이지 응답 모양은 그대로다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 자유 게시판(`free`)에서 비로그인이 볼 수 있는 글은 13개다.

## 지금 코드

- 게시판 글 목록 API가 받는 파라미터와, 실제 쿼리를 조립하는 곳을 찾는다. 같은 쿼리 조립기를 조합 검색 API도 쓴다 — 검색 API의 동작은 바꾸지 않는다.
- 정렬 기준(`ORDER BY`)이 지금 어디에 고정돼 있는지 본다. 잘못된 검색 조건을 400으로 바꾸는 예외도 이미 하나 있다.

## 화면 시나리오

```screen
{
  "title": "자유 게시판 — 정렬 바꾸기",
  "summary": "정렬 버튼을 누르면 sort 파라미터만 바꿔 같은 목록 API를 다시 부른다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판" },
    { "type": "chips", "id": "sort", "label": "정렬", "items": ["최신순", "좋아요순", "조회순"] },
    {
      "type": "list",
      "id": "posts",
      "items": [
        { "id": "p4", "title": "주말 회고", "meta": "이스프링 · 좋아요 2" },
        { "id": "p14", "title": "자유글 03", "meta": "이스프링 · 좋아요 1" },
        { "id": "p12", "title": "자유글 01", "meta": "이스프링 · 좋아요 1" }
      ],
      "footer": "13개 중 1~5"
    },
    { "type": "toast", "id": "toast", "value": "정렬 값이 올바르지 않습니다", "tone": "error" }
  ],
  "flows": [
    {
      "name": "좋아요순",
      "steps": [
        { "kind": "user", "text": "[좋아요순]을 누른다", "focus": ["sort"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?sort=likes&size=5" },
        { "kind": "server", "text": "조건(볼 수 있는 글)은 그대로, 정렬만 좋아요 수 → 게시 시각 → id 내림차순으로 바꾼다" },
        { "kind": "db", "sql": "SELECT … FROM post p WHERE … ORDER BY p.like_count DESC, p.published_at DESC, p.id DESC LIMIT 5" },
        {
          "kind": "response",
          "status": 200,
          "body": "{\n  \"items\": [{\"id\": 4, ...}, {\"id\": 14, ...}, {\"id\": 12, ...}, {\"id\": 9, ...}, {\"id\": 5, ...}],\n  \"page\": 0, \"size\": 5, \"totalElements\": 13, \"totalPages\": 3, \"hasNext\": true\n}"
        },
        { "kind": "screen", "text": "좋아요 2개인 글이 맨 위, 좋아요 1개인 글들은 최신 글부터", "focus": ["posts", "p4"] }
      ]
    },
    {
      "name": "모르는 정렬 값",
      "steps": [
        { "kind": "user", "text": "프론트 코드 오타로 sort=hot을 보낸다", "focus": ["sort"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/posts?sort=hot" },
        { "kind": "server", "text": "정렬 값을 해석하다 모르는 값이면 잘못된 검색 조건 예외 → 400" },
        { "kind": "response", "status": 400, "body": "{\"title\": \"Bad Request\", \"status\": 400, \"detail\": \"sort는 latest·likes·views 중 하나여야 합니다.\"}" },
        { "kind": "screen", "text": "개발 중에 바로 오류가 보인다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/boards/{slug}/posts?page=&size=&sort=` — 기존 API에 `sort`만 추가 |
| `sort` 값 | `latest`(기본, 안 보내면 이것) · `likes` · `views` |
| 정렬 | `latest`: 게시 시각↓, id↓ (지금과 같다) / `likes`: 좋아요 수↓, 게시 시각↓, id↓ / `views`: 조회수↓, 게시 시각↓, id↓ |
| 모르는 값 | `400` (Problem Details, 다른 400과 같은 모양) |
| 그대로인 것 | 볼 수 있는 글 조건, `totalElements`·`totalPages`·`hasNext`, 항목 필드, `page`·`size` 검증, 조합 검색 API(`/api/posts/search`)의 정렬 |

- 좋아요 수·조회수는 글 테이블의 숫자 컬럼(`like_count`·`view_count`)을 쓴다(목록용 비정규화 컬럼 — 매번 행을 세지 않는다).
- DB 변화 없음.

## 직접 확인

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/boards/free/posts?sort=likes&size=5"           # 요청 A
curl -s "$BASE/api/boards/free/posts?sort=likes&size=5&page=1"    # 요청 B — 둘째 페이지(좋아요 0개 구간)
curl -s "$BASE/api/boards/free/posts?sort=views&size=5"           # 요청 C
curl -s "$BASE/api/boards/free/posts?size=5"                      # 요청 D — sort 없음 = 최신순
curl -i "$BASE/api/boards/free/posts?sort=hot"                    # 요청 E — 모르는 값
```

> 이 확인은 **처음 데이터**의 좋아요 수·조회수·글 수를 기대값으로 쓴다. 작업하면서 글을 열어 보거나(조회수 +1) 좋아요·글쓰기를 했다면 먼저 이 저장소 루트에서 `docker compose down -v && docker compose up -d`로 되돌린 뒤 누른다(세 DB가 모두 `docker/mysql/init/`의 처음 상태로 돌아간다).

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "좋아요순 1쪽", "method": "GET", "path": "/api/boards/free/posts?sort=likes&size=5" },
    { "id": "B", "title": "좋아요순 2쪽", "method": "GET", "path": "/api/boards/free/posts?sort=likes&size=5&page=1" },
    { "id": "C", "title": "조회순", "method": "GET", "path": "/api/boards/free/posts?sort=views&size=5" },
    { "id": "D", "title": "sort 없음", "method": "GET", "path": "/api/boards/free/posts?size=5" },
    { "id": "E", "title": "모르는 정렬 값", "method": "GET", "path": "/api/boards/free/posts?sort=hot" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [4, 14, 12, 9, 5] },
          { "path": "$.items[*].likeCount", "equals": [2, 1, 1, 1, 1] },
          { "path": "$.totalElements", "equals": 13 }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [21, 20, 19, 18, 17] }] }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [4, 21, 20, 5, 19] },
          { "path": "$.items[*].viewCount", "equals": [15, 10, 9, 9, 8] }
        ]
      }
    },
    {
      "id": "C4",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [21, 20, 19, 18, 17] },
          { "path": "$.totalElements", "equals": 13 },
          { "path": "$.hasNext", "equals": true }
        ]
      }
    },
    { "id": "C5", "request": "E", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `200`, id 순서 `4, 14, 12, 9, 5`(좋아요 `2, 1, 1, 1, 1`), 전체 13건 |
| C2 | 요청 B | 둘째 페이지가 `21, 20, 19, 18, 17` — 좋아요 0개 구간이 최신순으로 이어진다(값이 같을 때의 순서가 정해져 있다) |
| C3 | 요청 C | id 순서 `4, 21, 20, 5, 19`(조회수 `15, 10, 9, 9, 8` — 9가 같은 글 20·5는 최신 글이 먼저) |
| C4 | 요청 D | `sort`가 없으면 지금처럼 최신순 `21, 20, 19, 18, 17`, 전체 13건 |
| C5 | 요청 E | 상태 `400` |
| D1 | `SELECT id, like_count FROM post WHERE board_id = 4 AND status = 'PUBLISHED' AND visibility = 'PUBLIC' AND deleted_at IS NULL ORDER BY like_count DESC, published_at DESC, id DESC LIMIT 5` | `4 2` · `14 1` · `12 1` · `9 1` · `5 1` — 요청 A와 같은 순서 |
| R1 | 값 해석 | `sort` 문자열을 enum 같은 정해진 값으로 바꾼다. 문자열을 그대로 쿼리(정렬 컬럼 이름)에 이어 붙이지 않는다(임의 컬럼·SQL 주입) |
| R2 | 끝까지 정하는 정렬 | 모든 정렬이 `id`로 끝난다. 값이 같은 행의 순서를 DB에 맡기면 페이지가 겹치거나 빠진다는 것을 설명할 수 있다 |
| R3 | 영향 범위 | 조합 검색 API는 그대로 최신순이다(같은 쿼리 조립기를 쓰므로 기본값을 유지했다) |
| R4 | 인덱스 | 좋아요순·조회순은 지금 인덱스(`board_id, published_at, id`)를 못 타 정렬(filesort)이 생긴다는 걸 알고, 글이 많아지면 어떻게 할지 말할 수 있다 |

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 순서가 끝까지 정해져야 하는 이유(R2)
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — Criteria·정렬
- [R05 인덱스와 B-Tree](../docs/knowledge/R05-index-btree.md) — 정렬과 인덱스(R4)
- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 모르는 값을 무시할까 400일까

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 값 해석</summary>

`enum PostListSort { LATEST, LIKES, VIEWS }`와 `static PostListSort from(String raw)`. 모르는 값이면 이미 있는 "잘못된 검색 조건" 예외를 던지면 400 처리가 따라온다. 컨트롤러는 `@RequestParam(defaultValue = "latest") String sort`.
</details>

<details>
<summary>힌트 2 — 정렬 조립</summary>

쿼리 조립기의 `orderBy(...)`가 받는 `Order` 목록을 enum이 만들게 한다. 예: `LIKES`면 `cb.desc(post.get("likeCount")), cb.desc(post.get("publishedAt")), cb.desc(post.get("id"))`. 검색 API는 기존 메서드(기본 `LATEST`)를 그대로 부르게 둔다.
</details>
