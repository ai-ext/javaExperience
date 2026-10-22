package com.example.javatrack.j07;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

/** 실무 습관: Map 함정 — toMap 중복 키 예외, HashMap은 순서를 보장하지 않는다. */
class J07HabitTest {

    private static final List<MemberRow> ROWS = List.of(
            new MemberRow(3, "자바초보"),
            new MemberRow(1, "스프링입문"),
            new MemberRow(5, "자바초보"),  // 같은 닉네임이 또 나온다
            new MemberRow(2, "운영자"));

    @Test
    void 함정_toMap은_같은_키가_두_번_나오면_IllegalStateException이다() {
        assertThatThrownBy(() -> ROWS.stream().collect(Collectors.toMap(MemberRow::nickname, MemberRow::id)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("자바초보");

        Map<String, Long> ids = NicknameIndex.firstIdByNickname(ROWS);

        assertThat(ids).hasSize(3);
    }

    @Test
    void 같은_닉네임이면_먼저_나온_회원의_id를_남긴다() {
        Map<String, Long> ids = NicknameIndex.firstIdByNickname(ROWS);

        assertThat(ids).containsEntry("자바초보", 3L);
    }

    @Test
    void 결과를_돌면_닉네임이_처음_나온_순서대로_나온다() {
        Map<String, Long> ids = NicknameIndex.firstIdByNickname(ROWS);

        // toMap의 기본 Map(HashMap)은 순서를 약속하지 않는다. 넣은 순서가 필요하면 그런 Map을 직접 고른다
        assertThat(ids.keySet()).containsExactly("자바초보", "스프링입문", "운영자");
    }

    @Test
    void id_오름차순으로_도는_Map을_돌려준다() {
        Map<Long, Long> balances = new HashMap<>();
        balances.put(30L, 300L);
        balances.put(2L, 20L);
        balances.put(100L, 1_000L);
        balances.put(7L, 70L);

        Map<Long, Long> sorted = NicknameIndex.sortedById(balances);

        assertThat(sorted.keySet()).containsExactly(2L, 7L, 30L, 100L);
        assertThat(sorted).containsEntry(100L, 1_000L);
    }
}
