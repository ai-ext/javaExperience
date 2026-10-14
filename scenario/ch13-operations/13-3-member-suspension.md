# 13-3. 작성자 기간 정지

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "신고 처리를 하다 보면 같은 사람이 계속 문제를 일으켜요. 글만 숨겨서는 또 써요. '3일 동안 글·댓글 금지' 같은 정지를 걸 수 있게 해 주세요. 정지 중에도 글 읽기는 되고요. 기간이 끝나면 저희가 따로 안 풀어도 저절로 풀려야 해요. 정지당한 분이 글을 쓰려고 하면 언제 풀리는지 알려 주세요."

1-6에서 만든 `member_status = 'SUSPENDED'`는 **영구 정지**다. 토큰을 확인하는 단계에서 모든 요청을 막는다(최정지, 회원 5). 이번에 만드는 것은 다르다.

| | 영구 정지(1-6) | 기간 정지(이번) |
|---|---|---|
| 막는 것 | 모든 요청(읽기 포함) | **쓰기**(GET이 아닌 요청)만 |
| 끝 | 운영자가 상태를 바꿀 때까지 | `suspended_until`이 지나면 **저절로** |
| 저장 | 상태 값 | 끝나는 시각 + 사유 |

"저절로 풀린다"를 스케줄러로 만들 필요는 없다. 끝나는 시각만 저장하고, 요청이 올 때마다 `지금 < 끝나는 시각`인지 비교하면 된다. 비교에 쓰는 "지금"은 `Clock`에서 얻는다. 그래야 테스트에서 시각을 앞뒤로 넘겨 확인할 수 있다(HTTP 확인으로는 3일을 기다릴 수 없다).

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "기간 정지",
  "summary": "운영 화면에서 일수·사유로 정지. 정지된 회원의 쓰기는 403 + 끝나는 시각, 읽기는 그대로.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "동시성03" },
    { "type": "field", "id": "title", "label": "제목", "value": "오늘 이벤트 공유합니다" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "toast", "id": "toast-suspended", "value": "10월 13일 15:00까지 글을 쓸 수 없어요 (사유: 도배 경고)", "tone": "error" },
    { "type": "field", "id": "admin-days", "label": "[운영] 정지 일수(1~30)", "value": "3" },
    { "type": "field", "id": "admin-reason", "label": "[운영] 사유(2~200자)", "value": "도배 경고" }
  ],
  "flows": [
    {
      "name": "운영자가 3일 정지",
      "steps": [
        { "kind": "user", "text": "운영 화면에서 회원 9에게 3일 정지", "focus": ["admin-days", "admin-reason"] },
        { "kind": "request", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": ["Authorization: Bearer tok-admin", "Content-Type: application/json"], "body": "{\"days\": 3, \"reason\": \"도배 경고\"}" },
        { "kind": "server", "text": "권한 SUSPEND_MEMBER(13-1 표: MODERATOR·ADMIN) → 회원 찾기(404) → 운영진이면 409 → 지금 + 3일을 끝 시각으로 저장(이미 정지 중이면 덮어쓰기)" },
        { "kind": "db", "sql": "UPDATE member SET suspended_until = '2026-10-13 15:00:00', suspend_reason = '도배 경고' WHERE id = 9" },
        { "kind": "response", "status": 200, "body": "{\"memberId\": 9, \"suspendedUntil\": \"2026-10-13T15:00:00\", \"reason\": \"도배 경고\"}" },
        { "kind": "screen", "text": "정지 완료" }
      ]
    },
    {
      "name": "정지된 회원이 글쓰기",
      "steps": [
        { "kind": "user", "text": "회원 9가 글을 쓰고 [등록]", "focus": ["title", "submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-c03", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"오늘 이벤트 공유합니다\", ...}" },
        { "kind": "server", "text": "AuthInterceptor — 토큰 확인 뒤, GET이 아니고 지금 < suspended_until이면 403(컨트롤러까지 가지 않는다)" },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"정지 기간에는 글·댓글을 쓰거나 바꿀 수 없습니다.\", \"suspendedUntil\": \"2026-10-13T15:00:00\", \"reason\": \"도배 경고\"}" },
        { "kind": "screen", "text": "언제 풀리는지 알려 주는 토스트", "focus": ["toast-suspended"] }
      ]
    }
  ]
}
```

## 만들 것

**V43** — `db/migration/V43__member_suspension.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `member.suspended_until` | `DATETIME NULL` — 이 시각 **전까지** 쓰기 금지. `NULL`이거나 지났으면 정지 아님 |
| `member.suspend_reason` | `VARCHAR(200) NULL` |

