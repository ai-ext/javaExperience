# 14-8. 폴더 공유 링크 — 읽기 전용

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "북마크 폴더를 친구한테 링크로 보내고 싶대요. 링크를 받은 사람은 로그인 안 해도 그 폴더의 글 목록을 볼 수 있어야 해요. 읽기만 되고요. 링크가 퍼졌으면 다시 만들어서 옛 링크를 막거나 공유를 끌 수 있어야 해요. 원하면 며칠 뒤에 저절로 막히게도요."

6장 북마크 폴더를 **"내 것"(`/api/me/**`, 토큰 필요)에서 꺼내 "링크를 가진 누구나"에게 여는** 일이다. 보안에서 정할 것이 세 가지다.

1. **링크를 추측할 수 없어야 한다.** `/api/shared/folders/13`처럼 폴더 id를 쓰면 14·15를 차례로 열어 남의 폴더를 다 본다(IDOR). 링크에는 **추측할 수 없는 무작위 토큰**(`SecureRandom` 32바이트)을 쓰고, 그 토큰이 곧 열쇠다.
2. **무엇을 보여 주나는 링크를 연 사람 기준이다.** 폴더 주인 기준으로 거르면, 주인만 볼 수 있는 팔로워 공개 글이 링크를 받은 사람에게 새어 나간다. 링크로 열 때도 2-3 규칙을 **여는 사람**에게 건다.
3. **주인의 메모(`note`)는 내보내지 않는다.** 북마크 메모는 개인 기록이다. 공유 응답에는 글 목록만 담는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "북마크 폴더 공유",
  "summary": "폴더 주인이 링크를 만들면, 받은 사람은 로그인 없이 글 목록을 본다. 다시 만들거나 끄면 옛 링크는 막힌다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "[채점] 공유 폴더", "right": "김자바" },
    { "type": "field", "id": "expires", "label": "며칠 뒤 막을까요? (비우면 계속)", "value": "7" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "share", "label": "링크 만들기", "variant": "primary" }, { "id": "unshare", "label": "공유 끄기", "variant": "danger" }] },
    { "type": "text", "id": "link", "value": "https://…/shared/folders/2e6OCfa75XCdM7H2tlUS8eI4Rwp39-Ax2ZPQEhpgNDI", "emphasis": "caption" },
    {
      "type": "list",
      "id": "shared",
      "label": "링크로 연 화면(비로그인)",
      "items": [{ "id": "s12", "title": "자유글 01", "meta": "이스프링" }],
      "footer": "김자바의 폴더 · 읽기 전용"
    }
  ],
  "flows": [
    {
      "name": "링크 만들기",
      "steps": [
        { "kind": "user", "text": "7일 뒤 막히는 링크를 만든다", "focus": ["expires", "share"] },
        { "kind": "request", "method": "POST", "path": "/api/me/bookmark-folders/13/share", "headers": ["Content-Type: application/json", "Authorization: Bearer tok-kimjava"], "body": "{\"expiresInDays\": 7}" },
        { "kind": "server", "text": "내 폴더인가(남의 것·없는 것은 404) → SecureRandom 32바이트를 URL용 Base64로(43자) → 새 토큰으로 바꾼다(옛 링크는 이 순간 죽는다)" },
        { "kind": "db", "sql": "UPDATE bookmark_folder SET share_token = ?, share_expires_at = ?, updated_at = ? WHERE id = 13" },
        {
          "kind": "response",
          "status": 201,
          "headers": ["Location: /api/shared/folders/2e6OCfa75XCdM7H2tlUS8eI4Rwp39-Ax2ZPQEhpgNDI", "Content-Type: application/json"],
          "body": "{\"folderId\": 13, \"shareToken\": \"2e6OCfa75XCdM7H2tlUS8eI4Rwp39-Ax2ZPQEhpgNDI\", \"url\": \"/api/shared/folders/2e6OCfa75XCdM7H2tlUS8eI4Rwp39-Ax2ZPQEhpgNDI\", \"expiresAt\": \"2026-10-17T15:45:01\"}"
        },
        { "kind": "screen", "text": "복사할 링크가 보인다", "focus": ["link"] }
      ]
    },
    {
      "name": "받은 사람이 링크 열기",
      "steps": [
        { "kind": "user", "text": "로그인하지 않은 친구가 링크를 연다" },
        { "kind": "request", "method": "GET", "path": "/api/shared/folders/2e6OCfa75XCdM7H2tlUS8eI4Rwp39-Ax2ZPQEhpgNDI" },
        { "kind": "db", "sql": "SELECT f.*, m.* FROM bookmark_folder f JOIN member m ON m.id = f.member_id WHERE f.share_token = ?", "note": "UNIQUE 인덱스로 한 줄" },
        { "kind": "server", "text": "만료 시각이 지났으면 404. 폴더 안 글을 '링크를 연 사람'(비로그인) 기준 2-3 규칙으로 거른다 — 6번(팔로워 공개)은 빠진다" },
        { "kind": "db", "sql": "SELECT b.*, p.*, a.* FROM bookmark b JOIN post p ON p.id = b.post_id JOIN member a ON a.id = p.author_id WHERE b.folder_id = 13 ORDER BY b.created_at DESC, b.id DESC" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"folderName\": \"[채점] 공유 폴더\", \"owner\": {\"id\": 2, \"nickname\": \"김자바\"}, \"items\": [{\"postId\": 12, \"title\": \"자유글 01\"}]}"
        },
        { "kind": "screen", "text": "글 목록만 보인다 — 주인의 메모·팔로워 공개 글은 없다", "focus": ["shared"] }
      ]
    },
    {
      "name": "옛 링크",
      "steps": [
        { "kind": "user", "text": "링크를 다시 만든 뒤, 예전에 받은 링크를 연다" },
        { "kind": "request", "method": "GET", "path": "/api/shared/folders/T4TYidHW8JGRP_9zvsAV0LlWQ0GM9tcQt__nAktHY10" },
        { "kind": "db", "sql": "SELECT f.* FROM bookmark_folder f WHERE f.share_token = ?", "note": "0행" },
        { "kind": "response", "status": 404, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "'링크가 없거나 막혔어요' — 없는 링크·해제·만료를 구별해 알려 주지 않는다", "focus": ["shared"] }
      ]
    }
  ]
}
```

## 만들 것

**V55** — `db/migration/V55__add_bookmark_folder_share.sql`

| 컬럼(`bookmark_folder`에 추가) | 타입·규칙 |
|---|---|
| `share_token` | `VARCHAR(43) NULL`, **`UNIQUE`** — `NULL`이면 공유하지 않는 폴더 |
| `share_expires_at` | `DATETIME NULL` — `NULL`이면 만료 없음 |

**API**

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `POST /api/me/bookmark-folders/{id}/share` | 링크 만들기 — **부를 때마다 새 토큰**(옛 링크는 죽는다). 본문 생략 가능 | `201`, `Location: /api/shared/folders/{token}`, `{ "folderId", "shareToken", "url", "expiresAt" }` |
| `DELETE /api/me/bookmark-folders/{id}/share` | 공유 끄기 | `204` |
| `GET /api/shared/folders/{token}` | 링크로 열기 — **토큰 없이**. 로그인한 채로 열면 그 사람 기준 | `200` `{ "folderName", "owner": { "id", "nickname" }, "items": [ { "postId", "title" } ] }` |

**필드 규칙** — `POST …/share` 본문. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| 본문 자체 | 아니오 | 생략·`{}` 허용, JSON `null`은 오류 | — | JSON 객체(배열·`null` → 400) | — | `400` |
| `expiresInDays` | 아니오 | `null` 허용(= 만료 없음) | **1~30** | 정수(문자열 `"7"`·소수 `7.5`·불리언 → 400) | `null` | `400`, `errors`에 `expiresInDays` |
| 경로 `{id}` | 예 | — | — | 숫자(`abc` → 400) | — | 남의 폴더·없는 폴더 `404` |

| 상황 | 결과 |
|---|---|
| 링크 토큰 | 추측할 수 없는 무작위 값(`SecureRandom` 32바이트 → URL용 Base64 43자). 폴더 id·순번·시각으로 만들지 않는다 |
| 링크로 연 목록 | **링크를 연 사람** 기준 2-3 규칙(비로그인이면 공개 글만). 지워진·숨겨진 글도 빠진다 |
| 내보내지 않는 것 | 주인의 북마크 메모(`note`), 북마크 id |
| 없는 토큰·공유를 끈 폴더·다시 만들어 바뀐 옛 토큰·만료된 링크 | 모두 `404`(이유를 구별해 알려 주지 않는다) |
| POST·DELETE에 토큰 없음 | `401` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 내 폴더인가(남의 것·없는 것은 404) → SecureRandom 32바이트를 URL용 Base64로(43자) → 새 토큰으로 바꾼다(옛 링크는 이 순간 죽는다)
- UNIQUE 인덱스로 한 줄
- 만료 시각이 지났으면 404. 폴더 안 글을 '링크를 연 사람'(비로그인) 기준 2-3 규칙으로 거른다 — 6번(팔로워 공개)은 빠진다
- 0행

<details>
<summary>Controller — HTTP 연결</summary>

`FolderShareController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

