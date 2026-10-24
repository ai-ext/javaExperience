package com.example.board.admin;

import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // 신고 한 건을 조회하는 GET이 없어 Location 대신 본문에 id를 준다(쿠폰 발급과 같은 방식)
    @PostMapping("/api/posts/{postId}/reports")
    public ResponseEntity<Map<String, Long>> report(@AuthenticationPrincipal AuthMember auth,
            @PathVariable @Positive Long postId, @Valid @RequestBody ReportRequest request) {
        Long reportId = reportService.report(postId, auth.id(), request.reasonValue(), request.detail());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("reportId", reportId));
    }
}
