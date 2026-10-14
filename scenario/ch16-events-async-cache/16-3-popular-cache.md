# 16-3. 인기글 캐시 — 60초 동안 재사용, 숨기면 바로 빼기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다. 8-2의 `GET /api/posts/popular`를 그대로 쓴다.

## 상황

> "메인 화면이 열릴 때마다 인기글을 다시 계산하느라 DB가 바빠요. 몇십 초 늦게 바뀌는 건 괜찮습니다. 그런데 작성자가 글을 비공개로 돌렸는데 인기글에 계속 떠 있으면 그건 안 돼요."

8-2의 인기글은 좋아요·댓글 테이블을 기간으로 집계하는 무거운 쿼리다. 메인 화면은 사람마다, 새로고침마다 이 쿼리를 부른다. 그런데 결과는 몇십 초 사이에 거의 바뀌지 않는다. 한 번 계산한 결과를 **메모리에 60초 동안 두고 재사용**한다(캐시).

캐시에는 두 가지 대가가 따른다.

- **오래된 값** — 60초 동안은 좋아요가 늘어도 순위가 그대로다. 이건 받아들인다(TTL).
- **보이면 안 되는 값** — 글이 비공개(`FOLLOWERS`)가 되거나 삭제되면 60초를 기다리지 않고 **바로** 빠져야 한다. 그런 변경이 성공하면 캐시를 비운다(무효화).

