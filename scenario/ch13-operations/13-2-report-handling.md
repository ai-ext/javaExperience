# 13-2. 신고 처리

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "신고가 들어오면 운영 화면에서 보고 처리하고 싶어요. 같은 광고 글을 다섯 명이 신고하면 다섯 줄이 아니라 '이 글, 신고 5건'으로 한 줄로 보여 주세요. 많이 신고된 것부터요. [숨기기]를 누르면 글은 숨기고 그 글의 신고 다섯 건이 한꺼번에 처리됐으면 좋겠고, 별문제 없으면 [기각]이요. 처리한 신고는 누가 언제 처리했는지 남겨 주세요."

12-6에서 쌓기만 한 `report`를 처리한다. 세 가지가 새롭다.

- **묶어 보기** — `GROUP BY target_type, target_id`로 대상 하나를 한 줄로 만든다. 줄마다 미리보기(글 제목·댓글 내용)를 붙이되, 줄마다 대상을 따로 조회하지 않는다.
- **한꺼번에 처리** — 대상 하나의 **대기 중** 신고를 `UPDATE … WHERE status = 'PENDING'` 한 문장으로 처리한다. 두 모더레이터가 같은 글을 동시에 처리해도, 신고를 "가져간" 쪽만 조치한다.
- **조치 재사용** — 숨김은 13-1의 `hide`(누가·언제 기록), 댓글은 5-3의 삭제 규칙(soft delete + `comment_count` 1 감소)을 그대로 쓴다.

