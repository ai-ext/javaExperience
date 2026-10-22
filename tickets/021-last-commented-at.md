# T-021. 글에 "마지막 댓글 시각" — 컬럼 추가와 다른 테이블에서 백필

> 난이도 중급 · 유형 스키마 변경 · DB practice · 예상 90분

## 티켓

> **요청자** 기획 · **배경** 질문 게시판에서 "답이 달린 지 오래된 질문"을 골라 보여 주고, 목록 카드에 "마지막 댓글 3일 전"을 붙이려 한다. 지금은 글마다 댓글 목록을 불러 가장 최근 것을 찾아야 한다.

- 글에 **마지막 댓글 시각**을 저장해 상세와 목록 응답에 내려 주세요. 기준은 **삭제되지 않은** 댓글(답글 포함) 중 가장 최근 작성 시각, 그런 댓글이 없으면 `null`입니다.
- 기존 글에도 값이 채워져 있어야 합니다(백필). 운영 DB이므로 Flyway 마이그레이션으로 합니다.
- 댓글이 달리거나 지워질 때 값이 맞게 바뀌어야 합니다 — 가장 최근 댓글이 지워지면 그 전 댓글 시각으로 돌아갑니다.
- **완료 조건**: 마이그레이션 직후와 댓글 작성·삭제 뒤 어느 시점에 봐도 모든 글의 값이 "살아 있는 댓글의 최댓값"과 같다.

**DB 시작 상태**: `practice` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드를 practice 프로파일로 켜면 Flyway가 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**. 댓글 351개 중 25개가 삭제돼 있고, 글 29처럼 **댓글이 지워진 것뿐인 글**이 5개, 글 100처럼 **가장 최근 댓글만 지워진 글**도 있다. 글 138은 댓글이 없다.

## 지금 코드

- 이미 "컬럼 추가 → 기존 행 채우기 → 제약"을 한 마이그레이션이 하나 있다. 그때는 같은 행의 값으로 채웠다. 이번에는 **다른 테이블(댓글)을 모아서** 채워야 한다.
- 댓글 작성·삭제가 글의 댓글 수(`comment_count`)를 어떻게 함께 바꾸는지 본다. 같은 트랜잭션, 같은 방식으로 새 값도 바꾼다.
- 글 응답 DTO가 여러 개다. 이번에 넣을 곳은 상세와 목록(검색 포함)이다.

## 화면 시나리오

```screen
{
  "title": "질문 게시판 — 카드의 마지막 댓글",
  "summary": "카드마다 마지막 댓글 시각을 보여 준다. 댓글이 지워지면 그 전 댓글 시각으로 돌아간다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판", "right": "리액트에서왔어요(회원 7)" },
    {
      "type": "list",
      "id": "posts",
      "items": [
        { "id": "p-97", "title": "글 97", "meta": "마지막 댓글 09-12 20:52" },
        { "id": "p-100", "title": "글 100", "meta": "마지막 댓글 09-19 16:23" },
        { "id": "p-138", "title": "글 138", "meta": "아직 댓글 없음" }
      ]
    },
    { "type": "actions", "id": "buttons", "items": [{ "id": "comment", "label": "댓글 달기", "variant": "primary" }, { "id": "delete", "label": "내 댓글 삭제", "variant": "danger" }] }
  ],
  "flows": [
    {
      "name": "댓글 달기 → 시각이 바뀐다",
      "steps": [
        { "kind": "user", "text": "글 97에 댓글을 단다", "focus": ["comment"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/97/comments",
          "headers": ["Authorization: Bearer tok-p07", "Content-Type: application/json"],
          "body": "{\"content\": \"[T-021] 아직 궁금해요\"}"
        },
        { "kind": "server", "text": "댓글 저장 + comment_count + 1 + 마지막 댓글 시각 갱신을 한 트랜잭션에서" },
        { "kind": "db", "sql": "UPDATE post SET last_commented_at = ? WHERE id = 97 AND (last_commented_at IS NULL OR last_commented_at < ?)" },
        { "kind": "response", "status": 201, "body": "{\"id\": 352, …}" },
        { "kind": "screen", "text": "카드의 '마지막 댓글'이 방금으로 바뀐다", "focus": ["p-97"] }
      ]
    },
    {
      "name": "가장 최근 댓글 삭제 → 그 전 시각으로",
      "steps": [
        { "kind": "user", "text": "방금 단 댓글을 지운다", "focus": ["delete"] },
        { "kind": "request", "method": "DELETE", "path": "/api/comments/352", "headers": ["Authorization: Bearer tok-p07"] },
        { "kind": "server", "text": "지운 댓글이 마지막이었을 수 있으니 살아 있는 댓글의 최댓값으로 다시 계산한다" },
        { "kind": "db", "sql": "UPDATE post SET last_commented_at = (SELECT MAX(created_at) FROM comment WHERE post_id = 97 AND deleted_at IS NULL) WHERE id = 97" },
        { "kind": "response", "status": 204 },
        { "kind": "screen", "text": "다시 '09-12 20:52'", "focus": ["p-97"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `V7__<설명>.sql` — `post.last_commented_at DATETIME NULL` 추가 + 기존 글 백필(삭제 안 된 댓글의 `MAX(created_at)`, 없으면 `NULL`). `NULL`은 "댓글 없음"이라는 뜻이라 `NOT NULL`로 바꾸지 않는다 |
| 응답 | 글 상세(`GET /api/posts/{id}`)와 목록 항목(게시판 목록·조합 검색)에 `lastCommentedAt`(없으면 `null`) |
| 댓글 작성 | 같은 트랜잭션에서 그 글의 값을 새 댓글 시각으로(더 최근일 때만) |
| 댓글 삭제 | 같은 트랜잭션에서 살아 있는 댓글의 최댓값으로 다시 계산(없으면 `null`) |

## 직접 확인

```bash
BASE=http://localhost:8080   # practice 프로파일로 켠 앱
J='Content-Type: application/json'; H='Authorization: Bearer tok-p07'

