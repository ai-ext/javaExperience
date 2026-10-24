package com.example.javatrack.j12;

/** 주어진 record: 고치지 않는다. 계산 단계의 결과. {@code paidAmount = totalPrice - discount - usedPoints}. */
public record Payment(long totalPrice, long discount, int usedPoints, long paidAmount) {
}
