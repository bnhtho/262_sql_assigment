SELECT 
    s.supplier_id,
    s.supplier_name,
    COUNT(DISTINCT pr.purchase_id) AS total_receipts,
    ISNULL(SUM(pd.quantity), 0) AS total_items_imported,
    ISNULL(SUM(pd.line_total), 0) AS total_import_amount
FROM dbo.supplier s
LEFT JOIN dbo.purchase_receipt pr ON s.supplier_id = pr.supplier_id AND pr.status = 'CONFIRMED'
LEFT JOIN dbo.purchase_detail pd ON pr.purchase_id = pd.purchase_id
GROUP BY s.supplier_id, s.supplier_name
ORDER BY total_import_amount DESC;
GO