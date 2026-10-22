package com.example.javatrack.j03;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/** 기본기 반복: 역할별 회원 수 세기, 공백만 있는 닉네임을 isBlank로 거절하기. */
class J03BasicsTest {

    @Test
    void 역할별_회원_수를_센다() {
        List<MemberRow> rows = List.of(
                new MemberRow(1, "자바초보", Role.USER),
                new MemberRow(2, "운영자", Role.ADMIN),
                new MemberRow(3, "스프링입문", Role.USER));

        Map<Role, Integer> counts = MemberBasics.countByRole(rows);

        assertThat(counts).containsEntry(Role.USER, 2).containsEntry(Role.ADMIN, 1);
    }

    @Test
    void 한_명도_없는_역할은_0으로_센다() {
        Map<Role, Integer> counts = MemberBasics.countByRole(List.of(new MemberRow(1, "자바초보", Role.USER)));

        assertThat(counts).containsEntry(Role.ADMIN, 0).hasSize(Role.values().length);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   ", "\t", "　"})
    void 공백만_있는_닉네임은_isBlank로_거절한다(String nickname) {
        assertThatThrownBy(() -> MemberBasics.requireNickname(nickname))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 통과한_닉네임은_앞뒤_공백을_지워_돌려준다() {
        // isEmpty는 길이 0만 비었다고 본다. 공백 세 칸은 isEmpty가 false다
        assertThat("   ".isEmpty()).isFalse();

        assertThat(MemberBasics.requireNickname("  자바초보　")).isEqualTo("자바초보");
    }
}
