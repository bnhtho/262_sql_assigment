SELECT 
    p.product_id,
    p.sku,
    p.barcode,
    p.product_name,
    u.unit_name,
    p.sale_price,
    i.quantity_on_hand
FROM dbo.product p
INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
INNER JOIN dbo.inventory i ON p.product_id = i.product_id
WHERE p.status = 'ACTIVE'
  AND i.quantity_on_hand > 0
  AND (p.barcode = '8935001800011' OR p.sku = 'SKU-TL-001' OR p.product_name LIKE N'%Thiên Long%');
GO