# 8-1. 회원별 활동 요약 — LEFT JOIN과 집계

> **8장은 학습용 DB(`practice`)를 쓴다.** 앱을 `./gradlew bootRun --args='--spring.profiles.active=practice'`로 띄운다(IntelliJ: Active profiles에 `practice`). 회원 30명·글 145·좋아요 568에 함정이 섞여 있다([학습용 미션](../../practice/MISSIONS.md)의 "데이터에 숨겨 둔 함정"). 토큰은 `tok-p01`~`tok-p30`(번호 = 회원 id), 운영자는 `tok-p01`. 2~6장에서 만든 API와 규칙(볼 수 있는 글만 등)이 그대로 동작한다고 가정한다.

## 상황

> "관리자 화면에 회원별 활동 요약 표를 넣어 주세요. 쓴 글, 쓴 댓글, 받은 좋아요, 누른 좋아요요. 활동이 없는 회원도 0으로 나와야 해요."

여러 테이블을 묶어 세는 **집계 쿼리**다. 8장부터는 순서를 바꾼다. **SQL을 먼저 완성하고**(CloudBeaver의 `practice (Java 학습용)` 연결), 그다음 API로 옮긴다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "관리자 — 회원 활동 요약",
  "summary": "여러 테이블을 묶어 세는 집계. 활동이 없는 회원도 0으로 나와야 한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "관리자 · 회원 활동",
      "right": "운영자"
    },
    {
      "type": "list",
      "id": "rows",
      "items": [
        {
          "id": "r2",
          "title": "코딩하는고양이",
          "meta": "글 13 · 댓글 13 · 받은 ♥ 74 · 누른 ♥ 18"
        },
        {
          "id": "r4",
          "title": "스프링요정",
          "meta": "글 19 · 댓글 19 · 받은 ♥ 60 · 누른 ♥ 23"
        },
        {
          "id": "r29",
          "title": "탈퇴한 회원",
          "meta": "글 3 · 댓글 10 · 받은 ♥ 13 · 누른 ♥ 14",
          "tone": "muted"
        },
        {
          "id": "r30",
          "title": "새로온회원",
          "meta": "모두 0",
          "tone": "muted"
        }
      ],
      "footer": "회원 30명"
    }
  ],
  "flows": [
    {
      "name": "표 열기",
      "steps": [
        {
          "kind": "user",
          "text": "관리자 화면에서 '회원 활동'을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/stats/member-activity"
        },
        {
          "kind": "db",
          "sql": "SELECT m.id, m.nickname,\n  (SELECT COUNT(*) FROM post p WHERE p.author_id = m.id AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL) AS posts,\n  (SELECT COUNT(*) FROM comment c ...) AS comments,\n  (SELECT COUNT(*) FROM post_like l JOIN post p ... WHERE p.author_id = m.id ...) AS likes_received,\n  (SELECT COUNT(*) FROM post_like l WHERE l.member_id = m.id) AS likes_given\nFROM member m ORDER BY likes_received DESC, m.id",
          "note": "숫자마다 따로 센다 — 쿼리 한 번"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"memberId\": 2, \"nickname\": \"코딩하는고양이\", \"posts\": 13, \"comments\": 13, \"likesReceived\": 74, \"likesGiven\": 18}, …]"
        },
        {
          "kind": "screen",
          "text": "30명 전부, 활동 없는 회원도 0으로",
          "focus": [
            "r2",
            "r30"
          ]
        }
      ]
    },
    {
      "name": "잘못된 쿼리 — 곱해지는 JOIN",
      "steps": [
        {
          "kind": "user",
          "text": "(틀린 구현) 글·댓글을 한 번에 LEFT JOIN 해서 센다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/stats/member-activity"
        },
        {
          "kind": "db",
          "sql": "SELECT m.id, COUNT(p.id), COUNT(c.id) FROM member m LEFT JOIN post p ON ... LEFT JOIN comment c ON ... GROUP BY m.id",
          "note": "글 13개 × 댓글 14개 → 행이 곱해져 182"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"memberId\": 2, \"posts\": 182, \"comments\": 182, ...}]"
        },
        {
          "kind": "screen",
          "text": "숫자가 부풀어 오른다 — 이 단계의 핵심 함정",
          "focus": [
            "r2"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/stats/member-activity` |
| 인증 | 필요 없음 |
| 응답 | 회원 30명 전부의 배열, `likesReceived` 많은 순, 같으면 `memberId` 작은 순 |
| SQL 파일 | 먼저 짠 SQL을 `sql/8-1-member-activity.sql`(레포 루트의 `sql/` 폴더)에 남긴다 — 리뷰에 쓴다 |

```json
[ { "memberId": 2, "nickname": "코딩하는고양이", "posts": 13, "comments": 13, "likesReceived": 74, "likesGiven": 18 } ]
```

| 칸 | 세는 것 |
|---|---|
| `posts` | 그 회원이 쓴 글 중 `PUBLISHED`이고 삭제되지 않은 글 |
| `comments` | 그 회원이 쓴 댓글 중 삭제되지 않았고, 달린 글도 삭제되지 않은 것 |
| `likesReceived` | 그 회원이 쓴 **삭제되지 않은 글**에 달린 좋아요 **행 수**(`post.like_count`가 아니다) |
| `likesGiven` | 그 회원이 누른 좋아요 행 수 |
| `nickname` | 탈퇴(`WITHDRAWN`) 회원은 `"탈퇴한 회원"` |

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 숫자마다 따로 센다 — 쿼리 한 번
- 글 13개 × 댓글 14개 → 행이 곱해져 182

<details>
<summary>DB / SQL</summary>

`8-1-member-activity.sql`은 `member`에서 출발한다. 숫자를 각각 상관 서브쿼리로 세면 활동이 없는 회원도 결과에서 빠지지 않고 `COUNT(*)`가 0을 돌려준다. 댓글은 댓글과 원글의 `deleted_at`을 둘 다 확인하고, 받은 좋아요는 `post.like_count`가 아닌 `post_like` 행을 센다.

```sql
SELECT m.id AS member_id,
       CASE WHEN m.member_status = 'WITHDRAWN' THEN '탈퇴한 회원' ELSE m.nickname END AS nickname,
       (SELECT COUNT(*) FROM post p
         WHERE p.author_id = m.id AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL) AS posts,
       (SELECT COUNT(*) FROM comment c JOIN post p ON p.id = c.post_id
         WHERE c.member_id = m.id AND c.deleted_at IS NULL AND p.deleted_at IS NULL) AS comments,
       (SELECT COUNT(*) FROM post_like l JOIN post p ON p.id = l.post_id
         WHERE p.author_id = m.id AND p.deleted_at IS NULL) AS likes_received,
       (SELECT COUNT(*) FROM post_like l WHERE l.member_id = m.id) AS likes_given
  FROM member m
 ORDER BY likes_received DESC, m.id ASC;
```

이 쿼리를 먼저 `practice` DB에서 실행하고 회원 30이 모두 0인지, 회원 12의 받은 좋아요가 10인지 확인한다.

</details>

<details>
<summary>DTO / 결과 행</summary>

`MemberActivityResponse.java`는 JSON 응답이다. `MemberActivityRow.java`는 JPA 네이티브 쿼리의 열 별칭을 받는 인터페이스 프로젝션이다. `COUNT(*)`는 `Long`으로 받고 응답에는 `long`으로 넘긴다.

```java
public record MemberActivityResponse(Long memberId, String nickname,
        long posts, long comments, long likesReceived, long likesGiven) {}

public interface MemberActivityRow {
    Long getMemberId();
    String getNickname();
    Long getPosts();
    Long getComments();
    Long getLikesReceived();
    Long getLikesGiven();
}
```

</details>

<details>
<summary>Controller</summary>

`StatsController.java`는 요청 값을 받지 않고 요약 목록을 반환한다. 기존 인증 인터셉터가 `/api/stats/member-activity`를 막지 않는지도 HTTP로 확인한다.

```java
@GetMapping("/api/stats/member-activity")
public List<MemberActivityResponse> memberActivity() {
    return statsService.memberActivity();
}
```

</details>

<details>
<summary>JPA / Repository</summary>

`StatsRepository.java`는 위 SQL과 같은 네이티브 쿼리 한 번으로 `List<MemberActivityRow>`를 만든다. SQL 파일의 `member_id`·`likes_received` 별칭을 Java getter에 맞는 `memberId`·`likesReceived`로 바꾸는 부분을 확인한다.

```java
public interface StatsRepository extends Repository<Member, Long> {
    @Query(nativeQuery = true, value = """
            SELECT m.id AS memberId,
                   CASE WHEN m.member_status = 'WITHDRAWN' THEN '탈퇴한 회원' ELSE m.nickname END AS nickname,
                   (SELECT COUNT(*) FROM post p WHERE p.author_id = m.id
                    AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL) AS posts,
                   (SELECT COUNT(*) FROM comment c JOIN post p ON p.id = c.post_id
                    WHERE c.member_id = m.id AND c.deleted_at IS NULL
                      AND p.deleted_at IS NULL) AS comments,
                   (SELECT COUNT(*) FROM post_like l JOIN post p ON p.id = l.post_id
                    WHERE p.author_id = m.id AND p.deleted_at IS NULL) AS likesReceived,
                   (SELECT COUNT(*) FROM post_like l WHERE l.member_id = m.id) AS likesGiven
              FROM member m ORDER BY likesReceived DESC, m.id ASC
            """)
    List<MemberActivityRow> findMemberActivity();
}
```

별칭이 인터페이스 getter와 맞지 않으면 값이 `null`로 들어올 수 있으므로 JSON에서 앞 5명과 활동 없는 회원 30을 직접 확인한다.

</details>

<details>
<summary>Service</summary>

`StatsService.java`는 집계 결과를 응답 DTO로 옮긴다. 회원별로 다시 저장소를 호출하는 반복문을 두지 않는다.

```java
@Transactional(readOnly = true)
public List<MemberActivityResponse> memberActivity() {
    return statsRepository.findMemberActivity().stream()
            .map(r -> new MemberActivityResponse(r.getMemberId(), r.getNickname(),
                    r.getPosts(), r.getComments(), r.getLikesReceived(), r.getLikesGiven()))
            .toList();
}
```

MyBatis로 풀 때는 같은 SQL을 `MyBatisStatsMapper.xml`의 `<select>`에 넣고 `MyBatisStatsMapper.findMemberActivity()` 한 번만 호출한다.

Java `MemberActivityRow`에는 기본 생성자와 setter를 두고 `map-underscore-to-camel-case`로 `likes_received`를 `likesReceived`에 매핑한다.

**MyBatis / Mapper** 코드 접기에서 Java·XML·Service의 전체 대체 구현을 확인한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "회원 활동 요약",
      "method": "GET",
      "path": "/api/stats/member-activity"
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
            "path": "$",
            "length": 30
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "A",
      "expect": {
        "json": [
          {
            "path": "$[0].memberId",
            "equals": 2
          },
          {
            "path": "$[0].nickname",
            "equals": "코딩하는고양이"
          },
          {
            "path": "$[0].posts",
            "equals": 13
          },
          {
            "path": "$[0].comments",
            "equals": 13
          },
          {
            "path": "$[0].likesReceived",
            "equals": 74
          },
          {
            "path": "$[0].likesGiven",
            "equals": 18
          },
          {
            "path": "$[1].memberId",
            "equals": 4
          },
          {
            "path": "$[1].nickname",
            "equals": "스프링요정"
          },
          {
            "path": "$[1].posts",
            "equals": 19
          },
          {
            "path": "$[1].comments",
            "equals": 19
          },
          {
            "path": "$[1].likesReceived",
            "equals": 60
          },
          {
            "path": "$[1].likesGiven",
            "equals": 23
          },
          {
            "path": "$[2].memberId",
            "equals": 3
          },
          {
            "path": "$[2].nickname",
            "equals": "자바초보탈출"
          },
          {
            "path": "$[2].posts",
            "equals": 12
          },
          {
            "path": "$[2].comments",
            "equals": 16
          },
          {
            "path": "$[2].likesReceived",
            "equals": 55
          },
          {
            "path": "$[2].likesGiven",
            "equals": 15
          },
          {
            "path": "$[3].memberId",
            "equals": 5
          },
          {
            "path": "$[3].nickname",
            "equals": "쿼리장인"
          },
          {
            "path": "$[3].posts",
            "equals": 9
          },
          {
            "path": "$[3].comments",
            "equals": 14
          },
          {
            "path": "$[3].likesReceived",
            "equals": 40
          },
          {
            "path": "$[3].likesGiven",
            "equals": 12
          },
          {
            "path": "$[4].memberId",
            "equals": 22
          },
          {
            "path": "$[4].nickname",
            "equals": "야근없는팀"
          },
          {
            "path": "$[4].posts",
            "equals": 5
          },
          {
            "path": "$[4].comments",
            "equals": 10
          },
          {
            "path": "$[4].likesReceived",
            "equals": 39
          },
          {
            "path": "$[4].likesGiven",
            "equals": 24
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "A",
      "expect": {
        "json": [
          {
            "path": "$",
            "contains": {
              "memberId": 30,
              "nickname": "새로온회원",
              "posts": 0,
              "comments": 0,
              "likesReceived": 0,
              "likesGiven": 0
            }
          },
          {
            "path": "$",
            "contains": {
              "memberId": 26,
              "nickname": "조용한독자",
              "posts": 0,
              "comments": 9,
              "likesReceived": 0,
              "likesGiven": 23
            }
          },
          {
            "path": "$",
            "contains": {
              "memberId": 29,
              "nickname": "탈퇴한 회원",
              "posts": 3,
              "comments": 10,
              "likesReceived": 13,
              "likesGiven": 14
            }
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "A",
      "expect": {
        "json": [
          {
            "path": "$",
            "contains": {
              "memberId": 12,
              "nickname": "백엔드입문",
              "posts": 6,
              "comments": 12,
              "likesReceived": 10,
              "likesGiven": 29
            }
          }
        ]
      },
      "note": "배열에서 회원 12의 객체를 통째로 찾는다(위치 무관) — 객체 비교라 기준표에서 생략한 nickname(백엔드입문)도 함께 본다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 값은 (memberId, nickname, posts, comments, likesReceived, likesGiven) 순서다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 위 요청 | `200`, 30개 |
| C2 | 앞 5개 | `(2, 코딩하는고양이, 13, 13, 74, 18)` `(4, 스프링요정, 19, 19, 60, 23)` `(3, 자바초보탈출, 12, 16, 55, 15)` `(5, 쿼리장인, 9, 14, 40, 12)` `(22, 야근없는팀, 5, 10, 39, 24)` |
| C3 | 회원 30 / 26 / 29 | `(30, 새로온회원, 0, 0, 0, 0)` / `(26, 조용한독자, 0, 9, 0, 23)` / `(29, 탈퇴한 회원, 3, 10, 13, 14)` |
| C4 | 회원 12 | `(12, …, 6, 12, 10, 29)` — `likesReceived`가 10이다(`like_count`를 더하면 9가 나와 틀린다) |
| R1 | SQL 파일 | `sql/8-1-member-activity.sql`이 있고, API가 같은 결과를 낸다 |
| R2 | 곱해지는 JOIN | 글·댓글·좋아요를 한 번에 LEFT JOIN 한 뒤 `COUNT`하면 행이 곱해져 숫자가 부풀어 오른다(회원 2만 해도 182가 나온다). 서브쿼리나 미리 집계한 파생 테이블로 피했다 |
| R3 | 쿼리 수 | 회원마다 쿼리를 따로 날리지 않는다(30명 × 4 = 120번). 한두 번의 쿼리로 끝낸다 |
| R4 | 방식 선택 | 이런 통계는 엔티티 조회보다 네이티브 SQL·JPQL DTO 조회·QueryDSL 프로젝션이 맞다. 고른 이유를 설명할 수 있다 |

## 필요한 지식

- [R04 SQL로 데이터 다루기 — JOIN·집계](../../docs/knowledge/R04-sql-crud-join.md)
- [W03 DB 접근 방식 총비교](../../docs/knowledge/W03-db-access-comparison.md) — 엔티티 vs DTO vs 네이티브
- [W05 JPA vs MyBatis](../../docs/knowledge/W05-jpa-vs-mybatis-strategy.md) — 통계 쿼리를 어디서 짜나
- [S10 — `@Query`는 선언 시점에 쿼리를 분리한다](../../docs/knowledge/S10-spring-data-query.md#query는-선언-시점에-쿼리를-분리한다)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 곱해지지 않게</summary>

`member`를 기준으로 두고, 각 숫자를 상관 서브쿼리 `(SELECT COUNT(*) FROM ... WHERE ... = m.id)`로 따로 세거나, `(SELECT author_id, COUNT(*) cnt FROM post ... GROUP BY author_id) p`처럼 미리 집계한 결과를 LEFT JOIN한 뒤 `COALESCE(p.cnt, 0)`. 결과는 `record`/인터페이스 프로젝션으로 받는다.
</details>

## 다음 단계

[8-2. 최근 N일 인기글 랭킹](8-2-popular-ranking.md)
