# 13-5. 도배 방지 — 429

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다. 이 단계는 실제로 흐르는 1분을 센다(practice의 고정 시계로는 1분이 지나지 않는다).

## 상황

> "어떤 분이 1분에 글을 수십 개씩 올려서 자유 게시판 첫 화면이 다 덮였어요. 한 사람이 1분에 5개까지만 쓰게 해 주세요. 막힐 때는 '몇 초 뒤에 다시 쓰세요'라고 알려 주고요. 읽기는 막지 마세요."

금칙어(13-4)는 **내용**을 보고, 도배 방지는 **빈도**를 본다. 요청이 너무 잦을 때 쓰는 HTTP 상태는 `429 Too Many Requests`다. 언제 다시 하면 되는지는 `Retry-After` 헤더(초)로 알려 준다.

이 단계는 별도 저장소(Redis 등) 없이 **DB에 이미 있는 글**로 센다. "이 회원이 최근 60초 안에 쓴 글이 몇 개인가"를 글을 쓸 때마다 묻는 것이다. 정할 것이 두 가지 있다.

- **무엇을 세나** — 이 단계는 **지우지 않은 글**만 센다. 지운 글까지 세면 실수로 쓴 글을 지우고 다시 쓰는 사람도 막힌다. 대신 "쓰고 지우고 다시 쓰기"로 제한을 피할 수 있다(R3).
- **어떤 시계로 세나** — 글의 `created_at`을 찍는 값과 **같은 값**으로 센다. 시계가 둘이면(예: 하나는 `Clock` 빈, 하나는 `LocalDateTime.now()`) 서버 시간대에 따라 몇 시간씩 어긋나 창이 영원히 비거나 영원히 찬다.

동시에 두 요청이 오면 둘 다 "4개"로 세고 통과할 수 있다. 이번 단계에서는 이 틈을 막지 않는다(락이 필요하다 — R4).

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 1분에 5개",
  "summary": "최근 60초 안에 지우지 않은 글이 5개면 여섯 번째는 429 + Retry-After. 읽기와 다른 회원은 그대로.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "동시성06" },
    { "type": "field", "id": "title", "label": "제목", "value": "[채점] 도배 확인" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "toast", "id": "toast-429", "value": "글은 1분에 5개까지 쓸 수 있어요. 42초 뒤에 다시 시도해 주세요.", "tone": "warning" },
    { "type": "stats", "id": "counter", "items": [{ "id": "recent", "label": "최근 1분 동안 쓴 글", "value": "5 / 5" }] }
  ],
  "flows": [
    {
      "name": "여섯 번째 글",
      "steps": [
        { "kind": "user", "text": "1분 안에 다섯 개를 쓰고 여섯 번째 [등록]", "focus": ["submit", "recent"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-c06", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 도배 확인\", ...}" },
        { "kind": "server", "text": "입력 검증(1-5)·금칙어(13-4)를 통과한 요청만 센다 → 최근 60초 안의 지우지 않은 글을 최신순으로 5개까지 읽는다 → 5개면 가장 오래된 것이 창을 벗어날 때까지 남은 초를 계산해 429" },
        { "kind": "db", "sql": "SELECT created_at FROM post WHERE author_id = 12 AND deleted_at IS NULL AND created_at > :from ORDER BY created_at DESC LIMIT 5", "note": ":from = 글 created_at에 사용할 now에서 60초를 뺀 값; ix_post_author_created (V45)" },
        { "kind": "response", "status": 429, "headers": ["Retry-After: 42"], "body": "{\"status\": 429, \"detail\": \"글은 1분에 5개까지 쓸 수 있습니다. 잠시 뒤 다시 시도해 주세요.\", \"retryAfterSeconds\": 42}" },
        { "kind": "screen", "text": "몇 초 뒤에 다시 쓰라는 토스트", "focus": ["toast-429"] }
      ]
    }
  ]
}
```

## 만들 것

**V45** — `db/migration/V45__post_author_created_index.sql`: `CREATE INDEX ix_post_author_created ON post (author_id, created_at)` — 그 회원의 최근 범위만 읽게 한다.

**규칙** — 새 글을 만드는 `POST /api/posts`와 `POST /api/posts/{sourceId}/copies`에 적용

| 항목 | 내용 |
|---|---|
| 셀 대상 | 그 회원이 쓴 글 중 **지우지 않은** 글, `created_at`이 최근 60초 안 |
| 한도 | 5개 — 6번째부터 거절. 정확히 5번째는 `201` |
| 언제 세나 | 입력 검증(1-5)과 금칙어(13-4)를 **통과한 뒤**. `400`인 요청은 글이 생기지 않으니 세지 않는다 |
| 응답 | `429` + 헤더 `Retry-After: <초>`(1~60) + 본문 ProblemDetail에 `retryAfterSeconds` 같은 값 |
| `Retry-After` 계산 | 창 안의 글 5개 중 가장 오래된 것이 60초를 넘기는 순간까지 남은 초(올림, 최소 1) |
| 시계 | 글의 `created_at`에 찍을 값과 같은 "지금"으로 센다. 그 값은 **초로 자른다** — `DATETIME`은 소수 초를 반올림해 저장하므로(`…:09.6` → `:10`), 자르지 않으면 저장된 시각이 "지금"보다 뒤가 되어 `Retry-After`가 61이 나온다(정답 구현을 처음 만들 때 실제로 이렇게 실패했다). 15-3에서 작성 시각을 `Clock`으로 바꾸면 이 창도 같은 `Clock`으로 세고, practice처럼 시계가 멈춘 프로파일에서는 검사를 건너뛴다(15-3) |
| 영향 없는 것 | 읽기(GET), 다른 회원, 댓글 |
| 복사 API | 복사도 새 글 행을 만들므로 같은 회원의 남은 생성 횟수를 사용한다. 입력·금칙어 검사 후 센다 |
| CORS | 브라우저 JS가 `Retry-After`를 읽을 수 있게 `CorsConfig`의 `exposedHeaders`에 `Retry-After`를 더한다(기본 노출 헤더가 아니다) |

- 새 입력 필드는 없다. 글 작성의 필드 규칙(1-5)은 그대로이고, 잘못된 입력이 `429`보다 먼저 `400`으로 나간다.

## 구현 가이드

먼저 **만들 것**과 C·D 기준대로 직접 작성한다. 아래 역할을 누르면 실행 검증한 정답 코드의 파일 전문을 볼 수 있다. Controller·DTO는 선행 단계의 코드이며, 이번 단계에서는 Service·조회·예외·인덱스가 연결된다. MyBatis에서는 최근 글 조회만 Mapper로 바꾸고 나머지 역할은 같은 코드를 사용한다.

<details>
<summary>Controller — 생성·복사 진입점</summary>

`src/main/java/org/example/post/PostController.java`

```java
package org.example.post;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.tag.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

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
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

