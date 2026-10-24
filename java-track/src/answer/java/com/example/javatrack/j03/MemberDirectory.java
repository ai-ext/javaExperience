package com.example.javatrack.j03;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** 실무 습관: null 다루는 습관(Objects.requireNonNull, Objects.equals, null 대신 빈 리스트). */
public class MemberDirectory {

    private final List<MemberRow> rows;

    /** rows가 null이면 바로 NullPointerException(메시지 "rows"). 받은 목록은 복사해 둔다. */
    public MemberDirectory(List<MemberRow> rows) {
        // List.copyOf도 null이면 NPE를 내지만, 메시지로 어느 인자가 null인지 알려 준다
        this.rows = List.copyOf(Objects.requireNonNull(rows, "rows"));
    }

    /** 그 역할인 회원의 닉네임 목록. 한 명도 없으면 null이 아니라 빈 리스트. */
    public List<String> nicknamesOf(Role role) {
        List<String> result = new ArrayList<>();
        for (MemberRow row : rows) {
            if (row.role() == role) {
                result.add(row.nickname());
            }
        }
        // 비어 있어도 그대로 돌려준다. 호출하는 쪽은 null 검사 없이 for를 돌 수 있다
        return result;
    }

    /** id인 회원의 닉네임이 nickname과 같은가. 저장된 닉네임이나 nickname이 null이어도 예외 없이 비교한다. */
    public boolean hasNickname(long id, String nickname) {
        for (MemberRow row : rows) {
            if (row.id() == id) {
                // a.equals(b)는 a가 null이면 NPE. Objects.equals는 둘 다 null이면 true, 하나만 null이면 false
                return Objects.equals(row.nickname(), nickname);
            }
        }
        return false;
    }
}
