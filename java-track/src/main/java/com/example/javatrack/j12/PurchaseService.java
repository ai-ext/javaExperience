package com.example.javatrack.j12;

import java.util.List;

/**
 * 구매 처리. 지금은 {@link #purchase} 한 메서드가 검증·계산·저장을 모두 한다.
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

    private final ShopStore store;

    public PurchaseService(ShopStore store) {
        this.store = store;
    }

    public PurchaseResult purchase(PurchaseRequest request) {
        String error = "";

        // ---- 수량 ----
        if (request.quantity() < 1 || request.quantity() > 10) {
            error = error + "수량은 1~10개여야 합니다";
        }

        // ---- 상품·재고 ----
        ShopItem item = store.findItem(request.itemCode());
        if (item == null) {
            if (!error.isEmpty()) {
                error = error + ", ";
            }
            error = error + "없는 상품입니다";
        } else if (item.stock() < request.quantity()) {
            if (!error.isEmpty()) {
                error = error + ", ";
            }
            error = error + "재고가 부족합니다";
        }

        // ---- 포인트 ----
        if (request.usePoints() < 0) {
            if (!error.isEmpty()) {
                error = error + ", ";
            }
            error = error + "사용 포인트는 0 이상이어야 합니다";
        } else if (request.usePoints() > store.pointsOf(request.memberId())) {
            if (!error.isEmpty()) {
                error = error + ", ";
            }
            error = error + "포인트가 부족합니다";
        }

        // ---- 쿠폰 ----
        if (request.couponCode() != null && !request.couponCode().startsWith("SALE")) {
            if (!error.isEmpty()) {
                error = error + ", ";
            }
            error = error + "쓸 수 없는 쿠폰입니다";
        }

        if (!error.isEmpty()) {
            return new PurchaseResult(false, null, 0, error);
        }

        // ---- 금액 계산 ----
        long total = item.price() * request.quantity();
        long discount = 0;
        if (request.couponCode() != null) {
            discount = total * 10 / 100;
            if (discount > 5000) {
                discount = 5000;
            }
        }
        int usedPoints = request.usePoints();
        // 포인트는 할인 뒤 금액의 절반까지만 쓸 수 있다
        long maxPoints = (total - discount) / 2;
        if (usedPoints > maxPoints) {
            usedPoints = (int) maxPoints;
        }
        long paid = total - discount - usedPoints;

        // ---- 저장 ----
        store.decreaseStock(item.code(), request.quantity());
        if (usedPoints > 0) {
            store.usePoints(request.memberId(), usedPoints);
        }
        // 결제 금액의 1% 적립
        store.addPoints(request.memberId(), (int) (paid / 100));
        long orderId = store.saveOrder(new PurchaseOrder(request.memberId(), item.code(), request.quantity(),
                total, discount, usedPoints, paid));

        return new PurchaseResult(true, orderId, paid, "구매 완료");
    }

    /** 실패 사유를 수량 → 상품·재고 → 포인트 → 쿠폰 순으로 모두 모은다. 문제가 없으면 빈 목록. */
    List<String> validate(PurchaseRequest request) {
        throw new UnsupportedOperationException("J12: PurchaseService.validate — purchase의 검증 부분을 옮기고 사유를 List로 모으세요");
    }

    /** 검증을 통과한 요청의 금액을 계산한다. 저장소는 바꾸지 않는다. */
    Payment calculate(PurchaseRequest request) {
        throw new UnsupportedOperationException("J12: PurchaseService.calculate — purchase의 금액 계산 부분을 옮기세요");
    }

    /** 재고·포인트를 바꾸고 주문을 저장한 뒤 주문 번호를 돌려준다. */
    long save(PurchaseRequest request, Payment payment) {
        throw new UnsupportedOperationException("J12: PurchaseService.save — purchase의 저장 부분을 옮기세요");
    }
}
