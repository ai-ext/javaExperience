package com.example.board.post;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.MyBatisQueryCounter;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PopularPostCacheTest extends ApiTestSupport {

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    MyBatisQueryCounter queries;
    Member author;

    @BeforeEach
    void setUp() {
        clearPosts();
        author = newMember(Role.USER);
        queries = MyBatisQueryCounter.attach(sqlSessionFactory);
        queries.clear();
    }

    Long postWithLikes(String title, int likes) {
        Long id = insertPost(author, title, "내용", "ACTIVE");
        jdbc.update("UPDATE post SET like_count = ? WHERE id = ?", likes, id);
        return id;
    }

    @Test
    void 인기글은_200이고_좋아요_내림차순_상위_20개다() throws Exception {
        for (int i = 1; i <= 25; i++) {
            postWithLikes("글" + i, i);
        }
        insertPost(author, "삭제된 글", "내용", "DELETED");
        jdbc.update("UPDATE post SET like_count = 999 WHERE title = '삭제된 글'");

        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(20))
                .andExpect(jsonPath("$.items[0].title").value("글25"))
                .andExpect(jsonPath("$.items[0].likeCount").value(25))
                .andExpect(jsonPath("$.items[0].authorNickname").value(author.getNickname()))
                .andExpect(jsonPath("$.items[0].createdAt").isString())
                .andExpect(jsonPath("$.items[19].title").value("글6"))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void 경로_popular가_글_상세_postId에_먹히지_않는다() throws Exception {
        mockMvc.perform(get("/api/posts/popular")).andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void 두_번째_조회는_DB_목록_쿼리_없이_캐시에서_나온다() throws Exception {
        postWithLikes("첫 글", 3);
        String first = mockMvc.perform(get("/api/posts/popular")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(queries.count("findPopular")).isEqualTo(1);
        // 캐시에서 되읽은 값도 DB에서 바로 읽은 응답과 같은 모양(시각 오프셋 포함)이다
        assertThat(mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse().getContentAsString())
                .isEqualTo(first);

        // 캐시가 있는 동안 DB가 바뀌어도 캐시 값이 나온다 = DB를 읽지 않았다
        postWithLikes("나중 글", 100);
        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("첫 글"));
        assertThat(queries.count("findPopular")).isEqualTo(1);
    }

    @Test
    void 캐시_키_TTL은_60초_이하다() throws Exception {
        mockMvc.perform(get("/api/posts/popular")).andExpect(status().isOk());

        Long ttl = redis.getExpire("popular:posts", TimeUnit.SECONDS);
        assertThat(ttl).isBetween(1L, 60L);
    }

    @Test
    void size는_1에서_50이고_앞에서_자른다() throws Exception {
        for (int i = 1; i <= 5; i++) {
            postWithLikes("글" + i, i);
        }
        mockMvc.perform(get("/api/posts/popular").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].title").value("글5"));
        mockMvc.perform(get("/api/posts/popular").param("size", "51"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        mockMvc.perform(get("/api/posts/popular").param("size", "0")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/posts/popular").param("cursor", "!!!")).andExpect(status().isBadRequest());
    }

    // 명세 2절·5-3: 인기글도 커서 목록이다. 상위 20개 안에서 작은 size로 끝까지 넘길 수 있어야 한다.
    @Test
    void size_1로_커서를_따라가면_상위_목록을_중복_누락_없이_끝까지_읽는다() throws Exception {
        List<Long> expected = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            expected.add(0, postWithLikes("글" + i, i)); // 좋아요 내림차순 = 나중에 넣은 글이 앞
        }

        assertThat(walk(1)).containsExactlyElementsOf(expected);
    }

    @Test
    void 상위_20개를_size_7로_넘기면_7_7_6건이고_마지막_쪽의_nextCursor는_null이다() throws Exception {
        List<Long> expected = new ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            expected.add(0, postWithLikes("글" + i, i));
        }

        List<Integer> sizes = new ArrayList<>();
        List<Long> ids = walk(7, sizes);

        assertThat(sizes).containsExactly(7, 7, 6);
        assertThat(ids).containsExactlyElementsOf(expected.subList(0, 20));
    }

    @Test
    void 목록_끝을_넘는_커서는_빈_목록과_null이다() throws Exception {
        postWithLikes("글", 1);

        mockMvc.perform(get("/api/posts/popular").param("cursor", com.example.board.common.CursorPage.encode(100)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    private List<Long> walk(int size) throws Exception {
        return walk(size, new ArrayList<>());
    }

    /** nextCursor가 null이 될 때까지 따라가며 id를 모은다. 쪽마다 받은 개수를 sizes에 남긴다. */
    private List<Long> walk(int size, List<Integer> sizes) throws Exception {
        List<Long> ids = new ArrayList<>();
        String cursor = null;
        for (int page = 0; page < 30; page++) {
            var request = get("/api/posts/popular").param("size", String.valueOf(size));
            if (cursor != null) {
                request.param("cursor", cursor);
            }
            String body = mockMvc.perform(request).andExpect(status().isOk()).andReturn().getResponse()
                    .getContentAsString();
            List<Number> pageIds = com.jayway.jsonpath.JsonPath.read(body, "$.items[*].id");
            sizes.add(pageIds.size());
            pageIds.forEach(n -> ids.add(n.longValue()));
            cursor = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");
            if (cursor == null) {
                return ids;
            }
        }
        throw new AssertionError("nextCursor가 끝나지 않는다: " + ids);
    }

    @Test
    void 글을_삭제해_커밋하면_바로_다음_인기글_조회에_그_글이_없다() throws Exception {
        Long gone = postWithLikes("지울 글", 50);
        postWithLikes("남을 글", 1);
        mockMvc.perform(get("/api/posts/popular")).andExpect(jsonPath("$.items[0].id").value(gone));

        mockMvc.perform(delete("/api/posts/{id}", gone).header("Authorization", bearer(author)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("남을 글"));
    }

    @Test
    void 글을_고쳐_커밋하면_인기글에_새_제목이_나온다() throws Exception {
        Long id = postWithLikes("옛 제목", 5);
        mockMvc.perform(get("/api/posts/popular")).andExpect(jsonPath("$.items[0].title").value("옛 제목"));

        mockMvc.perform(patch("/api/posts/{id}", id).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"새 제목\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/popular")).andExpect(jsonPath("$.items[0].title").value("새 제목"));
    }

    // 함정: 무효화를 커밋 뒤에 해도, DB를 먼저 읽은 적재 요청이 삭제·무효화 뒤에 옛 목록을 저장하면 TTL 동안 다시 보인다.
    // 순서를 latch로 고정한다: A가 DB 조회 → 글 삭제 커밋·캐시 삭제 → A가 캐시 저장.
    @Test
    void 적재_도중_글이_삭제되면_옛_목록을_캐시에_다시_쓰지_않는다() throws Exception {
        Long gone = postWithLikes("지울 글", 50);
        postWithLikes("남을 글", 1);
        PauseAfterQuery pause = PauseAfterQuery.attach(sqlSessionFactory);
        pause.arm("findPopular");
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            Future<Integer> loading = pool.submit(
                    () -> mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse().getStatus());
            assertThat(pause.awaitPaused()).as("A가 DB 조회 뒤 멈춤").isTrue();

            mockMvc.perform(delete("/api/posts/{id}", gone).header("Authorization", bearer(author)))
                    .andExpect(status().isNoContent());
            pause.release();
            assertThat(loading.get(10, TimeUnit.SECONDS)).isEqualTo(200);
        } finally {
            pause.release();
            pool.shutdownNow();
        }

        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("남을 글"));
    }

    // 함정: TTL이 끝난 순간 동시 요청이 모두 DB로 몰리는 스탬피드
    @Test
    void 캐시가_빈_순간_동시_요청_20개가_와도_DB_조회는_1번이다() throws Exception {
        postWithLikes("글", 1);
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            tasks.add(() -> mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse().getStatus());
        }

        List<Integer> statuses = runConcurrently(tasks);

        assertThat(statuses).containsOnly(200);
        assertThat(queries.count("findPopular")).isEqualTo(1);
    }

    private static List<Integer> runConcurrently(List<Callable<Integer>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (Callable<Integer> t : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return t.call();
                }));
            }
            start.countDown();
            List<Integer> result = new ArrayList<>();
            for (Future<Integer> f : futures) {
                result.add(f.get(10, TimeUnit.SECONDS));
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }

    /**
     * 지정한 매퍼 메서드의 DB 조회가 끝난 직후 한 번 멈춘다(결과를 받은 뒤, 호출자에게 돌려주기 전).
     * 빈으로 등록하면 컨텍스트가 하나 더 뜨므로 MyBatisQueryCounter처럼 이미 뜬 SqlSessionFactory에 붙인다.
     */
    @Intercepts(@Signature(type = Executor.class, method = "query",
            args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}))
    static final class PauseAfterQuery implements Interceptor {

        private final AtomicBoolean armed = new AtomicBoolean();
        private volatile String method;
        private volatile CountDownLatch paused = new CountDownLatch(1);
        private volatile CountDownLatch released = new CountDownLatch(1);

        static synchronized PauseAfterQuery attach(SqlSessionFactory factory) {
            for (Interceptor i : factory.getConfiguration().getInterceptors()) {
                if (i instanceof PauseAfterQuery p) {
                    return p;
                }
            }
            PauseAfterQuery p = new PauseAfterQuery();
            factory.getConfiguration().addInterceptor(p);
            return p;
        }

        void arm(String methodName) {
            method = methodName;
            paused = new CountDownLatch(1);
            released = new CountDownLatch(1);
            armed.set(true);
        }

        boolean awaitPaused() throws InterruptedException {
            return paused.await(10, TimeUnit.SECONDS);
        }

        void release() {
            armed.set(false);
            released.countDown();
        }

        @Override
        public Object intercept(Invocation invocation) throws Throwable {
            Object result = invocation.proceed();
            MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
            if (ms.getId().endsWith("." + method) && armed.compareAndSet(true, false)) {
                paused.countDown();
                released.await(10, TimeUnit.SECONDS);
            }
            return result;
        }
    }
}
