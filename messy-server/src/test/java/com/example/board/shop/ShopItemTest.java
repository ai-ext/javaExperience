package com.example.board.shop;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopItemTest extends ApiTestSupport {

    @Autowired
    ShopItemRepository shopItemRepository;

    ShopItem newItem(int stock) {
        return shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, stock));
    }

    int stock(Long id) {
        return jdbc.queryForObject("SELECT stock FROM shop_item WHERE id = ?", Integer.class, id);
    }

    @Test
    void 토큰_없이_목록을_조회하면_200() throws Exception {
        ShopItem item = newItem(3);

        mockMvc.perform(get("/api/shop/items")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + item.getId() + ")].name").value("아이템"))
                .andExpect(jsonPath("$[?(@.id==" + item.getId() + ")].price").value(100))
                .andExpect(jsonPath("$[?(@.id==" + item.getId() + ")].stock").value(3));
    }

    @Test
    void 재고가_충분하면_차감하고_영향_행은_1_모자라면_0이며_재고는_그대로() {
        ShopItem item = newItem(5);

        assertThat(shopItemRepository.decreaseStock(item.getId(), 3)).isEqualTo(1);
        assertThat(shopItemRepository.decreaseStock(item.getId(), 3)).isZero();
        assertThat(stock(item.getId())).isEqualTo(2);
    }

    // 함정: 재고를 조회한 뒤 차감하면 동시 구매에서 stock이 음수가 된다
    @Test
    void 동시에_20번_1개씩_차감해도_재고_5개_이상_팔리지_않고_음수가_없다() throws Exception {
        ShopItem item = newItem(5);
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        int sold = 0;
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return shopItemRepository.decreaseStock(item.getId(), 1);
                }));
            }
            start.countDown();
            for (Future<Integer> f : futures) {
                sold += f.get();
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(sold).isEqualTo(5);
        assertThat(stock(item.getId())).isZero();
    }

    @Test
    void DB_제약이_음수_재고를_막는다() {
        ShopItem item = newItem(1);

        assertThatThrownBy(() -> jdbc.update("UPDATE shop_item SET stock = -1 WHERE id = ?", item.getId()))
                .hasMessageContaining("ck_shop_item_stock");
    }
}
