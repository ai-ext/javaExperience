package com.example.board.admin;

import java.util.List;

/** 읽은 회원 id(행 번호와 함께)와 값이 잘못돼 건너뛴 행. 빈 행은 어디에도 넣지 않는다. */
public record ExcelReadResult(List<MemberIdRow> rows, List<Skipped> skipped) {

    public List<Long> memberIds() {
        return rows.stream().map(MemberIdRow::memberId).toList();
    }
}
