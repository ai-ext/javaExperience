package com.example.board.post;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.Callable;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.TestcontainersConfig;
import com.example.board.config.JwtProvider;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Redis가 없어도 캐시만 빠진 채 동작하는지 본다. 각 요청이 1초 안에 끝나야 한다.
 * 컨테이너를 멈추면 같은 JVM의 다른 테스트가 깨지므로 "Redis 없음"은 아무도 안 듣는 포트로 본다.
 */
class PopularPostFallbackTest {

    static final long BUDGET_MILLIS = 1000;

    /** Review Focus 4: Redis가 아예 없는(연결 거부) 상태로 기동해도 캐시만 빠진 채 동작한다. */
    @Nested
    @SpringBootTest(properties = "test.redis.route=dead")
    @Import(TestcontainersConfig.class)
    @ActiveProfiles("test")
    @AutoConfigureMockMvc
    class Redis가_없는_상태로_기동하면 {

        @Autowired
        MockMvc mockMvc;

        @Autowired
        MemberRepository memberRepository;

        @Autowired
        JwtProvider jwtProvider;

        @Autowired
        PasswordEncoder passwordEncoder;

        @Test
        void 컨텍스트가_뜨고_글_작성_201과_인기글_200이_각각_1초_안이다() throws Exception {
            Member m = memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", "hash",
                    "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
            String token = "Bearer " + jwtProvider.issue(m.getId(), m.getRole());

            Timed<ResultActions> created = timed(() -> createPost(mockMvc, token));
            Timed<ResultActions> popular = timed(() -> mockMvc.perform(get("/api/posts/popular")));

            created.value().andExpect(status().isCreated());
            popular.value().andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray());
            assertThat(created.millis()).as("POST /api/posts").isLessThan(BUDGET_MILLIS);
            assertThat(popular.millis()).as("GET /api/posts/popular").isLessThan(BUDGET_MILLIS);
        }

        // 로그인 제한은 fail-open이다. Redis 장애가 모든 회원의 로그인 장애가 되지 않게 한다.
        @Test
        void 로그인은_시도_제한_없이_동작한다() throws Exception {
            String email = "f" + UUID.randomUUID().toString().substring(0, 8) + "@t.com";
            memberRepository.saveAndFlush(Member.create(email, passwordEncoder.encode("password1"),
                    "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
            String wrong = "{\"email\":\"%s\",\"password\":\"wrongpass1\"}".formatted(email);
            for (int i = 0; i < 6; i++) {
                mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(wrong))
                        .andExpect(status().isUnauthorized());
            }

            mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"%s\",\"password\":\"password1\"}".formatted(email)))
                    .andExpect(status().isOk());
        }

        @Test
        void 헬스는_Redis와_상관없이_UP이다() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        }
    }

    static ResultActions createPost(MockMvc mockMvc, String token) throws Exception {
        return mockMvc.perform(post("/api/posts").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목\",\"content\":\"내용\"}"));
    }

    record Timed<T>(T value, long millis) {
    }

    static <T> Timed<T> timed(Callable<T> call) throws Exception {
        long start = System.nanoTime();
        T value = call.call();
        return new Timed<>(value, Duration.ofNanos(System.nanoTime() - start).toMillis());
    }
}
