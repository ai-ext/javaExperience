package com.example.javatrack.j03;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/** 주제 과제: Role enum과 권한 판정, 불변 객체 AuthMember의 equals/hashCode. */
class J03RoleTest {

    @Test
    void 역할_문자열은_앞뒤_공백과_대소문자를_무시하고_enum으로_바꾼다() {
        Role admin = Role.from(" admin ");
        Role user = Role.from("User");

        // enum 상수는 하나뿐이라 ==로 비교해도 안전하다
        assertThat(admin == Role.ADMIN).isTrue();
        assertThat(user).isSameAs(Role.USER);
        assertThat(admin.label()).isEqualTo("관리자");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "  ", "MANAGER"})
    void 없는_역할이면_허용된_값을_알려_주는_IllegalArgumentException이_난다(String value) {
        assertThatThrownBy(() -> Role.from(value))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("USER")
                .hasMessageContaining("ADMIN");
    }

    @Test
    void valueOf는_null이면_NPE이고_소문자를_모른다_from은_둘_다_받아_준다() {
        // 함정: enum이 자동으로 만들어 주는 valueOf는 이름이 정확히 같아야 한다
        assertThatThrownBy(() -> Role.valueOf("admin")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Role.valueOf(null)).isInstanceOf(NullPointerException.class);

        assertThat(Role.from("admin")).isEqualTo(Role.ADMIN);
        assertThatThrownBy(() -> Role.from(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 작성자_본인이나_관리자만_글을_고칠_수_있다() {
        AuthMember writer = new AuthMember(1, Role.USER);
        AuthMember other = new AuthMember(2, Role.USER);
        AuthMember admin = new AuthMember(3, Role.ADMIN);

        assertThat(writer.canModify(1)).isTrue();
        assertThat(other.canModify(1)).isFalse();
        assertThat(admin.canModify(1)).isTrue();
    }

    @Test
    void 역할을_바꾸면_새_객체가_생기고_원래_객체는_그대로다() {
        AuthMember user = new AuthMember(1, Role.USER);

        AuthMember promoted = user.withRole(Role.ADMIN);

        assertThat(promoted).isNotSameAs(user);
        assertThat(promoted.id()).isEqualTo(1);
        assertThat(promoted.role()).isEqualTo(Role.ADMIN);
        assertThat(user.role()).isEqualTo(Role.USER);
    }

    @Test
    void AuthMember는_final_클래스이고_필드가_모두_private_final이다() {
        AuthMember member = new AuthMember(1, Role.USER);
        assertThat(member.withRole(Role.USER)).isEqualTo(member);

        assertThat(Modifier.isFinal(AuthMember.class.getModifiers())).isTrue();
        assertThat(Arrays.stream(AuthMember.class.getDeclaredFields()).map(Field::getModifiers))
                .allSatisfy(modifiers -> assertThat(Modifier.isPrivate(modifiers) && Modifier.isFinal(modifiers)).isTrue());
    }

    @Test
    void id와_역할이_같으면_equals가_true이고_hashCode도_같다() {
        AuthMember first = new AuthMember(1, Role.USER);
        AuthMember second = new AuthMember(1, Role.USER);

        assertThat(first).isNotSameAs(second);
        assertThat(first).isEqualTo(second);
        assertThat(first.hashCode()).isEqualTo(second.hashCode());
        assertThat(first).isNotEqualTo(new AuthMember(1, Role.ADMIN));
        assertThat(first).isNotEqualTo(new AuthMember(2, Role.USER));
    }

    @Test
    void 함정_hashCode를_빠뜨리면_HashSet이_같은_회원을_못_찾는다() {
        Set<LeakyAuthMember> leakySet = new HashSet<>();
        leakySet.add(new LeakyAuthMember(1, Role.USER));
        // equals는 true인데, HashSet은 hashCode로 칸을 먼저 고르므로 다른 칸을 뒤져 못 찾는다
        assertThat(new LeakyAuthMember(1, Role.USER)).isEqualTo(new LeakyAuthMember(1, Role.USER));
        assertThat(leakySet.contains(new LeakyAuthMember(1, Role.USER))).isFalse();

        Set<AuthMember> set = new HashSet<>();
        set.add(new AuthMember(1, Role.USER));
        set.add(new AuthMember(1, Role.USER));

        assertThat(set).hasSize(1);
        assertThat(set.contains(new AuthMember(1, Role.USER))).isTrue();
    }
}