</details>

<details>
<summary>DTO — 생성 입력과 복사 입력</summary>

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
        JsonNode imageIds
) {
}
```

</details>

<details>
<summary>DTO — 복사 입력</summary>

`src/main/java/org/example/post/CopyPostRequest.java`

```java
package org.example.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CopyPostRequest(
        @NotBlank @Size(max = 200) String title
) {
}
```

</details>

<details>
<summary>Service — 입력 검증·도배 제한·저장</summary>

`src/main/java/org/example/post/PostService.java`

```java
package org.example.post;

import org.example.auth.AuthenticatedMember;
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

        // 13-5 도배 방지 — 입력이 올바른 요청만 센다(400인 요청은 글이 생기지 않으니 셀 것도 없다).
        // 글의 created_at에 찍을 값과 같은 now로 센다(practice의 고정 Clock을 쓰면 1분이 영원히 지나지 않는다).
        // 초로 자른다 — DATETIME은 소수 초를 반올림해 저장해서(…:09.6 → :10) 저장된 값이 "미래"가 되고 Retry-After가 61이 된다(실측)
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        rateLimiter.check(authorId, now);

        String visibility = request.visibility() != null ? request.visibility() : DEFAULT_VISIBILITY;
        // 11-1 상태를 안 보내면 지금처럼 바로 발행. DRAFT면 published_at은 비워 둔다(Post 생성자)
        String status = request.status() != null ? request.status() : PUBLISHED;
        Post post = new Post(board, author, filtered.get("title"), filtered.get("content"),
                status, visibility, now);

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
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
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
                post.getStatus(), post.getPublishedAt(), post.getCreatedAt());
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
<summary>JPA / Repository — 최근 60초 글 조회</summary>

`src/main/java/org/example/post/PostRepository.java`

