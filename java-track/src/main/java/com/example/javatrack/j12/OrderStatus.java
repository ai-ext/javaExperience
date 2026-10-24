package com.example.javatrack.j12;

/**
 * 주문 상태. {@link LegacyOrderStatus}의 문자열 코드와 if-else를 이 enum 하나로 옮긴다.
 * <ul>
 *   <li>상태마다 화면 라벨을 필드로 가진다(생성자로 받는다)</li>
 *   <li>취소 가능 여부와 환불액은 상수마다 다르게 구현한다(상수별 메서드 몸체)</li>
 * </ul>
 * 규칙은 {@link LegacyOrderStatus}와 같다.
 */
public enum OrderStatus {

    // TODO: 상수마다 { … } 몸체를 열어 canCancel·refundAmount를 그 상태에 맞게 구현하세요
    PAID("결제 완료"),
    SHIPPING("배송 중"),
    DELIVERED("배송 완료"),
    CANCELLED("취소됨");

    // TODO: 라벨 필드를 선언하세요

    OrderStatus(String label) {
        // TODO: 라벨을 필드에 담으세요. (enum 생성자에서 예외를 던지면 enum 전체를 못 쓰게 되어 비워 둔다)
    }

    public String label() {
        throw new UnsupportedOperationException("J12: OrderStatus.label — 생성자에서 받은 라벨을 돌려주세요");
    }

    public boolean canCancel() {
        throw new UnsupportedOperationException("J12: OrderStatus.canCancel — 상수마다 몸체를 열어 구현하세요");
    }

    /** 지금 취소하면 돌려줄 금액. 규칙은 {@link LegacyOrderStatus#refundAmount}와 같다. */
    public long refundAmount(long paidAmount) {
        throw new UnsupportedOperationException("J12: OrderStatus.refundAmount — 상수마다 몸체를 열어 구현하세요");
    }
}
