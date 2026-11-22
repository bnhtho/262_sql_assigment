SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    p.sale_price,
    (SELECT CAST(AVG(sale_price) AS DECIMAL(18,2)) FROM dbo.product) AS store_avg_price
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
WHERE p.sale_price > (SELECT AVG(sale_price) FROM dbo.product)
ORDER BY p.sale_price DESC;
GO