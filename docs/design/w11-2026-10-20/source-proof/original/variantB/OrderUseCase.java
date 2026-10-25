import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
class OrderUseCase {
    private final OrderRepository orders;
    private final InventoryRepository inventory;

    OrderUseCase(OrderRepository orders, InventoryRepository inventory) {
        this.orders = orders;
        this.inventory = inventory;
    }

    public void place(PlaceOrder command) {
        orders.insert(command);       // 첫 Repository 트랜잭션이 끝날 수 있음
        inventory.decrease(command); // 재고 실패는 앞선 주문 커밋을 되돌리지 못함
    }
}

// 위 OrderRepository와 InventoryRepository만 각각 트랜잭션을 갖는다.
