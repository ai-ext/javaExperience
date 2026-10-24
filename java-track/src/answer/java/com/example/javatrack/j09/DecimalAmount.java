package com.example.javatrack.j09;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** 선택: DECIMAL(5,2)에 넣기 전 명시적으로 적용하는 실험용 정책. */
public final class DecimalAmount {
    private static final BigDecimal MAX = new BigDecimal("999.99");

    private DecimalAmount() {
    }

    public static BigDecimal forStorage(String text) {
        return withinRange(new BigDecimal(text).setScale(2, RoundingMode.HALF_UP));
    }

    public static BigDecimal exact(String text) {
        return withinRange(new BigDecimal(text).setScale(2, RoundingMode.UNNECESSARY));
    }

    private static BigDecimal withinRange(BigDecimal amount) {
        // 반올림 때문에 정수 자릿수가 늘어날 수 있으므로 정규화 뒤 검사한다.
        if (amount.abs().compareTo(MAX) > 0) {
            throw new IllegalArgumentException("DECIMAL(5,2) 범위 초과: " + amount);
        }
        return amount;
    }
}
