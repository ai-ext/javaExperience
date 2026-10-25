// OrderItemEntity.java
package example.order;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private OrderEntity order;

    protected OrderItemEntity() {}
    public Long getId() { return id; }
    public OrderEntity getOrder() { return order; }
}
