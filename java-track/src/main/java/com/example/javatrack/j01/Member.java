package com.example.javatrack.j01;

/**
 * 회원. 생성자에서 잘못된 값을 거절해, 만들어진 Member는 언제나 규칙을 지킨다.
 * <ul>
 *   <li>이메일: null이 아니고 {@code @}를 포함하며 최대 {@value #EMAIL_MAX_LENGTH}자. 만든 뒤에는 바꿀 수 없다</li>
 *   <li>닉네임: {@value #NICKNAME_MIN_LENGTH}~{@value #NICKNAME_MAX_LENGTH}자. {@link #changeNickname}으로만 바꾼다</li>
 * </ul>
 * 규칙을 어기면 {@link IllegalArgumentException}을 던진다.
 */
public class Member {

    public static final int EMAIL_MAX_LENGTH = 100;
    public static final int NICKNAME_MIN_LENGTH = 2;
    public static final int NICKNAME_MAX_LENGTH = 20;

    // TODO: 이메일·닉네임 필드를 선언하세요. 이름은 email·nickname(밖에서 직접 못 건드리게, 이메일은 다시 대입할 수 없게)

    public Member(String email, String nickname) {
        throw new UnsupportedOperationException("J01: Member 생성자 — 이메일·닉네임을 검사하고 필드에 담으세요");
    }

    public String getEmail() {
        throw new UnsupportedOperationException("J01: Member.getEmail — 이메일 필드를 돌려주세요");
    }

    public String getNickname() {
        throw new UnsupportedOperationException("J01: Member.getNickname — 닉네임 필드를 돌려주세요");
    }

    /** 생성자와 같은 규칙으로 검사한 뒤 닉네임을 바꾼다. 규칙을 어기면 원래 닉네임이 남는다. */
    public void changeNickname(String newNickname) {
        throw new UnsupportedOperationException("J01: Member.changeNickname — 닉네임 규칙을 검사하고 바꾸세요");
    }

    /** 지금 값으로 {@link MemberProfile} record를 만들어 돌려준다. */
    public MemberProfile toProfile() {
        throw new UnsupportedOperationException("J01: Member.toProfile — 지금 이메일·닉네임으로 MemberProfile을 만드세요");
    }
}
