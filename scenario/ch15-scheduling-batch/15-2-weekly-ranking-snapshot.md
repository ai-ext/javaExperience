# 15-2. 주간 랭킹 스냅샷 — 기간 경계와 그때의 값

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다. "지금" = 2026-10-05 00:00(월요일).

## 상황

> "매주 월요일에 지난주 랭킹 상위 10개를 뽑아 주세요. 점수는 좋아요 1개 2점, 댓글 1개 3점이요. 지난주·지지난주 랭킹도 볼 수 있어야 하고, 한번 발표한 순위는 나중에 바뀌면 안 돼요."

8-2의 인기글은 부를 때마다 **지금** 기준으로 계산한다. 이번 요구는 다르다. "지난주 랭킹"은 지난주가 끝난 순간의 결과이고, 이번 주에 좋아요가 더 붙어도 바뀌면 안 된다. 그래서 그 순간의 결과를 표에 **복사해 둔다(스냅샷)**. 다시 계산하지 않고 저장된 것을 읽는다.

기간도 정확해야 한다. 2026-10-05(월) 0시에 도는 배치가 보는 "지난 7일"은 `[2026-09-28 00:00, 2026-10-05 00:00)` — 앞은 포함, 끝은 미포함이다. 랭킹의 이름표(`weekStart`)는 그 주의 월요일(09-28)이다.

