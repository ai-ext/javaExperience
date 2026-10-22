package com.example.board.shop;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopItemRepository shopItemRepository;

    public ShopController(ShopItemRepository shopItemRepository) {
        this.shopItemRepository = shopItemRepository;
    }

    @GetMapping("/items")
    public List<ShopItemResponse> items() {
        return shopItemRepository.findAllByOrderByIdAsc().stream().map(ShopItemResponse::from).toList();
    }
}
