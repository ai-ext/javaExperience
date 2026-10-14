# 13-1. 운영 역할 — 모더레이터와 글 숨김·복구

> 시나리오 DB(`community`) — 앱을 **기본 프로파일**로 띄운다(12장은 `practice`였다). 13장의 기간 정지(13-3)와 도배 방지(13-5)는 실제로 흐르는 시간이 필요하다. 그래서 시계를 `2026-10-05`에 고정한 practice가 아니라 시스템 시계를 쓰는 community로 돌아온다. 13장은 Flyway V40~V49를 쓴다.

## 상황

> "신고 처리를 운영자 한 명이 다 하니까 밀려요. 커뮤니티 매니저 몇 분께 '글 숨기기·복구'만 맡기고 싶어요. 대신 정합성 배치나 권한 주기 같은 건 운영자만 하게요. 그리고 숨긴 글은 나중에 '누가 언제 숨겼는지' 꼭 알아야 해요."

지금 코드에는 운영 권한이 문자열 비교로 흩어져 있다. 8-5의 `if (!"ADMIN".equals(me.role()))`, 2-3 `PostAccessPolicy`의 `ADMIN_ROLE`, 글 삭제의 `isAdmin`이 그렇다. 역할이 하나(ADMIN) 늘 때마다 이런 `if`를 다 찾아 고쳐야 한다. 이번에는 두 가지를 한다.

- **역할 → 권한 표를 한 곳에** 둔다. 컨트롤러에는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"만 적는다. 확인은 인터셉터 한 곳에서 한다.
- **모더레이터(`MODERATOR`)** 역할을 더하고, 글 숨김·복구 API를 만든다. 숨길 때 **누가·언제** 숨겼는지 남긴다.

> 티켓 [T-013](../../tickets/013-admin-hide-post.md)이 같은 숨김·복구 API를 운영자 하나 기준으로 다룬다. 이 단계는 그 API 모양(`PATCH /api/admin/posts/{id}/status`)을 그대로 쓰고, 그 위에 **역할·권한 체계**와 숨김 기록을 더한다. T-013의 R3("숨긴 시각이 없다")에 대한 답이 V41이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 — 역할과 숨김",
  "summary": "운영자가 회원에게 MODERATOR를 주면, 그 회원은 글 숨김·복구만 할 수 있다. 권한 확인은 인터셉터 한 곳.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "운영 도구", "right": "동시성01 (MODERATOR)" },
    { "type": "select", "id": "role", "label": "회원 7의 역할", "value": "MODERATOR" },
    {
      "type": "list",
      "id": "post",
      "items": [{ "id": "p-12", "title": "자유글 01", "meta": "이스프링 · free · 숨김: 동시성01, 방금 전", "badge": "숨김", "tone": "warning" }]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        { "id": "hide", "label": "숨기기", "variant": "danger" },
        { "id": "restore", "label": "복구", "variant": "secondary" },
        { "id": "recount", "label": "숫자 다시 맞추기(운영자만)", "variant": "ghost" }
      ]
    },
    { "type": "toast", "id": "toast-forbidden", "value": "이 작업을 할 권한이 없습니다.", "tone": "error" }
  ],
  "flows": [
    {
      "name": "역할 주기",
      "steps": [
        { "kind": "user", "text": "운영자가 회원 7의 역할을 MODERATOR로 바꾼다", "focus": ["role"] },
        { "kind": "request", "method": "PATCH", "path": "/api/admin/members/7/role", "headers": ["Authorization: Bearer tok-admin", "Content-Type: application/json"], "body": "{\"role\": \"MODERATOR\"}" },
        { "kind": "server", "text": "AuthInterceptor(누구인가) → PermissionInterceptor(@RequirePermission(MANAGE_ROLE) — ADMIN만) → 회원 찾기(404) → 운영자면 409 → 역할 변경" },
        { "kind": "db", "sql": "UPDATE member SET role = 'MODERATOR' WHERE id = 7", "note": "V40에서 CHECK가 MODERATOR를 허용" },
        { "kind": "response", "status": 200, "body": "{\"id\": 7, \"nickname\": \"동시성01\", \"role\": \"MODERATOR\"}" },
        { "kind": "screen", "text": "역할이 바뀐다", "focus": ["role"] }
      ]
    },
    {
      "name": "모더레이터가 숨기기",
      "steps": [
        { "kind": "user", "text": "회원 7이 글 12의 [숨기기]", "focus": ["hide"] },
        { "kind": "request", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": ["Authorization: Bearer tok-c01", "Content-Type: application/json"], "body": "{\"status\": \"HIDDEN\"}" },
        { "kind": "server", "text": "권한 MODERATE_POST(ADMIN·MODERATOR) → 글 찾기(없음·삭제 404) → 임시저장 409 → 숨김 + 누가·언제 기록(이미 숨김이면 그대로)" },
        { "kind": "db", "sql": "UPDATE post SET status = 'HIDDEN', hidden_at = NOW(), hidden_by = 7 WHERE id = 12" },
        { "kind": "response", "status": 200, "body": "{\"id\": 12, \"status\": \"HIDDEN\", \"hiddenBy\": {\"id\": 7, \"nickname\": \"동시성01\"}, \"hiddenAt\": \"2026-10-10T15:40:00\"}" },
        { "kind": "screen", "text": "숨김 배지와 숨긴 사람이 보인다. 일반 사용자·작성자에게는 404", "focus": ["p-12"] }
      ]
    },
    {
      "name": "모더레이터가 운영자 전용 작업",
      "steps": [
        { "kind": "user", "text": "회원 7이 [숫자 다시 맞추기]를 누른다", "focus": ["recount"] },
        { "kind": "request", "method": "POST", "path": "/api/admin/recount", "headers": ["Authorization: Bearer tok-c01"] },
        { "kind": "server", "text": "@RequirePermission(RUN_BATCH) — MODERATOR 표에 없다" },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"이 작업을 할 권한이 없습니다.\"}" },
        { "kind": "screen", "text": "권한 없음 토스트", "focus": ["toast-forbidden"] }
      ]
    }
  ]
}
```

## 만들 것

**V40** — `db/migration/V40__member_role_moderator.sql`: `member.role` CHECK를 `'USER', 'MODERATOR', 'ADMIN'`으로(`DROP CHECK ck_member_role` 뒤 다시 만든다). 누구를 모더레이터로 할지는 마이그레이션에 넣지 않는다.

마이그레이션은 community·practice 두 DB에 똑같이 돌고 회원 id가 서로 다르다. 역할은 아래 API로 준다.

**V41** — `db/migration/V41__post_hidden_by.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `post.hidden_at` | `DATETIME NULL` — 숨긴 시각. 숨김이 아니면 `NULL` |
| `post.hidden_by` | `BIGINT NULL`, FK → `member` — 숨긴 사람 |

