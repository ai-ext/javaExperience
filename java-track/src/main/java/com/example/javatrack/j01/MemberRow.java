package com.example.javatrack.j01;

/**
 * 주어진 record: 고치지 않는다.
 * 옛 회원 데이터에서 읽은 한 줄. 닉네임 규칙이 생기기 전에 들어온 데이터라 규칙을 어긴 값이나 null이 섞여 있다.
 */
public record MemberRow(long id, String nickname) {
}
