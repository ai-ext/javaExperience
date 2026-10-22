package com.example.javatrack.j03;

/** 주어진 엔티티: 고치지 않는다. 포인트 적립 한 건. id는 저장해야 매겨지므로 저장 전에는 null이다. */
public class PointEntry {

    private Long id;
    private final long memberId;
    private final long amount;

    public PointEntry(long memberId, long amount) {
        this.memberId = memberId;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public long getMemberId() {
        return memberId;
    }

    public long getAmount() {
        return amount;
    }

    /** 저장소가 저장한 뒤 부른다. */
    public void assignId(Long id) {
        this.id = id;
    }
}
