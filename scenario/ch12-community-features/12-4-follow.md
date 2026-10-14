# 12-4. 팔로우·언팔로우

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "프로필에 [팔로우] 버튼을 달아 주세요. 누르면 버튼이 [팔로잉]으로 바뀌고 팔로워 숫자가 하나 늘어야 해요. 그런데 버튼을 여러 번 빠르게 누르는 분이 있어서, 숫자가 이상하게 나오거나 오류가 나면 안 돼요. 자기 자신을 팔로우하는 것도 막아 주세요."

`follow` 테이블은 처음부터 있었다. 2-3(팔로워 공개 글)·8-3(맞팔·추천)에서 **읽기만** 했다. 이번에는 관계를 만들고 끊는 API다. 4-1 좋아요와 생김새가 같다 — PUT·DELETE로 "그 상태로 맞추기"(멱등). 다른 점이 두 가지 있다.

- 상대가 **회원**이다. 없는 회원·탈퇴한 회원은 `404`. 둘 사이에 차단이 있으면(어느 쪽이 했든) 팔로우할 수 없다. 언팔로우는 차단 관계여도 된다(끊는 쪽이니까).
- 응답에 그 회원의 **팔로워 수**를 준다. 따로 세어 둔 숫자 컬럼이 없어서 매번 `COUNT`한다. 그런데 같은 요청이 동시에 오면, MySQL 기본 격리 수준(REPEATABLE READ)에서는 "팔로잉인데 숫자에 나는 빠진" 응답이 나온다. 이 단계의 함정이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "프로필 — 밤샘개발자",
  "summary": "[팔로우]는 PUT, [팔로잉]을 다시 누르면 DELETE. 몇 번을 눌러도 같은 상태·같은 숫자.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "밤샘개발자", "right": "코딩하는고양이" },
    { "type": "stats", "id": "counts", "items": [{ "id": "followers", "label": "팔로워", "value": "4" }, { "id": "posts", "label": "글", "value": "2" }] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "follow", "label": "팔로잉", "variant": "secondary" }] },
    { "type": "toast", "id": "toast-blocked", "value": "차단 관계인 회원은 팔로우할 수 없습니다.", "tone": "error" }
  ],
  "flows": [
    {
      "name": "팔로우(연타)",
      "steps": [
        { "kind": "user", "text": "[팔로우]를 빠르게 세 번 누른다", "focus": ["follow"] },
        { "kind": "request", "method": "PUT", "path": "/api/members/6/follow", "headers": ["Authorization: Bearer tok-p02"] },
        { "kind": "server", "text": "자기 자신인가(400) → 있는·탈퇴 안 한 회원인가(404) → 차단 관계인가(403) → INSERT IGNORE → 팔로워 수 COUNT" },
        { "kind": "db", "sql": "INSERT IGNORE INTO follow (follower_id, followee_id, created_at) VALUES (2, 6, ...); SELECT COUNT(*) FROM follow WHERE followee_id = 6", "note": "이미 있으면 0행 — uk_follow 중복 오류(500)가 나지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"memberId\": 6, \"following\": true, \"followerCount\": 4}" },
        { "kind": "screen", "text": "버튼이 [팔로잉], 팔로워 4 — 세 번 눌러도 세 응답이 모두 같다", "focus": ["follow", "followers"] }
      ]
    },
    {
      "name": "나를 차단한 회원",
      "steps": [
        { "kind": "user", "text": "회원 7(나를 차단함)의 프로필에서 [팔로우]", "focus": ["follow"] },
        { "kind": "request", "method": "PUT", "path": "/api/members/7/follow", "headers": ["Authorization: Bearer tok-p02"] },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"차단 관계인 회원은 팔로우할 수 없습니다.\"}" },
        { "kind": "screen", "text": "오류 토스트", "focus": ["toast-blocked"] }
      ]
    }
  ]
}
```

## 만들 것

**API** — 토큰 필요(PUT·DELETE라 없으면 인터셉터가 `401`). 본문 없음.

| 메서드·경로 | 응답 `200` |
|---|---|
| `PUT /api/members/{id}/follow` | `{ "memberId": 6, "following": true, "followerCount": 4 }` — 이미 팔로우 중이어도 같은 응답 |
| `DELETE /api/members/{id}/follow` | `{ "memberId": 6, "following": false, "followerCount": 3 }` — 원래 안 하고 있었어도 같은 응답 |

`followerCount`는 `{id}` 회원의 팔로워 수다(요청 처리 뒤 기준, `COUNT`).

**입력 규칙** — 바꾸는 값은 경로의 `{id}` 하나다

| 값 | 필수 | 형식 | 틀렸을 때 |
|---|---|---|---|
| `{id}` | 필수 | 숫자 | 숫자가 아니면 `400` |
| `{id}` = 나 | — | — | `400` "자기 자신은 팔로우할 수 없습니다." (DELETE도 `400`) |
| 없는 회원(0·음수·없는 번호), 탈퇴(`WITHDRAWN`) 회원 | — | — | `404` |
| 둘 사이에 차단(어느 쪽이든) | — | — | PUT `403`. DELETE는 `200`(끊는 건 막지 않는다) |

**같은 요청이 동시에 와도**

| 기대 | 이유 |
|---|---|
| 모두 `200`(중복 키 `500` 없음) | 4-2처럼 `INSERT IGNORE`(또는 중복 예외를 잡아 성공 처리) |
| 모든 응답의 `followerCount`가 같다 | REPEATABLE READ에서는 트랜잭션의 첫 읽기(회원 조회) 때 스냅샷이 고정된다. 늦게 온 요청은 먼저 온 요청의 커밋을 기다려 `INSERT IGNORE`가 0행이 되지만, 이어지는 `COUNT`는 옛 스냅샷을 읽어 하나 적게 센다. 이 메서드만 `READ_COMMITTED`로 두면 문장마다 새 스냅샷을 읽는다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 자기 자신인가(400) → 있는·탈퇴 안 한 회원인가(404) → 차단 관계인가(403) → INSERT IGNORE → 팔로워 수 COUNT
- 이미 있으면 0행 — uk_follow 중복 오류(500)가 나지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`FollowController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PutMapping("/api/members/{id}/follow")`, `@DeleteMapping("/api/members/{id}/follow")`. 변경된 메서드: `follow`, `unfollow`.

**FollowController.java**

```java
package org.example.social;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

