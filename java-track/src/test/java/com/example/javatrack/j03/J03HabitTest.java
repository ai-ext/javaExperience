package com.example.javatrack.j03;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** 실무 습관: null 다루는 습관 — Objects.requireNonNull, Objects.equals, 컬렉션은 null 대신 빈 리스트. */
class J03HabitTest {

    private static final List<MemberRow> ROWS = List.of(
            new MemberRow(1, "자바초보", Role.USER),
            new MemberRow(2, null, Role.USER)); // 닉네임 규칙 전의 옛 데이터

    @Test
    void 없는_역할을_찾으면_null이_아니라_빈_리스트를_돌려준다() {
        // 함정: null을 돌려주면 호출하는 쪽의 for가 NPE로 터진다
        List<String> leakyAdmins = new LeakyMemberDirectory(ROWS).nicknamesOf(Role.ADMIN);
        assertThatThrownBy(() -> {
            for (String nickname : leakyAdmins) {
                nickname.length();
            }
        }).isInstanceOf(NullPointerException.class);

        List<String> admins = new MemberDirectory(ROWS).nicknamesOf(Role.ADMIN);
        List<String> visited = new ArrayList<>();
        for (String nickname : admins) {
            visited.add(nickname);
        }

        assertThat(admins).isNotNull().isEmpty();
        assertThat(visited).isEmpty();
    }

    @Test
    void 닉네임이_null인_회원도_Objects_equals로_비교하면_NPE가_없다() {
        LeakyMemberDirectory leaky = new LeakyMemberDirectory(ROWS);
        assertThatThrownBy(() -> leaky.hasNickname(2, "자바초보")).isInstanceOf(NullPointerException.class);

        MemberDirectory directory = new MemberDirectory(ROWS);

        assertThat(directory.hasNickname(2, "자바초보")).isFalse();
        assertThat(directory.hasNickname(2, null)).isTrue();
        assertThat(directory.hasNickname(1, "자바초보")).isTrue();
    }

    @Test
    void 생성자에_null_목록을_넘기면_만들_때_바로_어느_인자인지_알려_준다() {
        assertThatThrownBy(() -> new MemberDirectory(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessage("rows");
    }

    @Test
    void AuthMember에_역할_null을_넘기면_권한_판정이_아니라_만들_때_터진다() {
        assertThatThrownBy(() -> new AuthMember(1, null))
                .isInstanceOf(NullPointerException.class)
                .hasMessage("role");
    }

    @Test
    void 받은_목록을_밖에서_바꿔도_디렉터리는_그대로다() {
        List<MemberRow> source = new ArrayList<>(ROWS);
        MemberDirectory directory = new MemberDirectory(source);

        source.add(new MemberRow(3, "운영자", Role.ADMIN));

        assertThat(directory.nicknamesOf(Role.ADMIN)).isEmpty();
    }
}
