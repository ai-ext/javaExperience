# T-012. 팔로잉 피드 API

> 난이도 중급 · 유형 새 API · DB community · 예상 75분

## 티켓

> **요청자** 기획 · **배경** 홈 화면에 "내 피드" 탭을 만든다. 내가 팔로우하는 사람들의 글과 내 글을 최신순으로 한 줄로 보여 주고, 아래로 내리면 이어서 더 불러온다(무한 스크롤).

- 피드 API를 만들어 주세요. 대상은 **내가 팔로우하는 회원의 글 + 내 글**, 그중 지금 내가 볼 수 있는 게시된 글입니다.
- 무한 스크롤이라 페이지 번호가 아니라 "여기까지 받았다"는 커서로 이어 받습니다. 스크롤하는 사이 새 글이 올라와도 이미 본 글이 다음 묶음에 다시 나오면 안 됩니다.
- 팔로우한 사람이 몇 명이든 요청 한 번에 쿼리 수가 늘어나면 안 됩니다(팔로잉 200명인 회원도 있다).
- **완료 조건**: 마지막 묶음까지 내리면 글이 빠지거나 겹치지 않고, 더 없으면 커서가 `null`이다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 김자바(회원 2)는 이스프링(회원 3)만 팔로우하고 자기 글은 없다. 박디비(회원 4)는 아무도 팔로우하지 않는다.

## 지금 코드

- 커서(키셋) 페이징 응답과 커서 인코딩은 이미 "내 것" 목록 두 곳에서 쓴다. 같은 모양을 따른다.
- 목록 항목 응답 DTO와 "볼 수 있는 글" 조건도 이미 있다. 이번 대상(팔로우 + 나)에서 그 조건 중 무엇이 필요하고 무엇이 저절로 만족되는지 따져 본다.

## 화면 시나리오

```screen
{
  "title": "홈 — 내 피드",
  "summary": "처음 열면 10개를 받고, 바닥에 닿으면 마지막으로 받은 커서를 붙여 다음 묶음을 받는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "내 피드", "right": "김자바" },
    {
      "type": "list",
      "id": "feed",
      "items": [
        { "id": "f-20", "title": "자유글 09", "meta": "이스프링 · 10-03" },
        { "id": "f-18", "title": "자유글 07", "meta": "이스프링 · 10-01" },
        { "id": "f-16", "title": "자유글 05", "meta": "이스프링 · 09-29" },
        { "id": "f-14", "title": "자유글 03", "meta": "이스프링 · 09-27" }
      ],
      "footer": "더 불러오는 중…"
    },
    { "type": "text", "id": "end", "value": "모두 봤어요", "emphasis": "caption", "tone": "muted" }
  ],
  "flows": [
    {
      "name": "처음 열기",
      "steps": [
        { "kind": "user", "text": "홈의 [내 피드] 탭을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/me/feed?size=4", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "팔로우하는 회원과 나의 게시된 글을 최신순으로 size+1개 읽어 다음 묶음이 있는지 판단한다" },
        { "kind": "db", "sql": "SELECT … FROM post p WHERE (p.author_id = 2 OR EXISTS (SELECT 1 FROM follow f WHERE f.follower_id = 2 AND f.followee_id = p.author_id)) AND … ORDER BY p.published_at DESC, p.id DESC LIMIT 5" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 20, …}, {\"id\": 18, …}, {\"id\": 16, …}, {\"id\": 14, …}], \"nextCursor\": \"MjAyNi0wOS0yN1QwOTowMHwxNA\"}" },
        { "kind": "screen", "text": "글 4개가 그려진다", "focus": ["feed"] }
      ]
    },
    {
      "name": "바닥까지 내리기",
      "steps": [
        { "kind": "user", "text": "목록 바닥에 닿는다", "focus": ["feed"] },
        { "kind": "request", "method": "GET", "path": "/api/me/feed?size=4&cursor=MjAyNi0wOS0yN1QwOTowMHwxNA", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "커서의 (published_at, id)보다 앞선 글만 — OFFSET이 아니라서 그사이 새 글이 생겨도 밀리지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 12, …}, {\"id\": 11, …}, {\"id\": 6, …}, {\"id\": 4, …}], \"nextCursor\": \"…\"}" },
        { "kind": "screen", "text": "이어서 4개가 붙고, 마지막 묶음에서 nextCursor가 null이면 '모두 봤어요'", "focus": ["feed", "end"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/me/feed?size=10&cursor=` |
| 인증 | **필수** — 토큰 없으면 `401` |
| 대상 | 작성자가 **나** 이거나 **내가 팔로우하는 회원**인 글 중 `PUBLISHED`·삭제 안 됨·나와 차단 관계 아님(팔로워 공개 글은 포함 — 팔로우 중이니까) |
| 정렬 | `published_at DESC, id DESC` |
| 페이징 | 키셋 커서 — 기존 "내 것" 목록과 같은 커서 형식. `size` 1~50(기본 10), 범위 밖이면 `400`, 깨진 커서 `400` |
| 응답 `200` | `{ "items": [게시판 글 목록 항목과 같은 모양], "nextCursor": "…" 또는 null }` |

- DB 변화 없음(조회만).

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

