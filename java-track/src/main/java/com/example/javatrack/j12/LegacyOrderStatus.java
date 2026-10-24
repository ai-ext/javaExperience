package com.example.javatrack.j12;

/**
 * 주어진 레거시 코드: 고치지 않는다. {@link OrderStatus}와 비교하려고 둔다.
 * 주문 상태를 문자열 코드("PAID" 등)로 들고 다니며, 상태마다 할 일을 메서드마다 if-else로 다시 가른다.
 * 상태가 하나 늘면 이 클래스의 if-else를 전부 찾아 고쳐야 한다.
 */
public final class LegacyOrderStatus {

    private LegacyOrderStatus() {
    }

    public static String label(String code) {
        if ("PAID".equals(code)) {
            return "결제 완료";
        } else if ("SHIPPING".equals(code)) {
            return "배송 중";
        } else if ("DELIVERED".equals(code)) {
            return "배송 완료";
        } else if ("CANCELLED".equals(code)) {
            return "취소됨";
        }
        return "알 수 없음";
    }

    public static boolean canCancel(String code) {
        if ("PAID".equals(code)) {
            return true;
        } else if ("SHIPPING".equals(code)) {
            return true;
        }
        return false;
    }

    /** 지금 취소하면 돌려줄 금액. 배송 중이면 배송비 3000원을 빼고, 취소할 수 없는 상태면 0. */
    public static long refundAmount(String code, long paidAmount) {
        if ("PAID".equals(code)) {
            return paidAmount;
        } else if ("SHIPPING".equals(code)) {
            long refund = paidAmount - 3000;
            if (refund < 0) {
                refund = 0;
            }
            return refund;
        }
        return 0;
    }
}
