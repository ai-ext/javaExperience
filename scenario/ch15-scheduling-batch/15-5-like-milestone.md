# 15-5. 좋아요 달성 축하 알림 — 한 단계에 한 번만

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "내 글이 좋아요 10개, 50개, 100개를 넘으면 축하 알림을 보내 주세요. 같은 축하가 두 번 오면 안 돼요. 누가 좋아요를 취소했다 다시 눌러서 9개 ↔ 10개를 오가도요."

9-4의 알림은 사건(좋아요·댓글)이 생길 때 그 자리에서 만들었다. 이번 알림은 "어떤 상태에 처음 닿았다"는 것이라 사건 하나만 보고는 알 수 없다. 좋아요 수가 10이 됐다가 9로 내려가고 다시 10이 될 수 있기 때문이다. 그래서 **달성 기록**을 따로 남기고, 기록이 처음 생길 때만 알림을 보낸다. 10분마다 도는 배치가 "단계에 닿았는데 아직 기록이 없는 글"을 찾는다.

학습용 데이터에서 좋아요가 10개 이상인 글(삭제 제외)은 11개다. 50개·100개에 닿은 글은 아직 없어서, 지금 데이터로는 10 단계만 생긴다. #140은 좋아요가 9개다. 회원 8(`tok-p08`)이 누르면 10개가 된다.

