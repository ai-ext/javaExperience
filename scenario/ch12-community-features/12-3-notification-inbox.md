# 12-3. 알림함 — 안 읽은 수·전부 읽음·커서

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "알림이 쌓이니까 세 가지가 아쉬워요. 종 아이콘 숫자를 30초마다 갱신하는데 매번 알림 목록을 통째로 받아요. '모두 읽음' 버튼이 없어서 하나씩 눌러야 하고요. 알림함을 아래로 내리면 이어서 더 보고 싶어요."

9-4에서 만든 알림 API(`GET /api/me/notifications`, `PATCH …/{id}/read`)를 키운다. 새로 만드는 테이블은 없다. 세 가지를 붙인다.

- **안 읽은 수만** 주는 가벼운 API. 9-4 목록에도 `unreadCount`가 있지만, 숫자 하나 때문에 목록 쿼리까지 돌릴 필요는 없다.
- **전부 읽음**. 알림을 하나씩 읽어 고치지 않고 `UPDATE` 한 문장으로 끝낸다.
- 목록에 **커서**를 붙인다(4-3·6-3과 같은 방식). 학습용 DB에서는 이 단계에 함정이 하나 있다. practice 프로파일은 시계를 `2026-10-05 00:00`으로 고정하므로(8-2), API로 만든 알림은 **모두 같은 시각**을 가진다. 커서를 시각만으로 비교하면 다음 묶음이 통째로 사라진다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "알림함",
  "summary": "종 숫자는 개수 API로, 목록은 커서로 이어 받고, [모두 읽음]은 UPDATE 한 번.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "알림", "right": "스프링요정 · 🔔 3" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "read-all", "label": "모두 읽음", "variant": "secondary" }] },
    {
      "type": "list",
      "id": "noti",
      "items": [
        { "id": "n-7", "title": "리액트에서왔어요님이 좋아요를 눌렀어요", "meta": "방금 전", "badge": "안 읽음" },
        { "id": "n-6", "title": "밤샘개발자님이 좋아요를 눌렀어요", "meta": "방금 전", "badge": "안 읽음" },
        { "id": "n-5", "title": "쿼리장인님이 좋아요를 눌렀어요", "meta": "방금 전", "badge": "안 읽음" }
      ],
      "footer": "더 불러오는 중…"
    },
    { "type": "stats", "id": "badge", "items": [{ "id": "unread", "label": "안 읽은 알림", "value": "3" }] }
  ],
  "flows": [
    {
      "name": "종 숫자 갱신",
      "steps": [
        { "kind": "user", "text": "어느 화면에 있든 30초마다 종 숫자를 갱신한다", "focus": ["unread"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications/unread-count", "headers": ["Authorization: Bearer tok-p04"] },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM notification WHERE member_id = 4 AND read_at IS NULL", "note": "ix_notification_member_unread만 읽는다 — 목록 쿼리는 돌지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"unreadCount\": 3}" },
        { "kind": "screen", "text": "종 숫자가 3", "focus": ["bar", "unread"] }
      ]
    },
    {
      "name": "내려서 이어 받기",
      "steps": [
        { "kind": "user", "text": "알림함을 열고 바닥까지 내린다", "focus": ["noti"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications?size=2", "headers": ["Authorization: Bearer tok-p04"] },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 42, ...}, {\"id\": 41, ...}], \"unreadCount\": 3, \"nextCursor\": \"MjAyNi0xMC0wNVQwMDowMHw0MQ\"}" },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications?size=2&cursor=MjAyNi0xMC0wNVQwMDowMHw0MQ", "headers": ["Authorization: Bearer tok-p04"] },
        { "kind": "db", "sql": "... WHERE member_id = 4 AND (created_at < '2026-10-05 00:00' OR (created_at = '2026-10-05 00:00' AND id < 41)) ORDER BY created_at DESC, id DESC LIMIT 3", "note": "시각이 같은 알림은 id로 가른다" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 40, ...}, ...], \"nextCursor\": ...}" },
        { "kind": "screen", "text": "겹치거나 빠진 알림 없이 이어 붙는다", "focus": ["noti", "n-5"] }
      ]
    },
    {
      "name": "모두 읽음",
      "steps": [
        { "kind": "user", "text": "[모두 읽음]을 누른다", "focus": ["read-all"] },
        { "kind": "request", "method": "POST", "path": "/api/me/notifications/read-all", "headers": ["Authorization: Bearer tok-p04"] },
        { "kind": "db", "sql": "UPDATE notification SET read_at = '2026-10-05 00:00' WHERE member_id = 4 AND read_at IS NULL" },
        { "kind": "response", "status": 200, "body": "{\"updated\": 3}" },
        { "kind": "screen", "text": "'안 읽음' 표시가 모두 빠지고 종 숫자가 0", "focus": ["noti", "unread"] }
      ]
    }
  ]
}
```

## 만들 것

모두 토큰이 필요하다(GET도 "내 것"이라 토큰이 없으면 `401` — 4-3 참고).

| 메서드·경로 | 응답 |
|---|---|
| `GET /api/me/notifications/unread-count` | `200` `{ "unreadCount": 3 }` — `COUNT` 한 번 |
| `POST /api/me/notifications/read-all` | `200` `{ "updated": 3 }` — 이번에 읽음으로 바뀐 개수. 이미 다 읽었으면 `0`(멱등). `UPDATE` 한 문장 |
| `GET /api/me/notifications?unreadOnly=true&size=20&cursor=<nextCursor>` | 9-4 응답 + `"nextCursor"`(다음이 없으면 `null`). 기존 필드(`items`·`unreadCount`)는 그대로 |

**목록 요청 값 규칙** — 바꾸는 API는 아니지만, 잘못된 값이 `500`이 되면 안 된다

| 값 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `size` | 아니요 | 생략하면 기본값, 빈 문자열은 400 | 1~100(1과 100은 성공, 0과 101은 거절) | 정수 | 20 | `400` |
| `unreadOnly` | 아니요 | 생략하면 기본값, 빈 문자열은 400 | — | `true`/`false` | `false` | `400` |
| `cursor` | 아니요 | 생략하면 첫 묶음, 빈 문자열은 400 | — | 앞 응답의 `nextCursor` 그대로 | 없음 | 깨진 값 `400` |

**정렬·커서** — `created_at DESC, id DESC`. 커서에는 마지막 항목의 `(created_at, id)`를 담는다(4-3의 `Cursor`를 그대로 써도 된다). 다음 묶음 조건은 `created_at < 커서시각 OR (created_at = 커서시각 AND id < 커서id)`.

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- ix_notification_member_unread만 읽는다 — 목록 쿼리는 돌지 않는다
- 시각이 같은 알림은 id로 가른다

<details>
<summary>Controller</summary>

`NotificationController.java`: HTTP 매핑과 입력·응답을 **NotificationController.java**

```java
package org.example.notification;

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
                                         @RequestParam(value = "size", required = false) String size,
                                         @RequestParam(required = false) String cursor,
                                         @LoginMember AuthenticatedMember me) {
        return notificationService.list(requireLogin(me), parseUnreadOnly(unreadOnly), parseSize(size), cursor);
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
<summary>DTO / 결과 행</summary>

`NotificationListResponse.java`, `ReadAllResponse.java`, `UnreadCountResponse.java`: 필드 이름·타입을 요청·응답 예시와 대조한다.

**NotificationListResponse.java**

```java
package org.example.notification;

import java.util.List;

// 12-3: nextCursor 추가(다음 묶음이 없으면 null). 기존 필드는 그대로 둔다
public record NotificationListResponse(List<NotificationResponse> items, long unreadCount, String nextCursor) {
}
```

**ReadAllResponse.java**

```java
package org.example.notification;

// 12-3: 전부 읽음 — 이번에 읽음으로 바뀐 개수(이미 다 읽었으면 0)
public record ReadAllResponse(int updated) {
}
```

**UnreadCountResponse.java**

```java
package org.example.notification;

// 12-3: 종 아이콘 숫자만 — 목록 없이 COUNT 한 번
public record UnreadCountResponse(long unreadCount) {
}
```

</details>

<details>
<summary>JPA / Repository</summary>

`NotificationRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

**NotificationRepository.java**

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
    @Query("""
            SELECT n FROM Notification n
            JOIN FETCH n.actor
            WHERE n.member.id = :memberId
              AND (:unreadOnly = false OR n.readAt IS NULL)
              AND (
                   :cursorAt IS NULL
                   OR n.createdAt < :cursorAt
                   OR (n.createdAt = :cursorAt AND n.id < :cursorId)
              )
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> findMine(@Param("memberId") Long memberId,
                                @Param("unreadOnly") boolean unreadOnly,
                                @Param("cursorAt") LocalDateTime cursorAt,
                                @Param("cursorId") Long cursorId,
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
<summary>Service</summary>

`NotificationService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

**NotificationService.java**

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
    public NotificationListResponse list(AuthenticatedMember me, boolean unreadOnly, int size, String cursor) {
        Cursor after = Cursor.decode(cursor);
        List<Notification> rows = notificationRepository.findMine(me.id(), unreadOnly,
                after == null ? null : after.at(), after == null ? null : after.id(),
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
                        new AuthorResponse(n.getActor().getId(), n.getActor().getNickname()),
                        n.getPost().getId(),
                        n.getComment() == null ? null : n.getComment().getId(),
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
<summary>MyBatis Mapper — 개수·커서 목록·전부 읽음</summary>

정답의 **MyBatis 대체 구현 코드**에는 Mapper 인터페이스·XML·조회 행 DTO와 수정된 Service 전문이 있다. 목록은 작성자와 JOIN한 결과 행을 size+1개 읽고, 개수는 COUNT만, 모두 읽음은 UPDATE 한 문장으로 처리한다.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.notification.NotificationInboxMapper">
    <select id="findMine" resultType="org.example.notification.NotificationInboxRow">
        SELECT n.id, n.type, a.id AS actor_id, a.nickname AS actor_nickname,
               n.post_id, n.comment_id, n.read_at, n.created_at
        FROM notification n
        JOIN member a ON a.id = n.actor_id
        WHERE n.member_id = #{memberId}
        <if test="unreadOnly">
            AND n.read_at IS NULL
        </if>
        <if test="cursorAt != null">
            AND (n.created_at &lt; #{cursorAt}
                 OR (n.created_at = #{cursorAt} AND n.id &lt; #{cursorId}))
        </if>
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT #{limit}
    </select>

    <update id="markOneRead">
        UPDATE notification
        SET read_at = #{now}
        WHERE id = #{id} AND member_id = #{memberId} AND read_at IS NULL
    </update>

    <select id="existsMine" resultType="boolean">
        SELECT EXISTS(SELECT 1 FROM notification WHERE id = #{id} AND member_id = #{memberId})
    </select>

    <select id="countUnread" resultType="long">
        SELECT COUNT(*)
        FROM notification
        WHERE member_id = #{memberId} AND read_at IS NULL
    </select>

    <update id="markAllRead">
        UPDATE notification
        SET read_at = #{now}
        WHERE member_id = #{memberId} AND read_at IS NULL
    </update>
</mapper>
```

</details>

## 직접 확인

회원 4의 1번 글에 회원 5·6·7이 차례로 좋아요를 눌러 알림 3개를 만든다(먼저 취소해서 "새로" 누른 것이 되게 한다). 끝에서 좋아요를 다시 취소해 처음 상태로 돌린다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 끝에서 좋아요를 취소하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "X5",
      "title": "회원 5 좋아요 취소(처음 상태로)",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p05"
      }
    },
    {
      "id": "X6",
      "title": "회원 6 좋아요 취소",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p06"
      }
    },
    {
      "id": "X7",
      "title": "회원 7 좋아요 취소",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    },
    {
      "id": "L5",
      "title": "회원 5 좋아요",
      "method": "PUT",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p05"
      }
    },
    {
      "id": "L6",
      "title": "회원 6 좋아요",
      "method": "PUT",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p06"
      }
    },
    {
      "id": "L7",
      "title": "회원 7 좋아요",
      "method": "PUT",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    },
    {
      "id": "U0",
      "title": "안 읽은 수",
      "method": "GET",
      "path": "/api/me/notifications/unread-count",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "A",
      "title": "알림 첫 묶음(size=2)",
      "method": "GET",
      "path": "/api/me/notifications?size=2",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "B",
      "title": "커서로 다음 묶음",
      "method": "GET",
      "path": "/api/me/notifications?size=2&cursor={{A.body.nextCursor}}",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "RA",
      "title": "모두 읽음",
      "method": "POST",
      "path": "/api/me/notifications/read-all",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "U1",
      "title": "안 읽은 수 다시",
      "method": "GET",
      "path": "/api/me/notifications/unread-count",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "RA2",
      "title": "모두 읽음 한 번 더",
      "method": "POST",
      "path": "/api/me/notifications/read-all",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "UO",
      "title": "안 읽은 알림만",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=true",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "S0",
      "title": "size=0(하한 바로 밖)",
      "method": "GET",
      "path": "/api/me/notifications?size=0",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "S101",
      "title": "size=101(상한 바로 밖)",
      "method": "GET",
      "path": "/api/me/notifications?size=101",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "SX",
      "title": "size가 숫자 아님",
      "method": "GET",
      "path": "/api/me/notifications?size=abc",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "BX",
      "title": "unreadOnly가 true/false 아님",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=maybe",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "CX",
      "title": "깨진 커서",
      "method": "GET",
      "path": "/api/me/notifications?cursor=abc",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "SE",
      "title": "size 빈 값",
      "method": "GET",
      "path": "/api/me/notifications?size=",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "B1",
      "title": "unreadOnly=1",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=1",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "BY",
      "title": "unreadOnly=yes",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=yes",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "BO",
      "title": "unreadOnly=on",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=on",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "BE",
      "title": "unreadOnly 빈 값",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "CE",
      "title": "cursor 빈 값",
      "method": "GET",
      "path": "/api/me/notifications?cursor=",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "S1",
      "title": "size=1(하한 바로 안)",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "S100",
      "title": "size=100(상한 바로 안)",
      "method": "GET",
      "path": "/api/me/notifications?size=100",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "NU",
      "title": "토큰 없이 안 읽은 수",
      "method": "GET",
      "path": "/api/me/notifications/unread-count"
    },
    {
      "id": "NR",
      "title": "토큰 없이 모두 읽음",
      "method": "POST",
      "path": "/api/me/notifications/read-all"
    },
    {
      "id": "Y5",
      "title": "뒷정리 — 회원 5 좋아요 취소",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p05"
      }
    },
    {
      "id": "Y6",
      "title": "뒷정리 — 회원 6",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p06"
      }
    },
    {
      "id": "Y7",
      "title": "뒷정리 — 회원 7",
      "method": "DELETE",
      "path": "/api/posts/1/like",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "L5",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.liked",
                "equals": true
              }
            ]
          }
        },
        {
          "request": "L7",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.liked",
                "equals": true
              }
            ]
          }
        },
        {
          "request": "U0",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.unreadCount",
                "gte": 3
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "A",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 2
              },
              {
                "path": "$.items[0].actor.id",
                "equals": 7
              },
              {
                "path": "$.items[1].actor.id",
                "equals": 6
              },
              {
                "path": "$.nextCursor",
                "type": "string"
              },
              {
                "path": "$.unreadCount",
                "gte": 3
              }
            ]
          }
        },
        {
          "request": "B",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].actor.id",
                "equals": 5
              },
              {
                "path": "$.items[0].type",
                "equals": "LIKE"
              },
              {
                "path": "$.items[0].id",
                "lt": "{{A.body.items[1].id}}"
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
          "request": "RA",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.updated",
                "gte": 3
              }
            ]
          }
        },
        {
          "request": "U1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.unreadCount",
                "equals": 0
              }
            ]
          }
        },
        {
          "request": "RA2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.updated",
                "equals": 0
              }
            ]
          }
        },
        {
          "request": "UO",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 0
              },
              {
                "path": "$.unreadCount",
                "equals": 0
              },
              {
                "path": "$.nextCursor",
                "type": "null"
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
          "request": "S0",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "S101",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "SX",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "BX",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "CX",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "SE",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "B1",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "BY",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "BO",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "BE",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "CE",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "S1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 1
              },
              {
                "path": "$.nextCursor",
                "type": "string"
              }
            ]
          }
        },
        {
          "request": "S100",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "NU",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "NR",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "Y7",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.liked",
                "equals": false
              }
            ]
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
| C1 | L5·L7 / U0 | 좋아요 `200` / 안 읽은 수 `unreadCount` ≥ 3 |
| C2 | A / B | 첫 묶음 2개가 최신순(보낸 사람 7 → 6)이고 `nextCursor` 문자열 / 커서로 받은 다음 묶음의 첫 항목이 회원 5의 `LIKE` — 시각이 같아도 빠지지 않고, id가 A의 마지막보다 작다(겹치지 않는다) |
| C3 | RA / U1 / RA2 / UO | `updated` ≥ 3 / 안 읽은 수 `0` / 한 번 더 `updated`=0(멱등) / 안 읽은 알림만 보면 빈 목록, `nextCursor`=null |
| C4 | S0·S101·SX·BX·CX / S1·S100 | 범위 밖·숫자 아님·true/false 아님·깨진 커서는 모두 `400`(`500` 아님) / 경계 바로 안쪽 `size`=1·100은 `200` |
| C5 | NU·NR / Y7 | 토큰 없음 `401` / 뒷정리 좋아요 취소 `200` |
| D1 | `SELECT COUNT(*) FROM notification WHERE member_id = 4 AND read_at IS NULL` | `0` — 전부 읽음이 실제로 저장됐다 |
| D2 | `SELECT COUNT(DISTINCT created_at) FROM notification WHERE member_id = 4` | `1` — practice에서는 API로 만든 알림이 모두 같은 시각이다. 그래서 커서에 id가 꼭 필요하다 |
| R1 | 벌크 UPDATE | 전부 읽음이 `UPDATE … WHERE member_id = ? AND read_at IS NULL` 한 문장이다(알림을 읽어 와 하나씩 `markRead`하지 않는다). JPQL 벌크 연산이 영속성 컨텍스트를 거치지 않는다는 것과 `@Modifying(clearAutomatically = true)`가 왜 필요한지 말할 수 있다 |
| R2 | 개수 API | 안 읽은 수가 목록 쿼리 없이 `COUNT` 한 번이다(9-4 R4와 같은 인덱스를 탄다) |
| R3 | 커서 | `(created_at, id)` 두 열을 모두 비교한다. 시각만 비교하면 이 데이터에서 C2가 왜 깨지는지 설명할 수 있다 |
| R5 | 단건·일괄 읽음 경쟁 | 단건 읽음도 `WHERE read_at IS NULL AND member_id = ?` 조건부 UPDATE다. 이미 읽은 알림의 첫 read_at은 덮어쓰지 않고, 다른 회원의 알림은 404로 숨긴다 |
| R4 | 읽음 경쟁 | [모두 읽음]을 누르는 사이에 새 알림이 오면 그것도 읽음이 된다는 것을 안다 — 막으려면 "화면에 보인 마지막 id까지만"(`WHERE id <= ?`)을 받는 방법이 있다 |

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md)
- [S10 Spring Data와 쿼리 도구](../../docs/knowledge/S10-spring-data-query.md) — `@Modifying` 벌크 UPDATE
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — 영속성 컨텍스트와 벌크 연산
- [G1 페이징과 정렬](../../lessons/G1-paging-and-sorting.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 커서</summary>

4-3의 내 좋아요 목록과 같은 모양이다. 9-4의 `findMine` 조건에 `(:cursorAt IS NULL OR n.createdAt < :cursorAt OR (n.createdAt = :cursorAt AND n.id < :cursorId))`를 더하고 `PageRequest.of(0, size + 1)`로 하나 더 읽는다. 깨진 커서는 `Cursor.decode`가 이미 `400`으로 바꿔 준다.
</details>

<details>
<summary>힌트 2 — 전부 읽음</summary>

```java
@Modifying(clearAutomatically = true)
@Query("UPDATE Notification n SET n.readAt = :now WHERE n.member.id = :memberId AND n.readAt IS NULL")
int markAllRead(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);
```

반환값(바뀐 행 수)을 그대로 응답에 쓴다. 서비스 메서드에 `@Transactional`이 있어야 한다(없으면 `TransactionRequiredException`).
</details>

## 다음 단계

[12-4. 팔로우·언팔로우](12-4-follow.md)
