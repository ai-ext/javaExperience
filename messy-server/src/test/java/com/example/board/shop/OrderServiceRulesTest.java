package com.example.board.shop;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/** 함정: 데드락 재시도를 @Transactional 안에 두면 rollback-only가 된 같은 트랜잭션을 다시 쓴다. 재시도 바깥에는 트랜잭션이 없어야 한다. */
class OrderServiceRulesTest {

    @Test
    void OrderService에는_선언적_트랜잭션이_없다() {
        assertThat(OrderService.class.isAnnotationPresent(Transactional.class)).isFalse();
        for (Method m : OrderService.class.getDeclaredMethods()) {
            assertThat(m.isAnnotationPresent(Transactional.class)).as(m.getName()).isFalse();
        }
    }
}
