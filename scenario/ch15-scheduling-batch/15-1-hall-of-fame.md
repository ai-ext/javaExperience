# 15-1. 명예의 전당 — 매일 0시 배치와 멱등

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고, 13·14장은 `community`였다). "지금"은 `app.fixed-now`의 2026-10-05 00:00(월요일)이다.

## 상황

> "좋아요를 많이 받은 글을 '명예의 전당'에 올려 주세요. 매일 0시에 **어제까지** 좋아요 20개 이상 받은 글을 찾아서요. 한번 올라간 글은 계속 남고, 같은 글이 두 번 올라가면 안 돼요. 어제 배치가 돌았는지 헷갈리면 운영자가 날짜를 넣고 다시 돌릴 수 있게 해 주세요."

8-5에서 `@Scheduled`·`@EnableScheduling`, 운영자 수동 실행 API, "예약 실행과 수동 실행이 같은 서비스 메서드" 구조를 이미 만들었다. 이 단계에서 새로 다루는 것은 셋이다.

- **기준일 파라미터** — 배치는 "언제 기준으로" 도는지가 있다. 0시에 도는 배치의 기준일은 그날이고, 세는 범위는 그날 0시 **전**까지다. 수동 실행은 날짜를 받아 "그날 0시에 돌았다면"을 재현한다.
- **삽입 멱등** — 8-5의 재계산은 몇 번 돌려도 같은 값으로 덮어써서 멱등이었다. 여기는 행을 **추가**하는 배치라 두 번 돌면 두 번 들어간다. DB의 `UNIQUE`가 마지막 방어선이다.
- **비정규화 숫자를 믿지 않기** — `post.like_count`는 어긋날 수 있다(8-5). 119번 글은 `like_count`가 10이지만 실제 좋아요 행은 5개다. 집계는 `post_like` 행으로 한다.

학습용 데이터에서 눈여겨볼 글:

