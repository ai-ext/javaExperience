package com.example.javatrack.j03;

/** 주어진 record: 고치지 않는다. 회원 한 줄. 옛 데이터라 닉네임이 null인 회원이 섞여 있다. */
public record MemberRow(long id, String nickname, Role role) {
}
