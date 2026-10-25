package example.shop.web;
import example.shop.domain.Order;
import java.math.BigDecimal;
import java.util.List;

public record OrderResponse(Long id, String ordererName, List<LineResponse> lines) {
  public static OrderResponse from(Order o) {
    return new OrderResponse(o.getId(), o.getOrdererName(),
      o.getLines().stream().map(l -> new LineResponse(l.getId(), l.getProductName(),
        l.getPrice(), l.getQuantity(), String.valueOf(l.getStatus()))).toList());
  }
  public record LineResponse(Long id, String productName, BigDecimal price,
                             int quantity, String status) {}
}
