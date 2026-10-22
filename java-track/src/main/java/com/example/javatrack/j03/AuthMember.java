package com.example.javatrack.j03;

/**
 * 인증된 요청의 주체. 불변 객체다.
 * <ul>
 *   <li>final 클래스, 필드는 모두 private final. 값을 바꾸는 메서드 대신 새 객체를 돌려준다</li>
 *   <li>role이 null이면 만들 때 바로 NullPointerException(메시지 "role")</li>
 *   <li>id와 role이 같으면 equals가 true이고 hashCode도 같다</li>
 * </ul>
 */
public final class AuthMember {

    private final long id;
    private final Role role;

    public AuthMember(long id, Role role) {
        throw new UnsupportedOperationException("J03: AuthMember 생성자 — Objects.requireNonNull로 role을 검사하고 필드에 담으세요");
    }

    public long id() {
        return id;
    }

    public Role role() {
        return role;
    }

    /** 글을 고칠 수 있는가: 작성자 본인이거나 관리자면 true. */
    public boolean canModify(long writerId) {
        throw new UnsupportedOperationException("J03: AuthMember.canModify — 관리자이거나 본인이면 true");
    }

    /** 역할만 바꾼 새 AuthMember를 돌려준다. 이 객체는 바뀌지 않는다. */
    public AuthMember withRole(Role newRole) {
        throw new UnsupportedOperationException("J03: AuthMember.withRole — 같은 id에 새 역할로 새 객체를 만드세요");
    }

    @Override
    public boolean equals(Object o) {
        throw new UnsupportedOperationException("J03: AuthMember.equals — id와 role이 같으면 true");
    }

    @Override
    public int hashCode() {
        throw new UnsupportedOperationException("J03: AuthMember.hashCode — equals에 쓴 필드로 Objects.hash를 만드세요");
    }
}
