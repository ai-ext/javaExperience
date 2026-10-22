package com.example.javatrack.j03;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: 오토박싱·언박싱 NPE(Long → long)가 나는 세 자리 — SUM null, Map.get null, 저장 전 id null. */
class J03TypeCutTest {

    private final PointSumMapper mapper = new PointSumMapper(Map.of(1L, 150L));
    private final Map<Long, Long> cache = new HashMap<>(Map.of(1L, 300L));
    private final PointLookup lookup = new PointLookup(mapper, cache);

    @Test
    void 함정1_이력이_없는_회원의_합계를_long으로_받으면_NPE다() {
        long total = lookup.totalPoints(99);

        // MyBatis resultType="long"이나 JPA의 Long 반환을 long 변수로 받는 것과 같다
        assertThatThrownBy(() -> {
            long sum = mapper.sumByMember(99);
        }).isInstanceOf(NullPointerException.class);
        assertThat(total).isZero();
    }

    @Test
    void 함정2_캐시에_없는_회원을_long으로_꺼내면_NPE다() {
        long balance = lookup.cachedBalance(99);

        assertThatThrownBy(() -> {
            long cached = cache.get(99L);
        }).isInstanceOf(NullPointerException.class);
        assertThat(balance).isZero();
    }

    @Test
    void 함정3_저장_전_엔티티의_id를_long으로_받으면_NPE다_원인을_알리는_예외로_바꾼다() {
        PointEntry entry = new PointEntry(1, 100);

        assertThatThrownBy(() -> {
            long id = entry.getId();
        }).isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> lookup.savedIdOf(entry))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("저장 전");
    }

    @Test
    void 값이_있으면_그대로_돌려준다() {
        PointEntry saved = new PointEntry(1, 100);
        saved.assignId(7L);

        assertThat(lookup.totalPoints(1)).isEqualTo(150);
        assertThat(lookup.cachedBalance(1)).isEqualTo(300);
        assertThat(lookup.savedIdOf(saved)).isEqualTo(7);
    }
}
