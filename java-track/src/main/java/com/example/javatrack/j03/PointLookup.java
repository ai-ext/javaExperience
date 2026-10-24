package com.example.javatrack.j03;

import java.util.Map;

/** 타입 한 컷: Long이 null일 수 있는 세 자리에서 long으로 꺼내기 전에 null을 처리한다. */
public class PointLookup {

    private final PointSumMapper mapper;
    private final Map<Long, Long> balanceCache;

    public PointLookup(PointSumMapper mapper, Map<Long, Long> balanceCache) {
        this.mapper = mapper;
        this.balanceCache = balanceCache;
    }

    /** ① 회원의 포인트 합계. 이력이 없어 SUM이 null이면 0. */
    public long totalPoints(long memberId) {
        throw new UnsupportedOperationException("J03: PointLookup.totalPoints — 매퍼 결과를 Long으로 받아 null이면 0을 돌려주세요");
    }

    /** ② 캐시에 담아 둔 잔액. 캐시에 없는 회원이면 0. */
    public long cachedBalance(long memberId) {
        throw new UnsupportedOperationException("J03: PointLookup.cachedBalance — Map.get 결과가 null이면 0을 돌려주세요");
    }

    /** ③ 저장된 엔티티의 id. 저장 전(id가 null)이면 NPE 대신 IllegalStateException으로 원인을 알린다. */
    public long savedIdOf(PointEntry entry) {
        throw new UnsupportedOperationException("J03: PointLookup.savedIdOf — id가 null이면 IllegalStateException을 던지세요");
    }
}
