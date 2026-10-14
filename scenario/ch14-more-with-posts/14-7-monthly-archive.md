# 14-7. 월별 아카이브 — 연·월별 글 수와 그 달의 글

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "블로그처럼 게시판 옆에 '2026년 10월 (4) · 2026년 9월 (9)'를 붙여 주세요. 누르면 그 달에 올라온 글 목록이 나오고요. 숫자랑 눌렀을 때 나오는 글 개수가 다르면 안 돼요."

두 API가 짝이다. **개수**(연·월로 묶어 세기)와 **목록**(한 달 범위로 거르기).

담당자가 콕 집은 대로 둘이 어긋나면 안 된다. 어긋나는 흔한 이유는 두 쿼리의 조건이 따로 놀기 때문이다.

개수 쿼리에 "팔로워 공개 글 빼기"를 빠뜨리거나, 목록은 차단을 거르는데 개수는 안 거르는 식이다. 그래서 둘 다 **8-4의 조건 조립기(`PostSearchRepository`)를 함께** 쓴다.

숫자도 보는 사람마다 다르다(이스프링에게는 자기 팔로워 공개 글이 하나 더 있다). 아카이브 목록 URL이 허용하는 2000~2100년만 집계하고, 발행 시각이 없는 행은 제외한다.

한 가지 더 있다. 묶을 때는 `YEAR(published_at)`·`MONTH(published_at)`를 쓰지만, **한 달 목록을 거를 때 `WHERE MONTH(published_at) = 9`를 쓰면 안 된다.** 칼럼에 함수를 씌우면 `(board_id, published_at, id)` 인덱스로 범위를 찾지 못한다(3번 글 "인덱스는 언제 타나요?"의 질문 그대로다). 목록은 8-4의 `from`·`to`처럼 `[9월 1일 00:00, 10월 1일 00:00)` 범위로 거른다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "자유 게시판 — 월별 아카이브",
  "summary": "옆 칸에 연·월별 글 수, 누르면 그 달의 글 목록. 숫자와 목록 건수가 같아야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판", "right": "비로그인" },
    {
      "type": "list",
      "id": "months",
      "label": "아카이브",
      "items": [
        { "id": "m10", "title": "2026년 10월", "meta": "4" },
        { "id": "m9", "title": "2026년 9월", "meta": "9" }
      ]
    },
    {
      "type": "list",
      "id": "posts",
      "label": "2026년 9월의 글",
      "items": [
        { "id": "p17", "title": "자유글 06", "meta": "9월 30일" },
        { "id": "p16", "title": "자유글 05", "meta": "9월 29일" },
        { "id": "p4", "title": "주말 회고", "meta": "9월 20일" }
      ],
      "footer": "전체 9개"
    }
  ],
  "flows": [
    {
      "name": "월별 글 수",
      "steps": [
        { "kind": "user", "text": "자유 게시판을 연다" },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/archive" },
        { "kind": "db", "sql": "SELECT YEAR(p.published_at), MONTH(p.published_at), COUNT(p.id) FROM post p WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.board_id = 4 GROUP BY YEAR(p.published_at), MONTH(p.published_at) ORDER BY 1 DESC, 2 DESC", "note": "\"볼 수 있는 글\" 조건은 목록(2-2·8-4)과 같은 조립기에서 나온다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"months\": [{\"year\": 2026, \"month\": 10, \"count\": 4}, {\"year\": 2026, \"month\": 9, \"count\": 9}]}"
        },
        { "kind": "screen", "text": "최신 달부터, 글이 있는 달만", "focus": ["months"] }
      ]
    },
    {
      "name": "9월 누르기",
      "steps": [
        { "kind": "user", "text": "'2026년 9월 (9)'를 누른다", "focus": ["m9"] },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/archive/2026/9?size=20" },
        { "kind": "db", "sql": "SELECT p.* FROM post p WHERE … AND p.board_id = 4 AND p.published_at >= '2026-09-01 00:00:00' AND p.published_at < '2026-10-01 00:00:00' ORDER BY p.published_at DESC, p.id DESC LIMIT 20", "note": "함수 없이 범위 — 인덱스 (board_id, published_at, id)로 찾는다" },
        { "kind": "db", "sql": "SELECT COUNT(p.id) FROM post p WHERE …같은 조건…" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"items\": [{\"id\": 17, \"title\": \"자유글 06\", …}, …], \"page\": 0, \"size\": 20, \"totalElements\": 9, \"totalPages\": 1, \"hasNext\": false}"
        },
        { "kind": "screen", "text": "9개 — 옆 칸 숫자와 같다", "focus": ["posts"] }
      ]
    },
    {
      "name": "13월",
      "steps": [
        { "kind": "user", "text": "주소창에 /2026/13을 직접 친다" },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/archive/2026/13" },
        { "kind": "server", "text": "@Max(12) 위반 → 400. YearMonth.of(2026, 13)까지 가면 DateTimeException으로 500이 난다" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "'없는 달이에요'", "focus": ["posts"] }
      ]
    }
  ]
}
```

## 만들 것

마이그레이션 없음 — 2-2부터 있던 `ix_post_board_published(board_id, published_at, id)`를 쓴다.

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/boards/{slug}/archive` | 연·월별 글 수(최신 달부터, 글이 있는 달만) — **비로그인 가능** | `200` `{ "months": [ { "year": 2026, "month": 9, "count": 9 } ] }` |
| `GET /api/boards/{slug}/archive/{year}/{month}?page=0&size=10` | 그 달의 글 목록 — **비로그인 가능** | `200` 2-2 목록과 같은 모양(`items`·`page`·`size`·`totalElements`·`totalPages`·`hasNext`), 최신순 |