```java
package org.example.post;

import jakarta.persistence.LockModeType;
import org.example.board.Board;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// Spring Data JPA가 구현을 만들어 준다(1-3의 메모리 구현을 대체)
public interface PostRepository extends JpaRepository<Post, Long> {

    // 발행 중 같은 글을 다시 발행하지 않도록 트랜잭션 끝까지 글 행을 잠근다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Post p WHERE p.id = :id")
    java.util.Optional<Post> findByIdForUpdate(@Param("id") Long id);

    // 6-5: 두 표시의 합집합/교집합을 페이지 적용 전에 DB에서 판정한다.
    @EntityGraph(attributePaths = {"author", "board"})
    @Query(value = """
            SELECT p FROM Post p
            WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deletedAt IS NULL
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                  WHERE (b.blocker.id = :memberId AND b.blocked = p.author)
                     OR (b.blocked.id = :memberId AND b.blocker = p.author))
              AND (:liked = false OR EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p))
              AND (:bookmarked = false OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
              AND (EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p)
                   OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
            """,
            countQuery = """
            SELECT COUNT(p) FROM Post p
            WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deletedAt IS NULL
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                  WHERE (b.blocker.id = :memberId AND b.blocked = p.author)
                     OR (b.blocked.id = :memberId AND b.blocker = p.author))
              AND (:liked = false OR EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p))
              AND (:bookmarked = false OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
              AND (EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p)
                   OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
            """)
    Page<Post> findMarkedPosts(@Param("memberId") Long memberId,
                               @Param("liked") boolean liked,
                               @Param("bookmarked") boolean bookmarked,
                               Pageable pageable);

    // 2-3의 "볼 수 있나" 규칙 중 목록에 해당하는 부분을 쿼리로 옮긴 것 — PostAccessPolicy.canView와
    // 같은 규칙이지만, 목록은 PUBLISHED 글만 대상이다(자기 임시저장·운영자 숨김 글도 목록에는 넣지 않는다).
    // 메모리에서 거르지 않고 쿼리에서 걸러야 페이지 크기·totalElements가 맞는다.
    //
    // Page<Post> 대신 List<Post> + 아래 countViewableByBoard를 따로 둔다: Page<>로 받으면
    // Spring Data가 "content 개수 < size면 count 쿼리를 생략"하는 최적화를 적용해서, size=5(꽉 찬
    // 페이지, count 쿼리 나감)와 size=20(13개뿐이라 마지막 페이지, count 쿼리 생략)의 SQL 문장 수가
    // 13과1씩 달라졌다(2-4의 PostListQueryCountTest가 요구하는 "size와 무관하게 문장 수 동일"이 깨짐).
    // count를 항상 명시적으로 실행해 문장 수를 size와 무관하게 고정한다(R2와도 맞다).
    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author
            WHERE p.board = :board
              AND p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (
                   p.visibility = 'PUBLIC'
                   OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
                   OR (:viewerId IS NOT NULL AND EXISTS (
                           SELECT 1 FROM Follow f
                           WHERE f.follower.id = :viewerId AND f.followee = p.author))
              )
              AND (
                   :viewerId IS NULL OR NOT EXISTS (
                       SELECT 1 FROM MemberBlock b
                       WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
                          OR (b.blocked.id = :viewerId AND b.blocker = p.author)
                   )
              )
            """)
    List<Post> findViewableByBoard(@Param("board") Board board,
                                    @Param("viewerId") Long viewerId,
                                    Pageable pageable);

    // findViewableByBoard와 같은 조건의 건수 — 반드시 같이 고친다
    @Query("""
            SELECT COUNT(p) FROM Post p
            WHERE p.board = :board
              AND p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (
                   p.visibility = 'PUBLIC'
                   OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
                   OR (:viewerId IS NOT NULL AND EXISTS (
                           SELECT 1 FROM Follow f
                           WHERE f.follower.id = :viewerId AND f.followee = p.author))
              )
              AND (
                   :viewerId IS NULL OR NOT EXISTS (
                       SELECT 1 FROM MemberBlock b
                       WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
                          OR (b.blocked.id = :viewerId AND b.blocker = p.author)
                   )
              )
            """)
    long countViewableByBoard(@Param("board") Board board, @Param("viewerId") Long viewerId);

    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author a
            JOIN p.board b
            WHERE a.id = :memberId
              AND b.slug = :boardSlug
              AND p.status = 'PUBLISHED'
              AND p.visibility = 'PUBLIC'
              AND p.deletedAt IS NULL
            ORDER BY p.publishedAt DESC, p.id DESC
            """)
    List<Post> findPublicPostsByAuthorAndBoard(@Param("memberId") Long memberId,
                                                @Param("boardSlug") String boardSlug);
    // 4-2: "읽고 +1 해서 저장" 대신 DB가 한 번에 더한다 — 두 요청이 동시에 와도 읽고 쓰는 사이에
    // 끼어들 틈이 없다(갱신 손실 방지). 영속성 컨텍스트를 거치지 않으므로 최신 값은 findLikeCountById로 다시 읽는다.
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
    int incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :id AND p.likeCount > 0")
    int decrementLikeCount(@Param("id") Long id);

    @Query("SELECT p.likeCount FROM Post p WHERE p.id = :id")
    Integer findLikeCountById(@Param("id") Long id);

    // 11-1 내 임시저장 글 — 게시판 slug를 같이 쓰므로 fetch join(글마다 board를 따로 읽지 않는다)
    @Query("""
            SELECT p FROM Post p JOIN FETCH p.board
             WHERE p.author.id = :authorId AND p.status = 'DRAFT' AND p.deletedAt IS NULL
             ORDER BY p.updatedAt DESC, p.id DESC
            """)
    List<Post> findMyDrafts(@Param("authorId") Long authorId);

    // 11-3 조회수 +1 — 4-2의 좋아요 수처럼 DB가 한 문장 안에서 더한다. 다시 읽는 값은 findViewCountById로
    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int incrementViewCount(@Param("id") Long id);

    // REPEATABLE READ의 오래된 읽기 스냅샷 대신 현재 커밋된 값을 본다.
    @Query(nativeQuery = true, value = "SELECT view_count FROM post WHERE id = :id FOR UPDATE")
    Integer findViewCountById(@Param("id") Long id);

    // 11-5 휴지통 — 내가 쓰고 내가 지운 글, since 이후에 지운 것만(30일 안)
    @Query("""
            SELECT p FROM Post p JOIN FETCH p.board
             WHERE p.author.id = :memberId AND p.deletedBy = :memberId
               AND p.deletedAt IS NOT NULL AND p.deletedAt >= :since
             ORDER BY p.deletedAt DESC, p.id DESC
            """)
    List<Post> findMyTrash(@Param("memberId") Long memberId, @Param("since") LocalDateTime since);

    // 5-1: 댓글 저장과 같은 트랜잭션에서 comment_count를 원자적으로 올린다(4-2와 같은 방식)
    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
    int incrementCommentCount(@Param("id") Long id);

    // 5-3: 댓글 삭제와 같은 트랜잭션에서 내린다
    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount - 1 WHERE p.id = :id AND p.commentCount > 0")
    int decrementCommentCount(@Param("id") Long id);

    // 8-2: 기간 [from, to) 안의 좋아요×3 + 댓글(삭제 제외)×1. 누적 like_count(어긋날 수 있음)를 쓰지 않고
    // 기간 안의 행을 센다. 글마다 따로 세지 않고 미리 집계한 서브쿼리 두 개를 LEFT JOIN한다.
    // 볼 수 있는 글(비로그인 기준)·점수 > 0·정렬·LIMIT을 모두 DB에서 처리한다.
    @Query(nativeQuery = true, value = """
            SELECT p.id AS postId,
                   p.title AS title,
                   COALESCE(l.cnt, 0) * 3 + COALESCE(c.cnt, 0) AS score,
                   COALESCE(l.cnt, 0) AS likes,
                   COALESCE(c.cnt, 0) AS comments
              FROM post p
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt
                           FROM post_like
                          WHERE created_at >= :from AND created_at < :to
                          GROUP BY post_id) l ON l.post_id = p.id
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt
                           FROM comment
                          WHERE deleted_at IS NULL AND created_at >= :from AND created_at < :to
                          GROUP BY post_id) c ON c.post_id = p.id
             WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
               AND (l.cnt IS NOT NULL OR c.cnt IS NOT NULL)
             ORDER BY score DESC, p.published_at DESC, p.id DESC
             LIMIT :limit
            """)
    List<PopularPostRow> findPopular(@Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to,
                                     @Param("limit") int limit);

    // 12-5 피드 — 작성자가 나이거나 내가 팔로우하는 회원인 게시된 글. 차단 관계(어느 쪽이든)와 내가 뮤트한 회원의 글은 뺀다.
    // 팔로워 공개 글은 따로 걸지 않는다 — 작성자가 나 또는 팔로잉뿐이라 저절로 볼 수 있다.
    // 키셋 커서 (published_at, id). 작성자는 함께 읽고 태그는 batch fetch(2-4)가 묶어 읽는다.
    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author a
            WHERE p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (a.id = :me OR EXISTS (SELECT 1 FROM Follow f WHERE f.follower.id = :me AND f.followee = a))
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                              WHERE (b.blocker.id = :me AND b.blocked = a) OR (b.blocked.id = :me AND b.blocker = a))
              AND NOT EXISTS (SELECT 1 FROM MemberMute m WHERE m.muter.id = :me AND m.muted = a)
              AND (
                   :cursorAt IS NULL
                   OR p.publishedAt < :cursorAt
                   OR (p.publishedAt = :cursorAt AND p.id < :cursorId)
              )
            ORDER BY p.publishedAt DESC, p.id DESC
            """)
    List<Post> findFeed(@Param("me") Long me,
                        @Param("cursorAt") LocalDateTime cursorAt,
                        @Param("cursorId") Long cursorId,
                        Pageable pageable);

    // 13-5 도배 방지 — 이 회원이 from 이후에 쓴, 지우지 않은 글의 작성 시각(최신순). ix_post_author_created를 탄다
    @Query("""
            SELECT p.createdAt FROM Post p
            WHERE p.author.id = :authorId AND p.deletedAt IS NULL AND p.createdAt > :from
            ORDER BY p.createdAt DESC
            """)
    List<LocalDateTime> findRecentCreatedAt(@Param("authorId") Long authorId, @Param("from") LocalDateTime from,
                                            Pageable pageable);
}
```

