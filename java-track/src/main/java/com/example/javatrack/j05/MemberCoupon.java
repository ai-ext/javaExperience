package com.example.javatrack.j05;

import java.time.LocalDate;

/** 주어진 record: 고치지 않는다. 회원이 받은 쿠폰 한 장. expiresOn 당일까지 쓸 수 있다. */
public record MemberCoupon(long id, String name, CouponStatus status, LocalDate expiresOn, int minOrderAmount) {
}