| 규칙 | 내용 |
|---|---|
| 어떤 글을 세나 | 2-2 목록과 같다 — 게시됨·삭제 안 됨, 보는 사람 기준(팔로워 공개·차단)까지 |
| 어느 달인가 | `published_at` 기준. 2000~2100년의 글만 집계하며 발행 시각이 없는 행은 제외한다. 월 목록은 그 달 1일 00:00 이상, 다음 달 1일 00:00 미만 |
| 개수 = 목록 건수 | 같은 사람이 보면 `archive`의 `count`와 그 달 목록의 `totalElements`가 같다 |

**입력 규칙** — 본문이 없고 경로·쿼리 값이 입력이다. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 입력 | 필수 | 형식 | 범위 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|
| `{slug}` | 예 | 문자열 | 있는 게시판 | — | `404` |
| `{year}` | 예 | 숫자(`abc` → 400) | **2000~2100** | — | `400` |
| `{month}` | 예 | 숫자 | **1~12** | — | `400` |
| `page` | 아니오 | 숫자(빈 값 → 400) | 0 이상 | 생략하면 `0` | `400` |
| `size` | 아니오 | 숫자(빈 값 → 400) | **1~50** | 생략하면 `10` | `400` |

글이 없는 달은 `200`에 빈 목록이다(오류가 아니다).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- "볼 수 있는 글" 조건은 목록(2-2·8-4)과 같은 조립기에서 나온다
- 함수 없이 범위 — 인덱스 (board_id, published_at, id)로 찾는다
- @Max(12) 위반 → 400. YearMonth.of(2026, 13)까지 가면 DateTimeException으로 500이 난다

<details>
<summary>Controller — HTTP 연결</summary>

`ArchiveController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@RequestMapping("/api/boards/{slug}/archive")`, `@GetMapping`, `@GetMapping("/{year}/{month}")`. 변경된 메서드: `archive`, `month`.

`src/main/java/org/example/post/ArchiveController.java`

```java
package org.example.post;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// 14-7 월별 아카이브 — 비로그인 가능. BoardPostController처럼 @Validated 없이 매개변수 제약을 건다(2-2)
@RestController
@RequestMapping("/api/boards/{slug}/archive")
public class ArchiveController {

    private final PostQueryService postQueryService;

    public ArchiveController(PostQueryService postQueryService) {
        this.postQueryService = postQueryService;
    }

    @GetMapping
    public ArchiveResponse archive(@PathVariable String slug, @LoginMember AuthenticatedMember viewer) {
        return postQueryService.archive(slug, viewer);
    }

    // 경로 값에도 @Min/@Max를 걸 수 있다 — 범위 밖이면 2-2의 page·size처럼 400
    @GetMapping("/{year}/{month}")
    public PostListResponse month(@PathVariable String slug,
                                  @PathVariable @Min(2000) @Max(2100) int year,
                                  @PathVariable @Min(1) @Max(12) int month,
                                  @RequestParam(required = false) String page,
                                  @RequestParam(required = false) String size,
                                  @LoginMember AuthenticatedMember viewer) {
        return postQueryService.month(slug, year, month,
                parseNonNegative(page, "page", 0), parseRange(size, "size", 10, 1, 50), viewer);
    }

    private static int parseNonNegative(String raw, String name, int defaultValue) {
        if (raw == null) return defaultValue;
        if (raw.matches("[0-9]+")) {
            try {
                return Integer.parseInt(raw);
            } catch (NumberFormatException ignored) {
                // int 범위를 넘는 값도 아래에서 400으로 처리한다.
            }
        }
        throw new InvalidParametersException(Map.of(name, "0 이상의 정수여야 합니다."));
    }

    private static int parseRange(String raw, String name, int defaultValue, int min, int max) {
        if (raw == null) return defaultValue;
        if (raw.matches("[0-9]+")) {
            try {
                int value = Integer.parseInt(raw);
                if (value >= min && value <= max) return value;
            } catch (NumberFormatException ignored) {
                // int 범위를 넘는 값도 아래에서 400으로 처리한다.
            }
        }
        throw new InvalidParametersException(Map.of(name, min + "~" + max + " 사이의 정수여야 합니다."));
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`ArchiveMonthResponse.java`, `ArchiveResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/post/ArchiveMonthResponse.java`

```java
package org.example.post;

