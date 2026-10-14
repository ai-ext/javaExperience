# 16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "글에 링크를 붙이면 카톡처럼 그 페이지 제목이 미리보기로 보이면 좋겠어요. 그런데 상대 사이트가 먹통이면 글쓰기까지 같이 먹통이 되면 안 됩니다. 2초 넘게 걸리면 미리보기는 포기하고 글은 그냥 저장해 주세요."

처음으로 우리 서버가 **다른 서버를 부른다**. 남의 서버는 우리가 고칠 수 없다. 느릴 수도 있고, 응답을 안 줄 수도 있고, 이상한 HTML을 줄 수도 있다. 타임아웃을 정하지 않으면 요청 스레드가 상대가 응답할 때까지 하염없이 기다린다. 그동안 글쓰기 버튼도 멈춰 있다.

글을 쓸 때 링크(`linkUrl`) 하나를 받는다. 그 주소를 `RestClient`로 열어 `<meta property="og:title">`(없으면 `<title>`)을 읽는다. 읽으면 제목을 함께 저장하고, **2초 안에 못 읽으면 제목 없이 링크만 저장**한다. 어느 쪽이든 응답은 `201`이다.

진짜 외부 사이트를 쓰면 결과가 그날 인터넷 사정에 따라 달라진다. 그래서 **연습용 가짜 외부 사이트**를 앱 안에 둔다. `/fake-site/page?title=…&delay=…`는 `delay`(ms)만큼 늦게 그 제목이 든 HTML을 준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 링크 붙이기",
  "summary": "링크 페이지 제목을 최대 2초 기다려 가져온다. 넘으면 제목 없이 링크만 저장(201).",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글쓰기",
      "right": "디버깅중"
    },
    {
      "type": "field",
      "id": "link",
      "label": "링크",
      "value": "http://localhost:8080/fake-site/page?title=spring-cache-guide&delay=0"
    },
    {
      "type": "list",
      "id": "preview",
      "items": [
        {
          "id": "card-ok",
          "title": "spring-cache-guide",
          "meta": "localhost:8080 — 미리보기"
        },
        {
          "id": "card-none",
          "title": "http://localhost:8080/fake-site/page?title=slow-page&delay=3000",
          "meta": "미리보기 없음(2초 초과)"
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
      "name": "빠른 사이트 — 제목까지",
      "steps": [
        {
          "kind": "user",
          "text": "링크를 붙여 올리기",
          "focus": [
            "link"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p08"
          ],
          "body": "{\"boardSlug\": \"free\", \"title\": \"...\", \"content\": \"...\", \"linkUrl\": \"http://localhost:8080/fake-site/page?title=spring-cache-guide&delay=0\"}"
        },
        {
          "kind": "server",
          "text": "트랜잭션 밖에서 RestClient GET(연결 1초·읽기 2초 제한) → HTML 앞 64KB에서 og:title 추출 → 그다음 글 저장 트랜잭션"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (..., link_url, link_title) VALUES (..., 'http://localhost:8080/fake-site/page?...', 'spring-cache-guide')"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Server-Timing: app;dur=40"
          ],
          "body": "{\"id\": 155, ..., \"link\": {\"url\": \"http://localhost:8080/fake-site/page?...\", \"title\": \"spring-cache-guide\"}}"
        },
        {
          "kind": "screen",
          "text": "제목이 든 미리보기 카드",
          "focus": [
            "card-ok"
          ]
        }
      ]
    },
    {
      "name": "느린 사이트 — 2초에서 포기",
      "steps": [
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Authorization: Bearer tok-p09"
          ],
          "body": "{..., \"linkUrl\": \"http://localhost:8080/fake-site/page?title=slow-page&delay=3000\"}"
        },
        {
          "kind": "server",
          "text": "가짜 사이트는 3초 뒤에 답한다 → 2초에 읽기 시간 초과(SocketTimeoutException) → 로그 한 줄, 제목 null로 계속"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (..., link_url, link_title) VALUES (..., 'http://localhost:8080/fake-site/page?...', NULL)"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Server-Timing: app;dur=2050"
          ],
          "body": "{\"id\": 156, ..., \"link\": {\"url\": \"...delay=3000\", \"title\": null}}"
        },
        {
          "kind": "screen",
          "text": "약 2초 만에 저장 — 카드 대신 주소만",
          "focus": [
            "card-none",
            "ok"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V72** — `db/migration/V72__add_post_link.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `post.link_url` | `VARCHAR(500) NULL` — 붙인 링크. 링크가 없으면 `NULL` |
| `post.link_title` | `VARCHAR(200) NULL` — 페이지 제목. 못 가져오면 `NULL`(링크만 있고 미리보기는 없음) |

**입력 규칙** — `POST /api/posts`. 1-5 규칙에 `linkUrl` 하나가 더해진다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `boardSlug` | 필수 | 안 됨 | — | 있는 게시판의 slug | — | 없음·빈 값 `400`, 없는 게시판 `404` |
| `title` | 필수 | 안 됨(공백만도 안 됨) | 1~200자 | — | — | `400` |
| `content` | 필수 | 안 됨(공백만도 안 됨) | — | — | — | `400` |
| `tags` | 선택 | `null`이면 태그 없음 | 0~5개, 이름 1~30자 | — | `[]` | `400` |
| `visibility` | 선택 | `null`이면 기본값 | — | `PUBLIC` 또는 `FOLLOWERS` | `PUBLIC` | `400` |
| **`linkUrl`** | 선택 | `null`(필드 없음)이면 링크 없음. **빈 문자열은 `400`** — 안 붙일 거면 필드를 뺀다 | 500자 이하 | `http://` 또는 `https://` + 호스트(정규식 `https?://[^\s/?#]+\S*`). `ftp:`·`javascript:`·공백 섞인 주소는 안 됨 | 없음 | `400`(`errors`에 `linkUrl`) |

형식이 맞는데 **열리지 않는** 주소(없는 서버, 느린 서버, 404)는 입력 오류가 아니다. `201`로 저장하고 `link.title`만 `null`이다.

**미리보기 가져오기**

| 부품 | 하는 일 |
|---|---|
| `LinkPreviewService.fetch(url)` | `RestClient` + `SimpleClientHttpRequestFactory`(연결 제한 1초, 읽기 제한 2초). `URI.create(url)`로 주소를 그대로 넘긴다(문자열 템플릿으로 넘기면 `%`가 한 번 더 인코딩된다). 2xx만, 본문은 앞 64KB만 읽는다. `og:title` → 없으면 `<title>` → HTML 엔티티 풀기(`HtmlUtils.htmlUnescape`) → 200자로 자르기 |
| 실패 처리 | 시간 초과·접속 거부·잘못된 주소 등 모든 실패는 잡아서 로그 한 줄, 제목 `null` |
| 부르는 자리 | **트랜잭션 밖** — 컨트롤러가 먼저 `fetch`하고 결과를 `postService.create(..., link)`에 넘긴다. `@Transactional` 안에서 부르면 상대를 기다리는 2초 동안 DB 커넥션을 붙잡는다 |
| 응답 | 작성·상세 응답에 `"link": { "url": "...", "title": "..." }`. 링크가 없으면 `"link": null` |
| 시간 | 16-2의 `Server-Timing: app;dur=<ms>`를 그대로 쓴다 — 느린 사이트면 약 2000 |

**연습용 가짜 외부 사이트** — `/api` 밖이라 토큰 확인을 받지 않는다. 실서비스에는 두지 않는다(누구나 서버 스레드를 `delay`만큼 붙잡게 할 수 있다).

| 경로 | 응답 |
|---|---|
| `GET /fake-site/page?title=<제목>&delay=<ms>` | `delay`(0~10000)만큼 쉰 뒤 `text/html` — `<meta property="og:title" content="<제목>">`와 `<title>`. 제목은 HTML 이스케이프 |
| `GET /fake-site/base` | `{ "base": "http://localhost:8080" }` — 요청의 Host로 만든 이 서버 주소. 실행 칸이 미리보기 링크를 만들 때 쓴다(학습자마다 포트가 달라서) |
| CORS | 실행 칸(브라우저)이 `/fake-site/base`를 직접 부른다. `CorsConfig`에 `registry.addMapping("/fake-site/**")`를 GET만 더한다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 트랜잭션 밖에서 RestClient GET(연결 1초·읽기 2초 제한) → HTML 앞 64KB에서 og:title 추출 → 그다음 글 저장 트랜잭션
- 가짜 사이트는 3초 뒤에 답한다 → 2초에 읽기 시간 초과(SocketTimeoutException) → 로그 한 줄, 제목 null로 계속

<details>
<summary>Controller — HTTP 연결</summary>

`FakeSiteController.java`, `PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/fake-site/base")`, `@GetMapping(value = "/fake-site/page", produces = MediaType.TEXT_HTML_VALUE)`. 변경된 메서드: `base`, `page`.

`src/main/java/org/example/fakesite/FakeSiteController.java`

```java
package org.example.fakesite;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.HtmlUtils;

import java.util.Map;

// 16-4 연습용 "외부 사이트" — 링크 미리보기가 부를 HTML 페이지. /api 밖이라 토큰 확인을 받지 않는다.
// 실서비스에는 두지 않는다(누구나 서버 스레드를 delay만큼 붙잡게 할 수 있다).
@RestController
public class FakeSiteController {

    // 이 서버의 주소(요청의 Host 기준) — 실행 칸이 미리보기 링크를 만들 때 쓴다
    @GetMapping("/fake-site/base")
    public Map<String, String> base() {
        return Map.of("base", ServletUriComponentsBuilder.fromCurrentContextPath().toUriString());
    }

    // delay(ms)만큼 늦게 og:title이 든 HTML을 돌려준다
    @GetMapping(value = "/fake-site/page", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> page(@RequestParam(defaultValue = "가짜 페이지") String title,
                                       @RequestParam(defaultValue = "0") @Min(0) @Max(10000) long delay)
            throws InterruptedException {
        if (delay > 0) {
            Thread.sleep(delay);
        }
        String t = HtmlUtils.htmlEscape(title);
        String html = "<!doctype html><html><head><meta charset=\"utf-8\">"
                + "<meta property=\"og:title\" content=\"" + t + "\">"
                + "<title>" + t + "</title></head><body><p>연습용 외부 페이지</p></body></html>";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/html;charset=UTF-8")).body(html);
    }
}
```

`src/main/java/org/example/post/PostController.java`

```java
package org.example.post;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.link.LinkPreview;
import org.example.link.LinkPreviewService;
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
    private final LinkPreviewService linkPreviewService;

    public PostController(PostService postService, PostQueryService postQueryService,
                          LinkPreviewService linkPreviewService) {
        this.postService = postService;
        this.postQueryService = postQueryService;
        this.linkPreviewService = linkPreviewService;
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

        // 16-4 외부 페이지 제목은 트랜잭션 "밖"에서 먼저 가져온다(최대 2초). 실패해도 null로 계속
        LinkPreview link = linkPreviewService.fetch(request.linkUrl());
        Post post = postService.create(loginMember.id(), request, link);
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
                post.getCreatedAt(),
                LinkResponse.of(post)
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
                post.getCreatedAt(),
                LinkResponse.of(post)
        );
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`LinkResponse.java`, `PostCreateRequest.java`, `PostDetailResponse.java`, `PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/post/LinkResponse.java`

```java
package org.example.post;

// 16-4 글에 붙은 링크 — title이 null이면 미리보기 없음(가져오기 실패)
public record LinkResponse(String url, String title) {

    static LinkResponse of(Post post) {
        return post.getLinkUrl() == null ? null : new LinkResponse(post.getLinkUrl(), post.getLinkTitle());
    }
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
        JsonNode publishAt,

        // 16-4 링크 하나(선택). 없으면 null, 있으면 http·https 주소 500자 이하 — 빈 문자열도 형식 위반
        @Size(max = 500, message = "링크는 500자 이하여야 합니다.")
        @Pattern(regexp = "https?://[^\\s/?#]+\\S*", message = "링크는 http:// 또는 https://로 시작하는 주소여야 합니다.")
        String linkUrl
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
        LocalDateTime createdAt,
        LinkResponse link // 16-4 링크가 없으면 null
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
        LocalDateTime createdAt,
        LinkResponse link // 16-4 링크가 없으면 null
) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`LinkPreviewService.java`, `PostQueryService.java`, `PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `fetch`, `create`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/link/LinkPreviewService.java`

```java
package org.example.link;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;

import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 16-4 외부 페이지 제목 가져오기. 느리거나 실패하면 기다리지 않고 null — 글 저장은 막지 않는다.
// 트랜잭션 밖(컨트롤러)에서 부른다: 외부 응답을 기다리는 동안 DB 커넥션을 붙잡지 않으려고.
// 실서비스라면 내부 주소(localhost·사설 IP·클라우드 메타데이터) 요청을 막아야 한다(SSRF). 연습용 가짜 사이트가 localhost라 여기선 열어 둔다.
@Service
public class LinkPreviewService {

    private static final Logger log = LoggerFactory.getLogger(LinkPreviewService.class);
    private static final int MAX_BYTES = 64 * 1024; // 앞부분 64KB만 읽는다(<head>면 충분)
    private static final int TITLE_MAX_LENGTH = 200;
    private static final Pattern OG_TITLE = Pattern.compile(
            "<meta[^>]+property=[\"']og:title[\"'][^>]*content=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern TITLE = Pattern.compile("<title[^>]*>([^<]*)</title>", Pattern.CASE_INSENSITIVE);

    private final RestClient restClient;

    // Boot 4는 RestClient.Builder 자동 설정이 별도 모듈(spring-boot-restclient)이라 여기선 RestClient.builder()로 직접 만든다
    public LinkPreviewService(@Value("${app.link-preview.connect-timeout-ms:1000}") long connectTimeoutMs,
                              @Value("${app.link-preview.read-timeout-ms:2000}") long readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs)); // 연결이 안 붙을 때
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));       // 붙었는데 응답이 안 올 때
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public LinkPreview fetch(String url) {
        if (url == null) {
            return null;
        }
        try {
            String html = restClient.get()
                    .uri(URI.create(url)) // 문자열 그대로 — 템플릿으로 다시 인코딩하지 않는다
                    .exchange((request, response) -> {
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            return null;
                        }
                        try (InputStream in = response.getBody()) {
                            return new String(in.readNBytes(MAX_BYTES), StandardCharsets.UTF_8);
                        }
                    });
            return new LinkPreview(url, extractTitle(html));
        } catch (RuntimeException e) {
            // 시간 초과·접속 실패 등 — 미리보기 없이 링크만 남긴다
            log.warn("링크 미리보기 실패 url={} — {}", url, e.getMessage());
            return new LinkPreview(url, null);
        }
    }

    private String extractTitle(String html) {
        if (html == null) {
            return null;
        }
        Matcher m = OG_TITLE.matcher(html);
        String raw = m.find() ? m.group(1) : null;
        if (raw == null) {
            Matcher t = TITLE.matcher(html);
            raw = t.find() ? t.group(1) : null;
        }
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String title = HtmlUtils.htmlUnescape(raw).strip();
        return title.length() > TITLE_MAX_LENGTH ? title.substring(0, TITLE_MAX_LENGTH) : title;
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
                post.getCreatedAt(),
                LinkResponse.of(post)
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
import org.example.link.LinkPreview;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.revision.PostRevision;
import org.example.revision.PostRevisionRepository;
import org.example.moderation.ContentFilter;
import org.example.notification.PostCreatedEvent;
import org.example.tag.Tag;
import org.example.tag.TagRepository;
import org.springframework.cache.annotation.CacheEvict;
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
    private final PopularCacheVersion popularCacheVersion;

    // 15-3 예약은 30일 안쪽만 받는다
    private static final int MAX_SCHEDULE_DAYS = 30;

    public PostService(PostRepository postRepository, BoardRepository boardRepository,
                        MemberRepository memberRepository, TagRepository tagRepository,
                        PostAccessPolicy accessPolicy, PostImageRepository postImageRepository, Clock clock,
                        PostRevisionRepository revisionRepository, ContentFilter contentFilter,
                        PostRateLimiter rateLimiter, ApplicationEventPublisher eventPublisher, PopularCacheVersion popularCacheVersion) {
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
        this.popularCacheVersion = popularCacheVersion;
    }

    @Transactional
    public Post create(Long authorId, PostCreateRequest request, LinkPreview link) {
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
        if (link != null) {
            post.attachLink(link.url(), link.title());
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

    // 전체 교체도 공개 범위·제목을 바꿀 수 있으므로 캐시를 비운다.
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
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
        popularCacheVersion.invalidateAfterCommit();

        return new PostDetailResponse(post.getId(), post.getBoard().getSlug(), post.getTitle(),
                post.getContent(), post.getTags().stream().map(Tag::getName).toList(),
                post.getVisibility(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getViewCount(), post.getLikeCount(), post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(), post.getPublishAt(), post.getPublishedAt(), post.getCreatedAt(),
                LinkResponse.of(post));
    }

    // 공개 범위·제목이 바뀌면 인기글 캐시를 비운다(성공했을 때만 — 예외면 지우지 않는다).
    // 키가 (days, limit)마다 따로라 어느 키에 이 글이 들었는지 모르므로 전부 비운다.
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
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
        popularCacheVersion.invalidateAfterCommit();
        return post;
    }

    // 11-1 임시저장 글 발행 — 404(볼 수 없음) → 403(작성자 아님) → 409(임시저장이 아님) 순서
    // 16-3 임시저장 글이 공개되면 인기글 후보가 바뀐다 — 인기글 캐시를 비운다
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
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
        popularCacheVersion.invalidateAfterCommit();
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
    // 16-3 휴지통에서 돌아온 글도 인기글 후보 — 인기글 캐시를 비운다
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
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
        popularCacheVersion.invalidateAfterCommit();
        return post;
    }

    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
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
        popularCacheVersion.invalidateAfterCommit();
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
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `attachLink`.

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

    // 16-4 링크 미리보기 — 링크가 없으면 둘 다 null, 제목을 못 가져왔으면 link_title만 null
    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "link_title", length = 200)
    private String linkTitle;

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

    public void attachLink(String url, String title) {
        this.linkUrl = url;
        this.linkTitle = title;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public String getLinkTitle() {
        return linkTitle;
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

`V72__add_post_link.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V72__add_post_link.sql`

```sql
-- V72 — 16-4 링크 미리보기. 글에 붙인 링크 하나와 그 페이지 제목(og:title).
-- 제목을 못 가져오면(느림·접속 실패) link_title은 NULL — 링크만 남고 미리보기는 없다.
ALTER TABLE post
    ADD COLUMN link_url   VARCHAR(500) NULL COMMENT '글에 붙인 링크(http·https)',
    ADD COLUMN link_title VARCHAR(200) NULL COMMENT '링크 페이지 제목 — 못 가져오면 NULL';
```

</details>

<details>
<summary>설정·보조 코드</summary>

`CorsConfig.java`, `LinkPreview.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

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
                // 노출해야 한다(CORS 기본 노출 헤더가 아니다). 16-2·16-3: 처리 시간 Server-Timing, 캐시 적중 X-Cache도 같은 이유
                .exposedHeaders("Location", "WWW-Authenticate", "Retry-After", "Content-Disposition", "Server-Timing",
                        "X-Cache");
        // 13-7: API 문서는 /api 밖이다 — 다른 출처(브라우저 화면)에서 문서 JSON·화면을 읽을 수 있게 GET만 연다
        registry.addMapping("/v3/api-docs/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
        registry.addMapping("/swagger-ui/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
        // 16-4 실행 칸이 서버 주소를 알아내려고 /fake-site/base를 브라우저에서 부른다(GET만)
        registry.addMapping("/fake-site/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
    }
}
```

`src/main/java/org/example/link/LinkPreview.java`

```java
package org.example.link;

// 16-4 링크와 미리보기 제목. title이 null이면 "링크는 있지만 미리보기는 없음"
public record LinkPreview(String url, String title) {
}
```

</details>

<details>
<summary>테스트 — 계약 확인</summary>

`PostControllerTest.java`. 테스트 요청과 기대값을 **직접 확인** 및 채점 기준과 대조한다.

`src/test/java/org/example/post/PostControllerTest.java`

```java
package org.example.post;

import org.example.auth.ApiToken;
import org.example.auth.ApiTokenRepository;
import org.example.auth.ClockConfig;
import org.example.board.Board;
import org.example.link.LinkPreviewService;
import org.example.member.Member;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Optional;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 7-1: 컨트롤러만 띄워 HTTP 계약(상태 코드·헤더·JSON)을 고정한다. DB·서비스는 띄우지 않는다.
// 실물: PostController, ApiExceptionHandler(Advice), Bean Validation, AuthInterceptor·LoginMemberArgumentResolver
// 가짜: 컨트롤러가 쓰는 서비스 두 개 + 인터셉터가 쓰는 ApiTokenRepository("토큰 → 회원"을 정해 준다)
// Clock은 리포지토리가 아니라 설정 빈이라 실물(ClockConfig)을 가져온다 — @WebMvcTest는 일반 @Configuration을 읽지 않는다.
@WebMvcTest(PostController.class)
@Import(ClockConfig.class)
class PostControllerTest {

    private static final String VALID_BODY = """
            {"boardSlug":"dev","title":"[테스트] 제목","content":"본문","tags":[],"visibility":"PUBLIC"}
            """;

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    PostService postService;

    @MockitoBean
    PostQueryService postQueryService;

    @MockitoBean
    ApiTokenRepository apiTokenRepository;

    // 16-4 컨트롤러가 링크 미리보기를 먼저 부른다(본문에 linkUrl이 없으면 mock이 null을 돌려준다)
    @MockitoBean
    LinkPreviewService linkPreviewService;

    @Test
    void 올바른_토큰과_본문이면_201과_Location과_작성자를_돌려준다() throws Exception {
        Member kimjava = givenToken("tok-kimjava", 2L, "김자바");
        Post created = fakePost(22L, kimjava);
        given(postService.create(eq(2L), any(PostCreateRequest.class), any())).willReturn(created);

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer tok-kimjava")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", endsWith("/api/posts/22")))
                .andExpect(jsonPath("$.id").value(22))
                .andExpect(jsonPath("$.author.id").value(2))
                .andExpect(jsonPath("$.author.nickname").value("김자바"));
    }

    @Test
    void 빈_제목이면_400_problem_json에_title_오류가_있고_서비스를_부르지_않는다() throws Exception {
        givenToken("tok-kimjava", 2L, "김자바");

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer tok-kimjava")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"boardSlug":"dev","title":"","content":"본문","tags":[],"visibility":"PUBLIC"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[*].field", hasItem("title")));

        then(postService).shouldHaveNoInteractions();
    }

    @Test
    void 토큰이_없으면_401이고_서비스도_토큰_조회도_하지_않는다() throws Exception {
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        then(postService).shouldHaveNoInteractions();
        then(apiTokenRepository).shouldHaveNoInteractions();
    }

    @Test
    void 서비스가_글_없음_예외를_던지면_404_problem_json이다() throws Exception {
        given(postQueryService.getDetail(eq(999L), any())).willThrow(new PostNotFoundException());

        mockMvc.perform(get("/api/posts/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404));
    }

    // 인터셉터가 쓰는 "토큰 → 회원"을 정해 준다(만료 2099년, 폐기 없음, ACTIVE)
    private Member givenToken(String token, Long memberId, String nickname) {
        Member member = mock(Member.class);
        given(member.getId()).willReturn(memberId);
        given(member.getNickname()).willReturn(nickname);
        given(member.getRole()).willReturn("USER");
        given(member.getMemberStatus()).willReturn("ACTIVE");

        ApiToken apiToken = mock(ApiToken.class);
        given(apiToken.getExpiresAt()).willReturn(LocalDateTime.of(2099, 12, 31, 23, 59, 59));
        given(apiToken.getMember()).willReturn(member);
        given(apiTokenRepository.findByTokenFetchMember(token)).willReturn(Optional.of(apiToken));
        return member;
    }

    // PostService.create가 돌려주는 것은 엔티티라(1-3: DTO 변환은 컨트롤러 몫) id·게시판이 채워진 가짜 엔티티를 만든다
    private Post fakePost(Long id, Member author) {
        Board board = mock(Board.class);
        given(board.getSlug()).willReturn("dev");

        Post post = mock(Post.class);
        given(post.getId()).willReturn(id);
        given(post.getBoard()).willReturn(board);
        given(post.getAuthor()).willReturn(author);
        given(post.getTitle()).willReturn("[테스트] 제목");
        given(post.getContent()).willReturn("본문");
        given(post.getTags()).willReturn(new LinkedHashSet<>());
        given(post.getVisibility()).willReturn("PUBLIC");
        given(post.getCreatedAt()).willReturn(LocalDateTime.of(2026, 10, 9, 12, 0));
        return post;
    }
}
```

</details>

## MyBatis 대체 구현

기본 JPA 스냅숏을 완성한 뒤 아래 여섯 파일을 적용한다. 글 생성 트랜잭션·외부 페이지 호출·접근 권한 검증은 기본 구현을 유지하고, **상세 응답의 링크 두 열 조회**를 MyBatis SQL로 바꾼다. `PostQueryService`가 JPA로 글의 접근 권한을 먼저 확인한 뒤 MyBatis Mapper를 호출하므로 비공개 글의 링크를 권한 없이 읽는 API는 생기지 않는다. 생성 응답은 저장된 `Post`에서 DTO로 만든다.

<details>
<summary>설정 — MyBatis 의존성 — build.gradle</summary>

`build.gradle`

```gradle
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
    // 16-3 인기글 캐시 — Spring Cache 추상화 + 로컬 메모리 캐시(Caffeine, TTL 지원)
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    implementation 'com.github.ben-manes.caffeine:caffeine'

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
<summary>설정 — Mapper 위치·결과 매핑 — application.yml</summary>

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
  # 16-3 인기글 캐시 — 60초 뒤 만료(expireAfterWrite), 키는 최대 100개
  cache:
    cache-names: popularPosts
    caffeine:
      spec: maximumSize=100,expireAfterWrite=60s

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
<summary>Service — 권한 검증 후 링크 조회 — PostQueryService.java</summary>

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
    private final MyBatisPostLinkMapper postLinkMapper;

    public PostQueryService(PostRepository postRepository, BoardRepository boardRepository,
                             MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                             PostSearchRepository postSearchRepository, PostViewRepository postViewRepository,
                             Clock clock, RecentViewService recentViewService, MyBatisPostLinkMapper postLinkMapper) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.postSearchRepository = postSearchRepository;
        this.postViewRepository = postViewRepository;
        this.clock = clock;
        this.recentViewService = recentViewService;
        this.postLinkMapper = postLinkMapper;
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

    // 접근 권한을 JPA에서 검증한 뒤 링크 열만 MyBatis로 조회한다.
    private LinkResponse linkResponse(Long postId) {
        PostLinkRow row = postLinkMapper.findByPostId(postId);
        return row == null || row.getLinkUrl() == null ? null
                : new LinkResponse(row.getLinkUrl(), row.getLinkTitle());
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
                post.getCreatedAt(),
                linkResponse(post.getId())
        );
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — post 링크 열 조회 — MyBatisPostLinkMapper.java</summary>

`src/main/java/org/example/post/MyBatisPostLinkMapper.java`

```java
package org.example.post;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MyBatisPostLinkMapper {
    PostLinkRow findByPostId(@Param("postId") Long postId);
}
```

</details>

<details>
<summary>DTO — 링크 조회 결과 행 — PostLinkRow.java</summary>

`src/main/java/org/example/post/PostLinkRow.java`

```java
package org.example.post;

// post의 링크 열만 읽는 MyBatis 결과 DTO
public class PostLinkRow {
    private String linkUrl;
    private String linkTitle;

    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public String getLinkTitle() { return linkTitle; }
    public void setLinkTitle(String linkTitle) { this.linkTitle = linkTitle; }
}
```

</details>

<details>
<summary>Mapper XML — 링크 열 SQL — MyBatisPostLinkMapper.xml</summary>

`src/main/resources/mapper/MyBatisPostLinkMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.MyBatisPostLinkMapper">
    <select id="findByPostId" resultType="org.example.post.PostLinkRow">
        SELECT link_url, link_title
          FROM post
         WHERE id = #{postId}
    </select>
</mapper>
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'
sql() { docker compose exec -T mysql mysql -ucommunity -pcommunity practice -N -e "$1" 2>/dev/null; }

curl -s "$BASE/fake-site/page?title=hello&delay=0"; echo                     # 가짜 사이트가 HTML을 주는지
curl -s -X POST "$BASE/api/posts" -H 'Authorization: Bearer tok-p21' -H "$J" \
  -d '{"boardSlug":"free","title":"[채점] 16-4 잘못된 링크","content":"x","linkUrl":"ftp://example.com/a"}'; echo   # 400 linkUrl

time curl -s -D - -X POST "$BASE/api/posts" -H 'Authorization: Bearer tok-p08' -H "$J" \
  -d "{\"boardSlug\":\"free\",\"title\":\"[채점] 16-4 빠른 링크\",\"content\":\"x\",\"linkUrl\":\"$BASE/fake-site/page?title=spring-cache-guide&delay=0\"}" | grep -i -E 'server-timing|"link"'
time curl -s -D - -X POST "$BASE/api/posts" -H 'Authorization: Bearer tok-p09' -H "$J" \
  -d "{\"boardSlug\":\"free\",\"title\":\"[채점] 16-4 느린 링크\",\"content\":\"x\",\"linkUrl\":\"$BASE/fake-site/page?title=slow-page&delay=3000\"}" | grep -i -E 'server-timing|"link"'
sql "SELECT id, link_title, LEFT(link_url, 60) FROM post WHERE title LIKE '[채점] 16-4%' ORDER BY id DESC LIMIT 2"
```

느린 쪽의 `time`이 3초가 아니라 2초 남짓인지 본다. 앱 로그에는 `링크 미리보기 실패 url=... — I/O error ... Read timed out` 한 줄이 남는다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 실행할 때마다 회원 21·8·9·10의 글이 하나씩 늘어난다(회원 21은 팔로워가 없다 — 12-5 피드가 정확한 글 목록을 보는 회원 6이 7을 팔로우하므로, 회원 7로 글을 쓰면 12-5를 다시 돌릴 때 피드가 달라진다). S 요청은 약 2초 걸린다.

```check
{
  "requests": [
    {
      "id": "W",
      "title": "이 서버 주소",
      "method": "GET",
      "path": "/fake-site/base"
    },
    {
      "id": "X1",
      "title": "잘못된 입력 — ftp 주소",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p21"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 잘못된 입력 — ftp 주소",
        "content": "링크 미리보기 확인",
        "linkUrl": "ftp://example.com/a"
      }
    },
    {
      "id": "X2",
      "title": "잘못된 입력 — 빈 제목·빈 링크",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p21"
      },
      "body": {
        "boardSlug": "free",
        "title": "",
        "content": "링크 미리보기 확인",
        "linkUrl": ""
      }
    },
    {
      "id": "X3",
      "title": "잘못된 입력 — 링크 501자",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p21"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 잘못된 입력 — 링크 501자",
        "content": "링크 미리보기 확인",
        "linkUrl": "http://localhost:1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      }
    },
    {
      "id": "X4",
      "title": "잘못된 입력 — 본문 없음·javascript: 링크",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p21"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 잘못된 입력 — 본문 없음·javascript: 링크",
        "linkUrl": "javascript:alert(1)"
      }
    },
    {
      "id": "N",
      "title": "링크 없음",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p10"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 링크 없음",
        "content": "링크 미리보기 확인"
      }
    },
    {
      "id": "B",
      "title": "경계값 — 링크 500자(접속 안 되는 주소)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p21"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 경계값 — 링크 500자(접속 안 되는 주소)",
        "content": "링크 미리보기 확인",
        "linkUrl": "http://localhost:1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      }
    },
    {
      "id": "F",
      "title": "빠른 링크",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p08"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 빠른 링크",
        "content": "링크 미리보기 확인",
        "linkUrl": "{{W.body.base}}/fake-site/page?title=spring-cache-guide&delay=0"
      }
    },
    {
      "id": "S",
      "title": "느린 링크(3초)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p09"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 16-4 느린 링크(3초)",
        "content": "링크 미리보기 확인",
        "linkUrl": "{{W.body.base}}/fake-site/page?title=slow-page&delay=3000"
      }
    },
    {
      "id": "GF",
      "title": "빠른 링크 글 상세",
      "method": "GET",
      "path": "/api/posts/{{F.body.id}}"
    },
    {
      "id": "GS",
      "title": "느린 링크 글 상세",
      "method": "GET",
      "path": "/api/posts/{{S.body.id}}"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "X1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "linkUrl"
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
                "contains": "linkUrl"
              }
            ]
          }
        },
        {
          "request": "X3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "linkUrl"
              }
            ]
          }
        },
        {
          "request": "X4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              },
              {
                "path": "$.errors[*].field",
                "contains": "linkUrl"
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
          "request": "N",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.link",
                "type": "null"
              }
            ]
          }
        },
        {
          "request": "B",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.link.url",
                "length": 500
              },
              {
                "path": "$.link.title",
                "type": "null"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "request": "F",
      "expect": {
        "status": 201,
        "headers": {
          "Server-Timing": {
            "matches": "^app;dur=\\d{1,3}$"
          }
        },
        "json": [
          {
            "path": "$.link.url",
            "equals": "{{W.body.base}}/fake-site/page?title=spring-cache-guide&delay=0"
          },
          {
            "path": "$.link.title",
            "equals": "spring-cache-guide"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "S",
      "expect": {
        "status": 201,
        "headers": {
          "Server-Timing": {
            "matches": "^app;dur=(19\\d\\d|2\\d\\d\\d)$"
          }
        },
        "json": [
          {
            "path": "$.link.url",
            "equals": "{{W.body.base}}/fake-site/page?title=slow-page&delay=3000"
          },
          {
            "path": "$.link.title",
            "type": "null"
          }
        ]
      }
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "GF",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.link.title",
                "equals": "spring-cache-guide"
              }
            ]
          }
        },
        {
          "request": "GS",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.link.url",
                "equals": "{{W.body.base}}/fake-site/page?title=slow-page&delay=3000"
              },
              {
                "path": "$.link.title",
                "type": "null"
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
| D1 | `SELECT link_title, link_url IS NOT NULL FROM post WHERE id IN (<F의 id>, <S의 id>) ORDER BY id` | `spring-cache-guide, 1` / `NULL, 1` — 느린 링크도 링크는 저장됐다 |
| D2 | `SELECT COUNT(*) FROM post WHERE title LIKE '[채점] 16-4 잘못된 입력%' AND link_url IS NOT NULL` | `0` — 잘못된 링크는 저장되지 않았다(구현 전에 실행 칸을 돌렸다면 그때 링크 없이 저장된 글이 남아 있을 수 있어 `link_url`이 있는 것만 센다) |
| D3 | `SELECT version, success FROM flyway_schema_history WHERE version = '72'` | `72`, `1` |
| C1 | X1~X4 | 모두 `400` — `errors`에 `linkUrl`(X1·X3), `title`·`linkUrl` 둘 다(X2), `content`·`linkUrl` 둘 다(X4). 어느 것도 `500`이 아니다 |
| C2 | N / B | 링크 없으면 `link: null` / 링크 500자(상한 바로 안쪽)는 `201` — 접속이 안 되는 주소라 `link.title`은 `null` |
| C3 | F | `201`, `link.title` = `spring-cache-guide`, `Server-Timing` 1000ms 미만 |
| C4 | S | `201`, `link.url`은 그대로·`link.title`은 `null`, `Server-Timing`이 1900~2999 — 3초를 다 기다리지 않고 약 2초에 포기했다 |
| C5 | GF / GS | 상세 조회에도 같은 링크·제목(또는 `null`)이 나온다 |
| R1 | 타임아웃 두 개 | 연결 제한과 읽기 제한을 따로 정했다. 각각 언제 걸리는지 말할 수 있다. 읽기 제한은 "한 번 읽을 때 기다리는 시간"이라, 상대가 조금씩 흘려보내면 전체는 2초를 넘을 수 있다는 것도 안다 |
| R2 | 트랜잭션 밖 | 외부 호출이 `@Transactional` 메서드 안에 있지 않다 |
| R3 | 실패 허용 | 미리보기 실패가 예외로 새어 나가 `500`이 되지 않는다. 형식 오류(`400`)와 열리지 않는 주소(`201`, 제목 `null`)를 구분한다 |
| R4 | SSRF | 사용자가 준 주소를 서버가 대신 연다는 위험을 설명할 수 있다 — `http://localhost:…`나 사내 IP, 클라우드 메타데이터 주소(`169.254.169.254`)를 넣으면 우리 서버가 내부망을 대신 두드린다. 실서비스라면 내부 주소를 막는다(이 연습은 가짜 사이트가 localhost라 열어 둔다) |
| R5 | 크기 제한 | 응답 전체를 문자열로 받지 않고 앞부분만 읽는다(수백 MB 파일 링크를 막는다) |

## 필요한 지식

- [S06 — 예제 3 RestClient의 연결·읽기 시간 제한](../../docs/knowledge/S06-rest-api-clients.md#예제-3--restclient의-연결읽기-시간-제한)
- [P25 — RestClient 빈 구성](../../docs/knowledge/P25-external-api-client.md#23-restclient-빈-구성)
- [P25 — connect timeout과 read timeout은 왜 둘 다 필요한가?](../../docs/knowledge/P25-external-api-client.md#q3-connect-timeout과-read-timeout은-왜-둘-다-필요한가)
- [W14 — MVC에서 외부 HTTP 호출이 5초 걸릴 때 무엇이 블로킹되는가?](../../docs/knowledge/W14-sync-async-blocking.md#q2-mvc에서-외부-http-호출이-5초-걸릴-때-무엇이-블로킹되는가)
- [D13 — 용어 사전(SSRF)](../../docs/knowledge/D13-backend-glossary.md)
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — RestClient.Builder 빈이 없다고 기동이 실패한다</summary>

Spring Boot 4는 `RestClient.Builder` 자동 설정이 별도 모듈이다. 의존성을 더하지 않았다면 `RestClient.builder()`로 직접 만든다.

```java
SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
factory.setConnectTimeout(Duration.ofSeconds(1));
factory.setReadTimeout(Duration.ofSeconds(2));
this.restClient = RestClient.builder().requestFactory(factory).build();
```
</details>

<details>
<summary>힌트 2 — 앞부분만 읽기</summary>

```java
String html = restClient.get()
        .uri(URI.create(url))
        .exchange((request, response) -> {
            if (!response.getStatusCode().is2xxSuccessful()) return null;
            try (InputStream in = response.getBody()) {
                return new String(in.readNBytes(64 * 1024), StandardCharsets.UTF_8);
            }
        });
```

시간 초과는 `ResourceAccessException`(원인 `SocketTimeoutException`)으로 나온다. `RuntimeException`으로 넓게 잡아 제목 `null`로 돌린다.
</details>

<details>
<summary>힌트 3 — 빈 문자열은 400인데 null은 통과시키기</summary>

`@Pattern`은 `null`을 통과시키고 빈 문자열은 검사한다. `@Size(max = 500)`과 `@Pattern(regexp = "https?://[^\\s/?#]+\\S*")`만 붙이면 "없으면 통과, 있으면 형식 검사"가 된다. `@NotBlank`는 붙이지 않는다(그러면 필수가 된다).
</details>

## 다음 단계

이 장의 마지막 단계다. [16-1](16-1-new-post-event.md)부터 다시 돌려 보면서 앱 로그의 스레드 이름을 본다. 16-2 이후에는 새 글 알림이 요청 스레드(`http-nio-…`)가 아니라 `notify-…`에서 만들어진다.
