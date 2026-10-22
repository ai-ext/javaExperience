package com.example.javatrack.j14;

/** 주어진 record: 고치지 않는다. 포인트 내역 한 줄. 적립은 양수, 사용은 음수. */
public record PointHistory(long memberId, int amount, String reason) {
}
