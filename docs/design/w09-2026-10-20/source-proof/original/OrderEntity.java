// OrderEntity.java
package example.order;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY)
    private CustomerEntity customer;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItemEntity> items = new ArrayList<>();

    protected OrderEntity() {}

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public CustomerEntity getCustomer() { return customer; }
    public List<OrderItemEntity> getItems() { return items; }
}

