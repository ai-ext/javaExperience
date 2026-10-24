package com.example.javatrack.j04;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Modifier;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 주제 과제: 인터페이스와 구현, 선언 타입과 실제 타입, 추상 클래스와 인터페이스 비교. */
class J04DiscountPolicyTest {

    @Test
    void 정률_할인은_가격의_비율만큼_깎고_원_단위_아래는_버린다() {
        RateDiscountPolicy policy = new RateDiscountPolicy(10);

        assertThat(policy.discount(10_000)).isEqualTo(1_000);
        assertThat(policy.discount(999)).isEqualTo(99);
        assertThat(policy.name()).isEqualTo("정률 10%");
    }

    @Test
    void 큰_금액도_곱하는_중간에_int를_넘치지_않고_정확히_깎는다() {
        // 30,000,000 × 100은 int 최댓값(2,147,483,647)을 넘는다. int로 곱하면 오류 없이 음수가 된다
        assertThat(new RateDiscountPolicy(100).discount(30_000_000)).isEqualTo(30_000_000);
        assertThat(new RateDiscountPolicy(10).discount(Integer.MAX_VALUE)).isEqualTo(214_748_364);
        assertThat(new RateDiscountPolicy(100).apply(30_000_000)).isZero();
        // 상한 정률도 상한을 적용하기 전 계산에서 넘치면 음수 할인이 상한을 지나쳐 버린다
        assertThat(new CappedRateDiscountPolicy(100, 3_000).discount(30_000_000)).isEqualTo(3_000);
        assertThat(new CappedRateDiscountPolicy(10, Integer.MAX_VALUE).discount(Integer.MAX_VALUE)).isEqualTo(214_748_364);
    }

    @Test
    void 정액_할인은_가격보다_많이_깎지_않는다() {
        FixedDiscountPolicy policy = new FixedDiscountPolicy(3_000);

        assertThat(policy.discount(10_000)).isEqualTo(3_000);
        assertThat(policy.discount(2_000)).isEqualTo(2_000);
        assertThat(policy.name()).isEqualTo("정액 3000원");
    }

    @Test
    void 할인율이_0에서_100을_벗어나거나_정액이_음수면_거절한다() {
        assertThatThrownBy(() -> new RateDiscountPolicy(-1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RateDiscountPolicy(101)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new FixedDiscountPolicy(-1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CappedRateDiscountPolicy(101, 3_000)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 선언_타입이_인터페이스여도_실제_객체의_메서드가_불린다() {
        DiscountPolicy policy = new RateDiscountPolicy(10);

        // 변수의 선언 타입은 DiscountPolicy, 실제 객체는 RateDiscountPolicy. 실행되는 것은 실제 객체의 메서드다
        assertThat(policy.name()).isEqualTo("정률 10%");
        assertThat(policy.discount(10_000)).isEqualTo(1_000);

        policy = new FixedDiscountPolicy(3_000);
        assertThat(policy.name()).isEqualTo("정액 3000원");
    }

    @Test
    void 오버로딩은_선언_타입으로_고르고_오버라이딩은_실제_타입으로_고른다() {
        DiscountPolicy declaredAsInterface = new RateDiscountPolicy(10);
        RateDiscountPolicy declaredAsRate = new RateDiscountPolicy(10);

        // 오버로딩(PolicyDescriber.describe 두 개)은 컴파일할 때 변수의 선언 타입으로 고른다
        assertThat(PolicyDescriber.describe(declaredAsInterface)).isEqualTo("할인 정책");
        assertThat(PolicyDescriber.describe(declaredAsRate)).isEqualTo("정률 할인 정책");
        // 오버라이딩(name)은 실행할 때 실제 객체로 고른다. 둘 다 같은 답이다
        assertThat(declaredAsInterface.name()).isEqualTo(declaredAsRate.name()).isEqualTo("정률 10%");
    }

    @Test
    void default_메서드_apply는_구현체의_discount를_부른다() {
        DiscountPolicy rate = new RateDiscountPolicy(10);
        DiscountPolicy fixed = new FixedDiscountPolicy(3_000);

        // apply는 인터페이스에 한 번만 썼지만, 안에서 부르는 discount는 객체마다 다르다
        assertThat(rate.apply(10_000)).isEqualTo(9_000);
        assertThat(fixed.apply(10_000)).isEqualTo(7_000);
        assertThat(fixed.apply(2_000)).isZero();
    }

    @Test
    void 추상_클래스는_상한을_한_곳에서_강제하고_자식은_계산만_채운다() throws NoSuchMethodException {
        DiscountPolicy capped = new CappedRateDiscountPolicy(10, 3_000);

        assertThat(capped.discount(20_000)).isEqualTo(2_000);
        assertThat(capped.discount(50_000)).isEqualTo(3_000);
        assertThat(capped.name()).isEqualTo("정률 10% (최대 3000원)");
        // 부모의 discount는 final이라 자식이 상한을 건너뛸 수 없다
        assertThat(Modifier.isFinal(CappedDiscountPolicy.class.getMethod("discount", int.class).getModifiers())).isTrue();
        assertThat(capped).isInstanceOf(CappedDiscountPolicy.class).isInstanceOf(DiscountPolicy.class);
    }

    @Test
    void 정책_목록에서_가장_싼_가격을_고른다() {
        List<DiscountPolicy> policies = List.of(
                new RateDiscountPolicy(10),            // 50000 → 45000
                new FixedDiscountPolicy(3_000),        // 50000 → 47000
                new CappedRateDiscountPolicy(20, 4_000)); // 50000 → 46000

        assertThat(DiscountSelector.bestPrice(50_000, policies)).isEqualTo(45_000);
        assertThat(DiscountSelector.bestPrice(5_000, policies)).isEqualTo(2_000);
        assertThat(DiscountSelector.bestPrice(5_000, List.of())).isEqualTo(5_000);
    }
}
