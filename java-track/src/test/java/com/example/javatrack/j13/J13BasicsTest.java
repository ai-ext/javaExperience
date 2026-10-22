package com.example.javatrack.j13;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 목록을 stream으로 돌며 적용 가능한 것 중 할인액이 가장 큰 것을 고르기. */
class J13BasicsTest {

    private final DiscountCalculator calculator = new DiscountCalculator();

    @Test
    void 할인액이_가장_큰_쿠폰을_고른다() {
        Coupon fixed = new Coupon("FIXED", 3000);     // 3000
        Coupon rate = new Coupon("RATE", 20);         // 30000 × 20% = 6000 → 최대 5000
        Coupon first = new Coupon("FIRST_ORDER", 4000); // 첫 주문 아님 → 0

        Optional<Coupon> best = calculator.bestCoupon(List.of(fixed, rate, first), new Order(30000, false));

        assertThat(best).contains(rate);
    }

    @Test
    void 할인액이_0인_쿠폰만_있으면_빈_Optional이다() {
        List<Coupon> coupons = List.of(new Coupon("FIXED", 3000), new Coupon("BIRTHDAY", 9000));

        Optional<Coupon> best = calculator.bestCoupon(coupons, new Order(9000, false));

        assertThat(best).isEmpty();
    }

    @Test
    void 빈_목록이면_빈_Optional이다() {
        assertThat(calculator.bestCoupon(List.of(), new Order(30000, true))).isEmpty();
    }

    @Test
    void 할인액이_같으면_앞의_쿠폰을_고른다() {
        Coupon fixed = new Coupon("FIXED", 3000);
        Coupon first = new Coupon("FIRST_ORDER", 3000);

        assertThat(calculator.bestCoupon(List.of(fixed, first), new Order(30000, true))).containsSame(fixed);
        assertThat(calculator.bestCoupon(List.of(first, fixed), new Order(30000, true))).containsSame(first);
    }
}
