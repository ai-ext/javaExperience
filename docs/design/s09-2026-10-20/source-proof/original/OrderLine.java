// OrderLine.java
package example;
import jakarta.persistence.*;

@Entity @Table(name = "order_line")
public class OrderLine {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int quantity;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private PurchaseOrder order;
    protected OrderLine() {}
    public OrderLine(int quantity) { this.quantity = quantity; }
    void assignTo(PurchaseOrder order) { this.order = order; }
}
