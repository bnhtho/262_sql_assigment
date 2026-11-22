SELECT 
    si.invoice_id,
    si.created_at,
    si.status,
    si.payment_method,
    si.discount,
    ISNULL(c.full_name, N'Khách vãng lai') AS [customer_name],
    e.full_name AS [cashier_name],
    p.sku,
    p.product_name,
    sd.quantity,
    sd.unit_price,
    sd.line_discount,
    sd.line_total
FROM dbo.sales_invoice si
LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
LEFT JOIN dbo.employee e ON e.employee_id = si.cashier_id
LEFT JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
LEFT JOIN dbo.product p ON sd.product_id = p.product_id
ORDER BY si.created_at DESC, si.invoice_id DESC;
GO