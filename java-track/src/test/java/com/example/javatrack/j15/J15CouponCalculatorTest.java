package com.example.javatrack.j15;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigInteger;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 주제 과제(종합): 쿠폰 할인 계산기 — 인터페이스·제네릭·stream·예외. */
class J15CouponCalculatorTest {

    @Test
    void 정액_할인은_금액만큼_빼고_가격보다_크면_가격까지만_뺀다() {
        DiscountPolicy fixed = new FixedAmountDiscount(3_000, 0);

        assertThat(fixed.discountOf(10_000)).isEqualTo(3_000);
        assertThat(fixed.discountOf(2_000)).isEqualTo(2_000);
    }

    @Test
    void 정액_할인은_최소_주문_금액에_못_미치면_쓸_수_없다() {
        DiscountPolicy fixed = new FixedAmountDiscount(3_000, 20_000);

        assertThat(fixed.discountOf(20_000)).isEqualTo(3_000);
        assertThatThrownBy(() -> fixed.discountOf(19_999)).isInstanceOf(InvalidCouponException.class);
    }

    @Test
    void 정률_할인은_원_단위_아래를_버리고_상한을_넘지_않는다() {
        DiscountPolicy rate = new RateDiscount(10, 5_000);

        assertThat(rate.discountOf(9_999)).isEqualTo(999);       // 999.9 → 999
        assertThat(rate.discountOf(50_000)).isEqualTo(5_000);    // 상한과 같다
        assertThat(rate.discountOf(100_000)).isEqualTo(5_000);   // 10,000 → 상한 5,000
    }

    @Test
    void 정률_할인은_아주_큰_가격에서도_곱하다_넘치지_않는다() {
        // Long.MAX_VALUE × 100은 long 범위를 넘는다. 그대로 곱하면 음수 할인액(-1)이 나와 상한도 소용없다
        assertThat(new RateDiscount(100, 5_000).discountOf(Long.MAX_VALUE)).isEqualTo(5_000);
        assertThat(new RateDiscount(100, Long.MAX_VALUE).discountOf(Long.MAX_VALUE)).isEqualTo(Long.MAX_VALUE);
        assertThat(new RateDiscount(10, Long.MAX_VALUE).discountOf(Long.MAX_VALUE)).isEqualTo(Long.MAX_VALUE / 10);
        assertThat(new RateDiscount(33, Long.MAX_VALUE).discountOf(Long.MAX_VALUE - 1))
                .isEqualTo(BigInteger.valueOf(Long.MAX_VALUE - 1).multiply(BigInteger.valueOf(33))
                        .divide(BigInteger.valueOf(100)).longValueExact());
    }

    @Test
    void 할인_정책은_만들_때_잘못된_값을_거절한다() {
        assertThatThrownBy(() -> new FixedAmountDiscount(0, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new FixedAmountDiscount(1_000, -1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateDiscount(0, 5_000)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateDiscount(101, 5_000)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateDiscount(10, 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 선언_타입이_DiscountPolicy면_실제_구현의_discountOf가_불린다() {
        List<DiscountPolicy> policies = List.of(new FixedAmountDiscount(3_000, 0), new RateDiscount(10, 5_000));

        List<Long> discounts = policies.stream().map(p -> p.discountOf(10_000)).toList();

        assertThat(discounts).containsExactly(3_000L, 1_000L);
    }

    @Test
    void 쿠폰북은_등록한_타입_그대로_꺼내고_없는_코드는_빈_Optional이다() {
        CouponBook<RateDiscount> rateOnly = new CouponBook<>();
        RateDiscount tenPercent = new RateDiscount(10, 5_000);
        rateOnly.register("TEN", tenPercent);

        // 형변환 없이 RateDiscount로 꺼낸다
        RateDiscount found = rateOnly.find("TEN").orElseThrow();

        assertThat(found).isSameAs(tenPercent);
        assertThat(rateOnly.find("NONE")).isEmpty();
    }

    @Test
    void 같은_코드를_두_번_등록하면_거절한다() {
        CouponBook<DiscountPolicy> book = new CouponBook<>();
        book.register("WELCOME", new FixedAmountDiscount(3_000, 0));

        assertThatThrownBy(() -> book.register("WELCOME", new RateDiscount(10, 5_000)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(book.find("WELCOME").orElseThrow()).isInstanceOf(FixedAmountDiscount.class);
    }

    @Test
    void 쿠폰이_없는_주문은_가격_그대로이고_쿠폰이_있으면_할인을_뺀다() {
        CouponBook<DiscountPolicy> book = new CouponBook<>();
        book.register("WELCOME", new FixedAmountDiscount(3_000, 0));
        DiscountCalculator calculator = new DiscountCalculator(book);

        assertThat(calculator.priceAfterDiscount(new Order("O-1", 10_000, null))).isEqualTo(10_000);
        assertThat(calculator.priceAfterDiscount(new Order("O-2", 10_000, "WELCOME"))).isEqualTo(7_000);
    }

    @Test
    void 없는_쿠폰_코드나_음수_가격은_거절한다() {
        DiscountCalculator calculator = new DiscountCalculator(new CouponBook<DiscountPolicy>());

        assertThatThrownBy(() -> calculator.priceAfterDiscount(new Order("O-1", 10_000, "NONE")))
                .isInstanceOf(InvalidCouponException.class);
        assertThatThrownBy(() -> calculator.priceAfterDiscount(new Order("O-2", -1, null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 와일드카드_덕분에_정률_전용_쿠폰북도_계산기에_넣을_수_있다() {
        CouponBook<RateDiscount> rateOnly = new CouponBook<>();
        rateOnly.register("TEN", new RateDiscount(10, 5_000));

        // 생성자가 CouponBook<DiscountPolicy>만 받았다면 이 줄은 컴파일되지 않는다(제네릭은 공변이 아니다)
        DiscountCalculator calculator = new DiscountCalculator(rateOnly);

        assertThat(calculator.priceAfterDiscount(new Order("O-1", 9_999, "TEN"))).isEqualTo(9_000);
    }
}
