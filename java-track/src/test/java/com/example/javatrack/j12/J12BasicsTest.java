package com.example.javatrack.j12;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 기본기 반복: 나눈 검증 메서드가 실패 사유를 List&lt;String&gt;으로 모아 반환하게 하기. */
class J12BasicsTest {

    private static final long MEMBER = 1L;

    private ShopStore store;
    private PurchaseService service;

    @BeforeEach
    void setUp() {
        store = new ShopStore();
        store.addItem("BOOK", 12000, 5);
        store.setPoints(MEMBER, 10000);
        service = new PurchaseService(store);
    }

    @Test
    void 문제가_없으면_빈_목록이다() {
        List<String> errors = service.validate(new PurchaseRequest(MEMBER, "BOOK", 1, "SALE10", 10000));

        assertThat(errors).isEmpty();
    }

    @Test
    void 첫_실패에서_멈추지_않고_사유를_순서대로_모두_모은다() {
        List<String> errors = service.validate(new PurchaseRequest(MEMBER, "BOOK", 0, "WELCOME", 20000));

        assertThat(errors).containsExactly("수량은 1~10개여야 합니다", "포인트가 부족합니다", "쓸 수 없는 쿠폰입니다");
    }

    @Test
    void 없는_상품이면_재고는_검사하지_않는다() {
        List<String> errors = service.validate(new PurchaseRequest(MEMBER, "PEN", 3, null, 0));

        assertThat(errors).containsExactly("없는 상품입니다");
    }
}
