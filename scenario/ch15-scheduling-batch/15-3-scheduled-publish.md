# 15-3. 예약 발행 — 1분마다 도는 상태 전이 배치

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다. "지금" = 2026-10-05 00:00.

## 상황

> "글을 써 두고 '내일 아침 9시에 올려 줘'를 할 수 있게 해 주세요. 그 전에는 저만 보이고, 9시가 되면 자동으로 게시판에 떠야 해요."

글에 새 상태 `SCHEDULED`가 생긴다. 예약 글은 `DRAFT`처럼 작성자만 볼 수 있고, 1분마다 도는 배치가 "예약 시각이 지난 `SCHEDULED` 글"을 찾아 `PUBLISHED`로 바꾼다. 이런 배치를 **상태 전이 배치**라고 한다. 지켜야 할 규칙은 두 가지다. 정해진 전이(`SCHEDULED → PUBLISHED`)만 일어나야 하고, 두 번 돌아도 결과가 같아야 한다.

문제가 하나 있다. practice의 시계는 2026-10-05 00:00에 멈춰 있다. 예약은 "지금보다 뒤"만 받으므로 예약 시각은 영원히 오지 않는다. 그래서 수동 실행은 `at`(기준 시각)을 받아 "이 시각이 됐다고 치고" 돌린다. 운영에서는 시계가 흐르므로 `at` 없이 돈다.

