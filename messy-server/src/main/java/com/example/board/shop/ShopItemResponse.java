package com.example.board.shop;

public record ShopItemResponse(Long id, String name, long price, int stock) {

    static ShopItemResponse from(ShopItem item) {
        return new ShopItemResponse(item.getId(), item.getName(), item.getPrice(), item.getStock());
    }
}
