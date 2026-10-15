# 14-5. 최근 본 글 — 내 기록 20개

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "마이페이지에 '최근 본 글'을 넣어 주세요. 최근에 연 글부터 20개까지요. 같은 글을 또 보면 두 줄이 되면 안 되고 맨 위로 올라와야 해요. 기록은 전부 지우거나 하나씩 지울 수 있게요."

기존 API(`GET /api/posts/{id}`, 2-1)가 **성공할 때 부수 기록을 남기는** 일이다. 세 가지를 정해야 한다.

1. **언제 남기나** — 로그인했고, 그 글을 **볼 수 있어서 200이 나갈 때만**. 404가 난 글(차단·숨김)을 기록하면 "그런 글이 있다"는 흔적이 남는다.
2. **같은 글을 또 보면** — 행을 하나 더 만들지 않고 시각만 바꾼다. "있나 보고, 있으면 UPDATE 없으면 INSERT"를 MySQL은 한 문장(`INSERT … ON DUPLICATE KEY UPDATE`)으로 할 수 있다.
3. **20개를 넘으면** — 가장 오래된 기록부터 지운다. 같은 회원의 기록이 동시에 들어와도 회원 행 잠금으로 시각 부여와 20개 정리를 순서대로 실행한다.
4. **같은 마이크로초에 다시 보면** — DB의 최근 시각보다 최소 1마이크로초 뒤를 기록해 재방문 글이 반드시 맨 위로 간다.

