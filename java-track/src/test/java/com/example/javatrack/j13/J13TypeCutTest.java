package com.example.javatrack.j13;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/** 타입 한 컷: record — 불변 데이터 운반 객체, compact 생성자 검증. DTO와 값 객체. */
class J13TypeCutTest {

    @Test
    void 앞뒤_공백과_대소문자를_정규화해_담는다() {
        CouponCode code = new CouponCode("  sale2024 ");

        assertThat(code.value()).isEqualTo("SALE2024");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   ", "AB12", "SALE20241231X", "SALE-2024", "할인쿠폰코드"})
    void 규칙에_맞지_않으면_만들_수_없다(String raw) {
        assertThatThrownBy(() -> new CouponCode(raw))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 경계_6자와_12자는_받아들인다() {
        assertThat(new CouponCode("ABC123").value()).hasSize(CouponCode.MIN_LENGTH);
        assertThat(new CouponCode("ABCDEF123456").value()).hasSize(CouponCode.MAX_LENGTH);
    }

    @Test
    void 정규화한_값이_같으면_equals로_같고_Set에_하나만_남는다() {
        Set<CouponCode> codes = new HashSet<>();
        codes.add(new CouponCode("SALE2024"));
        codes.add(new CouponCode(" sale2024"));

        // record는 구성 요소 값으로 equals·hashCode를 만든다. 정규화를 생성자에서 했으므로 두 입력이 같은 값이다
        assertThat(codes).containsExactly(new CouponCode("SALE2024"));
    }

    @Test
    void 함정_레거시_DTO는_규칙을_어긴_값도_담기고_같은_코드도_다른_객체다() {
        LegacyCouponCodeDto first = new LegacyCouponCodeDto();
        first.setValue(" sale2024");
        LegacyCouponCodeDto second = new LegacyCouponCodeDto();
        second.setValue("SALE2024");
        Set<LegacyCouponCodeDto> legacy = new HashSet<>(Set.of(first, second));
        // 만든 뒤에도 setter로 아무 값이나 넣을 수 있다
        first.setValue("!");

        CouponCode code = new CouponCode(" sale2024");

        assertThat(legacy).hasSize(2);
        assertThat(first.getValue()).isEqualTo("!");
        // record에는 setter가 없다. 값을 바꾸려면 새로 만들어야 하고, 만들 때마다 compact 생성자를 지난다
        assertThat(CouponCode.class.getMethods()).noneMatch(method -> method.getName().startsWith("set"));
        assertThat(code).isEqualTo(new CouponCode("SALE2024"));
    }
}
