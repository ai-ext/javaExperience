package com.example.board.point;

import java.time.LocalDate;

/** 출석한 날짜와 이번에 적립한 포인트 */
public record AttendanceResponse(LocalDate attendedOn, int earnedPoints) {
}