권한은 13-1의 표에 `HANDLE_REPORT`(MODERATOR·ADMIN)를 더한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 — 신고함",
  "summary": "대상별로 묶은 대기 신고. [숨기기]는 대상 조치 + 그 대상의 대기 신고 전부 처리, [기각]은 신고만 처리.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "신고함 — 대기", "right": "운영자" },
    {
      "type": "list",
      "id": "groups",
      "items": [
        { "id": "g-post", "title": "[글] [채점] 신고 처리 확인 글", "meta": "신고 2건 · ABUSE, SPAM · 방금 전", "badge": "2", "tone": "warning" },
        { "id": "g-comment", "title": "[댓글] [채점] 신고될 댓글", "meta": "신고 1건 · ETC · 방금 전", "badge": "1" }
      ],
      "footer": "1 / 1 페이지"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        { "id": "hide", "label": "숨기기", "variant": "danger" },
        { "id": "reject", "label": "기각", "variant": "secondary" }
      ]
    },
    { "type": "toast", "id": "toast-done", "value": "이미 처리된 신고예요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "신고함 열기",
      "steps": [
        { "kind": "user", "text": "운영 화면의 [신고함]을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/admin/reports?status=PENDING&page=0&size=20", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "db", "sql": "SELECT target_type, target_id, COUNT(*) AS reportCount, GROUP_CONCAT(DISTINCT reason ORDER BY reason) AS reasons, MIN(created_at), MAX(created_at) FROM report WHERE status = 'PENDING' GROUP BY target_type, target_id ORDER BY reportCount DESC, MAX(created_at) DESC LIMIT 21 OFFSET 0; SELECT id, title FROM post WHERE id IN (...); SELECT id, content FROM comment WHERE id IN (...)", "note": "ix_report_status_target" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"targetType\": \"POST\", \"targetId\": 22, \"preview\": \"[채점] 신고 처리 확인 글\", \"reportCount\": 2, \"reasons\": [\"ABUSE\", \"SPAM\"], ...}, ...], \"page\": 0, \"size\": 20, \"totalElements\": 2, \"hasNext\": false}" },
        { "kind": "screen", "text": "많이 신고된 대상부터 한 줄씩", "focus": ["groups"] }
      ]
    },
    {
      "name": "숨기기로 처리",
      "steps": [
        { "kind": "user", "text": "글 줄을 고르고 [숨기기]", "focus": ["g-post", "hide"] },
        { "kind": "request", "method": "POST", "path": "/api/admin/reports/resolve", "headers": ["Authorization: Bearer tok-admin", "Content-Type: application/json"], "body": "{\"targetType\": \"POST\", \"targetId\": 22, \"action\": \"HIDE\"}" },
        { "kind": "server", "text": "대기 신고를 조건부 UPDATE로 가져간다 → 0행이면 409(이미 처리) 또는 404(신고 없는 대상) → 가져간 쪽만 글 숨김(13-1 hide)" },
        { "kind": "db", "sql": "UPDATE report SET status = 'ACCEPTED', handled_by = 1, handled_at = NOW() WHERE target_type = 'POST' AND target_id = 22 AND status = 'PENDING'; UPDATE post SET status = 'HIDDEN', hidden_at = NOW(), hidden_by = 1 WHERE id = 22" },
        { "kind": "response", "status": 200, "body": "{\"targetType\": \"POST\", \"targetId\": 22, \"action\": \"HIDE\", \"resolvedCount\": 2, \"targetStatus\": \"HIDDEN\"}" },
        { "kind": "screen", "text": "줄이 신고함에서 빠진다. 다른 운영자가 같은 줄을 누르면 409", "focus": ["groups", "toast-done"] }
      ]
    }
  ]
}
```

## 만들 것

**V42** — `db/migration/V42__report_handling.sql`(12-6의 `report`에 더한다)

| 컬럼 | 타입·규칙 |
|---|---|
| `status` | `VARCHAR(20) NOT NULL DEFAULT 'PENDING'`, `CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))` — 기존 신고는 모두 대기 |
| `handled_by` | `BIGINT NULL`, FK → `member` — 처리한 사람 |
| `handled_at` | `DATETIME NULL` — 처리 시각 |
| 인덱스 | `(status, target_type, target_id)` — 대기 신고 묶기와 대상별 처리가 같이 쓴다 |

**API** — 권한 `HANDLE_REPORT`(13-1 표에 추가: MODERATOR·ADMIN). 토큰 없음 `401`, 권한 없음 `403`

| 메서드·경로 | 응답 `200` |
|---|---|
| `GET /api/admin/reports?status=PENDING&page=0&size=20` | `{ "items": [{ "targetType", "targetId", "preview", "reportCount", "reasons": ["ABUSE", "SPAM"], "firstReportedAt", "lastReportedAt" }], "page", "size", "totalElements", "hasNext" }` — `totalElements`는 묶음 수 |
| `POST /api/admin/reports/resolve` | `{ "targetType", "targetId", "action", "resolvedCount", "targetStatus" }` |

- 목록 정렬: 신고 수 많은 순 → 마지막 신고가 최근인 순. `preview`는 글이면 제목, 댓글이면 내용 앞 50자, 대상이 지워졌으면 `null`.
- 처리 `action`: `HIDE`면 신고를 `ACCEPTED`로 바꾸고 대상에 조치한다. 글은 숨김(13-1, `targetStatus`=`HIDDEN`), 댓글은 삭제(5-3과 같이 `comment_count` 1 감소, `targetStatus`=`DELETED`). `REJECT`면 신고만 `REJECTED`로 바꾸고 `targetStatus`=null.
- 대기 신고가 하나도 없으면 아무것도 하지 않는다. 그 대상에 신고가 아예 없으면 `404`, 있었지만 이미 처리됐으면 `409`.

**요청 값 규칙**

| 값 | 필수 | null·빈 값 | 범위·허용 값 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|
| `status`(목록 쿼리) | 아니요 | 없으면 기본값 | `PENDING`·`ACCEPTED`·`REJECTED` | `PENDING` | `400` |
| `page`(목록 쿼리) | 아니요 | 없으면 기본값 | 0 이상 정수 | 0 | `400` |
| `size`(목록 쿼리) | 아니요 | 없으면 기본값 | 1~50 정수(50 성공, 51 거절) | 20 | `400` |
| `targetType`(처리 본문) | 필수 | 안 됨 | `POST`·`COMMENT` | 없음 | `400`, `errors`에 `targetType` |
| `targetId`(처리 본문) | 필수 | 안 됨 | 1 이상 정수 | 없음 | `400`, `errors`에 `targetId`. 신고가 없는 대상 `404` |
| `action`(처리 본문) | 필수 | 안 됨 | `HIDE`·`REJECT` | 없음 | `400`, `errors`에 `action` |

## 구현 가이드

대상별 묶음을 조회하고, 조건부 UPDATE로 대기 신고를 가져온 쪽만 글·댓글에 조치한다. 아래 접기는 답안의 실제 코드를 보여 주며, 전체 파일은 **구현 코드**와 **MyBatis 대체 구현 코드** 토글에서 볼 수 있다.

<details>
<summary>Controller — HTTP·권한·쿼리 검증</summary>

```java
package org.example.report;

