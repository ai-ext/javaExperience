package com.example.javatrack.j12;

/**
 * 주어진 record: 고치지 않는다. 구매 요청.
 *
 * @param couponCode 쓰지 않으면 null
 * @param usePoints  쓰려는 포인트. 실제로 쓰는 양은 결제 금액에 따라 줄어들 수 있다
 */
public record PurchaseRequest(long memberId, String itemCode, int quantity, String couponCode, int usePoints) {
}
