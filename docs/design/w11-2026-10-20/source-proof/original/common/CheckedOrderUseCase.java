import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

interface RiskClient {
    boolean isAllowed(PlaceOrder command);
}

@Service
class CheckedOrderUseCase {
    private final RiskClient riskClient;
    private final OrderRepository orders;
    private final InventoryRepository inventory;
    private final TransactionTemplate transactions;

    CheckedOrderUseCase(RiskClient riskClient,
                        OrderRepository orders,
                        InventoryRepository inventory,
                        PlatformTransactionManager transactionManager) {
        this.riskClient = riskClient;
        this.orders = orders;
        this.inventory = inventory;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public void place(PlaceOrder command) {
        if (!riskClient.isAllowed(command)) {
            throw new IllegalArgumentException("주문할 수 없습니다");
        }
        transactions.executeWithoutResult(status -> {
            orders.insert(command);
            inventory.decrease(command);
        });
    }
}
