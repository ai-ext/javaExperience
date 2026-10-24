package com.example.javatrack.j01;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 회원 목록을 for로 돌며 닉네임이 2~20자인 회원 수 세기(매개변수·return). */
class J01BasicsTest {

    @Test
    void 닉네임이_2자에서_20자인_회원만_센다() {
        List<MemberRow> rows = List.of(
                new MemberRow(1, "가"),               // 1자 — 세지 않음
                new MemberRow(2, "가나"),             // 2자 — 셈
                new MemberRow(3, "가".repeat(20)),   // 20자 — 셈
                new MemberRow(4, "가".repeat(21)),   // 21자 — 세지 않음
                new MemberRow(5, "보통닉네임"));       // 셈

        assertThat(MemberStats.countValidNicknames(rows)).isEqualTo(3);
    }

    @Test
    void 빈_목록이면_0을_돌려준다() {
        assertThat(MemberStats.countValidNicknames(List.of())).isZero();
    }

    @Test
    void 닉네임이_null인_회원은_예외_없이_세지_않는다() {
        List<MemberRow> rows = List.of(new MemberRow(1, null), new MemberRow(2, "자바초보"));

        assertThat(MemberStats.countValidNicknames(rows)).isEqualTo(1);
    }
}
