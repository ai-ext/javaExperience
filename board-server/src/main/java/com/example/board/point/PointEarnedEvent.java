package com.example.board.point;

/** 활동 포인트가 적립되어 원장에 기록됐다. 커밋 뒤 활동 랭킹 점수를 같은 값만큼 올린다. */
public record PointEarnedEvent(Long memberId, int amount, String refType) {
}
