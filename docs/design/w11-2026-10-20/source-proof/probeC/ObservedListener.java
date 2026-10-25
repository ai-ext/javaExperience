import org.springframework.transaction.event.TransactionalEventListener;

// 원문의 비어 있는 핸들러를 호출한 다음, 추가 관찰만 기록한다.
class ObservedListener extends OrderNotificationListener {
    @Override
    @TransactionalEventListener
    public void afterCommit(OrderPlaced event) {
        super.afterCommit(event);
        try { W11Proof.observeListener(event.productId(),event.quantity()); }
        catch (java.sql.SQLException e) { throw new IllegalStateException(e); }
    }
}