캐시가 실제로 쓰였는지 눈으로 보려고, 응답 헤더 `X-Cache`에 `HIT`(캐시에서 꺼냄)·`MISS`(이번에 계산함)를 붙인다. 앱 로그에서도 `MISS`일 때만 인기글 SQL이 찍힌다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "메인 — 이번 주 인기글",
  "summary": "인기글을 (days, limit)마다 60초 캐시. 글을 비공개로 돌리면 캐시를 비워 바로 빠진다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "이번 주 인기글"
    },
    {
      "type": "list",
      "id": "popular",
      "items": [
        {
          "id": "p145",
          "title": "1. 스프링 트랜잭션 전파 삽질기",
          "meta": "점수 61"
        },
        {
          "id": "p143",
          "title": "2. MySQL 인덱스 설계 실전 적용 후기",
          "meta": "점수 61"
        },
        {
          "id": "p144",
          "title": "3. 예외 처리 전략 정리",
          "meta": "점수 10"
        }
      ]
    },
    {
      "type": "code",
      "id": "hdr",
      "label": "응답 헤더",
      "value": "X-Cache: HIT"
    }
  ],
  "flows": [
    {
      "name": "두 번째 방문은 캐시에서",
      "steps": [
        {
          "kind": "user",
          "text": "메인을 연다(첫 방문)"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/popular?days=7&limit=10"
        },
        {
          "kind": "db",
          "sql": "SELECT p.id AS postId, ... LEFT JOIN (SELECT post_id, COUNT(*) ...) ... LIMIT 10",
          "note": "캐시에 없을 때만 실행 → 논리 키 7:10과 현재 세대로 60초 보관"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "X-Cache: MISS"
          ],
          "body": "[{\"postId\": 145, ...}, {\"postId\": 143, ...}, {\"postId\": 144, ...}, ...]"
        },
        {
          "kind": "user",
          "text": "다른 사람이 곧바로 메인을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/popular?days=7&limit=10"
        },
        {
          "kind": "server",
          "text": "@Cacheable이 같은 세대의 키 7:10을 찾아 서비스 본문을 건너뛴다 — SQL 없음"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "X-Cache: HIT"
          ]
        },
        {
          "kind": "screen",
          "text": "같은 목록이 더 빨리 뜬다",
          "focus": [
            "popular",
            "hdr"
          ]
        }
      ]
    },
    {
      "name": "작성자가 비공개로 → 바로 빠짐",
      "steps": [
        {
          "kind": "user",
          "text": "회원 5가 자기 글 144번을 팔로워 공개로 바꾼다"
        },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/posts/144",
          "headers": [
            "Authorization: Bearer tok-p05"
          ],
          "body": "{\"visibility\": \"FOLLOWERS\"}"
        },
        {
          "kind": "server",
          "text": "수정 성공 → @CacheEvict(allEntries = true)로 popularPosts 캐시를 통째로 비운다. 발행 0건 배치는 HIT를 유지한다"
        },
        {
          "kind": "response",
          "status": 200
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/popular?days=7&limit=10"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "X-Cache: MISS"
          ],
          "body": "[{\"postId\": 145, ...}, {\"postId\": 143, ...}, {\"postId\": 140, ...}, ...]"
        },
        {
          "kind": "screen",
          "text": "60초를 기다리지 않고 144번이 목록에서 빠진다",
          "focus": [
            "p144",
            "popular"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**캐시 켜기**

| 할 일 | 내용 |
|---|---|
| 의존성 | `spring-boot-starter-cache` + `com.github.ben-manes.caffeine:caffeine`(한 JVM 안의 메모리 캐시, 만료 시간 지원) |
| 설정 | `@EnableCaching` 한 곳, `application.yml`에 `spring.cache.cache-names: popularPosts`, `spring.cache.caffeine.spec: maximumSize=100,expireAfterWrite=60s` |
| 캐시할 메서드 | 인기글 서비스 메서드에 `@Cacheable(cacheNames = "popularPosts", key = "#days + ':' + #limit + ':' + @popularCacheVersion.current()")` — 논리 키 `(days, limit)`에 현재 세대를 붙인다 |
| 캐시에 넣는 값 | **불변**이어야 한다. 캐시는 같은 객체를 여러 요청에 그대로 돌려준다. record와 `.toList()`(수정 불가 목록)로 만든다 |

**HIT·MISS 보이기** — 응답 본문은 8-2 그대로(배열)다.

| 방법 | 내용 |
|---|---|
| 계산 시각을 함께 캐시 | 서비스가 `PopularSnapshot(items, loadedAtNanos)`를 돌려준다. `loadedAtNanos`는 계산한 순간의 `System.nanoTime()`이다 |
| 컨트롤러에서 판정 | 메서드 시작에서 `started = System.nanoTime()`을 잰다. 받은 스냅샷의 `loadedAtNanos < started`면 이번 요청 전에 계산된 것이니 `HIT`, 아니면 `MISS`. 헤더 `X-Cache`로 내보낸다 |
| CORS | `CorsConfig`의 `exposedHeaders`에 `"X-Cache"`를 더한다. 빠뜨리면 curl에는 보여도 브라우저 실행 칸에서는 "없음"이다 |

**무효화** — 성공했을 때만 비운다(`@CacheEvict` 기본값). 잘못된 입력으로 400이 난 수정은 캐시를 건드리지 않는다.

| 변경 | 캐시 |
|---|---|
| `PATCH /api/posts/{id}`(3-1), `PUT /api/posts/{id}`(4-1) 성공 — 공개 범위·제목이 바뀔 수 있다 | `@CacheEvict(cacheNames = "popularPosts", allEntries = true)` — 키가 여러 개라 이 글이 어느 키에 들었는지 모르므로 통째로 |
| `DELETE /api/posts/{id}`(3-2) 성공 | 같다 |
| 글이 공개되거나 숨겨지는 다른 길 — 13-1 운영자 숨김·복구, 13-2 신고 수락으로 글 숨김, 11-1 임시저장 발행, 11-5 휴지통 복구 | 각 변경 메서드에서 같은 캐시를 무효화한다. 신고 거절·댓글 처리에는 글의 노출 상태가 바뀌지 않는다 |
| 15-3 예약 발행 배치 | 실제 발행이 1건 이상이고 커밋됐을 때만 비운다. 매분 실행되는 0건 배치가 캐시를 비우면 60초 재사용이 깨진다 |
| 좋아요·댓글 | 비우지 않는다 — 점수는 60초 늦게 반영돼도 된다(TTL에 맡김) |

숨김·삭제가 커밋되기 직전, 다른 GET이 옛 공개 글을 읽고 커밋 뒤에 캐시에 채울 수도 있다. 그래서 변경 서비스는 성공 경로에서 `PopularCacheVersion.invalidateAfterCommit()`을 등록한다.

커밋 뒤 세대가 증가하면 그 GET이 이전 세대 키에 옛 글을 넣어도 이후 조회는 새 세대 키를 사용한다. 캐시도 함께 비워 메모리를 회수한다.

예약 발행 0건과 롤백은 세대를 바꾸지 않는다. 이 방법은 **한 JVM** 안의 동시 요청을 다룬다.

**입력 규칙** — 무효화를 일으키는 `PATCH /api/posts/{id}`. 3-1 규칙 그대로다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 선택 | `null`(필드 없음)이면 그대로. 빈 값·공백만은 안 됨 | 1~200자 | — | 그대로 | `400` |
| `content` | 선택 | `null`이면 그대로. 빈 값·공백만은 안 됨 | — | — | 그대로 | `400` |
| `tags` | 선택 | `null`이면 그대로 | 0~5개, 이름 1~30자 | — | 그대로 | `400` |
| `visibility` | 선택 | `null`이면 그대로 | — | `PUBLIC` 또는 `FOLLOWERS` | 그대로 | `400` |
| 경로 `{id}` | 필수 | — | — | 숫자 | — | 없는 글 `404`, 남의 글 `403` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 캐시에 없을 때만 실행 → 결과를 현재 세대의 논리 키 7:10으로 60초 보관
- @Cacheable이 같은 세대의 키 7:10을 찾아 서비스 본문을 건너뛴다 — SQL 없음
- 수정 성공 → @CacheEvict(allEntries = true)로 popularPosts 캐시를 통째로 비운다. 발행 0건 배치는 HIT를 유지한다

<details>
<summary>Controller — HTTP 연결</summary>

`PopularPostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 변경된 메서드: `popular`.

`src/main/java/org/example/post/PopularPostController.java`

```java
package org.example.post;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// /api/posts/popular는 PostController의 /api/posts/{id}보다 구체적인 경로라 이쪽이 먼저 매칭된다.
// 별도 컨트롤러로 둔 이유: PostController의 슬라이스 테스트(7-1)에 새 협력 객체를 끌어들이지 않으려고.
@RestController
public class PopularPostController {

    private final PopularPostService popularPostService;

    public PopularPostController(PopularPostService popularPostService) {
        this.popularPostService = popularPostService;
    }

    // 16-3 응답 본문은 그대로(배열), 캐시에서 꺼냈으면 X-Cache: HIT, 이번에 계산했으면 MISS
    @GetMapping("/api/posts/popular")
    public ResponseEntity<List<PopularPostResponse>> popular(@RequestParam(value = "days", required = false) String days,
                                                             @RequestParam(value = "limit", required = false) String limit) {
        long started = System.nanoTime();
        PopularSnapshot snapshot = popularPostService.popular(parseBounded(days, 7, 30, "days"),
                parseBounded(limit, 10, 50, "limit"));
        String cache = snapshot.loadedAtNanos() < started ? "HIT" : "MISS";
        return ResponseEntity.ok().header("X-Cache", cache).body(snapshot.items());
    }
    // 파라미터 생략만 기본값을 쓴다. ?days=처럼 빈 값은 잘못된 숫자이므로 400이다.
    private int parseBounded(String raw, int defaultValue, int max, String name) {
        if (raw == null) return defaultValue;
        if (!raw.matches("[0-9]+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + "는 1~" + max + " 사이여야 합니다.");
        try {
            int value = Integer.parseInt(raw);
            if (value >= 1 && value <= max) return value;
        } catch (NumberFormatException ignored) {
            // int 범위를 넘는 긴 숫자도 400으로 돌린다.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + "는 1~" + max + " 사이여야 합니다.");
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PopularPostService.java`의 `popular`에 `@Cacheable`을 붙여 같은 `(days, limit, 세대)` 조회를 60초 재사용한다. `PostService.java`·`ModerationService.java`·`ReportHandlingService.java`는 해당 글 변경 성공 시 `@CacheEvict`로 비우고, 커밋 뒤 세대도 올린다.

매분 실행되는 `ScheduledPublishService.java`는 실제 발행이 있을 때만 커밋 뒤 세대를 올리고 캐시를 비운다. 각 쓰기 메서드의 트랜잭션 경계와 무효화 시점을 아래 코드에서 확인한다.

`src/main/java/org/example/post/PopularPostService.java`

```java
package org.example.post;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

// 최근 N일 인기글 — "지금"은 LocalDateTime.now()가 아니라 주입받은 Clock에서 얻는다
// (practice 프로파일은 app.fixed-now로 2026-10-05 00:00에 고정)
@Service
public class PopularPostService {

    private final PostRepository postRepository;
    private final Clock clock;

    public PopularPostService(PostRepository postRepository, Clock clock) {
        this.postRepository = postRepository;
        this.clock = clock;
    }

    // 기간은 [지금 - days, 지금) — 끝(지금)은 포함하지 않는다
    // 16-3 (days, limit)마다 60초 캐시. 캐시에 있으면 이 메서드 본문(쿼리)이 아예 실행되지 않는다
    @Cacheable(cacheNames = CacheConfig.POPULAR_POSTS, key = "#days + ':' + #limit + ':' + @popularCacheVersion.current()")
    @Transactional(readOnly = true)
    public PopularSnapshot popular(int days, int limit) {
        LocalDateTime to = LocalDateTime.now(clock);
        LocalDateTime from = to.minusDays(days);
        List<PopularPostResponse> items = postRepository.findPopular(from, to, limit).stream()
                .map(r -> new PopularPostResponse(r.getPostId(), r.getTitle(), r.getScore(), r.getLikes(), r.getComments()))
                .toList();
        return new PopularSnapshot(items, System.nanoTime());
    }
}
```

`src/main/java/org/example/admin/ModerationService.java`

```java
package org.example.admin;

import org.example.auth.AuthenticatedMember;
import org.example.member.Member;
import org.example.member.MemberNotFoundException;
import org.example.member.MemberRepository;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import org.example.post.CacheConfig;
import org.example.post.PopularCacheVersion;
import org.springframework.cache.annotation.CacheEvict;

// 13-1 운영 — 권한 확인은 PermissionInterceptor가 끝냈다. 여기는 상태 규칙만 본다.
@Service
public class ModerationService {

    private static final String WITHDRAWN = "WITHDRAWN";

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;
    private final PopularCacheVersion popularCacheVersion;

    public ModerationService(PostRepository postRepository, MemberRepository memberRepository, Clock clock, PopularCacheVersion popularCacheVersion) {
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
        this.popularCacheVersion = popularCacheVersion;
    }

    // 없는 글·삭제된 글 404 → 임시저장 409 → 숨기기/복구(이미 그 상태면 그대로 — 처음 숨긴 사람·시각 유지)
    // 16-3 운영자 숨김·복구(13-1)는 인기글에서 빠지거나 돌아온다 — 인기글 캐시를 비운다
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true)
    @Transactional
    public PostStatusResponse changePostStatus(AuthenticatedMember me, Long postId, String status) {
        // 숨김 요청 둘이 동시에 와도 첫 hiddenBy/hiddenAt을 보존하도록 글 행을 잠근다.
        Post post = postRepository.findByIdForUpdate(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(PostNotFoundException::new);
        if ("HIDDEN".equals(status)) {
            // DATETIME은 초 단위다 — 소수 초를 그대로 넘기면 MySQL이 반올림해 저장해서(…:09.51 → :10)
            // 이번 응답의 hiddenAt과 다음에 읽은 값이 달라진다. 저장할 값을 미리 초로 자른다
            post.hide(memberRepository.getReferenceById(me.id()), LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS));
        } else {
            post.unhide();
        }
        popularCacheVersion.invalidateAfterCommit();
        return toStatusResponse(post);
    }

    // 운영자(ADMIN)의 역할은 API로 바꾸지 않는다(자기 강등으로 운영자가 0명이 되는 사고 방지) — 409
    @Transactional
    public MemberRoleResponse changeRole(Long memberId, String role) {
        Member member = memberRepository.findByIdForUpdate(memberId)
                .filter(m -> !WITHDRAWN.equals(m.getMemberStatus()) && m.getDeletedAt() == null)
                .orElseThrow(MemberNotFoundException::new);
        if (Role.ADMIN.name().equals(member.getRole())) {
            throw new ModerationConflictException("운영자의 역할은 바꿀 수 없습니다.");
        }
        if (Role.MODERATOR.name().equals(role) && member.isSuspendedAt(LocalDateTime.now(clock))) {
            throw new ModerationConflictException("기간 정지 중에는 운영진으로 승격할 수 없습니다. 먼저 정지를 해제하세요.");
        }
        member.changeRole(role);
        return new MemberRoleResponse(member.getId(), member.getNickname(), member.getRole());
    }

    static PostStatusResponse toStatusResponse(Post post) {
        Member by = post.getHiddenBy();
        return new PostStatusResponse(post.getId(), post.getStatus(),
                by == null ? null : new AuthorResponse(by.getId(), by.getNickname()), post.getHiddenAt());
    }
}
```

`src/main/java/org/example/batch/ScheduledPublishService.java`

```java
package org.example.batch;

import org.example.post.Post;
import org.example.notification.PostCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.example.post.PopularCacheVersion;

// 15-3 예약 발행 — 기준 시각(at)이 예약 시각 이상이 된 SCHEDULED 글을 PUBLISHED로 바꾼다.
// 1분마다 도는 예약 실행과 운영자 수동 실행이 같은 메서드를 쓴다.
@Service
public class ScheduledPublishService {

    // 한 번에 너무 많이 잡지 않는다 — 남은 건 다음 분에 이어서
    private static final int BATCH_LIMIT = 500;
    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishService.class);

    private final ScheduledPublishRepository scheduledPublishRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PopularCacheVersion popularCacheVersion;
    private final Clock clock;

    public ScheduledPublishService(ScheduledPublishRepository scheduledPublishRepository, ApplicationEventPublisher eventPublisher, PopularCacheVersion popularCacheVersion, Clock clock) {
        this.scheduledPublishRepository = scheduledPublishRepository;
        this.eventPublisher = eventPublisher;
        this.popularCacheVersion = popularCacheVersion;
        this.clock = clock;
    }

    // 실제로 예약 글을 발행하고 커밋했을 때만 캐시를 비운다. 매분 도는 0건 배치는 HIT를 유지한다.
    @Transactional
    public ScheduledPublishResponse publishDue(LocalDateTime at) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<PublishedPost> published = new ArrayList<>();
        for (Post post : scheduledPublishRepository.findDue(at, PageRequest.of(0, BATCH_LIMIT))) {
            if (scheduledPublishRepository.publishIfDue(post.getId(), at, now) == 1) {
                published.add(new PublishedPost(post.getId(), post.getTitle(), post.getPublishAt()));
                // 실제로 상태를 바꾼 실행만 알린다. 트랜잭션이 롤백되면 AFTER_COMMIT 리스너는 실행되지 않는다.
                eventPublisher.publishEvent(new PostCreatedEvent(post.getId(), post.getAuthor().getId()));
            }
        }
        // 매분 도는 배치라 0건이면 조용히(디버그), 발행했을 때만 INFO로 건수와 id를 남긴다
        if (published.isEmpty()) {
            log.debug("예약 발행 at={} 0건", at);
        } else {
            log.info("예약 발행 at={} {}건 ids={}", at, published.size(), published.stream().map(PublishedPost::postId).toList());
            popularCacheVersion.invalidateAfterCommit();
        }
        return new ScheduledPublishResponse(at, published);
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
                post.getStatus(), post.getPublishAt(), post.getPublishedAt(), post.getCreatedAt());
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

`src/main/java/org/example/report/ReportHandlingService.java`

```java
package org.example.report;

import org.example.auth.AuthenticatedMember;
import org.example.comment.Comment;
import org.example.comment.CommentRepository;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.example.post.CacheConfig;
import org.example.post.PopularCacheVersion;
import org.springframework.cache.annotation.CacheEvict;

// 13-2 신고 처리 — 대상별로 묶어 보여 주고, 대상 하나의 대기 신고를 한 번에 처리한다
@Service
public class ReportHandlingService {

    private static final int PREVIEW_LENGTH = 50;

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;
    private final PopularCacheVersion popularCacheVersion;

    public ReportHandlingService(ReportRepository reportRepository, PostRepository postRepository,
                                 CommentRepository commentRepository, MemberRepository memberRepository, Clock clock, PopularCacheVersion popularCacheVersion) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
        this.popularCacheVersion = popularCacheVersion;
    }

    // 묶음 목록 + 미리보기(글 제목·댓글 내용)는 종류별 IN 한 번씩 — 묶음마다 대상을 따로 조회하지 않는다
    @Transactional(readOnly = true)
    public ReportGroupPageResponse groups(String status, int page, int size) {
        List<ReportGroupRow> rows = reportRepository.findGroups(status, size + 1, (long) page * size);
        boolean hasNext = rows.size() > size;
        List<ReportGroupRow> pageRows = hasNext ? rows.subList(0, size) : rows;

        Map<Long, String> postTitles = postRepository.findAllById(idsOf(pageRows, ReportService.POST)).stream()
                .filter(p -> p.getDeletedAt() == null)
                .collect(Collectors.toMap(Post::getId, Post::getTitle));
        Map<Long, String> commentTexts = commentRepository.findAllById(idsOf(pageRows, ReportService.COMMENT)).stream()
                .filter(c -> c.getDeletedAt() == null)
                .collect(Collectors.toMap(Comment::getId, c -> cut(c.getContent())));

        List<ReportGroupResponse> items = pageRows.stream()
                .map(r -> new ReportGroupResponse(r.getTargetType(), r.getTargetId(),
                        (ReportService.POST.equals(r.getTargetType()) ? postTitles : commentTexts).get(r.getTargetId()),
                        r.getReportCount(), Arrays.asList(r.getReasons().split(",")),
                        r.getFirstReportedAt(), r.getLastReportedAt()))
                .toList();
        return new ReportGroupPageResponse(items, page, size, reportRepository.countGroups(status), hasNext);
    }

    // 1) 대기 신고를 조건부 UPDATE로 "가져간다" — 두 사람이 동시에 처리해도 한쪽만 1행 이상을 얻는다
    // 2) 가져간 쪽만 대상에 조치한다(HIDE: 글 숨김·댓글 삭제). 0행이면 이미 처리됐거나 신고가 없다
    // 신고 수락으로 글을 숨긴 경우만 인기글 캐시를 비운다. 거절·댓글 처리에는 글 순위가 그대로다.
    @CacheEvict(cacheNames = CacheConfig.POPULAR_POSTS, allEntries = true,
            condition = "#p1.action() == 'HIDE' && #p1.targetType() == 'POST'")
    @Transactional
    public ResolveResponse resolve(AuthenticatedMember me, ResolveRequest request) {
        String newStatus = "HIDE".equals(request.action()) ? "ACCEPTED" : "REJECTED";
        LocalDateTime now = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
        int updated = reportRepository.resolvePending(request.targetType(), request.targetId(), newStatus, me.id(), now);
        if (updated == 0) {
            if (!reportRepository.existsByTargetTypeAndTargetId(request.targetType(), request.targetId())) {
                throw new ReportTargetNotFoundException();
            }
            throw new NothingToResolveException();
        }
        String targetStatus = "HIDE".equals(request.action()) ? applyHide(me, request, now) : null;
        if ("HIDE".equals(request.action()) && ReportService.POST.equals(request.targetType())) {
            popularCacheVersion.invalidateAfterCommit();
        }
        return new ResolveResponse(request.targetType(), request.targetId(), request.action(), updated, targetStatus);
    }

    // 글은 13-1의 숨김(누가·언제 기록), 댓글은 5-3의 삭제와 같은 규칙(soft delete + comment_count 1 감소)
    private String applyHide(AuthenticatedMember me, ResolveRequest request, LocalDateTime now) {
        if (ReportService.POST.equals(request.targetType())) {
            return postRepository.findByIdForUpdate(request.targetId())
                    .filter(p -> p.getDeletedAt() == null)
                    .map(p -> {
                        p.hide(memberRepository.getReferenceById(me.id()), now);
                        return p.getStatus();
                    })
                    .orElse("DELETED");
        }
        commentRepository.findById(request.targetId())
                .filter(c -> c.getDeletedAt() == null)
                .ifPresent(c -> {
                    if (commentRepository.softDeleteIfLive(c.getId(), now) == 1
                            && postRepository.decrementCommentCount(c.getPost().getId()) != 1) {
                        throw new IllegalStateException("댓글 수 갱신에 실패했습니다.");
                    }
                });
        return "DELETED";
    }

    private static List<Long> idsOf(List<ReportGroupRow> rows, String type) {
        return rows.stream().filter(r -> type.equals(r.getTargetType())).map(ReportGroupRow::getTargetId).toList();
    }

    private static String cut(String text) {
        return text.codePointCount(0, text.length()) <= PREVIEW_LENGTH
                ? text : text.substring(0, text.offsetByCodePoints(0, PREVIEW_LENGTH));
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`build.gradle`, `CorsConfig.java`, `CacheConfig.java`, `PopularSnapshot.java`, `application.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

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
    }
}
```

`src/main/java/org/example/post/CacheConfig.java`

```java
package org.example.post;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

// 16-3 캐시 켜기 — 캐시 이름·크기·TTL은 application.yml(spring.cache.*)에서 Caffeine으로 정한다
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String POPULAR_POSTS = "popularPosts";
}
```

`src/main/java/org/example/post/PopularSnapshot.java`

```java
package org.example.post;

import java.util.List;

// 16-3 캐시에 넣는 값 — 인기글 목록과 "언제 계산했는지"(System.nanoTime).
// 컨트롤러는 계산 시각이 이번 요청보다 앞이면 캐시에서 꺼낸 것(HIT)으로 본다.
// 캐시는 같은 객체를 여러 요청이 나눠 쓰므로 불변(record + 수정 불가 List)이어야 한다.
public record PopularSnapshot(List<PopularPostResponse> items, long loadedAtNanos) {
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
```

</details>

<details>
<summary>Service — 커밋 후 캐시 세대 / PopularCacheVersion.java</summary>

`src/main/java/org/example/post/PopularCacheVersion.java`

```java
package org.example.post;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.atomic.AtomicLong;

// 커밋 직전에 시작한 GET이 옛 공개 글을 늦게 캐시에 넣어도 이전 세대 키에만 남도록 한다.
@Component
public class PopularCacheVersion {

    private final AtomicLong generation = new AtomicLong();
    private final CacheManager cacheManager;

    public PopularCacheVersion(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public long current() {
        return generation.get();
    }

    public void invalidateAfterCommit() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("인기글 캐시 무효화에는 활성 트랜잭션이 필요합니다.");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                generation.incrementAndGet();
                Cache cache = cacheManager.getCache(CacheConfig.POPULAR_POSTS);
                if (cache != null) cache.clear();
            }
        });
    }
}
```

</details>

## MyBatis 대체 구현

기본 JPA 스냅숏에서 인기글 집계 SQL을 MyBatis Mapper로 옮긴다. `PopularPostService`의 `@Cacheable`, `PopularSnapshot`, 컨트롤러의 `X-Cache`, 앞 절의 무효화 코드도 그대로 사용한다. 아래 여섯 파일을 기본 스냅숏에 적용한다.

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
<summary>Service — MyBatis 조회 결과 60초 캐시 — PopularPostService.java</summary>

`src/main/java/org/example/post/PopularPostService.java`

```java
package org.example.post;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

