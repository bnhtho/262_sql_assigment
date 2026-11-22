// ============================================================================
// [FR10 - 1] LOẠI TRUY VẤN AGGREGATE: Báo cáo doanh thu theo từng ngày
// Tương đương file: MSSQL/FR10_RevenueReport/AggregateBaoCaoDoanhThuTungNgay.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.salesInvoices.aggregate([
  { $match: { status: "CONFIRMED" } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      total_invoices: { $sum: 1 },
      total_items_sold: {
        $sum: { $sum: "$items.quantity" }
      },
      gross_amount: { $sum: "$subtotalAmount" },
      total_invoice_discount: { $sum: "$discount" },
      net_revenue: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      report_date: "$_id",
      total_invoices: 1,
      total_items_sold: 1,
      gross_amount: 1,
      total_invoice_discount: 1,
      net_revenue: 1
    }
  },
  { $sort: { report_date: 1 } }
]);
