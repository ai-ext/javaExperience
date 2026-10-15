# 9-2. 인덱스와 실행 계획

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

4-3의 "내가 좋아요한 글"은 회원의 좋아요를 시각 순으로 정렬한다. 4-3 기본 상태에서는 `member_id` 인덱스만 있는지 `SHOW INDEX`로 확인하고, 실제 계획에서 회원별 행 탐색과 정렬이 어떻게 처리되는지 직접 관찰한다. 작은 seed에서 빠르거나 `Using filesort`가 보인다는 사실만으로 대량 데이터의 지연을 단정하지 않는다.

**정렬 순서까지 담은 복합 인덱스**를 마이그레이션으로 추가하고, 같은 요청의 결과와 실행 계획을 전후 비교한다. 개선 여부는 실제 관측값으로 판단한다.

## 화면 시나리오

같은 API의 V2 전·후와 별도 실습 인덱스의 `INVISIBLE` 상태를 골라 비교한다. 계획·실제 수행값은 이 화면에 입력해 기록할 수 있지만 저장하거나 DB 명령을 실행하지는 않는다.

```screen
{
  "title": "같은 API, 다른 인덱스 상태",
  "summary": "API 응답을 유지하면서 계획의 추정값과 실제 실행 정보를 각각 확인한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "내가 좋아요한 글", "right": "회원 12" },
    { "type": "list", "id": "likes", "items": [{ "id": "l145", "title": "#145" }, { "id": "l143", "title": "#143" }, { "id": "l140", "title": "#140" }] },
    { "type": "code", "id": "before", "label": "EXPLAIN — V2 전 추정값", "value": "key / rows / Extra: 직접 기록" },
    { "type": "code", "id": "after", "label": "EXPLAIN ANALYZE — 실제 실행값", "value": "actual rows / loops / time: 직접 기록" }
  ],
  "flows": [
    {
      "name": "V2 전 — 같은 API의 기준 응답",
      "steps": [
        { "kind": "user", "text": "좋아요 탭을 연다", "focus": ["likes"] },
        { "kind": "request", "method": "GET", "path": "/api/me/likes?size=5", "headers": ["Authorization: Bearer tok-p12"] },
        { "kind": "db", "sql": "SELECT ... FROM post_like WHERE member_id = 12 ORDER BY created_at DESC, id DESC LIMIT 6", "note": "EXPLAIN 추정값과 EXPLAIN ANALYZE 실측을 각각 기록한다." },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\"items\": [145, 143, 140, 139, 142], ...}" },
        { "kind": "screen", "text": "실제 API 응답을 기준값으로 기록한다", "focus": ["likes", "before"] }
      ]
    },
    {
      "name": "V2 후 — 같은 API 응답 비교",
      "steps": [
        { "kind": "user", "text": "같은 탭을 다시 연다", "focus": ["likes"] },
        { "kind": "request", "method": "GET", "path": "/api/me/likes?size=5", "headers": ["Authorization: Bearer tok-p12"] },
        { "kind": "db", "sql": "CREATE INDEX ix_post_like_member_created ON post_like (member_id, created_at, id); ANALYZE TABLE post_like;", "note": "API 응답을 다시 비교한다. 인덱스 계획과 실행량은 직접 관찰한다." },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\"items\": [145, 143, 140, 139, 142], ...}" },
        { "kind": "screen", "text": "같은 API 결과인지 확인한 뒤 계획을 비교한다", "focus": ["likes", "after"] }
      ]
    }
  ]
}
```

```db-index-experiment
```

## 만들 것

| 할 일 | 내용 |
|---|---|
| V2 | `db/migration/V2__post_like_member_created_index.sql` |
| 인덱스 | 이름 `ix_post_like_member_created`, 컬럼 순서 `(member_id, created_at, id)` |
| 통계 | 같은 파일 끝에 `ANALYZE TABLE post_like;` — 옵티마이저 통계를 갱신한다. 새 인덱스 선택 여부는 갱신 전후 `EXPLAIN`으로 관찰한다 |
| JPA 조회 | `PostLikeRepository`의 실제 JOIN SQL을 관계 인덱스부터 읽게 하고, `MyLikeRow`에 응답에 필요한 열만 담는다. `LikeService`는 같은 커서·응답 순서를 유지한다 |
| MyBatis 조회 | `MyBatisLikeMapper.xml`의 같은 JOIN에 인덱스와 테이블 순서를 명시한다. `MyBatisLikeService`의 커서 규칙은 유지한다 |
| API | 4-3의 `GET /api/me/likes` 계약은 그대로. 실제 JOIN 쿼리도 새 인덱스에서 시작하도록 SQL을 바꾼다. 결과가 바뀌면 안 된다 |

