package com.example.orders;
public record OrderRequest(String customerName, int quantity) {
    public OrderRequest {
        customerName = customerName == null ? "" : customerName.trim();
        if (customerName.isBlank() || quantity < 1) throw new IllegalArgumentException("invalid order");
    }
}
