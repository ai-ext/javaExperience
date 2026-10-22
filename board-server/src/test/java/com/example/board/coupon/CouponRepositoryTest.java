package com.example.board.coupon;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CouponRepositoryTest extends ApiTestSupport {

    @Autowired
    CouponRepository couponRepository;

    Coupon newCoupon(int total) {
        return couponRepository.saveAndFlush(Coupon.create("쿠폰", total, LocalDateTime.now().plusDays(30)));
    }

    int issued(Long id) {
        return jdbc.queryForObject("SELECT issued_quantity FROM coupon WHERE id = ?", Integer.class, id);
    }

    @Test
    void 남은_수량이_있으면_1_증가하고_영향_행은_1() {
        Coupon c = newCoupon(2);

        assertThat(couponRepository.increaseIssued(c.getId())).isEqualTo(1);
        assertThat(issued(c.getId())).isEqualTo(1);
    }

    @Test
    void 소진되면_영향_행이_0이고_수량은_그대로() {
        Coupon c = newCoupon(1);
        couponRepository.increaseIssued(c.getId());

        assertThat(couponRepository.increaseIssued(c.getId())).isZero();
        assertThat(issued(c.getId())).isEqualTo(1);
    }

    @Test
    void 없는_쿠폰도_영향_행_0() {
        assertThat(couponRepository.increaseIssued(999_999_999L)).isZero();
    }

    // 함정: 남은 수량을 읽어 확인한 뒤 증가시키면 동시 발급에서 총 수량을 넘는다
    @Test
    void 동시에_30번_증가시켜도_총_수량_10을_넘지_않는다() throws Exception {
        Coupon c = newCoupon(10);
        ExecutorService pool = Executors.newFixedThreadPool(30);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 30; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return couponRepository.increaseIssued(c.getId());
                }));
            }
            start.countDown();
            int success = 0;
            for (Future<Integer> f : futures) {
                success += f.get();
            }
            assertThat(success).isEqualTo(10);
        } finally {
            pool.shutdownNow();
        }
        assertThat(issued(c.getId())).isEqualTo(10);
    }

    @Test
    void DB_제약이_발급_수량의_총량_초과를_막는다() {
        Coupon c = newCoupon(1);

        assertThatThrownBy(() -> jdbc.update("UPDATE coupon SET issued_quantity = 2 WHERE id = ?", c.getId()))
                .hasMessageContaining("ck_coupon_issued");
    }
}
