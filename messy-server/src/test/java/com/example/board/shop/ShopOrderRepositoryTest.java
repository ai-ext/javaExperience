package com.example.board.shop;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShopOrderRepositoryTest extends ApiTestSupport {

    @Autowired
    ShopItemRepository shopItemRepository;

    @Autowired
    ShopOrderRepository shopOrderRepository;

    @Test
    void 같은_회원과_같은_키로_두_번_저장하면_UNIQUE_위반이다() {
        Member m = newMember(Role.USER);
        ShopItem item = shopItemRepository.saveAndFlush(ShopItem.create("아이템", 100, 10));
        shopOrderRepository.saveAndFlush(ShopOrder.create(m, item, 1, 100, null, "key-12345678"));

        assertThatThrownBy(() -> shopOrderRepository.saveAndFlush(ShopOrder.create(m, item, 1, 100, null,
                "key-12345678"))).isInstanceOf(DataIntegrityViolationException.class);
    }
}
