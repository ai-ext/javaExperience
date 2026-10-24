package com.example.javatrack.j03;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link AuthMember}와 비교하려고 둔다.
 * equals는 값으로 비교하도록 고쳤지만 hashCode는 고치지 않았다(Object의 기본 hashCode를 그대로 쓴다).
 */
public final class LeakyAuthMember {

    private final long id;
    private final Role role;

    public LeakyAuthMember(long id, Role role) {
        this.id = id;
        this.role = role;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof LeakyAuthMember other)) {
            return false;
        }
        return id == other.id && role == other.role;
    }
}
