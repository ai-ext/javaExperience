# 14-3. 공지·상단 고정 글 — 게시판마다 3개까지

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "운영팀이 자유 게시판 맨 위에 '이용 규칙'·'이벤트 안내' 같은 글을 고정해 두고 싶대요. 게시판마다 3개까지, 먼저 고정한 글이 위로요. 운영자만 고정하고 풀 수 있어요. 숨겨진 글이나 팔로워 공개 글은 고정하면 안 돼요 — 모두가 보는 자리니까요."

규칙이 여러 겹이다. **누가**(운영자만), **무엇을**(이 게시판의, 누구나 볼 수 있는 글), **몇 개까지**(3개), **어떤 순서로**(먼저 고정한 순). 그리고 고정한 뒤의 일도 있다. 고정해 둔 글을 작성자가 지우거나 운영자가 숨기면, 고정 목록에서도 빠져야 한다. 목록을 줄 때 2-3의 "볼 수 있는 글" 규칙을 **다시 거는** 이유다. 같은 이유로 고정 목록은 **보는 사람마다** 다를 수 있다(차단 관계).

고정 목록은 게시판 목록(2-2) 응답에 섞지 않고 **따로** 준다. 그래야 2-2·8-4의 목록 응답과 건수가 바뀌지 않는다. 화면은 두 API를 함께 부른다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "자유 게시판 — 고정 글",
  "summary": "운영자가 고정한 글이 게시판 맨 위에 먼저 고정한 순서로 보인다. 게시판마다 3개까지.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판", "right": "운영자" },
    {
      "type": "list",
      "id": "pinned",
      "label": "📌 고정",
      "items": [
        { "id": "p14", "title": "자유글 03", "meta": "이스프링", "badge": "고정" },
        { "id": "p12", "title": "자유글 01", "meta": "이스프링", "badge": "고정" },
        { "id": "p9", "title": "차단 확인용 글", "meta": "한차단", "badge": "고정" }
      ]
    },
    {
      "type": "list",
      "id": "posts",
      "label": "전체 글(2-2 목록)",
      "items": [
        { "id": "l21", "title": "자유글 10" },
        { "id": "l15", "title": "자유글 04" }
      ]
    },
    {
      "type": "actions",
      "id": "admin",
      "items": [
        { "id": "pin", "label": "📌 이 글 고정", "variant": "primary" },
        { "id": "unpin", "label": "고정 해제", "variant": "secondary" }
      ]
    },
    { "type": "toast", "id": "toast", "value": "게시판마다 3개까지 고정할 수 있어요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "고정하기",
      "steps": [
        { "kind": "user", "text": "운영자가 '자유글 01'을 고정한다", "focus": ["pin"] },
        { "kind": "request", "method": "PUT", "path": "/api/boards/free/pinned-posts/12", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "server", "text": "운영자인가(403) → 게시판·글이 있나(404) → 이 게시판의 글인가·게시된 전체 공개 글인가(400) → 이미 고정됐나(그대로 200) → 3개 미만인가(400)" },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM board_pin WHERE board_id = 4" },
        { "kind": "db", "sql": "INSERT INTO board_pin (board_id, post_id, pinned_by, created_at) VALUES (4, 12, 1, ?)" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "[{\"id\": 14, \"title\": \"자유글 03\", \"author\": {\"id\": 3, \"nickname\": \"이스프링\"}, \"pinnedAt\": \"…\"}, {\"id\": 12, \"title\": \"자유글 01\", \"author\": {\"id\": 3, \"nickname\": \"이스프링\"}, \"pinnedAt\": \"…\"}]"
        },
        { "kind": "screen", "text": "고정 목록 맨 아래에 '자유글 01'이 붙는다", "focus": ["pinned"] }
      ]
    },
    {
      "name": "넷째 고정",
      "steps": [
        { "kind": "user", "text": "이미 3개가 고정된 게시판에 하나 더 고정한다", "focus": ["pin"] },
        { "kind": "request", "method": "PUT", "path": "/api/boards/free/pinned-posts/15", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM board_pin WHERE board_id = 4", "note": "3 — 한도" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "'게시판마다 3개까지 고정할 수 있어요'", "focus": ["toast"] }
      ]
    },
    {
      "name": "보는 사람마다 다른 고정 목록",
      "steps": [
        { "kind": "user", "text": "김자바가 자유 게시판을 연다(9번 글 작성자 한차단이 김자바를 차단했다)" },
        { "kind": "request", "method": "GET", "path": "/api/boards/free/pinned-posts", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "db", "sql": "SELECT bp.*, p.*, m.* FROM board_pin bp JOIN post p ON p.id = bp.post_id JOIN member m ON m.id = p.author_id WHERE bp.board_id = 4 ORDER BY bp.created_at, bp.id", "note": "글·작성자를 한 번에(fetch join)" },
        { "kind": "server", "text": "2-3 규칙(PostAccessPolicy)으로 이 사람이 볼 수 있는 글만 남긴다 — 9번은 차단 관계라 빠진다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "[{\"id\": 14, \"title\": \"자유글 03\", …}, {\"id\": 12, \"title\": \"자유글 01\", …}]"
        },
        { "kind": "screen", "text": "김자바에게는 고정 글이 두 개만 보인다", "focus": ["p14", "p12"] }
      ]
    }
  ]
}
```

## 만들 것

**V52** — `db/migration/V52__create_board_pin.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `board_id` | FK → `board` |
| `post_id` | FK → `post`, **`UNIQUE`** — 한 글은 한 번만 고정 |
| `pinned_by` | 고정한 운영자, FK → `member` |
| `created_at` | 고정한 시각 `DATETIME(6)` — 같은 초에 여러 개를 고정해도 순서가 갈리게(그래도 같으면 `id` 순) |
| 인덱스 | `(board_id, created_at, id)` — "이 게시판의 고정 글을 고정한 순으로" |

**API**

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/boards/{slug}/pinned-posts` | 고정 글 목록 — **비로그인 가능**, 먼저 고정한 순 | `200` `[ { "id", "title", "author": { "id", "nickname" }, "pinnedAt" } ]` |
| `PUT /api/boards/{slug}/pinned-posts/{postId}` | 고정(운영자만). 이미 고정돼 있으면 그대로 | `200` 고정 후 목록 |
| `DELETE /api/boards/{slug}/pinned-posts/{postId}` | 해제(운영자만). 고정돼 있지 않아도 성공 | `204` |

**입력 규칙** — 본문이 없고 경로 값이 입력이다. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 입력 | 필수 | 형식 | 규칙 | 틀렸을 때 |
|---|---|---|---|---|
| 경로 `{slug}` | 예 | 문자열 | 있는 게시판 | `404` |
| 경로 `{postId}` | 예 | 숫자(`abc` → 400) | 있고 지워지지 않은 글 | `404` |
| 〃 | | | **이 게시판의 글** | `400`, `errors`에 `postId` |
| 〃 | | | **게시됨(`PUBLISHED`) + 전체 공개(`PUBLIC`)** — 임시저장·숨김·팔로워 공개 글은 안 됨 | `400`, `errors`에 `postId` |
| 개수 | | | 이 게시판의 고정이 3개 미만(이미 고정된 글을 다시 고정하는 것은 개수와 무관하게 성공) | `400` |

| 상황 | 결과 |
|---|---|
| 운영자가 아님 | `403` |
| PUT·DELETE에 토큰 없음 | `401` |
| 고정한 뒤 글이 지워지거나 숨겨짐 | 목록에서 빠진다. 자리(행)는 운영자가 해제할 때까지 남는다 |
| 목록을 보는 사람이 볼 수 없는 글(차단 관계 등) | 그 사람의 목록에서 빠진다(2-3 규칙) |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 운영자인가(403) → 게시판·글이 있나(404) → 이 게시판의 글인가·게시된 전체 공개 글인가(400) → 이미 고정됐나(그대로 200) → 3개 미만인가(400)
- 3 — 한도
- 글·작성자를 한 번에(fetch join)
- 2-3 규칙(PostAccessPolicy)으로 이 사람이 볼 수 있는 글만 남긴다 — 9번은 차단 관계라 빠진다

<details>
<summary>Controller — HTTP 연결</summary>

`PinController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@RequestMapping("/api/boards/{slug}/pinned-posts")`, `@GetMapping`, `@PutMapping("/{postId}")`. 변경된 메서드: `list`, `pin`, `unpin`.

`src/main/java/org/example/pin/PinController.java`

```java
package org.example.pin;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{slug}/pinned-posts")
public class PinController {

    private final PinService pinService;

    public PinController(PinService pinService) {
        this.pinService = pinService;
    }

    // 비로그인도 볼 수 있다 — 목록 화면이 게시판 목록(2-2)과 함께 부른다
    @GetMapping
    public List<PinnedPostResponse> list(@PathVariable String slug, @LoginMember AuthenticatedMember viewer) {
        return pinService.list(slug, viewer);
    }

    @PutMapping("/{postId}")
    public List<PinnedPostResponse> pin(@PathVariable String slug, @PathVariable Long postId,
                                        @LoginMember AuthenticatedMember loginMember) {
        return pinService.pin(slug, postId, loginMember);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpin(@PathVariable String slug, @PathVariable Long postId,
                      @LoginMember AuthenticatedMember loginMember) {
        pinService.unpin(slug, postId, loginMember);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PinnedPostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/pin/PinnedPostResponse.java`

```java
package org.example.pin;

import org.example.post.AuthorResponse;

import java.time.LocalDateTime;

public record PinnedPostResponse(Long id, String title, AuthorResponse author, LocalDateTime pinnedAt) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PinService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `pin`, `unpin`, `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/pin/PinService.java`

```java
package org.example.pin;

import org.example.admin.AdminOnlyException;
import org.example.auth.AuthenticatedMember;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Predicate;

// 게시판 상단 고정 — 운영자만, 게시판마다 최대 3개, 먼저 고정한 글이 위
@Service
public class PinService {

    static final int MAX_PINS = 3;
    private static final String ADMIN_ROLE = "ADMIN";

    private final BoardPinRepository pinRepository;
    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public PinService(BoardPinRepository pinRepository, BoardRepository boardRepository,
                      PostRepository postRepository,
                      PostAccessPolicy accessPolicy, Clock clock) {
        this.pinRepository = pinRepository;
        this.boardRepository = boardRepository;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    // 이미 고정된 글이면 아무것도 하지 않는다(멱등). 한도는 "센 다음 넣는다"라서 운영자 둘이 동시에
    // 넣으면 4개가 될 수 있다 — 이 장에서는 다루지 않는다(4-2·H1)
    @Transactional
    public List<PinnedPostResponse> pin(String slug, Long postId, AuthenticatedMember me) {
        requireAdmin(me);
        Board board = findBoard(slug);
        Post post = postRepository.findById(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getBoard().getId().equals(board.getId())) {
            throw new InvalidPinException("postId", "이 게시판의 글이 아닙니다.");
        }
        // 고정 글은 모두에게 보이는 자리다 — 누구나 볼 수 있는 글(게시됨·전체 공개)만
        if (!"PUBLISHED".equals(post.getStatus()) || !"PUBLIC".equals(post.getVisibility())) {
            throw new InvalidPinException("postId", "게시된 전체 공개 글만 고정할 수 있습니다.");
        }
        if (!pinRepository.existsByPost_Id(postId)) {
            if (pinRepository.countByBoard_Id(board.getId()) >= MAX_PINS) {
                throw new InvalidPinException(null, "게시판마다 " + MAX_PINS + "개까지 고정할 수 있습니다.");
            }
            pinRepository.insertIfAbsent(board.getId(), postId, me.id(), LocalDateTime.now(clock));
        }
        return list(board, me);
    }

    @Transactional
    public void unpin(String slug, Long postId, AuthenticatedMember me) {
        requireAdmin(me);
        Board board = findBoard(slug);
        pinRepository.deleteByBoardAndPost(board.getId(), postId);
    }

    @Transactional(readOnly = true)
    public List<PinnedPostResponse> list(String slug, AuthenticatedMember viewer) {
        return list(findBoard(slug), viewer);
    }

    // 고정된 뒤에 지워지거나 숨겨진 글, 이 사람이 볼 수 없는 글(차단 등)은 빼고 보여 준다 — 2-3 규칙 재사용
    private List<PinnedPostResponse> list(Board board, AuthenticatedMember viewer) {
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        return pinRepository.findByBoardInOrder(board.getId()).stream()
                .filter(pin -> "PUBLISHED".equals(pin.getPost().getStatus())
                        && "PUBLIC".equals(pin.getPost().getVisibility()))
                .filter(pin -> viewable.test(pin.getPost()))
                .map(pin -> new PinnedPostResponse(
                        pin.getPost().getId(),
                        pin.getPost().getTitle(),
                        new AuthorResponse(pin.getPost().getAuthor().getId(), pin.getPost().getAuthor().getNickname()),
                        pin.getCreatedAt()))
                .toList();
    }

    private Board findBoard(String slug) {
        return boardRepository.findBySlug(slug).orElseThrow(() -> new BoardNotFoundException(slug));
    }

    private void requireAdmin(AuthenticatedMember me) {
        if (!ADMIN_ROLE.equals(me.role())) {
            throw new AdminOnlyException();
        }
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BoardPinRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/pin/BoardPinRepository.java`

```java
package org.example.pin;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;

public interface BoardPinRepository extends JpaRepository<BoardPin, Long> {

    // 같은 글을 동시에 고정해도 UNIQUE(post_id) 충돌을 성공한 멱등 요청으로 처리한다.
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO board_pin (board_id, post_id, pinned_by, created_at)
            VALUES (:boardId, :postId, :memberId, :now)
            ON DUPLICATE KEY UPDATE id = id
            """)
    int insertIfAbsent(@Param("boardId") Long boardId, @Param("postId") Long postId,
                       @Param("memberId") Long memberId, @Param("now") LocalDateTime now);

    // 고정 순서대로, 글·작성자까지 한 번에(목록에서 글마다 쿼리를 보내지 않는다)
    // 쓰기 직후 같은 트랜잭션의 오래된 REPEATABLE READ 스냅샷 대신 최신 커밋 행을 본다.
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("""
            SELECT bp FROM BoardPin bp
            JOIN FETCH bp.post p
            JOIN FETCH p.author
            WHERE bp.board.id = :boardId
            ORDER BY bp.createdAt ASC, bp.id ASC
            """)
    List<BoardPin> findByBoardInOrder(@Param("boardId") Long boardId);

    long countByBoard_Id(Long boardId);

    boolean existsByPost_Id(Long postId);

    @Modifying
    @Query("DELETE FROM BoardPin bp WHERE bp.board.id = :boardId AND bp.post.id = :postId")
    int deleteByBoardAndPost(@Param("boardId") Long boardId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`BoardPin.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

`src/main/java/org/example/pin/BoardPin.java`

```java
package org.example.pin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.board.Board;
import org.example.member.Member;
import org.example.post.Post;

import java.time.LocalDateTime;

// 게시판 상단 고정 — 운영자가 고정한 글. 글이 나중에 지워지거나 숨겨지면 목록에서 빠지지만 행(자리)은 남는다
@Entity
@Table(name = "board_pin")
public class BoardPin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pinned_by", nullable = false)
    private Member pinnedBy;

    // 같은 초에 여러 개를 고정해도 순서가 갈리도록 마이크로초까지(DATETIME(6)) — 그래도 같으면 id 순
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected BoardPin() {
        // JPA
    }

    public BoardPin(Board board, Post post, Member pinnedBy, LocalDateTime now) {
        this.board = board;
        this.post = post;
        this.pinnedBy = pinnedBy;
        this.createdAt = now;
    }

    public Post getPost() {
        return post;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V52__create_board_pin.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V52__create_board_pin.sql`

```sql
-- 14-3 공지·상단 고정 — 게시판마다 최대 3개(개수 한도는 서비스가 확인), 글 하나는 한 번만 고정(UNIQUE post_id).
-- 고정 순서는 먼저 고정한 글이 위 — (board_id, created_at, id) 인덱스 순서 그대로 읽는다.
CREATE TABLE board_pin (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    board_id   BIGINT   NOT NULL,
    post_id    BIGINT   NOT NULL,
    pinned_by  BIGINT   NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_board_pin_post (post_id),
    KEY ix_board_pin_board (board_id, created_at, id),
    KEY fk_board_pin_member (pinned_by),
    CONSTRAINT fk_board_pin_board FOREIGN KEY (board_id) REFERENCES board (id),
    CONSTRAINT fk_board_pin_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_board_pin_member FOREIGN KEY (pinned_by) REFERENCES member (id)
);
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidPinException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleInvalidPin`.

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
import org.example.poll.InvalidPollException;
import org.example.poll.PollConflictException;
import org.example.poll.PollNotFoundException;
import org.example.pin.InvalidPinException;

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

    @ExceptionHandler(PollNotFoundException.class)
    public ProblemDetail handlePollNotFound(PollNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPollException.class)
    public ProblemDetail handleInvalidPoll(InvalidPollException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(PollConflictException.class)
    public ProblemDetail handlePollConflict(PollConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPinException.class)
    public ProblemDetail handleInvalidPin(InvalidPinException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        if (ex.getField() != null) {
            problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        }
        return problem;
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

`src/main/java/org/example/pin/InvalidPinException.java`

```java
package org.example.pin;

// 고정할 수 없는 글(다른 게시판·공개 글이 아님) 또는 한도 초과 — 400. field가 있으면 errors에 담는다
public class InvalidPinException extends RuntimeException {

    private final String field;

    public InvalidPinException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
```

</details>

### MyBatis 대안 — 고정 행은 Mapper, 글은 배치 조회

고정 행의 존재·개수·삽입·삭제·순서는 MyBatis `PinMapper`가 처리한다. 목록에서는 고정 글 ID를 Mapper로 읽은 뒤 기존 JPA `PostRepository`가 **한 번에** 글·작성자를 가져온다.

이렇게 하면 기존 `PostAccessPolicy.viewableBy`의 차단·공개 규칙을 그대로 쓰면서, 글마다 조회하는 N+1을 피한다. 이 대안은 혼합 경로이며, 글 조회까지 MyBatis로 옮길 때는 같은 접근 정책을 별도 DTO에 적용하도록 설계해야 한다.

<details>
<summary>MyBatis / 설정 — 의존성·XML 로딩</summary>

`build.gradle`의 `dependencies`에 추가:

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
```

`src/main/resources/application.yml`에 추가:

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / DTO — 고정 순서와 시각</summary>

`src/main/java/org/example/pin/PinRow.java`

```java
package org.example.pin;

import java.time.LocalDateTime;

// Mapper가 고정 순서와 시각을 가져온다. 글은 한 번에 따로 읽어 접근 정책을 재사용한다.
public record PinRow(Long postId, LocalDateTime pinnedAt) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — 고정 행 연산</summary>

`src/main/java/org/example/pin/PinMapper.java`

```java
package org.example.pin;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PinMapper {
    List<PinRow> findByBoardInOrder(@Param("boardId") Long boardId);

    boolean existsByPostId(@Param("postId") Long postId);

    long countByBoardId(@Param("boardId") Long boardId);

    void insert(@Param("boardId") Long boardId, @Param("postId") Long postId,
                @Param("memberId") Long memberId, @Param("now") LocalDateTime now);

    int delete(@Param("boardId") Long boardId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / SQL — 개수·중복·정렬·삭제</summary>

`src/main/resources/mapper/PinMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.pin.PinMapper">
    <resultMap id="pinRow" type="org.example.pin.PinRow">
        <constructor>
            <arg column="post_id" javaType="java.lang.Long"/>
            <arg column="created_at" javaType="java.time.LocalDateTime"/>
        </constructor>
    </resultMap>

    <select id="findByBoardInOrder" resultMap="pinRow">
        SELECT post_id, created_at FROM board_pin
         WHERE board_id = #{boardId}
         ORDER BY created_at, id
         FOR SHARE
    </select>
    <select id="existsByPostId" resultType="boolean">
        SELECT EXISTS (SELECT 1 FROM board_pin WHERE post_id = #{postId})
    </select>
    <select id="countByBoardId" resultType="long">
        SELECT COUNT(*) FROM board_pin WHERE board_id = #{boardId}
    </select>
    <insert id="insert">
        INSERT INTO board_pin (board_id, post_id, pinned_by, created_at)
        VALUES (#{boardId}, #{postId}, #{memberId}, #{now})
        ON DUPLICATE KEY UPDATE id = id
    </insert>
    <delete id="delete">
        DELETE FROM board_pin WHERE board_id = #{boardId} AND post_id = #{postId}
    </delete>
</mapper>
```

</details>

<details>
<summary>MyBatis / JPA 배치 조회 — 작성자를 한 번에</summary>

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

    // MyBatis 고정 목록 대안: Mapper가 고른 id의 글·작성자를 한 번에 가져온다.
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.id IN :ids")
    List<Post> findPinnedPostsWithAuthor(@Param("ids") Collection<Long> ids);

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
<summary>MyBatis / Service — 권한·한도·목록 정책</summary>

`src/main/java/org/example/pin/PinService.java`

```java
package org.example.pin;

import org.example.admin.AdminOnlyException;
import org.example.auth.AuthenticatedMember;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// MyBatis 대안: 고정 행은 Mapper가 관리하고 글·작성자는 JPA로 한 번에 읽어 기존 접근 정책을 적용한다.
@Service
public class PinService {
    static final int MAX_PINS = 3;
    private static final String ADMIN_ROLE = "ADMIN";

    private final PinMapper pinMapper;
    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public PinService(PinMapper pinMapper, BoardRepository boardRepository,
                      PostRepository postRepository, PostAccessPolicy accessPolicy, Clock clock) {
        this.pinMapper = pinMapper;
        this.boardRepository = boardRepository;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public List<PinnedPostResponse> pin(String slug, Long postId, AuthenticatedMember me) {
        requireAdmin(me);
        Board board = findBoard(slug);
        Post post = postRepository.findById(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getBoard().getId().equals(board.getId())) {
            throw new InvalidPinException("postId", "이 게시판의 글이 아닙니다.");
        }
        if (!"PUBLISHED".equals(post.getStatus()) || !"PUBLIC".equals(post.getVisibility())) {
            throw new InvalidPinException("postId", "게시된 전체 공개 글만 고정할 수 있습니다.");
        }
        if (!pinMapper.existsByPostId(postId)) {
            if (pinMapper.countByBoardId(board.getId()) >= MAX_PINS) {
                throw new InvalidPinException(null, "게시판마다 " + MAX_PINS + "개까지 고정할 수 있습니다.");
            }
            pinMapper.insert(board.getId(), postId, me.id(), LocalDateTime.now(clock));
        }
        return list(board, me);
    }

    @Transactional
    public void unpin(String slug, Long postId, AuthenticatedMember me) {
        requireAdmin(me);
        Board board = findBoard(slug);
        pinMapper.delete(board.getId(), postId);
    }

    @Transactional(readOnly = true)
    public List<PinnedPostResponse> list(String slug, AuthenticatedMember viewer) {
        return list(findBoard(slug), viewer);
    }

    private List<PinnedPostResponse> list(Board board, AuthenticatedMember viewer) {
        List<PinRow> pins = pinMapper.findByBoardInOrder(board.getId());
        if (pins.isEmpty()) {
            return List.of();
        }
        Map<Long, Post> posts = postRepository.findPinnedPostsWithAuthor(
                pins.stream().map(PinRow::postId).toList()).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        return pins.stream()
                .filter(pin -> posts.containsKey(pin.postId()))
                .filter(pin -> "PUBLISHED".equals(posts.get(pin.postId()).getStatus())
                        && "PUBLIC".equals(posts.get(pin.postId()).getVisibility()))
                .filter(pin -> viewable.test(posts.get(pin.postId())))
                .map(pin -> {
                    Post post = posts.get(pin.postId());
                    return new PinnedPostResponse(post.getId(), post.getTitle(),
                            new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                            pin.pinnedAt());
                })
                .toList();
    }

    private Board findBoard(String slug) {
        return boardRepository.findBySlug(slug).orElseThrow(() -> new BoardNotFoundException(slug));
    }

    private void requireAdmin(AuthenticatedMember me) {
        if (!ADMIN_ROLE.equals(me.role())) {
            throw new AdminOnlyException();
        }
    }
}
```

</details>

## 직접 확인

자유 게시판(`free`)에서 운영자가 14·12·9번을 차례로 고정한다. 9번은 한차단의 글이라 김자바에게는 안 보인다. 먼저 9번 글을 공개 상태로 복구하고 기존 고정을 풀어 반복 실행할 수 있게 한다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

동시 첫 고정도 확인한다. 12번 글을 해제한 상태에서 같은 글을 두 요청이 동시에 고정해도 두 응답이 모두 `200`이고 DB 행은 하나여야 한다. 한도 검사는 동시의 **서로 다른 글**까지 3개로 묶는 잠금이 아니므로 그 경쟁은 이 단계의 범위 밖이다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "N0e",
      "title": "반복 실행 준비: 9번 글 공개 복구",
      "method": "PATCH",
      "path": "/api/admin/posts/9/status",
      "headers": {
        "Authorization": "Bearer tok-admin"
      },
      "body": {
        "status": "PUBLISHED"
      }
    },
    {
      "id": "N0a",
      "title": "처음 상태로(고정 해제 14)",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/14",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N0b",
      "title": "처음 상태로(고정 해제 12)",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/12",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N0c",
      "title": "처음 상태로(고정 해제 9)",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/9",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N0d",
      "title": "처음 상태로(고정 해제 15)",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/15",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N1",
      "title": "다른 게시판의 글(2번, dev)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/2",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2",
      "title": "팔로워 공개 글(6번)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/6",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2b",
      "title": "임시저장 글(7번)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/7",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2c",
      "title": "숨김 글(10번)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/10",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2d",
      "title": "삭제된 글(8번)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/8",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2e",
      "title": "없는 글",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/999999",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2f",
      "title": "글 id 자리에 문자",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/abc",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N2g",
      "title": "없는 게시판",
      "method": "PUT",
      "path": "/api/boards/nope/pinned-posts/14",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N3",
      "title": "운영자가 아님(김자바)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/14",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "N3b",
      "title": "토큰 없이",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/14"
    },
    {
      "id": "N4",
      "title": "14번 고정",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/14",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N5",
      "title": "12번 고정",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/12",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N6",
      "title": "9번 고정(셋째 — 한도 안쪽)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/9",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N7",
      "title": "15번 고정(넷째 — 한도 밖)",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/15",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N8",
      "title": "14번 또 고정",
      "method": "PUT",
      "path": "/api/boards/free/pinned-posts/14",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N9",
      "title": "고정 글 목록(비로그인)",
      "method": "GET",
      "path": "/api/boards/free/pinned-posts"
    },
    {
      "id": "N10",
      "title": "고정 글 목록(김자바 — 9번 작성자가 김자바를 차단)",
      "method": "GET",
      "path": "/api/boards/free/pinned-posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "N11",
      "title": "12번 고정 해제",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/12",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N11b",
      "title": "고정 안 된 글 해제(15번)",
      "method": "DELETE",
      "path": "/api/boards/free/pinned-posts/15",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N12",
      "title": "해제 뒤 목록",
      "method": "GET",
      "path": "/api/boards/free/pinned-posts"
    },
    {
      "id": "N13",
      "title": "고정한 뒤 9번 글 숨김",
      "method": "PATCH",
      "path": "/api/admin/posts/9/status",
      "headers": {
        "Authorization": "Bearer tok-admin"
      },
      "body": {
        "status": "HIDDEN"
      }
    },
    {
      "id": "N14",
      "title": "운영자에게도 숨김 글은 고정 목록에서 제외",
      "method": "GET",
      "path": "/api/boards/free/pinned-posts",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "N15",
      "title": "9번 글 다시 공개",
      "method": "PATCH",
      "path": "/api/admin/posts/9/status",
      "headers": {
        "Authorization": "Bearer tok-admin"
      },
      "body": {
        "status": "PUBLISHED"
      }
    },
    {
      "id": "N16",
      "title": "복구 후 고정 목록에 다시 표시",
      "method": "GET",
      "path": "/api/boards/free/pinned-posts",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "N1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              }
            ]
          }
        },
        {
          "request": "N2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              }
            ]
          }
        },
        {
          "request": "N2b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              }
            ]
          }
        },
        {
          "request": "N2c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              }
            ]
          }
        }
      ],
      "note": "다른 게시판의 글·팔로워 공개·임시저장·숨김 글은 고정할 수 없다(400, errors에 postId)"
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "N2d",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "N2e",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "N2f",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "N2g",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "N3",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "N3b",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "N4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "equals": [
                  14
                ]
              }
            ]
          }
        },
        {
          "request": "N5",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "equals": [
                  14,
                  12
                ]
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
                "path": "$[*].id",
                "equals": [
                  14,
                  12,
                  9
                ]
              }
            ]
          }
        }
      ],
      "note": "먼저 고정한 글이 위 — 셋째(한도 안쪽)까지는 성공"
    },
    {
      "id": "C5",
      "request": "N7",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C6",
      "request": "N8",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              14,
              12,
              9
            ]
          }
        ]
      },
      "note": "이미 고정된 글을 또 고정해도 순서·개수가 그대로(멱등)"
    },
    {
      "id": "C7",
      "request": "N9",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              14,
              12,
              9
            ]
          },
          {
            "path": "$[0].title",
            "equals": "자유글 03"
          },
          {
            "path": "$[0].author.nickname",
            "equals": "이스프링"
          }
        ]
      }
    },
    {
      "id": "C8",
      "request": "N10",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              14,
              12
            ]
          }
        ]
      },
      "note": "고정 글도 보는 사람 기준 2-3 규칙을 따른다 — 나를 차단한 회원의 글은 빠진다"
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "N11",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "N11b",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "N12",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "equals": [
                  14,
                  9
                ]
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
          "request": "N13",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "N14",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "equals": [
                  14
                ]
              }
            ]
          }
        },
        {
          "request": "N15",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "N16",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "equals": [
                  14,
                  9
                ]
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
| C1 | N1 / N2 / N2b / N2c | 모두 `400`, `errors`에 `postId` — 다른 게시판의 글·팔로워 공개·임시저장·숨김 |
| C2 | N2d / N2e / N2f / N2g | `404`(삭제된 글) / `404`(없는 글) / `400`(id 자리에 문자) / `404`(없는 게시판) — 500이 아니다 |
| C3 | N3 / N3b | `403` / `401` |
| C4 | N4 / N5 / N6 | `200`, 목록 id `[14]` → `[14, 12]` → `[14, 12, 9]` — 셋째(한도 안쪽)까지 성공 |
| C5 | N7 | `400` — 넷째는 안 된다 |
| C6 | N8 | `200`, `[14, 12, 9]` 그대로 — 이미 고정된 글을 또 고정해도 바뀌지 않는다 |
| C7 | N9 | `200`, `[14, 12, 9]`, 첫 항목 제목 `자유글 03`·작성자 `이스프링` |
| C8 | N10 | `200`, `[14, 12]` — 나를 차단한 회원의 글(9번)은 김자바의 고정 목록에서 빠진다 |
| C9 | N11 / N11b / N12 | `204` / `204`(고정 안 된 글 해제도 성공) / `[14, 9]` |
| C10 | N13~N16 | 고정한 9번 글을 숨긴 동안 운영자 목록도 `14`만, 복구하면 `14,9`로 돌아온다 |
| C11 | 동시 같은 글 PUT | 12번 글 고정 해제 뒤 같은 12번 글 PUT 2건을 동시에 보내면 둘 다 `200`, `board_pin` 행은 1개(아래 동시성 확인) |
| D1 | `SELECT post_id FROM board_pin WHERE board_id = 4 ORDER BY created_at, id` | `14, 9` |
| D2 | `SELECT COUNT(*) FROM board_pin WHERE post_id IN (2, 6, 7, 8, 10, 15)` | `0` — 실패한 요청은 아무것도 만들지 않았다 |
| R1 | 같은 규칙을 두 번 | 목록은 2-3의 `PostAccessPolicy`를 다시 써서 거른다. 고정할 때 확인했어도, 그 뒤에 글이 숨겨지거나 지워질 수 있다 |
| R2 | 순서 | `ORDER BY created_at, id`처럼 동점까지 정한다. `created_at`만 쓰면 같은 시각에 고정한 두 글의 순서가 요청마다 바뀔 수 있다 |
| R3 | 한도 | "세고 나서 넣는다"의 한계(운영자 둘이 동시에 넣으면 4개)를 설명할 수 있다 — 6-2 R2와 같다 |
| R4 | N+1 | 고정 글 목록이 글·작성자를 fetch join으로 한 번에 읽는다(고정 글 수만큼 쿼리를 보내지 않는다) |

## 필요한 지식

- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 고정 목록에도 같은 규칙
- [W10 — 각 층에서 확인할 것](../../docs/knowledge/W10-where-to-validate.md#각-층에서-확인할-것) — 경로 값 검사·서비스 규칙·DB 제약
- [W15 — 페이징과 정렬](../../docs/knowledge/W15-paging-offset-vs-cursor.md) — 정렬에 동점 기준이 필요한 이유
- [S09 — JPA와 Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — fetch join

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 확인 순서</summary>

운영자인가(403) → 게시판이 있나(404) → 글이 있고 지워지지 않았나(404) → 이 게시판의 글인가(400) → `PUBLISHED`·`PUBLIC`인가(400) → 이미 고정됐나(그렇다면 저장 없이 목록 반환) → 3개 미만인가(400) → 저장. "이미 고정됐나"를 한도보다 먼저 봐야 3개가 꽉 찬 상태에서 같은 글을 또 고정해도 200이다.
</details>

<details>
<summary>힌트 2 — 보는 사람 기준으로 거르기</summary>

6-3에서 만든 `PostAccessPolicy.viewableBy(viewer)`는 팔로우·차단 정보를 한 번에 읽어 두고 `Predicate<Post>`를 돌려준다. 고정 글 목록(많아야 3개)을 읽은 뒤 `stream().filter(viewable)`로 거르면 된다.
</details>

## 다음 단계

[14-4. 시리즈(연재)](14-4-series.md)
