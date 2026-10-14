# 8-5. 정합성 배치 — 어긋난 숫자 찾아 고치기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

목록을 빠르게 보여 주려고 `post.like_count`·`comment_count`를 따로 들고 있다(비정규화). 그런데 예전 버그나 수동 작업 때문에 실제 행 수와 어긋난 글이 생겼다. 학습용 데이터에는 일부러 어긋난 글이 5개 있다.

> "매일 새벽 4시에 숫자를 실제 개수로 맞춰 주세요. 운영자가 바로 돌릴 수 있는 버튼도요. 몇 번을 돌려도 결과가 같아야 해요."

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 도구 — 숫자 다시 맞추기",
  "summary": "비정규화 숫자(like_count·comment_count)를 실제 행 수로 맞춘다. 매일 04:00에도 같은 메서드가 돈다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "운영 도구",
      "right": "운영자"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "recount",
          "label": "숫자 다시 맞추기",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "list",
      "id": "fixed",
      "label": "고친 글",
      "items": [
        {
          "id": "f93",
          "title": "#93 좋아요 6 → 4"
        },
        {
          "id": "f119",
          "title": "#119 좋아요 10 → 5"
        },
        {
          "id": "f120",
          "title": "#120 좋아요 3 → 4"
        },
        {
          "id": "f22",
          "title": "#22 댓글 9 → 8"
        },
        {
          "id": "f75",
          "title": "#75 댓글 2 → 4"
        }
      ]
    },
    {
      "type": "text",
      "id": "nothing",
      "value": "고칠 게 없어요",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "처음 실행",
      "steps": [
        {
          "kind": "user",
          "text": "[숫자 다시 맞추기]를 누른다",
          "focus": [
            "recount"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/recount",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, p.like_count, COALESCE(l.cnt, 0) FROM post p LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM post_like GROUP BY post_id) l ON l.post_id = p.id WHERE p.deleted_at IS NULL AND p.like_count <> COALESCE(l.cnt, 0)",
          "note": "고칠 목록을 먼저 얻는다"
        },
        {
          "kind": "db",
          "sql": "UPDATE post p LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM post_like GROUP BY post_id) l ON l.post_id = p.id SET p.like_count = COALESCE(l.cnt, 0) WHERE p.deleted_at IS NULL AND p.like_count <> COALESCE(l.cnt, 0)",
          "note": "글마다 엔티티를 불러 고치지 않고 집합으로 한 번에"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"likeFixed\": [{\"postId\": 93, \"before\": 6, \"after\": 4}, …], \"commentFixed\": [{\"postId\": 22, \"before\": 9, \"after\": 8}, …]}"
        },
        {
          "kind": "screen",
          "text": "고친 글과 전후 값",
          "focus": [
            "fixed"
          ]
        }
      ]
    },
    {
      "name": "한 번 더",
      "steps": [
        {
          "kind": "user",
          "text": "바로 한 번 더 누른다",
          "focus": [
            "recount"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/recount",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"likeFixed\": [], \"commentFixed\": []}"
        },
        {
          "kind": "screen",
          "text": "몇 번을 돌려도 결과가 같다(멱등)",
          "focus": [
            "nothing"
          ]
        }
      ]
    },
    {
      "name": "일반 회원",
      "steps": [
        {
          "kind": "user",
          "text": "일반 회원이 주소를 직접 친다"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/recount",
          "headers": [
            "Authorization: Bearer tok-p02"
          ]
        },
        {
          "kind": "response",
          "status": 403
        },
        {
          "kind": "screen",
          "text": "운영자만"
        }
      ]
    }
  ]
}
```

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

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 고칠 목록을 먼저 얻는다
- 글마다 엔티티를 불러 고치지 않고 집합으로 한 번에

<details>
<summary>Controller / HTTP</summary>

`AdminController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.

```java
@PostMapping("/api/admin/recount")
public RecountResponse recount(@LoginMember AuthenticatedMember me) {
    if (!"ADMIN".equals(me.role())) {
        throw new AdminOnlyException();
    }
    return recountService.recount();
}
```

스케줄러는 로그인 회원이 없으므로 권한 확인은 Controller에 둔다. 토큰이 없으면 선행 인증 인터셉터가 401을 반환한다.

</details>

<details>
<summary>예외 처리 / 실패 응답</summary>

`AdminOnlyException.java`, `ApiExceptionHandler.java`: 실패 상태와 응답 본문을 계약과 대조한다.

```java
@ExceptionHandler(AdminOnlyException.class)
public ProblemDetail handleAdminOnly(AdminOnlyException ex, HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    problem.setInstance(URI.create(request.getRequestURI()));
    return problem;
}
```

</details>

<details>
<summary>설정 / 스케줄러 활성화</summary>

`SchedulingConfig.java`: 예약 실행을 켜는 설정이다.

```java
@Configuration
@EnableScheduling
public class SchedulingConfig {}
```

</details>

<details>
<summary>DTO / 집계 결과와 응답</summary>

`CountMismatchRow.java`, `CountFix.java`, `RecountResponse.java`: DB 조회 결과를 응답 항목으로 옮긴다. 필드 이름·타입을 응답 예시와 대조한다.

```java
// JPA native query의 postId·beforeCount·afterCount 별칭을 읽는다.
public interface CountMismatchRow {
    Long getPostId();
    Long getBeforeCount();
    Long getAfterCount();
}

public record CountFix(Long postId, long before, long after) {}

public record RecountResponse(List<CountFix> likeFixed, List<CountFix> commentFixed) {}
```

