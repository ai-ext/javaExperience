package com.example.board.admin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.coupon.CouponRepository;
import com.example.board.coupon.CouponService;
import com.example.board.member.MemberRepository;

/**
 * 엑셀로 받은 회원들에게 쿠폰을 한 장씩 준다. 행마다 CouponService.issue를 부르고, issue는 행마다 자기 트랜잭션을 열고 닫는다.
 * 여기에 @Transactional을 붙이지 않는다. 1,000행을 트랜잭션 하나로 묶으면 한 행의 실패(소진 등)로 전체가 롤백된다.
 * 선착순 발급과 같은 경로를 쓰므로 총수량·1인 1매(UNIQUE)·Redis 수량 키가 그대로 맞는다.
 */
@Service
@PreAuthorize("hasRole('ADMIN')")
public class CouponBulkIssueService {

    private final ExcelMemberIdReader reader;
    private final CouponService couponService;
    private final CouponRepository couponRepository;
    private final MemberRepository memberRepository;

    public CouponBulkIssueService(ExcelMemberIdReader reader, CouponService couponService,
            CouponRepository couponRepository, MemberRepository memberRepository) {
        this.reader = reader;
        this.couponService = couponService;
        this.couponRepository = couponRepository;
        this.memberRepository = memberRepository;
    }

    /** 없는 쿠폰은 404, 파일 오류는 400. 행 오류는 건너뛰고 skipped[]에 행 번호 순으로 담는다. 같은 파일을 다시 올려도 안전하다. */
    @Audited(action = "BULK_ISSUE_COUPON", targetType = "COUPON")
    public BulkIssueResponse bulkIssue(Long couponId, MultipartFile file) {
        if (!couponRepository.existsById(couponId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "쿠폰을 찾을 수 없습니다.");
        }
        ExcelReadResult read = reader.read(file);
        // 없는 회원을 먼저 거른다. 그대로 issue에 넘기면 FK 위반이 중복(ALREADY_ISSUED)으로 잘못 분류된다.
        Set<Long> existing = read.rows().isEmpty() ? Set.of()
                : new HashSet<>(memberRepository.findExistingIds(new HashSet<>(read.memberIds())));
        List<Skipped> skipped = new ArrayList<>(read.skipped());
        int issued = 0;
        for (MemberIdRow row : read.rows()) {
            if (!existing.contains(row.memberId())) {
                skipped.add(skip(row, "MEMBER_NOT_FOUND"));
                continue;
            }
            try {
                couponService.issue(couponId, row.memberId());
                issued++;
            } catch (BusinessException e) {
                skipped.add(skip(row, switch (e.errorCode()) {
                    // 파일 안에 같은 id가 두 번 있으면 두 번째도 여기로 온다
                    case DUPLICATE -> "ALREADY_ISSUED";
                    case COUPON_EXHAUSTED -> "COUPON_EXHAUSTED";
                    default -> throw e;
                }));
            }
        }
        skipped.sort(Comparator.comparingInt(Skipped::row));
        return new BulkIssueResponse(issued, skipped);
    }

    private static Skipped skip(MemberIdRow row, String reason) {
        return new Skipped(row.row(), String.valueOf(row.memberId()), reason);
    }
}
