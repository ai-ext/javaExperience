package com.example.board.point;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ActivityRankingApiTest extends ApiTestSupport {

    @Autowired
    ActivityRankingService rankingService;

    @Autowired
    PointService pointService;

    @Autowired
    TransactionTemplate tx;

    Long writePost(Member m) throws Exception {
        String location = mockMvc.perform(post("/api/posts").header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목\",\"content\":\"내용\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        return Long.valueOf(location.substring(location.lastIndexOf('/') + 1));
    }

    void writeComment(Long postId, Member m) throws Exception {
        mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                .andExpect(status().isCreated());
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    @Test
    void 글_댓글_작성_뒤_랭킹은_점수_높은_순이다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Member c = newMember(Role.USER);
        Long postId = writePost(a);
        writePost(a);
        writePost(b);
        for (int i = 0; i < 3; i++) {
            writeComment(postId, b);
        }
        writeComment(postId, c);

        mockMvc.perform(get("/api/rankings/activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].memberId").value(a.getId()))
                .andExpect(jsonPath("$.items[0].score").value(20))
                .andExpect(jsonPath("$.items[0].rank").value(1))
                .andExpect(jsonPath("$.items[0].nickname").value(a.getNickname()))
                .andExpect(jsonPath("$.items[1].memberId").value(b.getId()))
                .andExpect(jsonPath("$.items[1].score").value(16))
                .andExpect(jsonPath("$.items[2].memberId").value(c.getId()))
                .andExpect(jsonPath("$.items[2].score").value(2))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void 댓글을_쓰면_포인트_2가_EARN으로_적립된다() throws Exception {
        Member writer = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));

        writeComment(postId, writer);

        assertThat(balance(writer)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND type = 'EARN'"
                + " AND amount = 2 AND ref_type = 'COMMENT'", Integer.class, writer.getId())).isEqualTo(1);
    }

    @Test
    void size는_1에서_50이고_넘으면_400() throws Exception {
        mockMvc.perform(get("/api/rankings/activity").param("size", "51"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        mockMvc.perform(get("/api/rankings/activity").param("size", "0")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/rankings/activity").param("size", "50")).andExpect(status().isOk());
    }

    @Test
    void 커서로_다음_쪽을_읽는다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Member c = newMember(Role.USER);
        writePost(a);
        writePost(a);
        writePost(a);
        writePost(b);
        writePost(b);
        writePost(c);

        String next = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/rankings/activity").param("size", "2"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[1].memberId").value(b.getId()))
                .andReturn().getResponse().getContentAsString(), "$.nextCursor");

        mockMvc.perform(get("/api/rankings/activity").param("size", "2").param("cursor", next))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].memberId").value(c.getId()))
                .andExpect(jsonPath("$.items[0].rank").value(3))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    // 함정: 점수를 Redis에만 쌓으면 Redis 데이터가 사라질 때 되살릴 원천이 없다
    @Test
    void 랭킹_키가_사라져도_point_ledger에서_같은_점수로_다시_만든다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Long postId = writePost(a);
        writeComment(postId, b);
        writeComment(postId, b);
        writeComment(postId, a);
        // 충전·구매 같은 활동 아닌 원장 행은 랭킹에 들어가지 않는다
        jdbc.update("INSERT INTO point_ledger (member_id, type, amount, balance_after, ref_type, ref_id, created_at,"
                + " updated_at) VALUES (?, 'CHARGE', 5000, 5000, 'PG', 1, NOW(6), NOW(6))", b.getId());
        Double aBefore = redis.opsForZSet().score("ranking:activity", a.getId().toString());
        Double bBefore = redis.opsForZSet().score("ranking:activity", b.getId().toString());

        redis.delete("ranking:activity");
        int rebuilt = rankingService.rebuild();

        // 같은 DB를 쓰는 다른 테스트의 회원도 원장에 있으므로 이 테스트의 회원만 비교한다
        assertThat(rebuilt).isGreaterThanOrEqualTo(2);
        assertThat(redis.opsForZSet().score("ranking:activity", a.getId().toString())).isEqualTo(aBefore).isEqualTo(12.0);
        assertThat(redis.opsForZSet().score("ranking:activity", b.getId().toString())).isEqualTo(bBefore).isEqualTo(4.0);
    }

    @Test
    void 롤백된_적립은_랭킹에_오르지_않는다() {
        Member m = newMember(Role.USER);

        tx.executeWithoutResult(s -> {
            pointService.earn(m.getId(), 10, "POST", 1L);
            s.setRollbackOnly();
        });

        assertThat(redis.opsForZSet().score("ranking:activity", m.getId().toString())).isNull();
    }

    // 댓글 INSERT(회원 FK 공유 잠금) 뒤 잔액 UPDATE(배타 잠금)를 하면 동시 요청끼리 교착이 난다
    @Test
    void 같은_회원이_댓글_20개를_동시에_써도_모두_201이고_잔액은_40이다() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(m))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                            .andReturn().getResponse().getStatus();
                }));
            }
            start.countDown();
            for (Future<Integer> f : futures) {
                assertThat(f.get(30, TimeUnit.SECONDS)).isEqualTo(201);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(balance(m)).isEqualTo(40);
        assertThat(redis.opsForZSet().score("ranking:activity", m.getId().toString())).isEqualTo(40.0);
    }
}
