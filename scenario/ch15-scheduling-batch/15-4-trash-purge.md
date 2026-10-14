# 15-4. 휴지통 비우기 — 자식 먼저, 1000건씩

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다. "지금" = 2026-10-05 00:00.

## 상황

> "삭제한 글이 DB에 계속 쌓여요. 삭제하고 30일이 지난 글은 진짜로 지워 주세요. 매일 새벽에요. 그 글에 달린 댓글·좋아요·북마크도 같이요."

3-2에서 글 삭제를 `deleted_at`만 채우는 soft delete로 만들었다. 실수로 지운 글을 되살리거나 신고를 처리하려면 한동안 남겨 두는 게 맞다. 하지만 영원히 둘 수는 없다. 이 단계는 보관 기간(30일)이 지난 글을 **영구 삭제(hard delete)** 한다. 부딪히는 문제는 세 가지다.

- **FK 순서** — `post`를 먼저 지우면 그 글을 가리키는 `post_like`·`comment`·`bookmark`·`post_tag`·`notification`·`hall_of_fame` 때문에 실패한다. 자식부터 지운다. `comment`는 자기 자신도 가리킨다(답글 → 원댓글). 그래서 답글을 먼저 지운다.
- **양** — 학습용 DB에는 30일 지난 삭제 글이 2,404개 있다. 원래 있던 42·59·60·67번에 이 단계 마이그레이션이 넣는 연습용 2,400개를 더한 수다. 한 트랜잭션으로 지우면 그동안 잠금이 길게 잡힌다. 중간에 실패하면 전부 되돌아간다. 1000건씩 끊어서 **청크마다 커밋**한다.
- **경계** — 정확히 30일 전(2026-09-05 00:00:00)에 삭제된 글은 남는다. 그 1초 전(2026-09-04 23:59:59)에 삭제된 글은 지운다.

