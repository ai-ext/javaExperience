# 14-6. 관련 글 추천 — 태그가 많이 겹치는 순

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "글 맨 아래에 '이 글과 비슷한 글' 다섯 개를 보여 주세요. 태그가 많이 겹칠수록 위로요. 겹치는 수가 같으면 최신 글이 먼저고, 지금 보고 있는 글은 당연히 빼고요."

새 테이블은 없다. 이미 있는 `post_tag`(글-태그 연결)를 **자기 자신과 JOIN**하는 집계 쿼리다. "기준 글의 태그"와 "다른 글의 태그"를 태그 id로 맞붙이면, 맞붙은 줄 수가 곧 겹치는 태그 수다.

까다로운 곳은 **누가 보느냐**다. 후보 중에 팔로워 공개 글이나 나와 차단 관계인 사람의 글이 있으면 빼야 한다. 이 규칙(2-3)을 네이티브 SQL에 다시 쓰면 규칙이 두 군데가 된다. 그래서 SQL은 "누구에게도 안 보이는 글"(삭제·게시 안 됨)만 거르고 후보 전체를 가져온 뒤, 보는 사람 기준은 `PostAccessPolicy`로 거르고 나서 `size`개로 자른다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 — 비슷한 글",
  "summary": "태그가 많이 겹치는 글부터. 지금 글은 빼고, 내가 볼 수 없는 글도 뺀다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "트랜잭션은 어디에 거나요?", "right": "비로그인" },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["spring", "질문"] },
    {
      "type": "list",
      "id": "related",
      "label": "이 글과 비슷한 글",
      "items": [
        { "id": "r5", "title": "스터디원 구해요", "meta": "태그 1개 겹침" },
        { "id": "r3", "title": "인덱스는 언제 타나요?", "meta": "태그 1개 겹침" },
        { "id": "r2", "title": "JPA 연관관계 매핑 정리", "meta": "태그 1개 겹침" }
      ]
    }
  ],
  "flows": [
    {
      "name": "비슷한 글 보기",
      "steps": [
        { "kind": "user", "text": "11번 글을 끝까지 읽는다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/11/related?size=5" },
        { "kind": "server", "text": "기준 글(11번)을 볼 수 있는지 먼저(2-3) — 볼 수 없으면 404" },
        { "kind": "db", "sql": "SELECT other.post_id, COUNT(*) AS shared FROM post_tag base JOIN post_tag other ON other.tag_id = base.tag_id AND other.post_id <> base.post_id JOIN post p ON p.id = other.post_id WHERE base.post_id = 11 AND p.deleted_at IS NULL AND p.status = 'PUBLISHED' GROUP BY other.post_id, p.published_at ORDER BY shared DESC, p.published_at DESC, other.post_id DESC", "note": "spring(2)·질문(8)이 겹치는 글 — 5·3·2번이 한 개씩" },
        { "kind": "db", "sql": "SELECT * FROM post WHERE id IN (5, 3, 2)", "note": "후보 글을 한 번에 읽는다" },
        { "kind": "server", "text": "보는 사람 기준으로 거르고(팔로워 공개·차단) 앞에서 5개" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"items\": [{\"postId\": 5, \"title\": \"스터디원 구해요\", \"sharedTags\": 1}, {\"postId\": 3, \"title\": \"인덱스는 언제 타나요?\", \"sharedTags\": 1}, {\"postId\": 2, \"title\": \"JPA 연관관계 매핑 정리\", \"sharedTags\": 1}]}"
        },
        { "kind": "screen", "text": "겹치는 수가 같아서 최신 글부터 세 개", "focus": ["related"] }
      ]
    },
    {
      "name": "범위 밖 size",
      "steps": [
        { "kind": "user", "text": "앱이 실수로 size=100을 보낸다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/11/related?size=100" },
        { "kind": "server", "text": "size 파싱에서 1~10 범위를 벗어나 400으로 처리한다. 쿼리는 나가지 않는다" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "비슷한 글 칸을 그리지 않는다", "focus": ["related"] }
      ]
    }
  ]
}
```

## 만들 것

마이그레이션 없음 — `post_tag`의 `PRIMARY KEY(post_id, tag_id)`와 `ix_post_tag_tag(tag_id, post_id)`를 그대로 쓴다.

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/posts/{id}/related?size=5` | 관련 글 — **비로그인 가능** | `200` `{ "items": [ { "postId", "title", "sharedTags" } ] }` |

