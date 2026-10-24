package com.example.javatrack.j02;

/**
 * 엔티티의 공통 부모. id를 래퍼 타입 {@link Long}으로 가진다. null이면 아직 저장 전이다.
 * (board-server의 BaseEntity는 생성·수정 시각만 갖고 id는 엔티티마다 둔다. 여기서는 id 판단을 보려고 부모에 모았다.)
 */
public abstract class BaseEntity {

    private Long id;

    public Long getId() {
        return id;
    }

    /** 저장소만 부른다(같은 패키지). JPA라면 INSERT 뒤에 DB가 만든 id를 넣어 주는 자리다. */
    void assignId(Long id) {
        this.id = id;
    }

    /** 아직 저장 전인가. JPA(Spring Data)도 id가 null이면 새 엔티티로 보고 INSERT한다. */
    public boolean isNew() {
        throw new UnsupportedOperationException("J02: BaseEntity.isNew — id가 null이면 저장 전입니다");
    }
}