> 11·14장을 했다면 `post`를 가리키는 표가 더 있다 — 11-2 `post_image`, 11-3 `post_view`, 11-6 `post_revision`, 14-1 `post_reaction`, 14-2 `poll`(그 아래 `poll_option`·`poll_vote`도 — 표 → 선택지 → 투표 순서), 14-3 `board_pin`, 14-4 `series_post`(시리즈 자체는 남긴다), 14-5 `recent_view`. 모두 지울 목록에 넣는다. 하나라도 빠지면 그 자식이 있는 글에서 `DELETE post`가 FK로 실패하고 그 청크 전체가 롤백된다. 지금 DB에서 무엇이 `post`를 가리키는지는 D1 쿼리로 확인한다. 이미지 파일(11-2 `uploads/`)은 행만 지우고 파일은 남는다 — 파일 청소는 따로 할 일이다. 15-2의 `weekly_ranking`은 FK가 없어서 지우지 않는다. 기록이라 남겨야 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 도구 — 휴지통 비우기",
  "summary": "삭제(soft delete)된 지 30일 지난 글을 자식 행부터 영구 삭제한다. 1000건씩 끊어서 청크마다 커밋한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "운영 도구 · 배치",
      "right": "운영자"
    },
    {
      "type": "stats",
      "id": "trash",
      "items": [
        {
          "id": "s-old",
          "label": "30일 지난 글",
          "value": "2,404"
        },
        {
          "id": "s-keep",
          "label": "아직 보관 중",
          "value": "22"
        }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "run",
          "label": "휴지통 비우기",
          "variant": "danger"
        }
      ]
    },
    {
      "type": "code",
      "id": "log",
      "label": "서버 로그",
      "value": "청크 1: 글 1000건 (id 42~1141) 자식 {notifications=198, likes=2019, …}\n청크 2: 글 1000건 (id 1142~2141) …\n청크 3: 글 404건 (id 2142~2545) …\n휴지통 비우기 cutoff=2026-09-05T00:00 글 2404건, 청크 [1000, 1000, 404]"
    },
    {
      "type": "text",
      "id": "nothing",
      "value": "지울 글이 없어요",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "비우기",
      "steps": [
        {
          "kind": "user",
          "text": "[휴지통 비우기]를 누른다(매일 03:00에도 같은 메서드가 돈다)",
          "focus": [
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/trash-purge/run",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "server",
          "text": "기준 시각 = 오늘(2026-10-05) 0시 − 30일 = 2026-09-05 00:00. 이보다 먼저 삭제된 글이 대상"
        },
        {
          "kind": "db",
          "sql": "SELECT id FROM post WHERE deleted_at IS NOT NULL AND deleted_at < '2026-09-05 00:00' ORDER BY id LIMIT 1000",
          "note": "인덱스 (deleted_at, id). 매번 남은 것 중 앞 1000개"
        },
        {
          "kind": "db",
          "sql": "-- 청크 하나 = 트랜잭션 하나\nDELETE FROM notification WHERE post_id IN (…) OR comment_id IN (그 글들의 댓글);\nDELETE FROM post_like WHERE post_id IN (…);\nDELETE FROM bookmark …; DELETE FROM post_tag …; DELETE FROM hall_of_fame …;\nDELETE FROM comment WHERE post_id IN (…) AND parent_id IS NOT NULL;  -- 답글 먼저\nDELETE FROM comment WHERE post_id IN (…);\nDELETE FROM post WHERE id IN (…) AND deleted_at < '2026-09-05 00:00';\nCOMMIT",
          "note": "자식 → 부모 순서. 이 묶음을 0건이 나올 때까지 되풀이"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"cutoff\": \"2026-09-05T00:00:00\", \"deletedPosts\": 2404, \"chunks\": [1000, 1000, 404], \"deleted\": {\"notifications\": 480, \"likes\": 4827, …}}"
        },
        {
          "kind": "screen",
          "text": "청크마다 로그 한 줄",
          "focus": [
            "log"
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
            "run"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/trash-purge/run",
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
          "body": "{\"deletedPosts\": 0, \"chunks\": [], …}"
        },
        {
          "kind": "screen",
          "text": "지울 게 없다 — 30일이 안 된 22개는 남아 있다",
          "focus": [
            "nothing",
            "s-keep"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V63** — `db/migration/V63__add_post_deleted_index.sql`: `CREATE INDEX ix_post_deleted ON post (deleted_at, id)` — "30일 지난 삭제 글"을 매일 찾는다.

**연습용 시드(practice 전용)** — `db/practice-data/V63_1__seed_trash_posts.sql`. 운영 마이그레이션에 연습용 데이터를 섞지 않으려고 따로 둔다. practice 프로파일에서만 그 폴더도 읽게 한다.

```yaml
# application-practice.yml — spring: 아래에 (spring: 키를 하나 더 만들면 기동 실패)
  flyway:
    locations: classpath:db/migration,classpath:db/practice-data
```

시드 파일은 아래를 그대로 쓴다. 삭제된 글 2,420개를 만든다. 2,400개는 30일이 지났고 20개는 아직 안 지났으며, 각 경계값이 1개씩 들어 있다. 자식 행은 글마다 좋아요 2·댓글 1·답글 1·북마크 1·태그 1개이고, 10개 중 1개 글에는 알림 2개가 더 붙는다.

<details>
<summary>V63_1__seed_trash_posts.sql 펼치기</summary>

```sql
-- V63.1 — practice 전용 시드(15-4 휴지통 비우기 연습용). application-practice.yml의 flyway.locations로만 실행된다.
-- community DB·테스트 DB에는 들어가지 않는다(테스트 시드 db/testdata와 같은 방식).
--
-- 삭제된 글 2,420개와 그 자식 행(좋아요 2·댓글 1+답글 1·북마크 1·태그 1, 일부는 알림 2)을 만든다.
--   2,400개 : 2026-09-05 00:00 전에 삭제됨 → 지금(2026-10-05) 기준 30일 지남, 영구 삭제 대상
--             (그중 1개는 경계값 2026-09-04 23:59:59)
--      20개 : 그 뒤에 삭제됨 → 아직 휴지통에 남는다(그중 1개는 경계값 2026-09-05 00:00:00 — 정확히 30일, 남는다)
-- 작성자·좋아요·댓글 회원은 8-1 채점이 숫자를 보는 회원(1·2·3·4·5·12·22·26·28·29·30)을 피해 고른다.
-- 1000행을 넘기므로 재귀 CTE(cte_max_recursion_depth 기본 1000) 대신 숫자 표를 CROSS JOIN 한다.

-- 1) 글 — 제목 앞머리 '[휴지통 시드]'로 자식 행을 붙일 때 찾는다
INSERT INTO post (board_id, author_id, title, content, excerpt, status, visibility, view_count, like_count, comment_count,
                  published_at, created_at, updated_at, deleted_at)
SELECT 2 + (s.n MOD 3),
       ELT(1 + (s.n MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       CONCAT('[휴지통 시드] ', s.n),
       '삭제된 연습용 글입니다.',
       '삭제된 연습용 글입니다.',
       'PUBLISHED', 'PUBLIC', 0, 2, 2,
       s.deleted_at - INTERVAL 10 DAY, s.deleted_at - INTERVAL 10 DAY, s.deleted_at, s.deleted_at
  FROM (SELECT d.n,
               CASE
                   WHEN d.n = 2400 THEN TIMESTAMP('2026-09-04 23:59:59')
                   WHEN d.n = 2401 THEN TIMESTAMP('2026-09-05 00:00:00')
                   WHEN d.n < 2400 THEN TIMESTAMP('2026-07-01 00:00:00') + INTERVAL (d.n MOD 60) DAY + INTERVAL d.n SECOND
                   ELSE TIMESTAMP('2026-09-06 00:00:00') + INTERVAL (d.n - 2402) DAY + INTERVAL 3 HOUR
               END AS deleted_at
          FROM (SELECT a.d + b.d * 10 + c.d * 100 + e.d * 1000 + 1 AS n
                  FROM (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2) e) d
         WHERE d.n <= 2420) s
 ORDER BY s.n;

-- 시드 글과 번호(n)를 잇는 임시 표 — 아래 자식 행이 같은 회원 규칙을 쓴다
CREATE TEMPORARY TABLE seed_trash AS
SELECT p.id AS post_id,
       CAST(SUBSTRING(p.title, 10) AS UNSIGNED) AS n,
       p.author_id,
       p.created_at
  FROM post p
 WHERE p.title LIKE '[휴지통 시드] %';

-- 2) 좋아요 2개 — 작성자 다음 두 회원
INSERT INTO post_like (post_id, member_id, created_at)
SELECT t.post_id, ELT(1 + ((t.n + k.k) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       t.created_at + INTERVAL k.k HOUR
  FROM seed_trash t CROSS JOIN (SELECT 1 k UNION ALL SELECT 2) k;

-- 3) 댓글 1개 + 그 댓글의 답글 1개 — 답글이 원댓글을 참조한다(fk_comment_parent)
INSERT INTO comment (post_id, member_id, parent_id, content, created_at, updated_at, deleted_at)
SELECT t.post_id, ELT(1 + ((t.n + 1) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       NULL, '연습용 댓글', t.created_at + INTERVAL 3 HOUR, t.created_at + INTERVAL 3 HOUR, NULL
  FROM seed_trash t;

INSERT INTO comment (post_id, member_id, parent_id, content, created_at, updated_at, deleted_at)
SELECT c.post_id, ELT(1 + ((t.n + 2) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       c.id, '연습용 답글', t.created_at + INTERVAL 4 HOUR, t.created_at + INTERVAL 4 HOUR, NULL
  FROM seed_trash t
  JOIN comment c ON c.post_id = t.post_id AND c.parent_id IS NULL;

-- 4) 북마크 1개 — 시각은 원래 데이터의 어떤 북마크보다도 이르게(2026-06-01) 둔다.
--    "내 북마크" 목록이 최신순이라, 그러지 않으면 9-5처럼 회원의 북마크 순서를 보는 채점이 밀린다
INSERT INTO bookmark (member_id, post_id, folder_id, created_at, updated_at)
SELECT ELT(1 + ((t.n + 1) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       t.post_id, NULL, TIMESTAMP('2026-06-01 00:00:00') + INTERVAL t.n SECOND,
       TIMESTAMP('2026-06-01 00:00:00') + INTERVAL t.n SECOND
  FROM seed_trash t;

-- 5) 태그 1개(java·spring·jpa·mysql·docker 중)
INSERT INTO post_tag (post_id, tag_id)
SELECT t.post_id, 1 + (t.n MOD 5) FROM seed_trash t;

-- 6) 알림 — 10개 중 1개 글에 좋아요 알림·댓글 알림(comment_id가 댓글을 참조한다 → 댓글보다 먼저 지워야 한다)
INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, read_at, created_at)
SELECT t.author_id, c.member_id, 'COMMENT', t.post_id, c.id, NULL, c.created_at
  FROM seed_trash t
  JOIN comment c ON c.post_id = t.post_id AND c.parent_id IS NULL
 WHERE t.n MOD 10 = 0;

INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, read_at, created_at)
SELECT t.author_id, l.member_id, 'LIKE', t.post_id, NULL, NULL, l.created_at
  FROM seed_trash t
  JOIN post_like l ON l.post_id = t.post_id
 WHERE t.n MOD 10 = 0 AND l.created_at = t.created_at + INTERVAL 1 HOUR;

DROP TEMPORARY TABLE seed_trash;
```
</details>

**배치**

| 항목 | 내용 |
|---|---|
| 예약 실행 | `@Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")` |
| 수동 실행 | `POST /api/admin/jobs/trash-purge/run?date=2026-10-05` — 운영자만. 같은 서비스 메서드 |
| 대상 | `deleted_at < 기준일 0시 − 30일`(2026-10-05 → `2026-09-05 00:00:00` 전) |
| 청크 | 남은 대상 중 `id` 순 앞 1000개(설정 `app.jobs.trash-purge.chunk-size`, 기본 1000)를 골라 한 트랜잭션에서 지우고 커밋. 0건이 나올 때까지 되풀이. `OFFSET`은 쓰지 않는다 — 지운 만큼 앞으로 당겨진다 |
| 복원 경합 | 청크 트랜잭션 안에서 아직 만료된 삭제 글만 `FOR UPDATE`로 다시 잠그고, 그 ID의 자식만 지운다. 선택된 글이 전부 복원·삭제됐으면 다음 대상 묶음을 다시 찾는다 |
| 순서 | `notification`(글·댓글을 가리킴) → `post_like` → `bookmark` → `post_tag` → `hall_of_fame` → 답글(`parent_id IS NOT NULL`) → 원댓글 → `post` |
| 로그 | 청크마다 지운 글 수·id 범위·자식 수, 끝에 합계 |
| 응답 | `{ "date", "cutoff", "deletedPosts", "chunks": [청크마다 글 수], "deleted": { "notifications", "likes", "bookmarks", "tags", "hallOfFame", "replies", "comments", "posts" } }` |

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `date` | 아니오 | 생략·빈 값·공백이면 오늘 | 오늘까지. **미래 400** — 앞당겨 지우지 않는다 | `yyyy-MM-dd` | 오늘 | `400`, `errors[].field = "date"` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 기준 시각 = 오늘(2026-10-05) 0시 − 30일 = 2026-09-05 00:00. 이보다 먼저 삭제된 글이 대상
- 인덱스 (deleted_at, id). 매번 남은 것 중 앞 1000개
- 자식 → 부모 순서. 이 묶음을 0건이 나올 때까지 되풀이

<details>
<summary>Controller — HTTP 연결</summary>

`TrashPurgeController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/admin/jobs/trash-purge/run")`. 변경된 메서드: `run`.

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

    private final TrashPurgeService trashPurgeService;
    private final Clock clock;

    public TrashPurgeController(TrashPurgeService trashPurgeService, Clock clock) {
        this.trashPurgeService = trashPurgeService;
        this.clock = clock;
    }

    // date = 배치가 도는 날. 그날 0시 기준 30일 전보다 먼저 삭제된 글을 지운다. 미래 날짜는 400(앞당겨 지우지 않는다)
    @PostMapping("/api/admin/jobs/trash-purge/run")
    public TrashPurgeResponse run(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                  @LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return trashPurgeService.purge(JobDates.resolve(date, clock));
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`TrashPurgeResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/TrashPurgeResponse.java`

```java
package org.example.batch;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// chunks: 청크마다 지운 글 수(커밋 단위). deleted: 같이 지운 자식 행 수(표 이름별)
public record TrashPurgeResponse(LocalDate date, LocalDateTime cutoff, int deletedPosts,
                                 List<Integer> chunks, Map<String, Integer> deleted) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`TrashPurgeService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `purge`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/batch/TrashPurgeService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 15-4 휴지통 비우기 — 삭제(soft delete)된 지 30일 지난 글을 자식 행과 함께 영구 삭제한다.
// 이 메서드에는 @Transactional을 붙이지 않는다. 청크(1000건)마다 TransactionTemplate으로 따로 커밋한다
// — 몇만 건을 한 트랜잭션으로 지우면 잠금이 길어지고, 중간에 실패하면 전부 되돌아간다.
// (같은 클래스 안에서 this.purgeChunk()에 @Transactional을 붙여 부르면 프록시를 거치지 않아 트랜잭션이 안 열린다)
@Service
public class TrashPurgeService {

    public static final int RETENTION_DAYS = 30;
    private static final Logger log = LoggerFactory.getLogger(TrashPurgeService.class);

    private final TrashPurgeRepository trashPurgeRepository;
    private final TransactionTemplate transactionTemplate;
    private final int chunkSize;

    public TrashPurgeService(TrashPurgeRepository trashPurgeRepository, TransactionTemplate transactionTemplate,
                             @Value("${app.jobs.trash-purge.chunk-size:1000}") int chunkSize) {
        this.trashPurgeRepository = trashPurgeRepository;
        this.transactionTemplate = transactionTemplate;
        this.chunkSize = chunkSize;
    }

    public TrashPurgeResponse purge(LocalDate date) {
        LocalDateTime cutoff = date.atStartOfDay().minusDays(RETENTION_DAYS);
        List<Integer> chunks = new ArrayList<>();
        Map<String, Integer> deleted = new LinkedHashMap<>();
        int total = 0;
        while (true) {
            List<Long> ids = trashPurgeRepository.findTargetIds(cutoff, chunkSize);
            if (ids.isEmpty()) {
                break;
            }
            Map<String, Integer> counts = transactionTemplate.execute(status -> purgeChunk(ids, cutoff));
            int posts = counts.get("posts");
            if (posts == 0) {
                // 그 사이에 선택한 글이 전부 복원·삭제됐다면 다음 묶음을 다시 찾는다.
                // 같은 id만 계속 보이면 진전이 없는 상태이므로 멈춰 무한 반복을 막는다.
                if (trashPurgeRepository.findTargetIds(cutoff, chunkSize).equals(ids)) {
                    break;
                }
                continue;
            }
            counts.forEach((table, n) -> deleted.merge(table, n, Integer::sum));
            chunks.add(posts);
            total += posts;
            log.info("휴지통 비우기 청크 {}: 글 {}건 (id {}~{}) 자식 {}", chunks.size(), posts, ids.getFirst(), ids.getLast(), counts);
        }
        log.info("휴지통 비우기 date={} cutoff={} 글 {}건, 청크 {}", date, cutoff, total, chunks);
        return new TrashPurgeResponse(date, cutoff, total, chunks, deleted);
    }

    // 한 청크 = 한 트랜잭션. 자식 → 부모 순서
    private Map<String, Integer> purgeChunk(List<Long> selectedIds, LocalDateTime cutoff) {
        List<Long> ids = trashPurgeRepository.lockStillEligible(selectedIds, cutoff);
        if (ids.isEmpty()) {
            return Map.of("posts", 0);
        }
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("notifications", trashPurgeRepository.deleteNotifications(ids));
        counts.put("likes", trashPurgeRepository.deleteLikes(ids));
        counts.put("bookmarks", trashPurgeRepository.deleteBookmarks(ids));
        counts.put("tags", trashPurgeRepository.deleteTags(ids));
        counts.put("hallOfFame", trashPurgeRepository.deleteHallOfFame(ids));
        // 11·14장에서 늘어난 자식 표
        counts.put("images", trashPurgeRepository.deleteImages(ids));
        counts.put("views", trashPurgeRepository.deleteViews(ids));
        counts.put("revisions", trashPurgeRepository.deleteRevisions(ids));
        counts.put("reactions", trashPurgeRepository.deleteReactions(ids));
        counts.put("pollVotes", trashPurgeRepository.deletePollVotes(ids));
        counts.put("pollOptions", trashPurgeRepository.deletePollOptions(ids));
        counts.put("polls", trashPurgeRepository.deletePolls(ids));
        counts.put("pins", trashPurgeRepository.deletePins(ids));
        counts.put("seriesLinks", trashPurgeRepository.deleteSeriesLinks(ids));
        counts.put("recentViews", trashPurgeRepository.deleteRecentViews(ids));
        counts.put("replies", trashPurgeRepository.deleteReplies(ids));
        counts.put("comments", trashPurgeRepository.deleteComments(ids));
        counts.put("posts", trashPurgeRepository.deletePosts(ids, cutoff));
        return counts;
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`TrashPurgeRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/batch/TrashPurgeRepository.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// 15-4 휴지통 비우기 — 글 하나에 매달린 자식 행을 FK 방향의 반대(자식 → 부모) 순서로 지운다.
// 엔티티를 불러 하나씩 remove하지 않고 id 묶음(IN) 단위 DELETE로 보낸다.
public interface TrashPurgeRepository extends Repository<Post, Long> {

    // 인덱스 (deleted_at, id)로 범위만 읽는다. 매번 "남은 것 중 앞 1000개"를 다시 고른다(OFFSET을 쓰지 않는다 — 지운 만큼 당겨진다)
    @Query(nativeQuery = true, value = """
            SELECT id FROM post
             WHERE deleted_at IS NOT NULL AND deleted_at < :cutoff
             ORDER BY id
             LIMIT :limit
            """)
    List<Long> findTargetIds(@Param("cutoff") LocalDateTime cutoff, @Param("limit") int limit);

    // 먼저 고른 글이 복원되었을 수 있다. 청크 트랜잭션 안에서 아직 삭제 대상인 행만 잠근다.
    // 잠근 id에 매달린 자식만 지워야 복원된 글의 자식을 잘못 지우지 않는다.
    @Query(nativeQuery = true, value = """
            SELECT id FROM post
             WHERE id IN (:ids) AND deleted_at IS NOT NULL AND deleted_at < :cutoff
             ORDER BY id FOR UPDATE
            """)
    List<Long> lockStillEligible(@Param("ids") List<Long> ids, @Param("cutoff") LocalDateTime cutoff);

    // 1) 알림 — post_id와 comment_id 둘 다 FK라 댓글보다 먼저
    @Modifying
    @Query(nativeQuery = true, value = """
            DELETE FROM notification
             WHERE post_id IN (:ids)
                OR comment_id IN (SELECT c.id FROM comment c WHERE c.post_id IN (:ids))
            """)
    int deleteNotifications(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_like WHERE post_id IN (:ids)")
    int deleteLikes(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM bookmark WHERE post_id IN (:ids)")
    int deleteBookmarks(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_tag WHERE post_id IN (:ids)")
    int deleteTags(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM hall_of_fame WHERE post_id IN (:ids)")
    int deleteHallOfFame(@Param("ids") List<Long> ids);

    // 앞 장(11·14장)에서 post를 가리키는 표가 늘었다 — 빠뜨리면 그 자식이 있는 글에서 DELETE post가 FK로 실패한다.
    // 지금 무엇이 post를 가리키는지는 information_schema.KEY_COLUMN_USAGE(REFERENCED_TABLE_NAME = 'post')로 확인한다(D1)
    // 11-2 이미지 행(저장된 파일은 지우지 않는다 — 파일 청소는 따로 할 일)
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_image WHERE post_id IN (:ids)")
    int deleteImages(@Param("ids") List<Long> ids);

    // 11-3 조회 기록
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_view WHERE post_id IN (:ids)")
    int deleteViews(@Param("ids") List<Long> ids);

    // 11-6 수정 이력
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_revision WHERE post_id IN (:ids)")
    int deleteRevisions(@Param("ids") List<Long> ids);

    // 14-1 공감
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post_reaction WHERE post_id IN (:ids)")
    int deleteReactions(@Param("ids") List<Long> ids);

    // 14-2 투표 — 표(poll_vote) → 선택지(poll_option) → 투표(poll) 순서. 표는 선택지와 투표를 둘 다 가리킨다
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM poll_vote WHERE poll_id IN (SELECT p.id FROM poll p WHERE p.post_id IN (:ids))")
    int deletePollVotes(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM poll_option WHERE poll_id IN (SELECT p.id FROM poll p WHERE p.post_id IN (:ids))")
    int deletePollOptions(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM poll WHERE post_id IN (:ids)")
    int deletePolls(@Param("ids") List<Long> ids);

    // 14-3 상단 고정, 14-4 시리즈 연결(시리즈 자체는 남긴다), 14-5 최근 본 글
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM board_pin WHERE post_id IN (:ids)")
    int deletePins(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM series_post WHERE post_id IN (:ids)")
    int deleteSeriesLinks(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM recent_view WHERE post_id IN (:ids)")
    int deleteRecentViews(@Param("ids") List<Long> ids);

    // 2) 답글 먼저(parent_id가 원댓글을 참조한다) → 원댓글. 한 문장으로 지우면 행 순서에 따라 FK에 걸릴 수 있다
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM comment WHERE post_id IN (:ids) AND parent_id IS NOT NULL")
    int deleteReplies(@Param("ids") List<Long> ids);

    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM comment WHERE post_id IN (:ids)")
    int deleteComments(@Param("ids") List<Long> ids);

    // 3) 마지막에 글 — 고른 뒤 그 사이에 조건이 바뀌었을 수 있으니 조건을 한 번 더 건다
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM post WHERE id IN (:ids) AND deleted_at IS NOT NULL AND deleted_at < :cutoff")
    int deletePosts(@Param("ids") List<Long> ids, @Param("cutoff") LocalDateTime cutoff);
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V63__add_post_deleted_index.sql`, `V63_1__seed_trash_posts.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V63__add_post_deleted_index.sql`

```sql
-- V63 — 휴지통 비우기(15-4). "삭제된 지 30일 지난 글"을 매일 찾는다 — deleted_at 범위 조회용 인덱스.
-- 삭제 안 된 글(NULL)이 대부분이라 인덱스에서 NULL 아닌 범위만 읽는다.
CREATE INDEX ix_post_deleted ON post (deleted_at, id);
```

`src/main/resources/db/practice-data/V63_1__seed_trash_posts.sql`

```sql
-- V63.1 — practice 전용 시드(15-4 휴지통 비우기 연습용). application-practice.yml의 flyway.locations로만 실행된다.
-- community DB·테스트 DB에는 들어가지 않는다(테스트 시드 db/testdata와 같은 방식).
--
-- 삭제된 글 2,420개와 그 자식 행(좋아요 2·댓글 1+답글 1·북마크 1·태그 1, 일부는 알림 2)을 만든다.
--   2,400개 : 2026-09-05 00:00 전에 삭제됨 → 지금(2026-10-05) 기준 30일 지남, 영구 삭제 대상
--             (그중 1개는 경계값 2026-09-04 23:59:59)
--      20개 : 그 뒤에 삭제됨 → 아직 휴지통에 남는다(그중 1개는 경계값 2026-09-05 00:00:00 — 정확히 30일, 남는다)
-- 작성자·좋아요·댓글 회원은 8-1 채점이 숫자를 보는 회원(1·2·3·4·5·12·22·26·28·29·30)을 피해 고른다.
-- 1000행을 넘기므로 재귀 CTE(cte_max_recursion_depth 기본 1000) 대신 숫자 표를 CROSS JOIN 한다.

-- 1) 글 — 제목 앞머리 '[휴지통 시드]'로 자식 행을 붙일 때 찾는다
INSERT INTO post (board_id, author_id, title, content, excerpt, status, visibility, view_count, like_count, comment_count,
                  published_at, created_at, updated_at, deleted_at)
SELECT 2 + (s.n MOD 3),
       ELT(1 + (s.n MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       CONCAT('[휴지통 시드] ', s.n),
       '삭제된 연습용 글입니다.',
       '삭제된 연습용 글입니다.',
       'PUBLISHED', 'PUBLIC', 0, 2, 2,
       s.deleted_at - INTERVAL 10 DAY, s.deleted_at - INTERVAL 10 DAY, s.deleted_at, s.deleted_at
  FROM (SELECT d.n,
               CASE
                   WHEN d.n = 2400 THEN TIMESTAMP('2026-09-04 23:59:59')
                   WHEN d.n = 2401 THEN TIMESTAMP('2026-09-05 00:00:00')
                   WHEN d.n < 2400 THEN TIMESTAMP('2026-07-01 00:00:00') + INTERVAL (d.n MOD 60) DAY + INTERVAL d.n SECOND
                   ELSE TIMESTAMP('2026-09-06 00:00:00') + INTERVAL (d.n - 2402) DAY + INTERVAL 3 HOUR
               END AS deleted_at
          FROM (SELECT a.d + b.d * 10 + c.d * 100 + e.d * 1000 + 1 AS n
                  FROM (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
                 CROSS JOIN (SELECT 0 d UNION ALL SELECT 1 UNION ALL SELECT 2) e) d
         WHERE d.n <= 2420) s
 ORDER BY s.n;

-- 시드 글과 번호(n)를 잇는 임시 표 — 아래 자식 행이 같은 회원 규칙을 쓴다
CREATE TEMPORARY TABLE seed_trash AS
SELECT p.id AS post_id,
       CAST(SUBSTRING(p.title, 10) AS UNSIGNED) AS n,
       p.author_id,
       p.created_at
  FROM post p
 WHERE p.title LIKE '[휴지통 시드] %';

-- 2) 좋아요 2개 — 작성자 다음 두 회원
INSERT INTO post_like (post_id, member_id, created_at)
SELECT t.post_id, ELT(1 + ((t.n + k.k) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       t.created_at + INTERVAL k.k HOUR
  FROM seed_trash t CROSS JOIN (SELECT 1 k UNION ALL SELECT 2) k;

-- 3) 댓글 1개 + 그 댓글의 답글 1개 — 답글이 원댓글을 참조한다(fk_comment_parent)
INSERT INTO comment (post_id, member_id, parent_id, content, created_at, updated_at, deleted_at)
SELECT t.post_id, ELT(1 + ((t.n + 1) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       NULL, '연습용 댓글', t.created_at + INTERVAL 3 HOUR, t.created_at + INTERVAL 3 HOUR, NULL
  FROM seed_trash t;

INSERT INTO comment (post_id, member_id, parent_id, content, created_at, updated_at, deleted_at)
SELECT c.post_id, ELT(1 + ((t.n + 2) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       c.id, '연습용 답글', t.created_at + INTERVAL 4 HOUR, t.created_at + INTERVAL 4 HOUR, NULL
  FROM seed_trash t
  JOIN comment c ON c.post_id = t.post_id AND c.parent_id IS NULL;

-- 4) 북마크 1개 — 시각은 원래 데이터의 어떤 북마크보다도 이르게(2026-06-01) 둔다.
--    "내 북마크" 목록이 최신순이라, 그러지 않으면 9-5처럼 회원의 북마크 순서를 보는 채점이 밀린다
INSERT INTO bookmark (member_id, post_id, folder_id, created_at, updated_at)
SELECT ELT(1 + ((t.n + 1) MOD 19), 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 27),
       t.post_id, NULL, TIMESTAMP('2026-06-01 00:00:00') + INTERVAL t.n SECOND,
       TIMESTAMP('2026-06-01 00:00:00') + INTERVAL t.n SECOND
  FROM seed_trash t;

-- 5) 태그 1개(java·spring·jpa·mysql·docker 중)
INSERT INTO post_tag (post_id, tag_id)
SELECT t.post_id, 1 + (t.n MOD 5) FROM seed_trash t;

-- 6) 알림 — 10개 중 1개 글에 좋아요 알림·댓글 알림(comment_id가 댓글을 참조한다 → 댓글보다 먼저 지워야 한다)
INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, read_at, created_at)
SELECT t.author_id, c.member_id, 'COMMENT', t.post_id, c.id, NULL, c.created_at
  FROM seed_trash t
  JOIN comment c ON c.post_id = t.post_id AND c.parent_id IS NULL
 WHERE t.n MOD 10 = 0;

INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, read_at, created_at)
SELECT t.author_id, l.member_id, 'LIKE', t.post_id, NULL, NULL, l.created_at
  FROM seed_trash t
  JOIN post_like l ON l.post_id = t.post_id
 WHERE t.n MOD 10 = 0 AND l.created_at = t.created_at + INTERVAL 1 HOUR;

DROP TEMPORARY TABLE seed_trash;
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`TrashPurgeScheduler.java`. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다. 변경된 메서드: `daily`.

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

    private final TrashPurgeService trashPurgeService;
    private final Clock clock;

    public TrashPurgeScheduler(TrashPurgeService trashPurgeService, Clock clock) {
        this.trashPurgeService = trashPurgeService;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void daily() {
        trashPurgeService.purge(LocalDate.now(clock));
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`application-practice.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

`src/main/resources/application-practice.yml`

```yaml
# 학습용 데이터(practice DB)에 붙는 프로파일 — practice/MISSIONS.md 미션용
# 실행: ./gradlew bootRun --args='--spring.profiles.active=practice'  (IntelliJ: Active profiles에 practice)
spring:
  datasource:
    url: jdbc:mysql://localhost:13308/practice?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
  flyway:
    # 15-4 practice 전용 시드(휴지통 비우기 연습용 삭제 글 2,420개) — 이 프로파일에서만 db/practice-data도 읽는다.
    # 기본 프로파일(community)·테스트는 db/migration만 읽어서 시드가 들어가지 않는다.
    locations: classpath:db/migration,classpath:db/practice-data

# 학습용 데이터의 기준 시각 — 8·9장의 "최근 7일" 같은 계산은 이 시각을 "지금"으로 쓴다(데이터가 이 시각 이전에 만들어져 있다).
# Clock 빈을 만들 때 이 값이 있으면 Clock.fixed(...)로, 없으면 Clock.systemDefaultZone()으로 만든다(8-2).
app:
  fixed-now: "2026-10-05T00:00:00"
```

</details>

<details>
<summary>MyBatis 대안 — 자식부터 묶음 삭제</summary>

JPA의 native query와 같은 19개 문장을 Mapper XML로 작성한다. `IN` 목록은 `foreach`로 바인딩하고, 청크마다 `TransactionTemplate`으로 커밋한다. 답글·댓글·글 순서를 유지한다.

### 설정 / 의존성

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

### MyBatis / Mapper·SQL

`src/main/java/org/example/batch/TrashPurgeMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface TrashPurgeMapper {
    List<Long> findTargetIds(@Param("cutoff") LocalDateTime cutoff, @Param("limit") int limit);
    List<Long> lockStillEligible(@Param("ids") List<Long> ids, @Param("cutoff") LocalDateTime cutoff);
    int deleteNotifications(@Param("ids") List<Long> ids);
    int deleteLikes(@Param("ids") List<Long> ids);
    int deleteBookmarks(@Param("ids") List<Long> ids);
    int deleteTags(@Param("ids") List<Long> ids);
    int deleteHallOfFame(@Param("ids") List<Long> ids);
    int deleteImages(@Param("ids") List<Long> ids);
    int deleteViews(@Param("ids") List<Long> ids);
    int deleteRevisions(@Param("ids") List<Long> ids);
    int deleteReactions(@Param("ids") List<Long> ids);
    int deletePollVotes(@Param("ids") List<Long> ids);
    int deletePollOptions(@Param("ids") List<Long> ids);
    int deletePolls(@Param("ids") List<Long> ids);
    int deletePins(@Param("ids") List<Long> ids);
    int deleteSeriesLinks(@Param("ids") List<Long> ids);
    int deleteRecentViews(@Param("ids") List<Long> ids);
    int deleteReplies(@Param("ids") List<Long> ids);
    int deleteComments(@Param("ids") List<Long> ids);
    int deletePosts(@Param("ids") List<Long> ids, @Param("cutoff") LocalDateTime cutoff);
}
```

`src/main/resources/mapper/TrashPurgeMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.TrashPurgeMapper">
    <select id="findTargetIds" resultType="java.lang.Long">
        SELECT id FROM post
        WHERE deleted_at IS NOT NULL AND deleted_at &lt; #{cutoff}
        ORDER BY id
        LIMIT #{limit}
    </select>
    <select id="lockStillEligible" resultType="java.lang.Long">
        SELECT id FROM post
        WHERE id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
          AND deleted_at IS NOT NULL AND deleted_at &lt; #{cutoff}
        ORDER BY id FOR UPDATE
    </select>
    <delete id="deleteNotifications">
        DELETE FROM notification
        WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
        OR comment_id IN (SELECT c.id FROM comment c WHERE c.post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>)
    </delete>
    <delete id="deleteLikes">
        DELETE FROM post_like WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteBookmarks">
        DELETE FROM bookmark WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteTags">
        DELETE FROM post_tag WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteHallOfFame">
        DELETE FROM hall_of_fame WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteImages">
        DELETE FROM post_image WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteViews">
        DELETE FROM post_view WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteRevisions">
        DELETE FROM post_revision WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteReactions">
        DELETE FROM post_reaction WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deletePollVotes">
        DELETE FROM poll_vote WHERE poll_id IN (SELECT p.id FROM poll p WHERE p.post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>)
    </delete>
    <delete id="deletePollOptions">
        DELETE FROM poll_option WHERE poll_id IN (SELECT p.id FROM poll p WHERE p.post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>)
    </delete>
    <delete id="deletePolls">
        DELETE FROM poll WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deletePins">
        DELETE FROM board_pin WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteSeriesLinks">
        DELETE FROM series_post WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteRecentViews">
        DELETE FROM recent_view WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deleteReplies">
        DELETE FROM comment WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach> AND parent_id IS NOT NULL
    </delete>
    <delete id="deleteComments">
        DELETE FROM comment WHERE post_id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
    </delete>
    <delete id="deletePosts">
        DELETE FROM post WHERE id IN <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach> AND deleted_at IS NOT NULL AND deleted_at &lt; #{cutoff}
    </delete>
</mapper>
```

### Service / 청크 트랜잭션

`src/main/java/org/example/batch/TrashPurgeService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 15-4 휴지통 비우기 — 삭제(soft delete)된 지 30일 지난 글을 자식 행과 함께 영구 삭제한다.
// 이 메서드에는 @Transactional을 붙이지 않는다. 청크(1000건)마다 TransactionTemplate으로 따로 커밋한다
// — 몇만 건을 한 트랜잭션으로 지우면 잠금이 길어지고, 중간에 실패하면 전부 되돌아간다.
// (같은 클래스 안에서 this.purgeChunk()에 @Transactional을 붙여 부르면 프록시를 거치지 않아 트랜잭션이 안 열린다)
@Service
public class TrashPurgeService {

    public static final int RETENTION_DAYS = 30;
    private static final Logger log = LoggerFactory.getLogger(TrashPurgeService.class);

    private final TrashPurgeMapper trashPurgeMapper;
    private final TransactionTemplate transactionTemplate;
    private final int chunkSize;

    public TrashPurgeService(TrashPurgeMapper trashPurgeMapper, TransactionTemplate transactionTemplate,
                             @Value("${app.jobs.trash-purge.chunk-size:1000}") int chunkSize) {
        this.trashPurgeMapper = trashPurgeMapper;
        this.transactionTemplate = transactionTemplate;
        this.chunkSize = chunkSize;
    }

    public TrashPurgeResponse purge(LocalDate date) {
        LocalDateTime cutoff = date.atStartOfDay().minusDays(RETENTION_DAYS);
        List<Integer> chunks = new ArrayList<>();
        Map<String, Integer> deleted = new LinkedHashMap<>();
        int total = 0;
        while (true) {
            List<Long> ids = trashPurgeMapper.findTargetIds(cutoff, chunkSize);
            if (ids.isEmpty()) {
                break;
            }
            Map<String, Integer> counts = transactionTemplate.execute(status -> purgeChunk(ids, cutoff));
            int posts = counts.get("posts");
            if (posts == 0) {
                // 그 사이에 선택한 글이 전부 복원·삭제됐다면 다음 묶음을 다시 찾는다.
                // 같은 id만 계속 보이면 진전이 없는 상태이므로 멈춰 무한 반복을 막는다.
                if (trashPurgeMapper.findTargetIds(cutoff, chunkSize).equals(ids)) {
                    break;
                }
                continue;
            }
            counts.forEach((table, n) -> deleted.merge(table, n, Integer::sum));
            chunks.add(posts);
            total += posts;
            log.info("휴지통 비우기 청크 {}: 글 {}건 (id {}~{}) 자식 {}", chunks.size(), posts, ids.getFirst(), ids.getLast(), counts);
        }
        log.info("휴지통 비우기 date={} cutoff={} 글 {}건, 청크 {}", date, cutoff, total, chunks);
        return new TrashPurgeResponse(date, cutoff, total, chunks, deleted);
    }

    // 한 청크 = 한 트랜잭션. 자식 → 부모 순서
    private Map<String, Integer> purgeChunk(List<Long> selectedIds, LocalDateTime cutoff) {
        List<Long> ids = trashPurgeMapper.lockStillEligible(selectedIds, cutoff);
        if (ids.isEmpty()) {
            return Map.of("posts", 0);
        }
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("notifications", trashPurgeMapper.deleteNotifications(ids));
        counts.put("likes", trashPurgeMapper.deleteLikes(ids));
        counts.put("bookmarks", trashPurgeMapper.deleteBookmarks(ids));
        counts.put("tags", trashPurgeMapper.deleteTags(ids));
        counts.put("hallOfFame", trashPurgeMapper.deleteHallOfFame(ids));
        // 11·14장에서 늘어난 자식 표
        counts.put("images", trashPurgeMapper.deleteImages(ids));
        counts.put("views", trashPurgeMapper.deleteViews(ids));
        counts.put("revisions", trashPurgeMapper.deleteRevisions(ids));
        counts.put("reactions", trashPurgeMapper.deleteReactions(ids));
        counts.put("pollVotes", trashPurgeMapper.deletePollVotes(ids));
        counts.put("pollOptions", trashPurgeMapper.deletePollOptions(ids));
        counts.put("polls", trashPurgeMapper.deletePolls(ids));
        counts.put("pins", trashPurgeMapper.deletePins(ids));
        counts.put("seriesLinks", trashPurgeMapper.deleteSeriesLinks(ids));
        counts.put("recentViews", trashPurgeMapper.deleteRecentViews(ids));
        counts.put("replies", trashPurgeMapper.deleteReplies(ids));
        counts.put("comments", trashPurgeMapper.deleteComments(ids));
        counts.put("posts", trashPurgeMapper.deletePosts(ids, cutoff));
        return counts;
    }
}
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p01'
curl -s -X POST "$BASE/api/admin/jobs/trash-purge/run" -H "$A" | python3 -m json.tool   # T1
curl -s -X POST "$BASE/api/admin/jobs/trash-purge/run" -H "$A"; echo                    # T2 한 번 더
grep '휴지통 비우기' app.log    # 청크마다 한 줄씩(로그 파일 위치는 실행 방법에 따라)
```

11·14장을 했다면 자식 표가 모두 붙은 글로 한 번 더 본다(C6 수동). 시드 글에는 이미지·공감·투표 같은 자식이 없어서 위 확인만으로는 빠진 표를 못 잡는다.

```bash
AU='Authorization: Bearer tok-p03'; OT='Authorization: Bearer tok-p05'; J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
printf 'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;' > dot.gif
IMG=$(curl -s -X POST "$BASE/api/images" -H "$AU" -F "file=@dot.gif" | jid)                                   # 11-2 이미지
X=$(curl -s -X POST "$BASE/api/posts" -H "$AU" -H "$J" -d "{\"boardSlug\":\"free\",\"title\":\"자식 많은 글\",\"content\":\"x\",\"imageIds\":[$IMG]}" | jid)
curl -s -o /dev/null "$BASE/api/posts/$X" -H "$OT"                                                             # 11-3 조회 기록·14-5 최근 본 글
curl -s -o /dev/null -X PATCH "$BASE/api/posts/$X" -H "$AU" -H "$J" -d '{"title":"자식 많은 글 고침"}'          # 11-6 수정 이력
curl -s -o /dev/null -X PUT "$BASE/api/posts/$X/reaction" -H "$OT" -H "$J" -d '{"kind":"HEART"}'                # 14-1 공감
O=$(curl -s -X POST "$BASE/api/posts/$X/poll" -H "$AU" -H "$J" -d '{"question":"어느 쪽?","options":["가","나"]}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["options"][0]["id"])')
curl -s -o /dev/null -X POST "$BASE/api/posts/$X/poll/votes" -H "$OT" -H "$J" -d "{\"optionId\":$O}"          # 14-2 투표
curl -s -o /dev/null -X PUT "$BASE/api/boards/free/pinned-posts/$X" -H "$A"                                     # 14-3 고정
S=$(curl -s -X POST "$BASE/api/series" -H "$AU" -H "$J" -d '{"title":"자식 시리즈"}' | jid)
curl -s -o /dev/null -X PUT "$BASE/api/series/$S/posts/$X" -H "$AU"                                             # 14-4 시리즈
curl -s -o /dev/null -X DELETE "$BASE/api/posts/$X" -H "$AU"
# 지운 지 30일이 지난 것처럼 — DB에서 deleted_at만 당긴다(SQL 클라이언트에서)
#   UPDATE post SET deleted_at = '2026-08-01 00:00:00' WHERE id = <X>;
curl -s -X POST "$BASE/api/admin/jobs/trash-purge/run" -H "$A"; echo     # 200, deleted에 images·views·revisions·reactions·pollVotes·pollOptions·polls·pins·seriesLinks·recentViews가 1 이상
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "T1",
      "title": "비우기",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T2",
      "title": "한 번 더",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T3",
      "title": "오늘 날짜로",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run?date=2026-10-05",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T4",
      "title": "미래 날짜",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run?date=2026-10-06",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T5",
      "title": "없는 날짜",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run?date=2026-13-01",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T6",
      "title": "일반 회원",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "T7",
      "title": "토큰 없음",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run"
    },
    {
      "id": "T8",
      "title": "날짜 칸이 공백",
      "method": "POST",
      "path": "/api/admin/jobs/trash-purge/run?date=%20",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "T9",
      "title": "회원 2의 북마크(#60을 북마크했다)",
      "method": "GET",
      "path": "/api/me/bookmarks?size=100",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "T10",
      "title": "회원 3의 북마크(#109를 북마크했다)",
      "method": "GET",
      "path": "/api/me/bookmarks?size=100",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "T1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.cutoff",
            "equals": "2026-09-05T00:00:00"
          }
        ],
        "anyOf": [
          {
            "json": [
              {
                "path": "$.deletedPosts",
                "equals": 2404
              },
              {
                "path": "$.chunks",
                "equals": [
                  1000,
                  1000,
                  404
                ]
              },
              {
                "path": "$.deleted.likes",
                "equals": 4827
              },
              {
                "path": "$.deleted.replies",
                "equals": 2401
              },
              {
                "path": "$.deleted.comments",
                "equals": 2408
              },
              {
                "path": "$.deleted.bookmarks",
                "equals": 2407
              },
              {
                "path": "$.deleted.notifications",
                "equals": 480
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.deletedPosts",
                "equals": 0
              },
              {
                "path": "$.chunks",
                "length": 0
              }
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "T2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.deletedPosts",
                "equals": 0
              },
              {
                "path": "$.chunks",
                "type": "array"
              },
              {
                "path": "$.chunks",
                "length": 0
              }
            ]
          }
        },
        {
          "request": "T3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.deletedPosts",
                "equals": 0
              },
              {
                "path": "$.date",
                "equals": "2026-10-05"
              }
            ]
          }
        },
        {
          "request": "T8",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.deletedPosts",
                "equals": 0
              },
              {
                "path": "$.date",
                "equals": "2026-10-05"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "T4",
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
          "request": "T5",
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
      "id": "C4",
      "all": [
        {
          "request": "T6",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "T7",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "T9",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "notContains": 60
              },
              {
                "path": "$.items[*].postId",
                "contains": 145
              }
            ]
          }
        },
        {
          "request": "T10",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "contains": 109
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C6",
      "manual": "11·14장 자식 표(이미지·조회 기록·수정 이력·공감·투표·고정·시리즈·최근 본 글)가 모두 붙은 글을 지우고 30일 전으로 당긴 뒤 비우기 — 직접 확인의 두 번째 스크립트. 시드 글에는 이런 자식이 없어서 실행 칸으로는 못 본다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | T1 | `200`, `cutoff`=`2026-09-05T00:00:00`. 처음이면 `deletedPosts`=2404, `chunks`=`[1000, 1000, 404]`, 좋아요 4827·답글 2401·원댓글 2408·북마크 2407·알림 480. 이미 비웠으면 0과 `[]` |
| C2 | T2 / T3 / T8 | 모두 `deletedPosts`=0 — 몇 번을 돌려도 같다. 공백 날짜(T8)는 생략과 같다(오늘) |
| C3 | T4 / T5 | `400`, `errors`에 `date` |
| C4 | T6 / T7 | `403` / `401` |
| C5 | T9 / T10 | 회원 2의 북마크 목록에서 영구 삭제된 #60이 사라졌다(6-3에서는 `available: false`로 보이던 것) / 회원 3이 북마크한 #109(삭제 5일째)는 아직 남아 있다 |
| C6 | 수동 — 직접 확인 두 번째 스크립트 | 11·14장 자식이 모두 붙은 오래된 삭제 글도 `200`으로 지워진다(FK 오류 `500`이 아니다). 응답 `deleted`에 그 표들이 1 이상 |
| D1 | `SELECT table_name, column_name FROM information_schema.key_column_usage WHERE referenced_table_schema = 'practice' AND referenced_table_name IN ('post', 'comment') ORDER BY table_name, column_name` | 이 목록의 모든 표가 지우는 순서에 들어 있다(11~14장을 이어서 했다면 board_pin·bookmark·comment 2·hall_of_fame·notification 2·poll·poll_option·poll_vote 2·post_image·post_like·post_reaction·post_revision·post_tag·post_view·recent_view·series_post — `poll_option`·`poll_vote`는 `poll`을 거쳐 글에 매달린다. 15-5 뒤에는 like_milestone도) |
| D2 | `SELECT COUNT(*), MIN(deleted_at) FROM post WHERE deleted_at IS NOT NULL` | `22`, `2026-09-05 00:00:00` — 정확히 30일 된 글은 남는다 |
| D3 | `SELECT COUNT(*) FROM post WHERE title LIKE '[휴지통 시드]%'` | `20` |
| R1 | 순서 | 자식 → 부모. 답글과 원댓글을 두 문장으로 나눴다. FK에 `ON DELETE CASCADE`를 새로 걸어 DB에 맡기는 방법도 있지만, 그러면 무엇이 얼마나 지워지는지 코드·로그에 안 보인다(그 선택을 설명할 수 있으면 된다) |
| R2 | 청크 트랜잭션 | 전체 메서드에 `@Transactional`을 붙이지 않았다. 청크마다 `TransactionTemplate`(또는 다른 빈의 `@Transactional` 메서드)으로 커밋한다. 같은 클래스 안 `this.메서드()`의 `@Transactional`은 프록시를 안 거쳐 무시된다는 것을 안다 |
| R3 | 멈춤 조건 | "남은 것 중 앞 N개"를 매번 다시 고른다. 고른 글이 복원·삭제되어 0건이면 다음 묶음을 찾되, 같은 ID만 반복되면 무한 반복을 막는다 |
| R4 | 집합 삭제 | 글마다 엔티티를 불러 `remove`하지 않고 `IN (…)` 묶음으로 지운다(JPA의 `deleteAll`도 한 건씩 DELETE를 보낸다) |

**주의 — 다른 장 숫자.** 시드가 들어가고 비워지면서 회원별 "누른 좋아요 수" 같은 집계가 바뀐다. 원래 있던 삭제 글 42·59·60·67의 좋아요가 사라지기 때문이다. 8-1을 다시 돌리면 `likesGiven`이 다를 수 있다. 데이터를 지운 결과라 정상이다.

## 필요한 지식

- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 프록시와 자기 호출
- [S15 비동기·스케줄링·Spring Batch](../../docs/knowledge/S15-async-scheduling-batch.md) — 청크와 체크포인트
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — FK가 막는 것
- [R05 인덱스](../../docs/knowledge/R05-index-btree.md)
- [3-2. soft delete](../ch3-update-delete/3-2-soft-delete.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 청크마다 커밋</summary>

```java
while (true) {
    List<Long> ids = repo.findTargetIds(cutoff, 1000);
    if (ids.isEmpty()) break;
    Map<String, Integer> counts = transactionTemplate.execute(status -> purgeChunk(ids, cutoff));
    ...
}
```

`TransactionTemplate`은 Spring Boot가 빈으로 만들어 둔다. 생성자로 받으면 된다.
</details>

<details>
<summary>힌트 2 — IN 목록 파라미터</summary>

네이티브 쿼리에서도 `WHERE post_id IN (:ids)`에 `List<Long>`을 넘기면 펼쳐진다. 1000개 정도는 문제없다. 몇만 개를 한 번에 넣지는 않는다(그래서 청크).
</details>

## 다음 단계

[15-5. 좋아요 달성 축하 알림](15-5-like-milestone.md)
