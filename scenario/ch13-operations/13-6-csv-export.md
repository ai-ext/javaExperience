# 13-6. 신고 내역 CSV 내려받기

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "주간 운영 회의 때 신고 내역을 엑셀로 봐야 해요. 운영 화면에 [CSV 내려받기] 버튼을 달아 주세요. 지난번에 다른 데서 받은 CSV는 엑셀로 열면 한글이 다 깨지고, 파일 이름도 '___.csv'로 나오더라고요. 신고 상세에 쉼표나 따옴표가 들어 있어도 칸이 밀리면 안 돼요."

지금까지 API는 모두 JSON을 돌려줬다. 이번에는 **파일**을 돌려준다. 같은 데이터라도 파일로 내려보낼 때는 챙길 것이 많다.

| 문제 | 원인 | 해결 |
|---|---|---|
| 엑셀에서 한글이 깨진다 | 엑셀은 BOM이 없는 CSV를 UTF-8이 아니라 시스템 기본 인코딩(한국어 Windows는 CP949)으로 읽는다 | 본문 맨 앞에 BOM(`EF BB BF`)을 넣는다 |
| 파일 이름이 깨진다 | `Content-Disposition`의 `filename="..."`에는 ASCII만 안전하다 | `filename*=UTF-8''%EC%8B%A0…`(RFC 5987) — Spring `ContentDisposition`이 만들어 준다 |
| 칸이 밀린다 | 값 안의 쉼표·따옴표·줄바꿈 | RFC 4180 — 그런 값은 `"`로 감싸고 안의 `"`는 `""`로 |
| 열면 수식이 실행된다 | `=`·`+`·`-`·`@`, 탭·개행, 전각 `＝＋－＠`로 시작하는 셀을 스프레드시트가 수식으로 볼 수 있다(CSV 주입) | 그런 셀은 앞에 `'`를 붙이고 탭이 들어간 셀도 따옴표로 감싼다 |
| 브라우저 JS가 파일 이름을 못 읽는다 | `Content-Disposition`은 CORS 기본 노출 헤더가 아니다 | `CorsConfig`의 `exposedHeaders`에 더한다 |