**API** — 권한 `SUSPEND_MEMBER`(13-1 표에 추가: MODERATOR·ADMIN)

| 메서드·경로 | 응답 |
|---|---|
| `PUT /api/admin/members/{id}/suspension` | `200` `{ "memberId", "suspendedUntil", "reason" }` — 끝 = 지금 + `days`일. 이미 정지 중이면 새 값으로 덮어쓴다 |
| `DELETE /api/admin/members/{id}/suspension` | `204` — 정지가 없어도 `204`(멱등) |

| 상황 | 응답 |
|---|---|
| PUT으로 운영진(`MODERATOR`·`ADMIN`)을 정지하려 할 때 | `409` — 먼저 역할을 `USER`로 바꾼다 |
| DELETE로 운영진의 남은 정지 기록을 해제할 때 | `204` — 정지가 없어도 멱등 |
| 정지 중인 `USER`를 `MODERATOR`로 승격하려 할 때 | `409` — 먼저 기간 정지를 해제하거나 만료될 때까지 기다린다 |
| 없는 회원·탈퇴 회원 | `404` |

**정지와 역할의 일관성** — 정지 부여와 역할 변경은 회원 행을 잠그고 판단한다. 운영진은 새로 정지하지 않고, 기간 정지 중인 회원은 운영진으로 승격하지 않는다. 만료되거나 정지를 해제하면 승격할 수 있다.

**정지의 효과** — 토큰 확인(1-6 `AuthInterceptor`) 바로 다음에 판단한다

| 요청 | 정지 중 |
|---|---|
| GET(읽기) | 그대로 된다 |
| POST·PUT·PATCH·DELETE(쓰기) | `403` + 본문에 `suspendedUntil`·`reason`(ProblemDetail 속성) |
| `suspended_until`이 지난 뒤 | 아무것도 안 해도 다시 된다 |

**필드 규칙**

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `days` | 필수 | 안 됨 | 1~30(1·30 성공, 0·31 거절) | 정수 | 없음 | `400`, `errors`에 `days`(숫자가 아니면 형식 오류 `400`, `errors`에 `days` — 11-1 공통 처리기) |
| `reason` | 필수 | 안 됨 — 없음·`null`·공백만 거절 | 2~200자(2·200 성공, 1·201 거절) | 문자열 | 없음 | `400`, `errors`에 `reason` |
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400` |

**테스트 하나** — "기간이 지나면 풀린다"를 시각을 넘겨 가며 확인하는 단위 테스트(Spring 없이). 끝 1초 전 = 정지, 끝 시각 = 풀림(끝은 포함하지 않는다), 하루 뒤 = 풀림, 해제 뒤 = 풀림.

## 구현 가이드

운영자는 회원 행을 잠근 뒤 정지 시각을 저장하고, `AuthInterceptor`는 매 요청에서 `Clock`의 현재 시각과 비교한다. 아래 접기는 실제 답안 코드다. **구현 코드**와 **MyBatis 대체 구현 코드** 토글에는 단계별 변경 파일 전문이 있다.

<details>
<summary>Controller — 운영 API와 HTTP 검증</summary>

```java
package org.example.admin;

import jakarta.validation.Validator;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequirePermission(Permission.SUSPEND_MEMBER)
public class SuspensionController {

    private final SuspensionService suspensionService;
    private final Validator validator;

    public SuspensionController(SuspensionService suspensionService, Validator validator) {
        this.suspensionService = suspensionService;
        this.validator = validator;
    }

    @PutMapping("/api/admin/members/{id}/suspension")
    public SuspensionResponse suspend(@PathVariable Long id, @RequestBody JsonNode body) {
        SuspensionRequest.Parsed parsed = SuspensionRequest.parse(body);
        SuspensionRequest request = parsed.request();
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return suspensionService.suspend(id, request);
    }

    @DeleteMapping("/api/admin/members/{id}/suspension")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void lift(@PathVariable Long id) {
        suspensionService.lift(id);
    }
}
```

</details>

<details>
<summary>DTO — 요청 타입·경계·응답</summary>

```java
package org.example.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

