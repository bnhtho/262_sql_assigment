// ============================================================================
// [FR06 - 2] LOẠI TRUY VẤN JOIN: Xem lịch sử chi tiết hóa đơn bán
// Tương đương file: MSSQL/FR06_SalesHistory/LichSuChiTietHoaDon.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.salesInvoices.aggregate([
  { $sort: { createdAt: -1, _id: -1 } },
  { $unwind: "$items" },
  {
    $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "productInfo"
    }
  },
  { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      invoice_id: "$_id",
      created_at: "$createdAt",
      status: 1,
      payment_method: "$paymentMethod",
      discount: 1,
      customer_name: { $ifNull: ["$customerName", "Khách vãng lai"] },
      cashier_name: "$cashierName",
      sku: "$items.sku",
      product_name: "$items.productName",
      quantity: "$items.quantity",
      unit_price: "$items.unitPrice",
      line_discount: "$items.lineDiscount",
      line_total: "$items.lineTotal",
      current_product_status: "$productInfo.status"
    }
  }
]);