// 월별 아카이브 한 줄 — 그 달에 게시된(보는 사람이 볼 수 있는) 글 수
public record ArchiveMonthResponse(int year, int month, long count) {
}
```

`src/main/java/org/example/post/ArchiveResponse.java`

```java
package org.example.post;

import java.util.List;

public record ArchiveResponse(List<ArchiveMonthResponse> months) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `archive`, `month`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

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
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostSearchRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 변경된 메서드: `archive`.

`src/main/java/org/example/post/PostSearchRepository.java`

```java
package org.example.post;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.example.social.Follow;
import org.example.social.MemberBlock;
import org.example.tag.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

// 게시글 목록·검색의 단일 쿼리 조립기(Criteria API).
// - 들어온 조건만 Predicate로 붙인다(8-4). 조합마다 메서드를 만들지 않는다.
// - "볼 수 있는 글"(2-3 규칙 중 목록 부분) 조각은 viewable() 한 곳에만 있다 — 게시판 목록(2-2)과 검색(8-4)이 같이 쓴다.
//   단건 판정은 PostAccessPolicy(자바)이고, 규칙을 바꿀 때는 이 메서드와 그 클래스를 같이 고친다.
// - 목록은 필요한 열만 투영해 content(TEXT)를 읽지 않는다. 태그는 페이지 글 ID로 IN 한 번.
// - 건수는 항상 별도 COUNT 쿼리로 센다 — Spring Data의 Page는 "조회된 행 < size면 count 생략"을 해서
//   SQL 문장 수가 데이터 양에 따라 달라진다(2-4 PostListQueryCountTest가 그걸 잡았다).
@Repository
public class PostSearchRepository {

    private final EntityManager em;

    public PostSearchRepository(EntityManager em) {
        this.em = em;
    }

    public Page<PostListRow> search(PostSearchCondition cond, Long viewerId, Pageable pageable) {
        CriteriaBuilder cb = em.getCriteriaBuilder();

        CriteriaQuery<PostListRow> query = cb.createQuery(PostListRow.class);
        Root<Post> post = query.from(Post.class);
        query.select(cb.construct(PostListRow.class,
                        post.get("id"), post.get("title"), post.get("excerpt"),
                        post.get("author").get("id"), post.get("author").get("nickname"),
                        post.get("likeCount"), post.get("commentCount"), post.get("viewCount"),
                        post.get("publishedAt")))
                .where(conditions(cb, query, post, cond, viewerId))
                .orderBy(cb.desc(post.get("publishedAt")), cb.desc(post.get("id")));
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Post> countRoot = countQuery.from(Post.class);
        countQuery.select(cb.count(countRoot))
                .where(conditions(cb, countQuery, countRoot, cond, viewerId));
        long total = em.createQuery(countQuery).getSingleResult();

        // 전체 건수를 먼저 확인해야 큰 page의 long offset을 int로 잘라 이전 글을 재노출하지 않는다.
        long offset = pageable.getOffset();
        if (offset >= total) {
            return new PageImpl<>(List.of(), pageable, total);
        }
        if (offset > Integer.MAX_VALUE) {
            throw new InvalidSearchConditionException("요청한 페이지가 너무 큽니다.");
        }
        List<PostListRow> content = em.createQuery(query)
                .setFirstResult((int) offset)
                .setMaxResults(pageable.getPageSize())
                .getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    public List<PostTagRow> findTagsByPostIds(List<Long> postIds) {
        if (postIds.isEmpty()) return List.of();
        return em.createQuery("""
                        SELECT new org.example.post.PostTagRow(p.id, t.name)
                        FROM Post p JOIN p.tags t
                        WHERE p.id IN :ids
                        ORDER BY t.name
                        """, PostTagRow.class)
                .setParameter("ids", postIds)
                .getResultList();
    }

    // 14-7 월별 아카이브 — 목록(search)과 같은 조건 조립기를 써서 "이 달 n개"와 그 달 목록의 전체 건수가 늘 같다.
    // 연·월은 published_at에 YEAR()/MONTH()를 씌워 묶는다(묶기용 — 한 달 목록을 거를 때는 함수 대신 범위 조건을 쓴다).
    public List<ArchiveMonthResponse> archive(PostSearchCondition cond, Long viewerId) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
        Root<Post> post = query.from(Post.class);
        Expression<Integer> year = cb.function("year", Integer.class, post.get("publishedAt"));
        Expression<Integer> month = cb.function("month", Integer.class, post.get("publishedAt"));
        // 목록 URL이 허용하는 연도만 노출한다. 이 범위 조건은 published_at NULL도 제외한다.
        Predicate[] visible = conditions(cb, query, post, cond, viewerId);
        query.multiselect(year, month, cb.count(post))
                .where(cb.and(cb.and(visible),
                        cb.greaterThanOrEqualTo(post.get("publishedAt"), LocalDate.of(2000, 1, 1).atStartOfDay()),
                        cb.lessThan(post.get("publishedAt"), LocalDate.of(2101, 1, 1).atStartOfDay())))
                .groupBy(year, month)
                .orderBy(cb.desc(year), cb.desc(month));
        return em.createQuery(query).getResultList().stream()
                .map(row -> new ArchiveMonthResponse(((Number) row[0]).intValue(), ((Number) row[1]).intValue(),
                        ((Number) row[2]).longValue()))
                .toList();
    }

    private Predicate[] conditions(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Post> post,
                                   PostSearchCondition cond, Long viewerId) {
        List<Predicate> predicates = new ArrayList<>(viewable(cb, query, post, viewerId));

        if (cond.boardId() != null) {
            predicates.add(cb.equal(post.get("board").get("id"), cond.boardId()));
        }
        if (cond.authorId() != null) {
            predicates.add(cb.equal(post.get("author").get("id"), cond.authorId()));
        }
        if (cond.from() != null) {
            predicates.add(cb.greaterThanOrEqualTo(post.get("publishedAt"), cond.from().atStartOfDay()));
        }
        if (cond.to() != null && !cond.to().equals(LocalDate.of(9999, 12, 31))) { // 최대 DB 날짜는 상한을 생략한다.
            predicates.add(cb.lessThan(post.get("publishedAt"), cond.to().plusDays(1).atStartOfDay()));
        }
        if (cond.q() != null && !cond.q().isBlank()) {
            String pattern = "%" + escapeLike(cond.q().strip().toLowerCase()) + "%";
            predicates.add(cb.like(cb.lower(post.get("title")), pattern, '\\'));
        }
        if (cond.words() != null) {
            // 11-4 단어마다 하나의 조건(AND). 한 단어는 scope 안의 칸 중 하나에만 있으면 된다(OR)
            for (String word : cond.words()) {
                String pattern = "%" + escapeLike(word.toLowerCase(Locale.ROOT)) + "%";
                List<Predicate> anyColumn = new ArrayList<>();
                if (cond.scope().equals("all") || cond.scope().equals("title")) {
                    anyColumn.add(cb.like(cb.lower(post.get("title")), pattern, '\\'));
                }
                if (cond.scope().equals("all") || cond.scope().equals("content")) {
                    anyColumn.add(cb.like(cb.lower(post.get("content")), pattern, '\\'));
                }
                if (cond.scope().equals("all") || cond.scope().equals("author")) {
                    anyColumn.add(cb.like(cb.lower(post.get("author").get("nickname")), pattern, '\\'));
                }
                predicates.add(cb.or(anyColumn.toArray(Predicate[]::new)));
            }
        }
        if (cond.tag() != null && !cond.tag().isBlank()) {
            // JOIN하면 태그가 여러 개 걸린 글이 중복돼 건수가 부푼다 — EXISTS로 거른다
            Subquery<Long> tagged = query.subquery(Long.class);
            Root<Post> sub = tagged.from(Post.class);
            Join<Post, Tag> tags = sub.join("tags");
            tagged.select(sub.get("id"))
                    .where(cb.equal(sub, post), cb.equal(tags.get("name"), cond.tag()));
            predicates.add(cb.exists(tagged));
        }
        return predicates.toArray(Predicate[]::new);
    }

    // "볼 수 있는 글" — 목록은 PUBLISHED만(자기 임시저장·숨김 글도 목록에는 없다), 삭제 제외,
    // PUBLIC이거나 (로그인 시) 내 글·내가 팔로우하는 작성자의 글, 차단 관계(양방향) 작성자 제외
    private List<Predicate> viewable(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Post> post, Long viewerId) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isNull(post.get("deletedAt")));
        predicates.add(cb.equal(post.get("status"), "PUBLISHED"));

        Predicate isPublic = cb.equal(post.get("visibility"), "PUBLIC");
        if (viewerId == null) {
            predicates.add(isPublic);
            return predicates;
        }

        Subquery<Long> follows = query.subquery(Long.class);
        Root<Follow> f = follows.from(Follow.class);
        follows.select(f.get("id")).where(
                cb.equal(f.get("follower").get("id"), viewerId),
                cb.equal(f.get("followee"), post.get("author")));
        predicates.add(cb.or(isPublic, cb.equal(post.get("author").get("id"), viewerId), cb.exists(follows)));

        Subquery<Long> blocked = query.subquery(Long.class);
        Root<MemberBlock> b = blocked.from(MemberBlock.class);
        blocked.select(b.get("id")).where(cb.or(
                cb.and(cb.equal(b.get("blocker").get("id"), viewerId), cb.equal(b.get("blocked"), post.get("author"))),
                cb.and(cb.equal(b.get("blocked").get("id"), viewerId), cb.equal(b.get("blocker"), post.get("author")))));
        predicates.add(cb.not(cb.exists(blocked)));
        return predicates;
    }

    private static String escapeLike(String raw) {
        return raw.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
```

