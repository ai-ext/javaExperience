# 12-6. 신고하기

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "광고 글이나 욕설 댓글을 신고할 수 있게 해 주세요. 사유는 몇 가지 중에서 고르고, '기타'면 직접 적게요. 한 사람이 같은 글을 여러 번 신고하면 안 되고요. 신고가 쌓이면 운영자가 보고 처리할 거예요(그건 다음 장)."

신고는 **사용자가 보내는 값이 가장 많은** API다. 대상 종류·번호, 사유 코드, 상세 내용 중 하나라도 이상하면 `500`이 아니라 `400`으로 무엇이 틀렸는지 알려 줘야 한다. 이 단계에서 연습할 것이 셋이다.

- **필드 규칙** — 필수·빈 값·길이·허용 값. 그리고 두 필드를 함께 봐야 하는 규칙("사유가 기타면 상세 필수").
- **대상 확인** — 글이든 댓글이든, 없거나 지웠거나 **내가 볼 수 없는** 대상은 `404`(있다는 사실도 드러내지 않는다 — 2-3과 같다). 내 글·댓글은 신고할 수 없다.
- **중복** — 같은 사람이 같은 대상을 두 번 신고하면 `409`. 버튼을 빠르게 두 번 눌러 동시에 와도 한 줄만 저장된다.

신고를 처리(숨김·기각)하는 쪽은 13장에서 이 테이블에 컬럼을 더해 만든다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 — 신고하기",
  "summary": "[⋯] → [신고] → 사유 고르기(기타면 직접 입력) → 보내기. 같은 글을 또 신고하면 409.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "MySQL 인덱스 설계 질문드립니다", "right": "자바초보탈출" },
    { "type": "select", "id": "reason", "label": "신고 사유", "value": "기타(ETC)" },
    { "type": "field", "id": "detail", "label": "상세 내용(기타일 때 필수, 500자까지)", "value": "", "multiline": true, "error": "사유가 기타(ETC)면 상세 내용을 적어 주세요." },
    { "type": "actions", "id": "buttons", "items": [{ "id": "send", "label": "신고 보내기", "variant": "danger" }] },
    { "type": "toast", "id": "toast-done", "value": "신고가 접수됐어요", "tone": "success" },
    { "type": "toast", "id": "toast-dup", "value": "이미 신고한 글이에요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "기타인데 상세 없이 보내기",
      "steps": [
        { "kind": "user", "text": "사유를 '기타'로 두고 상세를 비운 채 [신고 보내기]", "focus": ["reason", "detail", "send"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/reports",
          "headers": ["Authorization: Bearer tok-p03", "Content-Type: application/json"],
          "body": "{\"targetType\": \"POST\", \"targetId\": 12, \"reason\": \"ETC\"}"
        },
        { "kind": "server", "text": "@Valid — 필드 규칙 + 클래스에 붙인 '기타면 상세 필수' 규칙. 저장 전에 막는다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"detail\": \"입력값이 올바르지 않습니다.\", \"errors\": [{\"field\": \"detail\", \"message\": \"사유가 기타(ETC)면 상세 내용을 적어 주세요.\"}]}" },
        { "kind": "screen", "text": "상세 칸 아래에 오류 문구 — errors[].field로 어느 칸인지 안다", "focus": ["detail"] }
      ]
    },
    {
      "name": "신고 — 그리고 한 번 더",
      "steps": [
        { "kind": "user", "text": "사유를 '스팸'으로 골라 보낸다. 응답이 늦어 한 번 더 누른다", "focus": ["reason", "send"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/reports",
          "headers": ["Authorization: Bearer tok-p03", "Content-Type: application/json"],
          "body": "{\"targetType\": \"POST\", \"targetId\": 12, \"reason\": \"SPAM\"}"
        },
        { "kind": "server", "text": "대상 찾기(없음·지움·볼 수 없음 404) → 내 글이면 400 → 이미 신고했으면 409 → 저장(동시에 와서 둘 다 통과하면 UNIQUE가 막고 그것도 409)" },
        { "kind": "db", "sql": "INSERT INTO report (reporter_id, target_type, target_id, reason, detail, created_at) VALUES (3, 'POST', 12, 'SPAM', NULL, ...)", "note": "UNIQUE (reporter_id, target_type, target_id)" },
        { "kind": "response", "status": 201, "body": "{\"id\": 1, \"targetType\": \"POST\", \"targetId\": 12, \"reason\": \"SPAM\", \"detail\": null, \"createdAt\": \"2026-10-05T00:00:00\"}" },
        { "kind": "screen", "text": "접수 토스트. 두 번째 요청은 409 → '이미 신고한 글이에요'", "focus": ["toast-done", "toast-dup"] }
      ]
    }
  ]
}
```

## 만들 것

**V33** — `db/migration/V33__create_report.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `reporter_id` | 신고한 회원, FK → `member` |
| `target_type` | `VARCHAR(20)`, `CHECK (target_type IN ('POST', 'COMMENT'))` |
| `target_id` | 글 또는 댓글 id — **FK 없음**(가리키는 테이블이 종류마다 다르다) |
| `reason` | `VARCHAR(20)`, `CHECK (reason IN ('SPAM', 'ABUSE', 'ADULT', 'PRIVACY', 'ETC'))` |
| `detail` | `VARCHAR(500) NULL` |
| `created_at` | 신고 시각 |
| 제약·인덱스 | `UNIQUE (reporter_id, target_type, target_id)` — 같은 사람·같은 대상 한 줄. `(target_type, target_id)` 인덱스 — 13장에서 "이 대상의 신고들"을 모을 때 쓴다 |

