package com.example.board.shop;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {

    List<ShopItem> findAllByOrderByIdAsc();

    /** 재고가 충분할 때만 뺀다. 영향 행 수 0이면 재고 부족이다. 읽고 확인한 뒤 빼면 동시 구매에서 음수가 된다. */
    @Transactional
    @Modifying
    @Query("update ShopItem i set i.stock = i.stock - :quantity where i.id = :id and i.stock >= :quantity")
    int decreaseStock(@Param("id") Long id, @Param("quantity") int quantity);
}
