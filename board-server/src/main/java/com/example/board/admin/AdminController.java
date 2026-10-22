package com.example.board.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.CursorPage;

/** /api/admin/**는 URL 규칙(SecurityConfig)과 서비스의 @PreAuthorize가 함께 막는다. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/reports")
    public CursorPage<ReportResponse> reports(@Valid ReportListRequest request) {
        return adminService.reports(request.statusValue(), request.cursor(), request.size());
    }

    @PostMapping("/posts/{postId}/hide")
    public HidePostResponse hide(@PathVariable @Positive Long postId,
            @Valid @RequestBody(required = false) HidePostRequest request) {
        return adminService.hidePost(postId, request == null ? null : request.reportId());
    }

    @GetMapping("/audit-logs")
    public CursorPage<AuditLogResponse> auditLogs(@Valid AuditLogListRequest request) {
        return adminService.auditLogs(request.cursor(), request.size());
    }
}
