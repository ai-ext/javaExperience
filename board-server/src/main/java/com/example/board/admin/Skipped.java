package com.example.board.admin;

/**
 * 지급하지 않고 건너뛴 행. row는 엑셀에서 보이는 행 번호(1부터), value는 셀에 적힌 값이다.
 * reason: NOT_A_NUMBER, NOT_POSITIVE(파일), MEMBER_NOT_FOUND, ALREADY_ISSUED, COUPON_EXHAUSTED(지급).
 */
public record Skipped(int row, String value, String reason) {
}
