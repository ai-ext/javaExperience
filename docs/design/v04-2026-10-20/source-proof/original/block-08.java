@Component
class OrderListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void afterCommit(OrderCreated event) { notifier.send(event.id()); }
}
