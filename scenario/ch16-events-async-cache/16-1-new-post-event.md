# 16-1. 새 글 알림 — 커밋된 뒤에만 보내기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고, 15장과 같다). 이 장의 마이그레이션 번호는 **V70~V79**다.

## 상황

> "팔로우한 사람이 새 글을 쓰면 알림을 주세요. 그런데 지난번에 글 저장은 에러로 실패했는데 알림만 나간 적이 있어요. 없는 글 알림이 뜨면 안 됩니다."

9-4에서 좋아요·댓글 알림을 만들었다. 그때 R1에서 "알림을 서비스 안에서 바로 만들까, 커밋 뒤 이벤트로 뗄까"의 차이를 설명만 했다. 이번에는 그 차이가 실제로 문제가 되는 기능을 만든다. 새 글 하나에 알림이 **팔로워 수만큼** 생기고, 다음 단계(16-2)에서는 여기에 느리고 되돌릴 수 없는 일(푸시 발송)이 붙는다.

순서가 핵심이다. 서비스가 글을 저장하고 알림까지 보냈는데, 그 뒤 같은 트랜잭션의 다른 일이 실패해 글이 롤백되면 "없는 글" 알림만 남는다. 그래서 알림은 **글 트랜잭션이 커밋된 뒤에만** 만든다. 이벤트를 발행해 두고, `@TransactionalEventListener(phase = AFTER_COMMIT)` 리스너가 커밋이 끝난 다음에 처리한다. 롤백되면 리스너는 아예 불리지 않는다.

