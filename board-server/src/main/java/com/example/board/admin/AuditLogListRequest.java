package com.example.board.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** GET /api/admin/audit-logs 쿼리 파라미터. 규칙은 spec-v2 2절과 같다. */
public record AuditLogListRequest(String cursor, @Min(1) @Max(50) Integer size) {

    public AuditLogListRequest {
        if (size == null) {
            size = 20;
        }
    }
}
