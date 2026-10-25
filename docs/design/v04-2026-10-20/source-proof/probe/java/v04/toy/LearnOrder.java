package v04.toy;
import jakarta.persistence.*;
import java.util.*;
/** 원문 starter에는 없는 LAZY 관계를 추가한 실험 모델이다. */
@Entity @Table(name="learn_order")
public class LearnOrder {
 @Id private Long id;
 @OneToMany(mappedBy="order",cascade=CascadeType.ALL) private List<LearnLine> lines=new ArrayList<>();
 protected LearnOrder(){}
 LearnOrder(long id){this.id=id;}
 void add(long lineId){lines.add(new LearnLine(lineId,this));}
 public Long getId(){return id;}
 public List<LearnLine> getLines(){return lines;}
}
