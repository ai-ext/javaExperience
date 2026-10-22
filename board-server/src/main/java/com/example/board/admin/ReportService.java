package com.example.board.admin;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;
import com.example.board.post.PostRepository;
import com.example.board.post.PostStatus;

/**
 * report에는 @Transactional을 두지 않는다. 트랜잭션 경계를 안쪽(TransactionTemplate)에 두고 UNIQUE 위반을 바깥에서 잡기 위해서다.
 */
@Service
public class ReportService {

    // schema.sql의 UNIQUE(post_id, reporter_id) 이름. FK 위반 같은 다른 무결성 오류까지 409로 숨기지 않으려고 이름으로 가른다.
    private static final String UNIQUE_KEY = "uk_report_post_reporter";

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final TransactionTemplate tx;

    public ReportService(ReportRepository reportRepository, PostRepository postRepository,
            MemberRepository memberRepository, TransactionTemplate tx) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.tx = tx;
    }

    /** 신고 id를 돌려준다. 없는 글·숨김·삭제된 글은 404, 같은 회원이 같은 글을 다시 신고하면 409. */
    public Long report(Long postId, Long reporterId, ReportReason reason, String detail) {
        try {
            return tx.execute(s -> {
                if (!postRepository.existsByIdAndStatus(postId, PostStatus.ACTIVE)) {
                    throw new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다.");
                }
                // 흔한 재신고를 INSERT 전에 거르는 용도다. 동시 요청은 둘 다 통과하므로 최종 방어선은 UNIQUE 제약이다.
                if (reportRepository.existsByPostIdAndReporterId(postId, reporterId)) {
                    throw duplicate();
                }
                return reportRepository.saveAndFlush(Report.create(postRepository.getReferenceById(postId),
                        memberRepository.getReferenceById(reporterId), reason, detail)).getId();
            });
        } catch (DataIntegrityViolationException e) {
            if (isDuplicateReport(e)) {
                throw duplicate();
            }
            throw e;
        }
    }

    private static boolean isDuplicateReport(DataIntegrityViolationException e) {
        String message = e.getMostSpecificCause().getMessage();
        return message != null && message.contains(UNIQUE_KEY);
    }

    private static BusinessException duplicate() {
        return new BusinessException(ErrorCode.DUPLICATE, "이미 신고한 글입니다.");
    }
}
