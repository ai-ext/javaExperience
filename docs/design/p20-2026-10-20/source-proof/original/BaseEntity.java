package example.shop.domain;
import java.time.Instant;
import jakarta.persistence.*;
import org.springframework.data.annotation.*;

@MappedSuperclass
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
public abstract class BaseEntity {
  @CreatedDate @Column(nullable=false, updatable=false) protected Instant createdAt;
  @LastModifiedDate @Column(nullable=false) protected Instant updatedAt;
  @CreatedBy @Column(nullable=false, updatable=false, length=80) protected String createdBy;
  @LastModifiedBy @Column(nullable=false, length=80) protected String updatedBy;
}
