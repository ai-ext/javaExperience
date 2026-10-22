package com.example.javatrack.j14;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: null이 섞인 회원 목록에서 null을 거르고 닉네임을 정렬해 String.join으로 잇기. */
class J14BasicsTest {

    @Test
    void null인_회원과_닉네임을_거르고_정렬해_쉼표로_잇는다() {
        // List.of는 null 원소를 받지 않는다(NPE). null이 섞인 목록은 Arrays.asList로 만든다
        List<Member> members = Arrays.asList(
                new Member(1L, "c@example.com", "다람쥐"),
                null,
                new Member(2L, "a@example.com", "가람"),
                new Member(3L, "x@example.com", null),
                new Member(4L, "b@example.com", "나비"));

        assertThat(MemberNames.joinNicknames(members)).isEqualTo("가람, 나비, 다람쥐");
    }

    @Test
    void 빈_목록이면_빈_문자열이다() {
        assertThat(MemberNames.joinNicknames(List.of())).isEmpty();
    }

    @Test
    void 모두_걸러지면_빈_문자열이다() {
        List<Member> members = Arrays.asList(null, new Member(1L, "x@example.com", null));

        assertThat(MemberNames.joinNicknames(members)).isEmpty();
    }

    @Test
    void 한_명이면_쉼표_없이_닉네임만이다() {
        assertThat(MemberNames.joinNicknames(List.of(new Member(1L, "a@example.com", "가람")))).isEqualTo("가람");
    }
}
