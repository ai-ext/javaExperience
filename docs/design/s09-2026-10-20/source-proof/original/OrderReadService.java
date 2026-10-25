package example;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderReadService {
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findOrdersWithLines() {
        return entityManager.createQuery(
                "select distinct o from PurchaseOrder o " +
                "left join fetch o.lines order by o.id",
                PurchaseOrder.class)
            .getResultList();
    }
}