curl -s "$BASE/api/me/feed?size=4" -H "$H"                        # 요청 A1 — nextCursor를 복사해 둔다
curl -s "$BASE/api/me/feed?size=4&cursor={A1의 nextCursor}" -H "$H"  # 요청 A2
curl -s "$BASE/api/me/feed?size=4&cursor={A2의 nextCursor}" -H "$H"  # 요청 A3 — 마지막
curl -s "$BASE/api/me/feed" -H 'Authorization: Bearer tok-park'    # 요청 B — 팔로우 없음 = 내 글만
curl -i "$BASE/api/me/feed"                                         # 요청 C — 토큰 없음
curl -i "$BASE/api/me/feed?cursor=abc" -H "$H"                      # 요청 D — 깨진 커서
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A1", "title": "첫 묶음", "method": "GET", "path": "/api/me/feed?size=4", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "A2", "title": "두 번째 묶음", "method": "GET", "path": "/api/me/feed?size=4&cursor={{A1.body.nextCursor}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "A3", "title": "마지막 묶음", "method": "GET", "path": "/api/me/feed?size=4&cursor={{A2.body.nextCursor}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "B", "title": "팔로우 없는 박디비", "method": "GET", "path": "/api/me/feed", "headers": { "Authorization": "Bearer tok-park" } },
    { "id": "C", "title": "토큰 없음", "method": "GET", "path": "/api/me/feed" },
    { "id": "D", "title": "깨진 커서", "method": "GET", "path": "/api/me/feed?cursor=abc", "headers": { "Authorization": "Bearer tok-kimjava" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A1",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[*].id", "equals": [20, 18, 16, 14] },
          { "path": "$.nextCursor", "type": "string" },
          { "path": "$.items[0].author", "equals": { "id": 3, "nickname": "이스프링" } },
          { "path": "$.items[0].excerpt", "type": "string" }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        { "request": "A2", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [12, 11, 6, 4] }, { "path": "$.nextCursor", "type": "string" }] } },
        { "request": "A3", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [2] }, { "path": "$.nextCursor", "type": "null" }] } }
      ]
    },
    {
      "id": "C3",
      "request": "B",
      "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [21, 19, 17, 15, 13, 5, 3] }, { "path": "$.nextCursor", "type": "null" }] }
    },
    {
      "id": "C4",
      "all": [
        { "request": "C", "expect": { "status": 401 } },
        { "request": "D", "expect": { "status": 400 } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A1 | `200`, 첫 4개 `20, 18, 16, 14`, `nextCursor` 문자열, 항목은 목록과 같은 모양(작성자·요약) |
| C2 | 요청 A2·A3 | `12, 11, 6, 4`(6은 팔로워 공개 글) → `2`, 마지막은 `nextCursor: null` — 빠지거나 겹친 글 없음 |
| C3 | 요청 B | 팔로우가 없으면 내 글만: `21, 19, 17, 15, 13, 5, 3` — 내 임시저장(7)·숨김(10) 글은 없다 |
| C4 | 요청 C·D | 토큰 없음 `401`, 깨진 커서 `400` |
| D1 | `SELECT p.id FROM post p WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND (p.author_id = 2 OR p.author_id IN (SELECT followee_id FROM follow WHERE follower_id = 2)) ORDER BY p.published_at DESC, p.id DESC` | `20 18 16 14 12 11 6 4 2` — A1~A3을 이은 것과 같다 |
| R1 | 쿼리 한 번 | 팔로잉 목록을 읽어 회원마다 글을 따로 조회한 뒤 자바에서 합치지 않고, 팔로우 조건(EXISTS·IN 서브쿼리)을 넣은 쿼리 하나 + 태그 묶음 조회로 끝낸다 |
| R2 | 커서 | 정렬 키 `(published_at, id)` 둘 다 커서에 담고 `<` 비교를 두 열로 했다(같은 시각 글이 있어도 겹치거나 빠지지 않는다). OFFSET이면 스크롤 중 새 글이 생길 때 무엇이 깨지는지 말할 수 있다 |
| R3 | 조건 정리 | 작성자가 나·팔로잉뿐이라 "팔로워 공개" 조건은 저절로 만족되지만, 차단은 따로 걸어야 한다(내가 팔로우한 뒤에 상대가 나를 차단할 수 있다)는 것을 설명할 수 있다 |

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 무한 스크롤에 커서를 쓰는 이유(R2)
- [R04 SQL CRUD와 JOIN](../docs/knowledge/R04-sql-crud-join.md) — EXISTS·IN 서브쿼리로 "팔로우하는 사람" 조건 걸기(R1)
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — JPQL + `Pageable`로 size+1개 읽기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 조건</summary>

`(작성자 = 나 OR EXISTS (SELECT 1 FROM Follow f WHERE f.follower.id = :me AND f.followee = p.author))` + `p.deletedAt IS NULL AND p.status = 'PUBLISHED'` + 차단 `NOT EXISTS`(양방향). 작성자는 `JOIN FETCH`로 함께 읽고, 태그는 이미 켜 둔 batch fetch가 한 번에 읽는다.
</details>

<details>
<summary>힌트 2 — 커서</summary>

내가 좋아요한 글 목록과 같은 방법이다: 커서가 없으면 첫 묶음, 있으면 `(p.publishedAt < :at OR (p.publishedAt = :at AND p.id < :id))`. `PageRequest.of(0, size + 1)`로 하나 더 읽어 다음 묶음 여부를 정하고, 마지막 항목의 `(publishedAt, id)`로 `nextCursor`를 만든다.
</details>
