import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

record OrderCommitted(long orderId) { }

interface NotificationGateway {
    void publishOrderCommitted(long orderId);
}

@Component
class OrderNotificationListener {
    private final NotificationGateway gateway;

    OrderNotificationListener(NotificationGateway gateway) {
        this.gateway = gateway;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(OrderCommitted event) {
        gateway.publishOrderCommitted(event.orderId());
    }

}
