package com.example.board.post;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.Callable;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;
import com.example.board.RedisContainers;
import com.example.board.TestcontainersConfig;
import com.example.board.config.JwtProvider;
import com.example.board.config.RedisGuard;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

import eu.rekawek.toxiproxy.model.ToxicDirection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Redis 지연·장애가 응답 실패로 번지지 않는지 본다. 두 경우 모두 각 요청이 1초 안에 끝나야 한다.
 * 컨테이너를 멈추면 같은 JVM의 다른 테스트가 깨지므로, 지연은 Toxiproxy 독성으로 넣고 "Redis 없음"은 죽은 포트로 본다.
 * 두 경우는 Redis 주소가 달라 컨텍스트도 따로다.
 */
class PopularPostFallbackTest {

    static final long BUDGET_MILLIS = 1000;

    /** 이 컨텍스트만 Toxiproxy를 거쳐 Redis에 붙는다. 다른 컨텍스트의 연결은 흔들리지 않는다. */
    @Nested
    @SpringBootTest(properties = "test.redis.route=proxy")
    class Redis가_느리면 extends ApiTestSupport {

        @Autowired
        RedisGuard guard;

        @BeforeEach
        void seed() {
            clearPosts();
            Member author = newMember(Role.USER);
            Long id = insertPost(author, "DB에서 온 글", "내용", "ACTIVE");
            jdbc.update("UPDATE post SET like_count = 7 WHERE id = ?", id);
        }

        @AfterEach
        void heal() throws InterruptedException {
            RedisContainers.healProxy();
            guard.reset();
            awaitRedis(redis);
        }

        void slowRedis() throws Exception {
            RedisContainers.proxy().toxics().latency("redis-latency", ToxicDirection.DOWNSTREAM, 3000);
        }

        @Test
        void 지연_3초에도_500ms_타임아웃_뒤_DB_결과로_1초_안에_응답한다() throws Exception {
            slowRedis();

            Timed<ResultActions> r = timed(() -> mockMvc.perform(get("/api/posts/popular")));

            r.value().andExpect(status().isOk())
                    .andExpect(jsonPath("$.items[0].title").value("DB에서 온 글"))
                    .andExpect(jsonPath("$.items[0].likeCount").value(7));
            assertThat(r.millis()).isLessThan(BUDGET_MILLIS);
        }

        @Test
        void 지연_중에도_글_작성_201과_인기글_200이_각각_1초_안이다() throws Exception {
            Member writer = newMember(Role.USER);
            slowRedis();

            Timed<ResultActions> created = timed(() -> createPost(mockMvc, bearer(writer)));
            Timed<ResultActions> popular = timed(() -> mockMvc.perform(get("/api/posts/popular")));

            created.value().andExpect(status().isCreated());
            popular.value().andExpect(status().isOk());
            assertThat(created.millis()).as("POST /api/posts").isLessThan(BUDGET_MILLIS);
            assertThat(popular.millis()).as("GET /api/posts/popular").isLessThan(BUDGET_MILLIS);
        }
    }

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
