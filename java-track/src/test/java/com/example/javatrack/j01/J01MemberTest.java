package com.example.javatrack.j01;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/** 주제 과제: 클래스·생성자·필드·접근제어자·record, 값 전달(객체 참조 복사). */
class J01MemberTest {

    @Test
    void 올바른_값으로_만든_회원은_이메일과_닉네임을_돌려준다() {
        Member member = new Member("dev@example.com", "자바초보");

        assertThat(member.getEmail()).isEqualTo("dev@example.com");
        assertThat(member.getNickname()).isEqualTo("자바초보");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"dev.example.com"})
    void 이메일_형식이_아니면_생성자가_거절한다(String email) {
        assertThatThrownBy(() -> new Member(email, "자바초보"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 이메일이_100자를_넘으면_생성자가_거절한다() {
        String email = "a".repeat(89) + "@example.com"; // 101자

        assertThatThrownBy(() -> new Member(email, "자바초보"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "가", "가나다라마바사아자차카타파하가나다라마바사"}) // 0자, 1자, 21자
    void 닉네임이_2자_미만이거나_20자를_넘으면_생성자가_거절한다(String nickname) {
        assertThatThrownBy(() -> new Member("dev@example.com", nickname))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 닉네임_2자와_20자는_받아들인다() {
        Member shortest = new Member("a@example.com", "가나");
        Member longest = new Member("b@example.com", "가".repeat(20));

        assertThat(shortest.getNickname()).hasSize(2);
        assertThat(longest.getNickname()).hasSize(20);
    }

    @Test
    void 인스턴스_필드는_모두_private이고_이메일은_final이다() throws NoSuchFieldException {
        List<Field> instanceFields = Arrays.stream(Member.class.getDeclaredFields())
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .toList();

        assertThat(instanceFields).isNotEmpty()
                .allSatisfy(field -> assertThat(Modifier.isPrivate(field.getModifiers()))
                        .as("%s 필드는 private이어야 한다", field.getName())
                        .isTrue());
        assertThat(Modifier.isFinal(Member.class.getDeclaredField("email").getModifiers()))
                .as("email 필드는 final이어야 한다")
                .isTrue();
    }

    @Test
    void 메서드에_넘긴_회원의_닉네임을_바꾸면_원본도_바뀐다() {
        Member member = new Member("dev@example.com", "자바초보");

        renameInside(member, "스프링입문");

        // 메서드는 참조(주소)를 복사해 받았고, 그 참조가 가리키는 객체는 하나뿐이다
        assertThat(member.getNickname()).isEqualTo("스프링입문");
    }

    @Test
    void 메서드_안에서_매개변수에_새_회원을_대입하면_원본은_그대로다() {
        Member member = new Member("dev@example.com", "자바초보");

        replaceInside(member);

        assertThat(member.getNickname()).isEqualTo("자바초보");
    }

    @Test
    void 잘못된_닉네임으로는_바꿀_수_없고_원래_닉네임이_남는다() {
        Member member = new Member("dev@example.com", "자바초보");

        assertThatThrownBy(() -> member.changeNickname("가"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(member.getNickname()).isEqualTo("자바초보");
    }

    @Test
    void 값이_같은_두_회원은_서로_다른_객체지만_프로필_record는_equals로_같다() {
        Member first = new Member("dev@example.com", "자바초보");
        Member second = new Member("dev@example.com", "자바초보");

        // 일반 클래스는 equals를 만들지 않으면 같은 객체인지(주소)만 비교한다
        assertThat(first).isNotEqualTo(second);
        // record는 모든 필드 값으로 equals·hashCode를 만든다
        assertThat(first.toProfile()).isEqualTo(second.toProfile());
        assertThat(first.toProfile()).isEqualTo(new MemberProfile("dev@example.com", "자바초보"));
    }

    @Test
    void 프로필은_만든_시점의_값을_담아_회원이_바뀌어도_그대로다() {
        Member member = new Member("dev@example.com", "자바초보");
        MemberProfile before = member.toProfile();

        member.changeNickname("스프링입문");

        assertThat(before.nickname()).isEqualTo("자바초보");
        assertThat(member.toProfile().nickname()).isEqualTo("스프링입문");
    }

    // 테스트 안의 도우미: 받은 참조로 객체를 바꾼다
    private static void renameInside(Member member, String newNickname) {
        member.changeNickname(newNickname);
    }

    // 테스트 안의 도우미: 매개변수(복사된 참조)만 새 객체를 가리키게 한다
    private static void replaceInside(Member member) {
        member = new Member("other@example.com", "다른회원");
        member.changeNickname("바뀐닉네임");
    }
}
