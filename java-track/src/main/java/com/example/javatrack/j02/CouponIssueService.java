package com.example.javatrack.j02;

/**
 * 쿠폰 발급 서비스. Lombok으로 쓰면 {@code @RequiredArgsConstructor}를 붙이고 생성자를 쓰지 않는 클래스다.
 * {@code @RequiredArgsConstructor}는 "final이고 선언에서 초기화하지 않은 필드"만 받는 생성자를 만든다.
 */
public class CouponIssueService {

    // TODO: 필드 두 개를 선언하세요
    //  - 발급할 쿠폰: final, 생성자로 받는다
    //  - 이미 받은 회원 id 집합: final, 선언에서 바로 new HashSet<>()으로 만든다(그래서 생성자가 받지 않는다)

    /** {@code @RequiredArgsConstructor}가 만들 생성자와 같은 모양으로 쓴다. */
    public CouponIssueService(Coupon coupon) {
        throw new UnsupportedOperationException("J02: CouponIssueService 생성자 — 받은 쿠폰을 필드에 담으세요");
    }

    /** 1인 1매. 이미 받은 회원이면 발급하지 않고 false. 처음이면 쿠폰을 1장 발급하고 true. */
    public boolean issue(long memberId) {
        throw new UnsupportedOperationException("J02: CouponIssueService.issue — 받은 회원이면 false, 아니면 발급하고 기록하세요");
    }
}
