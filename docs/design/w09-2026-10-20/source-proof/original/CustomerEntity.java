// CustomerEntity.java
package example.order;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class CustomerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String internalMemo;

    protected CustomerEntity() {}
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getInternalMemo() { return internalMemo; }
}