목록을 줄 때는 2-3 규칙을 **다시** 건다. 본 뒤에 그 글이 지워지거나 숨겨질 수 있기 때문이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "마이페이지 — 최근 본 글",
  "summary": "최근에 연 글이 위에. 같은 글을 다시 보면 맨 위로 올라온다. 20개까지.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "최근 본 글", "right": "김자바" },
    {
      "type": "list",
      "id": "recent",
      "items": [
        { "id": "r12", "title": "자유글 01", "meta": "방금" },
        { "id": "r14", "title": "자유글 03", "meta": "1분 전" },
        { "id": "r13", "title": "자유글 02", "meta": "2분 전" }
      ],
      "footer": "최근 20개까지 보관"
    },
    { "type": "actions", "id": "buttons", "items": [{ "id": "remove", "label": "이 기록 지우기", "variant": "secondary" }, { "id": "clear", "label": "전체 지우기", "variant": "danger" }] }
  ],
  "flows": [
    {
      "name": "글을 다시 열기",
      "steps": [
        { "kind": "user", "text": "전에 본 '자유글 01'을 다시 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/12", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "2-1·2-3 그대로 — 볼 수 있으면 조회수 +1. 같은 트랜잭션에서 최근 본 글을 남긴다" },
        { "kind": "db", "sql": "INSERT INTO recent_view (member_id, post_id, viewed_at) VALUES (2, 12, ?) AS new ON DUPLICATE KEY UPDATE viewed_at = new.viewed_at", "note": "UNIQUE(member_id, post_id)에 걸리면 시각만 바뀐다" },
        { "kind": "db", "sql": "DELETE FROM recent_view WHERE member_id = 2 AND id NOT IN (SELECT id FROM (SELECT id FROM recent_view WHERE member_id = 2 ORDER BY viewed_at DESC, id DESC LIMIT 20) AS latest)", "note": "20개를 넘는 오래된 기록 정리" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\"id\": 12, \"title\": \"자유글 01\", …}" },
        { "kind": "screen", "text": "(마이페이지로 가면) '자유글 01'이 맨 위에 한 줄만", "focus": ["r12"] }
      ]
    },
    {
      "name": "최근 본 글 보기",
      "steps": [
        { "kind": "user", "text": "마이페이지 '최근 본 글'을 연다" },
        { "kind": "request", "method": "GET", "path": "/api/me/recent-posts", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "db", "sql": "SELECT rv.*, p.*, m.* FROM recent_view rv JOIN post p ON p.id = rv.post_id JOIN member m ON m.id = p.author_id WHERE rv.member_id = 2 ORDER BY rv.viewed_at DESC, rv.id DESC" },
        { "kind": "server", "text": "지금 볼 수 없는 글(본 뒤에 지워짐·숨겨짐·차단)은 2-3 규칙으로 뺀다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"items\": [{\"postId\": 12, \"title\": \"자유글 01\", \"viewedAt\": \"2026-10-10T15:28:22.832917\"}, {\"postId\": 14, \"title\": \"자유글 03\", \"viewedAt\": \"…\"}, {\"postId\": 13, \"title\": \"자유글 02\", \"viewedAt\": \"…\"}]}"
        },
        { "kind": "screen", "text": "최근에 연 순서로 세 줄", "focus": ["recent"] }
      ]
    },
    {
      "name": "토큰 없이",
      "steps": [
        { "kind": "user", "text": "로그인이 풀린 채로 마이페이지를 연다" },
        { "kind": "request", "method": "GET", "path": "/api/me/recent-posts" },
        { "kind": "server", "text": "인터셉터는 GET + 헤더 없음을 통과시킨다(2-1). '내 것' API라 컨트롤러가 직접 401(4-3과 같다)" },
        { "kind": "response", "status": 401, "headers": ["WWW-Authenticate: Bearer", "Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "로그인 화면으로", "focus": ["bar"] }
      ]
    }
  ]
}
```

## 만들 것

**V54** — `db/migration/V54__create_recent_view.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `member_id` · `post_id` | FK. **`UNIQUE(member_id, post_id)`** — 같은 글은 한 줄 |
| `viewed_at` | `DATETIME(6)` — 연달아 여러 글을 열어도 순서가 갈리게 마이크로초까지 |
| 인덱스 | `(member_id, viewed_at, id)` — "내 기록 최신순" |

**기록 규칙** — `GET /api/posts/{id}`(2-1)를 고친다

| 상황 | 기록 |
|---|---|
| 로그인 + 볼 수 있는 글(200) | 남긴다. 이미 있으면 `viewed_at`만 바꾼다 |
| 비로그인, 또는 404(없는 글·볼 수 없는 글) | 남기지 않는다 |
| 회원의 기록이 20개를 넘음 | 오래된 것부터 지워 20개로 |

**API** — 모두 토큰 필요

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/me/recent-posts?size=20` | 최근 본 글(최신순) — 지금 볼 수 없는 글은 뺀다 | `200` `{ "items": [ { "postId", "title", "viewedAt" } ] }` |
| `DELETE /api/me/recent-posts` | 전체 지우기 | `204` |
| `DELETE /api/me/recent-posts/{postId}` | 하나 지우기(없어도 성공) | `204` |

**입력 규칙** — 본문이 없고 쿼리·경로 값이 입력이다. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 입력 | 필수 | 형식 | 범위 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|
| `size` | 아니오 | 숫자(`abc` → 400) | **1~20** | `20` | `400` |
| 경로 `{postId}` | 예 | 숫자(`abc` → 400) | — | — | `400` |

| 상황 | 결과 |
|---|---|
| 토큰 없음(GET 포함) | `401` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 2-1·2-3 그대로 — 볼 수 있으면 조회수 +1. 같은 트랜잭션에서 최근 본 글을 남긴다
- UNIQUE(member_id, post_id)에 걸리면 시각만 바뀐다
- 회원 행을 잠그고 기존 마지막 `viewed_at`보다 큰 마이크로초 시각을 부여한다. 그 뒤 20개를 넘는 오래된 기록 정리
- 지금 볼 수 없는 글(본 뒤에 지워짐·숨겨짐·차단)은 2-3 규칙으로 뺀다

<details>
<summary>Controller — HTTP 연결</summary>

`RecentViewController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@RequestMapping("/api/me/recent-posts")`, `@GetMapping`, `@DeleteMapping`. 변경된 메서드: `list`, `clear`, `remove`.

`src/main/java/org/example/recent/RecentViewController.java`

```java
package org.example.recent;

import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/me/recent-posts")
public class RecentViewController {

    private final RecentViewService recentViewService;

    public RecentViewController(RecentViewService recentViewService) {
        this.recentViewService = recentViewService;
    }

    // GET이지만 "내 것"이라 인증이 필수 — 인터셉터의 "GET + 헤더 없음 = 통과"와 별개로 여기서 401(4-3과 같다)
    @GetMapping
    public RecentPostsResponse list(@RequestParam(required = false) String size,
                                    @LoginMember AuthenticatedMember loginMember) {
        if (loginMember == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        return recentViewService.list(loginMember, parseSize(size));
    }

    private static int parseSize(String raw) {
        if (raw == null) {
            return 20;
        }
        if (!raw.matches("[0-9]+")) {
            throw new InvalidParametersException(Map.of("size", "1~20 사이의 숫자여야 합니다."));
        }
        try {
            int size = Integer.parseInt(raw);
            if (size >= 1 && size <= 20) {
                return size;
            }
        } catch (NumberFormatException ignored) {
            // int 범위를 넘는 값도 같은 400으로 처리한다.
        }
        throw new InvalidParametersException(Map.of("size", "1~20 사이의 숫자여야 합니다."));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@LoginMember AuthenticatedMember loginMember) {
        recentViewService.clear(loginMember);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long postId, @LoginMember AuthenticatedMember loginMember) {
        recentViewService.remove(loginMember, postId);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`RecentPostsResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/recent/RecentPostsResponse.java`

```java
package org.example.recent;

import java.time.LocalDateTime;
import java.util.List;

public record RecentPostsResponse(List<Item> items) {

    public record Item(Long postId, String title, LocalDateTime viewedAt) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`, `RecentViewService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `record`, `list`, `clear`, `remove`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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

`src/main/java/org/example/recent/RecentViewService.java`

```java
package org.example.recent;

import org.example.auth.AuthenticatedMember;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.function.Predicate;

// 최근 본 글 — 상세 조회(GET /api/posts/{id})가 성공할 때 기록한다. 회원마다 최근 20개
@Service
public class RecentViewService {

    static final int KEEP = 20;

    private final RecentViewRepository repository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public RecentViewService(RecentViewRepository repository, MemberRepository memberRepository,
                             PostAccessPolicy accessPolicy, Clock clock) {
        this.repository = repository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    // 상세 조회 트랜잭션 안에서 불린다(볼 수 있는 글일 때만). 같은 글이면 맨 앞으로, 21번째부터는 지운다
    @Transactional
    public void record(Long memberId, Long postId) {
        // 회원 행 하나로 같은 회원의 다른 글 조회를 직렬화한다. 20개 정리와 시각 순서를 함께 보장한다.
        memberRepository.findByIdForUpdate(memberId).orElseThrow();
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        LocalDateTime latest = repository.findLatestViewedAt(memberId);
        if (latest != null && !now.isAfter(latest)) {
            now = latest.plus(1, ChronoUnit.MICROS);
        }
        repository.upsert(memberId, postId, now);
        repository.trim(memberId, KEEP);
    }

    // 기록한 뒤에 지워지거나 숨겨진 글, 차단 등으로 지금은 볼 수 없는 글은 빼고 보여 준다(행은 남는다)
    @Transactional(readOnly = true)
    public RecentPostsResponse list(AuthenticatedMember me, int size) {
        Predicate<Post> viewable = accessPolicy.viewableBy(me);
        List<RecentPostsResponse.Item> items = repository.findLatest(me.id()).stream()
                .filter(rv -> viewable.test(rv.getPost()))
                .limit(size)
                .map(rv -> new RecentPostsResponse.Item(rv.getPost().getId(), rv.getPost().getTitle(), rv.getViewedAt()))
                .toList();
        return new RecentPostsResponse(items);
    }

    @Transactional
    public void clear(AuthenticatedMember me) {
        repository.deleteAllOf(me.id());
    }

    @Transactional
    public void remove(AuthenticatedMember me, Long postId) {
        repository.deleteOne(me.id(), postId);
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`RecentViewRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/recent/RecentViewRepository.java`

```java
package org.example.recent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RecentViewRepository extends JpaRepository<RecentView, Long> {

    @Query(nativeQuery = true, value = "SELECT viewed_at FROM recent_view WHERE member_id = :memberId ORDER BY viewed_at DESC, id DESC LIMIT 1 FOR UPDATE")
    LocalDateTime findLatestViewedAt(@Param("memberId") Long memberId);

    // 처음 보면 INSERT, 이미 본 글이면 viewed_at만 갱신 — "있나 보고 나서 넣기"를 SQL 한 문장으로
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO recent_view (member_id, post_id, viewed_at)
            VALUES (:memberId, :postId, :viewedAt) AS new
            ON DUPLICATE KEY UPDATE viewed_at = new.viewed_at
            """)
    int upsert(@Param("memberId") Long memberId, @Param("postId") Long postId,
               @Param("viewedAt") LocalDateTime viewedAt);

    // 최근 keep개만 남기고 지운다. MySQL은 IN 서브쿼리 안의 LIMIT을 허용하지 않아 파생 테이블로 한 번 감싼다
    @Modifying
    @Query(nativeQuery = true, value = """
            DELETE FROM recent_view
             WHERE member_id = :memberId
               AND id NOT IN (SELECT id FROM (SELECT id FROM recent_view
                                               WHERE member_id = :memberId
                                               ORDER BY viewed_at DESC, id DESC
                                               LIMIT :keep FOR UPDATE) AS latest)
            """)
    int trim(@Param("memberId") Long memberId, @Param("keep") int keep);

    @Query("""
            SELECT rv FROM RecentView rv
            JOIN FETCH rv.post p
            JOIN FETCH p.author
            WHERE rv.memberId = :memberId
            ORDER BY rv.viewedAt DESC, rv.id DESC
            """)
    List<RecentView> findLatest(@Param("memberId") Long memberId);

    long countByMemberId(Long memberId);

    @Modifying
    @Query("DELETE FROM RecentView rv WHERE rv.memberId = :memberId")
    int deleteAllOf(@Param("memberId") Long memberId);

    @Modifying
    @Query("DELETE FROM RecentView rv WHERE rv.memberId = :memberId AND rv.post.id = :postId")
    int deleteOne(@Param("memberId") Long memberId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`RecentView.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

`src/main/java/org/example/recent/RecentView.java`

```java
package org.example.recent;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.post.Post;

import java.time.LocalDateTime;

// 조회 전용 매핑 — 저장·갱신은 RecentViewRepository의 네이티브 upsert가 한다
@Entity
@Table(name = "recent_view")
public class RecentView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    protected RecentView() {
        // JPA
    }

    public Post getPost() {
        return post;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V54__create_recent_view.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V54__create_recent_view.sql`

```sql
-- 14-5 최근 본 글 — 회원마다 글 하나에 행 하나(UNIQUE). 다시 보면 viewed_at만 새로 바꾼다(맨 앞으로).
-- 회원마다 최근 20개만 남긴다. 같은 초에 여러 글을 봐도 순서가 갈리도록 마이크로초까지(DATETIME(6)).
CREATE TABLE recent_view (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    member_id BIGINT      NOT NULL,
    post_id   BIGINT      NOT NULL,
    viewed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_recent_view (member_id, post_id),
    KEY ix_recent_view_member_time (member_id, viewed_at, id),
    KEY fk_recent_view_post (post_id),
    CONSTRAINT fk_recent_view_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_recent_view_post FOREIGN KEY (post_id) REFERENCES post (id)
);
```

</details>

<details>
<summary>테스트 — 계약 확인</summary>

`RecentViewCapTest.java`. 테스트 요청과 기대값을 **직접 확인** 및 채점 기준과 대조한다.

`src/test/java/org/example/recent/RecentViewCapTest.java`

```java
package org.example.recent;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// 14-5: "최근 20개만" — 화면으로 21개를 열어 보기는 번거로워서 기록 메서드를 직접 부른다.
// 회원 26(동시성20)은 다른 테스트가 쓰지 않는 회원이다. 다른 통합 테스트와 애노테이션을 같게 둬 컨텍스트를 공유한다.
@SpringBootTest
@AutoConfigureMockMvc
class RecentViewCapTest {

    private static final long MEMBER = 26L;

    @Autowired
    RecentViewService recentViewService;

    @Autowired
    RecentViewRepository repository;

    @Test
    void 스물한_개를_보면_가장_오래된_것이_빠지고_다시_본_글은_맨_앞으로() {
        for (long postId = 1; postId <= 21; postId++) {
            recentViewService.record(MEMBER, postId);
        }
        assertThat(repository.countByMemberId(MEMBER)).isEqualTo(20);
        List<Long> ids = repository.findLatest(MEMBER).stream().map(rv -> rv.getPost().getId()).toList();
        assertThat(ids).doesNotContain(1L);
        assertThat(ids.getFirst()).isEqualTo(21L);

        recentViewService.record(MEMBER, 5L); // 이미 본 글 — 행이 늘지 않고 맨 앞으로
        assertThat(repository.countByMemberId(MEMBER)).isEqualTo(20);
        assertThat(repository.findLatest(MEMBER).getFirst().getPost().getId()).isEqualTo(5L);
    }
}
```

</details>

### MyBatis 대안 — 최근 기록은 SQL Mapper로 관리

`RecentViewMapper`가 UPSERT·최신 시각 잠금·20개 정리·삭제를 수행한다. 상세 GET은 공통 `PostQueryService`에서 볼 수 있는 글일 때만 이 서비스를 호출한다. 목록은 기록 ID를 읽은 뒤 글·작성자를 한 번에 가져와 기존 공개 정책을 다시 적용한다. 아래 접기를 역할별로 열어 SQL과 Java 코드를 비교한다.

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
<summary>MyBatis / DTO — RecentViewRow.java</summary>

`src/main/java/org/example/recent/RecentViewRow.java`

```java
package org.example.recent;

import java.time.LocalDateTime;

// 목록 SQL은 기록의 글 ID·시각만 읽고, 글/작성자와 공개 정책은 한 번에 따로 적용한다.
public record RecentViewRow(Long postId, LocalDateTime viewedAt) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — RecentViewMapper.java</summary>

`src/main/java/org/example/recent/RecentViewMapper.java`

```java
package org.example.recent;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface RecentViewMapper {
    LocalDateTime findLatestViewedAtForUpdate(@Param("memberId") Long memberId);
    void upsert(@Param("memberId") Long memberId, @Param("postId") Long postId,
                @Param("viewedAt") LocalDateTime viewedAt);
    int trim(@Param("memberId") Long memberId, @Param("keep") int keep);
    List<RecentViewRow> findLatest(@Param("memberId") Long memberId);
    int deleteAllOf(@Param("memberId") Long memberId);
    int deleteOne(@Param("memberId") Long memberId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / SQL — RecentViewMapper.xml</summary>

`src/main/resources/mapper/RecentViewMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.recent.RecentViewMapper">
    <resultMap id="recentRow" type="org.example.recent.RecentViewRow">
        <constructor>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="viewed_at" javaType="java.time.LocalDateTime"/>
        </constructor>
    </resultMap>

    <select id="findLatestViewedAtForUpdate" resultType="java.time.LocalDateTime">
        SELECT viewed_at FROM recent_view WHERE member_id = #{memberId}
         ORDER BY viewed_at DESC, id DESC LIMIT 1 FOR UPDATE
    </select>
    <insert id="upsert">
        INSERT INTO recent_view (member_id, post_id, viewed_at)
        VALUES (#{memberId}, #{postId}, #{viewedAt}) AS new
        ON DUPLICATE KEY UPDATE viewed_at = new.viewed_at
    </insert>
    <delete id="trim">
        DELETE FROM recent_view
         WHERE member_id = #{memberId}
           AND id NOT IN (SELECT id FROM (SELECT id FROM recent_view
                                           WHERE member_id = #{memberId}
                                           ORDER BY viewed_at DESC, id DESC
                                           LIMIT #{keep} FOR UPDATE) AS latest)
    </delete>
    <select id="findLatest" resultMap="recentRow">
        SELECT post_id, viewed_at FROM recent_view
         WHERE member_id = #{memberId}
         ORDER BY viewed_at DESC, id DESC
    </select>
    <delete id="deleteAllOf">
        DELETE FROM recent_view WHERE member_id = #{memberId}
    </delete>
    <delete id="deleteOne">
        DELETE FROM recent_view WHERE member_id = #{memberId} AND post_id = #{postId}
    </delete>
</mapper>
```

</details>

<details>
<summary>MyBatis / JPA 배치 조회 — PostRepository.java</summary>

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
import java.util.Collection;
import java.util.List;

// Spring Data JPA가 구현을 만들어 준다(1-3의 메모리 구현을 대체)
public interface PostRepository extends JpaRepository<Post, Long> {

    // 최근 본 글 ID를 작성자와 함께 한 번에 읽어 기존 접근 정책을 적용한다.
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.id IN :ids")
    List<Post> findRecentPostsWithAuthor(@Param("ids") Collection<Long> ids);

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
<summary>MyBatis / JPA 교체 — RecentViewRepository.java</summary>

`src/main/java/org/example/recent/RecentViewRepository.java`

```java
package org.example.recent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RecentViewRepository extends JpaRepository<RecentView, Long> {

    // 처음 보면 INSERT, 이미 본 글이면 viewed_at만 갱신 — "있나 보고 나서 넣기"를 SQL 한 문장으로
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO recent_view (member_id, post_id, viewed_at)
            VALUES (:memberId, :postId, :viewedAt) AS new
            ON DUPLICATE KEY UPDATE viewed_at = new.viewed_at
            """)
    int upsert(@Param("memberId") Long memberId, @Param("postId") Long postId,
               @Param("viewedAt") LocalDateTime viewedAt);

    // 최근 keep개만 남기고 지운다. MySQL은 IN 서브쿼리 안의 LIMIT을 허용하지 않아 파생 테이블로 한 번 감싼다
    @Modifying
    @Query(nativeQuery = true, value = """
            DELETE FROM recent_view
             WHERE member_id = :memberId
               AND id NOT IN (SELECT id FROM (SELECT id FROM recent_view
                                               WHERE member_id = :memberId
                                               ORDER BY viewed_at DESC, id DESC
                                               LIMIT :keep) AS latest)
            """)
    int trim(@Param("memberId") Long memberId, @Param("keep") int keep);

    @Query("""
            SELECT rv FROM RecentView rv
            JOIN FETCH rv.post p
            JOIN FETCH p.author
            WHERE rv.memberId = :memberId
            ORDER BY rv.viewedAt DESC, rv.id DESC
            """)
    List<RecentView> findLatest(@Param("memberId") Long memberId);

    long countByMemberId(Long memberId);

    @Modifying
    @Query("DELETE FROM RecentView rv WHERE rv.memberId = :memberId")
    int deleteAllOf(@Param("memberId") Long memberId);

    @Modifying
    @Query("DELETE FROM RecentView rv WHERE rv.memberId = :memberId AND rv.post.id = :postId")
    int deleteOne(@Param("memberId") Long memberId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / Service — RecentViewService.java</summary>

`src/main/java/org/example/recent/RecentViewService.java`

```java
package org.example.recent;

import org.example.auth.AuthenticatedMember;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// MyBatis 대안: 최근 기록 행·정리 SQL은 Mapper, 글 공개 정책은 기존 JPA 엔티티를 일괄 조회해 적용한다.
@Service
public class RecentViewService {
    static final int KEEP = 20;

    private final RecentViewMapper mapper;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public RecentViewService(RecentViewMapper mapper, MemberRepository memberRepository,
                             PostRepository postRepository, PostAccessPolicy accessPolicy, Clock clock) {
        this.mapper = mapper;
        this.memberRepository = memberRepository;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public void record(Long memberId, Long postId) {
        // 같은 회원의 상세 조회가 다른 글에서 동시에 와도 시각 부여와 20개 정리가 한 줄씩 일어난다.
        memberRepository.findByIdForUpdate(memberId).orElseThrow();
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        LocalDateTime latest = mapper.findLatestViewedAtForUpdate(memberId);
        if (latest != null && !now.isAfter(latest)) {
            now = latest.plus(1, ChronoUnit.MICROS);
        }
        mapper.upsert(memberId, postId, now);
        mapper.trim(memberId, KEEP);
    }

    @Transactional(readOnly = true)
    public RecentPostsResponse list(AuthenticatedMember me, int size) {
        List<RecentViewRow> rows = mapper.findLatest(me.id());
        if (rows.isEmpty()) {
            return new RecentPostsResponse(List.of());
        }
        Map<Long, Post> posts = postRepository.findRecentPostsWithAuthor(
                rows.stream().map(RecentViewRow::postId).toList()).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));
        Predicate<Post> viewable = accessPolicy.viewableBy(me);
        List<RecentPostsResponse.Item> items = rows.stream()
                .filter(row -> posts.containsKey(row.postId()) && viewable.test(posts.get(row.postId())))
                .limit(size)
                .map(row -> new RecentPostsResponse.Item(row.postId(), posts.get(row.postId()).getTitle(), row.viewedAt()))
                .toList();
        return new RecentPostsResponse(items);
    }

    @Transactional
    public void clear(AuthenticatedMember me) {
        mapper.deleteAllOf(me.id());
    }

    @Transactional
    public void remove(AuthenticatedMember me, Long postId) {
        mapper.deleteOne(me.id(), postId);
    }
}
```

</details>

## 직접 확인

김자바의 기록을 비우고 12·13·14·12번을 연다. 9번(나를 차단한 회원의 글)은 404라 남지 않는다. 이스프링이 글을 하나 쓰고, 김자바가 본 뒤, 이스프링이 지운다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "H0",
      "title": "처음 상태로(내 기록 지우기)",
      "method": "DELETE",
      "path": "/api/me/recent-posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H1",
      "title": "12번 보기",
      "method": "GET",
      "path": "/api/posts/12",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H2",
      "title": "13번 보기",
      "method": "GET",
      "path": "/api/posts/13",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H3",
      "title": "14번 보기",
      "method": "GET",
      "path": "/api/posts/14",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H4",
      "title": "12번 다시 보기",
      "method": "GET",
      "path": "/api/posts/12",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H5",
      "title": "9번 보기(나를 차단한 회원의 글 → 404)",
      "method": "GET",
      "path": "/api/posts/9",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H5b",
      "title": "15번 보기(비로그인)",
      "method": "GET",
      "path": "/api/posts/15"
    },
    {
      "id": "H6",
      "title": "최근 본 글",
      "method": "GET",
      "path": "/api/me/recent-posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H7",
      "title": "이스프링 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 곧 지울 글",
        "content": "최근 본 글 확인용"
      }
    },
    {
      "id": "H8",
      "title": "방금 쓴 글 보기",
      "method": "GET",
      "path": "/api/posts/{{H7.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H9",
      "title": "최근 본 글 1개만(size=1 — 범위 안쪽 최솟값)",
      "method": "GET",
      "path": "/api/me/recent-posts?size=1",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H10",
      "title": "이스프링이 그 글 삭제",
      "method": "DELETE",
      "path": "/api/posts/{{H7.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "H11",
      "title": "삭제 뒤 최근 본 글",
      "method": "GET",
      "path": "/api/me/recent-posts?size=20",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H12",
      "title": "13번 기록만 지우기",
      "method": "DELETE",
      "path": "/api/me/recent-posts/13",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H13",
      "title": "지운 뒤 최근 본 글",
      "method": "GET",
      "path": "/api/me/recent-posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14",
      "title": "잘못된 입력 — size=0",
      "method": "GET",
      "path": "/api/me/recent-posts?size=0",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14b",
      "title": "잘못된 입력 — size=21",
      "method": "GET",
      "path": "/api/me/recent-posts?size=21",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14c",
      "title": "잘못된 입력 — size=abc",
      "method": "GET",
      "path": "/api/me/recent-posts?size=abc",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14d",
      "title": "잘못된 입력 — 지울 글 id 자리에 문자",
      "method": "DELETE",
      "path": "/api/me/recent-posts/abc",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14e",
      "title": "잘못된 입력 — 빈 size",
      "method": "GET",
      "path": "/api/me/recent-posts?size=",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H14f",
      "title": "잘못된 입력 — int 범위 밖 size",
      "method": "GET",
      "path": "/api/me/recent-posts?size=2147483648",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "H15",
      "title": "토큰 없이 보기",
      "method": "GET",
      "path": "/api/me/recent-posts"
    },
    {
      "id": "H15b",
      "title": "토큰 없이 지우기",
      "method": "DELETE",
      "path": "/api/me/recent-posts"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "H0",
      "expect": {
        "status": 204
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "H5",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "H6",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "equals": [
                  12,
                  14,
                  13
                ]
              },
              {
                "path": "$.items[0].title",
                "equals": "자유글 01"
              },
              {
                "path": "$.items[0].viewedAt",
                "type": "string"
              }
            ]
          }
        }
      ],
      "note": "다시 본 12번은 맨 앞으로(행이 둘이 되지 않는다). 볼 수 없어 404였던 9번·비로그인으로 본 15번은 남지 않는다"
    },
    {
      "id": "C3",
      "request": "H9",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "length": 1
          },
          {
            "path": "$.items[0].postId",
            "equals": "{{H7.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "H10",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "H11",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "equals": [
                  12,
                  14,
                  13
                ]
              }
            ]
          }
        }
      ],
      "note": "본 뒤에 지워진 글은 목록에서 빠진다"
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "H12",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "H13",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[*].postId",
                "equals": [
                  12,
                  14
                ]
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
          "request": "H14",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "H14b",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "H14c",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "H14d",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "H14e",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "H14f",
          "expect": {
            "status": 400
          }
        }
      ],
      "note": "size는 1~20, 숫자가 아니면 400 — 500이 아니다"
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "H15",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "H15b",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C8",
      "manual": "기록 20개인 같은 회원이 볼 수 있는 서로 다른 새 글 두 개를 동시에 GET한다. 두 요청 모두 200이고 recent_view는 최종 20행이어야 한다. 두 새 글은 모두 남고 가장 오래된 두 글은 제거되어야 한다."
    },
    {
      "id": "C9",
      "manual": "두 기록의 viewed_at을 같은 마이크로초로 맞춘 뒤 낮은 id의 글을 다시 GET한다. 그 글이 최근 목록 맨 위에 와야 한다."
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), T = 테스트(필수), R = 코드 리뷰(피드백용). `{W}`는 H7 응답의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | H0 | `204` |
| C2 | H5 / H6 | `404` / `200`, `[12, 14, 13]` — 다시 본 12번이 맨 앞, 9번(404)·15번(비로그인)은 없다 |
| C3 | H9 | `200`, 1개, `{W}` — `size=1`(범위 안쪽 최솟값) |
| C4 | H10 / H11 | `204` / `[12, 14, 13]` — 본 뒤 지워진 글은 빠진다 |
| C5 | H12 / H13 | `204` / `[12, 14]` |
| C6 | H14 / H14b / H14c / H14d / H14e / H14f | 모두 `400`(`size=0`·`21`·`abc`·빈 값·int 초과·경로 문자) — 500이 아니다 |
| C7 | H15 / H15b | `401` / `401` |
| C8 | 기록 20개에서 서로 다른 글 동시 조회 | 두 요청 `200`, DB 기록 20개 유지·두 새 글 포함·가장 오래된 두 글 제외 |
| C9 | 같은 `viewed_at`에서 재방문 | 낮은 id의 기존 글도 최근 목록 맨 위 |
| D1 | `SELECT post_id FROM recent_view WHERE member_id = 2 ORDER BY viewed_at DESC, id DESC` | `{W}, 12, 14` 순서 — 지워진 글 `{W}`의 행은 남아 있다(목록에서만 뺀다). 13은 H12가 지웠다 |
| D2 | `SELECT COUNT(*) FROM recent_view WHERE member_id = 2 AND post_id = 12` | `1` — 두 번 봐도 한 줄 |
| D3 | `SELECT COUNT(*) FROM recent_view WHERE member_id = 2 AND post_id IN (9, 15)` | `0` |
| T1 | 테스트 `RecentViewCapTest` — 한 회원으로 글 1~21을 차례로 기록 | 행 20개, 1번이 없다, 맨 앞이 21번. 이미 있는 5번을 다시 기록하면 행은 20개 그대로이고 5번이 맨 앞 |
| R1 | 기록 위치 | 볼 수 있는지 확인(2-3)을 **통과한 뒤에만** 남긴다 — 404 경로에서 기록하지 않는다 |
| R2 | upsert | "SELECT로 있나 보고 INSERT/UPDATE"를 두 번의 왕복 대신 `INSERT … ON DUPLICATE KEY UPDATE` 한 문장으로 한다. 이 문장은 MySQL 전용이라는 것(다른 DB로 옮기면 바뀐다)을 알고 쓴다 |
| R3 | 20개 정리 | `IN (… LIMIT 20)`은 MySQL이 거부한다(`This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'`) — 파생 테이블로 한 번 감싸는 이유를 설명할 수 있다 |
| R4 | 순서 | `ORDER BY viewed_at DESC, id DESC`처럼 동점 기준까지. `DATETIME`(초 단위)이면 1초 안에 연 글들의 순서가 섞인다 |

## 필요한 지식

- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 기록할 때와 보여 줄 때 둘 다
- [W20 — MySQL DATETIME과 TIMESTAMP](../../docs/knowledge/W20-time-timezone.md#q4-mysql-datetime과-timestamp-중-무엇을-쓰나) — 소수 초 정밀도
- [R05 인덱스](../../docs/knowledge/R05-index-btree.md) — `(member_id, viewed_at, id)` 순서
- [S10 — `@Query`](../../docs/knowledge/S10-spring-data-query.md#query는-선언-시점에-쿼리를-분리한다) — 네이티브 쿼리와 `@Modifying`
- [V04 테스트 DB 전략](../../docs/knowledge/V04-test-db-strategy.md) — Testcontainers로 MySQL 전용 문장 테스트
- [I1 레슨 — 왜 테스트하나](../../lessons/I1-why-tests.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디서 부르나</summary>

2-1의 `PostQueryService.getDetail`에서 `canView`를 통과하고 조회수를 올린 바로 뒤에 `if (viewer != null) recentViewService.record(viewer.id(), post.getId());`. 같은 트랜잭션이라 기록이 실패하면 조회수도 되돌려진다 — 그게 싫다면 무엇을 바꿔야 하는지(9-4 R1의 이벤트)는 생각만 해 둔다.
</details>

<details>
<summary>힌트 2 — 두 문장</summary>

```sql
INSERT INTO recent_view (member_id, post_id, viewed_at) VALUES (:memberId, :postId, :viewedAt) AS new
ON DUPLICATE KEY UPDATE viewed_at = new.viewed_at;

DELETE FROM recent_view
 WHERE member_id = :memberId
   AND id NOT IN (SELECT id FROM (SELECT id FROM recent_view WHERE member_id = :memberId
                                   ORDER BY viewed_at DESC, id DESC LIMIT 20) AS latest);
```

`@Modifying @Query(nativeQuery = true, …)`로 리포지토리에 둔다. `viewedAt`은 `LocalDateTime.now(clock)`(8-2 Clock 빈).
</details>

## 다음 단계

[14-6. 관련 글 추천](14-6-related-posts.md)
