package com.example.javatrack.j14;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 회원과 포인트 내역을 메모리에 담는 저장소(DB 대신). 지금은 찾는 것이 없으면 null을 돌려준다.
 * <p>
 * 과제: null을 돌려주지 않게 바꾼다.
 * <ul>
 *   <li>{@link #findByEmail}: 반환 타입을 {@code Optional<Member>}로 바꾼다. 없으면 {@code Optional.empty()}</li>
 *   <li>{@link #findHistories}: 반환 타입은 그대로 두고, 없으면 null 대신 빈 목록을 돌려준다</li>
 * </ul>
 */
public class MemberRepository {

    private final Map<String, Member> membersByEmail = new HashMap<>();
    private final Map<Long, List<PointHistory>> historiesByMember = new HashMap<>();

    public void save(Member member) {
        membersByEmail.put(member.email(), member);
    }

    public void addHistory(PointHistory history) {
        historiesByMember.computeIfAbsent(history.memberId(), id -> new ArrayList<>()).add(history);
    }

    /** 이메일로 회원을 찾는다. 없으면 null. */
    public Member findByEmail(String email) {
        return membersByEmail.get(email);
    }

    /** 회원의 포인트 내역을 쌓인 순서대로 돌려준다. 내역이 하나도 없으면 null. */
    public List<PointHistory> findHistories(long memberId) {
        List<PointHistory> histories = historiesByMember.get(memberId);
        if (histories == null) {
            return null;
        }
        return List.copyOf(histories);
    }
}
