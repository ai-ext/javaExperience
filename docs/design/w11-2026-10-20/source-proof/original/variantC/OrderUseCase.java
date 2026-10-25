import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

record OrderPlaced(long productId, int quantity) {}

@Service
class OrderUseCase {
    private final OrderRepository orders;
    private final InventoryRepository inventory;
    private final ApplicationEventPublisher events;

    OrderUseCase(OrderRepository orders,
                 InventoryRepository inventory,
                 ApplicationEventPublisher events) {
        this.orders = orders;
        this.inventory = inventory;
        this.events = events;
    }

    @Transactional
    public void place(PlaceOrder command) {
        orders.insert(command);
        inventory.decrease(command);
        events.publishEvent(new OrderPlaced(command.productId(), command.quantity()));
    }
}

@Component
class OrderNotificationListener {
    @TransactionalEventListener
    public void afterCommit(OrderPlaced event) {
        // 기본 단계 AFTER_COMMIT에서 알림 등 후속 작업 실행
    }
}
