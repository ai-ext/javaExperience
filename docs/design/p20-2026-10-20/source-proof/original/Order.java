package example.shop.domain;
import java.util.*;
import jakarta.persistence.*;

@Entity @Table(name="orders")
public class Order extends BaseEntity {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, length=100) private String ordererName;
  @OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true)
  private List<OrderLine> lines = new ArrayList<>();
  protected Order() {}
  private Order(String name) { ordererName=name; }
  public static Order create(String name) { return new Order(name); }
  public void addLine(OrderLine line) { lines.add(line); line.attach(this); }
  public void removeLine(OrderLine line) { lines.remove(line); line.detach(); }
  public Long getId() { return id; }
  public String getOrdererName() { return ordererName; }
  public List<OrderLine> getLines() { return List.copyOf(lines); }
}
