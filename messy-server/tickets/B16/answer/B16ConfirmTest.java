package com.example.board.tickets;

import java.time.Duration;
import java.util.concurrent.Callable;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import com.example.board.ApiTestSupport;
import com.example.board.RedisContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import eu.rekawek.toxiproxy.model.ToxicDirection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B16 확인: Redis 장애(응답 지연과 연결 끊김을 따로 본다) 중에도 글쓰기 201과 인기글 200이 각각 1초 안에 끝난다.
 * 컨텍스트마다 Toxiproxy를 거쳐 Redis에 붙고, 장애를 넣기 전에 정상 상태로 한 번씩 불러 기동·연결 비용을 측정에서 뺀다.
 * 시나리오마다 컨텍스트를 따로 둬서 앞 시나리오가 남긴 폴백 상태(건너뛰기 등)가 다음 측정에 섞이지 않게 한다.
 */
class B16ConfirmTest {

    static final long BUDGET_MILLIS = 1000;

    /** 장애를 넣기 전에 정상 상태로 한 번씩 불러 두고, 장애 중 글쓰기와 인기글을 각각 잰다. */
    abstract static class RedisFaultScenario extends ApiTestSupport {

        abstract void injectFault() throws Exception;

        @AfterEach
        void heal() throws InterruptedException {
            RedisContainers.healProxy();
            awaitRedis(redis);
        }

        @Test
        void 장애_중에도_글쓰기_201과_인기글_200이_각각_1초_안이다() throws Exception {
            Member writer = newMember(Role.USER);
            assertThat(createPost(writer).getStatus()).isEqualTo(201);
            assertThat(popular().getStatus()).isEqualTo(200);

            injectFault();
            Timed created = timed(() -> createPost(writer));
            Timed popular = timed(this::popular);

            assertThat(created.response().getStatus()).as("POST /api/posts").isEqualTo(201);
            assertThat(popular.response().getStatus()).as("GET /api/posts/popular").isEqualTo(200);
            assertThat(created.millis()).as("POST /api/posts 걸린 시간(ms)").isLessThan(BUDGET_MILLIS);
            assertThat(popular.millis()).as("GET /api/posts/popular 걸린 시간(ms)").isLessThan(BUDGET_MILLIS);
        }

        MockHttpServletResponse createPost(Member writer) throws Exception {
            return mockMvc.perform(post("/api/posts").header("Authorization", bearer(writer))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"점검 중 글\",\"content\":\"내용\"}"))
                    .andReturn().getResponse();
        }

        MockHttpServletResponse popular() throws Exception {
            return mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse();
        }
    }

    /** Redis 점검(BGSAVE·장애 조치 등)으로 응답이 3초씩 늦는 상황. */
    @Nested
    @SpringBootTest(properties = {"test.redis.route=proxy", "test.ticket=B16-latency"})
    class Redis_응답이_3초씩_늦으면 extends RedisFaultScenario {

        @Override
        void injectFault() throws Exception {
            RedisContainers.proxy().toxics().latency("b16-latency", ToxicDirection.DOWNSTREAM, 3000);
        }
    }

    /** Redis 재시작·네트워크 단절로 연결이 끊긴 상황. */
    @Nested
    @SpringBootTest(properties = {"test.redis.route=proxy", "test.ticket=B16-down"})
    class Redis_연결이_끊기면 extends RedisFaultScenario {

        @Override
        void injectFault() throws Exception {
            RedisContainers.proxy().disable();
        }
    }

    record Timed(MockHttpServletResponse response, long millis) {
    }

    static Timed timed(Callable<MockHttpServletResponse> call) throws Exception {
        long start = System.nanoTime();
        MockHttpServletResponse response = call.call();
        return new Timed(response, Duration.ofNanos(System.nanoTime() - start).toMillis());
    }

    /** 프록시를 다시 만들면 Lettuce가 뒤에서 재연결한다. 다음 테스트 전에 명령이 다시 통할 때까지 기다린다. */
    static void awaitRedis(StringRedisTemplate redis) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
        while (true) {
            try {
                redis.hasKey("ping");
                return;
            } catch (RuntimeException e) {
                if (System.nanoTime() > deadline) {
                    throw e;
                }
                Thread.sleep(20);
            }
        }
    }
}
