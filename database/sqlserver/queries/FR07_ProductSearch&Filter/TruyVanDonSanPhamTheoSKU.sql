SELECT 
    product_id,
    sku,
    barcode,
    product_name,
    specification,
    sale_price,
    status
FROM dbo.product
WHERE sku = 'SKU-TL-001';
GO