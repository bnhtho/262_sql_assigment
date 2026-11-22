-- [FR06 - 3] LOẠI TRUY VẤN SUBQUERY: Hóa đơn CONFIRMED có tổng thanh toán cao hơn mức trung bình
SELECT 
    invoice_id,
    created_at,
    ISNULL(customer_name, N'Khách vãng lai') AS customer_name,
    cashier_name,
    payment_method,
    total_amount,
    (SELECT CAST(AVG(total_amount) AS DECIMAL(18,2))
     FROM dbo.vw_sales_invoice_summary
     WHERE status = 'CONFIRMED') AS avg_invoice_amount
FROM dbo.vw_sales_invoice_summary
WHERE status = 'CONFIRMED'
  AND total_amount > (
      SELECT AVG(total_amount)
      FROM dbo.vw_sales_invoice_summary
      WHERE status = 'CONFIRMED'
  )
ORDER BY total_amount DESC;
GO