| 규칙 | 내용 |
|---|---|
| 후보 | 기준 글과 태그가 **1개 이상** 겹치는 글. 기준 글 자신은 뺀다 |
| 순서 | 겹치는 태그 수 많은 순 → 같으면 `published_at` 최신 → 그래도 같으면 `id` 큰 순 |
| 보이는 글만 | 보는 사람 기준 2-3 규칙(삭제·임시저장·숨김·팔로워 공개·차단)을 통과한 글만 |
| 기준 글 | 없거나 볼 수 없으면 `404`. 태그가 없으면 `200`, `items: []` |

**입력 규칙** — 본문이 없고 쿼리·경로 값이 입력이다. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 입력 | 필수 | 형식 | 범위 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|
| `size` | 아니오 | 숫자(`abc`·빈 값 → 400) | **1~10** | 생략하면 `5` | `400` |
| 경로 `{id}` | 예 | 숫자(`abc` → 400) | — | — | 없는 글 `404` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 기준 글(11번)을 볼 수 있는지 먼저(2-3) — 볼 수 없으면 404
- spring(2)·질문(8)이 겹치는 글 — 5·3·2번이 한 개씩
- 후보 글을 한 번에 읽는다
- 보는 사람 기준으로 거르고(팔로워 공개·차단) 앞에서 5개

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/{id}/related")`. 변경된 메서드: `related`.

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
<summary>DTO — 요청·응답 필드</summary>

`RelatedPostRow.java`, `RelatedPostsResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/post/RelatedPostRow.java`

```java
package org.example.post;

// 관련 글 후보 한 줄 — 기준 글과 겹치는 태그 수
public interface RelatedPostRow {
    Long getPostId();

    long getShared();
}
```

`src/main/java/org/example/post/RelatedPostsResponse.java`

```java
package org.example.post;

import java.util.List;

public record RelatedPostsResponse(List<Item> items) {

    public record Item(Long postId, String title, long sharedTags) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `related`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

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

    // 14-6: 기준 글과 태그가 겹치는 글 — 겹치는 태그 수 많은 순, 같으면 최신순. 자기 자신은 뺀다.
    // 여기서는 누구에게도 안 보이는 글(삭제·게시 안 됨)만 거르고, 보는 사람마다 다른 규칙(팔로워 공개·차단)은
    // 서비스가 PostAccessPolicy로 거른다. 고정된 후보 제한을 두면 보이는 글을 누락할 수 있으므로 전부 읽는다.
    @Query(nativeQuery = true, value = """
            SELECT other.post_id AS postId, COUNT(*) AS shared
              FROM post_tag base
              JOIN post_tag other ON other.tag_id = base.tag_id AND other.post_id <> base.post_id
              JOIN post p ON p.id = other.post_id
             WHERE base.post_id = :postId
               AND p.deleted_at IS NULL AND p.status = 'PUBLISHED'
             GROUP BY other.post_id, p.published_at
             ORDER BY shared DESC, p.published_at DESC, other.post_id DESC
            """)
    List<RelatedPostRow> findRelatedCandidates(@Param("postId") Long postId);
}
```

</details>

### MyBatis 대안 — 태그 교집합 SQL을 Mapper로 실행

후보 집계는 MyBatis XML에 둔다. 후보 글은 한 번에 읽고 공통 `PostAccessPolicy`로 공개·차단 규칙을 적용한 다음 `size`개를 고른다. 50개 같은 고정 후보 제한은 보이는 글을 누락할 수 있어 두 대안 모두 쓰지 않는다. 후보가 매우 많을 때는 같은 순서를 유지하는 키셋 조회로 최적화할 수 있다.

<details>
<summary>MyBatis / 설정 — build.gradle</summary>

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
<summary>MyBatis / 설정 — application.yml</summary>

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
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / DTO — RelatedCandidateRow.java</summary>

`src/main/java/org/example/post/RelatedCandidateRow.java`

