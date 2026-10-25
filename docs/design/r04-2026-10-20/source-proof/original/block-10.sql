SELECT o.id, o.total_amount, COUNT(oi.id) item_rows,
       SUM(o.total_amount) wrong_total
FROM orders o JOIN order_item oi ON oi.order_id = o.id
WHERE o.id = 1
GROUP BY o.id, o.total_amount;
