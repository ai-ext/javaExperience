# T-020. 인기글 쿼리 — 기간 범위 인덱스

> 난이도 중급 · 유형 성능 · DB practice · 예상 60분

## 티켓

> **요청자** DBA · **배경** 운영 DB의 좋아요 테이블이 3천만 행을 넘자 메인 화면 "최근 7일 인기글" API가 2초 걸린다. 슬로우 쿼리 로그의 실행 계획을 보니 기간 조건이 있는데도 좋아요·댓글 테이블을 **처음부터 끝까지** 훑는다. 최근 7일 행은 전체의 몇 %뿐이다.

- 인기글 쿼리가 기간 안의 행만 읽도록 인덱스를 추가해 주세요. 결과(순위·점수)는 바뀌면 안 됩니다.
- 운영 DB라 스키마 변경은 Flyway 마이그레이션으로, 쓰기를 막지 않는 방식으로 합니다.
- 고치기 전후 실행 계획(`EXPLAIN`)을 남겨 리뷰에 붙여 주세요. 학습용 데이터(practice)는 작지만 실행 계획은 같은 모양으로 바뀐다.
- **완료 조건**: 두 집계 서브쿼리의 실행 계획이 `type=range` + 새 인덱스 + `Using index`(테이블 행을 읽지 않음)로 바뀌고, 응답은 그대로다.

**DB 시작 상태**: `practice` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드를 practice 프로파일로 켜면 Flyway가 V2~V6을 적용한다 — **다음 마이그레이션 번호는 V7**. practice 프로파일은 "지금"이 2026-10-05 00:00으로 고정이라 최근 7일은 `[2026-09-28, 2026-10-05)`, 그 안의 좋아요는 568행 중 53행, 댓글은 351행 중 18행이다.

## 지금 코드

- 인기글 쿼리(네이티브 SQL)를 찾아 두 서브쿼리를 따로 떼어 `EXPLAIN`을 돌려 본다. `type`·`key`·`rows`·`Extra`를 읽는다.
- 이미 인덱스를 추가한 마이그레이션이 하나 있다(같음 조건 + 정렬용). 이번 조건은 **같음이 아니라 범위**다 — 컬럼 순서를 어떻게 정할지가 다르다.

## 화면 시나리오

```screen
{
  "title": "메인 — 최근 7일 인기글",
  "summary": "화면은 그대로. 서버가 DB에 같은 결과를 더 적은 행을 읽어 받는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "홈", "right": "(비로그인)" },
    {
      "type": "list",
      "id": "popular",
      "label": "최근 7일 인기글",
      "items": [
        { "id": "p-145", "title": "스프링 트랜잭션 전파 삽질기", "meta": "61점" },
        { "id": "p-143", "title": "MySQL 인덱스 설계 실전 적용 후기", "meta": "61점" },
        { "id": "p-144", "title": "예외 처리 전략 정리", "meta": "10점" }
      ]
    },
    { "type": "code", "id": "plan", "label": "EXPLAIN (좋아요 서브쿼리)", "value": "전: type=index  key=uk_post_like  rows=568  Extra=Using where\n후: type=range  key=ix_post_like_created_post  rows=53  Extra=Using where; Using index; Using temporary" }
  ],
  "flows": [
    {
      "name": "인기글 열기",
      "steps": [
        { "kind": "user", "text": "메인 화면을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/popular?days=7" },
        { "kind": "server", "text": "기간 [지금-7일, 지금) 안의 좋아요·댓글을 글별로 세어 점수를 매긴다(쿼리는 그대로)" },
        { "kind": "db", "sql": "SELECT post_id, COUNT(*) FROM post_like WHERE created_at >= ? AND created_at < ? GROUP BY post_id", "note": "새 인덱스 (created_at, post_id)로 기간 안의 행만 범위로 읽고, 테이블 행에는 가지 않는다" },
        { "kind": "response", "status": 200, "body": "[{\"postId\": 145, \"score\": 61, …}, {\"postId\": 143, \"score\": 61, …}, …]" },
        { "kind": "screen", "text": "같은 순위", "focus": ["popular", "plan"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 마이그레이션 | `src/main/resources/db/migration/V7__<설명>.sql` 하나 — `post_like`·`comment`에 기간 집계용 인덱스. 온라인 DDL(`ALGORITHM = INPLACE, LOCK = NONE`) |
| 실행 계획 | 아래 D1·D2의 두 서브쿼리가 `type = range`, `key` = 새 인덱스, `Extra`에 `Using index` |
| 바꾸지 않을 것 | 인기글 SQL·API 응답(순위·점수·동점 규칙) |

## 직접 확인

```bash
BASE=http://localhost:8080   # practice 프로파일로 켠 앱