**역할 → 권한 표** — 한 곳(예: `enum Role`)에 둔다

| 권한 | USER | MODERATOR | ADMIN |
|---|---|---|---|
| `MODERATE_POST` — 글 숨김·복구, 숨김 글 상세 보기 | | ✔ | ✔ |
| `MANAGE_ROLE` — 역할 바꾸기 | | | ✔ |
| `RUN_BATCH` — 8-5 `POST /api/admin/recount` | | | ✔ |

- 컨트롤러 메서드에 `@RequirePermission(Permission.X)`를 붙이고, `AuthInterceptor` **다음에** 도는 인터셉터가 확인한다. 로그인을 안 했으면 `401`, 권한이 없으면 `403`.
- 8-5 `recount`의 `if` 확인을 이 방식으로 옮긴다. 2-3 `PostAccessPolicy`의 "숨김 글은 운영자만"도 "`MODERATE_POST` 권한이 있으면"으로 바꾼다. 게시판 목록에는 지금처럼 숨김 글이 아무에게도 나오지 않는다.

**API**

| 메서드·경로 | 권한 | 응답 `200` |
|---|---|---|
| `PATCH /api/admin/members/{id}/role` | `MANAGE_ROLE` | `{ "id", "nickname", "role" }` |
| `PATCH /api/admin/posts/{id}/status` | `MODERATE_POST` | `{ "id", "status", "hiddenBy": { "id", "nickname" } 또는 null, "hiddenAt": 시각 또는 null }` |

| 상황 | 응답 |
|---|---|
| 숨김 글을 또 숨김 | `200`, 처음 숨긴 사람·시각 그대로(멱등) — 첫 응답의 `hiddenAt`과 두 번째 응답의 값이 **같아야** 한다 |
| 복구 | `200`, `PUBLISHED`, `hiddenBy`·`hiddenAt`=null |
| 임시저장 글 숨기기·복구 | `409` |
| 없는 글·삭제된 글 | `404` |
| 운영자(`ADMIN`)의 역할 바꾸기 | `409` — 운영자가 0명이 되는 사고를 막는다 |
| 없는 회원·탈퇴 회원 | `404` |

