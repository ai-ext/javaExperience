package com.example.javatrack.j13;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * 주제 과제: 조건문을 전략으로 바꾸기 — 쿠폰 종류별 if-else 할인 계산을 DiscountPolicy 구현으로 옮긴다.
 * <p>
 * 앞의 특성화 테스트 4개는 옮기기 전(뼈대)에도 통과한다. 옮긴 뒤에도 그대로 통과해야 한다.
 * 뒤의 테스트는 정책 구현과, 계산기가 if-else 대신 받은 정책에 할인을 맡기는지 본다. 옮기기 전에는 실패한다.
 */
class J13DiscountPolicyTest {

    private final DiscountCalculator calculator = new DiscountCalculator();

    // ---- 특성화: 옮기기 전후 할인액이 같다 ----

    @Test
    void 특성화_정액_쿠폰은_만_원_이상_주문에서_주문_금액까지만_깎는다() {
        assertThat(calculator.discount(new Coupon("FIXED", 3000), new Order(9999, false))).isZero();
        assertThat(calculator.discount(new Coupon("FIXED", 3000), new Order(10000, false))).isEqualTo(3000);
        assertThat(calculator.discount(new Coupon("FIXED", 20000), new Order(12000, false))).isEqualTo(12000);
    }

    @Test
    void 특성화_정률_쿠폰은_10원_단위로_버리고_최대_5000원이다() {
        // 12345 × 10% = 1234 → 1230
        assertThat(calculator.discount(new Coupon("RATE", 10), new Order(12345, false))).isEqualTo(1230);
        assertThat(calculator.discount(new Coupon("RATE", 10), new Order(100000, false))).isEqualTo(5000);
        // 정률에는 최소 주문 금액이 없다
        assertThat(calculator.discount(new Coupon("RATE", 10), new Order(5000, false))).isEqualTo(500);
    }

    @Test
    void 특성화_첫_주문_쿠폰은_첫_주문에서만_주문_금액까지_깎는다() {
        assertThat(calculator.discount(new Coupon("FIRST_ORDER", 5000), new Order(30000, true))).isEqualTo(5000);
        assertThat(calculator.discount(new Coupon("FIRST_ORDER", 5000), new Order(30000, false))).isZero();
        assertThat(calculator.discount(new Coupon("FIRST_ORDER", 5000), new Order(3000, true))).isEqualTo(3000);
    }

    @Test
    void 특성화_쿠폰이_없거나_모르는_종류면_0이다() {
        assertThat(calculator.discount(null, new Order(30000, true))).isZero();
        assertThat(calculator.discount(new Coupon("BIRTHDAY", 5000), new Order(30000, true))).isZero();
        assertThat(calculator.discount(new Coupon("fixed", 3000), new Order(30000, false))).isZero();
    }

    // ---- 구조: 종류별 규칙이 정책 구현으로 옮겨졌다 ----

    @Test
    void 정책마다_자기_쿠폰_종류만_맡는다() {
        Coupon fixed = new Coupon("FIXED", 3000);
        Coupon rate = new Coupon("RATE", 10);
        Coupon firstOrder = new Coupon("FIRST_ORDER", 5000);

        assertThat(List.of(fixed, rate, firstOrder)).map(new FixedAmountPolicy()::supports)
                .containsExactly(true, false, false);
        assertThat(List.of(fixed, rate, firstOrder)).map(new RatePolicy()::supports)
                .containsExactly(false, true, false);
        assertThat(List.of(fixed, rate, firstOrder)).map(new FirstOrderPolicy()::supports)
                .containsExactly(false, false, true);
    }

    @Test
    void 정책_구현을_직접_불러도_같은_할인액이다() {
        Order order = new Order(12345, true);

        assertThat(new FixedAmountPolicy().discount(new Coupon("FIXED", 3000), order)).isEqualTo(3000);
        assertThat(new RatePolicy().discount(new Coupon("RATE", 10), order)).isEqualTo(1230);
        assertThat(new FirstOrderPolicy().discount(new Coupon("FIRST_ORDER", 5000), order)).isEqualTo(5000);
        assertThat(new FixedAmountPolicy().discount(new Coupon("FIXED", 3000), new Order(9999, false))).isZero();
    }

    @Test
    void 기본_정책은_종류마다_하나씩_서로_다른_구현_클래스_3개다() {
        List<DiscountPolicy> policies = DiscountCalculator.standardPolicies();

        assertThat(policies).hasSize(3);
        assertThat(policies).map(Object::getClass)
                .containsExactlyInAnyOrder(FixedAmountPolicy.class, RatePolicy.class, FirstOrderPolicy.class);
    }

    @Test
    void 계산기는_if_else_대신_받은_정책에_할인을_맡긴다() {
        // 계산기가 모르는 새 종류를 정책 하나로 더한다. if-else가 남아 있으면 이 종류를 계산하지 못한다
        DiscountPolicy event = new DiscountPolicy() {
            @Override
            public boolean supports(Coupon coupon) {
                return "EVENT".equals(coupon.type());
            }

            @Override
            public int discount(Coupon coupon, Order order) {
                return 777;
            }
        };
        DiscountCalculator onlyEvent = new DiscountCalculator(List.of(event));

        assertThat(onlyEvent.discount(new Coupon("EVENT", 0), new Order(30000, false))).isEqualTo(777);
        // 받은 목록에 정액 정책이 없으므로 FIXED도 0이다. 종류 판단이 계산기 안에 박혀 있지 않다는 뜻이다
        assertThat(onlyEvent.discount(new Coupon("FIXED", 3000), new Order(30000, false))).isZero();
    }
}
