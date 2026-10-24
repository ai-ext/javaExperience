package com.example.javatrack.j03;

import java.util.Map;

/**
 * 주어진 가짜 매퍼: 고치지 않는다.
 * {@code SELECT SUM(amount) FROM point_ledger WHERE member_id = ?}처럼 동작한다. 이력이 없는 회원은 SUM이 null이다.
 */
public class PointSumMapper {

    private final Map<Long, Long> sums;

    public PointSumMapper(Map<Long, Long> sums) {
        this.sums = sums;
    }

    /** 이력이 없으면 null(0이 아니다). SQL의 SUM은 행이 없으면 NULL을 돌려준다. */
    public Long sumByMember(long memberId) {
        return sums.get(memberId);
    }
}
