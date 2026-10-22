package com.example.javatrack.j14;

/** 주어진 record: 고치지 않는다. 회원. 옛 데이터라 닉네임이 null인 회원이 있다. */
public record Member(long id, String email, String nickname) {
}
