package com.example.board.config;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.example.board.common.BusinessException;
import com.example.board.member.AuthMember;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtProviderTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    private static BoardProperties props(String secret) {
        return new BoardProperties(new BoardProperties.ForbiddenWords(true), new BoardProperties.Jwt(secret, 3600));
    }

    @Test
    void 발급한_토큰을_파싱하면_id와_role이_나온다() {
        JwtProvider provider = new JwtProvider(props(SECRET));

        AuthMember member = provider.parse(provider.issue(7L, Role.ADMIN));

        assertThat(member).isEqualTo(new AuthMember(7L, Role.ADMIN));
    }

    @Test
    void 만료된_토큰은_거부한다() {
        Clock past = Clock.fixed(Instant.now().minus(Duration.ofHours(2)), ZoneOffset.UTC);
        String expired = new JwtProvider(props(SECRET), past).issue(1L, Role.USER);

        assertThatThrownBy(() -> new JwtProvider(props(SECRET)).parse(expired)).isInstanceOf(BusinessException.class);
    }

    @Test
    void 다른_키로_서명한_토큰은_거부한다() {
        String forged = new JwtProvider(props("ffffffffffffffffffffffffffffffff")).issue(1L, Role.ADMIN);

        assertThatThrownBy(() -> new JwtProvider(props(SECRET)).parse(forged)).isInstanceOf(BusinessException.class);
    }

    @Test
    void 서명_없는_alg_none_토큰은_거부한다() {
        String none = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes())
                + "." + java.util.Base64.getUrlEncoder().withoutPadding()
                        .encodeToString("{\"sub\":\"1\",\"role\":\"ADMIN\"}".getBytes()) + ".";

        assertThatThrownBy(() -> new JwtProvider(props(SECRET)).parse(none)).isInstanceOf(BusinessException.class);
    }
}