| 글 | 사정 |
|---|---|
| 145 | 좋아요 20개 중 20번째가 **2026-10-04 01:14**에 눌렸다 → 10-04 기준(10-04 0시 전)은 19개, 10-05 기준은 20개 |
| 59 | 좋아요 22개지만 삭제된 글 → 올라가지 않는다 |
| 18·55·103·131 | 22개, 10·143은 20개 |

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 도구 — 명예의 전당 배치",
  "summary": "매일 0시에 도는 배치를 운영자가 날짜를 골라 바로 돌려 본다. 같은 날 두 번 돌려도 한 번만 올라간다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "운영 도구 · 배치",
      "right": "운영자"
    },
    {
      "type": "field",
      "id": "date",
      "label": "기준일(이날 0시 전까지의 좋아요를 센다)",
      "value": "2026-10-04"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "run",
          "label": "지금 실행",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "list",
      "id": "added",
      "label": "이번에 새로 올라간 글",
      "items": [
        {
          "id": "a18",
          "title": "#18 JPA N+1 문제 비교해보기",
          "meta": "♥22"
        },
        {
          "id": "a143",
          "title": "#143 MySQL 인덱스 설계 실전 적용 후기",
          "meta": "♥20"
        },
        {
          "id": "a145",
          "title": "#145 스프링 트랜잭션 전파 삽질기",
          "meta": "♥20 · 10-05에 올라감"
        }
      ],
      "footer": "외 4개"
    },
    {
      "type": "text",
      "id": "nothing",
      "value": "새로 올라간 글이 없어요",
      "emphasis": "caption",
      "tone": "muted"
    },
    {
      "type": "list",
      "id": "hall",
      "label": "명예의 전당(누구나 보는 화면)",
      "items": [
        {
          "id": "h145",
          "title": "#145 스프링 트랜잭션 전파 삽질기",
          "meta": "2026-10-05 · ♥20"
        },
        {
          "id": "h18",
          "title": "#18 JPA N+1 문제 비교해보기",
          "meta": "2026-10-04 · ♥22"
        }
      ],
      "footer": "모두 7개"
    }
  ],
  "flows": [
    {
      "name": "10-04 기준으로 실행",
      "steps": [
        {
          "kind": "user",
          "text": "기준일 2026-10-04로 [지금 실행]",
          "focus": [
            "date",
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-04",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "server",
          "text": "기준 시각 = 2026-10-04 00:00. 이 시각 '전'에 눌린 좋아요만 센다(10-04 당일 좋아요는 아직 '어제까지'가 아니다)"
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, COUNT(*) AS likes FROM post p JOIN post_like l ON l.post_id = p.id AND l.created_at < '2026-10-04 00:00'\nWHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL\n  AND NOT EXISTS (SELECT 1 FROM hall_of_fame h WHERE h.post_id = p.id)\nGROUP BY p.id HAVING COUNT(*) >= 20",
          "note": "post.like_count가 아니라 실제 좋아요 행을 센다"
        },
        {
          "kind": "db",
          "sql": "INSERT IGNORE INTO hall_of_fame (post_id, likes, entered_on, created_at) VALUES (18, 22, '2026-10-04', ?) …",
          "note": "UNIQUE(post_id) — 이미 있으면 0행"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"date\": \"2026-10-04\", \"minLikes\": 20, \"added\": [{\"postId\": 18, \"likes\": 22, …}, … 6개]}"
        },
        {
          "kind": "screen",
          "text": "6개가 올라간다. 145번은 10-04 01:14에 20번째 좋아요를 받아서 아직 19개",
          "focus": [
            "added"
          ]
        }
      ]
    },
    {
      "name": "오늘(10-05) 기준 — 두 번",
      "steps": [
        {
          "kind": "user",
          "text": "기준일을 2026-10-05로 바꿔 [지금 실행]",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
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
          "body": "{\"date\": \"2026-10-05\", \"minLikes\": 20, \"added\": [{\"postId\": 145, \"likes\": 20, …}]}"
        },
        {
          "kind": "screen",
          "text": "이미 올라간 6개는 다시 나오지 않고 145번만",
          "focus": [
            "a145"
          ]
        },
        {
          "kind": "user",
          "text": "실수로 한 번 더 누른다",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
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
          "body": "{\"date\": \"2026-10-05\", \"minLikes\": 20, \"added\": []}"
        },
        {
          "kind": "screen",
          "text": "같은 날 두 번 돌아도 한 번만",
          "focus": [
            "nothing"
          ]
        }
      ]
    },
    {
      "name": "명예의 전당 보기",
      "steps": [
        {
          "kind": "user",
          "text": "누구나 명예의 전당 화면을 연다",
          "focus": [
            "hall"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/hall-of-fame?size=20"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"postId\": 145, \"title\": \"…\", \"likes\": 20, \"enteredOn\": \"2026-10-05\"}, {\"postId\": 18, …, \"enteredOn\": \"2026-10-04\"}, …]"
        },
        {
          "kind": "screen",
          "text": "최근에 올라간 순 → 좋아요 많은 순",
          "focus": [
            "h145",
            "h18"
          ]
        }
      ]
    },
    {
      "name": "아직 오지 않은 날",
      "steps": [
        {
          "kind": "user",
          "text": "기준일에 2026-10-06을 넣는다",
          "focus": [
            "date"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-06",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "response",
          "status": 400,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\"status\": 400, \"errors\": [{\"field\": \"date\", \"message\": \"아직 오지 않은 날짜(2026-10-06)로는 실행할 수 없습니다. …\"}]}"
        },
        {
          "kind": "screen",
          "text": "기준일 칸 아래 빨간 글씨",
          "focus": [
            "date"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V60** — `db/migration/V60__create_hall_of_fame.sql` (15장은 V60~V69를 쓴다)

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `post_id` | FK → `post`, **`UNIQUE`** — 같은 글은 한 번만 |
| `likes` | 올라갈 때의 좋아요 수(그때의 기록) |
| `entered_on` | `DATE` — 올라간 기준일 |
| `created_at` | 행을 만든 시각 |

**배치**

| 항목 | 내용 |
|---|---|
| 예약 실행 | `@Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")` — 기준일 = `LocalDate.now(clock)` |
| 수동 실행 | `POST /api/admin/jobs/hall-of-fame/run?date=2026-10-04` — 운영자만(`tok-p01`). 다른 회원 `403`, 토큰 없음 `401`. 예약 실행과 **같은 서비스 메서드** |
| 세는 범위 | 기준일 0시 **전**에 눌린 좋아요(`post_like.created_at < 기준일 00:00`). 기준일 당일 좋아요는 넣지 않는다 |
| 대상 | `PUBLISHED`·`PUBLIC`·삭제 안 된 글, 좋아요 **20개 이상**(상수), 아직 안 올라간 글 |
| 응답 | `200`, 이번 실행에서 **새로** 올라간 글만(좋아요 많은 순 → `postId` 작은 순). 없으면 빈 배열 |
| 목록 | `GET /api/hall-of-fame?size=20` — 누구나. 지금도 볼 수 있는 글만, `entered_on` 최신 → `likes` 많은 순 → `postId` 작은 순 |

```json
{ "date": "2026-10-04", "minLikes": 20, "added": [ { "postId": 18, "title": "…", "likes": 22, "enteredOn": "2026-10-04" } ] }
```

**입력 규칙** — 틀리면 `400`이고 `errors`에 틀린 파라미터가 들어간다(`500`이 나오면 안 된다)

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `date`(실행) | 아니오 | 생략·빈 값·공백이면 오늘 | 오늘(Clock 기준)까지. **미래 날짜는 400** — 그날 좋아요가 아직 다 모이지 않았다 | `yyyy-MM-dd`. `2026-1-5`·`2026-02-30`·`abc`는 400 | 오늘 | `400`, `errors[].field = "date"` |
| `size`(목록) | 아니오 | 생략하면 20, 빈 값·공백은 오류 | 1~100 | 정수 | 20 | `400`, `errors[].field = "size"` |

`@RequestParam LocalDate`의 형식 오류는 컨트롤러에 들어오기 전에 `MethodArgumentTypeMismatchException`으로 터지므로 공통 처리기가 `errors`에 `date`를 담는다. `size`는 생략과 빈 문자열을 구별하기 위해 원문 `String`으로 받고 1~100 정수만 파싱한다.

범위 밖·빈 값·정수 초과는 `InvalidJobParameterException`으로 `400`과 `errors[].field = "size"`를 만든다. 다른 컨트롤러의 `@Min`·`@Max` 위반에 쓰는 `HandlerMethodValidationException` 공통 처리도 이 단계에서 추가한다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 기준 시각 = 2026-10-04 00:00. 이 시각 '전'에 눌린 좋아요만 센다(10-04 당일 좋아요는 아직 '어제까지'가 아니다)
- post.like_count가 아니라 실제 좋아요 행을 센다
- UNIQUE(post_id) — 이미 있으면 0행

<details>
<summary>Controller — HTTP 연결</summary>

`HallOfFameController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/admin/jobs/hall-of-fame/run")`, `@GetMapping("/api/hall-of-fame")`. 변경된 메서드: `run`, `list`.

`src/main/java/org/example/batch/HallOfFameController.java`

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
import java.util.List;

@RestController
public class HallOfFameController {

    private final HallOfFameService hallOfFameService;
    private final Clock clock;

    public HallOfFameController(HallOfFameService hallOfFameService, Clock clock) {
        this.hallOfFameService = hallOfFameService;
        this.clock = clock;
    }

    // 수동 실행 — cron을 기다리지 않고 "그 날짜에 돌았다면"을 바로 확인한다.
    // date는 yyyy-MM-dd(형식이 틀리면 타입 변환 실패 → 전역 핸들러가 400), 미래는 JobDates가 400.
    @PostMapping("/api/admin/jobs/hall-of-fame/run")
    public HallOfFameRunResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return hallOfFameService.run(JobDates.resolve(date, clock));
    }

    @GetMapping("/api/hall-of-fame")
    public List<HallOfFameEntry> list(@RequestParam(required = false) String size) {
        return hallOfFameService.list(parseSize(size));
    }

    private static int parseSize(String raw) {
        if (raw == null) {
            return 20;
        }
        if (!raw.matches("[0-9]+")) {
            throw new InvalidJobParameterException("size", "1~100 사이의 정수여야 합니다.");
        }
        try {
            int value = Integer.parseInt(raw);
            if (value >= 1 && value <= 100) {
                return value;
            }
        } catch (NumberFormatException ignored) {
            // int 범위 밖의 숫자도 400으로 응답한다.
        }
        throw new InvalidJobParameterException("size", "1~100 사이의 정수여야 합니다.");
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`HallOfFameListRow.java`, `HallOfFameRow.java`, `HallOfFameRunResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/HallOfFameListRow.java`

```java
package org.example.batch;

import java.time.LocalDate;

public interface HallOfFameListRow {

    Long getPostId();

    String getTitle();

    Integer getLikes();

    LocalDate getEnteredOn();
}
```

`src/main/java/org/example/batch/HallOfFameRow.java`

```java
package org.example.batch;

public interface HallOfFameRow {

    Long getPostId();

    String getTitle();

    Long getLikes();
}
```

`src/main/java/org/example/batch/HallOfFameRunResponse.java`

```java
package org.example.batch;

import java.time.LocalDate;
import java.util.List;

// added: 이번 실행에서 "새로" 올라간 글만. 이미 올라가 있던 글은 다시 나오지 않는다(두 번째 실행은 빈 배열).
public record HallOfFameRunResponse(LocalDate date, int minLikes, List<HallOfFameEntry> added) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`HallOfFameService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `run`, `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/batch/HallOfFameService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 15-1 명예의 전당 — 기준일(date) 0시 "전"까지 받은 좋아요가 20개 이상인 글을 올린다.
// 예약 실행(매일 0시)과 수동 실행(운영자 API)이 이 메서드 하나를 같이 쓴다.
@Service
public class HallOfFameService {

    public static final int MIN_LIKES = 20;
    private static final Logger log = LoggerFactory.getLogger(HallOfFameService.class);

    private final HallOfFameRepository hallOfFameRepository;
    private final Clock clock;

    public HallOfFameService(HallOfFameRepository hallOfFameRepository, Clock clock) {
        this.hallOfFameRepository = hallOfFameRepository;
        this.clock = clock;
    }

    @Transactional
    public HallOfFameRunResponse run(LocalDate date) {
        // 기간은 [처음, date 0시) — date 당일에 눌린 좋아요는 아직 "어제까지"가 아니다
        LocalDateTime cutoff = date.atStartOfDay();
        LocalDateTime now = LocalDateTime.now(clock);

        List<HallOfFameEntry> added = new ArrayList<>();
        for (HallOfFameRow row : hallOfFameRepository.findCandidates(cutoff, MIN_LIKES)) {
            if (hallOfFameRepository.insertIgnore(row.getPostId(), row.getLikes(), date, now) == 1) {
                added.add(new HallOfFameEntry(row.getPostId(), row.getTitle(), row.getLikes(), date));
            }
        }
        log.info("명예의 전당 date={} cutoff={} 새로 올라간 글 {}건 {}", date, cutoff, added.size(),
                added.stream().map(HallOfFameEntry::postId).toList());
        return new HallOfFameRunResponse(date, MIN_LIKES, added);
    }

    @Transactional(readOnly = true)
    public List<HallOfFameEntry> list(int size) {
        return hallOfFameRepository.findList(size).stream()
                .map(r -> new HallOfFameEntry(r.getPostId(), r.getTitle(), r.getLikes(), r.getEnteredOn()))
                .toList();
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`HallOfFameRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/batch/HallOfFameRepository.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface HallOfFameRepository extends Repository<Post, Long> {

    // 기준 시각(cutoff) "전"에 눌린 좋아요 행을 센다 — post.like_count(비정규화, 어긋날 수 있음)는 쓰지 않는다.
    // 볼 수 있는 글(PUBLISHED·PUBLIC·삭제 안 됨)만, 이미 올라간 글은 뺀다.
    @Query(nativeQuery = true, value = """
            SELECT p.id AS postId, p.title AS title, COUNT(*) AS likes
              FROM post p
              JOIN post_like l ON l.post_id = p.id AND l.created_at < :cutoff
             WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
               AND NOT EXISTS (SELECT 1 FROM hall_of_fame h WHERE h.post_id = p.id)
             GROUP BY p.id, p.title
            HAVING COUNT(*) >= :minLikes
             ORDER BY likes DESC, p.id ASC
            """)
    List<HallOfFameRow> findCandidates(@Param("cutoff") LocalDateTime cutoff, @Param("minLikes") int minLikes);

    // 위 조회와 INSERT 사이에 같은 배치가 한 번 더 돌아도 UNIQUE(post_id)가 막는다 — 들어간 행 수(0/1)만 받는다
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT IGNORE INTO hall_of_fame (post_id, likes, entered_on, created_at)
            VALUES (:postId, :likes, :enteredOn, :now)
            """)
    int insertIgnore(@Param("postId") Long postId, @Param("likes") long likes,
                     @Param("enteredOn") LocalDate enteredOn, @Param("now") LocalDateTime now);

    @Query(nativeQuery = true, value = """
            SELECT h.post_id AS postId, p.title AS title, h.likes AS likes, h.entered_on AS enteredOn
              FROM hall_of_fame h
              JOIN post p ON p.id = h.post_id
             WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
             ORDER BY h.entered_on DESC, h.likes DESC, h.post_id ASC
             LIMIT :size
            """)
    List<HallOfFameListRow> findList(@Param("size") int size);
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V60__create_hall_of_fame.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V60__create_hall_of_fame.sql`

```sql
-- V60 — 명예의 전당(15-1). 기준일 0시까지 좋아요를 20개 이상 받은 글이 한 번 올라간다.
-- UNIQUE(post_id): 같은 글은 한 번만 — 배치가 같은 날 두 번 돌아도, 다음 날 또 돌아도 중복 행이 생기지 않는다.
-- likes는 올라갈 때의 좋아요 수(그때의 기록), entered_on은 그 기준일이다.
CREATE TABLE hall_of_fame (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    post_id    BIGINT   NOT NULL,
    likes      INT      NOT NULL,
    entered_on DATE     NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hall_of_fame_post (post_id),
    KEY ix_hall_of_fame_list (entered_on, likes, post_id),
    CONSTRAINT fk_hall_of_fame_post FOREIGN KEY (post_id) REFERENCES post (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '명예의 전당 — 글마다 한 번';
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`HallOfFameScheduler.java`, `InvalidJobParameterException.java`, `JobDates.java`. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다. 변경된 메서드: `daily`, `resolve`.

`src/main/java/org/example/batch/HallOfFameScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

// 매일 0시(서울) — 기준일은 그 "오늘"이고, 집계는 오늘 0시 전(=어제까지)이다.
@Component
public class HallOfFameScheduler {

    private final HallOfFameService hallOfFameService;
    private final Clock clock;

    public HallOfFameScheduler(HallOfFameService hallOfFameService, Clock clock) {
        this.hallOfFameService = hallOfFameService;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void daily() {
        hallOfFameService.run(LocalDate.now(clock));
    }
}
```

`src/main/java/org/example/batch/InvalidJobParameterException.java`

```java
package org.example.batch;

// 배치 실행·조회 파라미터가 규칙에 맞지 않음 — 전역 핸들러가 400 + errors[{field, message}]로 바꾼다
public class InvalidJobParameterException extends RuntimeException {

    private final String field;

    public InvalidJobParameterException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
```

`src/main/java/org/example/batch/JobDates.java`

```java
package org.example.batch;

import java.time.Clock;
import java.time.LocalDate;

// 하루 단위 배치의 "기준일" 규칙 — 수동 실행·예약 실행·재실행이 같은 규칙을 쓴다.
public final class JobDates {

    private JobDates() {
    }

    // 생략하면 오늘(Clock 기준). 오늘까지는 되고, 아직 오지 않은 날은 400 — 그날 데이터가 다 모이지 않았다.
    public static LocalDate resolve(LocalDate date, Clock clock) {
        LocalDate today = LocalDate.now(clock);
        if (date == null) {
            return today;
        }
        if (date.isAfter(today)) {
            throw new InvalidJobParameterException("date", "아직 오지 않은 날짜(" + date + ")로는 실행할 수 없습니다. 오늘은 " + today + "입니다.");
        }
        return date;
    }
}
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleMethodValidation`, `handleInvalidJobParameter`.

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

`AdminGuard.java`, `HallOfFameEntry.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `requireAdmin`.

`src/main/java/org/example/batch/AdminGuard.java`

```java
package org.example.batch;

import org.example.admin.AdminOnlyException;
import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;

// 배치 수동 실행·조회 API는 운영자만. POST는 인터셉터가 토큰 없음을 401로 막지만
// GET은 "헤더 없음 = 비로그인 통과"라서 여기서 null도 확인한다.
public final class AdminGuard {

    private static final String ADMIN_ROLE = "ADMIN";

    private AdminGuard() {
    }

    public static void requireAdmin(AuthenticatedMember me) {
        if (me == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        if (!ADMIN_ROLE.equals(me.role())) {
            throw new AdminOnlyException();
        }
    }
}
```

`src/main/java/org/example/batch/HallOfFameEntry.java`

```java
package org.example.batch;

import java.time.LocalDate;

public record HallOfFameEntry(Long postId, String title, long likes, LocalDate enteredOn) {
}
```

</details>

### MyBatis 대안 — 집계와 멱등 INSERT

`HallOfFameMapper`는 기준일 0시 전의 `post_like`를 한 번에 집계하고 `INSERT IGNORE` + `UNIQUE(post_id)`로 중복 삽입을 막는다. 조회는 `entered_on`, `likes`, `post_id` 순서로 정렬한다. 스케줄러·Controller·예외 처리·Flyway V60은 공통 코드를 재사용한다.

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

# 15-1 MyBatis 배치 SQL 매퍼
mybatis:
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / Mapper — HallOfFameMapper.java</summary>

`src/main/java/org/example/batch/HallOfFameMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface HallOfFameMapper {

    List<HallOfFameEntry> findCandidates(@Param("cutoff") LocalDateTime cutoff,
                                         @Param("minLikes") int minLikes);

    int insertIgnore(@Param("postId") Long postId, @Param("likes") long likes,
                     @Param("enteredOn") LocalDate enteredOn, @Param("now") LocalDateTime now);

    List<HallOfFameEntry> findList(@Param("size") int size);
}
```

</details>

<details>
<summary>MyBatis / SQL — HallOfFameMapper.xml</summary>

`src/main/resources/mapper/HallOfFameMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.HallOfFameMapper">
    <resultMap id="entry" type="org.example.batch.HallOfFameEntry">
        <constructor>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="title" javaType="java.lang.String"/>
            <arg column="likes" javaType="_long"/>
            <arg column="entered_on" javaType="java.time.LocalDate"/>
        </constructor>
    </resultMap>

    <select id="findCandidates" resultMap="entry">
        SELECT p.id AS post_id, p.title, COUNT(*) AS likes, NULL AS entered_on
          FROM post p
          JOIN post_like l ON l.post_id = p.id AND l.created_at &lt; #{cutoff}
         WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM hall_of_fame h WHERE h.post_id = p.id)
         GROUP BY p.id, p.title
        HAVING COUNT(*) &gt;= #{minLikes}
         ORDER BY likes DESC, p.id ASC
    </select>

    <insert id="insertIgnore">
        INSERT IGNORE INTO hall_of_fame (post_id, likes, entered_on, created_at)
        VALUES (#{postId}, #{likes}, #{enteredOn}, #{now})
    </insert>

    <select id="findList" resultMap="entry">
        SELECT h.post_id, p.title, h.likes, h.entered_on
          FROM hall_of_fame h
          JOIN post p ON p.id = h.post_id
         WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
         ORDER BY h.entered_on DESC, h.likes DESC, h.post_id ASC
         LIMIT #{size}
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — HallOfFameService.java</summary>

`src/main/java/org/example/batch/HallOfFameService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 15-1 명예의 전당 — 기준일(date) 0시 "전"까지 받은 좋아요가 20개 이상인 글을 올린다.
// 예약 실행(매일 0시)과 수동 실행(운영자 API)이 이 메서드 하나를 같이 쓴다.
@Service
public class HallOfFameService {

    public static final int MIN_LIKES = 20;
    private static final Logger log = LoggerFactory.getLogger(HallOfFameService.class);

    private final HallOfFameMapper hallOfFameMapper;
    private final Clock clock;

    public HallOfFameService(HallOfFameMapper hallOfFameMapper, Clock clock) {
        this.hallOfFameMapper = hallOfFameMapper;
        this.clock = clock;
    }

    @Transactional
    public HallOfFameRunResponse run(LocalDate date) {
        // 기간은 [처음, date 0시) — date 당일에 눌린 좋아요는 아직 "어제까지"가 아니다
        LocalDateTime cutoff = date.atStartOfDay();
        LocalDateTime now = LocalDateTime.now(clock);

        List<HallOfFameEntry> added = new ArrayList<>();
        for (HallOfFameEntry row : hallOfFameMapper.findCandidates(cutoff, MIN_LIKES)) {
            if (hallOfFameMapper.insertIgnore(row.postId(), row.likes(), date, now) == 1) {
                added.add(new HallOfFameEntry(row.postId(), row.title(), row.likes(), date));
            }
        }
        log.info("명예의 전당 date={} cutoff={} 새로 올라간 글 {}건 {}", date, cutoff, added.size(),
                added.stream().map(HallOfFameEntry::postId).toList());
        return new HallOfFameRunResponse(date, MIN_LIKES, added);
    }

    @Transactional(readOnly = true)
    public List<HallOfFameEntry> list(int size) {
        return hallOfFameMapper.findList(size);
    }
}
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p01'
ids() { python3 -c 'import sys,json; d=json.load(sys.stdin); print([(i["postId"], i["likes"]) for i in d["added"]])'; }
curl -s -X POST "$BASE/api/admin/jobs/hall-of-fame/run?date=2026-10-04" -H "$A" | ids     # H1
curl -s -X POST "$BASE/api/admin/jobs/hall-of-fame/run?date=2026-10-05" -H "$A" | ids     # H2
curl -s -X POST "$BASE/api/admin/jobs/hall-of-fame/run?date=2026-10-05" -H "$A" | ids     # H3 한 번 더
curl -s "$BASE/api/hall-of-fame" | python3 -c 'import sys,json; print([i["postId"] for i in json.load(sys.stdin)])'   # H4
curl -s -X POST "$BASE/api/admin/jobs/hall-of-fame/run?date=2026-10-06" -H "$A"; echo        # H5 미래
curl -s -X POST "$BASE/api/admin/jobs/hall-of-fame/run?date=abc" -H "$A"; echo               # H7 형식
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "H1",
      "title": "10-04 기준 실행",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-04",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H2",
      "title": "오늘(10-05) 기준 실행",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H3",
      "title": "오늘 기준 한 번 더",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H4",
      "title": "명예의 전당 목록",
      "method": "GET",
      "path": "/api/hall-of-fame"
    },
    {
      "id": "H5",
      "title": "미래 날짜",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-06",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H6",
      "title": "없는 날짜",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-02-30",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H7",
      "title": "날짜 형식 아님",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=abc",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H8",
      "title": "목록 size=0",
      "method": "GET",
      "path": "/api/hall-of-fame?size=0"
    },
    {
      "id": "H9",
      "title": "목록 size=101",
      "method": "GET",
      "path": "/api/hall-of-fame?size=101"
    },
    {
      "id": "H10",
      "title": "목록 size=100",
      "method": "GET",
      "path": "/api/hall-of-fame?size=100"
    },
    {
      "id": "H11",
      "title": "일반 회원",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "H12",
      "title": "토큰 없음",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05"
    },
    {
      "id": "H13",
      "title": "날짜 칸이 공백",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=%20",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "H14",
      "title": "목록 size 빈 값",
      "method": "GET",
      "path": "/api/hall-of-fame?size="
    },
    {
      "id": "H15",
      "title": "목록 size 정수 초과",
      "method": "GET",
      "path": "/api/hall-of-fame?size=999999999999999999999"
    },
    {
      "id": "H16",
      "title": "목록 size 문자",
      "method": "GET",
      "path": "/api/hall-of-fame?size=abc"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "H1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.date",
            "equals": "2026-10-04"
          },
          {
            "path": "$.minLikes",
            "equals": 20
          }
        ],
        "anyOf": [
          {
            "json": [
              {
                "path": "$.added[*].postId",
                "equals": [
                  18,
                  55,
                  103,
                  131,
                  10,
                  143
                ]
              },
              {
                "path": "$.added[*].likes",
                "equals": [
                  22,
                  22,
                  22,
                  22,
                  20,
                  20
                ]
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.added",
                "type": "array"
              },
              {
                "path": "$.added",
                "length": 0
              }
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "H2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.date",
            "equals": "2026-10-05"
          }
        ],
        "anyOf": [
          {
            "json": [
              {
                "path": "$.added[*].postId",
                "equals": [
                  145
                ]
              },
              {
                "path": "$.added[*].likes",
                "equals": [
                  20
                ]
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.added",
                "type": "array"
              },
              {
                "path": "$.added",
                "length": 0
              }
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "H3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.added",
                "type": "array"
              },
              {
                "path": "$.added",
                "length": 0
              }
            ]
          }
        },
        {
          "request": "H13",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.date",
                "equals": "2026-10-05"
              },
              {
                "path": "$.added",
                "length": 0
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "request": "H4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$",
            "length": 7
          },
          {
            "path": "$[*].postId",
            "contains": 145
          },
          {
            "path": "$[*].postId",
            "contains": 18
          },
          {
            "path": "$[*].postId",
            "contains": 55
          },
          {
            "path": "$[*].postId",
            "contains": 103
          },
          {
            "path": "$[*].postId",
            "contains": 131
          },
          {
            "path": "$[*].postId",
            "contains": 10
          },
          {
            "path": "$[*].postId",
            "contains": 143
          },
          {
            "path": "$[*].postId",
            "notContains": 59
          }
        ]
      }
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "H5",
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
          "request": "H6",
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
          "request": "H7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "date"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "H14",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "size"
              }
            ]
          }
        },
        {
          "request": "H15",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "size"
              }
            ]
          }
        },
        {
          "request": "H16",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "size"
              }
            ]
          }
        },
        {
          "request": "H8",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "size"
              }
            ]
          }
        },
        {
          "request": "H9",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "size"
              }
            ]
          }
        },
        {
          "request": "H10",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$",
                "length": 7
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "H11",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "H12",
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
| C1 | H1 | `200`, `date`=`2026-10-04`. 처음이면 `added` = 18·55·103·131(22개)·10·143(20개) 순서. 이미 돌린 적이 있으면 빈 배열(아래 "주의") |
| C2 | H2 | `200`. 처음이면 `added` = 145(20개) 하나 — 10-04 기준에서는 19개였다. 이미 돌렸으면 빈 배열 |
| C3 | H3 / H13 | `200`, `added` 빈 배열 — 같은 날 두 번 돌아도 한 번만 / 공백 날짜는 생략과 같다(오늘 `2026-10-05`, `500` 아님) |
| C4 | H4 | 7개, 145·18·55·103·131·10·143. 삭제된 59번(22개)은 없다 |
| C5 | H5 / H6 / H7 | 모두 `400`, `errors`에 `date` — 미래·없는 날짜·형식 아님(`500` 아님) |
| C6 | H8~H10 / H14~H16 | 0·101·빈 값·정수 초과·문자는 `400`(`size`), 100은 `200`·7개 |
| C7 | H11 / H12 | `403` / `401` |
| D1 | `SELECT COUNT(*), COUNT(DISTINCT post_id) FROM hall_of_fame` | `7, 7` — 몇 번을 돌려도 같다 |
| D2 | `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'practice' AND table_name = 'hall_of_fame' AND column_name = 'post_id' AND non_unique = 0` | `1` — `post_id`에 UNIQUE가 있다 |
| R1 | 경계 | 기준일 0시 "전"(`<`)까지 센다. `<=`나 `DATE(created_at) <= 기준일`이면 145번이 10-04 기준에 끼어든다 |
| R2 | 멱등 | "이미 있나 SELECT → 없으면 INSERT"만으로 끝내지 않는다. 그 사이에 같은 배치가 한 번 더 돌면(수동 실행과 0시 실행이 겹치는 등) 둘 다 "없음"을 본다. `UNIQUE` + `INSERT IGNORE`(또는 중복 키 예외를 잡아 건너뛰기)로 DB가 막는다 |
| R3 | 집계 | 글마다 좋아요를 따로 세지 않고 `GROUP BY … HAVING COUNT(*) >= 20` 한 번으로 후보를 얻는다. `post.like_count`를 쓰지 않는다 |
| R4 | 시간 | `LocalDate.now()`를 직접 부르지 않고 `Clock`을 쓴다. 예약 실행의 기준일과 수동 실행의 `date`가 같은 서비스 메서드로 들어간다 |

**주의 — 다시 돌릴 때.** 이 배치는 DB에 행을 남긴다. 한 번 돌린 뒤에는 H1·H2가 빈 배열이 되는 게 맞다(C1·C2는 둘 다 통과로 본다). 앱을 자정 넘어 켜 두었다면 0시 예약 실행이 기준일 2026-10-05(고정 시계)로 이미 7개를 올렸을 수도 있다. 처음 값을 다시 보려면 `DELETE FROM hall_of_fame;`로 비운다.

## 필요한 지식

- [P30 스케줄링 실무](../../docs/knowledge/P30-scheduling-practical.md) — cron·시간대·실패와 중복
- [S15 비동기·스케줄링·Spring Batch](../../docs/knowledge/S15-async-scheduling-batch.md)
- [W20 시간과 타임존](../../docs/knowledge/W20-time-timezone.md) — 기준일과 `[시작, 끝)`
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — UNIQUE
- [F1 입력 검증과 에러 응답](../../lessons/F1-validation-errors.md)
- [8-5. 정합성 배치](../ch8-query-deep/8-5-recount-batch.md) — `@Scheduled`·수동 실행 API의 출발점

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 날짜 파라미터</summary>

`@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`로 받는다. ISO 형식은 엄격해서 `2026-1-5`·`2026-02-30`도 변환 실패다. 생략이면 `LocalDate.now(clock)`, 오늘보다 뒤면 400을 던지는 작은 메서드를 만들어 두면 15장의 다른 배치도 같이 쓴다.
</details>

<details>
<summary>힌트 2 — 새로 들어간 것만 응답하기</summary>

후보를 SELECT로 얻고, 한 건씩 `INSERT IGNORE INTO hall_of_fame … VALUES (…)`를 `@Modifying` 네이티브 쿼리로 보낸다. 반환값(영향받은 행 수)이 1인 것만 `added`에 넣는다. 0이면 그 사이 누군가 먼저 넣은 것이다.
</details>

<details>
<summary>더 깊이 — 서버가 여러 대라면</summary>

서버 두 대가 같은 0시에 같은 배치를 동시에 돌린다. 이 단계의 `UNIQUE`는 결과가 두 번 들어가는 것만 막고 일을 두 번 하는 것은 못 막는다 — 보통 ShedLock 같은 분산 락으로 한 대만 돌게 한다(8-5 R3, 이 장에서는 다루지 않는다).
</details>

## 다음 단계

[15-2. 주간 랭킹 스냅샷](15-2-weekly-ranking-snapshot.md)
