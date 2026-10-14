# 15-6. 배치 실행 기록과 다시 돌리기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "지난 9월 21일 월요일에 주간 랭킹 배치가 DB 잠금 때문에 실패했는데 아무도 몰랐어요. 그래서 9/14 주 랭킹이 비어 있어요. 배치가 언제 돌았고, 몇 건 처리했고, 실패했으면 왜 실패했는지 남겨 주세요. 실패한 날만 골라서 다시 돌리는 버튼도요."

지금까지 만든 배치 다섯 개는 로그만 남긴다. 로그는 서버를 재시작하면 찾기 어렵고, "어느 날 몫이 아직 안 됐나"를 묻기도 어렵다.

그래서 실행마다 **표에 한 행**을 남긴다. 기준일(`run_date`, 어느 날 몫인가)이 있기 때문에 "마지막 실행이 실패로 끝난 날"을 SQL로 찾을 수 있다.

다시 돌릴 때는 그 기준일로 같은 배치를 돌린다. 15-1~15-5에서 모든 배치가 기준일을 받고, 같은 날 두 번 돌아도 결과가 같게(멱등) 만들어 둔 것이 여기서 쓰인다. 재실행이 안전하려면 배치가 멱등이어야 한다.

학습용 DB에는 이 단계 시드로 지난 운영 기록 세 줄이 들어간다.

