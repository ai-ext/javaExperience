import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
class OrderController {
    private final OrderRepository orders;
    private final InventoryRepository inventory;

    OrderController(OrderRepository orders, InventoryRepository inventory) {
        this.orders = orders;
        this.inventory = inventory;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public void place(@RequestBody PlaceOrder command) {
        orders.insert(command);
        inventory.decrease(command);
    }
}
