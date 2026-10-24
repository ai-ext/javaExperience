package com.example.javatrack.j01;

/**
 * 주어진 record: 고치지 않는다.
 * record는 생성자·getter(email(), nickname())·equals·hashCode·toString을 컴파일러가 만들어 주고, 필드는 바꿀 수 없다.
 */
public record MemberProfile(String email, String nickname) {
}
