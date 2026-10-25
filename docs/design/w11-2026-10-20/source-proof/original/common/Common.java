import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

record PlaceOrder(long productId, int quantity) {}

@Repository
class OrderRepository {
    private final JdbcTemplate jdbc;

    OrderRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void insert(PlaceOrder command) {
        jdbc.update("insert into orders(product_id, quantity) values (?, ?)",
                command.productId(), command.quantity());
    }
}

@Repository
class InventoryRepository {
    private final JdbcTemplate jdbc;

    InventoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void decrease(PlaceOrder command) {
        int changed = jdbc.update(
                "update inventory set quantity = quantity - ? " +
                        "where product_id = ? and quantity >= ?",
                command.quantity(), command.productId(), command.quantity());
        if (changed != 1) {
            throw new IllegalStateException("재고가 부족하거나 상품이 없습니다");
        }
    }
}
