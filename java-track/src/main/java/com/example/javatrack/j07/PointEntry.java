package com.example.javatrack.j07;

/** 주어진 record: 고치지 않는다. 포인트 이력 한 줄. amount는 적립이면 양수, 사용이면 음수. */
public record PointEntry(long id, long memberId, long amount) {
}
