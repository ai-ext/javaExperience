# 12-2. 댓글 멘션 알림 — @닉네임

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "댓글에서 `@닉네임`으로 사람을 부르면 그 사람한테 알림이 가게 해 주세요. 그런데 차단한 사람이 저를 불러서 알림이 오면 안 되고요, 팔로워만 보는 글인데 팔로워가 아닌 사람을 부르면 그 사람은 눌러도 못 보잖아요. 그런 경우는 빼 주세요."

9-4에서 좋아요·댓글이 생기면 글 작성자에게 알림이 가게 했다. 이번에는 받는 사람을 **본문에서** 찾는다. 본문은 사용자가 마음대로 쓰는 글자라서, 받을 사람을 고르는 규칙이 이 단계의 대부분이다.

- 본문에서 `@닉네임`을 뽑는다. 같은 사람을 두 번 불러도 알림은 한 번이다.
- 받을 사람마다 "보내도 되나"를 확인한다: 있는 회원인가, 활동 중인가, 나 자신은 아닌가, 차단 관계가 아닌가, **그 글을 볼 수 있나**(2-3 규칙).
- 이미 이 댓글의 MENTION 알림을 받은 회원에게도 다시 보내지 않는다. 글 작성자는 이미 `COMMENT` 알림을 받는다. 같은 댓글로 두 번 울리지 않게 멘션 알림은 보내지 않는다.
- 12-1에서 댓글을 고칠 수 있게 됐다. 고치면서 **새로 넣은** 멘션에만 알림을 보낸다. 이미 알린 사람에게 또 보내지 않는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 — 댓글에서 사람 부르기",
  "summary": "댓글 본문의 @닉네임마다 '보내도 되나'를 따져 MENTION 알림을 만든다. 응답은 댓글 작성(5-1) 그대로다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "개발 책 추천해주세요 (팔로워 공개)", "right": "자바초보탈출" },
    { "type": "field", "id": "comment-box", "label": "댓글", "value": "[채점] 멘션 확인 @스프링요정 @밤샘개발자 @리팩토링중독 ...", "multiline": true },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    {
      "type": "list",
      "id": "receivers",
      "label": "알림이 가는 사람",
      "items": [
        { "id": "r-4", "title": "스프링요정", "meta": "팔로워 — 글을 볼 수 있다", "badge": "MENTION", "tone": "success" },
        { "id": "r-2", "title": "코딩하는고양이", "meta": "글 작성자 — COMMENT만", "badge": "COMMENT" },
        { "id": "r-6", "title": "밤샘개발자", "meta": "팔로워가 아님 — 글을 못 본다", "badge": "보내지 않음", "tone": "muted" },
        { "id": "r-14", "title": "리팩토링중독", "meta": "나를 차단했다", "badge": "보내지 않음", "tone": "muted" }
      ]
    },
    { "type": "stats", "id": "badge", "items": [{ "id": "bell", "label": "스프링요정의 안 읽은 알림", "value": "+1" }] }
  ],
  "flows": [
    {
      "name": "댓글에서 부르기",
      "steps": [
        { "kind": "user", "text": "회원 3이 팔로워 공개 글(15번)에 @닉네임을 여럿 넣어 댓글을 단다", "focus": ["comment-box", "submit"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/15/comments",
          "headers": ["Authorization: Bearer tok-p03", "Content-Type: application/json"],
          "body": "{\"content\": \"[채점] 멘션 확인 @스프링요정 @스프링요정 @코딩하는고양이 @리팩토링중독 @밤샘개발자 ...\"}"
        },
        { "kind": "server", "text": "댓글 저장과 같은 트랜잭션에서 COMMENT 알림(9-4) → 본문에서 뽑은 닉네임으로 커밋 뒤 MENTION 알림. 닉네임마다 존재·상태·자기 자신·글 작성자·차단·볼 수 있나를 확인한다" },
        { "kind": "db", "sql": "SELECT * FROM member WHERE nickname IN ('스프링요정', '코딩하는고양이', '리팩토링중독', '밤샘개발자', ...); INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, created_at) VALUES (4, 3, 'MENTION', 15, 361, ...)", "note": "닉네임 수만큼 회원을 따로 조회하지 않는다 — IN 한 번" },
        { "kind": "response", "status": 201, "body": "{\"id\": 361, \"postId\": 15, \"content\": \"[채점] 멘션 확인 @스프링요정 ...\", ...}" },
        { "kind": "screen", "text": "스프링요정에게만 MENTION, 글 작성자에게는 COMMENT 하나", "focus": ["receivers", "r-4", "r-2", "bell"] }
      ]
    },
    {
      "name": "고치면서 한 명 더 부르기",
      "steps": [
        { "kind": "user", "text": "\"@디버깅중님\"이라고 붙여 써서 알림이 안 갔다 — 띄어 써서 고친다", "focus": ["comment-box"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/comments/361",
          "headers": ["Authorization: Bearer tok-p03", "Content-Type: application/json"],
          "body": "{\"content\": \"... @디버깅중 님 ...\"}"
        },
        { "kind": "server", "text": "옛 본문과 새 본문의 멘션을 비교 → 새로 생긴 '디버깅중'에게만 MENTION. 스프링요정은 이미 받았으니 또 보내지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 361, \"edited\": true, ...}" },
        { "kind": "screen", "text": "디버깅중에게 알림 하나가 더 간다", "focus": ["receivers"] }
      ]
    }
  ]
}
```

## 만들 것

**V31** — `db/migration/V31__notification_mention.sql`

| 변경 | 내용 |
|---|---|
| `notification(member_id, type, comment_id)` UNIQUE | 동일 댓글에서 같은 회원에게 멘션 알림을 다시 보내지 않는다. `comment_id`가 NULL인 LIKE는 여러 건 가능 |
| `notification.type` CHECK | `'LIKE', 'COMMENT'` → `'LIKE', 'COMMENT', 'MENTION'` — CHECK는 고칠 수 없어서 `DROP CHECK` 뒤 다시 만든다(이름은 V4에서 붙인 그대로) |

**멘션 뽑기**

| 규칙 | 내용 |
|---|---|
| 형식 | `@` 바로 뒤의 한글·영문·숫자·`_`가 이어진 부분 전체가 닉네임(최대 40자). 41자 이상이면 무시한다. 공백·문장부호에서 끊긴다 — `@디버깅중님`은 `디버깅중님`이라 없는 회원 |
| 중복 | 같은 닉네임은 한 번 |
| 개수 | 한 댓글에서 앞에서부터 10명까지 |

**알림** — 종류 `MENTION`, `comment_id`는 그 댓글. 응답 모양은 9-4 알림 목록 그대로(`type`만 새 값)

| 멘션된 사람 | 알림 |
|---|---|
| 활동 중(`ACTIVE`)이고 그 글을 볼 수 있는 회원 | `MENTION` 하나 |
| 없는 닉네임, 정지·탈퇴한 회원 | 없음 |
| 나 자신 | 없음 |
| 글 작성자 | 없음 — 이미 `COMMENT`를 받는다 |
| 나와 차단 관계(어느 쪽이든) | 없음 |
| 그 글을 볼 수 없는 회원(팔로워 공개 글의 비팔로워 등, 2-3 규칙) | 없음 |
| 댓글 수정(12-1)으로 **새로** 들어간 멘션 | 위 규칙대로 `MENTION`. 원래 있던 멘션은 다시 보내지 않는다 |

- 댓글 작성·수정 API의 응답은 바뀌지 않는다. 9-4의 `COMMENT` 알림은 댓글과 같은 트랜잭션에서 만든다. 이 단계의 `MENTION` 알림은 커밋 뒤 별도 트랜잭션에서 만든다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 댓글 저장과 같은 트랜잭션에서 COMMENT 알림(9-4) → 본문에서 뽑은 닉네임으로 커밋 뒤 MENTION 알림. 닉네임마다 존재·상태·자기 자신·글 작성자·차단·볼 수 있나를 확인한다
- 닉네임 수만큼 회원을 따로 조회하지 않는다 — IN 한 번
- 옛 본문과 새 본문의 멘션을 비교 → 새로 생긴 '디버깅중'에게만 MENTION. 스프링요정은 이미 받았으니 또 보내지 않는다

<details>
<summary>Service — 처리 순서</summary>

`CommentService.java`, `NotificationService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `notifyMentions`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

**CommentService.java**

```java
package org.example.comment;

import org.example.auth.AuthenticatedMember;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.notification.CommentCreatedEvent;
import org.example.notification.CommentMentionedEvent;
import org.example.post.AuthorResponse;
import org.example.post.PostRepository;
import org.example.social.BlockPolicy;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private static final String PUBLISHED = "PUBLISHED";

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final BlockPolicy blockPolicy;
    private final ApplicationEventPublisher eventPublisher;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository,
                           MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                           BlockPolicy blockPolicy, ApplicationEventPublisher eventPublisher) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.blockPolicy = blockPolicy;
        this.eventPublisher = eventPublisher;
    }

    // 댓글 저장과 comment_count 증가를 한 트랜잭션으로 묶는다 — 둘 중 하나만 반영되면 숫자가 틀어진다
    @Transactional
    public Comment create(Long postId, AuthenticatedMember loginMember, CommentCreateRequest request) {
        Post post = findCommentablePost(postId, loginMember);
        Comment parent = resolveParent(postId, request.parentId());

        Member author = memberRepository.getReferenceById(loginMember.id());
        Comment saved = commentRepository.save(new Comment(post, author, parent, request.content(), LocalDateTime.now()));
        postRepository.incrementCommentCount(postId);
        // 9-4: 글 작성자에게 COMMENT 알림(자기 글에 자기 댓글은 리스너 쪽에서 거른다). 같은 트랜잭션에서 만든다
        eventPublisher.publishEvent(new CommentCreatedEvent(postId, saved.getId(), loginMember.id()));
        // 12-2: 본문의 @닉네임 — 누구에게 보낼지(존재·차단·볼 수 있나)는 알림 쪽에서 판단한다
        publishMentions(postId, saved.getId(), loginMember.id(), Mentions.extract(request.content()));

        // 트랜잭션 안에서 지연 로딩 연관을 미리 읽어 둔다(컨트롤러가 세션 밖에서 DTO를 만든다)
        saved.getMember().getNickname();
        return saved;
    }

    // 12-1 — 작성자만 고친다. 확인 순서: 없거나 지운 댓글·볼 수 없는 글의 댓글 404 → 남의 댓글 403.
    // 내용이 그대로면 아무것도 바꾸지 않는다(edited_at이 안 찍혀 "수정됨"이 붙지 않는다).
    @Transactional
    public Comment edit(Long commentId, AuthenticatedMember loginMember, CommentUpdateRequest request) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(CommentNotFoundException::new);
        if (!accessPolicy.canView(loginMember, comment.getPost())) {
            throw new CommentNotFoundException();
        }
        if (!comment.getMember().getId().equals(loginMember.id())) {
            throw new CommentForbiddenException("본인 댓글만 수정할 수 있습니다.");
        }

        String requestedContent = request.validatedContent();
        String before = comment.getContent();
        if (comment.edit(requestedContent, LocalDateTime.now())) {
            // 12-2: 고치면서 새로 넣은 멘션에만 알린다(이미 알린 사람에게 또 보내지 않는다)
            publishMentions(comment.getPost().getId(), comment.getId(), loginMember.id(),
                    Mentions.added(before, requestedContent));
        }

        // 컨트롤러가 세션 밖에서 DTO를 만든다 — 지연 로딩 연관을 미리 읽어 둔다
        comment.getMember().getNickname();
        comment.getPost().getId();
        if (comment.getParent() != null) {
            comment.getParent().getId();
        }
        return comment;
    }

    // 작성자만 지운다(soft delete). 없거나 이미 지운 댓글은 404, 남의 댓글은 403.
    // comment_count 감소는 같은 트랜잭션에서 원자적으로 한다.
    @Transactional
    public void delete(Long commentId, AuthenticatedMember loginMember) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(CommentNotFoundException::new);

        if (!comment.getMember().getId().equals(loginMember.id())) {
            throw new CommentForbiddenException();
        }

        // 앞선 읽기와 별개로 DB에서 deleted_at IS NULL을 다시 검사한다.
        // 동시에 같은 댓글을 지울 때 한 요청만 1행을 변경하고 댓글 수를 내린다.
        if (commentRepository.softDeleteIfLive(commentId, LocalDateTime.now()) != 1) {
            throw new CommentNotFoundException();
        }
        if (postRepository.decrementCommentCount(comment.getPost().getId()) != 1) {
            throw new IllegalStateException("댓글 수 변경 실패");
        }
    }

    // 그 글의 댓글을 작성자와 함께 한 번에 읽어(N+1 없음) 메모리에서 트리로 조립한다.
    // 표시 규칙: 지운 최상위는 살아 있는 답글이 있을 때만 "삭제된 댓글입니다" 자리를 남긴다,
    // 지운 답글은 뺀다, 보는 사람과 차단 관계인 회원의 댓글은 뺀다(최상위면 답글까지).
    @Transactional(readOnly = true)
    public List<CommentThreadResponse> list(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }

        List<Comment> all = commentRepository.findByPostIdWithMember(postId);
        Long viewerId = viewer == null ? null : viewer.id();
        Set<Long> blockedMemberIds = viewerId == null ? Set.of() : blockPolicy.blockRelatedIds(viewerId);

        Map<Long, List<Comment>> repliesByParent = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId(), LinkedHashMap::new, Collectors.toList()));

        List<CommentThreadResponse> result = new ArrayList<>();
        for (Comment top : all) {
            if (top.getParent() != null) {
                continue; // 답글은 부모와 함께 처리
            }
            if (blockedMemberIds.contains(top.getMember().getId())) {
                continue; // 차단 — 최상위째 뺀다(답글도 함께)
            }

            // "살아 있는 답글"은 지운 것·차단으로 빠지는 것을 제외하고 센다
            List<Comment> visibleReplies = repliesByParent.getOrDefault(top.getId(), List.of()).stream()
                    .filter(r -> r.getDeletedAt() == null)
                    .filter(r -> !blockedMemberIds.contains(r.getMember().getId()))
                    .toList();

            boolean deleted = top.getDeletedAt() != null;
            if (deleted && visibleReplies.isEmpty()) {
                continue; // 지웠고 남은 답글도 없으면 자리도 남기지 않는다
            }

            List<CommentReplyResponse> replies = visibleReplies.stream()
                    .map(r -> new CommentReplyResponse(r.getId(), toAuthor(r.getMember()), r.getContent(), r.getCreatedAt(),
                            r.isEdited()))
                    .toList();

            result.add(new CommentThreadResponse(
                    top.getId(),
                    deleted ? null : toAuthor(top.getMember()),
                    deleted ? "삭제된 댓글입니다" : top.getContent(),
                    top.getCreatedAt(),
                    !deleted && top.isEdited(),
                    deleted,
                    replies
            ));
        }
        return result;
    }

    private void publishMentions(Long postId, Long commentId, Long actorId, Set<String> nicknames) {
        if (!nicknames.isEmpty()) {
            eventPublisher.publishEvent(new CommentMentionedEvent(postId, commentId, actorId, nicknames));
        }
    }

    // 볼 수 있는 PUBLISHED 글인가 — 아니면 404(4-1 LikeService.findLikeablePost와 같은 규칙)
    private Post findCommentablePost(Long postId, AuthenticatedMember loginMember) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(loginMember, post) || !PUBLISHED.equals(post.getStatus())) {
            throw new PostNotFoundException();
        }
        return post;
    }

    // 부모 댓글 검증 — 같은 글의, 최상위, 지워지지 않은 댓글이어야 한다.
    // 부모가 없으면 404(CommentNotFoundException), 있는데 규칙에 안 맞으면 400(InvalidParentCommentException).
    private Comment resolveParent(Long postId, Long parentId) {
        if (parentId == null) {
            return null;
        }
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(CommentNotFoundException::new);
        if (!parent.getPost().getId().equals(postId)) {
            throw new InvalidParentCommentException("다른 글의 댓글에는 답글을 달 수 없습니다.");
        }
        if (parent.getParent() != null) {
            throw new InvalidParentCommentException("답글에는 답글을 달 수 없습니다.");
        }
        if (parent.getDeletedAt() != null) {
            throw new InvalidParentCommentException("지워진 댓글에는 답글을 달 수 없습니다.");
        }
        return parent;
    }

    private AuthorResponse toAuthor(Member member) {
        return new AuthorResponse(member.getId(), member.getNickname());
    }
}
```

**NotificationService.java**

```java
package org.example.notification;

import org.example.auth.AuthenticatedMember;
import org.example.comment.CommentRepository;
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
    public NotificationListResponse list(AuthenticatedMember me, boolean unreadOnly, int size) {
        List<NotificationResponse> items = notificationRepository
                .findMine(me.id(), unreadOnly, PageRequest.of(0, size)).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getType(),
                        new AuthorResponse(n.getActor().getId(), n.getActor().getNickname()),
                        n.getPost().getId(),
                        n.getComment() == null ? null : n.getComment().getId(),
                        n.getReadAt() != null,
                        n.getCreatedAt()))
                .toList();
        return new NotificationListResponse(items, notificationRepository.countByMember_IdAndReadAtIsNull(me.id()));
    }

    @Transactional
    public void markRead(AuthenticatedMember me, Long notificationId) {
        notificationRepository.findByIdAndMember_Id(notificationId, me.id())
                .orElseThrow(NotificationNotFoundException::new)
                .markRead(LocalDateTime.now(clock));
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`MemberRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

**MemberRepository.java**

```java
package org.example.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

import java.util.Collection;
import java.util.List;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 12-2 멘션 — 닉네임 여러 개를 한 번에(멘션 수만큼 따로 조회하지 않는다)
    List<Member> findByNicknameIn(Collection<String> nicknames);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Member m WHERE m.id = :id")
    Optional<Member> findByIdForUpdate(@Param("id") Long id);
}
```

**NotificationRepository.java**

```java
package org.example.notification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 같은 댓글에서 멘션을 지웠다가 다시 넣어도 이미 보낸 알림은 재발송하지 않는다.
    boolean existsByMember_IdAndComment_IdAndType(Long memberId, Long commentId, String type);

    // 내 알림 최신순 — 보낸 사람(actor)을 함께 읽는다(항목마다 따로 조회하지 않음)
    @Query("""
            SELECT n FROM Notification n
            JOIN FETCH n.actor
            WHERE n.member.id = :memberId
              AND (:unreadOnly = false OR n.readAt IS NULL)
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    List<Notification> findMine(@Param("memberId") Long memberId,
                                @Param("unreadOnly") boolean unreadOnly,
                                Pageable pageable);

    // 안 읽은 개수 — 목록을 다 읽어 세지 않고 COUNT(ix_notification_member_unread를 탄다)
    long countByMember_IdAndReadAtIsNull(Long memberId);

    // 읽음 처리도 "내 알림"만 찾는다(IDOR 방지)
    Optional<Notification> findByIdAndMember_Id(Long id, Long memberId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Notification.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

**Notification.java**

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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private Member actor;

    @Column(nullable = false, length = 20)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

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

`V31__notification_mention.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

**V31__notification_mention.sql**

```sql
-- V31 — 댓글 멘션 알림(12-2). 알림 종류에 MENTION을 더한다.
-- CHECK 제약은 고칠 수 없어서 지우고 다시 만든다. 이름(ck_notification_type)은 V4에서 붙인 그대로다.
-- 이름을 안 붙였다면 SHOW CREATE TABLE notification으로 자동 이름(notification_chk_1 등)을 먼저 확인한다.
ALTER TABLE notification DROP CHECK ck_notification_type;
ALTER TABLE notification
    ADD CONSTRAINT ck_notification_type CHECK (type IN ('LIKE', 'COMMENT', 'MENTION'));

-- 같은 댓글이 여러 차례 수정돼도 동일 회원에게 MENTION을 한 번만 보낸다.
-- MySQL UNIQUE는 NULL을 중복으로 보지 않으므로 comment_id가 NULL인 LIKE는 그대로 허용한다.
CREATE UNIQUE INDEX ux_notification_member_type_comment
    ON notification (member_id, type, comment_id);
```

</details>

<details>
<summary>설정·보조 코드</summary>

`Mentions.java`, `CommentMentionedEvent.java`, `NotificationEventListener.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `extract`, `added`, `onCommentMentioned`.

**Mentions.java**

```java
package org.example.comment;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 12-2 — 본문에서 @닉네임을 뽑는다. 닉네임은 한글·영문·숫자·_ 로만 이어진 부분이다.
// "@자바초보탈출, 봐 주세요"는 쉼표 앞에서 끊기고, "@자바초보탈출님"은 "자바초보탈출님"이 되어 없는 회원으로 무시된다.
// 같은 닉네임은 한 번만(순서 유지). 한 댓글에서 최대 MAX_MENTIONS명까지만 본다(도배 방지).
public final class Mentions {

    public static final int MAX_MENTIONS = 10;
    private static final Pattern MENTION = Pattern.compile("@([0-9A-Za-z가-힣_]+)");

    private Mentions() {
    }

    public static Set<String> extract(String content) {
        Set<String> result = new LinkedHashSet<>();
        if (content == null) {
            return result;
        }
        Matcher m = MENTION.matcher(content);
        while (m.find() && result.size() < MAX_MENTIONS) {
            // 40자를 넘는 하나의 토큰을 앞 40자로 잘라 다른 회원을 부르지 않는다.
            if (m.group(1).length() <= 40) {
                result.add(m.group(1));
            }
        }
        return result;
    }

    // 수정 때 — 새 본문에는 있고 옛 본문에는 없던 닉네임만
    public static Set<String> added(String before, String after) {
        Set<String> result = extract(after);
        result.removeAll(extract(before));
        return result;
    }
}
```

**CommentMentionedEvent.java**

```java
package org.example.notification;

import java.util.Set;

// 12-2 — 댓글 본문에서 "새로" 멘션된 닉네임들. 작성 때는 전부, 수정 때는 원래 없던 것만 담는다
public record CommentMentionedEvent(Long postId, Long commentId, Long actorId, Set<String> nicknames) {
}
```

**NotificationEventListener.java**

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

</details>

<details>
<summary>테스트 — 멘션 경계값</summary>

41자 이상의 토큰을 잘라서 다른 회원에게 알리지 않는지, 중복과 수정 시 새 멘션 판별을 검증한다.

```java
package org.example.comment;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class MentionsTest {
    @Test
    void tokenLongerThanFortyCharactersDoesNotMentionItsFortyCharacterPrefix() {
        String forty = "a".repeat(40);
        assertThat(Mentions.extract("@" + forty + "b")).isEmpty();
        assertThat(Mentions.extract("@" + forty + " @ok")).containsExactly(forty, "ok");
    }

    @Test
    void sameNicknameIsCollectedOnceAndNewMentionIsDetectedOnEdit() {
        assertThat(Mentions.extract("@spring @spring @new")).containsExactly("spring", "new");
        assertThat(Mentions.added("@spring", "@spring @new")).isEqualTo(Set.of("new"));
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 멘션 후보와 알림 저장</summary>

정답의 **MyBatis 대체 구현 코드**에는 MentionMapper.java·MentionTargetRow.java·MentionMapper.xml·수정된 NotificationService.java의 전문이 있다. 닉네임 후보를 IN으로 한 번 조회하고, 공통 BlockPolicy·PostAccessPolicy가 허용한 회원에게만 MENTION 행을 삽입한다.

REQUIRES_NEW 트랜잭션은 JPA 방식과 같다. UNIQUE 인덱스와 ON DUPLICATE KEY는 같은 댓글·수신자의 재알림을 막는다.

```xml
<select id="findByNicknames" resultType="org.example.notification.MentionTargetRow">
    SELECT id, nickname, role, member_status, deleted_at
    FROM member
    WHERE nickname IN
    <foreach collection="nicknames" item="nickname" open="(" separator="," close=")">
        #{nickname}
    </foreach>
</select>
<insert id="insertMention">
    INSERT INTO notification (member_id, actor_id, type, post_id, comment_id, created_at)
    VALUES (#{memberId}, #{actorId}, 'MENTION', #{postId}, #{commentId}, #{now})
    ON DUPLICATE KEY UPDATE id = id
</insert>
```

</details>

## 직접 확인

15번 글은 회원 2의 **팔로워 공개** 글이다. 회원 3·4·8은 회원 2를 팔로우하고, 회원 6은 팔로우하지 않는다. 회원 14는 회원 3을 차단했다. 회원 29는 탈퇴했다.

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'
tok() { echo "Authorization: Bearer tok-p$1"; }
top() { curl -s -H "$(tok $1)" "$BASE/api/me/notifications?size=${2:-1}" | python3 -c 'import sys,json; print([(i["type"], i["actor"]["id"], i["postId"], i["commentId"]) for i in json.load(sys.stdin)["items"]])'; }
TEXT='[채점] 멘션 확인 @스프링요정 @스프링요정 @코딩하는고양이 @리팩토링중독 @밤샘개발자 @자바초보탈출 @떠난개발자 @디버깅중님 봐 주세요'

CID=$(curl -s -X POST "$BASE/api/posts/15/comments" -H "$(tok 03)" -H "$J" -d "{\"content\":\"$TEXT\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'); echo $CID   # K
top 04 2      # N4 — 스프링요정: MENTION 하나
top 02 2      # N2 — 글 작성자: COMMENT 하나
top 14 20; top 06 20; top 08 20       # 차단·못 보는 사람·"님" 붙임 — 이 댓글 알림 없음
curl -s -X PATCH "$BASE/api/comments/$CID" -H "$(tok 03)" -H "$J" -d "{\"content\":\"${TEXT/@디버깅중님/@디버깅중 님}\"}"; echo   # E
top 08 1      # N8 — 디버깅중: 이제 MENTION
top 04 1      # 스프링요정: 새 알림 없음(N4와 같은 알림이 맨 위)
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/comments/$CID" -H "$(tok 03)"   # 뒷정리
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 실행할 때마다 새 댓글을 만들고 멘션 제거·재추가를 거쳐 마지막에 지운다.

```check
{
  "requests": [
    {
      "id": "K",
      "title": "회원 3이 멘션 댓글",
      "method": "POST",
      "path": "/api/posts/15/comments",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 멘션 확인 @스프링요정 @스프링요정 @코딩하는고양이 @리팩토링중독 @밤샘개발자 @자바초보탈출 @떠난개발자 @디버깅중님 봐 주세요"
      }
    },
    {
      "id": "N4",
      "title": "스프링요정(4)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=2",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "N2",
      "title": "글 작성자(2)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=2",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "N14",
      "title": "차단한 회원(14)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=20",
      "headers": {
        "Authorization": "Bearer tok-p14"
      }
    },
    {
      "id": "N6",
      "title": "글을 못 보는 회원(6)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=20",
      "headers": {
        "Authorization": "Bearer tok-p06"
      }
    },
    {
      "id": "N8A",
      "title": "'님'을 붙여 부른 회원(8)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=20",
      "headers": {
        "Authorization": "Bearer tok-p08"
      }
    },
    {
      "id": "E",
      "title": "띄어 써서 고치기",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 멘션 확인 @스프링요정 @스프링요정 @코딩하는고양이 @리팩토링중독 @밤샘개발자 @자바초보탈출 @떠난개발자 @디버깅중 님 봐 주세요"
      }
    },
    {
      "id": "N8",
      "title": "디버깅중(8)의 알림",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p08"
      }
    },
    {
      "id": "N4B",
      "title": "스프링요정(4)의 알림 다시",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "R",
      "title": "기존 멘션 지우기",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 멘션 확인 @코딩하는고양이 @리팩토링중독 @밤샘개발자 @자바초보탈출 @떠난개발자 @디버깅중 님 봐 주세요"
      }
    },
    {
      "id": "A",
      "title": "같은 사람 다시 멘션",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 멘션 확인 @코딩하는고양이 @리팩토링중독 @밤샘개발자 @자바초보탈출 @떠난개발자 @디버깅중 님 @스프링요정 봐 주세요"
      }
    },
    {
      "id": "N4C",
      "title": "스프링요정(4)의 알림 재확인",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p04"
      }
    },
    {
      "id": "D",
      "title": "댓글 지우기(뒷정리)",
      "method": "DELETE",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "K",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "N4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].type",
                "equals": "MENTION"
              },
              {
                "path": "$.items[0].actor.id",
                "equals": 3
              },
              {
                "path": "$.items[0].postId",
                "equals": 15
              },
              {
                "path": "$.items[0].commentId",
                "equals": "{{K.body.id}}"
              }
            ]
          }
        },
        {
          "request": "N2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].type",
                "equals": "COMMENT"
              },
              {
                "path": "$.items[0].commentId",
                "equals": "{{K.body.id}}"
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
          "request": "N4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].type",
                "equals": "MENTION"
              },
              {
                "path": "$.items[0].commentId",
                "equals": "{{K.body.id}}"
              }
            ]
          }
        },
        {
          "request": "N14",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].commentId",
                "notContains": "{{K.body.id}}"
              }
            ]
          }
        },
        {
          "request": "N6",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].commentId",
                "notContains": "{{K.body.id}}"
              }
            ]
          }
        },
        {
          "request": "N8A",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].commentId",
                "notContains": "{{K.body.id}}"
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
          "request": "E",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.edited",
                "equals": true
              }
            ]
          }
        },
        {
          "request": "N8",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].type",
                "equals": "MENTION"
              },
              {
                "path": "$.items[0].actor.id",
                "equals": 3
              },
              {
                "path": "$.items[0].commentId",
                "equals": "{{K.body.id}}"
              }
            ]
          }
        },
        {
          "request": "N4B",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].id",
                "equals": "{{N4.body.items[0].id}}"
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
          "request": "R",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "A",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "N4C",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].id",
                "equals": "{{N4.body.items[0].id}}"
              }
            ]
          }
        },
        {
          "request": "D",
          "expect": {
            "status": 204
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
| C1 | K / N4 / N2 | `201` / 스프링요정의 맨 위 알림이 `MENTION`(보낸 사람 3, 글 15, 이 댓글) — 두 번 불렀어도 하나 / 글 작성자는 이 댓글로 `COMMENT` 하나만 |
| C2 | N4 / N14 / N6 / N8A | 멘션 알림이 가는 상태에서, 차단 관계(14)·글을 못 보는 회원(6)·`@디버깅중님`으로 붙여 쓴 회원(8)에게는 이 댓글 알림이 없다 |
| C3 | E / N8 / N4B | 고치면서 새로 들어간 멘션에게 MENTION / 기존 수신자에게는 새 알림 없음 |
| C4 | R / A / N4C / D | 멘션 제거 후 재추가해도 같은 댓글의 기존 수신자에게 재알림 없음 / 뒷정리 204 |
| D1 | `SELECT n.member_id, n.type FROM notification n WHERE n.comment_id = (SELECT MAX(id) FROM comment WHERE post_id = 15 AND BINARY content LIKE BINARY '[채점] 멘션%') ORDER BY n.id` | `2 COMMENT` · `4 MENTION` · `8 MENTION` 세 줄뿐 — 자기 자신(3)·탈퇴(29)·차단(14)·못 보는 회원(6)은 없다 |
| D2 | `SELECT check_clause FROM information_schema.check_constraints WHERE constraint_schema = 'practice' AND constraint_name = 'ck_notification_type'` | `MENTION`이 들어 있다 |
| R1 | 한 번에 조회 | 멘션된 닉네임으로 회원을 `IN` 한 번에 읽는다(닉네임마다 조회하지 않는다). 개수 상한이 있다 |
| R2 | 규칙 재사용 | "그 글을 볼 수 있나"를 새로 짜지 않고 2-3의 `PostAccessPolicy`, 차단은 `BlockPolicy`를 그대로 쓴다 — 받는 사람 입장에서 판정한다 |
| R3 | 수정 때 | 옛 본문과 새 본문의 멘션 집합 차이로 "새로 생긴 멘션"을 구한다. 내용이 그대로인 수정(12-1)에서는 아무것도 보내지 않는다 |
| R4 | 커밋과의 관계 | `COMMENT` 저장 실패는 댓글까지 롤백한다. 커밋 뒤 `MENTION` 저장 실패는 이미 커밋된 댓글을 되돌리지 못하며 멘션 알림이 빠질 수 있다 |

## 필요한 지식

- [S08 — 이벤트와 커밋의 관계](../../docs/knowledge/S08-transactions.md#이벤트와-커밋의-관계)
- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 받는 사람마다 "볼 수 있나"를 같은 규칙으로
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — CHECK 제약 바꾸기
- [J01 타입과 문자열](../../docs/knowledge/J01-types-string.md) — 정규식으로 문자열에서 뽑기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 뽑기</summary>

`Pattern.compile("@([0-9A-Za-z가-힣_]+)")`로 `Matcher.find()`를 돌려 `LinkedHashSet`에 담되 40자를 넘는 토큰은 버린다(중복 제거 + 순서 유지). 수정 때는 `extract(새 본문)`에서 `extract(옛 본문)`을 `removeAll`한다 — 엔티티의 내용을 바꾸기 **전에** 옛 본문을 꺼내 둔다.
</details>

<details>
<summary>힌트 2 — 받는 사람 고르기</summary>

9-4의 `CommentCreatedEvent`처럼 `CommentMentionedEvent(postId, commentId, actorId, nicknames)`를 발행하고, 알림 서비스에서 `memberRepository.findByNicknameIn(nicknames)` → 회원마다 상태·자기 자신·글 작성자·`blockPolicy.isBlockedEitherWay` 확인 → `new AuthenticatedMember(회원 id, 닉네임, 역할)`로 `accessPolicy.canView(그 회원, 글)` → 저장. </details>

## 다음 단계

[12-3. 알림함 — 안 읽은 수·전부 읽음·커서](12-3-notification-inbox.md)
