package com.example.javatrack.j03;

import java.util.List;

/** 실무 습관: null 다루는 습관(Objects.requireNonNull, Objects.equals, null 대신 빈 리스트). */
public class MemberDirectory {

    // TODO: 회원 목록 필드를 선언하세요

    /** rows가 null이면 바로 NullPointerException(메시지 "rows"). 받은 목록은 복사해 둔다. */
    public MemberDirectory(List<MemberRow> rows) {
        throw new UnsupportedOperationException("J03: MemberDirectory 생성자 — requireNonNull로 검사하고 복사해 담으세요");
    }

    /** 그 역할인 회원의 닉네임 목록. 한 명도 없으면 null이 아니라 빈 리스트. */
    public List<String> nicknamesOf(Role role) {
        throw new UnsupportedOperationException("J03: MemberDirectory.nicknamesOf — 없으면 빈 리스트를 돌려주세요");
    }

    /** id인 회원의 닉네임이 nickname과 같은가. 저장된 닉네임이나 nickname이 null이어도 예외 없이 비교한다. */
    public boolean hasNickname(long id, String nickname) {
        throw new UnsupportedOperationException("J03: MemberDirectory.hasNickname — Objects.equals로 비교하세요");
    }
}