바꾸기 전에 실행 계획부터 본다. [MySQL 8.4 EXPLAIN / EXPLAIN ANALYZE](https://dev.mysql.com/doc/refman/8.4/en/explain.html) · [ANALYZE TABLE](https://dev.mysql.com/doc/refman/8.4/en/analyze-table.html)

```sql
EXPLAIN SELECT l.id, l.post_id, l.created_at
FROM post_like l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
-- 이 실행의 key, rows, Extra를 기록한다. 결과는 seed·통계에 따라 달라질 수 있다.
```

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- `EXPLAIN`의 rows는 추정값이고 실행 시간은 아니다.
- `EXPLAIN ANALYZE`는 SELECT를 실제 실행하고 실행 계획에 실제 수행 정보를 덧붙인다. SELECT 결과 행과 API 응답은 별도 조회로 확인한다.
- `ANALYZE TABLE`은 테이블 통계를 갱신한다. `EXPLAIN ANALYZE`와 다른 명령이다.

<details>
<summary>Flyway / SQL</summary>

`V2__post_like_member_created_index.sql`: 인덱스 키 순서가 회원 조건과 정렬 요구에 맞는지 실행 계획으로 확인한다. 역방향 스캔 여부와 정렬 제거 여부는 MySQL 출력에서 관찰한다. 같은 파일의 `ANALYZE TABLE`은 통계 갱신이다.

```sql
ALTER TABLE post_like
    ADD INDEX ix_post_like_member_created (member_id, created_at, id),
    ALGORITHM = INPLACE, LOCK = NONE;
ANALYZE TABLE post_like;
```

기존 `fk_post_like_member` 인덱스는 이 단계에서 삭제하지 않는다. 파일 전문과 적용 뒤 `EXPLAIN`의 `key`·`Extra`를 대조한다.

</details>

<details>
<summary>Controller / 기존 GET 계약</summary>

`LikeController.java`는 4-3에서 만든 코드를 그대로 쓴다. Controller 전체는 아래 **선행·공통 파일**에서 열 수 있다.

```java
@GetMapping("/api/me/likes")
public MyLikesResponse myLikes(@RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
                               @RequestParam(required = false) String cursor,
                               @LoginMember AuthenticatedMember loginMember) {
    if (loginMember == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return likeService.myLikes(loginMember, size, cursor);
}
```

</details>

<details>
<summary>Service / 조회 결과와 커서</summary>

`LikeService.java`는 엔티티 대신 필요한 열만 담은 `MyLikeRow.java`를 받는다. `size + 1`개를 읽어 다음 페이지를 판단하므로 인덱스를 추가해도 HTTP 응답의 항목 순서는 바뀌지 않는다.

```java
List<MyLikeRow> rows = postLikeRepository.findMyLikes(
        loginMember.id(),
        after == null ? null : after.at(),
        after == null ? null : after.id(),
        size + 1);
boolean hasNext = rows.size() > size;
List<MyLikeRow> page = hasNext ? rows.subList(0, size) : rows;
```

</details>

<details>
<summary>JPA / 실제 Repository SQL</summary>

`PostLikeRepository.java`의 조회를 native SQL로 바꾼다. 단일 테이블 `EXPLAIN`만 확인하면 실제 JOIN에서 MySQL이 `post`부터 읽고 정렬할 수 있다.

좋아요 관계는 복합 인덱스로, 이어지는 글은 기본키로 읽게 지정한다. 양방향 차단은 각각의 `NOT EXISTS`로 검사해 `(blocker_id, blocked_id)` 인덱스를 쓴다.

`MyLikeRow.java`에는 필요한 열만 담는다. 공개·팔로우·차단·커서 조건은 Repository 전문에서 확인한다.

```sql
-- findMyLikes 실제 SQL 중 인덱스·JOIN 순서와 관련된 부분
FROM post_like l FORCE INDEX (ix_post_like_member_created)
STRAIGHT_JOIN post p FORCE INDEX (PRIMARY) ON p.id = l.post_id
STRAIGHT_JOIN member a ON a.id = p.author_id
WHERE l.member_id = :memberId
ORDER BY l.created_at DESC, l.id DESC
LIMIT :limit
```

</details>

<details>
<summary>MyBatis / 실제 Mapper SQL</summary>

MyBatis 경로도 같은 V2 마이그레이션을 적용한다. `MyBatisLikeMapper.xml`의 실제 JOIN에도 인덱스와 시작 테이블을 명시한다. `MyBatisLikeService.java`의 `size + 1`·커서 처리는 유지한다. 이 단계의 **MyBatis 대체 구현 코드**에서 전체 Mapper·Service 파일을 열 수 있다.

```sql
-- MyBatisLikeMapper.xml의 findMyLikes 중 인덱스와 관련된 조건만 발췌
FROM post_like l FORCE INDEX (ix_post_like_member_created)
STRAIGHT_JOIN post p FORCE INDEX (PRIMARY) ON p.id = l.post_id
STRAIGHT_JOIN member a ON a.id = p.author_id
WHERE l.member_id = #{memberId}
ORDER BY l.created_at DESC, l.id DESC
LIMIT #{limit}
```

</details>

## EXPLAIN 추정치와 실제 실행을 나눠 기록한다

`EXPLAIN`은 옵티마이저가 선택한 계획과 추정치를 보여 준다. `EXPLAIN ANALYZE`는 뒤의 `SELECT`를 실제 실행하고 각 iterator의 실제 시간·행 수·반복 횟수와 추정치를 함께 출력한다. 실행 횟수를 늘리거나 부하를 유발할 수 있으므로 이 연습에서는 읽기 전용 SELECT만 사용한다.

`ANALYZE TABLE post_like;`는 테이블 통계를 갱신하는 별도 명령이다. SELECT 실행 계획을 분석하는 `EXPLAIN ANALYZE`와 이름만 비슷하다. 통계 갱신 전후의 선택도 MySQL이 결정하므로, 실행 결과를 미리 정답으로 적지 않는다.

같은 DB·회원·파라미터로 다음 쿼리를 인덱스 추가 전과 후에 각각 실행한다. `EXPLAIN ANALYZE` 결과는 TREE 형식이다. `EXPLAIN` 결과와 API 응답을 함께 저장한다. 이 페이지의 API 조회 예시는 `FORCE INDEX`를 포함하므로 V2 인덱스를 INVISIBLE로 바꿔 API를 호출하지 않는다. 가시성 전환과 DROP/복원은 [DB-10 격리 성능 fixture](../db-query-journey/DB-10-performance-fixture.md)에서 연습한다.

```sql
-- 추정 계획: 실행하지 않는다
EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 6;

-- 실제 실행: 읽기 전용 SELECT만 사용
EXPLAIN ANALYZE
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 6;
```

| 측정 시점 | 인덱스 상태 | 추정 rows / 선택 key / 정렬 관련 표시 | 실제 rows / loops | actual time (ms) | API `postId` 순서 |
|---|---|---|---|---|---|
| V2 전 | `member_id` 인덱스 확인 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 |
| V2 후 | `(member_id, created_at, id)` 확인 | 직접 기록 | 직접 기록 | 직접 기록 | 직접 기록 |

작은 `practice` seed에서는 실제 시간 차이가 거의 없거나 오히려 측정 순서·캐시에 따라 달라질 수 있다. 대량 데이터에서 같은 API 핵심 조건을 추가로 측정하려면 [DB-10 격리 성능 fixture](../db-query-journey/DB-10-performance-fixture.md)를 사용한다. 이 fixture는 기존 seed와 분리된 MySQL 8.4 및 50만 행을 사용하며, API 전체 권한 JOIN을 재현하지 않는 측정 경로다. 문서에 기록된 한 번의 실제 관찰값과 학습자가 직접 실행해 얻은 결과를 구분한다. `EXPLAIN ANALYZE` 출력의 actual time도 한 번의 로컬 실행이지 서비스 응답시간 보장은 아니다.

### 진단 질문

1. `EXPLAIN`의 `rows` 추정은 `EXPLAIN ANALYZE`의 actual rows와 얼마나 다른가? 어느 단계에서 차이가 생겼나?
2. `loops`가 1보다 큰 iterator는 무엇을 반복하고 있나? JOIN 안쪽에서 반복된 행 수가 결과 행 수보다 큰 이유는 무엇인가?
3. `key`가 복합 인덱스로 바뀌었는가? 안 바뀌었다면 테이블 크기·선택도·쿼리 형태 중 어떤 이유를 의심할 수 있나?
4. `Using filesort` 또는 정렬 iterator가 사라졌는가? 남아 있다면 어떤 JOIN/정렬 단계 때문인지 확인했나?
5. 실행 계획과 응답 ID 순서를 모두 기록했나? 응답이 달라졌다면 쿼리 변경 중 어떤 조건이나 정렬이 빠졌나?

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

단일 테이블 계획만으로 실제 API의 성능을 판정하지 않는다. 같은 DB와 토큰으로 마이그레이션 전·후 `GET /api/me/likes?size=5`를 각각 보내 첫 페이지 ID와 응답 필드를 기록해 동등성을 확인한다. 첫 페이지의 JOIN·가시성 조건을 포함한 실행 계획도 본다(회원 12, `size=5`라 `LIMIT 6`). 아래 API 확인은 V2 인덱스가 VISIBLE인 상태에서 한다.

```sql
EXPLAIN SELECT l.id AS like_id, p.id AS post_id, p.title,
               a.id AS author_id, a.nickname AS author_nickname, l.created_at AS liked_at
FROM post_like l FORCE INDEX (ix_post_like_member_created)
STRAIGHT_JOIN post p FORCE INDEX (PRIMARY) ON p.id = l.post_id
STRAIGHT_JOIN member a ON a.id = p.author_id
WHERE l.member_id = 12
  AND p.deleted_at IS NULL AND p.status = 'PUBLISHED'
  AND (p.visibility = 'PUBLIC' OR p.author_id = 12
       OR EXISTS (SELECT 1 FROM follow f
                  WHERE f.follower_id = 12 AND f.followee_id = p.author_id))
  AND NOT EXISTS (SELECT 1 FROM member_block b
                  WHERE b.blocker_id = 12 AND b.blocked_id = p.author_id)
  AND NOT EXISTS (SELECT 1 FROM member_block b
                  WHERE b.blocker_id = p.author_id AND b.blocked_id = 12)
ORDER BY l.created_at DESC, l.id DESC LIMIT 6;
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "회원 12의 좋아요 목록(size=5)",
      "method": "GET",
      "path": "/api/me/likes?size=5",
      "headers": {
        "Authorization": "Bearer tok-p12"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              145,
              143,
              140,
              139,
              142
            ]
          }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT·SHOW·EXPLAIN만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema = 'practice' AND table_name = 'post_like' AND index_name = 'ix_post_like_member_created'` | `member_id,created_at,id` |
| D2 | 위 `EXPLAIN` | 실제 `key`, `rows`, `Extra`를 기록한다. 복합 인덱스가 선택되는지와 정렬 처리를 설명한다. 계획 출력은 MySQL 버전·통계·데이터에 따라 달라질 수 있다. |
| D3 | `SELECT version, success FROM flyway_schema_history WHERE version = '2'` | `2`, `1` |
| D4 | 위 실제 API 첫 페이지 JOIN `EXPLAIN` | 실제 조인 순서·각 테이블의 `key`·접근 방식·추정 rows를 기록하고 SQL 조건과 대조한다. 특정 순서·키를 환경 공통의 고정 정답으로 간주하지 않는다. |
| C1 | `GET /api/me/likes?size=5`(`tok-p12`) | `200`, `postId` 순서 `145, 143, 140, 139, 142` — 인덱스를 바꿔도 결과는 같다 |
| R1 | 컬럼 순서 | 왜 `member_id`가 맨 앞이고 정렬 컬럼이 뒤인지(같음 조건 → 정렬 순서) 설명할 수 있다 |
| R2 | 기존 인덱스 | `member_id` 하나짜리 외래키 인덱스를 지워도 되는지 판단했다(새 인덱스의 맨 앞이 `member_id`라 외래키가 대신 쓸 수 있다). 지웠다면 별도 마이그레이션으로 |
| R3 | 운영 고려 | 큰 테이블에 인덱스를 만들 때 잠금·시간 문제가 있다는 것(MySQL 온라인 DDL, `ALGORITHM=INPLACE, LOCK=NONE`)을 안다 |

## 필요한 지식

- [DB-10 격리 성능 fixture](../db-query-journey/DB-10-performance-fixture.md) — API 핵심 조회 조건을 별도 MySQL 8.4·50만 행에서 EXPLAIN, 인덱스 생성, INVISIBLE, 복원·삭제까지 확인한다. V2 API 인덱스와 practice seed는 건드리지 않는다.
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 복합 인덱스와 정렬
- [R05 — 후보 인덱스를 만들고 계획을 비교한다](../../docs/knowledge/R05-index-btree.md#2단계-후보-인덱스를-만들고-계획을-비교한다)
- [W15 — MySQL에서 실제 계획을 비교한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#mysql에서-실제-계획을-비교한다)
- [S17 Spring Boot 애플리케이션 성능](../../docs/knowledge/S17-performance-tuning.md)

## 다음 단계

[9-3. 컬럼 추가와 백필](9-3-add-column-backfill.md)
