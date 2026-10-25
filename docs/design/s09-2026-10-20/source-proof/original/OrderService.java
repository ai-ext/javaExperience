package example;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final EntityManager entityManager;

    public OrderService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    public void addLine(long orderId, int quantity) {
        PurchaseOrder order = entityManager.find(PurchaseOrder.class, orderId);
        if (order == null) throw new IllegalArgumentException("주문 없음: " + orderId);

        order.addLine(new OrderLine(quantity));
        // 별도 update/save 없이 관리 엔티티의 변경을 flush 때 감지한다.
        entityManager.flush(); // SQL 동기화 지점. 메서드 종료 커밋과는 다르다.
    }
}
