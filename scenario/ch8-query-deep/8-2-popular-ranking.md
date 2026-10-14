# 8-2. 최근 N일 인기글 랭킹 — 조건부 집계와 고정 시계

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "메인에 '이번 주 인기글'을 띄워 주세요. 누적 좋아요가 아니라 **최근에** 반응이 많은 글이요."

누적 좋아요 1등 글(18·55·103번, 각 22개)은 오래전에 받은 좋아요가 대부분이다. "최근 7일"만 세면 순위가 완전히 달라진다. 그리고 "최근"은 **지금 시각**에 따라 달라진다. 학습용 데이터는 2026-10-05 00:00 이전에 만들어졌으므로, practice 프로파일에서는 그 시각을 "지금"으로 고정한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "메인 — 이번 주 인기글",
  "summary": "누적이 아니라 최근 반응으로 순위를 매긴다. '지금'은 Clock으로 고정한다(학습 데이터 기준 2026-10-05).",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "이번 주 인기글"
    },
    {
      "type": "chips",
      "id": "period",
      "items": [
        "7일",
        "30일"
      ]
    },
    {
      "type": "list",
      "id": "ranking",
      "items": [
        {
          "id": "p145",
          "title": "1. #145",
          "meta": "61점 · ♥20 · 댓글1"
        },
        {
          "id": "p143",
          "title": "2. #143",
          "meta": "61점 · ♥20 · 댓글1"
        },
        {
          "id": "p144",
          "title": "3. #144",
          "meta": "10점"
        },
        {
          "id": "p140",
          "title": "4. #140",
          "meta": "9점"
        },
        {
          "id": "p139",
          "title": "5. #139",
          "meta": "5점"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "이번 주",
      "steps": [
        {
          "kind": "user",
          "text": "메인에 들어온다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/popular?days=7&limit=5"
        },
        {
          "kind": "server",
          "text": "지금 = Clock(2026-10-05 00:00) → 기간 [2026-09-28 00:00, 2026-10-05 00:00)"
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, SUM(CASE WHEN l.created_at >= ? AND l.created_at < ? THEN 1 ELSE 0 END) * 3 + … AS score\nFROM post p ...\nWHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL\nGROUP BY p.id HAVING score > 0\nORDER BY score DESC, p.published_at DESC, p.id DESC LIMIT 5"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"postId\": 145, \"score\": 61, \"likes\": 20, \"comments\": 1}, {\"postId\": 143, \"score\": 61, ...}, …]"
        },
        {
          "kind": "screen",
          "text": "동점(61)은 더 최근 글(145)이 먼저",
          "focus": [
            "p145",
            "p143"
          ]
        }
      ]
    },
    {
      "name": "30일로 바꾸기",
      "steps": [
        {
          "kind": "user",
          "text": "'30일' 칩을 누른다",
          "focus": [
            "period"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/popular?days=30&limit=3"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"postId\": 131, \"score\": 68}, {\"postId\": 145, …}, {\"postId\": 143, …}]"
        },
        {
          "kind": "screen",
          "text": "기간을 늘리면 1등이 바뀐다",
          "focus": [
            "ranking"
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
| 메서드·경로 | `GET /api/posts/popular?days=7&limit=10` |
| 인증 | 필요 없음(비로그인 기준으로 볼 수 있는 글만 — `PUBLISHED`·`PUBLIC`·삭제 안 됨) |
| 기간 | `[지금 − days, 지금)` — `days`는 1~30(기본 7), 밖이면 `400` |
| 점수 | 기간 안 좋아요 수 × 3 + 기간 안 댓글 수(삭제 제외) × 1. **점수 0인 글은 뺀다** |
| 정렬 | 점수 높은 순 → 같으면 `published_at` 최신 → `id` 큰 순 |
| `limit` | 1~50(기본 10) |
| 지금 시각 | `Clock` 빈에서 얻는다. `app.fixed-now`(practice 프로파일에 이미 `2026-10-05T00:00:00`)가 있으면 `Clock.fixed`, 없으면 시스템 시계. 시간대는 `Asia/Seoul`로 못 박는다(서버 시간대가 UTC인 환경 대비). 1-6에서 이미 `Clock` 빈을 만들었다면 `app.fixed-now` 분기와 시간대만 더한다 |
| 주의 | 고정 시계는 `Clock`을 주입받는 코드에만 적용된다. SQL의 `NOW()`나 `LocalDateTime.now()`로 시각을 찍는 곳(예: 4-2의 좋아요 INSERT)은 실제 날짜가 들어가서, practice에서 API로 새로 누른 좋아요는 "미래"라 이 기간에 안 잡힌다. 채점 데이터에는 영향이 없지만, 시각을 쓰는 곳을 모두 `Clock`으로 바꾸는 게 일관된다 |

```json
[ { "postId": 145, "title": "…", "score": 61, "likes": 20, "comments": 1 } ]
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 지금 = Clock(2026-10-05 00:00) → 기간 [2026-09-28 00:00, 2026-10-05 00:00)

<details>
<summary>Controller — HTTP 연결</summary>

`PopularPostController.java`는 목록 조회를 별도 컨트롤러에 둔다. 생략한 파라미터에만 기본값을 쓰고, 빈 값·문자·범위 밖 숫자는 400으로 거절한다. Spring의 `@RequestParam(defaultValue = "7")`은 `?days=`도 기본값으로 바꾸므로 이 계약에는 쓰지 않는다.

```java
@GetMapping("/api/posts/popular")
public List<PopularPostResponse> popular(
        @RequestParam(value = "days", required = false) String days,
        @RequestParam(value = "limit", required = false) String limit) {
    return popularPostService.popular(parseBounded(days, 7, 30, "days"),
            parseBounded(limit, 10, 50, "limit"));
}

private int parseBounded(String raw, int defaultValue, int max, String name) {
    if (raw == null) return defaultValue;
    if (!raw.matches("[0-9]+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    try {
        int value = Integer.parseInt(raw);
        if (value >= 1 && value <= max) return value;
    } catch (NumberFormatException ignored) { }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PopularPostResponse.java`는 JSON 응답이다. `PopularPostRow.java`는 SQL 결과 열을 받는 JPA 인터페이스 프로젝션이다. 점수와 개수는 `COUNT(*)`가 들어오므로 `Long`으로 받는다.

```java
public record PopularPostResponse(Long postId, String title,
        long score, long likes, long comments) {}

public interface PopularPostRow {
    Long getPostId();
    String getTitle();
    Long getScore();
    Long getLikes();
    Long getComments();
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PopularPostService.java`는 주입받은 `Clock`으로 `to`를 만들고 `to.minusDays(days)`로 `from`을 계산한다. 기간은 `[from, to)`이며 조회 결과를 응답 DTO로 옮긴다.

```java
@Transactional(readOnly = true)
public List<PopularPostResponse> popular(int days, int limit) {
    LocalDateTime to = LocalDateTime.now(clock);
    LocalDateTime from = to.minusDays(days);
    return postRepository.findPopular(from, to, limit).stream()
            .map(r -> new PopularPostResponse(r.getPostId(), r.getTitle(),
                    r.getScore(), r.getLikes(), r.getComments()))
            .toList();
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`는 좋아요와 댓글을 먼저 글별로 집계한 두 파생 테이블을 `LEFT JOIN`한다. 둘을 원시 행 그대로 함께 JOIN하면 행이 곱해진다. `post.like_count`는 기간을 반영하지 못하므로 쓰지 않는다.

```sql
SELECT p.id AS postId, p.title,
       COALESCE(l.cnt, 0) * 3 + COALESCE(c.cnt, 0) AS score,
       COALESCE(l.cnt, 0) AS likes, COALESCE(c.cnt, 0) AS comments
  FROM post p
  LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM post_like
              WHERE created_at >= :from AND created_at < :to GROUP BY post_id) l ON l.post_id = p.id
  LEFT JOIN (SELECT post_id, COUNT(*) cnt FROM comment
              WHERE deleted_at IS NULL AND created_at >= :from AND created_at < :to
              GROUP BY post_id) c ON c.post_id = p.id
 WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
   AND (l.cnt IS NOT NULL OR c.cnt IS NOT NULL)
 ORDER BY score DESC, p.published_at DESC, p.id DESC
 LIMIT :limit;
```

이 SQL을 `@Query(nativeQuery = true)`에 넣어 `List<PopularPostRow>`로 받는다. `from`·`to`·`limit`은 문자열 결합 없이 바인딩한다. MyBatis 선택 경로에서는 같은 조건을 `MyBatisPopularPostMapper.xml`에 두고 서비스가 Mapper를 호출한다. 전체 Java·XML은 아래 역할별 코드 접기에서 확인한다.

</details>

<details>
<summary>설정·보조 코드</summary>

`ClockConfig.java`는 practice 프로파일의 `app.fixed-now`를 서울 시간으로 해석해 고정 시계를 만든다. 값이 비면 같은 시간대의 시스템 시계를 반환한다.

```java
private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

@Bean
public Clock clock(@Value("${app.fixed-now:}") String fixedNow) {
    if (fixedNow == null || fixedNow.isBlank()) return Clock.system(ZONE);
    return Clock.fixed(LocalDateTime.parse(fixedNow).atZone(ZONE).toInstant(), ZONE);
}
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
top() { python3 -c 'import sys,json; print([(r["postId"], r["score"], r["likes"], r["comments"]) for r in json.load(sys.stdin)])'; }
curl -s "$BASE/api/posts/popular?days=7&limit=5" | top       # H1
curl -s "$BASE/api/posts/popular?days=30&limit=3" | top      # H2
curl -s "$BASE/api/posts/popular?days=7&limit=50" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))'   # H3
curl -i "$BASE/api/posts/popular?days=31"                   # H4
curl -i "$BASE/api/posts/popular?days="                     # H5
curl -i "$BASE/api/posts/popular?limit="                    # H6
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "H1",
      "title": "7일·5개",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=5"
    },
    {
      "id": "H2",
      "title": "30일·3개",
      "method": "GET",
      "path": "/api/posts/popular?days=30&limit=3"
    },
    {
      "id": "H3",
      "title": "7일·50개",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=50"
    },
    {
      "id": "H4",
      "title": "기간 31일",
      "method": "GET",
      "path": "/api/posts/popular?days=31"
    },
    {
      "id": "H5",
      "title": "빈 기간",
      "method": "GET",
      "path": "/api/posts/popular?days="
    },
    {
      "id": "H6",
      "title": "빈 건수",
      "method": "GET",
      "path": "/api/posts/popular?limit="
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "H1",
      "expect": {
        "json": [
          {
            "path": "$[*].postId",
            "equals": [
              145,
              143,
              144,
              140,
              139
            ]
          },
          {
            "path": "$[*].score",
            "equals": [
              61,
              61,
              10,
              9,
              5
            ]
          },
          {
            "path": "$[*].likes",
            "equals": [
              20,
              20,
              3,
              2,
              1
            ]
          },
          {
            "path": "$[*].comments",
            "equals": [
              1,
              1,
              1,
              3,
              2
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "H2",
      "expect": {
        "json": [
          {
            "path": "$[*].postId",
            "equals": [
              131,
              145,
              143
            ]
          },
          {
            "path": "$[*].score",
            "equals": [
              68,
              61,
              61
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "H3",
      "expect": {
        "json": [
          {
            "path": "$",
            "length": 16
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "H4",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C5",
      "request": "H5",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C6",
      "request": "H6",
      "expect": {
        "status": 400
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 항목은 (postId, score, likes, comments).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | H1 | `(145, 61, 20, 1) (143, 61, 20, 1) (144, 10, 3, 1) (140, 9, 2, 3) (139, 5, 1, 2)` — 145와 143은 동점이라 최신 글인 145가 먼저 |
| C2 | H2 | `(131, 68, …) (145, 61, …) (143, 61, …)` — 기간을 늘리면 다른 글이 1등 |
| C3 | H3 | `16` — 점수 0인 글은 없다 |
| C4 | H4 | `400` |
| C5 | H5 | 빈 `days`는 `400` — 생략과 구분한다 |
| C6 | H6 | 빈 `limit`은 `400` — 생략과 구분한다 |
| R1 | 시간 | `LocalDateTime.now()`를 직접 부르지 않고 `Clock`을 주입받는다. 기간 경계가 `[시작, 끝)`이다(끝 포함 아님) |
| R2 | 쿼리 | 글마다 좋아요·댓글을 따로 세지 않는다. `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` 같은 조건부 집계나 미리 집계한 서브쿼리 한두 번으로 계산한다 |
| R3 | 필터 위치 | 볼 수 있는 글만·점수 > 0·정렬·LIMIT이 모두 DB에서 처리된다(전부 가져와 자바에서 정렬하지 않는다) |
| R4 | 비정규화 숫자 | `post.like_count`(누적, 어긋날 수 있음)를 쓰지 않고 기간 안의 행을 센다 |

## 필요한 지식

- [W20 시간과 타임존](../../docs/knowledge/W20-time-timezone.md) — `Clock`, 기간 경계
- [V03 — 시간과 난수는 작은 의존성으로 넣는다](../../docs/knowledge/V03-mocking-in-practice.md#27-시간과-난수는-작은-의존성으로-넣는다)
- [R04 SQL로 데이터 다루기](../../docs/knowledge/R04-sql-crud-join.md)
- [W17 캐시는 어디에 두나](../../docs/knowledge/W17-where-to-cache.md) — 이런 랭킹은 보통 캐시한다(선택)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — Clock 빈</summary>

`@Bean Clock clock(@Value("${app.fixed-now:}") String fixedNow)`에서 값이 비어 있으면 `Clock.system(ZoneId.of("Asia/Seoul"))`, 있으면 `Clock.fixed(LocalDateTime.parse(fixedNow).atZone(ZoneId.of("Asia/Seoul")).toInstant(), ZoneId.of("Asia/Seoul"))`. 서비스는 `LocalDateTime.now(clock)`을 쓴다. </details>

## 다음 단계

[8-3. 관계 쿼리](8-3-relations.md)
