-- [FR10 - 2] LOẠI TRUY VẤN AGGREGATE: Báo cáo doanh thu tổng hợp theo tháng
-- Dùng CTE tổng hợp theo từng invoice_id trước để tránh nhân bản hoặc cộng thiếu si.discount.
WITH InvoiceAgg AS (
    SELECT
        si.invoice_id,
        FORMAT(si.created_at, 'yyyy-MM') AS report_month,
        si.discount,
        SUM(sd.quantity) AS items_sold,
        SUM(sd.line_total) AS gross_amount
    FROM dbo.sales_invoice si
    INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
    WHERE si.status = 'CONFIRMED'
    GROUP BY si.invoice_id, FORMAT(si.created_at, 'yyyy-MM'), si.discount
)
SELECT
    report_month,
    COUNT(invoice_id) AS total_invoices,
    SUM(items_sold) AS total_items_sold,
    SUM(gross_amount) AS gross_amount,
    SUM(discount) AS total_invoice_discount,
    SUM(gross_amount) - SUM(discount) AS net_revenue
FROM InvoiceAgg
GROUP BY report_month
ORDER BY report_month DESC;
GO
