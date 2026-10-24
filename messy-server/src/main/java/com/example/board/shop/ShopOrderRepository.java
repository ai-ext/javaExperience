package com.example.board.shop;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {

    Optional<ShopOrder> findByMemberIdAndIdempotencyKey(Long memberId, String idempotencyKey);
}
