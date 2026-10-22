package com.example.board.point;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class PostEarnApiTest extends ApiTestSupport {

    int createPost(Member m) throws Exception {
        return mockMvc.perform(post("/api/posts").header("Authorization", bearer(m))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목\",\"content\":\"내용\"}"))
                .andReturn().getResponse().getStatus();
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    @Test
    void 글을_쓰면_201이고_작성자_잔액이_10_늘고_이력이_남는다() throws Exception {
        Member m = newMember(Role.USER);

        assertThat(createPost(m)).isEqualTo(201);

        assertThat(balance(m)).isEqualTo(10);
        assertThat(jdbc.queryForList("SELECT CONCAT(type, ':', ref_type, ':', amount) FROM point_ledger WHERE member_id = ?",
                String.class, m.getId())).containsExactly("EARN:POST:10");
        Long postId = jdbc.queryForObject("SELECT MAX(id) FROM post WHERE member_id = ?", Long.class, m.getId());
        assertThat(jdbc.queryForObject("SELECT ref_id FROM point_ledger WHERE member_id = ?", Long.class, m.getId()))
                .isEqualTo(postId);
    }

    @Test
    void 검증에_실패해_글이_안_만들어지면_적립도_없다() throws Exception {
        Member m = newMember(Role.USER);
        mockMvc.perform(post("/api/posts").header("Authorization", bearer(m)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"\",\"content\":\"\"}"));

        assertThat(balance(m)).isZero();
    }

    // 함정: 글 INSERT(FK 공유 잠금) 뒤에 잔액 UPDATE(배타 잠금)를 하면 같은 회원의 동시 작성이 교착한다
    @Test
    void 같은_회원이_동시에_글_10개를_쓰면_모두_201이고_잔액은_100() throws Exception {
        Member m = newMember(Role.USER);
        ExecutorService pool = Executors.newFixedThreadPool(10);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return createPost(m);
                }));
            }
            start.countDown();
            for (Future<Integer> f : futures) {
                assertThat(f.get()).isEqualTo(201);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(balance(m)).isEqualTo(100);
        assertThat(jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM point_ledger WHERE member_id = ?",
                Long.class, m.getId())).isEqualTo(100);
    }
}
