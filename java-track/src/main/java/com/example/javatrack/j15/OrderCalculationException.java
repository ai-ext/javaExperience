package com.example.javatrack.j15;

import java.util.List;

/** 주어진 예외: 고치지 않는다. 계산에 실패한 주문을 모두 담는다. */
public class OrderCalculationException extends RuntimeException {

    private final List<OrderFailure> failures;

    public OrderCalculationException(List<OrderFailure> failures) {
        super("주문 " + failures.size() + "건을 계산하지 못했습니다.");
        this.failures = List.copyOf(failures);
    }

    public List<OrderFailure> failures() {
        return failures;
    }
}