```java
package org.example.post;

// MyBatis가 집계 쿼리 한 행을 생성자에 매핑한다.
public record RelatedCandidateRow(Long postId, Long shared) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — RelatedPostMapper.java</summary>

`src/main/java/org/example/post/RelatedPostMapper.java`

```java
package org.example.post;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RelatedPostMapper {
    List<RelatedCandidateRow> findRelatedCandidates(@Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / SQL — RelatedPostMapper.xml</summary>

`src/main/resources/mapper/RelatedPostMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.RelatedPostMapper">
    <resultMap id="relatedRow" type="org.example.post.RelatedCandidateRow">
        <constructor>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="shared" javaType="long"/>
        </constructor>
    </resultMap>
    <select id="findRelatedCandidates" resultMap="relatedRow">
        SELECT other.post_id, COUNT(*) AS shared
          FROM post_tag base
          JOIN post_tag other ON other.tag_id = base.tag_id AND other.post_id &lt;&gt; base.post_id
          JOIN post p ON p.id = other.post_id
         WHERE base.post_id = #{postId}
           AND p.deleted_at IS NULL AND p.status = 'PUBLISHED'
         GROUP BY other.post_id, p.published_at
         ORDER BY shared DESC, p.published_at DESC, other.post_id DESC
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / JPA 후보 조회 제거 — PostRepository.java</summary>

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
<summary>MyBatis / Service — PostQueryService.java</summary>

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
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// 글 조회 전용 서비스 — 1-3/1-4의 PostService(쓰기)와 책임을 나눈다
@Service
public class PostQueryService {

    private final PostRepository postRepository;
    private final RelatedPostMapper relatedPostMapper;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final PostSearchRepository postSearchRepository;
    private final PostViewRepository postViewRepository;
    private final Clock clock;
    private final RecentViewService recentViewService;

    public PostQueryService(PostRepository postRepository, RelatedPostMapper relatedPostMapper, BoardRepository boardRepository,
                             MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                             PostSearchRepository postSearchRepository, PostViewRepository postViewRepository,
                             Clock clock, RecentViewService recentViewService) {
        this.postRepository = postRepository;
        this.relatedPostMapper = relatedPostMapper;
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

    // 14-6 관련 글 — 기준 글을 볼 수 있어야 하고(404), 후보는 보는 사람 기준(2-3)으로 다시 거른다
    @Transactional(readOnly = true)
    public RelatedPostsResponse related(Long postId, int size, AuthenticatedMember viewer) {
        Post base = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, base)) {
            throw new PostNotFoundException();
        }
        List<RelatedCandidateRow> candidates = relatedPostMapper.findRelatedCandidates(postId);
        Map<Long, Post> posts = postRepository.findAllById(candidates.stream().map(RelatedCandidateRow::postId).toList())
                .stream().collect(Collectors.toMap(Post::getId, Function.identity()));
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        List<RelatedPostsResponse.Item> items = candidates.stream()
                .filter(row -> posts.containsKey(row.postId()) && viewable.test(posts.get(row.postId())))
                .limit(size)
                .map(row -> new RelatedPostsResponse.Item(row.postId(), posts.get(row.postId()).getTitle(), row.shared()))
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
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

</details>

## 직접 확인

이번 실행에서만 쓰는 태그 두 개(`관련a-N`·`관련b-N`, N은 그때의 질문 게시판 글 수)로 글 세 개를 만든다 — 다른 단계나 이전 실행에서 만든 글이 결과에 섞이지 않게. 이스프링의 기준 글(a·b), 한차단의 글(a·b, 2개 겹침), 동시성01의 글(a, 1개 겹침). 한차단은 김자바를 차단했으므로 김자바에게는 한차단의 글이 빠진다.

```bash
BASE=http://localhost:8080
J='Content-Type: application/json'
N=$(curl -s "$BASE/api/boards/qna/posts?size=1" | python3 -c 'import sys,json; print(json.load(sys.stdin)["totalElements"])')   # F0
mk() { curl -s -X POST "$BASE/api/posts" -H "Authorization: Bearer $1" -H "$J" -d "{\"boardSlug\":\"qna\",\"title\":\"[채점] $2\",\"content\":\"관련 글 추천 확인용\",\"tags\":$3}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
A=$(mk tok-lee "관련 글 기준" "[\"관련a-$N\",\"관련b-$N\"]")          # K1
B=$(mk tok-han "관련 글 둘 겹침" "[\"관련a-$N\",\"관련b-$N\"]")        # K2
C=$(mk tok-c01 "관련 글 하나 겹침" "[\"관련a-$N\"]")                   # K3
curl -s "$BASE/api/posts/$A/related"; echo                                         # K4 [B(2), C(1)]
curl -s "$BASE/api/posts/$A/related" -H 'Authorization: Bearer tok-kimjava'; echo  # K5 [C]
curl -s "$BASE/api/posts/11/related?size=10"; echo                                 # 시드 데이터: 5·3·2(각 1개) — 다른 단계에서 spring 태그 글을 만들었다면 그 글도 보인다
curl -i "$BASE/api/posts/$A/related?size=11"                                       # K9b 400
curl -i "$BASE/api/posts/$A/related?size="                                         # K9d 400
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "F0",
      "title": "질문 게시판 글 수(이번 실행만의 태그 이름에 붙인다 — 다시 실행해도 이전 실행의 글과 섞이지 않게)",
      "method": "GET",
      "path": "/api/boards/qna/posts?size=1"
    },
    {
      "id": "K1",
      "title": "기준 글(이스프링) — 태그 a·b",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "qna",
        "title": "[채점] 관련 글 기준",
        "content": "관련 글 추천 확인용",
        "tags": [
          "관련a-{{F0.body.totalElements}}",
          "관련b-{{F0.body.totalElements}}"
        ]
      }
    },
    {
      "id": "K2",
      "title": "한차단의 글 — 태그 a·b(2개 겹침)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-han"
      },
      "body": {
        "boardSlug": "qna",
        "title": "[채점] 관련 글 둘 겹침",
        "content": "관련 글 추천 확인용",
        "tags": [
          "관련a-{{F0.body.totalElements}}",
          "관련b-{{F0.body.totalElements}}"
        ]
      }
    },
    {
      "id": "K3",
      "title": "동시성01의 글 — 태그 a(1개 겹침)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-c01"
      },
      "body": {
        "boardSlug": "qna",
        "title": "[채점] 관련 글 하나 겹침",
        "content": "관련 글 추천 확인용",
        "tags": [
          "관련a-{{F0.body.totalElements}}"
        ]
      }
    },
    {
      "id": "K4",
      "title": "관련 글(비로그인)",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related"
    },
    {
      "id": "K5",
      "title": "관련 글(김자바 — 한차단이 김자바를 차단)",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K6",
      "title": "관련 글 1개만(size=1 — 범위 안쪽 최솟값)",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size=1"
    },
    {
      "id": "K6b",
      "title": "관련 글 size=10(범위 안쪽 최댓값)",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size=10"
    },
    {
      "id": "K7",
      "title": "태그 없는 글(1번)의 관련 글",
      "method": "GET",
      "path": "/api/posts/1/related"
    },
    {
      "id": "K8",
      "title": "삭제된 글(8번)의 관련 글",
      "method": "GET",
      "path": "/api/posts/8/related"
    },
    {
      "id": "K8b",
      "title": "없는 글",
      "method": "GET",
      "path": "/api/posts/999999/related"
    },
    {
      "id": "K8c",
      "title": "잘못된 입력 — 글 id 자리에 문자",
      "method": "GET",
      "path": "/api/posts/abc/related"
    },
    {
      "id": "K9",
      "title": "잘못된 입력 — size=0",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size=0"
    },
    {
      "id": "K9b",
      "title": "잘못된 입력 — size=11",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size=11"
    },
    {
      "id": "K9c",
      "title": "잘못된 입력 — size=abc",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size=abc"
    },
    {
      "id": "K9d",
      "title": "잘못된 입력 — 빈 size",
      "method": "GET",
      "path": "/api/posts/{{K1.body.id}}/related?size="
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "K1",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "K2",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "K3",
          "expect": {
            "status": 201
          }
        }
      ]
    },
    {
      "id": "C2",
      "request": "K4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              "{{K2.body.id}}",
              "{{K3.body.id}}"
            ]
          },
          {
            "path": "$.items[*].sharedTags",
            "equals": [
              2,
              1
            ]
          },
          {
            "path": "$.items[*].postId",
            "notContains": "{{K1.body.id}}"
          }
        ]
      },
      "note": "겹치는 태그가 많은 글이 먼저, 기준 글 자신은 없다"
    },
    {
      "id": "C3",
      "request": "K5",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "equals": [
              "{{K3.body.id}}"
            ]
          }
        ]
      },
      "note": "보는 사람 기준(2-3) — 나를 차단한 회원의 글은 빠진다"
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "K6",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 1
              },
              {
                "path": "$.items[0].postId",
                "equals": "{{K2.body.id}}"
              }
            ]
          }
        },
        {
          "request": "K6b",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C5",
      "request": "K7",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "length": 0
          }
        ]
      }
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "K8",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "K8b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "K8c",
          "expect": {
            "status": 400
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "K9",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "K9b",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "K9c",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "K9d",
          "expect": {
            "status": 400
          }
        }
      ],
      "note": "size는 1~10 — 범위 밖·숫자가 아니거나 빈 값이면 400(500이 아니다)"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{A}`·`{B}`·`{C}`는 K1·K2·K3 응답의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K1~K3 | 모두 `201` |
| C2 | K4 | `200`, `[{B}, {C}]`, `sharedTags` `[2, 1]`, 기준 글 `{A}` 없음 |
| C3 | K5 | `200`, `[{C}]` — 김자바에게는 나를 차단한 한차단의 글이 빠진다 |
| C4 | K6 / K6b | `size=1` → `[{B}]` / `size=10` → `200` — 범위 안쪽 끝값 |
| C5 | K7 | `200`, `items` 0개 — 태그 없는 글 |
| C6 | K8 / K8b / K8c | `404`(삭제된 글) / `404`(없는 글) / `400`(id 자리에 문자) |
| C7 | K9 / K9b / K9c / K9d | 모두 `400`(`size=0`·`size=11`·`size=abc`·`size=`) — 500이 아니다 |
| D1 | CloudBeaver에서 C2의 SQL을 `base.post_id = {A}`로 직접 실행 | `{B}, 2` / `{C}, 1` — API와 같다(SQL은 차단을 모르므로 김자바 기준 결과와는 다르다) |
| D2 | `EXPLAIN` + C2의 SQL | `other`가 `ix_post_tag_tag`(태그 → 글) 인덱스를 쓴다 |
| R1 | 규칙 한 곳 | 보는 사람마다 다른 규칙(팔로워 공개·차단)을 네이티브 SQL에 다시 쓰지 않고 `PostAccessPolicy`로 거른다. 후보를 50개처럼 고정해서 자르면 뒤의 보이는 글이 누락되므로 전체 후보를 정렬한 뒤 공개 정책을 적용한다. 후보가 많을 때는 같은 순서의 키셋 조회로 최적화한다 |
| R2 | 동점 | `ORDER BY shared DESC, published_at DESC, id DESC`처럼 마지막에 유일한 기준이 있다 |
| R3 | N+1 | 후보 글을 한 건씩 `findById` 하지 않고 `findAllById`(IN) 한 번으로 읽는다 |
| R4 | 자기 JOIN | `post_tag`를 두 번(`base`·`other`) 붙이는 이유와, `other.post_id <> base.post_id`가 자기 자신을 빼는 자리라는 것을 설명할 수 있다 |

## 필요한 지식

- [R04 — JOIN 결과 확인](../../docs/knowledge/R04-sql-crud-join.md#3단계-join-결과-확인) — 같은 테이블을 두 번 붙이기
- [R05 인덱스](../../docs/knowledge/R05-index-btree.md) — `(tag_id, post_id)` 인덱스로 "이 태그의 글" 찾기
- [J1 레슨 — 실행 계획 읽기](../../lessons/J1-reading-explain.md)
- [S10 — Projection](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다) — `COUNT(*)` 결과를 인터페이스로 받기
- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 겹치는 태그 수 세기</summary>

11번 글(spring·질문)과 5번 글(spring)을 생각해 보자. `post_tag`에서 11번 줄 두 개와 5번 줄 한 개를 `tag_id`로 맞붙이면 spring끼리 한 줄이 나온다. 그 줄 수를 `GROUP BY other.post_id`로 세면 겹치는 태그 수다. 3번(mysql·질문)은 질문끼리 한 줄.
</details>

<details>
<summary>힌트 2 — 보는 사람 기준으로 거르기</summary>

후보 id 목록 → `postRepository.findAllById(ids)`로 한 번에 읽어 `Map<Long, Post>` → `accessPolicy.viewableBy(viewer)`로 거르기 → SQL 순서 그대로 `limit(size)`. `findAllById`는 순서를 보장하지 않으니 순서는 SQL 결과(후보 목록)를 따라간다.
</details>

## 다음 단계

[14-7. 월별 아카이브](14-7-monthly-archive.md)
