package com.example.javatrack.j14;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 회원과 포인트 내역을 메모리에 담는 저장소(DB 대신). (정답) 찾는 것이 없어도 null을 돌려주지 않는다.
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

    /** 이메일로 회원을 찾는다. 없으면 {@code Optional.empty()}. */
    public Optional<Member> findByEmail(String email) {
        // "없을 수 있다"를 반환 타입에 적는다. 호출부는 꺼내기 전에 없는 경우를 처리해야 컴파일된다
        return Optional.ofNullable(membersByEmail.get(email));
    }

    /** 회원의 포인트 내역을 쌓인 순서대로 돌려준다. 내역이 하나도 없으면 빈 목록. */
    public List<PointHistory> findHistories(long memberId) {
        // 컬렉션은 Optional로 감싸지 않는다. "없음"은 빈 목록이면 충분하고, 호출부의 for·stream이 그대로 돈다
        return List.copyOf(historiesByMember.getOrDefault(memberId, List.of()));
    }
}