</details>

<details>
<summary>JPA / Repository·SQL</summary>

`RecountRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

```sql
SELECT p.id AS postId, p.like_count AS beforeCount, COALESCE(l.cnt, 0) AS afterCount
FROM post p
LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM post_like GROUP BY post_id) l
       ON l.post_id = p.id
WHERE p.deleted_at IS NULL AND p.like_count <> COALESCE(l.cnt, 0)
ORDER BY p.id;

UPDATE post p
LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM post_like GROUP BY post_id) l
       ON l.post_id = p.id
SET p.like_count = COALESCE(l.cnt, 0)
WHERE p.deleted_at IS NULL AND p.like_count <> COALESCE(l.cnt, 0);
```

댓글은 `comment.deleted_at IS NULL`을 집계 조건에 추가한다. `LEFT JOIN`과 `COALESCE`가 있어야 좋아요·댓글이 0건인 글도 0으로 고칠 수 있다. 실제 `@Query`·`@Modifying` 전문은 아래 역할별 코드에 있다.

</details>

<details>
<summary>Scheduler / 배치</summary>

`RecountScheduler.java`: 실행 주기와 재실행 결과를 확인한다.

```java
@Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
public void recountDaily() {
    recountService.recount();
}
```

</details>

<details>
<summary>Service / 규칙·트랜잭션</summary>

`RecountService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

```java
@Transactional
public RecountResponse recount() {
    List<CountFix> likeFixed = toFixes(recountRepository.findLikeCountMismatches());
    List<CountFix> commentFixed = toFixes(recountRepository.findCommentCountMismatches());
    if (!likeFixed.isEmpty()) recountRepository.fixLikeCounts();
    if (!commentFixed.isEmpty()) recountRepository.fixCommentCounts();
    likeFixed.forEach(f -> log.info("like_count 보정 postId={} {} -> {}", f.postId(), f.before(), f.after()));
    commentFixed.forEach(f -> log.info("comment_count 보정 postId={} {} -> {}", f.postId(), f.before(), f.after()));
    return new RecountResponse(likeFixed, commentFixed);
}
```

실제 구현은 배치 완료 건수도 로그로 남긴다. 조회와 UPDATE는 한 트랜잭션 안에서 실행한다.

</details>

<details>
<summary>MyBatis / Mapper·Service 선택 경로</summary>

같은 API와 응답을 Mapper Java/XML로 구현할 때 `CountMismatchRow`는 SQL 결과를 받는 클래스로 바뀐다. `RecountService`는 `MyBatisRecountMapper`를 주입받되 Controller·Scheduler는 그대로 둔다.

```java
@Mapper
public interface MyBatisRecountMapper {
    List<CountMismatchRow> findLikeCountMismatches();
    List<CountMismatchRow> findCommentCountMismatches();
    int fixLikeCounts();
    int fixCommentCounts();
}
```

`MyBatisRecountMapper.xml`은 JPA의 SELECT·UPDATE와 같은 `LEFT JOIN` 집계를 사용한다. 아래 **MyBatis 대체 구현 코드**에서 Mapper XML·Service·DTO와 이전 단계 누적 코드를 모두 펼쳐 볼 수 있다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
curl -s -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p01'; echo     # X1 첫 실행
curl -s -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p01'; echo     # X2 한 번 더
curl -i -X POST "$BASE/api/admin/recount" -H 'Authorization: Bearer tok-p02'          # X3 일반 회원
curl -i -X POST "$BASE/api/admin/recount"                                             # X4 토큰 없음
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "X1",
      "title": "첫 실행",
      "method": "POST",
      "path": "/api/admin/recount",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "X2",
      "title": "한 번 더",
      "method": "POST",
      "path": "/api/admin/recount",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "X3",
      "title": "일반 회원",
      "method": "POST",
      "path": "/api/admin/recount",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "X4",
      "title": "토큰 없음",
      "method": "POST",
      "path": "/api/admin/recount"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "X1",
      "expect": {
        "status": 200,
        "anyOf": [
          {
            "json": [
              {
                "path": "$.likeFixed",
                "length": 3
              },
              {
                "path": "$.likeFixed",
                "contains": {
                  "postId": 93,
                  "before": 6,
                  "after": 4
                }
              },
              {
                "path": "$.likeFixed",
                "contains": {
                  "postId": 119,
                  "before": 10,
                  "after": 5
                }
              },
              {
                "path": "$.likeFixed",
                "contains": {
                  "postId": 120,
                  "before": 3,
                  "after": 4
                }
              },
              {
                "path": "$.commentFixed",
                "length": 2
              },
              {
                "path": "$.commentFixed",
                "contains": {
                  "postId": 22,
                  "before": 9,
                  "after": 8
                }
              },
              {
                "path": "$.commentFixed",
                "contains": {
                  "postId": 75,
                  "before": 2,
                  "after": 4
                }
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.likeFixed",
                "type": "array"
              },
              {
                "path": "$.likeFixed",
                "length": 0
              },
              {
                "path": "$.commentFixed",
                "type": "array"
              },
              {
                "path": "$.commentFixed",
                "length": 0
              }
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "X2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.likeFixed",
            "length": 0
          },
          {
            "path": "$.commentFixed",
            "length": 0
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "X3",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "X4",
          "expect": {
            "status": 401
          }
        }
      ]
    }
  ]
}
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