**필드 규칙**

| 필드 | 필수 | null·빈 값 | 허용 값 | 틀렸을 때 |
|---|---|---|---|---|
| `status`(글 상태) | 필수 | 안 됨 | `HIDDEN`·`PUBLISHED`(대문자 그대로) | `400`, `errors`에 `status` |
| `role`(역할) | 필수 | 안 됨 | `USER`·`MODERATOR` — `ADMIN`은 API로 줄 수 없다 | `400`, `errors`에 `role` |
| `{id}`(경로) | 필수 | — | 숫자 | 숫자가 아니면 `400` |
| 본문 전체 | 필수 | — | JSON | JSON이 아니면 `400` |

여기서 숨김은 사진 속 `isHide` boolean 대신 기존 `post.status = 'HIDDEN'`으로 표현한다. `deleted_at`은 작성자·운영자의 삭제 시각이고, `hidden_at`·`hidden_by`는 **운영자가 숨긴 기록**이다. 숨긴 글은 권한자가 상세를 볼 수 있지만, 삭제된 글은 권한자도 일반 상세에서 볼 수 없다.

## 구현 가이드

권한 검사 → 삭제되지 않은 글 조회 → 상태 전이 → 응답 DTO 순서로 구현한다. 아래 접기의 코드는 답안의 실제 파일에서 가져왔다. 전체 파일은 **구현 코드**와 **MyBatis 대체 구현 코드** 토글에서 볼 수 있다.

<details>
<summary>Controller — 권한 애노테이션과 HTTP</summary>

```java
package org.example.admin;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// 13-1 — 권한은 애노테이션 한 줄. "누가 할 수 있나"는 Role 표가 정한다
@RestController
public class ModerationController {

    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PatchMapping("/api/admin/posts/{id}/status")
    @RequirePermission(Permission.MODERATE_POST)
    public PostStatusResponse changeStatus(@PathVariable Long id, @LoginMember AuthenticatedMember me,
                                           @Valid @RequestBody PostStatusRequest request) {
        return moderationService.changePostStatus(me, id, request.status());
    }

    @PatchMapping("/api/admin/members/{id}/role")
    @RequirePermission(Permission.MANAGE_ROLE)
    public MemberRoleResponse changeRole(@PathVariable Long id, @Valid @RequestBody RoleChangeRequest request) {
        return moderationService.changeRole(id, request.role());
    }
}

package org.example.admin;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    private final RecountService recountService;

    public AdminController(RecountService recountService) {
        this.recountService = recountService;
    }

    // 13-1: 권한 확인은 PermissionInterceptor로 옮겼다(RUN_BATCH는 ADMIN만). 서비스 메서드는 스케줄러도 부르므로 회원을 모른다.
    @PostMapping("/api/admin/recount")
    @RequirePermission(Permission.RUN_BATCH)
    public RecountResponse recount() {
        return recountService.recount();
    }
}
```

</details>

<details>
<summary>DTO — 상태·역할 요청과 응답</summary>

```java
package org.example.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PostStatusRequest(
        @NotNull(message = "바꿀 상태를 적어 주세요.")
        @Pattern(regexp = "HIDDEN|PUBLISHED", message = "상태는 HIDDEN 또는 PUBLISHED입니다.")
        String status
) {
}

package org.example.admin;

import org.example.post.AuthorResponse;

import java.time.LocalDateTime;

// 숨겼으면 누가·언제, 복구했으면 둘 다 null
public record PostStatusResponse(Long id, String status, AuthorResponse hiddenBy, LocalDateTime hiddenAt) {
}

package org.example.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// 운영 API로 줄 수 있는 역할은 USER·MODERATOR뿐 — ADMIN은 API로 만들지 않는다
public record RoleChangeRequest(
        @NotNull(message = "역할을 적어 주세요.")
        @Pattern(regexp = "USER|MODERATOR", message = "역할은 USER 또는 MODERATOR입니다.")
        String role
) {
}

package org.example.admin;

public record MemberRoleResponse(Long id, String nickname, String role) {
}
```

</details>

<details>
<summary>권한 — Role·Permission·Interceptor</summary>

