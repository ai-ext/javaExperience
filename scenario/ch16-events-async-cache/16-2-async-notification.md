# 16-2. 알림을 비동기로 — 느린 발송이 글쓰기를 막지 않게

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "팔로워 많은 분들이 글 올리기 버튼을 누르면 한참 걸린대요. 알고 보니 알림 푸시를 다 보내고 나서야 응답이 가더라고요. 그리고 어제 푸시 서버가 한 명한테 에러를 냈는데, 그 바람에 글쓰기가 500이 났어요."

16-1에서 알림은 커밋 **뒤**로 옮겼다. 그런데 `AFTER_COMMIT` 리스너도 **같은 요청 스레드**에서 돈다. 그래서 리스너가 느리면 응답도 그만큼 늦게 나간다. 이번 단계에서는 알림마다 **푸시 발송**(외부 푸시 서버 호출)을 붙인다. 이 호출은 한 건에 수백 ms가 걸리고 가끔 실패한다. 팔로워 15명이면 동기로는 몇 초가 걸린다.

할 일은 두 가지다.

1. 커밋 뒤의 일을 **별도 스레드 풀**에 넘기고 응답은 바로 보낸다(`@Async`).
2. 푸시 하나가 실패해도 글쓰기는 `201`이다. 나머지 회원에게는 계속 보내고, **실패한 건은 기록**으로 남긴다.

실제 푸시 서버는 없으니 **연습용 가짜 푸시 서버**를 앱 안에 둔다. 운영자 API로 "한 건에 몇 ms 걸리는지"와 "어느 회원에게 보내면 실패하는지"를 정한다. 아래 실행 칸이 이 설정을 먼저 하고 글을 쓴다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 알림은 뒤에서",
  "summary": "커밋 뒤 알림·푸시를 notify- 스레드로 넘기고 201을 바로 돌려준다. 푸시 실패는 FAILED로 남긴다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글쓰기",
      "right": "자바초보탈출"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "[채점] 16-2 비동기 알림"
    },
    {
      "type": "actions",
      "id": "act",
      "items": [
        {
          "id": "submit",
          "label": "올리기",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "stats",
      "id": "timing",
      "items": [
        {
          "id": "before",
          "label": "동기(16-1 그대로)",
          "value": "2초 이상"
        },
        {
          "id": "after",
          "label": "비동기",
          "value": "0.1초 안팎"
        }
      ]
    },
    {
      "type": "toast",
      "id": "ok",
      "value": "글을 올렸어요",
      "tone": "success"
    }
  ],
  "flows": [
    {
      "name": "글쓰기 → 응답 먼저, 푸시는 뒤에서",
      "steps": [
        {
          "kind": "user",
          "text": "회원 3(팔로워 16명, 활동 중 15명)이 올리기를 누른다",
          "focus": [
            "submit"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p03"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 16-2 비동기 알림\", \"content\": \"...\"}"
        },
        {
          "kind": "server",
          "text": "요청 스레드: 글 저장 → 커밋 → 이벤트를 notificationExecutor 큐에 넣고 끝"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Server-Timing: app;dur=35"
          ],
          "body": "{\"id\": 152, ...}"
        },
        {
          "kind": "screen",
          "text": "푸시를 기다리지 않고 바로 '올렸어요'",
          "focus": [
            "ok",
            "after"
          ]
        },
        {
          "kind": "server",
          "text": "notify-1 스레드: 알림 15행 INSERT … SELECT → 회원마다 푸시(150ms) → 결과를 push_status에. 회원 26은 실패 → FAILED, 다음 회원 계속"
        },
        {
          "kind": "db",
          "sql": "UPDATE notification SET push_status = 'SENT' WHERE post_id = 152 AND member_id = 2 AND type = 'NEW_POST'; ... UPDATE ... SET push_status = 'FAILED' WHERE ... member_id = 26",
          "note": "2~3초 뒤 SENT 14 · FAILED 1"
        }
      ]
    }
  ]
}
```

## 만들 것

**V71** — `db/migration/V71__notification_push_status.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `notification.push_status` | `VARCHAR(10) NULL`, `CHECK (push_status IN ('SENT', 'FAILED'))`. `NULL`이면 푸시 대상이 아니거나(좋아요·댓글 알림) 아직 보내는 중 |

**연습용 가짜 푸시 서버**

| 부품 | 하는 일 |
|---|---|
| `FakePushSender.send(memberId, message)` | 설정한 지연(ms)만큼 `Thread.sleep` → 실패 목록에 있는 회원이면 예외. 설정은 `volatile` 필드 하나에 통째로 담는다(요청 스레드가 바꾸고 알림 스레드가 읽는다) |
| `PUT /api/admin/fake-push` | 운영자만. 본문 `{ "delayMs": 150, "failMemberIds": [26] }` → `200` `{ "delayMs": 150, "failMemberIds": [26] }`. 운영자가 아니면 `403`, 토큰이 없으면 `401` |

