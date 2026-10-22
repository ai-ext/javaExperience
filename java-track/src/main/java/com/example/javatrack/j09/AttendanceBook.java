package com.example.javatrack.j09;

import java.util.List;

/** 기본기 반복: 출석 기록 정리. */
public final class AttendanceBook {

    private AttendanceBook() {
    }

    /**
     * 회원마다, KST 날짜마다 가장 이른 출석 하나만 남긴다. 결과는 출석 시각이 이른 순이다.
     * 입력 순서는 뒤섞여 있을 수 있다. 날짜는 UTC가 아니라 KST로 가른다(UTC 15:00 = KST 다음 날 0시).
     */
    public static List<Attendance> firstPerKstDay(List<Attendance> records) {
        throw new UnsupportedOperationException("J09: AttendanceBook.firstPerKstDay — 회원·KST 날짜별로 가장 이른 출석만 남기세요");
    }
}
