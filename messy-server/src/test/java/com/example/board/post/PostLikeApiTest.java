package com.example.board.post;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostLikeApiTest extends ApiTestSupport {

    int likeCount(Long postId) {
        return jdbc.queryForObject("SELECT like_count FROM post WHERE id = ?", Integer.class, postId);
    }

    int likeRows(Long postId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM post_like WHERE post_id = ?", Integer.class, postId);
    }

    int putStatus(Long postId, Member m) throws Exception {
        return mockMvc.perform(put("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andReturn().getResponse().getStatus();
    }

    @Test
    void PUT은_204이고_다시_PUT도_204에_like_count는_1() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(put("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andExpect(status().isNoContent());
        // 같은 트랜잭션에서 UNIQUE 위반을 잡으면 rollback-only로 500이 난다
        mockMvc.perform(put("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andExpect(status().isNoContent());

        assertThat(likeCount(postId)).isEqualTo(1);
        assertThat(likeRows(postId)).isEqualTo(1);
    }

    @Test
    void DELETE는_204이고_다시_DELETE도_204에_count는_0_아래로_내려가지_않는다() throws Exception {
        Member m = newMember(Role.USER);
        Member other = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));
        putStatus(postId, m);
        putStatus(postId, other);

        mockMvc.perform(delete("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andExpect(status().isNoContent());

        assertThat(likeCount(postId)).isEqualTo(1);
        assertThat(likeRows(postId)).isEqualTo(1);
    }

    @Test
    void 안_눌렀던_글_DELETE도_204이고_count는_그대로() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        mockMvc.perform(delete("/api/posts/{id}/like", postId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isNoContent());
        assertThat(likeCount(postId)).isZero();
    }

    @Test
    void 없는_글과_삭제된_글은_404() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(m);
        jdbc.update("UPDATE post SET status = 'DELETED' WHERE id = ?", postId);

        mockMvc.perform(put("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.type").value("/errors/not-found"));
        mockMvc.perform(delete("/api/posts/{id}/like", 999_999_999L).header("Authorization", bearer(m)))
                .andExpect(status().isNotFound());
    }

    @Test
    void 토큰_없으면_401() throws Exception {
        mockMvc.perform(put("/api/posts/1/like")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/posts/1/like")).andExpect(status().isUnauthorized());
    }

    // 함정: like_count를 읽고 +1 해서 저장하면 동시 요청에서 갱신이 유실된다
    @Test
    void 서로_다른_회원_20명이_동시에_좋아요하면_like_count는_20() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        List<Member> members = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            members.add(newMember(Role.USER));
        }
        List<Integer> statuses = runConcurrently(members.stream().map(m -> (Task) () -> putStatus(postId, m)).toList());

        assertThat(statuses).containsOnly(204);
        assertThat(likeRows(postId)).isEqualTo(20);
        assertThat(likeCount(postId)).isEqualTo(20);
    }

    // 함정: "조회 후 없으면 저장"만으로는 같은 회원의 동시 요청 두 건이 모두 저장된다
    @Test
    void 같은_회원이_동시에_10번_PUT해도_좋아요는_한_건() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Member m = newMember(Role.USER);
        List<Integer> statuses = runConcurrently(java.util.Collections.nCopies(10, (Task) () -> putStatus(postId, m)));

        assertThat(statuses).containsOnly(204);
        assertThat(likeRows(postId)).isEqualTo(1);
        assertThat(likeCount(postId)).isEqualTo(1);
    }

    @Test
    void 동시에_좋아요와_취소가_섞여도_like_count는_행_수와_같다() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        List<Member> members = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            members.add(newMember(Role.USER));
        }
        members.forEach(m -> {
            try {
                putStatus(postId, m);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
        List<Task> tasks = new ArrayList<>();
        for (Member m : members) {
            tasks.add(() -> mockMvc.perform(delete("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                    .andReturn().getResponse().getStatus());
            tasks.add(() -> mockMvc.perform(delete("/api/posts/{id}/like", postId).header("Authorization", bearer(m)))
                    .andReturn().getResponse().getStatus());
        }

        assertThat(runConcurrently(tasks)).containsOnly(204);
        assertThat(likeRows(postId)).isZero();
        assertThat(likeCount(postId)).isZero();
    }

    interface Task {
        int run() throws Exception;
    }

    private List<Integer> runConcurrently(List<Task> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (Task t : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return t.run();
                }));
            }
            start.countDown();
            List<Integer> result = new ArrayList<>();
            for (Future<Integer> f : futures) {
                result.add(f.get());
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }
}
