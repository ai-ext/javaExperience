package com.example.board.point;

/** 활동 랭킹 한 줄. rank는 1부터 센다. */
public record ActivityRank(long rank, Long memberId, String nickname, long score) {
}