```java
package org.example.admin;

import java.util.EnumSet;
import java.util.Set;

// 13-1 역할 → 권한 표. 새 역할·권한이 생기면 여기만 고친다(문자열 "ADMIN" 비교를 여기저기 두지 않는다)
public enum Role {
    USER(EnumSet.noneOf(Permission.class)),
    MODERATOR(EnumSet.of(Permission.MODERATE_POST)),
    ADMIN(EnumSet.allOf(Permission.class));

    private final Set<Permission> permissions;

    Role(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public boolean can(Permission permission) {
        return permissions.contains(permission);
    }

    // member.role 문자열(DB 값)로 판정 — 모르는 값이면 아무 권한도 없다
    public static boolean has(String role, Permission permission) {
        for (Role r : values()) {
            if (r.name().equals(role)) {
                return r.can(permission);
            }
        }
        return false;
    }
}

package org.example.admin;

// 13-1 운영 권한 — 역할(Role)이 어떤 권한을 갖는지는 Role 한 곳에서 정한다.
// 컨트롤러는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"(@RequirePermission)만 적는다.
public enum Permission {
    MODERATE_POST,   // 글 숨김·복구, 숨김 글 보기
    MANAGE_ROLE,     // 역할 바꾸기
    RUN_BATCH        // 8-5 정합성 배치 수동 실행
}

package org.example.admin;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// 13-1 — 컨트롤러 메서드(또는 클래스)에 붙이면 PermissionInterceptor가 요청 전에 확인한다
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    Permission value();
}

package org.example.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.auth.AuthInterceptor;
import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

// 13-1 권한 확인 한 곳 — AuthInterceptor(누구인가) 다음에 돈다.
// @RequirePermission이 붙은 핸들러만 본다: 로그인 안 함 → 401, 권한 없음 → 403.
// GET은 AuthInterceptor가 토큰 없이도 통과시키므로 여기서 401을 내야 한다(컨트롤러마다 null 확인을 반복하지 않는다).
@Component
public class PermissionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }
        RequirePermission required = method.getMethodAnnotation(RequirePermission.class);
        if (required == null) {
            required = method.getBeanType().getAnnotation(RequirePermission.class);
        }
        if (required == null) {
            return true;
        }
        AuthenticatedMember me = (AuthenticatedMember) request.getAttribute(AuthInterceptor.LOGIN_MEMBER_ATTRIBUTE);
        if (me == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        if (!Role.has(me.role(), required.value())) {
            throw new AdminOnlyException("이 작업을 할 권한이 없습니다.");
        }
        return true;
    }
}
```

</details>

<details>
<summary>Service — 상태 전이와 현재 역할 검증</summary>

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

// 13-1 운영 — 권한 확인은 PermissionInterceptor가 끝냈다. 여기는 상태 규칙만 본다.
@Service
public class ModerationService {

    private static final String WITHDRAWN = "WITHDRAWN";

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    public ModerationService(PostRepository postRepository, MemberRepository memberRepository, Clock clock) {
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
    }

