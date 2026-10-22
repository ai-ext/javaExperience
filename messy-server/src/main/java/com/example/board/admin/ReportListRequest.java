package com.example.board.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

/** GET /api/admin/reports 쿼리 파라미터. status 기본값은 OPEN, cursor·size 규칙은 spec-v2 2절과 같다. */
public record ReportListRequest(@Pattern(regexp = "OPEN|RESOLVED") String status, String cursor,
        @Min(1) @Max(50) Integer size) {

    public ReportListRequest {
        if (status == null) {
            status = "OPEN";
        }
        if (size == null) {
            size = 20;
        }
    }

    public ReportStatus statusValue() {
        return ReportStatus.valueOf(status);
    }
}