public record SuspensionRequest(
        @NotNull(message = "정지 일수를 적어 주세요.")
        @Min(value = 1, message = "정지는 1일 이상입니다.")
        @Max(value = 30, message = "정지는 30일까지입니다.")
        Integer days,

        @NotBlank(message = "정지 사유를 적어 주세요.")
        @Size(min = 2, max = 200, message = "정지 사유는 2~200자입니다.")
        String reason
) {
    public SuspensionRequest {
        if (reason != null) reason = reason.strip();
    }

    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        Integer days = days(body.get("days"), errors);
        String reason = reason(body.get("reason"), errors);
        return new Parsed(new SuspensionRequest(days, reason), Map.copyOf(errors));
    }

    public record Parsed(SuspensionRequest request, Map<String, String> errors) {
    }

    private static Integer days(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isIntegralNumber() || !value.canConvertToInt()) {
            errors.put("days", "days는 정수여야 합니다.");
            return null;
        }
        return value.intValue();
    }

    private static String reason(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            errors.put("reason", "reason은 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }
}

package org.example.admin;

import java.time.LocalDateTime;

public record SuspensionResponse(Long memberId, LocalDateTime suspendedUntil, String reason) {
}
```

</details>

<details>
<summary>Service — 잠금 조회·기간 계산·해제</summary>

```java
package org.example.admin;

import org.example.member.Member;
import org.example.member.MemberNotFoundException;
import org.example.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

// 13-3 기간 정지 — 끝나는 시각만 저장한다. 풀리는 건 요청마다 "지금 < 끝" 비교로 판단(배치·스케줄러 없음)
@Service
public class SuspensionService {

    private static final String WITHDRAWN = "WITHDRAWN";

    private final MemberRepository memberRepository;
    private final Clock clock;

    public SuspensionService(MemberRepository memberRepository, Clock clock) {
        this.memberRepository = memberRepository;
        this.clock = clock;
    }

    // 이미 정지 중이면 새 기간으로 덮어쓴다(늘리기·줄이기 모두). 운영진(MODERATOR·ADMIN)은 정지할 수 없다 — 409
    @Transactional
    public SuspensionResponse suspend(Long memberId, SuspensionRequest request) {
        Member member = findMember(memberId);
        if (!Role.USER.name().equals(member.getRole())) {
            throw new ModerationConflictException("운영진은 정지할 수 없습니다. 먼저 역할을 USER로 바꾸세요.");
        }
        LocalDateTime until = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS).plusDays(request.days());
        member.suspendUntil(until, request.reason().strip());
        return new SuspensionResponse(member.getId(), member.getSuspendedUntil(), member.getSuspendReason());
    }

    // 정지가 없어도 204(멱등)
    @Transactional
    public void lift(Long memberId) {
        findMember(memberId).liftSuspension();
    }

    private Member findMember(Long memberId) {
        return memberRepository.findByIdForUpdate(memberId)
                .filter(m -> !WITHDRAWN.equals(m.getMemberStatus()) && m.getDeletedAt() == null)
                .orElseThrow(MemberNotFoundException::new);
    }
}
```

</details>

<details>
<summary>역할 변경 — 정지 중 승격 충돌</summary>

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

</details>

<details>
<summary>인증 Interceptor — 영구 정지와 기간 정지</summary>

```java
package org.example.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.member.Member;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Clock;
import java.time.LocalDateTime;