</details>

### MyBatis 대안 — 집계와 월별 목록의 공개 규칙 공유

`ArchiveMapper.xml`의 `visible` SQL 조각을 월별 집계·건수·목록에 함께 넣는다. JPA 대안은 `PostSearchRepository.conditions`를 공유한다. 월 목록의 태그 일괄 조회와 응답 DTO는 기존 Java 코드를 재사용한다. 두 방식 모두 목록 URL 범위 밖의 연도와 발행 시각이 없는 행을 집계에서 제외한다.

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
<summary>MyBatis / Mapper — ArchiveMapper.java</summary>

`src/main/java/org/example/post/ArchiveMapper.java`

```java
package org.example.post;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ArchiveMapper {
    List<ArchiveMonthResponse> archive(@Param("boardId") Long boardId, @Param("viewerId") Long viewerId);

    long countMonth(@Param("boardId") Long boardId, @Param("viewerId") Long viewerId,
                    @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<PostListRow> findMonth(@Param("boardId") Long boardId, @Param("viewerId") Long viewerId,
                                @Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                @Param("limit") int limit, @Param("offset") int offset);
}
```

</details>

<details>
<summary>MyBatis / SQL — ArchiveMapper.xml</summary>

`src/main/resources/mapper/ArchiveMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.ArchiveMapper">
    <resultMap id="archiveMonth" type="org.example.post.ArchiveMonthResponse">
        <constructor>
            <arg column="year" javaType="_int"/>
            <arg column="month" javaType="_int"/>
            <arg column="count" javaType="_long"/>
        </constructor>
    </resultMap>
    <resultMap id="postList" type="org.example.post.PostListRow">
        <constructor>
            <arg column="id" javaType="java.lang.Long"/>
            <arg column="title" javaType="java.lang.String"/>
            <arg column="excerpt" javaType="java.lang.String"/>
            <arg column="author_id" javaType="java.lang.Long"/>
            <arg column="author_nickname" javaType="java.lang.String"/>
            <arg column="like_count" javaType="java.lang.Integer"/>
            <arg column="comment_count" javaType="java.lang.Integer"/>
            <arg column="view_count" javaType="java.lang.Integer"/>
            <arg column="published_at" javaType="java.time.LocalDateTime"/>
        </constructor>
    </resultMap>

    <!-- 개수와 목록에 같은 공개·팔로우·차단 조건을 넣어 숫자가 달라지지 않게 한다. -->
    <sql id="visible">
        p.board_id = #{boardId} AND p.deleted_at IS NULL AND p.status = 'PUBLISHED'
        AND (p.visibility = 'PUBLIC'
             OR (#{viewerId} IS NOT NULL AND (p.author_id = #{viewerId}
                 OR EXISTS (SELECT 1 FROM follow f WHERE f.follower_id = #{viewerId} AND f.followee_id = p.author_id))))
        AND (#{viewerId} IS NULL OR NOT EXISTS (
             SELECT 1 FROM member_block b
              WHERE (b.blocker_id = #{viewerId} AND b.blocked_id = p.author_id)
                 OR (b.blocked_id = #{viewerId} AND b.blocker_id = p.author_id)))
    </sql>
    <sql id="monthRange">
        AND p.published_at &gt;= #{from} AND p.published_at &lt; #{to}
    </sql>

    <select id="archive" resultMap="archiveMonth">
        SELECT YEAR(p.published_at) AS year, MONTH(p.published_at) AS month, COUNT(*) AS count
          FROM post p
         WHERE <include refid="visible"/>
           AND p.published_at &gt;= '2000-01-01 00:00:00'
           AND p.published_at &lt; '2101-01-01 00:00:00'
         GROUP BY YEAR(p.published_at), MONTH(p.published_at)
         ORDER BY year DESC, month DESC
    </select>
    <select id="countMonth" resultType="long">
        SELECT COUNT(*) FROM post p
         WHERE <include refid="visible"/> <include refid="monthRange"/>
    </select>
    <select id="findMonth" resultMap="postList">
        SELECT p.id, p.title, p.excerpt, p.author_id, a.nickname AS author_nickname,
               p.like_count, p.comment_count, p.view_count, p.published_at
          FROM post p JOIN member a ON a.id = p.author_id
         WHERE <include refid="visible"/> <include refid="monthRange"/>
         ORDER BY p.published_at DESC, p.id DESC
         LIMIT #{limit} OFFSET #{offset}
    </select>
</mapper>
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
import org.springframework.data.domain.PageImpl;
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
    private final ArchiveMapper archiveMapper;
    private final PostViewRepository postViewRepository;
    private final Clock clock;
    private final RecentViewService recentViewService;

    public PostQueryService(PostRepository postRepository, BoardRepository boardRepository,
                             MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                             PostSearchRepository postSearchRepository, ArchiveMapper archiveMapper, PostViewRepository postViewRepository,
                             Clock clock, RecentViewService recentViewService) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.postSearchRepository = postSearchRepository;
        this.archiveMapper = archiveMapper;
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
        return new ArchiveResponse(archiveMapper.archive(board.getId(), viewerIdOf(viewer)));
    }

    // 14-7 한 달의 글 목록 — 8-4 조합 검색의 from·to와 같은 범위 조건 [1일 00:00, 다음 달 1일 00:00)
    @Transactional(readOnly = true)
    public PostListResponse month(String boardSlug, int year, int month, int page, int size, AuthenticatedMember viewer) {
        Board board = boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.plusMonths(1).atDay(1).atStartOfDay();
        Long viewerId = viewerIdOf(viewer);
        long total = archiveMapper.countMonth(board.getId(), viewerId, from, to);
        long offset = (long) page * size;
        if (offset > Integer.MAX_VALUE && offset < total) {
            throw new InvalidSearchConditionException("요청한 페이지가 너무 큽니다.");
        }
        List<PostListRow> rows = offset >= total ? List.of()
                : archiveMapper.findMonth(board.getId(), viewerId, from, to, size, (int) offset);
        return toListResponse(new PageImpl<>(rows, PageRequest.of(page, size), total));
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

## 직접 확인

자유 게시판의 2026년 9월에는 비로그인 기준 공개 글이 9개다(4·5·9·12~17). 6번(팔로워 공개)·7번(임시저장)·8번(삭제)·10번(숨김)은 빠진다. 10월에는 18~21번 4개에, 앞 단계에서 만든 글이 더해진다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'
ids() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["totalElements"], [i["id"] for i in d["items"]])'; }

curl -s "$BASE/api/boards/free/archive"; echo                          # A1 9월 9
curl -s "$BASE/api/boards/free/archive" -H "$L"; echo                  # A2 9월 10
curl -s "$BASE/api/boards/free/archive/2026/9?size=20" | ids           # A3 9 [17 … 4]
curl -s "$BASE/api/boards/free/archive/2026/9?size=20" -H "$K" | ids   # A4 9 (6 있음, 9 없음)
curl -s "$BASE/api/boards/free/archive/2026/9?size=20" -H "$L" | ids   # A5 10
curl -i "$BASE/api/boards/free/archive/2026/13"                        # A8b 400
curl -i "$BASE/api/boards/free/archive/abc/9"                          # A8e 400
curl -i "$BASE/api/boards/free/archive/2026/9?page="                   # A8i 400
curl -i "$BASE/api/boards/free/archive/2026/9?size="                   # A8j 400
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A1",
      "title": "월별 글 수(비로그인)",
      "method": "GET",
      "path": "/api/boards/free/archive"
    },
    {
      "id": "A2",
      "title": "월별 글 수(이스프링 — 자기 팔로워 공개 글 포함)",
      "method": "GET",
      "path": "/api/boards/free/archive",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "A3",
      "title": "2026년 9월 글(비로그인)",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=20"
    },
    {
      "id": "A4",
      "title": "2026년 9월 글(김자바)",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=20",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "A5",
      "title": "2026년 9월 글(이스프링)",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=20",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "A6",
      "title": "2026년 8월(글 없음)",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/8"
    },
    {
      "id": "A7",
      "title": "경계값 안쪽 — 2000년 1월",
      "method": "GET",
      "path": "/api/boards/free/archive/2000/1"
    },
    {
      "id": "A7b",
      "title": "경계값 안쪽 — 2100년 12월",
      "method": "GET",
      "path": "/api/boards/free/archive/2100/12"
    },
    {
      "id": "A7c",
      "title": "경계값 안쪽 — size=50",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=50"
    },
    {
      "id": "A8",
      "title": "잘못된 입력 — 0월",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/0"
    },
    {
      "id": "A8b",
      "title": "잘못된 입력 — 13월",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/13"
    },
    {
      "id": "A8c",
      "title": "잘못된 입력 — 1999년",
      "method": "GET",
      "path": "/api/boards/free/archive/1999/9"
    },
    {
      "id": "A8d",
      "title": "잘못된 입력 — 2101년",
      "method": "GET",
      "path": "/api/boards/free/archive/2101/1"
    },
    {
      "id": "A8e",
      "title": "잘못된 입력 — 연도 자리에 문자",
      "method": "GET",
      "path": "/api/boards/free/archive/abc/9"
    },
    {
      "id": "A8f",
      "title": "잘못된 입력 — size=0",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=0"
    },
    {
      "id": "A8g",
      "title": "잘못된 입력 — size=51",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=51"
    },
    {
      "id": "A8h",
      "title": "잘못된 입력 — page=-1",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?page=-1"
    },
    {
      "id": "A8i",
      "title": "잘못된 입력 — 빈 page",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?page="
    },
    {
      "id": "A8j",
      "title": "잘못된 입력 — 빈 size",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size="
    },
    {
      "id": "A8k",
      "title": "잘못된 입력 — int 범위 초과 page",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?page=2147483648"
    },
    {
      "id": "A8l",
      "title": "잘못된 입력 — int 범위 초과 size",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/9?size=99999999999999999"
    },
    {
      "id": "A8m",
      "title": "잘못된 입력 — month 자리에 문자",
      "method": "GET",
      "path": "/api/boards/free/archive/2026/abc"
    },
    {
      "id": "A9",
      "title": "없는 게시판의 아카이브",
      "method": "GET",
      "path": "/api/boards/nope/archive"
    },
    {
      "id": "A9b",
      "title": "없는 게시판의 한 달",
      "method": "GET",
      "path": "/api/boards/nope/archive/2026/9"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.months",
            "contains": {
              "year": 2026,
              "month": 9,
              "count": 9
            }
          },
          {
            "path": "$.months[*].month",
            "notContains": 8
          }
        ]
      },
      "note": "글이 있는 달만 나온다. 9월은 공개 글 9개(팔로워 공개·임시저장·삭제·숨김 제외)"
    },
    {
      "id": "C2",
      "request": "A2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.months",
            "contains": {
              "year": 2026,
              "month": 9,
              "count": 10
            }
          }
        ]
      },
      "note": "이스프링에게는 자기 팔로워 공개 글(6번)이 더 보인다"
    },
    {
      "id": "C3",
      "request": "A3",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.totalElements",
            "equals": 9
          },
          {
            "path": "$.items[*].id",
            "equals": [
              17,
              16,
              15,
              14,
              13,
              12,
              9,
              5,
              4
            ]
          }
        ]
      },
      "note": "9월 30일 09:00 글(17)은 들어가고 10월 1일 09:00 글(18)은 안 들어간다"
    },
    {
      "id": "C4",
      "request": "A4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.totalElements",
            "equals": 9
          },
          {
            "path": "$.items[*].id",
            "contains": 6
          },
          {
            "path": "$.items[*].id",
            "notContains": 9
          }
        ]
      },
      "note": "같은 9개라도 김자바는 6번(팔로우)이 보이고 9번(차단)이 빠진다"
    },
    {
      "id": "C5",
      "request": "A5",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.totalElements",
            "equals": 10
          }
        ]
      },
      "note": "A2의 9월 10개와 같다 — 개수와 목록이 같은 조건을 쓴다"
    },
    {
      "id": "C6",
      "request": "A6",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.totalElements",
            "equals": 0
          },
          {
            "path": "$.items",
            "length": 0
          }
        ]
      }
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "A7",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "A7b",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "A7c",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "A8",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8b",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8c",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8d",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8e",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8f",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8g",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8h",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8i",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8j",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8k",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8l",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "A8m",
          "expect": {
            "status": 400
          }
        }
      ],
      "note": "범위 밖·문자·빈 값·int 초과 연·월·page·size는 400 — 500이 아니다"
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "A9",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "A9b",
          "expect": {
            "status": 404
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
| C1 | A1 | `200`, `months`에 `{2026, 9, 9}`, 8월은 없다 |
| C2 | A2 | `200`, `months`에 `{2026, 9, 10}` — 이스프링에게는 자기 팔로워 공개 글이 더 보인다 |
| C3 | A3 | `200`, `totalElements`=9, id `[17, 16, 15, 14, 13, 12, 9, 5, 4]` — 9월 30일 글은 들어가고 10월 1일 글(18)은 안 들어간다 |
| C4 | A4 | `200`, 9개, 6번 있음·9번 없음(김자바 기준) |
| C5 | A5 | `200`, `totalElements`=10 — A2의 `count`와 같다 |
| C6 | A6 | `200`, 0개 |
| C7 | A7 / A7b / A7c | 모두 `200` — 경계값 안쪽(2000년 1월, 2100년 12월, `size=50`) |
| C8 | A8~A8m | 모두 `400`(범위 밖·문자·빈 값·int 초과) — 500이 아니다 |
| C9 | A9 / A9b | `404` / `404` — 없는 게시판 |
| D1 | `SELECT YEAR(published_at), MONTH(published_at), COUNT(*) FROM post WHERE board_id = 4 AND deleted_at IS NULL AND status = 'PUBLISHED' AND visibility = 'PUBLIC' AND published_at >= '2000-01-01' AND published_at < '2101-01-01' GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC` | A1과 같은 숫자 |
| D2 | `EXPLAIN SELECT id FROM post WHERE board_id = 4 AND published_at >= '2026-09-01' AND published_at < '2026-10-01'`과 `… AND MONTH(published_at) = 9 AND YEAR(published_at) = 2026` 비교 | 범위 조건은 `key_len`이 `board_id`+`published_at`까지 쓰고 `rows`가 작다. 함수 쪽은 `board_id`까지만 쓴다 |
| R1 | 같은 조건 | JPA는 개수와 목록이 같은 "볼 수 있는 글" 조건(8-4 조립기)을 쓴다. MyBatis는 같은 `visible` SQL 조각을 세 쿼리에 넣는다 |
| R2 | 범위 | 한 달 목록은 `[1일 00:00, 다음 달 1일 00:00)` 범위다. `<= 9월 30일`로 쓰면 30일 09:00 글이 빠진다(날짜만 비교하는 함정 — 8-4 `to`와 같다) |
| R3 | 입력 검증 | 연·월을 `@Min`·`@Max`로 막는다. 막지 않으면 `YearMonth.of(2026, 13)`이 `DateTimeException`을 던져 500이 된다 |
| R4 | 시간대 | `published_at`은 서울 시각으로 저장돼 있다. UTC로 묶으면 9월 30일 오후 3시 이후 글이 10월로 넘어간다(W20) |
| R5 | 열 수 있는 달만 | 집계는 2000-01-01 이상 2101-01-01 미만만 포함한다. `published_at=NULL`인 비정상 게시 글도 제외한다 |

## 필요한 지식

- [R05 — 조회 모양을 바꿔 복합 인덱스 읽기](../../docs/knowledge/R05-index-btree.md#3단계-조회-모양을-바꿔-기존-복합-인덱스도-읽는다) — 함수를 씌우면 인덱스 범위를 못 쓴다
- [J1 레슨 — 실행 계획 읽기](../../lessons/J1-reading-explain.md)
- [W20 시간과 시간대](../../docs/knowledge/W20-time-timezone.md#언제와-몇-시는-다른-질문이다) — 어느 시간대의 "9월"인가
- [G1 레슨 — 페이징과 정렬](../../lessons/G1-paging-and-sorting.md) — 목록 모양은 2-2 그대로
- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 개수와 목록이 같은 규칙

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — Criteria로 연·월 묶기</summary>

```java
Expression<Integer> year = cb.function("year", Integer.class, post.get("publishedAt"));
Expression<Integer> month = cb.function("month", Integer.class, post.get("publishedAt"));
query.multiselect(year, month, cb.count(post))
     .where(cb.and(cb.and(conditions(cb, query, post, cond, viewerId)),
                   cb.greaterThanOrEqualTo(post.get("publishedAt"), LocalDate.of(2000, 1, 1).atStartOfDay()),
                   cb.lessThan(post.get("publishedAt"), LocalDate.of(2101, 1, 1).atStartOfDay())))
     .groupBy(year, month)
     .orderBy(cb.desc(year), cb.desc(month));
```
</details>

<details>
<summary>힌트 2 — 한 달 목록은 새로 만들지 않는다</summary>

`YearMonth ym = YearMonth.of(year, month);`로 `ym.atDay(1)`·`ym.atEndOfMonth()`를 구해 8-4 조합 검색의 `from`·`to`에 넣으면 끝이다. 8-4가 이미 `to`를 "그날 끝까지(다음 날 00:00 미만)"로 처리한다.
</details>

## 다음 단계

[14-8. 폴더 공유 링크](14-8-shared-folder.md)
