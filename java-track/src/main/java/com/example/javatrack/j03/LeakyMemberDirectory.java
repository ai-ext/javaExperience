package com.example.javatrack.j03;

import java.util.ArrayList;
import java.util.List;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link MemberDirectory}와 비교하려고 둔다.
 * 찾는 회원이 없으면 null을 돌려주고, 닉네임을 {@code row.nickname().equals(...)}로 비교한다.
 */
public class LeakyMemberDirectory {

    private final List<MemberRow> rows;

    public LeakyMemberDirectory(List<MemberRow> rows) {
        this.rows = rows;
    }

    public List<String> nicknamesOf(Role role) {
        List<String> result = new ArrayList<>();
        for (MemberRow row : rows) {
            if (row.role() == role) {
                result.add(row.nickname());
            }
        }
        return result.isEmpty() ? null : result;
    }

    public boolean hasNickname(long id, String nickname) {
        for (MemberRow row : rows) {
            if (row.id() == id) {
                return row.nickname().equals(nickname);
            }
        }
        return false;
    }
}
