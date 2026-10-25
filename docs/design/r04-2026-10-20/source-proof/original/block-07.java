package example;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class OrderReadRepository {
    private static final String SQL = """
            SELECT o.id AS order_id, o.order_no, o.total_amount
            FROM member m JOIN orders o ON o.member_id = m.id
            WHERE m.id = ?
            ORDER BY o.ordered_at DESC, o.id DESC
            """;
    private static final RowMapper<OrderSummary> MAPPER = (rs, n) ->
            new OrderSummary(rs.getLong("order_id"), rs.getString("order_no"),
                    rs.getBigDecimal("total_amount"));
    private final JdbcTemplate jdbc;

    public OrderReadRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<OrderSummary> findByMemberId(long memberId) {
        return jdbc.query(connection -> {
            PreparedStatement ps = connection.prepareStatement(SQL);
            ps.setLong(1, memberId);
            return ps;
        }, MAPPER);
    }

    public record OrderSummary(long id, String orderNo, BigDecimal totalAmount) {}
}