    // 없는 글·삭제된 글 404 → 임시저장 409 → 숨기기/복구(이미 그 상태면 그대로 — 처음 숨긴 사람·시각 유지)
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
        return toStatusResponse(post);
    }

    // 운영자(ADMIN)의 역할은 API로 바꾸지 않는다(자기 강등으로 운영자가 0명이 되는 사고 방지) — 409
    @Transactional
    public MemberRoleResponse changeRole(Long memberId, String role) {
        Member member = memberRepository.findById(memberId)
                .filter(m -> !WITHDRAWN.equals(m.getMemberStatus()) && m.getDeletedAt() == null)
                .orElseThrow(MemberNotFoundException::new);
        if (Role.ADMIN.name().equals(member.getRole())) {
            throw new ModerationConflictException("운영자의 역할은 바꿀 수 없습니다.");
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

</details>

<details>
<summary>Entity — hide·unhide·changeRole</summary>

```java
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
        if ("DRAFT".equals(this.status)) {
            throw new PostStatusConflictException("임시저장 글은 숨기거나 복구할 수 없습니다.");
        }
    }

    public LocalDateTime getHiddenAt() {
        return hiddenAt;
    }

    public Member getHiddenBy() {
        return hiddenBy;
    }



    public void changeRole(String role) {
        this.role = role;
    }
```

</details>

<details>
<summary>Flyway / SQL — 역할 CHECK와 숨김 기록</summary>

```sql
-- V40 — 운영 역할(13-1). 운영자(ADMIN) 아래에 모더레이터(MODERATOR)를 둔다 — 글 숨김·신고 처리 같은 일상 운영만 한다.
-- CHECK는 고칠 수 없어서 지우고 다시 만든다(이름 ck_member_role은 덤프에 있던 그대로).
-- 누구를 모더레이터로 할지는 데이터가 아니라 운영 API(PATCH /api/admin/members/{id}/role)로 정한다 —
-- 마이그레이션은 community·practice 두 DB에 똑같이 돌아서 회원 id를 박아 넣으면 안 된다.
ALTER TABLE member DROP CHECK ck_member_role;
ALTER TABLE member
    ADD CONSTRAINT ck_member_role CHECK (role IN ('USER', 'MODERATOR', 'ADMIN'));

-- V41 — 누가·언제 숨겼나(13-1). 상태만 HIDDEN으로 바꾸면 나중에 "이 글 누가 숨겼어요?"에 답할 수 없다.
-- 기존 숨김 글(시드)은 기록이 없으므로 NULL로 둔다. 복구하면 다시 NULL.
ALTER TABLE post
    ADD COLUMN hidden_at DATETIME NULL AFTER deleted_at,
    ADD COLUMN hidden_by BIGINT NULL AFTER hidden_at,
    ADD CONSTRAINT fk_post_hidden_by FOREIGN KEY (hidden_by) REFERENCES member (id);
```

</details>

<details>
<summary>예외 — 권한·상태 충돌</summary>

```java
package org.example.admin;

// 누구인지는 알지만 운영자가 아님 — 전역 핸들러가 403으로 변환한다
public class AdminOnlyException extends RuntimeException {

    public AdminOnlyException() {
        super("운영자만 실행할 수 있습니다.");
    }

    public AdminOnlyException(String message) {
        super(message);
    }
}

package org.example.admin;

// 요청 값은 맞지만 지금 상태에서 할 수 없음(운영자 역할 바꾸기 등) — 409
public class ModerationConflictException extends RuntimeException {

    public ModerationConflictException(String message) {
        super(message);
    }
}

package org.example.post;

// 13-1 지금 상태에서는 바꿀 수 없는 글(임시저장을 숨기기·복구) — 전역 핸들러가 409로 변환한다
public class PostStatusConflictException extends RuntimeException {

    public PostStatusConflictException(String message) {
        super(message);
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 조건부 UPDATE</summary>

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.admin.ModerationCommandMapper">
    <update id="hideIfPublished">
        UPDATE post SET status = 'HIDDEN', hidden_by = #{actorId}, hidden_at = #{now}
        WHERE id = #{postId} AND deleted_at IS NULL AND status = 'PUBLISHED'
    </update>
    <update id="unhide">
        UPDATE post SET status = 'PUBLISHED', hidden_by = NULL, hidden_at = NULL
        WHERE id = #{postId} AND deleted_at IS NULL AND status IN ('PUBLISHED', 'HIDDEN')
    </update>
    <update id="changeRole">
        UPDATE member SET role = #{role}
        WHERE id = #{memberId} AND role &lt;&gt; 'ADMIN'
          AND member_status &lt;&gt; 'WITHDRAWN' AND deleted_at IS NULL
    </update>
</mapper>
```

</details>

## 직접 확인

회원 7(`tok-c01`, 동시성01)을 잠깐 모더레이터로 만들었다가 끝에서 되돌린다. 글 12는 이스프링의 공개 글이다. 글 7은 임시저장, 글 8은 삭제된 글이다.

```bash
BASE=http://localhost:8080
AD='Authorization: Bearer tok-admin'; MO='Authorization: Bearer tok-c01'; J='Content-Type: application/json'

curl -s -X PATCH "$BASE/api/admin/members/7/role" -H "$AD" -H "$J" -d '{"role":"MODERATOR"}'; echo   # G
curl -s -X PATCH "$BASE/api/admin/posts/12/status" -H "$MO" -H "$J" -d '{"status":"HIDDEN"}'; echo   # H — hiddenBy 7
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/12"                                        # V1 404
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/12" -H "$MO"                               # V2 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/admin/recount" -H "$MO"                  # P1 403
for b in '{}' '{"status":"DRAFT"}' 'status=HIDDEN'; do curl -s -o /dev/null -w "$b → %{http_code}\n" -X PATCH "$BASE/api/admin/posts/12/status" -H "$MO" -H "$J" -d "$b"; done   # 모두 400
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/admin/posts/7/status" -H "$MO" -H "$J" -d '{"status":"HIDDEN"}'   # S7 409
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/admin/members/8/role" -H "$AD" -H "$J" -d '{"role":"ADMIN"}'       # RA 400
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/admin/members/1/role" -H "$AD" -H "$J" -d '{"role":"USER"}'        # RM 409
curl -s -X PATCH "$BASE/api/admin/posts/12/status" -H "$MO" -H "$J" -d '{"status":"PUBLISHED"}'; echo   # R 복구
curl -s -X PATCH "$BASE/api/admin/members/7/role" -H "$AD" -H "$J" -d '{"role":"USER"}'; echo        # Z 되돌리기
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/admin/posts/12/status" -H "$MO" -H "$J" -d '{"status":"HIDDEN"}'   # ZH 403 — 바로 반영
```

동시 숨김도 따로 확인한다. 회원 7을 `MODERATOR`로 만든 뒤 글 12를 `PUBLISHED`로 복구하고, `tok-admin`과 `tok-c01`로 `HIDDEN` 요청을 동시에 보낸다. 두 응답의 `hiddenBy`·`hiddenAt`이 같고 DB에도 첫 기록 하나만 남아야 한다. 끝에는 글을 복구하고 회원 7을 `USER`로 되돌린다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끝에서 글 12를 복구하고 회원 7을 USER로 되돌리므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {"id": "G", "title": "운영자가 회원 7을 모더레이터로", "method": "PATCH", "path": "/api/admin/members/7/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "MODERATOR"}},
    {"id": "H", "title": "모더레이터가 글 12 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "H2", "title": "한 번 더 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "V1", "title": "비로그인 상세", "method": "GET", "path": "/api/posts/12"},
    {"id": "V2", "title": "모더레이터 상세", "method": "GET", "path": "/api/posts/12", "headers": {"Authorization": "Bearer tok-c01"}},
    {"id": "V3", "title": "작성자(이스프링) 상세", "method": "GET", "path": "/api/posts/12", "headers": {"Authorization": "Bearer tok-lee"}},
    {"id": "L", "title": "자유 게시판 목록", "method": "GET", "path": "/api/boards/free/posts?size=20"},
    {"id": "P1", "title": "모더레이터가 정합성 배치 실행", "method": "POST", "path": "/api/admin/recount", "headers": {"Authorization": "Bearer tok-c01"}},
    {"id": "P2", "title": "모더레이터가 역할 바꾸기", "method": "PATCH", "path": "/api/admin/members/8/role", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"role": "MODERATOR"}},
    {"id": "P3", "title": "일반 회원이 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": {"status": "HIDDEN"}},
    {"id": "P4", "title": "토큰 없이 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "body": {"status": "HIDDEN"}},
    {"id": "S0", "title": "status 없음", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {}},
    {"id": "SN", "title": "status가 null", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": null}},
    {"id": "SE", "title": "status가 빈 문자열", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": ""}},
    {"id": "SB", "title": "허용 안 되는 상태(DRAFT)", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "DRAFT"}},
    {"id": "SJ", "title": "JSON이 아닌 본문", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01", "Content-Type": "application/json"}, "body": "status=HIDDEN"},
    {"id": "SX", "title": "글 id가 숫자 아님", "method": "PATCH", "path": "/api/admin/posts/abc/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "S7", "title": "임시저장 글(7)", "method": "PATCH", "path": "/api/admin/posts/7/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "S8", "title": "삭제된 글(8)", "method": "PATCH", "path": "/api/admin/posts/8/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "S9", "title": "없는 글", "method": "PATCH", "path": "/api/admin/posts/99999999/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}},
    {"id": "R0", "title": "role 없음", "method": "PATCH", "path": "/api/admin/members/8/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {}},
    {"id": "RA", "title": "ADMIN으로 바꾸기", "method": "PATCH", "path": "/api/admin/members/8/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "ADMIN"}},
    {"id": "RL", "title": "소문자 moderator", "method": "PATCH", "path": "/api/admin/members/8/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "moderator"}},
    {"id": "RM", "title": "운영자(1)의 역할 바꾸기", "method": "PATCH", "path": "/api/admin/members/1/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "USER"}},
    {"id": "RN", "title": "없는 회원", "method": "PATCH", "path": "/api/admin/members/99999999/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "MODERATOR"}},
    {"id": "RX", "title": "회원 id가 숫자 아님", "method": "PATCH", "path": "/api/admin/members/abc/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "MODERATOR"}},
    {"id": "R", "title": "모더레이터가 복구", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "PUBLISHED"}},
    {"id": "V4", "title": "복구 뒤 비로그인 상세", "method": "GET", "path": "/api/posts/12"},
    {"id": "Z", "title": "회원 7을 다시 USER로", "method": "PATCH", "path": "/api/admin/members/7/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "USER"}},
    {"id": "ZH", "title": "강등된 회원 7이 숨기기", "method": "PATCH", "path": "/api/admin/posts/12/status", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"status": "HIDDEN"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "G", "expect": {"status": 200, "json": [{"path": "$", "equals": {"id": 7, "nickname": "동시성01", "role": "MODERATOR"}}]}}, {"request": "H", "expect": {"status": 200, "json": [{"path": "$.id", "equals": 12}, {"path": "$.status", "equals": "HIDDEN"}, {"path": "$.hiddenBy", "equals": {"id": 7, "nickname": "동시성01"}}, {"path": "$.hiddenAt", "type": "string"}]}}, {"request": "H2", "expect": {"status": 200, "json": [{"path": "$.status", "equals": "HIDDEN"}, {"path": "$.hiddenAt", "equals": "{{H.body.hiddenAt}}"}]}}]},
    {"id": "C2", "all": [{"request": "V1", "expect": {"status": 404}}, {"request": "V2", "expect": {"status": 200}}, {"request": "V3", "expect": {"status": 404}}, {"request": "L", "expect": {"status": 200, "json": [{"path": "$.items[*].id", "notContains": 12}]}}]},
    {"id": "C3", "all": [{"request": "P1", "expect": {"status": 403}}, {"request": "P2", "expect": {"status": 403}}, {"request": "P3", "expect": {"status": 403}}, {"request": "P4", "expect": {"status": 401}}]},
    {"id": "C4", "all": [{"request": "S0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "status"}]}}, {"request": "SN", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "status"}]}}, {"request": "SE", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "status"}]}}, {"request": "SB", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "status"}]}}, {"request": "SJ", "expect": {"status": 400}}, {"request": "SX", "expect": {"status": 400}}, {"request": "S7", "expect": {"status": 409}}, {"request": "S8", "expect": {"status": 404}}, {"request": "S9", "expect": {"status": 404}}]},
    {"id": "C5", "all": [{"request": "R0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "role"}]}}, {"request": "RA", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "role"}]}}, {"request": "RL", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "role"}]}}, {"request": "RM", "expect": {"status": 409}}, {"request": "RN", "expect": {"status": 404}}, {"request": "RX", "expect": {"status": 400}}]},
    {"id": "C6", "all": [{"request": "R", "expect": {"status": 200, "json": [{"path": "$", "equals": {"id": 12, "status": "PUBLISHED", "hiddenBy": null, "hiddenAt": null}}]}}, {"request": "V4", "expect": {"status": 200}}, {"request": "Z", "expect": {"status": 200, "json": [{"path": "$.role", "equals": "USER"}]}}, {"request": "ZH", "expect": {"status": 403}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | G / H / H2 | 역할 `MODERATOR` / 모더레이터가 숨기기 `200`, `hiddenBy`=회원 7, `hiddenAt` 시각 / 또 숨겨도 `200`, 처음 시각 그대로 |
| C2 | V1·V2·V3 / L | 숨긴 글은 비로그인·작성자에게 `404`, 모더레이터에게 `200` / 게시판 목록에 없다 |
| C3 | P1·P2·P3 / P4 | 모더레이터의 배치 실행·역할 바꾸기, 일반 회원의 숨기기 모두 `403` / 토큰 없음 `401` |
| C4 | S0·SN·SE·SB / SJ·SX / S7 / S8·S9 | `status` 없음·null·빈 값·`DRAFT`는 `400`(`errors`에 `status`) / JSON 아님·숫자 아닌 id `400` / 임시저장 `409` / 삭제된 글·없는 글 `404` — `500` 없음 |
| C5 | R0·RA·RL / RM / RN / RX | `role` 없음·`ADMIN`·소문자는 `400`(`errors`에 `role`) / 운영자 역할 바꾸기 `409` / 없는 회원 `404` / 숫자 아닌 id `400` |
| C6 | R / V4 / Z / ZH | 복구 `PUBLISHED`·기록 null / 비로그인 상세 다시 `200` / USER로 되돌림 / 되돌린 즉시 숨기기 `403`(다음 요청부터 바로 반영) |
| D1 | `SELECT status, hidden_at IS NULL, hidden_by IS NULL FROM post WHERE id = 12` | `PUBLISHED`, `1`, `1` — 복구가 기록까지 지웠다 |
| D2 | `SELECT role FROM member WHERE id IN (1, 7) ORDER BY id` | `ADMIN` · `USER` — 거절된 RM이 운영자를 바꾸지 않았고, 7은 되돌렸다 |
| D3 | `SELECT check_clause FROM information_schema.check_constraints WHERE constraint_schema = 'community' AND constraint_name = 'ck_member_role'` | `MODERATOR`가 들어 있다 |
| R1 | 한 곳 | 운영 권한 판단(8-5 recount, 숨김 글 보기, 숨김·역할 API)이 역할·권한 표 한 곳을 거친다. 남은 `"ADMIN"` 비교(글 삭제의 운영자 예외, 공지 게시판 글쓰기)도 같은 표로 옮길 수 있다는 것을 안다 |
| R2 | 확인 위치 | 권한 확인이 인터셉터(또는 AOP) 한 곳에 있고, `AuthInterceptor` 다음에 돈다(순서가 바뀌면 로그인 회원이 아직 없다). GET도 토큰이 없으면 `401`이 난다 |
| R3 | 상태 전이 | 숨김·숨김 해제·임시저장 거절이 엔티티 메서드(`hide`·`unhide`)에 있고, 요청 값 오류(`400`)와 상태 충돌(`409`)을 구분한다 |
| R4 | 매 요청 역할 | 토큰 → 회원을 요청마다 DB에서 읽으므로 강등이 바로 반영된다(ZH). JWT에 역할을 넣어 두면 강등이 토큰 만료 때까지 늦어진다는 차이를 말할 수 있다 |
| R5 | 동시 숨김 | 같은 글을 두 운영자가 동시에 숨겨도 첫 `hiddenBy`·`hiddenAt`을 둘 다 응답한다. JPA는 글 행 잠금, MyBatis는 행 잠금과 `status = PUBLISHED` 조건부 UPDATE로 보존한다 |

## 필요한 지식

- [S12 Spring Security 구조](../../docs/knowledge/S12-security-architecture.md) — 인증(401)과 인가(403), 권한 확인을 어디에 두나
- [S02 AOP와 프록시](../../docs/knowledge/S02-aop-proxy.md) — 인터셉터 대신 애노테이션 + AOP로 하는 방법
- [B8 애노테이션](../../lessons/B8-annotations.md) — 내 애노테이션 만들기
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — 403·409를 전역 핸들러로

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 권한 인터셉터</summary>

```java
if (!(handler instanceof HandlerMethod method)) return true;
RequirePermission required = method.getMethodAnnotation(RequirePermission.class);
if (required == null) return true;
AuthenticatedMember me = (AuthenticatedMember) request.getAttribute(AuthInterceptor.LOGIN_MEMBER_ATTRIBUTE);
if (me == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
if (!Role.has(me.role(), required.value())) throw new AdminOnlyException("이 작업을 할 권한이 없습니다.");
return true;
```

`WebMvcConfig`에서 `authInterceptor` 다음 줄에 등록한다. `@WebMvcTest`(7-1)도 `HandlerInterceptor` 빈을 읽으므로 슬라이스 테스트가 그대로 돈다.
</details>

<details>
<summary>힌트 2 — 숨김 기록</summary>

`Post`에 `hiddenAt`과 `@ManyToOne(fetch = LAZY) @JoinColumn(name = "hidden_by") Member hiddenBy`를 두고, `hide(Member by, LocalDateTime now)`는 이미 `HIDDEN`이면 아무것도 하지 않는다. `unhide()`는 상태를 `PUBLISHED`로, 두 숨김 기록을 `null`로.

임시저장이면 두 메서드 모두 예외(→ 409). 삭제 글의 `deletedAt`·`deletedBy`를 비우는 11-5의 `restore()`와 구분한다.

H2의 `hiddenAt`이 H와 1초쯤 다르게 나오면 소수 초 문제다. `LocalDateTime.now()`는 `15:41:11.511819`처럼 마이크로초까지 갖는데 `DATETIME` 컬럼은 초 단위라, MySQL이 **반올림해서** `15:41:12`로 저장한다.

첫 응답은 메모리 값, 두 번째 응답은 DB 값이라 서로 다르다(정답 구현을 처음 만들 때 실제로 이렇게 실패했다). 저장 전에 `LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS)`로 자른다. </details>

## 다음 단계

[13-2. 신고 처리](13-2-report-handling.md)