| 배치 | 기준일 | 결과 |
|---|---|---|
| weekly-ranking | 2026-09-21 | SCHEDULED 실행이 `CannotAcquireLockException`으로 FAILED — 아무도 다시 안 돌림 |
| hall-of-fame | 2026-09-30 | SCHEDULED 실행이 FAILED → 그날 운영자가 MANUAL로 다시 돌려 SUCCESS |

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 도구 — 배치 실행 기록",
  "summary": "배치가 돌 때마다 시작·끝·처리 건수·실패 이유를 남기고, 마지막 실행이 실패로 끝난 날만 골라 다시 돌린다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "운영 도구 · 실행 기록",
      "right": "운영자"
    },
    {
      "type": "chips",
      "id": "jobs",
      "label": "배치",
      "items": [
        "hall-of-fame",
        "weekly-ranking",
        "scheduled-publish",
        "trash-purge",
        "like-milestone"
      ]
    },
    {
      "type": "list",
      "id": "runs",
      "label": "weekly-ranking 실행 기록(최신순)",
      "items": [
        {
          "id": "r-retry",
          "title": "2026-09-21 몫 · RETRY",
          "meta": "SUCCESS · 10건 · 0.16초",
          "tone": "success"
        },
        {
          "id": "r-failed",
          "title": "2026-09-21 몫 · SCHEDULED",
          "meta": "FAILED · CannotAcquireLockException: Lock wait timeout exceeded…",
          "tone": "error"
        }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "retry",
          "label": "실패한 날만 다시 돌리기",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "text",
      "id": "nothing",
      "value": "다시 돌릴 날이 없어요",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "실패한 날 찾기",
      "steps": [
        {
          "kind": "user",
          "text": "weekly-ranking 칩을 누른다",
          "focus": [
            "jobs"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/admin/jobs/runs?job=weekly-ranking",
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
          "body": "[{\"id\": 1, \"job\": \"weekly-ranking\", \"runDate\": \"2026-09-21\", \"trigger\": \"SCHEDULED\", \"status\": \"FAILED\", \"processed\": null, \"error\": \"CannotAcquireLockException: …\", …}]"
        },
        {
          "kind": "screen",
          "text": "9/21 몫이 실패한 채 남아 있다 — 그래서 9/14 주 랭킹이 비어 있다",
          "focus": [
            "r-failed"
          ]
        }
      ]
    },
    {
      "name": "실패한 날만 다시",
      "steps": [
        {
          "kind": "user",
          "text": "[실패한 날만 다시 돌리기]",
          "focus": [
            "retry"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/weekly-ranking/retry-failed",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT r.run_date FROM job_run r\nWHERE r.job_name = 'weekly-ranking'\n  AND r.id = (SELECT MAX(r2.id) FROM job_run r2 WHERE r2.job_name = r.job_name AND r2.run_date = r.run_date)\n  AND r.status = 'FAILED'",
          "note": "그 날 몫의 마지막 실행이 실패인 날만"
        },
        {
          "kind": "server",
          "text": "2026-09-21 몫을 trigger=RETRY로 다시 — 시작에 RUNNING 한 행, 끝나면 SUCCESS·처리 10건"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"job\": \"weekly-ranking\", \"retried\": [{\"runDate\": \"2026-09-21\", \"status\": \"SUCCESS\", \"runId\": 4, \"error\": null}]}"
        },
        {
          "kind": "screen",
          "text": "맨 위에 RETRY 성공 기록",
          "focus": [
            "r-retry"
          ]
        },
        {
          "kind": "user",
          "text": "한 번 더 누른다",
          "focus": [
            "retry"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/weekly-ranking/retry-failed",
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
          "body": "{\"job\": \"weekly-ranking\", \"retried\": []}"
        },
        {
          "kind": "screen",
          "text": "이미 성공한 날은 다시 돌리지 않는다",
          "focus": [
            "nothing"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V65** — `db/migration/V65__create_job_run.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `job_name` | `VARCHAR(50)` — `hall-of-fame`·`weekly-ranking`·`scheduled-publish`·`trash-purge`·`like-milestone` |
| `run_date` | `DATE` — 어느 날 몫인가(15-1~15-4의 `date`, 예약 발행은 기준 시각의 날짜) |
| `reference_at` | `DATETIME(3) NULL` — 예약 발행의 원래 기준 시각(`at`). 재실행에도 같은 시각을 넘긴다. 날짜만 받는 배치는 `NULL` |
| `trigger_type` | `SCHEDULED`·`MANUAL`·`RETRY` (`TRIGGER`는 MySQL 예약어) |
| `status` | `RUNNING`·`SUCCESS`·`FAILED` |
| `processed` | 처리 건수(성공일 때) |
| `error_message` | 실패 이유(예외 이름 + 메시지, 500자까지 자른다) |
| `started_at`·`finished_at` | 실제로 돈 시각(벽시계). 업무상 날짜는 `run_date`다 |
| 인덱스 | `(job_name, run_date, id)` — "그 날 몫의 마지막 실행" 찾기 |

**시드(practice 전용)** — `db/practice-data/V65_1__seed_job_runs.sql`(15-4와 같은 폴더)

```sql
INSERT INTO job_run (job_name, run_date, trigger_type, status, processed, error_message, started_at, finished_at) VALUES
    ('weekly-ranking', '2026-09-21', 'SCHEDULED', 'FAILED', NULL,
     'CannotAcquireLockException: Lock wait timeout exceeded; try restarting transaction',
     '2026-09-21 00:10:00.000', '2026-09-21 00:10:50.412'),
    ('hall-of-fame', '2026-09-30', 'SCHEDULED', 'FAILED', NULL,
     'DataAccessResourceFailureException: Communications link failure',
     '2026-09-30 00:00:00.000', '2026-09-30 00:00:30.020'),
    ('hall-of-fame', '2026-09-30', 'MANUAL', 'SUCCESS', 0, NULL,
     '2026-09-30 09:12:03.115', '2026-09-30 09:12:03.380');
```

**기록 남기기** — 모든 배치를 하나의 실행기로 감싼다

| 항목 | 내용 |
|---|---|
| 감싸는 곳 | 15-1~15-5의 수동 실행·예약 실행이 모두 같은 실행기(예: `JobRunner.run(job, runDate, trigger, 일, 건수 세는 법)`)를 거친다 |
| 순서 | 시작에 `RUNNING` 한 행 저장(바로 커밋) → 배치 본문 → 끝나면 `SUCCESS`·`processed`, 예외면 `FAILED`·`error_message`를 저장하고 예외를 다시 던진다(수동 실행은 `500`) |
| 트랜잭션 | 실행기에는 `@Transactional`을 붙이지 않는다. 배치 본문과 같은 트랜잭션이면 실패할 때 `FAILED` 기록까지 롤백된다 |
| 입력 검사 먼저 | 날짜 형식·미래·월요일 검사는 기록을 남기기 **전에** 한다. 잘못된 입력이 "실패한 날"로 남으면 재실행이 그 날을 영원히 다시 돌린다 |
| 자주 도는 배치 | 매분(예약 발행)·10분(달성 알림) 예약 실행은 처리 0건이면 기록하지 않는다. 실패는 남긴다 |
| 같은 실패일 재실행 | MySQL 연결 단위 잠금(`GET_LOCK`)을 배치 이름·DB·날짜별로 얻고, 잠금 안에서 마지막 상태를 다시 검사한다. 다른 요청이 선점했거나 이미 성공했으면 건너뛴다. 연결이 끊기면 잠금도 해제된다 |
| 재실행 응답 | 시작할 때 발급받은 자기 `runId`의 행을 읽는다. 그 사이 다른 실행이 생겨도 날짜별 최신 행과 혼동하지 않는다 |

**API** — 운영자만(일반 회원 `403`, 토큰 없음 `401`)

| 메서드·경로 | 응답 |
|---|---|
| `GET /api/admin/jobs/runs?job=&status=&size=20` | `200`, 최신순 `[ { "id", "job", "runDate", "referenceAt", "trigger", "status", "processed", "error", "startedAt", "finishedAt" } ]` |
| `POST /api/admin/jobs/{job}/retry-failed` | `200`, `{ "job", "retried": [ { "runDate", "status", "runId", "error" } ] }`. 대상은 **그 날 몫의 마지막 실행이 `FAILED`인 날**. 날마다 따로 돌리고, 한 날이 또 실패해도 다음 날은 계속한다. 없는 배치는 `404` |

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `job`(조회) | 아니오 | 생략하면 전부. 빈 값·공백 400 | 위 다섯 이름 | 문자열 | 없음 | `400`, `field = "job"` |
| `status`(조회) | 아니오 | 생략하면 전부. 빈 값·공백 400 | `RUNNING`·`SUCCESS`·`FAILED` | 문자열 | 없음 | `400`, `field = "status"` |
| `size`(조회) | 아니오 | — | 1~100 | 정수 | 20 | `400`, `field = "size"` |
| `{job}`(경로) | 예 | — | 위 다섯 이름 | 문자열 | — | `404` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 그 날 몫의 마지막 실행이 실패인 날만
- 2026-09-21 몫을 trigger=RETRY로 다시 — 시작에 RUNNING 한 행, 끝나면 SUCCESS·처리 10건

<details>
<summary>Controller — HTTP 연결</summary>

`HallOfFameController.java`, `LikeMilestoneController.java`, `ScheduledPublishController.java`, `TrashPurgeController.java`, `WeeklyRankingController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

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
    private final JobLauncher jobLauncher;
    private final Clock clock;

    public HallOfFameController(HallOfFameService hallOfFameService, JobLauncher jobLauncher, Clock clock) {
        this.hallOfFameService = hallOfFameService;
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    // 수동 실행 — cron을 기다리지 않고 "그 날짜에 돌았다면"을 바로 확인한다.
    // date는 yyyy-MM-dd(형식이 틀리면 타입 변환 실패 → 전역 핸들러가 400), 미래는 JobDates가 400.
    @PostMapping("/api/admin/jobs/hall-of-fame/run")
    public HallOfFameRunResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        // 15-6 실행 기록과 함께 — 입력 검사(날짜)는 기록을 남기기 전에 끝낸다
        return jobLauncher.launch(JobCatalog.HALL_OF_FAME, JobDates.resolve(date, clock), JobRunner.MANUAL);
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

`src/main/java/org/example/batch/LikeMilestoneController.java`

```java
package org.example.batch;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;

@RestController
public class LikeMilestoneController {

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public LikeMilestoneController(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    @PostMapping("/api/admin/jobs/like-milestone/run")
    public LikeMilestoneResponse run(@LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return jobLauncher.launch(JobCatalog.LIKE_MILESTONE, LocalDate.now(clock), JobRunner.MANUAL);
    }
}
```

`src/main/java/org/example/batch/ScheduledPublishController.java`

```java
package org.example.batch;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDateTime;

@RestController
public class ScheduledPublishController {

    private static final int MAX_AHEAD_DAYS = 30;

    private final ScheduledPublishService scheduledPublishService;
    private final JobRunner jobRunner;
    private final Clock clock;

    public ScheduledPublishController(ScheduledPublishService scheduledPublishService, JobRunner jobRunner, Clock clock) {
        this.scheduledPublishService = scheduledPublishService;
        this.jobRunner = jobRunner;
        this.clock = clock;
    }

    // at = "이 시각이 됐다고 치고" 돌린다(생략하면 지금). 예약을 30일 안쪽만 받으므로 그보다 뒤 시각은 400.
    @PostMapping("/api/admin/jobs/scheduled-publish/run")
    public ScheduledPublishResponse run(@RequestParam(required = false) String at,
                                        @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime effectiveAt;
        if (at == null || at.isBlank()) {
            effectiveAt = now;
        } else {
            try {
                effectiveAt = StrictDateTimes.parse(at);
            } catch (IllegalArgumentException ex) {
                throw new InvalidJobParameterException("at", ex.getMessage());
            }
        }
        if (effectiveAt.isAfter(now.plusDays(MAX_AHEAD_DAYS))) {
            throw new InvalidJobParameterException("at", "기준 시각은 지금부터 " + MAX_AHEAD_DAYS + "일 안쪽(" + now.plusDays(MAX_AHEAD_DAYS) + "까지)만 됩니다.");
        }
        LocalDateTime target = effectiveAt;
        // 15-6 기준 시각이 있는 배치라 날짜 몫(run_date)은 그 시각의 날짜로 적는다
        return jobRunner.run(JobCatalog.SCHEDULED_PUBLISH, target.toLocalDate(), JobRunner.MANUAL, target,
                () -> scheduledPublishService.publishDue(target), r -> r.published().size());
    }
}
```

`src/main/java/org/example/batch/TrashPurgeController.java`

```java
package org.example.batch;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;

@RestController
public class TrashPurgeController {

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public TrashPurgeController(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    // date = 배치가 도는 날. 그날 0시 기준 30일 전보다 먼저 삭제된 글을 지운다. 미래 날짜는 400(앞당겨 지우지 않는다)
    @PostMapping("/api/admin/jobs/trash-purge/run")
    public TrashPurgeResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                  @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return jobLauncher.launch(JobCatalog.TRASH_PURGE, JobDates.resolve(date, clock), JobRunner.MANUAL);
    }
}
```

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
    private final JobLauncher jobLauncher;
    private final Clock clock;

    public WeeklyRankingController(WeeklyRankingService weeklyRankingService, JobLauncher jobLauncher, Clock clock) {
        this.weeklyRankingService = weeklyRankingService;
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    // date = 배치가 도는 월요일. 그 전 7일(지난주 월~일)을 집계한다.
    @PostMapping("/api/admin/jobs/weekly-ranking/run")
    public WeeklyRankingResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        LocalDate runDate = JobDates.resolve(date, clock);
        // 15-6 월요일 검사를 기록 전에 — 잘못된 입력이 "실패한 날"로 남아 재실행 대상이 되지 않게
        WeeklyRankingService.requireMonday("date", runDate);
        return jobLauncher.launch(JobCatalog.WEEKLY_RANKING, runDate, JobRunner.MANUAL);
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

`RetryResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/RetryResponse.java`

```java
package org.example.batch;

import java.time.LocalDate;
import java.util.List;

// retried: 다시 돌린 날마다 결과. 다시 돌려도 실패하면 status=FAILED로 남고 다음 재실행 때 또 대상이 된다
public record RetryResponse(String job, List<Retried> retried) {

    public record Retried(LocalDate runDate, String status, Long runId, String error) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`WeeklyRankingService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `requireMonday`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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

    public static void requireMonday(String field, LocalDate date) {
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
<summary>Flyway / SQL — 스키마 변경</summary>

`V65__create_job_run.sql`, `V65_1__seed_job_runs.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V65__create_job_run.sql`

```sql
-- V65 — 배치 실행 기록(15-6). 배치가 돌 때마다 한 행: 언제 시작·끝났는지, 몇 건 처리했는지, 실패했으면 왜.
-- run_date는 "어느 날 몫"(기준일)이다 — 실패한 날만 다시 돌릴 때 이 값으로 다시 돌린다.
-- trigger_type: TRIGGER는 MySQL 예약어라 컬럼명으로 피한다.
CREATE TABLE job_run (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    job_name      VARCHAR(50)  NOT NULL,
    run_date      DATE         NOT NULL,
    reference_at  DATETIME(3)  NULL,
    trigger_type  VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    processed     INT          NULL,
    error_message VARCHAR(500) NULL,
    started_at    DATETIME(3)  NOT NULL,
    finished_at   DATETIME(3)  NULL,
    PRIMARY KEY (id),
    KEY ix_job_run_job_date (job_name, run_date, id),
    CONSTRAINT ck_job_run_status CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
    CONSTRAINT ck_job_run_trigger CHECK (trigger_type IN ('SCHEDULED', 'MANUAL', 'RETRY'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '배치 실행 기록 — 실행마다 한 행';
```

`src/main/resources/db/practice-data/V65_1__seed_job_runs.sql`

```sql
-- V65.1 — practice 전용 시드(15-6 재실행 연습용). 지난 운영 기록 세 줄.
--  1) 주간 랭킹 2026-09-21(월) 몫이 DB 잠금 대기 시간 초과로 실패하고 아무도 다시 돌리지 않았다 → 9/14 주 랭킹이 비어 있다
--  2·3) 명예의 전당 2026-09-30 몫은 실패했지만 운영자가 그날 다시 돌려 성공했다 → 다시 돌릴 대상이 아니다
INSERT INTO job_run (job_name, run_date, trigger_type, status, processed, error_message, started_at, finished_at) VALUES
    ('weekly-ranking', '2026-09-21', 'SCHEDULED', 'FAILED', NULL,
     'CannotAcquireLockException: Lock wait timeout exceeded; try restarting transaction',
     '2026-09-21 00:10:00.000', '2026-09-21 00:10:50.412'),
    ('hall-of-fame', '2026-09-30', 'SCHEDULED', 'FAILED', NULL,
     'DataAccessResourceFailureException: Communications link failure',
     '2026-09-30 00:00:00.000', '2026-09-30 00:00:30.020'),
    ('hall-of-fame', '2026-09-30', 'MANUAL', 'SUCCESS', 0, NULL,
     '2026-09-30 09:12:03.115', '2026-09-30 09:12:03.380');
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`HallOfFameScheduler.java`, `JobCatalog.java`, `JobLauncher.java`, `JobNotFoundException.java`, `JobRun.java`, `JobRunController.java`, `JobRunner.java`, `JobRunRepository.java`, `JobRunResponse.java` 외 4개. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다.

이번 단계 매핑: `@GetMapping("/api/admin/jobs/runs")`, `@PostMapping("/api/admin/jobs/{job}/retry-failed")`. 변경된 메서드: `names`, `exists`, `get`, `launch`.

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

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public HallOfFameScheduler(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void daily() {
        jobLauncher.launch(JobCatalog.HALL_OF_FAME, LocalDate.now(clock), JobRunner.SCHEDULED);
    }
}
```

`src/main/java/org/example/batch/JobCatalog.java`

```java
package org.example.batch;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.function.ToIntFunction;

// 배치 이름 → "그 날 몫을 돌리는 방법"과 "처리 건수 세는 법". 재실행 API가 이름으로 찾아 쓴다.
@Component
public class JobCatalog {

    public static final String HALL_OF_FAME = "hall-of-fame";
    public static final String WEEKLY_RANKING = "weekly-ranking";
    public static final String SCHEDULED_PUBLISH = "scheduled-publish";
    public static final String TRASH_PURGE = "trash-purge";
    public static final String LIKE_MILESTONE = "like-milestone";

    public record Job<T>(BiFunction<LocalDate, LocalDateTime, T> work, ToIntFunction<T> processed) {
    }

    private final Map<String, Job<?>> jobs = new LinkedHashMap<>();

    public JobCatalog(HallOfFameService hallOfFame, WeeklyRankingService weeklyRanking,
                      ScheduledPublishService scheduledPublish, TrashPurgeService trashPurge,
                      LikeMilestoneService likeMilestone) {
        jobs.put(HALL_OF_FAME, new Job<>((date, at) -> hallOfFame.run(date), r -> r.added().size()));
        jobs.put(WEEKLY_RANKING, new Job<>((date, at) -> weeklyRanking.run(date), r -> r.created() ? r.items().size() : 0));
        // 예약 발행은 원래 기준 시각을 보존한다. 과거 기록에 시각이 없으면 해당 날짜의 끝을 기준으로 복구한다.
        jobs.put(SCHEDULED_PUBLISH, new Job<>((date, at) -> scheduledPublish.publishDue(
                at != null ? at : date.plusDays(1).atStartOfDay().minusNanos(1)), r -> r.published().size()));
        jobs.put(TRASH_PURGE, new Job<>((date, at) -> trashPurge.purge(date), TrashPurgeResponse::deletedPosts));
        jobs.put(LIKE_MILESTONE, new Job<>((date, at) -> likeMilestone.run(), r -> r.added().size()));
    }

    public Set<String> names() {
        return jobs.keySet();
    }

    public boolean exists(String name) {
        return jobs.containsKey(name);
    }

    @SuppressWarnings("unchecked")
    public <T> Job<T> get(String name) {
        return (Job<T>) jobs.get(name);
    }
}
```

`src/main/java/org/example/batch/JobLauncher.java`

```java
package org.example.batch;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.function.LongConsumer;

// 이름으로 배치를 찾아 실행 기록(JobRunner)과 함께 돌린다 — 수동 실행·예약 실행·재실행이 모두 이 길로 들어온다
@Component
public class JobLauncher {

    private final JobCatalog catalog;
    private final JobRunner runner;

    public JobLauncher(JobCatalog catalog, JobRunner runner) {
        this.catalog = catalog;
        this.runner = runner;
    }

    public <T> T launch(String name, LocalDate date, String trigger) {
        return launch(name, date, trigger, null);
    }

    public <T> T launch(String name, LocalDate date, String trigger, LocalDateTime referenceAt) {
        return launch(name, date, trigger, referenceAt, id -> {});
    }

    public <T> T launch(String name, LocalDate date, String trigger, LocalDateTime referenceAt, LongConsumer started) {
        JobCatalog.Job<T> job = catalog.get(name);
        return runner.run(name, date, trigger, referenceAt, () -> job.work().apply(date, referenceAt), job.processed(), started);
    }

    public <T> T launchQuietly(String name, LocalDate date) {
        JobCatalog.Job<T> job = catalog.get(name);
        return runner.runQuietly(name, date, () -> job.work().apply(date, null), job.processed());
    }
}
```

`src/main/java/org/example/batch/JobNotFoundException.java`

```java
package org.example.batch;

public class JobNotFoundException extends RuntimeException {

    public JobNotFoundException(String job) {
        super("없는 배치입니다: " + job);
    }
}
```

`src/main/java/org/example/batch/JobRun.java`

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

// 배치 실행 기록 한 줄(V65)
@Entity
@Table(name = "job_run")
public class JobRun {

    public static final String RUNNING = "RUNNING";
    public static final String SUCCESS = "SUCCESS";
    public static final String FAILED = "FAILED";
    private static final int ERROR_MAX = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, length = 50)
    private String jobName;

    @Column(name = "run_date", nullable = false)
    private LocalDate runDate;

    @Column(name = "reference_at")
    private LocalDateTime referenceAt;

    @Column(name = "trigger_type", nullable = false, length = 20)
    private String triggerType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column
    private Integer processed;

    @Column(name = "error_message", length = ERROR_MAX)
    private String errorMessage;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    protected JobRun() {
        // JPA
    }

    public static JobRun start(String jobName, LocalDate runDate, String triggerType, LocalDateTime referenceAt, LocalDateTime now) {
        JobRun run = new JobRun();
        run.jobName = jobName;
        run.runDate = runDate;
        run.referenceAt = referenceAt;
        run.triggerType = triggerType;
        run.status = RUNNING;
        run.startedAt = now;
        return run;
    }

    public void succeed(int processed, LocalDateTime now) {
        this.status = SUCCESS;
        this.processed = processed;
        this.finishedAt = now;
    }

    public void fail(Throwable e, LocalDateTime now) {
        this.status = FAILED;
        String message = e.getClass().getSimpleName() + ": " + e.getMessage();
        this.errorMessage = message.length() > ERROR_MAX ? message.substring(0, ERROR_MAX) : message;
        this.finishedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getJobName() {
        return jobName;
    }

    public LocalDate getRunDate() {
        return runDate;
    }

    public LocalDateTime getReferenceAt() {
        return referenceAt;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public String getStatus() {
        return status;
    }

    public Integer getProcessed() {
        return processed;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }
}
```

`src/main/java/org/example/batch/JobRunController.java`

```java
package org.example.batch;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

// 15-6 배치 실행 기록 조회와 "실패한 날만 다시 돌리기"
@RestController
public class JobRunController {

    private final JobRunRepository jobRunRepository;
    private final JobCatalog jobCatalog;
    private final JobLauncher jobLauncher;
    private final JobRetryGate retryGate;

    public JobRunController(JobRunRepository jobRunRepository, JobCatalog jobCatalog, JobLauncher jobLauncher, JobRetryGate retryGate) {
        this.jobRunRepository = jobRunRepository;
        this.jobCatalog = jobCatalog;
        this.jobLauncher = jobLauncher;
        this.retryGate = retryGate;
    }

    @GetMapping("/api/admin/jobs/runs")
    public List<JobRunResponse> runs(@RequestParam(required = false) String job,
                                     @RequestParam(required = false) @Pattern(regexp = "RUNNING|SUCCESS|FAILED",
                                             message = "status는 RUNNING, SUCCESS, FAILED 중 하나여야 합니다.") String status,
                                     @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        if (job != null && !jobCatalog.exists(job)) {
            throw new InvalidJobParameterException("job", "job은 " + jobCatalog.names() + " 중 하나여야 합니다.");
        }
        return jobRunRepository.search(job, status, PageRequest.of(0, size)).stream()
                .map(JobRunResponse::of)
                .toList();
    }

    // 날마다 따로 돈다 — 한 날이 또 실패해도 다음 날은 계속 돌린다. 이미 성공한 날(마지막 실행이 SUCCESS)은 건너뛴다
    @PostMapping("/api/admin/jobs/{job}/retry-failed")
    public RetryResponse retryFailed(@PathVariable String job, @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        if (!jobCatalog.exists(job)) {
            throw new JobNotFoundException(job);
        }
        List<RetryResponse.Retried> retried = new ArrayList<>();
        for (LocalDate date : jobRunRepository.findFailedDates(job)) {
            retryGate.runIfFree(job, date, () -> {
                JobRun failed = jobRunRepository.findFirstByJobNameAndRunDateOrderByIdDesc(job, date).orElseThrow();
                if (!JobRun.FAILED.equals(failed.getStatus())) {
                    return; // 선점을 기다리는 동안 다른 요청이 복구했다.
                }
                String error = null;
                AtomicReference<Long> runId = new AtomicReference<>();
                try {
                    jobLauncher.launch(job, date, JobRunner.RETRY, failed.getReferenceAt(), runId::set);
                } catch (RuntimeException e) {
                    error = e.getClass().getSimpleName() + ": " + e.getMessage();
                }
                JobRun own = jobRunRepository.findById(runId.get()).orElseThrow();
                retried.add(new RetryResponse.Retried(date, own.getStatus(), own.getId(), error));
            });
        }
        return new RetryResponse(job, retried);
    }
}
```

`src/main/java/org/example/batch/JobRunner.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.function.Supplier;
import java.util.function.LongConsumer;
import java.util.function.ToIntFunction;

// 15-6 모든 배치를 이걸로 감싼다 — 시작에 RUNNING 한 행, 끝나면 SUCCESS(처리 건수)·FAILED(이유).
// 이 클래스에는 @Transactional을 붙이지 않는다. 기록 저장(save)은 각자 짧은 트랜잭션으로 바로 커밋되고,
// 배치 본문(work)은 자기 트랜잭션에서 돈다. 하나로 묶으면 배치가 실패할 때 FAILED 기록까지 같이 롤백된다.
@Component
public class JobRunner {

    public static final String SCHEDULED = "SCHEDULED";
    public static final String MANUAL = "MANUAL";
    public static final String RETRY = "RETRY";
    // 실행 기록의 시작·끝은 "실제로 돈 시각"(벽시계)이다. 업무상 날짜는 run_date(Clock 기준일)
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final Logger log = LoggerFactory.getLogger(JobRunner.class);

    private final JobRunRepository jobRunRepository;

    public JobRunner(JobRunRepository jobRunRepository) {
        this.jobRunRepository = jobRunRepository;
    }

    public <T> T run(String job, LocalDate runDate, String trigger, Supplier<T> work, ToIntFunction<T> processed) {
        return run(job, runDate, trigger, null, work, processed);
    }

    public <T> T run(String job, LocalDate runDate, String trigger, LocalDateTime referenceAt,
                     Supplier<T> work, ToIntFunction<T> processed) {
        return run(job, runDate, trigger, referenceAt, work, processed, id -> {});
    }

    public <T> T run(String job, LocalDate runDate, String trigger, LocalDateTime referenceAt,
                     Supplier<T> work, ToIntFunction<T> processed, LongConsumer started) {
        JobRun run = jobRunRepository.save(JobRun.start(job, runDate, trigger, referenceAt, LocalDateTime.now(ZONE)));
        started.accept(run.getId());
        try {
            T result = work.get();
            run.succeed(processed.applyAsInt(result), LocalDateTime.now(ZONE));
            jobRunRepository.save(run);
            return result;
        } catch (RuntimeException e) {
            run.fail(e, LocalDateTime.now(ZONE));
            jobRunRepository.save(run);
            log.error("배치 실패 job={} date={} runId={}", job, runDate, run.getId(), e);
            throw e;
        }
    }

    // 매분·10분마다 도는 예약 실행용 — 처리 0건인 성공은 기록하지 않는다(하루 1,440행이 쌓이지 않게). 실패는 남긴다
    public <T> T runQuietly(String job, LocalDate runDate, Supplier<T> work, ToIntFunction<T> processed) {
        return runQuietly(job, runDate, null, work, processed);
    }

    public <T> T runQuietly(String job, LocalDate runDate, LocalDateTime referenceAt,
                            Supplier<T> work, ToIntFunction<T> processed) {
        LocalDateTime started = LocalDateTime.now(ZONE);
        try {
            T result = work.get();
            int n = processed.applyAsInt(result);
            if (n > 0) {
                JobRun run = JobRun.start(job, runDate, SCHEDULED, referenceAt, started);
                run.succeed(n, LocalDateTime.now(ZONE));
                jobRunRepository.save(run);
            }
            return result;
        } catch (RuntimeException e) {
            JobRun run = JobRun.start(job, runDate, SCHEDULED, referenceAt, started);
            run.fail(e, LocalDateTime.now(ZONE));
            jobRunRepository.save(run);
            log.error("배치 실패 job={} date={}", job, runDate, e);
            throw e;
        }
    }
}
```

`src/main/java/org/example/batch/JobRunRepository.java`

```java
package org.example.batch;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface JobRunRepository extends JpaRepository<JobRun, Long> {

    @Query("""
            SELECT r FROM JobRun r
             WHERE (:job IS NULL OR r.jobName = :job)
               AND (:status IS NULL OR r.status = :status)
             ORDER BY r.id DESC
            """)
    List<JobRun> search(@Param("job") String job, @Param("status") String status, Pageable pageable);

    // "실패한 날" = 그 날(run_date) 몫의 가장 마지막 실행이 FAILED인 날. 실패 뒤에 성공한 날은 빠진다
    @Query(nativeQuery = true, value = """
            SELECT r.run_date
              FROM job_run r
             WHERE r.job_name = :job
               AND r.id = (SELECT MAX(r2.id) FROM job_run r2 WHERE r2.job_name = r.job_name AND r2.run_date = r.run_date)
               AND r.status = 'FAILED'
             ORDER BY r.run_date
            """)
    List<LocalDate> findFailedDates(@Param("job") String job);

    java.util.Optional<JobRun> findFirstByJobNameAndRunDateOrderByIdDesc(String jobName, LocalDate runDate);
}
```

`src/main/java/org/example/batch/JobRunResponse.java`

```java
package org.example.batch;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record JobRunResponse(Long id, String job, LocalDate runDate, LocalDateTime referenceAt, String trigger, String status,
                             Integer processed, String error, LocalDateTime startedAt, LocalDateTime finishedAt) {

    static JobRunResponse of(JobRun r) {
        return new JobRunResponse(r.getId(), r.getJobName(), r.getRunDate(), r.getReferenceAt(), r.getTriggerType(), r.getStatus(),
                r.getProcessed(), r.getErrorMessage(), r.getStartedAt(), r.getFinishedAt());
    }
}
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleJobNotFound`.

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
import org.example.batch.JobNotFoundException;

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

    @ExceptionHandler(JobNotFoundException.class)
    public ProblemDetail handleJobNotFound(JobNotFoundException ex, HttpServletRequest request) {
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
<summary>스케줄러 — 다른 단계의 실행 코드도 함께 변경</summary>

`src/main/java/org/example/batch/LikeMilestoneScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

// 10분마다 — 달성 순간에 바로가 아니라 "조금 늦게라도 한 번" 가면 되는 알림이다
@Component
public class LikeMilestoneScheduler {

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public LikeMilestoneScheduler(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    @Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")
    public void everyTenMinutes() {
        // 0건이면 기록하지 않는다(10분마다 빈 기록이 쌓이지 않게)
        jobLauncher.launchQuietly(JobCatalog.LIKE_MILESTONE, LocalDate.now(clock));
    }
}
```

`src/main/java/org/example/batch/ScheduledPublishScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

// 매분 0초(서울). practice는 시계가 2026-10-05 00:00에 멈춰 있어서 여기서는 아무것도 발행되지 않는다 — 수동 실행의 at으로 확인한다.
@Component
public class ScheduledPublishScheduler {

    private final ScheduledPublishService scheduledPublishService;
    private final JobRunner jobRunner;
    private final Clock clock;

    public ScheduledPublishScheduler(ScheduledPublishService scheduledPublishService, JobRunner jobRunner, Clock clock) {
        this.scheduledPublishService = scheduledPublishService;
        this.jobRunner = jobRunner;
        this.clock = clock;
    }

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void everyMinute() {
        LocalDateTime now = LocalDateTime.now(clock);
        // 매분 도는 배치 — 발행한 게 없으면 기록하지 않는다
        jobRunner.runQuietly(JobCatalog.SCHEDULED_PUBLISH, now.toLocalDate(), now,
                () -> scheduledPublishService.publishDue(now), r -> r.published().size());
    }
}
```

`src/main/java/org/example/batch/TrashPurgeScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

// 매일 새벽 3시(서울) — 사용자가 적은 시간대
@Component
public class TrashPurgeScheduler {

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public TrashPurgeScheduler(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void daily() {
        jobLauncher.launch(JobCatalog.TRASH_PURGE, LocalDate.now(clock), JobRunner.SCHEDULED);
    }
}
```

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

    private final JobLauncher jobLauncher;
    private final Clock clock;

    public WeeklyRankingScheduler(JobLauncher jobLauncher, Clock clock) {
        this.jobLauncher = jobLauncher;
        this.clock = clock;
    }

    @Scheduled(cron = "0 10 0 * * MON", zone = "Asia/Seoul")
    public void weekly() {
        jobLauncher.launch(JobCatalog.WEEKLY_RANKING, LocalDate.now(clock), JobRunner.SCHEDULED);
    }
}
```

</details>

<details>
<summary>Service — 재실행 선점 / JobRetryGate.java</summary>

`src/main/java/org/example/batch/JobRetryGate.java`

```java
package org.example.batch;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.UUID;

// MySQL 연결 단위 잠금: 같은 배치·날짜는 한 요청만 재실행한다. 프로세스가 종료되면 연결과 잠금도 해제된다.
@Component
public class JobRetryGate {
    private final DataSource dataSource;

    public JobRetryGate(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean runIfFree(String job, LocalDate date, Runnable work) {
        try (Connection connection = dataSource.getConnection()) {
            String key = "job-retry:" + UUID.nameUUIDFromBytes(
                    (connection.getCatalog() + ":" + job + ":" + date).getBytes(StandardCharsets.UTF_8));
            try (PreparedStatement statement = connection.prepareStatement("SELECT GET_LOCK(?, 0)")) {
                statement.setString(1, key);
                try (ResultSet rows = statement.executeQuery()) {
                    rows.next();
                    int acquired = rows.getInt(1);
                    if (rows.wasNull()) {
                        throw new SQLException("GET_LOCK returned NULL");
                    }
                    if (acquired == 0) {
                        return false;
                    }
                }
            }
            try {
                work.run();
                return true;
            } finally {
                try (PreparedStatement release = connection.prepareStatement("SELECT RELEASE_LOCK(?)")) {
                    release.setString(1, key);
                    release.executeQuery().close();
                }
            }
        } catch (SQLException e) {
            throw new DataAccessResourceFailureException("재실행 선점 잠금을 처리하지 못했습니다", e);
        }
    }
}
```

</details>

## MyBatis 대체 구현

기본 JPA 스냅숏의 같은 HTTP·DB 계약을 MyBatis로 구현한다. 아래 변경을 해당 스냅숏에 적용한다. 공통 `JobRetryGate`는 MySQL 연결 단위 잠금을 사용하므로 두 방식에서 그대로 쓴다.

<details>
<summary>설정 — MyBatis 의존성 — build.gradle</summary>

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
<summary>설정 — mapper 경로 — application.yml</summary>

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

mybatis:
  mapper-locations: classpath:mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

</details>

<details>
<summary>DTO / 모델 — 실행 기록 — JobRun.java</summary>

`src/main/java/org/example/batch/JobRun.java`

```java
package org.example.batch;


import java.time.LocalDate;
import java.time.LocalDateTime;

// 배치 실행 기록 한 줄(V65)
public class JobRun {

    public static final String RUNNING = "RUNNING";
    public static final String SUCCESS = "SUCCESS";
    public static final String FAILED = "FAILED";
    private static final int ERROR_MAX = 500;

    private Long id;

    private String jobName;

    private LocalDate runDate;

    private LocalDateTime referenceAt;

    private String triggerType;

    private String status;

    private Integer processed;

    private String errorMessage;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    public JobRun() {
        // MyBatis 결과 매핑
    }

    public static JobRun start(String jobName, LocalDate runDate, String triggerType, LocalDateTime referenceAt, LocalDateTime now) {
        JobRun run = new JobRun();
        run.jobName = jobName;
        run.runDate = runDate;
        run.referenceAt = referenceAt;
        run.triggerType = triggerType;
        run.status = RUNNING;
        run.startedAt = now;
        return run;
    }

    public void succeed(int processed, LocalDateTime now) {
        this.status = SUCCESS;
        this.processed = processed;
        this.finishedAt = now;
    }

    public void fail(Throwable e, LocalDateTime now) {
        this.status = FAILED;
        String message = e.getClass().getSimpleName() + ": " + e.getMessage();
        this.errorMessage = message.length() > ERROR_MAX ? message.substring(0, ERROR_MAX) : message;
        this.finishedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getJobName() {
        return jobName;
    }

    public LocalDate getRunDate() {
        return runDate;
    }

    public LocalDateTime getReferenceAt() {
        return referenceAt;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public String getStatus() {
        return status;
    }

    public Integer getProcessed() {
        return processed;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }
}
```

</details>

<details>
<summary>Repository — JPA 구현 제거 — JobRunRepository.java</summary>

`src/main/java/org/example/batch/JobRunRepository.java`

이 JPA repository 파일은 제거한다. 조회·저장은 아래 `JobRunMapper`가 담당한다.

</details>

<details>
<summary>Mapper — SQL 메서드 — JobRunMapper.java</summary>

`src/main/java/org/example/batch/JobRunMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface JobRunMapper {
    int insert(JobRun run);
    int update(JobRun run);
    List<JobRun> search(@Param("job") String job, @Param("status") String status, @Param("size") int size);
    List<LocalDate> findFailedDates(@Param("job") String job);
    JobRun findById(@Param("id") Long id);
    JobRun findLatest(@Param("job") String job, @Param("runDate") LocalDate runDate);
}
```

</details>

<details>
<summary>Mapper XML — INSERT·UPDATE·조회·실패일 — JobRunMapper.xml</summary>

`src/main/resources/mapper/JobRunMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.JobRunMapper">
    <resultMap id="jobRun" type="org.example.batch.JobRun">
        <id property="id" column="id"/>
        <result property="jobName" column="job_name"/>
        <result property="runDate" column="run_date"/>
        <result property="referenceAt" column="reference_at"/>
        <result property="triggerType" column="trigger_type"/>
        <result property="status" column="status"/>
        <result property="processed" column="processed"/>
        <result property="errorMessage" column="error_message"/>
        <result property="startedAt" column="started_at"/>
        <result property="finishedAt" column="finished_at"/>
    </resultMap>

    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO job_run (job_name, run_date, reference_at, trigger_type, status, processed, error_message, started_at, finished_at)
        VALUES (#{jobName}, #{runDate}, #{referenceAt}, #{triggerType}, #{status}, #{processed}, #{errorMessage}, #{startedAt}, #{finishedAt})
    </insert>

    <update id="update">
        UPDATE job_run
           SET status = #{status}, processed = #{processed}, error_message = #{errorMessage}, finished_at = #{finishedAt}
         WHERE id = #{id}
    </update>

    <select id="search" resultMap="jobRun">
        SELECT id, job_name, run_date, reference_at, trigger_type, status, processed, error_message, started_at, finished_at
          FROM job_run
        <where>
            <if test="job != null">job_name = #{job}</if>
            <if test="status != null">AND status = #{status}</if>
        </where>
         ORDER BY id DESC
         LIMIT #{size}
    </select>

    <select id="findFailedDates" resultType="java.time.LocalDate">
        SELECT r.run_date
          FROM job_run r
         WHERE r.job_name = #{job}
           AND r.id = (SELECT MAX(r2.id) FROM job_run r2 WHERE r2.job_name = r.job_name AND r2.run_date = r.run_date)
           AND r.status = 'FAILED'
         ORDER BY r.run_date
    </select>

    <select id="findById" resultMap="jobRun">
        SELECT id, job_name, run_date, reference_at, trigger_type, status, processed, error_message, started_at, finished_at
          FROM job_run WHERE id = #{id}
    </select>

    <select id="findLatest" resultMap="jobRun">
        SELECT id, job_name, run_date, reference_at, trigger_type, status, processed, error_message, started_at, finished_at
          FROM job_run
         WHERE job_name = #{job} AND run_date = #{runDate}
         ORDER BY id DESC LIMIT 1
    </select>
</mapper>
```

</details>

<details>
<summary>Service — 기록과 본문 트랜잭션 분리 — JobRunner.java</summary>

`src/main/java/org/example/batch/JobRunner.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.function.Supplier;
import java.util.function.LongConsumer;
import java.util.function.ToIntFunction;

// 15-6 모든 배치를 이걸로 감싼다 — 시작에 RUNNING 한 행, 끝나면 SUCCESS(처리 건수)·FAILED(이유).
// 이 클래스에는 @Transactional을 붙이지 않는다. MyBatis INSERT/UPDATE는 각자 바로 커밋되고,
// 배치 본문(work)은 자기 트랜잭션에서 돈다. 하나로 묶으면 배치가 실패할 때 FAILED 기록까지 같이 롤백된다.
@Component
public class JobRunner {

    public static final String SCHEDULED = "SCHEDULED";
    public static final String MANUAL = "MANUAL";
    public static final String RETRY = "RETRY";
    // 실행 기록의 시작·끝은 "실제로 돈 시각"(벽시계)이다. 업무상 날짜는 run_date(Clock 기준일)
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final Logger log = LoggerFactory.getLogger(JobRunner.class);

    private final JobRunMapper jobRunMapper;

    public JobRunner(JobRunMapper jobRunMapper) {
        this.jobRunMapper = jobRunMapper;
    }

    public <T> T run(String job, LocalDate runDate, String trigger, Supplier<T> work, ToIntFunction<T> processed) {
        return run(job, runDate, trigger, null, work, processed);
    }

    public <T> T run(String job, LocalDate runDate, String trigger, LocalDateTime referenceAt,
                     Supplier<T> work, ToIntFunction<T> processed) {
        return run(job, runDate, trigger, referenceAt, work, processed, id -> {});
    }

    public <T> T run(String job, LocalDate runDate, String trigger, LocalDateTime referenceAt,
                     Supplier<T> work, ToIntFunction<T> processed, LongConsumer started) {
        JobRun run = JobRun.start(job, runDate, trigger, referenceAt, LocalDateTime.now(ZONE));
        jobRunMapper.insert(run);
        started.accept(run.getId());
        try {
            T result = work.get();
            run.succeed(processed.applyAsInt(result), LocalDateTime.now(ZONE));
            jobRunMapper.update(run);
            return result;
        } catch (RuntimeException e) {
            run.fail(e, LocalDateTime.now(ZONE));
            jobRunMapper.update(run);
            log.error("배치 실패 job={} date={} runId={}", job, runDate, run.getId(), e);
            throw e;
        }
    }

    // 매분·10분마다 도는 예약 실행용 — 처리 0건인 성공은 기록하지 않는다(하루 1,440행이 쌓이지 않게). 실패는 남긴다
    public <T> T runQuietly(String job, LocalDate runDate, Supplier<T> work, ToIntFunction<T> processed) {
        return runQuietly(job, runDate, null, work, processed);
    }

    public <T> T runQuietly(String job, LocalDate runDate, LocalDateTime referenceAt,
                            Supplier<T> work, ToIntFunction<T> processed) {
        LocalDateTime started = LocalDateTime.now(ZONE);
        try {
            T result = work.get();
            int n = processed.applyAsInt(result);
            if (n > 0) {
                JobRun run = JobRun.start(job, runDate, SCHEDULED, referenceAt, started);
                run.succeed(n, LocalDateTime.now(ZONE));
                jobRunMapper.insert(run);
            }
            return result;
        } catch (RuntimeException e) {
            JobRun run = JobRun.start(job, runDate, SCHEDULED, referenceAt, started);
            run.fail(e, LocalDateTime.now(ZONE));
            jobRunMapper.insert(run);
            log.error("배치 실패 job={} date={}", job, runDate, e);
            throw e;
        }
    }
}
```

</details>

<details>
<summary>Controller — 조회·재실행 연결 — JobRunController.java</summary>

`src/main/java/org/example/batch/JobRunController.java`

```java
package org.example.batch;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

// 15-6 배치 실행 기록 조회와 "실패한 날만 다시 돌리기"
@RestController
public class JobRunController {

    private final JobRunMapper jobRunMapper;
    private final JobCatalog jobCatalog;
    private final JobLauncher jobLauncher;
    private final JobRetryGate retryGate;

    public JobRunController(JobRunMapper jobRunMapper, JobCatalog jobCatalog, JobLauncher jobLauncher, JobRetryGate retryGate) {
        this.jobRunMapper = jobRunMapper;
        this.jobCatalog = jobCatalog;
        this.jobLauncher = jobLauncher;
        this.retryGate = retryGate;
    }

    @GetMapping("/api/admin/jobs/runs")
    public List<JobRunResponse> runs(@RequestParam(required = false) String job,
                                     @RequestParam(required = false) @Pattern(regexp = "RUNNING|SUCCESS|FAILED",
                                             message = "status는 RUNNING, SUCCESS, FAILED 중 하나여야 합니다.") String status,
                                     @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                     @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        if (job != null && !jobCatalog.exists(job)) {
            throw new InvalidJobParameterException("job", "job은 " + jobCatalog.names() + " 중 하나여야 합니다.");
        }
        return jobRunMapper.search(job, status, size).stream()
                .map(JobRunResponse::of)
                .toList();
    }

    // 날마다 따로 돈다 — 한 날이 또 실패해도 다음 날은 계속 돌린다. 이미 성공한 날(마지막 실행이 SUCCESS)은 건너뛴다
    @PostMapping("/api/admin/jobs/{job}/retry-failed")
    public RetryResponse retryFailed(@PathVariable String job, @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        if (!jobCatalog.exists(job)) {
            throw new JobNotFoundException(job);
        }
        List<RetryResponse.Retried> retried = new ArrayList<>();
        for (LocalDate date : jobRunMapper.findFailedDates(job)) {
            retryGate.runIfFree(job, date, () -> {
                JobRun failed = java.util.Objects.requireNonNull(jobRunMapper.findLatest(job, date));
                if (!JobRun.FAILED.equals(failed.getStatus())) {
                    return; // 선점을 기다리는 동안 다른 요청이 복구했다.
                }
                String error = null;
                AtomicReference<Long> runId = new AtomicReference<>();
                try {
                    jobLauncher.launch(job, date, JobRunner.RETRY, failed.getReferenceAt(), runId::set);
                } catch (RuntimeException e) {
                    error = e.getClass().getSimpleName() + ": " + e.getMessage();
                }
                JobRun own = java.util.Objects.requireNonNull(jobRunMapper.findById(runId.get()));
                retried.add(new RetryResponse.Retried(date, own.getStatus(), own.getId(), error));
            });
        }
        return new RetryResponse(job, retried);
    }
}
```

</details>

## 직접 확인

API 서버 주소는 페이지 상단 공통 입력에서 설정한다. J1~J20은 실행 패널에서 보낸다. DB 잠금 실습은 트랜잭션을 연 채 실행 패널의 J21 요청을 단독 실행하고 `500` 응답을 확인한 뒤 `ROLLBACK`한다. Postman 설정은 접어서 확인할 수 있다.

**실패를 직접 만들어 보기(선택).** 9-2·4-2에서 본 잠금을 이용한다. DB 클라이언트에서 아래를 실행해 9/7 주 1위 자리를 잡아 둔다.

그 상태에서 주간 랭킹을 2026-09-14로 수동 실행하면, 약 50초(`innodb_lock_wait_timeout`) 뒤 `500`이 오고 기록에 `FAILED`·`CannotAcquireLockException`이 남는다. `ROLLBACK` 뒤에 `retry-failed`를 누르면 그 날만 다시 돈다.

```sql
START TRANSACTION;
INSERT INTO weekly_ranking (week_start, ranking, post_id, title, score, likes, comments, created_at)
VALUES ('2026-09-07', 1, 1, '잠금 연습', 0, 0, 0, NOW());
-- 여기서 멈춘 채로: 실행 패널 J21을 단독 실행한다(POST /api/admin/jobs/weekly-ranking/run?date=2026-09-14)
ROLLBACK;
```

**예약 발행의 기준 시각 복구.** 회원 2로 `publishAt=2026-10-06T08:00:00`인 예약 글을 만든다. DB 클라이언트에서 그 글을 `SELECT ... FOR UPDATE`로 잠근 채 운영자가 `POST /api/admin/jobs/scheduled-publish/run?at=2026-10-06T09:00:00`을 호출하면 잠금 대기 후 실패한다.

잠금을 풀고 `POST /api/admin/jobs/scheduled-publish/retry-failed`를 호출한다. `job_run.reference_at`은 실패·재실행 모두 `2026-10-06 09:00:00`이고 글은 `PUBLISHED`가 되어야 한다. 고정 시계의 현재 시각(2026-10-05)으로 다시 돌려 0건 성공으로 닫으면 실패다.

**동시 재실행.** 실패 기록이 남은 상태에서 운영자 요청 두 개를 동시에 보내면 응답의 `retried`는 합쳐서 해당 날짜 한 건이고 `job_run`에도 `RETRY` 한 줄만 생겨야 한다. 다시 한 번 요청하면 빈 배열이다. 재실행 응답의 `runId`는 바로 그 `RETRY` 행의 ID여야 한다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "J1",
      "title": "실패 기록 보기",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=weekly-ranking&status=FAILED",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J2",
      "title": "주간 랭킹 — 실패한 날만 다시",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/retry-failed",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J3",
      "title": "한 번 더",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/retry-failed",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J4",
      "title": "9/14 주 랭킹",
      "method": "GET",
      "path": "/api/rankings/weekly?weekStart=2026-09-14"
    },
    {
      "id": "J5",
      "title": "명예의 전당 — 실패한 날만 다시",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/retry-failed",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J6",
      "title": "주간 랭킹 기록",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=weekly-ranking&size=100",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J7",
      "title": "명예의 전당 수동 실행",
      "method": "POST",
      "path": "/api/admin/jobs/hall-of-fame/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J8",
      "title": "명예의 전당 최신 기록",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=hall-of-fame&size=1",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J9",
      "title": "잘못된 입력으로 실행(목요일)",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-10-01",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J10",
      "title": "주간 랭킹 최신 기록",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=weekly-ranking&size=1",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J11",
      "title": "없는 배치 이름",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=nope",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J12",
      "title": "없는 상태",
      "method": "GET",
      "path": "/api/admin/jobs/runs?status=DONE",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J13",
      "title": "size=0",
      "method": "GET",
      "path": "/api/admin/jobs/runs?size=0",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J14",
      "title": "size=100",
      "method": "GET",
      "path": "/api/admin/jobs/runs?size=100",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J15",
      "title": "없는 배치 다시 돌리기",
      "method": "POST",
      "path": "/api/admin/jobs/nope/retry-failed",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J16",
      "title": "기록 — 토큰 없음",
      "method": "GET",
      "path": "/api/admin/jobs/runs"
    },
    {
      "id": "J17",
      "title": "기록 — 일반 회원",
      "method": "GET",
      "path": "/api/admin/jobs/runs",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "J18",
      "title": "다시 돌리기 — 일반 회원",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/retry-failed",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "J19",
      "title": "job 빈 값",
      "method": "GET",
      "path": "/api/admin/jobs/runs?job=",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J20",
      "title": "status 공백",
      "method": "GET",
      "path": "/api/admin/jobs/runs?status=%20",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "J21",
      "title": "DB 잠금 실습 — 9/14 주간 랭킹 실행",
      "method": "POST",
      "path": "/api/admin/jobs/weekly-ranking/run?date=2026-09-14",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "J1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].runDate",
            "contains": "2026-09-21"
          },
          {
            "path": "$[*].status",
            "notContains": "SUCCESS"
          },
          {
            "path": "$[0].error",
            "type": "string"
          }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "J2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.job",
                "equals": "weekly-ranking"
              }
            ],
            "anyOf": [
              {
                "json": [
                  {
                    "path": "$.retried[*].runDate",
                    "contains": "2026-09-21"
                  },
                  {
                    "path": "$.retried[*].status",
                    "notContains": "FAILED"
                  }
                ]
              },
              {
                "json": [
                  {
                    "path": "$.retried",
                    "type": "array"
                  },
                  {
                    "path": "$.retried",
                    "length": 0
                  }
                ]
              }
            ]
          }
        },
        {
          "request": "J3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.retried",
                "type": "array"
              },
              {
                "path": "$.retried",
                "length": 0
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "request": "J4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              123,
              122,
              120,
              118,
              116,
              125,
              124,
              115,
              103,
              119
            ]
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "J5",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.retried",
            "type": "array"
          },
          {
            "path": "$.retried",
            "length": 0
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "J6",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].trigger",
            "contains": "RETRY"
          },
          {
            "path": "$[*].status",
            "contains": "FAILED"
          }
        ]
      }
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "J7",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "J8",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$",
                "length": 1
              },
              {
                "path": "$[0].job",
                "equals": "hall-of-fame"
              },
              {
                "path": "$[0].runDate",
                "equals": "2026-10-05"
              },
              {
                "path": "$[0].trigger",
                "equals": "MANUAL"
              },
              {
                "path": "$[0].status",
                "equals": "SUCCESS"
              },
              {
                "path": "$[0].processed",
                "type": "number"
              },
              {
                "path": "$[0].finishedAt",
                "type": "string"
              },
              {
                "path": "$[0].error",
                "type": "null"
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
          "request": "J9",
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
          "request": "J10",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[0].runDate",
                "notEquals": "2026-10-01"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "J11",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "job"
              }
            ]
          }
        },
        {
          "request": "J12",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "status"
              }
            ]
          }
        },
        {
          "request": "J13",
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
          "request": "J14",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$",
                "type": "array"
              }
            ]
          }
        },
        {
          "request": "J15",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "J19",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "job"
              }
            ]
          }
        },
        {
          "request": "J20",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "status"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "J16",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "J17",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "J18",
          "expect": {
            "status": 403
          }
        }
      ]
    },
    {
      "id": "C10",
      "manual": "weekly_ranking 잠금 실습에서 J21을 실행하면 잠금 대기 뒤 500으로 실패하고, job_run에 FAILED 기록이 남는다. 잠금 해제 뒤 J2/J3 재시도로 같은 기준 시각이 성공하는지 확인한다."
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | J1 | 2026-09-21 몫의 `FAILED` 기록이 있고 `error`가 문자열이다 |
| C2 | J2 / J3 | 처음이면 2026-09-21을 다시 돌려 `SUCCESS`(이미 했으면 빈 배열) / 빈 배열 — 이미 성공한 날은 다시 안 돈다 |
| C3 | J4 | 9/14 주 랭킹 = 123·122·120·118·116·125·124·115·103·119 (10위 119는 6점 동점 셋 중 가장 최근 글) |
| C4 | J5 | 빈 배열 — 9/30은 실패했지만 그 뒤에 성공했다 |
| C5 | J6 | 주간 랭킹 기록에 `RETRY`와 `FAILED`가 함께 있다(실패 기록은 지우지 않는다) |
| C6 | J7 / J8 | 수동 실행 뒤 최신 기록: `hall-of-fame`·`2026-10-05`·`MANUAL`·`SUCCESS`, `processed` 숫자, `finishedAt` 있음, `error` `null` |
| C7 | J9 / J10 | `400`(`date`) / 최신 기록이 2026-10-01 몫이 아니다 — 잘못된 입력은 기록되지 않는다 |
| C8 | J11 / J12 / J13 / J14 / J15 / J19 / J20 | `400`(`job`) / `400`(`status`) / `400`(`size`) / `200` / `404` / `400`(`job` 빈 값) / `400`(`status` 공백) |
| C9 | J16 / J17 / J18 | `401` / `403` / `403` |
| D1 | `SELECT job_name, run_date, trigger_type, status FROM job_run WHERE job_name = 'weekly-ranking' AND run_date = '2026-09-21' ORDER BY id` | `SCHEDULED FAILED` → `RETRY SUCCESS` (확인을 다시 돌려도 RETRY는 한 줄) |
| D2 | `SELECT COUNT(*) FROM job_run WHERE status = 'RUNNING'` | `0` — 끝난 실행은 모두 SUCCESS나 FAILED로 닫혔다 |
| D3 | `SELECT COUNT(*) FROM job_run WHERE job_name = 'scheduled-publish' AND trigger_type = 'SCHEDULED' AND processed = 0` | `0` — 매분 도는 빈 실행은 쌓이지 않는다 |
| D4 | 예약 발행 실패·재실행을 만든 뒤 `SELECT trigger_type, status, reference_at FROM job_run WHERE job_name='scheduled-publish' AND run_date='2026-10-06' ORDER BY id` | `MANUAL FAILED`와 `RETRY SUCCESS`의 `reference_at`이 모두 `2026-10-06 09:00:00` |
| R1 | 기록과 본문의 트랜잭션 | 실행기 자체는 트랜잭션 밖이다. `RUNNING` 저장·`FAILED` 저장이 배치 본문 롤백에 휩쓸리지 않는다(위 "실패를 직접 만들어 보기"로 확인) |
| R2 | 한 길 | 수동·예약·재실행이 모두 같은 실행기와 같은 서비스 메서드를 쓴다. 이름 → 배치 매핑이 한 곳에 있다 |
| R3 | 실패한 날 | "그 날 몫의 마지막 실행이 FAILED"로 고른다. FAILED 행이 있다는 것만으로 고르면 이미 복구한 날(9/30)까지 다시 돈다 |
| R4 | 재실행이 안전한 이유 | 다시 돌려도 결과가 두 번 쌓이지 않는 것은 15-1~15-5의 멱등 덕분이다(UNIQUE·"이미 있으면 그대로"·상태 전이 확인). 멱등이 아닌 배치에 재실행 버튼을 달면 무엇이 생기는지 말할 수 있다 |
| R5 | 동시 재실행 | DB·배치·날짜별 MySQL 연결 잠금 안에서 최신 상태를 다시 확인한다. 잠금은 예외나 프로세스 종료로 연결이 닫힐 때 풀리고, 응답은 자신의 실행 ID를 참조한다 |

## 필요한 지식

- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 롤백 범위
- [S15 비동기·스케줄링·Spring Batch](../../docs/knowledge/S15-async-scheduling-batch.md) — JobRepository·JobExecution이 하는 일(이 단계의 `job_run`이 그 작은 판)
- [P30 스케줄링 실무](../../docs/knowledge/P30-scheduling-practical.md) — 실패·중복·재시도
- [15-1](15-1-hall-of-fame.md)~[15-5](15-5-like-milestone.md) — 감쌀 배치들

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 실행기</summary>

```java
public <T> T run(String job, LocalDate runDate, String trigger, Supplier<T> work, ToIntFunction<T> processed) {
    JobRun run = jobRunRepository.save(JobRun.start(job, runDate, trigger, referenceAt, now())); // 바로 커밋
    try {
        T result = work.get();                                                         // 본문은 자기 트랜잭션
        run.succeed(processed.applyAsInt(result), now());
        jobRunRepository.save(run);
        return result;
    } catch (RuntimeException e) {
        run.fail(e, now());
        jobRunRepository.save(run);
        throw e;
    }
}
```

`JpaRepository.save`는 자기 트랜잭션으로 돈다. 이 메서드에 `@Transactional`이 없으면 저장할 때마다 바로 커밋된다.
</details>

<details>
<summary>힌트 2 — 이름으로 배치 찾기</summary>

`Map<String, Job<?>>` 하나에 다섯 배치를 등록한다. `Job`의 일은 `(runDate, referenceAt)`을 받는다. 날짜 배치는 `runDate`, 예약 발행은 저장한 `referenceAt`을 쓴다. 재실행 API는 경로의 이름으로 찾고, 없으면 404.
</details>

<details>
<summary>더 깊이 — 서버가 여러 대라면, Spring Batch라면</summary>

이 장의 재실행 버튼은 MySQL 연결 잠금으로 중복 요청을 막는다. 예약 스케줄러 자체가 여러 서버에서 동시에 시작되는 문제는 별개다.

보통 분산 락(ShedLock 등)으로 한 대만 돌게 한다. 매분·10분 배치는 0건 성공의 기록을 생략하므로 본문 실행 중 프로세스가 종료되면 그 실행 기록도 남지 않을 수 있다.

그런 종료까지 추적하려면 먼저 RUNNING을 저장하고 오래된 실행을 복구하는 정책이 필요하다. Spring Batch를 쓰면 이 단계의 `job_run` 역할을 `JobRepository`(BATCH_JOB_EXECUTION 등)가 한다. </details>

## 다음 단계

15장 끝. 16장 — 이벤트·비동기·캐시·외부 호출(같은 `practice` 프로파일): [16-1. 새 글 알림 — 커밋된 뒤에만 보내기](../ch16-events-async-cache/16-1-new-post-event.md)
