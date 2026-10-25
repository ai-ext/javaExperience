package example.shop.domain;
import java.math.BigDecimal;
import jakarta.persistence.*;

@Entity @Table(name="order_lines")
public class OrderLine {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, length=120) private String productName;
  @Column(nullable=false, precision=19, scale=2) private BigDecimal price;
  @Column(nullable=false) private int quantity;
  @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
  private LineStatus status = LineStatus.PENDING;
  @ManyToOne(fetch=FetchType.LAZY, optional=false)
  @JoinColumn(name="order_id", nullable=false) private Order order;
  protected OrderLine() {}
  public OrderLine(String n, BigDecimal p, int q) {
    if (q < 1) throw new IllegalArgumentException("quantity must be positive");
    productName=n; price=p; quantity=q;
  }
  void attach(Order o) { order=o; } void detach() { order=null; }
  public Long getId() { return id; } public String getProductName() { return productName; }
  public BigDecimal getPrice() { return price; } public int getQuantity() { return quantity; }
  public LineStatus getStatus() { return status; }
}
enum LineStatus { PENDING, PAID, CANCELLED }
