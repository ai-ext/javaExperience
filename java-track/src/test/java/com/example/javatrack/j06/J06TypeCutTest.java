package com.example.javatrack.j06;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: Optional — orElse와 orElseGet, orElseThrow, 반환 타입에는 쓰고 매개변수에는 쓰지 않는 이유. */
class J06TypeCutTest {

    private final CouponRepository repository = new CouponRepository(List.of(new Coupon(1, "웰컴")));

    @Test
    void 함정_orElse는_값이_있어도_인자를_먼저_실행한다_orElseGet은_없을_때만_실행한다() {
        DefaultCouponFactory leakyFactory = new DefaultCouponFactory();
        Coupon leakyFound = new LeakyCouponLookup(repository, leakyFactory).findOrDefault(1);
        // 쿠폰이 있었는데도 기본 쿠폰을 하나 만들었다
        assertThat(leakyFound.name()).isEqualTo("웰컴");
        assertThat(leakyFactory.createdCount()).isEqualTo(1);

        DefaultCouponFactory factory = new DefaultCouponFactory();
        Coupon found = new CouponLookup(repository, factory).findOrDefault(1);

        assertThat(found.name()).isEqualTo("웰컴");
        assertThat(factory.createdCount()).isZero();
    }

    @Test
    void 없으면_orElseGet이_그때_기본_쿠폰을_만든다() {
        DefaultCouponFactory factory = new DefaultCouponFactory();

        Coupon coupon = new CouponLookup(repository, factory).findOrDefault(99);

        assertThat(coupon.name()).isEqualTo("기본 쿠폰");
        assertThat(factory.createdCount()).isEqualTo(1);
    }

    @Test
    void orElseThrow로_없는_쿠폰을_404_예외로_바꾼다() {
        CouponLookup lookup = new CouponLookup(repository, new DefaultCouponFactory());

        assertThat(lookup.getOrThrow(1).name()).isEqualTo("웰컴");
        assertThatThrownBy(() -> lookup.getOrThrow(99))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("찾을 수 없습니다: 쿠폰 id=99");
    }

    @Test
    void 함정_Optional_매개변수에는_null이_들어올_수_있다_Optional은_반환_타입에만_쓴다() {
        // 매개변수 타입이 Optional이어도 부르는 쪽은 null을 넘길 수 있다. 그러면 Optional 안에서 NPE가 난다
        assertThatThrownBy(() -> LeakyPostSearch.normalizeKeyword(null)).isInstanceOf(NullPointerException.class);

        assertThat(CouponLookup.normalizeKeyword(null)).isEmpty();
        assertThat(CouponLookup.normalizeKeyword("   ")).isEmpty();
        assertThat(CouponLookup.normalizeKeyword(" java ")).isEqualTo(Optional.of("java"));
    }
}