curl -s "$BASE/api/posts/97"      # 요청 A — "2026-09-12T20:52:13"
curl -s "$BASE/api/posts/100"     # 요청 N1 — 가장 최근 댓글이 지워진 글: "2026-09-19T16:23:34"
curl -s "$BASE/api/posts/29"      # 요청 N2 — 지워진 댓글뿐: null
curl -s "$BASE/api/posts/138"     # 요청 N3 — 댓글 없음: null
curl -s -X POST "$BASE/api/posts/97/comments" -H "$H" -H "$J" -d '{"content":"[T-021] 아직 궁금해요"}'   # 요청 B
curl -s "$BASE/api/posts/97"                                                                          # 요청 C — 바뀌었다
curl -s "$BASE/api/posts/search?author=4&from=2026-08-30&to=2026-08-30"                               # 요청 L — 목록에도(첫 항목이 97)
curl -i -X DELETE "$BASE/api/comments/{B의 id}" -H "$H"                                                # 요청 D
curl -s "$BASE/api/posts/97"                                                                          # 요청 E — 원래대로
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 단 댓글을 마지막에 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "글 97 — 처음", "method": "GET", "path": "/api/posts/97" },
    { "id": "N1", "title": "글 100 — 최근 댓글이 지워짐", "method": "GET", "path": "/api/posts/100" },
    { "id": "N2", "title": "글 29 — 지워진 댓글뿐", "method": "GET", "path": "/api/posts/29" },
    { "id": "N3", "title": "글 138 — 댓글 없음", "method": "GET", "path": "/api/posts/138" },
    { "id": "B", "title": "글 97에 댓글", "method": "POST", "path": "/api/posts/97/comments", "headers": { "Authorization": "Bearer tok-p07" }, "body": { "content": "[T-021] 아직 궁금해요" } },
    { "id": "C", "title": "글 97 — 댓글 단 뒤", "method": "GET", "path": "/api/posts/97" },
    { "id": "L", "title": "목록(검색)에서 글 97", "method": "GET", "path": "/api/posts/search?author=4&from=2026-08-30&to=2026-08-30" },
    { "id": "D", "title": "그 댓글 삭제", "method": "DELETE", "path": "/api/comments/{{B.body.id}}", "headers": { "Authorization": "Bearer tok-p07" } },
    { "id": "E", "title": "글 97 — 지운 뒤", "method": "GET", "path": "/api/posts/97" }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "equals": "2026-09-12T20:52:13" }] } },
    {
      "id": "C2",
      "all": [
        { "request": "N1", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "equals": "2026-09-19T16:23:34" }] } },
        { "request": "N2", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "type": "null" }] } },
        { "request": "N3", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "type": "null" }] } }
      ]
    },
    {
      "id": "C3",
      "all": [
        { "request": "B", "expect": { "status": 201 } },
        { "request": "C", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "type": "string" }, { "path": "$.lastCommentedAt", "notEquals": "2026-09-12T20:52:13" }] } }
      ]
    },
    {
      "id": "C4",
      "request": "L",
      "expect": { "status": 200, "json": [{ "path": "$.items[0].id", "equals": 97 }, { "path": "$.items[0].lastCommentedAt", "type": "string" }, { "path": "$.items[0].lastCommentedAt", "equals": "{{C.body.lastCommentedAt}}" }] }
    },
    {
      "id": "C5",
      "all": [
        { "request": "D", "expect": { "status": 204 } },
        { "request": "E", "expect": { "status": 200, "json": [{ "path": "$.lastCommentedAt", "equals": "2026-09-12T20:52:13" }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 백필된 값 `2026-09-12T20:52:13` |
| C2 | 요청 N1·N2·N3 | 최근 댓글이 지워진 글은 **그 전** 댓글 시각, 지워진 댓글뿐인 글·댓글 없는 글은 `null` — 백필이 삭제를 걸렀다 |
| C3 | 요청 B·C | 댓글을 달면 값이 바뀐다 |
| C4 | 요청 L | 목록(검색) 항목에도 같은 값 |
| C5 | 요청 D·E | 방금 단(가장 최근) 댓글을 지우면 원래 값으로 돌아간다 |
| D1 | `SELECT COUNT(*) FROM post p WHERE NOT (p.last_commented_at <=> (SELECT MAX(c.created_at) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL))` | `0` — 모든 글이 "살아 있는 댓글의 최댓값"과 같다(`<=>`는 NULL끼리도 같다고 본다). 버튼 확인을 몇 번 돌린 뒤에도 `0` |
| D2 | `SELECT COUNT(*) FROM post WHERE last_commented_at IS NULL` | `46` — 댓글 없는 41개 + 지워진 댓글뿐인 5개(지운 댓글까지 센 백필이면 41) |
| D3 | `SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'post' AND column_name = 'last_commented_at'` | `last_commented_at YES datetime` |
| D4 | `SELECT version, success FROM flyway_schema_history WHERE version = '7'` | `7 1` |
| R1 | 백필 SQL | 글마다 상관 서브쿼리를 도는 대신 `UPDATE post p JOIN (SELECT post_id, MAX(created_at) … GROUP BY post_id) c ON …`처럼 집계 한 번으로 채웠다(또는 둘을 비교해 말할 수 있다). 수백만 행이면 id 범위로 나눠 돌리는 이유도 안다 |
| R2 | 쓰기 경로 | 댓글 저장·삭제와 같은 트랜잭션에서, 읽고 계산해 엔티티에 넣지 않고 조건부 UPDATE(더 최근일 때만)·재계산 UPDATE로 바꿨다 — 동시에 댓글 두 개가 달려도 값이 뒤로 가지 않는다 |
| R3 | 비정규화 대가 | 이 값은 `comment_count`처럼 어긋날 수 있는 비정규화 값이다. 어긋날 수 있는 경로(직접 DB 수정, 나중에 생길 댓글 복구 기능 등)와 맞추는 방법(정합성 배치에 포함 등)을 말할 수 있다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — 마이그레이션으로 컬럼 추가·백필
- [R04 SQL CRUD와 JOIN](../docs/knowledge/R04-sql-crud-join.md) — 집계 서브쿼리를 JOIN한 UPDATE
- [R03 스키마·타입·제약](../docs/knowledge/R03-schema-types-constraints.md) — NULL의 뜻을 정하기(없음 vs 모름)
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 댓글 저장과 글 갱신을 한 단위로

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 마이그레이션</summary>

```sql
ALTER TABLE post ADD COLUMN last_commented_at DATETIME NULL;
UPDATE post p
  JOIN (SELECT post_id, MAX(created_at) AS m FROM comment WHERE deleted_at IS NULL GROUP BY post_id) c
    ON c.post_id = p.id
   SET p.last_commented_at = c.m;
```
`WHERE deleted_at IS NULL`을 빼면 D2가 41이 되고 C2(글 29·100)가 틀린다.
</details>

<details>
<summary>힌트 2 — 댓글 작성·삭제</summary>

글 저장소에 `@Modifying` 쿼리 두 개: 작성은 `UPDATE Post p SET p.lastCommentedAt = :at WHERE p.id = :id AND (p.lastCommentedAt IS NULL OR p.lastCommentedAt < :at)`, 삭제는 `UPDATE Post p SET p.lastCommentedAt = (SELECT MAX(c.createdAt) FROM Comment c WHERE c.post.id = :id AND c.deletedAt IS NULL) WHERE p.id = :id`. 댓글 서비스에서 `comment_count`를 바꾸는 바로 옆에서 부른다. 삭제 쪽은 soft delete가 DB에 먼저 반영돼야 하니(변경 감지는 커밋 때) 그 전에 flush하거나 순서를 맞춘다.
</details>