// /api/** 요청의 토큰을 한 곳에서 확인한다(컨트롤러마다 반복하지 않는다).
// GET이고 헤더가 없으면 비로그인으로 통과시킨다(2-1에서 필요).
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String LOGIN_MEMBER_ATTRIBUTE = "loginMember";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ACTIVE_STATUS = "ACTIVE";

    private final ApiTokenRepository apiTokenRepository;
    private final Clock clock;

    public AuthInterceptor(ApiTokenRepository apiTokenRepository, Clock clock) {
        this.apiTokenRepository = apiTokenRepository;
        this.clock = clock;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS 사전 요청(OPTIONS)은 토큰 없이 온다 — 막으면 브라우저의 요청이 전부 CORS로 실패한다
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        boolean isGet = HttpMethod.GET.matches(request.getMethod());

        if (header == null) {
            if (isGet) {
                return true;
            }
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        if (!header.startsWith(BEARER_PREFIX)) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        ApiToken apiToken = apiTokenRepository.findByTokenFetchMember(token)
                .orElseThrow(() -> new AuthenticationRequiredException("인증이 필요합니다."));

        LocalDateTime now = LocalDateTime.now(clock);
        boolean expired = !now.isBefore(apiToken.getExpiresAt());
        if (apiToken.getRevokedAt() != null || expired) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }

        Member member = apiToken.getMember();
        if (!ACTIVE_STATUS.equals(member.getMemberStatus())) {
            throw new MemberNotActiveException("정지되었거나 탈퇴한 회원입니다.");
        }
        // 13-3 기간 정지 — 읽기(GET)는 그대로, 쓰기만 막는다. 기간이 지나면 이 비교가 false가 되어 저절로 풀린다
        if (!isGet && member.isSuspendedAt(now)) {
            throw new MemberSuspendedException(member.getSuspendedUntil(), member.getSuspendReason());
        }

        request.setAttribute(LOGIN_MEMBER_ATTRIBUTE,
                new AuthenticatedMember(member.getId(), member.getNickname(), member.getRole()));
        return true;
    }
}
```

</details>

<details>
<summary>Entity — 끝 시각의 배타적 경계</summary>

```java
package org.example.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// 회원 — 탈퇴(WITHDRAWN)해도 행은 남고 deleted_at이 찍힌다. 지금은 조회만 한다(가입 API 없음)
@Entity
@Table(name = "member")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false)
    private String role;

    @Column(name = "member_status", nullable = false)
    private String memberStatus;

    // 13-3 기간 정지(V43) — 이 시각 전까지 쓰기 금지. null이거나 지났으면 정지 아님
    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    @Column(name = "suspend_reason", length = 200)
    private String suspendReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    protected Member() {
        // JPA
    }

    // 13-1 운영 API로만 — USER ↔ MODERATOR
    public void changeRole(String role) {
        this.role = role;
    }

    // 13-3 — "지금"을 밖에서 받는다(테스트에서 시각을 앞뒤로 넘겨 볼 수 있다)
    public boolean isSuspendedAt(LocalDateTime now) {
        return suspendedUntil != null && now.isBefore(suspendedUntil);
    }

    public void suspendUntil(LocalDateTime until, String reason) {
        this.suspendedUntil = until;
        this.suspendReason = reason;
    }

    public void liftSuspension() {
        this.suspendedUntil = null;
        this.suspendReason = null;
    }

    public LocalDateTime getSuspendedUntil() {
        return suspendedUntil;
    }

    public String getSuspendReason() {
        return suspendReason;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getRole() {
        return role;
    }

    public String getMemberStatus() {
        return memberStatus;
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
}
```

</details>

<details>
<summary>Flyway / SQL — 정지 컬럼</summary>

```sql
-- V43 — 기간 정지(13-3). suspended_until이 "지금"보다 뒤면 정지 중 — 지나면 아무것도 안 해도 저절로 풀린다(배치 없음).
-- 기존 member_status = 'SUSPENDED'(영구 정지, 1-6)와는 별개다: 그건 로그인부터 막고, 이건 쓰기만 막는다.
ALTER TABLE member
    ADD COLUMN suspended_until DATETIME     NULL AFTER member_status,
    ADD COLUMN suspend_reason  VARCHAR(200) NULL AFTER suspended_until;
```

</details>

<details>
<summary>예외 처리 — 403과 끝 시각</summary>

```java
package org.example.auth;

import java.time.LocalDateTime;

// 13-3 기간 정지 중인 회원의 쓰기 요청 — 전역 핸들러가 403 + 끝나는 시각·사유로 변환한다
public class MemberSuspendedException extends RuntimeException {

    private final LocalDateTime suspendedUntil;
    private final String reason;

    public MemberSuspendedException(LocalDateTime suspendedUntil, String reason) {
        super("정지 기간에는 글·댓글을 쓰거나 바꿀 수 없습니다.");
        this.suspendedUntil = suspendedUntil;
        this.reason = reason;
    }

    public LocalDateTime getSuspendedUntil() {
        return suspendedUntil;
    }

    public String getReason() {
        return reason;
    }
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
```

</details>

<details>
<summary>권한 표 — SUSPEND_MEMBER</summary>

```java
package org.example.admin;

// 13-1 운영 권한 — 역할(Role)이 어떤 권한을 갖는지는 Role 한 곳에서 정한다.
// 컨트롤러는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"(@RequirePermission)만 적는다.
public enum Permission {
    MODERATE_POST,   // 글 숨김·복구, 숨김 글 보기
    MANAGE_ROLE,     // 역할 바꾸기
    RUN_BATCH,       // 8-5 정합성 배치 수동 실행
    HANDLE_REPORT,   // 13-2 신고 목록·처리
    SUSPEND_MEMBER   // 13-3 기간 정지·해제
}

package org.example.admin;

import java.util.EnumSet;
import java.util.Set;

// 13-1 역할 → 권한 표. 새 역할·권한이 생기면 여기만 고친다(문자열 "ADMIN" 비교를 여기저기 두지 않는다)
public enum Role {
    USER(EnumSet.noneOf(Permission.class)),
    MODERATOR(EnumSet.of(Permission.MODERATE_POST, Permission.HANDLE_REPORT, Permission.SUSPEND_MEMBER)),
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
```

</details>

<details>
<summary>단위 테스트 — 만료 경계</summary>

```java
package org.example.member;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 13-3 T1 — "기간이 지나면 저절로 풀린다"는 HTTP로는 기다릴 수 없어서 시각을 넘겨 가며 단위 테스트로 본다(Spring 없이)
class MemberSuspensionTest {

    private static final LocalDateTime UNTIL = LocalDateTime.of(2026, 10, 13, 15, 0, 0);

    @Test
    void suspendedOnlyBeforeUntil() throws Exception {
        Member member = newMember();
        member.suspendUntil(UNTIL, "도배");

        assertTrue(member.isSuspendedAt(UNTIL.minusSeconds(1)), "끝나기 1초 전에는 정지 중");
        assertFalse(member.isSuspendedAt(UNTIL), "끝나는 시각부터는 풀린다(끝 시각은 포함하지 않는다)");
        assertFalse(member.isSuspendedAt(UNTIL.plusDays(1)), "지나면 아무것도 안 해도 풀려 있다");
    }

    @Test
    void notSuspendedWhenNeverSuspendedOrLifted() throws Exception {
        Member member = newMember();
        assertFalse(member.isSuspendedAt(UNTIL), "정지한 적 없으면 정지 아님");

        member.suspendUntil(UNTIL, "도배");
        member.liftSuspension();
        assertFalse(member.isSuspendedAt(UNTIL.minusDays(1)), "해제하면 기간 안이어도 정지 아님");
    }

    // Member는 JPA용 protected 생성자만 있다 — 테스트에서는 리플렉션으로 만든다
    private static Member newMember() throws Exception {
        Constructor<Member> constructor = Member.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        return constructor.newInstance();
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 잠금 조회·UPDATE</summary>

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.admin.SuspensionMapper">
    <select id="findForUpdate" resultType="org.example.admin.MemberSuspensionTarget">
        SELECT id, role, member_status AS memberStatus, deleted_at AS deletedAt
        FROM member
        WHERE id = #{memberId}
        FOR UPDATE
    </select>

    <update id="suspend">
        UPDATE member
        SET suspended_until = #{until}, suspend_reason = #{reason}
        WHERE id = #{memberId}
    </update>

    <update id="lift">
        UPDATE member
        SET suspended_until = NULL, suspend_reason = NULL
        WHERE id = #{memberId}
    </update>
</mapper>
```

</details>

## 직접 확인

회원 9(`tok-c03`, 동시성03)를 정지했다가 끝에서 푼다.

```bash
BASE=http://localhost:8080
AD='Authorization: Bearer tok-admin'; C3='Authorization: Bearer tok-c03'; J='Content-Type: application/json'

curl -s -X PUT "$BASE/api/admin/members/9/suspension" -H "$AD" -H "$J" -d '{"days":3,"reason":"[채점] 도배 경고"}'; echo     # S
curl -s -X POST "$BASE/api/posts" -H "$C3" -H "$J" -d '{"boardSlug":"free","title":"[채점] 정지 중 글","content":"x"}'; echo   # W1 403 + suspendedUntil
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/2" -H "$C3"                                                          # G1 200
for b in '{}' '{"days":0,"reason":"[채점] 사유"}' '{"days":31,"reason":"[채점] 사유"}' '{"days":3,"reason":"가"}'; do
  curl -s -o /dev/null -w "$b → %{http_code}\n" -X PUT "$BASE/api/admin/members/9/suspension" -H "$AD" -H "$J" -d "$b"; done   # 모두 400
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/admin/members/1/suspension" -H "$AD" -H "$J" -d '{"days":3,"reason":"[채점] 사유"}'   # TA 409

# "저절로 풀린다"를 눈으로 — 내 DB에서만, 끝 시각을 과거로 돌려 본다(채점 D 항목이 아니라 실험)
docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "UPDATE member SET suspended_until = NOW() - INTERVAL 1 MINUTE WHERE id = 9"
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/posts/2/like" -H "$C3"                                                # 200 — 풀렸다
curl -s -o /dev/null -X DELETE "$BASE/api/posts/2/like" -H "$C3"
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/admin/members/9/suspension" -H "$AD"                              # 204
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끝에서 정지를 풀고 만든 글을 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {"id": "S", "title": "회원 9를 3일 정지", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "[채점] 도배 경고"}},
    {"id": "W1", "title": "정지 중 글쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c03"}, "body": {"boardSlug": "free", "title": "[채점] 정지 중 글", "content": "정지 중에는 저장되면 안 된다"}},
    {"id": "W2", "title": "정지 중 좋아요", "method": "PUT", "path": "/api/posts/2/like", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "W3", "title": "정지 중 댓글", "method": "POST", "path": "/api/posts/2/comments", "headers": {"Authorization": "Bearer tok-c03"}, "body": {"content": "[채점] 정지 중 댓글"}},
    {"id": "G1", "title": "정지 중 글 읽기", "method": "GET", "path": "/api/posts/2", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "G2", "title": "정지 중 내 알림", "method": "GET", "path": "/api/me/notifications", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "S2", "title": "정지 기간 바꾸기(1일)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 1, "reason": "[채점] 기간 줄임"}},
    {"id": "D0", "title": "빈 본문", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {}},
    {"id": "DN", "title": "days가 null", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": null, "reason": "[채점] 사유"}},
    {"id": "DZ", "title": "days=0(하한 밖)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 0, "reason": "[채점] 사유"}},
    {"id": "D31", "title": "days=31(상한 밖)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 31, "reason": "[채점] 사유"}},
    {"id": "DX", "title": "days가 숫자 아님", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": "abc", "reason": "[채점] 사유"}},
    {"id": "RB", "title": "reason이 공백만", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "   "}},
    {"id": "R1", "title": "reason 1자(하한 밖)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "가"}},
    {"id": "RL", "title": "reason 201자(상한 밖)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "BJ", "title": "JSON이 아닌 본문", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin", "Content-Type": "application/json"}, "body": "days=3"},
    {"id": "B30", "title": "days=30·reason 200자(경계 안)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 30, "reason": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "B1", "title": "days=1·reason 2자(경계 안)", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 1, "reason": "도배"}},
    {"id": "TA", "title": "운영자(1) 정지", "method": "PUT", "path": "/api/admin/members/1/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "[채점] 사유"}},
    {"id": "TN", "title": "없는 회원", "method": "PUT", "path": "/api/admin/members/99999999/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "[채점] 사유"}},
    {"id": "TX", "title": "회원 id가 숫자 아님", "method": "PUT", "path": "/api/admin/members/abc/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": "[채점] 사유"}},
    {"id": "P1", "title": "일반 회원이 정지", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": {"days": 3, "reason": "[채점] 사유"}},
    {"id": "P2", "title": "토큰 없이 정지", "method": "PUT", "path": "/api/admin/members/9/suspension", "body": {"days": 3, "reason": "[채점] 사유"}},
    {"id": "DT", "title": "days 숫자 문자열 거절", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": "3", "reason": "도배"}},
    {"id": "DF", "title": "days 소수 거절", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3.5, "reason": "도배"}},
    {"id": "RT", "title": "reason 숫자 거절", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": 123}},
    {"id": "RS", "title": "공백을 빼면 reason 1자", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": 3, "reason": " 가 "}},
    {"id": "RM", "title": "형식 오류와 누락 오류를 함께 반환", "method": "PUT", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"days": "3", "reason": null}},
    {"id": "PR", "title": "정지 중 운영진 승격 거절", "method": "PATCH", "path": "/api/admin/members/9/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "MODERATOR"}},
    {"id": "L", "title": "정지 풀기", "method": "DELETE", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "L2", "title": "한 번 더 풀기", "method": "DELETE", "path": "/api/admin/members/9/suspension", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "PA", "title": "정지 해제 뒤 운영진 승격", "method": "PATCH", "path": "/api/admin/members/9/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "MODERATOR"}},
    {"id": "PB", "title": "실습 회원 역할 복원", "method": "PATCH", "path": "/api/admin/members/9/role", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"role": "USER"}},
    {"id": "W4", "title": "푼 뒤 글쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c03"}, "body": {"boardSlug": "free", "title": "[채점] 정지 풀린 뒤 글", "content": "풀리면 다시 쓸 수 있다"}},
    {"id": "X4", "title": "뒷정리 — W4 글 지우기", "method": "DELETE", "path": "/api/posts/{{W4.body.id}}", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "X1", "title": "뒷정리 — W1이 저장됐다면 지우기", "method": "DELETE", "path": "/api/posts/{{W1.body.id}}", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "X2", "title": "뒷정리 — W2 좋아요 취소", "method": "DELETE", "path": "/api/posts/2/like", "headers": {"Authorization": "Bearer tok-c03"}},
    {"id": "X3", "title": "뒷정리 — W3이 저장됐다면 지우기", "method": "DELETE", "path": "/api/comments/{{W3.body.id}}", "headers": {"Authorization": "Bearer tok-c03"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "S", "expect": {"status": 200, "json": [{"path": "$.memberId", "equals": 9}, {"path": "$.suspendedUntil", "type": "string"}, {"path": "$.reason", "equals": "[채점] 도배 경고"}]}}, {"request": "W1", "expect": {"status": 403, "json": [{"path": "$.suspendedUntil", "equals": "{{S.body.suspendedUntil}}"}, {"path": "$.reason", "equals": "[채점] 도배 경고"}]}}, {"request": "W2", "expect": {"status": 403}}, {"request": "W3", "expect": {"status": 403}}]},
    {"id": "C2", "all": [{"request": "S", "expect": {"status": 200}}, {"request": "G1", "expect": {"status": 200}}, {"request": "G2", "expect": {"status": 200}}]},
    {"id": "C3", "all": [{"request": "S2", "expect": {"status": 200, "json": [{"path": "$.reason", "equals": "[채점] 기간 줄임"}, {"path": "$.suspendedUntil", "notEquals": "{{S.body.suspendedUntil}}"}]}}, {"request": "TA", "expect": {"status": 409}}, {"request": "TN", "expect": {"status": 404}}, {"request": "TX", "expect": {"status": 400}}, {"request": "P1", "expect": {"status": 403}}, {"request": "P2", "expect": {"status": 401}}]},
    {"id": "C4", "all": [{"request": "D0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}, {"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "DN", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}]}}, {"request": "DZ", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}]}}, {"request": "D31", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}]}}, {"request": "DX", "expect": {"status": 400}}, {"request": "RB", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "R1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "RL", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "BJ", "expect": {"status": 400}}]},
    {"id": "C5", "all": [{"request": "B30", "expect": {"status": 200, "json": [{"path": "$.reason", "matches": "^가{200}$"}]}}, {"request": "B1", "expect": {"status": 200, "json": [{"path": "$.reason", "equals": "도배"}]}}]},
    {"id": "C6", "all": [{"request": "L", "expect": {"status": 204}}, {"request": "L2", "expect": {"status": 204}}, {"request": "W4", "expect": {"status": 201}}, {"request": "X4", "expect": {"status": 204}}]}
    ,{"id": "C7", "all": [{"request": "DT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}]}}, {"request": "DF", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}]}}, {"request": "RT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "RS", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "RM", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "days"}, {"path": "$.errors[*].field", "contains": "reason"}]}}]}
    ,{"id": "C8", "all": [{"request": "PR", "expect": {"status": 409}}, {"request": "PA", "expect": {"status": 200, "json": [{"path": "$.role", "equals": "MODERATOR"}]}}, {"request": "PB", "expect": {"status": 200, "json": [{"path": "$.role", "equals": "USER"}]}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), T = 테스트(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | S / W1 / W2 / W3 | 정지 `200`(끝 시각·사유) / 정지 중 글쓰기 `403` + 본문의 `suspendedUntil`이 S와 같고 `reason`이 있다 / 좋아요·댓글도 `403` |
| C2 | S / G1 / G2 | 정지 중에도 글 읽기·내 알림 보기는 `200` |
| C3 | S2 / TA / TN / TX / P1 / P2 | 다시 정지하면 새 사유·새 끝 시각으로 덮어쓴다 / 운영자 정지 `409` / 없는 회원 `404` / 숫자 아닌 id `400` / 일반 회원 `403` / 토큰 없음 `401` |
| C4 | D0 / DN·DZ·D31 / DX / RB·R1·RL / BJ | 빈 본문 `400`(`errors`에 `days`·`reason` 둘 다) / `days` null·0·31 `400` / 숫자 아님 `400` / `reason` 공백만·1자·201자 `400` / JSON 아님 `400` — `500` 없음 |
| C5 | B30 / B1 | 경계 바로 안쪽 `days`=30·`reason` 200자, `days`=1·`reason` 2자는 `200` |
| C6 | L / L2 / W4 / X4 | 풀기 `204`, 또 풀어도 `204` / 풀린 뒤 글쓰기 `201` / 뒷정리 `204` |
| C7 | DT / DF / RT / RS / RM | 숫자 문자열·소수·숫자 사유·공백 제거 후 1자·혼합 오류는 `400`, `errors`에 해당 필드가 있다 |
| C8 | PR / PA / PB | 정지 중 승격 `409`, 정지 해제 뒤 승격 `200`, 회원 역할 복원 `200` |
| T1 | 정지 판정 단위 테스트(`./gradlew test`) | 끝 1초 전 정지 · 끝 시각 풀림 · 하루 뒤 풀림 · 해제 뒤 풀림 — 모두 통과, Spring·DB 없이 |
| D1 | `SELECT suspended_until IS NULL, suspend_reason IS NULL FROM member WHERE id = 9` | `1`, `1` — 풀었다 |
| D2 | 실행 **전**과 **후**에 `SELECT COUNT(*) FROM post WHERE author_id = 9 AND title = '[채점] 정지 중 글'` | 전후 값이 같다 — 정지 중 요청(W1)은 저장되지 않았다(지운 행까지 세므로 "0"이 아니라 "늘지 않았다"로 본다) |
| R1 | 판단 위치 | 정지 판단이 컨트롤러마다가 아니라 토큰 확인 직후 한 곳에 있다. 영구 정지(1-6, 모든 요청)와 기간 정지(쓰기만)를 구분한다 |
| R2 | 저절로 | 풀어 주는 배치·스케줄러가 없고, 요청마다 `Clock`의 지금과 끝 시각을 비교한다. 끝 시각은 포함하지 않는다(`now.isBefore(until)`) |
| R3 | 쓰기의 범위 | GET이 아닌 요청을 전부 막으면 "알림 읽음 표시(PATCH)"·"좋아요 취소(DELETE)"도 막힌다는 것을 알고, 막을 것·허용할 것을 어디서 정할지 말할 수 있다 |
| R4 | 운영진 보호 | 운영진 정지와 정지 중 승격을 `409`로 막는 이유, "역할 낮추기 → 정지" 및 "정지 해제 → 승격" 순서를 설명할 수 있다 |

## 필요한 지식

- [W20 시간과 시간대](../../docs/knowledge/W20-time-timezone.md) — 끝 시각 저장과 비교, `Clock`
- [V05 까다로운 것 테스트하기](../../docs/knowledge/V05-testing-tricky-things.md) — 시간이 지나야 하는 동작을 테스트로
- [I1 왜 테스트하나](../../lessons/I1-why-tests.md)
- [F2 토큰 인증](../../lessons/F2-auth-token.md) — 인터셉터의 확인 순서

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디서 막나</summary>

`AuthInterceptor`에서 회원을 읽고 `ACTIVE`인지 확인한 바로 다음에:

```java
if (!isGet && member.isSuspendedAt(now)) {
    throw new MemberSuspendedException(member.getSuspendedUntil(), member.getSuspendReason());
}
```

`now`는 토큰 만료 확인에 이미 쓰는 `LocalDateTime.now(clock)`이다. 전역 핸들러에서 `problem.setProperty("suspendedUntil", ...)`로 끝 시각을 본문에 싣는다.
</details>

<details>
<summary>힌트 2 — 테스트</summary>

`Member`에 `isSuspendedAt(LocalDateTime now)`를 두면 Spring 없이 시각만 바꿔 가며 볼 수 있다. `Member`의 생성자가 JPA용 `protected`라면 테스트를 같은 패키지(`org.example.member`)에 두거나 리플렉션으로 만든다.
</details>

## 다음 단계

[13-4. 금칙어 필터](13-4-banned-words.md)
