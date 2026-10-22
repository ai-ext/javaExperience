package com.example.javatrack.j14;

import java.util.List;

/**
 * 포인트 화면용 조회. {@link MemberRepository}의 null 반환을 받아 쓰는 호출부다.
 * <p>
 * 과제: 저장소가 Optional·빈 목록을 돌려주게 바꾼 뒤 이 호출부를 그에 맞게 고친다.
 * 지금은 null 검사를 빠뜨린 곳에서 NullPointerException이 난다. 고친 뒤에는 어떤 이메일에도 NPE가 나지 않는다.
 */
public class PointReportService {

    private final MemberRepository repository;

    public PointReportService(MemberRepository repository) {
        this.repository = repository;
    }

    /** {@code "닉네임: 합계P"}. 회원이 없으면 {@code "회원 없음"}, 내역이 없으면 합계 0. */
    public String report(String email) {
        Member member = repository.findByEmail(email);
        if (member == null) {
            return "회원 없음";
        }
        List<PointHistory> histories = repository.findHistories(member.id());
        int total = 0;
        for (PointHistory history : histories) {
            total += history.amount();
        }
        return member.nickname() + ": " + total + "P";
    }

    /** 회원의 포인트 합계. 회원이 없거나 내역이 없으면 0. */
    public int totalPoints(String email) {
        Member member = repository.findByEmail(email);
        List<PointHistory> histories = repository.findHistories(member.id());
        int total = 0;
        for (PointHistory history : histories) {
            total += history.amount();
        }
        return total;
    }
}
