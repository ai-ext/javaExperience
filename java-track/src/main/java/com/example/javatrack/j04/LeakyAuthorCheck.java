package com.example.javatrack.j04;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link AuthorCheck}와 비교하려고 둔다.
 * Long 두 개를 ==로 비교한다. ==는 값이 아니라 같은 객체인지를 본다.
 */
public final class LeakyAuthorCheck {

    private LeakyAuthorCheck() {
    }

    public static boolean isWrittenBy(Long writerId, Long memberId) {
        return writerId == memberId;
    }
}