import jakarta.validation.Validator;
import org.example.admin.Permission;
import org.example.admin.RequirePermission;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

// 13-2 — 신고 처리 권한(HANDLE_REPORT)은 MODERATOR·ADMIN
@RestController
@RequirePermission(Permission.HANDLE_REPORT)
public class ReportAdminController {

    private final ReportHandlingService reportHandlingService;
    private final Validator validator;

    public ReportAdminController(ReportHandlingService reportHandlingService, Validator validator) {
        this.reportHandlingService = reportHandlingService;
        this.validator = validator;
    }

    @GetMapping("/api/admin/reports")
    public ReportGroupPageResponse groups(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", required = false) String page,
            @RequestParam(value = "size", required = false) String size) {
        return reportHandlingService.groups(parseStatus(status), parseNumber(page, 0, 0, Integer.MAX_VALUE),
                parseNumber(size, 20, 1, 50));
    }

    @PostMapping("/api/admin/reports/resolve")
    public ResolveResponse resolve(@LoginMember AuthenticatedMember me, @RequestBody JsonNode body) {
        ResolveRequest.Parsed parsed = ResolveRequest.parse(body);
        ResolveRequest request = parsed.request();
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return reportHandlingService.resolve(me, request);
    }

    private String parseStatus(String raw) {
        if (raw == null) return "PENDING";
        if (raw.equals("PENDING") || raw.equals("ACCEPTED") || raw.equals("REJECTED")) return raw;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status가 올바르지 않습니다.");
    }

    private int parseNumber(String raw, int defaultValue, int min, int max) {
        if (raw == null) return defaultValue;
        if (!raw.matches("[0-9]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "목록 범위가 올바르지 않습니다.");
        }
        try {
            int value = Integer.parseInt(raw);
            if (value >= min && value <= max) return value;
        } catch (NumberFormatException ignored) {
            // 범위를 넘는 수는 아래에서 400으로 처리한다.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "목록 범위가 올바르지 않습니다.");
    }
}
```

</details>

<details>
<summary>DTO — 요청·묶음·응답</summary>

```java
package org.example.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

public record ResolveRequest(
        @NotNull(message = "대상 종류를 적어 주세요.")
        @Pattern(regexp = "POST|COMMENT", message = "대상 종류는 POST 또는 COMMENT입니다.")
        String targetType,

        @NotNull(message = "대상 번호가 필요합니다.")
        @Positive(message = "대상 번호는 1 이상이어야 합니다.")
        Long targetId,

        @NotNull(message = "처리 방법을 골라 주세요.")
        @Pattern(regexp = "HIDE|REJECT", message = "처리 방법은 HIDE 또는 REJECT입니다.")
        String action
) {
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String targetType = text(body.get("targetType"), "targetType", errors);
        Long targetId = targetId(body.get("targetId"), errors);
        String action = text(body.get("action"), "action", errors);
        return new Parsed(new ResolveRequest(targetType, targetId, action), Map.copyOf(errors));
    }

    public record Parsed(ResolveRequest request, Map<String, String> errors) {
    }

    private static String text(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            errors.put(field, field + "은 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }

    private static Long targetId(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isIntegralNumber() || !value.canConvertToLong()) {
            errors.put("targetId", "targetId는 정수여야 합니다.");
            return null;
        }
        return value.longValue();
    }
}

package org.example.report;

// resolvedCount: 이번에 처리된 대기 신고 수. targetStatus: 조치 뒤 대상 상태(HIDDEN·DELETED, 기각이면 null)
public record ResolveResponse(String targetType, Long targetId, String action, int resolvedCount, String targetStatus) {
}

package org.example.report;

import java.time.LocalDateTime;

// 대상 하나에 쌓인 신고 묶음(GROUP BY 결과) — 네이티브 쿼리의 별칭과 이름이 같아야 한다
public interface ReportGroupRow {
    String getTargetType();

    Long getTargetId();

    Long getReportCount();

    String getReasons();

    LocalDateTime getFirstReportedAt();

    LocalDateTime getLastReportedAt();
}

package org.example.report;

import java.time.LocalDateTime;
import java.util.List;

// preview: 글이면 제목, 댓글이면 내용 앞 50자. 대상이 지워졌으면 null
public record ReportGroupResponse(String targetType, Long targetId, String preview, long reportCount,
                                  List<String> reasons, LocalDateTime firstReportedAt, LocalDateTime lastReportedAt) {
}

package org.example.report;

import java.util.List;

public record ReportGroupPageResponse(List<ReportGroupResponse> items, int page, int size, long totalElements,
                                      boolean hasNext) {
}
```

</details>

<details>
<summary>Service — 묶음 조회·처리 상태 전이</summary>

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

// 13-2 신고 처리 — 대상별로 묶어 보여 주고, 대상 하나의 대기 신고를 한 번에 처리한다
@Service
public class ReportHandlingService {

    private static final int PREVIEW_LENGTH = 50;

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    public ReportHandlingService(ReportRepository reportRepository, PostRepository postRepository,
                                 CommentRepository commentRepository, MemberRepository memberRepository, Clock clock) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
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
<summary>JPA / Repository — 집계·조건부 처리</summary>

```java
package org.example.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporter_IdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);

