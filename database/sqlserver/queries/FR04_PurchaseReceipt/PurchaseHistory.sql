SELECT
    pr.purchase_id,
    pr.purchase_date,
    pr.status,
    pr.note,
    s.supplier_name,
    e.full_name AS [created_by],
    p.sku,
    p.product_name,
    pd.quantity,
    pd.unit_price,
    pd.line_total
FROM dbo.purchase_receipt pr
LEFT JOIN dbo.purchase_detail pd ON pr.purchase_id = pd.purchase_id
LEFT JOIN dbo.product p ON p.product_id = pd.product_id
LEFT JOIN dbo.supplier s ON s.supplier_id = pr.supplier_id
LEFT JOIN dbo.employee e ON e.employee_id = pr.created_by
ORDER BY pr.purchase_date DESC, pr.purchase_id DESC;
GO