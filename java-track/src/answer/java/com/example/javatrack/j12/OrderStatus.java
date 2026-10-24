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

    PAID("결제 완료") {
        @Override
        public boolean canCancel() {
            return true;
        }

        @Override
        public long refundAmount(long paidAmount) {
            return paidAmount;
        }
    },
    SHIPPING("배송 중") {
        @Override
        public boolean canCancel() {
            return true;
        }

        @Override
        public long refundAmount(long paidAmount) {
            return Math.max(0, paidAmount - SHIPPING_FEE);
        }
    },
    DELIVERED("배송 완료") {
        @Override
        public boolean canCancel() {
            return false;
        }

        @Override
        public long refundAmount(long paidAmount) {
            return 0;
        }
    },
    CANCELLED("취소됨") {
        @Override
        public boolean canCancel() {
            return false;
        }

        @Override
        public long refundAmount(long paidAmount) {
            return 0;
        }
    };

    // 상수 몸체에서 쓰는 상수. enum 상수보다 늦게 초기화되지만 컴파일 시점 상수라 몸체에서 바로 쓸 수 있다
    private static final long SHIPPING_FEE = 3000;

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    // 몸체마다 반드시 구현하게 abstract로 둔다. 상태를 하나 더하면서 구현을 빠뜨리면 컴파일 에러가 난다
    public abstract boolean canCancel();

    /** 지금 취소하면 돌려줄 금액. 규칙은 {@link LegacyOrderStatus#refundAmount}와 같다. */
    public abstract long refundAmount(long paidAmount);
}