    boolean existsByTargetTypeAndTargetId(String targetType, Long targetId);

    // 13-2 대상별 묶음 — 많이 신고된 대상부터, 같으면 최근에 신고된 대상부터
    @Query(nativeQuery = true, value = """
            SELECT r.target_type AS targetType, r.target_id AS targetId, COUNT(*) AS reportCount,
                   GROUP_CONCAT(DISTINCT r.reason ORDER BY r.reason) AS reasons,
                   MIN(r.created_at) AS firstReportedAt, MAX(r.created_at) AS lastReportedAt
              FROM report r
             WHERE r.status = :status
             GROUP BY r.target_type, r.target_id
             ORDER BY reportCount DESC, lastReportedAt DESC, r.target_type, r.target_id
             LIMIT :limit OFFSET :offset
            """)
    List<ReportGroupRow> findGroups(@Param("status") String status, @Param("limit") int limit,
                                    @Param("offset") long offset);

    @Query(nativeQuery = true, value = """
            SELECT COUNT(*) FROM (SELECT 1 FROM report WHERE status = :status GROUP BY target_type, target_id) g
            """)
    long countGroups(@Param("status") String status);

    // 조건부 UPDATE — WHERE status = 'PENDING'이라 이미 처리된 신고는 다시 바뀌지 않는다
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Report r SET r.status = :newStatus, r.handledBy.id = :handlerId, r.handledAt = :now
             WHERE r.targetType = :targetType AND r.targetId = :targetId AND r.status = 'PENDING'
            """)
    int resolvePending(@Param("targetType") String targetType, @Param("targetId") Long targetId,
                       @Param("newStatus") String newStatus, @Param("handlerId") Long handlerId,
                       @Param("now") LocalDateTime now);
}
```

</details>

<details>
<summary>Entity — 처리 기록</summary>

```java
package org.example.report;

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

// 신고(V33) — 대상은 (targetType, targetId)로 가리킨다(글·댓글 두 테이블이라 FK 없음)
@Entity
@Table(name = "report")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Member reporter;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 20)
    private String reason;

    @Column(length = 500)
    private String detail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 13-2 처리 상태(V42) — PENDING(대기)·ACCEPTED(조치함)·REJECTED(기각)
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private Member handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    protected Report() {
        // JPA
    }

    public Report(Member reporter, String targetType, Long targetId, String reason, String detail, LocalDateTime now) {
        this.reporter = reporter;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.detail = detail;
        this.createdAt = now;
    }

    public Long getId() {
        return id;
    }

    public Member getReporter() {
        return reporter;
    }

    public String getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getReason() {
        return reason;
    }

    public String getDetail() {
        return detail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getStatus() {
        return status;
    }

    public Member getHandledBy() {
        return handledBy;
    }

    public LocalDateTime getHandledAt() {
        return handledAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 상태·처리자·인덱스</summary>

```sql
-- V42 — 신고 처리(13-2). 12-6의 report에 처리 상태를 더한다.
-- 기존 행(12장에서 쌓인 신고)은 DEFAULT로 모두 PENDING(처리 대기)이 된다.
-- 인덱스 (status, target_type, target_id): "대기 중 신고를 대상별로 묶기"와 "이 대상의 대기 신고 한꺼번에 처리"가 같이 쓴다.
ALTER TABLE report
    ADD COLUMN status     VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER detail,
    ADD COLUMN handled_by BIGINT      NULL AFTER status,
    ADD COLUMN handled_at DATETIME    NULL AFTER handled_by,
    ADD CONSTRAINT ck_report_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    ADD CONSTRAINT fk_report_handled_by FOREIGN KEY (handled_by) REFERENCES member (id),
    ADD KEY ix_report_status_target (status, target_type, target_id);
```

</details>

<details>
<summary>예외 처리 — 이미 처리한 대상</summary>

```java
package org.example.report;

// 신고는 있었지만 대기 중인 게 없다(이미 처리됨) — 409
public class NothingToResolveException extends RuntimeException {

    public NothingToResolveException() {
        super("처리할 대기 신고가 없습니다.");
    }
}
```

</details>

<details>
<summary>권한 표 — HANDLE_REPORT</summary>

```java
package org.example.admin;

// 13-1 운영 권한 — 역할(Role)이 어떤 권한을 갖는지는 Role 한 곳에서 정한다.
// 컨트롤러는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"(@RequirePermission)만 적는다.
public enum Permission {
    MODERATE_POST,   // 글 숨김·복구, 숨김 글 보기
    MANAGE_ROLE,     // 역할 바꾸기
    RUN_BATCH,       // 8-5 정합성 배치 수동 실행
    HANDLE_REPORT    // 13-2 신고 목록·처리
}

package org.example.admin;

import java.util.EnumSet;
import java.util.Set;

// 13-1 역할 → 권한 표. 새 역할·권한이 생기면 여기만 고친다(문자열 "ADMIN" 비교를 여기저기 두지 않는다)
public enum Role {
    USER(EnumSet.noneOf(Permission.class)),
    MODERATOR(EnumSet.of(Permission.MODERATE_POST, Permission.HANDLE_REPORT)),
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
<summary>MyBatis Mapper — 집계·조건부 UPDATE</summary>

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.report.ReportHandlingMapper">
    <select id="findGroups" resultType="org.example.report.ReportGroupValue">
        SELECT r.target_type, r.target_id, COUNT(*) AS report_count,
               GROUP_CONCAT(DISTINCT r.reason ORDER BY r.reason) AS reasons,
               MIN(r.created_at) AS first_reported_at, MAX(r.created_at) AS last_reported_at
        FROM report r WHERE r.status = #{status}
        GROUP BY r.target_type, r.target_id
        ORDER BY report_count DESC, last_reported_at DESC, r.target_type, r.target_id
        LIMIT #{limit} OFFSET #{offset}
    </select>
    <select id="countGroups" resultType="long">
        SELECT COUNT(*) FROM (SELECT 1 FROM report WHERE status = #{status}
                              GROUP BY target_type, target_id) g
    </select>
    <update id="resolvePending">
        UPDATE report SET status = #{newStatus}, handled_by = #{handlerId}, handled_at = #{now}
        WHERE target_type = #{targetType} AND target_id = #{targetId} AND status = 'PENDING'
    </update>
    <select id="exists" resultType="boolean">
        SELECT EXISTS (SELECT 1 FROM report WHERE target_type = #{targetType} AND target_id = #{targetId})
    </select>
</mapper>
```

</details>

## 직접 확인

회원 7(`tok-c01`)이 글과 댓글을 새로 쓰고, 회원 8·9·10이 신고한다. 운영자가 글은 숨기기로, 댓글은 기각으로 처리한다. 끝에서 글을 복구한 뒤 지운다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 실행할 때마다 새 글·댓글을 만들고 끝에서 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {"id": "P", "title": "회원 7이 새 글 쓰기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"boardSlug": "free", "title": "[채점] 신고 처리 확인 글", "content": "신고 처리 단계에서 만들고 끝에서 지우는 글"}},
    {"id": "K", "title": "회원 7이 그 글에 댓글", "method": "POST", "path": "/api/posts/{{P.body.id}}/comments", "headers": {"Authorization": "Bearer tok-c01"}, "body": {"content": "[채점] 신고될 댓글"}},
    {"id": "R1", "title": "회원 8이 글 신고(SPAM)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-c02"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "reason": "SPAM"}},
    {"id": "R2", "title": "회원 9가 글 신고(ABUSE)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-c03"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "reason": "ABUSE"}},
    {"id": "R3", "title": "회원 10이 댓글 신고(ETC)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-c04"}, "body": {"targetType": "COMMENT", "targetId": "{{K.body.id}}", "reason": "ETC", "detail": "[채점] 욕설"}},
    {"id": "L", "title": "대기 신고 묶음", "method": "GET", "path": "/api/admin/reports?size=50", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "H", "title": "글 숨김으로 처리", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "action": "HIDE"}},
    {"id": "HV", "title": "숨긴 글 비로그인 상세", "method": "GET", "path": "/api/posts/{{P.body.id}}"},
    {"id": "H2", "title": "같은 글 또 처리", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "action": "REJECT"}},
    {"id": "J", "title": "댓글 신고 기각", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "COMMENT", "targetId": "{{K.body.id}}", "action": "REJECT"}},
    {"id": "JV", "title": "운영자가 댓글 목록", "method": "GET", "path": "/api/posts/{{P.body.id}}/comments", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "LA", "title": "처리됨(ACCEPTED) 묶음", "method": "GET", "path": "/api/admin/reports?status=ACCEPTED&size=50", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "LP", "title": "대기 묶음 다시", "method": "GET", "path": "/api/admin/reports?size=50", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "MU", "title": "일반 회원이 목록", "method": "GET", "path": "/api/admin/reports", "headers": {"Authorization": "Bearer tok-kimjava"}},
    {"id": "MP", "title": "일반 회원이 처리", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "action": "HIDE"}},
    {"id": "NT", "title": "토큰 없이 목록", "method": "GET", "path": "/api/admin/reports"},
    {"id": "Q1", "title": "status가 없는 값", "method": "GET", "path": "/api/admin/reports?status=DONE", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "Q2", "title": "size=0", "method": "GET", "path": "/api/admin/reports?size=0", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "Q3", "title": "size=51", "method": "GET", "path": "/api/admin/reports?size=51", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "Q4", "title": "page=-1", "method": "GET", "path": "/api/admin/reports?page=-1", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "Q5", "title": "size가 숫자 아님", "method": "GET", "path": "/api/admin/reports?size=abc", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "QE", "title": "빈 status", "method": "GET", "path": "/api/admin/reports?status=", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "QP", "title": "빈 page", "method": "GET", "path": "/api/admin/reports?page=", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "QS", "title": "빈 size", "method": "GET", "path": "/api/admin/reports?size=", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "Q6", "title": "size=50(상한 안)", "method": "GET", "path": "/api/admin/reports?size=50&status=REJECTED", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "V0", "title": "빈 본문", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {}},
    {"id": "VA", "title": "action이 없는 값", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": "{{P.body.id}}", "action": "DELETE"}},
    {"id": "VT", "title": "targetType이 없는 값", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "USER", "targetId": "{{P.body.id}}", "action": "HIDE"}},
    {"id": "VI", "title": "targetId가 0", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": 0, "action": "HIDE"}},
    {"id": "VS", "title": "targetId가 숫자 문자열", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": "12", "action": "HIDE"}},
    {"id": "VF", "title": "targetId가 소수", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": 12.8, "action": "HIDE"}},
    {"id": "VM", "title": "복합 오류", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "USER", "targetId": "12", "action": "DELETE"}},
    {"id": "VJ", "title": "JSON이 아닌 본문", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin", "Content-Type": "application/json"}, "body": "action=HIDE"},
    {"id": "VN", "title": "신고가 없는 대상", "method": "POST", "path": "/api/admin/reports/resolve", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"targetType": "POST", "targetId": 99999999, "action": "HIDE"}},
    {"id": "X1", "title": "뒷정리 — 글 복구", "method": "PATCH", "path": "/api/admin/posts/{{P.body.id}}/status", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"status": "PUBLISHED"}},
    {"id": "X2", "title": "뒷정리 — 글 지우기", "method": "DELETE", "path": "/api/posts/{{P.body.id}}", "headers": {"Authorization": "Bearer tok-c01"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "R1", "expect": {"status": 201}}, {"request": "R2", "expect": {"status": 201}}, {"request": "R3", "expect": {"status": 201}}, {"request": "L", "expect": {"status": 200, "json": [{"path": "$.items[0].targetType", "equals": "POST"}, {"path": "$.items[0].targetId", "equals": "{{P.body.id}}"}, {"path": "$.items[0].reportCount", "equals": 2}, {"path": "$.items[0].reasons", "equals": ["ABUSE", "SPAM"]}, {"path": "$.items[0].preview", "equals": "[채점] 신고 처리 확인 글"}, {"path": "$.items[*].targetId", "contains": "{{K.body.id}}"}, {"path": "$.totalElements", "gte": 2}]}}]},
    {"id": "C2", "all": [{"request": "H", "expect": {"status": 200, "json": [{"path": "$", "equals": {"targetType": "POST", "targetId": "{{P.body.id}}", "action": "HIDE", "resolvedCount": 2, "targetStatus": "HIDDEN"}}]}}, {"request": "HV", "expect": {"status": 404}}, {"request": "H2", "expect": {"status": 409}}]},
    {"id": "C3", "all": [{"request": "J", "expect": {"status": 200, "json": [{"path": "$.resolvedCount", "equals": 1}, {"path": "$.targetStatus", "type": "null"}]}}, {"request": "JV", "expect": {"status": 200, "json": [{"path": "$[*].id", "contains": "{{K.body.id}}"}]}}, {"request": "LA", "expect": {"status": 200, "json": [{"path": "$.items[*].targetId", "contains": "{{P.body.id}}"}]}}, {"request": "LP", "expect": {"status": 200, "json": [{"path": "$.items[*].targetId", "notContains": "{{P.body.id}}"}, {"path": "$.items[*].targetId", "notContains": "{{K.body.id}}"}]}}, {"request": "X1", "expect": {"status": 200}}, {"request": "X2", "expect": {"status": 204}}]},
    {"id": "C4", "all": [{"request": "MU", "expect": {"status": 403}}, {"request": "MP", "expect": {"status": 403}}, {"request": "NT", "expect": {"status": 401}}, {"request": "Q1", "expect": {"status": 400}}, {"request": "Q2", "expect": {"status": 400}}, {"request": "Q3", "expect": {"status": 400}}, {"request": "Q4", "expect": {"status": 400}}, {"request": "Q5", "expect": {"status": 400}}, {"request": "QE", "expect": {"status": 400}}, {"request": "QP", "expect": {"status": 400}}, {"request": "QS", "expect": {"status": 400}}, {"request": "Q6", "expect": {"status": 200}}]},
    {"id": "C5", "all": [{"request": "V0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}, {"path": "$.errors[*].field", "contains": "targetId"}, {"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "VA", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "VT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}]}}, {"request": "VI", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "VS", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "VF", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "VM", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}, {"path": "$.errors[*].field", "contains": "targetId"}, {"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "VJ", "expect": {"status": 400}}, {"request": "VN", "expect": {"status": 404}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | R1·R2·R3 / L | 신고 3건 `201` / 대기 묶음 맨 위가 그 글(신고 2건, 사유 `ABUSE`·`SPAM`, 미리보기=제목), 댓글 묶음도 목록에 있다 |
| C2 | H / HV / H2 | 숨기기 처리 `resolvedCount`=2·`targetStatus`=`HIDDEN` / 그 글이 비로그인에게 `404` / 같은 글을 또 처리하면 `409` |
| C3 | J / JV / LA / LP / X1·X2 | 댓글 신고 기각 `resolvedCount`=1, `targetStatus`=null / 기각된 댓글은 그대로 남아 있다 / 처리됨 목록에 그 글이 있고, 대기 목록에서는 글·댓글이 빠졌다 / 뒷정리(복구·삭제) |
| C4 | MU·MP / NT / Q1~Q5·QE·QP·QS / Q6 | 일반 회원 `403` / 토큰 없음 `401` / 없는 `status`·`size` 0·51·`page` -1·숫자 아닌 `size`는 `400` / `size`=50은 `200` |
| C5 | V0 / VA·VT·VI·VS·VF·VM / VJ / VN | 빈 본문 `400`(`errors`에 `targetType`·`targetId`·`action` 셋 다) / 허용 안 되는 값·0은 `400`(그 필드) / JSON 아님 `400` / 신고가 없는 대상 `404` |
| D1 | `SELECT status, COUNT(*), COUNT(handled_by), COUNT(handled_at) FROM report WHERE target_id = (SELECT MAX(id) FROM post WHERE title = '[채점] 신고 처리 확인 글') AND target_type = 'POST' GROUP BY status` | `ACCEPTED 2 2 2` — 두 건 모두 처리자·시각이 있다 |
| D2 | `SELECT p.hidden_by, p.deleted_at IS NOT NULL FROM post p WHERE p.id = (SELECT MAX(id) FROM post WHERE title = '[채점] 신고 처리 확인 글')` | `NULL`, `1` — 복구로 숨김 기록이 지워진 뒤 삭제됐다 |
| D3 | `SELECT COUNT(*) FROM report WHERE status = 'PENDING' AND handled_by IS NOT NULL` | `0` |
| R1 | 묶기 | 대상별 묶음과 개수를 `GROUP BY` 한 번으로 구하고, 미리보기는 종류별 `IN` 한 번씩이다(묶음마다 글·댓글을 따로 조회하지 않는다) |
| R2 | 가져가기 | `UPDATE … WHERE … AND status = 'PENDING'`의 영향 행 수로 "내가 처리했나"를 판단하고, 0이면 대상에 아무것도 하지 않는다. 먼저 SELECT로 대기 여부를 보고 나중에 UPDATE하면 두 운영자가 동시에 처리할 때 무엇이 겹치는지 말할 수 있다 |
| R3 | 조치 재사용 | 글 숨김은 13-1 `hide`, 댓글은 5-3 삭제와 같은 메서드(또는 같은 규칙)를 쓴다 — `comment_count`가 어긋나지 않는다 |
| R4 | 신고 다시 하기 | 12-6의 `UNIQUE (reporter_id, target_type, target_id)` 때문에 기각된 대상을 같은 사람이 다시 신고할 수 없다는 것을 안다. 다시 받게 하려면 무엇을 바꿔야 하는지(유니크를 대기 신고에만 거는 방법 등) 말할 수 있다 |

## 필요한 지식

- [R04 SQL CRUD와 JOIN](../../docs/knowledge/R04-sql-crud-join.md) — `GROUP BY`·`GROUP_CONCAT`·집계
- [P18 동시성 문제 실전](../../docs/knowledge/P18-concurrency-inventory.md) — 조건부 UPDATE로 "먼저 가져간 쪽만"
- [S10 Spring Data와 쿼리 도구](../../docs/knowledge/S10-spring-data-query.md) — 네이티브 쿼리 + 인터페이스 프로젝션
- [W15 페이징 — OFFSET vs 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md) — 운영 화면은 페이지 번호

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 묶음 쿼리</summary>

```sql
SELECT r.target_type AS targetType, r.target_id AS targetId, COUNT(*) AS reportCount,
       GROUP_CONCAT(DISTINCT r.reason ORDER BY r.reason) AS reasons,
       MIN(r.created_at) AS firstReportedAt, MAX(r.created_at) AS lastReportedAt
  FROM report r
 WHERE r.status = :status
 GROUP BY r.target_type, r.target_id
 ORDER BY reportCount DESC, lastReportedAt DESC, r.target_type, r.target_id
 LIMIT :limit OFFSET :offset
```

`@Query(nativeQuery = true)` + 별칭과 이름이 같은 getter를 가진 인터페이스(8-5의 `CountMismatchRow`와 같은 방식). 묶음 수는 `SELECT COUNT(*) FROM (SELECT 1 FROM report WHERE status = ? GROUP BY target_type, target_id) g`.
</details>

<details>
<summary>힌트 2 — 처리</summary>

```java
@Modifying(clearAutomatically = true)
@Query("UPDATE Report r SET r.status = :newStatus, r.handledBy.id = :handlerId, r.handledAt = :now "
     + "WHERE r.targetType = :type AND r.targetId = :id AND r.status = 'PENDING'")
int resolvePending(...);
```

반환값이 0이면 `existsByTargetTypeAndTargetId`로 404(신고 없음)와 409(이미 처리)를 가른다. 1 이상이면 `HIDE`일 때만 대상에 조치한다.
</details>

## 다음 단계

[13-3. 작성자 기간 정지](13-3-member-suspension.md)
