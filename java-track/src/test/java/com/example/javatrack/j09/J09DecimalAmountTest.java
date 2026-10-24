package com.example.javatrack.j09;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/** 선택 관찰: DECIMAL(5,2)에 넣기 전의 금액 정책. 실제 JDBC 왕복은 D09 힌트에서 따로 한다. */
@Tag("optional")
class J09DecimalAmountTest {

    @Test
    void 문자열_금액을_HALF_UP으로_소수_둘째_자리까지_반올림한다() {
        assertThat(DecimalAmount.forStorage("1.005")).isEqualByComparingTo("1.01");
        assertThat(DecimalAmount.forStorage("-1.005")).isEqualByComparingTo("-1.01");
        assertThat(DecimalAmount.forStorage("2.004")).isEqualByComparingTo("2.00");
    }

    @Test
    void 수치가_같아도_scale은_다를_수_있으므로_저장_표현을_고정한다() {
        BigDecimal amount = DecimalAmount.forStorage("1.0");

        assertThat(amount.scale()).isEqualTo(2);
        assertThat(amount.equals(new BigDecimal("1.00"))).isTrue();
        assertThat(amount.equals(new BigDecimal("1.0"))).isFalse();
        assertThat(amount.compareTo(new BigDecimal("1.0"))).isZero();
    }

    @Test
    void DECIMAL_5_2의_경계는_반올림한_뒤에_검사한다() {
        assertThat(DecimalAmount.forStorage("999.994")).isEqualByComparingTo("999.99");
        assertThat(DecimalAmount.forStorage("-999.994")).isEqualByComparingTo("-999.99");
        assertThatThrownBy(() -> DecimalAmount.forStorage("999.995"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> DecimalAmount.forStorage("-999.995"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 반올림을_허용하지_않는_계약은_유효_소수_셋째_자리를_거절한다() {
        assertThat(DecimalAmount.exact("1.230")).isEqualByComparingTo("1.23");
        assertThatThrownBy(() -> DecimalAmount.exact("1.231"))
                .isInstanceOf(ArithmeticException.class);
    }

    @Test
    void 이진_부동소수점에서_출발한_값과_문자열에서_출발한_값을_비교한다() {
        BigDecimal amount = DecimalAmount.forStorage("0.1");

        assertThat(amount).isEqualByComparingTo(new BigDecimal("0.1"));
        assertThat(amount).isNotEqualByComparingTo(new BigDecimal(0.1));
    }
}
