SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    u.unit_name,
    i.quantity_on_hand,
    p.reorder_level,
    (i.quantity_on_hand * p.sale_price) AS stock_value,
    CASE 
        WHEN i.quantity_on_hand = 0 THEN N'Hết hàng (Out of Stock)'
        WHEN i.quantity_on_hand <= p.reorder_level THEN N'Sắp hết (Low Stock)'
        WHEN i.quantity_on_hand <= p.reorder_level * 3 THEN N'Cần theo dõi (Watch)'
        ELSE N'An toàn (Safe)'
    END AS stock_status,
    i.last_updated
FROM dbo.inventory i
INNER JOIN dbo.product p ON i.product_id = p.product_id
INNER JOIN dbo.category c ON p.category_id = c.category_id
INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
ORDER BY i.quantity_on_hand ASC;
GO