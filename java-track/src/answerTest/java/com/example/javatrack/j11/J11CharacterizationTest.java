package com.example.javatrack.j11;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * 정답: 학습자가 채우는 {@code src/test/.../J11CharacterizationTest}의 완성본. 이름이 같아서
 * answerTest 실행에서는 classpath 앞에 있는 이 클래스가 학습자 자리를 가린다(build.gradle 참고).
 * <p>
 * 기대값은 모두 원본을 불러 나온 값을 그대로 적었다. 이상해 보이는 규칙(음수면 -1, VIP는 보너스 없음,
 * 상한을 자른 뒤 쿠폰 절반, 소문자 등급은 일반)도 지금 동작이므로 그대로 고정한다.
 */
class J11CharacterizationTest {

    private final LegacyPointCalculator calculator = new LegacyPointCalculator();

    @ParameterizedTest
    @ValueSource(ints = {-1, -50000})
    void 음수_금액은_마이너스_1을_돌려준다(int amount) {
        assertThat(calculator.calculate(amount, "GOLD", false)).isEqualTo(-1);
    }

    @Test
    void 천_원_미만은_0이고_천_원부터_적립한다() {
        assertThat(calculator.calculate(999, "VIP", false)).isZero();
        assertThat(calculator.calculate(1000, "VIP", false)).isEqualTo(50);
    }

    @ParameterizedTest
    @CsvSource({"VIP, 500", "GOLD, 300", "BASIC, 100", "vip, 100", "SILVER, 100"})
    void 등급별_적립률은_VIP_5_GOLD_3_나머지는_1이고_대소문자를_가린다(String grade, int expected) {
        assertThat(calculator.calculate(10000, grade, false)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullSource
    void 등급이_null이면_예외_없이_일반_적립률이다(String grade) {
        assertThat(calculator.calculate(10000, grade, false)).isEqualTo(100);
    }

    @Test
    void 오만_원부터_보너스_500을_더한다() {
        assertThat(calculator.calculate(49999, "GOLD", false)).isEqualTo(1499);
        assertThat(calculator.calculate(50000, "GOLD", false)).isEqualTo(2000);
    }

    @Test
    void VIP는_오만_원을_넘어도_보너스가_없다() {
        assertThat(calculator.calculate(50000, "VIP", false)).isEqualTo(2500);
    }

    @Test
    void 적립은_3000에서_자르고_쿠폰을_쓰면_자른_값의_절반이다() {
        assertThat(calculator.calculate(100000, "VIP", false)).isEqualTo(3000);
        assertThat(calculator.calculate(100000, "VIP", true)).isEqualTo(1500);
    }

    @Test
    void 쿠폰을_쓰면_절반에서_소수점을_버린다() {
        // 15포인트의 절반 7.5 → 7
        assertThat(calculator.calculate(1500, "BASIC", true)).isEqualTo(7);
    }

    @Test
    void 입력_조합_표를_한_번에_고정한다() {
        // 기본기 반복의 PointTable로 조합 30개를 한 번에 고정한다(골든 마스터)
        assertThat(PointTable.describeAll(calculator,
                new int[] {999, 1000, 49999, 50000, 100000}, new String[] {"VIP", "GOLD", null}))
                .containsExactly(
                        "VIP/999/-=0", "VIP/999/쿠폰=0", "GOLD/999/-=0", "GOLD/999/쿠폰=0",
                        "null/999/-=0", "null/999/쿠폰=0",
                        "VIP/1000/-=50", "VIP/1000/쿠폰=25", "GOLD/1000/-=30", "GOLD/1000/쿠폰=15",
                        "null/1000/-=10", "null/1000/쿠폰=5",
                        "VIP/49999/-=2499", "VIP/49999/쿠폰=1249", "GOLD/49999/-=1499", "GOLD/49999/쿠폰=749",
                        "null/49999/-=499", "null/49999/쿠폰=249",
                        "VIP/50000/-=2500", "VIP/50000/쿠폰=1250", "GOLD/50000/-=2000", "GOLD/50000/쿠폰=1000",
                        "null/50000/-=1000", "null/50000/쿠폰=500",
                        "VIP/100000/-=3000", "VIP/100000/쿠폰=1500", "GOLD/100000/-=3000", "GOLD/100000/쿠폰=1500",
                        "null/100000/-=1500", "null/100000/쿠폰=750");
    }
}
