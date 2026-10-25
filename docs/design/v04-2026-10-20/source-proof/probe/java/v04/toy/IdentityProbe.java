package v04.toy;
import jakarta.persistence.*;
import org.hibernate.annotations.Check;
@Entity @Table(name="identity_probe") @Check(constraints="amount>=0")
public class IdentityProbe {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 private int amount;
 protected IdentityProbe(){}
 IdentityProbe(int amount){this.amount=amount;}
}
