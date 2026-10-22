package com.example.board.post;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.MyBatisQueryCounter;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
}
