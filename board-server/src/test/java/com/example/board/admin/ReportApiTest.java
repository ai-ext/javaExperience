package com.example.board.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReportApiTest extends ApiTestSupport {

    int report(Long postId, Member m, String body) throws Exception {
        return mockMvc.perform(post("/api/posts/{id}/reports", postId).header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus();
    }

    @Test
    void 신고하면_201과_reportId() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Member m = newMember(Role.USER);

        mockMvc.perform(post("/api/posts/{id}/reports", postId).header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"SPAM\",\"detail\":\"광고\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reportId").isNumber());
    }

    @Test
    void 같은_글을_다시_신고하면_409_duplicate() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Member m = newMember(Role.USER);
        report(postId, m, "{\"reason\":\"SPAM\"}");

        mockMvc.perform(post("/api/posts/{id}/reports", postId).header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"ETC\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/duplicate"));
    }

    @Test
    void 같은_회원의_동시_신고는_하나만_201이고_나머지는_409() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Member m = newMember(Role.USER);
        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tasks.add(() -> report(postId, m, "{\"reason\":\"SPAM\"}"));
        }

        List<Integer> statuses = runConcurrently(tasks);

        assertThat(statuses).containsOnly(201, 409);
        assertThat(statuses.stream().filter(s -> s == 201)).hasSize(1);
    }

    @Test
    void reason이_목록에_없거나_없으면_400_errors() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Member m = newMember(Role.USER);

        for (String body : new String[] {"{\"reason\":\"FOO\"}", "{}", "{\"reason\":\"spam\"}"}) {
            mockMvc.perform(post("/api/posts/{id}/reports", postId).header("Authorization", bearer(m))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.type").value("/errors/validation"))
                    .andExpect(jsonPath("$.errors[0].field").value("reason"));
        }
    }

    @Test
    void detail은_300자까지() throws Exception {
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(post("/api/posts/{id}/reports", postId).header("Authorization", bearer(newMember(Role.USER)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"ETC\",\"detail\":\"" + "가".repeat(301) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("detail"));
        assertThat(report(postId, newMember(Role.USER), "{\"reason\":\"ETC\",\"detail\":\"" + "가".repeat(300) + "\"}"))
                .isEqualTo(201);
    }

    @Test
    void 없는_글이나_숨긴_글은_404() throws Exception {
        Long hidden = insertPost(newMember(Role.USER), "숨김", "내용", "HIDDEN");
        Member m = newMember(Role.USER);

        assertThat(report(999_999_999L, m, "{\"reason\":\"SPAM\"}")).isEqualTo(404);
        assertThat(report(hidden, m, "{\"reason\":\"SPAM\"}")).isEqualTo(404);
    }

    @Test
    void 토큰_없으면_401() throws Exception {
        mockMvc.perform(post("/api/posts/1/reports").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"SPAM\"}"))
                .andExpect(status().isUnauthorized());
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
                result.add(f.get(30, TimeUnit.SECONDS));
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }
}
