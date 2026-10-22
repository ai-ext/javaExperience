package com.example.javatrack.j08;

import java.util.List;

/**
 * 주어진 예외: 고치지 않는다.
 * 충전 요청 목록에서 실패한 건을 모두 담는다. 한 건씩 따로 던지지 않고 한 번에 알려 준다.
 */
public class ChargeValidationException extends RuntimeException {

    private final List<ChargeFailure> failures;

    public ChargeValidationException(List<ChargeFailure> failures) {
        super("충전 요청 " + failures.size() + "건이 검사에 실패했습니다.");
        this.failures = List.copyOf(failures);
    }

    public List<ChargeFailure> failures() {
        return failures;
    }
}