> 점수식(좋아요×2 + 댓글×3)이 8-2(×3 + ×1)와 일부러 다르다. 같은 쿼리를 복사해 숫자만 바꾸면 된다고 생각하지 말고, 점수식이 어디 한 곳에만 있는지 본다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "메인 — 지난주 랭킹",
  "summary": "월요일 0시에 지난 7일 점수로 상위 10을 저장(스냅샷)하고, 화면은 저장된 것을 읽는다. 지난 주도 그대로 다시 볼 수 있다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "지난주 랭킹"
    },
    {
      "type": "chips",
      "id": "weeks",
      "label": "주",
      "items": [
        "9/28 주",
        "9/21 주"
      ]
    },
    {
      "type": "list",
      "id": "ranking",
      "items": [
        {
          "id": "r1",
          "title": "1. #145",
          "meta": "43점 · ♥20 · 댓글1"
        },
        {
          "id": "r2",
          "title": "2. #143",
          "meta": "43점 · ♥20 · 댓글1"
        },
        {
          "id": "r3",
          "title": "3. #140",
          "meta": "13점 · ♥2 · 댓글3"
        },
        {
          "id": "r10",
          "title": "10. #48",
          "meta": "3점 — 3점 동점 넷 중 가장 오래된 글"
        }
      ],
      "footer": "상위 10"
    },
    {
      "type": "text",
      "id": "empty",
      "value": "그 주의 랭킹이 없어요",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "월요일 0시 10분 배치",
      "steps": [
        {
          "kind": "server",
          "text": "예약 실행(cron 0 10 0 * * MON) 또는 운영자 수동 실행 — 기준일 2026-10-05(월)"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-05",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "server",
          "text": "기간 [2026-09-28 00:00, 2026-10-05 00:00) — 점수 = 좋아요×2 + 댓글×3"
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, COALESCE(l.cnt,0)*2 + COALESCE(c.cnt,0)*3 AS score …\nFROM post p LEFT JOIN (기간 안 좋아요 집계) l … LEFT JOIN (기간 안 댓글 집계) c …\nWHERE 볼 수 있는 글 AND score > 0\nORDER BY score DESC, p.published_at DESC, p.id DESC LIMIT 10"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO weekly_ranking (week_start, ranking, post_id, title, score, likes, comments, created_at) VALUES ('2026-09-28', 1, 145, …), …",
          "note": "제목·점수를 그때 값 그대로 복사"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"weekStart\": \"2026-09-28\", \"created\": true, \"items\": [{\"rank\": 1, \"postId\": 145, \"score\": 43, …}, …]}"
        },
        {
          "kind": "server",
          "text": "같은 주를 한 번 더 돌리면 다시 계산하지 않고 저장된 10개를 created=false로 돌려준다"
        }
      ]
    },
    {
      "name": "지난주 보기",
      "steps": [
        {
          "kind": "user",
          "text": "'9/21 주' 칩을 누른다",
          "focus": [
            "weeks"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/rankings/weekly?weekStart=2026-09-21"
        },
        {
          "kind": "db",
          "sql": "SELECT * FROM weekly_ranking WHERE week_start = '2026-09-21' ORDER BY ranking",
          "note": "계산하지 않고 읽기만"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"weekStart\": \"2026-09-21\", \"created\": false, \"items\": [{\"rank\": 1, \"postId\": 131, \"score\": 48, …}, …]}"
        },
        {
          "kind": "screen",
          "text": "그 주에 저장해 둔 순위 그대로",
          "focus": [
            "ranking"
          ]
        }
      ]
    },
    {
      "name": "스냅샷이 없는 주",
      "steps": [
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/rankings/weekly?weekStart=2026-01-05"
        },
        {
          "kind": "response",
          "status": 404,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "없는 주를 그 자리에서 계산해 주지 않는다",
          "focus": [
            "empty"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V61** — `db/migration/V61__create_weekly_ranking.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `week_start` | `DATE` — 랭킹 주의 월요일 |
| `ranking` | 1~10. (`RANK`는 MySQL 8 함수 이름이라 컬럼명으로 피한다) |
| `post_id` | 글 id. **FK를 걸지 않는다** — 원본 글이 15-4에서 영구 삭제돼도 지난 랭킹은 남는다 |
| `title`·`score`·`likes`·`comments` | 그때의 값 복사 |
| `created_at` | 만든 시각 |
| 제약 | `UNIQUE(week_start, ranking)`, `UNIQUE(week_start, post_id)` — 한 주가 두 벌 생기지 않는다 |

`weekly_ranking_run`은 `week_start DATE PRIMARY KEY`, `created_at DATETIME`을 가진 완료 표식이다. 후보가 **0건인 주**도 한 번 계산했다는 사실을 남긴다. 표식과 랭킹 행은 같은 트랜잭션에 기록한다.

**배치와 API**

| 항목 | 내용 |
|---|---|
| 예약 실행 | `@Scheduled(cron = "0 10 0 * * MON", zone = "Asia/Seoul")` — 0시 정각의 명예의 전당(15-1)과 조금 비켜 둔다 |
| 수동 실행 | `POST /api/admin/jobs/weekly-ranking/run?date=2026-10-05` — 운영자만. `date` = 배치가 도는 **월요일**. 집계 기간 `[date − 7일 0시, date 0시)`, 저장 이름표 `weekStart = date − 7일` |
| 점수 | 기간 안 좋아요 수 × 2 + 기간 안 댓글 수(삭제 제외, 답글 포함) × 3. 점수 0인 글은 뺀다. 볼 수 있는 글(`PUBLISHED`·`PUBLIC`·삭제 안 됨)만 |
| 정렬 | 점수 높은 순 → `published_at` 최신 → `id` 큰 순. 상위 10개에 1~10 순위 |
| 이미 있는 주 | 완료 표식이 있으면 다시 계산하지 않고 저장된 것을 `created: false`로 돌려준다 |
| 후보 0건인 주 | 첫 실행은 `created: true, items: []`, 반복 실행은 `created: false, items: []`. 완료 표식이 있는 빈 주의 조회는 `200`·빈 목록 |
| 조회 | `GET /api/rankings/weekly?weekStart=2026-09-21` — 누구나. 저장된 것만 읽는다. 완료 표식이 없으면 `404` |

```json
{ "weekStart": "2026-09-28", "created": true,
  "items": [ { "rank": 1, "postId": 145, "title": "…", "score": 43, "likes": 20, "comments": 1 } ] }
```

**입력 규칙** — 틀리면 `400` + `errors[].field`(`500` 아님)

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `date`(실행) | 아니오 | 생략·빈 값·공백이면 오늘 | **월요일**만, 오늘까지(미래 400). `date − 7일`이 MySQL DATE 최소 `1000-01-01` 이후여야 함 | `yyyy-MM-dd` | 오늘 | `400`, `field = "date"` |
| `weekStart`(조회) | **예** | 없음·빈 값·공백 400 | **월요일**만, MySQL DATE 최소 `1000-01-01` 이후 | `yyyy-MM-dd`(`2026/09/21`은 400) | — | `400`, `field = "weekStart"` / 스냅샷 없으면 `404` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 예약 실행(cron 0 10 0 * * MON) 또는 운영자 수동 실행 — 기준일 2026-10-05(월)
- 기간 [2026-09-28 00:00, 2026-10-05 00:00) — 점수 = 좋아요×2 + 댓글×3
- 제목·점수를 그때 값 그대로 복사
- 같은 주를 한 번 더 돌리면 다시 계산하지 않고 저장된 10개를 created=false로 돌려준다
- 후보가 없는 주도 `weekly_ranking_run`에 기록해 재실행 시 다시 계산하지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`WeeklyRankingController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/admin/jobs/weekly-ranking/run")`, `@GetMapping("/api/rankings/weekly")`. 변경된 메서드: `run`, `get`.

`src/main/java/org/example/batch/WeeklyRankingController.java`

```java
package org.example.batch;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;

@RestController
public class WeeklyRankingController {

    private final WeeklyRankingService weeklyRankingService;
    private final Clock clock;

    public WeeklyRankingController(WeeklyRankingService weeklyRankingService, Clock clock) {
        this.weeklyRankingService = weeklyRankingService;
        this.clock = clock;
    }

    // date = 배치가 도는 월요일. 그 전 7일(지난주 월~일)을 집계한다.
    @PostMapping("/api/admin/jobs/weekly-ranking/run")
    public WeeklyRankingResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return weeklyRankingService.run(JobDates.resolve(date, clock));
    }

    // weekStart = 랭킹 주의 시작(월요일). 없으면 404 — 스냅샷이 없는 주를 그 자리에서 계산해 주지 않는다.
    @GetMapping("/api/rankings/weekly")
    public WeeklyRankingResponse get(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return weeklyRankingService.get(weekStart);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`WeeklyRankingResponse.java`, `WeeklyScoreRow.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/WeeklyRankingResponse.java`

```java
package org.example.batch;

import java.time.LocalDate;
import java.util.List;

// created: 이번 호출에서 스냅샷을 새로 만들었으면 true, 이미 있던 것을 돌려주면 false
public record WeeklyRankingResponse(LocalDate weekStart, boolean created, List<WeeklyRankingItem> items) {
}
```

`src/main/java/org/example/batch/WeeklyScoreRow.java`

```java
package org.example.batch;

public interface WeeklyScoreRow {

    Long getPostId();

    String getTitle();

    Long getLikes();

    Long getComments();

    Long getScore();
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`WeeklyRankingService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `run`, `get`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/batch/WeeklyRankingService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 15-2 주간 랭킹 — 월요일(date)에 "지난 7일" [date-7일 0시, date 0시)을 집계해 상위 10을 저장한다.
// 스냅샷은 한 주에 한 번만 만든다. 이미 있으면 다시 계산하지 않고 저장된 것을 돌려준다(그때의 값).
@Service
public class WeeklyRankingService {

    public static final int TOP = 10;
    private static final LocalDate MIN_DATABASE_DATE = LocalDate.of(1000, 1, 1);
    private static final Logger log = LoggerFactory.getLogger(WeeklyRankingService.class);

    private final WeeklyRankingRepository weeklyRankingRepository;
    private final Clock clock;

    public WeeklyRankingService(WeeklyRankingRepository weeklyRankingRepository, Clock clock) {
        this.weeklyRankingRepository = weeklyRankingRepository;
        this.clock = clock;
    }

    @Transactional
    public WeeklyRankingResponse run(LocalDate date) {
        requireMonday("date", date);
        LocalDate weekStart = date.minusDays(7);
        LocalDateTime now = LocalDateTime.now(clock);
        if (weeklyRankingRepository.tryStart(weekStart, now) == 0) {
            log.info("주간 랭킹 week={} 이미 있음 — 다시 만들지 않는다", weekStart);
            return new WeeklyRankingResponse(weekStart, false, load(weekStart));
        }

        LocalDateTime from = weekStart.atStartOfDay();
        LocalDateTime to = date.atStartOfDay();
        List<WeeklyRanking> rows = new ArrayList<>();
        int rank = 1;
        for (WeeklyScoreRow r : weeklyRankingRepository.aggregate(from, to, TOP)) {
            rows.add(new WeeklyRanking(weekStart, rank++, r.getPostId(), r.getTitle(),
                    r.getScore().intValue(), r.getLikes().intValue(), r.getComments().intValue(), now));
        }
        // 완료 표식과 상위 10행을 같은 트랜잭션에 저장한다. 후보 0건이어도 표식은 남는다.
        weeklyRankingRepository.saveAll(rows);
        log.info("주간 랭킹 week={} [{} ~ {}) {}개 저장", weekStart, from, to, rows.size());
        return new WeeklyRankingResponse(weekStart, true, rows.stream().map(WeeklyRankingService::toItem).toList());
    }

    @Transactional(readOnly = true)
    public WeeklyRankingResponse get(LocalDate weekStart) {
        requireMonday("weekStart", weekStart);
        if (weeklyRankingRepository.countRun(weekStart) == 0) {
            throw new WeeklyRankingNotFoundException(weekStart);
        }
        return new WeeklyRankingResponse(weekStart, false, load(weekStart));
    }

    private List<WeeklyRankingItem> load(LocalDate weekStart) {
        return weeklyRankingRepository.findByWeekStartOrderByRankingAsc(weekStart).stream()
                .map(WeeklyRankingService::toItem)
                .toList();
    }

    private static WeeklyRankingItem toItem(WeeklyRanking w) {
        return new WeeklyRankingItem(w.getRanking(), w.getPostId(), w.getTitle(), w.getScore(), w.getLikes(), w.getComments());
    }

    private static void requireMonday(String field, LocalDate date) {
        // MySQL DATE는 1000-01-01부터 저장한다. 실행일에서 7일 뺀 주 시작도 이 범위여야 한다.
        LocalDate min = "date".equals(field) ? MIN_DATABASE_DATE.plusDays(7) : MIN_DATABASE_DATE;
        if (date.isBefore(min)) {
            throw new InvalidJobParameterException(field, field + "는 " + min + " 이후여야 합니다.");
        }
        if (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new InvalidJobParameterException(field, field + "는 월요일이어야 합니다(" + date + "는 " + date.getDayOfWeek() + ").");
        }
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`WeeklyRankingRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/batch/WeeklyRankingRepository.java`

```java
package org.example.batch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface WeeklyRankingRepository extends JpaRepository<WeeklyRanking, Long> {

    List<WeeklyRanking> findByWeekStartOrderByRankingAsc(LocalDate weekStart);

    // 빈 주도 계산 완료를 기록한다. PK와 INSERT IGNORE가 동시 실행의 선행 게이트다.
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT IGNORE INTO weekly_ranking_run (week_start, created_at)
            VALUES (:weekStart, :now)
            """)
    int tryStart(@Param("weekStart") LocalDate weekStart, @Param("now") LocalDateTime now);

    @Query(nativeQuery = true, value = """
            SELECT COUNT(*) FROM weekly_ranking_run WHERE week_start = :weekStart
            """)
    long countRun(@Param("weekStart") LocalDate weekStart);

    // 기간 [from, to) 안의 좋아요·댓글(삭제 제외)을 글마다 미리 집계해 붙인다 — 점수 = 좋아요×2 + 댓글×3.
    // 8-2(×3 + ×1)와 점수식이 다르다(요구가 다르다). 동점은 최근에 발행된 글 → id 큰 순.
    @Query(nativeQuery = true, value = """
            SELECT p.id AS postId, p.title AS title,
                   COALESCE(l.cnt, 0) AS likes, COALESCE(c.cnt, 0) AS comments,
                   COALESCE(l.cnt, 0) * 2 + COALESCE(c.cnt, 0) * 3 AS score
              FROM post p
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM post_like
                          WHERE created_at >= :from AND created_at < :to GROUP BY post_id) l ON l.post_id = p.id
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM comment
                          WHERE deleted_at IS NULL AND created_at >= :from AND created_at < :to GROUP BY post_id) c ON c.post_id = p.id
             WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
               AND COALESCE(l.cnt, 0) * 2 + COALESCE(c.cnt, 0) * 3 > 0
             ORDER BY score DESC, p.published_at DESC, p.id DESC
             LIMIT :limit
            """)
    List<WeeklyScoreRow> aggregate(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                   @Param("limit") int limit);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`WeeklyRanking.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

`src/main/java/org/example/batch/WeeklyRanking.java`

```java
package org.example.batch;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 주간 랭킹 스냅샷 한 줄(V61) — 만든 뒤에는 바꾸지 않는다
@Entity
@Table(name = "weekly_ranking")
public class WeeklyRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(nullable = false)
    private Integer ranking;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Integer likes;

    @Column(nullable = false)
    private Integer comments;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected WeeklyRanking() {
        // JPA
    }

    public WeeklyRanking(LocalDate weekStart, int ranking, Long postId, String title,
                         int score, int likes, int comments, LocalDateTime now) {
        this.weekStart = weekStart;
        this.ranking = ranking;
        this.postId = postId;
        this.title = title;
        this.score = score;
        this.likes = likes;
        this.comments = comments;
        this.createdAt = now;
    }

    public LocalDate getWeekStart() {
        return weekStart;
    }

    public Integer getRanking() {
        return ranking;
    }

    public Long getPostId() {
        return postId;
    }

    public String getTitle() {
        return title;
    }

    public Integer getScore() {
        return score;
    }

    public Integer getLikes() {
        return likes;
    }

    public Integer getComments() {
        return comments;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V61__create_weekly_ranking.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V61__create_weekly_ranking.sql`

```sql
-- V61 — 주간 랭킹 스냅샷(15-2). 매주 월요일에 지난 7일 점수 상위 10개를 "그때의 값 그대로" 저장한다.
-- 스냅샷이라 나중에 좋아요가 바뀌어도 다시 계산하지 않는다. 제목도 그때 것을 복사해 둔다.
-- post_id에 FK를 걸지 않는다 — 원본 글이 휴지통에서 영구 삭제(15-4)돼도 지난 랭킹 기록은 남아야 한다.
-- 순위 컬럼 이름은 ranking — RANK는 MySQL 8의 윈도 함수 이름이라 컬럼명으로 쓰면 따옴표가 필요하다.
CREATE TABLE weekly_ranking (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    week_start DATE         NOT NULL,
    ranking    INT          NOT NULL,
    post_id    BIGINT       NOT NULL,
    title      VARCHAR(200) NOT NULL,
    score      INT          NOT NULL,
    likes      INT          NOT NULL,
    comments   INT          NOT NULL,
    created_at DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_weekly_ranking_rank (week_start, ranking),
    UNIQUE KEY uk_weekly_ranking_post (week_start, post_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '주간 랭킹 스냅샷 — 주(월요일 시작)마다 상위 10';

-- 후보가 0건인 주도 한 번 계산한 사실을 남긴다. 이 표식이 없으면 빈 주를 매번 다시 집계한다.
-- PK가 수동/예약 동시 실행을 직렬화하고, 응답의 created 값을 일관되게 만든다.
CREATE TABLE weekly_ranking_run (
    week_start DATE NOT NULL PRIMARY KEY,
    created_at DATETIME NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '주간 랭킹 계산 완료 — 빈 주 포함';
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`WeeklyRankingScheduler.java`. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다. 변경된 메서드: `weekly`.

`src/main/java/org/example/batch/WeeklyRankingScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

// 매주 월요일 0시 10분(서울) — 0시 정각의 명예의 전당과 겹치지 않게 조금 뒤에 돈다
@Component
public class WeeklyRankingScheduler {

    private final WeeklyRankingService weeklyRankingService;
    private final Clock clock;

    public WeeklyRankingScheduler(WeeklyRankingService weeklyRankingService, Clock clock) {
        this.weeklyRankingService = weeklyRankingService;
        this.clock = clock;
    }

    @Scheduled(cron = "0 10 0 * * MON", zone = "Asia/Seoul")
    public void weekly() {
        weeklyRankingService.run(LocalDate.now(clock));
    }
}
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`WeeklyRankingNotFoundException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleMissingParameter`, `handleWeeklyRankingNotFound`.

`src/main/java/org/example/batch/WeeklyRankingNotFoundException.java`

```java
package org.example.batch;

import java.time.LocalDate;

public class WeeklyRankingNotFoundException extends RuntimeException {

    public WeeklyRankingNotFoundException(LocalDate weekStart) {
        super(weekStart + " 주의 랭킹 스냅샷이 없습니다.");
    }
}
```

`src/main/java/org/example/common/ApiExceptionHandler.java`

```java
package org.example.common;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.core.JacksonException;
import org.example.admin.AdminOnlyException;
import org.example.admin.ModerationConflictException;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.MemberNotActiveException;
import org.example.auth.MemberSuspendedException;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardWriteForbiddenException;
import org.example.bookmark.BookmarkFolderNotFoundException;
import org.example.bookmark.InvalidBookmarkFieldException;
import org.example.bookmark.BookmarkNotFoundException;
import org.example.bookmark.DuplicateBookmarkFolderNameException;
import org.example.bookmark.InvalidBookmarkFolderException;
import org.example.bookmark.SharedFolderNotFoundException;
import org.example.comment.CommentForbiddenException;
import org.example.comment.CommentNotFoundException;
import org.example.comment.InvalidParentCommentException;
import org.example.image.EmptyImageException;
import org.example.image.ImageNotFoundException;
import org.example.image.UnsupportedImageException;
import org.example.like.SelfLikeNotAllowedException;
import org.example.member.MemberNotFoundException;
import org.example.moderation.BannedContentException;
import org.example.moderation.BannedWordNotFoundException;
import org.example.moderation.DuplicateBannedWordException;
import org.example.notification.NotificationNotFoundException;
import org.example.post.InvalidParametersException;
import org.example.post.InvalidPostFieldException;
import org.example.post.InvalidSearchConditionException;
import org.example.post.PostForbiddenException;
import org.example.post.PostNotDeletedException;
import org.example.revision.RevisionForbiddenException;
import org.example.post.PostNotDraftException;
import org.example.post.PostRestoreExpiredException;
import org.example.post.PostRestoreForbiddenException;
import org.example.post.PostNotFoundException;
import org.example.post.PostStatusConflictException;
import org.example.post.TooManyPostsException;
import org.example.report.DuplicateReportException;
import org.example.report.NothingToResolveException;
import org.example.report.ReportTargetNotFoundException;
import org.example.report.SelfReportNotAllowedException;
import org.example.social.FollowBlockedException;
import org.example.social.SelfFollowNotAllowedException;
import org.example.social.SelfMuteNotAllowedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.net.URI;
import java.util.List;
import java.util.Map;
import org.example.poll.InvalidPollException;
import org.example.poll.PollConflictException;
import org.example.poll.PollNotFoundException;
import org.example.pin.InvalidPinException;
import org.example.series.SeriesForbiddenException;
import org.example.series.SeriesNotFoundException;
import org.example.batch.InvalidJobParameterException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.example.batch.WeeklyRankingNotFoundException;
import org.springframework.web.bind.MissingServletRequestParameterException;

// 모든 컨트롤러의 에러 응답을 한 곳에서 RFC 9457 Problem Details로 만든다.
// 컨트롤러마다 try-catch를 두지 않는다.
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> Map.of(
                        "field", fieldError.getField(),
                        "message", fieldError.getDefaultMessage() == null ? "" : fieldError.getDefaultMessage()
                ))
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    // 13-4 금칙어 — 1-5 검증 오류와 같은 모양(어느 필드인지 errors에)
    @ExceptionHandler(BannedContentException.class)
    public ProblemDetail handleBannedContent(BannedContentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }

    @ExceptionHandler(DuplicateBannedWordException.class)
    public ProblemDetail handleDuplicateBannedWord(DuplicateBannedWordException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BannedWordNotFoundException.class)
    public ProblemDetail handleBannedWordNotFound(BannedWordNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        // 11-1 JSON 문법은 맞는데 한 필드의 형식이 틀린 경우(숫자 자리에 "abc", 목록 자리에 문자열) —
        // Jackson이 남긴 경로로 어느 필드인지 errors에 담는다. 목록 안이면 Bean Validation과 같은 모양(imageIds[0]).
        // JSON 문법 자체가 깨졌으면 경로가 비어 있어 errors 없이 400만 나간다. Jackson은 첫 오류에서 멈추므로 하나만 들어간다.
        if (ex.getCause() instanceof JacksonException jackson && !jackson.getPath().isEmpty()) {
            problem.setProperty("errors", List.of(Map.of("field", fieldPath(jackson), "message", "형식이 올바르지 않습니다.")));
        }
        return problem;
    }

    // 11-1 경로·쿼리 값의 형식 오류(/api/posts/abc, ?size=abc) — 그대로 두면 Spring 기본 응답이라 어느 값이 틀렸는지 없다
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getName(),
                "message", "형식이 올바르지 않습니다: " + ex.getValue())));
        return problem;
    }

    private static String fieldPath(JacksonException jackson) {
        StringBuilder field = new StringBuilder();
        for (JacksonException.Reference ref : jackson.getPath()) {
            if (ref.getPropertyName() != null) {
                if (!field.isEmpty()) {
                    field.append('.');
                }
                field.append(ref.getPropertyName());
            } else {
                field.append('[').append(ref.getIndex()).append(']');
            }
        }
        return field.toString();
    }

    @ExceptionHandler(BoardNotFoundException.class)
    public ProblemDetail handleBoardNotFound(BoardNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail handlePostNotFound(PostNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BoardWriteForbiddenException.class)
    public ProblemDetail handleBoardWriteForbidden(BoardWriteForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfLikeNotAllowedException.class)
    public ProblemDetail handleSelfLikeNotAllowed(SelfLikeNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostForbiddenException.class)
    public ProblemDetail handlePostForbidden(PostForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-1 임시저장이 아닌 글을 발행 — 지금 상태와 충돌
    @ExceptionHandler(PostNotDraftException.class)
    public ProblemDetail handlePostNotDraft(PostNotDraftException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-6 이력은 작성자·운영자만
    @ExceptionHandler(RevisionForbiddenException.class)
    public ProblemDetail handleRevisionForbidden(RevisionForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-5 복구
    @ExceptionHandler(PostNotDeletedException.class)
    public ProblemDetail handlePostNotDeleted(PostNotDeletedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreForbiddenException.class)
    public ProblemDetail handlePostRestoreForbidden(PostRestoreForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreExpiredException.class)
    public ProblemDetail handlePostRestoreExpired(PostRestoreExpiredException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.GONE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-2 이미지 업로드
    @ExceptionHandler(EmptyImageException.class)
    public ProblemDetail handleEmptyImage(EmptyImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(UnsupportedImageException.class)
    public ProblemDetail handleUnsupportedImage(UnsupportedImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // spring.servlet.multipart.max-file-size를 넘으면 컨트롤러에 오기 전에(요청을 읽는 단계에서) 터진다
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUploadSize(HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONTENT_TOO_LARGE, "파일은 1MB까지 올릴 수 있습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ImageNotFoundException.class)
    public ProblemDetail handleImageNotFound(ImageNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-4 쿼리 파라미터 여러 개를 한꺼번에 검사한 결과
    @ExceptionHandler(InvalidParametersException.class)
    public ProblemDetail handleInvalidParameters(InvalidParametersException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
                .toList());
        return problem;
    }

    @ExceptionHandler(InvalidPostFieldException.class)
    public ProblemDetail handleInvalidPostField(InvalidPostFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ProblemDetail handleCommentNotFound(CommentNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidParentCommentException.class)
    public ProblemDetail handleInvalidParentComment(InvalidParentCommentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(CommentForbiddenException.class)
    public ProblemDetail handleCommentForbidden(CommentForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkFolderNotFoundException.class)
    public ProblemDetail handleBookmarkFolderNotFound(BookmarkFolderNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkNotFoundException.class)
    public ProblemDetail handleBookmarkNotFound(BookmarkNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFolderException.class)
    public ProblemDetail handleInvalidBookmarkFolder(InvalidBookmarkFolderException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateBookmarkFolderNameException.class)
    public ProblemDetail handleDuplicateBookmarkFolderName(DuplicateBookmarkFolderNameException ex,
                                                           HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidCursorException.class)
    public ProblemDetail handleInvalidCursor(InvalidCursorException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidSearchConditionException.class)
    public ProblemDetail handleInvalidSearchCondition(InvalidSearchConditionException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(AdminOnlyException.class)
    public ProblemDetail handleAdminOnly(AdminOnlyException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostStatusConflictException.class)
    public ProblemDetail handlePostStatusConflict(PostStatusConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ModerationConflictException.class)
    public ProblemDetail handleModerationConflict(ModerationConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NotificationNotFoundException.class)
    public ProblemDetail handleNotificationNotFound(NotificationNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(MemberNotFoundException.class)
    public ProblemDetail handleMemberNotFound(MemberNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfFollowNotAllowedException.class)
    public ProblemDetail handleSelfFollow(SelfFollowNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfMuteNotAllowedException.class)
    public ProblemDetail handleSelfMute(SelfMuteNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(FollowBlockedException.class)
    public ProblemDetail handleFollowBlocked(FollowBlockedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ReportTargetNotFoundException.class)
    public ProblemDetail handleReportTargetNotFound(ReportTargetNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfReportNotAllowedException.class)
    public ProblemDetail handleSelfReport(SelfReportNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NothingToResolveException.class)
    public ProblemDetail handleNothingToResolve(NothingToResolveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateReportException.class)
    public ProblemDetail handleDuplicateReport(DuplicateReportException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 13-5 도배 방지 — 429 + Retry-After(몇 초 뒤에 다시 하면 되는지). 본문에도 같은 값을 싣는다
    @ExceptionHandler(TooManyPostsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyPosts(TooManyPostsException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("retryAfterSeconds", ex.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(problem);
    }

    @ExceptionHandler(PollNotFoundException.class)
    public ProblemDetail handlePollNotFound(PollNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPollException.class)
    public ProblemDetail handleInvalidPoll(InvalidPollException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(PollConflictException.class)
    public ProblemDetail handlePollConflict(PollConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPinException.class)
    public ProblemDetail handleInvalidPin(InvalidPinException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        if (ex.getField() != null) {
            problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        }
        return problem;
    }

    @ExceptionHandler(SeriesNotFoundException.class)
    public ProblemDetail handleSeriesNotFound(SeriesNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SeriesForbiddenException.class)
    public ProblemDetail handleSeriesForbidden(SeriesForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SharedFolderNotFoundException.class)
    public ProblemDetail handleSharedFolderNotFound(SharedFolderNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 15-1 쿼리 파라미터 범위 오류(@Min·@Max) — 틀린 파라미터를 모두 errors에
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail handleMethodValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        List<Map<String, String>> errors = ex.getParameterValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream().map(e -> Map.of(
                        "field", String.valueOf(r.getMethodParameter().getParameterName()),
                        "message", e.getDefaultMessage() == null ? "" : e.getDefaultMessage())))
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(InvalidJobParameterException.class)
    public ProblemDetail handleInvalidJobParameter(InvalidJobParameterException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    // 15-2 필수 쿼리 파라미터 없음(weekStart)
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingParameter(MissingServletRequestParameterException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getParameterName(), "message", "필수 값입니다.")));
        return problem;
    }

    @ExceptionHandler(WeeklyRankingNotFoundException.class)
    public ProblemDetail handleWeeklyRankingNotFound(WeeklyRankingNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFieldException.class)
    public ProblemDetail handleInvalidBookmarkField(InvalidBookmarkFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    // 누구인지 모름 — WWW-Authenticate 헤더를 함께 내려준다
    @ExceptionHandler(AuthenticationRequiredException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationRequired(AuthenticationRequiredException ex,
                                                                       HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
                .body(problem);
    }

    // 13-3 기간 정지 중 쓰기 — 언제 풀리는지·왜인지를 함께 준다(화면이 안내 문구를 만들 수 있게)
    @ExceptionHandler(MemberSuspendedException.class)
    public ProblemDetail handleMemberSuspended(MemberSuspendedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("suspendedUntil", ex.getSuspendedUntil());
        problem.setProperty("reason", ex.getReason());
        return problem;
    }

    // 누구인지는 알지만(토큰은 유효) 회원 상태 때문에 안 됨
    @ExceptionHandler(MemberNotActiveException.class)
    public ProblemDetail handleMemberNotActive(MemberNotActiveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`WeeklyRankingItem.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

`src/main/java/org/example/batch/WeeklyRankingItem.java`

```java
package org.example.batch;

public record WeeklyRankingItem(int rank, Long postId, String title, int score, int likes, int comments) {
}
```

</details>

### MyBatis 대안 — 지난 7일 집계와 랭킹 스냅샷

`weekly_ranking_run`의 PK와 `INSERT IGNORE`가 빈 주까지 계산 완료를 남기고 수동·예약 동시 실행을 선행 게이트에서 조정한다. `WeeklyRankingMapper`는 좋아요·댓글을 각각 `[from, to)`에 집계한다.

저장된 제목·점수·순위를 다시 조회하고, 후보 0건이어도 첫 실행은 `created=true`, 재실행은 `false`, 조회는 빈 목록 200이다. Controller·Scheduler·Flyway V61·응답 DTO는 공통 코드를 쓴다.

<details>
<summary>MyBatis / 설정 — build.gradle</summary>

`build.gradle`

```groovy
plugins {
    id 'java'
    // bootRun / bootJar 태스크 제공 + 실행 가능한 fat jar 패키징
    id 'org.springframework.boot' version '4.1.1'
    // Boot BOM을 적용해서 아래 의존성들의 버전을 생략할 수 있게 해줌
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'org.example'
version = '1.0-SNAPSHOT'

java {
    toolchain {
        // 컴파일·실행 JDK를 고정 (Boot 4는 Java 17 이상 필요, 로컬에 설치된 21 사용)
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    // Spring MVC + 내장 Tomcat + Jackson (Boot 4부터 starter-web → starter-webmvc로 이름 변경)
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    // JPA(Hibernate) + HikariCP 커넥션 풀
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
    // @Valid, @NotBlank 같은 요청 값 검증
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    // MySQL JDBC 드라이버 — 컴파일엔 필요 없고 실행할 때만 필요
    runtimeOnly 'com.mysql:mysql-connector-j'
    // 9-1 스키마 변경은 Flyway 마이그레이션(db/migration)으로만 한다
    implementation 'org.springframework.boot:spring-boot-starter-flyway'
    runtimeOnly 'org.flywaydb:flyway-mysql'
    // 13-7 API 문서(OpenAPI 3.1 + Swagger UI) — springdoc 3.x가 Spring Boot 4용(3.1.1은 Boot 4.1.0 기준으로 빌드됨).
    // Boot BOM이 관리하지 않는 라이브러리라 버전을 직접 적는다
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1'

    // 테스트: JUnit·AssertJ·Mockito·MockMvc 묶음 (버전은 Boot BOM이 관리하므로 junit-bom 따로 두지 않음)
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    // @DataJpaTest(리포지토리만 띄우는 테스트)
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    // 테스트용 일회용 MySQL 컨테이너 — application-test.yml의 jdbc:tc: URL이 쓴다
    testImplementation 'org.testcontainers:testcontainers-mysql'
    // Gradle이 JUnit Platform 테스트를 실행할 때 필요한 런처
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
    // 테스트는 application-test.yml(Testcontainers MySQL)을 쓰게 한다
    systemProperty 'spring.profiles.active', 'test'
}
```

</details>

<details>
<summary>MyBatis / 설정 — application.yml</summary>

`src/main/resources/application.yml`

```yaml
spring:
  application:
    name: javaExperience
  datasource:
    # javaExperience MySQL의 community DB. 시작하기 안내대로 javaExperience DB를 먼저 띄운다
    url: jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  flyway:
    # 이미 테이블·데이터가 있는 DB(compose의 community·practice)는 V1(CREATE TABLE)을 실행하면 실패한다.
    # 그래서 기록 테이블이 없으면 "V1까지 됐다"고만 적고(baseline) V2부터 실행한다. 빈 DB면 V1부터 실제로 실행한다.
    baseline-on-migrate: true
    baseline-version: 1
  servlet:
    multipart:
      # 11-2 이미지 한 장 1MB, 요청 전체 2MB까지. 넘으면 MaxUploadSizeExceededException → 413
      max-file-size: 1MB
      max-request-size: 2MB
  jpa:
    hibernate:
      # 스키마는 Flyway만 바꾼다(9-1). 엔티티가 테이블과 다르면 기동이 실패한다(테이블을 몰래 바꾸지 않음)
      ddl-auto: validate
    # 트랜잭션이 끝나면 커넥션을 바로 반납한다(컨트롤러·직렬화 단계까지 붙잡지 않음)
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
        # 컬렉션(태그) 지연 로딩을 글마다 1번이 아니라 IN (...) 한 번으로 묶는다(2-4, N+1 대응)
        default_batch_fetch_size: 100

# 11-2 올린 이미지를 저장할 폴더(앱을 실행한 위치 기준). git에는 올리지 않는다(.gitignore)
app:
  upload-dir: uploads

logging:
  level:
    # 실행 SQL은 확인하되 토큰을 포함한 바인딩 값은 로그에 남기지 않는다
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: info

# 0-6 — 내가 정한 설정 값. 코드에서 @Value("${start.greeting}")로 읽는다
start:
  greeting: 반가워요, 백엔드!
  max-items: 5

# 13-7 앱 개발자가 문서를 열면 사용자용 API 그룹을 먼저 보여 준다.
springdoc:
  swagger-ui:
    urls-primary-name: public

# 15-2 MyBatis 주간 랭킹 SQL 매퍼
mybatis:
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / DTO — WeeklyScoreCandidate.java</summary>

`src/main/java/org/example/batch/WeeklyScoreCandidate.java`

```java
package org.example.batch;

// 기간 안의 반응 수와 점수 — 아직 순위를 매기거나 스냅샷에 저장하기 전의 행
public record WeeklyScoreCandidate(Long postId, String title, long likes, long comments, long score) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — WeeklyRankingMapper.java</summary>

`src/main/java/org/example/batch/WeeklyRankingMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface WeeklyRankingMapper {

    int tryStart(@Param("weekStart") LocalDate weekStart, @Param("now") LocalDateTime now);

    boolean existsRun(@Param("weekStart") LocalDate weekStart);

    List<WeeklyScoreCandidate> aggregate(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to,
                                         @Param("limit") int limit);

    int insertIgnore(@Param("weekStart") LocalDate weekStart, @Param("ranking") int ranking,
                     @Param("postId") Long postId, @Param("title") String title,
                     @Param("score") int score, @Param("likes") int likes,
                     @Param("comments") int comments, @Param("now") LocalDateTime now);

    List<WeeklyRankingItem> findByWeekStart(@Param("weekStart") LocalDate weekStart);
}
```

</details>

<details>
<summary>MyBatis / SQL — WeeklyRankingMapper.xml</summary>

`src/main/resources/mapper/WeeklyRankingMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.WeeklyRankingMapper">
    <resultMap id="candidate" type="org.example.batch.WeeklyScoreCandidate">
        <constructor>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="title" javaType="java.lang.String"/>
            <arg column="likes" javaType="_long"/>
            <arg column="comments" javaType="_long"/>
            <arg column="score" javaType="_long"/>
        </constructor>
    </resultMap>
    <resultMap id="item" type="org.example.batch.WeeklyRankingItem">
        <constructor>
            <arg column="ranking" javaType="_int"/>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="title" javaType="java.lang.String"/>
            <arg column="score" javaType="_int"/>
            <arg column="likes" javaType="_int"/>
            <arg column="comments" javaType="_int"/>
        </constructor>
    </resultMap>

    <insert id="tryStart">
        INSERT IGNORE INTO weekly_ranking_run (week_start, created_at)
        VALUES (#{weekStart}, #{now})
    </insert>

    <select id="existsRun" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM weekly_ranking_run WHERE week_start = #{weekStart})
    </select>

    <select id="aggregate" resultMap="candidate">
        SELECT p.id AS post_id, p.title,
               COALESCE(l.cnt, 0) AS likes, COALESCE(c.cnt, 0) AS comments,
               COALESCE(l.cnt, 0) * 2 + COALESCE(c.cnt, 0) * 3 AS score
          FROM post p
          LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM post_like
                      WHERE created_at &gt;= #{from} AND created_at &lt; #{to}
                      GROUP BY post_id) l ON l.post_id = p.id
          LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM comment
                      WHERE deleted_at IS NULL AND created_at &gt;= #{from} AND created_at &lt; #{to}
                      GROUP BY post_id) c ON c.post_id = p.id
         WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
           AND COALESCE(l.cnt, 0) * 2 + COALESCE(c.cnt, 0) * 3 &gt; 0
         ORDER BY score DESC, p.published_at DESC, p.id DESC
         LIMIT #{limit}
    </select>

    <insert id="insertIgnore">
        INSERT IGNORE INTO weekly_ranking
            (week_start, ranking, post_id, title, score, likes, comments, created_at)
        VALUES (#{weekStart}, #{ranking}, #{postId}, #{title}, #{score}, #{likes}, #{comments}, #{now})
    </insert>

    <select id="findByWeekStart" resultMap="item">
        SELECT ranking, post_id, title, score, likes, comments
          FROM weekly_ranking
         WHERE week_start = #{weekStart}
         ORDER BY ranking ASC
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — WeeklyRankingService.java</summary>

`src/main/java/org/example/batch/WeeklyRankingService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

// 기간 집계는 MyBatis SQL로 하고, 만든 주의 응답은 저장된 스냅샷에서 읽는다.
@Service
public class WeeklyRankingService {

    public static final int TOP = 10;
    private static final LocalDate MIN_DATABASE_DATE = LocalDate.of(1000, 1, 1);
    private static final Logger log = LoggerFactory.getLogger(WeeklyRankingService.class);

    private final WeeklyRankingMapper mapper;
    private final Clock clock;

    public WeeklyRankingService(WeeklyRankingMapper mapper, Clock clock) {
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public WeeklyRankingResponse run(LocalDate date) {
        requireMonday("date", date);
        LocalDate weekStart = date.minusDays(7);
        LocalDateTime now = LocalDateTime.now(clock);
        if (mapper.tryStart(weekStart, now) == 0) {
            return new WeeklyRankingResponse(weekStart, false, mapper.findByWeekStart(weekStart));
        }

        LocalDateTime from = weekStart.atStartOfDay();
        LocalDateTime to = date.atStartOfDay();
        int ranking = 1;
        int inserted = 0;
        for (WeeklyScoreCandidate row : mapper.aggregate(from, to, TOP)) {
            inserted += mapper.insertIgnore(weekStart, ranking++, row.postId(), row.title(),
                    Math.toIntExact(row.score()), Math.toIntExact(row.likes()),
                    Math.toIntExact(row.comments()), now);
        }
        log.info("주간 랭킹 week={} [{} ~ {}) {}개 저장", weekStart, from, to, inserted);
        return new WeeklyRankingResponse(weekStart, true, mapper.findByWeekStart(weekStart));
    }

    @Transactional(readOnly = true)
    public WeeklyRankingResponse get(LocalDate weekStart) {
        requireMonday("weekStart", weekStart);
        if (!mapper.existsRun(weekStart)) {
            throw new WeeklyRankingNotFoundException(weekStart);
        }
        return new WeeklyRankingResponse(weekStart, false, mapper.findByWeekStart(weekStart));
    }

    private static void requireMonday(String field, LocalDate date) {
        LocalDate min = "date".equals(field) ? MIN_DATABASE_DATE.plusDays(7) : MIN_DATABASE_DATE;
        if (date.isBefore(min)) {
            throw new InvalidJobParameterException(field, field + "는 " + min + " 이후여야 합니다.");
        }
        if (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new InvalidJobParameterException(field, field + "는 월요일이어야 합니다(" + date + "는 " + date.getDayOfWeek() + ").");
        }
    }
}
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p01'
show() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["weekStart"], d["created"], [(i["rank"], i["postId"], i["score"]) for i in d["items"]])'; }
curl -s -X POST "$BASE/api/admin/jobs/weekly-ranking/run?date=2026-10-05" -H "$A" | show   # W1
curl -s -X POST "$BASE/api/admin/jobs/weekly-ranking/run?date=2026-10-05" -H "$A" | show   # W2 같은 주 한 번 더
curl -s -X POST "$BASE/api/admin/jobs/weekly-ranking/run?date=2026-09-28" -H "$A" | show   # W3
curl -s "$BASE/api/rankings/weekly?weekStart=2026-09-21" | show                             # W4
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/rankings/weekly?weekStart=2026-01-05"  # W5
curl -s -X POST "$BASE/api/admin/jobs/weekly-ranking/run?date=2026-10-01" -H "$A"; echo     # W6 목요일
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "W1",
      "title": "10-05(월) 실행 — 9/28 주",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W2",
      "title": "같은 주 한 번 더",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W3",
      "title": "09-28(월) 실행 — 9/21 주",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-09-28",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W4",
      "title": "9/21 주 조회",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2026-09-21"
    },
    {
      "id": "W5",
      "title": "스냅샷 없는 주",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2026-01-05"
    },
    {
      "id": "W6",
      "title": "월요일 아닌 날 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-01",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W7",
      "title": "미래 월요일 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-12",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W8",
      "title": "조회 — 월요일 아님",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2026-09-22"
    },
    {
      "id": "W9",
      "title": "조회 — weekStart 없음",
      "method": "GET",
      "path": "/api/rankings/weekly"
    },
    {
      "id": "W10",
      "title": "조회 — 형식 아님",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2026/09/21"
    },
    {
      "id": "W11",
      "title": "일반 회원 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "W12",
      "title": "토큰 없이 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-05"
    },
    {
      "id": "W13",
      "title": "조회 — weekStart 공백",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=%20"
    },
    {
      "id": "W18",
      "title": "실행 — DB 날짜 하한 밖",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=1000-01-06",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W19",
      "title": "조회 — DB 날짜 하한 밖",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=0999-12-30"
    },
    {
      "id": "W17",
      "title": "후보 0건인 주 실행 전 조회",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2025-12-29"
    },
    {
      "id": "W14",
      "title": "후보 0건인 주 첫 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-01-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W15",
      "title": "후보 0건인 주 재실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-01-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W16",
      "title": "후보 0건인 주 조회",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2025-12-29"
    },
    {
      "id": "W20",
      "title": "DB 날짜 하한 안의 첫 월요일 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=1000-01-13",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "W21",
      "title": "DB 날짜 하한 안의 첫 월요일 재실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=1000-01-13",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "W1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.weekStart",
            "equals": "2026-09-28"
          },
          {
            "path": "$.items[*].rank",
            "equals": [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10
            ]
          },
          {
            "path": "$.items[*].postId",
            "equals": [
              145,
              143,
              140,
              144,
              139,
              4,
              141,
              133,
              70,
              48
            ]
          },
          {
            "path": "$.items[*].score",
            "equals": [
              43,
              43,
              13,
              9,
              8,
              6,
              3,
              3,
              3,
              3
            ]
          },
          {
            "path": "$.items[0].likes",
            "equals": 20
          },
          {
            "path": "$.items[0].comments",
            "equals": 1
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "W2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.created",
            "equals": false
          },
          {
            "path": "$.items[*].postId",
            "equals": [
              145,
              143,
              140,
              144,
              139,
              4,
              141,
              133,
              70,
              48
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "W3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.weekStart",
                "equals": "2026-09-21"
              },
              {
                "path": "$.items[*].postId",
                "equals": [
                  131,
                  130,
                  134,
                  139,
                  133,
                  140,
                  132,
                  138,
                  135,
                  141
                ]
              }
            ]
          }
        },
        {
          "request": "W4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.weekStart",
                "equals": "2026-09-21"
              },
              {
                "path": "$.items[*].postId",
                "equals": [
                  131,
                  130,
                  134,
                  139,
                  133,
                  140,
                  132,
                  138,
                  135,
                  141
                ]
              },
              {
                "path": "$.items[*].score",
                "equals": [
                  48,
                  41,
                  26,
                  20,
                  19,
                  17,
                  15,
                  14,
                  14,
                  8
                ]
              }
            ]
          }
        },
        {
          "request": "W5",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "W6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "date"
              }
            ]
          }
        },
        {
          "request": "W7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "date"
              }
            ]
          }
        },
        {
          "request": "W8",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "weekStart"
              }
            ]
          }
        },
        {
          "request": "W9",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "weekStart"
              }
            ]
          }
        },
        {
          "request": "W10",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "weekStart"
              }
            ]
          }
        },
        {
          "request": "W13",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "weekStart"
              }
            ]
          }
        },
        {
          "request": "W18",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "date"
              }
            ]
          }
        },
        {
          "request": "W19",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "weekStart"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "W11",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "W12",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "W17",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "W14",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.weekStart", "equals": "2025-12-29" },
              { "path": "$.created", "equals": true },
              { "path": "$.items", "length": 0 }
            ]
          }
        },
        {
          "request": "W15",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.created", "equals": false },
              { "path": "$.items", "length": 0 }
            ]
          }
        },
        {
          "request": "W16",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.items", "length": 0 }
            ]
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "W20",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.weekStart", "equals": "1000-01-06" },
              { "path": "$.created", "equals": true },
              { "path": "$.items", "length": 0 }
            ]
          }
        },
        {
          "request": "W21",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.created", "equals": false },
              { "path": "$.items", "length": 0 }
            ]
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). 항목은 (postId, score).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | W1 | `weekStart`=`2026-09-28`, 순위 1~10 = `(145,43) (143,43) (140,13) (144,9) (139,8) (4,6) (141,3) (133,3) (70,3) (48,3)`. 43점 둘은 최근 글(145)이 먼저, 3점 넷은 발행 최신순 |
| C2 | W2 | `created`=`false`, 같은 10개 — 같은 주는 다시 계산하지 않는다 |
| C3 | W3 / W4 / W5 | `weekStart`=`2026-09-21`, `(131,48) (130,41) (134,26) (139,20) (133,19) (140,17) (132,15) (138,14) (135,14) (141,8)` — 실행 응답과 조회 응답이 같다 / 스냅샷 없는 주는 `404` |
| C4 | W6~W10 / W13 / W18 / W19 | 모두 `400` — 월요일·미래·필수값·형식·공백·DB 날짜 범위를 확인 |
| C5 | W11 / W12 | `403` / `401` |
| C6 | W17 / W14 / W15 / W16 | 후보 0건인 주: 실행 전 `404`, 첫 실행 `created=true`, 재실행 `false`, 실행 후 조회 `200`·빈 목록 |
| C7 | W20 / W21 | MySQL DATE 범위 안의 첫 월요일은 저장 가능하고 재실행 시 `created=false` |
| D1 | `SELECT week_start, COUNT(*) FROM weekly_ranking GROUP BY week_start ORDER BY week_start` | `2026-09-21 10`, `2026-09-28 10` — 몇 번을 돌려도 주마다 10행(15-6을 하면 `2026-09-14` 주가 더 생긴다) |
| D2 | `SELECT ranking, post_id, score FROM weekly_ranking WHERE week_start = '2026-09-28' AND ranking >= 7 ORDER BY ranking` | `7 141 3`, `8 133 3`, `9 70 3`, `10 48 3` |
| D3 | `SELECT week_start FROM weekly_ranking_run ORDER BY week_start` | `1000-01-06`, `2025-12-29`, `2026-09-21`, `2026-09-28` — 빈 주도 완료 표식이 남는다 |
| R1 | 기간 | `[weekStart 0시, date 0시)`를 `Clock`과 `date`에서 계산한다. 끝을 `<=`로 잡거나 `NOW()`·`LocalDateTime.now()`를 쓰지 않는다 |
| R2 | 스냅샷 | 조회 API는 저장된 행만 읽는다(부를 때마다 다시 집계하지 않는다). 제목·점수를 복사해 두어 원본이 바뀌거나 사라져도 그 주의 기록이 남는다 |
| R3 | 한 번만 | `weekly_ranking_run.week_start` PK와 `INSERT IGNORE`로 첫 실행만 표식을 만든다. 두 번째 실행은 저장된 결과를 읽고, 0건 주도 재집계하지 않는다. 표식과 10행은 같은 트랜잭션으로 넣는다. JPA·MyBatis 모두 중복 실행에 `created=false`로 응답한다 |
| R4 | 집계 | 8-2처럼 좋아요·댓글을 미리 집계한 서브쿼리 두 개를 붙여 한 번에 계산한다. 글마다 따로 세지 않는다 |

## 필요한 지식

- [W20 시간과 타임존](../../docs/knowledge/W20-time-timezone.md) — `[시작, 끝)`, 요일
- [R04 SQL로 데이터 다루기](../../docs/knowledge/R04-sql-crud-join.md) — 집계 서브쿼리 JOIN
- [P30 스케줄링 실무](../../docs/knowledge/P30-scheduling-practical.md) — cron 요일 필드
- [8-2. 최근 N일 인기글 랭킹](../ch8-query-deep/8-2-popular-ranking.md) — 같은 모양의 실시간 집계

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 월요일 확인</summary>

`date.getDayOfWeek() != DayOfWeek.MONDAY`면 400. Spring cron의 요일 필드는 `MON`처럼 이름으로 쓰는 편이 안전하다(숫자는 0과 7이 모두 일요일).
</details>

<details>
<summary>힌트 2 — 순위 매기기</summary>

정렬·`LIMIT 10`까지는 SQL로 하고, 순위 번호(1~10)는 받은 순서대로 자바에서 붙인다. SQL로 하려면 `ROW_NUMBER() OVER (ORDER BY score DESC, published_at DESC, id DESC)`도 된다.
</details>

## 다음 단계

[15-3. 예약 발행](15-3-scheduled-publish.md)
