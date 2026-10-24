package com.example.board.comment;

import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.point.PointService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * 서로의 글에 동시에 댓글을 다는 두 요청. 각자 자기 회원 행을 잡은 채 상대(글쓴이)에게 가는 알림을 저장하면 교착이 난다.
 * 두 요청이 적립까지 마친 지점(알림 저장 직전)에서 서로를 기다리게 해 그 순서를 매번 만든다.
 */
class CommentLockOrderTest extends ApiTestSupport {

    @MockitoSpyBean
    PointService pointService;

    @Test
    void 서로의_글에_동시에_댓글을_달아도_둘_다_성공하고_알림이_남는다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Long postOfA = newPost(a);
        Long postOfB = newPost(b);
        CyclicBarrier bothEarned = new CyclicBarrier(2);
        doAnswer(inv -> {
            Object result = inv.callRealMethod();
            try {
                // 잠금 순서가 맞으면 한쪽은 잠금에서 기다리느라 여기 오지 못한다. 그때는 2초 뒤 혼자 지나간다.
                bothEarned.await(2, TimeUnit.SECONDS);
            } catch (TimeoutException | BrokenBarrierException e) {
                // 기다리던 상대가 오지 않았다(정상)
            }
            return result;
        }).when(pointService).earn(anyLong(), anyInt(), eq("COMMENT"), any());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> aOnB = pool.submit(() -> comment(a, postOfB));
            Future<Integer> bOnA = pool.submit(() -> comment(b, postOfA));
            assertThat(aOnB.get(20, TimeUnit.SECONDS)).isEqualTo(201);
            assertThat(bOnA.get(20, TimeUnit.SECONDS)).isEqualTo(201);
        } finally {
            pool.shutdown();
            pool.awaitTermination(20, TimeUnit.SECONDS);
        }

        String sql = "SELECT COUNT(*) FROM notification WHERE member_id = ? AND type = 'COMMENT_ADDED'";
        assertThat(jdbc.queryForObject(sql, Integer.class, a.getId())).isPositive();
        assertThat(jdbc.queryForObject(sql, Integer.class, b.getId())).isPositive();
    }

    int comment(Member who, Long postId) throws Exception {
        return mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(who))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                .andReturn().getResponse().getStatus();
    }
}
