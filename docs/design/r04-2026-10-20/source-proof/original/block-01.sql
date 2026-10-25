   SELECT id, order_no, total_amount
   FROM orders
   WHERE member_id = 1 AND order_status = 'PAID'
   ORDER BY ordered_at DESC, id DESC
   LIMIT 20 OFFSET 0;