이번 단계 매핑: `@PostMapping("/api/me/bookmark-folders/{id}/share")`, `@DeleteMapping("/api/me/bookmark-folders/{id}/share")`, `@GetMapping("/api/shared/folders/{token}")`. 변경된 메서드: `share`, `unshare`, `open`.

`src/main/java/org/example/bookmark/FolderShareController.java`

```java
package org.example.bookmark;

import tools.jackson.databind.JsonNode;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
public class FolderShareController {

    private final FolderShareService shareService;

    public FolderShareController(FolderShareService shareService) {
        this.shareService = shareService;
    }

    // 본문 생략 가능(만료 없음). 부를 때마다 새 링크
    @PostMapping("/api/me/bookmark-folders/{id}/share")
    public ResponseEntity<ShareResponse> share(@PathVariable Long id, @LoginMember AuthenticatedMember me,
                                               @RequestBody(required = false) JsonNode body) {
        ShareResponse response = shareService.share(me, id, ShareRequest.fromJson(body).expiresInDays());
        return ResponseEntity.created(URI.create(response.url())).body(response);
    }

    @DeleteMapping("/api/me/bookmark-folders/{id}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unshare(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        shareService.unshare(me, id);
    }

    // /api/me 밖 — 토큰 없이 열린다. 로그인한 채로 열면 그 사람 기준으로 거른다
    @GetMapping("/api/shared/folders/{token}")
    public SharedFolderResponse open(@PathVariable String token, @LoginMember AuthenticatedMember viewer) {
        return shareService.open(token, viewer);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`SharedFolderResponse.java`, `ShareRequest.java`, `ShareResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/bookmark/SharedFolderResponse.java`

```java
package org.example.bookmark;

import org.example.post.AuthorResponse;

import java.util.List;

// 링크로 연 폴더 — 주인의 북마크 메모(note)·북마크 id·폴더 id는 내보내지 않는다(글 목록만 공유)
public record SharedFolderResponse(String folderName, AuthorResponse owner, List<Item> items) {

    public record Item(Long postId, String title) {
    }
}
```

`src/main/java/org/example/bookmark/ShareRequest.java`

```java
package org.example.bookmark;

import tools.jackson.databind.JsonNode;
import org.example.post.InvalidParametersException;

import java.util.Map;

// 본문 생략·빈 객체는 만료 없음. 원문 타입을 확인해 문자열·소수의 숫자 강제 변환을 막는다.
public record ShareRequest(Integer expiresInDays) {
    public static ShareRequest fromJson(JsonNode body) {
        if (body == null) return new ShareRequest(null);
        if (!body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체여야 합니다."));
        }
        JsonNode days = body.get("expiresInDays");
        if (days == null || days.isNull()) return new ShareRequest(null);
        if (!days.isIntegralNumber() || !days.canConvertToInt()
                || days.intValue() < 1 || days.intValue() > 30) {
            throw new InvalidParametersException(Map.of("expiresInDays", "1~30 사이의 정수여야 합니다."));
        }
        return new ShareRequest(days.intValue());
    }
}
```

`src/main/java/org/example/bookmark/ShareResponse.java`

```java
package org.example.bookmark;

import java.time.LocalDateTime;

public record ShareResponse(Long folderId, String shareToken, String url, LocalDateTime expiresAt) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`FolderShareService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `share`, `unshare`, `open`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/bookmark/FolderShareService.java`

```java
package org.example.bookmark;

import org.example.auth.AuthenticatedMember;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.function.Predicate;

// 북마크 폴더 공유 링크 — 읽기 전용. 링크를 가진 사람은 로그인 없이 폴더의 글 목록을 본다.
@Service
public class FolderShareService {

    // 32바이트 보안 난수로 256비트 토큰을 만든다. UUID v4도 보안 난수지만 이 시나리오는 더 긴 토큰을 쓴다.
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder TOKEN_ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final BookmarkFolderRepository folderRepository;
    private final BookmarkRepository bookmarkRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public FolderShareService(BookmarkFolderRepository folderRepository, BookmarkRepository bookmarkRepository,
                              PostAccessPolicy accessPolicy, Clock clock) {
        this.folderRepository = folderRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    // 부를 때마다 새 토큰 — 옛 링크는 죽는다(링크가 새어 나갔을 때 다시 만들면 막힌다)
    @Transactional
    public ShareResponse share(AuthenticatedMember me, Long folderId, Integer expiresInDays) {
        BookmarkFolder folder = folderRepository.findOwnedForUpdate(folderId, me.id())
                .orElseThrow(BookmarkFolderNotFoundException::new);
        // 칼럼이 DATETIME(초 단위)이라 응답과 DB 값이 같도록 초 아래를 버린다
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
        LocalDateTime expiresAt = expiresInDays == null ? null : now.plusDays(expiresInDays);
        folder.share(newToken(), expiresAt, now);
        return new ShareResponse(folder.getId(), folder.getShareToken(),
                "/api/shared/folders/" + folder.getShareToken(), expiresAt);
    }

    @Transactional
    public void unshare(AuthenticatedMember me, Long folderId) {
        BookmarkFolder folder = folderRepository.findOwnedForUpdate(folderId, me.id())
                .orElseThrow(BookmarkFolderNotFoundException::new);
        folder.unshare(LocalDateTime.now(clock));
    }

    // 무엇을 보여 줄지는 폴더 주인이 아니라 "링크를 연 사람" 기준(2-3)이다 — 주인 기준이면
    // 주인만 볼 수 있는 팔로워 공개 글·차단한 사람의 글이 링크를 받은 사람에게 새어 나간다.
    @Transactional(readOnly = true)
    public SharedFolderResponse open(String token, AuthenticatedMember viewer) {
        BookmarkFolder folder = folderRepository.findByShareToken(token)
                .filter(f -> f.isShareOpen(LocalDateTime.now(clock)))
                .orElseThrow(SharedFolderNotFoundException::new);
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        List<SharedFolderResponse.Item> items = bookmarkRepository.findInFolder(folder.getId()).stream()
                .map(Bookmark::getPost)
                .filter(viewable)
                .map(post -> new SharedFolderResponse.Item(post.getId(), post.getTitle()))
                .toList();
        return new SharedFolderResponse(folder.getName(),
                new AuthorResponse(folder.getMember().getId(), folder.getMember().getNickname()), items);
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return TOKEN_ENCODER.encodeToString(bytes);
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BookmarkFolderRepository.java`, `BookmarkRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/bookmark/BookmarkFolderRepository.java`

```java
package org.example.bookmark;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookmarkFolderRepository extends JpaRepository<BookmarkFolder, Long> {

    // 폴더는 id만으로 찾지 않는다 — 항상 "내 폴더인가"까지 조건에 넣는다
    Optional<BookmarkFolder> findByIdAndMember_Id(Long id, Long memberId);

    // 링크 회전·해제는 같은 폴더 행을 직렬화해 갱신 순서를 고정한다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM BookmarkFolder f WHERE f.id = :id AND f.member.id = :memberId")
    Optional<BookmarkFolder> findOwnedForUpdate(@Param("id") Long id, @Param("memberId") Long memberId);

    // 14-8: 공유 링크로 폴더 찾기 — 주인 닉네임도 쓰므로 함께 읽는다
    @Query("SELECT f FROM BookmarkFolder f JOIN FETCH f.member WHERE f.shareToken = :token")
    Optional<BookmarkFolder> findByShareToken(@Param("token") String token);

    long countByMember_Id(Long memberId);

    boolean existsByMember_IdAndName(Long memberId, String name);

    boolean existsByMember_IdAndNameAndIdNot(Long memberId, String name, Long id);

    // 내 폴더 목록 + 폴더별 북마크 수를 한 번에(폴더마다 COUNT를 따로 보내지 않는다)
    @Query("""
            SELECT new org.example.bookmark.BookmarkFolderSummaryResponse(
                f.id, f.name, (SELECT COUNT(b) FROM Bookmark b WHERE b.folder = f))
            FROM BookmarkFolder f
            WHERE f.member.id = :memberId
            ORDER BY f.createdAt ASC, f.id ASC
            """)
    List<BookmarkFolderSummaryResponse> findSummaries(@Param("memberId") Long memberId);
}
```

`src/main/java/org/example/bookmark/BookmarkRepository.java`

```java
package org.example.bookmark;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    @Query("SELECT b.post.id FROM Bookmark b WHERE b.member.id = :memberId AND b.post.id IN :postIds")
    List<Long> findPostIdsForMember(@Param("memberId") Long memberId,
                                    @Param("postIds") List<Long> postIds);

    Optional<Bookmark> findByMember_IdAndPost_Id(Long memberId, Long postId);

    long deleteByMember_IdAndPost_Id(Long memberId, Long postId);

    // 북마크도 항상 "내 것" 조건으로 찾는다
    Optional<Bookmark> findByIdAndMember_Id(Long id, Long memberId);

    // 6-2 폴더 삭제 — 안의 북마크를 기본 폴더로. 북마크마다가 아니라 UPDATE 한 번
    @Modifying
    @Query("UPDATE Bookmark b SET b.folder = null WHERE b.folder.id = :folderId")
    int moveAllToDefaultFolder(@Param("folderId") Long folderId);

    // 6-3 내 북마크 — 북마크한 시각 최신순 키셋 페이징. 글·작성자를 함께 읽는다(항목마다 따로 조회하지 않음).
    // 4-3과 달리 "볼 수 있는 글" 조건을 여기 넣지 않는다 — 볼 수 없게 된 글도 남기고 항목별로 표시하기 때문이다.
    // folderMode: ALL(전체) / DEFAULT(기본 폴더 = folder_id IS NULL) / ID(그 폴더)
    @Query("""
            SELECT b FROM Bookmark b
            JOIN FETCH b.post p
            JOIN FETCH p.author
            LEFT JOIN b.folder f
            WHERE b.member.id = :memberId
              AND (:folderMode = 'ALL'
                   OR (:folderMode = 'DEFAULT' AND f.id IS NULL)
                   OR (:folderMode = 'ID' AND f.id = :folderId))
              AND (:cursorAt IS NULL
                   OR b.createdAt < :cursorAt
                   OR (b.createdAt = :cursorAt AND b.id < :cursorId))
            ORDER BY b.createdAt DESC, b.id DESC
            """)
    List<Bookmark> findMyBookmarks(@Param("memberId") Long memberId,
                                   @Param("folderMode") String folderMode,
                                   @Param("folderId") Long folderId,
                                   @Param("cursorAt") LocalDateTime cursorAt,
                                   @Param("cursorId") Long cursorId,
                                   Pageable pageable);

    // 14-8: 공유된 폴더 안의 북마크 — 글·작성자까지 한 번에, 북마크한 순(최신 먼저)
    @Query("""
            SELECT b FROM Bookmark b
            JOIN FETCH b.post p
            JOIN FETCH p.author
            WHERE b.folder.id = :folderId
            ORDER BY b.createdAt DESC, b.id DESC
            """)
    List<Bookmark> findInFolder(@Param("folderId") Long folderId);
    // UNIQUE(member_id,post_id)를 이용해 동시 반복 PUT도 한 행으로 합친다.
    @Modifying
    @Query(value = """
            INSERT INTO bookmark(member_id, post_id, folder_id, note, created_at, updated_at)
            VALUES (:memberId, :postId, :folderId, :memo, NOW(), NOW())
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    int insertIfAbsent(@Param("memberId") Long memberId, @Param("postId") Long postId,
                       @Param("folderId") Long folderId, @Param("memo") String memo);

    // REPEATABLE_READ의 이전 스냅샷이 아닌 현재 행을 읽는다.
    @Query(value = "SELECT * FROM bookmark WHERE member_id = :memberId AND post_id = :postId FOR UPDATE",
            nativeQuery = true)
    Optional<Bookmark> findCurrentForUpdate(@Param("memberId") Long memberId,
                                             @Param("postId") Long postId);
    // 6-1: 생성 또는 폴더·메모 수정. UNIQUE 키 충돌도 하나의 SQL에서 처리한다.
    @Modifying
    @Query(value = """
            INSERT INTO bookmark(member_id, post_id, folder_id, note, created_at, updated_at)
            VALUES (:memberId, :postId, :folderId, :memo, NOW(), NOW())
            ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), note = VALUES(note), updated_at = NOW()
            """, nativeQuery = true)
    int upsert(@Param("memberId") Long memberId, @Param("postId") Long postId,
               @Param("folderId") Long folderId, @Param("memo") String memo);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`BookmarkFolder.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `share`, `unshare`.

`src/main/java/org/example/bookmark/BookmarkFolder.java`

```java
package org.example.bookmark;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.member.Member;

import java.time.LocalDateTime;

// 북마크 폴더 — 회원별 이름 중복 불가(UNIQUE member_id, name)
@Entity
@Table(name = "bookmark_folder")
public class BookmarkFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 14-8 공유 링크 — null이면 공유 안 함. expiresAt이 null이면 만료 없음
    @Column(name = "share_token", length = 43)
    private String shareToken;

    @Column(name = "share_expires_at")
    private LocalDateTime shareExpiresAt;

    protected BookmarkFolder() {
        // JPA
    }

    public BookmarkFolder(Member member, String name, LocalDateTime now) {
        this.member = member;
        this.name = name;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void rename(String name, LocalDateTime now) {
        this.name = name;
        this.updatedAt = now;
    }

    // 새 토큰으로 바꾼다 — 옛 링크는 이 순간부터 열리지 않는다
    public void share(String token, LocalDateTime expiresAt, LocalDateTime now) {
        this.shareToken = token;
        this.shareExpiresAt = expiresAt;
        this.updatedAt = now;
    }

    public void unshare(LocalDateTime now) {
        this.shareToken = null;
        this.shareExpiresAt = null;
        this.updatedAt = now;
    }

    // 만료 시각이 지나면(같은 시각 포함) 닫힌 링크다
    public boolean isShareOpen(LocalDateTime now) {
        return shareToken != null && (shareExpiresAt == null || now.isBefore(shareExpiresAt));
    }

    public String getShareToken() {
        return shareToken;
    }

    public LocalDateTime getShareExpiresAt() {
        return shareExpiresAt;
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public String getName() {
        return name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V55__add_bookmark_folder_share.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V55__add_bookmark_folder_share.sql`

```sql
-- 14-8 폴더 공유 링크 — 링크에 들어가는 토큰과 만료 시각. 둘 다 NULL이면 공유하지 않는 폴더다.
-- 토큰은 추측할 수 없는 무작위 값(32바이트 → URL용 Base64 43자). 다시 만들면 바뀌고 옛 링크는 죽는다.
ALTER TABLE bookmark_folder
    ADD COLUMN share_token      VARCHAR(43) NULL,
    ADD COLUMN share_expires_at DATETIME    NULL,
    ADD UNIQUE KEY uk_bookmark_folder_share_token (share_token);
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`SharedFolderNotFoundException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleSharedFolderNotFound`.

`src/main/java/org/example/bookmark/SharedFolderNotFoundException.java`

```java
package org.example.bookmark;

// 없는 링크·닫힌 링크(공유 해제·다시 만듦·만료) — 모두 같은 404로, 어떤 이유인지 드러내지 않는다
public class SharedFolderNotFoundException extends RuntimeException {
    public SharedFolderNotFoundException() {
        super("공유 링크를 찾을 수 없습니다.");
    }
}
```

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
import org.example.bookmark.SharedFolderNotFoundException;
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
import org.example.series.SeriesForbiddenException;
import org.example.series.SeriesNotFoundException;

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

    @ExceptionHandler(SeriesNotFoundException.class)
    public ProblemDetail handleSeriesNotFound(SeriesNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SeriesForbiddenException.class)
    public ProblemDetail handleSeriesForbidden(SeriesForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SharedFolderNotFoundException.class)
    public ProblemDetail handleSharedFolderNotFound(SharedFolderNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
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
<summary>테스트 — 계약 확인</summary>

`FolderShareExpiryTest.java`. 테스트 요청과 기대값을 **직접 확인** 및 채점 기준과 대조한다.

`src/test/java/org/example/bookmark/FolderShareExpiryTest.java`

```java
package org.example.bookmark;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

// 14-8: 만료는 기다려서 확인할 수 없다 — 시각을 인자로 받는 엔티티 메서드를 순수 단위 테스트로 본다(Spring·DB 없음)
class FolderShareExpiryTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 10, 12, 0);

    @Test
    void 만료_시각_직전에는_열리고_그_시각부터는_닫힌다() {
        BookmarkFolder folder = new BookmarkFolder(null, "공유 폴더", NOW);
        folder.share("token", NOW.plusDays(7), NOW);

        assertThat(folder.isShareOpen(NOW.plusDays(7).minusSeconds(1))).isTrue();
        assertThat(folder.isShareOpen(NOW.plusDays(7))).isFalse();
    }

    @Test
    void 만료_없음이면_계속_열리고_해제하면_닫힌다() {
        BookmarkFolder folder = new BookmarkFolder(null, "공유 폴더", NOW);
        folder.share("token", null, NOW);
        assertThat(folder.isShareOpen(NOW.plusYears(10))).isTrue();

        folder.unshare(NOW);
        assertThat(folder.isShareOpen(NOW)).isFalse();
        assertThat(folder.getShareToken()).isNull();
    }
}
```

</details>

### MyBatis 대안 — 공유 토큰 갱신·조회와 폴더 잠금

`FolderShareMapper`가 소유 폴더를 `FOR UPDATE`로 확인하고 토큰 회전·해제·링크 조회를 수행한다. 폴더 안 북마크의 글·작성자 일괄 조회와 열람자 기준 `PostAccessPolicy`는 공통 코드를 재사용한다. DTO 원문 JSON 타입 검사와 32바이트 토큰 생성은 두 방식에서 같다.

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
<summary>MyBatis / DTO — ShareFolderRow.java</summary>

`src/main/java/org/example/bookmark/ShareFolderRow.java`

```java
package org.example.bookmark;

import java.time.LocalDateTime;

// 공유 URL을 열 때 필요한 폴더·주인 정보만 한 행으로 읽는다.
public record ShareFolderRow(Long id, String name, Long ownerId, String ownerNickname,
                             LocalDateTime shareExpiresAt) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — FolderShareMapper.java</summary>

`src/main/java/org/example/bookmark/FolderShareMapper.java`

```java
package org.example.bookmark;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface FolderShareMapper {
    ShareFolderRow findOwnedForUpdate(@Param("folderId") Long folderId, @Param("ownerId") Long ownerId);

    int share(@Param("folderId") Long folderId, @Param("token") String token,
              @Param("expiresAt") LocalDateTime expiresAt, @Param("now") LocalDateTime now);

    int unshare(@Param("folderId") Long folderId, @Param("now") LocalDateTime now);

    ShareFolderRow findByToken(@Param("token") String token);
}
```

</details>

<details>
<summary>MyBatis / SQL — FolderShareMapper.xml</summary>

`src/main/resources/mapper/FolderShareMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.bookmark.FolderShareMapper">
    <resultMap id="shareFolder" type="org.example.bookmark.ShareFolderRow">
        <constructor>
            <arg column="id" javaType="java.lang.Long"/>
            <arg column="name" javaType="java.lang.String"/>
            <arg column="owner_id" javaType="java.lang.Long"/>
            <arg column="owner_nickname" javaType="java.lang.String"/>
            <arg column="share_expires_at" javaType="java.time.LocalDateTime"/>
        </constructor>
    </resultMap>
    <select id="findOwnedForUpdate" resultMap="shareFolder">
        SELECT f.id, f.name, m.id AS owner_id, m.nickname AS owner_nickname, f.share_expires_at
          FROM bookmark_folder f JOIN member m ON m.id = f.member_id
         WHERE f.id = #{folderId} AND f.member_id = #{ownerId}
         FOR UPDATE
    </select>
    <update id="share">
        UPDATE bookmark_folder
           SET share_token = #{token}, share_expires_at = #{expiresAt}, updated_at = #{now}
         WHERE id = #{folderId}
    </update>
    <update id="unshare">
        UPDATE bookmark_folder
           SET share_token = NULL, share_expires_at = NULL, updated_at = #{now}
         WHERE id = #{folderId}
    </update>
    <select id="findByToken" resultMap="shareFolder">
        SELECT f.id, f.name, m.id AS owner_id, m.nickname AS owner_nickname, f.share_expires_at
          FROM bookmark_folder f JOIN member m ON m.id = f.member_id
         WHERE f.share_token = #{token}
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — FolderShareService.java</summary>

`src/main/java/org/example/bookmark/FolderShareService.java`

```java
package org.example.bookmark;

import org.example.auth.AuthenticatedMember;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.function.Predicate;

// 북마크 폴더 공유 링크 — 읽기 전용. 링크를 가진 사람은 로그인 없이 폴더의 글 목록을 본다.
@Service
public class FolderShareService {