**API** — `POST /api/reports` (토큰 필요)

| 결과 | 응답 |
|---|---|
| 성공 | `201` `{ "id", "targetType", "targetId", "reason", "detail", "createdAt" }` — `detail`이 비었거나 공백뿐이면 `null`로 저장 |
| 필드 규칙 위반 | `400` + `errors`에 틀린 필드 **모두**(아래 표) |
| 대상 없음·지워짐·내가 볼 수 없음(2-3 규칙) | `404` — 숨김 글·삭제된 글·삭제된 댓글 포함 |
| 내 글·내 댓글 | `400` |
| 이미 신고함(동시에 와도) | `409` |
| 토큰 없음 | `401` |

**필드 규칙**

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식·허용 값 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `targetType` | 필수 | 안 됨 | — | `POST`·`COMMENT` | 없음 | `400`, `errors`에 `targetType` |
| `targetId` | 필수 | 안 됨 | 1 이상 | 정수 | 없음 | 0·음수·null `400`(`errors`에 `targetId`), 숫자가 아니면 형식 오류 `400`(`errors`에 `targetId` — 11-1 공통 처리기), 없는 대상 `404` |
| `reason` | 필수 | 안 됨 | — | `SPAM`·`ABUSE`·`ADULT`·`PRIVACY`·`ETC` | 없음 | `400`, `errors`에 `reason` |
| `detail` | `reason`이 `ETC`일 때만 필수 | `ETC`면 없음·`null`·공백만 거절, 그 밖에는 허용 | 500자까지(500 성공, 501 거절) | 문자열 | `null` | `400`, `errors`에 `detail` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- @Valid — 필드 규칙 + 클래스에 붙인 '기타면 상세 필수' 규칙. 저장 전에 막는다
- 대상 찾기(없음·지움·볼 수 없음 404) → 내 글이면 400 → 이미 신고했으면 409 → 저장(동시에 와서 둘 다 통과하면 UNIQUE가 막고 그것도 409)
- UNIQUE (reporter_id, target_type, target_id)

<details>
<summary>Controller — HTTP 연결</summary>

`ReportController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/reports")`. 변경된 메서드: `report`.


```java
package org.example.report;

import jakarta.validation.Validator;
import org.example.post.InvalidParametersException;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class ReportController {

    private final ReportService reportService;
    private final Validator validator;

    public ReportController(ReportService reportService, Validator validator) {
        this.reportService = reportService;
        this.validator = validator;
    }

    // POST라 토큰 없음은 인터셉터가 401로 막는다
    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse report(@LoginMember AuthenticatedMember me, @RequestBody JsonNode body) {
        ReportRequest.Parsed parsed = ReportRequest.parse(body);
        ReportRequest request = parsed.request();
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return reportService.report(me, request);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`ReportRequest.java`, `ReportResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.


