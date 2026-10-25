package com.example.orders;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/orders")
class OrderController {
    private final OrderService service;
    OrderController(OrderService service) { this.service = service; }
    @PostMapping OrderResponse create(@RequestBody OrderRequest request) { return service.create(request); }
}
record OrderResponse(String id, String customerName, int quantity) {}
