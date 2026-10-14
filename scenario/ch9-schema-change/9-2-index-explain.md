# 9-2. 인덱스와 실행 계획

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

4-3의 "내가 좋아요한 글"은 회원의 좋아요를 시각 순으로 정렬한다. `post_like`에는 `member_id` 인덱스(외래키용)만 있어서, MySQL이 그 회원의 행을 다 읽은 뒤 따로 정렬한다(`Using filesort`). 좋아요가 수십만 개면 느려진다.

**정렬 순서까지 담은 복합 인덱스**를 마이그레이션으로 추가하고, 실행 계획이 바뀐 것을 확인한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "좋아요 탭이 느려졌다",
  "summary": "화면·응답은 그대로, 실행 계획만 바뀐다. 정렬 순서까지 담은 복합 인덱스.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "내가 좋아요한 글",
      "right": "회원 12"
    },
    {
      "type": "list",
      "id": "likes",
      "items": [
        {
          "id": "l145",
          "title": "#145"
        },
        {
          "id": "l143",
          "title": "#143"
        },
        {
          "id": "l140",
          "title": "#140"
        }
      ]
    },
    {
      "type": "code",
      "id": "before",
      "label": "EXPLAIN — 인덱스 전",
      "value": "key: fk_post_like_member\nExtra: Using filesort"
    },
    {
      "type": "code",
      "id": "after",
      "label": "EXPLAIN — V2 적용 + ANALYZE 후",
      "value": "key: ix_post_like_member_created\nExtra: Backward index scan"
    }
  ],
  "flows": [
    {
      "name": "인덱스 전",
      "steps": [
        {
          "kind": "user",
          "text": "좋아요 탭을 연다",
          "focus": [
            "likes"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/likes?size=5",
          "headers": [
            "Authorization: Bearer tok-p12"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post_like l WHERE l.member_id = 12 ORDER BY l.created_at DESC, l.id DESC LIMIT 6",
          "note": "member_id로 찾고 나서 따로 정렬(filesort)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [145, 143, 140, 139, 142], ...}"
        },
        {
          "kind": "screen",
          "text": "좋아요가 수십만 개면 여기서 느려진다",
          "focus": [
            "before"
          ]
        }
      ]
    },
    {
      "name": "인덱스 후",
      "steps": [
        {
          "kind": "user",
          "text": "같은 탭을 연다",
          "focus": [
            "likes"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/likes?size=5",
          "headers": [
            "Authorization: Bearer tok-p12"
          ]
        },
        {
          "kind": "db",
          "sql": "-- V2__post_like_member_created_index.sql\nCREATE INDEX ix_post_like_member_created ON post_like (member_id, created_at, id);\nANALYZE TABLE post_like;",
          "note": "통계를 갱신하지 않으면 MySQL이 새 인덱스를 안 쓸 수 있다(실측)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [145, 143, 140, 139, 142], ...}"
        },
        {
          "kind": "screen",
          "text": "결과는 같고 정렬이 인덱스 순서 그대로 읽힌다",
          "focus": [
            "after",
            "likes"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 할 일 | 내용 |
|---|---|
| V2 | `db/migration/V2__post_like_member_created_index.sql` |
| 인덱스 | 이름 `ix_post_like_member_created`, 컬럼 순서 `(member_id, created_at, id)` |
| 통계 | 같은 파일 끝에 `ANALYZE TABLE post_like;` — 통계가 오래되면 MySQL이 새 인덱스를 안 쓰는 경우가 있다(실제로 이 데이터에서 그랬다) |
| JPA 조회 | `PostLikeRepository`의 실제 JOIN SQL을 관계 인덱스부터 읽게 하고, `MyLikeRow`에 응답에 필요한 열만 담는다. `LikeService`는 같은 커서·응답 순서를 유지한다 |
| MyBatis 조회 | `MyBatisLikeMapper.xml`의 같은 JOIN에 인덱스와 테이블 순서를 명시한다. `MyBatisLikeService`의 커서 규칙은 유지한다 |
| API | 4-3의 `GET /api/me/likes` 계약은 그대로. 실제 JOIN 쿼리도 새 인덱스에서 시작하도록 SQL을 바꾼다. 결과가 바뀌면 안 된다 |

바꾸기 전에 실행 계획부터 본다.

```sql
EXPLAIN SELECT l.id, l.post_id, l.created_at
FROM post_like l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
-- 바꾸기 전(예상): key = fk_post_like_member, Extra = Using filesort
```

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- member_id로 찾고 나서 따로 정렬(filesort)
- 통계를 갱신하지 않으면 MySQL이 새 인덱스를 안 쓸 수 있다(실측)

<details>
<summary>Flyway / SQL</summary>

`V2__post_like_member_created_index.sql`: 새 인덱스는 회원을 먼저 찾고, 그 회원의 좋아요를 `(created_at, id)` 순서로 역방향 스캔하게 한다. 같은 파일에서 통계를 갱신한다.

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

## 직접 확인

```bash
./gradlew bootRun --args='--spring.profiles.active=practice'      # V2 적용
docker compose exec -T mysql mysql -ucommunity -pcommunity practice -e "EXPLAIN SELECT l.id FROM post_like l WHERE l.member_id = 12 ORDER BY l.created_at DESC, l.id DESC LIMIT 11"
curl -s -H 'Authorization: Bearer tok-p12' "http://localhost:8080/api/me/likes?size=5" | python3 -c 'import sys,json; print([i["postId"] for i in json.load(sys.stdin)["items"]])'
```

단일 테이블 계획만으로 실제 API의 성능을 판정하지 않는다. 첫 페이지의 JOIN·가시성 조건을 포함한 실행 계획도 본다(회원 12, `size=5`라 `LIMIT 6`).

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

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

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
| D2 | 위 `EXPLAIN` | `key` = `ix_post_like_member_created`, `Extra`에 `Using filesort`가 **없다**(`Backward index scan`이 보일 수 있다) |
| D3 | `SELECT version, success FROM flyway_schema_history WHERE version = '2'` | `2`, `1` |
| D4 | 위 실제 API 첫 페이지 JOIN `EXPLAIN` | `post_like l`이 첫 테이블, `key = ix_post_like_member_created`, `Extra`에 `Using filesort` 없음. `post p`는 `PRIMARY` 키의 `eq_ref`(전체 스캔 아님). 차단 조회 두 방향은 `(blocker_id, blocked_id)` 인덱스로 단일 행 조회 |
| C1 | `GET /api/me/likes?size=5`(`tok-p12`) | `200`, `postId` 순서 `145, 143, 140, 139, 142` — 인덱스를 바꿔도 결과는 같다 |
| R1 | 컬럼 순서 | 왜 `member_id`가 맨 앞이고 정렬 컬럼이 뒤인지(같음 조건 → 정렬 순서) 설명할 수 있다 |
| R2 | 기존 인덱스 | `member_id` 하나짜리 외래키 인덱스를 지워도 되는지 판단했다(새 인덱스의 맨 앞이 `member_id`라 외래키가 대신 쓸 수 있다). 지웠다면 별도 마이그레이션으로 |
| R3 | 운영 고려 | 큰 테이블에 인덱스를 만들 때 잠금·시간 문제가 있다는 것(MySQL 온라인 DDL, `ALGORITHM=INPLACE, LOCK=NONE`)을 안다 |

## 필요한 지식

- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 복합 인덱스와 정렬
- [R05 — 후보 인덱스를 만들고 계획을 비교한다](../../docs/knowledge/R05-index-btree.md#2단계-후보-인덱스를-만들고-계획을-비교한다)
- [W15 — MySQL에서 실제 계획을 비교한다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#mysql에서-실제-계획을-비교한다)
- [S17 Spring Boot 애플리케이션 성능](../../docs/knowledge/S17-performance-tuning.md)

## 다음 단계

[9-3. 컬럼 추가와 백필](9-3-add-column-backfill.md)