```java
package org.example.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

// 신고 요청 — 필드 하나하나의 규칙은 애노테이션으로, "사유가 ETC면 상세 필수"처럼 두 필드를 함께 봐야 하는
// 규칙은 클래스에 붙인 @DetailRequiredForEtc로 검사한다(오류는 detail 필드에 붙는다).
@DetailRequiredForEtc
public record ReportRequest(
        @NotNull(message = "신고 대상 종류를 골라 주세요.")
        @Pattern(regexp = "POST|COMMENT", message = "신고 대상 종류는 POST 또는 COMMENT입니다.")
        String targetType,

        @NotNull(message = "신고 대상 번호가 필요합니다.")
        @Positive(message = "신고 대상 번호는 1 이상이어야 합니다.")
        Long targetId,

        @NotNull(message = "신고 사유를 골라 주세요.")
        @Pattern(regexp = "SPAM|ABUSE|ADULT|PRIVACY|ETC", message = "신고 사유는 SPAM·ABUSE·ADULT·PRIVACY·ETC 중 하나입니다.")
        String reason,

        @Size(max = 500, message = "상세 내용은 500자 이하여야 합니다.")
        String detail
) {
    // Jackson은 기본 설정에서 JSON 문자열·소수를 숫자로, 숫자를 문자열로 바꿀 수 있다.
    // 먼저 원문 타입을 검사한 뒤 Bean Validation이 값 범위·조합을 검사한다.
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String targetType = text(body.get("targetType"), "targetType", errors);
        Long targetId = targetId(body.get("targetId"), errors);
        String reason = text(body.get("reason"), "reason", errors);
        String detail = text(body.get("detail"), "detail", errors);
        return new Parsed(new ReportRequest(targetType, targetId, reason, detail), Map.copyOf(errors));
    }

    public record Parsed(ReportRequest request, Map<String, String> errors) {
    }

    private static String text(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            errors.put(field, field + "는 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }

    private static Long targetId(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isIntegralNumber() || !value.canConvertToLong()) {
            errors.put("targetId", "targetId는 정수여야 합니다.");
            return null;
        }
        return value.longValue();
    }
}

package org.example.report;

import java.time.LocalDateTime;

public record ReportResponse(Long id, String targetType, Long targetId, String reason, String detail,
                             LocalDateTime createdAt) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`DetailRequiredForEtcValidator.java`, `ReportService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `report`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.


```java
package org.example.report;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DetailRequiredForEtcValidator implements ConstraintValidator<DetailRequiredForEtc, ReportRequest> {

    @Override
    public boolean isValid(ReportRequest request, ConstraintValidatorContext context) {
        if (request == null || !"ETC".equals(request.reason())) {
            return true;
        }
        if (request.detail() != null && !request.detail().isBlank()) {
            return true;
        }
        // 오류를 클래스가 아니라 detail 필드에 붙인다 — 응답의 errors[].field가 "detail"이 된다
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("detail")
                .addConstraintViolation();
        return false;
    }
}

package org.example.report;

import org.example.auth.AuthenticatedMember;
import org.example.comment.Comment;
import org.example.comment.CommentRepository;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

// 12-6 신고 — 확인 순서: 대상 찾기(없음·지움·볼 수 없음 404) → 내 것(400) → 이미 신고(409) → 저장
@Service
public class ReportService {

    public static final String POST = "POST";
    public static final String COMMENT = "COMMENT";

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public ReportService(ReportRepository reportRepository, PostRepository postRepository,
                         CommentRepository commentRepository, MemberRepository memberRepository,
                         PostAccessPolicy accessPolicy, Clock clock) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public ReportResponse report(AuthenticatedMember me, ReportRequest request) {
        Long ownerId = findVisibleTargetOwner(me, request.targetType(), request.targetId());
        if (ownerId.equals(me.id())) {
            throw new SelfReportNotAllowedException();
        }
        // 흔한 경우(이미 신고함)는 먼저 걸러 깔끔한 409를 주고,
        // 동시에 두 번 눌러 둘 다 통과한 경우는 UNIQUE(uk_report_reporter_target)가 막는다 — 그 오류도 409로 바꾼다
        if (reportRepository.existsByReporter_IdAndTargetTypeAndTargetId(me.id(), request.targetType(), request.targetId())) {
            throw new DuplicateReportException();
        }
        String detail = request.detail() == null || request.detail().isBlank() ? null : request.detail().strip();
        Report saved;
        try {
            saved = reportRepository.saveAndFlush(new Report(memberRepository.getReferenceById(me.id()),
                    request.targetType(), request.targetId(), request.reason(), detail, LocalDateTime.now(clock)));
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateReportException();
        }
        return new ReportResponse(saved.getId(), saved.getTargetType(), saved.getTargetId(), saved.getReason(),
                saved.getDetail(), saved.getCreatedAt());
    }

    // 대상의 작성자 id. 글은 2-3 규칙(볼 수 있나), 댓글은 지워지지 않았고 그 글을 볼 수 있어야 한다
    private Long findVisibleTargetOwner(AuthenticatedMember me, String targetType, Long targetId) {
        if (POST.equals(targetType)) {
            Post post = postRepository.findById(targetId)
                    .filter(p -> "PUBLISHED".equals(p.getStatus()) && accessPolicy.canView(me, p))
                    .orElseThrow(ReportTargetNotFoundException::new);
            return post.getAuthor().getId();
        }
        Comment comment = commentRepository.findById(targetId)
                .filter(c -> c.getDeletedAt() == null)
                .filter(c -> "PUBLISHED".equals(c.getPost().getStatus()) && accessPolicy.canView(me, c.getPost()))
                .orElseThrow(ReportTargetNotFoundException::new);
        return comment.getMember().getId();
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`ReportRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.


