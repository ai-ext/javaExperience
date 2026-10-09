# 9-2. 인덱스와 실행 계획

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

4-3의 "내가 좋아요한 글"은 회원의 좋아요를 시각 순으로 정렬한다. `post_like`에는 `member_id` 인덱스(외래키용)만 있어서, MySQL이 그 회원의 행을 다 읽은 뒤 따로 정렬한다(`Using filesort`). 좋아요가 수십만 개면 느려진다.

**정렬 순서까지 담은 복합 인덱스**를 마이그레이션으로 추가하고, 실행 계획이 바뀐 것을 확인한다.

## 만들 것

| 할 일 | 내용 |
|---|---|
| V2 | `db/migration/V2__post_like_member_created_index.sql` |
| 인덱스 | 이름 `ix_post_like_member_created`, 컬럼 순서 `(member_id, created_at, id)` |
| 통계 | 같은 파일 끝에 `ANALYZE TABLE post_like;` — 통계가 오래되면 MySQL이 새 인덱스를 안 쓰는 경우가 있다(실제로 이 데이터에서 그랬다) |
| API | 4-3의 `GET /api/me/likes`는 그대로. 결과가 바뀌면 안 된다 |

바꾸기 전에 실행 계획부터 본다.

```sql
EXPLAIN SELECT l.id, l.post_id, l.created_at
FROM post_like l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
-- 바꾸기 전(예상): key = fk_post_like_member, Extra = Using filesort
```

## 직접 확인

```bash
./gradlew bootRun --args='--spring.profiles.active=practice'      # V2 적용
docker compose exec -T mysql mysql -ucommunity -pcommunity practice -e "EXPLAIN SELECT l.id FROM post_like l WHERE l.member_id = 12 ORDER BY l.created_at DESC, l.id DESC LIMIT 11"
curl -s -H 'Authorization: Bearer tok-p12' "http://localhost:8080/api/me/likes?size=5" | python3 -c 'import sys,json; print([i["postId"] for i in json.load(sys.stdin)["items"]])'
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT·SHOW·EXPLAIN만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema = 'practice' AND table_name = 'post_like' AND index_name = 'ix_post_like_member_created'` | `member_id,created_at,id` |
| D2 | 위 `EXPLAIN` | `key` = `ix_post_like_member_created`, `Extra`에 `Using filesort`가 **없다**(`Backward index scan`이 보일 수 있다) |
| D3 | `SELECT version, success FROM flyway_schema_history WHERE version = '2'` | `2`, `1` |
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
