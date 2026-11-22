"""
FastAPI Router cho toàn bộ truy vấn đọc & báo cáo (FR01 -> FR10).
Phủ đầy đủ 5 loại truy vấn đọc:
  1. Điều kiện đơn (FR07)
  2. Điều kiện kết hợp (FR06, FR07)
  3. JOIN đa bảng (FR01, FR04, FR05, FR06, FR08)
  4. Subquery (FR01, FR06)
  5. Aggregate (FR04, FR08, FR10)
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.backend.db import fetch_all, fetch_one

router = APIRouter(prefix="/api/v1", tags=["Read Queries & Reports"])


# ============================================================================
# FR01: PRODUCT MANAGEMENT (Danh sách phân trang, Chi tiết, Subquery giá > AVG)
# ============================================================================
@router.get("/products", summary="[FR01] Danh sách sản phẩm phân trang kèm giá nhập & tồn kho")
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    offset = (page - 1) * page_size
    sql = """
    SELECT
        p.product_id, p.sku, p.barcode, p.product_name,
        c.category_name, b.brand_name, u.unit_name,
        imp.latest_import_price, p.sale_price,
        (p.sale_price - imp.latest_import_price) AS profit_per_unit,
        i.quantity_on_hand, p.status
    FROM dbo.product p
    INNER JOIN dbo.category c ON p.category_id = c.category_id
    LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
    INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
    LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
    OUTER APPLY (
        SELECT TOP 1 pd.unit_price AS latest_import_price
        FROM dbo.purchase_detail pd
        INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
        WHERE pd.product_id = p.product_id AND pr.status = 'CONFIRMED'
        ORDER BY pr.purchase_date DESC, pr.purchase_id DESC
    ) imp
    ORDER BY p.product_id ASC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """
    items = fetch_all(sql, (offset, page_size))
    total = fetch_one("SELECT COUNT(*) AS total FROM dbo.product;")["total"]
    return {"page": page, "page_size": page_size, "total": total, "items": items}


@router.get("/products/above-average-price", summary="[FR01 - Subquery] Sản phẩm có giá bán cao hơn trung bình")
def products_above_avg_price() -> list[dict[str, Any]]:
    sql = """
    SELECT
        p.product_id, p.sku, p.product_name, c.category_name, p.sale_price,
        (SELECT CAST(AVG(sale_price) AS DECIMAL(18,2)) FROM dbo.product) AS store_avg_price
    FROM dbo.product p
    INNER JOIN dbo.category c ON p.category_id = c.category_id
    WHERE p.sale_price > (SELECT AVG(sale_price) FROM dbo.product)
    ORDER BY p.sale_price DESC;
    """
    return fetch_all(sql)


@router.get("/products/{product_id}", summary="[FR01] Chi tiết 1 sản phẩm kèm giá nhập gần nhất & bình quân")
def get_product_detail(product_id: int) -> dict[str, Any]:
    sql = """
    SELECT
        p.product_id, p.sku, p.barcode, p.product_name, p.specification,
        c.category_name, b.brand_name, b.origin AS brand_origin, u.unit_name,
        imp_latest.latest_import_price, imp_avg.avg_import_price,
        p.sale_price, (p.sale_price - imp_latest.latest_import_price) AS profit_per_unit,
        imp_latest.last_supplier_name, imp_latest.latest_import_date,
        i.quantity_on_hand, p.reorder_level, p.status, p.description
    FROM dbo.product p
    INNER JOIN dbo.category c ON p.category_id = c.category_id
    LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
    INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
    LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
    OUTER APPLY (
        SELECT TOP 1 pd.unit_price AS latest_import_price,
               pr.purchase_date AS latest_import_date,
               s.supplier_name AS last_supplier_name
        FROM dbo.purchase_detail pd
        INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
        INNER JOIN dbo.supplier s ON pr.supplier_id = s.supplier_id
        WHERE pd.product_id = p.product_id AND pr.status = 'CONFIRMED'
        ORDER BY pr.purchase_date DESC, pr.purchase_id DESC
    ) imp_latest
    OUTER APPLY (
        SELECT CAST(SUM(pd.line_total) * 1.0 / NULLIF(SUM(pd.quantity), 0) AS DECIMAL(18,2)) AS avg_import_price
        FROM dbo.purchase_detail pd
        INNER JOIN dbo.purchase_receipt pr ON pd.purchase_id = pr.purchase_id
        WHERE pd.product_id = p.product_id AND pr.status = 'CONFIRMED'
    ) imp_avg
    WHERE p.product_id = ?;
    """
    item = fetch_one(sql, (product_id,))
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    return item


# ============================================================================
# FR02 & FR03: CATEGORY & SUPPLIER LISTS
# ============================================================================
@router.get("/categories", summary="[FR02] Danh sách danh mục sản phẩm")
def list_categories() -> list[dict[str, Any]]:
    return fetch_all(
        "SELECT category_id, category_name, description, status FROM dbo.category ORDER BY category_id ASC;"
    )


@router.get("/suppliers", summary="[FR03] Danh sách nhà cung cấp")
def list_suppliers() -> list[dict[str, Any]]:
    return fetch_all(
        """
        SELECT supplier_id, supplier_name, tax_code, contact_person, phone, email, address
        FROM dbo.supplier
        ORDER BY supplier_id ASC;
        """
    )


# ============================================================================
# FR04: PURCHASE RECEIPT (Lịch sử nhập JOIN & Tổng nhập theo NCC Aggregate)
# ============================================================================
@router.get("/purchases/history", summary="[FR04 - JOIN] Lịch sử phiếu nhập chi tiết")
def purchase_history() -> list[dict[str, Any]]:
    sql = """
    SELECT
        pr.purchase_id, pr.purchase_date, pr.status, pr.note,
        s.supplier_name, e.full_name AS created_by,
        p.sku, p.product_name, pd.quantity, pd.unit_price, pd.line_total
    FROM dbo.purchase_receipt pr
    LEFT JOIN dbo.purchase_detail pd ON pr.purchase_id = pd.purchase_id
    LEFT JOIN dbo.product p ON p.product_id = pd.product_id
    LEFT JOIN dbo.supplier s ON s.supplier_id = pr.supplier_id
    LEFT JOIN dbo.employee e ON e.employee_id = pr.created_by
    ORDER BY pr.purchase_date DESC, pr.purchase_id DESC;
    """
    return fetch_all(sql)


@router.get("/purchases/summary-by-supplier", summary="[FR04 - Aggregate] Tổng nhập theo nhà cung cấp")
def purchase_summary_by_supplier() -> list[dict[str, Any]]:
    sql = """
    SELECT
        s.supplier_id, s.supplier_name,
        COUNT(DISTINCT pr.purchase_id) AS total_receipts,
        ISNULL(SUM(pd.quantity), 0) AS total_items_imported,
        ISNULL(SUM(pd.line_total), 0) AS total_import_amount
    FROM dbo.supplier s
    LEFT JOIN dbo.purchase_receipt pr ON s.supplier_id = pr.supplier_id AND pr.status = 'CONFIRMED'
    LEFT JOIN dbo.purchase_detail pd ON pr.purchase_id = pd.purchase_id
    GROUP BY s.supplier_id, s.supplier_name
    ORDER BY total_import_amount DESC;
    """
    return fetch_all(sql)


# ============================================================================
# FR05: SALES INVOICE (Tra cứu nhanh sản phẩm khi bán tại quầy POS)
# ============================================================================
@router.get("/pos/products/lookup", summary="[FR05] Tra cứu nhanh sản phẩm còn hàng khi bán")
def pos_lookup_product(q: str = Query(..., min_length=1, description="SKU, barcode hoặc từ khóa tên sản phẩm")) -> list[dict[str, Any]]:
    sql = """
    SELECT p.product_id, p.sku, p.barcode, p.product_name, u.unit_name, p.sale_price, i.quantity_on_hand
    FROM dbo.product p
    INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
    INNER JOIN dbo.inventory i ON p.product_id = i.product_id
    WHERE p.status = 'ACTIVE'
      AND i.quantity_on_hand > 0
      AND (p.barcode = ? OR p.sku = ? OR p.product_name LIKE ?);
    """
    return fetch_all(sql, (q, q, f"%{q}%"))


# ============================================================================
# FR06: SALES HISTORY (Điều kiện kết hợp, JOIN chi tiết, Subquery > AVG)
# ============================================================================
@router.get("/sales/invoices", summary="[FR06 - Kết hợp] Tra cứu hóa đơn theo ngày, trạng thái và PTTT")
def search_sales_invoices(
    date_from: date = Query(date(2026, 10, 1)),
    date_to: date = Query(date(2026, 11, 1), description="Mốc kết thúc (exclusive, ví dụ 2026-11-01)"),
    status: str = Query("CONFIRMED"),
    payment_method: str | None = Query(None, description="CASH | BANK_TRANSFER | CARD"),
) -> list[dict[str, Any]]:
    sql = """
    SELECT
        invoice_id, created_at, status, payment_method,
        ISNULL(customer_name, N'Khách vãng lai') AS customer_name,
        cashier_name, subtotal_amount, discount, total_amount
    FROM dbo.vw_sales_invoice_summary
    WHERE created_at >= ? AND created_at < ?
      AND status = ?
      AND (? IS NULL OR payment_method = ?)
    ORDER BY created_at DESC;
    """
    return fetch_all(sql, (str(date_from), str(date_to), status, payment_method, payment_method))


@router.get("/sales/history-details", summary="[FR06 - JOIN] Lịch sử chi tiết hóa đơn bán")
def sales_history_details() -> list[dict[str, Any]]:
    sql = """
    SELECT
        si.invoice_id, si.created_at, si.status, si.payment_method, si.discount,
        ISNULL(c.full_name, N'Khách vãng lai') AS customer_name,
        e.full_name AS cashier_name, p.sku, p.product_name,
        sd.quantity, sd.unit_price, sd.line_discount, sd.line_total
    FROM dbo.sales_invoice si
    LEFT JOIN dbo.customer c ON c.customer_id = si.customer_id
    LEFT JOIN dbo.employee e ON e.employee_id = si.cashier_id
    LEFT JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
    LEFT JOIN dbo.product p ON sd.product_id = p.product_id
    ORDER BY si.created_at DESC, si.invoice_id DESC;
    """
    return fetch_all(sql)


@router.get("/sales/above-average", summary="[FR06 - Subquery] Hóa đơn có tổng thanh toán cao hơn trung bình")
def sales_above_average() -> list[dict[str, Any]]:
    sql = """
    SELECT
        invoice_id, created_at,
        ISNULL(customer_name, N'Khách vãng lai') AS customer_name,
        cashier_name, payment_method, total_amount,
        (SELECT CAST(AVG(total_amount) AS DECIMAL(18,2))
         FROM dbo.vw_sales_invoice_summary WHERE status = 'CONFIRMED') AS avg_invoice_amount
    FROM dbo.vw_sales_invoice_summary
    WHERE status = 'CONFIRMED'
      AND total_amount > (SELECT AVG(total_amount) FROM dbo.vw_sales_invoice_summary WHERE status = 'CONFIRMED')
    ORDER BY total_amount DESC;
    """
    return fetch_all(sql)


# ============================================================================
# FR07: PRODUCT SEARCH & FILTER (Điều kiện đơn & Điều kiện kết hợp)
# ============================================================================
@router.get("/products/by-sku/{sku}", summary="[FR07 - Điều kiện đơn] Tìm sản phẩm theo mã SKU")
def find_product_by_sku(sku: str) -> dict[str, Any]:
    sql = """
    SELECT product_id, sku, barcode, product_name, specification, sale_price, status
    FROM dbo.product
    WHERE sku = ?;
    """
    item = fetch_one(sql, (sku,))
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy SKU.")
    return item


@router.get("/products/filter/advanced", summary="[FR07 - Điều kiện kết hợp] Lọc theo danh mục, khoảng giá và còn hàng")
def filter_products(
    category_id: int = Query(2, ge=1),
    min_price: float = Query(20000, ge=0),
    max_price: float = Query(95000, ge=0),
    in_stock_only: bool = Query(True),
) -> list[dict[str, Any]]:
    sql = """
    SELECT
        p.product_id, p.sku, p.product_name, c.category_name, b.brand_name,
        p.sale_price, i.quantity_on_hand
    FROM dbo.product p
    INNER JOIN dbo.category c ON p.category_id = c.category_id
    LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
    INNER JOIN dbo.inventory i ON p.product_id = i.product_id
    WHERE p.category_id = ?
      AND p.sale_price BETWEEN ? AND ?
      AND (? = 0 OR i.quantity_on_hand > 0)
      AND p.status = 'ACTIVE'
    ORDER BY p.sale_price ASC;
    """
    return fetch_all(sql, (category_id, min_price, max_price, 1 if in_stock_only else 0))


# ============================================================================
# FR08: INVENTORY MONITORING (Danh sách cảnh báo & Aggregate theo danh mục)
# ============================================================================
@router.get("/inventory/status", summary="[FR08] Danh sách tồn kho kèm trạng thái cảnh báo")
def inventory_status() -> list[dict[str, Any]]:
    sql = """
    SELECT
        p.product_id, p.sku, p.product_name, c.category_name, u.unit_name,
        i.quantity_on_hand, p.reorder_level,
        (i.quantity_on_hand * p.sale_price) AS stock_value,
        CASE
            WHEN i.quantity_on_hand = 0 THEN N'Hết hàng (Out of Stock)'
            WHEN i.quantity_on_hand <= p.reorder_level THEN N'Sắp hết (Low Stock)'
            WHEN i.quantity_on_hand <= p.reorder_level * 3 THEN N'Cần theo dõi (Watch)'
            ELSE N'An toàn (Safe)'
        END AS stock_status,
        i.last_updated
    FROM dbo.inventory i
    INNER JOIN dbo.product p ON i.product_id = p.product_id
    INNER JOIN dbo.category c ON p.category_id = c.category_id
    INNER JOIN dbo.unit u ON p.unit_id = u.unit_id
    ORDER BY i.quantity_on_hand ASC;
    """
    return fetch_all(sql)


@router.get("/inventory/summary-by-category", summary="[FR08 - Aggregate] Tổng mặt hàng, tồn kho và giá trị tồn theo danh mục")
def inventory_summary_by_category() -> list[dict[str, Any]]:
    sql = """
    SELECT
        c.category_id, c.category_name,
        COUNT(p.product_id) AS total_products,
        ISNULL(SUM(i.quantity_on_hand), 0) AS total_stock_units,
        ISNULL(SUM(i.quantity_on_hand * p.sale_price), 0) AS total_stock_value,
        SUM(CASE WHEN i.quantity_on_hand <= p.reorder_level THEN 1 ELSE 0 END) AS low_or_out_of_stock_count
    FROM dbo.category c
    LEFT JOIN dbo.product p ON c.category_id = p.category_id
    LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
    GROUP BY c.category_id, c.category_name
    ORDER BY total_stock_value DESC;
    """
    return fetch_all(sql)


# ============================================================================
# FR09: CUSTOMER MANAGEMENT (Danh sách thành viên phân trang)
# ============================================================================
@router.get("/customers", summary="[FR09] Danh sách khách hàng thành viên phân trang")
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    offset = (page - 1) * page_size
    sql = """
    SELECT customer_id, member_code, ho, ten, full_name, phone, email, address
    FROM dbo.customer
    ORDER BY customer_id ASC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """
    items = fetch_all(sql, (offset, page_size))
    total = fetch_one("SELECT COUNT(*) AS total FROM dbo.customer;")["total"]
    return {"page": page, "page_size": page_size, "total": total, "items": items}


# ============================================================================
# FR10: REVENUE REPORT (Aggregate doanh thu theo ngày & theo tháng)
# ============================================================================
@router.get("/reports/revenue/daily", summary="[FR10 - Aggregate] Báo cáo doanh thu theo từng ngày")
def revenue_daily() -> list[dict[str, Any]]:
    sql = """
    WITH InvoiceAgg AS (
        SELECT si.invoice_id, CAST(si.created_at AS DATE) AS report_date,
               si.discount, SUM(sd.quantity) AS items_sold, SUM(sd.line_total) AS gross_amount
        FROM dbo.sales_invoice si
        INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
        WHERE si.status = 'CONFIRMED'
        GROUP BY si.invoice_id, CAST(si.created_at AS DATE), si.discount
    )
    SELECT
        report_date, COUNT(invoice_id) AS total_invoices,
        SUM(items_sold) AS total_items_sold,
        SUM(gross_amount) AS gross_amount,
        SUM(discount) AS total_invoice_discount,
        SUM(gross_amount) - SUM(discount) AS net_revenue
    FROM InvoiceAgg
    GROUP BY report_date
    ORDER BY report_date ASC;
    """
    return fetch_all(sql)


@router.get("/reports/revenue/monthly", summary="[FR10 - Aggregate] Báo cáo doanh thu tổng hợp theo tháng")
def revenue_monthly() -> list[dict[str, Any]]:
    sql = """
    WITH InvoiceAgg AS (
        SELECT si.invoice_id, FORMAT(si.created_at, 'yyyy-MM') AS report_month,
               si.discount, SUM(sd.quantity) AS items_sold, SUM(sd.line_total) AS gross_amount
        FROM dbo.sales_invoice si
        INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
        WHERE si.status = 'CONFIRMED'
        GROUP BY si.invoice_id, FORMAT(si.created_at, 'yyyy-MM'), si.discount
    )
    SELECT
        report_month, COUNT(invoice_id) AS total_invoices,
        SUM(items_sold) AS total_items_sold,
        SUM(gross_amount) AS gross_amount,
        SUM(discount) AS total_invoice_discount,
        SUM(gross_amount) - SUM(discount) AS net_revenue
    FROM InvoiceAgg
    GROUP BY report_month
    ORDER BY report_month DESC;
    """
    return fetch_all(sql)