```java
package org.example.report;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporter_IdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Report.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.


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
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V33__create_report.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.


```sql
-- V33 — 신고(12-6). 대상은 글 또는 댓글이라 target_type + target_id 두 컬럼으로 가리킨다.
-- target_id에는 FK를 걸 수 없다(가리키는 테이블이 종류마다 다르다) — 대상 존재 확인은 애플리케이션이 한다.
-- 같은 사람이 같은 대상을 두 번 신고하지 못하게 UNIQUE로 막는다(동시에 두 번 눌러도 한 줄).
-- 처리 상태(대기·처리됨)는 13장(운영)에서 컬럼을 더한다.
CREATE TABLE report (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    reporter_id BIGINT       NOT NULL,
    target_type VARCHAR(20)  NOT NULL,
    target_id   BIGINT       NOT NULL,
    reason      VARCHAR(20)  NOT NULL,
    detail      VARCHAR(500) NULL,
    created_at  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_report_reporter_target (reporter_id, target_type, target_id),
    KEY ix_report_target (target_type, target_id),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES member (id),
    CONSTRAINT ck_report_target_type CHECK (target_type IN ('POST', 'COMMENT')),
    CONSTRAINT ck_report_reason CHECK (reason IN ('SPAM', 'ABUSE', 'ADULT', 'PRIVACY', 'ETC'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '신고 — 글·댓글, 한 사람이 한 대상에 한 번';
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `DuplicateReportException.java`, `ReportTargetNotFoundException.java`, `SelfReportNotAllowedException.java`.

예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다.

변경된 메서드: `handleReportTargetNotFound`, `handleSelfReport`, `handleDuplicateReport`.


```java
package org.example.report;

// 같은 사람이 같은 대상을 또 신고 — 전역 핸들러가 409로 변환한다
public class DuplicateReportException extends RuntimeException {

    public DuplicateReportException() {
        super("이미 신고한 대상입니다.");
    }
}

package org.example.report;

// 없는 대상, 지워진 대상, 신고하는 사람이 볼 수 없는 대상 — 전역 핸들러가 404로 변환한다
public class ReportTargetNotFoundException extends RuntimeException {

    public ReportTargetNotFoundException() {
        super("신고할 대상을 찾을 수 없습니다.");
    }
}

package org.example.report;

// 내 글·내 댓글 신고 — 전역 핸들러가 400으로 변환한다
public class SelfReportNotAllowedException extends RuntimeException {

    public SelfReportNotAllowedException() {
        super("자기 글이나 댓글은 신고할 수 없습니다.");
    }
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`DetailRequiredForEtc.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.


```java
package org.example.report;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// 두 필드를 함께 보는 검증(사유가 ETC면 상세 필수) — 클래스(레코드)에 붙인다
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DetailRequiredForEtcValidator.class)
public @interface DetailRequiredForEtc {

    String message() default "사유가 기타(ETC)면 상세 내용을 적어 주세요.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

</details>
<details>
<summary>MyBatis Mapper — 신고 중복 확인·저장 SQL 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글에서 `ReportCommandMapper.java`·`ReportCommandMapper.xml`·`ReportInsert.java`·교체한 `ReportService.java` 전문을 볼 수 있다.

대상 글·댓글의 공개 범위는 공통 JPA 조회를 재사용하며, 신고 행 조회·저장은 MyBatis로 실행한다.

중복을 먼저 확인해 409를 주고, 동시 요청은 DB UNIQUE와 `DataIntegrityViolationException` 변환으로 막는다.


```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.report.ReportCommandMapper">
    <select id="exists" resultType="boolean">
        SELECT EXISTS (
            SELECT 1 FROM report
            WHERE reporter_id = #{reporterId} AND target_type = #{targetType} AND target_id = #{targetId}
        )
    </select>
    <insert id="insert" parameterType="org.example.report.ReportInsert"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO report (reporter_id, target_type, target_id, reason, detail, created_at)
        VALUES (#{reporterId}, #{targetType}, #{targetId}, #{reason}, #{detail}, #{createdAt})
    </insert>
</mapper>
```


</details>


## 직접 확인

글 12는 회원 2의 글, 댓글 20은 그 글에 회원 24가 단 댓글이다. 글 99는 숨김, 글 42는 삭제됨, 댓글 69는 삭제됨.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 신고는 지우는 API가 없어서 두 번째 실행부터는 성공 요청이 `409`로 바뀐다 — 채점 기준이 두 경우를 모두 받는다.

```check
{
  "requests": [
    {"id": "R1", "title": "회원 3이 글 12 신고(SPAM)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "SPAM"}},
    {"id": "R2", "title": "같은 신고 한 번 더", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "SPAM"}},
    {"id": "RC", "title": "회원 3이 댓글 20 신고(ABUSE)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "COMMENT", "targetId": 20, "reason": "ABUSE"}},
    {"id": "CC", "title": "회원 5가 글 13을 동시에 3번 신고", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p05"}, "body": {"targetType": "POST", "targetId": 13, "reason": "SPAM"}, "concurrent": {"count": 3}},
    {"id": "E0", "title": "빈 본문 {}", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {}},
    {"id": "ET", "title": "targetType이 없는 값", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "USER", "targetId": 12, "reason": "SPAM"}},
    {"id": "EN", "title": "targetId가 null", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": null, "reason": "SPAM"}},
    {"id": "EZ", "title": "targetId가 0", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 0, "reason": "SPAM"}},
    {"id": "ES", "title": "targetId가 숫자 문자열", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": "12", "reason": "SPAM"}},
    {"id": "EF", "title": "targetId가 소수", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12.8, "reason": "SPAM"}},
    {"id": "EM", "title": "복합 오류를 모두 반환", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "USER", "targetId": "12", "reason": "HATE", "detail": 123}},
    {"id": "ED", "title": "detail이 숫자", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "SPAM", "detail": 123}},
    {"id": "EA", "title": "운영자도 숨김 글은 신고 불가", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p01"}, "body": {"targetType": "POST", "targetId": 99, "reason": "SPAM"}},
    {"id": "EX", "title": "targetId가 숫자 아님", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": "abc", "reason": "SPAM"}},
    {"id": "ER", "title": "reason이 없는 값", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "HATE"}},
    {"id": "EE", "title": "ETC인데 detail 없음", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "ETC"}},
    {"id": "EB", "title": "ETC인데 detail이 공백만", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "ETC", "detail": "   "}},
    {"id": "EL", "title": "detail 501자(상한 바로 밖)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 12, "reason": "ETC", "detail": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "EJ", "title": "JSON이 아닌 본문", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03", "Content-Type": "application/json"}, "body": "targetType=POST"},
    {"id": "RM", "title": "detail 정확히 500자(상한 바로 안)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p07"}, "body": {"targetType": "POST", "targetId": 145, "reason": "ETC", "detail": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "TH", "title": "숨김 글(99)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 99, "reason": "SPAM"}},
    {"id": "TD", "title": "삭제된 글(42)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 42, "reason": "SPAM"}},
    {"id": "TC", "title": "삭제된 댓글(69)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "COMMENT", "targetId": 69, "reason": "SPAM"}},
    {"id": "TN", "title": "없는 글", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p03"}, "body": {"targetType": "POST", "targetId": 99999999, "reason": "SPAM"}},
    {"id": "TS", "title": "내 글 신고(회원 2)", "method": "POST", "path": "/api/reports", "headers": {"Authorization": "Bearer tok-p02"}, "body": {"targetType": "POST", "targetId": 12, "reason": "SPAM"}},
    {"id": "NT", "title": "토큰 없음", "method": "POST", "path": "/api/reports", "body": {"targetType": "POST", "targetId": 12, "reason": "SPAM"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "R1", "expect": {"anyOf": [{"status": 201, "json": [{"path": "$.targetType", "equals": "POST"}, {"path": "$.targetId", "equals": 12}, {"path": "$.reason", "equals": "SPAM"}, {"path": "$.detail", "type": "null"}, {"path": "$.id", "type": "number"}]}, {"status": 409}]}}, {"request": "R2", "expect": {"status": 409}}, {"request": "RC", "expect": {"status": [201, 409]}}]},
    {"id": "C2", "request": "CC", "expect": {"status": [201, 409]}},
    {"id": "C3", "all": [{"request": "E0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}, {"path": "$.errors[*].field", "contains": "targetId"}, {"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "ET", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}]}}, {"request": "EN", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "EZ", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "EX", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "ES", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "EF", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetId"}]}}, {"request": "ED", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "detail"}]}}, {"request": "EM", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "targetType"}, {"path": "$.errors[*].field", "contains": "targetId"}, {"path": "$.errors[*].field", "contains": "reason"}, {"path": "$.errors[*].field", "contains": "detail"}]}}, {"request": "ER", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "reason"}]}}, {"request": "EE", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "detail"}]}}, {"request": "EB", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "detail"}]}}, {"request": "EL", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "detail"}]}}, {"request": "EJ", "expect": {"status": 400}}]},
    {"id": "C4", "request": "RM", "expect": {"anyOf": [{"status": 201, "json": [{"path": "$.detail", "matches": "^가{500}$"}]}, {"status": 409}]}},
    {"id": "C5", "all": [{"request": "TH", "expect": {"status": 404}}, {"request": "EA", "expect": {"status": 404}}, {"request": "TD", "expect": {"status": 404}}, {"request": "TC", "expect": {"status": 404}}, {"request": "TN", "expect": {"status": 404}}, {"request": "TS", "expect": {"status": 400}}, {"request": "NT", "expect": {"status": 401}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | R1 / R2 / RC | 처음이면 `201`(대상·사유가 그대로, `detail`=null), 이미 했으면 `409` / 같은 신고 `409` / 댓글 신고 `201` 또는 `409` |
| C2 | CC | 동시에 3번 — 모두 `201` 또는 `409`(`500` 없음) |
| C3 | E0·ET·EN·EZ·EX·ES·EF·ED·EM·ER·EE·EB·EL·EJ | 모두 `400`. 빈 본문은 `errors`에 `targetType`·`targetId`·`reason` **셋 다**, 나머지는 틀린 그 필드(`EX`는 11-1 공통 처리기가 `errors`에 `targetId`를 담는다. `EJ`처럼 JSON 문법 자체가 깨진 경우는 특정 필드를 알 수 없어 상태 `400`을 확인한다) |
| C4 | RM | `detail` 정확히 500자 + `ETC`는 통과 — 처음이면 `201`(500자 그대로), 이미 했으면 `409`(검증은 통과하고 중복에서 걸렸다) |
| C5 | TH·EA·TD·TC·TN / TS / NT | 숨김 글·삭제된 글·삭제된 댓글·없는 글 `404` / 내 글 `400` / 토큰 없음 `401` |
| D1 | `SELECT COUNT(*) FROM report WHERE reporter_id = 5 AND target_type = 'POST' AND target_id = 13` | `1` — 동시에 3번 와도 한 줄 |
| D2 | `SELECT reason, detail IS NULL FROM report WHERE reporter_id = 3 AND target_type = 'POST' AND target_id = 12` | `SPAM`, `1` |
| D3 | 실행 **전**과 **후**에 `SELECT COUNT(*) FROM report WHERE target_id IN (99, 42, 69) OR reporter_id = 2` | 전후 값이 같다 — 거절된 신고(숨김·삭제 대상, 내 글)는 저장되지 않았다 |
| R1 | 검증 위치 | 필드 규칙은 요청 DTO의 Bean Validation(`@NotNull`·`@Pattern`·`@Positive`·`@Size`), 두 필드를 함께 보는 규칙은 클래스 수준 제약(또는 서비스) — 오류가 `detail` 필드에 붙어 화면이 어느 칸인지 알 수 있다 |
| R2 | 중복 두 겹 | 먼저 `exists`로 걸러 `409`를 주고, 동시에 와서 둘 다 통과한 경우는 UNIQUE 위반(`DataIntegrityViolationException`)을 잡아 `409`로 바꾼다. 둘 중 하나만 있으면 무엇이 깨지는지 말할 수 있다 |
| R3 | 다형 대상 | `target_type + target_id`에는 FK를 걸 수 없어 존재 확인을 코드가 한다는 것, 대안(글 신고·댓글 신고 테이블을 나누기, 대상마다 nullable FK 컬럼 두 개)과 장단점을 말할 수 있다 |
| R4 | 존재 숨기기 | 볼 수 없는 대상(숨김·팔로워 공개 등)을 `403`이 아니라 `404`로 답한다(2-3과 같은 이유) |

## 필요한 지식

- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 필드 규칙과 업무 규칙(중복·내 것)
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md)
- [P18 — 좌석은 재고보다 유니크 제약이 핵심이다](../../docs/knowledge/P18-concurrency-inventory.md#28-좌석은-재고보다-유니크-제약이-핵심이다) — 중복 신고를 UNIQUE로
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md) — FK를 못 거는 다형 참조

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — "기타면 상세 필수"</summary>

레코드에 붙이는 제약 애노테이션 `@DetailRequiredForEtc`와 `ConstraintValidator<DetailRequiredForEtc, ReportRequest>`를 만든다. `isValid`에서 `reason`이 `ETC`이고 `detail`이 비었으면

```java
context.disableDefaultConstraintViolation();
context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
        .addPropertyNode("detail")
        .addConstraintViolation();
return false;
```

`addPropertyNode("detail")`이 없으면 오류가 클래스 전체에 붙어 1-5의 `errors[].field`에 나오지 않는다.
</details>

<details>
<summary>힌트 2 — 중복 409</summary>

`existsByReporter_IdAndTargetTypeAndTargetId(...)`가 true면 `409`. 그다음 `saveAndFlush`를 `try`로 감싸 `DataIntegrityViolationException`이면 `409`로 바꾼다(동시에 두 요청이 `exists`를 둘 다 false로 본 경우). 전역 핸들러에 새 예외 세 개(대상 없음 404·내 것 400·중복 409)를 더한다.
</details>

## 다음 단계

12장 끝. 13장에서는 쌓인 신고를 운영자가 처리하고, 글쓰기를 보호하는 운영 기능을 만든다 — [13-1. 운영 역할 — 모더레이터와 글 숨김·복구](../ch13-operations/13-1-roles-and-hide.md)