    // 32바이트 보안 난수로 256비트 토큰을 만든다. UUID v4도 보안 난수지만 이 시나리오는 더 긴 토큰을 쓴다.
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder TOKEN_ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final FolderShareMapper folderShareMapper;
    private final BookmarkRepository bookmarkRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public FolderShareService(FolderShareMapper folderShareMapper, BookmarkRepository bookmarkRepository,
                              PostAccessPolicy accessPolicy, Clock clock) {
        this.folderShareMapper = folderShareMapper;
        this.bookmarkRepository = bookmarkRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    // 부를 때마다 새 토큰 — 옛 링크는 죽는다(링크가 새어 나갔을 때 다시 만들면 막힌다)
    @Transactional
    public ShareResponse share(AuthenticatedMember me, Long folderId, Integer expiresInDays) {
        ShareFolderRow folder = folderShareMapper.findOwnedForUpdate(folderId, me.id());
        if (folder == null) throw new BookmarkFolderNotFoundException();
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
        LocalDateTime expiresAt = expiresInDays == null ? null : now.plusDays(expiresInDays);
        String token = newToken();
        folderShareMapper.share(folder.id(), token, expiresAt, now);
        return new ShareResponse(folder.id(), token, "/api/shared/folders/" + token, expiresAt);
    }

    @Transactional
    public void unshare(AuthenticatedMember me, Long folderId) {
        ShareFolderRow folder = folderShareMapper.findOwnedForUpdate(folderId, me.id());
        if (folder == null) throw new BookmarkFolderNotFoundException();
        folderShareMapper.unshare(folder.id(), LocalDateTime.now(clock));
    }

    // 무엇을 보여 줄지는 폴더 주인이 아니라 "링크를 연 사람" 기준(2-3)이다 — 주인 기준이면
    // 주인만 볼 수 있는 팔로워 공개 글·차단한 사람의 글이 링크를 받은 사람에게 새어 나간다.
    @Transactional(readOnly = true)
    public SharedFolderResponse open(String token, AuthenticatedMember viewer) {
        ShareFolderRow folder = folderShareMapper.findByToken(token);
        if (folder == null || (folder.shareExpiresAt() != null
                && !LocalDateTime.now(clock).isBefore(folder.shareExpiresAt()))) {
            throw new SharedFolderNotFoundException();
        }
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        List<SharedFolderResponse.Item> items = bookmarkRepository.findInFolder(folder.id()).stream()
                .map(Bookmark::getPost)
                .filter(viewable)
                .map(post -> new SharedFolderResponse.Item(post.getId(), post.getTitle()))
                .toList();
        return new SharedFolderResponse(folder.name(),
                new AuthorResponse(folder.ownerId(), folder.ownerNickname()), items);
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return TOKEN_ENCODER.encodeToString(bytes);
    }
}
```

</details>

## 직접 확인

김자바가 폴더를 하나 만들고 6번(이스프링의 팔로워 공개 글 — 김자바는 팔로우 중이라 북마크할 수 있다)과 12번을 넣는다. 비로그인으로 링크를 열면 12번만, 6번의 작성자인 이스프링으로 열면 둘 다 보인다. 마지막에 폴더를 지워 정리한다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "F0",
      "title": "김자바의 폴더 수(새 폴더 이름 끝에 붙인다 — 다시 눌러도 이름이 겹치지 않게)",
      "method": "GET",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "F1",
      "title": "공유할 폴더 만들기",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 공유 {{F0.body.length}}"
      }
    },
    {
      "id": "B1",
      "title": "6번(이스프링의 팔로워 공개 글) 북마크 → 이 폴더",
      "method": "PUT",
      "path": "/api/posts/6/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "{{F1.body.id}}"
      }
    },
    {
      "id": "B2",
      "title": "12번 북마크 → 이 폴더, 메모 '비밀 메모'",
      "method": "PUT",
      "path": "/api/posts/12/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "{{F1.body.id}}",
        "memo": "비밀 메모"
      }
    },
    {
      "id": "S1",
      "title": "공유 링크 만들기(본문 없음 — 만료 없음)",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S2",
      "title": "링크 열기(비로그인)",
      "method": "GET",
      "path": "/api/shared/folders/{{S1.body.shareToken}}"
    },
    {
      "id": "S3",
      "title": "링크 열기(이스프링으로 로그인한 채)",
      "method": "GET",
      "path": "/api/shared/folders/{{S1.body.shareToken}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S4",
      "title": "다시 만들기(7일 뒤 만료)",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": 7
      }
    },
    {
      "id": "S5",
      "title": "옛 링크 열기",
      "method": "GET",
      "path": "/api/shared/folders/{{S1.body.shareToken}}"
    },
    {
      "id": "S6",
      "title": "새 링크 열기",
      "method": "GET",
      "path": "/api/shared/folders/{{S4.body.shareToken}}"
    },
    {
      "id": "S7",
      "title": "잘못된 입력 — expiresInDays=0",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": 0
      }
    },
    {
      "id": "S7b",
      "title": "잘못된 입력 — expiresInDays=31",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": 31
      }
    },
    {
      "id": "S7c",
      "title": "잘못된 입력 — expiresInDays=-1",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": -1
      }
    },
    {
      "id": "S7d",
      "title": "잘못된 입력 — 숫자 자리에 문자",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": "abc"
      }
    },
    {
      "id": "S7e",
      "title": "잘못된 입력 — 본문이 배열",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": [
        7
      ]
    },
    {
      "id": "S7f",
      "title": "잘못된 입력 — 숫자 문자열",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {"Authorization": "Bearer tok-kimjava"},
      "body": {"expiresInDays": "7"}
    },
    {
      "id": "S7g",
      "title": "잘못된 입력 — 소수",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {"Authorization": "Bearer tok-kimjava"},
      "body": {"expiresInDays": 7.5}
    },
    {
      "id": "S7h",
      "title": "잘못된 입력 — 불리언",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {"Authorization": "Bearer tok-kimjava"},
      "body": {"expiresInDays": true}
    },
    {
      "id": "S7i",
      "title": "잘못된 입력 — 본문 JSON null",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {"Authorization": "Bearer tok-kimjava"},
      "body": "null"
    },
    {
      "id": "S8",
      "title": "경계값 안쪽 — 1일",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": 1
      }
    },
    {
      "id": "S8b",
      "title": "경계값 안쪽 — 30일",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": 30
      }
    },
    {
      "id": "S8c",
      "title": "null이면 만료 없음",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "expiresInDays": null
      }
    },
    {
      "id": "S9",
      "title": "남의 폴더 공유(이스프링)",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S9b",
      "title": "없는 폴더",
      "method": "POST",
      "path": "/api/me/bookmark-folders/999999/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S9c",
      "title": "폴더 id 자리에 문자",
      "method": "POST",
      "path": "/api/me/bookmark-folders/abc/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S9d",
      "title": "토큰 없이",
      "method": "POST",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share"
    },
    {
      "id": "S10",
      "title": "공유 해제",
      "method": "DELETE",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}/share",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S11",
      "title": "해제 뒤 마지막 링크 열기",
      "method": "GET",
      "path": "/api/shared/folders/{{S8c.body.shareToken}}"
    },
    {
      "id": "S12",
      "title": "없는 링크",
      "method": "GET",
      "path": "/api/shared/folders/nope"
    },
    {
      "id": "S13",
      "title": "정리 — 폴더 지우기(북마크는 기본 폴더로)",
      "method": "DELETE",
      "path": "/api/me/bookmark-folders/{{F1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "F1",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "B1",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 200
          }
        }
      ],
      "note": "폴더가 10개(한도)면 F1이 400 — 6-2의 [채점] 폴더를 직접 지운다"
    },
    {
      "id": "C2",
      "request": "S1",
      "expect": {
        "status": 201,
        "headers": {
          "Location": {
            "endsWith": "/api/shared/folders/{{S1.body.shareToken}}"
          }
        },
        "json": [
          {
            "path": "$.shareToken",
            "matches": "^[A-Za-z0-9_-]{32,}$"
          },
          {
            "path": "$.url",
            "equals": "/api/shared/folders/{{S1.body.shareToken}}"
          },
          {
            "path": "$.expiresAt",
            "type": "null"
          }
        ]
      },
      "note": "토큰은 추측할 수 없는 길이(32자 이상)의 URL에 쓸 수 있는 문자"
    },
    {
      "id": "C3",
      "request": "S2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.folderName",
            "equals": "[채점] 공유 {{F0.body.length}}"
          },
          {
            "path": "$.owner.nickname",
            "equals": "김자바"
          },
          {
            "path": "$.items[*].postId",
            "contains": 12
          },
          {
            "path": "$.items[*].postId",
            "notContains": 6
          },
          {
            "path": "$.items[0].note",
            "exists": false
          },
          {
            "path": "$.items[0].memo",
            "exists": false
          }
        ]
      },
      "note": "링크를 연 사람(비로그인) 기준 — 팔로워 공개 글(6)은 빠진다. 주인의 메모는 내보내지 않는다"
    },
    {
      "id": "C4",
      "request": "S3",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].postId",
            "contains": 6
          },
          {
            "path": "$.items[*].postId",
            "contains": 12
          }
        ]
      },
      "note": "6번의 작성자(이스프링)가 열면 6번도 보인다 — 폴더 주인 기준이 아니다"
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "S4",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.shareToken",
                "notEquals": "{{S1.body.shareToken}}"
              },
              {
                "path": "$.expiresAt",
                "type": "string"
              }
            ]
          }
        },
        {
          "request": "S5",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S6",
          "expect": {
            "status": 200
          }
        }
      ],
      "note": "다시 만들면 새 토큰 — 옛 링크는 404"
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "S7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7d",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7f",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7g",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        },
        {
          "request": "S7h",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "expiresInDays"
              }
            ]
          }
        }
      ],
      "note": "1~30 범위 밖이거나 원문 타입이 정수가 아니면 400, errors에 expiresInDays — 500이 아니다"
    },
    {
      "id": "C7",
      "all": [
        {"request": "S7e", "expect": {"status": 400}},
        {"request": "S7i", "expect": {"status": 400}}
      ]
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "S8",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.expiresAt",
                "type": "string"
              }
            ]
          }
        },
        {
          "request": "S8b",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "S8c",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.expiresAt",
                "type": "null"
              }
            ]
          }
        }
      ],
      "note": "경계값 안쪽(1일·30일)과 null(만료 없음)은 성공"
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "S9",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S9b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S9c",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "S9d",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "S10",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "S11",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S12",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C11",
      "request": "S13",
      "expect": {
        "status": 204
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), T = 테스트(필수), R = 코드 리뷰(피드백용). `{FID}`는 F1 응답의 id다(D는 S13 정리 **전에** 확인하거나, S13을 빼고 실행한다).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F1 / B1 / B2 | `201` / `200` / `200` |
| C2 | S1 | `201`, `Location`이 `/api/shared/folders/{token}`, 토큰은 URL에 쓸 수 있는 문자 32자 이상, `expiresAt`=`null` |
| C3 | S2 | `200`, 폴더 이름·주인 `김자바`, 12번 있음·6번 없음, 항목에 `note`·`memo` 없음 |
| C4 | S3 | `200`, 6번·12번 모두 — 링크를 연 사람(이스프링) 기준 |
| C5 | S4 / S5 / S6 | `201`(새 토큰, `expiresAt` 있음) / `404`(옛 링크) / `200`(새 링크) |
| C6 | S7 / S7b / S7c / S7d / S7f / S7g / S7h | 모두 `400`, `errors`에 `expiresInDays`(범위 밖·문자열·소수·불리언) — 500이 아니다 |
| C7 | S7e / S7i | `400` — 본문이 배열 또는 JSON `null` |
| C8 | S8 / S8b / S8c | `201` — 경계값 안쪽(1일·30일)과 `null`(만료 없음, `expiresAt`=`null`) |
| C9 | S9 / S9b / S9c / S9d | `404`(남의 폴더) / `404`(없는 폴더) / `400`(id에 문자) / `401` |
| C10 | S10 / S11 / S12 | `204` / `404`(공유를 끈 뒤) / `404`(없는 링크) |
| C11 | S13 | `204` — 정리 |
| D1 | S10 뒤 `SELECT share_token, share_expires_at FROM bookmark_folder WHERE id = {FID}` | `NULL, NULL` |
| D2 | `SHOW INDEX FROM bookmark_folder WHERE Column_name = 'share_token'` | `Non_unique` = 0 — 토큰은 겹칠 수 없다 |
| T1 | 테스트 `FolderShareExpiryTest`(순수 단위) | 만료 시각 1초 전에는 열리고 만료 시각부터는 닫힌다. 만료 없음은 10년 뒤에도 열리고, 해제하면 닫힌다 |
| R1 | 토큰 | `SecureRandom`으로 만든다. `java.util.Random`은 보안용이 아니다. `UUID.randomUUID()`는 보안 난수를 쓰지만 이 설계는 32바이트(256비트)와 Base64url 토큰 형식을 택한 이유를 설명할 수 있다. 토큰은 열쇠라서 로그에 남기지 않는다 |
| R2 | 누구 기준 | 링크로 연 목록을 **여는 사람** 기준으로 거른다. 주인 기준이면 생기는 유출(팔로워 공개 글·차단)을 설명할 수 있다 |
| R3 | 경로 | 공개 읽기 경로가 `/api/me/**` 밖이다. 주인용 쓰기(POST·DELETE)는 `/api/me/**`에서 "내 폴더"를 확인한다(남의 것은 404 — 6-2와 같다) |
| R4 | 만료 | "지금"을 `Clock`(8-2)에서 받는다. 만료 판단이 시각을 인자로 받아서 기다리지 않고 테스트할 수 있다 |
| R5 | 동시 회전·해제 | 주인 폴더 행을 `FOR UPDATE`로 잠근 뒤 토큰을 바꾼다. 동시 요청은 순서대로 반영되고 마지막 토큰만 열 수 있다 |

## 필요한 지식

- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) — 순번 id 대신 추측할 수 없는 토큰
- [D11 — IDOR를 UUID로 바꾸면 왜 충분하지 않나](../../docs/knowledge/D11-web-security-basics.md#q4-idor를-식별자-uuid로-바꾸면-왜-충분하지-않나) — 링크 토큰은 "가진 사람 = 권한"이라는 다른 모델
- [W16 — 내부 PK와 외부 공개 ID](../../docs/knowledge/W16-id-generation.md#q5-내부-pk와-외부-공개-id를-분리하면-무엇을-얻고-무엇을-내나)
- [W20 — 테스트에서 현재 시간 고정](../../docs/knowledge/W20-time-timezone.md#q6-테스트에서-현재-시간을-고정하는-가장-작은-변경은)
- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md)
- [F2 레슨 — 토큰 인증](../../lessons/F2-auth-token.md) — 로그인 토큰과 링크 토큰의 차이

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 토큰 만들기</summary>

```java
private static final SecureRandom RANDOM = new SecureRandom();

byte[] bytes = new byte[32];
RANDOM.nextBytes(bytes);
String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);   // 43자, A-Z a-z 0-9 - _
```

URL용 Base64는 `+`·`/` 대신 `-`·`_`를 써서 경로에 그대로 넣을 수 있다.
</details>

<details>
<summary>힌트 2 — 본문 없는 POST</summary>

`@RequestBody(required = false) JsonNode body`로 원문 JSON을 받고 `ShareRequest.fromJson(body)`에서 검사한다. 본문 생략은 허용하지만 JSON 리터럴 `null`은 거부한다. `expiresInDays`는 생략하거나 `null`이면 기본값을 쓰고, 값이 있으면 정수 1~30만 허용한다. 문자열 `"7"`, 소수 `7.5`, 불리언은 400이다.
</details>

## 다음 단계

14장 끝. 15장에서는 사람이 누르지 않아도 도는 배치를 만든다 — 다시 `practice` 프로파일(고정 시계)로 띄운다. [15-1. 명예의 전당 — 매일 0시 배치와 멱등](../ch15-scheduling-batch/15-1-hall-of-fame.md)
