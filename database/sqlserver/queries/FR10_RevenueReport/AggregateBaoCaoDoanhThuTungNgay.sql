-- [FR10 - 1] LOẠI TRUY VẤN AGGREGATE: Báo cáo doanh thu theo từng ngày
-- Dùng CTE tổng hợp theo từng invoice_id trước để tránh nhân bản si.discount khi JOIN với sales_detail
-- (khắc phục lỗi dùng DISTINCT trên cột discount khi 2 hóa đơn cùng ngày có cùng mức giảm giá).
WITH InvoiceAgg AS (
    SELECT
        si.invoice_id,
        CAST(si.created_at AS DATE) AS report_date,
        si.discount,
        SUM(sd.quantity) AS items_sold,
        SUM(sd.line_total) AS gross_amount
    FROM dbo.sales_invoice si
    INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
    WHERE si.status = 'CONFIRMED'
    GROUP BY si.invoice_id, CAST(si.created_at AS DATE), si.discount
)
SELECT
    report_date,
    COUNT(invoice_id) AS total_invoices,
    SUM(items_sold) AS total_items_sold,
    SUM(gross_amount) AS gross_amount,
    SUM(discount) AS total_invoice_discount,
    SUM(gross_amount) - SUM(discount) AS net_revenue
FROM InvoiceAgg
GROUP BY report_date
ORDER BY report_date ASC;
GO
