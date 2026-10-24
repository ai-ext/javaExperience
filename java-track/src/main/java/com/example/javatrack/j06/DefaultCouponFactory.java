package com.example.javatrack.j06;

/**
 * 주어진 코드: 고치지 않는다. 기본 쿠폰을 만드는 비싼 작업(실무라면 DB 저장·외부 호출)이라고 생각한다.
 * 몇 번 불렸는지 센다.
 */
public class DefaultCouponFactory {

    private int createdCount = 0;

    public Coupon create() {
        createdCount++;
        return new Coupon(0, "기본 쿠폰");
    }

    public int createdCount() {
        return createdCount;
    }
}