신고자 닉네임이 들어가므로 내려받기는 **운영자(ADMIN)만** 할 수 있다. 모더레이터는 화면(13-2)에서만 본다. 13-1 표에 권한 하나를 더한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "운영 — 신고 내역 내려받기",
  "summary": "CSV를 파일로 받는다 — BOM, 한글 파일 이름(filename*), 따옴표 규칙, CSV 주입 막기.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "신고함", "right": "운영자" },
    { "type": "select", "id": "status", "label": "상태", "value": "전체" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "download", "label": "CSV 내려받기", "variant": "primary" }] },
    { "type": "code", "id": "file", "label": "신고내역-20261010.csv (엑셀에서 연 모습)", "value": "신고번호,대상,대상번호,사유,상세,신고자,...\n21,글,2,기타,\"광고, \"\"무료\"\" 쿠폰\",동시성05,...\n22,글,3,기타,'=1+1 계산해 보세요,동시성05,..." }
  ],
  "flows": [
    {
      "name": "내려받기",
      "steps": [
        { "kind": "user", "text": "[CSV 내려받기]를 누른다", "focus": ["status", "download"] },
        { "kind": "request", "method": "GET", "path": "/api/admin/reports/export", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "server", "text": "권한 EXPORT_DATA(ADMIN만) → 신고·신고자·처리자를 한 번에 읽는다 → BOM + 머리글 + 행(셀마다 따옴표 규칙·주입 막기), 줄 끝 CRLF" },
        { "kind": "db", "sql": "SELECT r.*, m.*, h.* FROM report r JOIN member m ON m.id = r.reporter_id LEFT JOIN member h ON h.id = r.handled_by ORDER BY r.id" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: text/csv;charset=UTF-8", "Content-Disposition: attachment; filename=\"__________-20261010.csv\"; filename*=UTF-8''%EC%8B%A0%EA%B3%A0%EB%82%B4%EC%97%AD-20261010.csv"], "body": "\\uFEFF신고번호,대상,대상번호,사유,상세,신고자,신고시각,처리상태,처리자,처리시각\\r\\n..." },
        { "kind": "screen", "text": "'신고내역-20261010.csv'로 저장되고 엑셀에서 한글·칸이 그대로 보인다", "focus": ["file"] }
      ]
    }
  ]
}
```

## 만들 것

**API** — `GET /api/admin/reports/export?status=` — 권한 `EXPORT_DATA`(13-1 표에 추가: **ADMIN만**). 토큰 없음 `401`, 권한 없음 `403`

| 값 | 필수 | 허용 값 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|
| `status` | 아니요 | `PENDING`·`ACCEPTED`·`REJECTED` | 없음(전부) | `400` |

**응답** `200`

| 항목 | 내용 |
|---|---|
| `Content-Type` | `text/csv;charset=UTF-8` |
| `Content-Disposition` | `attachment; …; filename*=UTF-8''<"신고내역-YYYYMMDD.csv"를 퍼센트 인코딩>` — 날짜는 오늘(`Clock`) |
| 본문 시작 | BOM(`EF BB BF`) |
| 머리글 | `신고번호,대상,대상번호,사유,상세,신고자,신고시각,처리상태,처리자,처리시각` |
| 행 | 신고 id 순. 대상 `글`·`댓글`, 사유 `스팸·광고`·`욕설·비방`·`음란물`·`개인정보 노출`·`기타`, 처리상태 `대기`·`조치`·`기각`, 시각 `yyyy-MM-dd HH:mm:ss`, 없는 값은 빈칸 |
| 셀 규칙 | 쉼표·`"`·줄바꿈이 있으면 `"`로 감싸고 안의 `"`는 `""`. `=`·`+`·`-`·`@`·탭·개행·전각 `＝＋－＠`로 시작하면 앞에 `'`; 탭이 들어간 셀도 `"`로 감싼다 |
| 줄 끝 | `\r\n`(CRLF) |

- CORS: `exposedHeaders`에 `Content-Disposition`을 더한다(13-5의 `Retry-After`와 함께).

## 구현 가이드

먼저 **만들 것**과 C·D 기준대로 직접 작성한다. 역할을 누르면 실행 검증한 코드의 파일 전문을 볼 수 있다. MyBatis 대안은 조회를 한 번의 JOIN으로 바꾸고 같은 CSV 바이트를 만든다.

<details>
<summary>Controller — CSV HTTP 응답</summary>

`src/main/java/org/example/report/ReportExportController.java`

```java
package org.example.report;

import jakarta.validation.constraints.Pattern;
import org.example.admin.Permission;
import org.example.admin.RequirePermission;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

// 13-6 — 신고자 닉네임 같은 개인정보가 들어가므로 운영자(ADMIN)만(EXPORT_DATA). 모더레이터는 화면에서만 본다
@RestController
@RequirePermission(Permission.EXPORT_DATA)
public class ReportExportController {

    private static final MediaType TEXT_CSV_UTF8 = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final ReportCsvService reportCsvService;
    private final Clock clock;

    public ReportExportController(ReportCsvService reportCsvService, Clock clock) {
        this.reportCsvService = reportCsvService;
        this.clock = clock;
    }

    @GetMapping("/api/admin/reports/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) @Pattern(regexp = "PENDING|ACCEPTED|REJECTED") String status) {
        String fileName = "신고내역-" + LocalDate.now(clock).format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";
        // filename*=UTF-8''%EC%8B%A0... — 한글 파일 이름은 RFC 5987 방식으로 인코딩해야 브라우저가 깨뜨리지 않는다
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(fileName, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(TEXT_CSV_UTF8)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(reportCsvService.export(status));
    }
}
```

</details>

<details>
<summary>Service — UTF-8 BOM·셀 인코딩</summary>

`src/main/java/org/example/report/ReportCsvService.java`

```java
package org.example.report;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// 13-6 신고 내역 CSV — 엑셀에서 바로 열리게: UTF-8 + BOM, RFC 4180 따옴표 규칙, 줄 끝 CRLF.
// 셀이 = + - @ 로 시작하면 앞에 '를 붙인다(CSV 주입 — 엑셀이 수식으로 실행하지 않게).
// 전부 메모리에 만든다 — 행이 수십만이면 StreamingResponseBody + 나눠 읽기로 바꿔야 한다
@Service
public class ReportCsvService {

