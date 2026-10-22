package com.example.board.admin;

/** 엑셀에서 읽은 회원 id와 그 행 번호(1부터). 지급 단계에서 건너뛸 때도 행 번호로 알린다. */
public record MemberIdRow(int row, long memberId) {
}
