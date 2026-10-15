# 8-5. 정합성 배치 — 어긋난 숫자 찾아 고치기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

목록을 빠르게 보여 주려고 `post.like_count`·`comment_count`를 따로 들고 있다(비정규화). 그런데 예전 버그나 수동 작업 때문에 실제 행 수와 어긋난 글이 생겼다. 학습용 데이터에는 일부러 어긋난 글이 5개 있다.

> "매일 새벽 4시에 숫자를 실제 개수로 맞춰 주세요. 운영자가 바로 돌릴 수 있는 버튼도요. 몇 번을 돌려도 결과가 같아야 해요."

## 만들 것

| 항목 | 내용 |
|---|---|
| 수동 실행 | `POST /api/admin/recount` — 운영자(`ADMIN`, 학습용 DB에서는 회원 1 = `tok-p01`)만. 다른 회원 `403`, 토큰 없음 `401` |
| 예약 실행 | `@Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")` — 수동 실행과 **같은 서비스 메서드**를 부른다 |
| 하는 일 | 삭제되지 않은 글의 `like_count`를 `post_like` 행 수로, `comment_count`를 삭제되지 않은 댓글 수로 맞춘다 |
| 응답 | `200`, 고친 글과 전후 값. 고칠 게 없으면 빈 배열 |
| 로그 | 고친 글 id와 전후 값을 로그로 남긴다 |

```json
{
  "likeFixed":    [ { "postId": 93, "before": 6, "after": 4 } ],
  "commentFixed": [ { "postId": 22, "before": 9, "after": 8 } ]
}
```

## 직접 확인

```bash
BASE=http://localhost:8080
curl -s -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p01'; echo     # X1 첫 실행
curl -s -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p01'; echo     # X2 한 번 더
curl -i -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p02'          # X3 일반 회원
curl -i -X POST "$BASE/api/admin/recount"                                             # X4 토큰 없음
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | X1 | `200`. DB를 만든 뒤 처음 돌렸다면 `likeFixed` = 93(6→4)·119(10→5)·120(3→4), `commentFixed` = 22(9→8)·75(2→4). 이미 돌린 적이 있으면 둘 다 빈 배열 |
| C2 | X2 | `200`, 둘 다 빈 배열 — 멱등 |
| C3 | X3 / X4 | `403` / `401` |
| D1 | `SELECT COUNT(*) FROM post p WHERE p.deleted_at IS NULL AND p.like_count <> (SELECT COUNT(*) FROM post_like l WHERE l.post_id = p.id)` | `0` |
| D2 | `SELECT COUNT(*) FROM post p WHERE p.deleted_at IS NULL AND p.comment_count <> (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL)` | `0` |
| R1 | 찾기와 고치기 | 어긋난 글을 쿼리로 찾고, 글마다 엔티티를 불러 고치는 대신 `UPDATE … JOIN (집계) …` 같은 집합 연산으로 한 번에 고친다(고친 목록은 그 전에 SELECT로 얻는다) |
| R2 | 같은 메서드 | 예약 실행과 수동 실행이 같은 서비스 메서드를 쓴다. `@EnableScheduling`이 켜져 있다 |
| R3 | 동시 실행 | 서버가 여러 대면 4시에 모두 같이 돈다는 것과 그 대책(ShedLock 등 분산 락)을 말할 수 있다 |
| R4 | 근본 원인 | 배치는 "나중에 맞추는" 안전망이다. 4-2·5-1에서 숫자를 원자적으로 바꿔 애초에 어긋나지 않게 하는 것이 먼저라는 것을 안다 |

## 필요한 지식

- [P30 스케줄링 실무](../../docs/knowledge/P30-scheduling-practical.md)
- [S15 비동기·스케줄링·Spring Batch](../../docs/knowledge/S15-async-scheduling-batch.md)
- [P18 동시성 문제 실전](../../docs/knowledge/P18-concurrency-inventory.md) — 어긋나는 원인
- [R04 SQL로 데이터 다루기](../../docs/knowledge/R04-sql-crud-join.md) — 집계 결과로 UPDATE

## 다음 단계

[9-1. Flyway 도입](../ch9-schema-change/9-1-flyway.md)
