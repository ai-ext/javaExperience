package com.example.board.member;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LoginAttemptLimiterTest extends ApiTestSupport {

    String email;

    @BeforeEach
    void signup() throws Exception {
        email = "u" + UUID.randomUUID().toString().substring(0, 8) + "@t.com";
        String nick = "n" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"password1\",\"nickname\":\"%s\"}".formatted(email, nick)))
                .andExpect(status().isCreated());
    }

    ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)));
    }

    void failTimes(String email, int n) throws Exception {
        for (int i = 0; i < n; i++) {
            login(email, "wrongpass1").andExpect(status().isUnauthorized());
        }
    }

    @Test
    void 틀린_비밀번호_5회_뒤_6번째는_맞는_비밀번호여도_429다() throws Exception {
        failTimes(email, 5);

        login(email, "password1")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.type").value("/errors/too-many-attempts"));
    }

    // 함정: 시도 횟수를 서버 메모리에 두면 인스턴스마다 따로 센다. 카운터는 Redis 키에 있어야 한다.
    @Test
    void 실패_횟수는_Redis_키에_10분_TTL로_쌓인다() throws Exception {
        failTimes(email, 2);

        String key = "login:fail:" + email;
        assertThat(redis.opsForValue().get(key)).isEqualTo("2");
        assertThat(redis.getExpire(key, TimeUnit.SECONDS)).isBetween(590L, 600L);
    }

    @Test
    void 다른_서버가_센_실패도_같이_센다() throws Exception {
        // 다른 인스턴스가 이미 5번 실패를 기록해 둔 상태
        redis.opsForValue().set("login:fail:" + email, "5", 10, TimeUnit.MINUTES);

        login(email, "password1").andExpect(status().isTooManyRequests());
    }

    @Test
    void 성공하면_카운터가_초기화된다() throws Exception {
        failTimes(email, 4);

        login(email, "password1").andExpect(status().isOk());

        assertThat(redis.hasKey("login:fail:" + email)).isFalse();
        failTimes(email, 4);
        login(email, "password1").andExpect(status().isOk());
    }

    @Test
    void 키_TTL이_지나면_다시_시도할_수_있다() throws Exception {
        failTimes(email, 5);
        login(email, "password1").andExpect(status().isTooManyRequests());

        // 10분을 기다리는 대신 남은 TTL을 1초로 줄여 만료를 일으킨다
        redis.expire("login:fail:" + email, 1, TimeUnit.SECONDS);
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (Boolean.TRUE.equals(redis.hasKey("login:fail:" + email)) && System.nanoTime() < deadline) {
            Thread.sleep(50);
        }

        login(email, "password1").andExpect(status().isOk());
    }

    @Test
    void 이메일_대소문자를_바꿔도_같은_계정으로_센다() throws Exception {
        failTimes(email, 3);
        failTimes(email.toUpperCase(), 2);

        login(email, "password1").andExpect(status().isTooManyRequests());
    }

    @Test
    void 없는_이메일도_같은_규칙으로_센다() throws Exception {
        String unknown = "nobody" + UUID.randomUUID().toString().substring(0, 8) + "@t.com";
        failTimes(unknown, 5);

        login(unknown, "password1").andExpect(status().isTooManyRequests());
    }
}
