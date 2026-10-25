// PurchaseOrder.java
package example;
import jakarta.persistence.*;
import java.util.*;
import org.hibernate.annotations.BatchSize;

@Entity
public class PurchaseOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version private long version;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC") @BatchSize(size = 32)
    private List<OrderLine> lines = new ArrayList<>();
    protected PurchaseOrder() {}
    public Long getId() { return id; }
    public List<OrderLine> getLines() { return lines; }
    public void addLine(OrderLine line) { lines.add(line); line.assignTo(this); }
    public void removeLine(OrderLine line) {
        if (lines.remove(line)) line.assignTo(null);
    }
}
