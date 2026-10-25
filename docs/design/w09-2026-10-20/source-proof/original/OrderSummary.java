// OrderSummary.java
package example.order;

import java.math.BigDecimal;

public record OrderSummary(Long id, String status, String customerName,
                           BigDecimal total) {}

// OrderSummaryMapper.java
final class OrderSummaryMapper {
    private OrderSummaryMapper() {}

    public static OrderSummary from(OrderEntity order) {
        return new OrderSummary(
            order.getId(),
            order.getStatus(),
            order.getCustomer().getName(),
            order.getTotal()
        );
    }
}