curl -s "$BASE/api/posts/popular?days=7"            # 요청 A — 순위가 그대로인지
curl -s "$BASE/api/posts/popular?days=7&limit=3"    # 요청 B
# 실행 계획은 아래 채점 기준의 D1·D2를 DB 클라이언트(CloudBeaver 등)에서 돌린다
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 성능 티켓이라 C 항목은 **응답이 그대로인지**(회귀)를 본다 — 기준 코드에서도 통과한다. 개선은 D 항목(실행 계획)으로 판정한다.

```check
{
  "requests": [
    { "id": "A", "title": "최근 7일 인기글", "method": "GET", "path": "/api/posts/popular?days=7" },
    { "id": "B", "title": "상위 3개", "method": "GET", "path": "/api/posts/popular?days=7&limit=3" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$[*].postId", "equals": [145, 143, 144, 140, 139, 138, 137, 136, 131, 114] },
          { "path": "$[*].score", "equals": [61, 61, 10, 9, 5, 3, 3, 3, 3, 3] }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$[0]", "equals": { "postId": 145, "title": "스프링 트랜잭션 전파 삽질기", "score": 61, "likes": 20, "comments": 1 } },
          { "path": "$", "length": 3 }
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
| C1 | 요청 A | 순위·점수가 고치기 전과 같다(145·143 동점 61, 최신이 먼저) |
| C2 | 요청 B | 응답 모양·`limit` 그대로 |
| D1 | `EXPLAIN SELECT post_id, COUNT(*) FROM post_like WHERE created_at >= '2026-09-28' AND created_at < '2026-10-05' GROUP BY post_id` | 고치기 전 `type=index key=uk_post_like rows=568` → 고친 뒤 `type=range`, `key`가 새 인덱스, `rows` 50 안팎, `Extra`에 `Using index` |
| D2 | `EXPLAIN SELECT post_id, COUNT(*) FROM comment WHERE deleted_at IS NULL AND created_at >= '2026-09-28' AND created_at < '2026-10-05' GROUP BY post_id` | 고치기 전 `type=index rows=351` → 고친 뒤 `type=range`, 새 인덱스, `Extra`에 `Using index` |
| D3 | `SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name IN ('post_like', 'comment') GROUP BY table_name, index_name HAVING cols LIKE 'created_at%'` | 두 테이블에 `created_at`이 **첫 번째**인 인덱스가 하나씩(예: `created_at,post_id` · `created_at,deleted_at,post_id`) |
| D4 | `SELECT version, success FROM flyway_schema_history WHERE version = '7'` | `7 1` 한 행 |
| R1 | 컬럼 순서 | 범위 조건 컬럼(`created_at`)을 앞에 두었다. `(post_id, created_at)` 순서라면 왜 기간만으로는 범위 탐색을 못 하는지, 범위 뒤의 컬럼은 탐색이 아니라 **커버링**에만 쓰인다는 것을 설명할 수 있다 |
| R2 | 커버링 | `Using index`가 무슨 뜻인지(테이블 행을 안 읽음), 댓글 인덱스에 `deleted_at`을 넣은(또는 안 넣은) 이유와 그 차이를 실행 계획으로 보여 줄 수 있다. `Using temporary`(GROUP BY)는 이 인덱스로 없어지지 않는 이유도 안다 |
| R3 | 운영 반영 | 온라인 DDL 옵션, 인덱스가 늘면 쓰기(좋아요 INSERT)가 조금 느려지는 대가, 작은 테이블에서는 옵티마이저가 인덱스를 안 쓸 수도 있다(통계·행 수)는 점을 말할 수 있다 |

## 필요한 지식

- [R05 인덱스와 B-Tree](../docs/knowledge/R05-index-btree.md) — 복합 인덱스 컬럼 순서, 범위 조건 뒤의 컬럼
- [S17 Spring Boot 애플리케이션 성능](../docs/knowledge/S17-performance-tuning.md) — `EXPLAIN` 읽기(type·key·rows·Extra)
- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — 운영 DB 스키마 변경을 마이그레이션으로

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 인덱스</summary>

조건은 `created_at` 범위 하나, 꺼내는 값은 `post_id`(그리고 댓글은 `deleted_at` 확인). 그래서 `(created_at, post_id)`, 댓글은 `(created_at, deleted_at, post_id)`. 기존 마이그레이션 V2처럼 `ALTER TABLE … ADD INDEX …, ALGORITHM = INPLACE, LOCK = NONE;` 뒤에 `ANALYZE TABLE`로 통계를 갱신한다.
</details>

<details>
<summary>힌트 2 — 전체 쿼리의 계획</summary>

인기글 SQL 전체에 `EXPLAIN`을 붙이면 두 서브쿼리가 `DERIVED` 줄로 나온다. 그 두 줄의 `type`·`key`가 D1·D2와 같아지면 된다. 바깥 `post` 쪽은 행이 145개뿐이라 이번 범위가 아니다.
</details>
