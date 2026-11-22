// ============================================================================
// [FR10 - 2] LOẠI TRUY VẤN AGGREGATE: Báo cáo doanh thu tổng hợp theo tháng
// Tương đương file: MSSQL/FR10_RevenueReport/AggregateBaoCaoDoanhThuTungThang.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.salesInvoices.aggregate([
  { $match: { status: "CONFIRMED" } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
      total_invoices: { $sum: 1 },
      total_items_sold: {
        $sum: { $sum: "$items.quantity" }
      },
      net_revenue: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      report_month: "$_id",
      total_invoices: 1,
      total_items_sold: 1,
      net_revenue: 1
    }
  },
  { $sort: { report_month: -1 } }
]);
