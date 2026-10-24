package com.example.javatrack.j09;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 기본기 반복: 출석 기록 정리. */
public final class AttendanceBook {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private AttendanceBook() {
    }

    /**
     * 회원마다, KST 날짜마다 가장 이른 출석 하나만 남긴다. 결과는 출석 시각이 이른 순이다.
     * 입력 순서는 뒤섞여 있을 수 있다. 날짜는 UTC가 아니라 KST로 가른다(UTC 15:00 = KST 다음 날 0시).
     */
    public static List<Attendance> firstPerKstDay(List<Attendance> records) {
        // 먼저 시각 순으로 정렬해 두면 "처음 본 것"이 곧 "가장 이른 것"이다
        List<Attendance> sorted = new ArrayList<>(records);
        sorted.sort(Comparator.comparing(Attendance::checkedAt));

        Map<String, Attendance> firstByMemberAndDay = new LinkedHashMap<>();
        for (Attendance attendance : sorted) {
            LocalDate kstDate = attendance.checkedAt().atZone(KST).toLocalDate();
            firstByMemberAndDay.putIfAbsent(attendance.memberId() + "@" + kstDate, attendance);
        }
        return new ArrayList<>(firstByMemberAndDay.values());
    }
}
