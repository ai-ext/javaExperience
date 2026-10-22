package com.example.board.shop;

public record OrderResponse(Long orderId, Long itemId, int quantity, long paidAmount, Long memberCouponId) {

    static OrderResponse from(ShopOrder order) {
        return new OrderResponse(order.getId(), order.getItem().getId(), order.getQuantity(), order.getPaidAmount(),
                order.getMemberCoupon() == null ? null : order.getMemberCoupon().getId());
    }
}