</details>

<details>
<summary>JPA / Service — 5개 한도와 Retry-After 계산</summary>

`src/main/java/org/example/post/PostRateLimiter.java`

```java
package org.example.post;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

// 13-5 도배 방지 — 한 회원이 최근 WINDOW 동안 쓴(지우지 않은) 글이 LIMIT개면 더 못 쓴다.
// "지금"은 밖에서 받는다 — 글의 created_at에 찍을 값과 같은 값으로 세야 시계가 어긋나지 않는다.
// 같은 회원의 요청 두 개가 동시에 오면 둘 다 4개로 세고 통과할 수 있다(6개가 될 수 있음) — 정확히 막으려면 락이 필요하다(이번 범위 밖).
@Component
public class PostRateLimiter {

    static final int LIMIT = 5;
    static final Duration WINDOW = Duration.ofSeconds(60);

    private final PostRepository postRepository;

    public PostRateLimiter(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public void check(Long authorId, LocalDateTime now) {
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
<summary>Flyway / SQL — 회원·생성 시각 인덱스</summary>

`src/main/resources/db/migration/V45__post_author_created_index.sql`

```sql
-- V45 — 도배 방지(13-5)가 "이 회원이 최근 1분 동안 쓴 글"을 글을 쓸 때마다 센다.
-- (author_id, created_at) 인덱스면 그 회원의 최근 범위만 읽는다(fk_post_author 단일 인덱스는 그 회원의 글 전체를 읽는다).
CREATE INDEX ix_post_author_created ON post (author_id, created_at);
```

</details>

<details>
<summary>예외 — 429와 Retry-After 응답</summary>

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
<summary>예외 — 429 값 객체</summary>

`src/main/java/org/example/post/TooManyPostsException.java`

```java
package org.example.post;

