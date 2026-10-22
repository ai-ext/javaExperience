package com.example.javatrack.j12;

/**
 * 주어진 record: 고치지 않는다. 구매 처리 결과.
 *
 * @param orderId 실패면 null
 * @param message 성공이면 "구매 완료", 실패면 사유를 ", "로 이은 문자열
 */
public record PurchaseResult(boolean success, Long orderId, long paidAmount, String message) {
}