// 12-4 — PUT·DELETE라 토큰 없음은 인터셉터가 401로 막는다
@RestController
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PutMapping("/api/members/{id}/follow")
    public FollowResponse follow(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        return followService.follow(me, id);
    }

    @DeleteMapping("/api/members/{id}/follow")
    public FollowResponse unfollow(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        return followService.unfollow(me, id);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`FollowResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

**FollowResponse.java**

```java
package org.example.social;

// 12-4: 요청 뒤의 상태 — 이미 그 상태여도 같은 모양(멱등). followerCount는 그 회원의 팔로워 수(COUNT)
public record FollowResponse(Long memberId, boolean following, long followerCount) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`FollowService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `follow`, `unfollow`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

**FollowService.java**

```java
package org.example.social;

import org.example.auth.AuthenticatedMember;
import org.example.member.Member;
import org.example.member.MemberNotFoundException;
import org.example.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

// 12-4 팔로우·언팔로우 — PUT/DELETE 모두 멱등(현재 상태로 맞추고 그 상태를 돌려준다)
@Service
public class FollowService {

    private static final String WITHDRAWN = "WITHDRAWN";

    private final FollowRepository followRepository;
    private final MemberRepository memberRepository;
    private final BlockPolicy blockPolicy;
    private final Clock clock;

    public FollowService(FollowRepository followRepository, MemberRepository memberRepository,
                         BlockPolicy blockPolicy, Clock clock) {
        this.followRepository = followRepository;
        this.memberRepository = memberRepository;
        this.blockPolicy = blockPolicy;
        this.clock = clock;
    }

    // 확인 순서: 자기 자신(400) → 없는·탈퇴 회원(404) → 차단 관계(403) → INSERT IGNORE
    // READ_COMMITTED: 같은 요청이 동시에 오면 늦은 쪽의 INSERT IGNORE는 먼저 온 쪽의 커밋을 기다린 뒤 0행으로 끝난다.
    // MySQL 기본(REPEATABLE READ)이면 마지막 COUNT가 트랜잭션 처음(회원 조회 시점)의 스냅샷을 읽어서
    // "following: true인데 팔로워 수에 나는 없음"이 된다(실측: 동시 6건 중 5건이 n). 문장마다 새 스냅샷을 보게 한다.
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public FollowResponse follow(AuthenticatedMember me, Long targetId) {
        Member target = findTarget(me, targetId);
        if (blockPolicy.isBlockedEitherWay(me.id(), target.getId())) {
            throw new FollowBlockedException();
        }
        followRepository.insertIgnore(me.id(), target.getId(), LocalDateTime.now(clock));
        return new FollowResponse(target.getId(), true, followRepository.countByFollowee_Id(target.getId()));
    }

    // 언팔로우는 차단 관계여도 된다(관계를 끊는 쪽이라 막을 이유가 없다). 없던 관계면 0행 — 그래도 200
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public FollowResponse unfollow(AuthenticatedMember me, Long targetId) {
        Member target = findTarget(me, targetId);
        followRepository.deleteRelation(me.id(), target.getId());
        return new FollowResponse(target.getId(), false, followRepository.countByFollowee_Id(target.getId()));
    }

    private Member findTarget(AuthenticatedMember me, Long targetId) {
        if (me.id().equals(targetId)) {
            throw new SelfFollowNotAllowedException();
        }
        return memberRepository.findById(targetId)
                .filter(m -> !WITHDRAWN.equals(m.getMemberStatus()) && m.getDeletedAt() == null)
                .orElseThrow(MemberNotFoundException::new);
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`FollowRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

**FollowRepository.java**

```java
package org.example.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollower_IdAndFollowee_Id(Long followerId, Long followeeId);

    // 6-3: 여러 글을 한꺼번에 판정할 때 — 내가 팔로우하는 회원 id를 한 번에
    @Query("SELECT f.followee.id FROM Follow f WHERE f.follower.id = :memberId")
    List<Long> findFolloweeIds(@Param("memberId") Long memberId);

    // 12-4: 이미 있으면 아무것도 안 한다(0행) — 동시에 두 번 와도 uk_follow 중복 오류(500)가 나지 않는다(4-2와 같은 방법)
    @Modifying
    @Query(value = "INSERT IGNORE INTO follow (follower_id, followee_id, created_at) VALUES (:followerId, :followeeId, :now)",
            nativeQuery = true)
    int insertIgnore(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId,
                     @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM Follow f WHERE f.follower.id = :followerId AND f.followee.id = :followeeId")
    int deleteRelation(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    long countByFollowee_Id(Long followeeId);
}
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `MemberNotFoundException.java`, `FollowBlockedException.java`, `SelfFollowNotAllowedException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleMemberNotFound`, `handleSelfFollow`, `handleFollowBlocked`.

**ApiExceptionHandler.java**

```java
package org.example.common;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.core.JacksonException;
import org.example.admin.AdminOnlyException;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.MemberNotActiveException;
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
import org.example.social.FollowBlockedException;
import org.example.social.SelfFollowNotAllowedException;
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

    @ExceptionHandler(FollowBlockedException.class)
    public ProblemDetail handleFollowBlocked(FollowBlockedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
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

    // 누구인지는 알지만(토큰은 유효) 회원 상태 때문에 안 됨
    @ExceptionHandler(MemberNotActiveException.class)
    public ProblemDetail handleMemberNotActive(MemberNotActiveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
```

**MemberNotFoundException.java**

```java
package org.example.member;

// 없는 회원·탈퇴한 회원 — 전역 핸들러가 404로 변환한다
public class MemberNotFoundException extends RuntimeException {

    public MemberNotFoundException() {
        super("회원을 찾을 수 없습니다.");
    }
}
```

**FollowBlockedException.java**

```java
package org.example.social;

// 둘 사이에 차단이 있으면(어느 쪽이 했든) 팔로우할 수 없다 — 전역 핸들러가 403으로 변환한다
public class FollowBlockedException extends RuntimeException {

    public FollowBlockedException() {
        super("차단 관계인 회원은 팔로우할 수 없습니다.");
    }
}
```

**SelfFollowNotAllowedException.java**

```java
package org.example.social;

// 자기 자신 팔로우 — 전역 핸들러가 400으로 변환한다
public class SelfFollowNotAllowedException extends RuntimeException {

    public SelfFollowNotAllowedException() {
        super("자기 자신은 팔로우할 수 없습니다.");
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — INSERT IGNORE·DELETE·COUNT</summary>

정답의 **MyBatis 대체 구현 코드**에서 FollowCommandMapper.java·XML과 수정된 FollowService.java 전문을 펼칠 수 있다. JPA 버전과 같은 READ_COMMITTED 트랜잭션에서 중복 삽입은 무시하고 관계 삭제 뒤 팔로워 수를 센다.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.social.FollowCommandMapper">
    <insert id="insertIgnore">
        INSERT IGNORE INTO follow (follower_id, followee_id, created_at)
        VALUES (#{followerId}, #{followeeId}, #{now})
    </insert>

    <delete id="deleteRelation">
        DELETE FROM follow
        WHERE follower_id = #{followerId} AND followee_id = #{followeeId}
    </delete>

    <select id="countFollowers" resultType="long">
        SELECT COUNT(*) FROM follow WHERE followee_id = #{followeeId}
    </select>
</mapper>
```

</details>

## 직접 확인

회원 2(`tok-p02`)가 회원 6을 팔로우한다(처음에는 안 하고 있다). 회원 7은 회원 2를 차단했고, 회원 29는 탈퇴했다.

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p02'

curl -s -X DELETE "$BASE/api/members/6/follow" -H "$A"; echo     # F0 처음 상태로 — followerCount n
curl -s -X PUT "$BASE/api/members/6/follow" -H "$A"; echo        # F1 → true, n+1
curl -s -X PUT "$BASE/api/members/6/follow" -H "$A"; echo        # F2 → 그대로
for i in 1 2 3 4 5; do curl -s -X PUT "$BASE/api/members/6/follow" -H "$A" & done; wait; echo   # FC 동시 5번 — 다섯 응답이 같아야 한다
curl -s -X DELETE "$BASE/api/members/6/follow" -H "$A"; echo     # F3 → false, n
curl -s -X DELETE "$BASE/api/members/6/follow" -H "$A"; echo     # F4 → 그대로
for p in 2 7 29 99999999 0 abc; do curl -s -o /dev/null -w "PUT $p → %{http_code}\n" -X PUT "$BASE/api/members/$p/follow" -H "$A"; done   # 400 403 404 404 404 400
curl -s -o /dev/null -w "DELETE 7 → %{http_code}\n" -X DELETE "$BASE/api/members/7/follow" -H "$A"   # 200
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끝에서 언팔로우하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "F0", "title": "처음 상태로(언팔로우)", "method": "DELETE", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "F1", "title": "팔로우", "method": "PUT", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "F2", "title": "또 팔로우", "method": "PUT", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FC", "title": "동시에 5번 팔로우", "method": "PUT", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" }, "concurrent": { "count": 5 } },
    { "id": "F3", "title": "언팔로우", "method": "DELETE", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "F4", "title": "또 언팔로우", "method": "DELETE", "path": "/api/members/6/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FS", "title": "자기 자신", "method": "PUT", "path": "/api/members/2/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FB", "title": "나를 차단한 회원(7)", "method": "PUT", "path": "/api/members/7/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "UB", "title": "차단 관계 언팔로우", "method": "DELETE", "path": "/api/members/7/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FW", "title": "탈퇴한 회원(29)", "method": "PUT", "path": "/api/members/29/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FN", "title": "없는 회원", "method": "PUT", "path": "/api/members/99999999/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FZ", "title": "id가 0", "method": "PUT", "path": "/api/members/0/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "FX", "title": "id가 숫자 아님", "method": "PUT", "path": "/api/members/abc/follow", "headers": { "Authorization": "Bearer tok-p02" } },
    { "id": "NT", "title": "토큰 없음", "method": "PUT", "path": "/api/members/6/follow" }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "F0", "expect": { "status": 200, "json": [{ "path": "$.memberId", "equals": 6 }, { "path": "$.following", "equals": false }, { "path": "$.followerCount", "type": "number" }] } },
        { "request": "F1", "expect": { "status": 200, "json": [{ "path": "$.following", "equals": true }, { "path": "$.followerCount", "equals": "{{F0.body.followerCount + 1}}" }] } },
        { "request": "F2", "expect": { "status": 200, "json": [{ "path": "$.following", "equals": true }, { "path": "$.followerCount", "equals": "{{F0.body.followerCount + 1}}" }] } }
      ]
    },
    {
      "id": "C2",
      "request": "FC",
      "expect": { "status": 200, "json": [{ "path": "$.following", "equals": true }, { "path": "$.followerCount", "equals": "{{F0.body.followerCount + 1}}" }], "distinct": { "path": "$.followerCount", "count": 1 } }
    },
    {
      "id": "C3",
      "all": [
        { "request": "F3", "expect": { "status": 200, "json": [{ "path": "$.following", "equals": false }, { "path": "$.followerCount", "equals": "{{F0.body.followerCount}}" }] } },
        { "request": "F4", "expect": { "status": 200, "json": [{ "path": "$.following", "equals": false }, { "path": "$.followerCount", "equals": "{{F0.body.followerCount}}" }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "FS", "expect": { "status": 400 } },
        { "request": "FB", "expect": { "status": 403 } },
        { "request": "UB", "expect": { "status": 200, "json": [{ "path": "$.following", "equals": false }] } }
      ]
    },
    {
      "id": "C5",
      "all": [
        { "request": "FW", "expect": { "status": 404 } },
        { "request": "FN", "expect": { "status": 404 } },
        { "request": "FZ", "expect": { "status": 404 } },
        { "request": "FX", "expect": { "status": 400 } },
        { "request": "NT", "expect": { "status": 401 } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). n은 F0 응답의 `followerCount`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F0 / F1 / F2 | `following`=false, n / true, n+1 / 또 눌러도 true, n+1 |
| C2 | FC | 동시에 5번 — 모두 `200`, 모두 `following`=true·`followerCount`=n+1(다섯 응답의 숫자가 하나로 같다) |
| C3 | F3 / F4 | false, n / 또 눌러도 false, n |
| C4 | FS / FB / UB | 자기 자신 `400` / 나를 차단한 회원 `403` / 차단 관계여도 언팔로우는 `200` |
| C5 | FW·FN·FZ / FX / NT | 탈퇴·없는 회원·0번 `404` / 숫자 아닌 id `400`(`500` 아님) / 토큰 없음 `401` |
| D1 | `SELECT COUNT(*) FROM follow WHERE follower_id = 2 AND followee_id = 6` | `0` — 끝에서 언팔로우했다(동시 요청이 행을 여러 개 만들지 않았다는 것은 `uk_follow`가 보장) |
| D2 | `SELECT COUNT(*) FROM follow WHERE follower_id = followee_id` | `0` |
| R1 | 멱등 | PUT·DELETE가 "그 상태로 맞추기"다. 이미 있는데 INSERT를 시도해 `500`(중복 키)이 나지 않는다(4-1·4-2와 같은 방법) |
| R2 | 확인 순서 | 자기 자신(400) → 회원 존재·탈퇴(404) → 차단(403) 순서이고, 차단은 2-3의 `BlockPolicy`를 그대로 쓴다 |
| R3 | 스냅샷 | REPEATABLE READ에서 C2가 왜 깨지는지(첫 읽기에서 고정된 스냅샷 vs `INSERT IGNORE`의 현재 읽기) 설명할 수 있고, `READ_COMMITTED`·잠금 읽기·응답에서 숫자를 빼기 중 무엇을 골랐는지 이유를 말한다 |
| R4 | 숫자 컬럼 | 팔로워 수를 `member`에 비정규화 컬럼으로 두지 않고 `COUNT`했다. 팔로워가 수만 명이 되면 무엇이 느려지고, 그때 4-2처럼 숫자 컬럼을 두면 8-5처럼 어긋남을 맞추는 배치가 필요해진다는 것을 안다 |

## 필요한 지식

- [P18 — 중복 요청은 동시성 락이 해결하지 않는다](../../docs/knowledge/P18-concurrency-inventory.md#27-중복-요청은-동시성-락이-해결하지-않는다)
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 격리 수준과 `@Transactional(isolation = …)`
- [H1 동시성 맛보기](../../lessons/H1-concurrency-taste.md)
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PUT·DELETE가 멱등인 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 흐름</summary>

`FollowRepository`에 `@Modifying @Query(nativeQuery = true)`로 `INSERT IGNORE INTO follow (follower_id, followee_id, created_at) VALUES (…)`와 JPQL `DELETE FROM Follow f WHERE f.follower.id = :a AND f.followee.id = :b`, 그리고 `countByFollowee_Id`. 서비스: 자기 자신 확인 → `memberRepository.findById` + 탈퇴 걸러 404 → `blockPolicy.isBlockedEitherWay` → 넣기/지우기 → `COUNT`. </details>

<details>
<summary>힌트 2 — 동시 요청의 숫자가 다르다</summary>

동시 5번 중 하나만 n+1이고 나머지가 n이면 스냅샷 문제다. 서비스 메서드를 `@Transactional(isolation = Isolation.READ_COMMITTED)`로 바꾸면 `COUNT`가 그 시점에 커밋된 행을 본다. 늦은 요청의 `INSERT IGNORE`는 먼저 온 요청의 커밋을 기다린 뒤 0행으로 끝나므로, 그 뒤의 `COUNT`에는 먼저 온 요청의 행이 보인다.
</details>

## 다음 단계

[12-5. 팔로잉 피드 — 뮤트](12-5-feed-mute.md)
