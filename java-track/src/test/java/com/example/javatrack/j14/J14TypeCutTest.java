package com.example.javatrack.j14;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * 타입 한 컷(선택): double vs BigDecimal — 0.1 + 0.2, 금액 계산과 반올림.
 * 선택 과제라 기본 실행({@code :java-track:test --tests 'J14*'})에서는 빠진다. {@code :java-track:optionalTest --tests 'J14*'}로 돌린다.
 */
@Tag("optional")
class J14TypeCutTest {

    @Test
    void 함정_double로_0_1과_0_2를_더하면_0_3이_아니다() {
        // double은 2진수라 0.1을 정확히 담지 못한다
        assertThat(0.1 + 0.2).isNotEqualTo(0.3);
        assertThat(0.1 + 0.2).isEqualTo(0.30000000000000004);

        BigDecimal sum = new BigDecimal("0.1").add(new BigDecimal("0.2"));
        assertThat(PointMath.sameAmount(sum, new BigDecimal("0.3"))).isTrue();
    }

    @Test
    void 함정_double로_적립률을_곱하면_1포인트가_사라진다() {
        // 70000원의 1.13% = 정확히 791. double로는 790.99999…가 되어 버리면 790이다
        long viaDouble = (long) (70000 * 1.13 / 100);
        long viaBigDecimal = PointMath.earnPoints(70000, "1.13");

        assertThat(viaDouble).isEqualTo(790);
        assertThat(viaBigDecimal).isEqualTo(791);
    }

    @Test
    void 적립_포인트는_소수점_아래를_버린다() {
        assertThat(PointMath.earnPoints(19900, "1.5")).isEqualTo(298); // 298.5
        assertThat(PointMath.earnPoints(1000, "0.1")).isEqualTo(1);
        assertThat(PointMath.earnPoints(999, "0.1")).isZero();      // 0.999
    }

    @Test
    void 함정_BigDecimal_equals는_소수_자릿수까지_비교한다() {
        BigDecimal one = new BigDecimal("1.0");
        BigDecimal oneHundredths = new BigDecimal("1.00");

        // scale(소수 자릿수)이 1과 2로 달라 equals는 false다. 금액 비교에 equals를 쓰면 같은 금액이 다르다고 나온다
        assertThat(one.equals(oneHundredths)).isFalse();
        assertThat(PointMath.sameAmount(one, oneHundredths)).isTrue();
    }

    @Test
    void 함정_new_BigDecimal에_double을_넣으면_오차까지_담긴다() {
        // 0.1이라는 double 값이 이미 0.1000000000000000055…라서 그대로 옮겨 담긴다
        assertThat(new BigDecimal(0.1)).isNotEqualTo(new BigDecimal("0.1"));
        // 문자열로 만들거나 valueOf를 쓴다(valueOf는 double을 문자열로 바꾼 뒤 만든다)
        assertThat(BigDecimal.valueOf(0.1)).isEqualTo(new BigDecimal("0.1"));
        assertThat(PointMath.sameAmount(new BigDecimal(0.1), new BigDecimal("0.1"))).isFalse();
    }
}