롤백을 일부러 일으킬 장치도 하나 둔다. 태그에 `rollback-test`가 있으면 **저장하고 이벤트까지 발행한 뒤** 서비스 맨 끝에서 예외를 던진다. 실무라면 이 자리에 포인트 적립이나 다른 테이블 갱신처럼 "저장 뒤에 실패할 수 있는 일"이 온다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "새 글 알림",
  "summary": "새 글 저장이 커밋되면 활동 중인 팔로워에게 NEW_POST 알림. 롤백되면 알림도 없다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "알림",
      "right": "코딩하는고양이 · 🔔 1"
    },
    {
      "type": "list",
      "id": "noti",
      "items": [
        {
          "id": "n-new",
          "title": "스프링요정님이 새 글을 올렸어요",
          "meta": "[채점] 16-1 새 글 알림",
          "badge": "안 읽음"
        }
      ]
    },
    {
      "type": "toast",
      "id": "fail",
      "value": "글 저장에 실패했어요 — 알림도 가지 않습니다",
      "tone": "error"
    }
  ],
  "flows": [
    {
      "name": "새 글 → 팔로워 알림",
      "steps": [
        {
          "kind": "user",
          "text": "회원 4(스프링요정)가 자유게시판에 글을 쓴다"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p04",
            "Content-Type: application/json"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 16-1 새 글 알림\", \"content\": \"...\"}"
        },
        {
          "kind": "server",
          "text": "글 저장 → PostCreatedEvent 발행(아직 알림은 안 만든다) → 트랜잭션 커밋 → 그다음에 리스너가 알림을 만든다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post ...; COMMIT; INSERT INTO notification (member_id, actor_id, type, post_id, created_at) SELECT f.follower_id, 4, 'NEW_POST', 146, ? FROM follow f JOIN member m ON m.id = f.follower_id WHERE f.followee_id = 4 AND m.member_status = 'ACTIVE'",
          "note": "팔로워 17명 중 정지 회원 1명 제외 → 16행"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/146"
          ],
          "body": "{\"id\": 146, ...}"
        },
        {
          "kind": "screen",
          "text": "팔로워 회원 2의 알림 목록 맨 위에 새 글 알림이 생긴다",
          "focus": [
            "n-new",
            "bar"
          ]
        }
      ]
    },
    {
      "name": "저장 뒤 실패 → 롤백",
      "steps": [
        {
          "kind": "user",
          "text": "회원 4가 태그 rollback-test를 달아 글을 쓴다"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p04"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 16-1 롤백 실험\", \"content\": \"...\", \"tags\": [\"rollback-test\"]}"
        },
        {
          "kind": "server",
          "text": "글 저장 → 이벤트 발행 → 맨 끝에서 예외 → 롤백. AFTER_COMMIT 리스너는 불리지 않는다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post ...; ROLLBACK",
          "note": "notification에는 아무것도 쓰지 않는다"
        },
        {
          "kind": "response",
          "status": 400,
          "body": "{\"errors\": [{\"field\": \"tags\", ...}]}"
        },
        {
          "kind": "screen",
          "text": "작성 실패 안내가 뜨고, 팔로워 알림 목록은 그대로다",
          "focus": [
            "fail",
            "noti"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V70** — `db/migration/V70__notification_new_post.sql`

| 할 일 | 내용 |
|---|---|
| 알림 종류 늘리기 | `ck_notification_type`에 `'NEW_POST'`를 더한다. MySQL은 CHECK 제약을 고칠 수 없으니 `ALTER TABLE notification DROP CHECK ck_notification_type;` 뒤 `ADD CONSTRAINT ... CHECK (type IN ('LIKE', 'COMMENT', 'MENTION', 'LIKE_MILESTONE', 'NEW_POST'))` — 12-2 `MENTION`·15-5 `LIKE_MILESTONE`을 한 뒤라면 그 값도 함께 |
| 주의 | 앞 장(12·15장 등)에서 알림 종류를 이미 늘렸다면 **그 값도 목록에 남긴다**. 빠뜨리면 이미 있는 행 때문에 마이그레이션이 실패한다 |

**알림 규칙**

| 경우 | 알림 |
|---|---|
| 새 글 저장이 **커밋됨** | 작성자를 팔로우하는 회원에게 `NEW_POST`(`actor_id` = 작성자, `post_id` = 새 글) |
| 팔로워가 정지(`SUSPENDED`)·탈퇴(`WITHDRAWN`) 회원 | 보내지 않는다(`member_status = 'ACTIVE'`만) |
| 작성자와 어느 방향으로든 차단 관계인 팔로워 | 보내지 않는다. 알림의 글을 열 수 없으므로 `member_block`의 양방향 관계를 제외한다 |
| 작성자 본인, 팔로워가 아닌 회원 | 보내지 않는다 |
| 글 저장이 **롤백됨** | 하나도 만들지 않는다 |
| 11-1의 임시저장(`DRAFT`)을 만들었다면 | 임시저장 때가 아니라 **발행될 때** 보낸다 |
| 15-3의 예약 글(`SCHEDULED`)을 만들었다면 | 예약 발행 배치가 실제로 `PUBLISHED`로 바꾼 뒤 커밋될 때 보낸다. 재실행해도 상태 변경이 0건이면 다시 보내지 않는다 |
| 13-5의 공개 글 복사 | 복사한 글도 새 `PUBLISHED` 글이므로 커밋 뒤에 보낸다 |

**코드 구조**

| 부품 | 하는 일 |
|---|---|
| `PostCreatedEvent(postId, authorId)` | 새 글 이벤트(record) |
| `PostService.create`·`copy`·`publish`, `ScheduledPublishService.publishDue` | 공개 글을 처음 만든 경우와 `DRAFT`·`SCHEDULED`가 실제 `PUBLISHED`로 바뀐 경우에만 `ApplicationEventPublisher.publishEvent(...)`. 저장 트랜잭션 안에서 이벤트를 발행하고 알림은 직접 만들지 않는다 |
| 리스너 | `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` — 커밋이 끝난 뒤 알림 서비스 호출. 실패는 로그만 남기고 삼킨다(글은 이미 커밋됐다) |
| 알림 서비스 | `@Transactional(propagation = REQUIRES_NEW)` — 커밋 뒤라 원래 트랜잭션은 이미 끝났다. 새 트랜잭션을 열어야 실제로 저장된다. 활동 중이며 삭제되지 않은 팔로워 중 작성자와 차단 관계가 없는 수신자만 `INSERT … SELECT`로 고른다 |
| 연습용 실패 장치 | `create` **맨 끝**(저장·이벤트 발행 다음)에서 태그에 `rollback-test`가 있으면 `400` 예외. 맨 앞에서 검사하면 저장 자체가 안 일어나서 "롤백돼도 알림이 없는지"를 확인할 수 없다. 13-4 금칙어는 제목·본문만 보고 태그는 보지 않으므로 이 태그를 먼저 막지 않는다 — 금칙어를 태그까지 넓히거나 `rollback-test`를 금칙어로 넣으면 저장 전에 400이 나서 롤백을 관찰할 수 없다 |

**입력 규칙** — `POST /api/posts`. 1-5에서 만든 규칙 그대로이고, 이 단계는 "잘못된 입력이면 글도 알림도 생기지 않는다"를 함께 확인한다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `boardSlug` | 필수 | 안 됨 | — | 있는 게시판의 slug | — | 없음·빈 값 `400`, 없는 게시판 `404` |
| `title` | 필수 | 안 됨(공백만도 안 됨) | 1~200자 | — | — | `400` |
| `content` | 필수 | 안 됨(공백만도 안 됨) | — | — | — | `400` |
| `tags` | 선택 | `null`이면 태그 없음 | 0~5개, 이름 1~30자 | — | `[]` | `400` |
| `visibility` | 선택 | `null`이면 기본값 | — | `PUBLIC` 또는 `FOLLOWERS` | `PUBLIC` | `400` |
| `tags`에 `rollback-test` | — | — | — | 연습용 실패 장치 | — | 저장·발행 **뒤** `400`, 전부 롤백 |

틀린 필드가 여러 개면 `errors`에 모두 담는다. 어떤 잘못된 입력도 `500`이 되면 안 된다.

API는 새로 만들지 않는다. 9-4의 `GET /api/me/notifications`가 `type: "NEW_POST"`인 항목을 그대로 보여 준다(`commentId`는 `null`).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 글 저장 → PostCreatedEvent 발행(아직 알림은 안 만든다) → 트랜잭션 커밋 → 그다음에 리스너가 알림을 만든다
- 팔로워 17명 중 정지 회원 1명 제외 → 16행
- 글 저장 → 이벤트 발행 → 맨 끝에서 예외 → 롤백. AFTER_COMMIT 리스너는 불리지 않는다
- notification에는 아무것도 쓰지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`NotificationController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

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
                                         @RequestParam(required = false) @Pattern(regexp = "LIKE|COMMENT|MENTION|LIKE_MILESTONE|NEW_POST",
                                                 message = "type은 LIKE, COMMENT, MENTION, LIKE_MILESTONE, NEW_POST 중 하나여야 합니다.") String type,
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
<summary>Service — 처리 순서</summary>

`NotificationService.java`, `PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `notifyNewPost`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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

    // 16-1 새 글 → 팔로워 알림. 리스너가 커밋 뒤에 부르므로 새 트랜잭션이어야 저장된다(좋아요·댓글 알림과는 다른 경계)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int notifyNewPost(Long postId, Long authorId) {
        return notificationRepository.insertNewPostForFollowers(postId, authorId, LocalDateTime.now(clock));
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

`src/main/java/org/example/post/PostService.java`

```java
package org.example.post;

import org.example.auth.AuthenticatedMember;
import org.example.batch.StrictDateTimes;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.board.BoardWriteForbiddenException;
import org.example.image.PostImage;
import org.example.image.PostImageRepository;
import tools.jackson.databind.JsonNode;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.revision.PostRevision;
import org.example.revision.PostRevisionRepository;
import org.example.moderation.ContentFilter;
import org.example.notification.PostCreatedEvent;
import org.example.tag.Tag;
import org.example.tag.TagRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.List;
import java.util.Set;

// 글 만들기·고치기 규칙. HTTP(ResponseEntity, 헤더 등)는 알지 않는다.
@Service
public class PostService {

    private static final String ADMIN_WRITE_ROLE = "ADMIN";
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String DEFAULT_VISIBILITY = "PUBLIC";
    private static final String PUBLISHED = "PUBLISHED";
    private static final String DRAFT = "DRAFT";
    // 11-5 지운 뒤 이 기간 안에만 되살릴 수 있다
    private static final int RESTORE_DAYS = 30;

    // 1-5(PostCreateRequest)와 같은 규칙 — PATCH는 Bean Validation(@Valid)으로 표현할 수 없다
    // (null=그대로, 값이 있을 때만 검사해야 하는데 @NotBlank는 null도 실패로 본다). 숫자만이라도
    // 같은 값을 쓰도록 여기 모아 둔다.
    private static final int TITLE_MAX_LENGTH = 200;
    private static final int TAGS_MAX_COUNT = 5;
    private static final int TAG_NAME_MAX_LENGTH = 30;
    // 16-1 연습용 실패 장치 — 이 태그가 있으면 저장·이벤트 발행까지 다 한 뒤 맨 끝에서 실패시킨다(롤백 관찰용)
    private static final String ROLLBACK_TEST_TAG = "rollback-test";

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;
    private final PostAccessPolicy accessPolicy;
    private final PostImageRepository postImageRepository;
    private final Clock clock;
    private final PostRevisionRepository revisionRepository;
    private final ContentFilter contentFilter;
    private final PostRateLimiter rateLimiter;
    private final ApplicationEventPublisher eventPublisher;

    // 15-3 예약은 30일 안쪽만 받는다
    private static final int MAX_SCHEDULE_DAYS = 30;

    public PostService(PostRepository postRepository, BoardRepository boardRepository,
                        MemberRepository memberRepository, TagRepository tagRepository,
                        PostAccessPolicy accessPolicy, PostImageRepository postImageRepository, Clock clock,
                        PostRevisionRepository revisionRepository, ContentFilter contentFilter,
                        PostRateLimiter rateLimiter, ApplicationEventPublisher eventPublisher) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
        this.accessPolicy = accessPolicy;
        this.postImageRepository = postImageRepository;
        this.clock = clock;
        this.revisionRepository = revisionRepository;
        this.contentFilter = contentFilter;
        this.rateLimiter = rateLimiter;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Post create(Long authorId, PostCreateRequest request) {
        LocalDateTime publishAt = parsePublishAt(request.publishAt());
        Board board = boardRepository.findBySlug(request.boardSlug())
                .orElseThrow(() -> new BoardNotFoundException(request.boardSlug()));
        // 작성자는 요청 본문이 아니라 토큰으로 인증된 회원에서 받는다(authorId 같은 값은 무시한다)
        Member author = memberRepository.getReferenceById(authorId);

        if (ADMIN_WRITE_ROLE.equals(board.getWriteRole()) && !ADMIN_ROLE.equals(author.getRole())) {
            throw new BoardWriteForbiddenException(board.getSlug());
        }

        // 13-4 금칙어 — BLOCK이면 400(걸린 필드 모두), MASK면 가린 값으로 저장
        Map<String, String> filtered = contentFilter.apply(fieldsOf(request.title(), request.content()));

        // 유효하지 않은 태그·이미지는 요청 제한보다 먼저 400으로 응답한다.
        if (request.tags() != null) {
            validateTags(request.tags());
        }
        List<PostImage> images = loadUsableImages(authorId, request.imageIds());

        // 15-3 "지금"은 Clock에서 — 예약 시각 판단과 작성 시각이 같은 시계를 쓴다(practice는 2026-10-05 00:00 고정).
        // 초로 자른다 — DATETIME은 소수 초를 반올림해 저장해서(…:09.6 → :10) 저장된 값이 "미래"가 되고 Retry-After가 61이 된다(13-5 실측)
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);

        // 15-3 예약은 그 자체로 상태다 — 11-1의 status와 함께 오면 어느 쪽을 따를지 모호하니 400.
        // 예약 시각 범위 검사도 도배 방지보다 먼저(400인 요청은 글이 생기지 않으니 셀 것도 없다)
        if (publishAt != null) {
            if (request.status() != null) {
                throw new InvalidPostFieldException("publishAt", "예약 발행(publishAt)과 상태(status)는 함께 보낼 수 없습니다.");
            }
            validatePublishAt(publishAt, now);
        }

        // 13-5 도배 방지 — 입력이 올바른 요청만 센다. 글의 created_at에 찍을 값과 같은 now(같은 Clock)로 센다.
        // practice처럼 시계가 고정이면 1분이 영원히 지나지 않으므로 PostRateLimiter가 검사를 건너뛴다
        rateLimiter.check(authorId, now);

        String visibility = request.visibility() != null ? request.visibility() : DEFAULT_VISIBILITY;
        Post post;
        if (publishAt == null) {
            // 11-1 상태를 안 보내면 지금처럼 바로 발행. DRAFT면 published_at은 비워 둔다(Post 생성자)
            String status = request.status() != null ? request.status() : PUBLISHED;
            post = new Post(board, author, filtered.get("title"), filtered.get("content"), status, visibility, now);
        } else {
            post = Post.scheduled(board, author, filtered.get("title"), filtered.get("content"), visibility,
                    publishAt, now);
        }

        for (Tag tag : resolveTags(request.tags(), now)) {
            post.addTag(tag);
        }

        Post saved = postRepository.save(post);
        attachImages(saved, images);
        // 16-1 알림은 여기서 바로 만들지 않고 이벤트만 남긴다 — 리스너가 커밋 "뒤"에 처리한다.
        // 공개된 글(PUBLISHED)만 — 임시저장(11-1)·예약(15-3) 글은 작성자만 볼 수 있어서 팔로워에게 알리면 안 된다
        if (PUBLISHED.equals(saved.getStatus())) {
            eventPublisher.publishEvent(new PostCreatedEvent(saved.getId(), authorId));
        }
        // 트랜잭션(영속성 컨텍스트) 안에서 지연 로딩 연관을 미리 읽어 둔다.
        // open-in-view: false라서 컨트롤러가 트랜잭션 밖에서 건드리면 LazyInitializationException이 난다.
        saved.getAuthor().getNickname();
        saved.getTags().forEach(Tag::getName);

        // 16-1 저장 "뒤"의 실패를 흉내 낸다(실무라면 포인트 적립·다른 테이블 갱신 같은 후처리 실패).
        // 예외가 나가면 글·태그 저장이 모두 롤백되고, 이미 발행한 이벤트의 AFTER_COMMIT 리스너도 불리지 않는다.
        if (request.tags() != null && request.tags().contains(ROLLBACK_TEST_TAG)) {
            throw new InvalidPostFieldException("tags", "연습용 실패 태그(rollback-test)라 저장을 되돌렸습니다.");
        }
        return saved;
    }

    // 11-2 내가 올렸고 아직 어느 글에도 안 붙은 이미지만 붙일 수 있다. 하나라도 아니면 400(글도 저장 안 됨 — 같은 트랜잭션)
    private List<PostImage> loadUsableImages(Long authorId, JsonNode imageIds) {
        if (imageIds == null || imageIds.isNull()) {
            return List.of();
        }
        if (!imageIds.isArray()) {
            throw new InvalidPostFieldException("imageIds", "이미지 ID는 숫자 배열이어야 합니다.");
        }
        if (imageIds.size() == 0) {
            return List.of();
        }
        List<Long> requestedIds = new java.util.ArrayList<>();
        for (int index = 0; index < imageIds.size(); index++) {
            JsonNode id = imageIds.get(index);
            if (!id.isIntegralNumber() || !id.canConvertToLong()) {
                throw new InvalidPostFieldException("imageIds[" + index + "]", "이미지 ID는 정수여야 합니다.");
            }
            requestedIds.add(id.longValue());
        }
        List<Long> ids = requestedIds.stream().distinct().sorted().toList();
        if (ids.size() > 10) {
            throw new InvalidPostFieldException("imageIds", "이미지는 10개까지입니다.");
        }
        List<PostImage> images = postImageRepository.findAllByIdForUpdate(ids);
        boolean allUsable = images.size() == ids.size() && images.stream().allMatch(image ->
                image.getUploader().getId().equals(authorId) && image.getPost() == null);
        if (!allUsable) {
            throw new InvalidPostFieldException("imageIds", "내가 올렸고 아직 글에 붙지 않은 이미지만 붙일 수 있습니다.");
        }
        return images;
    }

    private void attachImages(Post post, List<PostImage> images) {
        images.forEach(image -> {
            image.attachTo(post);
            post.getImages().add(image);
        });
    }

    @Transactional
    public Post copy(Long sourceId, Long authorId, boolean copyTags, CopyPostRequest request) {
        Post source = postRepository.findById(sourceId).orElseThrow(PostNotFoundException::new);
        if (source.getDeletedAt() != null || !"PUBLISHED".equals(source.getStatus())
                || !"PUBLIC".equals(source.getVisibility())) {
            throw new PostNotFoundException();
        }
        Member author = memberRepository.getReferenceById(authorId);
        if (ADMIN_WRITE_ROLE.equals(source.getBoard().getWriteRole())
                && !ADMIN_ROLE.equals(author.getRole())) {
            throw new BoardWriteForbiddenException(source.getBoard().getSlug());
        }
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
        Map<String, String> copiedFields = contentFilter.apply(fieldsOf(request.title(), source.getContent()));
        rateLimiter.check(authorId, now);
        Post copied = new Post(source.getBoard(), author, copiedFields.get("title"), copiedFields.get("content"),
                "PUBLISHED", "PUBLIC", now);
        if (copyTags) {
            source.getTags().forEach(copied::addTag);
        }
        Post saved = postRepository.save(copied);
        // 복사도 새 공개 글이다. 커밋 뒤에만 팔로워에게 알린다.
        eventPublisher.publishEvent(new PostCreatedEvent(saved.getId(), authorId));
        saved.getBoard().getSlug();
        saved.getAuthor().getNickname();
        saved.getTags().forEach(Tag::getName);
        return saved;
    }

    @Transactional
    public PostDetailResponse replace(Long id, AuthenticatedMember me, PostReplaceRequest request) {
        Post post = postRepository.findByIdForUpdate(id).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(me, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        LocalDateTime now = LocalDateTime.now();
        Set<Tag> tags = new LinkedHashSet<>();
        for (String name : distinctTagNames(request.tags())) {
            tags.add(tagRepository.findByName(name)
                    .orElseGet(() -> tagRepository.save(new Tag(name, now))));
        }
        Map<String, String> filtered = contentFilter.apply(fieldsOf(request.title(), request.content()));
        post.replace(filtered.get("title"), filtered.get("content"), request.visibility(), tags, now);

        return new PostDetailResponse(post.getId(), post.getBoard().getSlug(), post.getTitle(),
                post.getContent(), post.getTags().stream().map(Tag::getName).toList(),
                post.getVisibility(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getViewCount(), post.getLikeCount(), post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(), post.getPublishAt(), post.getPublishedAt(), post.getCreatedAt());
    }

    @Transactional
    public Post patch(Long id, AuthenticatedMember loginMember, PostUpdateRequest request) {
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);

        // 404(볼 수 없음)를 먼저 확인하고, 그다음에 403(작성자 아님)을 확인한다.
        // 반대로 하면 볼 수 없는 글의 존재가 403으로 드러난다.
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostForbiddenException();
        }

        // 11-6 보낸 필드를 먼저 모두 검사하고, 틀린 것을 한꺼번에 400으로 돌려준다(하나라도 틀리면 아무것도 안 바꾼다)
        Map<String, String> errors = new LinkedHashMap<>();
        String title = readText(request.title(), "title", errors);
        String content = readText(request.content(), "content", errors);
        List<String> tags = readTags(request.tags(), errors);
        String visibility = readText(request.visibility(), "visibility", errors);
        if (title != null) collect(errors, () -> validateTitle(title));
        if (content != null) collect(errors, () -> validateContent(content));
        if (tags != null) collect(errors, () -> validateTags(tags));
        if (visibility != null) collect(errors, () -> validateVisibility(visibility));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }

        // 13-4 금칙어 — 형식 검사를 통과한 뒤, 바꾸는 필드만 검사한다(null은 그대로라 건너뛴다).
        // BLOCK이면 400(걸린 필드 모두), MASK면 가린 값으로 바꾼다 — 이력·변경 비교도 가린 값으로 한다
        Map<String, String> filtered = contentFilter.apply(fieldsOf(title, content));
        String newTitle = filtered.get("title");
        String newContent = filtered.get("content");

        LocalDateTime now = LocalDateTime.now();

        // 11-6 바꾸기 전 모습을 떠 둔다 — 실제로 바뀐 필드가 있을 때만 이력으로 남긴다
        String beforeTitle = post.getTitle();
        String beforeContent = post.getContent();
        List<String> beforeTags = sortedTagNames(post.getTags());
        String beforeVisibility = post.getVisibility();
        List<String> changed = new ArrayList<>();

        if (newTitle != null && !newTitle.equals(beforeTitle)) {
            post.changeTitle(newTitle);
            changed.add("title");
        }
        if (newContent != null && !newContent.equals(beforeContent)) {
            post.changeContent(newContent);
            changed.add("content");
        }
        if (tags != null) {
            Set<Tag> newTags = resolveTags(tags, now);
            if (!sortedTagNames(newTags).equals(beforeTags)) {
                post.replaceTags(newTags);
                changed.add("tags");
            }
        }
        if (visibility != null && !visibility.equals(beforeVisibility)) {
            post.changeVisibility(visibility);
            changed.add("visibility");
        }
        // boardSlug는 요청에 와도 무시한다(게시판은 못 옮긴다) — PostUpdateRequest에 아예 없다.

        // 같은 값으로 저장하면(바뀐 게 없으면) 이력도, 수정 시각도 남기지 않는다
        if (!changed.isEmpty()) {
            revisionRepository.save(new PostRevision(post, memberRepository.getReferenceById(loginMember.id()),
                    beforeTitle, beforeContent, beforeTags, beforeVisibility, changed, now));
            post.touchUpdatedAt(now);
        }

        // 트랜잭션 안에서 지연 로딩 연관을 미리 읽어 둔다(컨트롤러가 세션 밖에서 DTO를 만든다).
        // board는 findById로 읽은 프록시라 건드리지 않으면 LazyInitializationException이 난다
        // (create()의 board는 findBySlug로 이미 로딩된 엔티티라 같은 문제가 없었다).
        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

    // 11-1 임시저장 글 발행 — 404(볼 수 없음) → 403(작성자 아님) → 409(임시저장이 아님) 순서
    @Transactional
    public Post publish(Long id, AuthenticatedMember loginMember) {
        // 같은 임시저장 글의 발행 요청을 직렬화해 두 번째 요청은 커밋 뒤 상태를 본다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostForbiddenException();
        }
        if (!DRAFT.equals(post.getStatus())) {
            throw new PostNotDraftException();
        }
        // 금칙어가 새로 추가된 뒤 오래된 임시저장을 발행하는 우회도 막는다.
        Map<String, String> filtered = contentFilter.apply(fieldsOf(post.getTitle(), post.getContent()));
        post.changeTitle(filtered.get("title"));
        post.changeContent(filtered.get("content"));
        post.publish(LocalDateTime.now());
        // 임시저장은 여기서 처음 공개된다. 이벤트는 커밋 뒤에 처리한다.
        eventPublisher.publishEvent(new PostCreatedEvent(post.getId(), loginMember.id()));

        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

    // 11-1 내 임시저장 글 — 최근에 고친 것부터. 지운 글은 빠진다
    @Transactional(readOnly = true)
    public MyDraftsResponse myDrafts(AuthenticatedMember loginMember) {
        List<MyDraftItemResponse> items = postRepository.findMyDrafts(loginMember.id()).stream()
                .map(p -> new MyDraftItemResponse(p.getId(), p.getBoard().getSlug(), p.getTitle(), p.getUpdatedAt()))
                .toList();
        return new MyDraftsResponse(items);
    }

    // 11-5 휴지통 — 내가 지운 내 글 중 아직 복구할 수 있는 것(지운 지 30일 안), 최근에 지운 순
    @Transactional(readOnly = true)
    public MyTrashResponse myTrash(AuthenticatedMember loginMember) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<MyTrashItemResponse> items = postRepository.findMyTrash(loginMember.id(), now.minusDays(RESTORE_DAYS)).stream()
                .map(p -> new MyTrashItemResponse(p.getId(), p.getBoard().getSlug(), p.getTitle(), p.getDeletedAt(),
                        p.getDeletedAt().plusDays(RESTORE_DAYS)))
                .toList();
        return new MyTrashResponse(items);
    }

    // 11-5 복구 — 404(없음·내 글 아님) → 409(지운 글 아님) → 403(내가 지운 게 아님) → 410(30일 지남) 순서.
    // 지운 글은 2-3 규칙(canView)으로는 아무도 못 보므로, 여기서는 "작성자인가"를 직접 확인한다.
    @Transactional
    public Post restore(Long id, AuthenticatedMember loginMember) {
        // 삭제·중복 복구와 경합할 때 판정 이후의 상태 변경까지 직렬화한다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostNotFoundException();
        }
        if (post.getDeletedAt() == null) {
            throw new PostNotDeletedException();
        }
        if (!loginMember.id().equals(post.getDeletedBy())) {
            throw new PostRestoreForbiddenException();
        }
        if (post.getDeletedAt().plusDays(RESTORE_DAYS).isBefore(LocalDateTime.now(clock))) {
            throw new PostRestoreExpiredException();
        }
        // 삭제된 동안 금칙어가 추가됐으면 복구 전에 다시 검사한다.
        Map<String, String> filtered = contentFilter.apply(fieldsOf(post.getTitle(), post.getContent()));
        post.changeTitle(filtered.get("title"));
        post.changeContent(filtered.get("content"));
        post.restore();

        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

    @Transactional
    public void delete(Long id, AuthenticatedMember loginMember) {
        // 발행과 삭제가 같은 글을 동시에 갱신하지 않도록 행을 잠근다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);

        // 404(볼 수 없음·이미 삭제됨) → 403(작성자도 운영자도 아님) 순서
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        boolean isAuthor = post.getAuthor().getId().equals(loginMember.id());
        boolean isAdmin = ADMIN_ROLE.equals(loginMember.role());
        if (!isAuthor && !isAdmin) {
            throw new PostForbiddenException();
        }

        post.delete(LocalDateTime.now(clock), loginMember.id());
    }

    private static String readText(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            errors.put(field, field + "는 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }

    private static List<String> readTags(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isArray()) {
            errors.put("tags", "태그는 문자열 배열이어야 합니다.");
            return null;
        }
        List<String> tags = new java.util.ArrayList<>();
        for (JsonNode tag : value) {
            if (!tag.isTextual()) {
                errors.put("tags", "태그는 문자열 배열이어야 합니다.");
                return null;
            }
            tags.add(tag.asText());
        }
        return tags;
    }

    private static void collect(Map<String, String> errors, Runnable validation) {
        try {
            validation.run();
        } catch (InvalidPostFieldException e) {
            errors.put(e.getField(), e.getMessage());
        }
    }

    private static List<String> sortedTagNames(Set<Tag> tags) {
        return tags.stream().map(Tag::getName).sorted().toList();
    }

    private static Map<String, String> fieldsOf(String title, String content) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("title", title);
        fields.put("content", content);
        return fields;
    }

    private static LocalDateTime parsePublishAt(JsonNode raw) {
        if (raw == null || raw.isNull()) {
            return null;
        }
        if (!raw.isTextual()) {
            throw new InvalidPostFieldException("publishAt", "예약 시각은 yyyy-MM-ddTHH:mm:ss 문자열이어야 합니다.");
        }
        try {
            return StrictDateTimes.parse(raw.asText());
        } catch (IllegalArgumentException ex) {
            throw new InvalidPostFieldException("publishAt", ex.getMessage());
        }
    }

    // 지금보다 "뒤"(같은 시각은 안 됨) ~ 지금 + 30일까지(그 시각 자체는 됨)
    private void validatePublishAt(LocalDateTime publishAt, LocalDateTime now) {
        if (!publishAt.isAfter(now)) {
            throw new InvalidPostFieldException("publishAt", "예약 시각은 지금(" + now + ")보다 뒤여야 합니다.");
        }
        if (publishAt.isAfter(now.plusDays(MAX_SCHEDULE_DAYS))) {
            throw new InvalidPostFieldException("publishAt", "예약은 " + MAX_SCHEDULE_DAYS + "일 안쪽(" + now.plusDays(MAX_SCHEDULE_DAYS) + "까지)만 됩니다.");
        }
    }

    private void validateTitle(String title) {
        if (title.isBlank()) {
            throw new InvalidPostFieldException("title", "제목을 입력해 주세요.");
        }
        if (title.length() > TITLE_MAX_LENGTH) {
            throw new InvalidPostFieldException("title", "제목은 " + TITLE_MAX_LENGTH + "자 이하여야 합니다.");
        }
    }

    private void validateContent(String content) {
        if (content.isBlank()) {
            throw new InvalidPostFieldException("content", "본문을 입력해 주세요.");
        }
    }

    private void validateTags(List<String> tags) {
        if (tags.size() > TAGS_MAX_COUNT) {
            throw new InvalidPostFieldException("tags", "태그는 " + TAGS_MAX_COUNT + "개까지입니다.");
        }
        for (String tag : tags) {
            if (tag == null || tag.isBlank() || tag.length() > TAG_NAME_MAX_LENGTH) {
                throw new InvalidPostFieldException("tags", "태그 이름은 1~" + TAG_NAME_MAX_LENGTH + "자여야 합니다.");
            }
        }
    }

    private void validateVisibility(String visibility) {
        if (!"PUBLIC".equals(visibility) && !"FOLLOWERS".equals(visibility)) {
            throw new InvalidPostFieldException("visibility", "공개 범위는 PUBLIC 또는 FOLLOWERS여야 합니다.");
        }
    }

    // 이름으로 찾고 없으면 만든다. 요청 안의 중복은 제거한다(1-4/1-5와 같은 규칙, 3-1에서도 재사용).
    private Set<Tag> resolveTags(List<String> tagNames, LocalDateTime now) {
        Set<Tag> tags = new LinkedHashSet<>();
        for (String tagName : distinctTagNames(tagNames)) {
            Tag tag = tagRepository.findByName(tagName)
                    .orElseGet(() -> tagRepository.save(new Tag(tagName, now)));
            tags.add(tag);
        }
        return tags;
    }

    private List<String> distinctTagNames(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>(tags);
        return List.copyOf(seen);
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`NotificationRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

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

    // 16-1 새 글 알림 — 팔로워(활동 중인 회원만)마다 save()를 부르지 않고 INSERT … SELECT 한 문장으로 만든다
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO notification (member_id, actor_id, type, post_id, created_at)
            SELECT f.follower_id, :authorId, 'NEW_POST', :postId, :now
              FROM follow f
              JOIN member m ON m.id = f.follower_id
             WHERE f.followee_id = :authorId
               AND m.member_status = 'ACTIVE'
               AND m.deleted_at IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM member_block b
                    WHERE (b.blocker_id = :authorId AND b.blocked_id = f.follower_id)
                       OR (b.blocked_id = :authorId AND b.blocker_id = f.follower_id)
               )
            """)
    int insertNewPostForFollowers(@Param("postId") Long postId,
                                  @Param("authorId") Long authorId,
                                  @Param("now") LocalDateTime now);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Notification.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

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
    public static final String NEW_POST = "NEW_POST"; // 16-1 팔로우한 회원의 새 글

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

`V70__notification_new_post.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V70__notification_new_post.sql`

```sql
-- V70 — 16-1 새 글 알림(NEW_POST). 알림 종류 CHECK 제약에 값을 하나 더한다.
-- MySQL은 CHECK를 고칠 수 없어서 지우고 다시 만든다. 앞 장에서 늘린 값(12-2 MENTION, 15-5 LIKE_MILESTONE)도 남긴다 —
-- 빠뜨리면 이미 있는 그 종류의 행 때문에 제약을 만들 때 실패한다(SHOW CREATE TABLE notification으로 지금 목록부터 본다).
ALTER TABLE notification DROP CHECK ck_notification_type;
ALTER TABLE notification
    ADD CONSTRAINT ck_notification_type CHECK (type IN ('LIKE', 'COMMENT', 'MENTION', 'LIKE_MILESTONE', 'NEW_POST'));
```

</details>

<details>
<summary>설정·보조 코드</summary>

`NotificationEventListener.java`, `PostCreatedEvent.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `onPostCreated`.

`src/main/java/org/example/notification/NotificationEventListener.java`

```java
package org.example.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// 9-4의 좋아요·댓글 알림은 원래 트랜잭션에서 처리한다. 저장 실패는 원래 작업을 롤백시킨다.
// 멘션·새 글 알림은 각 시나리오의 커밋 후 처리 규칙을 따른다.
@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @EventListener
    public void onPostLiked(PostLikedEvent event) {
        notificationService.notifyLike(event.postId(), event.actorId());
    }

    // 16-1 새 글 → 팔로워 알림. 글 트랜잭션이 롤백되면 이 메서드는 아예 불리지 않는다
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPostCreated(PostCreatedEvent event) {
        try {
            int count = notificationService.notifyNewPost(event.postId(), event.authorId());
            log.info("새 글 알림 {}건 postId={}", count, event.postId());
        } catch (RuntimeException e) {
            log.warn("새 글 알림 생성 실패 postId={}", event.postId(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCommentMentioned(CommentMentionedEvent event) {
        try {
            notificationService.notifyMentions(event.postId(), event.commentId(), event.actorId(), event.nicknames());
        } catch (RuntimeException e) {
            log.warn("멘션 알림 생성 실패 postId={} commentId={}", event.postId(), event.commentId(), e);
        }
    }

    @EventListener
    public void onCommentCreated(CommentCreatedEvent event) {
        notificationService.notifyComment(event.postId(), event.commentId(), event.actorId());
    }
}
```

`src/main/java/org/example/notification/PostCreatedEvent.java`

```java
package org.example.notification;

// 새 글이 저장됐을 때 발행한다. 알림은 이 이벤트를 받은 쪽이 글 트랜잭션이 "커밋된 뒤" 만든다(16-1)
public record PostCreatedEvent(Long postId, Long authorId) {
}
```

</details>

<details>
<summary>Service — 예약 발행 뒤 새 글 이벤트 / ScheduledPublishService.java</summary>

`src/main/java/org/example/batch/ScheduledPublishService.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.example.notification.PostCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 15-3 예약 발행 — 기준 시각(at)이 예약 시각 이상이 된 SCHEDULED 글을 PUBLISHED로 바꾼다.
// 1분마다 도는 예약 실행과 운영자 수동 실행이 같은 메서드를 쓴다.
@Service
public class ScheduledPublishService {

    // 한 번에 너무 많이 잡지 않는다 — 남은 건 다음 분에 이어서
    private static final int BATCH_LIMIT = 500;
    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishService.class);

    private final ScheduledPublishRepository scheduledPublishRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public ScheduledPublishService(ScheduledPublishRepository scheduledPublishRepository, ApplicationEventPublisher eventPublisher, Clock clock) {
        this.scheduledPublishRepository = scheduledPublishRepository;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional
    public ScheduledPublishResponse publishDue(LocalDateTime at) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<PublishedPost> published = new ArrayList<>();
        for (Post post : scheduledPublishRepository.findDue(at, PageRequest.of(0, BATCH_LIMIT))) {
            if (scheduledPublishRepository.publishIfDue(post.getId(), at, now) == 1) {
                published.add(new PublishedPost(post.getId(), post.getTitle(), post.getPublishAt()));
                // 실제로 상태를 바꾼 실행만 알린다. 트랜잭션이 롤백되면 AFTER_COMMIT 리스너는 실행되지 않는다.
                eventPublisher.publishEvent(new PostCreatedEvent(post.getId(), post.getAuthor().getId()));
            }
        }
        // 매분 도는 배치라 0건이면 조용히(디버그), 발행했을 때만 INFO로 건수와 id를 남긴다
        if (published.isEmpty()) {
            log.debug("예약 발행 at={} 0건", at);
        } else {
            log.info("예약 발행 at={} {}건 ids={}", at, published.size(), published.stream().map(PublishedPost::postId).toList());
        }
        return new ScheduledPublishResponse(at, published);
    }
}
```

</details>

## MyBatis 대체 구현

기본 JPA 스냅숏에서 새 글 알림의 한 문장 저장만 MyBatis로 바꾼다. 기존 좋아요·댓글·멘션 알림 조회와 읽음 처리는 선행 JPA 코드를 유지한다. `AFTER_COMMIT` 리스너와 `REQUIRES_NEW` 경계는 두 방식에서 같다. 아래 파일을 기본 스냅숏에 적용한다.

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
<summary>Repository — 새 글 INSERT는 Mapper로 이동 — NotificationRepository.java</summary>

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
<summary>Service — 커밋 후 새 트랜잭션 — NotificationService.java</summary>

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
    private final NotificationWriteMapper notificationWriteMapper;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final BlockPolicy blockPolicy;
    private final Clock clock;

    public NotificationService(NotificationRepository notificationRepository, NotificationWriteMapper notificationWriteMapper, PostRepository postRepository,
                               CommentRepository commentRepository, MemberRepository memberRepository,
                               PostAccessPolicy accessPolicy, BlockPolicy blockPolicy, Clock clock) {
        this.notificationRepository = notificationRepository;
        this.notificationWriteMapper = notificationWriteMapper;
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

    // 16-1 새 글 → 팔로워 알림. 리스너가 커밋 뒤에 부르므로 새 트랜잭션이어야 저장된다(좋아요·댓글 알림과는 다른 경계)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int notifyNewPost(Long postId, Long authorId) {
        return notificationWriteMapper.insertNewPostForFollowers(postId, authorId, LocalDateTime.now(clock));
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
<summary>Mapper — 새 글 알림 SQL 연결 — NotificationWriteMapper.java</summary>

`src/main/java/org/example/notification/NotificationWriteMapper.java`

```java
package org.example.notification;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface NotificationWriteMapper {
    int insertNewPostForFollowers(@Param("postId") Long postId,
                                  @Param("authorId") Long authorId,
                                  @Param("now") LocalDateTime now);
}
```

</details>

<details>
<summary>Mapper XML — 접근 가능한 활성 팔로워 INSERT SELECT — NotificationWriteMapper.xml</summary>

`src/main/resources/mapper/NotificationWriteMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.notification.NotificationWriteMapper">
    <insert id="insertNewPostForFollowers">
        INSERT INTO notification (member_id, actor_id, type, post_id, created_at)
        SELECT f.follower_id, #{authorId}, 'NEW_POST', #{postId}, #{now}
          FROM follow f
          JOIN member m ON m.id = f.follower_id
         WHERE f.followee_id = #{authorId}
           AND m.member_status = 'ACTIVE'
           AND m.deleted_at IS NULL
           AND NOT EXISTS (
               SELECT 1 FROM member_block b
                WHERE (b.blocker_id = #{authorId} AND b.blocked_id = f.follower_id)
                   OR (b.blocked_id = #{authorId} AND b.blocker_id = f.follower_id)
           )
    </insert>
</mapper>
```

</details>

## 직접 확인

학습용 DB의 회원 4(스프링요정, `tok-p04`)는 팔로워가 17명이다. 그중 회원 28은 정지 회원이다. 회원 2(`tok-p02`)는 팔로워고 회원 6(`tok-p06`)은 팔로워가 아니다.

API 요청 P/F/O/X1/R은 실행 패널에서 보낸다. 롤백 확인은 SQL 카운트를 먼저 기록하고 실행 패널에서 R 요청을 단독 실행한 다음 카운트를 다시 확인한다. 나머지 알림 흐름은 패널의 P/F/O 요청으로 확인한다. API 주소는 페이지 상단 공통 입력을 사용하고 Postman 설정은 접어서 확인할 수 있다.

```bash
sql() { docker compose exec -T mysql mysql -ucommunity -pcommunity practice -N -e "$1" 2>/dev/null; }
sql "SELECT COUNT(*) FROM notification WHERE type = 'NEW_POST' AND actor_id = 4"  # 롤백 실험 전
# 실행 패널에서 지정한 요청을 단독 실행한 뒤 다시 실행한다.
sql "SELECT COUNT(*) FROM notification WHERE type = 'NEW_POST' AND actor_id = 4"  # 롤백 실험 후 — 같아야 한다
```

앱 로그에서 순서도 본다. `INSERT INTO post` → (커밋) → `INSERT INTO notification ... SELECT` 순서로 찍힌다. 롤백 실험(R)에서는 `INSERT INTO post`만 있고 알림 INSERT가 없다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 실행할 때마다 회원 4의 글이 하나 늘어난다.

```check
{
  "requests": [
    {
      "id": "P",
      "title": "회원 4가 새 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-1 새 글 알림",
        "content": "팔로워에게 알림이 가는지 본다",
        "tags": [
          "java",
          "spring",
          "jpa",
          "mysql",
          "test"
        ]
      }
    },
    {
      "id": "F",
      "title": "팔로워(회원 2)의 최신 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "O",
      "title": "팔로워 아님(회원 6)의 최신 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=5",
      "headers": {
        "Authorization": "Bearer tok-p06"
      }
    },
    {
      "id": "A",
      "title": "작성자 본인(회원 4)의 최신 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=5",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "X1",
      "title": "잘못된 입력 — 공백 제목·없는 공개 범위",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "title": "   ",
        "content": "잘못된 입력",
        "visibility": "SECRET"
      }
    },
    {
      "id": "X2",
      "title": "잘못된 입력 — 제목 없음·태그 6개",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "content": "잘못된 입력",
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ]
      }
    },
    {
      "id": "X3",
      "title": "없는 게시판",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "no-such-board",
        "title": "[채점] 16-1 없는 게시판",
        "content": "잘못된 입력"
      }
    },
    {
      "id": "R",
      "title": "저장 뒤 실패하는 글(rollback-test)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-1 롤백 실험",
        "content": "저장 뒤 실패",
        "tags": [
          "rollback-test"
        ]
      }
    },
    {
      "id": "DR",
      "title": "임시저장 글(11-1) — 공개 전이라 알림 없음",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-1 임시저장",
        "content": "아직 공개 전",
        "status": "DRAFT"
      }
    },
    {
      "id": "F2",
      "title": "롤백 뒤 팔로워의 최신 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "DRPUB",
      "title": "임시저장을 처음 발행",
      "method": "POST",
      "path": "/api/posts/{{DR.body.id}}/publish",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "FD",
      "title": "발행된 임시저장 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "SC",
      "title": "예약 글 작성",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-1 예약 발행 알림",
        "content": "발행 전에는 알리지 않습니다",
        "tags": [],
        "publishAt": "2026-10-06T08:00:00"
      }
    },
    {
      "id": "SRUN",
      "title": "예약 시각 뒤 배치 실행",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-06T09:00:00",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "FS",
      "title": "예약 발행 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "CP",
      "title": "공개 글 복사",
      "method": "POST",
      "path": "/api/posts/{{P.body.id}}/copies",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "title": "[채점] 16-1 복사 알림"
      }
    },
    {
      "id": "FC",
      "title": "복사한 글의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "P",
      "expect": {
        "status": 201
      }
    },
    {
      "id": "C2",
      "request": "F",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[0].type",
            "equals": "NEW_POST"
          },
          {
            "path": "$.items[0].postId",
            "equals": "{{P.body.id}}"
          },
          {
            "path": "$.items[0].actor.id",
            "equals": 4
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "O",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "notContains": "{{P.body.id}}"
              }
            ]
          }
        },
        {
          "request": "A",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "notContains": "{{P.body.id}}"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "request": "R",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "X1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "visibility"
              }
            ]
          }
        },
        {
          "request": "X2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "X3",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "DR",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.status",
                "equals": "DRAFT"
              }
            ]
          }
        },
        {
          "request": "F2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].postId",
                "equals": "{{P.body.id}}"
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
          "request": "DRPUB",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "FD",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].postId",
                "equals": "{{DR.body.id}}"
              },
              {
                "path": "$.items[0].type",
                "equals": "NEW_POST"
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
          "request": "SC",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.status",
                "equals": "SCHEDULED"
              }
            ]
          }
        },
        {
          "request": "SRUN",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "FS",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].postId",
                "equals": "{{SC.body.id}}"
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
          "request": "CP",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "FC",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].postId",
                "equals": "{{CP.body.id}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

16-2를 마친 뒤에 이 칸을 다시 돌리면 C2·C5가 드물게 실패할 수 있다. 알림이 비동기로 바뀌어 응답보다 몇 ms 늦게 다른 스레드에서 생기기 때문이다(16-2에서 다룬다). 정답 구현으로 다시 돌렸을 때는 통과했다.

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | P 뒤 `SELECT COUNT(*) FROM notification WHERE type = 'NEW_POST' AND post_id = <P의 id>` | `16` — 팔로워 17명 중 정지 회원 1명 제외 |
| D2 | `SELECT COUNT(*) FROM notification WHERE post_id = <P의 id> AND member_id IN (4, 28)` | `0` — 작성자 본인·정지 회원에게는 없다 |
| D3 | R **전** `SELECT COUNT(*) FROM notification WHERE type = 'NEW_POST' AND actor_id = 4` | 값 n을 기억 |
| D4 | R 뒤 같은 쿼리 | **n 그대로** — 롤백된 글의 알림은 0건 |
| D5 | `SELECT COUNT(*) FROM post WHERE title = '[채점] 16-1 롤백 실험' AND id > <P의 id>` | `0` — 글도 남지 않았다(구현 전에 실행 칸을 돌렸다면 그때 저장된 글이 P보다 앞 id로 남아 있을 수 있어 P 뒤만 센다) |
| D6 | `SELECT version, success FROM flyway_schema_history WHERE version = '70'` | `70`, `1` |
| D7 | DR 발행 전·후 `SELECT COUNT(*) FROM notification WHERE type = 'NEW_POST' AND post_id = <DR의 id>` | `0 → 16`. 반복 발행은 상태 오류이며 알림이 늘지 않는다 |
| D8 | SC 예약 배치 전·후 같은 쿼리 | `0 → 16`. 배치 재실행 후에도 `16` |
| D9 | CP 복사 뒤 같은 쿼리 | `16`. 차단 관계가 있으면 차단된 팔로워 수만큼 적고, 어느 방향의 차단도 알림을 만들지 않는다 |
| C1 | P | `201` — 태그 5개(상한 바로 안쪽)도 통과 |
| C2 | F | `200`, 첫 항목 `type`=`NEW_POST`·`postId`=P의 id·`actor.id`=4 |
| C3 | O / A | 둘 다 P의 id가 담긴 알림이 없다 — 팔로워가 아닌 회원·작성자 본인 |
| C4 | R | `400` |
| C5 | DR / F2 | 임시저장 글(11-1) `201` `DRAFT` / 첫 항목이 여전히 P의 알림이다 — 잘못된 입력(X1~X3)·롤백된 글(R)·아직 공개 전인 임시저장 글(DR)이 알림을 남기지 않았다 |
| C6 | X1 / X2 / X3 | `400`(틀린 필드 `title`·`visibility` 모두) / `400`(`title`·`tags` 모두) / `404` — 어느 것도 `500`이 아니다 |
| C7 | DRPUB / FD | 임시저장 글을 발행하면 `200`, 회원 2의 최신 알림이 DR의 `NEW_POST` |
| C8 | SC / SRUN / FS | 예약 글 생성 `201 SCHEDULED`, 배치 발행 `200`, 회원 2의 최신 알림이 SC의 `NEW_POST` |
| C9 | CP / FC | 공개 글 복사 `201`, 회원 2의 최신 알림이 CP의 `NEW_POST` |
| R1 | 순서 | 알림을 `PostService.create` 안에서 직접 만들지 않는다. 이벤트를 발행하고 `AFTER_COMMIT` 리스너가 처리한다. "같은 트랜잭션에서 바로 만들면 롤백 때 같이 지워지는데 왜 굳이 떼어 내나?"에 답할 수 있다 — 16-2의 푸시처럼 DB 밖으로 나간 일은 롤백으로 되돌릴 수 없다 |
| R2 | 새 트랜잭션 | 리스너가 부르는 알림 저장이 `REQUIRES_NEW`다. 그냥 `@Transactional`(REQUIRED)이면 왜 저장이 안 되는지 설명할 수 있다 |
| R3 | 실패 격리 | 리스너가 알림 실패를 잡아 로그만 남긴다. 글은 이미 커밋됐으므로 알림 실패로 응답을 500으로 만들지 않는다 |
| R4 | 한 문장 | 팔로워 수만큼 `save()`를 반복하지 않는다. `INSERT … SELECT` 한 문장(또는 `saveAll` 묶음)으로 만든다 |
| R5 | 모든 발행 경로 | 바로 공개한 글·임시저장 후 발행·예약 배치 발행·공개 글 복사에서 각각 한 번만 이벤트를 발행한다. 차단·탈퇴한 수신자는 제외한다 |

## 필요한 지식

- [S08 — 이벤트와 커밋의 관계](../../docs/knowledge/S08-transactions.md#이벤트와-커밋의-관계)
- [S08 — 예제 3 커밋 후 알림과 그 한계](../../docs/knowledge/S08-transactions.md#예제-3--커밋-후-알림과-그-한계)
- [S08 — 전파 7종](../../docs/knowledge/S08-transactions.md#전파-7종)
- [G3 첫 트랜잭션](../../lessons/G3-first-transaction.md)
- [9-4. 새 테이블과 API — 알림](../ch9-schema-change/9-4-notifications.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 리스너 모양</summary>

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onPostCreated(PostCreatedEvent event) {
    try {
        notificationService.notifyNewPost(event.postId(), event.authorId());
    } catch (RuntimeException e) {
        log.warn("새 글 알림 생성 실패 postId={}", event.postId(), e);
    }
}
```

9-4 정답에 좋아요·댓글 리스너가 이미 이 모양으로 있다면 같은 클래스에 메서드 하나를 더하면 된다.
</details>

<details>
<summary>힌트 2 — 팔로워 알림을 한 문장으로</summary>

```sql
INSERT INTO notification (member_id, actor_id, type, post_id, created_at)
SELECT f.follower_id, :authorId, 'NEW_POST', :postId, :now
  FROM follow f
  JOIN member m ON m.id = f.follower_id
 WHERE f.followee_id = :authorId
   AND m.member_status = 'ACTIVE'
```

리포지토리에 `@Modifying @Query(nativeQuery = true, value = "...")`로 두고 `int`(넣은 행 수)를 돌려받는다.
</details>

<details>
<summary>힌트 3 — 리스너가 안 불린다</summary>

`@TransactionalEventListener`는 **트랜잭션 안에서 발행된** 이벤트만 받는다. `publishEvent`를 `@Transactional` 메서드 밖(컨트롤러 등)에서 부르면 리스너가 조용히 건너뛴다. `create`의 `save()` 바로 뒤에서 발행한다.
</details>

## 다음 단계

[16-2. 알림을 비동기로 — 느린 발송이 글쓰기를 막지 않게](16-2-async-notification.md)