    private static final String BOM = "\uFEFF";
    private static final String CRLF = "\r\n";
    // 탭·개행·전각 기호도 스프레드시트에서 수식 시작으로 해석될 수 있다.
    private static final String FORMULA_PREFIXES = "=+-@\t\r\n＝＋－＠";
    private static final String HEADER = "신고번호,대상,대상번호,사유,상세,신고자,신고시각,처리상태,처리자,처리시각";
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, String> TARGET = Map.of("POST", "글", "COMMENT", "댓글");
    private static final Map<String, String> REASON = Map.of(
            "SPAM", "스팸·광고", "ABUSE", "욕설·비방", "ADULT", "음란물", "PRIVACY", "개인정보 노출", "ETC", "기타");
    private static final Map<String, String> STATUS = Map.of("PENDING", "대기", "ACCEPTED", "조치", "REJECTED", "기각");

    private final ReportRepository reportRepository;

    public ReportCsvService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public byte[] export(String status) {
        List<Report> reports = reportRepository.findForExport(status);
        StringBuilder csv = new StringBuilder(BOM).append(HEADER).append(CRLF);
        for (Report r : reports) {
            csv.append(String.join(",",
                    String.valueOf(r.getId()),
                    TARGET.get(r.getTargetType()),
                    String.valueOf(r.getTargetId()),
                    REASON.get(r.getReason()),
                    cell(r.getDetail()),
                    cell(r.getReporter().getNickname()),
                    r.getCreatedAt().format(TIME),
                    STATUS.get(r.getStatus()),
                    cell(r.getHandledBy() == null ? null : r.getHandledBy().getNickname()),
                    r.getHandledAt() == null ? "" : r.getHandledAt().format(TIME)
            )).append(CRLF);
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // 사람이 쓴 값만 이 함수를 거친다(숫자·코드·시각은 쉼표·따옴표가 들어갈 일이 없다)
    static String cell(String value) {
        if (value == null) {
            return "";
        }
        String v = value;
        if (!v.isEmpty() && FORMULA_PREFIXES.indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r") || v.contains("\t")) {
            v = "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }
}
```

</details>

<details>
<summary>테스트 — 수식 시작·쉼표·개행 경계</summary>

`src/test/java/org/example/report/ReportCsvServiceTest.java`

```java
package org.example.report;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReportCsvServiceTest {

    @Test
    void spreadsheetFormulaPrefixesAreEscaped() {
        assertEquals("'=1+1", ReportCsvService.cell("=1+1"));
        assertEquals("\"'\t=1+1\"", ReportCsvService.cell("\t=1+1"));
        assertEquals("\"'\r=1+1\"", ReportCsvService.cell("\r=1+1"));
        assertEquals("\"'\n=1+1\"", ReportCsvService.cell("\n=1+1"));
        assertEquals("'＝1+1", ReportCsvService.cell("＝1+1"));
        assertEquals("'＋1+1", ReportCsvService.cell("＋1+1"));
        assertEquals("'－1+1", ReportCsvService.cell("－1+1"));
        assertEquals("'＠SUM(A1)", ReportCsvService.cell("＠SUM(A1)"));
    }

    @Test
    void commasQuotesAndNewlinesRemainOneCell() {
        assertEquals("\"광고, \"\"무료\"\" 쿠폰\"", ReportCsvService.cell("광고, \"무료\" 쿠폰"));
        assertEquals("\"첫 줄\n둘째 줄\"", ReportCsvService.cell("첫 줄\n둘째 줄"));
    }
}
```

</details>

<details>
<summary>JPA / Repository — 신고·회원 JOIN 조회</summary>

`src/main/java/org/example/report/ReportRepository.java`

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

    // 13-6 CSV — 신고자·처리자를 함께 읽는다(행마다 회원을 따로 조회하지 않는다). status가 null이면 전부
    @Query("""
            SELECT r FROM Report r
            JOIN FETCH r.reporter
            LEFT JOIN FETCH r.handledBy
            WHERE (:status IS NULL OR r.status = :status)
            ORDER BY r.id
            """)
    List<Report> findForExport(@Param("status") String status);
}
```

</details>

<details>
<summary>권한 — ADMIN 전용 EXPORT_DATA</summary>

`src/main/java/org/example/admin/Permission.java`

```java
package org.example.admin;

// 13-1 운영 권한 — 역할(Role)이 어떤 권한을 갖는지는 Role 한 곳에서 정한다.
// 컨트롤러는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"(@RequirePermission)만 적는다.
public enum Permission {
    MODERATE_POST,   // 글 숨김·복구, 숨김 글 보기
    MANAGE_ROLE,     // 역할 바꾸기
    RUN_BATCH,       // 8-5 정합성 배치 수동 실행
    HANDLE_REPORT,   // 13-2 신고 목록·처리
    SUSPEND_MEMBER,  // 13-3 기간 정지·해제
    MANAGE_BANNED_WORD, // 13-4 금칙어 관리(ADMIN만)
    EXPORT_DATA         // 13-6 CSV 내려받기(개인정보 — ADMIN만)
}
```

</details>

<details>
<summary>설정 — Content-Disposition CORS 노출</summary>

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
                // 노출해야 한다(CORS 기본 노출 헤더가 아니다)
                .exposedHeaders("Location", "WWW-Authenticate", "Retry-After", "Content-Disposition");
    }
}
```

</details>

<details>
<summary>MyBatis / DTO — CSV 행 투영</summary>

`src/main/java/org/example/report/ReportExportRow.java`

```java
package org.example.report;

import java.time.LocalDateTime;

// CSV에 필요한 열만 조회한다. 신고자·처리자 닉네임은 JOIN으로 한 번에 가져온다.
public record ReportExportRow(Long id, String targetType, Long targetId, String reason,
                              String detail, String reporterNickname, LocalDateTime createdAt,
                              String status, String handlerNickname, LocalDateTime handledAt) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — 조회 인터페이스</summary>

`src/main/java/org/example/report/ReportExportMapper.java`

```java
package org.example.report;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportExportMapper {
    List<ReportExportRow> findForExport(@Param("status") String status);
}
```

</details>

<details>
<summary>MyBatis / SQL — 신고·신고자·처리자 JOIN</summary>

`src/main/resources/mapper/ReportExportMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.report.ReportExportMapper">
    <resultMap id="exportRow" type="org.example.report.ReportExportRow">
        <constructor>
            <idArg column="id" javaType="java.lang.Long"/>
            <arg column="target_type" javaType="java.lang.String"/>
            <arg column="target_id" javaType="java.lang.Long"/>
            <arg column="reason" javaType="java.lang.String"/>
            <arg column="detail" javaType="java.lang.String"/>
            <arg column="reporter_nickname" javaType="java.lang.String"/>
            <arg column="created_at" javaType="java.time.LocalDateTime"/>
            <arg column="status" javaType="java.lang.String"/>
            <arg column="handler_nickname" javaType="java.lang.String"/>
            <arg column="handled_at" javaType="java.time.LocalDateTime"/>
        </constructor>
    </resultMap>
    <select id="findForExport" resultMap="exportRow">
        SELECT r.id, r.target_type, r.target_id, r.reason, r.detail,
               reporter.nickname AS reporter_nickname, r.created_at, r.status,
               handler.nickname AS handler_nickname, r.handled_at
          FROM report r
          JOIN member reporter ON reporter.id = r.reporter_id
          LEFT JOIN member handler ON handler.id = r.handled_by
         <where>
             <if test="status != null">r.status = #{status}</if>
         </where>
         ORDER BY r.id
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — 투영 행 직렬화</summary>

`src/main/java/org/example/report/ReportCsvService.java`

```java
package org.example.report;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

// 13-6 신고 내역 CSV — 엑셀에서 바로 열리게: UTF-8 + BOM, RFC 4180 따옴표 규칙, 줄 끝 CRLF.
// 셀이 = + - @ 로 시작하면 앞에 '를 붙인다(CSV 주입 — 엑셀이 수식으로 실행하지 않게).
// 전부 메모리에 만든다 — 행이 수십만이면 StreamingResponseBody + 나눠 읽기로 바꿔야 한다
@Service
public class ReportCsvService {

    private static final String BOM = "\uFEFF";
    private static final String CRLF = "\r\n";
    // 탭·개행·전각 기호도 스프레드시트에서 수식 시작으로 해석될 수 있다.
    private static final String FORMULA_PREFIXES = "=+-@\t\r\n＝＋－＠";
    private static final String HEADER = "신고번호,대상,대상번호,사유,상세,신고자,신고시각,처리상태,처리자,처리시각";
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, String> TARGET = Map.of("POST", "글", "COMMENT", "댓글");
    private static final Map<String, String> REASON = Map.of(
            "SPAM", "스팸·광고", "ABUSE", "욕설·비방", "ADULT", "음란물", "PRIVACY", "개인정보 노출", "ETC", "기타");
    private static final Map<String, String> STATUS = Map.of("PENDING", "대기", "ACCEPTED", "조치", "REJECTED", "기각");

    private final ReportExportMapper reportExportMapper;

    public ReportCsvService(ReportExportMapper reportExportMapper) {
        this.reportExportMapper = reportExportMapper;
    }

    @Transactional(readOnly = true)
    public byte[] export(String status) {
        List<ReportExportRow> reports = reportExportMapper.findForExport(status);
        StringBuilder csv = new StringBuilder(BOM).append(HEADER).append(CRLF);
        for (ReportExportRow r : reports) {
            csv.append(String.join(",",
                    String.valueOf(r.id()),
                    TARGET.get(r.targetType()),
                    String.valueOf(r.targetId()),
                    REASON.get(r.reason()),
                    cell(r.detail()),
                    cell(r.reporterNickname()),
                    r.createdAt().format(TIME),
                    STATUS.get(r.status()),
                    cell(r.handlerNickname()),
                    r.handledAt() == null ? "" : r.handledAt().format(TIME)
            )).append(CRLF);
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // 사람이 쓴 값만 이 함수를 거친다(숫자·코드·시각은 쉼표·따옴표가 들어갈 일이 없다)
    static String cell(String value) {
        if (value == null) {
            return "";
        }
        String v = value;
        if (!v.isEmpty() && FORMULA_PREFIXES.indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r") || v.contains("\t")) {
            v = "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }
}
```

</details>

## 직접 확인

회원 11(`tok-c05`)이 쉼표·따옴표, `=`, 탭, 전각 `＝`로 시작하는 상세로 각각 신고한 뒤, 운영자가 내려받는다.

```bash
BASE=http://localhost:8080
AD='Authorization: Bearer tok-admin'; C5='Authorization: Bearer tok-c05'; J='Content-Type: application/json'

curl -s -X POST "$BASE/api/reports" -H "$C5" -H "$J" -d '{"targetType":"POST","targetId":2,"reason":"ETC","detail":"광고, \"무료\" 쿠폰"}'; echo   # 처음 201, 다시 하면 409
curl -s -X POST "$BASE/api/reports" -H "$C5" -H "$J" -d '{"targetType":"POST","targetId":3,"reason":"ETC","detail":"=1+1 계산해 보세요"}'; echo
curl -s -D - -o reports.csv "$BASE/api/admin/reports/export" -H "$AD" | grep -i '^content-'   # 헤더
head -c 3 reports.csv | xxd          # ef bb bf — BOM
grep '쿠폰\|1+1' reports.csv         # "광고, ""무료"" 쿠폰" / '=1+1 계산해 보세요
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/admin/reports/export?status=DONE" -H "$AD"   # 400
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/admin/reports/export" -H 'Authorization: Bearer tok-kimjava'   # 403
```

`reports.csv`를 엑셀(또는 Numbers)로 열어 한글과 칸이 그대로인지, `=1+1`이 계산되지 않고 글자로 보이는지 확인한다. BOM을 빼고 만든 파일과 나란히 열어 보면 차이가 바로 보인다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 신고는 지우는 API가 없어 두 번째부터 `409`지만 CSV 내용은 같다. 두 번째 신고는 기각하여 상태 필터가 실제로 다른 행을 내보내는지 확인한다.

```check
{
  "requests": [
    {
      "id": "R1",
      "title": "회원 11이 글 2 신고(쉼표·따옴표 든 상세)",
      "method": "POST",
      "path": "/api/reports",
      "headers": {
        "Authorization": "Bearer tok-c05"
      },
      "body": {
        "targetType": "POST",
        "targetId": 2,
        "reason": "ETC",
        "detail": "광고, \"무료\" 쿠폰"
      }
    },
    {
      "id": "R2",
      "title": "회원 11이 글 3 신고(=로 시작하는 상세)",
      "method": "POST",
      "path": "/api/reports",
      "headers": {
        "Authorization": "Bearer tok-c05"
      },
      "body": {
        "targetType": "POST",
        "targetId": 3,
        "reason": "ETC",
        "detail": "=1+1 계산해 보세요"
      }
    },
    {
      "id": "R3",
      "title": "회원 11이 탭으로 시작하는 수식형 상세 신고",
      "method": "POST",
      "path": "/api/reports",
      "headers": {
        "Authorization": "Bearer tok-c05"
      },
      "body": {
        "targetType": "POST",
        "targetId": 4,
        "reason": "ETC",
        "detail": "\t=1+1 계산해 보세요"
      }
    },
    {
      "id": "R4",
      "title": "회원 11이 전각 등호로 시작하는 상세 신고",
      "method": "POST",
      "path": "/api/reports",
      "headers": {
        "Authorization": "Bearer tok-c05"
      },
      "body": {
        "targetType": "POST",
        "targetId": 5,
        "reason": "ETC",
        "detail": "＝1+1 계산해 보세요"
      }
    },
    {
      "id": "H",
      "title": "두 번째 신고를 기각해 상태 필터 검증",
      "method": "POST",
      "path": "/api/admin/reports/resolve",
      "headers": {
        "Authorization": "Bearer tok-admin"
      },
      "body": {
        "targetType": "POST",
        "targetId": 3,
        "action": "REJECT"
      }
    },
    {
      "id": "E",
      "title": "운영자가 CSV 내려받기",
      "method": "GET",
      "path": "/api/admin/reports/export",
      "headers": {
        "Authorization": "Bearer tok-admin",
        "Origin": "http://localhost:3000"
      }
    },
    {
      "id": "ES",
      "title": "대기 중인 것만",
      "method": "GET",
      "path": "/api/admin/reports/export?status=PENDING",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "ER",
      "title": "기각한 것만",
      "method": "GET",
      "path": "/api/admin/reports/export?status=REJECTED",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "EX",
      "title": "status가 없는 값",
      "method": "GET",
      "path": "/api/admin/reports/export?status=DONE",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "P1",
      "title": "일반 회원이 내려받기",
      "method": "GET",
      "path": "/api/admin/reports/export",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "P2",
      "title": "토큰 없이 내려받기",
      "method": "GET",
      "path": "/api/admin/reports/export"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "R1",
          "expect": {
            "status": [
              201,
              409
            ]
          }
        },
        {
          "request": "R2",
          "expect": {
            "status": [
              201,
              409
            ]
          }
        },
        {
          "request": "R3",
          "expect": {
            "status": [
              201,
              409
            ]
          }
        },
        {
          "request": "R4",
          "expect": {
            "status": [
              201,
              409
            ]
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "headers": {
              "Content-Type": {
                "matches": "^text/csv; ?charset=(UTF|utf)-8$"
              },
              "Content-Disposition": {
                "contains": "filename*=UTF-8''%EC%8B%A0%EA%B3%A0%EB%82%B4%EC%97%AD-"
              }
            },
            "bodyText": {
              "contains": "신고번호,대상,대상번호,사유,상세,신고자,신고시각,처리상태,처리자,처리시각"
            }
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "headers": {
              "Content-Disposition": {
                "matches": "^attachment;"
              }
            }
          }
        }
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "E",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "기타,\"광고, \"\"무료\"\" 쿠폰\",동시성05,"
            }
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "기타,'=1+1 계산해 보세요,동시성05,"
            }
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "bodyText": {
              "notContains": ",=1+1"
            }
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "기타,'=1+1 계산해 보세요"
            }
          }
        },
        {
          "request": "E",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "기타,'＝1+1 계산해 보세요"
            }
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "H",
          "expect": {
            "status": [
              200,
              409
            ]
          }
        },
        {
          "request": "ES",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "글,2,기타",
              "notContains": "글,3,기타"
            }
          }
        },
        {
          "request": "ER",
          "expect": {
            "status": 200,
            "bodyText": {
              "contains": "글,3,기타",
              "notContains": "글,2,기타"
            }
          }
        },
        {
          "request": "EX",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "P1",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "P2",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C4",
      "manual": "BOM — 브라우저·Node의 fetch는 본문을 읽으면서 맨 앞 BOM을 지우므로 버튼으로 볼 수 없다. 터미널에서 curl -s -H 'Authorization: Bearer tok-admin' http://localhost:8080/api/admin/reports/export | head -c 3 | xxd 의 첫 바이트가 ef bb bf인지 본다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | R1~R4 / E | 신고 `201` 또는 `409` / `200`, `Content-Type`이 `text/csv;charset=UTF-8`, `Content-Disposition`이 `attachment`이고 `filename*=UTF-8''%EC%8B%A0%EA%B3%A0%EB%82%B4%EC%97%AD-`(= "신고내역-")를 담는다, 본문에 한글 머리글 |
| C2 | E | 쉼표·따옴표 든 상세가 `"광고, ""무료"" 쿠폰"`로, `=`로 시작하는 상세가 `'=1+1 계산해 보세요`로 들어 있고 탭으로 시작한 입력은 신고 저장 단계의 `strip()`으로 탭이 제거되어 `'=1+1`로, 전각 `＝1+1`은 `'＝1+1`로 보호되고 `,=1+1`(그대로 든 수식)은 없다 |
| C3 | H / ES / ER / EX / P1 / P2 | 두 번째 신고를 기각한 뒤 `status=PENDING`에는 첫 번째만, `status=REJECTED`에는 두 번째만 포함 / 없는 `status` `400` / 일반 회원 `403` / 토큰 없음 `401` |
| C4 | 수동 — `curl … \| head -c 3 \| xxd` | 첫 3바이트가 `ef bb bf`(BOM). 버튼 실행기는 fetch가 본문을 읽으며 BOM을 지워 볼 수 없다 |
| D1 | `SELECT COUNT(*) FROM report` | 내려받은 파일의 행 수(머리글 제외)와 같다 — `status` 없이 받으면 전부 |
| R1 | 인코딩 | 문자열을 `UTF-8` 바이트로 만들고 BOM을 맨 앞에 넣었다. `Content-Type`의 `charset`과 실제 바이트 인코딩이 같다 |
| R2 | 셀 이스케이프 | 사람이 쓴 값(상세·닉네임)만 따옴표 규칙·주입 막기를 거친다. 문자열을 `,`로 단순히 이어 붙이면 어떤 입력에서 칸이 밀리는지 말할 수 있다 |
| R3 | 권한 | 개인정보가 든 내보내기는 화면 조회(13-2)보다 좁은 권한(ADMIN만)이다 — 13-1 표 한 줄로 표현된다 |
| R4 | 크기 | 전부 메모리에 만들어 `byte[]`로 돌려준다. 신고가 수십만 건이면 `StreamingResponseBody`로 나눠 읽어 바로 쓰고(그때는 트랜잭션·커넥션을 얼마나 오래 잡나도 본다), 기간 조건을 필수로 받는다는 것을 안다 |

셀 함수의 직접 테스트는 저장 전 값이 탭·CR·LF·전각 수식 기호로 시작하는 경우도 검사한다. HTTP 요청의 맨 앞 탭·개행은 신고 저장 서비스의 `strip()`이 제거하므로 CSV에는 `=1+1`이 전달된다.

이 단계의 앞에 `'`를 붙이는 방식은 처음 여는 CSV의 학습용 방어다. 엑셀에서 CSV를 다시 저장했다가 여는 과정에서는 이스케이프가 사라질 수 있다. 운영용 내보내기는 대상 스프레드시트와 재저장 흐름까지 검증한다. [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

## 필요한 지식

- [P17 파일 업로드·저장](../../docs/knowledge/P17-file-upload-storage.md) — 파일을 주고받는 응답 헤더
- [F3 CORS](../../lessons/F3-cors.md) — `exposedHeaders`
- [D11 웹 보안 기초](../../docs/knowledge/D11-web-security-basics.md) — 내보낸 파일도 공격 경로가 된다(CSV 주입)
- [A2 HTTP 해부](../../lessons/A2-http-anatomy.md) — `Content-Type`·`Content-Disposition`

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 응답 만들기</summary>

```java
ContentDisposition cd = ContentDisposition.attachment().filename("신고내역-20261010.csv", StandardCharsets.UTF_8).build();
return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
        .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
        .body(csv.getBytes(StandardCharsets.UTF_8));
```

`filename(이름, UTF_8)`이 `filename*=UTF-8''…`를 만든다(ASCII용 `filename="…"`에는 한글 대신 `_`가 들어간다). `csv`는 `"﻿"`로 시작한다.
</details>

<details>
<summary>힌트 2 — 셀 하나</summary>

```java
if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0) v = "'" + v;
if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) v = "\"" + v.replace("\"", "\"\"") + "\"";
```

신고자·처리자 닉네임은 `JOIN FETCH`로 함께 읽는다(행마다 회원 조회 금지).
</details>

## 다음 단계

[13-7. API 문서 — Swagger UI](13-7-api-docs.md)
