package com.example.javatrack.j12;

import java.util.ArrayList;
import java.util.List;

/**
 * 구매 처리. (정답) 검증·계산·저장을 세 메서드로 나누고 {@link #purchase}에는 흐름만 남겼다.
 * <p>
 * 과제: 동작은 그대로 두고 {@link #purchase}를 아래 세 메서드로 나눈다.
 * {@code purchase}에는 "검증 → 실패면 사유를 이어 돌려줌 → 계산 → 저장 → 결과" 흐름만 남긴다.
 * <ul>
 *   <li>{@link #validate}: 실패 사유를 모두 모아 {@code List<String>}으로 돌려준다(없으면 빈 목록)</li>
 *   <li>{@link #calculate}: 금액만 계산한다. 저장소를 바꾸지 않는다</li>
 *   <li>{@link #save}: 재고·포인트를 바꾸고 주문을 저장해 주문 번호를 돌려준다</li>
 * </ul>
 * 세 메서드는 테스트가 바꿔 끼워 볼 수 있게 package-private이고 final이 아니다.
 */
public class PurchaseService {

    // 매직 넘버를 이름 붙인 상수로 꺼냈다. 나누면서 같은 숫자가 두 메서드에 흩어지지 않게 한다
    private static final int MIN_QUANTITY = 1;
    private static final int MAX_QUANTITY = 10;
    private static final String COUPON_PREFIX = "SALE";
    private static final long COUPON_DISCOUNT_PERCENT = 10;
    private static final long COUPON_DISCOUNT_MAX = 5000;
    private static final long EARN_PERCENT = 1;

    private final ShopStore store;

    public PurchaseService(ShopStore store) {
        this.store = store;
    }

    public PurchaseResult purchase(PurchaseRequest request) {
        List<String> errors = validate(request);
        if (!errors.isEmpty()) {
            return new PurchaseResult(false, null, 0, String.join(", ", errors));
        }
        Payment payment = calculate(request);
        long orderId = save(request, payment);
        return new PurchaseResult(true, orderId, payment.paidAmount(), "구매 완료");
    }

    /** 실패 사유를 수량 → 상품·재고 → 포인트 → 쿠폰 순으로 모두 모은다. 문제가 없으면 빈 목록. */
    List<String> validate(PurchaseRequest request) {
        // 첫 실패에서 돌아가지 않고 끝까지 모은다. ", " 잇기는 보여 주는 쪽(purchase)이 한다
        List<String> errors = new ArrayList<>();
        if (request.quantity() < MIN_QUANTITY || request.quantity() > MAX_QUANTITY) {
            errors.add("수량은 1~10개여야 합니다");
        }
        ShopItem item = store.findItem(request.itemCode());
        if (item == null) {
            errors.add("없는 상품입니다");
        } else if (item.stock() < request.quantity()) {
            errors.add("재고가 부족합니다");
        }
        if (request.usePoints() < 0) {
            errors.add("사용 포인트는 0 이상이어야 합니다");
        } else if (request.usePoints() > store.pointsOf(request.memberId())) {
            errors.add("포인트가 부족합니다");
        }
        if (request.couponCode() != null && !request.couponCode().startsWith(COUPON_PREFIX)) {
            errors.add("쓸 수 없는 쿠폰입니다");
        }
        return errors;
    }

    /** 검증을 통과한 요청의 금액을 계산한다. 저장소는 바꾸지 않는다. */
    Payment calculate(PurchaseRequest request) {
        long total = store.findItem(request.itemCode()).price() * request.quantity();
        long discount = request.couponCode() == null
                ? 0
                : Math.min(total * COUPON_DISCOUNT_PERCENT / 100, COUPON_DISCOUNT_MAX);
        // 포인트는 할인 뒤 금액의 절반까지만 쓸 수 있다
        int usedPoints = (int) Math.min(request.usePoints(), (total - discount) / 2);
        return new Payment(total, discount, usedPoints, total - discount - usedPoints);
    }

    /** 재고·포인트를 바꾸고 주문을 저장한 뒤 주문 번호를 돌려준다. */
    long save(PurchaseRequest request, Payment payment) {
        store.decreaseStock(request.itemCode(), request.quantity());
        if (payment.usedPoints() > 0) {
            store.usePoints(request.memberId(), payment.usedPoints());
        }
        store.addPoints(request.memberId(), (int) (payment.paidAmount() * EARN_PERCENT / 100));
        return store.saveOrder(new PurchaseOrder(request.memberId(), request.itemCode(), request.quantity(),
                payment.totalPrice(), payment.discount(), payment.usedPoints(), payment.paidAmount()));
    }
}
