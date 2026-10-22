package com.example.board.shop;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopItemRepository shopItemRepository;
    private final OrderService orderService;

    public ShopController(ShopItemRepository shopItemRepository, OrderService orderService) {
        this.shopItemRepository = shopItemRepository;
        this.orderService = orderService;
    }

    @GetMapping("/items")
    public List<ShopItemResponse> items() {
        return shopItemRepository.findAllByOrderByIdAsc().stream().map(ShopItemResponse::from).toList();
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> order(@AuthenticationPrincipal AuthMember auth,
            @RequestHeader("Idempotency-Key") @Pattern(regexp = "[A-Za-z0-9-]{8,64}") String idempotencyKey,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(201).body(orderService.order(auth.id(), idempotencyKey, request));
    }
}
