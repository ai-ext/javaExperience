package com.example.javatrack.j15;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 주문 목록의 할인 전·후 합계를 stream으로 계산하고, 실패한 주문은 모아서 예외로 돌려준다. */
class J15BasicsTest {

    private static DiscountCalculator calculator() {
        CouponBook<DiscountPolicy> book = new CouponBook<>();
        book.register("WELCOME", new FixedAmountDiscount(3_000, 20_000));
        book.register("TEN", new RateDiscount(10, 5_000));
        return new DiscountCalculator(book);
    }

    @Test
    void 할인_전후_합계를_계산한다() {
        List<Order> orders = List.of(
                new Order("O-1", 30_000, "WELCOME"),  // 27,000
                new Order("O-2", 9_999, "TEN"),       // 9,000
                new Order("O-3", 5_000, null));       // 5,000

        OrderSummary summary = calculator().summarize(orders);

        assertThat(summary).isEqualTo(new OrderSummary(44_999, 41_000));
    }

    @Test
    void 빈_목록이면_합계는_모두_0이다() {
        assertThat(calculator().summarize(List.of())).isEqualTo(new OrderSummary(0, 0));
    }

    @Test
    void 실패한_주문을_첫_실패에서_멈추지_않고_모두_모아_한_번에_던진다() {
        List<Order> orders = List.of(
                new Order("O-1", 30_000, "WELCOME"),  // 통과
                new Order("O-2", 10_000, "WELCOME"),  // 최소 주문 금액 미달
                new Order("O-3", 10_000, "NONE"),     // 없는 쿠폰
                new Order("O-4", -500, null));        // 음수 가격

        OrderCalculationException e = catchThrowableOfType(OrderCalculationException.class,
                () -> calculator().summarize(orders));

        assertThat(e).isNotNull();
        assertThat(e.failures()).extracting(OrderFailure::orderId).containsExactly("O-2", "O-3", "O-4");
        assertThat(e.failures()).extracting(OrderFailure::reason).allSatisfy(reason -> assertThat(reason).isNotBlank());
    }
}
