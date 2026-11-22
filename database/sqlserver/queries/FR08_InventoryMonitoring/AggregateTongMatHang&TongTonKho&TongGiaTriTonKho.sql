SELECT 
    c.category_id,
    c.category_name,
    COUNT(p.product_id) AS total_products,
    ISNULL(SUM(i.quantity_on_hand), 0) AS total_stock_units,
    ISNULL(SUM(i.quantity_on_hand * p.sale_price), 0) AS total_stock_value,
    SUM(CASE WHEN i.quantity_on_hand <= p.reorder_level THEN 1 ELSE 0 END) AS low_or_out_of_stock_count
FROM dbo.category c
LEFT JOIN dbo.product p ON c.category_id = p.category_id
LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
GROUP BY c.category_id, c.category_name
ORDER BY total_stock_value DESC;
GO