package com.example.board.shop;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;
import com.example.board.coupon.Coupon;
import com.example.board.coupon.CouponRepository;
import com.example.board.coupon.CouponService;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.point.PointService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderApiTest extends ApiTestSupport {

    @Autowired
    ShopItemRepository shopItemRepository;

    @Autowired
    CouponRepository couponRepository;

    @Autowired
    CouponService couponService;

    @Autowired
    PointService pointService;

    Member memberWithPoints(long points) {
        Member m = newMember(Role.USER);
        if (points > 0) {
            pointService.earn(m.getId(), (int) points, "TEST", null);
        }
        return m;
    }

    ShopItem item(long price, int stock) {
        return shopItemRepository.saveAndFlush(ShopItem.create("아이템", price, stock));
    }

    String newKey() {
        return UUID.randomUUID().toString();
    }

    ResultActions order(Member m, String key, String body) throws Exception {
        var req = post("/api/shop/orders").contentType(MediaType.APPLICATION_JSON).content(body)
                .header("Authorization", bearer(m));
        if (key != null) {
            req = req.header("Idempotency-Key", key);
        }
        return mockMvc.perform(req);
    }

    String body(Long itemId, int quantity, Long memberCouponId) {
        return "{\"itemId\":" + itemId + ",\"quantity\":" + quantity
                + (memberCouponId == null ? "" : ",\"memberCouponId\":" + memberCouponId) + "}";
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    int stock(ShopItem i) {
        return jdbc.queryForObject("SELECT stock FROM shop_item WHERE id = ?", Integer.class, i.getId());
    }

    int orders(Member m) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM shop_order WHERE member_id = ?", Integer.class, m.getId());
    }

    Long issueCoupon(Member m, LocalDateTime expiresAt) {
        Coupon c = couponRepository.saveAndFlush(Coupon.create("쿠폰", 5, expiresAt));
        return couponService.issue(c.getId(), m.getId());
    }

    @Test
    void 주문하면_201이고_잔액과_재고가_줄고_SPEND_이력이_남는다() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);

        order(m, newKey(), body(item.getId(), 3, null)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.itemId").value(item.getId()))
                .andExpect(jsonPath("$.quantity").value(3))
                .andExpect(jsonPath("$.paidAmount").value(300))
                .andExpect(jsonPath("$.memberCouponId").doesNotExist());

        assertThat(balance(m)).isEqualTo(700);
        assertThat(stock(item)).isEqualTo(7);
        assertThat(jdbc.queryForList("SELECT CONCAT(type, ':', ref_type, ':', amount, ':', balance_after) FROM point_ledger"
                + " WHERE member_id = ? ORDER BY id DESC LIMIT 1", String.class, m.getId()))
                .containsExactly("SPEND:ORDER:-300:700");
    }

    @Test
    void 같은_키_같은_본문을_다시_보내면_처음과_같은_응답이고_차감은_한_번이다() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);
        String key = newKey();

        String first = order(m, key, body(item.getId(), 2, null)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String second = order(m, key, body(item.getId(), 2, null)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        assertThat(second).isEqualTo(first);
        assertThat(orders(m)).isEqualTo(1);
        assertThat(balance(m)).isEqualTo(800);
        assertThat(stock(item)).isEqualTo(8);
    }

    @Test
    void 같은_키에_다른_본문이면_422_idempotency_mismatch이고_추가_차감이_없다() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);
        String key = newKey();
        order(m, key, body(item.getId(), 2, null)).andExpect(status().isCreated());

        order(m, key, body(item.getId(), 3, null)).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("/errors/idempotency-mismatch"));

        assertThat(balance(m)).isEqualTo(800);
        assertThat(orders(m)).isEqualTo(1);
    }

    @Test
    void 다른_회원이_같은_키를_써도_각자_주문된다() throws Exception {
        ShopItem item = item(100, 10);
        Member a = memberWithPoints(1000);
        Member b = memberWithPoints(1000);
        String key = newKey();

        order(a, key, body(item.getId(), 1, null)).andExpect(status().isCreated());
        order(b, key, body(item.getId(), 1, null)).andExpect(status().isCreated());

        assertThat(stock(item)).isEqualTo(8);
    }

    @Test
    void 잔액이_부족하면_409_insufficient_points이고_재고와_쿠폰도_되돌아간다() throws Exception {
        Member m = memberWithPoints(50);
        ShopItem item = item(100, 10);
        Long mcId = issueCoupon(m, LocalDateTime.now().plusDays(1));

        order(m, newKey(), body(item.getId(), 1, mcId)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/insufficient-points"));

        assertThat(balance(m)).isEqualTo(50);
        assertThat(stock(item)).isEqualTo(10);
        assertThat(orders(m)).isZero();
        assertThat(jdbc.queryForObject("SELECT status FROM member_coupon WHERE id = ?", String.class, mcId))
                .isEqualTo("UNUSED");
    }

    @Test
    void 실패한_키는_저장되지_않아_충전_뒤_같은_키로_다시_주문할_수_있다() throws Exception {
        Member m = memberWithPoints(50);
        ShopItem item = item(100, 10);
        String key = newKey();
        order(m, key, body(item.getId(), 1, null)).andExpect(status().isConflict());

        pointService.earn(m.getId(), 100, "TEST", null);

        order(m, key, body(item.getId(), 1, null)).andExpect(status().isCreated());
        assertThat(balance(m)).isEqualTo(50);
    }

    @Test
    void Idempotency_Key가_없거나_형식이_틀리면_400() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);

        order(m, null, body(item.getId(), 1, null)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
        order(m, "short", body(item.getId(), 1, null)).andExpect(status().isBadRequest());
        order(m, "a".repeat(65), body(item.getId(), 1, null)).andExpect(status().isBadRequest());
        order(m, "has space in it", body(item.getId(), 1, null)).andExpect(status().isBadRequest());

        assertThat(orders(m)).isZero();
    }

    @Test
    void 본문_검증_실패는_400() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);

        order(m, newKey(), body(item.getId(), 0, null)).andExpect(status().isBadRequest());
        order(m, newKey(), body(item.getId(), 11, null)).andExpect(status().isBadRequest());
        order(m, newKey(), body(0L, 1, null)).andExpect(status().isBadRequest());
        order(m, newKey(), "{\"quantity\":1}").andExpect(status().isBadRequest());
        order(m, newKey(), "{\"itemId\":" + item.getId() + "}").andExpect(status().isBadRequest());
    }

    @Test
    void 쿠폰을_쓰면_10퍼센트_할인되고_쿠폰은_USED가_된다() throws Exception {
        Member m = memberWithPoints(5000);
        ShopItem item = item(1000, 10);
        Long mcId = issueCoupon(m, LocalDateTime.now().plusDays(1));

        order(m, newKey(), body(item.getId(), 2, mcId)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.paidAmount").value(1800))
                .andExpect(jsonPath("$.memberCouponId").value(mcId));

        assertThat(balance(m)).isEqualTo(3200);
        assertThat(jdbc.queryForObject("SELECT status FROM member_coupon WHERE id = ?", String.class, mcId))
                .isEqualTo("USED");
        assertThat(jdbc.queryForObject("SELECT used_at FROM member_coupon WHERE id = ?", java.sql.Timestamp.class, mcId))
                .isNotNull();
    }

    @Test
    void 남의_쿠폰이면_409_coupon_unusable이고_아무것도_차감되지_않는다() throws Exception {
        Member owner = memberWithPoints(0);
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 10);
        Long mcId = issueCoupon(owner, LocalDateTime.now().plusDays(1));

        order(m, newKey(), body(item.getId(), 1, mcId)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/coupon-unusable"));

        assertThat(balance(m)).isEqualTo(1000);
        assertThat(stock(item)).isEqualTo(10);
        assertThat(jdbc.queryForObject("SELECT status FROM member_coupon WHERE id = ?", String.class, mcId))
                .isEqualTo("UNUSED");
    }

    @Test
    void 이미_쓴_쿠폰_만료된_쿠폰_없는_쿠폰은_409_coupon_unusable() throws Exception {
        Member m = memberWithPoints(5000);
        ShopItem item = item(100, 10);
        Long used = issueCoupon(m, LocalDateTime.now().plusDays(1));
        order(m, newKey(), body(item.getId(), 1, used)).andExpect(status().isCreated());
        Long expired = issueCoupon(m, LocalDateTime.now().minusDays(1));

        order(m, newKey(), body(item.getId(), 1, used)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/coupon-unusable"));
        order(m, newKey(), body(item.getId(), 1, expired)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/coupon-unusable"));
        order(m, newKey(), body(item.getId(), 1, 999_999_999L)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/coupon-unusable"));
    }

    @Test
    void 재고가_모자라면_409_out_of_stock이고_포인트는_그대로() throws Exception {
        Member m = memberWithPoints(1000);
        ShopItem item = item(100, 2);

        order(m, newKey(), body(item.getId(), 3, null)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/out-of-stock"));

        assertThat(balance(m)).isEqualTo(1000);
        assertThat(stock(item)).isEqualTo(2);
    }

    @Test
    void 없는_아이템은_404() throws Exception {
        order(memberWithPoints(1000), newKey(), body(999_999_999L, 1, null)).andExpect(status().isNotFound());
    }

    @Test
    void 토큰_없으면_401() throws Exception {
        mockMvc.perform(post("/api/shop/orders").header("Idempotency-Key", newKey())
                .contentType(MediaType.APPLICATION_JSON).content(body(1L, 1, null)))
                .andExpect(status().isUnauthorized());
    }
}
