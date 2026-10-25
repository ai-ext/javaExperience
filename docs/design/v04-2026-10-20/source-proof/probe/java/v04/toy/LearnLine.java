package v04.toy;
import jakarta.persistence.*;
@Entity @Table(name="learn_line")
public class LearnLine {
 @Id private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="order_id",nullable=false) private LearnOrder order;
 protected LearnLine(){}
 LearnLine(long id,LearnOrder order){this.id=id;this.order=order;}
}
