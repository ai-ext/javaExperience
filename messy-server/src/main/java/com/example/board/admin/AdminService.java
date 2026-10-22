package com.example.board.admin;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.CursorPage;
import com.example.board.common.ErrorCode;
import com.example.board.post.PopularPostService;
import com.example.board.post.Post;
import com.example.board.post.PostRepository;
import com.example.board.post.PostStatus;

/**
 * 관리자 기능. @PreAuthorize를 클래스에 두어 모든 public 메서드가 프록시에서 검사된다.
 * 보호 메서드를 같은 클래스 안에서 this로 부르면 프록시를 건너뛰므로, 진입점 메서드 자체를 보호 대상으로 둔다.
 */
@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final AuditLogRepository auditLogRepository;
    private final PopularPostService popularPostService;

    public AdminService(ReportRepository reportRepository, PostRepository postRepository,
            AuditLogRepository auditLogRepository, PopularPostService popularPostService) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.auditLogRepository = auditLogRepository;
        this.popularPostService = popularPostService;
    }

    /** 응답 DTO 변환까지 트랜잭션 안에서 한다. 엔티티를 밖으로 내보내면 LAZY 연관에서 LazyInitializationException이 난다. */
    @Transactional(readOnly = true)
    public CursorPage<ReportResponse> reports(ReportStatus status, String cursor, int size) {
        Long afterId = CursorPage.decode(cursor);
        // 한 건 더 읽어 다음 쪽이 있는지만 판단한다
        List<Report> rows = reportRepository.findPage(status, afterId, PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<Report> page = hasNext ? rows.subList(0, size) : rows;
        String next = hasNext ? CursorPage.encode(page.get(page.size() - 1).getId()) : null;
        return new CursorPage<>(page.stream().map(ReportResponse::from).toList(), next);
    }

    /**
     * 없는 글·삭제된 글은 404. 이미 숨긴 글은 다시 숨겨도 200이다(같은 글의 다른 신고를 처리할 수 있게).
     * reportId가 없거나 다른 글의 신고면 404이고 아무것도 바꾸지 않는다.
     * 신고로 숨긴 글은 인기글에서 바로 내려야 해서, 이벤트(커밋 뒤 리스너)를 거치지 않고 숨기는 자리에서 캐시를 지운다.
     */
    @Audited(action = "HIDE_POST", targetType = "POST")
    @Transactional
    public HidePostResponse hidePost(Long postId, Long reportId) {
        Post post = postRepository.findById(postId)
                .filter(p -> p.getStatus() != PostStatus.DELETED)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        Report report = null;
        if (reportId != null) {
            report = reportRepository.findById(reportId)
                    .filter(r -> r.isAbout(postId))
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "이 글의 신고를 찾을 수 없습니다."));
        }
        post.hide();
        if (report != null) {
            report.resolve();
        }
        popularPostService.evict();
        log.info("글 숨김 postId={} reportId={}", postId, reportId);
        return new HidePostResponse(postId, post.getStatus(), reportId);
    }

    @Transactional(readOnly = true)
    public CursorPage<AuditLogResponse> auditLogs(String cursor, int size) {
        Long afterId = CursorPage.decode(cursor);
        List<AuditLog> rows = auditLogRepository.findPage(afterId, PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<AuditLog> page = hasNext ? rows.subList(0, size) : rows;
        String next = hasNext ? CursorPage.encode(page.get(page.size() - 1).getId()) : null;
        return new CursorPage<>(page.stream().map(AuditLogResponse::from).toList(), next);
    }
}
