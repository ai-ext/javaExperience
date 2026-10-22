package com.example.board.point;

/** 원장에서 합산한 회원별 활동 점수. */
public record MemberScore(Long memberId, Long score) {
}
