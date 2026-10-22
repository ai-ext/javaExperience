package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
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

/**
 * E01 확인 테스트(D14-5 고도화): 인기글 캐시가 빈 순간(TTL 만료·무효화 직후) 동시 요청 100개가 와도
 * DB 목록 쿼리(findPopular)는 1번이고, 모든 응답은 평소 응답과 같은 모양이다.
 */
class E01ConfirmTest extends ApiTestSupport {

    static final int REQUESTS = 100;

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    MyBatisQueryCounter queries;

    record Response(int status, String body) {
    }

    @BeforeEach
    void seed() {
        clearPosts();
        Member author = newMember(Role.USER);
        for (int i = 1; i <= 25; i++) {
            Long id = insertPost(author, "글" + i, "내용", "ACTIVE");
            jdbc.update("UPDATE post SET like_count = ? WHERE id = ?", i, id);
            if (i % 3 == 0) {
                attachTag(id, "태그" + i);
            }
        }
        queries = MyBatisQueryCounter.attach(sqlSessionFactory);
        queries.clear();
    }

    Response popular() throws Exception {
        var res = mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse();
        return new Response(res.getStatus(), res.getContentAsString());
    }

    @Test
    void 캐시가_빈_순간_동시_100요청에도_DB_목록_쿼리는_1번이고_응답은_평소와_같다() throws Exception {
        assertThat(redis.hasKey("popular:posts")).as("캐시가 비어 있는 채로 시작").isFalse();

        List<Response> responses = runConcurrently();

        assertThat(responses).extracting(Response::status).containsOnly(200);
        assertThat(queries.count("findPopular")).as("동시 %d요청의 DB 목록 쿼리 수", REQUESTS).isEqualTo(1);

        // 응답 형식: 캐시에서 나온 응답(동시 요청들)과 DB에서 바로 읽은 응답이 같다
        redis.delete("popular:posts");
        Response fromDb = popular();
        assertThat(fromDb.status()).isEqualTo(200);
        assertThat(responses).extracting(Response::body).containsOnly(fromDb.body());
        assertThat(fromDb.body()).contains("\"title\":\"글25\"").contains("\"nextCursor\":null");
    }

    private List<Response> runConcurrently() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(REQUESTS);
        CountDownLatch ready = new CountDownLatch(REQUESTS);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Response>> futures = new ArrayList<>();
            for (int i = 0; i < REQUESTS; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        return popular();
                    } catch (Exception e) {
                        return new Response(-1, e.toString());
                    }
                }));
            }
            ready.await(10, TimeUnit.SECONDS);
            start.countDown();
            List<Response> result = new ArrayList<>();
            for (Future<Response> f : futures) {
                try {
                    result.add(f.get(30, TimeUnit.SECONDS));
                } catch (Exception e) {
                    result.add(new Response(-2, e.toString()));
                }
            }
            return result;
        } finally {
            pool.shutdown();
            pool.awaitTermination(30, TimeUnit.SECONDS);
        }
    }
}
