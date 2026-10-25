package com.example.orders;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
class OrderService {
    private final OrderIdGenerator idGenerator;
    OrderResponse create(OrderRequest request) {
        return new OrderResponse(idGenerator.next(), request.customerName(), request.quantity());
    }
}
