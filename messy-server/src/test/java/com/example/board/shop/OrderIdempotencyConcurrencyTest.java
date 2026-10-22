package com.example.board.shop;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.point.PointService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class OrderIdempotencyConcurrencyTest extends ApiTestSupport {

    @Autowired
    ShopItemRepository shopItemRepository;

    @Autowired
    PointService pointService;

    List<MockHttpServletResponse> orderConcurrently(Member m, String key, List<String> bodies) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(bodies.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<MockHttpServletResponse>> futures = new ArrayList<>();
            for (String body : bodies) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/shop/orders").contentType(MediaType.APPLICATION_JSON)
                            .content(body).header("Authorization", bearer(m)).header("Idempotency-Key", key))
                            .andReturn().getResponse();
                }));
            }
            start.countDown();
            List<MockHttpServletResponse> result = new ArrayList<>();
            for (var f : futures) {
                result.add(f.get());
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }

    // Review Focus 2: 같은 키의 동시 요청이어도 주문과 차감은 한 번이다
    @Test
    void 같은_키로_동시_2요청이면_주문_1건_차감_1회이고_응답은_같다() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 1000, "TEST", null);
        ShopItem item = shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, 10));
        String body = "{\"itemId\":" + item.getId() + ",\"quantity\":1}";

        List<MockHttpServletResponse> responses = orderConcurrently(m, UUID.randomUUID().toString(),
                List.of(body, body));

        assertThat(responses).extracting(MockHttpServletResponse::getStatus).containsOnly(201);
        assertThat(responses.get(0).getContentAsString()).isEqualTo(responses.get(1).getContentAsString());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shop_order WHERE member_id = ?", Integer.class,
                m.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId()))
                .isEqualTo(900);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND type = 'SPEND'",
                Integer.class, m.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT stock FROM shop_item WHERE id = ?", Integer.class, item.getId()))
                .isEqualTo(9);
    }

    @Test
    void 같은_키로_동시_5요청이어도_주문_1건_차감_1회() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 1000, "TEST", null);
        ShopItem item = shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, 10));
        String body = "{\"itemId\":" + item.getId() + ",\"quantity\":1}";

        List<MockHttpServletResponse> responses = orderConcurrently(m, UUID.randomUUID().toString(),
                java.util.Collections.nCopies(5, body));

        assertThat(responses).extracting(MockHttpServletResponse::getStatus).containsOnly(201);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shop_order WHERE member_id = ?", Integer.class,
                m.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId()))
                .isEqualTo(900);
    }

    @Test
    void 같은_키_다른_본문_동시_요청은_하나만_주문되고_다른_하나는_422다() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 1000, "TEST", null);
        ShopItem item = shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, 10));

        List<MockHttpServletResponse> responses = orderConcurrently(m, UUID.randomUUID().toString(),
                List.of("{\"itemId\":" + item.getId() + ",\"quantity\":1}",
                        "{\"itemId\":" + item.getId() + ",\"quantity\":2}"));

        assertThat(responses).extracting(MockHttpServletResponse::getStatus).containsExactlyInAnyOrder(201, 422);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shop_order WHERE member_id = ?", Integer.class,
                m.getId())).isEqualTo(1);
    }

    // 같은 회원의 서로 다른 키 동시 주문이 교착 없이 모두 처리되고 잔액이 맞아야 한다
    @Test
    void 같은_회원이_다른_키로_동시에_주문해도_교착_없이_합계가_맞다() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 1000, "TEST", null);
        ShopItem item = shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, 10));
        String body = "{\"itemId\":" + item.getId() + ",\"quantity\":1}";
        ExecutorService pool = Executors.newFixedThreadPool(6);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 6; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/shop/orders").contentType(MediaType.APPLICATION_JSON)
                            .content(body).header("Authorization", bearer(m))
                            .header("Idempotency-Key", UUID.randomUUID().toString()))
                            .andReturn().getResponse().getStatus();
                }));
            }
            start.countDown();
            for (var f : futures) {
                assertThat(f.get()).isEqualTo(201);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId()))
                .isEqualTo(400);
        assertThat(jdbc.queryForObject("SELECT stock FROM shop_item WHERE id = ?", Integer.class, item.getId()))
                .isEqualTo(4);
    }
}
