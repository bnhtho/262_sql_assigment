SELECT 
    p.product_id,
    p.sku,
    p.barcode,
    p.product_name,
    c.category_name,
    b.brand_name,
    u.unit_name,
    imp.latest_import_price,                              
    p.sale_price,                                            
    (p.sale_price - imp.latest_import_price) AS profit_per_unit, 
    i.quantity_on_hand,
    p.status
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
OUTER APPLY (
    SELECT TOP 1 
        pd.unit_price AS latest_import_price,
        pr.purchase_date AS latest_import_date
    FROM dbo.purchase_detail pd
    INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
    WHERE pd.product_id = p.product_id
      AND pr.status = 'CONFIRMED'
    ORDER BY pr.purchase_date DESC, pr.purchase_id DESC
) imp
ORDER BY p.product_id ASC
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
GO