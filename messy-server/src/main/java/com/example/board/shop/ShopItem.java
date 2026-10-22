package com.example.board.shop;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "shop_item")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShopItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private long price;

    // 재고는 조건부 UPDATE로만 줄인다
    @Column(nullable = false)
    private int stock;

    private ShopItem(String name, long price, int stock) {
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    public static ShopItem create(String name, long price, int stock) {
        return new ShopItem(name, price, stock);
    }
}
