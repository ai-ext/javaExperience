package com.example.javatrack.j11;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 레거시 메서드의 입력 조합을 for로 만들어 결과를 List에 모으고 한 번에 단정하기. */
class J11BasicsTest {

    private final LegacyPointCalculator calculator = new LegacyPointCalculator();

    @Test
    void 금액_등급_쿠폰_조합을_순서대로_모아_한_번에_단정한다() {
        List<String> lines = PointTable.describeAll(calculator, new int[] {999, 50000}, new String[] {"VIP", null});

        // 조합 8개를 한 줄씩 따로 단정하지 않고 목록 하나로 고정한다. 어느 줄이 달라졌는지 실패 메시지에 같이 나온다
        assertThat(lines).containsExactly(
                "VIP/999/-=0",
                "VIP/999/쿠폰=0",
                "null/999/-=0",
                "null/999/쿠폰=0",
                "VIP/50000/-=2500",
                "VIP/50000/쿠폰=1250",
                "null/50000/-=1000",
                "null/50000/쿠폰=500");
    }

    @Test
    void 조합_수는_금액_수_곱하기_등급_수_곱하기_2다() {
        List<String> lines = PointTable.describeAll(calculator,
                new int[] {1000, 20000, 50000}, LegacyPointCalculator.gradeNames());

        assertThat(lines).hasSize(3 * 3 * 2);
        assertThat(lines.get(0)).isEqualTo("VIP/1000/-=50");
        assertThat(lines.get(lines.size() - 1)).isEqualTo("BASIC/50000/쿠폰=500");
    }

    @Test
    void 금액이나_등급이_비어_있으면_빈_목록이다() {
        assertThat(PointTable.describeAll(calculator, new int[0], new String[] {"VIP"})).isEmpty();
        assertThat(PointTable.describeAll(calculator, new int[] {1000}, new String[0])).isEmpty();
    }
}
