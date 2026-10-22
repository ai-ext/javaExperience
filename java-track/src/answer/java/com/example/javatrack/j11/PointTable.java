package com.example.javatrack.j11;

import java.util.ArrayList;
import java.util.List;

/** 기본기 반복: 레거시 메서드의 입력 조합을 for로 만들어 결과를 List에 모은다. */
public final class PointTable {

    private PointTable() {
    }

    /**
     * 금액 × 등급 × 쿠폰 여부(false, true 순)의 모든 조합으로 {@code calculator}를 불러 한 줄씩 모은다.
     * 순서는 금액이 바깥, 등급이 가운데, 쿠폰 여부가 안쪽 반복이다.
     * 한 줄은 {@code "등급/금액/쿠폰=포인트"} 모양이다. 쿠폰을 썼으면 {@code 쿠폰}, 아니면 {@code -}를 쓰고,
     * 등급이 null이면 {@code null}로 적는다. 예: {@code "GOLD/50000/-=2000"}, {@code "null/1000/쿠폰=5"}
     */
    public static List<String> describeAll(LegacyPointCalculator calculator, int[] amounts, String[] grades) {
        List<String> lines = new ArrayList<>();
        for (int amount : amounts) {
            for (String grade : grades) {
                for (boolean couponUsed : new boolean[] {false, true}) {
                    int point = calculator.calculate(amount, grade, couponUsed);
                    // 문자열 + 결합은 null을 "null"로 적는다
                    lines.add(grade + "/" + amount + "/" + (couponUsed ? "쿠폰" : "-") + "=" + point);
                }
            }
        }
        return lines;
    }
}