// 13-5 — 전역 핸들러가 429 + Retry-After(초)로 바꾼다
public class TooManyPostsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyPostsException(long retryAfterSeconds) {
        super("글은 1분에 5개까지 쓸 수 있습니다. 잠시 뒤 다시 시도해 주세요.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
```

</details>

<details>
<summary>설정 — CORS 응답 헤더 노출</summary>

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
                // 13-5: 브라우저 JS가 429의 Retry-After를 읽으려면 노출해야 한다(CORS 기본 노출 헤더가 아니다)
                .exposedHeaders("Location", "WWW-Authenticate", "Retry-After");
    }
}
```

</details>

<details>
<summary>MyBatis / Mapper — 최근 글 조회 인터페이스</summary>

`src/main/java/org/example/post/PostRateMapper.java`

```java
package org.example.post;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PostRateMapper {
    List<LocalDateTime> findRecentCreatedAt(@Param("authorId") Long authorId,
                                            @Param("from") LocalDateTime from,
                                            @Param("limit") int limit);
}
```

</details>

<details>
<summary>MyBatis / SQL — 최근 글 조회</summary>

`src/main/resources/mapper/PostRateMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.PostRateMapper">
    <select id="findRecentCreatedAt" resultType="java.time.LocalDateTime">
        SELECT created_at
        FROM post
        WHERE author_id = #{authorId}
          AND deleted_at IS NULL
          AND created_at &gt; #{from}
        ORDER BY created_at DESC
        LIMIT #{limit}
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — 같은 한도 계산</summary>

`src/main/java/org/example/post/PostRateLimiter.java`

```java
package org.example.post;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

// 13-5 도배 방지 — 한 회원이 최근 WINDOW 동안 쓴(지우지 않은) 글이 LIMIT개면 더 못 쓴다.
// "지금"은 밖에서 받는다 — 글의 created_at에 찍을 값과 같은 값으로 세야 시계가 어긋나지 않는다.
// 같은 회원의 요청 두 개가 동시에 오면 둘 다 4개로 세고 통과할 수 있다(6개가 될 수 있음) — 정확히 막으려면 락이 필요하다(이번 범위 밖).
@Component
public class PostRateLimiter {

    static final int LIMIT = 5;
    static final Duration WINDOW = Duration.ofSeconds(60);

    private final PostRateMapper postRateMapper;

    public PostRateLimiter(PostRateMapper postRateMapper) {
        this.postRateMapper = postRateMapper;
    }

    public void check(Long authorId, LocalDateTime now) {
        LocalDateTime from = now.minus(WINDOW);
        // 창 안의 글을 최신순으로 LIMIT개까지만 읽는다 — LIMIT개가 다 차 있으면 막는다
        List<LocalDateTime> recent = postRateMapper.findRecentCreatedAt(authorId, from, LIMIT);
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

## 직접 확인

회원 12(`tok-c06`)가 연달아 쓴다. 끝에서 만든 글을 모두 지운다.

```bash
BASE=http://localhost:8080
C6='Authorization: Bearer tok-c06'; J='Content-Type: application/json'
B='{"boardSlug":"free","title":"[채점] 도배 확인","content":"1분 안에 여러 번 쓰기"}'

IDS=()
for i in 1 2 3 4 5 6; do
  out=$(curl -s -D /tmp/h -X POST "$BASE/api/posts" -H "$C6" -H "$J" -d "$B")
  echo "#$i $(head -1 /tmp/h | tr -d '\r') $(grep -i '^retry-after' /tmp/h | tr -d '\r')"
  IDS+=($(echo "$out" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id",""))'))
done                                                              # #1~#5 201, #6 429 + Retry-After
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/2" -H "$C6"                    # 읽기 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H "$C6" -H "$J" -d '{"boardSlug":"free","content":"제목 없음"}'   # 400(429보다 먼저)
for id in "${IDS[@]}"; do curl -s -o /dev/null -X DELETE "$BASE/api/posts/$id" -H "$C6"; done   # 뒷정리
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H "$C6" -H "$J" -d "$B"   # 지운 글은 세지 않으므로 다시 201(이 글도 지운다)
```

1분을 기다려 풀리는 것은 직접 보면 된다. 위 `for` 루프를 다시 돌려 #6이 `429`인 것을 확인하고, `Retry-After`초만큼 기다린 뒤 다시 쓰면 `201`이다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끝에서 만든 글을 모두 지우므로(지운 글은 세지 않는다) 바로 다시 눌러도 같은 결과다.

```check
{
  "requests": [
    {"id": "P", "title": "회원 12가 연달아 6번 글쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06", "Origin": "http://localhost:3000"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인", "content": "1분 안에 여러 번 쓰기"}, "repeat": 6},
    {"id": "O", "title": "다른 회원(13)의 글쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c07"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인 — 다른 회원", "content": "영향 없음"}},
    {"id": "V", "title": "회원 12의 잘못된 글(제목 없음)", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"boardSlug": "free", "content": "제목 없음"}},
    {"id": "VI", "title": "제한 중 잘못된 이미지 ID", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인", "content": "잘못된 이미지", "imageIds": ["문자"]}},
    {"id": "VT", "title": "제한 중 공백 태그", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인", "content": "잘못된 태그", "tags": ["   "]}},
    {"id": "D", "title": "회원 12가 첫 글을 지움", "method": "DELETE", "path": "/api/posts/{{P#1.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "Q", "title": "지운 뒤 다시 쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인", "content": "1분 안에 여러 번 쓰기"}},
    {"id": "Q2", "title": "또 쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"boardSlug": "free", "title": "[채점] 도배 확인", "content": "1분 안에 여러 번 쓰기"}},
    {"id": "CP", "title": "복사로 제한 우회 거절", "method": "POST", "path": "/api/posts/2/copies", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"title": "[채점] 복사 도배"}},
    {"id": "G", "title": "막힌 동안 읽기", "method": "GET", "path": "/api/posts/2", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "X2", "title": "뒷정리 — 2번째 글", "method": "DELETE", "path": "/api/posts/{{P#2.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "X3", "title": "뒷정리 — 3번째 글", "method": "DELETE", "path": "/api/posts/{{P#3.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "X4", "title": "뒷정리 — 4번째 글", "method": "DELETE", "path": "/api/posts/{{P#4.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "X5", "title": "뒷정리 — 5번째 글", "method": "DELETE", "path": "/api/posts/{{P#5.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "X6", "title": "뒷정리 — 6번째(막혔어야 할) 글", "method": "DELETE", "path": "/api/posts/{{P#6.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "XQ", "title": "뒷정리 — Q 글", "method": "DELETE", "path": "/api/posts/{{Q.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "XQ2", "title": "뒷정리 — Q2(막혔어야 할) 글", "method": "DELETE", "path": "/api/posts/{{Q2.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}},
    {"id": "XO", "title": "뒷정리 — 다른 회원 글", "method": "DELETE", "path": "/api/posts/{{O.body.id}}", "headers": {"Authorization": "Bearer tok-c07"}},
    {"id": "CP2", "title": "삭제로 빈자리 뒤 복사", "method": "POST", "path": "/api/posts/2/copies", "headers": {"Authorization": "Bearer tok-c06"}, "body": {"title": "[채점] 복사 도배"}},
    {"id": "XCP2", "title": "뒷정리 — 복사 글", "method": "DELETE", "path": "/api/posts/{{CP2.body.id}}", "headers": {"Authorization": "Bearer tok-c06"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "P#1", "expect": {"status": 201}}, {"request": "P#2", "expect": {"status": 201}}, {"request": "P#3", "expect": {"status": 201}}, {"request": "P#4", "expect": {"status": 201}}, {"request": "P#5", "expect": {"status": 201}}, {"request": "P#6", "expect": {"status": 429, "headers": {"Retry-After": {"matches": "^(?:[1-9]|[1-5][0-9]|60)$", "equals": "{{P#6.body.retryAfterSeconds}}"}, "Access-Control-Expose-Headers": {"matches": "Retry-After"}}, "json": [{"path": "$.status", "equals": 429}, {"path": "$.retryAfterSeconds", "gte": 1}, {"path": "$.retryAfterSeconds", "lte": 60}]}}]},
    {"id": "C2", "all": [{"request": "P#6", "expect": {"status": 429, "headers": {"Retry-After": {"matches": "^(?:[1-9]|[1-5][0-9]|60)$", "equals": "{{P#6.body.retryAfterSeconds}}"}, "Access-Control-Expose-Headers": {"matches": "Retry-After"}}, "json": [{"path": "$.status", "equals": 429}, {"path": "$.retryAfterSeconds", "gte": 1}, {"path": "$.retryAfterSeconds", "lte": 60}]}}, {"request": "O", "expect": {"status": 201}}, {"request": "G", "expect": {"status": 200}}, {"request": "V", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "title"}]}}, {"request": "VI", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "imageIds[0]"}]}}, {"request": "VT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "tags"}]}}]},
    {"id": "C3", "all": [{"request": "D", "expect": {"status": 204}}, {"request": "Q", "expect": {"status": 201}}, {"request": "Q2", "expect": {"status": 429, "headers": {"Retry-After": {"present": true}}}}]}
    ,{"id": "C4", "all": [{"request": "CP", "expect": {"status": 429, "headers": {"Retry-After": {"present": true}}}}, {"request": "CP2", "expect": {"status": 201}}, {"request": "XCP2", "expect": {"status": 204}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | P#1~P#5 / P#6 | 다섯 번째까지 `201`(경계 안쪽) / 여섯 번째 `429`, `Retry-After` 헤더 1~60, 본문 `retryAfterSeconds` 1~60 |
| C2 | P#6 / O / G / V / VI / VT | 막힌 상태에서도 다른 회원 글쓰기 `201`, 같은 회원 읽기 `200`, 같은 회원의 잘못된 제목·이미지 ID·태그는 `429`가 아니라 `400` |
| C3 | D / Q / Q2 | 첫 글을 지우면 자리가 하나 생겨 `201` → 다시 꽉 차서 `429` — 지우지 않은 글만 센다 |
| C4 | CP / CP2 / XCP2 | 5개가 찬 뒤 복사도 `429`, 정리 뒤 복사는 `201`, 삭제 `204` |
| D1 | `SELECT COUNT(*) FROM post WHERE author_id = 12 AND deleted_at IS NULL AND title = '[채점] 도배 확인'` | `0` — 뒷정리로 모두 지웠다 |
| D2 | 실행 **전**과 **후**에 `SELECT COUNT(*) FROM post WHERE author_id = 12 AND title = '[채점] 도배 확인'` | 후 = 전 + 6 — 한 번 실행에 P#1~#5와 Q만 저장되고 막힌 요청(P#6·Q2)은 저장되지 않았다(지운 행도 세므로 차이로 본다) |
| D3 | `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'community' AND table_name = 'post' AND index_name = 'ix_post_author_created'` | `2` — 두 열 인덱스 |
| R1 | 같은 시계 | 창을 계산하는 "지금"과 글의 `created_at`이 같은 값(같은 시계)이다. `Clock` 빈과 `LocalDateTime.now()`를 섞으면 어떤 서버에서 깨지는지(시간대가 UTC인 서버, practice의 고정 시계) 말할 수 있다 |
| R2 | 세는 쿼리 | 최근 60초 범위만 읽고(`LIMIT 5`), 인덱스 `(author_id, created_at)`을 탄다는 것을 `EXPLAIN`으로 확인했다. 그 회원의 글을 전부 읽어 자바에서 세지 않는다 |
| R3 | 무엇을 세나 | 지운 글을 세지 않는 대가("쓰고 지우고 다시 쓰기"로 피해 갈 수 있음)와, 지운 글까지 세는 대가(실수한 사람도 막힘)를 비교하고 고른 이유를 말한다 |
| R4 | 동시 요청 | 같은 회원의 요청 두 개가 동시에 오면 둘 다 4개로 세고 통과해 6개가 될 수 있다는 것을 안다. 정확히 막으려면 회원 행 잠금(`SELECT … FOR UPDATE`)이나 Redis `INCR` 같은 원자적 카운터가 필요하다 |

## 필요한 지식

- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — 429와 `Retry-After`
- [W20 시간과 시간대](../../docs/knowledge/W20-time-timezone.md) — 시계를 하나로(R1)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 두 열 인덱스와 범위 조건
- [F3 CORS](../../lessons/F3-cors.md) — 응답 헤더를 브라우저에 노출하기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 세기</summary>

```java
@Query("SELECT p.createdAt FROM Post p WHERE p.author.id = :authorId AND p.deletedAt IS NULL "
     + "AND p.createdAt > :from ORDER BY p.createdAt DESC")
List<LocalDateTime> findRecentCreatedAt(Long authorId, LocalDateTime from, Pageable pageable);
```

`PageRequest.of(0, 5)`로 5개까지만 읽고, 5개면 `recent.get(4).plusSeconds(60)`까지 남은 초가 `Retry-After`다. 글 작성 서비스에서 `now`를 한 번 구해 이 확인과 `new Post(..., now)`에 같이 넘긴다.
</details>

<details>
<summary>힌트 2 — 429 응답</summary>

전역 핸들러에서 `ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).header(HttpHeaders.RETRY_AFTER, "42").body(problem)`. 1-6의 401 핸들러가 `WWW-Authenticate` 헤더를 붙이는 것과 같은 방식이다.
</details>

## 다음 단계

[13-6. 신고 내역 CSV 내려받기](13-6-csv-export.md)
