SELECT member_id, COUNT(*) order_count, SUM(total_amount) order_total
FROM orders
WHERE order_status IN ('PAID', 'SHIPPED', 'DELIVERED')
GROUP BY member_id
HAVING SUM(total_amount) >= 100000
ORDER BY order_total DESC, member_id
LIMIT 20;
