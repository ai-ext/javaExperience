package com.example.javatrack.j03;

import java.util.Objects;

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
        this.id = id;
        // 나중에 canModify에서 터지지 않고, 잘못 만든 그 자리에서 터지게 한다
        this.role = Objects.requireNonNull(role, "role");
    }

    public long id() {
        return id;
    }

    public Role role() {
        return role;
    }

    /** 글을 고칠 수 있는가: 작성자 본인이거나 관리자면 true. */
    public boolean canModify(long writerId) {
        // enum은 상수가 하나씩이라 ==로 비교한다
        return role == Role.ADMIN || id == writerId;
    }

    /** 역할만 바꾼 새 AuthMember를 돌려준다. 이 객체는 바뀌지 않는다. */
    public AuthMember withRole(Role newRole) {
        return new AuthMember(id, newRole);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof AuthMember other)) {
            return false;
        }
        return id == other.id && role == other.role;
    }

    @Override
    public int hashCode() {
        // equals에 쓴 필드를 그대로 쓴다. 같은 객체(equals true)는 반드시 hashCode가 같아야 한다
        return Objects.hash(id, role);
    }
}