// 최근 N일 인기글 — "지금"은 LocalDateTime.now()가 아니라 주입받은 Clock에서 얻는다
// (practice 프로파일은 app.fixed-now로 2026-10-05 00:00에 고정)
@Service
public class PopularPostService {

    private final MyBatisPopularPostMapper popularPostMapper;
    private final Clock clock;

    public PopularPostService(MyBatisPopularPostMapper popularPostMapper, Clock clock) {
        this.popularPostMapper = popularPostMapper;
        this.clock = clock;
    }

    // 기간은 [지금 - days, 지금) — 끝(지금)은 포함하지 않는다
    // 16-3 (days, limit)마다 60초 캐시. 캐시에 있으면 이 메서드 본문(쿼리)이 아예 실행되지 않는다
    @Cacheable(cacheNames = CacheConfig.POPULAR_POSTS, key = "#days + ':' + #limit + ':' + @popularCacheVersion.current()")
    @Transactional(readOnly = true)
    public PopularSnapshot popular(int days, int limit) {
        LocalDateTime to = LocalDateTime.now(clock);
        LocalDateTime from = to.minusDays(days);
        List<PopularPostResponse> items = popularPostMapper.findPopular(from, to, limit).stream()
                .map(r -> new PopularPostResponse(r.getPostId(), r.getTitle(), r.getScore(), r.getLikes(), r.getComments()))
                .toList();
        return new PopularSnapshot(items, System.nanoTime());
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 인기글 조회 — MyBatisPopularPostMapper.java</summary>

`src/main/java/org/example/post/MyBatisPopularPostMapper.java`

```java
package org.example.post;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface MyBatisPopularPostMapper {
    List<PopularPostRow> findPopular(@Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to,
                                     @Param("limit") int limit);
}
```

</details>

<details>
<summary>DTO — MyBatis 집계 결과 행 — PopularPostRow.java</summary>

`src/main/java/org/example/post/PopularPostRow.java`

```java
package org.example.post;

// MyBatis 결과 행: XML의 snake_case 별칭을 camelCase setter로 받는다.
public class PopularPostRow {
    private Long postId;
    private String title;
    private long score;
    private long likes;
    private long comments;

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public long getScore() { return score; }
    public void setScore(long score) { this.score = score; }
    public long getLikes() { return likes; }
    public void setLikes(long likes) { this.likes = likes; }
    public long getComments() { return comments; }
    public void setComments(long comments) { this.comments = comments; }
}
```

</details>

<details>
<summary>Mapper XML — 좋아요·댓글 기간 집계 — MyBatisPopularPostMapper.xml</summary>

`src/main/resources/mapper/MyBatisPopularPostMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.MyBatisPopularPostMapper">
    <select id="findPopular" resultType="org.example.post.PopularPostRow">
        SELECT p.id AS post_id, p.title,
               COALESCE(l.cnt, 0) * 3 + COALESCE(c.cnt, 0) AS score,
               COALESCE(l.cnt, 0) AS likes, COALESCE(c.cnt, 0) AS comments
          FROM post p
          LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM post_like
                     WHERE created_at &gt;= #{from} AND created_at &lt; #{to}
                     GROUP BY post_id) l ON l.post_id = p.id
          LEFT JOIN (SELECT post_id, COUNT(*) AS cnt FROM comment
                     WHERE deleted_at IS NULL AND created_at &gt;= #{from} AND created_at &lt; #{to}
                     GROUP BY post_id) c ON c.post_id = p.id
         WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
           AND (l.cnt IS NOT NULL OR c.cnt IS NOT NULL)
         ORDER BY score DESC, p.published_at DESC, p.id DESC
         LIMIT #{limit}
    </select>
</mapper>
```

</details>

## 직접 확인

학습용 DB에서 8-2 인기글 3위인 144번 글은 회원 5(`tok-p05`)가 썼다.

```bash
BASE=http://localhost:8080
P5='Authorization: Bearer tok-p05'; J='Content-Type: application/json'
pop() { curl -s -D - -o /dev/null "$BASE/api/posts/popular?days=7&limit=10" | grep -i x-cache; }
has144() { curl -s "$BASE/api/posts/popular?days=7&limit=10" | grep -o '"postId":144' || echo '144 없음'; }

pop; pop                                                                    # MISS, HIT (60초 안에 다시 부르면 HIT)
curl -s -X PATCH "$BASE/api/posts/144" -H "$P5" -H "$J" -d '{"visibility":"SECRET"}'; echo   # 400 — 캐시는 그대로
pop                                                                         # HIT
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/144" -H "$P5" -H "$J" -d '{"visibility":"FOLLOWERS"}'
pop; has144                                                                 # MISS, 144 없음
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/144" -H "$P5" -H "$J" -d '{"visibility":"PUBLIC"}'   # 되돌리기
curl -s -D - -o /dev/null -H 'Origin: http://localhost:3000' "$BASE/api/posts/popular?days=7&limit=10" | grep -i expose   # X-Cache가 들어 있어야 한다
```

앱 로그에서 `SELECT p.id AS postId` 로 시작하는 인기글 SQL이 **`MISS`일 때만** 찍히는지 본다. `HIT`일 때는 SQL이 한 줄도 없다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 144번은 제목을 200자로 바꿨다가(B1) 원래 제목으로 되돌리고(B2), 숨겼다가(H) 다시 전체 공개로(U) 되돌린다. 중간에 끊기면 144번 제목·공개 범위가 바뀐 채 남을 수 있으니 한 번 더 실행한다.

```check
{
  "requests": [
    {
      "id": "D0",
      "title": "144번 글 원래 값",
      "method": "GET",
      "path": "/api/posts/144"
    },
    {
      "id": "Y0",
      "title": "처음 상태로(전체 공개)",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "Y1",
      "title": "인기글 1번째",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "Y2",
      "title": "인기글 2번째(곧바로)",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "Z",
      "title": "발행 대상 없는 예약 배치",
      "method": "POST",
      "path": "/api/admin/jobs/scheduled-publish/run?at=2026-10-05T00:00:00",
      "headers": {"Authorization": "Bearer tok-p01"}
    },
    {
      "id": "Y2B",
      "title": "0건 배치 뒤에도 인기글 캐시 재사용",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "X1",
      "title": "잘못된 입력 — 없는 공개 범위",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "visibility": "SECRET"
      }
    },
    {
      "id": "X2",
      "title": "잘못된 입력 — 공백 제목·태그 6개",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "title": "   ",
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ]
      }
    },
    {
      "id": "X3",
      "title": "잘못된 입력 — 제목 201자",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "X4",
      "title": "없는 글",
      "method": "PATCH",
      "path": "/api/posts/999999",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "visibility": "FOLLOWERS"
      }
    },
    {
      "id": "X5",
      "title": "남의 글(회원 7)",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p07"
      },
      "body": {
        "visibility": "FOLLOWERS"
      }
    },
    {
      "id": "Y3",
      "title": "실패한 수정 뒤 인기글",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "B1",
      "title": "경계값 — 제목 200자",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "B2",
      "title": "제목 원래대로",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "title": "{{D0.body.title}}"
      }
    },
    {
      "id": "H",
      "title": "144번 숨기기(팔로워 공개)",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "visibility": "FOLLOWERS"
      }
    },
    {
      "id": "Y4",
      "title": "숨긴 직후 인기글",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "Y5",
      "title": "한 번 더",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    },
    {
      "id": "U",
      "title": "다시 전체 공개",
      "method": "PATCH",
      "path": "/api/posts/144",
      "headers": {
        "Authorization": "Bearer tok-p05"
      },
      "body": {
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "Y6",
      "title": "되돌린 직후 인기글",
      "method": "GET",
      "path": "/api/posts/popular?days=7&limit=10"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "Y1",
          "expect": {
            "status": 200,
            "headers": {
              "X-Cache": {
                "matches": "^(HIT|MISS)$"
              }
            },
            "json": [
              {
                "path": "$[*].postId",
                "contains": 144
              }
            ]
          }
        },
        {
          "request": "Y2",
          "expect": {
            "status": 200,
            "headers": {
              "X-Cache": {
                "equals": "HIT"
              }
            },
            "json": [
              {
                "path": "$[*].postId",
                "contains": 144
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {"request": "Z", "expect": {"status": 200, "json": [{"path": "$.published", "length": 0}]}},
        {"request": "Y2B", "expect": {"status": 200, "headers": {"X-Cache": {"equals": "HIT"}}, "json": [{"path": "$[*].postId", "contains": 144}]}}
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "X1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "visibility"
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
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "X4",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "X5",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "Y3",
          "expect": {
            "status": 200,
            "headers": {"X-Cache": {"equals": "HIT"}},
            "json": [
              {
                "path": "$[*].postId",
                "contains": 144
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.title",
                "length": 200
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.title",
                "equals": "{{D0.body.title}}"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "H",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.visibility",
                "equals": "FOLLOWERS"
              }
            ]
          }
        },
        {
          "request": "Y4",
          "expect": {
            "status": 200,
            "headers": {
              "X-Cache": {
                "equals": "MISS"
              }
            },
            "json": [
              {
                "path": "$[*].postId",
                "notContains": 144
              }
            ]
          }
        },
        {
          "request": "Y5",
          "expect": {
            "status": 200,
            "headers": {
              "X-Cache": {
                "equals": "HIT"
              }
            },
            "json": [
              {
                "path": "$[*].postId",
                "notContains": 144
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "U",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.visibility",
                "equals": "PUBLIC"
              }
            ]
          }
        },
        {
          "request": "Y6",
          "expect": {
            "status": 200,
            "headers": {
              "X-Cache": {
                "equals": "MISS"
              }
            },
            "json": [
              {
                "path": "$[*].postId",
                "contains": 144
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C6",
      "manual": "Y2 뒤 60초 넘게 기다렸다가 인기글을 다시 부르면 X-Cache: MISS — TTL로 만료됐다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | 실행 칸을 돌린 뒤 `SELECT title, visibility FROM post WHERE id = 144` | `예외 처리 전략 정리`, `PUBLIC` — 실행 칸이 바꾼 것을 다 되돌렸다 |
| C1 | Y1 / Y2 | 둘 다 `200`·144 포함, Y2는 `X-Cache: HIT` |
| C2 | X1~X5 / Y3 | `400`(`visibility`) · `400`(`title`, 태그 6개) · `400`(제목 201자) · `404` · `403` — 어느 것도 `500`이 아니다 / 실패한 수정 뒤에도 `HIT`이며 144가 그대로 있다 |
| C3 | B1 / B2 | 제목 200자(상한 바로 안쪽)는 `200` / 원래 제목으로 되돌아온다 |
| C4 | H / Y4 / Y5 | 숨김 `200` / **바로** `X-Cache: MISS`이고 144가 없다 / 다시 부르면 `HIT`이고 여전히 없다(144 없는 결과가 캐시에 들어갔다) |
| C5 | U / Y6 | 되돌림 `200` / `MISS`, 144가 다시 있다 |
| C6 | 수동 | Y2 뒤 60초 넘게 기다렸다가 다시 부르면 `MISS` — TTL로 만료됐다 |
| C7 | Z / Y2B | 발행 0건 배치 `200 published=[]` 뒤에도 곧바로 `X-Cache: HIT`, 144번 그대로 — 빈 배치는 캐시를 비우지 않는다 |
| R1 | 키 | 캐시 키가 `days`·`limit`를 다 담는다. `limit=3`과 `limit=10`이 같은 키면 무엇이 틀리는지 설명할 수 있다 |
| R2 | 무효화 범위 | "보이면 안 되는 변경"(공개 범위·삭제·숨김)은 즉시 비우고, "숫자만 바뀌는 변경"(좋아요·댓글)은 TTL에 맡긴다. 그 기준을 말할 수 있다 |
| R3 | 불변 값 | 캐시에 넣은 목록을 꺼내서 고치지 않는다(record + `.toList()`). 고치면 다음 요청이 그 고친 값을 받는다 |
| R4 | 경합·한계 | `@CacheEvict`만 있으면 커밋 전 GET이 옛 값을 나중에 다시 채울 수 있다. 커밋 뒤 세대 증가로 한 JVM에서는 옛 키를 더 이상 읽지 않는다. 서버가 두 대면 각 서버의 세대가 따로라 Redis 같은 공용 캐시나 무효화 메시지가 필요하다 |

## 필요한 지식

- [W17 — B. 한 JVM에서 Caffeine](../../docs/knowledge/W17-where-to-cache.md#b-한-jvm에서-caffeine-미실행)
- [W23 — 생명주기와 정합성](../../docs/knowledge/W23-cache-and-in-memory.md#생명주기와-정합성)
- [W23 — 캐시에 TTL을 지정했으면 무효화 로직은 필요 없는가?](../../docs/knowledge/W23-cache-and-in-memory.md#q5-캐시에-ttl을-지정했으면-무효화-로직은-필요-없는가)
- [S11 — 메서드 캐시 호출 흐름](../../docs/knowledge/S11-cache-redis-migration.md#메서드-캐시-호출-흐름)
- [S11 — 만료와 스탬피드](../../docs/knowledge/S11-cache-redis-migration.md#만료와-스탬피드)
- [8-2. 최근 N일 인기글 랭킹](../ch8-query-deep/8-2-popular-ranking.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 계속 MISS다</summary>

- `@EnableCaching`이 없으면 `@Cacheable`이 조용히 무시된다.
- `@Cacheable`도 프록시가 가로챈다. 같은 서비스 안에서 `this.popular(...)`로 부르면 캐시를 거치지 않는다. 컨트롤러가 서비스 빈을 직접 불러야 한다.
- 키에 매번 달라지는 값(현재 시각 등)이 들어가면 매번 새 키다.
</details>

<details>
<summary>힌트 2 — 컨트롤러 모양</summary>

```java
@GetMapping("/api/posts/popular")
public ResponseEntity<List<PopularPostResponse>> popular(@RequestParam(defaultValue = "7") @Min(1) @Max(30) int days,
                                                         @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit) {
    long started = System.nanoTime();
    PopularSnapshot snapshot = popularPostService.popular(days, limit);
    String cache = snapshot.loadedAtNanos() < started ? "HIT" : "MISS";
    return ResponseEntity.ok().header("X-Cache", cache).body(snapshot.items());
}
```
</details>

<details>
<summary>힌트 3 — 숨겼는데 그대로 HIT</summary>

`@CacheEvict`의 `cacheNames`가 `@Cacheable`과 같은 이름인지 본다. `allEntries = true`가 없으면 `key`를 따로 정해야 하는데, PATCH 메서드의 인자(id, 회원, 요청)로는 `7:10` 같은 인기글 키를 만들 수 없다.
</details>

## 다음 단계

[16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기](16-4-link-preview.md)
