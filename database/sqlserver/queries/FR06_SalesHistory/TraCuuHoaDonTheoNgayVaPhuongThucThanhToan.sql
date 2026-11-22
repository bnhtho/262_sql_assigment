-- [FR06 - 1] LOẠI TRUY VẤN ĐIỀU KIỆN KẾT HỢP: Tra cứu hóa đơn theo khoảng ngày VÀ trạng thái VÀ PTTT
SELECT 
    invoice_id,
    created_at,
    status,
    payment_method,
    ISNULL(customer_name, N'Khách vãng lai') AS customer_name,
    cashier_name,
    subtotal_amount,
    discount,
    total_amount
FROM dbo.vw_sales_invoice_summary
WHERE created_at >= '2026-10-01 00:00:00'
  AND created_at <  '2026-11-01 00:00:00'
  AND status = 'CONFIRMED'
  AND payment_method IN (N'BANK_TRANSFER', N'CARD')
ORDER BY created_at DESC;
GO
