// ============================================================================
// [FR06 - 3] LOẠI TRUY VẤN SUBQUERY: Tìm các hóa đơn CONFIRMED có tổng thanh toán cao hơn trung bình
// Tương đương file: MSSQL/FR06_SalesHistory/SubqueryHoaDonCoTongThanhToanCaoHonAVG.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.salesInvoices.aggregate([
  { $match: { status: "CONFIRMED" } },
  {
    $group: {
      _id: null,
      avg_invoice_amount: { $avg: "$totalAmount" },
      invoices: { $push: "$$ROOT" }
    }
  },
  { $unwind: "$invoices" },
  {
    $match: {
      $expr: { $gt: ["$invoices.totalAmount", "$avg_invoice_amount"] }
    }
  },
  { $sort: { "invoices.totalAmount": -1 } },
  {
    $project: {
      _id: 0,
      invoice_id: "$invoices._id",
      created_at: "$invoices.createdAt",
      customer_name: { $ifNull: ["$invoices.customerName", "Khách vãng lai"] },
      cashier_name: "$invoices.cashierName",
      payment_method: "$invoices.paymentMethod",
      total_amount: "$invoices.totalAmount",
      avg_invoice_amount: { $round: ["$avg_invoice_amount", 2] }
    }
  }
]);
