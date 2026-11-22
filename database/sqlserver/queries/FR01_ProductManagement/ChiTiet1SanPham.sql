SELECT 
    p.product_id,
    p.sku,
    p.barcode,
    p.product_name,
    p.specification,
    c.category_name,
    b.brand_name,
    b.origin AS brand_origin,
    u.unit_name,
    imp_latest.latest_import_price,                           
    imp_avg.avg_import_price,                                 
    p.sale_price,                                             
    (p.sale_price - imp_latest.latest_import_price) AS profit_per_unit, 
    imp_latest.last_supplier_name,                            
    imp_latest.latest_import_date,                           
    i.quantity_on_hand,
    p.reorder_level,
    p.status,
    p.description
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
OUTER APPLY (
    SELECT TOP 1 
        pd.unit_price AS latest_import_price,
        pr.purchase_date AS latest_import_date,
        s.supplier_name AS last_supplier_name
    FROM dbo.purchase_detail pd
    INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
    INNER JOIN dbo.supplier s ON pr.supplier_id = s.supplier_id
    WHERE pd.product_id = p.product_id
      AND pr.status = 'CONFIRMED'
    ORDER BY pr.purchase_date DESC, pr.purchase_id DESC
) imp_latest
OUTER APPLY (
    -- Tính giá nhập bình quân gia quyền qua tất cả các lần nhập (Tổng tiền nhập / Tổng số lượng nhập)
    SELECT 
        CAST(SUM(pd.line_total) * 1.0 / NULLIF(SUM(pd.quantity), 0) AS DECIMAL(18,2)) AS avg_import_price
    FROM dbo.purchase_detail pd
    INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
    WHERE pd.product_id = p.product_id
      AND pr.status = 'CONFIRMED'
) imp_avg
WHERE p.product_id = 1;
GO