**입력 규칙** — `PUT /api/admin/fake-push`

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `delayMs` | 필수 | 안 됨 | 0~5000 | JSON 정수(문자열·소수 안 됨) | — | 없음·범위 밖·잘못된 타입 `400`(`errors`에 `delayMs`) |
| `failMemberIds` | 선택 | `null`이면 실패 없음 | 0~20개 | 원소는 1 이상 JSON 정수, `null`·문자열·소수 원소 안 됨 | `[]` | `400`(`errors`에 `failMemberIds[0]`처럼 몇 번째인지) |

앱을 다시 띄우면 지연 0·실패 없음으로 돌아간다. 다 끝나면 `{"delayMs": 0}`으로 되돌려도 된다.

**비동기로 바꾸기**

| 부품 | 하는 일 |
|---|---|
| `@EnableAsync` + 알림 전용 실행기 | `ThreadPoolTaskExecutor` 빈 `notificationExecutor` — 이름 접두어 `notify-`, core 2 · max 4 · 큐 100. 큐까지 넘치면 `CallerRunsPolicy`(요청 스레드가 직접 처리 — 느려지지만 알림을 버리지 않는다) |
| 새 글 리스너 | `@Async("notificationExecutor")` + `@TransactionalEventListener(AFTER_COMMIT)`. 알림 행을 만들고(16-1의 `INSERT … SELECT`) 받는 사람 id를 읽은 뒤, 회원마다 푸시 → `push_status`를 `SENT`/`FAILED`로 |
| 실패 처리 | 회원 한 명의 푸시 예외를 잡아 `FAILED`로 기록하고 **다음 회원으로 계속**. 로그에 `postId`·`memberId` |
| 트랜잭션 | 알림 저장·결과 기록은 각각 짧은 `@Transactional(REQUIRES_NEW)`. 푸시를 기다리는 동안 DB 커넥션을 붙잡지 않는다. 보통은 `@Async` 스레드에서 새 트랜잭션이 열리지만, 큐 포화 시 `CallerRunsPolicy`가 커밋 콜백의 요청 스레드에서 직접 실행한다. 이때도 이미 커밋된 원래 트랜잭션에 묻어 가지 않도록 `REQUIRES_NEW`가 필요하다 |
| 응답 시간 | `POST /api/posts` 응답에 `Server-Timing: app;dur=<ms>` — 컨트롤러 메서드 시작부터 응답 직전까지(커밋 뒤 리스너 포함). CORS `exposedHeaders`에 `Server-Timing`을 더해야 브라우저 실행 칸이 읽는다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 요청 스레드: 글 저장 → 커밋 → 이벤트를 notificationExecutor 큐에 넣고 끝
- notify-1 스레드: 알림 15행 INSERT … SELECT → 회원마다 푸시(150ms) → 결과를 push_status에. 회원 26은 실패 → FAILED, 다음 회원 계속
- 2~3초 뒤 SENT 14 · FAILED 1

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`, `FakePushController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PutMapping("/api/admin/fake-push")`. 변경된 메서드: `update`.

`src/main/java/org/example/post/PostController.java`

```java
package org.example.post;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.tag.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final Logger log = LoggerFactory.getLogger(PostController.class);

    private final PostService postService;
    private final PostQueryService postQueryService;

    public PostController(PostService postService, PostQueryService postQueryService) {
        this.postService = postService;
        this.postQueryService = postQueryService;
    }

    @GetMapping("/{id}")
    public PostDetailResponse getOne(@PathVariable Long id, @LoginMember AuthenticatedMember viewer) {
        return postQueryService.getDetail(id, viewer);
    }

    // 14-6 관련 글 — 비로그인도 볼 수 있다. size는 1~10
    @GetMapping("/{id}/related")
    public RelatedPostsResponse related(@PathVariable Long id,
                                        @RequestParam(required = false) String size,
                                        @LoginMember AuthenticatedMember viewer) {
        return postQueryService.related(id, parseRelatedSize(size), viewer);
    }

    private static int parseRelatedSize(String raw) {
        if (raw == null) {
            return 5;
        }
        if (raw.matches("[0-9]+")) {
            try {
                int size = Integer.parseInt(raw);
                if (size >= 1 && size <= 10) {
                    return size;
                }
            } catch (NumberFormatException ignored) {
                // int 범위를 넘는 값도 같은 400으로 처리한다.
            }
        }
        throw new InvalidParametersException(Map.of("size", "1~10 사이의 숫자여야 합니다."));
    }

    @Operation(summary = "글쓰기", description = "1분에 5개까지(13-5, 넘으면 429 + Retry-After). 금칙어(13-4)가 있으면 400.")
    @PostMapping
    public ResponseEntity<PostResponse> create(@LoginMember AuthenticatedMember loginMember,
                                                @Valid @RequestBody PostCreateRequest request) {
        long started = System.nanoTime();
        log.info("게시글 작성 요청 제목: {}", request.title());

        Post post = postService.create(loginMember.id(), request);
        PostResponse response = toResponse(post);

        // 16-2 서버가 이 요청에 쓴 시간(ms) — 커밋 뒤 리스너까지 포함된다. 비동기 전후를 숫자로 비교한다
        long elapsedMs = (System.nanoTime() - started) / 1_000_000;
        return ResponseEntity.created(URI.create("/api/posts/" + post.getId()))
                .header("Server-Timing", "app;dur=" + elapsedMs)
                .body(response);
    }

    @PostMapping("/{sourceId}/copies")
    public ResponseEntity<PostResponse> copy(@PathVariable Long sourceId,
                                             @RequestParam(defaultValue = "false") boolean copyTags,
                                             @LoginMember AuthenticatedMember loginMember,
                                             @Valid @RequestBody CopyPostRequest request) {
        Post post = postService.copy(sourceId, loginMember.id(), copyTags, request);
        return ResponseEntity.created(URI.create("/api/posts/" + post.getId()))
                .body(toResponse(post));
    }

    @PutMapping("/{id}")
    public PostDetailResponse replace(@PathVariable Long id,
                                      @LoginMember AuthenticatedMember loginMember,
                                      @Valid @RequestBody PostReplaceRequest request) {
        return postService.replace(id, loginMember, request);
    }

    @PatchMapping("/{id}")
    public PostDetailResponse patch(@PathVariable Long id,
                                     @LoginMember AuthenticatedMember loginMember,
                                     @RequestBody PostUpdateRequest request) {
        Post post = postService.patch(id, loginMember, request);
        return toDetailResponse(post);
    }

    // 11-1 임시저장 글 발행
    @PostMapping("/{id}/publish")
    public PostDetailResponse publish(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        return toDetailResponse(postService.publish(id, loginMember));
    }

    // 11-5 휴지통에서 되살리기
    @PostMapping("/{id}/restore")
    public PostDetailResponse restore(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        if (id <= 0) throw new InvalidPostFieldException("id", "id는 양의 정수여야 합니다.");
        return toDetailResponse(postService.restore(id, loginMember));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        postService.delete(id, loginMember);
    }

    private PostDetailResponse toDetailResponse(Post post) {
        List<String> tagNames = post.getTags().stream().map(Tag::getName).toList();
        AuthorResponse author = new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname());
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                tagNames,
                post.getVisibility(),
                author,
                post.getViewCount(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(),
                post.getPublishAt(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }

    private PostResponse toResponse(Post post) {
        List<String> tagNames = post.getTags().stream().map(Tag::getName).toList();
        AuthorResponse author = new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname());
        return new PostResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                tagNames,
                post.getVisibility(),
                author,
                post.getStatus(),
                post.getPublishAt(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

`src/main/java/org/example/push/FakePushController.java`

```java
package org.example.push;

import org.example.admin.AdminOnlyException;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

// 16-2 연습용 — 가짜 푸시 서버의 지연·실패를 운영자만 바꾼다(PUT이라 토큰 없음은 인터셉터가 401)
@RestController
public class FakePushController {

    private static final String ADMIN_ROLE = "ADMIN";

    private final FakePushSender fakePushSender;

    public FakePushController(FakePushSender fakePushSender) {
        this.fakePushSender = fakePushSender;
    }

    @PutMapping("/api/admin/fake-push")
    public FakePushSettingsResponse update(@LoginMember AuthenticatedMember me,
                                           @RequestBody JsonNode body) {
        if (!ADMIN_ROLE.equals(me.role())) {
            throw new AdminOnlyException();
        }
        FakePushSettingsRequest request = FakePushSettingsRequest.parse(body);
        FakePushSender.Settings s = fakePushSender.update(request.delayMs(), request.failMemberIds());
        return new FakePushSettingsResponse(s.delayMs(), s.failMemberIds().stream().sorted().toList());
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`FakePushSettingsRequest.java`, `FakePushSettingsResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/push/FakePushSettingsRequest.java`

```java
package org.example.push;

import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 원문 JSON의 타입을 확인한다. Jackson의 Integer/Long 강제 변환에 맡기면 "150"과 1.5도 통과한다.
public record FakePushSettingsRequest(Integer delayMs, List<Long> failMemberIds) {

    public static FakePushSettingsRequest parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        JsonNode delay = body.get("delayMs");
        Integer delayMs = null;
        if (delay == null || delay.isNull()) {
            errors.put("delayMs", "지연(ms)을 입력해 주세요.");
        } else if (!delay.isIntegralNumber() || !delay.canConvertToInt()) {
            errors.put("delayMs", "지연은 정수여야 합니다.");
        } else if (delay.intValue() < 0 || delay.intValue() > 5000) {
            errors.put("delayMs", "지연은 0~5000ms여야 합니다.");
        } else {
            delayMs = delay.intValue();
        }

        List<Long> failMemberIds = new ArrayList<>();
        JsonNode failed = body.get("failMemberIds");
        if (failed != null && !failed.isNull()) {
            if (!failed.isArray()) {
                errors.put("failMemberIds", "실패 회원은 배열이어야 합니다.");
            } else {
                if (failed.size() > 20) {
                    errors.put("failMemberIds", "실패 회원은 20명까지입니다.");
                }
                for (int i = 0; i < failed.size(); i++) {
                    JsonNode memberId = failed.get(i);
                    if (!memberId.isIntegralNumber() || !memberId.canConvertToLong() || memberId.longValue() < 1) {
                        errors.put("failMemberIds[" + i + "]", "회원 id는 1 이상의 정수여야 합니다.");
                    } else {
                        failMemberIds.add(memberId.longValue());
                    }
                }
            }
        }
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return new FakePushSettingsRequest(delayMs, List.copyOf(failMemberIds));
    }
}
```

`src/main/java/org/example/push/FakePushSettingsResponse.java`

```java
package org.example.push;

import java.util.List;

public record FakePushSettingsResponse(int delayMs, List<Long> failMemberIds) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`NotificationService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `notifyNewPost`, `markPush`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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

    // 16-1 새 글 → 팔로워 알림. 16-2부터 @Async 스레드에서 불린다 — 그 스레드엔 이어 갈 트랜잭션이 없으므로
    // 큐 포화로 CallerRunsPolicy가 요청 스레드에서 직접 실행해도 새 트랜잭션이어야 한다.
    // 알림 행을 만들고 푸시 보낼 회원 id를 돌려준다.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<Long> notifyNewPost(Long postId, Long authorId) {
        notificationRepository.insertNewPostForFollowers(postId, authorId, LocalDateTime.now(clock));
        return notificationRepository.findNewPostRecipientIds(postId);
    }

    // 16-2 푸시 결과 — 한 건씩 새 트랜잭션(느린 푸시 호출 동안 커넥션을 붙잡지 않는다)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markPush(Long postId, Long memberId, String status) {
        notificationRepository.updatePushStatus(postId, memberId, status);
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

    // 16-2 푸시 대상 — 방금 만든 새 글 알림의 받는 사람
    @Query("SELECT n.member.id FROM Notification n WHERE n.post.id = :postId AND n.type = 'NEW_POST' ORDER BY n.member.id")
    List<Long> findNewPostRecipientIds(@Param("postId") Long postId);

    // 16-2 푸시 결과 기록
    @Modifying
    @Query("""
            UPDATE Notification n SET n.pushStatus = :status
             WHERE n.post.id = :postId AND n.member.id = :memberId AND n.type = 'NEW_POST'
            """)
    int updatePushStatus(@Param("postId") Long postId, @Param("memberId") Long memberId, @Param("status") String status);
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

    // 16-2 푸시 결과(SENT·FAILED). 좋아요·댓글 알림과 발송 전에는 null
    @Column(name = "push_status", length = 10)
    private String pushStatus;

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

`V71__notification_push_status.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V71__notification_push_status.sql`

```sql
-- V71 — 16-2 푸시 발송 결과. 새 글 알림(NEW_POST)을 푸시로 보낸 뒤 성공(SENT)·실패(FAILED)를 남긴다.
-- NULL = 푸시 대상이 아니거나(좋아요·댓글 알림) 아직 보내는 중.
ALTER TABLE notification
    ADD COLUMN push_status VARCHAR(10) NULL COMMENT '푸시 결과 — SENT·FAILED, NULL이면 대상 아님·발송 전',
    ADD CONSTRAINT ck_notification_push_status CHECK (push_status IN ('SENT', 'FAILED'));
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`PushFailedException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다.

`src/main/java/org/example/push/PushFailedException.java`

```java
package org.example.push;

public class PushFailedException extends RuntimeException {

    public PushFailedException(String message) {
        super(message);
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`CorsConfig.java`, `AsyncConfig.java`, `NotificationEventListener.java`, `FakePushSender.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `notificationExecutor`, `send`, `update`.

`src/main/java/org/example/config/CorsConfig.java`

```java
package org.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 브라우저 화면(브라우저)이 다른 출처에서 /api/**를 부를 수 있게 CORS를 연다(1-1 "CORS 열기").
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Client")
                // 13-5·13-6: 브라우저 JS가 429의 Retry-After, 내려받기의 파일 이름(Content-Disposition)을 읽으려면
                // 노출해야 한다(CORS 기본 노출 헤더가 아니다). 16-2: 처리 시간 Server-Timing도 같은 이유
                .exposedHeaders("Location", "WWW-Authenticate", "Retry-After", "Content-Disposition", "Server-Timing");
        // 13-7: API 문서는 /api 밖이다 — 다른 출처(브라우저 화면)에서 문서 JSON·화면을 읽을 수 있게 GET만 연다
        registry.addMapping("/v3/api-docs/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
        registry.addMapping("/swagger-ui/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
    }
}
```

`src/main/java/org/example/notification/AsyncConfig.java`

```java
package org.example.notification;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

// 16-2 알림 전용 스레드 풀. 기본 실행기를 쓰지 않고 이름·크기·넘칠 때 동작을 정해 둔다.
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "notificationExecutor")
    public ThreadPoolTaskExecutor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        // 큐(100)가 다 차야 max까지 늘어난다. 그것도 넘치면 요청 스레드가 직접 처리 — 느려지지만 알림을 버리지 않는다
        executor.setQueueCapacity(100);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setThreadNamePrefix("notify-");
        // 종료할 때 큐에 남은 일을 최대 10초 기다린다
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
```

`src/main/java/org/example/notification/NotificationEventListener.java`

```java
package org.example.notification;

import org.example.push.FakePushSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

// 9-4의 좋아요·댓글 알림은 원래 트랜잭션에서 처리한다. 저장 실패는 원래 작업을 롤백시킨다.
// 멘션·새 글 알림은 각 시나리오의 커밋 후 처리 규칙을 따른다.
@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;
    private final FakePushSender pushSender;

    public NotificationEventListener(NotificationService notificationService, FakePushSender pushSender) {
        this.notificationService = notificationService;
        this.pushSender = pushSender;
    }

    @EventListener
    public void onPostLiked(PostLikedEvent event) {
        notificationService.notifyLike(event.postId(), event.actorId());
    }

    // 16-1 새 글 → 팔로워 알림. 글 트랜잭션이 롤백되면 이 메서드는 아예 불리지 않는다.
    // 16-2 커밋 뒤 일을 알림 전용 스레드 풀에 넘긴다 — 글쓰기 응답은 푸시를 기다리지 않는다.
    // 푸시 하나가 실패해도 다음 회원으로 넘어가고, 결과(SENT·FAILED)를 알림 행에 남긴다.
    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPostCreated(PostCreatedEvent event) {
        List<Long> recipients;
        try {
            recipients = notificationService.notifyNewPost(event.postId(), event.authorId());
        } catch (RuntimeException e) {
            log.warn("새 글 알림 생성 실패 postId={}", event.postId(), e);
            return;
        }
        int failed = 0;
        for (Long memberId : recipients) {
            try {
                pushSender.send(memberId, "새 글이 올라왔어요");
                notificationService.markPush(event.postId(), memberId, "SENT");
            } catch (RuntimeException e) {
                failed++;
                log.warn("푸시 실패 postId={} memberId={} — {}", event.postId(), memberId, e.getMessage());
                notificationService.markPush(event.postId(), memberId, "FAILED");
            }
        }
        log.info("새 글 알림 {}건(푸시 실패 {}건) postId={}", recipients.size(), failed, event.postId());
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

`src/main/java/org/example/push/FakePushSender.java`

```java
package org.example.push;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

// 연습용 가짜 푸시 서버 — 실제 푸시(외부 서버 호출)처럼 "느리고 가끔 실패"하는 상황을 만든다.
// 설정은 운영자 API(PUT /api/admin/fake-push)로 바꾼다. 앱을 다시 띄우면 지연 0·실패 없음으로 돌아간다.
@Component
public class FakePushSender {

    // 요청 스레드(설정 변경)와 알림 스레드(발송)가 함께 읽고 쓰므로 volatile — 설정 한 벌을 통째로 바꾼다
    private volatile Settings settings = new Settings(0, Set.of());

    public void send(Long memberId, String message) {
        Settings current = settings;
        if (current.delayMs() > 0) {
            try {
                Thread.sleep(current.delayMs());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new PushFailedException("발송 중단 memberId=" + memberId);
            }
        }
        if (current.failMemberIds().contains(memberId)) {
            throw new PushFailedException("푸시 서버가 거절했습니다 memberId=" + memberId);
        }
    }

    public Settings update(int delayMs, List<Long> failMemberIds) {
        this.settings = new Settings(delayMs, failMemberIds == null ? Set.of() : Set.copyOf(failMemberIds));
        return settings;
    }

    public record Settings(int delayMs, Set<Long> failMemberIds) {
    }
}
```

</details>

## MyBatis 대체 구현

기본 JPA 스냅숏에서 새 글 알림 저장·수신자 조회·푸시 결과 기록을 MyBatis로 바꾼다. 좋아요·댓글·멘션과 알림 목록·읽음 처리는 선행 JPA 코드를 유지한다. `@Async` 리스너와 짧은 서비스 트랜잭션은 동일하다. 아래 여섯 파일을 기본 스냅숏에 적용한다.

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
<summary>설정 — Mapper XML 위치 — application.yml</summary>

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
<summary>Repository — 기존 JPA 조회·읽음 처리 — NotificationRepository.java</summary>

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
<summary>Service — 비동기 알림 저장·푸시 결과 — NotificationService.java</summary>

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

    // 16-1 새 글 → 팔로워 알림. 16-2부터 @Async 스레드에서 불린다 — 그 스레드엔 이어 갈 트랜잭션이 없으므로
    // 큐 포화로 CallerRunsPolicy가 요청 스레드에서 직접 실행해도 새 트랜잭션이어야 한다.
    // 알림 행을 만들고 푸시 보낼 회원 id를 돌려준다.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<Long> notifyNewPost(Long postId, Long authorId) {
        notificationWriteMapper.insertNewPostForFollowers(postId, authorId, LocalDateTime.now(clock));
        return notificationWriteMapper.findNewPostRecipientIds(postId);
    }

    // 16-2 푸시 결과 — 한 건씩 새 트랜잭션(느린 푸시 호출 동안 커넥션을 붙잡지 않는다)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markPush(Long postId, Long memberId, String status) {
        notificationWriteMapper.updatePushStatus(postId, memberId, status);
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
<summary>MyBatis Mapper — 알림 저장·수신자·푸시 결과 — NotificationWriteMapper.java</summary>

`src/main/java/org/example/notification/NotificationWriteMapper.java`

```java
package org.example.notification;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface NotificationWriteMapper {
    int insertNewPostForFollowers(@Param("postId") Long postId,
                                  @Param("authorId") Long authorId,
                                  @Param("now") LocalDateTime now);

    List<Long> findNewPostRecipientIds(@Param("postId") Long postId);

    int updatePushStatus(@Param("postId") Long postId,
                         @Param("memberId") Long memberId,
                         @Param("status") String status);
}
```

</details>

<details>
<summary>Mapper XML — INSERT SELECT·SELECT·UPDATE — NotificationWriteMapper.xml</summary>

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
    <select id="findNewPostRecipientIds" resultType="long">
        SELECT member_id FROM notification
         WHERE post_id = #{postId} AND type = 'NEW_POST'
         ORDER BY member_id
    </select>
    <update id="updatePushStatus">
        UPDATE notification SET push_status = #{status}
         WHERE post_id = #{postId} AND member_id = #{memberId} AND type = 'NEW_POST'
    </update>
</mapper>
```

</details>

## 직접 확인

회원 3(`tok-p03`)은 팔로워 16명 중 15명이 활동 중이다(회원 28은 정지). 그중 회원 26의 푸시가 실패하게 한다. 회원 1(`tok-p01`)은 운영자다.

가짜 푸시 설정과 게시글 요청은 실행 패널의 T4와 P를 순서대로 보낸다. P 직후 SQL 집계를 확인하고 4초 뒤 다시 확인한다. 이때 `NULL`이 `SENT 14, FAILED 1`로 바뀌어야 한다. API 주소는 페이지 상단 공통 입력을 사용하고 Postman 설정은 접어서 확인할 수 있다.

```bash
sql() { docker compose exec -T mysql mysql -ucommunity -pcommunity practice -N -e "$1" 2>/dev/null; }
sql "SELECT push_status, COUNT(*) FROM notification WHERE post_id = (SELECT MAX(id) FROM post) GROUP BY push_status"  # P 직후 — NULL이 섞여 있다
# 실행 패널에서 지정한 요청을 단독 실행한 뒤 다시 실행한다.
sleep 4
sql "SELECT push_status, COUNT(*) FROM notification WHERE post_id = (SELECT MAX(id) FROM post) GROUP BY push_status"  # 몇 초 뒤 — SENT 14, FAILED 1
```

앱 로그를 보면 `푸시 실패 ... memberId=26`과 `새 글 알림 15건(푸시 실패 1건)`이 요청 스레드(`http-nio-…-exec-…`)가 아니라 `notify-1`에서 찍힌다.

**전후 비교** — `@Async`를 붙이기 전(동기)에 같은 설정으로 글을 쓰면 `Server-Timing`이 `2000`을 넘는다(15명 × 150ms에 결과 기록까지 — 정답 구현에서 `@Async`를 빼고 알림 저장을 `REQUIRES_NEW`로 바꿔 재 보니 2973·5589). 붙인 뒤에는 수십 ms다. 아래 실행 칸의 P 줄 옆에도 걸린 시간(ms)이 보인다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 실행하면 가짜 푸시 설정이 지연 150ms·회원 26 실패로 바뀐 채 남는다.

```check
{
  "requests": [
    {
      "id": "T0",
      "title": "운영자 아님(회원 2)",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "delayMs": 150
      }
    },
    {
      "id": "T1",
      "title": "잘못된 입력 — 지연 -1",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "delayMs": -1
      }
    },
    {
      "id": "T2",
      "title": "잘못된 입력 — 지연 5001, 회원 id 0",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "delayMs": 5001,
        "failMemberIds": [
          0
        ]
      }
    },
    {
      "id": "T3",
      "title": "잘못된 입력 — 숫자 자리에 문자",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "delayMs": "abc"
      }
    },
    {
      "id": "T4",
      "title": "잘못된 입력 — 지연 없음",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "failMemberIds": [
          26
        ]
      }
    },
    {
      "id": "T7",
      "title": "잘못된 입력 — 숫자 문자열은 정수가 아님",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {"Authorization": "Bearer tok-p01"},
      "body": {"delayMs": "150", "failMemberIds": ["26"]}
    },
    {
      "id": "T8",
      "title": "잘못된 입력 — 소수는 정수가 아님",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {"Authorization": "Bearer tok-p01"},
      "body": {"delayMs": 1.5, "failMemberIds": [1.2]}
    },
    {
      "id": "T5",
      "title": "경계값 — 지연 5000",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "delayMs": 5000
      }
    },
    {
      "id": "T6",
      "title": "지연 150ms · 회원 26 실패로 설정",
      "method": "PUT",
      "path": "/api/admin/fake-push",
      "headers": {
        "Authorization": "Bearer tok-p01"
      },
      "body": {
        "delayMs": 150,
        "failMemberIds": [
          26
        ]
      }
    },
    {
      "id": "P",
      "title": "회원 3이 새 글(팔로워 15명에게 푸시)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-2 비동기 알림",
        "content": "푸시를 기다리지 않는다"
      }
    },
    {
      "id": "G",
      "title": "방금 쓴 글 조회",
      "method": "GET",
      "path": "/api/posts/{{P.body.id}}"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "T0",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "T1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "delayMs"
              }
            ]
          }
        },
        {
          "request": "T2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "delayMs"
              },
              {
                "path": "$.errors[*].field",
                "contains": "failMemberIds[0]"
              }
            ]
          }
        },
        {
          "request": "T3",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "T4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "delayMs"
              }
            ]
          }
        },
        {
          "request": "T7",
          "expect": {"status": 400, "json": [
            {"path": "$.errors[*].field", "contains": "delayMs"},
            {"path": "$.errors[*].field", "contains": "failMemberIds[0]"}
          ]}
        },
        {
          "request": "T8",
          "expect": {"status": 400, "json": [
            {"path": "$.errors[*].field", "contains": "delayMs"},
            {"path": "$.errors[*].field", "contains": "failMemberIds[0]"}
          ]}
        }
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "T5",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.delayMs",
                "equals": 5000
              },
              {
                "path": "$.failMemberIds",
                "length": 0
              }
            ]
          }
        },
        {
          "request": "T6",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.delayMs",
                "equals": 150
              },
              {
                "path": "$.failMemberIds",
                "equals": [
                  26
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "request": "P",
      "expect": {
        "status": 201,
        "headers": {
          "Server-Timing": {
            "matches": "^app;dur=\\d{1,3}$"
          }
        }
      }
    },
    {
      "id": "C4",
      "request": "G",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.id",
            "equals": "{{P.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C5",
      "manual": "실행 칸의 P 줄 옆 ms와 Server-Timing 값을 @Async 붙이기 전(16-1 코드)과 비교한다 — 전 2000ms 이상, 후 수십 ms"
    }
  ]
}
```

푸시 결과는 응답보다 **늦게** 생기므로 HTTP 확인(C)으로 보지 않는다. 몇 초 뒤 아래 D 항목으로 본다. C3이 통과해도 D2에 행이 없거나 `NULL`만 있으면 알림이 조용히 실패하고 있는 것이다 — 리스너가 예외를 잡아 삼켰다면 앱 로그에 `새 글 알림 생성 실패`가 남는다.

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | (관찰) P **직후**(2초 안) `SELECT push_status, COUNT(*) FROM notification WHERE post_id = <P의 id> GROUP BY push_status` | `NULL`이 섞여 보인다(아직 보내는 중) — 응답이 푸시를 기다리지 않았다는 증거. 늦게 돌리면 이미 다 채워져 있을 수 있어 필수는 아니다 |
| D2 | 5초 뒤 같은 쿼리 | `SENT 14`, `FAILED 1` — 실패가 있어도 나머지 회원에게 다 보냈다 |
| D3 | `SELECT member_id FROM notification WHERE post_id = <P의 id> AND push_status = 'FAILED'` | `26` |
| D4 | `SELECT version, success FROM flyway_schema_history WHERE version = '71'` | `71`, `1` |
| C1 | T0 / T1~T4 / T7~T8 | `403` / 모두 `400` — `errors`에 `delayMs`(T1·T4), `delayMs`와 `failMemberIds[0]` 둘 다(T2). 문자·문자열·소수(T3·T7·T8)도 `500`이 아니다 |
| C2 | T5 / T6 | 지연 5000(상한 바로 안쪽)은 `200`·`failMemberIds` 빈 배열(기본값) / 설정이 그대로 돌아온다 |
| C3 | P | `201`, `Server-Timing`이 `app;dur=` + 1000 미만 — 15명 × 150ms를 기다리지 않았다 |
| C4 | G | 글이 저장돼 있다(회원 26 푸시 실패와 무관) |
| C5 | 수동 | 실행 칸에 보이는 ms를 동기 때와 비교 |
| R1 | 스레드 | `@Async`에 **이름 붙인 실행기**를 쓴다. 풀 크기·큐·넘칠 때 동작(거절 정책)을 정했고, 왜 그 값인지 말할 수 있다 |
| R2 | 실패 격리 | 회원 한 명의 푸시 예외가 반복문 전체를 멈추지 않는다. `void` `@Async` 메서드에서 잡지 않은 예외는 호출자에게 가지 않는다는 것(기본 핸들러가 로그 한 줄만 남긴다 — 어느 회원이 못 받았는지는 기록해야 안다)을 안다 |
| R3 | 커넥션 | 느린 푸시를 `@Transactional` 안에서 기다리지 않는다. 알림 저장과 결과 기록만 짧은 트랜잭션이다 |
| R4 | 한계 | 서버가 푸시를 다 보내기 전에 꺼지면 남은 알림은 `NULL`로 남는다는 것, 반드시 보내야 하면 아웃박스·메시지 큐가 필요하다는 것을 설명할 수 있다 |

## 필요한 지식

- [S15 — @Async: 프록시가 실행기에 제출](../../docs/knowledge/S15-async-scheduling-batch.md#31-async-프록시가-실행기에-제출)
- [S15 — 예제 2 업무별 제한이 있는 @Async 실행기](../../docs/knowledge/S15-async-scheduling-batch.md#예제-2--업무별-제한이-있는-async-실행기)
- [W14 — 예제 3 @Async로 best-effort 후처리](../../docs/knowledge/W14-sync-async-blocking.md#예제-3--async로-best-effort-후처리)
- [W25 — @Async로 실행한 작업은 호출한 트랜잭션에 포함되는가?](../../docs/knowledge/W25-spring-multithreading.md#q7-async로-실행한-작업은-호출한-트랜잭션에-포함되는가)
- [S08 — 아웃박스: DB 커밋과 메시지 전달 사이를 메우기](../../docs/knowledge/S08-transactions.md#아웃박스-db-커밋과-메시지-전달-사이를-메우기)
- [F3 CORS](../../lessons/F3-cors.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 실행기 빈</summary>

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "notificationExecutor")
    public ThreadPoolTaskExecutor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setThreadNamePrefix("notify-");
        executor.initialize();
        return executor;
    }
}
```

큐가 다 차기 전에는 core 수(2)를 넘겨 스레드를 늘리지 않는다. max만 키워서는 동시에 도는 수가 늘지 않는다.
</details>

<details>
<summary>힌트 2 — 붙였는데 여전히 느리다</summary>

- `@Async`는 프록시가 가로챈다. 같은 클래스 안에서 `this.method()`로 부르면 프록시를 거치지 않아 그냥 동기로 돈다. 리스너 메서드에 직접 붙이면 이벤트 시스템이 프록시를 통해 부른다.
- `@EnableAsync`가 없으면 애너테이션이 조용히 무시된다.
- 로그의 스레드 이름이 `notify-1`인지 본다. `http-nio-…-exec-…`면 아직 동기다.
</details>

<details>
<summary>힌트 3 — Server-Timing이 실행 칸에서 안 보인다</summary>

Postman에는 보이는데 브라우저 실행 칸에서만 "없음"이면 CORS다. 브라우저는 `exposedHeaders`에 없는 응답 헤더를 스크립트에 보여 주지 않는다. `CorsConfig`의 `exposedHeaders(...)`에 `"Server-Timing"`을 더한다.
</details>

## 다음 단계

[16-3. 인기글 캐시 — 60초 동안 재사용, 숨기면 바로 빼기](16-3-popular-cache.md)
