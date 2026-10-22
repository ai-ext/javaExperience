package com.example.javatrack.j12;

/** 주어진 record: 고치지 않는다. 저장된 주문 한 건. */
public record PurchaseOrder(long memberId, String itemCode, int quantity,
        long totalPrice, long discount, int usedPoints, long paidAmount) {
}
