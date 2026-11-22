SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    b.brand_name,
    p.sale_price,
    i.quantity_on_hand
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
INNER JOIN dbo.inventory i ON p.product_id = i.product_id
WHERE p.category_id = 2
  AND p.sale_price BETWEEN 20000 AND 95000
  AND i.quantity_on_hand > 0
  AND p.status = 'ACTIVE'
ORDER BY p.sale_price ASC;
GO