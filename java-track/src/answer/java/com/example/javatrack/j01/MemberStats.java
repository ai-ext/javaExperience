package com.example.javatrack.j01;

import java.util.List;

/** 기본기 반복: 회원 목록을 돌며 세기. */
public final class MemberStats {

    private MemberStats() {
    }

    /** 회원 목록을 for로 돌며 닉네임이 2~20자인 회원 수를 센다. 닉네임이 null이면 세지 않는다. */
    public static int countValidNicknames(List<MemberRow> rows) {
        int count = 0;
        for (MemberRow row : rows) {
            String nickname = row.nickname();
            // null 검사를 먼저 해야 length()에서 NPE가 나지 않는다
            if (nickname != null
                    && nickname.length() >= Member.NICKNAME_MIN_LENGTH
                    && nickname.length() <= Member.NICKNAME_MAX_LENGTH) {
                count++;
            }
        }
        return count;
    }
}
