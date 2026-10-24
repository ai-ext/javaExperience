package com.example.javatrack.j08;

import java.util.ArrayList;
import java.util.List;

/** 기본기 반복: 충전 요청 목록 검사. */
public final class ChargeValidator {

    public static final int MIN_AMOUNT = 1_000;
    public static final int MAX_AMOUNT = 1_000_000;
    public static final int AMOUNT_UNIT = 1_000;

    private ChargeValidator() {
    }

    /**
     * 요청을 모두 검사해 금액 합계를 돌려준다. 한 건이라도 실패하면 합계 대신 실패한 건을 <b>모두</b> 담은
     * {@link ChargeValidationException}을 던진다(첫 실패에서 멈추지 않는다). 한 요청에는 실패 하나만 기록한다.
     * <ul>
     *   <li>멱등 키: null이거나 공백뿐이면 실패</li>
     *   <li>금액: 1,000~1,000,000이고 1,000 단위여야 한다</li>
     * </ul>
     */
    public static long validateAndSum(List<ChargeRequest> requests) {
        List<ChargeFailure> failures = new ArrayList<>();
        long total = 0;
        for (int i = 0; i < requests.size(); i++) {
            String reason = reasonOf(requests.get(i));
            if (reason != null) {
                failures.add(new ChargeFailure(i, reason));
            } else {
                total += requests.get(i).amount();
            }
        }
        if (!failures.isEmpty()) {
            throw new ChargeValidationException(failures);
        }
        return total;
    }

    /** 통과하면 null, 실패하면 첫 번째로 어긴 규칙의 사유. */
    private static String reasonOf(ChargeRequest request) {
        if (request.idempotencyKey() == null || request.idempotencyKey().isBlank()) {
            return "멱등 키가 없습니다";
        }
        int amount = request.amount();
        if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
            return "금액은 1,000~1,000,000원이어야 합니다: " + amount;
        }
        if (amount % AMOUNT_UNIT != 0) {
            return "금액은 1,000원 단위여야 합니다: " + amount;
        }
        return null;
    }
}
