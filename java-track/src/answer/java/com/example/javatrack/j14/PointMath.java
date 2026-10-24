package com.example.javatrack.j14;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** 타입 한 컷(선택): 금액·적립률 계산은 double이 아니라 BigDecimal로. */
public final class PointMath {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private PointMath() {
    }

    /**
     * 결제 금액의 {@code ratePercent}%를 적립 포인트로 돌려준다. 소수점 아래는 버린다.
     * 적립률은 오차 없이 받으려고 문자열로 받는다(예: {@code "1.13"}).
     */
    public static long earnPoints(long price, String ratePercent) {
        // new BigDecimal("1.13")은 정확히 1.13이다. 나눗셈은 자릿수(0)와 반올림 방식(DOWN = 버림)을 꼭 정한다
        return BigDecimal.valueOf(price)
                .multiply(new BigDecimal(ratePercent))
                .divide(HUNDRED, 0, RoundingMode.DOWN)
                .longValueExact();
    }

    /** 두 금액이 같은 값인가. 소수 자릿수(scale)가 달라도 값이 같으면 true({@code 1.0}과 {@code 1.00}). */
    public static boolean sameAmount(BigDecimal a, BigDecimal b) {
        // equals는 scale까지 비교한다(1.0 ≠ 1.00). 값만 비교하려면 compareTo
        return a.compareTo(b) == 0;
    }
}