> 11-1의 `status`(`DRAFT`/`PUBLISHED`)와 겹친다. 예약은 그 자체로 상태라서 `status`와 `publishAt`이 같이 오면 `400`(`errors`에 `publishAt`)으로 막는다. 예약 글은 임시저장이 아니므로 11-1의 발행 API(`POST /api/posts/{id}/publish`)는 `409`, 내 임시저장 목록(`GET /api/me/drafts`)에도 나오지 않는다(C9).

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 예약 발행",
  "summary": "발행 시각을 정해 두면 글은 SCHEDULED로 숨어 있다가, 1분마다 도는 배치가 시각이 된 글을 PUBLISHED로 바꾼다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글쓰기",
      "right": "코딩하는고양이"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "10월 회고"
    },
    {
      "type": "field",
      "id": "publish-at",
      "label": "예약 발행(선택)",
      "value": "2026-10-05 09:00"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "예약하기",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "list",
      "id": "mine",
      "label": "내 글",
      "items": [
        {
          "id": "m1",
          "title": "10월 회고",
          "badge": "예약 09:00",
          "tone": "warning"
        }
      ]
    },
    {
      "type": "list",
      "id": "board",
      "label": "자유 게시판(다른 사람이 보는 목록)",
      "items": [
        {
          "id": "b1",
          "title": "10월 회고",
          "meta": "2026-10-05 09:00 발행"
        }
      ]
    },
    {
      "type": "code",
      "id": "log",
      "label": "서버 로그",
      "value": "INFO 예약 발행 at=2026-10-05T09:00 1건 ids=[151]"
    }
  ],
  "flows": [
    {
      "name": "예약하기",
      "steps": [
        {
          "kind": "user",
          "text": "발행 시각 09:00을 넣고 [예약하기]",
          "focus": [
            "publish-at",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p02",
            "Content-Type: application/json"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"10월 회고\", \"content\": \"…\", \"publishAt\": \"2026-10-05T09:00:00\"}"
        },
        {
          "kind": "server",
          "text": "지금(Clock) 2026-10-05 00:00보다 뒤이고 30일 안쪽인지 확인 → status=SCHEDULED, published_at은 비워 둔다"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/151"
          ],
          "body": "{\"id\": 151, \"status\": \"SCHEDULED\", \"publishAt\": \"2026-10-05T09:00:00\", \"publishedAt\": null, …}"
        },
        {
          "kind": "screen",
          "text": "내 글에는 '예약' 표시, 게시판 목록·남의 상세에는 아직 없다(404)",
          "focus": [
            "m1"
          ]
        }
      ]
    },
    {
      "name": "1분마다 도는 배치",
      "steps": [
        {
          "kind": "server",
          "text": "예약 실행(cron 0 * * * * *) — 운영자는 '그 시각이 됐다고 치고' 수동 실행할 수 있다"
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00",
          "headers": [
            "Authorization: Bearer tok-p01"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT * FROM post WHERE status = 'SCHEDULED' AND publish_at <= '2026-10-05 09:00:00' AND deleted_at IS NULL ORDER BY publish_at, id LIMIT 500",
          "note": "인덱스 (status, publish_at)"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET status = 'PUBLISHED', published_at = publish_at, updated_at = ? WHERE id = 151",
          "note": "SCHEDULED → PUBLISHED만. 발행 시각 = 예약 시각"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"at\": \"2026-10-05T09:00:00\", \"published\": [{\"postId\": 151, \"title\": \"10월 회고\", \"publishedAt\": \"2026-10-05T09:00:00\"}]}"
        },
        {
          "kind": "screen",
          "text": "게시판 목록에 나타나고 로그에 처리 건수",
          "focus": [
            "b1",
            "log"
          ]
        }
      ]
    },
    {
      "name": "지난 시각으로 예약",
      "steps": [
        {
          "kind": "user",
          "text": "발행 시각에 지금(00:00)을 넣는다",
          "focus": [
            "publish-at"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p02",
            "Content-Type: application/json"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"…\", \"content\": \"…\", \"publishAt\": \"2026-10-05T00:00:00\"}"
        },
        {
          "kind": "response",
          "status": 400,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\"status\": 400, \"errors\": [{\"field\": \"publishAt\", \"message\": \"예약 시각은 지금(2026-10-05T00:00)보다 뒤여야 합니다.\"}]}"
        },
        {
          "kind": "screen",
          "text": "예약 칸 아래 빨간 글씨",
          "focus": [
            "publish-at"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V62** — `db/migration/V62__add_post_publish_at.sql`

| 변경 | 내용 |
|---|---|
| 상태 | `ck_post_status`에 `SCHEDULED` 추가. CHECK는 고칠 수 없어서 `DROP CHECK` 후 다시 만든다(`SHOW CREATE TABLE post`로 지금 목록부터 확인) |
| `publish_at` | `DATETIME NULL` — 예약 시각. `SCHEDULED`면 반드시 있다(`CHECK (status <> 'SCHEDULED' OR publish_at IS NOT NULL)`) |
| 인덱스 | `(status, publish_at)` — 배치의 조회 조건 그대로 |

**글쓰기·조회**

| 항목 | 내용 |
|---|---|
| 작성 | `POST /api/posts`에 선택 필드 `publishAt`. 있으면 `status=SCHEDULED`, `published_at`은 비워 둔다. 없으면 지금처럼 바로 `PUBLISHED` |
| 지금 | 작성 시각과 예약 판단 모두 `Clock`(8-2)에서 얻는다. 초로 자른다(13-5) |
| 13-5 도배 방지 | 작성 시각을 `Clock`으로 바꾸면 도배 방지 창도 같은 `Clock`으로 센다(13-5 R1 — 시계를 섞지 않는다). 그런데 practice는 시계가 멈춰 있어 "1분"이 영원히 지나지 않는다 — 그대로 두면 회원마다 글 5개 뒤로 영원히 `429`다. 그래서 고정 시계(`app.fixed-now`가 있을 때)면 도배 방지 검사를 건너뛴다. 도배 방지는 시계가 흐르는 community에서 확인한다 |
| 보기 | 예약 글은 `DRAFT`와 같다 — 상세는 작성자만(남은 `404`), 게시판 목록·검색에는 안 나온다. 2-3의 규칙 클래스(`PostAccessPolicy`)에 한 줄 |
| 응답 | 작성·상세 응답에 `status`, `publishAt`, `publishedAt` |

**필드 규칙** — `POST /api/posts`(1-5의 규칙은 그대로, `publishAt`만 새로)

| 필드 | 필수 | null·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `publishAt` | 아니오 | `null`·생략 = 바로 발행. **`""`·`"   "`는 400**(바로 발행으로 넘어가지 않는다) | 지금보다 **뒤**(같은 시각은 안 됨) ~ 지금 + 30일(그 시각은 됨) | `yyyy-MM-ddTHH:mm:ss`(`"내일 9시"`는 400) | 없음 | `400`, `errors[].field = "publishAt"` |

`""`·`"   "`와 초를 생략한 시각, 소수초, JSON 배열이 함정이다. `publishAt`을 `JsonNode`로 받아 원문 타입을 보존하고, `StrictDateTimes`에서 정확히 초까지 있는 문자열인지 확인한다.

null·생략만 바로 발행이다. 형식과 범위 오류는 서비스에서 1-5와 같은 `errors.publishAt` 모양으로 던진다. 수동 실행의 `at`도 문자열을 같은 파서로 검사하며 생략·빈 값·공백은 고정 시계의 지금을 쓴다.

**배치**

| 항목 | 내용 |
|---|---|
| 예약 실행 | `@Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")` — 매분 0초. 기준 시각 = `LocalDateTime.now(clock)` |
| 수동 실행 | `POST /api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00` — 운영자만. 같은 서비스 메서드 |
| 대상 | `status = 'SCHEDULED' AND publish_at <= at AND deleted_at IS NULL` — 예약 시각 **그 순간**부터 발행 |
| 바꾸는 것 | `status → PUBLISHED`, `published_at = publish_at`(배치가 돈 시각이 아니라 예약한 시각), `updated_at` |
| 한 번에 | 최대 500건. 남은 건 다음 분에 |
| 로그 | 발행한 건수와 id를 INFO로. 0건이면 남기지 않거나 DEBUG — 매분 도는 배치라 하루 1,440줄이 쌓인다 |
| 응답 | `{ "at": "…", "published": [ { "postId", "title", "publishedAt" } ] }` — 이번에 발행한 글만 |

| 파라미터 | 필수 | 생략·빈 값 | 범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `at`(실행) | 아니오 | 생략·빈 값·공백이면 지금 | 지금 + 30일까지(예약을 30일 안쪽만 받으므로) | `yyyy-MM-ddTHH:mm:ss`(`2026-10-05`처럼 날짜만은 400) | 지금 | `400`, `errors[].field = "at"` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 지금(Clock) 2026-10-05 00:00보다 뒤이고 30일 안쪽인지 확인 → status=SCHEDULED, published_at은 비워 둔다
- 예약 실행(cron 0 * * * * *) — 운영자는 '그 시각이 됐다고 치고' 수동 실행할 수 있다
- 인덱스 (status, publish_at)
- SCHEDULED → PUBLISHED만. 발행 시각 = 예약 시각

<details>
<summary>Controller — HTTP 연결</summary>

`ScheduledPublishController.java`, `PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/admin/jobs/scheduled-publish/run")`. 변경된 메서드: `run`.

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
    private final Clock clock;

    public ScheduledPublishController(ScheduledPublishService scheduledPublishService, Clock clock) {
        this.scheduledPublishService = scheduledPublishService;
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
        return scheduledPublishService.publishDue(effectiveAt);
    }
}
```

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
        log.info("게시글 작성 요청 제목: {}", request.title());

        Post post = postService.create(loginMember.id(), request);
        PostResponse response = toResponse(post);

        return ResponseEntity.created(URI.create("/api/posts/" + post.getId())).body(response);
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

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`ScheduledPublishResponse.java`, `PostCreateRequest.java`, `PostDetailResponse.java`, `PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/batch/ScheduledPublishResponse.java`

```java
package org.example.batch;

import java.time.LocalDateTime;
import java.util.List;

public record ScheduledPublishResponse(LocalDateTime at, List<PublishedPost> published) {
}
```

`src/main/java/org/example/post/PostCreateRequest.java`

```java
package org.example.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

import java.util.List;

// 게시글 작성 요청 — Bean Validation으로 저장 전에 막는다
public record PostCreateRequest(
        @NotBlank(message = "게시판을 선택해 주세요.")
        String boardSlug,

        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
        String title,

        @NotBlank(message = "본문을 입력해 주세요.")
        String content,

        @Size(max = 5, message = "태그는 5개까지입니다.")
        List<@NotNull @Size(min = 1, max = 30, message = "태그 이름은 1~30자여야 합니다.") String> tags,

        @Pattern(regexp = "PUBLIC|FOLLOWERS", message = "공개 범위는 PUBLIC 또는 FOLLOWERS여야 합니다.")
        String visibility,

        // 11-1 임시저장 — 생략하면 PUBLISHED(바로 발행)
        @Pattern(regexp = "DRAFT|PUBLISHED", message = "상태는 DRAFT 또는 PUBLISHED여야 합니다.")
        String status,

        // 11-2 먼저 올려 둔 이미지(POST /api/images)의 id — 이 글에 붙인다
        JsonNode imageIds,

        // 15-3 예약 발행 시각(선택) — 있으면 SCHEDULED로 저장. "지금보다 뒤 ~ 30일 안" 규칙은 지금(Clock)이
        // 필요해서 애노테이션이 아니라 PostService에서 확인한다. 원문 타입·형식도 서비스에서 400(errors에 publishAt)으로 막는다.
        // JsonNode로 원문 타입을 보존한다. 배열·숫자·빈 문자열도 모두 명시적으로 400 처리한다.
        JsonNode publishAt
) {
}
```

`src/main/java/org/example/post/PostDetailResponse.java`

```java
package org.example.post;

import java.time.LocalDateTime;
import java.util.List;

// 게시글 상세 조회 응답 — 작성 응답(PostResponse)과 달리 조회수·좋아요·댓글 수를 포함한다
public record PostDetailResponse(
        Long id,
        String boardSlug,
        String title,
        String content,
        List<String> tags,
        String visibility,
        AuthorResponse author,
        Integer viewCount,
        Integer likeCount,
        Integer commentCount,
        List<ImageResponse> images,
        // 15-3
        String status,
        LocalDateTime publishAt,
        LocalDateTime publishedAt,
        LocalDateTime createdAt
) {
}
```

`src/main/java/org/example/post/PostResponse.java`

```java
package org.example.post;

import java.time.LocalDateTime;
import java.util.List;

// 게시글 작성 응답 전용 DTO — 요청 DTO나 엔티티를 그대로 돌려주지 않는다
public record PostResponse(
        Long id,
        String boardSlug,
        String title,
        String content,
        List<String> tags,
        String visibility,
        AuthorResponse author,
        // 15-3 상태와 예약·발행 시각(예약 글은 publishedAt이 null, 발행 뒤에는 publishedAt = 예약 시각)
        String status,
        LocalDateTime publishAt,
        LocalDateTime publishedAt,
        LocalDateTime createdAt
) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`ScheduledPublishService.java`, `PostAccessPolicy.java`, `PostQueryService.java`, `PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `publishDue`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/batch/ScheduledPublishService.java`

```java
package org.example.batch;

import org.example.post.Post;
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
    private final Clock clock;

    public ScheduledPublishService(ScheduledPublishRepository scheduledPublishRepository, Clock clock) {
        this.scheduledPublishRepository = scheduledPublishRepository;
        this.clock = clock;
    }

    @Transactional
    public ScheduledPublishResponse publishDue(LocalDateTime at) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<PublishedPost> published = new ArrayList<>();
        for (Post post : scheduledPublishRepository.findDue(at, PageRequest.of(0, BATCH_LIMIT))) {
            if (scheduledPublishRepository.publishIfDue(post.getId(), at, now) == 1) {
                published.add(new PublishedPost(post.getId(), post.getTitle(), post.getPublishAt()));
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

`src/main/java/org/example/post/PostAccessPolicy.java`

```java
package org.example.post;

import org.example.admin.Permission;
import org.example.admin.Role;
import org.example.auth.AuthenticatedMember;
import org.example.social.BlockPolicy;
import org.example.social.FollowRepository;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.function.Predicate;

// "이 사람이 이 글을 볼 수 있나" 규칙을 한 곳에 모은다.
// 상세(GET /api/posts/{id})는 이 자바 코드로 판정하고, 목록(게시판 목록)은
// 같은 조건을 PostSearchRepository.viewable()의 쿼리 조건으로 옮겨 건다(2-2 게시판 목록·8-4 검색 공용).
// 규칙을 바꿀 때는 두 곳을 같이 고쳐야 한다.
@Component
public class PostAccessPolicy {

    private static final String PUBLISHED = "PUBLISHED";
    private static final String DRAFT = "DRAFT";
    private static final String SCHEDULED = "SCHEDULED";
    private static final String HIDDEN = "HIDDEN";
    private static final String PUBLIC = "PUBLIC";
    private static final String FOLLOWERS = "FOLLOWERS";

    private final FollowRepository followRepository;
    private final BlockPolicy blockPolicy;

    public PostAccessPolicy(FollowRepository followRepository, BlockPolicy blockPolicy) {
        this.followRepository = followRepository;
        this.blockPolicy = blockPolicy;
    }

    // 글 하나를 판정한다 — 팔로우·차단은 필요할 때만 그 자리에서 조회한다
    public boolean canView(AuthenticatedMember viewer, Post post) {
        return canView(viewer, post,
                authorId -> followRepository.existsByFollower_IdAndFollowee_Id(viewer.id(), authorId),
                authorId -> blockPolicy.isBlockedEitherWay(viewer.id(), authorId));
    }

    // 여러 글을 한꺼번에 판정할 때(6-3 북마크 목록) — 같은 규칙을 쓰되 팔로우·차단 정보를
    // 미리 한 번에 읽어 두고 메모리에서 판정한다(항목마다 쿼리를 보내지 않는다).
    public Predicate<Post> viewableBy(AuthenticatedMember viewer) {
        Set<Long> followees = viewer == null ? Set.of() : Set.copyOf(followRepository.findFolloweeIds(viewer.id()));
        Set<Long> blocked = viewer == null ? Set.of() : blockPolicy.blockRelatedIds(viewer.id());
        return post -> canView(viewer, post, followees::contains, blocked::contains);
    }

    // follows/blocked는 viewer가 있을 때만 호출된다
    private boolean canView(AuthenticatedMember viewer, Post post,
                            Predicate<Long> follows, Predicate<Long> blocked) {
        // 1. 삭제된 글은 작성자 본인도 못 본다
        if (post.getDeletedAt() != null) {
            return false;
        }

        Long viewerId = viewer == null ? null : viewer.id();
        Long authorId = post.getAuthor().getId();
        boolean isAuthor = viewerId != null && viewerId.equals(authorId);
        // 13-1: "운영자인가"가 아니라 "숨김 글을 다룰 권한이 있나"(ADMIN·MODERATOR)
        boolean isAdmin = viewer != null && Role.has(viewer.role(), Permission.MODERATE_POST);

        // 2. 상태별 허용 — DRAFT는 작성자만, HIDDEN은 운영 권한(ADMIN·MODERATOR)만
        boolean statusOk = switch (post.getStatus()) {
            case PUBLISHED -> true;
            case DRAFT, SCHEDULED -> isAuthor; // 15-3 예약 글도 발행 전에는 작성자만
            case HIDDEN -> isAdmin;
            default -> false;
        };
        if (!statusOk) {
            return false;
        }

        // 3. PUBLISHED + FOLLOWERS 공개는 작성자 본인이거나 팔로워만
        if (PUBLISHED.equals(post.getStatus()) && FOLLOWERS.equals(post.getVisibility()) && !isAuthor) {
            if (viewerId == null || !follows.test(authorId)) {
                return false;
            }
        }

        // 4. 둘 사이에 차단이 있으면(어느 쪽이 차단했든) 못 본다
        if (viewerId != null && !isAuthor && blocked.test(authorId)) {
            return false;
        }

        // 5. 발행 글의 공개 범위가 알려진 값인지 검사한다.
        // 비로그인과 일반 열람자는 PUBLIC 또는 위에서 확인한 FOLLOWERS만 볼 수 있다.
        // DB에 PRIVATE/알 수 없는 값이 들어와도 공개로 취급하지 않는다.
        if (PUBLISHED.equals(post.getStatus()) && !isAuthor
                && !PUBLIC.equals(post.getVisibility())
                && !FOLLOWERS.equals(post.getVisibility())) {
            return false;
        }
        return true;
    }
}
```

`src/main/java/org/example/post/PostQueryService.java`

```java
package org.example.post;

import org.example.auth.AuthenticatedMember;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.member.MemberRepository;
import org.example.common.Cursor;
import org.example.recent.RecentViewService;
import org.example.tag.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// 글 조회 전용 서비스 — 1-3/1-4의 PostService(쓰기)와 책임을 나눈다
@Service
public class PostQueryService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final PostSearchRepository postSearchRepository;
    private final PostViewRepository postViewRepository;
    private final Clock clock;
    private final RecentViewService recentViewService;

    public PostQueryService(PostRepository postRepository, BoardRepository boardRepository,
                             MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                             PostSearchRepository postSearchRepository, PostViewRepository postViewRepository,
                             Clock clock, RecentViewService recentViewService) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.postSearchRepository = postSearchRepository;
        this.postViewRepository = postViewRepository;
        this.clock = clock;
        this.recentViewService = recentViewService;
    }

    @Transactional(readOnly = true)
    public List<PostHeadlineResponse> listPublicByAuthor(Long memberId, String boardSlug) {
        if (!memberRepository.existsById(memberId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        return postRepository.findPublicPostsByAuthorAndBoard(memberId, boardSlug).stream()
                .map(post -> new PostHeadlineResponse(
                        post.getId(), post.getTitle(),
                        post.getAuthor().getNickname(), boardSlug))
                .toList();
    }

    @Transactional
    public PostDetailResponse getDetail(Long id, AuthenticatedMember viewer) {
        // 접근 권한도 잠금 이후의 최신 상태로 판단한다(삭제·공개 범위 변경과의 경합).
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);

        // 볼 수 없으면 403이 아니라 404 — 글이 있다는 사실도 숨긴다. 조회수도 올리지 않는다.
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }

        // post_view의 회원 FK 공유 잠금보다 회원별 최근 기록의 쓰기 잠금을 먼저 잡아 교착을 막는다.
        if (viewer != null) {
            memberRepository.findByIdForUpdate(viewer.id()).orElseThrow();
        }

        // post_view INSERT와 post 카운터 UPDATE의 잠금 순서는 위 글 행 잠금으로 고정된다.
        if (shouldCountView(viewer, post)) {
            postRepository.incrementViewCount(id);
        }
        // 벌크 UPDATE는 관리 엔티티의 viewCount를 갱신하지 않으므로 DB에서 현재 값을 다시 읽는다.
        int viewCount = postRepository.findViewCountById(id);
        // 14-5: 로그인한 사람이 볼 수 있는 글을 열었을 때만 "최근 본 글"에 남긴다(404면 여기까지 오지 않는다)
        if (viewer != null) {
            recentViewService.record(viewer.id(), post.getId());
        }
        return toDetailResponse(post, viewCount);
    }

    // 11-3 조회수를 셀까? — 비로그인은 누군지 몰라 매번 센다, 작성자 본인은 안 센다,
    // 로그인 회원은 그 글을 오늘 처음 볼 때만(post_view에 오늘 행이 새로 생겼을 때만) 센다.
    private boolean shouldCountView(AuthenticatedMember viewer, Post post) {
        if (viewer == null) {
            return true;
        }
        if (viewer.id().equals(post.getAuthor().getId())) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now(clock);
        return postViewRepository.insertIfAbsent(post.getId(), viewer.id(), now.toLocalDate(), now) == 1;
    }

    // 2-2 게시판 목록 — 8-4 조합 검색에서 "게시판" 조건만 있는 경우와 같다(같은 쿼리 조립기를 쓴다)
    @Transactional(readOnly = true)
    public PostListResponse list(String boardSlug, int page, int size, AuthenticatedMember viewer) {
        Board board = boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        return toListResponse(postSearchRepository.search(
                PostSearchCondition.ofBoard(board.getId()), viewerIdOf(viewer), PageRequest.of(page, size)));
    }

    // 8-4 조합 검색 — 들어온 조건만 붙는다. 없는 게시판·없는 태그는 결과 0건(200)
    @Transactional(readOnly = true)
    public PostListResponse search(String boardSlug, String tag, Long authorId, LocalDate from, LocalDate to,
                                   String q, int page, int size, AuthenticatedMember viewer) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidSearchConditionException("from이 to보다 늦을 수 없습니다.");
        }
        PageRequest pageRequest = PageRequest.of(page, size);
        Long boardId = null;
        if (boardSlug != null && !boardSlug.isBlank()) {
            Board board = boardRepository.findBySlug(boardSlug).orElse(null);
            if (board == null) {
                return toListResponse(Page.empty(pageRequest));
            }
            boardId = board.getId();
        }
        PostSearchCondition condition = new PostSearchCondition(boardId, tag, authorId, from, to, q, null, null);
        return toListResponse(postSearchRepository.search(condition, viewerIdOf(viewer), pageRequest));
    }

    // 11-4 통합 검색 — 검색어를 정리·검사한 뒤 8-4와 같은 쿼리 조립기(볼 수 있는 글 규칙 포함)에 넘긴다
    @Transactional(readOnly = true)
    public PostListResponse keywordSearch(KeywordSearchRequest request, AuthenticatedMember viewer) {
        return toListResponse(postSearchRepository.search(
                PostSearchCondition.ofKeywords(request.words(), request.scope()),
                viewerIdOf(viewer), PageRequest.of(request.page(), request.size())));
    }

    // 12-5 팔로잉 피드 — size+1개를 읽어 다음 묶음이 있는지 정한다(4-3·6-3과 같은 커서)
    @Transactional(readOnly = true)
    public FeedResponse feed(AuthenticatedMember me, int size, String cursor) {
        Cursor after = Cursor.decode(cursor);
        List<Post> rows = postRepository.findFeed(me.id(),
                after == null ? null : after.at(), after == null ? null : after.id(),
                PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<Post> page = hasNext ? rows.subList(0, size) : rows;
        String nextCursor = null;
        if (hasNext) {
            Post last = page.get(page.size() - 1);
            nextCursor = new Cursor(last.getPublishedAt(), last.getId()).encode();
        }
        return new FeedResponse(page.stream().map(this::toListItem).toList(), nextCursor);
    }

    // 14-7 월별 아카이브 — 게시판의 연·월별 글 수(최신 달부터). 보는 사람 기준(2-3)으로 센다
    @Transactional(readOnly = true)
    public ArchiveResponse archive(String boardSlug, AuthenticatedMember viewer) {
        Board board = boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        return new ArchiveResponse(postSearchRepository.archive(PostSearchCondition.ofBoard(board.getId()), viewerIdOf(viewer)));
    }

    // 14-7 한 달의 글 목록 — 8-4 조합 검색의 from·to와 같은 범위 조건 [1일 00:00, 다음 달 1일 00:00)
    @Transactional(readOnly = true)
    public PostListResponse month(String boardSlug, int year, int month, int page, int size, AuthenticatedMember viewer) {
        Board board = boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        YearMonth ym = YearMonth.of(year, month);
        PostSearchCondition condition = new PostSearchCondition(board.getId(), null, null, ym.atDay(1), ym.atEndOfMonth(), null, null, null);
        return toListResponse(postSearchRepository.search(condition, viewerIdOf(viewer), PageRequest.of(page, size)));
    }

    // 14-6 관련 글 — 기준 글을 볼 수 있어야 하고(404), 후보는 보는 사람 기준(2-3)으로 다시 거른다
    @Transactional(readOnly = true)
    public RelatedPostsResponse related(Long postId, int size, AuthenticatedMember viewer) {
        Post base = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, base)) {
            throw new PostNotFoundException();
        }
        List<RelatedPostRow> candidates = postRepository.findRelatedCandidates(postId);
        Map<Long, Post> posts = postRepository.findAllById(candidates.stream().map(RelatedPostRow::getPostId).toList())
                .stream().collect(Collectors.toMap(Post::getId, Function.identity()));
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        List<RelatedPostsResponse.Item> items = candidates.stream()
                .filter(row -> posts.containsKey(row.getPostId()) && viewable.test(posts.get(row.getPostId())))
                .limit(size)
                .map(row -> new RelatedPostsResponse.Item(row.getPostId(), posts.get(row.getPostId()).getTitle(), row.getShared()))
                .toList();
        return new RelatedPostsResponse(items);
    }

    private PostListResponse toListResponse(Page<PostListRow> result) {
        List<Long> ids = result.getContent().stream().map(PostListRow::id).toList();
        Map<Long, List<String>> tags = postSearchRepository.findTagsByPostIds(ids).stream()
                .collect(Collectors.groupingBy(PostTagRow::postId,
                        Collectors.mapping(PostTagRow::name, Collectors.toList())));
        List<PostListItemResponse> items = result.getContent().stream()
                .map(row -> toListItem(row, tags.getOrDefault(row.id(), List.of())))
                .toList();
        return new PostListResponse(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                (long) result.getNumber() * result.getSize() + items.size() < result.getTotalElements()
        );
    }

    private Long viewerIdOf(AuthenticatedMember viewer) {
        return viewer == null ? null : viewer.id();
    }

    private PostListItemResponse toListItem(PostListRow post, List<String> tags) {
        return new PostListItemResponse(
                post.id(),
                post.title(),
                post.excerpt(),
                new AuthorResponse(post.authorId(), post.authorNickname()),
                tags,
                post.likeCount(),
                post.commentCount(),
                post.viewCount(),
                post.publishedAt()
        );
    }

    private PostListItemResponse toListItem(Post post) {
        return new PostListItemResponse(
                post.getId(),
                post.getTitle(),
                post.getExcerpt(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getTags().stream().map(Tag::getName).sorted().toList(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getViewCount(),
                post.getPublishedAt()
        );
    }

    private PostDetailResponse toDetailResponse(Post post, int viewCount) {
        // 트랜잭션 안에서 지연 로딩 연관을 읽어 DTO로 옮긴다(open-in-view: false)
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                post.getTags().stream().map(Tag::getName).sorted().toList(),
                post.getVisibility(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                viewCount,
                post.getLikeCount(),
                post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(),
                post.getPublishAt(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
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
import org.example.tag.Tag;
import org.example.tag.TagRepository;
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

    // 15-3 예약은 30일 안쪽만 받는다
    private static final int MAX_SCHEDULE_DAYS = 30;

    public PostService(PostRepository postRepository, BoardRepository boardRepository,
                        MemberRepository memberRepository, TagRepository tagRepository,
                        PostAccessPolicy accessPolicy, PostImageRepository postImageRepository, Clock clock,
                        PostRevisionRepository revisionRepository, ContentFilter contentFilter,
                        PostRateLimiter rateLimiter) {
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
        // 트랜잭션(영속성 컨텍스트) 안에서 지연 로딩 연관을 미리 읽어 둔다.
        // open-in-view: false라서 컨트롤러가 트랜잭션 밖에서 건드리면 LazyInitializationException이 난다.
        saved.getAuthor().getNickname();
        saved.getTags().forEach(Tag::getName);
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

`ScheduledPublishRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/batch/ScheduledPublishRepository.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduledPublishRepository extends Repository<Post, Long> {

    // SCHEDULED이고 예약 시각이 기준 시각 "이하"(그 시각이 되면 발행)인 글 — 인덱스 (status, publish_at)
    @Query("""
            SELECT p FROM Post p
             WHERE p.status = 'SCHEDULED' AND p.publishAt <= :at AND p.deletedAt IS NULL
             ORDER BY p.publishAt ASC, p.id ASC
            """)
    List<Post> findDue(@Param("at") LocalDateTime at, Pageable pageable);

    // 동시 수동·정기 실행에서도 실제로 상태를 바꾼 요청만 1을 받는다.
    @Modifying
    @Query("""
            UPDATE Post p SET p.status = 'PUBLISHED', p.publishedAt = p.publishAt, p.updatedAt = :now
             WHERE p.id = :id AND p.status = 'SCHEDULED'
               AND p.publishAt <= :at AND p.deletedAt IS NULL
            """)
    int publishIfDue(@Param("id") Long id, @Param("at") LocalDateTime at, @Param("now") LocalDateTime now);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `scheduled`, `publishScheduled`.

`src/main/java/org/example/post/Post.java`

```java
package org.example.post;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.example.board.Board;
import org.example.image.PostImage;
import org.example.member.Member;
import org.example.tag.Tag;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

// post 테이블 엔티티 — like_count·comment_count는 목록 성능용 비정규화 컬럼
@Entity
@Table(name = "post")
public class Post {

    private static final int EXCERPT_LENGTH = 100;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member author;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    // 9-3 목록용 요약 — 본문 앞 100자. 본문이 바뀌는 곳(생성자·changeContent)에서만 계산한다
    @Column(nullable = false, length = 120)
    private String excerpt;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String visibility;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // 15-3 예약 발행 시각 — SCHEDULED일 때만 값이 있다
    @Column(name = "publish_at")
    private LocalDateTime publishAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 11-5 지운 회원 id(V22). 이 컬럼 전에 지운 글은 null
    @Column(name = "deleted_by")
    private Long deletedBy;

    // 13-1 누가·언제 숨겼나(V41). 숨김이 아니면 둘 다 null
    @Column(name = "hidden_at")
    private LocalDateTime hiddenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hidden_by")
    private Member hiddenBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "post_tag",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new LinkedHashSet<>();

    // 11-2 첨부 이미지 — 연결은 post_image.post_id가 갖는다(주인은 PostImage). 올린 순서(id)대로
    @OneToMany(mappedBy = "post")
    @OrderBy("id")
    private List<PostImage> images = new ArrayList<>();

    protected Post() {
        // JPA
    }

    public Post(Board board, Member author, String title, String content,
                String status, String visibility, LocalDateTime now) {
        this.board = board;
        this.author = author;
        this.title = title;
        this.content = content;
        this.excerpt = excerptOf(content);
        this.status = status;
        this.visibility = visibility;
        this.viewCount = 0;
        this.likeCount = 0;
        this.commentCount = 0;
        // 11-1 임시저장 글은 아직 발행되지 않았다 — 발행 시각은 publish()에서 채운다
        this.publishedAt = "PUBLISHED".equals(status) ? now : null;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // 15-3 예약 글 — 발행 시각(published_at)은 비워 두고 예약 시각만 적는다. 목록·상세 규칙은 DRAFT와 같다(작성자만)
    public static Post scheduled(Board board, Member author, String title, String content,
                                 String visibility, LocalDateTime publishAt, LocalDateTime now) {
        Post post = new Post(board, author, title, content, "SCHEDULED", visibility, now);
        post.publishedAt = null;
        post.publishAt = publishAt;
        return post;
    }

    // 15-3 예약 시각이 된 글을 발행한다 — SCHEDULED → PUBLISHED만 허용(다른 상태면 아무것도 안 함, 두 번 불려도 같다).
    // 발행 시각은 배치가 돈 시각이 아니라 "예약한 시각"이다(배치가 몇 분 늦게 돌아도 목록 순서가 예약대로).
    public boolean publishScheduled(LocalDateTime now) {
        if (!"SCHEDULED".equals(status)) {
            return false;
        }
        this.status = "PUBLISHED";
        this.publishedAt = this.publishAt;
        this.updatedAt = now;
        return true;
    }

    public void addTag(Tag tag) {
        tags.add(tag);
    }

    public void replace(String title, String content, String visibility, Set<Tag> tags,
                        LocalDateTime now) {
        this.title = title;
        changeContent(content);
        this.visibility = visibility;
        this.tags.clear();
        this.tags.addAll(tags);
        this.updatedAt = now;
    }

    // 3-1 부분 수정 — 값 검증은 PostService가 미리 하고, 엔티티는 바꾸기만 한다
    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeContent(String content) {
        this.content = content;
        this.excerpt = excerptOf(content);
    }

    // MySQL LEFT(content, 100)과 같은 결과가 나오게 "문자(코드 포인트)" 기준으로 자른다.
    // String.substring은 UTF-16 단위라 이모지 같은 문자가 끼면 반쪽이 잘리거나 개수가 어긋난다.
    private static String excerptOf(String content) {
        if (content.codePointCount(0, content.length()) <= EXCERPT_LENGTH) {
            return content;
        }
        return content.substring(0, content.offsetByCodePoints(0, EXCERPT_LENGTH));
    }

    // 11-1 발행 — 임시저장(DRAFT)인지는 PostService가 먼저 확인한다.
    // 발행 시각은 "처음 쓴 시각"이 아니라 "공개된 시각"이다(목록 정렬 기준이 published_at).
    public void publish(LocalDateTime now) {
        this.status = "PUBLISHED";
        this.publishedAt = now;
        this.updatedAt = now;
    }

    // 13-1 상태 전이는 여기 한 곳 — PUBLISHED ↔ HIDDEN만. 임시저장은 공개된 적이 없어 대상이 아니다(409).
    // 이미 숨긴 글을 또 숨기면 그대로(처음 숨긴 사람·시각 유지)
    public void hide(Member by, LocalDateTime now) {
        requireNotDraft();
        if (!"HIDDEN".equals(this.status)) {
            this.status = "HIDDEN";
            this.hiddenAt = now;
            this.hiddenBy = by;
        }
    }

    // 13-1 숨김 풀기(11-5 휴지통 복구 restore()와 다른 동작이라 이름을 나눴다)
    public void unhide() {
        requireNotDraft();
        this.status = "PUBLISHED";
        this.hiddenAt = null;
        this.hiddenBy = null;
    }

    private void requireNotDraft() {
        // 15-3 예약 글도 아직 공개된 적이 없어 임시저장과 같게 다룬다
        if ("DRAFT".equals(this.status) || "SCHEDULED".equals(this.status)) {
            throw new PostStatusConflictException("임시저장·예약 글은 숨기거나 복구할 수 없습니다.");
        }
    }

    public LocalDateTime getHiddenAt() {
        return hiddenAt;
    }

    public Member getHiddenBy() {
        return hiddenBy;
    }

    public void changeVisibility(String visibility) {
        this.visibility = visibility;
    }

    public void replaceTags(Set<Tag> newTags) {
        this.tags.clear();
        this.tags.addAll(newTags);
    }

    public void touchUpdatedAt(LocalDateTime now) {
        this.updatedAt = now;
    }

    // soft delete — 행은 남기고 deleted_at만 채운다. 좋아요·댓글·태그 연결은 건드리지 않는다.
    // 11-5 누가 지웠는지(deletedBy)도 남긴다 — 휴지통·복구 권한에 쓴다
    public void delete(LocalDateTime now, Long deletedBy) {
        this.deletedAt = now;
        this.deletedBy = deletedBy;
        this.updatedAt = now;
    }

    // 11-5 복구 — 지운 표시만 지운다. 내용을 고친 게 아니므로 updated_at은 그대로 둔다(T-002의 "수정됨"이 켜지지 않게)
    public void restore() {
        this.deletedAt = null;
        this.deletedBy = null;
    }


    public Long getId() {
        return id;
    }

    public Board getBoard() {
        return board;
    }

    public Member getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public String getStatus() {
        return status;
    }

    public String getVisibility() {
        return visibility;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public Integer getLikeCount() {
        return likeCount;
    }

    public Integer getCommentCount() {
        return commentCount;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public LocalDateTime getPublishAt() {
        return publishAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public Long getDeletedBy() {
        return deletedBy;
    }

    public Set<Tag> getTags() {
        return tags;
    }

    public List<PostImage> getImages() {
        return images;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V62__add_post_publish_at.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V62__add_post_publish_at.sql`

```sql
-- V62 — 예약 발행(15-3). 상태에 SCHEDULED를 더하고, 예약 시각(publish_at) 컬럼을 단다.
-- CHECK 제약은 고칠 수 없어서 지우고 다시 만든다(이름 ck_post_status는 V1 그대로).
-- 앞 장에서 상태 값을 더했다면 SHOW CREATE TABLE post로 지금 목록을 먼저 보고 거기에 SCHEDULED를 더한다.
ALTER TABLE post DROP CHECK ck_post_status;
ALTER TABLE post ADD COLUMN publish_at DATETIME NULL AFTER published_at;
ALTER TABLE post
    ADD CONSTRAINT ck_post_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN', 'SCHEDULED')),
    ADD CONSTRAINT ck_post_scheduled CHECK (status <> 'SCHEDULED' OR publish_at IS NOT NULL);
-- 1분마다 도는 배치의 "SCHEDULED이고 시각이 지난 글" 조회용 — 같음 조건(status) → 범위(publish_at)
CREATE INDEX ix_post_scheduled ON post (status, publish_at);
```

</details>

<details>
<summary>Scheduler — 실행 시점</summary>

`ScheduledPublishScheduler.java`. 실행 주기와 대상 선택·재실행 조건을 시나리오와 대조한다. 변경된 메서드: `everyMinute`.

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
    private final Clock clock;

    public ScheduledPublishScheduler(ScheduledPublishService scheduledPublishService, Clock clock) {
        this.scheduledPublishService = scheduledPublishService;
        this.clock = clock;
    }

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void everyMinute() {
        scheduledPublishService.publishDue(LocalDateTime.now(clock));
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`PublishedPost.java`, `PostRateLimiter.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

`src/main/java/org/example/batch/PublishedPost.java`

```java
package org.example.batch;

import java.time.LocalDateTime;

public record PublishedPost(Long postId, String title, LocalDateTime publishedAt) {
}
```

`src/main/java/org/example/post/PostRateLimiter.java`

```java
package org.example.post;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

// 13-5 도배 방지 — 한 회원이 최근 WINDOW 동안 쓴(지우지 않은) 글이 LIMIT개면 더 못 쓴다.
// "지금"은 밖에서 받는다 — 글의 created_at에 찍을 값과 같은 값으로 세야 시계가 어긋나지 않는다.
// 15-3부터 그 값은 Clock에서 온다. practice 프로파일은 Clock이 고정(app.fixed-now)이라 1분이 영원히 지나지 않아서,
// 그대로 세면 회원마다 글 5개 뒤로는 영원히 429가 된다 → 고정 시계일 때는 검사를 건너뛴다(도배 방지는 community에서 다룬다).
// 같은 회원의 요청 두 개가 동시에 오면 둘 다 4개로 세고 통과할 수 있다(6개가 될 수 있음) — 정확히 막으려면 락이 필요하다(이번 범위 밖).
@Component
public class PostRateLimiter {

    static final int LIMIT = 5;
    static final Duration WINDOW = Duration.ofSeconds(60);

    private final PostRepository postRepository;
    private final boolean fixedClock;

    public PostRateLimiter(PostRepository postRepository, @Value("${app.fixed-now:}") String fixedNow) {
        this.postRepository = postRepository;
        this.fixedClock = !fixedNow.isBlank();
    }

    public void check(Long authorId, LocalDateTime now) {
        if (fixedClock) {
            return;
        }
        LocalDateTime from = now.minus(WINDOW);
        // 창 안의 글을 최신순으로 LIMIT개까지만 읽는다 — LIMIT개가 다 차 있으면 막는다
        List<LocalDateTime> recent = postRepository.findRecentCreatedAt(authorId, from, PageRequest.of(0, LIMIT));
        if (recent.size() < LIMIT) {
            return;
        }
        // 가장 오래된 것(LIMIT번째)이 창을 벗어나는 순간 다시 쓸 수 있다
        LocalDateTime freeAt = recent.get(LIMIT - 1).plus(WINDOW);
        long millis = Duration.between(now, freeAt).toMillis();
        long seconds = Math.max(1, (millis + 999) / 1000);
        throw new TooManyPostsException(seconds);
    }
}
```

</details>

<details>
<summary>Java / 공통 날짜 파서 — 초 단위 형식</summary>

`src/main/java/org/example/batch/StrictDateTimes.java`

```java
package org.example.batch;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.regex.Pattern;

// 실습 계약의 초까지 있는 yyyy-MM-ddTHH:mm:ss만 받는다(배열·소수초·초 생략 거부).
public final class StrictDateTimes {
    private static final Pattern EXACT_SECONDS = Pattern.compile("[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}");
    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss")
            .withResolverStyle(ResolverStyle.STRICT);

    private StrictDateTimes() {
    }

    public static LocalDateTime parse(String value) {
        if (!EXACT_SECONDS.matcher(value).matches()) {
            throw new IllegalArgumentException("yyyy-MM-ddTHH:mm:ss 형식이어야 합니다.");
        }
        try {
            return LocalDateTime.parse(value, FORMAT);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("유효한 날짜·시각이어야 합니다.", ex);
        }
    }
}
```

</details>

<details>
<summary>MyBatis 대안 — SQL로 예약 발행 구현</summary>

JPA 구현과 같은 HTTP 계약을 유지한다. 조회는 예약 시각 순서로 최대 500건을 가져오고, 상태·시각·삭제 여부를 다시 확인하는 조건부 UPDATE의 영향 행 수가 1인 글만 응답에 넣는다.

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

`src/main/java/org/example/batch/ScheduledPostCandidate.java`

```java
package org.example.batch;

import java.time.LocalDateTime;

public record ScheduledPostCandidate(Long postId, String title, LocalDateTime publishAt) {
}
```

### MyBatis / Mapper·SQL

`src/main/java/org/example/batch/ScheduledPublishMapper.java`

```java
package org.example.batch;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ScheduledPublishMapper {
    List<ScheduledPostCandidate> findDue(@Param("at") LocalDateTime at, @Param("limit") int limit);
    int publishIfDue(@Param("id") Long id, @Param("at") LocalDateTime at, @Param("now") LocalDateTime now);
}
```

`src/main/resources/mapper/ScheduledPublishMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.batch.ScheduledPublishMapper">
    <resultMap id="candidate" type="org.example.batch.ScheduledPostCandidate">
        <constructor>
            <idArg column="id" javaType="java.lang.Long" />
            <arg column="title" javaType="java.lang.String" />
            <arg column="publish_at" javaType="java.time.LocalDateTime" />
        </constructor>
    </resultMap>
    <select id="findDue" resultMap="candidate">
        SELECT id, title, publish_at FROM post
        WHERE status = 'SCHEDULED' AND publish_at &lt;= #{at} AND deleted_at IS NULL
        ORDER BY publish_at, id LIMIT #{limit}
    </select>
    <update id="publishIfDue">
        UPDATE post
        SET status = 'PUBLISHED', published_at = publish_at, updated_at = #{now}
        WHERE id = #{id} AND status = 'SCHEDULED'
          AND publish_at &lt;= #{at} AND deleted_at IS NULL
    </update>
</mapper>
```

### Service / 배치

`src/main/java/org/example/batch/ScheduledPublishService.java`

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

// 조건부 UPDATE의 영향 행 수로 실제 전이된 글만 응답한다.
@Service
public class ScheduledPublishService {
    private static final int BATCH_LIMIT = 500;
    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishService.class);
    private final ScheduledPublishMapper mapper;
    private final Clock clock;

    public ScheduledPublishService(ScheduledPublishMapper mapper, Clock clock) {
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public ScheduledPublishResponse publishDue(LocalDateTime at) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<PublishedPost> published = new ArrayList<>();
        for (ScheduledPostCandidate post : mapper.findDue(at, BATCH_LIMIT)) {
            if (mapper.publishIfDue(post.postId(), at, now) == 1) {
                published.add(new PublishedPost(post.postId(), post.title(), post.publishAt()));
            }
        }
        if (published.isEmpty()) {
            log.debug("예약 발행 at={} 0건", at);
        } else {
            log.info("예약 발행 at={} {}건 ids={}", at, published.size(),
                    published.stream().map(PublishedPost::postId).toList());
        }
        return new ScheduledPublishResponse(at, published);
    }
}
```

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 확인할 때마다 예약 글 3개가 새로 생기고, 이 중 2개(00:00:01·09:00)는 그 자리에서 발행된다.

```check
{
  "requests": [
    {
      "id": "P1",
      "title": "09:00",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 09:00",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "2026-10-05T09:00:00"
      }
    },
    {
      "id": "P2",
      "title": "10:00",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 10:00",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "2026-10-05T10:00:00"
      }
    },
    {
      "id": "P3",
      "title": "00:00:01",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 00:00:01",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "2026-10-05T00:00:01"
      }
    },
    {
      "id": "P4",
      "title": "예약 글 — 비로그인 상세",
      "method": "GET",
      "path": "/api/posts/{{P1.body.id}}"
    },
    {
      "id": "P5",
      "title": "예약 글 — 작성자 상세",
      "method": "GET",
      "path": "/api/posts/{{P1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "P6",
      "title": "게시판 목록",
      "method": "GET",
      "path": "/api/boards/free/posts?size=50"
    },
    {
      "id": "P7",
      "title": "08:59:59 기준 실행",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T08:59:59",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P8",
      "title": "09:00 기준 실행",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P9",
      "title": "09:00 기준 한 번 더",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P10",
      "title": "발행 뒤 — 비로그인 상세",
      "method": "GET",
      "path": "/api/posts/{{P1.body.id}}"
    },
    {
      "id": "P11",
      "title": "10:00 글 — 비로그인 상세",
      "method": "GET",
      "path": "/api/posts/{{P2.body.id}}"
    },
    {
      "id": "P12",
      "title": "지금",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 지금",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "2026-10-05T00:00:00"
      }
    },
    {
      "id": "P13",
      "title": "30일+1초",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 30일+1초",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "2026-11-04T00:00:01"
      }
    },
    {
      "id": "P14",
      "title": "형식 아님",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 형식 아님",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "내일 9시"
      }
    },
    {
      "id": "P19",
      "title": "빈 문자열",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 빈 문자열",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": ""
      }
    },
    {
      "id": "P20",
      "title": "공백만",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 공백만",
        "content": "예약 발행 확인용 글",
        "tags": [],
        "publishAt": "   "
      }
    },
    {
      "id": "P21",
      "title": "11-1 status와 publishAt을 함께",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 예약 발행 상태와 함께",
        "content": "예약 발행 확인용 글",
        "status": "DRAFT",
        "publishAt": "2026-10-06T09:00:00"
      }
    },
    {
      "id": "P22",
      "title": "예약 글을 11-1 발행 API로",
      "method": "POST",
      "path": "/api/posts/{{P2.body.id}}/publish",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "P23",
      "title": "내 임시저장 글(11-1)",
      "method": "GET",
      "path": "/api/me/drafts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "P15",
      "title": "기준 시각 형식 아님",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=abc",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P16",
      "title": "기준 시각 30일+1초",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-11-04T00:00:01",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P17",
      "title": "일반 회원 실행",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "P18",
      "title": "토큰 없이 실행",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00"
    },
    {
      "id": "P24",
      "title": "초 생략",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 잘못된 예약 시각",
        "content": "저장되면 안 되는 글",
        "tags": [],
        "publishAt": "2026-10-06T09:00"
      }
    },
    {
      "id": "P25",
      "title": "소수초",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 잘못된 예약 시각",
        "content": "저장되면 안 되는 글",
        "tags": [],
        "publishAt": "2026-10-06T09:00:00.5"
      }
    },
    {
      "id": "P26",
      "title": "배열 타입",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 잘못된 예약 시각",
        "content": "저장되면 안 되는 글",
        "tags": [],
        "publishAt": [
          2026,
          10,
          6,
          9,
          0,
          0
        ]
      }
    },
    {
      "id": "P27",
      "title": "숫자 타입",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 잘못된 예약 시각",
        "content": "저장되면 안 되는 글",
        "tags": [],
        "publishAt": 123
      }
    },
    {
      "id": "P28",
      "title": "수동 실행 초 생략",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=1000-01-01T00:00",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    },
    {
      "id": "P29",
      "title": "수동 실행 소수초",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=1000-01-01T00:00:00.5",
      "headers": {
        "Authorization": "Bearer tok-p01"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "P1",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.status",
                "equals": "SCHEDULED"
              },
              {
                "path": "$.publishAt",
                "equals": "2026-10-05T09:00:00"
              },
              {
                "path": "$.publishedAt",
                "type": "null"
              }
            ]
          }
        },
        {
          "request": "P2",
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
          "request": "P3",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.status",
                "equals": "SCHEDULED"
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
          "request": "P4",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "P5",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.status",
                "equals": "SCHEDULED"
              }
            ]
          }
        },
        {
          "request": "P6",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].id",
                "notContains": "{{P1.body.id}}"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "request": "P7",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.published[*].postId",
            "contains": "{{P3.body.id}}"
          },
          {
            "path": "$.published[*].postId",
            "notContains": "{{P1.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "P8",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.published[*].postId",
            "contains": "{{P1.body.id}}"
          },
          {
            "path": "$.published[*].postId",
            "notContains": "{{P2.body.id}}"
          },
          {
            "path": "$.published[0].publishedAt",
            "equals": "2026-10-05T09:00:00"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "P9",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.published[*].postId",
            "notContains": "{{P1.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "P10",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.status",
                "equals": "PUBLISHED"
              },
              {
                "path": "$.publishedAt",
                "equals": "2026-10-05T09:00:00"
              }
            ]
          }
        },
        {
          "request": "P11",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "P12",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P13",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P14",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P19",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P20",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P15",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "at"
              }
            ]
          }
        },
        {
          "request": "P16",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "at"
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
          "request": "P17",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "P18",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "P21",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P22",
          "expect": {
            "status": 409
          }
        },
        {
          "request": "P23",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].id",
                "notContains": "{{P2.body.id}}"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "P24",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P25",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P26",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P27",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "publishAt"
              }
            ]
          }
        },
        {
          "request": "P28",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "at"
              }
            ]
          }
        },
        {
          "request": "P29",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "at"
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
| C1 | P1 / P2 / P3 | 모두 `201`, `status`=`SCHEDULED`. P1은 `publishAt`=`2026-10-05T09:00:00`, `publishedAt`=`null`. P3(지금 + 1초)는 경계 바로 안쪽이라 된다 |
| C2 | P4 / P5 / P6 | `404`(비로그인) / `200`·`SCHEDULED`(작성자) / 게시판 목록에 P1 없음 |
| C3 | P7 | 08:59:59 기준 — P3은 발행되고 P1은 아직 |
| C4 | P8 | 09:00:00 기준 — P1 발행(예약 시각 그 순간 포함), P2(10:00)는 아직. 발행 시각 = `2026-10-05T09:00:00` |
| C5 | P9 | 같은 시각으로 한 번 더 — P1은 다시 나오지 않는다 |
| C6 | P10 / P11 | `200`·`PUBLISHED`·`publishedAt`=`2026-10-05T09:00:00` / `404`(10:00 글은 아직 예약) |
| C7 | P12 / P13 / P14 / P19 / P20 / P15 / P16 | 모두 `400` — `publishAt`(지금과 같음·30일 + 1초·형식·빈 문자열·공백만), `at`(형식·30일 + 1초). `500`도, 조용히 바로 발행(`201`)도 아니다 |
| C8 | P17 / P18 | `403` / `401` |
| C9 | P21 / P22 / P23 | 11-1과 겹치는 곳 — `status`와 `publishAt`을 함께 보내면 `400`(`errors`에 `publishAt`) / 예약 글을 11-1 발행 API로 발행하면 `409`(임시저장이 아니다) / 내 임시저장 목록에 예약 글이 없다 |
| C10 | P24~P29 | 초 생략·소수초·JSON 배열·숫자 타입의 `publishAt`, 초 생략·소수초 `at`은 모두 `400`, `errors`에 해당 필드가 들어간다 |
| D1 | `SELECT COUNT(*) FROM post WHERE status = 'SCHEDULED' AND publish_at IS NULL` | `0` |
| D2 | `SELECT COUNT(*) FROM post WHERE status = 'PUBLISHED' AND publish_at IS NOT NULL AND published_at <> publish_at` | `0` — 예약해서 발행된 글은 발행 시각 = 예약 시각 |
| D3 | `EXPLAIN SELECT id FROM post WHERE status = 'SCHEDULED' AND publish_at <= '2026-10-05 09:00:00'` | `key` = `ix_post_scheduled` |
| R1 | 전이 규칙 | 배치가 "SCHEDULED인 글만" 바꾼다. 조건부 UPDATE의 영향 행 수가 1인 글만 응답에 넣어 동시 실행도 중복 발행으로 보고하지 않는다 |
| R2 | 같은 메서드 | 1분 예약 실행과 수동 실행이 같은 서비스 메서드를 부르고, 기준 시각만 다르다 |
| R3 | 시간 | 작성 검증과 배치가 모두 `Clock`을 쓴다. 예약 시각 비교가 `<=`(그 순간부터 발행)다 |
| R4 | 한 번에 다 하지 않기 | 한 번에 가져오는 건수에 상한이 있다. 몇만 건이 한꺼번에 밀려도 한 트랜잭션이 끝없이 길어지지 않는다 |

## 필요한 지식

- [P30 스케줄링 실무](../../docs/knowledge/P30-scheduling-practical.md) — 매분 cron, fixedDelay와의 차이
- [W20 시간과 타임존](../../docs/knowledge/W20-time-timezone.md)
- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 새 상태를 한 곳에서 처리
- [F1 입력 검증과 에러 응답](../../lessons/F1-validation-errors.md)
- [J2 왜 마이그레이션인가](../../lessons/J2-why-migrations.md) — CHECK 제약 바꾸기
- [2-3. 가시성](../ch2-read-post/2-3-visibility.md) — DRAFT 규칙

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 엔티티에 전이 메서드</summary>

```java
public boolean publishScheduled(LocalDateTime now) {
    if (!"SCHEDULED".equals(status)) return false;   // 다른 상태면 아무것도 안 한다
    this.status = "PUBLISHED";
    this.publishedAt = this.publishAt;
    this.updatedAt = now;
    return true;
}
```

배치는 `findDue(at, PageRequest.of(0, 500))`로 가져와 이 메서드를 부르기만 한다. 트랜잭션이 끝날 때 변경 감지가 UPDATE를 보낸다.
</details>

<details>
<summary>힌트 2 — 본문 형식 오류에서 필드 이름 꺼내기</summary>

11-1의 공통 처리기가 이미 한다. `"내일 9시"`를 보냈는데 `errors`가 없다면 11-1 힌트 4처럼 `ex.getCause() instanceof tools.jackson.core.JacksonException je`이면 `je.getPath()`의 각 `getPropertyName()`을 `.`으로 잇는다(Boot 4는 Jackson 3, 패키지가 `tools.jackson`).
</details>

## 다음 단계

[15-4. 휴지통 비우기](15-4-trash-purge.md)
