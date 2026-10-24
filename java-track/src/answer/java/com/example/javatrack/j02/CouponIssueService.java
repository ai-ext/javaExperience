package com.example.javatrack.j02;

import java.util.HashSet;
import java.util.Set;

/**
 * 쿠폰 발급 서비스. Lombok으로 쓰면 {@code @RequiredArgsConstructor}를 붙이고 생성자를 쓰지 않는 클래스다.
 * {@code @RequiredArgsConstructor}는 "final이고 선언에서 초기화하지 않은 필드"만 받는 생성자를 만든다.
 */
public class CouponIssueService {

    private final Coupon coupon;
    private final Set<Long> issuedMemberIds = new HashSet<>();

    /** {@code @RequiredArgsConstructor}가 만들 생성자와 같은 모양으로 쓴다. */
    public CouponIssueService(Coupon coupon) {
        this.coupon = coupon;
    }

    /** 1인 1매. 이미 받은 회원이면 발급하지 않고 false. 처음이면 쿠폰을 1장 발급하고 true. */
    public boolean issue(long memberId) {
        if (issuedMemberIds.contains(memberId)) {
            return false;
        }
        // 소진이면 여기서 예외가 나고, 회원은 기록되지 않는다
        coupon.issue();
        issuedMemberIds.add(memberId);
        return true;
    }
}
