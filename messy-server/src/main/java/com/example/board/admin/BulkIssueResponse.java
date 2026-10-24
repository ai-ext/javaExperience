package com.example.board.admin;

import java.util.List;

public record BulkIssueResponse(int issued, List<Skipped> skipped) implements AuditDetail {

    @Override
    public String auditDetail() {
        return "issued=" + issued + ", skipped=" + skipped.size();
    }
}
