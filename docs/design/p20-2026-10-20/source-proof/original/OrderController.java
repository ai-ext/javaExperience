package example.shop.web;
import example.shop.domain.*;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/orders")
public class OrderController {
  private final EntityManager em;
  public OrderController(EntityManager em) { this.em=em; }
  @PostMapping @Transactional
  public OrderResponse create() {
    Order o=Order.create("kim");
    o.addLine(new OrderLine("coffee", new java.math.BigDecimal("4.50"), 2));
    em.persist(o);
    return OrderResponse.from(o);
  }
}