알림 표를 넓힌다. 시스템이 보내는 알림이라 "보낸 사람"이 없다. 9-4에서 `actor_id`를 `NOT NULL`로 만들었고, 목록 쿼리는 `JOIN FETCH n.actor`(내부 조인)다. 둘 다 그대로 두면 저장이 실패하거나 목록에서 축하 알림만 조용히 빠진다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "알림 — 좋아요 달성 축하",
  "summary": "좋아요 10·50·100개에 처음 닿으면 작성자에게 축하 알림을 한 번 보낸다. 9 ↔ 10을 오가도 다시 보내지 않는다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "알림",
      "right": "테스트러버"
    },
    {
      "type": "chips",
      "id": "filter",
      "items": [
        "전체",
        "축하"
      ]
    },
    {
      "type": "list",
      "id": "list",
      "items": [
        {
          "id": "n-ms",
          "title": "🎉 내 글 #140이 좋아요 10개를 받았어요",
          "meta": "LIKE_MILESTONE · 보낸 사람 없음",
          "badge": "새 알림"
        },
        {
          "id": "n-like",
          "title": "디버깅중님이 #140을 좋아합니다",
          "meta": "LIKE"
        }
      ]
    },
    {
      "type": "stats",
      "id": "likes",
      "items": [
        {
          "id": "like-count",
          "label": "#140 좋아요",
          "value": "9 → 10 → 9 → 10"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "10개 달성",
      "steps": [
        {
          "kind": "user",
          "text": "디버깅중(회원 8)이 #140에 좋아요 — 9개 → 10개"
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/140/like",
          "headers": [
            "Authorization: Bearer tok-p08"
          ]
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"postId\": 140, \"liked\": true, \"likeCount\": 10}"
        },
        {
          "kind": "server",
          "text": "10분마다 도는 배치(또는 운영자 수동 실행)"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/like-milestone/run",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, COUNT(*) AS likes FROM post p JOIN post_like l ON l.post_id = p.id\nWHERE p.deleted_at IS NULL GROUP BY p.id HAVING COUNT(*) >= 10  -- + 아직 기록 안 된 단계가 있는 글만",
          "note": "like_count가 아니라 실제 행 수"
        },
        {
          "kind": "db",
          "sql": "INSERT IGNORE INTO like_milestone (post_id, milestone, likes, reached_at) VALUES (140, 10, 10, ?);\nINSERT INTO notification (member_id, actor_id, type, post_id, milestone, …) VALUES (9, NULL, 'LIKE_MILESTONE', 140, 10, …)",
          "note": "기록이 들어갔을 때(1행)만 알림. 둘은 한 트랜잭션"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"added\": [{\"postId\": 140, \"milestone\": 10, \"likes\": 10}]}"
        },
        {
          "kind": "screen",
          "text": "작성자(회원 9) 알림 목록 맨 위에 축하",
          "focus": [
            "n-ms"
          ]
        }
      ]
    },
    {
      "name": "취소했다 다시 누름",
      "steps": [
        {
          "kind": "user",
          "text": "회원 8이 좋아요를 취소했다(9개) 다시 누른다(10개)",
          "focus": [
            "like-count"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/like-milestone/run",
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
          "body": "{\"added\": []}"
        },
        {
          "kind": "screen",
          "text": "10 단계는 이미 기록돼 있어서 축하는 한 번뿐"
        }
      ]
    },
    {
      "name": "축하만 보기",
      "steps": [
        {
          "kind": "user",
          "text": "'축하' 칩을 누른다",
          "focus": [
            "filter"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/notifications?type=LIKE_MILESTONE",
          "headers": [
            "Authorization: Bearer tok-p09"
          ]
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [{\"type\": \"LIKE_MILESTONE\", \"actor\": null, \"postId\": 140, \"milestone\": 10, …}], \"unreadCount\": …}"
        },
        {
          "kind": "screen",
          "text": "축하 알림 1개",
          "focus": [
            "n-ms"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V64** — `db/migration/V64__create_like_milestone.sql`

| 변경 | 내용 |
|---|---|
| `like_milestone` | `post_id`(FK → `post`), `milestone`(10·50·100, CHECK), `likes`(그때 좋아요 수), `reached_at`. **`UNIQUE(post_id, milestone)`** |
| `notification.actor_id` | `NULL` 허용(`MODIFY actor_id BIGINT NULL`) |
| `notification.milestone` | `INT NULL` — 몇 개 달성인지 |
| `ck_notification_type` | `LIKE_MILESTONE` 추가(`DROP CHECK` 후 다시 만들기). 12-2 `MENTION`처럼 앞 장에서 더한 값이 있으면 남긴다 |

**배치**

| 항목 | 내용 |
|---|---|
| 예약 실행 | `@Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")` — 10분마다 |
| 수동 실행 | `POST /api/admin/jobs/like-milestone/run` — 운영자만. 같은 서비스 메서드. 파라미터 없음 |
| 대상 | 삭제 안 된 글 중 `post_like` **행 수**가 10 이상이고, 닿은 단계 중 기록 안 된 단계가 있는 글 |
| 하는 일 | 닿은 단계마다 `INSERT IGNORE INTO like_milestone …`. 들어갔을 때(1행)만 작성자에게 `LIKE_MILESTONE` 알림(`actor` 없음, `milestone`=단계). 기록과 알림은 **한 트랜잭션** |
| 응답 | `{ "added": [ { "postId", "milestone", "likes" } ] }` — 이번에 새로 달성한 것만(`postId` 순) |
| 15-4 | 휴지통 비우기의 지우는 순서에 `like_milestone`을 넣는다(`post`를 가리키는 표가 늘었다) |

**알림 목록 확장** — `GET /api/me/notifications`(9-4)

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `type`(새로) | 아니오 | 생략하면 전부. **빈 값·공백은 400** | `LIKE`·`COMMENT`·`MENTION`·`LIKE_MILESTONE` | 문자열 | 없음 | `400`, `errors[].field = "type"` |
| `size`(그대로) | 아니오 | — | 1~100 | 정수 | 20 | `400` |

항목에 `milestone`이 더해지고, `LIKE_MILESTONE`이면 `actor`는 `null`이다.

```json
{ "items": [ { "id": 523, "type": "LIKE_MILESTONE", "actor": null, "postId": 140, "commentId": null,
               "milestone": 10, "read": false, "createdAt": "…" } ], "unreadCount": 3 }
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 10분마다 도는 배치(또는 운영자 수동 실행)
- like_count가 아니라 실제 행 수
- 기록이 들어갔을 때(1행)만 알림. 둘은 한 트랜잭션

<details>
<summary>Controller — HTTP 연결</summary>

`LikeMilestoneController.java`, `NotificationController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/admin/jobs/like-milestone/run")`. 변경된 메서드: `run`.

`src/main/java/org/example/batch/LikeMilestoneController.java`

```java
package org.example.batch;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LikeMilestoneController {

    private final LikeMilestoneService likeMilestoneService;

    public LikeMilestoneController(LikeMilestoneService likeMilestoneService) {
        this.likeMilestoneService = likeMilestoneService;
    }

    @PostMapping("/api/admin/jobs/like-milestone/run")
    public LikeMilestoneResponse run(@LoginMember AuthenticatedMember me) {
        AdminGuard.requireAdmin(me);
        return likeMilestoneService.run();
    }
}
```

`src/main/java/org/example/notification/NotificationController.java`

```java
package org.example.notification;

import jakarta.validation.constraints.Pattern;
import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.LoginMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // GET이지만 "내 것" 엔드포인트라 인증 필수
    @GetMapping("/api/me/notifications")
    public NotificationListResponse list(@RequestParam(value = "unreadOnly", required = false) String unreadOnly,
                                         // 15-5 종류로 거르기(선택) — 정해진 값이 아니면 400
                                         @RequestParam(required = false) @Pattern(regexp = "LIKE|COMMENT|MENTION|LIKE_MILESTONE",
                                                 message = "type은 LIKE, COMMENT, MENTION, LIKE_MILESTONE 중 하나여야 합니다.") String type,
                                         @RequestParam(value = "size", required = false) String size,
                                         @RequestParam(required = false) String cursor,
                                         @LoginMember AuthenticatedMember me) {
        return notificationService.list(requireLogin(me), parseUnreadOnly(unreadOnly), type, parseSize(size), cursor);
    }

    // 생략만 기본값이다. Spring boolean 변환의 1/yes/on 허용을 피한다.
    private boolean parseUnreadOnly(String raw) {
        if (raw == null || "false".equals(raw)) return false;
        if ("true".equals(raw)) return true;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unreadOnly는 true 또는 false여야 합니다.");
    }

    private int parseSize(String raw) {
        if (raw == null) return 20;
        if (!raw.matches("[0-9]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size는 1~100이어야 합니다.");
        }
        try {
            int value = Integer.parseInt(raw);
            if (value >= 1 && value <= 100) return value;
        } catch (NumberFormatException ignored) {
            // int 범위를 넘는 긴 숫자도 400으로 돌린다.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size는 1~100이어야 합니다.");
    }

    // 12-3: 종 아이콘이 주기적으로 부른다 — 목록 없이 개수만
    @GetMapping("/api/me/notifications/unread-count")
    public UnreadCountResponse unreadCount(@LoginMember AuthenticatedMember me) {
        return notificationService.unreadCount(requireLogin(me));
    }

    // 12-3: 전부 읽음. POST라 토큰 없음은 인터셉터가 401로 막는다
    @PostMapping("/api/me/notifications/read-all")
    public ReadAllResponse readAll(@LoginMember AuthenticatedMember me) {
        return notificationService.readAll(me);
    }

    private AuthenticatedMember requireLogin(AuthenticatedMember me) {
        if (me == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        return me;
    }

    @PatchMapping("/api/me/notifications/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        notificationService.markRead(me, id);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`LikeMilestoneResponse.java`, `MilestoneCandidateRow.java`, `NotificationResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/LikeMilestoneResponse.java`

```java
package org.example.batch;

import java.util.List;

public record LikeMilestoneResponse(List<Reached> added) {

    // 이번 실행에서 새로 달성한 (글, 단계)
    public record Reached(Long postId, int milestone, long likes) {
    }
}
```

`src/main/java/org/example/batch/MilestoneCandidateRow.java`

```java
package org.example.batch;

public interface MilestoneCandidateRow {

    Long getPostId();

    Long getLikes();
}
```

`src/main/java/org/example/notification/NotificationResponse.java`

```java
package org.example.notification;

import org.example.post.AuthorResponse;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        AuthorResponse actor,
        Long postId,
        Long commentId,
        // 15-5 LIKE_MILESTONE이면 달성한 좋아요 수(10·50·100), 아니면 null. 그때 actor는 null
        Integer milestone,
        boolean read,
        LocalDateTime createdAt
) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`LikeMilestoneService.java`, `TrashPurgeService.java`, `NotificationService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `run`, `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/batch/LikeMilestoneService.java`

```java
package org.example.batch;

import org.example.notification.Notification;
import org.example.notification.NotificationRepository;
import org.example.post.Post;
import org.example.post.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 15-5 좋아요 달성 축하 — 10·50·100개에 처음 닿은 글의 작성자에게 알림을 한 번씩.
// 기록(like_milestone)과 알림을 같은 트랜잭션에 넣는다 — 기록만 되고 알림이 없거나, 알림만 두 번 가는 일이 없다.
@Service
public class LikeMilestoneService {

    public static final int[] MILESTONES = {10, 50, 100};
    private static final Logger log = LoggerFactory.getLogger(LikeMilestoneService.class);

    private final LikeMilestoneRepository likeMilestoneRepository;
    private final PostRepository postRepository;
    private final NotificationRepository notificationRepository;
    private final Clock clock;

    public LikeMilestoneService(LikeMilestoneRepository likeMilestoneRepository, PostRepository postRepository,
                                NotificationRepository notificationRepository, Clock clock) {
        this.likeMilestoneRepository = likeMilestoneRepository;
        this.postRepository = postRepository;
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    @Transactional
    public LikeMilestoneResponse run() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<LikeMilestoneResponse.Reached> added = new ArrayList<>();
        for (MilestoneCandidateRow row : likeMilestoneRepository.findCandidates(MILESTONES[0])) {
            for (int milestone : MILESTONES) {
                if (row.getLikes() < milestone) {
                    break;
                }
                if (likeMilestoneRepository.insertIgnore(row.getPostId(), milestone, row.getLikes(), now) == 1) {
                    Post post = postRepository.getReferenceById(row.getPostId());
                    notificationRepository.save(Notification.likeMilestone(post.getAuthor(), post, milestone, now));
                    added.add(new LikeMilestoneResponse.Reached(row.getPostId(), milestone, row.getLikes()));
                }
            }
        }
        log.info("좋아요 달성 알림 {}건 {}", added.size(), added);
        return new LikeMilestoneResponse(added);
    }
}
```

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
        counts.put("likeMilestones", trashPurgeRepository.deleteLikeMilestones(ids));
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

`src/main/java/org/example/notification/NotificationService.java`

```java
package org.example.notification;

import org.example.auth.AuthenticatedMember;
import org.example.comment.CommentRepository;
import org.example.common.Cursor;
import org.example.member.Member;
import org.example.post.PostAccessPolicy;
import org.example.social.BlockPolicy;
import org.example.member.MemberRepository;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final BlockPolicy blockPolicy;
    private final Clock clock;

    public NotificationService(NotificationRepository notificationRepository, PostRepository postRepository,
                               CommentRepository commentRepository, MemberRepository memberRepository,
                               PostAccessPolicy accessPolicy, BlockPolicy blockPolicy, Clock clock) {
        this.notificationRepository = notificationRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.blockPolicy = blockPolicy;
        this.clock = clock;
    }

    // 9-4: 좋아요·댓글 알림은 원래 저장 트랜잭션 안에서 함께 저장한다.
    // 알림 저장이 실패하면 원래 작업도 롤백된다.
    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyLike(Long postId, Long actorId) {
        create(postId, actorId, Notification.LIKE, null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyComment(Long postId, Long commentId, Long actorId) {
        create(postId, actorId, Notification.COMMENT, commentId);
    }

    // 12-2 — 멘션된 닉네임마다 MENTION 알림. 보내지 않는 경우:
    //  없는 닉네임·활동 중(ACTIVE)이 아닌 회원 / 나 자신 / 글 작성자(이미 COMMENT 알림을 받는다)
    //  / 나와 차단 관계 / 그 글을 볼 수 없는 회원(팔로워 공개 글인데 팔로워가 아님 등 — 2-3 규칙)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyMentions(Long postId, Long commentId, Long actorId, Set<String> nicknames) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null || nicknames.isEmpty()) {
            return;
        }
        // 동일 댓글의 커밋 후 이벤트도 이 행에서 직렬화한다.
        if (commentRepository.findByIdForUpdate(commentId).isEmpty()) {
            return;
        }
        Long postAuthorId = post.getAuthor().getId();
        Member actor = memberRepository.getReferenceById(actorId);
        LocalDateTime now = LocalDateTime.now(clock);
        for (Member target : memberRepository.findByNicknameIn(nicknames)) {
            Long targetId = target.getId();
            if (!nicknames.contains(target.getNickname())
                    || !"ACTIVE".equals(target.getMemberStatus()) || target.getDeletedAt() != null
                    || targetId.equals(actorId) || targetId.equals(postAuthorId)
                    || blockPolicy.isBlockedEitherWay(actorId, targetId)) {
                continue;
            }
            AuthenticatedMember asTarget = new AuthenticatedMember(targetId, target.getNickname(), target.getRole());
            if (!accessPolicy.canView(asTarget, post)) {
                continue;
            }
            if (notificationRepository.existsByMember_IdAndComment_IdAndType(
                    targetId, commentId, Notification.MENTION)) {
                continue;
            }
            notificationRepository.save(new Notification(target, actor, Notification.MENTION, post,
                    commentRepository.getReferenceById(commentId), now));
        }
    }

    private void create(Long postId, Long actorId, String type, Long commentId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return;
        }
        Long receiverId = post.getAuthor().getId();
        if (receiverId.equals(actorId)) {
            return; // 자기 글에 자기가 한 일은 알리지 않는다
        }
        notificationRepository.save(new Notification(
                memberRepository.getReferenceById(receiverId),
                memberRepository.getReferenceById(actorId),
                type,
                post,
                commentId == null ? null : commentRepository.getReferenceById(commentId),
                LocalDateTime.now(clock)));
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(AuthenticatedMember me, boolean unreadOnly, String type, int size, String cursor) {
        Cursor after = Cursor.decode(cursor);
        List<Notification> rows = notificationRepository.findMine(me.id(), unreadOnly,
                after == null ? null : after.at(), after == null ? null : after.id(), type,
                PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<Notification> page = hasNext ? rows.subList(0, size) : rows;
        String nextCursor = null;
        if (hasNext) {
            Notification last = page.get(page.size() - 1);
            nextCursor = new Cursor(last.getCreatedAt(), last.getId()).encode();
        }
        List<NotificationResponse> items = page.stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getType(),
                        n.getActor() == null ? null : new AuthorResponse(n.getActor().getId(), n.getActor().getNickname()),
                        n.getPost().getId(),
                        n.getComment() == null ? null : n.getComment().getId(),
                        n.getMilestone(),
                        n.getReadAt() != null,
                        n.getCreatedAt()))
                .toList();
        return new NotificationListResponse(items, notificationRepository.countByMember_IdAndReadAtIsNull(me.id()),
                nextCursor);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(AuthenticatedMember me) {
        return new UnreadCountResponse(notificationRepository.countByMember_IdAndReadAtIsNull(me.id()));
    }

    // 멱등 — 두 번째 호출은 바꿀 게 없어 0
    @Transactional
    public ReadAllResponse readAll(AuthenticatedMember me) {
        return new ReadAllResponse(notificationRepository.markAllRead(me.id(), LocalDateTime.now(clock)));
    }

    @Transactional
    public void markRead(AuthenticatedMember me, Long notificationId) {
        int updated = notificationRepository.markReadIfUnread(notificationId, me.id(), LocalDateTime.now(clock));
        if (updated == 0 && !notificationRepository.existsByIdAndMember_Id(notificationId, me.id())) {
            throw new NotificationNotFoundException();
        }
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`LikeMilestoneRepository.java`, `TrashPurgeRepository.java`, `NotificationRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/batch/LikeMilestoneRepository.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LikeMilestoneRepository extends Repository<Post, Long> {

    // 좋아요 "행 수"가 가장 낮은 단계(10) 이상인 글 — post.like_count(어긋날 수 있음)는 쓰지 않는다.
    // 아직 기록 안 된 단계가 하나라도 있는 글만 돌려준다(이미 다 받은 글은 매번 다시 보지 않는다).
    @Query(nativeQuery = true, value = """
            SELECT x.postId, x.likes
              FROM (SELECT p.id AS postId, COUNT(*) AS likes
                      FROM post p
                      JOIN post_like l ON l.post_id = p.id
                     WHERE p.deleted_at IS NULL
                     GROUP BY p.id
                    HAVING COUNT(*) >= :lowest) x
             WHERE (SELECT COUNT(*) FROM like_milestone m WHERE m.post_id = x.postId)
                   < (CASE WHEN x.likes >= 100 THEN 3 WHEN x.likes >= 50 THEN 2 ELSE 1 END)
             ORDER BY x.postId
            """)
    List<MilestoneCandidateRow> findCandidates(@Param("lowest") int lowest);

    // UNIQUE(post_id, milestone) — 두 번 돌아도, 동시에 돌아도 한 행. 들어갔을 때(1)만 알림을 만든다
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT IGNORE INTO like_milestone (post_id, milestone, likes, reached_at)
            VALUES (:postId, :milestone, :likes, :now)
            """)
    int insertIgnore(@Param("postId") Long postId, @Param("milestone") int milestone,
                     @Param("likes") long likes, @Param("now") LocalDateTime now);
}
```

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

    // 15-5에서 post를 가리키는 표가 하나 늘었다
    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM like_milestone WHERE post_id IN (:ids)")
    int deleteLikeMilestones(@Param("ids") List<Long> ids);

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

`src/main/java/org/example/notification/NotificationRepository.java`

```java
package org.example.notification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 같은 댓글에서 멘션을 지웠다가 다시 넣어도 이미 보낸 알림은 재발송하지 않는다.
    boolean existsByMember_IdAndComment_IdAndType(Long memberId, Long commentId, String type);

    // 내 알림 최신순 — 보낸 사람(actor)을 함께 읽는다(항목마다 따로 조회하지 않음)
    // 12-3: 키셋 커서 "(createdAt, id) < 커서". 같은 시각에 생긴 알림이 많으므로 id까지 비교해야 겹치거나 빠지지 않는다.
    // cursorAt이 null이면 첫 묶음. size+1개를 읽어 다음 묶음이 있는지 서비스에서 판단한다.
    // 15-5 시스템 알림은 actor가 없다 — JOIN FETCH(내부 조인)면 그 알림이 목록에서 사라지므로 LEFT JOIN FETCH
    @Query("""
            SELECT n FROM Notification n
            LEFT JOIN FETCH n.actor
            WHERE n.member.id = :memberId
              AND (:unreadOnly = false OR n.readAt IS NULL)
              AND (
                   :cursorAt IS NULL
                   OR n.createdAt < :cursorAt
                   OR (n.createdAt = :cursorAt AND n.id < :cursorId)
              )
              AND (:type IS NULL OR n.type = :type)
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> findMine(@Param("memberId") Long memberId,
                                @Param("unreadOnly") boolean unreadOnly,
                                @Param("cursorAt") LocalDateTime cursorAt,
                                @Param("cursorId") Long cursorId,
                                @Param("type") String type,
                                Pageable pageable);

    // 안 읽은 개수 — 목록을 다 읽어 세지 않고 COUNT(ix_notification_member_unread를 탄다)
    long countByMember_IdAndReadAtIsNull(Long memberId);

    // 12-3: 전부 읽음 — 내 안 읽은 알림을 UPDATE 한 문장으로(알림을 하나씩 읽어 고치지 않는다).
    // 벌크 UPDATE는 영속성 컨텍스트를 거치지 않으므로, 같은 트랜잭션에서 이미 읽어 둔 엔티티와 어긋나지 않게 비운다.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.member.id = :memberId AND n.readAt IS NULL")
    int markAllRead(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);

    // 단건 읽음도 조건부 UPDATE로 처리해 모두 읽음과 겹쳐도 첫 read_at을 덮어쓰지 않는다.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.id = :id AND n.member.id = :memberId AND n.readAt IS NULL")
    int markReadIfUnread(@Param("id") Long id, @Param("memberId") Long memberId,
                         @Param("now") LocalDateTime now);

    boolean existsByIdAndMember_Id(Long id, Long memberId);

    // 읽음 처리도 "내 알림"만 찾는다(IDOR 방지)
    Optional<Notification> findByIdAndMember_Id(Long id, Long memberId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Notification.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `likeMilestone`.

`src/main/java/org/example/notification/Notification.java`

```java
package org.example.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.comment.Comment;
import org.example.member.Member;
import org.example.post.Post;

import java.time.LocalDateTime;

// 알림(V4) — member가 받는 사람(글 작성자), actor가 좋아요·댓글을 한 사람
@Entity
@Table(name = "notification")
public class Notification {

    public static final String LIKE = "LIKE";
    public static final String COMMENT = "COMMENT";
    public static final String MENTION = "MENTION";
    public static final String LIKE_MILESTONE = "LIKE_MILESTONE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    // 15-5 시스템 알림(LIKE_MILESTONE)은 보낸 사람이 없다 → null
    @JoinColumn(name = "actor_id")
    private Member actor;

    @Column(nullable = false, length = 20)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    // 15-5 좋아요 몇 개 달성(10·50·100). 다른 종류는 null
    @Column(name = "milestone")
    private Integer milestone;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected Notification() {
        // JPA
    }

    public Notification(Member member, Member actor, String type, Post post, Comment comment, LocalDateTime now) {
        this.member = member;
        this.actor = actor;
        this.type = type;
        this.post = post;
        this.comment = comment;
        this.createdAt = now;
    }

    // 15-5 좋아요 달성 축하 — 받는 사람은 글 작성자, 보낸 사람 없음
    public static Notification likeMilestone(Member member, Post post, int milestone, LocalDateTime now) {
        Notification n = new Notification(member, null, LIKE_MILESTONE, post, null, now);
        n.milestone = milestone;
        return n;
    }

    // 이미 읽었으면 처음 읽은 시각을 유지한다(멱등)
    public void markRead(LocalDateTime now) {
        if (this.readAt == null) {
            this.readAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public Member getActor() {
        return actor;
    }

    public String getType() {
        return type;
    }

    public Post getPost() {
        return post;
    }

    public Comment getComment() {
        return comment;
    }

    public Integer getMilestone() {
        return milestone;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V64__create_like_milestone.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V64__create_like_milestone.sql`

```sql
-- V64 — 좋아요 달성 축하 알림(15-5).
-- like_milestone: 글마다 단계(10·50·100)를 한 번만 기록한다 — UNIQUE(post_id, milestone)가 "한 단계에 한 번"을 지킨다.
-- 좋아요가 9 ↔ 10을 오가도(취소했다 다시 누름) 10 단계 행은 이미 있으니 다시 생기지 않는다.
CREATE TABLE like_milestone (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    post_id    BIGINT   NOT NULL,
    milestone  INT      NOT NULL,
    likes      INT      NOT NULL,
    reached_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_like_milestone (post_id, milestone),
    CONSTRAINT fk_like_milestone_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT ck_like_milestone_level CHECK (milestone IN (10, 50, 100))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '좋아요 달성 기록 — 글·단계마다 한 번';

-- 알림 확장: 시스템이 보내는 알림이라 보낸 사람(actor)이 없다 → NULL 허용. 몇 개 달성인지 milestone에.
-- 종류 CHECK는 고칠 수 없어서 지우고 다시 만든다. 앞 장에서 더한 종류(12-2 MENTION)도 남긴다 —
-- 빠뜨리면 이미 있는 MENTION 행 때문에 제약을 만들 때 실패한다(SHOW CREATE TABLE notification으로 지금 목록부터 본다).
ALTER TABLE notification MODIFY actor_id BIGINT NULL;
ALTER TABLE notification ADD COLUMN milestone INT NULL AFTER comment_id;
ALTER TABLE notification DROP CHECK ck_notification_type;
ALTER TABLE notification
    ADD CONSTRAINT ck_notification_type CHECK (type IN ('LIKE', 'COMMENT', 'MENTION', 'LIKE_MILESTONE'));
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`LikeMilestoneScheduler.java`. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다. 변경된 메서드: `everyTenMinutes`.

`src/main/java/org/example/batch/LikeMilestoneScheduler.java`

```java
package org.example.batch;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 10분마다 — 달성 순간에 바로가 아니라 "조금 늦게라도 한 번" 가면 되는 알림이다
@Component
public class LikeMilestoneScheduler {

    private final LikeMilestoneService likeMilestoneService;

    public LikeMilestoneScheduler(LikeMilestoneService likeMilestoneService) {
        this.likeMilestoneService = likeMilestoneService;
    }

    @Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")
    public void everyTenMinutes() {
        likeMilestoneService.run();
    }
}
```

</details>

<details>
<summary>MyBatis 대안 — 좋아요 달성 기록과 알림</summary>

`post_like` 실제 행 수를 SQL로 집계하고, `INSERT IGNORE`가 1행을 넣었을 때만 같은 트랜잭션에서 `notification`을 추가한다. 시스템 알림의 `actor_id`는 NULL이다.

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

### DTO / 조회 결과

`src/main/java/org/example/batch/MilestoneCandidate.java`

```java
package org.example.batch;

public record MilestoneCandidate(Long postId, Long authorId, Long likes) {
}
```

### MyBatis / Mapper·SQL

`src/main/java/org/example/batch/LikeMilestoneMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface LikeMilestoneMapper {
    List<MilestoneCandidate> findCandidates(@Param("lowest") int lowest);
    int insertIgnore(@Param("postId") Long postId, @Param("milestone") int milestone,
                     @Param("likes") long likes, @Param("now") LocalDateTime now);
    int insertNotification(@Param("authorId") Long authorId, @Param("postId") Long postId,
                           @Param("milestone") int milestone, @Param("now") LocalDateTime now);
}
```

`src/main/resources/mapper/LikeMilestoneMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.LikeMilestoneMapper">
    <resultMap id="candidate" type="org.example.batch.MilestoneCandidate">
        <constructor>
            <idArg column="post_id" javaType="java.lang.Long" />
            <arg column="author_id" javaType="java.lang.Long" />
            <arg column="likes" javaType="java.lang.Long" />
        </constructor>
    </resultMap>
    <select id="findCandidates" resultMap="candidate">
        SELECT x.post_id, x.author_id, x.likes
        FROM (SELECT p.id AS post_id, p.author_id, COUNT(*) AS likes
                FROM post p JOIN post_like l ON l.post_id = p.id
               WHERE p.deleted_at IS NULL
               GROUP BY p.id, p.author_id
              HAVING COUNT(*) &gt;= #{lowest}) x
        WHERE (SELECT COUNT(*) FROM like_milestone m WHERE m.post_id = x.post_id)
              &lt; (CASE WHEN x.likes &gt;= 100 THEN 3 WHEN x.likes &gt;= 50 THEN 2 ELSE 1 END)
        ORDER BY x.post_id
    </select>
    <insert id="insertIgnore">
        INSERT IGNORE INTO like_milestone (post_id, milestone, likes, reached_at)
        VALUES (#{postId}, #{milestone}, #{likes}, #{now})
    </insert>
    <insert id="insertNotification">
        INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, milestone, read_at, created_at)
        VALUES (#{authorId}, NULL, 'LIKE_MILESTONE', #{postId}, NULL, #{milestone}, NULL, #{now})
    </insert>
</mapper>
```

### Service / 달성 배치

`src/main/java/org/example/batch/LikeMilestoneService.java`

```java
package org.example.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 달성 기록이 새로 들어간 단계에만 축하 알림을 같은 트랜잭션으로 저장한다.
@Service
public class LikeMilestoneService {
    public static final int[] MILESTONES = {10, 50, 100};
    private static final Logger log = LoggerFactory.getLogger(LikeMilestoneService.class);
    private final LikeMilestoneMapper mapper;
    private final Clock clock;

    public LikeMilestoneService(LikeMilestoneMapper mapper, Clock clock) {
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public LikeMilestoneResponse run() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<LikeMilestoneResponse.Reached> added = new ArrayList<>();
        for (MilestoneCandidate row : mapper.findCandidates(MILESTONES[0])) {
            for (int milestone : MILESTONES) {
                if (row.likes() < milestone) {
                    break;
                }
                if (mapper.insertIgnore(row.postId(), milestone, row.likes(), now) == 1) {
                    mapper.insertNotification(row.authorId(), row.postId(), milestone, now);
                    added.add(new LikeMilestoneResponse.Reached(row.postId(), milestone, row.likes()));
                }
            }
        }
        log.info("좋아요 달성 알림 {}건 {}", added.size(), added);
        return new LikeMilestoneResponse(added);
    }
}
```

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "M1",
      "title": "첫 실행",
      "method": "POST",
      "path": "/api/admin/jobs/like-milestone/run",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "M2",
      "title": "회원 8이 #140 좋아요(9 → 10)",
      "method": "PUT",
      "path": "/api/posts/140/like",
      "headers": {
        "Authorization": "Bearer tok-p08"
      }
    },
    {
      "id": "M3",
      "title": "실행 — 140 달성",
      "method": "POST",
      "path": "/api/admin/jobs/like-milestone/run",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "M4",
      "title": "좋아요 취소(10 → 9)",
      "method": "DELETE",
      "path": "/api/posts/140/like",
      "headers": {
        "Authorization": "Bearer tok-p08"
      }
    },
    {
      "id": "M5",
      "title": "다시 좋아요(9 → 10)",
      "method": "PUT",
      "path": "/api/posts/140/like",
      "headers": {
        "Authorization": "Bearer tok-p08"
      }
    },
    {
      "id": "M6",
      "title": "실행 — 다시 안 보냄",
      "method": "POST",
      "path": "/api/admin/jobs/like-milestone/run",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "M7",
      "title": "회원 9의 축하 알림",
      "method": "GET",
      "path": "/api/me/notifications?type=LIKE_MILESTONE",
      "headers": {
        "Authorization": "Bearer tok-p09"
      }
    },
    {
      "id": "M8",
      "title": "회원 2의 축하 알림",
      "method": "GET",
      "path": "/api/me/notifications?type=LIKE_MILESTONE",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "M9",
      "title": "회원 9의 전체 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=50",
      "headers": {
        "Authorization": "Bearer tok-p09"
      }
    },
    {
      "id": "M10",
      "title": "없는 종류",
      "method": "GET",
      "path": "/api/me/notifications?type=FOO",
      "headers": {
        "Authorization": "Bearer tok-p09"
      }
    },
    {
      "id": "M11",
      "title": "일반 회원 실행",
      "method": "POST",
      "path": "/api/admin/jobs/like-milestone/run",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "M12",
      "title": "토큰 없이 실행",
      "method": "POST",
      "path": "/api/admin/jobs/like-milestone/run"
    },
    {
      "id": "M13",
      "title": "종류가 빈 값",
      "method": "GET",
      "path": "/api/me/notifications?type=",
      "headers": {
        "Authorization": "Bearer tok-p09"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "M1",
      "expect": {
        "status": 200,
        "anyOf": [
          {
            "json": [
              {
                "path": "$.added[*].postId",
                "equals": [
                  10,
                  18,
                  55,
                  71,
                  84,
                  103,
                  130,
                  131,
                  134,
                  143,
                  145
                ]
              },
              {
                "path": "$.added[*].milestone",
                "equals": [
                  10,
                  10,
                  10,
                  10,
                  10,
                  10,
                  10,
                  10,
                  10,
                  10,
                  10
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
      "all": [
        {
          "request": "M2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.likeCount",
                "equals": 10
              }
            ]
          }
        },
        {
          "request": "M3",
          "expect": {
            "status": 200,
            "anyOf": [
              {
                "json": [
                  {
                    "path": "$.added",
                    "length": 1
                  },
                  {
                    "path": "$.added[0].postId",
                    "equals": 140
                  },
                  {
                    "path": "$.added[0].milestone",
                    "equals": 10
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
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "M4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.likeCount",
                "equals": 9
              }
            ]
          }
        },
        {
          "request": "M5",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.likeCount",
                "equals": 10
              }
            ]
          }
        },
        {
          "request": "M6",
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
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "M7",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 1
              },
              {
                "path": "$.items[0].type",
                "equals": "LIKE_MILESTONE"
              },
              {
                "path": "$.items[0].postId",
                "equals": 140
              },
              {
                "path": "$.items[0].milestone",
                "equals": 10
              },
              {
                "path": "$.items[0].actor",
                "type": "null"
              }
            ]
          }
        },
        {
          "request": "M8",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 2
              },
              {
                "path": "$.items[*].postId",
                "contains": 55
              },
              {
                "path": "$.items[*].postId",
                "contains": 84
              }
            ]
          }
        },
        {
          "request": "M9",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].type",
                "contains": "LIKE_MILESTONE"
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
          "request": "M10",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "type"
              }
            ]
          }
        },
        {
          "request": "M13",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "type"
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
          "request": "M11",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "M12",
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
| C1 | M1 | `200`. 처음이면 `added` = 10·18·55·71·84·103·130·131·134·143·145, 모두 `milestone` 10. 이미 돌렸으면 빈 배열(앱을 켜 두면 10분마다 도는 예약 실행이 먼저 처리했을 수 있다 — 그때 축하는 D1·M8로 확인). (#119는 `like_count`가 10이지만 실제 좋아요는 5개라 없어야 한다) |
| C2 | M2 / M3 | `likeCount` 10 / 처음이면 `added` = `[{140, 10}]`, 이미 했으면 빈 배열 |
| C3 | M4 / M5 / M6 | 9 / 10 / `added` 빈 배열 — 9 ↔ 10을 오가도 축하는 한 번 |
| C4 | M7 / M8 / M9 | 회원 9: 축하 1개(`postId` 140, `milestone` 10, `actor` `null`) / 회원 2: 축하 2개(55·84) / 전체 목록에도 `LIKE_MILESTONE`이 보인다 — 내부 조인에 빠지지 않는다 |
| C5 | M10 / M13 | `400`, `errors`에 `type` — 없는 종류·빈 값 |
| C6 | M11 / M12 | `403` / `401` |
| D1 | `SELECT COUNT(*), COUNT(DISTINCT post_id, milestone) FROM like_milestone` | `12, 12` |
| D2 | `SELECT COUNT(*) FROM notification WHERE type = 'LIKE_MILESTONE' AND member_id = 9` | `1` — 확인을 몇 번 돌려도 |
| D3 | `SELECT COUNT(*) FROM like_milestone m LEFT JOIN notification n ON n.post_id = m.post_id AND n.type = 'LIKE_MILESTONE' AND n.milestone = m.milestone WHERE n.id IS NULL` | `0` — 기록만 있고 알림이 없는 단계가 없다 |
| R1 | 한 번만 | "알림이 이미 있나"를 알림 표에서 찾지 않는다. 달성 기록 표의 `UNIQUE(post_id, milestone)`와 `INSERT IGNORE`의 결과(1/0)로 판단한다 |
| R2 | 한 트랜잭션 | 기록과 알림이 같은 트랜잭션이다. 기록만 커밋되고 알림 저장이 실패하면 그 축하는 영영 안 간다(다음 실행에서 기록이 있다고 건너뛴다) |
| R3 | 실제 행 수 | `post.like_count`가 아니라 `post_like` 행을 센다(#119) |
| R4 | 넓힌 알림 | `actor`가 없는 알림을 위해 컬럼 NULL 허용·`LEFT JOIN FETCH`·응답 `null` 처리를 함께 고쳤다. 9-4의 좋아요·댓글 알림은 그대로 동작한다 |

## 필요한 지식

- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — UNIQUE로 "한 번"
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md)
- [E4 JPA 연관관계](../../lessons/E4-jpa-associations.md) — 내부 조인 fetch와 null 연관
- [9-4. 새 테이블과 API — 알림](../ch9-schema-change/9-4-notifications.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 후보 줄이기</summary>

10개 이상인 글을 매번 전부 보면 글이 많아질수록 느려진다. "닿은 단계 수(100 이상 3, 50 이상 2, 10 이상 1)보다 기록된 단계 수가 적은 글"만 고른다.

```sql
SELECT x.postId, x.likes
  FROM (SELECT p.id AS postId, COUNT(*) AS likes FROM post p JOIN post_like l ON l.post_id = p.id
         WHERE p.deleted_at IS NULL GROUP BY p.id HAVING COUNT(*) >= 10) x
 WHERE (SELECT COUNT(*) FROM like_milestone m WHERE m.post_id = x.postId)
       < (CASE WHEN x.likes >= 100 THEN 3 WHEN x.likes >= 50 THEN 2 ELSE 1 END)
```
</details>

<details>
<summary>힌트 2 — 축하 알림 만들기</summary>

`Notification`에 정적 팩토리 `likeMilestone(member, post, milestone, now)`를 두고 `actor`는 `null`로 둔다. 엔티티의 `@JoinColumn(name = "actor_id", nullable = false)`도 함께 고친다 — 테이블은 NULL을 허용하는데 엔티티는 "필수"라고 적혀 있으면 다음 사람이 헷갈린다.
</details>

## 다음 단계

[15-6. 배치 실행 기록과 다시 돌리기](15-6-job-runs-retry.md)
