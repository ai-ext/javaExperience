package com.example.javatrack.j07;

/** 주어진 record: 고치지 않는다. 옛 회원 데이터 한 줄. 닉네임 중복 검사가 생기기 전이라 같은 닉네임이 섞여 있다. */
public record MemberRow(long id, String nickname) {
}
