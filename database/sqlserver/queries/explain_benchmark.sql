-- ============================================================================
-- KỊCH BẢN ĐO KẾ HOẠCH THỰC THI & HIỆU NĂNG (QUERY PROCESSING - MSSQL)
-- Hướng dẫn chạy trong SSMS:
--   1. Bật Actual Execution Plan (phím tắt Ctrl + M).
--   2. Chạy toàn bộ script bên dưới.
--   3. Xem tab "Messages" (logical reads, CPU time, elapsed time) và tab "Execution plan".
-- ============================================================================
USE StationeryStoreDB;
GO

SET STATISTICS IO ON;
SET STATISTICS TIME ON;
GO

PRINT '=== 1. ĐIỀU KIỆN ĐƠN (FR07 - Tìm SP theo SKU - Index Seek + Key Lookup) ===';
SELECT product_id, sku, barcode, product_name, specification, sale_price, status
FROM dbo.product
WHERE sku = 'SKU-TL-001';
GO

PRINT '=== 2. ĐIỀU KIỆN KẾT HỢP (FR07 - Danh mục + Khoảng giá + Còn hàng) ===';
SELECT p.product_id, p.sku, p.product_name, c.category_name, b.brand_name, p.sale_price, i.quantity_on_hand
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
INNER JOIN dbo.inventory i ON p.product_id = i.product_id
WHERE p.category_id = 2
  AND p.sale_price BETWEEN 20000 AND 95000
  AND i.quantity_on_hand > 0
  AND p.status = 'ACTIVE'
ORDER BY p.sale_price ASC;
GO

PRINT '=== 3. JOIN ĐA BẢNG (FR06 - Lịch sử chi tiết hóa đơn bán: 5 bảng) ===';
SELECT si.invoice_id, si.created_at, si.status, si.payment_method,
       ISNULL(c.full_name, N'Khách vãng lai') AS customer_name,
       e.full_name AS cashier_name, p.sku, p.product_name,
       sd.quantity, sd.unit_price, sd.line_discount, sd.line_total
FROM dbo.sales_invoice si
LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
LEFT JOIN dbo.employee e ON e.employee_id = si.cashier_id
LEFT JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
LEFT JOIN dbo.product p ON sd.product_id = p.product_id
ORDER BY si.created_at DESC, si.invoice_id DESC;
GO

PRINT '=== 4. SUBQUERY (FR01 - Sản phẩm có giá bán cao hơn trung bình) ===';
SELECT p.product_id, p.sku, p.product_name, c.category_name, p.sale_price,
       (SELECT CAST(AVG(sale_price) AS DECIMAL(18,2)) FROM dbo.product) AS store_avg_price
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
WHERE p.sale_price > (SELECT AVG(sale_price) FROM dbo.product)
ORDER BY p.sale_price DESC;
GO

PRINT '=== 5. AGGREGATE (FR10 - Báo cáo doanh thu theo tháng dùng CTE) ===';
WITH InvoiceAgg AS (
    SELECT si.invoice_id, FORMAT(si.created_at, 'yyyy-MM') AS report_month,
           si.discount, SUM(sd.quantity) AS items_sold, SUM(sd.line_total) AS gross_amount
    FROM dbo.sales_invoice si
    INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
    WHERE si.status = 'CONFIRMED'
    GROUP BY si.invoice_id, FORMAT(si.created_at, 'yyyy-MM'), si.discount
)
SELECT report_month, COUNT(invoice_id) AS total_invoices,
       SUM(items_sold) AS total_items_sold,
       SUM(gross_amount) AS gross_amount,
       SUM(discount) AS total_invoice_discount,
       SUM(gross_amount) - SUM(discount) AS net_revenue
FROM InvoiceAgg
GROUP BY report_month
ORDER BY report_month DESC;
GO

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO
