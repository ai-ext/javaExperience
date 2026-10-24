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

    // private: 밖에서는 메서드로만 읽고 바꾼다. final: 이메일은 생성자에서 한 번만 대입한다
    private final String email;
    private String nickname;

    public Member(String email, String nickname) {
        if (email == null || !email.contains("@") || email.length() > EMAIL_MAX_LENGTH) {
            throw new IllegalArgumentException("이메일 형식이 아닙니다: " + email);
        }
        this.email = email;
        this.nickname = validNickname(nickname);
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    /** 생성자와 같은 규칙으로 검사한 뒤 닉네임을 바꾼다. 규칙을 어기면 원래 닉네임이 남는다. */
    public void changeNickname(String newNickname) {
        // 검사를 먼저 하고 통과한 값만 대입하므로, 예외가 나면 원래 닉네임이 그대로 남는다
        this.nickname = validNickname(newNickname);
    }

    /** 지금 값으로 {@link MemberProfile} record를 만들어 돌려준다. */
    public MemberProfile toProfile() {
        return new MemberProfile(email, nickname);
    }

    private static String validNickname(String nickname) {
        if (nickname == null || nickname.length() < NICKNAME_MIN_LENGTH || nickname.length() > NICKNAME_MAX_LENGTH) {
            throw new IllegalArgumentException("닉네임은 2~20자여야 합니다: " + nickname);
        }
        return nickname;
    }
}
