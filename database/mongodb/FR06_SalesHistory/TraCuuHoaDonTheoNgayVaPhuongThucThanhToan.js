// ============================================================================
// [FR06 - 1] LOẠI TRUY VẤN ĐIỀU KIỆN KẾT HỢP: Tra cứu hóa đơn theo khoảng ngày VÀ trạng thái VÀ PTTT
// Tương đương file: MSSQL/FR06_SalesHistory/TraCuuHoaDonTheoNgayVaPhuongThucThanhToan.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.salesInvoices.find(
  {
    createdAt: {
      $gte: new Date("2026-10-01T00:00:00Z"),
      $lt:  new Date("2026-11-01T00:00:00Z")
    },
    status: "CONFIRMED",
    paymentMethod: { $in: ["BANK_TRANSFER", "CARD"] }
  },
  {
    _id: 0,
    invoice_id: "$_id",
    created_at: "$createdAt",
    status: 1,
    payment_method: "$paymentMethod",
    customer_name: { $ifNull: ["$customerName", "Khách vãng lai"] },
    cashier_name: "$cashierName",
    subtotal_amount: "$subtotalAmount",
    discount: 1,
    total_amount: "$totalAmount"
  }
).sort({ createdAt: -1 });
