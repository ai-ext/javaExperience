package com.example.javatrack.j14;

import java.math.BigDecimal;

/** 타입 한 컷(선택): 금액·적립률 계산은 double이 아니라 BigDecimal로. */
public final class PointMath {

    private PointMath() {
    }

    /**
     * 결제 금액의 {@code ratePercent}%를 적립 포인트로 돌려준다. 소수점 아래는 버린다.
     * 적립률은 오차 없이 받으려고 문자열로 받는다(예: {@code "1.13"}).
     */
    public static long earnPoints(long price, String ratePercent) {
        throw new UnsupportedOperationException("J14(선택): PointMath.earnPoints — BigDecimal로 곱하고 100으로 나눠 소수점 아래를 버리세요");
    }

    /** 두 금액이 같은 값인가. 소수 자릿수(scale)가 달라도 값이 같으면 true({@code 1.0}과 {@code 1.00}). */
    public static boolean sameAmount(BigDecimal a, BigDecimal b) {
        throw new UnsupportedOperationException("J14(선택): PointMath.sameAmount — equals가 아니라 compareTo로 비교하세요");
    }
}
