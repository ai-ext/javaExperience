package v04.toy;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;
@Entity @Table(name="deferred_probe") @Check(constraints="amount>=0")
public class DeferredProbe {
 @Id private Long id;
 private int amount;
 protected DeferredProbe(){}
 DeferredProbe(long id,int amount){this.id=id;this.amount=amount;}
}
