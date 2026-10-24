package com.example.javatrack.j09;

import java.math.BigDecimal;

/** 선택: DECIMAL(5,2)용 실험 정책. 부호를 허용하며 실제 상점의 정수 포인트 계약과는 별개다. */
public final class DecimalAmount {
    private DecimalAmount() {
    }

    /** 문자열 생성 → scale 2 HALF_UP → 절댓값 999.99 이하 검사. */
    public static BigDecimal forStorage(String text) {
        throw new UnsupportedOperationException("J09: DecimalAmount.forStorage — 문자열 금액을 반올림하고 범위를 검사하세요");
    }

    /** scale 2로 손실 없이 표현한다. 값 손실은 ArithmeticException, 범위 초과는 IllegalArgumentException. */
    public static BigDecimal exact(String text) {
        throw new UnsupportedOperationException("J09: DecimalAmount.exact — 반올림 없이 scale과 범위를 검사하세요");
    }
}
